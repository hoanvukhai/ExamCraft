import test from 'node:test';
import assert from 'node:assert/strict';
import { writeJournal, readJournal, clearJournal, reconcileJournal, stableJson, journalKey, readStudentJournals, writeWriterJournal, retireWriterJournal, writerJournalKey, reconcileStudentJournals, unsubmittedStudentJournals, importStudentJournal } from '../src/lib/student-draft-journal';

const memory = () => { const data = new Map<string, string>(); return { data, getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => { data.set(k, v); }, removeItem: (k: string) => { data.delete(k); } }; };
const writerMemory = () => { const store = memory(); return { ...store, get length() { return store.data.size; }, key: (i: number) => [...store.data.keys()][i] ?? null }; };

test('journal round trip keeps 0, false, empty text and null distinct and is bound to one attempt', () => {
  const store = memory();
  const answers = { a: 0, b: false, c: '', d: null, e: { x: true } };
  writeJournal(store, 'att-1', 'rev-1', answers);
  assert.deepEqual(readJournal(store, 'att-1')?.answers, answers);
  assert.equal(readJournal(store, 'att-2'), null);
  store.data.set(journalKey('att-2'), store.data.get(journalKey('att-1'))!);
  assert.equal(readJournal(store, 'att-2'), null, 'an entry copied under another attempt is rejected');
  clearJournal(store, 'att-1');
  assert.equal(readJournal(store, 'att-1'), null);
});

test('unreadable journals are ignored and never deleted', () => {
  const store = memory();
  store.data.set(journalKey('att'), '{broken');
  assert.equal(readJournal(store, 'att'), null);
  assert.equal(store.data.get(journalKey('att')), '{broken');
  store.data.set(journalKey('att'), JSON.stringify({ v: 2, attemptId: 'att', baseRevision: 'r', answers: {} }));
  assert.equal(readJournal(store, 'att'), null);
});

test('stable comparison ignores key order but not values or array order', () => {
  assert.equal(stableJson({ a: 1, b: [1, 2] }), stableJson({ b: [1, 2], a: 1 }));
  for (const other of [{ a: 0, b: [1, 2] }, { a: 1, b: [2, 1] }, { a: 1, b: [1, 2], c: null }, { a: false, b: [1, 2] }]) assert.notEqual(stableJson({ a: 1, b: [1, 2] }), stableJson(other));
});

test('reconcile restores unsent answers only when the server draft is still the journal base', () => {
  const server = { q1: 'A' }, journal = { v: 1 as const, attemptId: 'att', baseRevision: 'rev-1', answers: { q1: 'A', q2: 0 }, savedAt: '' };
  assert.deepEqual(reconcileJournal(null, server, 'rev-1'), { kind: 'server', answers: server });
  assert.deepEqual(reconcileJournal(journal, server, 'rev-1'), { kind: 'restored', answers: journal.answers });
  assert.equal(reconcileJournal({ ...journal, answers: { q1: 'A' } }, server, 'rev-9').kind, 'synced', 'nothing to restore when equal');
  const conflict = reconcileJournal(journal, { q1: 'B' }, 'rev-2');
  assert.equal(conflict.kind, 'conflict');
  if (conflict.kind === 'conflict') { assert.deepEqual(conflict.answers, journal.answers); assert.deepEqual(conflict.server, { q1: 'B' }); }
});

test('an empty server draft with a journal of answers is restored, and an explicit zero answer survives', () => {
  const journal = { v: 1 as const, attemptId: 'att', baseRevision: 'empty-rev', answers: { short: 0, tf: { a: false } }, savedAt: '' };
  const outcome = reconcileJournal(journal, {}, 'empty-rev');
  assert.equal(outcome.kind, 'restored');
  assert.deepEqual(outcome.answers, { short: 0, tf: { a: false } });
});

test('two pages keep independent answers and require a choice instead of selecting the last writer', () => {
  const store = writerMemory(), access = () => store;
  assert.equal(writeWriterJournal(access, 'att', 'A', 'r', { essay: 'A', short: 0 }), true);
  assert.equal(writeWriterJournal(access, 'att', 'B', 'r', { essay: 'B', tf: { a: false } }), true);
  const { entries } = readStudentJournals(access, 'att');
  assert.equal(entries.length, 2);
  assert.equal(reconcileStudentJournals(entries, {}, 'r').kind, 'choose');
  assert.deepEqual(entries.map(entry => entry.value?.answers), [{ essay: 'A', short: 0 }, { essay: 'B', tf: { a: false } }]);
  assert.equal(retireWriterJournal(access, 'att', 'A', { essay: 'A', short: 0 }), true);
  assert.equal(readStudentJournals(access, 'att').entries[0].value?.answers.essay, 'B');
});

test('an acknowledged different page cannot retire an unsubmitted writer or corrupt legacy bytes', () => {
  const store = writerMemory(), access = () => store;
  store.data.set(journalKey('att'), '{broken-original');
  writeWriterJournal(access, 'att', 'B', 'old', { answer: 'private-B' });
  assert.equal(retireWriterJournal(access, 'att', 'B', { answer: 'server-A' }), false);
  const { entries } = readStudentJournals(access, 'att');
  assert.equal(entries.length, 2);
  assert.equal(entries[0].raw, '{broken-original'); assert.equal(entries[0].value, undefined);
  assert.equal(unsubmittedStudentJournals(entries, { answer: 'server-A' }).length, 2);
});

test('legacy recovery stays readable and is not rewritten by a new writer', () => {
  const store = writerMemory(), access = () => store;
  writeJournal(store, 'att', 'r', { short: '0', tf: { a: false } });
  const original = store.getItem(journalKey('att'));
  const entries = readStudentJournals(access, 'att').entries;
  assert.equal(reconcileStudentJournals(entries, {}, 'r').kind, 'restored');
  assert.equal(reconcileStudentJournals(entries, { short: '1' }, 'new').kind, 'conflict');
  writeWriterJournal(access, 'att', 'new-page', 'r', { short: '0', tf: { a: false } });
  assert.equal(store.getItem(journalKey('att')), original);
});

test('unreadable own slot, foreign attempt and storage errors never become automatic replacement', () => {
  const store = writerMemory(), access = () => store;
  store.data.set(writerJournalKey('att', 'A'), '{keep');
  assert.equal(writeWriterJournal(access, 'att', 'A', 'r', {}), false);
  assert.equal(store.getItem(writerJournalKey('att', 'A')), '{keep');
  writeWriterJournal(access, 'other', 'B', 'r', { secret: 'other-attempt' });
  assert.ok(!JSON.stringify(readStudentJournals(access, 'att')).includes('other-attempt'));
  const denied = () => { throw Error('Storage denied'); };
  assert.deepEqual(readStudentJournals(denied, 'att'), { entries: [], unavailable: true });
  assert.equal(writeWriterJournal(denied, 'att', 'A', 'r', {}), false);
  assert.equal(retireWriterJournal(denied, 'att', 'A', {}), false);
});

test('submitted responses retire only matching content and preserve explicit zero/false differences', () => {
  const store = writerMemory(), access = () => store;
  writeWriterJournal(access, 'att', 'A', 'r', { short: 0, tf: false });
  assert.equal(retireWriterJournal(access, 'att', 'A', { short: '0', tf: false }), false);
  assert.equal(retireWriterJournal(access, 'att', 'A', { short: 0, tf: true }), false);
  assert.equal(retireWriterJournal(access, 'att', 'A', { short: 0, tf: false, blank: null }), true);
});

test('import preserves exact original bytes independently across reload and never rebases old answers', () => {
  const store = writerMemory(), access = () => store;
  writeJournal(store, 'att', 'old', { q: 0, tf: false });
  const raw = '  ' + store.getItem(journalKey('att')) + '\n';
  const imported = importStudentJournal(access, 'att', 'file-1', raw);
  assert.ok(imported.entry); assert.equal(imported.entry.raw, raw);
  writeWriterJournal(access, 'att', 'current', 'new', { q: 'server' });
  const reloaded = readStudentJournals(access, 'att').entries.find(entry => entry.key === imported.entry.key)!;
  assert.equal(reloaded.raw, raw); assert.deepEqual(reloaded.value?.answers, { q: 0, tf: false });
  assert.equal(reconcileStudentJournals([reloaded], { q: 'server' }, 'new').kind, 'choose');
  assert.equal(reconcileJournal(reloaded.value!, { q: 'server' }, 'new').kind, 'conflict');
  assert.ok(importStudentJournal(access, 'att', 'file-1', raw).error, 'duplicate identifier never overwrites');
  assert.equal(store.getItem(imported.entry.key), raw);
});

test('old answer exports without a revision remain review-only, new exports retain the original revision', () => {
  const store = writerMemory(), access = () => store;
  const raw = JSON.stringify({ format: 'examcraft-student-answers-v1', attemptId: 'att', exportedAt: '2026-10-24T08:00:00Z', responses: { q: 'offline' } });
  const old = importStudentJournal(access, 'att', 'old-export', raw).entry!;
  assert.equal(reconcileStudentJournals([old], {}, 'current').kind, 'choose');
  assert.equal(reconcileJournal(old.value!, {}, 'current').kind, 'conflict');
  const current = importStudentJournal(access, 'att', 'current-export', JSON.stringify({ ...JSON.parse(raw), baseDraftRevision: 'current' })).entry!;
  assert.equal(reconcileStudentJournals([current], {}, 'current').kind, 'choose', 'reload still requires an explicit selection');
  assert.equal(reconcileJournal(current.value!, {}, 'current').kind, 'restored');
  assert.equal(importStudentJournal(access, 'other', 'foreign', raw).entry, undefined);
});

test('malformed, oversized and blocked imports preserve existing slots', () => {
  const store = writerMemory(), access = () => store;
  writeWriterJournal(access, 'att', 'A', 'r', { q: 'keep' });
  const before = [...store.data];
  for (const raw of ['{broken', '[]', JSON.stringify({ v: 1, attemptId: 'att', answers: [] }), ' '.repeat(4 * 1024 * 1024 + 1)]) {
    assert.ok(importStudentJournal(access, 'att', 'new', raw).error);
  }
  assert.deepEqual([...store.data], before);
  const valid = store.getItem(writerJournalKey('att', 'A'))!;
  assert.ok(importStudentJournal(() => { throw Error('denied'); }, 'att', 'new', valid).error);
  assert.ok(importStudentJournal(() => ({ ...store, setItem() { throw Error('quota'); } }), 'att', 'new', valid).error);
  assert.deepEqual([...store.data], before);
});
