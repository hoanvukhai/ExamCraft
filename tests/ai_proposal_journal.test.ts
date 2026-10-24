import test from 'node:test';
import assert from 'node:assert/strict';
import { archiveAiProposal, createAiProposal, currentAiProposal, listAiProposals, parseAiProposal, selectAiProposal } from '../src/lib/ai-proposal-journal';
import { captureQuestionAiBase } from '../src/lib/question-ai-review';
import type { Question } from '../src/types/exam';

class StorageFixture {
  values = new Map<string, string>(); failWrite = false;
  get length() { return this.values.size; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { if (this.failWrite) throw Error('Quota'); this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}
const question: Question = { id: 'q', type: 'short_answer', content: 'Base', difficulty: 'thong_hieu', points: 0, correct_answer: '0', step_by_step_solution: 'Solution', figures: [{ id: 'f', kind: 'image', data: { url: '/qa.png' } }] };
const payload = (owner = crypto.randomUUID(), doc = 'doc') => ({ kind: 'question' as const, base: captureQuestionAiBase(owner, doc, 'source', question), question: { ...question, content: 'AI candidate' } });

test('durable proposals survive a fresh storage view, preserve payload and remain isolated by account/document', () => {
  const storage = new StorageFixture(), input = payload(), entry = createAiProposal(input, storage);
  assert.equal(entry.memoryOnly, false); input.question.content = 'Caller mutation';
  const fresh = new StorageFixture(); fresh.values = new Map(storage.values);
  const restored = listAiProposals(input.base.ownerId, 'doc', fresh);
  assert.equal(restored.length, 1); assert.equal(restored[0].record!.kind, 'question');
  const value = restored[0].record!; assert.ok(value.kind === 'question');
  assert.equal(value.question.content, 'AI candidate'); assert.equal(value.question.points, 0); assert.deepEqual(value.question.figures, question.figures);
  assert.equal(listAiProposals('other', undefined, fresh).length, 0); assert.equal(listAiProposals(input.base.ownerId, 'other-doc', fresh).length, 0);
  assert.throws(() => parseAiProposal(entry.raw, 'other')); assert.throws(() => parseAiProposal(entry.raw, input.base.ownerId, 'other-doc'));
});

test('each writer has a unique immutable slot; archive verifies a recoverable copy and protects later revisions', () => {
  const storage = new StorageFixture(), input = payload(), first = createAiProposal(input, storage), second = createAiProposal(input, storage);
  assert.notEqual(first.key, second.key); assert.equal(listAiProposals(input.base.ownerId, 'doc', storage).length, 2);
  assert.equal(archiveAiProposal(first, storage), true);
  assert.equal(storage.getItem(first.key), null); assert.equal(storage.getItem(second.key), second.raw);
  const archived = listAiProposals(input.base.ownerId, 'doc', storage, true); assert.equal(archived[0].raw, first.raw);
  storage.setItem(second.key, second.raw + ' ');
  assert.equal(archiveAiProposal(second, storage), false); assert.equal(storage.getItem(second.key), second.raw + ' ');
});

test('quota failures keep the source and RAM response, never delete unreadable or malformed records', () => {
  const storage = new StorageFixture(), input = payload(), durable = createAiProposal(input, storage);
  storage.failWrite = true;
  assert.equal(archiveAiProposal(durable, storage), false); assert.equal(storage.getItem(durable.key), durable.raw);
  const memory = createAiProposal(input, storage); assert.equal(memory.memoryOnly, true);
  const records = listAiProposals(input.base.ownerId, 'doc', storage); assert.equal(records.length, 2);
  assert.ok(records.some(entry => entry.key === memory.key && entry.memoryOnly && entry.record?.kind === 'question'));
  storage.values.set(durable.key, '{bad json');
  const unreadable = listAiProposals(input.base.ownerId, 'doc', storage).find(entry => entry.key === durable.key)!;
  assert.equal(unreadable.record, undefined); assert.equal(unreadable.raw, '{bad json');
  assert.equal(archiveAiProposal(unreadable, storage), false); assert.equal(storage.getItem(durable.key), '{bad json');
});

test('archived records only reopen on explicit selection, without applying content or crossing question identity', () => {
  const storage = new StorageFixture(), input = payload(), entry = createAiProposal(input, storage);
  assert.equal(archiveAiProposal(entry, storage), true);
  assert.equal(currentAiProposal(input.base.ownerId, 'doc', 'question', 'q', storage), undefined);
  const archived = listAiProposals(input.base.ownerId, 'doc', storage, true)[0]; selectAiProposal(archived);
  assert.equal(currentAiProposal(input.base.ownerId, 'doc', 'question', 'q', storage)?.key, archived.key);
  assert.equal(currentAiProposal(input.base.ownerId, 'doc', 'question', 'other-q', storage), undefined);
  assert.equal(currentAiProposal(input.base.ownerId, 'doc', 'copilot', undefined, storage), undefined);
  assert.equal(archiveAiProposal(archived, storage), true); assert.equal(currentAiProposal(input.base.ownerId, 'doc', 'question', 'q', storage), undefined);
  assert.equal(storage.getItem(archived.key), archived.raw);
});

test('Copilot payload roundtrips independently and corrupted identity stays downloadable but not actionable', () => {
  const storage = new StorageFixture(), owner = crypto.randomUUID();
  const entry = createAiProposal({ kind: 'copilot', base: { ownerId: owner, documentId: 'doc', sourceStamp: 'source', questions: [question] }, result: { action: 'delete_question', targetQuestionId: 'q', explanation: 'Teacher decides' } }, storage);
  assert.equal(currentAiProposal(owner, 'doc', 'copilot', undefined, storage)?.record?.kind, 'copilot');
  const corrupt = JSON.parse(entry.raw); corrupt.base.ownerId = 'foreign'; storage.setItem(entry.key, JSON.stringify(corrupt));
  const records = listAiProposals(owner, 'doc', storage); assert.equal(records[0].record, undefined); assert.equal(records[0].raw, JSON.stringify(corrupt));
  assert.equal(currentAiProposal(owner, 'doc', 'copilot', undefined, storage), undefined);
  assert.throws(() => createAiProposal({ ...payload(), question: { ...question, points: NaN } }, storage));
});
