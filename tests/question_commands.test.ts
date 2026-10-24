import test from 'node:test';
import assert from 'node:assert/strict';
import type { Exam, Question } from '../src/types/exam';
import { applyQuestionOrderCommand, confirmedUndoHistory, prepareQuestionUndo, type QuestionUndoEntry } from '../src/lib/question-commands';
import { applyQuestionManualSubmission, questionDraftSourceStamp, questionValueStamp } from '../src/lib/question-draft';
const question = (id: string): Question => ({ id, subject: 'toan', grade: 6, type: 'essay', content: id, difficulty: 'thong_hieu', step_by_step_solution: 'Solution', points: 0, version: 1, status: 'verified', verifiedBy: 'human', figures: [{ id: 'image', kind: 'image', data: { url: '/fixture.png' } }] });
function fixture(): Exam { return { id: 'doc', createdAt: '', updatedAt: '', metadata: { title: 'Title', subject: 'toan', grade: 6, schoolName: '', departmentName: '', durationMinutes: 15 }, questions: [question('a'), question('b'), question('c')] }; }
test('move and duplicate use latest question values while stale order/document/permission is rejected', () => {
  const exam = fixture(), command = { documentId: exam.id, baseOrder: ['a', 'b', 'c'], questionId: 'b', action: 'up' as const };
  const newer = { ...exam, questions: [exam.questions[0], { ...exam.questions[1], step_by_step_solution: 'Latest other-tab solution' }, exam.questions[2]] };
  const moved = applyQuestionOrderCommand(newer, command); assert.deepEqual(moved.questions.map(q => q.id), ['b', 'a', 'c']); assert.equal(moved.questions[0].step_by_step_solution, 'Latest other-tab solution');
  assert.equal(applyQuestionOrderCommand(moved, command), moved);
  for (const changed of [{ ...exam, id: 'other' }, { ...exam, questions: [...exam.questions, question('d')] }, { ...exam, access: { role: 'viewer', canRead: true, canEdit: false, canComment: false, canManage: false, canPublish: false } }]) assert.equal(applyQuestionOrderCommand(changed, command), changed);
  assert.equal(applyQuestionOrderCommand(exam, { ...command, questionId: 'a' }), exam);
  const copied = applyQuestionOrderCommand(newer, { ...command, action: 'duplicate', newId: 'copy' });
  const clone = copied.questions[2]; assert.equal(clone.content, 'b'); assert.equal(clone.points, 0); assert.equal(clone.step_by_step_solution, 'Latest other-tab solution'); assert.equal(clone.status, 'draft'); assert.equal(clone.verifiedBy, 'none'); assert.equal(clone.version, 1);
  assert.deepEqual(clone.figures, newer.questions[1].figures); assert.notEqual(clone.figures, newer.questions[1].figures);
  assert.equal(applyQuestionOrderCommand(exam, { ...command, action: 'duplicate', newId: 'a' }), exam);
});
test('undo rejects another writer or changed context and is guarded again inside the current-exam updater', () => {
  const exam = fixture(), before = exam.questions[0], after = { ...before, content: 'Own edit', version: 2, status: 'draft' as const, verifiedBy: 'none' as const };
  const current = { ...exam, questions: [after, ...exam.questions.slice(1)] }, source = questionDraftSourceStamp(current);
  const entry: QuestionUndoEntry = { before, afterStamp: questionValueStamp(after), sourceStamp: source };
  const undo = prepareQuestionUndo(after, source, entry, 'owner', 'doc')!;
  assert.ok(undo); assert.equal(undo.value.content, 'a'); assert.equal(undo.value.version, 3); assert.equal(undo.value.verifiedBy, 'none'); assert.equal(undo.value.points, 0);
  assert.equal(prepareQuestionUndo({ ...after, step_by_step_solution: 'New writer' }, source, entry, 'owner', 'doc'), null);
  assert.equal(prepareQuestionUndo(after, 'new-source', entry, 'owner', 'doc'), null);
  const race = { ...current, questions: [{ ...after, content: 'Arrived after click' }, ...current.questions.slice(1)] };
  assert.equal(applyQuestionManualSubmission(race, undo, 'owner'), race);
  assert.equal(applyQuestionManualSubmission(current, undo, 'other-owner'), current);
  assert.equal(applyQuestionManualSubmission(current, undo, 'owner').questions[0].content, 'a');
});
test('undo history is not consumed before acknowledgement; chained undo rebases only its expected after-stamp', () => {
  const original = question('a'), first = { ...original, content: 'First', version: 2 }, second = { ...first, content: 'Second', version: 3 };
  const entries: QuestionUndoEntry[] = [{ before: original, afterStamp: questionValueStamp(first), sourceStamp: 'scope' }, { before: first, afterStamp: questionValueStamp(second), sourceStamp: 'scope' }];
  const submission = prepareQuestionUndo(second, 'scope', entries[1], 'owner', 'doc')!;
  assert.equal(confirmedUndoHistory(entries, questionValueStamp(submission.value), second), entries);
  assert.equal(confirmedUndoHistory(entries, questionValueStamp(submission.value), { ...second, content: 'Another writer' }), entries);
  const acknowledged = confirmedUndoHistory(entries, questionValueStamp(submission.value), submission.value);
  assert.equal(acknowledged.length, 1); assert.equal(acknowledged[0].before, original);
  const next = prepareQuestionUndo(submission.value, 'scope', acknowledged[0], 'owner', 'doc')!;
  assert.ok(next); assert.equal(next.value.content, 'a'); assert.equal(next.value.version, 5);
});
