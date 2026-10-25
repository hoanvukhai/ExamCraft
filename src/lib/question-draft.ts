import type { Exam, Question } from '@/types/exam';
import { normalizeQuestion } from './exam-document';

export interface QuestionDraft {
  formatVersion: 1; ownerId: string; documentId: string; questionId: string;
  journalId: string; token: string; updatedAt: string;
  baseQuestion: Question; baseSourceStamp: string; draft: Question;
}
export interface QuestionManualSubmission {
  ownerId: string; documentId: string; questionId: string; baseStamp: string;
  baseSourceStamp: string; token: string; value: Question;
}
const prefix = 'examcraft:question-draft:';
const archivePrefix = 'examcraft:question-draft-archive:';
const maxBytes = 4 * 1024 * 1024;
const ram = new Map<string, string>();
let revision = 1;
const listeners = new Set<() => void>();
const signal = () => { revision++; for (const listener of listeners) listener(); };
export const questionDraftRevision = () => revision;
export const questionDraftServerRevision = () => 0;
export function subscribeQuestionDrafts(listener: () => void) {
  listeners.add(listener);
  const external = (event: StorageEvent) => { if (event.key === null || event.key.startsWith(prefix)) signal(); };
  if (typeof window !== 'undefined') window.addEventListener('storage', external);
  return () => { listeners.delete(listener); if (typeof window !== 'undefined') window.removeEventListener('storage', external); };
}
const scopePrefix = (ownerId: string, documentId: string) => `${prefix}${encodeURIComponent(ownerId)}:${encodeURIComponent(documentId)}:`;
export const questionDraftKey = (draft: Pick<QuestionDraft, 'ownerId' | 'documentId' | 'questionId' | 'journalId'>) => `${scopePrefix(draft.ownerId, draft.documentId)}${encodeURIComponent(draft.questionId)}:${encodeURIComponent(draft.journalId)}`;
export function questionValueStamp(question: Question) { return JSON.stringify(question, (_key, item) => item && typeof item === 'object' && !Array.isArray(item) ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b))) : item); }
export function questionDraftSatisfiedBy(entry: QuestionDraftEntry, applied: Question) {
  return !!entry.value && questionValueStamp({ ...entry.value.draft, status: applied.status, verifiedBy: applied.verifiedBy, version: applied.version }) === questionValueStamp(applied);
}
export function resumeQuestionDraft(value: QuestionDraft, current: Question, sourceStamp: string) {
  const entry = { key: questionDraftKey(value), raw: '', value };
  const alreadyApplied = value.baseSourceStamp === sourceStamp && questionDraftSatisfiedBy(entry, current);
  const record = structuredClone(value);
  if (alreadyApplied) { record.baseQuestion = structuredClone(current); record.draft = structuredClone(current); record.baseSourceStamp = sourceStamp; }
  return { record, alreadyApplied };
}
export function questionDraftSourceStamp(exam: Exam) {
  const m = exam.metadata;
  return JSON.stringify({ subject: m.subject, grade: m.grade, mode: m.assessmentMode, framework: m.cognitiveFrameworkId, package: m.knowledgePackage, scope: m.knowledgeScope, sections: exam.sections, passages: exam.passages });
}
export function parseQuestionDraft(raw: string, ownerId: string, documentId: string): QuestionDraft {
  if (new TextEncoder().encode(raw).length > maxBytes) throw Error('Nháp vượt giới hạn đọc an toàn.');
  const value = JSON.parse(raw) as QuestionDraft;
  if (value?.formatVersion !== 1 || value.ownerId !== ownerId || value.documentId !== documentId || !value.questionId || !value.journalId || !value.token || typeof value.updatedAt !== 'string' || typeof value.baseSourceStamp !== 'string') throw Error('Nháp không khớp tài khoản hoặc tài liệu.');
  if (value.baseQuestion?.id !== value.questionId || value.draft?.id !== value.questionId) throw Error('Mã câu trong nháp không khớp.');
  normalizeQuestion(value.baseQuestion); normalizeQuestion(value.draft);
  return value;
}
export type QuestionDraftEntry = { key: string; raw: string; value?: QuestionDraft; unreadable?: true; memoryOnly?: true };
export function listQuestionDrafts(ownerId: string, documentId: string | null, storage?: Pick<Storage, 'length' | 'key' | 'getItem'>, archived = false): QuestionDraftEntry[] {
  const scope = documentId === null ? `${prefix}${encodeURIComponent(ownerId)}:` : scopePrefix(ownerId, documentId);
  const scoped = archived ? scope.replace(prefix, archivePrefix) : scope, records = new Map<string, QuestionDraftEntry>();
  try {
    const source = storage ?? (typeof window === 'undefined' ? undefined : window.localStorage);
    if (source) for (let index = 0; index < source.length; index++) {
      const key = source.key(index); if (key?.startsWith(scoped)) { const raw = source.getItem(key); if (raw !== null) records.set(key, { key, raw }); }
    }
  } catch { /* In-memory entries remain available when browser storage is denied. */ }
  for (const [key, raw] of ram) if (key.startsWith(scoped)) records.set(key, { key, raw, memoryOnly: true });
  return [...records.values()].map(entry => {
    try { const originalDocument = documentId ?? JSON.parse(entry.raw)?.documentId; if (typeof originalDocument !== 'string') throw Error('Thiếu mã đề gốc.'); const value = parseQuestionDraft(entry.raw, ownerId, originalDocument); if ((archived ? questionDraftKey(value).replace(prefix, archivePrefix) : questionDraftKey(value)) !== entry.key) throw Error('Mã ô nháp không khớp.'); return { ...entry, value }; }
    catch { return { ...entry, unreadable: true as const }; }
  }).sort((a, b) => (b.value?.updatedAt ?? '').localeCompare(a.value?.updatedAt ?? ''));
}
export function writeQuestionDraft(value: QuestionDraft, storage?: Pick<Storage, 'setItem' | 'getItem'>): { durable: boolean } {
  const key = questionDraftKey(value);
  let raw: string;
  try { raw = JSON.stringify(value, (_key, item) => { if (typeof item === 'number' && !Number.isFinite(item)) throw Error('Invalid number'); return item; }); }
  catch {
    // Keep a downloadable diagnostic draft, never silently turn NaN into a valid null/default.
    raw = JSON.stringify(value, (_key, item) => typeof item === 'number' && !Number.isFinite(item) ? { invalidNumber: String(item) } : item);
    ram.set(key, raw); signal(); return { durable: false };
  }
  ram.set(key, raw);
  try {
    parseQuestionDraft(raw, value.ownerId, value.documentId);
    const target = storage ?? window.localStorage;
    target.setItem(key, raw);
    if (target.getItem(key) !== raw) throw Error('Chưa xác nhận được ô nháp.');
    ram.delete(key); signal(); return { durable: true };
  } catch { signal(); return { durable: false }; }
}
/** Keep existing question journals reachable after the first server acknowledgement. */
export function copyQuestionDraftsAfterCreate(ownerId: string, previousId: string, savedId: string, storage?: Pick<Storage, 'length' | 'key' | 'getItem' | 'setItem'>) {
  if (previousId === savedId) return true;
  let durable = true;
  const existing = new Map(listQuestionDrafts(ownerId, savedId, storage).map(entry => [entry.key, entry]));
  for (const entry of listQuestionDrafts(ownerId, previousId, storage)) {
    if (!entry.value) { durable = false; continue; }
    const value = { ...entry.value, documentId: savedId };
    const key = questionDraftKey(value), target = existing.get(key);
    // Keep both sources when a target writer has already advanced. Never overwrite it.
    if (target && target.raw !== JSON.stringify(value)) { durable = false; continue; }
    if (!target) durable = writeQuestionDraft(value, storage).durable && durable;
  }
  // Old records deliberately remain available in the all-drafts recovery panel.
  return durable;
}

/** Only retire the exact acknowledged/discarded revision; another writer has its own key. */
export function retireQuestionDraft(entry: QuestionDraftEntry, storage?: Pick<Storage, 'getItem' | 'removeItem'>) {
  const memory = ram.get(entry.key); if (memory === entry.raw) ram.delete(entry.key);
  try { const target = storage ?? window.localStorage; if (target.getItem(entry.key) === entry.raw) target.removeItem(entry.key); }
  catch { /* Keep any durable source that cannot be safely removed. */ }
  signal();
}
export function questionDraftMatchesDocument(entry: QuestionDraftEntry, exam: Exam) {
  if (!entry.value || entry.value.documentId !== exam.id || entry.value.baseSourceStamp !== questionDraftSourceStamp(exam)) return false;
  const question = exam.questions.find(value => value.id === entry.value!.questionId);
  return !!question && questionDraftSatisfiedBy(entry, { ...question, subject: question.subject ?? exam.metadata.subject, grade: question.grade ?? exam.metadata.grade });
}
export function hasPendingQuestionDrafts(ownerId: string, documentId: string, questionIds: string[], exam?: Exam) {
  return listQuestionDrafts(ownerId, documentId).some(entry => !entry.value || questionIds.includes(entry.value.questionId) && (!exam || !questionDraftMatchesDocument(entry, exam)));
}
/** Call only after the persistence hook confirms the whole current document was saved. */
export function retireSavedQuestionDrafts(ownerId: string, saved: Exam, storage?: Pick<Storage, 'length' | 'key' | 'getItem' | 'removeItem'>) {
  for (const entry of listQuestionDrafts(ownerId, saved.id, storage)) if (questionDraftMatchesDocument(entry, saved)) retireQuestionDraft(entry, storage);
}
export function archiveQuestionDraft(entry: QuestionDraftEntry, suppliedStorage?: Pick<Storage, 'setItem' | 'getItem' | 'removeItem'>) {
  const key = entry.key.replace(prefix, archivePrefix);
  try {
    const storage = suppliedStorage ?? window.localStorage;
    if ((ram.get(entry.key) ?? storage.getItem(entry.key)) !== entry.raw) return false;
    // Preserve a readable/downloadable raw copy before retiring the active slot, even if malformed.
    storage.setItem(key, entry.raw);
    if (storage.getItem(key) !== entry.raw) return false;
    retireQuestionDraft(entry, storage); return true;
  } catch { return false; }
}
export function applyQuestionManualSubmission(previous: Exam, submission: QuestionManualSubmission, ownerId: string): Exam {
  if (submission.ownerId !== ownerId || submission.documentId !== previous.id || previous.access?.canEdit === false || questionDraftSourceStamp(previous) !== submission.baseSourceStamp) return previous;
  const index = previous.questions.findIndex(question => question.id === submission.questionId);
  if (index < 0 || submission.value.id !== submission.questionId) return previous;
  const current = previous.questions[index];
  const displayed = { ...current, subject: current.subject ?? previous.metadata.subject, grade: current.grade ?? previous.metadata.grade };
  if (questionValueStamp(displayed) !== submission.baseStamp) return previous;
  normalizeQuestion(submission.value);
  const questions = [...previous.questions]; questions[index] = submission.value;
  return { ...previous, questions };
}
