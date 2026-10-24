import assert from 'node:assert/strict';
import test from 'node:test';
import { manualGradeTarget, summarizeManualGrades } from '../src/lib/manual-grading';
const fixture = (mode = 'scored') => ({ metadata: { assessmentMode: mode }, questions: [
  { id: 'essay', type: 'ESSAY', content: 'Tự luận', points: 1 },
  { id: 'choice', type: 'MULTIPLE_CHOICE', content: 'Chọn', points: 1, correct_answer: 'A' },
  { id: 'zero', type: 'ESSAY', content: 'Câu không điểm', points: 0 },
] });
const status = (number: number) => (e: unknown) => !!e && typeof e === 'object' && 'status' in e && e.status === number;
test('manual grading accepts two decimals such as .29 and exact zero while rejecting extra precision, negative and excess marks', () => {
  assert.equal(manualGradeTarget(fixture(), 'essay', .29).earned, .29);
  assert.equal(manualGradeTarget(fixture(), 'essay', 0).earned, 0);
  assert.equal(manualGradeTarget(fixture(), 'zero', 0).maxPoints, 0);
  assert.equal(manualGradeTarget(fixture(), 'essay', 1).isCorrect, true);
  assert.equal(manualGradeTarget(fixture(), 'essay', .5).isCorrect, false);
  for (const value of [-1, 1.01, Infinity, NaN, .291, '0.29', null, undefined]) assert.throws(() => manualGradeTarget(fixture(), 'essay', value), status(400));
  assert.throws(() => manualGradeTarget(fixture(), 'missing', 0), status(400));
});
test('manual grading refuses a missing score configuration without implicitly giving .25 or another template', () => {
  const snapshot = { questions: [{ id: 'missing', type: 'ESSAY', content: 'Chưa cấu hình' }] };
  assert.throws(() => manualGradeTarget(snapshot, 'missing', 0), status(409));
  assert.equal(summarizeManualGrades(snapshot, [{ questionKey: 'missing', response: null, earned: 0, manualScore: 0, isCorrect: null }]).needsGrading, true);
});
test('manual grading records comments for surveys and comment-only work without inventing numeric totals', () => {
  const comment = manualGradeTarget(fixture('comment_only'), 'essay', undefined);
  assert.equal(comment.numeric, false); assert.equal(comment.earned, 0);
  assert.throws(() => manualGradeTarget(fixture('survey'), 'essay', 1), status(400));
  const survey = summarizeManualGrades(fixture('survey'), []);
  assert.deepEqual(survey, { score: null, maxScore: null, needsGrading: false });
  const pending = summarizeManualGrades(fixture('comment_only'), []);
  assert.deepEqual(pending, { score: null, maxScore: null, needsGrading: true });
  const reviewed = summarizeManualGrades(fixture('comment_only'), ['essay', 'choice', 'zero'].map(questionKey => ({ questionKey, response: null, earned: 0, manualScore: 0, isCorrect: null })));
  assert.deepEqual(reviewed, { score: null, maxScore: null, needsGrading: false });
});
test('summary includes only snapshot questions, preserves partial and zero marks, clears pending when all manual items are reviewed', () => {
  const answers = [
    { questionKey: 'essay', response: 'Lời giải', earned: .29, manualScore: .29, isCorrect: false },
    { questionKey: 'choice', response: 'A', earned: 1, manualScore: null, isCorrect: true },
    { questionKey: 'zero', response: 'Có trả lời', earned: 0, manualScore: 0, isCorrect: null },
    { questionKey: 'not-in-exam', response: 'X', earned: 100, manualScore: 100, isCorrect: true },
  ];
  assert.deepEqual(summarizeManualGrades(fixture(), answers), { score: 1.29, maxScore: 2, needsGrading: false });
  assert.equal(summarizeManualGrades(fixture(), answers.filter(a => a.questionKey !== 'zero')).needsGrading, true);
  assert.equal(summarizeManualGrades(fixture(), answers.map(a => a.questionKey === 'essay' ? { ...a, manualScore: -1 } : a)).needsGrading, true);
});
test('missing true-false responses never match a false answer by default', () => {
  const snapshot = { metadata: { assessmentMode: 'scored' }, questions: [{ id: 'tf', type: 'TRUE_FALSE_GROUP', points: 1, sub_questions: [{ key: 'a', isCorrect: false }, { key: 'b', isCorrect: false }] }] };
  const result = summarizeManualGrades(snapshot, [{ questionKey: 'tf', response: {}, earned: 0, manualScore: null, isCorrect: false }]);
  assert.equal(result.score, 0);
});

test('teacher-only snapshot adapter retains canonical flat and legacy answers, solutions, structured keys and passages', async () => {
  const { teacherSnapshotQuestions } = await import('../src/lib/manual-grading');
  const questions = teacherSnapshotQuestions({ questions: [
    { id: 'mc', type: 'multiple_choice', correct_answer: 'B', choices: [{ key: 'B', text: 'Đúng' }], step_by_step_solution: 'Giải thích', passageId: 'reading' },
    { id: 'tf', type: 'true_false_group', sub_questions: [{ key: 'a', content: 'Ý', isCorrect: false }] },
    { id: 'short', type: 'short_answer', accepted_answers: ['0', 'không'] },
    { id: 'match', type: 'matching', matchingPairs: [{ id: 'p', left: 'Một', right: '1' }] },
    { id: 'order', type: 'ordering', correctOrder: ['A', 'B'] },
    { id: 'legacy', type: 'MULTIPLE_CHOICE', payload: { correct: 'C', choices: [{ key: 'C', text: 'Cũ' }] }, solution: 'Giải cũ' },
  ] });
  assert.equal(questions[0].type, 'MULTIPLE_CHOICE');
  assert.equal(questions[0].payload.correct, 'B'); assert.equal(questions[0].solution, 'Giải thích'); assert.equal(questions[0].passageId, 'reading');
  assert.deepEqual(questions[1].payload.sub_questions, [{ key: 'a', content: 'Ý', isCorrect: false }]);
  assert.deepEqual(questions[2].payload.accepted_answers, ['0', 'không']);
  assert.deepEqual(questions[3].payload.matchingPairs, [{ id: 'p', left: 'Một', right: '1' }]);
  assert.deepEqual(questions[4].payload.correctOrder, ['A', 'B']);
  assert.equal(questions[5].payload.correct, 'C'); assert.equal(questions[5].solution, 'Giải cũ');
});
