/**
 * Browser-side journal of a student's unsent answers.
 *
 * The server draft stays the source of truth; this only keeps what was typed since the last
 * acknowledged save so closing the tab or losing power does not lose it. It is bound to one
 * attempt and to the server draft revision it was based on, so it can never silently
 * overwrite something saved from another page.
 */
export interface DraftJournal { v: 1; attemptId: string; baseRevision: string; answers: Record<string, unknown>; savedAt: string }
export type JournalOutcome =
  | { kind: 'server'; answers: Record<string, unknown> }
  | { kind: 'synced'; answers: Record<string, unknown> }
  | { kind: 'restored'; answers: Record<string, unknown> }
  | { kind: 'conflict'; answers: Record<string, unknown>; server: Record<string, unknown> };

export const journalKey = (attemptId: string) => `examcraft:student-journal:v1:${encodeURIComponent(attemptId)}`;
const isRecord = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);

/** Same content regardless of key order; 0, false, '' and null stay different from each other. */
export function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (isRecord(value)) return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  return JSON.stringify(value) ?? 'null';
}

export function writeJournal(storage: Pick<Storage, 'setItem'>, attemptId: string, baseRevision: string, answers: Record<string, unknown>, now = new Date()) {
  const journal: DraftJournal = { v: 1, attemptId, baseRevision, answers, savedAt: now.toISOString() };
  storage.setItem(journalKey(attemptId), JSON.stringify(journal));
}

/** Unreadable or foreign entries are ignored but never deleted. */
export function readJournal(storage: Pick<Storage, 'getItem'>, attemptId: string): DraftJournal | null {
  try {
    const parsed: unknown = JSON.parse(storage.getItem(journalKey(attemptId)) ?? 'null');
    if (!isRecord(parsed) || parsed.v !== 1 || parsed.attemptId !== attemptId || typeof parsed.baseRevision !== 'string' || !isRecord(parsed.answers)) return null;
    return { v: 1, attemptId, baseRevision: parsed.baseRevision, answers: parsed.answers, savedAt: String(parsed.savedAt ?? '') };
  } catch { return null; }
}

export function clearJournal(storage: Pick<Storage, 'removeItem'>, attemptId: string) {
  storage.removeItem(journalKey(attemptId));
}

/**
 * Decide what to show when an attempt is opened.
 * - no journal, or one equal to the server draft: use the server draft
 * - journal based on the revision the server still has: the browser holds newer answers; restore them
 * - server moved on since the journal was based: do not merge; report a conflict and keep both
 */
export function reconcileJournal(journal: Pick<DraftJournal, 'answers' | 'baseRevision'> | null, server: Record<string, unknown>, serverRevision: string): JournalOutcome {
  if (!journal) return { kind: 'server', answers: server };
  if (stableJson(journal.answers) === stableJson(server)) return { kind: 'synced', answers: server };
  if (journal.baseRevision === serverRevision) return { kind: 'restored', answers: journal.answers };
  return { kind: 'conflict', answers: journal.answers, server };
}

// Each mounted page writes its own slot; v1 remains readable and is never overwritten by v2.
export type WriterJournal = Omit<DraftJournal, 'v'> & { v: 2; writerId: string };
export type StudentJournalEntry = { key: string; raw: string; value?: DraftJournal | WriterJournal };
type JournalStorage = Pick<Storage, 'length' | 'key' | 'getItem' | 'setItem' | 'removeItem'>;
const writerPrefix = (attemptId: string) => `examcraft:student-journal:v2:${encodeURIComponent(attemptId)}:`;
const importedPrefix = (attemptId: string) => `examcraft:student-journal:import:${encodeURIComponent(attemptId)}:`;
export const writerJournalKey = (attemptId: string, writerId: string) => writerPrefix(attemptId) + encodeURIComponent(writerId);

function parseEntry(raw: string, key: string, attemptId: string): StudentJournalEntry {
  const entry: StudentJournalEntry = { key, raw };
  try {
    if (new TextEncoder().encode(raw).length > 4 * 1024 * 1024) return entry;
    let value = JSON.parse(raw);
    const imported = key.startsWith(importedPrefix(attemptId));
    if (imported && isRecord(value) && value.format === 'examcraft-student-answers-v1' && isRecord(value.responses)) {
      value = { v: 1, attemptId: value.attemptId, answers: value.responses, savedAt: value.exportedAt, baseRevision: typeof value.baseDraftRevision === 'string' ? value.baseDraftRevision : 'import-without-base' };
    }
    if (!isRecord(value) || value.attemptId !== attemptId || typeof value.baseRevision !== 'string' || !isRecord(value.answers) || typeof value.savedAt !== 'string') return entry;
    if (imported && (value.v === 1 || (value.v === 2 && typeof value.writerId === 'string' && value.writerId))) entry.value = value as unknown as DraftJournal | WriterJournal;
    if (value.v === 1 && key === journalKey(attemptId)) entry.value = value as unknown as DraftJournal;
    if (value.v === 2 && typeof value.writerId === 'string' && value.writerId && key === writerJournalKey(attemptId, value.writerId)) entry.value = value as unknown as WriterJournal;
  } catch { /* Keep the exact raw bytes available for export, without applying them. */ }
  return entry;
}

export function readStudentJournals(getStorage: () => JournalStorage, attemptId: string): { entries: StudentJournalEntry[]; unavailable: boolean } {
  try {
    const storage = getStorage(), keys = new Set<string>([journalKey(attemptId)]);
    for (let i = 0; i < storage.length; i++) { const key = storage.key(i); if (key?.startsWith(writerPrefix(attemptId)) || key?.startsWith(importedPrefix(attemptId))) keys.add(key); }
    const entries: StudentJournalEntry[] = [];
    for (const key of keys) { const raw = storage.getItem(key); if (raw !== null) entries.push(parseEntry(raw, key, attemptId)); }
    return { entries, unavailable: false };
  } catch { return { entries: [], unavailable: true }; }
}

/** Store exact imported bytes in an independent slot. Import never rebases or applies answers. */
export function importStudentJournal(getStorage: () => JournalStorage, attemptId: string, importId: string, raw: string): { entry: StudentJournalEntry; error?: never } | { error: string; entry?: never } {
  if (!importId) return { error: 'Chưa tạo được mã bản nhập. Hãy thử lại.' };
  const key = importedPrefix(attemptId) + encodeURIComponent(importId), entry = parseEntry(raw, key, attemptId);
  if (!entry.value) return { error: 'Tệp không đúng định dạng nháp, khác lượt làm bài hoặc lớn hơn 4 MB. Tệp gốc vẫn được giữ.' };
  try {
    const storage = getStorage();
    if (storage.getItem(key) !== null) return { error: 'Mã bản nhập đã tồn tại. Chưa thay bản cũ; hãy thử lại.' };
    storage.setItem(key, raw);
    return { entry };
  } catch { return { error: 'Trình duyệt chưa lưu được bản nhập. Hãy giữ tệp và thử lại khi bộ nhớ khả dụng.' }; }
}

export function writeWriterJournal(getStorage: () => JournalStorage, attemptId: string, writerId: string, baseRevision: string, answers: Record<string, unknown>, now = new Date()): boolean {
  try {
    if (!writerId) return false;
    const storage = getStorage(), key = writerJournalKey(attemptId, writerId), raw = storage.getItem(key);
    if (raw !== null && !parseEntry(raw, key, attemptId).value) return false;
    const value: WriterJournal = { v: 2, attemptId, writerId, baseRevision, answers, savedAt: now.toISOString() };
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch { return false; }
}

/** Remove only this writer's acknowledged answers, never another page or an unreadable record. */
export function retireWriterJournal(getStorage: () => JournalStorage, attemptId: string, writerId: string, responses: Record<string, unknown>): boolean {
  try {
    const storage = getStorage(), key = writerJournalKey(attemptId, writerId), raw = storage.getItem(key);
    if (raw === null) return true;
    const value = parseEntry(raw, key, attemptId).value;
    if (!value || !journalAnswersAcknowledged(value.answers, responses) || storage.getItem(key) !== raw) return false;
    storage.removeItem(key); return true;
  } catch { return false; }
}

function journalAnswersAcknowledged(answers: Record<string, unknown>, server: Record<string, unknown>) {
  return Object.entries(answers).every(([key, value]) => Object.hasOwn(server, key) && stableJson(value) === stableJson(server[key]));
}

export function unsubmittedStudentJournals(entries: StudentJournalEntry[], server: Record<string, unknown>) {
  return entries.filter(entry => !entry.value || !journalAnswersAcknowledged(entry.value.answers, server));
}

export function reconcileStudentJournals(entries: StudentJournalEntry[], server: Record<string, unknown>, serverRevision: string) {
  const candidates = entries.filter(entry => entry.value && stableJson(entry.value.answers) !== stableJson(server));
  const contents = new Set(candidates.map(entry => stableJson(entry.value!.answers)));
  if (!contents.size) return { kind: 'server' as const, answers: server };
  // An imported file stays opt-in after reload as well as on the page where it was opened.
  if (candidates.some(entry => entry.key.startsWith(importedPrefix(entry.value!.attemptId)))) return { kind: 'choose' as const, answers: server };
  if (contents.size > 1) return { kind: 'choose' as const, answers: server };
  const selected = candidates.find(entry => entry.value!.baseRevision === serverRevision) ?? candidates[0];
  return reconcileJournal(selected.value!, server, serverRevision);
}
