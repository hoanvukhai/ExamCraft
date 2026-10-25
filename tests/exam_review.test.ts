import test from 'node:test';
import assert from 'node:assert/strict';
import type { Exam, Question } from '../src/types/exam';
import { reviewExam } from '../src/lib/exam-review';

function fixture(questions: Partial<Question>[] = []): Exam {
  return { id: 'exam', metadata: { title: 'Đề thử', schoolName: '', departmentName: '', subject: 'toan', grade: 6, durationMinutes: 45 }, questions: questions.map((q, i) => ({ id: `q${i}`, type: 'essay', difficulty: 'thong_hieu', content: 'Câu thử', points: 0, step_by_step_solution: 'Chấm theo lời giải', ...q })), createdAt: '', updatedAt: '' };
}

test('review never treats an empty exam as complete and never mutates its input', () => {
  const exam = fixture(), before = JSON.stringify(exam);
  const result = reviewExam(exam);
  assert.ok(result.issues.some(i => i.code === 'empty'));
  assert.equal(result.pointsComplete, false);
  assert.equal(JSON.stringify(exam), before);
});

test('all seven structured types, false answers and zero points remain valid', () => {
  const exam = fixture([
    { type: 'multiple_choice', choices: [{ key: 'A', text: 'Một' }, { key: 'B', text: 'Hai' }], correct_answer: 'B' },
    { type: 'true_false_group', sub_questions: [{ key: 'a', content: 'Mệnh đề', isCorrect: false }] },
    { type: 'short_answer', accepted_answers: ['0'] }, { type: 'fill_blank', correct_answer: '0' },
    { type: 'matching', matchingPairs: [{ id: 'a', left: '1', right: 'Một' }, { id: 'b', left: '2', right: 'Hai' }] },
    { type: 'ordering', correctOrder: ['Một', 'Hai'] }, { type: 'essay' },
  ]);
  assert.deepEqual(reviewExam(exam).issues, []);
  assert.equal(reviewExam(exam).knownPointsHundredths, 0);
  assert.equal(reviewExam(exam).pointsComplete, true);
});

test('duplicate keys, invalid answer and absent links are individually located', () => {
  const exam = fixture([{ type: 'multiple_choice', choices: [{ key: 'A', text: '1' }, { key: 'A', text: '2' }], correct_answer: 'C', passageId: 'gone', sectionId: 'gone' }]);
  const issues = reviewExam(exam).issues;
  for (const code of ['duplicate-key', 'answer', 'passage-link', 'section-link']) assert.ok(issues.some(i => i.code === code && i.location === 'Câu 1'));
});

test('survey omits numeric answer requirements but still checks structure', () => {
  const exam = fixture([{ type: 'multiple_choice', points: undefined, choices: [{ key: 'A', text: 'Có' }, { key: 'B', text: 'Không' }] }]);
  exam.metadata.assessmentMode = 'survey';
  assert.deepEqual(reviewExam(exam).issues, []);
  assert.equal(reviewExam(exam).numeric, false);
  exam.questions[0].choices = [];
  assert.ok(reviewExam(exam).issues.some(i => i.code === 'choices'));
});

test('section points use the scoring contract, decimals sum exactly and unknown is not zero', () => {
  const exam = fixture([{ points: 0.1 }, { points: 0.2 }, { points: undefined, sectionId: 's' }]);
  exam.sections = [{ id: 's', name: 'Phần', pointsPerQuestion: 0.3 }];
  assert.equal(reviewExam(exam).knownPointsHundredths, 60);
  assert.equal(reviewExam(exam).pointsComplete, true);
  exam.questions[1].points = 0.123;
  exam.sections = [];
  assert.equal(reviewExam(exam).pointsComplete, false);
  assert.equal(reviewExam(exam).issues.filter(i => i.code === 'points').length, 2);
});

test('missing image and damaged plan are reported without fetching or altering data', () => {
  const exam = fixture([{ figures: [{ id: 'f', kind: 'image', data: {} }] }]);
  exam.metadata.examPlan = {} as NonNullable<Exam['metadata']['examPlan']>;
  const before = JSON.stringify(exam), issues = reviewExam(exam).issues;
  assert.ok(issues.some(i => i.code === 'image-source'));
  assert.ok(issues.some(i => i.code === 'plan-format'));
  assert.equal(JSON.stringify(exam), before);
});
