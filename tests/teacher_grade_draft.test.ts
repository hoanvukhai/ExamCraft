import test from 'node:test';
import assert from 'node:assert/strict';
import { canApplyGradeDraft, discardWriterGradeDraft, exportGradeDraft, gradeDraftKey, parseScoreText, readGradeDrafts, retireWriterGradeDraft, stableJson, writeGradeDraft, type GradeDraftContext, type GradeDraftStorage } from '../src/lib/teacher-grade-draft';

const memory = () => {
  const data = new Map<string, string>();
  const storage: GradeDraftStorage & { data: Map<string, string> } = { data, get length() { return data.size; }, key: i => [...data.keys()][i] ?? null, getItem: k => data.get(k) ?? null, setItem: (k, v) => { data.set(k, v); }, removeItem: k => { data.delete(k); } };
  return storage;
};
const ctx: GradeDraftContext = { teacherId: 'teacher-a', attemptId: 'att-1', questionKey: 'q1' };
const input = (over: Record<string, unknown> = {}) => ({ baseRevision: 'rev-1', score: '1,5', comment: 'Làm tốt', ...over });
const NOW = new Date('2026-10-24T08:00:00Z');

test('keys never collide across teacher, attempt, question and writer, even with separators in the ids', () => {
  const keys = new Set([gradeDraftKey(ctx, 'w1'), gradeDraftKey({ ...ctx, teacherId: 'teacher-b' }, 'w1'), gradeDraftKey({ ...ctx, attemptId: 'att-2' }, 'w1'), gradeDraftKey({ ...ctx, questionKey: 'q2' }, 'w1'), gradeDraftKey(ctx, 'w2'),
    gradeDraftKey({ teacherId: 't', attemptId: 'a:b', questionKey: 'c' }, 'w'), gradeDraftKey({ teacherId: 't', attemptId: 'a', questionKey: 'b:c' }, 'w'), gradeDraftKey({ teacherId: 't:a', attemptId: 'b', questionKey: 'c' }, 'w'), gradeDraftKey({ teacherId: 't', attemptId: 'a:b', questionKey: 'c:w' }, '')]);
  assert.equal(keys.size, 9);
});

test('what the teacher typed comes back exactly: blank, 0, comma decimals, invalid text, comment lines and rubric null versus empty', () => {
  const store = memory();
  const cases = [{ score: '' }, { score: '0' }, { score: '0.0' }, { score: '1,5' }, { score: 'abc' }, { score: ' 2 ' }, { comment: '' }, { comment: 'Dòng 1\nDòng 2  ' }, { rubric: null }, { rubric: {} }, { rubric: { r1: 0, r2: false, r3: '', r4: null } }];
  for (const [index, over] of cases.entries()) {
    assert.equal(writeGradeDraft(() => store, ctx, `w${index}`, input(over), NOW), 'saved');
  }
  const { entries, unavailable } = readGradeDrafts(() => store, 'teacher-a', 'att-1', 'q1');
  assert.equal(unavailable, false);
  assert.equal(entries.length, cases.length);
  for (const [index, over] of cases.entries()) {
    const value = entries.find(entry => entry.value?.writerId === `w${index}`)!.value!;
    const expected = { score: '1,5', comment: 'Làm tốt', rubric: null, ...over };
    assert.deepEqual([value.score, value.comment, stableJson(value.rubric)], [expected.score, expected.comment, stableJson(expected.rubric)], JSON.stringify(over));
  }
});

test('blank is not 0 and invalid text is not 0; the parent can show which one the teacher actually typed', () => {
  assert.deepEqual(parseScoreText(''), { kind: 'blank' });
  assert.deepEqual(parseScoreText('   '), { kind: 'blank' });
  assert.deepEqual(parseScoreText('0'), { kind: 'number', value: 0 });
  assert.deepEqual(parseScoreText('1,75'), { kind: 'number', value: 1.75 });
  for (const bad of ['abc', '-1', '1e1', '--2', '1.2.3', 'NaN']) assert.deepEqual(parseScoreText(bad), { kind: 'invalid' }, bad);
});

test('another teacher, attempt or question never sees or receives this draft; a record copied under another key is not trusted', () => {
  const store = memory();
  writeGradeDraft(() => store, ctx, 'w1', input(), NOW);
  assert.equal(readGradeDrafts(() => store, 'teacher-b', 'att-1').entries.length, 0);
  assert.equal(readGradeDrafts(() => store, 'teacher-a', 'att-2').entries.length, 0);
  assert.equal(readGradeDrafts(() => store, 'teacher-a', 'att-1', 'q2').entries.length, 0);
  assert.equal(readGradeDrafts(() => store, 'teacher-a', 'att-1').entries.length, 1, 'whole-attempt listing includes the question');
  const raw = store.data.get(gradeDraftKey(ctx, 'w1'))!;
  store.data.set(gradeDraftKey({ ...ctx, questionKey: 'q2' }, 'w1'), raw);
  store.data.set(gradeDraftKey({ ...ctx, teacherId: 'teacher-b' }, 'w1'), raw);
  const q2 = readGradeDrafts(() => store, 'teacher-a', 'att-1', 'q2').entries;
  assert.equal(q2.length, 1);
  assert.equal(q2[0].value, undefined, 'copied under question q2: kept as raw for export, never applied');
  assert.equal(q2[0].raw, raw);
  assert.equal(readGradeDrafts(() => store, 'teacher-b', 'att-1').entries[0].value, undefined);
});

test('two pages never overwrite or retire each other', () => {
  const store = memory();
  assert.equal(writeGradeDraft(() => store, ctx, 'tab-a', input({ score: '1', comment: 'A' }), NOW), 'saved');
  assert.equal(writeGradeDraft(() => store, ctx, 'tab-b', input({ score: '2', comment: 'B' }), NOW), 'saved');
  assert.equal(readGradeDrafts(() => store, 'teacher-a', 'att-1', 'q1').entries.length, 2);
  assert.equal(retireWriterGradeDraft(() => store, ctx, 'tab-a', { manualScore: 1, comment: 'A' }), true);
  const left = readGradeDrafts(() => store, 'teacher-a', 'att-1', 'q1').entries;
  assert.deepEqual(left.map(entry => entry.value?.comment), ['B'], 'tab-b keeps its own draft');
  assert.equal(discardWriterGradeDraft(() => store, ctx, 'tab-a'), true, 'already gone is fine');
  assert.equal(readGradeDrafts(() => store, 'teacher-a', 'att-1', 'q1').entries.length, 1);
});

test('an acknowledgement retires the draft only when the server holds exactly what was typed', () => {
  const store = memory(), slot = () => store.data.has(gradeDraftKey(ctx, 'w'));
  const put = (over: Record<string, unknown>) => writeGradeDraft(() => store, ctx, 'w', input(over), NOW);
  put({ score: '1,75', comment: 'ok' });
  assert.equal(retireWriterGradeDraft(() => store, ctx, 'w', { manualScore: 1.75, comment: 'ok' }), true, '1,75 typed equals 1.75 saved');
  assert.equal(slot(), false);
  put({ score: '1.5', comment: 'đã gõ thêm sau khi gửi' });
  assert.equal(retireWriterGradeDraft(() => store, ctx, 'w', { manualScore: 1.5, comment: 'bản đã gửi' }), false, 'late receipt after typing more: keep the newer text');
  assert.equal(slot(), true);
  assert.equal(retireWriterGradeDraft(() => store, ctx, 'w', { manualScore: 2, comment: 'đã gõ thêm sau khi gửi' }), false, 'different score');
  put({ score: '', comment: '' });
  assert.equal(retireWriterGradeDraft(() => store, ctx, 'w', { manualScore: 0, comment: null }), false, 'a blank draft is not acknowledged by a graded 0');
  assert.equal(slot(), true);
  assert.equal(retireWriterGradeDraft(() => store, ctx, 'w', { manualScore: null, comment: null }), true, 'pending with no comment equals a blank draft');
  put({ score: '0', comment: '' });
  assert.equal(retireWriterGradeDraft(() => store, ctx, 'w', { manualScore: null, comment: null }), false, 'a typed 0 is not the pending state');
  assert.equal(retireWriterGradeDraft(() => store, ctx, 'w', { manualScore: 0, comment: '' }), true);
  put({ score: 'abc' });
  assert.equal(retireWriterGradeDraft(() => store, ctx, 'w', { manualScore: 0, comment: 'Làm tốt' }), false, 'invalid text is never treated as 0');
  put({ rubric: { r1: 1 } });
  assert.equal(retireWriterGradeDraft(() => store, ctx, 'w', { manualScore: 1.5, comment: 'Làm tốt' }), false, 'a rubric the server does not hold yet stays');
  assert.equal(retireWriterGradeDraft(() => store, ctx, 'w', { manualScore: 1.5, comment: 'Làm tốt', rubric: { r1: 1 } }), true);
});

test('storage denied, full or hostile never throws and never destroys unreadable data', () => {
  const denied = () => { throw new Error('SecurityError'); };
  assert.deepEqual(readGradeDrafts(denied, 'teacher-a', 'att-1'), { entries: [], unavailable: true });
  assert.equal(writeGradeDraft(denied, ctx, 'w', input(), NOW), 'unavailable');
  assert.equal(retireWriterGradeDraft(denied, ctx, 'w', { manualScore: 1, comment: null }), false);
  assert.equal(discardWriterGradeDraft(denied, ctx, 'w'), false);
  const full = memory(); full.setItem = () => { throw new Error('QuotaExceededError'); };
  assert.equal(writeGradeDraft(() => full, ctx, 'w', input(), NOW), 'unavailable');
  const store = memory(), key = gradeDraftKey(ctx, 'w');
  for (const bad of ['{broken', 'null', '[]', JSON.stringify({ v: 2, teacherId: 'teacher-a' }), JSON.stringify({ v: 1, teacherId: 'teacher-a', attemptId: 'att-1', questionKey: 'q1', writerId: 'w', baseRevision: 'r', score: 5, comment: '', rubric: null, savedAt: 'x' }), JSON.stringify({ v: 1, teacherId: 'teacher-a', attemptId: 'att-1', questionKey: 'q1', writerId: 'w', baseRevision: 'r', score: '', comment: '', rubric: [], savedAt: 'x' }), 'x'.repeat(300 * 1024)]) {
    store.data.set(key, bad);
    const { entries } = readGradeDrafts(() => store, 'teacher-a', 'att-1', 'q1');
    assert.equal(entries[0].value, undefined);
    assert.equal(entries[0].raw, bad, 'raw bytes available for export');
    assert.equal(writeGradeDraft(() => store, ctx, 'w', input(), NOW), 'blocked', 'own slot holding unreadable data is not overwritten');
    assert.equal(retireWriterGradeDraft(() => store, ctx, 'w', { manualScore: 1.5, comment: 'Làm tốt' }), false);
    assert.equal(discardWriterGradeDraft(() => store, ctx, 'w'), false);
    assert.equal(store.data.get(key), bad, 'never deleted');
  }
  assert.equal(writeGradeDraft(() => store, { ...ctx, questionKey: '' }, 'w', input(), NOW), 'invalid');
  assert.equal(writeGradeDraft(() => store, ctx, '', input(), NOW), 'invalid');
  assert.equal(writeGradeDraft(() => store, ctx, 'z', input({ comment: 'x'.repeat(5001) }), NOW), 'too_large');
  assert.equal(writeGradeDraft(() => store, ctx, 'z', input({ rubric: { big: 'x'.repeat(300 * 1024) } }), NOW), 'too_large');
});

test('opening a draft: same base is applicable, older base is comparison only, other teacher/attempt or a vanished question never', () => {
  const store = memory();
  writeGradeDraft(() => store, ctx, 'w', input(), NOW);
  const record = readGradeDrafts(() => store, 'teacher-a', 'att-1', 'q1').entries[0].value!;
  const open = { teacherId: 'teacher-a', attemptId: 'att-1' };
  assert.deepEqual(canApplyGradeDraft(open, { q1: 'rev-1' }, record), { allowed: true, mode: 'same_base' });
  assert.deepEqual(canApplyGradeDraft(open, { q1: 'rev-2' }, record), { allowed: true, mode: 'stale_base' }, 'caller keeps the OLD base so saving stays blocked');
  assert.deepEqual(canApplyGradeDraft(open, { q2: 'rev-1' }, record), { allowed: false, reason: 'question_missing' });
  assert.deepEqual(canApplyGradeDraft(open, {}, record), { allowed: false, reason: 'question_missing' });
  assert.deepEqual(canApplyGradeDraft(open, Object.create({ q1: 'rev-1' }), record), { allowed: false, reason: 'question_missing' }, 'inherited properties are not questions');
  assert.deepEqual(canApplyGradeDraft({ ...open, teacherId: 'teacher-b' }, { q1: 'rev-1' }, record), { allowed: false, reason: 'foreign' });
  assert.deepEqual(canApplyGradeDraft({ ...open, attemptId: 'att-2' }, { q1: 'rev-1' }, record), { allowed: false, reason: 'foreign' });
});

test('export keeps the stored bytes untouched, valid or not', () => {
  const store = memory(), key = gradeDraftKey(ctx, 'w');
  store.data.set(key, '{"broken": 0, \n  "kept": "đúng từng byte"');
  const [entry] = readGradeDrafts(() => store, 'teacher-a', 'att-1', 'q1').entries;
  assert.equal(exportGradeDraft(entry, 0).raw, '{"broken": 0, \n  "kept": "đúng từng byte"');
  assert.match(exportGradeDraft(entry, 2).fileName, /-3\.json$/);
  assert.equal(JSON.stringify(exportGradeDraft(entry, 0)).includes('teacher-a'), false, 'file name carries no account id');
});
