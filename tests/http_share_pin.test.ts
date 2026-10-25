import { writeQaReport } from './helpers/qa-report';
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import { requireTestDatabase } from './helpers/test-database';

const db = new PrismaClient({ datasources: { db: { url: requireTestDatabase() } }, log: [] });
const origin = 'http://127.0.0.1:3117';
async function request(path: string, method = 'GET', body?: unknown, cookie = '') {
  const response = await fetch(origin + path, { method, headers: { Origin: origin, ...(cookie ? { Cookie: cookie } : {}), ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: response.status, data: await response.json(), cookie: response.headers.getSetCookie().map(value => value.split(';')[0]).join('; ') };
}

test('a share link stays on the version it was made from and later edits never reach it', { timeout: 120000 }, async t => {
  assert.equal((await request('/api/health')).data.isolatedTest, true, 'Refusing writes without proof of isolated server.');
  const uid = 'sharepin_' + randomUUID(), checks: string[] = [];
  t.after(async () => {
    try {
      await db.exam.deleteMany({ where: { ownerId: uid } });
      await db.question.deleteMany({ where: { ownerId: uid } });
      await db.auditLog.deleteMany({ where: { actorId: uid } });
      await db.user.deleteMany({ where: { id: uid } });
      const directory = `qa/rebuild-${new Date().toISOString().slice(0, 10)}`;
      fs.mkdirSync(directory, { recursive: true });
      writeQaReport(`${directory}/http_share_pin.json`, JSON.stringify({ checkedAt: new Date().toISOString(), checks, cleanupComplete: true, status: checks.length === 4 ? 'PASS' : 'INCOMPLETE', environment: 'isolated localhost:3117', realAiCalls: false }, null, 2));
    } finally { await db.$disconnect(); }
  });
  const password = 'fixture-' + randomUUID(), email = uid + '@example.invalid';
  await db.user.create({ data: { id: uid, email, name: 'Share pin fixture', passwordHash: await bcrypt.hash(password, 10), mustChangePassword: false, aiDailyLimit: 0 } });
  const login = await request('/api/auth/login', 'POST', { email, password }); assert.equal(login.status, 200); const owner = login.cookie;
  const document = (title: string, extra: unknown[] = []) => ({ id: 'draft_' + uid, metadata: { title, subject: 'toan', grade: 6, durationMinutes: 15, schoolName: '', departmentName: '' },
    questions: [{ id: 'q1', type: 'multiple_choice', difficulty: 'thong_hieu', content: 'OLD_QUESTION_TEXT', choices: [{ key: 'A', text: '1' }, { key: 'B', text: '2' }], correct_answer: 'A', points: 1, step_by_step_solution: 'x' }, ...extra],
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  const created = await request('/api/exams', 'POST', { document: document('Bản đã chia sẻ') }, owner);
  assert.equal(created.status, 200, created.data.error);
  const examId = created.data.document.id as string, firstVersion = created.data.document.version as number;
  const share = async (body: Record<string, unknown> = {}) => { const r = await request(`/api/exams/${examId}/share`, 'POST', { showAnswers: false, allowCopy: false, ...body }, owner); assert.equal(r.status, 200, r.data.error); return { token: String(r.data.publicLink).split('/').pop()!, id: r.data.link.id as string }; };
  const view = (token: string) => request('/api/public/share/' + token);
  const old = await share();
  const legacyToken = randomBytes(32).toString('base64url');
  await db.shareLink.create({ data: { examId, token: legacyToken, showAnswers: false, allowCopy: false } });

  await t.test('the link carries its version and serves exactly that version', async () => {
    assert.match(old.token, /\.v\d+$/);
    const first = await view(old.token);
    assert.equal(first.status, 200); assert.equal(first.data.sourceVersion, firstVersion); assert.equal(first.data.pinned, true);
    assert.equal(first.data.exam.metadata.title, 'Bản đã chia sẻ');
    checks.push('link-serves-its-version');
  });

  await t.test('editing the exam afterwards changes nothing behind the old link, while a new link shows the new version', async () => {
    const current = (await request(`/api/exams/${examId}`, 'GET', undefined, owner)).data.document;
    const edited = await request(`/api/exams/${examId}`, 'PATCH', { baseVersion: current.version, document: { ...document('Bản đã sửa', [{ id: 'q2', type: 'short_answer', difficulty: 'thong_hieu', content: 'NEW_QUESTION_TEXT', correct_answer: '0', accepted_answers: ['0'], points: 1, step_by_step_solution: 'x' }]), id: current.id, version: current.version, serverId: current.id } }, owner);
    assert.equal(edited.status, 200, edited.data.error);
    const stale = JSON.stringify((await view(old.token)).data);
    assert.ok(stale.includes('OLD_QUESTION_TEXT') && stale.includes('Bản đã chia sẻ'), 'the old link still shows what was shared');
    assert.ok(!stale.includes('NEW_QUESTION_TEXT') && !stale.includes('Bản đã sửa'), 'later edits and drafts never reach the old link');
    const fresh = await share();
    const next = await view(fresh.token);
    assert.equal(next.data.sourceVersion, edited.data.document.version);
    assert.ok(JSON.stringify(next.data).includes('NEW_QUESTION_TEXT') && next.data.exam.metadata.title === 'Bản đã sửa');
    checks.push('later-edits-stay-out');
  });

  await t.test('links made before pinning keep following the exam, and a tampered or unknown version never resolves', async () => {
    assert.ok(JSON.stringify((await view(legacyToken)).data).includes('NEW_QUESTION_TEXT'), 'an old link without a version keeps its earlier live behavior');
    assert.equal((await view(old.token.replace(/\.v\d+$/, '.v999'))).status, 404, 'a changed version suffix is a different token');
    assert.equal((await view(old.token.replace(/\.v\d+$/, ''))).status, 404, 'dropping the suffix is a different token');
    const orphan = await share();
    await db.examRevision.deleteMany({ where: { examId, version: Number(orphan.token.split('.v')[1]) } });
    const lost = await view(orphan.token);
    assert.equal(lost.status, 404, 'a link whose version cannot be read fails closed instead of showing the draft');
    assert.ok(!JSON.stringify(lost.data).includes('NEW_QUESTION_TEXT'));
    checks.push('legacy-and-tampered');
  });

  await t.test('revoking still works for a pinned link and the copy is the pinned version', async () => {
    const copyable = await share({ allowCopy: true });
    const other = 'sharepin_other_' + randomUUID();
    await db.user.create({ data: { id: other, email: other + '@example.invalid', name: 'Other', passwordHash: await bcrypt.hash(password, 10), mustChangePassword: false, aiDailyLimit: 0 } });
    try {
      const otherLogin = await request('/api/auth/login', 'POST', { email: other + '@example.invalid', password }); assert.equal(otherLogin.status, 200);
      const copied = await request(`/api/public/share/${copyable.token}/copy`, 'POST', undefined, otherLogin.cookie);
      assert.equal(copied.status, 200, copied.data.error);
      const copy = (await request(`/api/exams/${copied.data.id}`, 'GET', undefined, otherLogin.cookie)).data.document;
      assert.ok(copy.questions.some((q: { content: string }) => q.content === 'NEW_QUESTION_TEXT'), 'the link was made after the edit, so its copy has the new question');
      const oldCopy = await request(`/api/public/share/${old.token}/copy`, 'POST', undefined, otherLogin.cookie);
      assert.equal(oldCopy.status, 403, 'the old link never allowed copying');
      assert.equal((await request(`/api/exams/${examId}/share`, 'DELETE', { linkId: old.id }, owner)).status, 200);
      assert.equal((await view(old.token)).status, 404, 'a revoked pinned link stops serving');
      assert.equal((await request(`/api/exams/${examId}/share`, 'DELETE', { linkId: copyable.id }, owner)).status, 200);
      assert.equal((await view(copyable.token)).status, 404, 'the link that made the copy is revoked too');
      const keptCopy = await request(`/api/exams/${copied.data.id}`, 'GET', undefined, otherLogin.cookie);
      assert.equal(keptCopy.status, 200, 'revoking a link never takes back a copy that was already made');
      const edited = await request(`/api/exams/${copied.data.id}`, 'PATCH', { baseVersion: keptCopy.data.document.version, document: { ...keptCopy.data.document, metadata: { ...keptCopy.data.document.metadata, title: 'Bản sao đã sửa' } } }, otherLogin.cookie);
      assert.equal(edited.status, 200, edited.data.error);
      const source = (await request(`/api/exams/${examId}`, 'GET', undefined, owner)).data.document;
      assert.notEqual(source.metadata.title, 'Bản sao đã sửa', 'editing the copy never changes the original');
    } finally { await db.exam.deleteMany({ where: { ownerId: other } }); await db.question.deleteMany({ where: { ownerId: other } }); await db.auditLog.deleteMany({ where: { actorId: other } }); await db.user.deleteMany({ where: { id: other } }); }
    checks.push('revoke-and-copy');
  });
});
