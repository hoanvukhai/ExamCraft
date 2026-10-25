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
  return { status: response.status, data: await response.json(), cookie: response.headers.getSetCookie().map(value => value.split(';')[0]).join('; ') };
}

test('student identity (PIN, class membership, personal link) and concurrent submit on the isolated server', { timeout: 120000 }, async t => {
  assert.equal((await request('/api/health')).data.isolatedTest, true, 'Refusing writes without proof of isolated server.');
  const uid = 'identity_' + randomUUID(), checks: string[] = [];
  t.after(async () => {
    try {
      await db.assignment.deleteMany({ where: { ownerId: uid } });
      await db.group.deleteMany({ where: { ownerId: uid } });
      await db.exam.deleteMany({ where: { ownerId: uid } });
      await db.question.deleteMany({ where: { ownerId: uid } });
      await db.auditLog.deleteMany({ where: { actorId: uid } });
      await db.user.deleteMany({ where: { id: uid } });
      const directory = `qa/rebuild-${new Date().toISOString().slice(0, 10)}`;
      fs.mkdirSync(directory, { recursive: true });
      writeQaReport(`${directory}/http_student_identity.json`, JSON.stringify({ checkedAt: new Date().toISOString(), checks, cleanupComplete: true, status: checks.length === 4 ? 'PASS' : 'INCOMPLETE', environment: 'isolated localhost:3117', realAiCalls: false }, null, 2));
    } finally { await db.$disconnect(); }
  });
  const password = 'fixture-' + randomUUID(), email = uid + '@example.invalid';
  await db.user.create({ data: { id: uid, email, name: 'Identity fixture', passwordHash: await bcrypt.hash(password, 10), mustChangePassword: false, aiDailyLimit: 0 } });
  const login = await request('/api/auth/login', 'POST', { email, password });
  assert.equal(login.status, 200); const owner = login.cookie;
  const created = await request('/api/exams', 'POST', { document: { id: 'draft_' + uid, metadata: { title: 'Identity fixture', subject: 'toan', grade: 6, durationMinutes: 15, schoolName: '', departmentName: '' },
    questions: [
      { id: 'mc', type: 'multiple_choice', difficulty: 'thong_hieu', content: 'MC', choices: [{ key: 'A', text: '1' }, { key: 'B', text: '2' }], correct_answer: 'A', points: 1, step_by_step_solution: 'IDENTITY_PRIVATE_SOLUTION' },
      { id: 'sa', type: 'short_answer', difficulty: 'thong_hieu', content: 'SA', correct_answer: '0', accepted_answers: ['0'], points: 1, step_by_step_solution: 'x' },
    ], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } }, owner);
  assert.equal(created.status, 200, created.data.error);
  const examId = created.data.document.id as string;
  const classOf = async (name: string) => { const r = await request('/api/groups', 'POST', { name: name + ' ' + uid.slice(-6) }, owner); assert.equal(r.status, 200, r.data.error); return r.data.group.id as string; };
  const groupA = await classOf('Lớp A'), groupB = await classOf('Lớp B');
  const pin = '4821', pinHash = await bcrypt.hash(pin, 10);
  const withPin = await db.student.create({ data: { groupId: groupA, displayName: 'Học sinh có PIN', pinHash, personalToken: 'tok_' + randomUUID() } });
  const noPin = await db.student.create({ data: { groupId: groupA, displayName: 'Học sinh chưa có PIN', personalToken: 'tok_' + randomUUID() } });
  const otherClass = await db.student.create({ data: { groupId: groupB, displayName: 'Học sinh lớp khác', pinHash, personalToken: 'tok_' + randomUUID() } });
  const assign = async (body: Record<string, unknown>) => { const r = await request('/api/assignments', 'POST', { examId, title: 'Identity fixture', ...body }, owner); assert.equal(r.status, 200, r.data.error); return r.data.assignment as { id: string; publicId: string }; };
  const start = (publicId: string, body: Record<string, unknown>) => request(`/api/public/assignments/${publicId}/start`, 'POST', body);

  await t.test('PIN: required, checked per student, and a student from another class is refused', async () => {
    const a = await assign({ groupId: groupA, identityMode: 'PICK_FROM_LIST', requirePin: true, maxAttempts: 5 });
    assert.equal((await start(a.publicId, { studentId: withPin.id })).status, 403, 'no PIN');
    assert.equal((await start(a.publicId, { studentId: withPin.id, pin: '0000' })).status, 403, 'wrong PIN');
    assert.equal((await start(a.publicId, { studentId: noPin.id, pin: pin })).status, 403, 'student with no PIN set can never pass');
    assert.equal((await start(a.publicId, { studentId: otherClass.id, pin })).status, 403, 'student of another class, even with a valid PIN');
    assert.equal(await db.attempt.count({ where: { assignmentId: a.id } }), 0, 'refused starts create no attempt');
    const ok = await start(a.publicId, { studentId: withPin.id, pin });
    assert.equal(ok.status, 200, ok.data.error);
    assert.equal(await db.attempt.count({ where: { assignmentId: a.id, studentId: withPin.id } }), 1);
    checks.push('pin-and-membership');
  });
  await t.test('personal link: only the student own token of this class works', async () => {
    const a = await assign({ groupId: groupA, identityMode: 'PERSONAL_LINK', maxAttempts: 2 });
    assert.equal((await start(a.publicId, { personalToken: 'tok_not_real' })).status, 403, 'unknown token');
    const foreign = await db.student.findUniqueOrThrow({ where: { id: otherClass.id } });
    assert.equal((await start(a.publicId, { personalToken: foreign.personalToken! })).status, 403, 'token of a student in another class');
    assert.equal((await start(a.publicId, { studentId: withPin.id })).status, 400, 'a student ID cannot replace the token');
    assert.equal(await db.attempt.count({ where: { assignmentId: a.id } }), 0);
    const mine = await db.student.findUniqueOrThrow({ where: { id: withPin.id } });
    const ok = await start(a.publicId, { personalToken: mine.personalToken! });
    assert.equal(ok.status, 200, ok.data.error);
    checks.push('personal-link');
  });
  await t.test('old links: a revoked or expired share link stops serving content and a refused revoke changes nothing', async () => {
    const share = await request(`/api/exams/${examId}/share`, 'POST', { showAnswers: false, allowCopy: false }, owner);
    assert.equal(share.status, 200); const token = String(share.data.publicLink).split('/').pop()!;
    const live = await request('/api/public/share/' + token); assert.equal(live.status, 200);
    assert.ok(!JSON.stringify(live.data).includes('IDENTITY_PRIVATE_SOLUTION'), 'a live link without answers never carries the solution');
    assert.equal((await request(`/api/exams/${examId}/share`, 'DELETE', { linkId: share.data.link?.id ?? share.data.id }, '')).status, 401, 'revoking needs a signed-in owner');
    assert.equal((await request('/api/public/share/' + token)).status, 200, 'a refused revoke leaves the link alive');
    const revoke = await request(`/api/exams/${examId}/share`, 'DELETE', { linkId: share.data.link?.id ?? share.data.id }, owner);
    assert.equal(revoke.status, 200, JSON.stringify(revoke.data));
    const gone = await request('/api/public/share/' + token);
    assert.equal(gone.status, 404); assert.ok(!JSON.stringify(gone.data).includes('IDENTITY_PRIVATE_SOLUTION') && !JSON.stringify(gone.data).includes('Identity fixture'), 'a revoked link leaks nothing about the exam');
    const second = await request(`/api/exams/${examId}/share`, 'POST', { showAnswers: true, allowCopy: false, expiresAt: new Date(Date.now() + 3600_000).toISOString() }, owner);
    assert.equal(second.status, 200); const token2 = String(second.data.publicLink).split('/').pop()!;
    assert.equal((await request('/api/public/share/' + token2)).status, 200);
    await db.shareLink.updateMany({ where: { token: token2 }, data: { expiresAt: new Date(Date.now() - 1000) } });
    assert.equal((await request('/api/public/share/' + token2)).status, 404, 'an expired link stops serving');
    checks.push('old-share-links');
  });
  await t.test('two simultaneous submits of one attempt produce one result and no duplicate answers', async () => {
    const a = await assign({ identityMode: 'FREE_NAME', maxAttempts: 1 });
    const started = await start(a.publicId, { freeName: 'Học sinh nộp đồng thời' });
    assert.equal(started.status, 200, started.data.error);
    const attemptId = started.data.attempt.id as string, baseDraftRevision = started.data.attempt.draftRevision as string;
    const body = { answers: { mc: 'A', sa: '0' }, baseDraftRevision };
    const replies = await Promise.all([request(`/api/public/attempts/${attemptId}/submit`, 'POST', body, started.cookie), request(`/api/public/attempts/${attemptId}/submit`, 'POST', body, started.cookie)]);
    assert.deepEqual(replies.map(r => r.status), [200, 200], JSON.stringify(replies.map(r => r.data.error)));
    assert.equal(Number(replies[0].data.score), Number(replies[1].data.score));
    const stored = await db.attempt.findUniqueOrThrow({ where: { id: attemptId }, include: { answers: true } });
    assert.equal(stored.status, 'SUBMITTED'); assert.equal(Number(stored.score), 2); assert.equal(stored.answers.length, 2, 'one row per question, none duplicated');
    assert.equal(replies.filter(r => r.data.idempotent === true).length, 1, 'exactly one of the two replies is the repeat');
    checks.push('concurrent-submit');
  });
});
