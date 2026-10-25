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
  const text = await response.text();
  let data: Record<string, unknown> = {}; try { data = JSON.parse(text); } catch { /* CSV or empty */ }
  return { status: response.status, data, text, cookie: response.headers.getSetCookie().map(value => value.split(';')[0]).join('; ') };
}
const HOUR = 3600_000;

test('closing, reopening and extending an assignment, and teacher comments stay private', { timeout: 120000 }, async t => {
  assert.equal((await request('/api/health')).data.isolatedTest, true, 'Refusing writes without proof of isolated server.');
  const uid = 'window_' + randomUUID(), checks: string[] = [];
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
      fs.writeFileSync(`${directory}/http_assignment_window.json`, JSON.stringify({ checkedAt: new Date().toISOString(), checks, cleanupComplete: true, status: checks.length === 4 ? 'PASS' : 'INCOMPLETE', environment: 'isolated localhost:3117', realAiCalls: false }, null, 2));
    } finally { await db.$disconnect(); }
  });
  const password = 'fixture-' + randomUUID(), email = uid + '@example.invalid';
  await db.user.create({ data: { id: uid, email, name: 'Window fixture', passwordHash: await bcrypt.hash(password, 10), mustChangePassword: false, aiDailyLimit: 0 } });
  const login = await request('/api/auth/login', 'POST', { email, password }); assert.equal(login.status, 200); const owner = login.cookie;
  const created = await request('/api/exams', 'POST', { document: { id: 'draft_' + uid, metadata: { title: 'Window fixture', subject: 'toan', grade: 6, durationMinutes: 30, schoolName: '', departmentName: '' },
    questions: [{ id: 'mc', type: 'multiple_choice', difficulty: 'thong_hieu', content: 'MC', choices: [{ key: 'A', text: '1' }, { key: 'B', text: '2' }], correct_answer: 'A', points: 2, step_by_step_solution: 'x' }],
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } }, owner);
  assert.equal(created.status, 200, String(created.data.error));
  const examId = (created.data.document as { id: string }).id;
  const assign = async (extra: Record<string, unknown> = {}) => { const r = await request('/api/assignments', 'POST', { examId, title: 'Window fixture', identityMode: 'FREE_NAME', maxAttempts: 1, durationMinutes: 30, closesAt: new Date(Date.now() + HOUR).toISOString(), ...extra }, owner); assert.equal(r.status, 200, String(r.data.error)); return r.data.assignment as { id: string; publicId: string }; };
  const patch = (id: string, body: Record<string, unknown>) => request('/api/teacher/assignments/' + id, 'PATCH', body, owner);
  const start = (publicId: string, name: string) => request(`/api/public/assignments/${publicId}/start`, 'POST', { freeName: name });
  const attemptOf = async (id: string) => db.attempt.findUniqueOrThrow({ where: { id } });

  await t.test('closing early stops saving and starting; reopening restores both without touching the attempt deadline', async () => {
    const a = await assign();
    const first = await start(a.publicId, 'Học sinh một'); assert.equal(first.status, 200, String(first.data.error));
    const attempt = first.data.attempt as { id: string; draftRevision: string }; const deadline = (await attemptOf(attempt.id)).deadlineAt!.getTime();
    assert.equal((await patch(a.id, { status: 'CLOSED' })).status, 200);
    const saveClosed = await request(`/api/public/attempts/${attempt.id}/draft`, 'PATCH', { draft: { mc: 'A' }, baseDraftRevision: attempt.draftRevision }, first.cookie);
    assert.equal(saveClosed.status, 409, 'a closed assignment takes no more drafts');
    assert.equal((await start(a.publicId, 'Học sinh hai')).status, 403, 'a closed assignment takes no new student');
    assert.equal((await patch(a.id, { status: 'OPEN' })).status, 200);
    const saveOpen = await request(`/api/public/attempts/${attempt.id}/draft`, 'PATCH', { draft: { mc: 'A' }, baseDraftRevision: attempt.draftRevision }, first.cookie);
    assert.equal(saveOpen.status, 200, String(saveOpen.data.error));
    assert.equal((await attemptOf(attempt.id)).deadlineAt!.getTime(), deadline, 'reopening never moves the deadline of a started attempt');
    assert.equal((await start(a.publicId, 'Học sinh hai')).status, 200, 'after reopening a new student can start');
    checks.push('close-and-reopen');
  });

  await t.test('a close time before the opening time is refused and invalid values change nothing', async () => {
    const a = await assign();
    const before = (await db.assignment.findUniqueOrThrow({ where: { id: a.id } })).closesAt!.getTime();
    assert.equal((await patch(a.id, { closesAt: new Date(Date.now() - 60_000).toISOString() })).status, 400, 'closing before it opened makes no sense');
    assert.equal((await patch(a.id, { closesAt: 'not a date' })).status, 400);
    assert.equal((await patch(a.id, { maxAttempts: 0 })).status, 400);
    assert.equal((await patch(a.id, { durationMinutes: 0 })).status, 400);
    assert.equal((await db.assignment.findUniqueOrThrow({ where: { id: a.id } })).closesAt!.getTime(), before, 'refused changes leave the assignment as it was');
    assert.equal((await start(a.publicId, 'Học sinh bình thường')).status, 200);
    assert.equal((await patch(a.id, { closesAt: null })).status, 200, 'the close time can be removed');
    assert.equal((await db.assignment.findUniqueOrThrow({ where: { id: a.id } })).closesAt, null);
    checks.push('invalid-close-times-refused');
  });

  await t.test('extending the close time changes new attempts only, and a started attempt keeps the deadline it was given', async () => {
    const a = await assign({ durationMinutes: 60, closesAt: new Date(Date.now() + 10 * 60_000).toISOString() });
    const early = await start(a.publicId, 'Học sinh sớm'); assert.equal(early.status, 200);
    const earlyDeadline = (await attemptOf((early.data.attempt as { id: string }).id)).deadlineAt!.getTime();
    assert.ok(earlyDeadline <= Date.now() + 10 * 60_000 + 1000, 'the deadline is clipped by the close time');
    assert.equal((await patch(a.id, { closesAt: new Date(Date.now() + 2 * HOUR).toISOString() })).status, 200);
    const late = await start(a.publicId, 'Học sinh sau'); assert.equal(late.status, 200);
    const lateDeadline = (await attemptOf((late.data.attempt as { id: string }).id)).deadlineAt!.getTime();
    assert.ok(lateDeadline > earlyDeadline + 30 * 60_000, 'a student who starts after the extension gets the full duration');
    assert.equal((await attemptOf((early.data.attempt as { id: string }).id)).deadlineAt!.getTime(), earlyDeadline, 'the earlier attempt keeps its original deadline');
    checks.push('extension-applies-to-new-attempts');
  });

  await t.test('a teacher comment never reaches the student, and the CSV needs the teacher session', async () => {
    const a = await assign({ showResult: 'IMMEDIATE', showSolution: 'IMMEDIATE' });
    const started = await start(a.publicId, 'Học sinh nhận xét'); assert.equal(started.status, 200);
    const attempt = started.data.attempt as { id: string; draftRevision: string };
    const sent = await request(`/api/public/attempts/${attempt.id}/submit`, 'POST', { answers: { mc: 'B' }, baseDraftRevision: attempt.draftRevision }, started.cookie);
    assert.equal(sent.status, 200, String(sent.data.error));
    const detail = await request('/api/teacher/attempts/' + attempt.id, 'GET', undefined, owner);
    const row = (detail.data.questions as { questionId: string; gradeRevision: string }[]).find(q => q.questionId === 'mc')!;
    const secret = 'NHAN_XET_CHI_GIAO_VIEN_THAY';
    const graded = await request('/api/teacher/attempts/' + attempt.id, 'POST', { questionKey: 'mc', earned: 1, teacherComment: secret, baseGradeRevision: row.gradeRevision }, owner);
    assert.equal(graded.status, 200, String(graded.data.error));
    const again = await request(`/api/public/attempts/${attempt.id}/submit`, 'POST', { answers: { mc: 'B' }, baseDraftRevision: attempt.draftRevision }, started.cookie);
    const view = await request(`/api/public/assignments/${a.publicId}`, 'GET', undefined, started.cookie);
    for (const [name, text] of [['repeat submit', again.text], ['assignment view', view.text]] as const) assert.ok(!text.includes(secret), `${name} must not carry the teacher comment`);
    assert.equal((await request(`/api/teacher/assignments/${a.id}/export-csv`, 'GET', undefined, started.cookie)).status === 200, false, 'a student cookie cannot export the CSV');
    const csv = await request(`/api/teacher/assignments/${a.id}/export-csv`, 'GET', undefined, owner);
    assert.equal(csv.status, 200); assert.ok(csv.text.includes(secret), 'the teacher CSV does carry the comment');
    checks.push('comment-private-to-teacher');
  });
});
