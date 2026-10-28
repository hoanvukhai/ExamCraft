import test from 'node:test';
import assert from 'node:assert/strict';
import type { Exam, OutlineNode, Question } from '../src/types/exam';
import { normalizeExamDocument } from '../src/lib/exam-document';
import { freezeExamScoring } from '../src/lib/snapshot-scoring';
import {
  legacyOutline,
  syncOutline,
  validateOutline,
  outlineNodes,
  outlineEntries,
  insertOutlineNodes,
  removeOutlineNode,
  moveOutlineNode,
} from '../src/lib/exam-outline';
const question = (id: string, sectionId?: string, passageId?: string): Question => ({
  id,
  sectionId,
  passageId,
  type: 'essay',
  difficulty: 'thong_hieu',
  content: id,
  points: 0,
  correct_answer: 'ANSWER_' + id,
  step_by_step_solution: 'SOLUTION_' + id,
});
const fixture = (): Exam => ({
  id: 'outline-test',
  metadata: {
    title: 'Test',
    subject: 'toan',
    grade: 6,
    durationMinutes: 15,
    schoolName: '',
    departmentName: '',
  },
  createdAt: '',
  updatedAt: '',
  questions: [
    question('a', 'one', 'p'),
    question('b', 'one', 'p'),
    question('c', 'two'),
    question('d', 'one', 'p'),
    question('e', undefined, 'p'),
    question('f'),
  ],
  sections: [
    { id: 'one', name: 'Phần I', pointsPerQuestion: 1 },
    { id: 'two', name: 'Phần II' },
    { id: 'empty', name: 'Phần rỗng', progressiveScoring: [0, 0.25, 1] },
  ],
  passages: [
    { id: 'p', content: 'PASSAGE', source: 'SOURCE', figures: [{ id: 'i', kind: 'image', data: 'data' }] },
  ],
});

test('legacy conversion preserves interleaved order, all IDs/answers/zero scores and empty parts', () => {
  const old = fixture(),
    before = structuredClone(old);
  const upgraded = syncOutline(old);
  assert.equal(JSON.stringify(upgraded.questions), JSON.stringify(old.questions));
  assert.deepEqual(old, before);
  assert.deepEqual(upgraded.passages, old.passages);
  assert.equal(
    JSON.stringify(freezeExamScoring(upgraded).questions),
    JSON.stringify(freezeExamScoring(old).questions),
  );
  const nodes = outlineNodes(upgraded.outline!);
  assert.equal(nodes.filter((node) => node.kind === 'group').length, 3);
  assert.ok(
    nodes.some((node) => node.kind === 'part' && node.title === 'Phần rỗng' && !node.children?.length),
  );
  assert.equal(nodes.filter((node) => node.kind === 'part' && node.sectionId === 'one').length, 2);
  assert.equal(upgraded.sections!.find((section) => section.id === 'one')!.pointsPerQuestion, 1);
});

test('normalization upgrades only the returned document; JSON save/read roundtrip is stable', () => {
  const old = fixture(),
    raw = JSON.stringify(old);
  const upgraded = normalizeExamDocument(old);
  assert.equal(JSON.stringify(old), raw);
  assert.deepEqual(normalizeExamDocument(JSON.parse(JSON.stringify(upgraded))), upgraded);
  assert.deepEqual(
    upgraded.questions.map((q) => q.id),
    old.questions.map((q) => q.id),
  );
});

test('default workspace is hidden while its selected scoring and existing snapshot scores are preserved', () => {
  const old = fixture();
  old.sections = [{ id: 'workspace', name: 'Nội dung bài', pointsPerQuestion: 2 }];
  old.questions = [{ ...question('q', 'workspace'), points: undefined }];
  const upgraded = syncOutline(old);
  assert.equal(upgraded.outline!.filter((node) => node.kind === 'part').length, 0);
  assert.equal(
    JSON.stringify(freezeExamScoring(upgraded).questions),
    JSON.stringify(freezeExamScoring(old).questions),
  );
});

test('explicit malformed outlines are rejected instead of silently losing or repeating questions', () => {
  const old = fixture(),
    valid = legacyOutline(old);
  const cases: unknown[] = [
    null,
    {},
    [],
    [...valid, valid[0]],
    [{ id: 'missing', kind: 'question', questionId: 'no' }],
    [{ id: 'part', kind: 'part', children: [{ id: 'nested', kind: 'part', children: [] }] }],
    [{ id: 'group', kind: 'group', children: [{ id: 'nested', kind: 'group', children: [] }] }],
    [{ id: 'q', kind: 'question', questionId: 'a', children: [] }],
  ];
  for (const outline of cases) assert.throws(() => normalizeExamDocument({ ...old, outline }));
  const cyclic: OutlineNode = { id: 'cycle', kind: 'part', children: [] };
  cyclic.children!.push(cyclic);
  assert.throws(() => validateOutline([cyclic], old.questions));
});

test('insert/move/remove preserve containers, no orphan questions and prevent invalid nesting', () => {
  const exam = syncOutline(fixture());
  const empty = exam.outline!.find((node) => node.sectionId === 'empty')!;
  const added = question('new');
  const inserted = insertOutlineNodes(
    exam,
    { parentId: empty.id },
    [{ id: 'new-node', kind: 'question', questionId: added.id }],
    [added],
  );
  assert.equal(inserted.questions.at(-1)!.id, 'new');
  assert.equal(inserted.questions.at(-1)!.sectionId, 'empty');
  assert.equal(exam.questions.length, 6);
  const moved = moveOutlineNode(inserted, 'new-node', { parentId: null, afterId: inserted.outline![0].id });
  assert.equal(moved.questions[2].id, 'new');
  assert.equal(moved.questions[2].sectionId, undefined);
  assert.throws(() => moveOutlineNode(inserted, empty.id, { parentId: empty.id }));
  const dissolved = removeOutlineNode(inserted, empty.id, true);
  assert.ok(dissolved.questions.some((q) => q.id === 'new'));
  const deleted = removeOutlineNode(inserted, empty.id, false);
  assert.ok(!deleted.questions.some((q) => q.id === 'new'));
  const viewer = { ...inserted, access: { canEdit: false } } as Exam;
  assert.equal(removeOutlineNode(viewer, empty.id, false), viewer);
  assert.equal(moveOutlineNode(viewer, empty.id, { parentId: null }), viewer);
  assert.equal(insertOutlineNodes(viewer, { parentId: null }, []), viewer);
});

test('outline order is authoritative and numbering can restart in a part', () => {
  const exam = fixture();
  exam.questions = [question('a'), question('b')];
  exam.sections = [];
  exam.outline = [
    {
      id: 'p',
      kind: 'part',
      title: 'PART',
      numbering: 'roman',
      children: [{ id: 'b-node', kind: 'question', questionId: 'b' }],
    },
    {
      id: 'p2',
      kind: 'part',
      title: 'PART2',
      questionNumbering: 'restart',
      children: [{ id: 'a-node', kind: 'question', questionId: 'a' }],
    },
  ];
  const next = syncOutline(exam);
  assert.deepEqual(
    next.questions.map((q) => q.id),
    ['b', 'a'],
  );
  const entries = outlineEntries(next);
  assert.equal(entries[0].label, 'I');
  assert.deepEqual(
    entries.filter((entry) => entry.question).map((entry) => entry.number),
    [1, 1],
  );
});

test('question parts support explicit zero and private answers without disturbing legacy true/false items', () => {
  const exam = fixture();
  exam.questions[0].parts = [{ id: 'a', content: 'Ý a', points: 0, answer: 'PRIVATE', solution: 'SOLUTION' }];
  assert.equal(normalizeExamDocument(exam).questions[0].parts![0].points, 0);
  for (const parts of [
    [{ id: 'a', content: 'A', points: -1 }],
    [
      { id: 'a', content: 'A' },
      { id: 'a', content: 'B' },
    ],
  ]) {
    assert.throws(() => normalizeExamDocument({ ...exam, questions: [{ ...exam.questions[0], parts }] }));
  }
});
