import test from 'node:test';
import assert from 'node:assert/strict';
import { applyAnswerCorrection, autoResult, correctionHistory, correctionRevision, readAnswerKey, regradableQuestions } from '../src/lib/answer-correction';
import { ApiError } from '../src/lib/api-error';

const meta = { at: '2026-10-25T00:00:00.000Z', by: 'teacher', reason: 'Đáp án nhập sai' };
const snapshot = () => ({
  metadata: { assessmentMode: 'scored' },
  sections: [{ id: 's1', pointsPerQuestion: 1, questions: [
    { id: 'mc', type: 'multiple_choice', sectionId: 's1', content: 'MC', choices: [{ key: 'A', text: '1' }, { key: 'B', text: '2' }], correct_answer: 'A', points: 1 },
    { id: 'sa', type: 'short_answer', sectionId: 's1', content: 'SA', correct_answer: '0.5', accepted_answers: ['0.5'], points: 2, payload: { correct: '0.5', accepted_answers: ['0.5'] } },
    { id: 'es', type: 'essay', sectionId: 's1', content: 'ES', points: 3 },
  ] }],
  questions: [
    { id: 'mc', type: 'multiple_choice', sectionId: 's1', content: 'MC', choices: [{ key: 'A', text: '1' }, { key: 'B', text: '2' }], correct_answer: 'A', points: 1 },
    { id: 'sa', type: 'short_answer', sectionId: 's1', content: 'SA', correct_answer: '0.5', accepted_answers: ['0.5'], points: 2, payload: { correct: '0.5', accepted_answers: ['0.5'] } },
    { id: 'es', type: 'essay', sectionId: 's1', content: 'ES', points: 3 },
  ],
});

test('a corrected multiple choice key is applied everywhere and graded under the new key only', () => {
  const original = snapshot(), frozen = JSON.stringify(original);
  const result = applyAnswerCorrection(original, 'mc', { correctAnswer: 'b' }, meta);
  assert.equal(JSON.stringify(original), frozen, 'the input snapshot is never mutated');
  assert.deepEqual(regradableQuestions(result.snapshot).map(question => question.id), ['mc', 'sa'], 'the essay is not auto-regradable');
  assert.equal(readAnswerKey((result.snapshot.questions as Record<string, unknown>[])[0]).correct, 'B');
  assert.equal((result.snapshot.sections as { questions: Record<string, unknown>[] }[])[0].questions[0].correct_answer, 'B', 'section copy changes too');
  assert.deepEqual(autoResult(result.snapshot, 'mc', 'B'), { isCorrect: true, earned: 1 });
  assert.deepEqual(autoResult(result.snapshot, 'mc', 'A'), { isCorrect: false, earned: 0 });
  assert.deepEqual(autoResult(original, 'mc', 'A'), { isCorrect: true, earned: 1 }, 'the old snapshot still grades the old way');
});

test('short answer keeps payload and top-level keys in step and normalizes the accepted list', () => {
  const result = applyAnswerCorrection(snapshot(), 'sa', { acceptedAnswers: [' 1/2 ', '0,5', '1/2', ''] }, meta);
  const key = readAnswerKey((result.snapshot.questions as Record<string, unknown>[])[1]);
  assert.deepEqual(key, { correct: '1/2', accepted: ['1/2', '0,5'] });
  assert.equal(autoResult(result.snapshot, 'sa', '0.5')?.isCorrect, true, '0,5 and 0.5 are the same number to the grader');
  assert.equal(autoResult(result.snapshot, 'sa', '2')?.isCorrect, false);
});

test('only auto-graded types, real choices and non-empty keys are accepted', () => {
  const fail = (key: string, change: Parameters<typeof applyAnswerCorrection>[2], code?: string) => assert.throws(() => applyAnswerCorrection(snapshot(), key, change, meta), (error: unknown) => error instanceof ApiError && (code === undefined || error.code === code));
  fail('es', { correctAnswer: 'A' }, 'REGRADE_TYPE_UNSUPPORTED');
  fail('mc', { correctAnswer: 'Z' });
  fail('mc', {});
  fail('sa', { acceptedAnswers: [' '] });
  fail('missing', { correctAnswer: 'A' });
});

test('history and revision change with every correction so a stale form is detectable', () => {
  const first = applyAnswerCorrection(snapshot(), 'mc', { correctAnswer: 'B' }, meta);
  assert.notEqual(correctionRevision('a1', snapshot(), 'mc'), correctionRevision('a1', first.snapshot, 'mc'));
  assert.notEqual(correctionRevision('a1', first.snapshot, 'mc'), correctionRevision('a2', first.snapshot, 'mc'));
  const second = applyAnswerCorrection(first.snapshot, 'mc', { correctAnswer: 'A' }, { ...meta, reason: 'Sửa lại' });
  const history = correctionHistory(second.snapshot, 'mc');
  assert.equal(history.length, 2);
  assert.deepEqual((history[1] as { before: unknown }).before, { correct: 'B', accepted: [] });
  assert.equal(correctionHistory(second.snapshot, 'sa').length, 0);
  assert.notEqual(correctionRevision('a1', first.snapshot, 'mc'), correctionRevision('a1', second.snapshot, 'mc'));
});
