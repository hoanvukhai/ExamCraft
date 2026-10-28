import test from 'node:test';
import assert from 'node:assert/strict';
import type { Exam, Question } from '../src/types/exam';
import { previewHeaderDraft, appendManualQuestion } from '../src/lib/editor-draft-preview';
import { headerEditableSnapshot } from '../src/lib/header-layout';
import { questionDraftSourceStamp, questionValueStamp, type QuestionManualSubmission } from '../src/lib/question-draft';

const fixture = (): Exam => ({ id: 'doc', metadata: { title: 'Đề gốc', durationMinutes: 15, subject: 'toan', grade: 6, schoolName: '', departmentName: '' }, questions: [], createdAt: '', updatedAt: '' });
test('header preview is isolated, rejects invalid/stale drafts, and preserves unrelated newer values', () => {
  const exam = fixture(), before = structuredClone(exam);
  const draft = { documentId: exam.id, base: headerEditableSnapshot(exam.metadata), patch: { title: 'Tên đang thử' } };
  assert.equal(previewHeaderDraft(exam, draft).metadata.title, 'Tên đang thử');
  assert.deepEqual(exam, before);
  const newer = { ...exam, metadata: { ...exam.metadata, schoolName: 'Trường mới' } };
  assert.equal(previewHeaderDraft(newer, draft).metadata.schoolName, 'Trường mới');
  assert.equal(previewHeaderDraft(exam, { ...draft, patch: { title: '' } }), exam);
  const conflict = { ...exam, metadata: { ...exam.metadata, title: 'Tên người khác sửa' } };
  assert.equal(previewHeaderDraft(conflict, draft), conflict);
  assert.equal(previewHeaderDraft(exam, null), exam);
});
test('new question confirmation checks account, document, source, seed, permission and duplicate ID', () => {
  const exam = fixture();
  const seed: Question = { id: 'q_new_test', type: 'essay', content: '', difficulty: 'thong_hieu', step_by_step_solution: '' };
  const submission: QuestionManualSubmission = { ownerId: 'teacher', documentId: exam.id, questionId: seed.id, baseStamp: questionValueStamp(seed), baseSourceStamp: questionDraftSourceStamp(exam), token: 't', value: { ...seed, content: 'Câu đã soạn' } };
  const result = appendManualQuestion(exam, submission, 'teacher', seed);
  assert.equal(result.questions.length, 1); assert.equal(exam.questions.length, 0);
  assert.equal(appendManualQuestion(result, submission, 'teacher', seed), result);
  assert.equal(appendManualQuestion(exam, submission, 'other', seed), exam);
  for (const patch of [{ documentId: 'other' }, { baseSourceStamp: 'old' }, { baseStamp: 'old' }, { value: { ...submission.value, id: 'other' } }]) {
    assert.equal(appendManualQuestion(exam, { ...submission, ...patch }, 'teacher', seed), exam);
  }
  const viewer = { ...exam, access: { canEdit: false } } as Exam;
  assert.equal(appendManualQuestion(viewer, submission, 'teacher', seed), viewer);
});
