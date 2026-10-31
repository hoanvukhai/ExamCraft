import test from 'node:test';
import assert from 'node:assert/strict';
import { copyNodes, pasteClipboard, parseClipboard } from '../src/lib/exam-clipboard';
import type { Exam } from '../src/types/exam';

const q = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  type: 'short_answer',
  difficulty: 'thong_hieu',
  content: id,
  correct_answer: '1',
  accepted_answers: ['1'],
  step_by_step_solution: '',
  ...extra,
});
const exam = (): Exam =>
  ({
    id: 'x',
    createdAt: '',
    updatedAt: '',
    metadata: {
      title: 't',
      subject: 'toan',
      grade: 9,
      durationMinutes: 45,
      schoolName: '',
      departmentName: '',
    },
    passages: [{ id: 'p1', title: 'Văn bản', content: 'ND' }],
    questions: [q('q1', { passageId: 'p1' }), q('q2', { passageId: 'p1' }), q('q3', { locked: true })],
    outline: [
      {
        id: 'part1',
        kind: 'part',
        title: 'I',
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
          { id: 'n3', kind: 'question', questionId: 'q3' },
        ],
      },
    ],
  }) as unknown as Exam;
let counter = 0;
const newId = () => 'id' + ++counter;

test('copying a group takes its questions and passage once, and not a node twice', () => {
  const payload = copyNodes(exam(), ['g1', 'n1'])!;
  assert.equal(payload.nodes.length, 1);
  assert.deepEqual(
    payload.questions.map((item) => item.id),
    ['q1', 'q2'],
  );
  assert.deepEqual(
    payload.passages.map((item) => item.id),
    ['p1'],
  );
  assert.equal(copyNodes(exam(), ['nope']), null);
});

test('pasting into the same exam gives new ids, shares the unchanged passage and drops locks', () => {
  const source = exam();
  const payload = copyNodes(source, ['g1', 'n3'])!;
  const pasted = pasteClipboard(source, payload, { parentId: 'part1', afterId: 'n3' }, newId);
  assert.equal(pasted.questions.length, 6);
  assert.equal(new Set(pasted.questions.map((item) => item.id)).size, 6);
  assert.equal(pasted.passages!.length, 1, 'the same passage is shared');
  const copiedLocked = pasted.questions.find((item) => item.content === 'q3' && item.id !== 'q3')!;
  assert.equal(copiedLocked.locked, undefined);
  assert.equal(source.questions.length, 3, 'the source exam is untouched');
});

test('pasting into another exam copies the passage; a part lands at the top level', () => {
  const other = {
    ...exam(),
    id: 'y',
    passages: [],
    questions: [q('z1')],
    outline: [
      {
        id: 'pz',
        kind: 'part',
        title: '',
        sectionId: null,
        children: [{ id: 'nz', kind: 'question', questionId: 'z1' }],
      },
    ],
  } as unknown as Exam;
  const payload = copyNodes(exam(), ['part1'])!;
  const pasted = pasteClipboard(other, payload, { parentId: 'pz', afterId: 'nz' }, newId);
  assert.equal(pasted.passages!.length, 1);
  assert.equal(pasted.outline!.length, 2, 'the copied part is a sibling of the existing one');
  assert.equal(pasted.outline![1].kind, 'part');
  assert.equal(pasted.questions.length, 4);
});

test('a broken clipboard is ignored', () => {
  assert.equal(parseClipboard('{'), null);
  assert.equal(parseClipboard(JSON.stringify({ formatVersion: 2 })), null);
  assert.ok(parseClipboard(JSON.stringify({ formatVersion: 1, nodes: [], questions: [] })));
});
