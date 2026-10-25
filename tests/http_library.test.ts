import { writeQaReport } from './helpers/qa-report';
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import { requireTestDatabase } from './helpers/test-database';

const db = new PrismaClient({ datasources: { db: { url: requireTestDatabase() } }, log: [] });
const origin = 'http://127.0.0.1:3117';
async function request(path: string, method = 'GET', body?: unknown, cookie = '') {
  const response = await fetch(origin + path, { method, headers: { Origin: origin, ...(cookie ? { Cookie: cookie } : {}), ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) }, body: body === undefined ? undefined : JSON.stringify(body) });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- loose JSON response in a test helper
  return { status: response.status, data: await response.json().catch(() => ({})) as Record<string, any>, cookie: response.headers.getSetCookie().map(value => value.split(';')[0]).join('; ') };
}

test('the personal library lists, filters, stars, trashes, restores and keeps copies per teacher', { timeout: 120000 }, async t => {
  assert.equal((await request('/api/health')).data.isolatedTest, true, 'Refusing writes without proof of isolated server.');
  const run = randomUUID(), ownerId = 'library_owner_' + run, otherId = 'library_other_' + run, checks: string[] = [];
  t.after(async () => {
    try {
      const ids = [ownerId, otherId];
      await db.exam.deleteMany({ where: { ownerId: { in: ids } } });
      await db.folder.deleteMany({ where: { ownerId: { in: ids } } });
      await db.question.deleteMany({ where: { ownerId: { in: ids } } });
      await db.auditLog.deleteMany({ where: { actorId: { in: ids } } });
      await db.user.deleteMany({ where: { id: { in: ids } } });
      const directory = `qa/rebuild-${new Date().toISOString().slice(0, 10)}`;
      fs.mkdirSync(directory, { recursive: true });
      writeQaReport(`${directory}/http_library.json`, JSON.stringify({ checkedAt: new Date().toISOString(), checks, cleanupComplete: true, status: checks.length === 4 ? 'PASS' : 'INCOMPLETE', environment: 'isolated localhost:3117', realAiCalls: false }, null, 2));
    } finally { await db.$disconnect(); }
  });
  const password = 'fixture-' + randomUUID(), hash = await bcrypt.hash(password, 10), cookies: Record<string, string> = {};
  for (const [name, id] of [['owner', ownerId], ['other', otherId]] as const) {
    await db.user.create({ data: { id, email: id + '@example.invalid', name: 'Library ' + name, passwordHash: hash, mustChangePassword: false, aiDailyLimit: 0 } });
    const login = await request('/api/auth/login', 'POST', { email: id + '@example.invalid', password }); assert.equal(login.status, 200); cookies[name] = login.cookie;
  }
  const document = (title: string, subject = 'toan', grade = 6) => ({ id: 'draft_' + randomUUID(), metadata: { title, subject, grade, durationMinutes: 15, schoolName: '', departmentName: '' },
    questions: [{ id: 'q1', type: 'multiple_choice', difficulty: 'thong_hieu', content: 'LIB Q', choices: [{ key: 'A', text: '1' }, { key: 'B', text: '2' }], correct_answer: 'A', points: 1, step_by_step_solution: 'LIB_PRIVATE_SOLUTION' }],
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  const make = async (title: string, subject?: string, grade?: number) => { const r = await request('/api/exams', 'POST', { document: document(title, subject, grade) }, cookies.owner); assert.equal(r.status, 200, String(r.data.error)); return r.data.document as { id: string; version: number }; };
  const list = async (query = '', who = 'owner') => (await request('/api/exams' + (query ? '?' + query : ''), 'GET', undefined, cookies[who])).data.exams as { id: string; title: string; isStarred: boolean; folderId: string | null }[];
  const ids = async (query = '', who = 'owner') => (await list(query, who)).map(exam => exam.id);
  const toan = await make('Kho Toán lớp 6 alpha'), van = await make('Kho Văn lớp 7 beta', 'ngu_van', 7), anh = await make('Kho Anh lớp 8 gamma', 'tieng_anh', 8);

  await t.test('listing, search, subject and grade filters see only the teacher own exams', async () => {
    assert.deepEqual((await ids()).sort(), [toan.id, van.id, anh.id].sort());
    assert.deepEqual(await ids('search=beta'), [van.id]);
    assert.deepEqual(await ids('search=BETA'), [van.id], 'search ignores case');
    assert.deepEqual(await ids('subject=tieng_anh'), [anh.id]);
    assert.deepEqual(await ids('grade=6'), [toan.id]);
    assert.deepEqual(await ids('', 'other'), [], 'another teacher sees none of them');
    checks.push('list-and-filters');
  });

  await t.test('star and folders: stars filter, folders hold exams, a folder of another teacher is refused', async () => {
    assert.equal((await request(`/api/exams/${toan.id}`, 'PATCH', { baseVersion: toan.version, isStarred: true }, cookies.owner)).status, 200);
    assert.deepEqual(await ids('isStarred=true'), [toan.id]);
    const folder = await request('/api/folders', 'POST', { name: 'Học kỳ 1' }, cookies.owner); assert.equal(folder.status, 201, String(folder.data.error));
    const folderId = (folder.data.folder?.id ?? folder.data.id) as string; assert.ok(folderId);
    const current = (await request(`/api/exams/${van.id}`, 'GET', undefined, cookies.owner)).data.document as { version: number };
    assert.equal((await request(`/api/exams/${van.id}`, 'PATCH', { baseVersion: current.version, folderId }, cookies.owner)).status, 200);
    assert.deepEqual(await ids('folderId=' + folderId), [van.id]);
    assert.deepEqual((await ids('folderId=root')).sort(), [toan.id, anh.id].sort(), 'exams outside any folder');
    const foreign = await request('/api/folders', 'POST', { name: 'Của người khác' }, cookies.other);
    const foreignId = (foreign.data.folder?.id ?? foreign.data.id) as string;
    const refused = await request(`/api/exams/${anh.id}`, 'PATCH', { baseVersion: (await request(`/api/exams/${anh.id}`, 'GET', undefined, cookies.owner)).data.document.version, folderId: foreignId }, cookies.owner);
    assert.ok(refused.status >= 400, 'an exam cannot be filed into another teacher folder');
    assert.equal((await db.exam.findUniqueOrThrow({ where: { id: anh.id } })).folderId, null);
    checks.push('star-and-folders');
  });

  await t.test('trash and restore: trashed exams leave the list, come back intact, and need the current version', async () => {
    const before = (await request(`/api/exams/${anh.id}`, 'GET', undefined, cookies.owner)).data.document as { version: number; questions: unknown[] };
    assert.equal((await request(`/api/exams/${anh.id}`, 'DELETE', undefined, cookies.owner)).status, 428, 'a trash request without the version is refused');
    assert.equal((await request(`/api/exams/${anh.id}?baseVersion=${before.version + 5}`, 'DELETE', undefined, cookies.owner)).status, 409, 'a stale version is refused');
    assert.equal((await request(`/api/exams/${anh.id}?baseVersion=${before.version}`, 'DELETE', undefined, cookies.other)).status >= 400, true, 'another teacher cannot trash it');
    assert.equal((await request(`/api/exams/${anh.id}?baseVersion=${before.version}`, 'DELETE', undefined, cookies.owner)).status, 200);
    assert.ok(!(await ids()).includes(anh.id), 'a trashed exam leaves the main list');
    assert.deepEqual(await ids('isTrash=true'), [anh.id], 'it shows in the trash');
    assert.equal((await request(`/api/exams/${anh.id}`, 'GET', undefined, cookies.owner)).status, 404, 'a trashed exam cannot be opened as a normal one');
    const trashed = await db.exam.findUniqueOrThrow({ where: { id: anh.id } }); assert.ok(trashed.deletedAt);
    const restored = await request(`/api/exams/${anh.id}`, 'PATCH', { baseVersion: trashed.version, restore: true }, cookies.owner);
    assert.equal(restored.status, 200, String(restored.data.error));
    assert.ok((await ids()).includes(anh.id)); assert.deepEqual(await ids('isTrash=true'), []);
    const after = (await request(`/api/exams/${anh.id}`, 'GET', undefined, cookies.owner)).data.document as { questions: { content: string }[] };
    assert.equal(after.questions.length, before.questions.length); assert.equal(after.questions[0].content, 'LIB Q');
    checks.push('trash-and-restore');
  });

  await t.test('a shared copy lands in the recipient personal library, once, and the source library is unchanged', async () => {
    const shared = await request(`/api/exams/${toan.id}/share`, 'POST', { showAnswers: false, allowCopy: true }, cookies.owner); assert.equal(shared.status, 200, String(shared.data.error));
    const token = String(shared.data.publicLink).split('/').pop()!;
    const sourceBefore = (await ids()).sort();
    const copied = await request(`/api/public/share/${token}/copy`, 'POST', undefined, cookies.other); assert.equal(copied.status, 200, String(copied.data.error));
    const mine = await list('', 'other');
    assert.deepEqual(mine.map(exam => exam.id), [copied.data.id as string], 'the copy appears in the recipient library');
    assert.ok(mine[0].title.startsWith('[Bản sao]'));
    assert.equal(((await request('/api/exams/' + copied.data.id, 'GET', undefined, cookies.other)).data.document.questions as { step_by_step_solution?: string }[])[0].step_by_step_solution ?? '', '', 'the copy has no solution the link hides');
    assert.equal((await request(`/api/public/share/${token}/copy`, 'POST', undefined, cookies.other)).data.id, copied.data.id, 'repeating the copy returns the same one');
    assert.equal((await list('', 'other')).length, 1);
    assert.deepEqual((await ids()).sort(), sourceBefore, 'the source library gained nothing');
    checks.push('shared-copy-in-library');
  });
});
