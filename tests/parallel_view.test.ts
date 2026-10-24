import test from 'node:test';
import assert from 'node:assert/strict';
import { parallelAnswer, parallelRows } from '../src/lib/parallel-view';
import type { Question } from '../src/types/exam';

const q = (extra: Partial<Question>): Question => ({ id: 'q', type: 'multiple_choice', difficulty: 'nhan_biet', content: 'c', step_by_step_solution: '', ...extra });

test('an unset answer is never presented as an answer', () => {
  for (const type of ['multiple_choice', 'short_answer', 'fill_blank', 'matching', 'ordering', 'true_false_group'] as const) {
    assert.equal(parallelAnswer(q({ type })).headline, 'Chưa có đáp án', type);
  }
  assert.equal(parallelAnswer(q({ type: 'multiple_choice', correct_answer: '  ' })).headline, 'Chưa có đáp án');
});

test('multiple choice, short answer and fill-in show the key; zero is a real answer', () => {
  assert.equal(parallelAnswer(q({ correct_answer: 'B' })).headline, 'Đáp án: B');
  assert.equal(parallelAnswer(q({ type: 'short_answer', correct_answer: '0' })).headline, 'Đáp số: 0');
  const fill = parallelAnswer(q({ type: 'fill_blank', correct_answer: '1,5', accepted_answers: ['1,5', '3/2', ' ', '1.5'] }));
  assert.equal(fill.headline, 'Đáp số: 1,5'); assert.deepEqual(fill.details, ['Cũng chấp nhận: 3/2; 1.5']);
});

test('true/false keeps false as Sai and an undecided item as missing', () => {
  const a = parallelAnswer(q({ type: 'true_false_group', sub_questions: [{ key: 'a', content: '', isCorrect: true, explanation: 'vì x' }, { key: 'b', content: '', isCorrect: false }, { key: 'c', content: '' }] }));
  assert.equal(a.headline, 'a) Đúng; b) Sai; c) Chưa có đáp án');
  assert.deepEqual(a.details, ['a) vì x']);
});

test('matching and ordering show the correct structure with readable labels', () => {
  assert.equal(parallelAnswer(q({ type: 'matching', matchingPairs: [{ id: '1', left: '1', right: 'Một' }, { id: '2', left: '2', right: 'Hai' }] })).headline, '1 → Một; 2 → Hai');
  assert.equal(parallelAnswer(q({ type: 'ordering', choices: [{ key: 'a', text: 'Bước hai' }, { key: 'b', text: 'Bước một' }], correctOrder: ['b', 'a'] })).headline, 'Bước một → Bước hai');
  assert.equal(parallelAnswer(q({ type: 'ordering', correctOrder: ['x', 'y'] })).headline, 'x → y');
});

test('essay lists rubric rows, keeps zero-point rows, and returns the trimmed solution', () => {
  const r = parallelAnswer(q({ type: 'essay', rubric: [{ criterion: 'Lập luận', maxPoints: 2 }, { criterion: 'Chuyên cần', maxPoints: 0 }], step_by_step_solution: '  Lời giải  ' }));
  assert.equal(r.headline, 'Chấm theo tiêu chí'); assert.deepEqual(r.details, ['Lập luận: 2 điểm', 'Chuyên cần: 0 điểm']); assert.equal(r.solution, 'Lời giải');
  assert.equal(parallelAnswer(q({ type: 'essay' })).headline, 'Giáo viên đánh giá');
});

test('the helper does not change the question it reads', () => {
  const original = q({ type: 'fill_blank', correct_answer: 'x', accepted_answers: ['x', 'y'] }); const before = JSON.stringify(original);
  parallelAnswer(original); assert.equal(JSON.stringify(original), before);
});

test('a shared passage appears once, before its first question, and no question is dropped', () => {
  const passages = [{ id: 'p1', content: 'Ngữ liệu' }, { id: 'p2', content: 'Khác' }];
  const questions = [q({ id: 'a' }), q({ id: 'b', passageId: 'p1' }), q({ id: 'c', passageId: 'p1' }), q({ id: 'd', passageId: 'missing' }), q({ id: 'e', passageId: 'p2' })];
  const rows = parallelRows(questions, passages);
  assert.deepEqual(rows.map(row => row.kind === 'passage' ? 'P:' + row.passage.id : 'Q:' + row.question.id), ['Q:a', 'P:p1', 'Q:b', 'Q:c', 'Q:d', 'P:p2', 'Q:e']);
  assert.deepEqual(rows.filter(row => row.kind === 'question').map(row => row.kind === 'question' && row.index), [0, 1, 2, 3, 4]);
  assert.equal(parallelRows(questions, undefined).length, 5, 'without passages only questions remain');
});
