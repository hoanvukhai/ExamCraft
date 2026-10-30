import test from 'node:test';
import assert from 'node:assert/strict';
import { diffExam, makeChange, mergeChange, revertChange } from '../src/lib/undo-history';
import { insertOutlineNodes } from '../src/lib/exam-outline';
import type { Exam } from '../src/types/exam';

const q = (id: string, content = id) => ({
  id,
  type: 'short_answer',
  difficulty: 'thong_hieu',
  content,
  correct_answer: '1',
  accepted_answers: ['1'],
  step_by_step_solution: '',
});
const base = (): Exam =>
  ({
    id: 'x',
    createdAt: '2026',
    updatedAt: '2026',
    metadata: {
      title: 'Đề',
      subject: 'toan',
      grade: 9,
      durationMinutes: 45,
      schoolName: '',
      departmentName: '',
    },
    questions: [q('q1'), q('q2')],
    outline: [
      {
        id: 'p',
        kind: 'part',
        title: '',
        sectionId: null,
        children: [
          { id: 'n1', kind: 'question', questionId: 'q1' },
          { id: 'n2', kind: 'question', questionId: 'q2' },
        ],
      },
    ],
  }) as unknown as Exam;

test('the diff names only what changed', () => {
  const before = base();
  const after = {
    ...before,
    questions: [{ ...before.questions[0], content: 'mới' }, before.questions[1]],
    metadata: { ...before.metadata, title: 'Đề mới' },
  } as Exam;
  const diff = diffExam(before, after);
  assert.deepEqual(diff.questions, ['q1']);
  assert.deepEqual(diff.metadata, ['title']);
  assert.equal(diff.outline, false);
  assert.equal(makeChange(before, before), null);
});

test('undo puts back the edited question and the title, redo applies them again', () => {
  const before = base();
  const after = {
    ...before,
    questions: [{ ...before.questions[0], content: 'mới' }, before.questions[1]],
    metadata: { ...before.metadata, title: 'Đề mới' },
  } as Exam;
  const change = makeChange(before, after)!;
  const undone = revertChange(after, change);
  assert.equal(undone.exam.questions[0].content, 'q1');
  assert.equal(undone.exam.metadata.title, 'Đề');
  assert.deepEqual(undone.skipped, []);
  const redone = revertChange(undone.exam, { ...change, before: change.after, after: change.before });
  assert.equal(redone.exam.questions[0].content, 'mới');
});

test('undo leaves alone what someone else changed afterwards, and says so', () => {
  const before = base();
  const mine = {
    ...before,
    questions: [{ ...before.questions[0], content: 'của tôi' }, before.questions[1]],
  } as Exam;
  const change = makeChange(before, mine)!;
  const theirs = {
    ...mine,
    questions: [
      { ...mine.questions[0], content: 'của Cô Lan' },
      { ...mine.questions[1], content: 'q2 sửa' },
    ],
  } as Exam;
  const result = revertChange(theirs, change);
  assert.equal(result.exam.questions[0].content, 'của Cô Lan');
  assert.equal(result.exam.questions[1].content, 'q2 sửa');
  assert.equal(result.skipped.length, 1);
  assert.equal(result.changed, false);
});

test('undoing an insertion removes the new question and its place in the outline', () => {
  const before = base();
  const after = insertOutlineNodes(
    before,
    { parentId: 'p', afterId: 'n1' },
    [{ id: 'n3', kind: 'question', questionId: 'q3' }],
    [q('q3') as never],
  );
  const change = makeChange(before, after)!;
  assert.equal(diffExam(before, after).outline, true);
  const undone = revertChange(after, change);
  assert.deepEqual(
    undone.exam.questions.map((item) => item.id),
    ['q1', 'q2'],
  );
  assert.deepEqual(
    undone.exam.outline![0].children!.map((n) => n.id),
    ['n1', 'n2'],
  );
});

test('undoing a deletion brings the question back where it was', () => {
  const before = base();
  const after = {
    ...before,
    questions: [before.questions[1]],
    outline: [{ ...before.outline![0], children: [before.outline![0].children![1]] }],
  } as Exam;
  const change = makeChange(before, after)!;
  const undone = revertChange(after, change);
  assert.deepEqual(
    undone.exam.questions.map((item) => item.id),
    ['q1', 'q2'],
  );
});

test('fast edits to the same things merge into one step, slower or different ones do not', () => {
  const a = base();
  const b = { ...a, metadata: { ...a.metadata, title: 'A' } } as Exam;
  const c = { ...b, metadata: { ...b.metadata, title: 'AB' } } as Exam;
  const first = makeChange(a, b, 1000)!,
    second = makeChange(b, c, 1300)!;
  const merged = mergeChange(first, second);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].before.metadata.title, 'Đề');
  assert.equal(merged[0].after.metadata.title, 'AB');
  assert.equal(mergeChange(first, makeChange(b, c, 5000)!).length, 2);
  const other = makeChange(
    b,
    { ...b, questions: [{ ...b.questions[0], content: 'z' }, b.questions[1]] } as Exam,
    1100,
  )!;
  assert.equal(mergeChange(first, other).length, 2);
});
