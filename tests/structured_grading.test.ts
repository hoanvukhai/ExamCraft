import test from 'node:test';
import assert from 'node:assert/strict';
import type { Exam, Question } from '../src/types/exam';
import { sanitizeSnapshotForStudent, validateResponses } from '../src/lib/public-exam';
import { matchingDefinition, orderingDefinition } from '../src/lib/structured-question';
import { gradeSnapshot } from '../src/lib/attempt-grading';
import { gradeStudentExam } from '../src/lib/auto-grader';
import { freezeExamScoring } from '../src/lib/snapshot-scoring';

const matching = { id: 'match', type: 'matching', points: 3, matchingPairs: [{ id: 'PRIVATE-PAIR-A', left: 'First concept', right: 'Zebra' }, { id: 'PRIVATE-PAIR-B', left: 'Second concept', right: 'Apple' }] };
const ordering = { id: 'order', type: 'ordering', points: 2, correctOrder: ['Zebra', 'Apple', 'Mouse'] };
const metadata = { title: 'Fixture', subject: 'toan' as const, grade: 10, durationMinutes: 45, schoolName: '', departmentName: '' };

test('matching and ordering public prompts have independent keys without paired IDs or original answer order', () => {
  const publicExam = sanitizeSnapshotForStudent({ metadata, questions: [matching, ordering] });
  const serialized = JSON.stringify(publicExam);
  for (const hidden of ['PRIVATE-PAIR-A', 'PRIVATE-PAIR-B', 'matchingPairs', 'correctOrder', 'answerKey']) assert.equal(serialized.includes(hidden), false, hidden);
  assert.deepEqual(matchingDefinition(matching)?.display.right.map(item => item.text), ['Apple', 'Zebra']);
  assert.deepEqual(orderingDefinition(ordering)?.display.items.map(item => item.text), ['Apple', 'Mouse', 'Zebra']);
  assert.deepEqual(sanitizeSnapshotForStudent(publicExam), publicExam);
});

test('structured responses use presentation keys, validate drafts and grade the private configuration exactly', () => {
  const snapshot = { metadata, questions: [matching, ordering] };
  const correct = { match: { 'left-0': 'right-1', 'left-1': 'right-0' }, order: ['item-2', 'item-0', 'item-1'] };
  assert.equal(validateResponses(correct, snapshot), true);
  assert.equal(gradeSnapshot(snapshot, correct).score, 5);
  assert.equal(gradeSnapshot(snapshot, correct).needsGrading, false);
  assert.equal(gradeSnapshot(snapshot, { match: { 'left-0': 'right-0', 'left-1': 'right-1' }, order: ['item-0', 'item-1', 'item-2'] }).score, 0);
  assert.equal(validateResponses({ match: { 'left-0': 'unknown' } }, snapshot), false);
  assert.equal(validateResponses({ order: ['item-1', 'item-1'] }, snapshot), false);
  assert.equal(validateResponses({ order: ['unknown'] }, snapshot), false);
  assert.equal(validateResponses({ order: ['item-2'] }, snapshot), true);
});

test('missing keys or missing points are flagged for teacher review and explicit zero is preserved', () => {
  const missing = gradeSnapshot({ questions: [{ id: 'm', type: 'matching', points: 2 }] }, { m: 'Teacher will read' });
  assert.equal(missing.needsGrading, true);
  assert.equal(missing.gradedAnswers[0].isCorrect, null);
  const noPoints = gradeSnapshot({ questions: [{ ...matching, points: undefined }] }, { match: { 'left-0': 'right-1', 'left-1': 'right-0' } });
  assert.equal(noPoints.maxScore, 0);
  assert.equal(noPoints.needsGrading, true);
  const zero = gradeSnapshot({ questions: [{ ...matching, points: 0 }] }, { match: { 'left-0': 'right-1', 'left-1': 'right-0' } });
  assert.equal(zero.score, 0); assert.equal(zero.maxScore, 0); assert.equal(zero.needsGrading, false);
});

test('progressive scoring scales an explicit question override and never replaces zero with a template maximum', () => {
  const q = { id: 'tf', sectionId: 's', type: 'true_false_group', points: 4, sub_questions: [{ key: 'a', isCorrect: true }, { key: 'b', isCorrect: false }, { key: 'c', isCorrect: true }, { key: 'd', isCorrect: false }] };
  const snapshot = { sections: [{ id: 's', progressiveScoring: [0, 0.1, 0.25, 0.5, 1] }], questions: [q] };
  assert.equal(gradeSnapshot(snapshot, { tf: { a: true } }).score, 0.4);
  assert.equal(gradeSnapshot({ ...snapshot, questions: [{ ...q, points: 0 }] }, { tf: { a: true, b: false, c: true, d: false } }).score, 0);
  assert.equal(gradeSnapshot({ sections: [{ id: 's', progressiveScoring: [0, 2, 1] }], questions: [q] }, {}).needsGrading, true);
});

test('manual grade-10 mathematics never silently receives a graduation scoring template', () => {
  const question = { id: 'q', type: 'multiple_choice', difficulty: 'nhan_biet', content: 'Fixture', correct_answer: 'A', step_by_step_solution: '' } as Question;
  const document: Exam = { id: 'fixture', metadata, questions: [question], createdAt: '', updatedAt: '' };
  assert.deepEqual(freezeExamScoring(document).missing, ['q']);
  assert.equal(gradeStudentExam(document, { q: 'A' }).maxScore, 0);
  assert.equal(gradeStudentExam(document, { q: 'A' }).needsGrading, true);
  const configured = freezeExamScoring(document, [{ id: 'chosen', type: 'multiple_choice', pointsPerQuestion: 2 }]);
  assert.equal(configured.questions[0].points, 2);
  assert.equal(configured.questions[0].sectionId, 'chosen');
  assert.deepEqual(configured.missing, []);
});

test('legacy grader preserves false/zero and leaves missing TF answers unresolved', () => {
  const document: Exam = { id: 'fixture', metadata, questions: [
    { id: 'zero', type: 'short_answer', points: 0, correct_answer: '0', difficulty: 'nhan_biet', content: 'Fixture', step_by_step_solution: '' },
    { id: 'tf', type: 'true_false_group', points: 1, sub_questions: [{ key: 'a', content: 'Fixture', isCorrect: undefined }], difficulty: 'nhan_biet', content: 'Fixture', step_by_step_solution: '' },
  ], createdAt: '', updatedAt: '' };
  const result = gradeStudentExam(document, { zero: 0, tf: { a: false } });
  assert.equal(result.details[0].studentAnswer, 0);
  assert.equal(result.details[0].isCorrect, true);
  assert.equal(result.details[1].isCorrect, null);
  assert.equal(result.needsGrading, true);
});
