import test from 'node:test';
import assert from 'node:assert/strict';
import { wrapBareLatex } from '../src/lib/bare-latex';
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
