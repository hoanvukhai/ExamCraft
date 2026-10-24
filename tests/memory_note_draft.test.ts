import test from 'node:test';
import assert from 'node:assert/strict';
import { canApplyNoteDraft, discardNoteDraftEntry, exportNoteDraft, isKnownNoteCategory, noteDraftKey, readNoteDrafts, retireWriterNoteDraft, writeNoteDraft, type NoteDraftStorage, type NoteFields } from '../src/lib/memory-note-draft';

const memory = () => {
  const data = new Map<string, string>();
  const storage: NoteDraftStorage & { data: Map<string, string> } = { data, get length() { return data.size; }, key: i => [...data.keys()][i] ?? null, getItem: k => data.get(k) ?? null, setItem: (k, v) => { data.set(k, v); }, removeItem: k => { data.delete(k); } };
  return storage;
};
const fields = (over: Partial<NoteFields> = {}): NoteFields => ({ title: 'Không cho bấm ngược nghiệm', insight: 'Hệ số phải khiến CALC không ra ngay kết quả.', category: 'TRICK_OR_TRAP', subject: 'toan', ...over });
const NOW = new Date('2026-10-24T08:00:00Z');

test('keys never collide across accounts and pages, even with separators in the ids', () => {
  const keys = new Set([noteDraftKey('a', 'w1'), noteDraftKey('b', 'w1'), noteDraftKey('a', 'w2'), noteDraftKey('a:b', 'c'), noteDraftKey('a', 'b:c'), noteDraftKey('a:b:manual-note', 'c')]);
  assert.equal(keys.size, 6);
});

test('account A\'s draft is never offered, applied or removed for account B', () => {
  const store = memory();
  assert.equal(writeNoteDraft(() => store, 'teacher-a', 'w', fields(), NOW), 'saved');
  assert.deepEqual(readNoteDrafts(() => store, 'teacher-b').entries, []);
  assert.equal(readNoteDrafts(() => store, 'teacher-a').entries.length, 1);
  const raw = store.data.get(noteDraftKey('teacher-a', 'w'))!;
  store.data.set(noteDraftKey('teacher-b', 'w'), raw); // a copy under B's key
  const [copied] = readNoteDrafts(() => store, 'teacher-b').entries;
  assert.equal(copied.value, undefined, 'a record that names account A is not trusted under account B');
  assert.equal(copied.raw, raw);
  const [own] = readNoteDrafts(() => store, 'teacher-a').entries;
  assert.deepEqual(canApplyNoteDraft('teacher-b', own.value!, fields({ title: '', insight: '' })), { allowed: false, reason: 'foreign' });
  assert.equal(discardNoteDraftEntry(() => store, 'teacher-b', own), false, 'B cannot delete A\'s draft through the panel');
  assert.equal(retireWriterNoteDraft(() => store, 'teacher-b', 'w', fields()), false, 'the copy under B is raw only and stays');
  assert.equal(store.data.has(noteDraftKey('teacher-a', 'w')), true);
});

test('the typed text comes back exactly, including spaces, new lines and characters that look like markup', () => {
  const store = memory(), typed = fields({ title: '  Tiêu đề có khoảng trắng  ', insight: 'Dòng 1\n\nDòng 2 <b>x</b> "trích" \\ ', category: 'EXPLANATION_RULE', subject: 'ly' });
  assert.equal(writeNoteDraft(() => store, 'teacher-a', 'w', typed, NOW), 'saved');
  const [entry] = readNoteDrafts(() => store, 'teacher-a').entries;
  const { title, insight, category, subject } = entry.value!;
  assert.deepEqual({ title, insight, category, subject }, typed);
});

test('a form with nothing typed writes nothing and does not delete an earlier draft', () => {
  const store = memory();
  assert.equal(writeNoteDraft(() => store, 'teacher-a', 'w', fields(), NOW), 'saved');
  assert.equal(writeNoteDraft(() => store, 'teacher-a', 'w', fields({ title: '  ', insight: '' }), NOW), 'empty');
  assert.equal(readNoteDrafts(() => store, 'teacher-a').entries[0].value?.title, 'Không cho bấm ngược nghiệm', 'emptiness never erases a backup');
  assert.equal(writeNoteDraft(() => store, 'teacher-a', 'w2', fields({ title: 'chỉ có tiêu đề', insight: '' }), NOW), 'saved', 'a title alone is worth keeping');
});

test('two pages keep separate drafts; an acknowledgement only retires its own page and only the exact note', () => {
  const store = memory();
  writeNoteDraft(() => store, 'teacher-a', 'tab-1', fields({ title: 'Một' }), NOW);
  writeNoteDraft(() => store, 'teacher-a', 'tab-2', fields({ title: 'Hai' }), NOW);
  assert.equal(readNoteDrafts(() => store, 'teacher-a').entries.length, 2);
  assert.equal(retireWriterNoteDraft(() => store, 'teacher-a', 'tab-1', fields({ title: 'Một' })), true);
  assert.deepEqual(readNoteDrafts(() => store, 'teacher-a').entries.map(entry => entry.value?.title), ['Hai']);
});

test('a late acknowledgement never removes text typed after the request was sent', () => {
  const store = memory(), slot = () => store.data.has(noteDraftKey('teacher-a', 'w'));
  const sent = fields();
  writeNoteDraft(() => store, 'teacher-a', 'w', { ...sent, insight: sent.insight + ' Thêm một ý mới gõ sau khi bấm Lưu.' }, NOW);
  assert.equal(retireWriterNoteDraft(() => store, 'teacher-a', 'w', sent), false);
  assert.equal(slot(), true, 'the newer draft survives the earlier receipt');
  for (const change of [{ title: 'Tiêu đề khác' }, { category: 'EXPLANATION_RULE' }, { subject: 'hoa' }] as Partial<NoteFields>[]) {
    writeNoteDraft(() => store, 'teacher-a', 'w', fields(change), NOW);
    assert.equal(retireWriterNoteDraft(() => store, 'teacher-a', 'w', sent), false, JSON.stringify(change));
  }
  writeNoteDraft(() => store, 'teacher-a', 'w', { ...sent, title: `  ${sent.title}  `, insight: `${sent.insight}\n` }, NOW);
  assert.equal(retireWriterNoteDraft(() => store, 'teacher-a', 'w', sent), true, 'the server trims, so surrounding spaces still match the saved note');
  assert.equal(slot(), false);
});

test('storage denied, full or holding junk never throws and never destroys unreadable data', () => {
  const denied = () => { throw new Error('SecurityError'); };
  assert.deepEqual(readNoteDrafts(denied, 'teacher-a'), { entries: [], unavailable: true });
  assert.equal(writeNoteDraft(denied, 'teacher-a', 'w', fields(), NOW), 'unavailable');
  assert.equal(retireWriterNoteDraft(denied, 'teacher-a', 'w', fields()), false);
  const full = memory(); full.setItem = () => { throw new Error('QuotaExceededError'); };
  assert.equal(writeNoteDraft(() => full, 'teacher-a', 'w', fields(), NOW), 'unavailable');
  const store = memory(), key = noteDraftKey('teacher-a', 'w');
  const valid = { v: 1, context: 'manual-note', ownerId: 'teacher-a', writerId: 'w', title: 't', insight: 'i', category: 'TRICK_OR_TRAP', subject: 'toan', savedAt: 'x' };
  for (const bad of ['{broken', 'null', '[]', JSON.stringify({ ...valid, v: 2 }), JSON.stringify({ ...valid, context: 'other' }), JSON.stringify({ ...valid, title: 5 }), JSON.stringify({ ...valid, ownerId: '' }), JSON.stringify({ ...valid, writerId: 'other-page' }), JSON.stringify({ ...valid, insight: 'x'.repeat(13000) }), 'x'.repeat(70 * 1024)]) {
    store.data.set(key, bad);
    const [entry] = readNoteDrafts(() => store, 'teacher-a').entries;
    assert.equal(entry.value, undefined);
    assert.equal(entry.raw, bad, 'raw bytes stay available for export');
    assert.equal(writeNoteDraft(() => store, 'teacher-a', 'w', fields(), NOW), 'blocked');
    assert.equal(retireWriterNoteDraft(() => store, 'teacher-a', 'w', fields()), false);
    assert.equal(discardNoteDraftEntry(() => store, 'teacher-a', entry), false);
    assert.equal(store.data.get(key), bad, 'never deleted');
  }
  assert.equal(writeNoteDraft(() => store, '', 'w', fields(), NOW), 'invalid');
  assert.equal(writeNoteDraft(() => store, 'teacher-a', '', fields(), NOW), 'invalid');
  assert.equal(writeNoteDraft(() => store, 'teacher-a', 'big', fields({ insight: 'x'.repeat(12001) }), NOW), 'too_large');
});

test('discarding one draft in the panel removes exactly what was shown, never a rewritten one', () => {
  const store = memory();
  writeNoteDraft(() => store, 'teacher-a', 'w', fields(), NOW);
  const [shown] = readNoteDrafts(() => store, 'teacher-a').entries;
  writeNoteDraft(() => store, 'teacher-a', 'w', fields({ title: 'vừa gõ ở tab khác' }), new Date('2026-10-24T09:00:00Z'));
  assert.equal(discardNoteDraftEntry(() => store, 'teacher-a', shown), false, 'the page rewrote it after the panel was drawn');
  assert.equal(store.data.has(shown.key), true);
  const [fresh] = readNoteDrafts(() => store, 'teacher-a').entries;
  assert.equal(discardNoteDraftEntry(() => store, 'teacher-a', fresh), true);
  assert.equal(store.data.has(shown.key), false);
  assert.equal(discardNoteDraftEntry(() => store, 'teacher-a', fresh), true, 'already gone is fine');
});

test('putting a draft into the form never overwrites typed text without a confirmation step', () => {
  const store = memory();
  writeNoteDraft(() => store, 'teacher-a', 'w', fields(), NOW);
  const record = readNoteDrafts(() => store, 'teacher-a').entries[0].value!;
  assert.deepEqual(canApplyNoteDraft('teacher-a', record, fields({ title: '', insight: '' })), { allowed: true, mode: 'fill_empty' });
  assert.deepEqual(canApplyNoteDraft('teacher-a', record, fields({ title: '   ', insight: '\n' })), { allowed: true, mode: 'fill_empty' }, 'whitespace is not text');
  assert.deepEqual(canApplyNoteDraft('teacher-a', record, fields({ title: 'đang gõ dở', insight: '' })), { allowed: true, mode: 'replace_existing' });
  assert.deepEqual(canApplyNoteDraft('teacher-a', record, fields({ title: '', insight: 'chỉ có nội dung' })), { allowed: true, mode: 'replace_existing' });
  assert.equal(isKnownNoteCategory('TRICK_OR_TRAP'), true);
  assert.equal(isKnownNoteCategory('SOMETHING_ELSE'), false, 'an unknown stored group is shown as stored, not swapped');
});

test('export keeps the stored bytes untouched and the file name carries no account id', () => {
  const store = memory();
  store.data.set(noteDraftKey('teacher-a', 'w'), '{"broken": 1, \n "kept": "đúng từng byte"');
  const [entry] = readNoteDrafts(() => store, 'teacher-a').entries;
  assert.equal(exportNoteDraft(entry, 0).raw, '{"broken": 1, \n "kept": "đúng từng byte"');
  assert.match(exportNoteDraft(entry, 1).fileName, /-2\.json$/);
  assert.equal(exportNoteDraft(entry, 0).fileName.includes('teacher-a'), false);
});
