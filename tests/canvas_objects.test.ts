import test from 'node:test';
import assert from 'node:assert/strict';
import {
  codeOf,
  fieldFor,
  insertionFor,
  neighbourCode,
  parentCode,
  parseCode,
  questionOf,
  selectionChain,
} from '../src/lib/canvas-objects';
import type { Exam } from '../src/types/exam';

const q = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  type: 'multiple_choice',
  difficulty: 'thong_hieu',
  content: id,
  choices: [
    { key: 'A', text: '1' },
    { key: 'B', text: '2' },
  ],
  correct_answer: 'A',
  ...extra,
});
const exam = (): Exam =>
  ({
    id: 'x',
    createdAt: '2026',
    updatedAt: '2026',
    metadata: {
      title: 't',
      subject: 'toan',
      grade: 9,
      durationMinutes: 45,
      schoolName: '',
      departmentName: '',
    },
    passages: [{ id: 'p1', title: 'Văn bản 1', content: 'nội dung' }],
    questions: [
      q('q1'),
      q('q2'),
      q('q3', {
        type: 'essay',
        parts: [
          { id: 'pa', content: 'a' },
          { id: 'pb', content: 'b' },
        ],
      }),
    ],
    outline: [
      {
        id: 'part1',
        kind: 'part',
        title: 'TRẮC NGHIỆM',
        numbering: 'roman',
        children: [
          {
            id: 'g1',
            kind: 'group',
            passageId: 'p1',
            children: [
              { id: 'n1', kind: 'question', questionId: 'q1' },
              { id: 'n2', kind: 'question', questionId: 'q2' },
            ],
          },
        ],
      },
      {
        id: 'part2',
        kind: 'part',
        title: 'TỰ LUẬN',
        numbering: 'roman',
        children: [{ id: 'n3', kind: 'question', questionId: 'q3' }],
      },
    ],
  }) as unknown as Exam;

test('codes round trip, including ids that contain colons', () => {
  const objects = [
    { kind: 'exam' },
    { kind: 'part', id: 'part1' },
    { kind: 'group', id: 'legacy-group:1:p1' },
    { kind: 'question', id: 'legacy-question:q1' },
    { kind: 'choice', question: 'a:b', key: 'B' },
    { kind: 'figure', question: 'q1', id: 'f1' },
    { kind: 'insert', parent: null, after: 'n1' },
    { kind: 'insert', parent: 'part1', after: null },
    { kind: 'print', zone: 'footer', id: 'foot-page' },
    { kind: 'print', zone: 'student' },
  ] as const;
  for (const object of objects) assert.deepEqual(parseCode(codeOf(object)), object);
  assert.deepEqual(parseCode(''), { kind: 'exam' });
  assert.deepEqual(parseCode('zzz:1'), { kind: 'exam' });
});

test('the chain names every level and each step can be selected', () => {
  const e = exam();
  assert.deepEqual(
    selectionChain(e, 'exam').map((s) => s.label),
    ['Toàn đề'],
  );
  assert.deepEqual(
    selectionChain(e, 'question:q2').map((s) => s.label),
    ['Toàn đề', 'Phần I', 'Ngữ liệu Văn bản 1', 'Câu 2'],
  );
  assert.deepEqual(
    selectionChain(e, 'choice:q2:B')
      .map((s) => s.label)
      .slice(-2),
    ['Câu 2', 'Phương án B'],
  );
  assert.deepEqual(
    selectionChain(e, 'item:q3:pb').map((s) => s.label),
    ['Toàn đề', 'Phần II', 'Câu 3', 'Ý b'],
  );
  assert.equal(parentCode(e, 'choice:q2:B'), 'question:q2');
  assert.equal(parentCode(e, 'question:q2'), 'group:g1');
  assert.equal(parentCode(e, 'part:part1'), 'exam');
  assert.equal(parentCode(e, 'exam'), 'exam');
});

test('Thêm puts new content at the right point for each selection', () => {
  const e = exam();
  assert.deepEqual(insertionFor(e, 'question:q1'), { parentId: 'g1', afterId: 'n1' });
  assert.deepEqual(insertionFor(e, 'choice:q3:A'), { parentId: 'part2', afterId: 'n3' });
  assert.deepEqual(insertionFor(e, 'part:part1'), { parentId: 'part1', afterId: 'g1' });
  assert.deepEqual(insertionFor(e, 'group:g1'), { parentId: 'g1', afterId: 'n2' });
  assert.deepEqual(insertionFor(e, 'insert:part2:start'), { parentId: 'part2', afterId: null });
  assert.deepEqual(insertionFor(e, 'exam'), { parentId: 'part2', afterId: 'n3' });
});

test('arrow keys move between siblings and between rows of one question', () => {
  const e = exam();
  assert.equal(neighbourCode(e, 'question:q1', 1), 'question:q2');
  assert.equal(neighbourCode(e, 'question:q2', 1), undefined);
  assert.equal(neighbourCode(e, 'part:part1', 1), 'part:part2');
  assert.equal(neighbourCode(e, 'choice:q1:A', 1), 'choice:q1:B');
  assert.equal(neighbourCode(e, 'choice:q1:A', -1), undefined);
  assert.equal(neighbourCode(e, 'item:q3:pa', 1), 'item:q3:pb');
});

test('the Chi tiết form is told which field a selection belongs to', () => {
  assert.equal(fieldFor('question:q1'), 'content');
  assert.equal(fieldFor('choice:q1:B'), 'choice:B');
  assert.equal(fieldFor('statement:q1:a'), 'sub:a');
  assert.equal(fieldFor('part:p'), undefined);
  assert.equal(questionOf('figure:q1:f'), 'q1');
  assert.equal(questionOf('part:p'), undefined);
});
