import assert from 'node:assert/strict';
import test from 'node:test';
import { NextRequest } from 'next/server';
import { attemptCookieName, attemptSessionToken, hasAttemptAccess, hasActiveAttemptAccess, attemptDeadline, isAttemptOpen, isPolicyVisible, isSameOriginMutation, canAcceptSubmissionAnswers, SUBMIT_GRACE_MS } from '../src/lib/attempt-access';
import { publicFigure, sanitizeSnapshotForStudent, snapshotQuestions, validateResponses } from '../src/lib/public-exam';
import { gradeSnapshot } from '../src/lib/attempt-grading';
import { createAttemptLayout, examForAttempt } from '../src/lib/attempt-layout';

const now = new Date('2026-10-22T12:00:00.000Z');
const identity = { id: 'attempt-a', studentId: 'student-a', assignmentId: 'assignment-a', startedAt: now };

test('a valid capability does not bypass archived students, groups or changed group ownership/membership', () => {
  const old = process.env.ATTEMPT_SESSION_SECRET;
  process.env.ATTEMPT_SESSION_SECRET = 'fixture-active-access-secret-at-least-32-chars';
  try {
    const attempt = { ...identity, student: { archivedAt: null as Date | null, groupId: 'group' }, assignment: { ownerId: 'owner', groupId: 'group', group: { ownerId: 'owner', archivedAt: null as Date | null } } };
    const request = new NextRequest('http://localhost/api/public/test', { headers: { cookie: `${attemptCookieName(identity.id)}=${attemptSessionToken(identity)}` } });
    assert.equal(hasActiveAttemptAccess(request, attempt, now), true);
    assert.equal(hasActiveAttemptAccess(request, { ...attempt, student: { ...attempt.student, archivedAt: now } }, now), false);
    assert.equal(hasActiveAttemptAccess(request, { ...attempt, student: { ...attempt.student, groupId: 'other' } }, now), false);
    assert.equal(hasActiveAttemptAccess(request, { ...attempt, assignment: { ...attempt.assignment, group: { ...attempt.assignment.group, archivedAt: now } } }, now), false);
    assert.equal(hasActiveAttemptAccess(request, { ...attempt, assignment: { ...attempt.assignment, group: { ...attempt.assignment.group, ownerId: 'other' } } }, now), false);
  } finally { if (old === undefined) delete process.env.ATTEMPT_SESSION_SECRET; else process.env.ATTEMPT_SESSION_SECRET = old; }
});
function publicQuestionId(value: unknown): string {
  assert.ok(value && typeof value === 'object' && 'id' in value && typeof value.id === 'string');
  return value.id;
}
test('public graphs preserve math and reject executable expressions or extreme ranges', () => {
  const clean = publicFigure({ id: 'plot', kind: 'function_plot', data: { expression: 'sin(x)+x^2/3', xRange: [-4, 4], yRange: [-8, 8], secret: 'ANSWER' } });
  assert.deepEqual(clean.data, { expression: 'sin(x)+x^2/3', xRange: [-4, 4], yRange: [-8, 8] });
  for (const expression of ['globalThis.alert(1)', 'x.constructor.constructor("alert(1)")()', 'while(true){}', 'sin(x);alert(1)']) {
    const result = publicFigure({ kind: 'function_plot', data: { expression, xRange: [-1e20, 1e20], yRange: [4, -4] } });
    assert.deepEqual(result.data, { expression: '', xRange: [-6, 8], yRange: [-6, 8] });
  }
});
test('attempt token binds attempt, student, assignment and creation time', () => {
  const old = process.env.ATTEMPT_SESSION_SECRET;
  process.env.ATTEMPT_SESSION_SECRET = 'fixture-secret-only-not-a-real-secret-2026';
  try {
    const token = attemptSessionToken(identity);
    const request = new NextRequest('http://localhost/api/public/test', { headers: { cookie: `${attemptCookieName(identity.id)}=${token}` } });
    assert.equal(hasAttemptAccess(request, identity, now), true);
    for (const changed of [{ ...identity, studentId: 'student-b' }, { ...identity, assignmentId: 'assignment-b' }, { ...identity, startedAt: new Date(now.getTime() + 1) }]) assert.equal(hasAttemptAccess(request, changed, now), false);
    assert.equal(hasAttemptAccess(request, { ...identity, id: 'attempt-b' }, now), false);
    assert.equal(hasAttemptAccess(new NextRequest('http://localhost/api/public/test'), identity, now), false);
    assert.equal(hasAttemptAccess(request, identity, new Date(now.getTime() + 31 * 86400000)), false);
  } finally {
    if (old === undefined) delete process.env.ATTEMPT_SESSION_SECRET; else process.env.ATTEMPT_SESSION_SECRET = old;
  }
});
test('open state and deadline honor assignment window and archive state', () => {
  const end = new Date(now.getTime() + 60000);
  assert.deepEqual(attemptDeadline(now, 60, end), end);
  assert.deepEqual(attemptDeadline(now, null, end), end);
  const attempt = { status: 'IN_PROGRESS', deadlineAt: end };
  const assignment = { status: 'OPEN', opensAt: null, closesAt: end };
  assert.equal(isAttemptOpen(attempt, assignment, now), true);
  assert.equal(isAttemptOpen({ ...attempt, status: 'SUBMITTED' }, assignment, now), false);
  assert.equal(isAttemptOpen(attempt, { ...assignment, status: 'CLOSED' }, now), false);
  assert.equal(isAttemptOpen(attempt, { ...assignment, group: { archivedAt: now } }, now), false);
  assert.equal(isAttemptOpen(attempt, assignment, new Date(end.getTime() + 1)), false);
});
test('submission has a fixed 15 second allowance while drafts close at the exact deadline', () => {
  assert.equal(SUBMIT_GRACE_MS, 15000);
  const attempt = { status: 'IN_PROGRESS', deadlineAt: now };
  const assignment = { status: 'OPEN', opensAt: null, closesAt: now };
  for (const [offset, expected] of [[14999, true], [15000, true], [15001, false]] as const) {
    const clock = new Date(now.getTime() + offset);
    assert.equal(canAcceptSubmissionAnswers(attempt, assignment, clock), expected);
    assert.equal(isAttemptOpen(attempt, assignment, clock), false);
  }
  assert.equal(canAcceptSubmissionAnswers(attempt, { ...assignment, status: 'CLOSED' }, now), false);
  assert.equal(canAcceptSubmissionAnswers({ ...attempt, deadlineAt: null }, assignment, new Date(now.getTime() + 15001)), false);
  assert.equal(canAcceptSubmissionAnswers(attempt, { ...assignment, closesAt: null }, new Date(now.getTime() + 15001)), false);
});
test('reveal and same-origin checks reject early answers and cross-site mutations', () => {
  const assignment = { status: 'OPEN', closesAt: new Date(now.getTime() + 60000) };
  assert.equal(isPolicyVisible('NEVER', { ...assignment, status: 'CLOSED' }, now), false);
  assert.equal(isPolicyVisible('AFTER_CLOSE', assignment, now), false);
  assert.equal(isPolicyVisible('AFTER_CLOSE', { ...assignment, status: 'CLOSED' }, now), true);
  assert.equal(isSameOriginMutation({ url: 'http://localhost:3000/api/test', headers: new Headers({ origin: 'https://other.example' }) }), false);
  assert.equal(isSameOriginMutation({ url: 'http://localhost:3000/api/test', headers: new Headers({ 'sec-fetch-site': 'cross-site' }) }), false);
});
test('public snapshot removes solutions and hidden keys from direct and nested questions', () => {
  const question = { id: 'q1', content: 'Fixture question', type: 'MULTIPLE_CHOICE', correct_answer: 'SECRET-ANSWER', step_by_step_solution: 'SECRET-SOLUTION', payload: { correct: 'SECRET-ANSWER', rubric: 'SECRET-RUBRIC', choices: [{ key: 'A', text: 'Choice', isCorrect: true }] }, figures: [{ id: 'f1', url: '/fixture.png', hidden: 'SECRET-FIGURE' }] };
  const clean = sanitizeSnapshotForStudent({ questions: [question], sections: [{ id: 's1', questions: [{ ...question, id: 'q2' }] }], metadata: { title: 'Visible title', privateNotes: 'SECRET-NOTE' } });
  assert.equal(snapshotQuestions(clean).length, 2);
  assert.equal(JSON.stringify(clean).includes('SECRET'), false);
  assert.equal(clean.questions[0].content, 'Fixture question');
  assert.deepEqual(clean.questions[0].choices, [{ key: 'A', text: 'Choice' }]);
});
test('response validation refuses unrecognized questions, oversized and nested arbitrary objects', () => {
  const snapshot = { questions: [{ id: 'q1' }] };
  assert.equal(validateResponses({ q1: 'A' }, snapshot), true);
  assert.equal(validateResponses({ q2: 'A' }, snapshot), false);
  assert.equal(validateResponses({ q1: { x: { secret: true } } }, snapshot), false);
  assert.equal(validateResponses({ q1: 'x'.repeat(200001) }, snapshot), false);
  assert.equal(validateResponses([], snapshot), false);
});
test('grading uses configured points and leaves unsupported or unanswered rubric work for manual review', () => {
  const snapshot = { questions: [
    { id: 'mc', type: 'MULTIPLE_CHOICE', points: 2, payload: { correct: 'B' } },
    { id: 'sa', type: 'SHORT_ANSWER', points: 3, payload: { accepted_answers: ['1.5'] } },
    { id: 'essay', type: 'ESSAY', points: 5, payload: {} },
  ] };
  const result = gradeSnapshot(snapshot, { mc: 'b', sa: ' 1,5 ', essay: 'Teacher will review' });
  assert.equal(result.score, 5);
  assert.equal(result.maxScore, 10);
  assert.equal(result.needsGrading, true);
  assert.equal(result.gradedAnswers[2].isCorrect, null);
});
test('true-false scoring is linear unless the snapshot explicitly configures a progression', () => {
  const q = { id: 'tf', sectionId: 's', type: 'TRUE_FALSE_GROUP', points: 4, payload: { sub_questions: [
    { key: 'a', isCorrect: true }, { key: 'b', isCorrect: false }, { key: 'c', isCorrect: true }, { key: 'd', isCorrect: false },
  ] } };
  assert.equal(gradeSnapshot({ questions: [q] }, { tf: { a: true } }).score, 1);
  // Explicit question points=4 scales the selected table whose maximum is 1.
  assert.equal(gradeSnapshot({ questions: [q], sections: [{ id: 's', progressiveScoring: [0, 0.1, 0.25, 0.5, 1] }] }, { tf: { a: true } }).score, 0.4);
  assert.equal(gradeSnapshot({ questions: [q] }, {}).score, 0);
});
test('missing answer keys never cause a false positive grade', () => {
  const result = gradeSnapshot({ questions: [
    { id: 'no-key', type: 'MULTIPLE_CHOICE', points: 2, payload: {} },
    { id: 'no-accepted', type: 'SHORT_ANSWER', points: 3, payload: {} },
    { id: 'blank-key', type: 'SHORT_ANSWER', points: 4, payload: { accepted_answers: [''] } },
  ] }, {});
  assert.equal(result.score, 0);
  assert.equal(result.needsGrading, true);
  assert.ok(result.gradedAnswers.every(a => a.isCorrect === null));
  assert.equal(validateResponses({ unknown: 'A' }, { questions: [{ id: 'no-key' }] }), false);
});
test('attempt layout is reproducible, keeps stable choice keys and never forwards answers', () => {
  const snapshot = { questions: Array.from({ length: 8 }, (_, i) => ({ id: `q${i}`, type: 'MULTIPLE_CHOICE', content: `Question ${i}`, payload: { correct: 'SECRET-ANSWER', choices: ['A', 'B', 'C', 'D'].map(key => ({ key, text: `${key}-${i}` })) }, solution: 'SECRET-SOLUTION' })) };
  const before = JSON.stringify(snapshot);
  const layout = createAttemptLayout(snapshot, 42, true, true);
  assert.deepEqual(layout, createAttemptLayout(snapshot, 42, true, true));
  assert.notDeepEqual(layout, createAttemptLayout(snapshot, 43, true, true));
  const presentation = examForAttempt(snapshot, layout);
  assert.deepEqual(presentation.questions.map(publicQuestionId), layout.questionOrder);
  for (const question of presentation.questions) {
    const id = publicQuestionId(question);
    assert.deepEqual(question.choices.map(c => c.key), layout.choiceOrder[id]);
    assert.deepEqual([...question.choices.map(c => c.key)].sort(), ['A', 'B', 'C', 'D']);
    for (const choice of question.choices) assert.equal(choice.text, `${choice.key}-${id.slice(1)}`);
  }
  assert.equal(JSON.stringify(presentation).includes('SECRET'), false);
  assert.equal(JSON.stringify(snapshot), before);
});

test('origin check accepts actual Host after Next canonicalization and rejects mismatches', () => {
  const request = (origin: string, host: string, extra = {}) => new NextRequest('http://localhost:3117/api/exams', { headers: { origin, host, ...extra } });
  assert.equal(isSameOriginMutation(request('http://127.0.0.1:3117', '127.0.0.1:3117')), true);
  assert.equal(isSameOriginMutation(request('http://evil.example', '127.0.0.1:3117')), false);
  assert.equal(isSameOriginMutation(request('https://127.0.0.1:3117', '127.0.0.1:3117')), false);
  assert.equal(isSameOriginMutation(request('http://127.0.0.1:3117/path', '127.0.0.1:3117')), false);
  assert.equal(isSameOriginMutation(request('http://evil.example', '127.0.0.1:3117', { 'x-forwarded-host': 'evil.example' })), false);
});
