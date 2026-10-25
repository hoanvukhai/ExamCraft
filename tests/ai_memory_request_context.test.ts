import test from 'node:test';
import assert from 'node:assert/strict';
import { MemoryGate, canActOnMemory, memoryDraftFingerprint, parseMemoryList, parseSavedMemory, shouldClearDraft, type MemoryDraft } from '../src/lib/ai-memory-request-context';
import { createRequestIdentity } from '../src/lib/template-request-context';

const row = (id: string, over: Record<string, unknown> = {}) => ({ id, title: 'T ' + id, insight: 'Nội dung ' + id, category: 'PEDAGOGICAL_STYLE', subject: 'toan', confidence: 1, isActive: true, sourceAction: 'MANUAL_NOTE', createdAt: '2026-10-24T00:00:00Z', ...over });

test('a second click while a request runs is refused; only the holder can free the slot', () => {
  const gate = new MemoryGate();
  const first = gate.begin()!;
  assert.equal(gate.begin(), null);
  assert.equal(first.release(), true);
  assert.equal(first.release(), false, 'releasing twice does not free the next request');
  const second = gate.begin()!;
  assert.equal(first.release(), false);
  assert.equal(second.isLive(), true);
});

test('closing the dialog aborts the request and nothing from it can touch state afterwards', () => {
  const gate = new MemoryGate();
  const token = gate.begin()!;
  gate.dispose();
  assert.equal(token.signal.aborted, true);
  assert.equal(token.isLive(), false);
  assert.equal(token.release(), false, 'a closed dialog is not told to clear its busy flag');
  assert.equal(gate.begin(), null);
});

test('a response of the old gate (strict-mode re-run or reopen) can neither lock, release nor un-busy the new gate', () => {
  const oldGate = new MemoryGate(), oldToken = oldGate.begin()!;
  oldGate.dispose();
  const newGate = new MemoryGate(), newToken = newGate.begin()!;
  assert.equal(oldToken.lockAccount(), false, 'a stale 401/ACCOUNT_CHANGED must not lock the new context');
  assert.equal(newGate.locked, false);
  assert.equal(oldToken.release(), false, 'stale finally must not clear the new request busy flag');
  assert.equal(newToken.isLive(), true);
  assert.equal(newToken.signal.aborted, false);
});

test('a live account failure aborts the request, blocks every later one and still lets the failing request clear its own busy flag', () => {
  const gate = new MemoryGate(), token = gate.begin()!;
  assert.equal(token.lockAccount(), true);
  assert.equal(token.signal.aborted, true);
  assert.equal(token.isLive(), false);
  assert.equal(gate.locked, true);
  assert.equal(token.release(), true);
  assert.equal(gate.begin(), null, 'no retry under the account that is signed in now');
  assert.equal(token.lockAccount(), false);
});

test('delete/activate need the same owner and a row of the list by id; position and other owners never count', () => {
  const list = { ownerId: 'teacher-a', items: [{ id: 'm1' }, { id: 'm2' }] };
  assert.equal(canActOnMemory(list, 'teacher-a', 'm2'), true);
  assert.equal(canActOnMemory(list, 'teacher-b', 'm2'), false, 'same memory id in another account context');
  assert.equal(canActOnMemory(list, null, 'm2'), false, 'account not confirmed yet');
  assert.equal(canActOnMemory(list, 'teacher-a', 'm3'), false, 'row vanished after a reload');
  assert.equal(canActOnMemory(list, 'teacher-a', '1'), false, 'an index is not an identity');
  assert.equal(canActOnMemory({ ownerId: 'teacher-a', items: [] }, 'teacher-a', 'm1'), false);
});

test('list response is checked before it replaces the list: bad shape throws, bad or repeated rows are counted and dropped', () => {
  for (const broken of [null, {}, { memories: 'x' }, { memories: {} }]) assert.throws(() => parseMemoryList(broken), /không đọc được/);
  const ok = parseMemoryList({ memories: [row('a'), row('a', { title: 'again' }), row('b', { isActive: 'yes' }), { id: 'c' }, null, row('d', { confidence: 'high', subject: 7 }), row('', {}), row('e', { insight: 5 })] });
  assert.deepEqual(ok.items.map(item => item.id), ['a', 'd']);
  assert.equal(ok.skipped, 6);
  assert.deepEqual([ok.items[1].confidence, ok.items[1].subject], [0, 'all'], 'optional fields fall back instead of crashing the card');
  assert.equal(parseMemoryList({ memories: [] }).items.length, 0);
});

test('a save is only acknowledged when the saved note comes back with its id', () => {
  assert.equal(parseSavedMemory({ success: true, memory: row('new') }).id, 'new');
  for (const broken of [null, {}, { success: true }, { memory: { title: 'x' } }, { memory: row('x', { isActive: undefined }) }]) assert.throws(() => parseSavedMemory(broken), /Chưa chắc/);
});

const draft = (over: Partial<MemoryDraft> = {}): MemoryDraft => ({ title: 'Quy tắc', insight: 'Không cho bấm ngược nghiệm', category: 'TRICK_OR_TRAP', subject: 'toan', ...over });

test('a retry after a failed save keeps the request ID; any edit, even whitespace-only is the same, a real change is new', () => {
  let n = 0;
  const idFor = createRequestIdentity(() => 'req-' + ++n);
  const first = idFor(memoryDraftFingerprint(draft()));
  assert.equal(idFor(memoryDraftFingerprint(draft())), first);
  assert.equal(idFor(memoryDraftFingerprint(draft({ title: '  Quy tắc  ' }))), first, 'trailing spaces are trimmed by the server too');
  for (const change of [{ title: 'Quy tắc khác' }, { insight: 'Nội dung khác' }, { category: 'EXPLANATION_RULE' }, { subject: 'ly' }] as Partial<MemoryDraft>[])
    assert.notEqual(idFor(memoryDraftFingerprint(draft(change))), first, JSON.stringify(change));
});

test('late save receipt clears the form only if the teacher has not typed since pressing Save', () => {
  const sent = draft();
  assert.equal(shouldClearDraft(sent, draft()), true);
  assert.equal(shouldClearDraft(sent, draft({ insight: sent.insight + ' thêm một ý mới' })), false, 'newer text must survive the earlier receipt');
  assert.equal(shouldClearDraft(sent, draft({ title: '' })), false);
  assert.equal(shouldClearDraft(sent, draft({ category: 'EXPLANATION_RULE' })), false);
  assert.equal(shouldClearDraft(sent, draft({ subject: 'hoa' })), false);
});

test('a listed note carries its evidence, doubts and a plain-words source, and older rows without them still list', () => {
  const base = { id: 'n1', title: 'T', insight: 'I', category: 'PEDAGOGICAL_STYLE', isActive: false, subject: 'toan', sourceAction: 'AI_ANALYSIS_PENDING', confidence: 0.9, createdAt: '2026-10-26' };
  const { items } = parseMemoryList({ memories: [{ ...base, evidence: 'trích', uncertainty: 'ít dữ liệu', sourceRef: { kind: 'exam', examTitle: 'Đề 15 phút', examVersion: 3, questionIds: ['a', 'b'] } }, { ...base, id: 'n2' }] });
  assert.equal(items[0].evidence, 'trích'); assert.equal(items[0].uncertainty, 'ít dữ liệu'); assert.equal(items[0].sourceNote, 'một đề, đề "Đề 15 phút" bản 3, 2 câu');
  assert.equal(items[1].evidence, undefined); assert.equal(items[1].sourceNote, undefined);
});
