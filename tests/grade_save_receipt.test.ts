import test from 'node:test';
import assert from 'node:assert/strict';
import { gradeSaveReceiptMatches } from '../src/lib/grade-save-receipt';

const receipt = { questionId: 'q1', gradeRevision: 'a'.repeat(64), manualScore: 0, teacherComment: '' };
test('graded zero is a confirmed grade, while a pending or incomplete receipt keeps the draft', () => {
  assert.equal(gradeSaveReceiptMatches('q1', '', 0, receipt), true);
  for (const value of [null, {}, { ...receipt, manualScore: null }, { ...receipt, manualScore: '0' }, { ...receipt, gradeRevision: '' }]) assert.equal(gradeSaveReceiptMatches('q1', '', 0, value), false);
});
test('a later grade/comment or another question cannot acknowledge the original input', () => {
  assert.equal(gradeSaveReceiptMatches('q1', 'new', 1.5, { ...receipt, manualScore: 1.5, teacherComment: 'new' }), true);
  assert.equal(gradeSaveReceiptMatches('q1', 'new', 1.5, { ...receipt, manualScore: 2, teacherComment: 'new' }), false);
  assert.equal(gradeSaveReceiptMatches('q1', 'new', 1.5, { ...receipt, manualScore: 1.5, teacherComment: 'other teacher' }), false);
  assert.equal(gradeSaveReceiptMatches('q2', '', 0, receipt), false);
});
test('comment-only receipts accept the internal no-score marker without inventing a numeric grade', () => {
  assert.equal(gradeSaveReceiptMatches('q1', 'feedback', null, { ...receipt, teacherComment: 'feedback', manualScore: 0 }), true);
  assert.equal(gradeSaveReceiptMatches('q1', 'feedback', null, { ...receipt, teacherComment: 'feedback', manualScore: null }), true);
  assert.equal(gradeSaveReceiptMatches('q1', 'feedback', null, { ...receipt, teacherComment: 'feedback', manualScore: 1 }), false);
});
