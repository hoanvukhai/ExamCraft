import test from 'node:test';
import assert from 'node:assert/strict';
import { bankSaveReceipt } from '../src/lib/bank-save-receipt';

test('bank receipt identity is scoped by owner and request, and rejects changed content', () => {
  const a = bankSaveReceipt('a', 'r', { content: 'x', payload: { correct: '0', points: 1 } });
  assert.deepEqual(a, bankSaveReceipt('a', 'r', { payload: { points: 1, correct: '0' }, content: 'x' }));
  assert.notEqual(a.id, bankSaveReceipt('b', 'r', {}).id);
  assert.notEqual(a.id, bankSaveReceipt('a', 's', {}).id);
  assert.notEqual(a.fingerprint, bankSaveReceipt('a', 'r', { content: 'y' }).fingerprint);
});
