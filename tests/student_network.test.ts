import test from 'node:test';
import assert from 'node:assert/strict';
import { withStudentRequestTimeout } from '../src/lib/student-network';

test('student request returns the receipt only after the response body has been read', async () => {
  const result = await withStudentRequestTimeout(async signal => {
    assert.equal(signal.aborted, false);
    const response = new Response(JSON.stringify({ revision: 'received' }));
    return { response, body: await response.json() };
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.revision, 'received');
});

test('a hung send or body read releases the caller and aborts the request, without fabricating an acknowledgement', async () => {
  let signal: AbortSignal | undefined;
  await assert.rejects(withStudentRequestTimeout(async current => {
    signal = current;
    return new Promise<never>(() => {});
  }, 5), /chưa phản hồi/);
  assert.equal(signal?.aborted, true);
  let acknowledged = false;
  await assert.rejects(withStudentRequestTimeout(async () => {
    await new Promise(() => {}); acknowledged = true;
  }, 5), /thử lại/);
  assert.equal(acknowledged, false);
});

test('a late receipt from a timed-out request cannot win against the explicit retry', async () => {
  let deliver: (value: string) => void = () => {};
  const old = withStudentRequestTimeout(() => new Promise<string>(resolve => { deliver = resolve; }), 5);
  await assert.rejects(old, /chưa phản hồi/);
  const current = await withStudentRequestTimeout(async () => 'retry receipt');
  deliver('old receipt');
  assert.equal(current, 'retry receipt');
  await assert.rejects(old, /chưa phản hồi/);
});

test('server/network failures remain failures and never become a successful save', async () => {
  const problem = new Error('offline');
  await assert.rejects(withStudentRequestTimeout(async () => { throw problem; }), error => error === problem);
});
