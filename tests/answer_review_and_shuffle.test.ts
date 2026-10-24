import test from 'node:test';
import assert from 'node:assert/strict';
import { compareAnswerReview } from '../src/lib/answer-review';
import { generateShuffledExams } from '../src/lib/shuffler';
import { validateCopilotResult } from '../src/lib/copilot-result';
import type { Exam, Question, QuestionType } from '../src/types/exam';

const question = (type: QuestionType, id: string = type): Question => ({ id, type, difficulty: 'thong_hieu', content: 'Nội dung', step_by_step_solution: '' });
const review = { solvedAnswer: '', recommendation: 'match', discrepancies: [] };
const exam = (questions: Question[]): Exam => ({ id: 'draft', createdAt: '2026-10-22', updatedAt: '2026-10-22', metadata: { title: 'Thử nghiệm', subject: 'toan', grade: 6, durationMinutes: 45, schoolName: '', departmentName: '', academicYear: '2026–2027' }, questions });

test('review refuses incomplete, duplicate or unknown true/false keys', () => {
  const q = { ...question('true_false_group'), sub_questions: [{ key: 'a', content: 'A', isCorrect: true }, { key: 'b', content: 'B', isCorrect: false }] };
  const a = { key: 'a', isCorrect: true, reason: '' }, b = { key: 'b', isCorrect: false, reason: '' };
  for (const assessments of [[], [a], [a, a], [a, { ...b, key: 'c' }]]) assert.equal(compareAnswerReview(q, { ...review, subQuestionsAssessment: assessments }).isMatch, false);
  assert.equal(compareAnswerReview(q, { ...review, subQuestionsAssessment: [a, b] }).isMatch, true);
  assert.equal(compareAnswerReview({ ...q, sub_questions: [{ key: 'a', content: 'No key' }] }, { ...review, subQuestionsAssessment: [a] }).complete, false);
});

test('review does not match empty answers, essay, prose pretending to be a choice, or flagged ambiguity', () => {
  assert.equal(compareAnswerReview(question('short_answer'), review).isMatch, false);
  assert.equal(compareAnswerReview(question('essay'), review).complete, false);
  const q = { ...question('multiple_choice'), choices: [{ key: 'A', text: 'Một' }, { key: 'B', text: 'Hai' }], correct_answer: 'A' };
  assert.equal(compareAnswerReview(q, { ...review, solvedAnswer: 'Answer A' }).isMatch, false);
  assert.equal(compareAnswerReview(q, { ...review, solvedAnswer: 'A', recommendation: 'ambiguous' }).isMatch, false);
  assert.equal(compareAnswerReview(q, { ...review, solvedAnswer: 'A' }).isMatch, true);
});

test('shuffle preserves all seven types, missing answers and shared passage order', () => {
  const types: QuestionType[] = ['multiple_choice', 'true_false_group', 'short_answer', 'essay', 'fill_blank', 'matching', 'ordering'];
  const original = exam(types.map(type => question(type)));
  original.questions[0].choices = [{ key: 'A', text: 'Một' }, { key: 'B', text: 'Hai' }];
  const source = JSON.stringify(original);
  for (const variant of generateShuffledExams(original, 3)) {
    assert.equal(variant.exam.questions.length, 7);
    assert.equal(new Set(variant.exam.questions.map(q => q.id)).size, 7);
    assert.equal(variant.exam.questions.find(q => q.type === 'multiple_choice')?.correct_answer, undefined);
  }
  original.questions.forEach(q => { q.sectionId = 'section'; });
  assert.deepEqual(generateShuffledExams(original, 1)[0].exam.questions.map(q => q.id), original.questions.map(q => q.id));
  original.questions.forEach(q => { delete q.sectionId; });
  assert.equal(JSON.stringify(original), source);
});

test('copilot rejects contradictory targets and cannot mark generated changes verified', () => {
  const original = exam([question('essay', 'one'), question('essay', 'two')]);
  assert.throws(() => validateCopilotResult({ type: 'action', action: 'delete_question', targetQuestionId: 'one', targetQuestionIndex: 2 }, original));
  assert.throws(() => validateCopilotResult({ type: 'action', action: 'delete_question', targetQuestionId: 'two' }, original, 'one'));
  const result = validateCopilotResult({ type: 'action', action: 'modify_single_question', targetQuestionId: 'one', modifiedQuestion: { content: 'Đã sửa', status: 'verified', verifiedBy: 'human' } }, original);
  assert.ok('modifiedQuestion' in result);
  assert.equal(result.modifiedQuestion?.status, 'draft');
  assert.equal(result.modifiedQuestion?.verifiedBy, 'none');
  assert.equal(result.modifiedQuestion?.id, 'one');
  assert.equal(validateCopilotResult({ type: 'action', action: 'modify_all_numbers' }, original).type, 'clarification');
});

test('shuffle respects pinned choices and builds keys for fill, matching and repeated ordering text', () => {
 const q = { ...question('multiple_choice'), choices: [{ key: 'A', text: 'Một', pinned: true }, { key: 'B', text: 'Hai' }], correct_answer: 'B' };
 const source = exam([q, { ...question('fill_blank'), accepted_answers: ['one', '1'] }, { ...question('matching'), matchingPairs: [{ id: 'a', left: 'A', right: 'Z' }, { id: 'b', left: 'B', right: 'X' }] }, { ...question('ordering'), correctOrder: ['z', 'a', 'z'] }]);
 source.questions.forEach(q => { q.sectionId = 'fixed'; });
 for (const variant of generateShuffledExams(source, 3)) {
   assert.deepEqual(variant.exam.questions[0].choices, q.choices);
   assert.equal(variant.answerKey[2], 'one / 1');
   assert.equal(variant.answerKey[3], '1–2; 2–1');
   assert.equal(variant.answerKey[4], '2 → 1 → 3');
 }
});
