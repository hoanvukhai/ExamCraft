import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequestIdentity, isAccountFailure, RequestGate } from '../src/lib/template-request-context';

test('only one request runs at a time and a released slot can be taken again', () => {
  const gate = new RequestGate();
  const first = gate.begin();
  assert.ok(first && first.isLive());
  assert.equal(gate.begin(), null, 'a second click while the first is in flight is refused, not queued');
  first.release();
  assert.equal(first.isLive(), false, 'a released token is no longer the live request');
  const second = gate.begin();
  assert.ok(second && second.isLive());
  first.release(); // a late release from the old request must not free the new one
  assert.equal(second.isLive(), true);
  assert.equal(gate.begin(), null);
});

test('closing the panel aborts the request and nothing from it counts as live afterwards', () => {
  const gate = new RequestGate();
  const token = gate.begin()!;
  gate.dispose();
  assert.equal(token.signal.aborted, true);
  assert.equal(token.isLive(), false);
  assert.equal(gate.begin(), null, 'a disposed panel never starts a new request');
  assert.equal(gate.disposed, true);
});

test('losing the account stops the running request and blocks every later one', () => {
  const gate = new RequestGate();
  const token = gate.begin()!;
  gate.lock();
  assert.equal(token.signal.aborted, true);
  assert.equal(token.isLive(), false, 'the response of the old account must not land');
  token.release();
  assert.equal(gate.begin(), null, 'no retry under whatever account is signed in now');
  assert.equal(gate.locked, true);
  assert.equal(gate.disposed, false);
});

test('a context that was replaced by a new gate leaves the old responses dead', () => {
  const oldGate = new RequestGate(), newGate = new RequestGate();
  const oldToken = oldGate.begin()!;
  oldGate.dispose();
  const newToken = newGate.begin()!;
  assert.equal(oldToken.isLive(), false);
  assert.equal(newToken.isLive(), true);
});

test('account failure is exactly 401 or 409 ACCOUNT_CHANGED; ordinary conflicts stay retryable', () => {
  assert.equal(isAccountFailure(401, null), true);
  assert.equal(isAccountFailure(409, { code: 'ACCOUNT_CHANGED' }), true);
  assert.equal(isAccountFailure(409, { code: 'GRADE_CONFLICT' }), false);
  assert.equal(isAccountFailure(409, { error: 'Phiên bản mẫu nguồn đã thay đổi.' }), false);
  assert.equal(isAccountFailure(409, null), false);
  assert.equal(isAccountFailure(200, { code: 'ACCOUNT_CHANGED' }), false);
  assert.equal(isAccountFailure(500, undefined), false);
  assert.equal(isAccountFailure(403, { code: 'ACCOUNT_CHANGED' }), false);
});

test('retry keeps the request ID while the body is unchanged; an edited body gets a new one, and going back is a new request too', () => {
  let counter = 0;
  const idFor = createRequestIdentity(() => `id-${++counter}`);
  const first = idFor('body-a');
  assert.equal(idFor('body-a'), first, 'retry after a failure reuses the ID');
  assert.equal(idFor('body-a'), first);
  const edited = idFor('body-b');
  assert.notEqual(edited, first, 'edited name/sources/snapshot must not replay the earlier request');
  assert.notEqual(idFor('body-a'), first, 'returning to an older body does not resurrect an ID the server may have bound to other content');
  assert.equal(counter, 3);
});
