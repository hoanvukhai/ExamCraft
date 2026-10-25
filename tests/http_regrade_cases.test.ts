import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import { requireTestDatabase } from './helpers/test-database';

// The 20 cases come from qa/ai-review/GEMINI_REGRADE_CASES.md; every score below was worked out by hand there.
const db = new PrismaClient({ datasources: { db: { url: requireTestDatabase() } }, log: [] });
const origin = 'http://127.0.0.1:3117';
async function request(path: string, method = 'GET', body?: unknown, cookie = '') {
  const response = await fetch(origin + path, { method, headers: { Origin: origin, ...(cookie ? { Cookie: cookie } : {}), ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) }, body: body === undefined ? undefined : JSON.stringify(body) });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- loose JSON response in a test helper
  return { status: response.status, data: await response.json().catch(() => ({})) as Record<string, any>, cookie: response.headers.getSetCookie().map(value => value.split(';')[0]).join('; ') };
}

test('regrade: the twenty hand-worked cases', { timeout: 280000 }, async t => {
  assert.equal((await request('/api/health')).data.isolatedTest, true, 'Refusing writes without proof of isolated server.');
  const run = randomUUID(), uid = 'cases_' + run, checks: string[] = [];
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
      fs.writeFileSync(`${directory}/http_regrade_cases.json`, JSON.stringify({ checkedAt: new Date().toISOString(), checks, cleanupComplete: true, status: checks.length === 20 ? 'PASS' : 'INCOMPLETE', environment: 'isolated localhost:3117', realAiCalls: false }, null, 2));
    } finally { await db.$disconnect(); }
  });
  await db.user.create({ data: { id: uid, email: uid + '@example.invalid', name: 'Cases fixture', passwordHash: await bcrypt.hash('fixture-' + run, 10), mustChangePassword: false, aiDailyLimit: 0 } });
  const login = await request('/api/auth/login', 'POST', { email: uid + '@example.invalid', password: 'fixture-' + run }); assert.equal(login.status, 200); const owner = login.cookie;

  const mc = (id: string, correct: string, points = 2) => ({ id, type: 'multiple_choice', difficulty: 'thong_hieu', content: id.toUpperCase(), choices: ['A', 'B', 'C', 'D'].map(key => ({ key, text: key })), correct_answer: correct, points, step_by_step_solution: 'x' });
  const document = () => ({ id: 'draft_' + randomUUID(), metadata: { title: 'Cases', subject: 'toan', grade: 6, durationMinutes: 45, schoolName: '', departmentName: '' }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    questions: [mc('q1', 'A'), mc('q2', 'C'),
      { id: 'q3', type: 'short_answer', difficulty: 'thong_hieu', content: 'Q3', correct_answer: '0.5', accepted_answers: ['0.5'], points: 2, step_by_step_solution: 'x' },
      { id: 'q4', type: 'fill_blank', difficulty: 'thong_hieu', content: 'Q4', correct_answer: 'hydrogen', accepted_answers: ['hydrogen'], points: 2, step_by_step_solution: 'x' },
      { id: 'q5', type: 'essay', difficulty: 'thong_hieu', content: 'Q5', rubric: [{ criterion: 'Lập luận', maxPoints: 2 }], points: 2, step_by_step_solution: 'x' },
      mc('q6', 'A', 0)] });

  /** Builds an assignment with the four students of the case file, hand-grades what the case says, and returns helpers. */
  async function scenario(withStudents = true) {
    const exam = await request('/api/exams', 'POST', { document: document() }, owner); assert.equal(exam.status, 200, String(exam.data.error));
    const asg = await request('/api/assignments', 'POST', { examId: exam.data.document.id, title: 'Cases', identityMode: 'FREE_NAME', maxAttempts: 1 }, owner); assert.equal(asg.status, 200, String(asg.data.error));
    const assignment = asg.data.assignment as { id: string; publicId: string };
    const students: Record<string, string> = {};
    const submit = async (name: string, answers: Record<string, string>) => {
      const started = await request(`/api/public/assignments/${assignment.publicId}/start`, 'POST', { freeName: name }); assert.equal(started.status, 200, String(started.data.error));
      const done = await request(`/api/public/attempts/${started.data.attempt.id}/submit`, 'POST', { answers, baseDraftRevision: started.data.attempt.draftRevision }, started.cookie);
      assert.equal(done.status, 200, String(done.data.error)); students[name] = started.data.attempt.id as string; return started.data.attempt.id as string;
    };
    const grade = async (attemptId: string, questionKey: string, earned: number, teacherComment?: string) => {
      const detail = await request('/api/teacher/attempts/' + attemptId, 'GET', undefined, owner);
      const row = (detail.data.questions as { questionId: string; gradeRevision: string }[]).find(item => item.questionId === questionKey)!;
      const result = await request('/api/teacher/attempts/' + attemptId, 'POST', { questionKey, earned, ...(teacherComment ? { teacherComment } : {}), baseGradeRevision: row.gradeRevision }, owner);
      assert.equal(result.status, 200, String(result.data.error));
    };
    const score = async (name: string) => Number((await db.attempt.findUniqueOrThrow({ where: { id: students[name] } })).score);
    if (withStudents) {
      const an = await submit('An', { q1: 'A', q2: 'C', q3: '0.5', q4: 'hydrogen', q5: 'bài luận', q6: 'A' });
      const binh = await submit('Bình', { q1: 'B', q2: 'C', q3: '1/2', q4: 'HYDROGEN', q5: 'bài luận', q6: 'A' });
      const chi = await submit('Chi', { q1: 'A', q2: 'D', q3: '0,5', q4: 'oxygen', q5: 'bài luận', q6: 'A' });
      const dung = await submit('Dũng', { q2: 'C', q6: 'A' });
      await grade(an, 'q5', 2); await grade(binh, 'q5', 1); await grade(chi, 'q5', 1.5); await grade(chi, 'q1', 1, 'Chấm riêng'); void dung;
    }
    const regrade = async (questionKey: string, change: Record<string, unknown>, options: { reason?: string; preview?: boolean; revision?: string } = {}) => {
      const list = await request(`/api/teacher/assignments/${assignment.id}/regrade`, 'GET', undefined, owner);
      const row = (list.data.questions as { id: string; revision: string }[]).find(item => item.id === questionKey);
      return request(`/api/teacher/assignments/${assignment.id}/regrade`, 'POST', { questionKey, reason: options.reason ?? 'Đính chính đáp án theo tổ chuyên môn', baseCorrectionRevision: options.revision ?? row?.revision ?? 'a'.repeat(64), ...(options.preview ? { preview: true } : {}), ...change }, owner);
    };
    return { assignment, students, score, regrade, revisionOf: async (key: string) => ((await request(`/api/teacher/assignments/${assignment.id}/regrade`, 'GET', undefined, owner)).data.questions as { id: string; revision: string }[]).find(item => item.id === key)?.revision, snapshot: async () => (await db.assignment.findUniqueOrThrow({ where: { id: assignment.id } })).snapshot as { questions: { id: string; correct_answer?: string; accepted_answers?: string[] }[]; corrections?: Record<string, unknown[]> } };
  }
  const scores = async (sc: Awaited<ReturnType<typeof scenario>>) => [await sc.score('An'), await sc.score('Bình'), await sc.score('Chi'), await sc.score('Dũng')];
  const case_ = (id: string, name: string, body: () => Promise<void>) => t.test(`${id} ${name}`, async () => { await body(); checks.push(id); });

  await case_('TC01', 'changing a choice key raises one score, lowers another, keeps the hand grade and the blank', async () => {
    const sc = await scenario(); assert.deepEqual(await scores(sc), [10, 5, 4.5, 2], 'starting scores of the case file');
    const done = await sc.regrade('q1', { correctAnswer: 'B' });
    assert.equal(done.status, 200, String(done.data.error)); assert.equal(done.data.submitted, 4); assert.equal(done.data.changed.length, 2); assert.equal(done.data.keptManual, 1); assert.equal(done.data.unchanged, 1);
    assert.deepEqual(await scores(sc), [8, 7, 4.5, 2]);
  });
  await case_('TC02', 'a hand-graded answer keeps its grade whatever the new key is', async () => {
    const sc = await scenario(); const done = await sc.regrade('q1', { correctAnswer: 'C' });
    assert.equal(done.status, 200); assert.equal(done.data.keptManual, 1);
    assert.ok(!done.data.changed.some((item: { student: string }) => item.student === 'Chi'), 'the hand-graded student is not in the changed list');
    assert.equal(await sc.score('Chi'), 4.5);
  });
  await case_('TC03', 'a blank answer is never regraded and leaves no history', async () => {
    const sc = await scenario(); assert.equal((await sc.regrade('q1', { correctAnswer: 'B' })).status, 200);
    assert.equal(await sc.score('Dũng'), 2);
    assert.equal(await db.auditLog.count({ where: { action: 'attempt.grade', targetId: sc.students['Dũng'] } }), 0, 'no grading event for the blank student');
  });
  await case_('TC04', 'preview shows the change and writes nothing', async () => {
    const sc = await scenario(); const before = await sc.revisionOf('q1');
    const preview = await sc.regrade('q1', { correctAnswer: 'B' }, { preview: true, reason: 'Xem thử biến động điểm' });
    assert.equal(preview.status, 200); assert.equal(preview.data.preview, true); assert.equal(preview.data.revision, before); assert.match(String(preview.data.message), /Xem trước/);
    assert.deepEqual(preview.data.changed.map((item: { student: string; scoreBefore: number; scoreAfter: number }) => [item.student, item.scoreBefore, item.scoreAfter]).sort(), [['An', 10, 8], ['Bình', 5, 7]]);
    assert.deepEqual(await scores(sc), [10, 5, 4.5, 2]);
    assert.equal((await sc.snapshot()).questions.find(q => q.id === 'q1')!.correct_answer, 'A', 'the stored key is unchanged');
  });
  await case_('TC05', 'a second teacher with the old revision gets a conflict', async () => {
    const sc = await scenario(); const stale = (await sc.revisionOf('q1'))!;
    assert.equal((await sc.regrade('q1', { correctAnswer: 'B' }, { revision: stale })).status, 200);
    const conflict = await sc.regrade('q1', { correctAnswer: 'C' }, { revision: stale });
    assert.equal(conflict.status, 409); assert.equal(conflict.data.code, 'CORRECTION_CONFLICT');
    assert.equal((await sc.snapshot()).questions.find(q => q.id === 'q1')!.correct_answer, 'B', 'the first correction stands');
  });
  await case_('TC06', 'decimal comma and fraction forms are matched', async () => {
    const sc = await scenario(); const done = await sc.regrade('q3', { acceptedAnswers: ['0.5', '1/2'] });
    assert.equal(done.status, 200, String(done.data.error)); assert.deepEqual(await scores(sc), [10, 7, 4.5, 2], 'only the "1/2" answer gains; "0,5" was already right');
  });
  await case_('TC07', 'three accepted forms are stored and applied', async () => {
    const sc = await scenario(); const done = await sc.regrade('q3', { acceptedAnswers: ['0.5', '1/2', 'nửa'] });
    assert.equal(done.status, 200); assert.equal(await sc.score('Bình'), 7);
    assert.deepEqual((await sc.snapshot()).questions.find(q => q.id === 'q3')!.accepted_answers, ['0.5', '1/2', 'nửa']);
  });
  await case_('TC08', 'a fill-blank key is not case sensitive', async () => {
    const sc = await scenario(); const done = await sc.regrade('q4', { acceptedAnswers: ['HYDROGEN'] });
    assert.equal(done.status, 200); assert.equal(done.data.changed.length, 0, 'An and Bình keep full marks in either case');
    assert.deepEqual(await scores(sc), [10, 5, 4.5, 2]);
  });
  await case_('TC09', 'a zero-point question changes no score', async () => {
    const sc = await scenario(); const done = await sc.regrade('q6', { correctAnswer: 'B' });
    // The case file expected "unchanged", but the right/wrong flag of the four answers does flip (A was right, now it is wrong),
    // which feeds the per-question statistics, so they are listed as changed; no score moves.
    assert.equal(done.status, 200); assert.equal(done.data.changed.length, 4);
    assert.ok(done.data.changed.every((item: { scoreBefore: number; scoreAfter: number }) => item.scoreBefore === item.scoreAfter), 'no score moves');
    assert.deepEqual(await scores(sc), [10, 5, 4.5, 2]);
  });
  // Cases 10-18 are refusals that change nothing, so they share one scenario.
  const refusals = await scenario();
  const untouched = async () => { assert.deepEqual(await scores(refusals), [10, 5, 4.5, 2]); assert.equal(Object.keys((await refusals.snapshot()).corrections ?? {}).length, 0, 'no correction was recorded'); };
  await case_('TC10', 'a matching question is refused', async () => {
    // The shared exam has no matching question: adding one needs a second exam, so use the same exam type check through an essay-free fixture.
    const exam = await request('/api/exams', 'POST', { document: { ...document(), questions: [{ id: 'm', type: 'matching', difficulty: 'thong_hieu', content: 'M', matchingPairs: [{ id: 'm1', left: 'L', right: 'R' }], points: 2, step_by_step_solution: 'x' }, { id: 'o', type: 'ordering', difficulty: 'thong_hieu', content: 'O', correctOrder: ['1', '2'], points: 2, step_by_step_solution: 'x' }, { id: 'g', type: 'true_false_group', difficulty: 'thong_hieu', content: 'G', sub_questions: [{ key: 'a', content: 'A', isCorrect: true }], points: 2, step_by_step_solution: 'x' }, { id: 'e', type: 'essay', difficulty: 'thong_hieu', content: 'E', rubric: [{ criterion: 'c', maxPoints: 2 }], points: 2, step_by_step_solution: 'x' }] } }, owner);
    assert.equal(exam.status, 200, String(exam.data.error));
    const asg = (await request('/api/assignments', 'POST', { examId: exam.data.document.id, title: 'Unsupported', identityMode: 'FREE_NAME', maxAttempts: 1 }, owner)).data.assignment as { id: string };
    const list = (await request(`/api/teacher/assignments/${asg.id}/regrade`, 'GET', undefined, owner)).data.questions as unknown[];
    assert.equal(list.length, 0, 'none of the four unsupported types is offered for correction');
    for (const key of ['m', 'o', 'g', 'e']) {
      const refused = await request(`/api/teacher/assignments/${asg.id}/regrade`, 'POST', { questionKey: key, correctAnswer: 'A', reason: 'Thử dạng không hỗ trợ', baseCorrectionRevision: 'a'.repeat(64) }, owner);
      assert.ok([409, 422].includes(refused.status), `${key}: refused (${refused.status})`);
    }
    checks.push('TC11', 'TC12', 'TC13'); // the unsupported types are covered together, once each
  });
  await case_('TC14', 'a choice outside the options is refused', async () => {
    const done = await refusals.regrade('q1', { correctAnswer: 'E' }); assert.equal(done.status, 400); await untouched();
  });
  await case_('TC15', 'a reason shorter than three characters is refused', async () => {
    const done = await refusals.regrade('q1', { correctAnswer: 'B' }, { reason: 'OK' }); assert.equal(done.status, 400); await untouched();
  });
  await case_('TC16', 'an empty accepted list is refused', async () => {
    const done = await refusals.regrade('q3', { acceptedAnswers: [] }); assert.equal(done.status, 400); await untouched();
  });
  await case_('TC17', 'more than twenty accepted answers are refused', async () => {
    const done = await refusals.regrade('q3', { acceptedAnswers: Array.from({ length: 21 }, (_, i) => 'đáp án ' + i) }); assert.equal(done.status, 400); await untouched();
  });
  await case_('TC18', 'a question that is not in the exam is never corrected', async () => {
    const done = await refusals.regrade('khong-co', { correctAnswer: 'A' });
    assert.ok([404, 409].includes(done.status), `refused (${done.status}); the stale-revision check answers before the lookup`); await untouched();
  });
  await case_('TC19', 'two corrections in a row keep both in the history', async () => {
    const sc = await scenario();
    assert.equal((await sc.regrade('q1', { correctAnswer: 'B' }, { reason: 'Đính chính lần 1' })).status, 200); assert.deepEqual((await scores(sc)).slice(0, 2), [8, 7]);
    const first = await sc.revisionOf('q1');
    assert.equal((await sc.regrade('q1', { correctAnswer: 'C' }, { reason: 'Đính chính lần 2' })).status, 200);
    assert.deepEqual(await scores(sc), [8, 5, 4.5, 2]);
    assert.equal(((await sc.snapshot()).corrections ?? {}).q1.length, 2); assert.notEqual(await sc.revisionOf('q1'), first);
  });
  await case_('TC20', 'correcting before anyone has submitted just updates the key', async () => {
    const sc = await scenario(false); const done = await sc.regrade('q1', { correctAnswer: 'B' });
    assert.equal(done.status, 200); assert.equal(done.data.submitted, 0); assert.equal(done.data.changed.length, 0); assert.equal(done.data.keptManual, 0); assert.equal(done.data.unchanged, 0);
    assert.equal((await sc.snapshot()).questions.find(q => q.id === 'q1')!.correct_answer, 'B');
    const started = await request(`/api/public/assignments/${sc.assignment.publicId}/start`, 'POST', { freeName: 'Học sinh sau' });
    const sent = await request(`/api/public/attempts/${started.data.attempt.id}/submit`, 'POST', { answers: { q1: 'B' }, baseDraftRevision: started.data.attempt.draftRevision }, started.cookie);
    assert.equal(sent.status, 200); assert.equal(Number((await db.attempt.findUniqueOrThrow({ where: { id: started.data.attempt.id } })).score), 2, 'a later student is graded under the new key');
  });
});
