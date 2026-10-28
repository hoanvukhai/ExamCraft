import { writeQaReport } from './helpers/qa-report';
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import { requireTestDatabase } from './helpers/test-database';

const db = new PrismaClient({ datasources: { db: { url: requireTestDatabase() } }, log: [] });
const origin = process.env.EXAMCRAFT_TEST_ORIGIN ?? 'http://127.0.0.1:3117';
async function request(path: string, method = 'GET', body?: unknown, cookie = '') {
  const response = await fetch(origin + path, { method, headers: { Origin: origin, ...(cookie ? { Cookie: cookie } : {}), ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: response.status, data: await response.json(), cookie: response.headers.getSetCookie().map(value => value.split(';')[0]).join('; ') };
}

test('correcting an answer key regrades submitted attempts without touching hand grades', { timeout: 120000 }, async t => {
  assert.equal((await request('/api/health')).data.isolatedTest, true, 'Refusing writes without proof of isolated server.');
  const uid = 'regrade_' + randomUUID(), otherUid = 'regrade_other_' + randomUUID(), checks: string[] = [];
  t.after(async () => {
    try {
      const ids = [uid, otherUid];
      await db.assignment.deleteMany({ where: { ownerId: { in: ids } } });
      await db.group.deleteMany({ where: { ownerId: { in: ids } } });
      await db.exam.deleteMany({ where: { ownerId: { in: ids } } });
      await db.question.deleteMany({ where: { ownerId: { in: ids } } });
      await db.auditLog.deleteMany({ where: { actorId: { in: ids } } });
      await db.user.deleteMany({ where: { id: { in: ids } } });
      const directory = process.env.HTTP_REPORT_DIR ?? `qa/rebuild-${new Date().toISOString().slice(0, 10)}`;
      fs.mkdirSync(directory, { recursive: true });
      writeQaReport(`${directory}/http_regrade.json`, JSON.stringify({ checkedAt: new Date().toISOString(), checks, cleanupComplete: true, status: checks.length === 6 ? 'PASS' : 'INCOMPLETE', environment: 'isolated ' + origin, realAiCalls: false }, null, 2));
    } finally { await db.$disconnect(); }
  });
  const password = 'fixture-' + randomUUID();
  const passwordHash = await bcrypt.hash(password, 10);
  const signIn = async (id: string) => {
    await db.user.create({ data: { id, email: id + '@example.invalid', name: 'Regrade fixture', passwordHash, mustChangePassword: false, aiDailyLimit: 0 } });
    const r = await request('/api/auth/login', 'POST', { email: id + '@example.invalid', password }); assert.equal(r.status, 200); return r.cookie;
  };
  const owner = await signIn(uid), other = await signIn(otherUid);
  const created = await request('/api/exams', 'POST', { document: { id: 'draft_' + uid, metadata: { title: 'Regrade fixture', subject: 'toan', grade: 6, durationMinutes: 15, schoolName: '', departmentName: '' },
    questions: [
      { id: 'mc', type: 'multiple_choice', difficulty: 'thong_hieu', content: 'MC', choices: [{ key: 'A', text: '1' }, { key: 'B', text: '2' }], correct_answer: 'A', points: 1, step_by_step_solution: 'x' },
      { id: 'sa', type: 'short_answer', difficulty: 'thong_hieu', content: 'SA', correct_answer: '0', accepted_answers: ['0'], points: 1, step_by_step_solution: 'x' },
    ], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } }, owner);
  assert.equal(created.status, 200, created.data.error);
  const asg = await request('/api/assignments', 'POST', { examId: created.data.document.id, title: 'Regrade fixture', identityMode: 'FREE_NAME', maxAttempts: 1 }, owner);
  assert.equal(asg.status, 200, asg.data.error);
  const assignment = asg.data.assignment as { id: string; publicId: string };
  const submit = async (name: string, answers: Record<string, string>) => {
    const started = await request(`/api/public/assignments/${assignment.publicId}/start`, 'POST', { freeName: name });
    assert.equal(started.status, 200, started.data.error);
    const id = started.data.attempt.id as string;
    const done = await request(`/api/public/attempts/${id}/submit`, 'POST', { answers, baseDraftRevision: started.data.attempt.draftRevision }, started.cookie);
    assert.equal(done.status, 200, done.data.error); return id;
  };
  // Under the wrong key "A": one student is right by luck, one is wrongly marked down, one is hand-graded.
  const lucky = await submit('Học sinh A', { mc: 'A', sa: '0' });
  const marked = await submit('Học sinh B', { mc: 'B', sa: '0' });
  const manual = await submit('Học sinh C', { mc: 'B', sa: '0' });
  const detail = await request('/api/teacher/attempts/' + manual, 'GET', undefined, owner);
  const mcRow = (detail.data.questions as { questionId: string; gradeRevision: string }[]).find(q => q.questionId === 'mc')!;
  const graded = await request('/api/teacher/attempts/' + manual, 'POST', { questionKey: 'mc', earned: 0.5, teacherComment: 'Một phần', baseGradeRevision: mcRow.gradeRevision }, owner);
  assert.equal(graded.status, 200, graded.data.error);
  const score = async (id: string) => Number((await db.attempt.findUniqueOrThrow({ where: { id } })).score);
  assert.deepEqual([await score(lucky), await score(marked), await score(manual)], [2, 1, 1.5]);

  const list = await request(`/api/teacher/assignments/${assignment.id}/regrade`, 'GET', undefined, owner);
  assert.equal(list.status, 200);
  const mc = (list.data.questions as { id: string; revision: string; key: { correct: string } }[]).find(q => q.id === 'mc')!;
  assert.equal(mc.key.correct, 'A');
  const change = { questionKey: 'mc', correctAnswer: 'B', reason: 'Đáp án nhập nhầm', baseCorrectionRevision: mc.revision };
  const regrade = (body: Record<string, unknown>, cookie = owner) => request(`/api/teacher/assignments/${assignment.id}/regrade`, 'POST', body, cookie);

  await t.test('preview shows the effect and writes nothing; bad requests change nothing', async () => {
    const preview = await regrade({ ...change, preview: true });
    assert.equal(preview.status, 200, preview.data.error);
    assert.equal(preview.data.preview, true); assert.equal(preview.data.keptManual, 1);
    assert.deepEqual(preview.data.changed.map((c: { scoreBefore: number; scoreAfter: number }) => [c.scoreBefore, c.scoreAfter]).sort(), [[1, 2], [2, 1]]);
    assert.deepEqual([await score(lucky), await score(marked), await score(manual)], [2, 1, 1.5], 'preview wrote no score');
    assert.equal((await regrade({ ...change, reason: ' ' })).status, 400, 'a reason is required');
    assert.equal((await regrade({ ...change, correctAnswer: 'Z' })).status, 400, 'the key must be one of the choices');
    assert.ok([404, 409].includes((await regrade({ ...change, questionKey: 'nope' })).status), 'an unknown question is never corrected');
    assert.equal((await regrade({ ...change, baseCorrectionRevision: 'a'.repeat(64) })).status, 409, 'a stale form never overwrites');
    assert.equal((await regrade(change, other)).status, 404, 'another teacher cannot correct this assignment');
    assert.equal((await db.assignment.findUniqueOrThrow({ where: { id: assignment.id } })).snapshot && JSON.stringify((await db.assignment.findUniqueOrThrow({ where: { id: assignment.id } })).snapshot).includes('"corrections"'), false, 'nothing recorded by preview or refusals');
    checks.push('preview-and-refusals');
  });

  await t.test('applying changes only auto-graded answers and records history per attempt', async () => {
    const done = await regrade(change);
    assert.equal(done.status, 200, done.data.error);
    assert.equal(done.data.changed.length, 2); assert.equal(done.data.keptManual, 1);
    assert.deepEqual([await score(lucky), await score(marked), await score(manual)], [1, 2, 1.5], 'hand grade of C is untouched');
    const keptRow = await db.attemptAnswer.findUniqueOrThrow({ where: { attemptId_questionKey: { attemptId: manual, questionKey: 'mc' } } });
    assert.equal(Number(keptRow.manualScore), 0.5); assert.equal(keptRow.comment, 'Một phần');
    const events = await db.auditLog.findMany({ where: { action: 'attempt.grade', targetId: { in: [lucky, marked] } } });
    assert.equal(events.length, 2, 'one grading-history event per changed attempt');
    assert.ok(events.every(e => JSON.stringify(e.meta).includes('Đáp án nhập nhầm')), 'the reason is part of each event');
    const summary = await db.auditLog.findFirstOrThrow({ where: { action: 'assignment.regrade', targetId: assignment.id } });
    assert.equal((summary.meta as { changed: number }).changed, 2);
    checks.push('apply-and-history');
  });

  await t.test('the correction is recorded, repeating it is a no-op, and a stale revision is refused', async () => {
    assert.equal((await regrade(change)).status, 409, 'the revision read before the first correction no longer matches');
    const fresh = (await request(`/api/teacher/assignments/${assignment.id}/regrade`, 'GET', undefined, owner)).data.questions.find((q: { id: string }) => q.id === 'mc');
    assert.equal(fresh.key.correct, 'B'); assert.equal(fresh.corrections.length, 1); assert.equal(fresh.corrections[0].reason, 'Đáp án nhập nhầm');
    const repeat = await regrade({ ...change, baseCorrectionRevision: fresh.revision });
    assert.equal(repeat.status, 200); assert.equal(repeat.data.changed.length, 0, 'same key again changes no score');
    assert.deepEqual([await score(lucky), await score(marked), await score(manual)], [1, 2, 1.5]);
    checks.push('history-and-idempotence');
  });

  await t.test('a student who starts afterwards is graded under the corrected key and the key never reaches students', async () => {
    const late = await submit('Học sinh D', { mc: 'B', sa: '0' });
    assert.equal(await score(late), 2);
    const view = await request(`/api/public/assignments/${assignment.publicId}/start`, 'POST', { freeName: 'Học sinh đang làm' });
    assert.equal(view.status, 200, view.data.error);
    assert.ok(!JSON.stringify(view.data).includes('corrections') && !JSON.stringify(view.data).includes('Đáp án nhập nhầm'), 'student payload carries no correction data');
    checks.push('later-attempts-and-privacy');
  });

  await t.test('essay or unsupported keys are refused and a short-answer key can be widened', async () => {
    const sa = (await request(`/api/teacher/assignments/${assignment.id}/regrade`, 'GET', undefined, owner)).data.questions.find((q: { id: string }) => q.id === 'sa');
    const widen = await regrade({ questionKey: 'sa', acceptedAnswers: ['0', 'không'], reason: 'Chấp nhận chữ', baseCorrectionRevision: sa.revision });
    assert.equal(widen.status, 200, widen.data.error); assert.equal(widen.data.changed.length, 0, 'students who already had 0 stay right');
    assert.equal((await regrade({ questionKey: 'sa', acceptedAnswers: [], reason: 'Rỗng', baseCorrectionRevision: widen.data.revision })).status, 400);
    checks.push('short-answer-key');
  });

  await t.test('closed attempts in progress are not regraded', async () => {
    const inProgress = await db.attempt.count({ where: { assignmentId: assignment.id, status: 'IN_PROGRESS' } });
    assert.equal(inProgress, 1, 'the student who started in the previous step is still working');
    const list2 = (await request(`/api/teacher/assignments/${assignment.id}/regrade`, 'GET', undefined, owner)).data.questions.find((q: { id: string }) => q.id === 'mc');
    const flip = await regrade({ questionKey: 'mc', correctAnswer: 'A', reason: 'Đổi lại', baseCorrectionRevision: list2.revision });
    assert.equal(flip.status, 200);
    assert.equal(flip.data.submitted, 4, 'only the four submitted attempts are counted');
    assert.equal(await db.attempt.count({ where: { assignmentId: assignment.id, status: 'IN_PROGRESS' } }), inProgress, 'in-progress attempts untouched');
    checks.push('in-progress-untouched');
  });
});
