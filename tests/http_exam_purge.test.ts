import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { requireTestDatabase } from './helpers/test-database';

const db = new PrismaClient({ datasources: { db: { url: requireTestDatabase() } }, log: [] });
const origin = process.env.EXAMCRAFT_TEST_ORIGIN ?? 'http://127.0.0.1:3117';
async function request(path: string, method = 'GET', body?: unknown, cookie = '', headers: Record<string, string> = {}) {
  const response = await fetch(origin + path, { method, headers: { Origin: origin, ...headers, ...(cookie ? { Cookie: cookie } : {}), ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) }, body: body === undefined ? undefined : JSON.stringify(body) });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- loose JSON response in a test helper
  return { status: response.status, data: await response.json().catch(() => ({})) as Record<string, any>, cookie: response.headers.getSetCookie().map(value => value.split(';')[0]).join('; ') };
}

test('permanent delete from the trash: owner only, trash only, blocked while an assignment exists, bank questions stay', { timeout: 120000 }, async t => {
  assert.equal((await request('/api/health')).data.isolatedTest, true, 'Refusing writes without proof of isolated server.');
  const run = randomUUID(), ownerId = 'purge_owner_' + run, otherId = 'purge_other_' + run;
  t.after(async () => {
    try {
      const ids = [ownerId, otherId];
      await db.assignment.deleteMany({ where: { ownerId: { in: ids } } });
      await db.exam.deleteMany({ where: { ownerId: { in: ids } } });
      await db.question.deleteMany({ where: { ownerId: { in: ids } } });
      await db.auditLog.deleteMany({ where: { actorId: { in: ids } } });
      await db.user.deleteMany({ where: { id: { in: ids } } });
    } finally { await db.$disconnect(); }
  });
  const password = 'fixture-' + randomUUID(), hash = await bcrypt.hash(password, 10), cookies: Record<string, string> = {};
  for (const [name, id] of [['owner', ownerId], ['other', otherId]] as const) {
    await db.user.create({ data: { id, email: id + '@example.invalid', name: 'Purge ' + name, passwordHash: hash, mustChangePassword: false, aiDailyLimit: 0 } });
    const login = await request('/api/auth/login', 'POST', { email: id + '@example.invalid', password }); assert.equal(login.status, 200); cookies[name] = login.cookie;
  }
  const document = (title: string) => ({ id: 'draft_' + randomUUID(), metadata: { title, subject: 'toan', grade: 6, durationMinutes: 15, schoolName: '', departmentName: '' },
    questions: [{ id: 'q1', type: 'multiple_choice', difficulty: 'thong_hieu', content: 'PURGE Q', choices: [{ key: 'A', text: '1' }, { key: 'B', text: '2' }], correct_answer: 'A', points: 1, step_by_step_solution: 'x' }],
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  const make = async (title: string) => { const r = await request('/api/exams', 'POST', { document: document(title) }, cookies.owner); assert.equal(r.status, 200, String(r.data.error)); return r.data.document as { id: string; version: number }; };
  const toTrash = async (exam: { id: string; version: number }) => assert.equal((await request(`/api/exams/${exam.id}`, 'DELETE', undefined, cookies.owner, { 'If-Match': String(exam.version) })).status, 200);
  const exists = async (id: string) => (await db.exam.count({ where: { id } })) === 1;

  await t.test('an exam that is not in the trash cannot be deleted for good', async () => {
    const exam = await make('Purge live');
    const refused = await request(`/api/exams/${exam.id}?permanent=1`, 'DELETE', undefined, cookies.owner);
    assert.equal(refused.status, 409); assert.equal(refused.data.code ?? refused.data.error?.code, 'NOT_IN_TRASH');
    assert.equal(await exists(exam.id), true);
  });

  await t.test('another teacher cannot delete it, even from the trash', async () => {
    const exam = await make('Purge foreign'); await toTrash(exam);
    const refused = await request(`/api/exams/${exam.id}?permanent=1`, 'DELETE', undefined, cookies.other);
    assert.equal(refused.status, 404);
    assert.equal(await exists(exam.id), true);
  });

  await t.test('the owner removes a trashed exam for good, the question bank keeps its questions, and the action is logged', async () => {
    const exam = await make('Purge gone'); await toTrash(exam);
    const banked = await db.question.count({ where: { ownerId } });
    const done = await request(`/api/exams/${exam.id}?permanent=1`, 'DELETE', undefined, cookies.owner);
    assert.equal(done.status, 200); assert.equal(done.data.purged, true);
    assert.equal(await exists(exam.id), false);
    assert.equal(await db.question.count({ where: { ownerId } }), banked, 'questions stay in the bank');
    assert.equal(await db.auditLog.count({ where: { actorId: ownerId, action: 'exam.purge', targetId: exam.id } }), 1);
    assert.equal((await request(`/api/exams/${exam.id}?permanent=1`, 'DELETE', undefined, cookies.owner)).status, 404, 'a second delete finds nothing');
  });

  await t.test('an exam that has an assignment stays in the trash and says why', async () => {
    const exam = await make('Purge assigned');
    const assigned = await request('/api/assignments', 'POST', { examId: exam.id, title: 'Bài giao thử', identityMode: 'FREE_NAME' }, cookies.owner);
    assert.equal(assigned.status, 200, String(assigned.data.error));
    const current = (await request(`/api/exams/${exam.id}`, 'GET', undefined, cookies.owner)).data.document as { id: string; version: number };
    await toTrash(current);
    const refused = await request(`/api/exams/${exam.id}?permanent=1`, 'DELETE', undefined, cookies.owner);
    assert.equal(refused.status, 409); assert.equal(refused.data.code ?? refused.data.error?.code, 'EXAM_HAS_ASSIGNMENTS');
    assert.equal(await exists(exam.id), true);
    assert.equal(await db.assignment.count({ where: { examId: exam.id } }), 1, 'the assignment is untouched');
  });
});
