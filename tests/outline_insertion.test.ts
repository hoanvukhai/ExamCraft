import test from 'node:test';
import assert from 'node:assert/strict';
import type { Exam, Question } from '../src/types/exam';
import { syncOutline } from '../src/lib/exam-outline';
import { captureInsertion, insertQuestionBatch } from '../src/lib/outline-insertion';
import { suggestImportedParts } from '../src/lib/import-outline';

function question(id: string, passageId?: string): Question {
  return {
    id,
    content: id,
    type: 'essay',
    difficulty: 'thong_hieu',
    points: 0,
    passageId,
    step_by_step_solution: 'Private solution ' + id,
  };
}
function fixture(): Exam {
  return syncOutline({
    id: 'test',
    metadata: {
      title: 'Teacher title',
      subject: 'toan',
      grade: 6,
      durationMinutes: 45,
      schoolName: '',
      departmentName: '',
    },
    createdAt: '',
    updatedAt: '',
    questions: Array.from({ length: 10 }, (_, i) => question('old-' + i)),
    outline: [
      {
        id: 'part',
        kind: 'part',
        title: 'II',
        children: Array.from({ length: 10 }, (_, i) => ({
          id: 'node-' + i,
          kind: 'question',
          questionId: 'old-' + i,
        })),
      },
    ],
  });
}
test('AI batch adds five in the selected part and preserves all ten old questions and metadata', () => {
  const exam = fixture(),
    before = JSON.stringify(exam);
  const target = captureInsertion(exam, 'owner', { parentId: 'part', afterId: 'node-3' });
  const result = insertQuestionBatch(
    exam,
    'owner',
    target,
    Array.from({ length: 5 }, (_, i) => question('new-' + i)),
  );
  assert.equal(result.exam.questions.length, 15);
  assert.deepEqual(
    result.exam.questions.slice(4, 9).map((q) => q.id),
    ['new-0', 'new-1', 'new-2', 'new-3', 'new-4'],
  );
  for (const old of exam.questions)
    assert.deepEqual(
      result.exam.questions.find((q) => q.id === old.id),
      old,
    );
  assert.deepEqual(result.exam.metadata, exam.metadata);
  assert.equal(JSON.stringify(exam), before);
});
test('reject stale document, lost permission, account switch, duplicate question or vanished point without mutation', () => {
  const exam = fixture(),
    target = captureInsertion(exam, 'owner', { parentId: 'part', afterId: 'node-3' });
  assert.throws(() => insertQuestionBatch(exam, 'other', target, [question('new')]));
  assert.throws(() =>
    insertQuestionBatch({ ...exam, access: { canEdit: false } } as Exam, 'owner', target, [question('new')]),
  );
  assert.throws(() =>
    insertQuestionBatch({ ...exam, metadata: { ...exam.metadata, title: 'new' } }, 'owner', target, [
      question('new'),
    ]),
  );
  assert.throws(() => insertQuestionBatch(exam, 'owner', target, [question('old-0')]));
  assert.throws(() =>
    insertQuestionBatch(exam, 'owner', { ...target, point: { parentId: 'gone' } }, [question('new')]),
  );
  assert.equal(exam.questions.length, 10);
});
test('bank continuation reuses adjacent material group; conflict never overwrites existing material', () => {
  const exam = fixture(),
    material = { id: 'p', content: 'Original passage' };
  exam.passages = [material];
  const target = captureInsertion(exam, 'owner', { parentId: 'part', afterId: 'node-3' });
  const first = insertQuestionBatch(exam, 'owner', target, [question('new-1', 'p')], [material]);
  const second = insertQuestionBatch(first.exam, 'owner', first.target, [question('new-2', 'p')], [material]);
  const children = second.exam.outline![0].children!;
  assert.equal(children.filter((n) => n.kind === 'group').length, 1);
  assert.equal(children[4].children!.length, 2);
  const third = insertQuestionBatch(
    second.exam,
    'owner',
    second.target,
    [question('new-3', 'p')],
    [{ id: 'p', content: 'Changed' }],
  );
  assert.deepEqual(third.exam.passages![0], material);
  assert.equal(third.exam.passages!.length, 2);
  assert.notEqual(third.exam.questions.find((q) => q.id === 'new-3')!.passageId, 'p');
});
test('a group cannot silently acquire a different material or nested group', () => {
  const exam = fixture();
  const target = captureInsertion(exam, 'owner', { parentId: 'part', afterId: 'node-3' });
  const first = insertQuestionBatch(
    exam,
    'owner',
    target,
    [question('new', 'p')],
    [{ id: 'p', content: 'One' }],
  );
  const group = first.exam.outline![0].children!.find((n) => n.kind === 'group')!;
  const inside = captureInsertion(first.exam, 'owner', {
    parentId: group.id,
    afterId: group.children![0].id,
  });
  assert.throws(() =>
    insertQuestionBatch(first.exam, 'owner', inside, [question('other', 'q')], [{ id: 'q', content: 'Two' }]),
  );
});
test('recognized import headings are optional, keep order and require a root insertion point', () => {
  const imported = [question('one'), question('two')];
  const text = 'PHẦN I. Tự luận\nLàm đủ các ý\nCâu 1: one\nPHẦN II. Tự luận\nCâu 2: two';
  const parts = suggestImportedParts(text, imported);
  assert.equal(parts.length, 2);
  assert.equal(parts[0].instructions, 'Làm đủ các ý');
  assert.deepEqual(suggestImportedParts(text, [question('one')]), []);
  const exam = fixture(),
    target = captureInsertion(exam, 'owner', { parentId: null, afterId: 'part' });
  const accepted = insertQuestionBatch(exam, 'owner', target, imported, [], parts).exam;
  assert.equal(accepted.outline!.length, 3);
  assert.equal(accepted.outline![1].title, 'PHẦN I. Tự luận');
  assert.deepEqual(
    accepted.questions.slice(-2).map((q) => q.id),
    ['one', 'two'],
  );
  const flat = insertQuestionBatch(exam, 'owner', target, imported).exam;
  assert.equal(flat.outline![1].kind, 'question');
  const nested = captureInsertion(exam, 'owner', { parentId: 'part', afterId: 'node-3' });
  assert.throws(() => insertQuestionBatch(exam, 'owner', nested, imported, [], parts));
});
