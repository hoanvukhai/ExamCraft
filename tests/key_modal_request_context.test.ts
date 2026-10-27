import test from 'node:test';
import assert from 'node:assert/strict';
import { KeyContext, KeyGate, applyKeyTestResult, canActOnKey, classifyAddFailure, nextModelDraft, parseKeyList, parseSavedKey, pruneKeyTestResults, shouldClearKeyDraft } from '../src/lib/key-modal-request-context';

const key = (id: string, over: Record<string, unknown> = {}) => ({ id, label: 'Khóa ' + id, keyMasked: 'AIza…' + id, isActive: true, usedToday: 2, errorCount: 0, ...over });

test('key list response: bad shape throws and keeps the old list; bad or repeated rows are counted; quota and models fall back safely', () => {
  for (const broken of [null, {}, { keys: 'x' }, { keys: {} }]) assert.throws(() => parseKeyList(broken), /không đọc được/);
  const parsed = parseKeyList({ keys: [key('a'), key('a', { label: 'again' }), key('b', { isActive: 'yes' }), { id: 'c' }, null, key('d', { usedToday: 'many', errorCount: -3 }), key('', {})], poolQuota: { usedToday: 3 }, availableModels: [{ id: 'gemini-x', name: 'X' }, { id: 5 }, null], selectedAiModel: 'gemini-x' });
  assert.deepEqual(parsed.keys.map(row => row.id), ['a', 'd']);
  assert.equal(parsed.skipped, 5);
  assert.deepEqual([parsed.keys[1].usedToday, parsed.keys[1].errorCount], [0, 0], 'a missing or negative count never shows as a real number');
  assert.deepEqual(parsed.models, [{ id: 'gemini-x', name: 'X' }]);
  assert.equal(parsed.selectedModel, 'gemini-x');
  assert.deepEqual(parsed.quota, { usedToday: 3 });
  const bare = parseKeyList({ keys: [], poolQuota: { limit: 'x' }, availableModels: 'nope' });
  assert.deepEqual([bare.quota, bare.models, bare.selectedModel], [null, [], '']);
});

test('toggle, delete and test need the same owner and a row of the list by id; position and other owners never count', () => {
  const list = { ownerId: 'teacher-a', items: [{ id: 'k1' }, { id: 'k2' }] };
  assert.equal(canActOnKey(list, 'teacher-a', 'k2'), true);
  assert.equal(canActOnKey(list, 'teacher-b', 'k2'), false);
  assert.equal(canActOnKey(list, null, 'k2'), false);
  assert.equal(canActOnKey(list, 'teacher-a', 'k3'), false, 'deleted in another tab');
  assert.equal(canActOnKey(list, 'teacher-a', '0'), false, 'an index is not an identity');
});

test('a late test reply never lands on another key, and refreshed lists drop results of keys that vanished', () => {
  const results = { k1: 'Đọc được 3 model' };
  assert.deepEqual(applyKeyTestResult(results, [{ id: 'k1' }, { id: 'k2' }], 'k2', 'Lỗi quyền'), { k1: 'Đọc được 3 model', k2: 'Lỗi quyền' });
  assert.equal(applyKeyTestResult(results, [{ id: 'k1' }], 'k2', 'late'), results, 'k2 was deleted while its test ran');
  assert.deepEqual(pruneKeyTestResults({ k1: 'a', k2: 'b' }, [{ id: 'k2' }]), { k2: 'b' });
  assert.deepEqual(pruneKeyTestResults({}, []), {});
});

test('a save receipt clears the form only if it still holds exactly what was sent; the secret typed later survives', () => {
  const sent = { label: 'Cá nhân', apiKey: 'sent-secret-0001' };
  assert.equal(shouldClearKeyDraft(sent, { ...sent }), true);
  assert.equal(shouldClearKeyDraft(sent, { ...sent, apiKey: 'another-secret-0002' }), false, 'a different key typed after pressing Save must not be wiped');
  assert.equal(shouldClearKeyDraft(sent, { ...sent, label: 'Tên mới' }), false);
  assert.equal(shouldClearKeyDraft(sent, { label: '', apiKey: '' }), false, 'the teacher cleared the form themselves: that is a different state, nothing to wipe but also nothing was kept by us');
});

test('an add whose outcome is unknown must make the teacher check the list before saving again', () => {
  for (const unknown of [null, 0, 500, 502, 503]) assert.equal(classifyAddFailure(unknown), 'unknown_outcome', String(unknown));
  for (const rejected of [400, 401, 403, 409, 429]) assert.equal(classifyAddFailure(rejected), 'rejected', String(rejected));
});

test('refresh or save replies bring the saved model back without overwriting newer typing', () => {
  assert.deepEqual(nextModelDraft('gemini-a', 'gemini-a', 'gemini-b'), { draft: 'gemini-b', baseline: 'gemini-b' }, 'untouched box follows the server');
  assert.deepEqual(nextModelDraft('gemini-typed', 'gemini-a', 'gemini-b'), { draft: 'gemini-typed', baseline: 'gemini-b' }, 'refresh keeps the unsaved model and records the new baseline');
  assert.deepEqual(nextModelDraft('gemini-c', 'gemini-b', 'gemini-b'), { draft: 'gemini-c', baseline: 'gemini-b' }, 'receipt of an earlier save keeps what was typed after it');
  assert.deepEqual(nextModelDraft('gemini-b', 'gemini-b', 'gemini-b'), { draft: 'gemini-b', baseline: 'gemini-b' });
});

test('gate: one request at a time; old-context replies cannot lock or un-busy the new context', () => {
  const gate = new KeyGate(), first = gate.begin()!;
  assert.equal(gate.begin(), null, 'double click');
  assert.equal(first.release(), true);
  assert.equal(first.release(), false);
  const oldGate = new KeyGate(), oldToken = oldGate.begin()!;
  oldGate.dispose();
  const newGate = new KeyGate(), newToken = newGate.begin()!;
  assert.equal(oldToken.lockAccount(), false);
  assert.equal(oldToken.release(), false);
  assert.equal(newGate.locked, false);
  assert.equal(newToken.isLive(), true);
  const lockedGate = new KeyGate(), lockedToken = lockedGate.begin()!;
  assert.equal(lockedToken.lockAccount(), true);
  assert.equal(lockedToken.signal.aborted, true);
  assert.equal(lockedToken.release(), true, 'the failing request still clears its own busy flag');
  assert.equal(lockedGate.begin(), null, 'no retry under the account signed in now');
});

test('an add reply counts only when it names the saved key; a 200 with a broken body claims nothing', () => {
  assert.equal(parseSavedKey({ success: true, key: key('new') })?.id, 'new');
  assert.equal(parseSavedKey({ success: true, replayed: true, key: key('again') })?.id, 'again', 'a replayed receipt of the same request is an acknowledgement too');
  for (const broken of [null, undefined, '', {}, { success: true }, { success: true, key: null }, { success: true, key: {} }, { success: false, key: key('x') }, { key: key('x') }, { success: true, key: key('x', { keyMasked: undefined }) }, { success: true, key: key('x', { isActive: 'true' }) }, { success: true, key: key('', {}) }, { success: 'true', key: key('x') }])
    assert.equal(parseSavedKey(broken), null);
});

test('both request lanes share one account-loss fact', () => {
  const ctx = new KeyContext(), actions = ctx.begin('main')!, logs = ctx.begin('logs')!;
  assert.equal(ctx.isLive(actions) && ctx.isLive(logs), true);
  assert.equal(ctx.loseAccount('logs', logs), true, 'the log lane found out');
  assert.equal(ctx.isLive(actions), false, 'the action request still in flight can no longer clear the form or change the list');
  assert.equal(actions.signal.aborted, true);
  assert.equal(ctx.accountLost, true);
  assert.equal(ctx.begin('main'), null);
  assert.equal(ctx.begin('logs'), null);
  assert.equal(actions.release(), false, 'its lane was closed with it');
  assert.equal(ctx.loseAccount('main', actions), false, 'a dead token cannot announce a second loss');
  const other = new KeyContext(), mainFirst = other.begin('main')!, logsPending = other.begin('logs')!;
  assert.equal(other.loseAccount('main', mainFirst), true);
  assert.equal(other.isLive(logsPending), false, 'and the other way round');
  assert.equal(mainFirst.release(), true, 'the lane that found the loss can still clear its own busy flag');
});

test('a token of an older context never locks, revives or releases a newer one', () => {
  const oldCtx = new KeyContext(), oldToken = oldCtx.begin('main')!;
  oldCtx.dispose();
  const newCtx = new KeyContext(), newMain = newCtx.begin('main')!, newLogs = newCtx.begin('logs')!;
  assert.equal(newCtx.loseAccount('main', oldToken), false, 'a stale 401 must not lock the new context');
  assert.equal(oldCtx.loseAccount('main', oldToken), false);
  assert.equal(newCtx.accountLost, false);
  assert.equal(newCtx.isLive(oldToken), false);
  assert.equal(newCtx.isLive(newMain) && newCtx.isLive(newLogs), true);
  assert.equal(oldToken.release(), false);
});

test('closing the dialog ends both lanes at once, before any effect cleanup could run', () => {
  const ctx = new KeyContext(), actions = ctx.begin('main')!, logs = ctx.begin('logs')!;
  ctx.dispose();
  assert.deepEqual([ctx.isLive(actions), ctx.isLive(logs), actions.signal.aborted, logs.signal.aborted], [false, false, true, true]);
  assert.equal(ctx.begin('main'), null);
  assert.equal(ctx.begin('logs'), null);
  assert.equal(ctx.accountLost, false, 'closing is not an account loss');
});
