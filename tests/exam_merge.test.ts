import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeExams } from '../src/lib/exam-merge';
import type { Exam } from '../src/types/exam';

const question = (id: string, content: string, extra: Record<string, unknown> = {}) => ({
  id,
  type: 'short_answer',
  difficulty: 'thong_hieu',
  content,
  points: 1,
  correct_answer: '1',
  accepted_answers: ['1'],
  step_by_step_solution: '',
  ...extra,
});
const exam = (questions: ReturnType<typeof question>[], title = 'Đề'): Exam =>
  ({
    id: 'x',
    createdAt: '2026',
    updatedAt: '2026',
    metadata: { title, subject: 'toan', grade: 9, durationMinutes: 45, schoolName: '', departmentName: '' },
    questions,
  }) as unknown as Exam;

test('different questions changed by two people both survive', () => {
  const base = exam([question('a', 'A'), question('b', 'B')]);
  const mine = exam([question('a', 'A đã sửa'), question('b', 'B')]);
  const theirs = exam([question('a', 'A'), question('b', 'B của người kia')]);
  const { exam: out, conflicts } = mergeExams(base, mine, theirs);
  assert.equal(conflicts.length, 0);
  assert.equal(out.questions.find((q) => q.id === 'a')!.content, 'A đã sửa');
  assert.equal(out.questions.find((q) => q.id === 'b')!.content, 'B của người kia');
});

test('different fields of one question merge, the same field is a conflict that keeps mine until chosen', () => {
  const base = exam([question('a', 'A')]);
  const mine = exam([question('a', 'A tôi', { points: 2 })]);
  const theirs = exam([question('a', 'A họ', { correct_answer: '9' })]);
  const first = mergeExams(base, mine, theirs);
  assert.deepEqual(
    first.conflicts.map((c) => c.code),
    ['q:a:content'],
  );
  const q = first.exam.questions[0];
  assert.equal(q.content, 'A tôi');
  assert.equal(q.points, 2);
  assert.equal((q as { correct_answer: string }).correct_answer, '9');
  const second = mergeExams(base, mine, theirs, { 'q:a:content': 'theirs' });
  assert.equal(second.exam.questions[0].content, 'A họ');
});

test('a question added by the other person arrives, and a delete against an edit asks', () => {
  const base = exam([question('a', 'A'), question('b', 'B')]);
  const mine = exam([question('a', 'A sửa'), question('b', 'B')]);
  const theirs = exam([question('b', 'B'), question('c', 'C mới')]);
  const { exam: out, conflicts } = mergeExams(base, mine, theirs);
  assert.deepEqual(
    conflicts.map((c) => c.code),
    ['q:a:delete'],
  );
  assert.deepEqual(out.questions.map((q) => q.id).sort(), ['a', 'b', 'c']);
});

test('exam information merges key by key', () => {
  const base = exam([question('a', 'A')]);
  const mine = exam([question('a', 'A')], 'Tên mới');
  const theirs = exam([question('a', 'A')]);
  (theirs.metadata as unknown as Record<string, unknown>).durationMinutes = 60;
  const { exam: out, conflicts } = mergeExams(base, mine, theirs);
  assert.equal(conflicts.length, 0);
  assert.equal(out.metadata.title, 'Tên mới');
  assert.equal(out.metadata.durationMinutes, 60);
});
