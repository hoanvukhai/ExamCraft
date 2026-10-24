import test from 'node:test';
import assert from 'node:assert/strict';
import { manualGradeRevision, manualGradeState, manualGradeAlreadyApplied } from '../src/lib/manual-grade-revision';

test('manual grade bases bind the attempt, question, comment and actual answer state', () => {
  const answer = { response: '0', earned: '0.25', manualScore: null, comment: null, isCorrect: false };
  const base = manualGradeRevision('A', 'q1', answer);
  for (const next of [manualGradeRevision('B', 'q1', answer), manualGradeRevision('A', 'q2', answer), manualGradeRevision('A', 'q1', { ...answer, comment: 'new' }), manualGradeRevision('A', 'q1', { ...answer, manualScore: 0 })]) assert.notEqual(next, base);
  assert.equal(base, manualGradeRevision('A', 'q1', { ...answer, earned: 0.25 }));
});
test('manual zero and comment clearing remain explicit in state and retry checks', () => {
  assert.deepEqual(manualGradeState({ earned: 0, manualScore: 0, isCorrect: false, comment: '' }), { earned: 0, manualScore: 0, isCorrect: false, comment: '' });
  assert.equal(manualGradeAlreadyApplied({ manualScore: 0, comment: 'keep' }, 0, undefined), true);
  assert.equal(manualGradeAlreadyApplied({ manualScore: 0, comment: 'keep' }, 0, ''), false);
  assert.equal(manualGradeAlreadyApplied({ earned: 0, manualScore: null }, 0, undefined), false);
});
