import type { Question } from '@/types/exam';
import type { QuestionAiBase } from './question-ai-review';
import type { CopilotActionResult, CopilotBase } from './copilot-submission';
import { normalizeQuestion } from './exam-document';

type Payload = { kind: 'question'; base: QuestionAiBase; question: Question } | { kind: 'copilot'; base: CopilotBase; result: CopilotActionResult };
export type AiProposalRecord = Payload & { formatVersion: 1; journalId: string; createdAt: string };
export interface AiProposalEntry { key: string; raw: string; record?: AiProposalRecord; memoryOnly?: boolean; archived?: boolean }
type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'key' | 'length'>;
const prefix = 'examcraft:ai-proposal:', archivedPrefix = 'examcraft:ai-proposal-archive:';
const ram = new Map<string, string>(), selected = new Map<string, string>();
const cache = new Map<string, AiProposalEntry[]>();
const listeners = new Set<() => void>();
let revision = 1;
const signal = () => { revision++; cache.clear(); listeners.forEach(listener => listener()); };
const external = (event: StorageEvent) => { if (!event.key || event.key.startsWith(prefix) || event.key.startsWith(archivedPrefix)) signal(); };
export const aiProposalRevision = () => revision;
export const aiProposalServerRevision = () => 0;
export function subscribeAiProposals(listener: () => void) {
  if (!listeners.size && typeof window !== 'undefined') window.addEventListener('storage', external);
  listeners.add(listener);
  return () => { listeners.delete(listener); if (!listeners.size && typeof window !== 'undefined') window.removeEventListener('storage', external); };
}
const scope = (ownerId: string, documentId?: string) => `${encodeURIComponent(ownerId)}:${documentId === undefined ? '' : `${encodeURIComponent(documentId)}:`}`;
export const aiProposalKey = (record: AiProposalRecord) => `${prefix}${scope(record.base.ownerId, record.base.documentId)}${encodeURIComponent(record.journalId)}`;
const selectionKey = (owner: string, doc: string, kind: Payload['kind'], target?: string) => JSON.stringify([owner, doc, kind, target]);

export function parseAiProposal(raw: string, ownerId: string, documentId?: string, memoryOnly = false): AiProposalRecord {
  if (!memoryOnly && new TextEncoder().encode(raw).length > 4 * 1024 * 1024) throw Error('Proposal exceeds local record limit.');
  const value = JSON.parse(raw) as AiProposalRecord;
  if (value.formatVersion !== 1 || typeof value.journalId !== 'string' || !value.journalId || typeof value.createdAt !== 'string' || !value.base || value.base.ownerId !== ownerId || typeof value.base.documentId !== 'string' || !value.base.documentId || documentId !== undefined && value.base.documentId !== documentId || typeof value.base.sourceStamp !== 'string') throw Error('Invalid proposal identity.');
  if (value.kind === 'question') {
    normalizeQuestion(value.base.question); normalizeQuestion({ ...value.question, id: value.base.question.id });
  } else if (value.kind === 'copilot') {
    if (!Array.isArray(value.base.questions) || value.base.questions.length > 1000 || !value.result || typeof value.result.action !== 'string') throw Error('Invalid Copilot proposal.');
    value.base.questions.forEach(normalizeQuestion);
    if (value.result.modifiedQuestion) normalizeQuestion(value.result.modifiedQuestion);
  } else throw Error('Unknown proposal format.');
  return value;
}

export function listAiProposals(ownerId: string, documentId?: string, storage?: Store, archived = false): AiProposalEntry[] {
  const start = `${archived ? archivedPrefix : prefix}${scope(ownerId, documentId)}`, entries = new Map<string, AiProposalEntry>();
  if (!storage && cache.has(start)) return cache.get(start)!;
  try {
    const target = storage ?? window.localStorage;
    for (let index = 0; index < target.length; index++) { const key = target.key(index); if (key?.startsWith(start)) { const raw = target.getItem(key); if (raw !== null) entries.set(key, { key, raw, archived }); } }
  } catch { /* RAM entries remain accessible if storage is unavailable. */ }
  for (const [key, raw] of ram) if (key.startsWith(start)) entries.set(key, { key, raw, archived, memoryOnly: true });
  const result = [...entries.values()].map(entry => {
    try { const record = parseAiProposal(entry.raw, ownerId, documentId, entry.memoryOnly); if (aiProposalKey(record).replace(prefix, archived ? archivedPrefix : prefix) !== entry.key) throw Error('Mismatched proposal key.'); return { ...entry, record }; }
    catch { return entry; }
  }).sort((a, b) => (b.record?.createdAt ?? '').localeCompare(a.record?.createdAt ?? ''));
  if (!storage) cache.set(start, result);
  return result;
}
export function countArchivedAiProposals(ownerId: string): number {
  const start = `${archivedPrefix}${scope(ownerId)}`, keys = new Set<string>();
  try { const storage = window.localStorage; for (let index = 0; index < storage.length; index++) { const key = storage.key(index); if (key?.startsWith(start)) keys.add(key); } } catch { /* RAM remains visible. */ }
  for (const key of ram.keys()) if (key.startsWith(start)) keys.add(key);
  return keys.size;
}

/** Only immutable proposal/base data is stored; never pass request options or API keys. */
export function createAiProposal(payload: Payload, storage?: Store): AiProposalEntry {
  const record: AiProposalRecord = { ...structuredClone(payload), formatVersion: 1, journalId: crypto.randomUUID(), createdAt: new Date().toISOString() };
  const raw = JSON.stringify(record, (_key, item) => { if (typeof item === 'number' && !Number.isFinite(item)) throw Error('Invalid number in proposal.'); return item; });
  parseAiProposal(raw, record.base.ownerId, record.base.documentId, true);
  const key = aiProposalKey(record); ram.set(key, raw);
  let memoryOnly = true;
  try { if (new TextEncoder().encode(raw).length > 4 * 1024 * 1024) throw Error('Keep large proposal in RAM.'); const target = storage ?? window.localStorage; target.setItem(key, raw); if (target.getItem(key) === raw) { ram.delete(key); memoryOnly = false; } } catch { /* Keep in RAM and expose a download warning. */ }
  signal(); return { key, raw, record, memoryOnly };
}

/** Archive is recoverable: verify the raw copy before retiring the exact active revision. */
export function archiveAiProposal(entry: AiProposalEntry, storage?: Store): boolean {
  if (entry.archived) { for (const [slot, key] of selected) if (key === entry.key) selected.delete(slot); signal(); return true; }
  try {
    const target = storage ?? window.localStorage;
    if ((ram.get(entry.key) ?? target.getItem(entry.key)) !== entry.raw) return false;
    const key = entry.key.replace(prefix, archivedPrefix), oldArchive = target.getItem(key);
    if (oldArchive !== null && oldArchive !== entry.raw) return false;
    target.setItem(key, entry.raw); if (target.getItem(key) !== entry.raw) return false;
    if (ram.get(entry.key) === entry.raw) ram.delete(entry.key);
    if (target.getItem(entry.key) === entry.raw) target.removeItem(entry.key);
    for (const [slot, chosen] of selected) if (chosen === entry.key) selected.delete(slot);
    signal(); return true;
  } catch { return false; }
}
export function selectAiProposal(entry: AiProposalEntry) {
  if (!entry.record) return;
  const value = entry.record;
  selected.set(selectionKey(value.base.ownerId, value.base.documentId, value.kind, value.kind === 'question' ? value.base.question.id : undefined), entry.key); signal();
}
export function currentAiProposal(ownerId: string, documentId: string, kind: Payload['kind'], questionId?: string, storage?: Store): AiProposalEntry | undefined {
  const active = listAiProposals(ownerId, documentId, storage);
  const matches = (entry: AiProposalEntry) => entry.record?.kind === kind && (entry.record.kind !== 'question' || entry.record.base.question.id === questionId);
  const chosen = selected.get(selectionKey(ownerId, documentId, kind, questionId));
  const selectedEntry = chosen ? [...active, ...listAiProposals(ownerId, documentId, storage, true)].find(entry => entry.key === chosen && matches(entry)) : undefined;
  return selectedEntry ?? active.find(matches);
}
