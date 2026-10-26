import test from 'node:test';
import assert from 'node:assert/strict';
import { wrapBareLatex } from '../src/lib/bare-latex';
import { normalizeMathDelimiters } from '../src/lib/math-delimiters';
import { validateGeneratedExam, generationPlanSchema } from '../src/lib/generation-plan';

test('a choice written with LaTeX commands but no dollar signs becomes a formula, with units as plain text', () => {
  assert.equal(wrapBareLatex('4\\pi cm'), '$4\\pi \\text{cm}$');
  assert.equal(wrapBareLatex('\\pi/3 rad'), '$\\pi/3 \\text{rad}$');
  assert.equal(wrapBareLatex('\\frac{1}{2}'), '$\\frac{1}{2}$');
});

test('text that already has a formula, or has no LaTeX command, is returned unchanged', () => {
  for (const text of ['$4\\pi$ cm', 'Biên độ 6 cm', '12,56', '', 'Giá $5 và \\pi']) assert.equal(wrapBareLatex(text), text);
});

test('generated choices and true/false statements are normalised before they reach the teacher', () => {
  const plan = generationPlanSchema.parse({ subject: 'vat_ly', grade: 11, topic: 'Dao động', durationMinutes: 15, numMultipleChoice: 1, numTrueFalse: 1 });
  const exam = validateGeneratedExam({ questions: [
    { type: 'multiple_choice', content: 'Pha ban đầu?', choices: [{ key: 'A', text: '-\\pi/6 rad' }, { key: 'B', text: '5 cm' }], correct_answer: 'A', step_by_step_solution: 'x' },
    { type: 'true_false_group', content: 'Xét', sub_questions: [{ key: 'a', content: 'Tần số góc là 2\\pi f', isCorrect: true }, { key: 'b', content: 'Không có công thức', isCorrect: false }], step_by_step_solution: 'x' },
  ] }, plan);
  assert.equal(exam.questions[0].choices?.[0].text, '$-\\pi/6 \\text{rad}$'); assert.equal(exam.questions[0].choices?.[1].text, '5 cm');
  assert.equal(exam.questions[1].sub_questions?.[0].content, 'Tần số góc là $2\\pi$ f');
  assert.equal(exam.questions[1].sub_questions?.[1].content, 'Không có công thức');
});

test('formulas written between backslash-parentheses or backslash-brackets are rewritten to dollar signs everywhere in a generated question', () => {
  assert.equal(normalizeMathDelimiters('Tìm \\(\\sqrt{2x-6}\\) và \\[x^2\\]'), 'Tìm $\\sqrt{2x-6}$ và $$x^2$$');
  assert.equal(normalizeMathDelimiters('Không có công thức, $a$ giữ nguyên'), 'Không có công thức, $a$ giữ nguyên');
  const plan = generationPlanSchema.parse({ subject: 'toan', grade: 9, topic: 'Căn', durationMinutes: 15, numShortAnswer: 1 });
  const exam = validateGeneratedExam({ questions: [{ type: 'short_answer', content: 'Điều kiện của \\(\\sqrt{x}\\)', correct_answer: 'x >= 0', step_by_step_solution: 'Cần \\(x \\ge 0\\)' }] }, plan);
  assert.equal(exam.questions[0].content, 'Điều kiện của $\\sqrt{x}$'); assert.equal(exam.questions[0].step_by_step_solution, 'Cần $x \\ge 0$');
});

test('a field the model wrote as null is the same as a missing field, so comment-only questions are not refused for their empty score and answer', () => {
  const plan = generationPlanSchema.parse({ subject: 'mi_thuat', grade: 6, topic: 'Màu sắc', durationMinutes: 15, assessmentMode: 'comment_only', numMultipleChoice: 1, numEssay: 1 });
  const exam = validateGeneratedExam({ questions: [
    { type: 'multiple_choice', content: 'Màu nào là màu nóng?', choices: [{ key: 'A', text: 'Đỏ' }, { key: 'B', text: 'Xanh' }], correct_answer: null, points: null, step_by_step_solution: null },
    { type: 'essay', content: 'Em nhận xét bức tranh.', correct_answer: null, points: null, accepted_answers: [null, 'x'] },
  ] }, plan);
  assert.equal(exam.questions.length, 2); assert.equal(exam.questions[0].points, undefined); assert.equal(exam.questions[0].correct_answer, undefined);
  assert.deepEqual(exam.questions[1].accepted_answers, ['x']);
});
