import test from 'node:test';
import assert from 'node:assert/strict';
import { attemptDraftRevision, validDraftRevision } from '../src/lib/attempt-draft-revision';

test('student draft receipts compare content independent of JSON property order', () => {
  assert.equal(attemptDraftRevision({ tf: { b: false, a: true }, short: '0' }), attemptDraftRevision({ short: '0', tf: { a: true, b: false } }));
  assert.equal(attemptDraftRevision(null), attemptDraftRevision({}));
});
test('draft receipts preserve zero, false, omission and ordering distinctions', () => {
  const values = [{ short: '0' }, { short: 0 }, { short: false }, { short: '' }, {}, { order: ['a', 'b'] }, { order: ['b', 'a'] }];
  assert.equal(new Set(values.map(attemptDraftRevision)).size, values.length);
});
test('draft receipt validation rejects absent, malformed and non-text bases', () => {
  assert.equal(validDraftRevision(attemptDraftRevision({ answer: '0' })), true);
  for (const value of [null, undefined, {}, 0, '', 'a'.repeat(63), 'A'.repeat(64), 'g'.repeat(64)]) assert.equal(validDraftRevision(value), false);
});
