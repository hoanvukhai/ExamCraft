import test from 'node:test';
import assert from 'node:assert/strict';
import { balanceChoiceOrder } from '../src/lib/choice-balance';
import { generationPlanSchema, validateGeneratedExam } from '../src/lib/generation-plan';

const mc = (n: number, extra: Record<string, unknown> = {}) => ({ type: 'multiple_choice', content: `Câu ${n}`, choices: [{ key: 'A', text: `đúng ${n}` }, { key: 'B', text: 'sai 1' }, { key: 'C', text: 'sai 2' }, { key: 'D', text: 'sai 3' }], correct_answer: 'A', step_by_step_solution: 'Vì vậy kết quả là đúng.', ...extra });
const seeded = () => { let state = 7; return () => (state = (state * 48271) % 2147483647) / 2147483647; };

test('right answers that all sat in position A are spread over the other positions and the key follows the answer', () => {
  const before = Array.from({ length: 12 }, (_, i) => mc(i + 1));
  const after = balanceChoiceOrder(before, seeded());
  assert.ok(new Set(after.map(q => q.correct_answer)).size >= 3, after.map(q => q.correct_answer).join(''));
  after.forEach((q, i) => {
    assert.equal(q.choices.find(c => c.key === q.correct_answer)?.text, `đúng ${i + 1}`, 'the keyed choice is still the right one');
    assert.deepEqual(q.choices.map(c => c.key), ['A', 'B', 'C', 'D']);
    assert.deepEqual(q.choices.map(c => c.text).sort(), before[i].choices.map(c => c.text).sort());
  });
});

test('questions that cannot be reordered safely, and other types, are returned unchanged', () => {
  const pointing = mc(1, { choices: [{ key: 'A', text: 'x' }, { key: 'B', text: 'y' }, { key: 'C', text: 'Cả A và B đều đúng' }, { key: 'D', text: 'z' }] });
  const named = mc(2, { step_by_step_solution: 'Vậy chọn A.' });
  const essay = { type: 'essay', content: 'Em hãy nêu' };
  const noKey = mc(3, { correct_answer: undefined });
  for (const question of [pointing, named, essay, noKey]) assert.deepEqual(balanceChoiceOrder([question], seeded())[0], question);
});

test('the generated exam path keeps the exam valid after the right answers are moved', () => {
  const plan = generationPlanSchema.parse({ subject: 'toan', grade: 6, topic: 'Phân số', durationMinutes: 15, numMultipleChoice: 6 });
  const exam = validateGeneratedExam({ questions: Array.from({ length: 6 }, (_, i) => mc(i + 1)) }, plan);
  const balanced = balanceChoiceOrder(exam.questions, seeded());
  assert.equal(balanced.length, 6);
  for (const q of balanced) assert.ok(q.choices?.some(choice => choice.key === q.correct_answer));
});
