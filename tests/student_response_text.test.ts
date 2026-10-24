import test from 'node:test';
import assert from 'node:assert/strict';
import { studentResponseText } from '../src/lib/student-response-text';

test('teacher response text preserves zero and false while showing missing answers clearly', () => {
  for (const response of [null, undefined, '']) assert.equal(studentResponseText({}, response), 'Chưa trả lời');
  assert.equal(studentResponseText({}, 0), '0'); assert.equal(studentResponseText({}, '0'), '0');
  assert.equal(studentResponseText({ type: 'TRUE_FALSE_GROUP' }, { a: false, b: true }), 'a) Sai; b) Đúng');
});
test('matching responses use independent presentation keys, never infer an omitted pair', () => {
  const q = { type: 'MATCHING', payload: { matchingPairs: [{ left: '1', right: 'Một' }, { left: '2', right: 'Hai' }] } };
  assert.equal(studentResponseText(q, { 'left-0': 'right-1', 'left-1': 'right-0' }), '1 → Một; 2 → Hai');
  assert.equal(studentResponseText(q, { 'left-0': 'right-0' }), '1 → Hai; 2 → Chưa chọn');
});
test('ordering shows actual student order without replacing it with the correct order', () => {
  const q = { type: 'ORDERING', payload: { correctOrder: ['B', 'A'] } };
  assert.equal(studentResponseText(q, ['item-0', 'item-1']), 'A → B');
  assert.equal(studentResponseText(q, []), 'Chưa trả lời');
});
