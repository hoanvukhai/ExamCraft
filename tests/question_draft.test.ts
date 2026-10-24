import test from 'node:test';
import assert from 'node:assert/strict';
import type { Exam, Question } from '../src/types/exam';
import { applyQuestionManualSubmission, archiveQuestionDraft, listQuestionDrafts, parseQuestionDraft, questionDraftKey, questionDraftSatisfiedBy, questionDraftSourceStamp, questionValueStamp, resumeQuestionDraft, retireQuestionDraft, retireSavedQuestionDrafts, writeQuestionDraft, type QuestionDraft, type QuestionManualSubmission } from '../src/lib/question-draft';

class StorageFixture {
  values = new Map<string, string>(); fail = false;
  get length() { return this.values.size; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { if (this.fail) throw Error('quota'); this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}
function fixture(): Exam {
  return { id: 'doc', createdAt: '', updatedAt: '', metadata: { title: 'Title', schoolName: '', departmentName: '', subject: 'toan', grade: 6, durationMinutes: 15 }, questions: [{ id: 'q', type: 'essay', difficulty: 'thong_hieu', content: 'Question', step_by_step_solution: 'Private solution', points: 0 }, { id: 'other', type: 'essay', difficulty: 'thong_hieu', content: 'Other', step_by_step_solution: '' }] };
}
const displayed = (exam: Exam): Question => ({ ...exam.questions[0], subject: exam.metadata.subject, grade: exam.metadata.grade });
function record(ownerId: string, journalId = 'writer1'): QuestionDraft {
  const exam = fixture(), base = displayed(exam);
  return { formatVersion: 1, ownerId, documentId: exam.id, questionId: 'q', journalId, token: 'token1', updatedAt: '2026-10-24T00:00:00Z', baseQuestion: base, baseSourceStamp: questionDraftSourceStamp(exam), draft: { ...base, content: 'Unapplied draft' } };
}
function submission(exam: Exam): QuestionManualSubmission {
  return { ownerId: 'teacherA', documentId: exam.id, questionId: 'q', baseStamp: questionValueStamp(displayed(exam)), baseSourceStamp: questionDraftSourceStamp(exam), token: 't', value: { ...displayed(exam), content: 'Applied', version: 2, status: 'draft', verifiedBy: 'none' } };
}
test('manual submission guards owner, document, edit permission, full question and source baseline', () => {
  const exam = fixture(), request = submission(exam);
  const applied = applyQuestionManualSubmission(exam, request, 'teacherA');
  assert.equal(applied.questions[0].content, 'Applied'); assert.equal(applied.questions[0].points, 0); assert.equal(applied.questions[0].step_by_step_solution, 'Private solution'); assert.equal(applied.questions[1], exam.questions[1]);
  assert.equal(applyQuestionManualSubmission(exam, request, 'teacherB'), exam);
  for (const changed of [
    { ...exam, id: 'other-doc' },
    { ...exam, access: { role: 'viewer', canRead: true, canEdit: false, canManage: false, canComment: false, canPublish: false } },
    { ...exam, questions: [{ ...exam.questions[0], step_by_step_solution: 'Newer solution from another tab' }, exam.questions[1]] },
    { ...exam, metadata: { ...exam.metadata, grade: 7 } },
    { ...exam, sections: [{ id: 's', name: 'New scoring', pointsPerQuestion: 9 }] },
    { ...exam, questions: [exam.questions[1]] },
  ]) assert.equal(applyQuestionManualSubmission(changed, request, 'teacherA'), changed);
  const unrelated = { ...exam, metadata: { ...exam.metadata, academicYear: '2027', title: 'New title' }, questions: [exam.questions[0], { ...exam.questions[1], content: 'Newer other question' }] };
  assert.equal(applyQuestionManualSubmission(unrelated, request, 'teacherA').questions[1].content, 'Newer other question');
});
test('writer journals survive independently; owner/document boundaries and malformed records are enforced', () => {
  const storage = new StorageFixture(), first = record('scope-a'), second = record('scope-a', 'writer2');
  second.draft.content = 'Other tab';
  assert.equal(writeQuestionDraft(first, storage).durable, true); writeQuestionDraft(second, storage);
  assert.equal(listQuestionDrafts('scope-a', 'doc', storage).length, 2);
  assert.equal(listQuestionDrafts('scope-b', 'doc', storage).length, 0); assert.equal(listQuestionDrafts('scope-a', 'other', storage).length, 0);
  const before = listQuestionDrafts('scope-a', 'doc', storage).find(entry => entry.value?.journalId === 'writer1')!;
  retireQuestionDraft(before, storage);
  assert.equal(listQuestionDrafts('scope-a', 'doc', storage)[0].value!.draft.content, 'Other tab');
  storage.setItem(questionDraftKey(first), '{bad-json');
  assert.equal(listQuestionDrafts('scope-a', 'doc', storage).find(entry => entry.key === questionDraftKey(first))!.unreadable, true);
  assert.throws(() => parseQuestionDraft(JSON.stringify(first), 'scope-b', 'doc'));
  storage.setItem(questionDraftKey(first), JSON.stringify({ ...first, questionId: 'different' }));
  assert.equal(listQuestionDrafts('scope-a', 'doc', storage).find(entry => entry.key === questionDraftKey(first))!.unreadable, true);
});
test('late acknowledgement cannot retire a newer draft revision', () => {
  const storage = new StorageFixture(), first = record('late-ack'); writeQuestionDraft(first, storage);
  const acknowledged = listQuestionDrafts('late-ack', 'doc', storage)[0];
  const newer = { ...first, token: 'token2', draft: { ...first.draft, content: 'Newer edit before acknowledgement' } }; writeQuestionDraft(newer, storage);
  retireQuestionDraft(acknowledged, storage);
  assert.equal(listQuestionDrafts('late-ack', 'doc', storage)[0].value!.token, 'token2');
});
test('applying an edited recovery must not retire the different draft of another writer', () => {
  const storage = new StorageFixture(), first = record('recovered-writer'); writeQuestionDraft(first, storage);
  const recovered = listQuestionDrafts('recovered-writer', 'doc', storage)[0];
  const altered: Question = { ...first.draft, content: 'Different content in tab B', status: 'draft', verifiedBy: 'none', version: 2 };
  assert.equal(questionDraftSatisfiedBy(recovered, altered), false);
  const applied: Question = { ...first.draft, status: 'draft', verifiedBy: 'none', version: 2 };
  assert.equal(questionDraftSatisfiedBy(recovered, applied), true);
  writeQuestionDraft({ ...first, token: 'newer-A', draft: { ...first.draft, content: 'A typed again' } }, storage);
  retireQuestionDraft(recovered, storage);
  assert.equal(listQuestionDrafts('recovered-writer', 'doc', storage)[0].value!.token, 'newer-A');
});
test('applied drafts stay durable until server confirmation and cleanup only retires matching content/context', () => {
  const storage = new StorageFixture(), first = record('server-ack'); writeQuestionDraft(first, storage);
  const exam = fixture(), saved = applyQuestionManualSubmission(exam, { ...submission(exam), ownerId: 'server-ack', value: { ...first.draft, version: 2, status: 'draft', verifiedBy: 'none' } }, 'server-ack');
  assert.equal(listQuestionDrafts('server-ack', 'doc', storage).length, 1, 'Applying alone must not retire a durable draft.');
  const other = { ...record('server-ack', 'other-writer'), draft: { ...first.draft, content: 'Different unsaved content' } }; writeQuestionDraft(other, storage);
  const wrongContext = { ...saved, metadata: { ...saved.metadata, grade: 7 } }; retireSavedQuestionDrafts('server-ack', wrongContext, storage);
  assert.equal(listQuestionDrafts('server-ack', 'doc', storage).length, 2);
  retireSavedQuestionDrafts('wrong-owner', saved, storage); assert.equal(listQuestionDrafts('server-ack', 'doc', storage).length, 2);
  retireSavedQuestionDrafts('server-ack', saved, storage);
  const remaining = listQuestionDrafts('server-ack', 'doc', storage); assert.equal(remaining.length, 1); assert.equal(remaining[0].value!.journalId, 'other-writer');
});
test('reopening an applied but unacknowledged journal takes the current baseline without retiring the source', () => {
  const storage = new StorageFixture(), first = record('reopen-applied'); writeQuestionDraft(first, storage);
  const originalRaw = storage.getItem(questionDraftKey(first));
  const current: Question = { ...first.draft, version: 2, status: 'draft', verifiedBy: 'none' };
  const recovered = resumeQuestionDraft(first, current, first.baseSourceStamp);
  assert.equal(recovered.alreadyApplied, true); assert.deepEqual(recovered.record.baseQuestion, current); assert.deepEqual(recovered.record.draft, current);
  assert.equal(storage.getItem(questionDraftKey(first)), originalRaw); assert.notEqual(recovered.record.baseQuestion, current);
  const changed = resumeQuestionDraft(first, { ...current, content: 'Someone changed it' }, first.baseSourceStamp);
  assert.equal(changed.alreadyApplied, false); assert.deepEqual(changed.record.baseQuestion, first.baseQuestion);
  assert.equal(resumeQuestionDraft(first, current, 'new-source').alreadyApplied, false);
});
test('account recovery index keeps old-document drafts discoverable after a server ID changes', () => {
  const storage = new StorageFixture(), local = record('identity-change'); writeQuestionDraft(local, storage);
  const serverDocument = { ...record('identity-change', 'second-writer'), documentId: 'server-doc' }; writeQuestionDraft(serverDocument, storage);
  writeQuestionDraft(record('another-account'), storage);
  assert.equal(listQuestionDrafts('identity-change', 'server-doc', storage).length, 1);
  assert.deepEqual(new Set(listQuestionDrafts('identity-change', null, storage).map(entry => entry.value!.documentId)), new Set(['doc', 'server-doc']));
  assert.equal(listQuestionDrafts('no-access', null, storage).length, 0);
});
test('quota preserves a memory-only draft and cannot erase an older durable copy', () => {
  const storage = new StorageFixture(), first = record('quota'); writeQuestionDraft(first, storage);
  const originalRaw = storage.getItem(questionDraftKey(first)); storage.fail = true;
  const newer = { ...first, token: 'new-token', draft: { ...first.draft, content: 'Held in memory' } };
  assert.equal(writeQuestionDraft(newer, storage).durable, false);
  const held = listQuestionDrafts('quota', 'doc', storage)[0]; assert.equal(held.memoryOnly, true); assert.equal(held.value!.draft.content, 'Held in memory');
  assert.equal(storage.getItem(questionDraftKey(first)), originalRaw);
  retireQuestionDraft(held, storage); assert.equal(storage.getItem(questionDraftKey(first)), originalRaw);
});
test('invalid numeric draft is retained for download and cannot masquerade as valid zero/null', () => {
  const storage = new StorageFixture(), invalid = record('invalid-number'); invalid.draft.points = NaN;
  assert.equal(writeQuestionDraft(invalid, storage).durable, false);
  const entry = listQuestionDrafts('invalid-number', 'doc', storage)[0];
  assert.equal(entry.unreadable, true); assert.match(entry.raw, /invalidNumber/); assert.equal(storage.length, 0);
  retireQuestionDraft(entry, storage);
});
test('archive preserves raw malformed sources and refuses stale revisions or storage failure', () => {
  const storage = new StorageFixture(), first = record('archive'); writeQuestionDraft(first, storage);
  const old = listQuestionDrafts('archive', 'doc', storage)[0]; writeQuestionDraft({ ...first, token: 'new' }, storage);
  assert.equal(archiveQuestionDraft(old, storage), false);
  const current = listQuestionDrafts('archive', 'doc', storage)[0]; storage.fail = true;
  assert.equal(archiveQuestionDraft(current, storage), false); assert.equal(listQuestionDrafts('archive', 'doc', storage).length, 1);
  storage.fail = false; storage.setItem(questionDraftKey(first), '{original-malformed');
  const malformed = listQuestionDrafts('archive', 'doc', storage)[0];
  assert.equal(archiveQuestionDraft(malformed, storage), true); assert.equal(listQuestionDrafts('archive', 'doc', storage).length, 0);
  assert.equal(listQuestionDrafts('archive', 'doc', storage, true)[0].raw, '{original-malformed');
});
