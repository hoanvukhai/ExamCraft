import test from 'node:test';
import assert from 'node:assert/strict';
import { writeJournal, readJournal, clearJournal, reconcileJournal, stableJson, journalKey } from '../src/lib/student-draft-journal';

const memory = () => { const data = new Map<string, string>(); return { data, getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => { data.set(k, v); }, removeItem: (k: string) => { data.delete(k); } }; };

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
