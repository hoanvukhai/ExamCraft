import test from 'node:test';
import assert from 'node:assert/strict';
import { Prisma } from '@prisma/client';
import { questionRowChanged } from '../src/lib/question-row-change';
import { questionToDatabase } from '../src/lib/exam-document';
import type { Question } from '../src/types/exam';

test('question comparison ignores JSONB key order, Decimal representation and revision counter', () => {
  assert.equal(questionRowChanged({ payload: { b: [1, { y: false, x: 0 }], a: 2 }, points: new Prisma.Decimal('0'), source: null, figures: null, version: 9 },
    { payload: { a: 2, b: [1, { x: 0, y: false }] }, points: 0, source: undefined, figures: Prisma.DbNull, version: 1 }), false);
  assert.equal(questionRowChanged({points:new Prisma.Decimal('1.24')},{points:1.235}),false);
});

test('every written question field is compared; answer fields inside payload cannot be skipped', () => {
  const question = { id: 'q', type: 'essay', difficulty: 'thong_hieu', content: 'Question', points: 1, step_by_step_solution: 'Solution' } as Question;
  const data = questionToDatabase(question, { ownerId: 'u', examId: 'e', questionId: 'q', subject: 'toan', grade: 6 });
  for (const [field, value] of Object.entries(data)) {
    if (field === 'version') continue;
    const changed = typeof value === 'number' ? value + 1 : typeof value === 'boolean' ? !value : Array.isArray(value) ? [...value, 'changed'] : value && typeof value === 'object' ? { ...value, changed: true } : 'changed';
    assert.equal(questionRowChanged(data, { ...data, [field]: changed }), true, field);
  }
  for (const field of ['choices', 'sub_questions', 'correct_answer', 'accepted_answers', 'rubric', 'matchingPairs', 'correctOrder', 'figures', 'source', 'licenseNote', 'sectionId']) {
    const changed = questionToDatabase({ ...question, [field]: ['changed'] }, { ownerId: 'u', examId: 'e', questionId: 'q', subject: 'toan', grade: 6 });
    assert.equal(questionRowChanged(data, changed), true, field);
  }
  assert.equal(questionRowChanged({ deletedAt: new Date() }, { deletedAt: null }), true);
  assert.equal(questionRowChanged({ points: 1 }, { points: 0 }), true);
  assert.equal(questionRowChanged({ figures: [{ id: 'old' }] }, { figures: Prisma.DbNull }), true);
});
