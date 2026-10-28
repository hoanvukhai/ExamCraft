import test from 'node:test';
import assert from 'node:assert/strict';
import type { Exam } from '../src/types/exam';
import { normalizeExamDocument } from '../src/lib/exam-document';
import { structuralStampFields, syncOutline, viewSyncedOutline } from '../src/lib/exam-outline';

function fixture(): Exam {
  return syncOutline({ id: 'outline-recovery', metadata: { title: 'Recovery', subject: 'toan', grade: 6,
    schoolName: '', departmentName: '', durationMinutes: 15 }, createdAt: '', updatedAt: '',
    passages: [{ id: 'p', content: 'Shared source' }],
    questions: ['a', 'b'].map(id => ({ id, type: 'essay', content: id, difficulty: 'thong_hieu',
      passageId: 'p', points: 0, step_by_step_solution: 'Private ' + id })),
  });
}
test('stale outline is tolerated only for viewing, preserving source bytes, question order, zero and private answers', () => {
  const exam = fixture();
  exam.questions.push({ ...exam.questions[0], id: 'c', content: 'New question' });
  const before = JSON.stringify(exam);
  const viewed = viewSyncedOutline(exam);
  assert.deepEqual(viewed.questions.map(q => q.id), ['a', 'b', 'c']);
  assert.deepEqual(viewed.questions, exam.questions);
  assert.equal(viewed.questions[0].points, 0);
  assert.equal(viewed.questions[0].step_by_step_solution, 'Private a');
  assert.equal(JSON.stringify(exam), before);
  assert.throws(() => syncOutline(exam));
  assert.throws(() => normalizeExamDocument(exam));
});
test('node IDs alone do not stale legacy drafts, but material, titles and empty parts remain meaningful', () => {
  const exam = fixture();
  const clone = structuredClone(exam);
  clone.outline!.forEach(node => { node.id = 'new-' + node.id;
    node.children?.forEach(child => { child.id = 'new-' + child.id; }); });
  assert.deepEqual(structuralStampFields(clone), {});
  clone.outline![0].title = 'Teacher changed heading';
  assert.deepEqual(structuralStampFields(clone), { outline: clone.outline });
  const emptyPart = { id: 'empty', kind: 'part' as const, title: 'Empty part', children: [] };
  exam.outline!.push(emptyPart);
  assert.deepEqual(structuralStampFields(exam), { outline: exam.outline });
  assert.deepEqual(viewSyncedOutline(exam).outline!.at(-1), emptyPart);
});
