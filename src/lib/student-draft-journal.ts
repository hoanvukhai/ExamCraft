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
export function reconcileJournal(journal: DraftJournal | null, server: Record<string, unknown>, serverRevision: string): JournalOutcome {
  if (!journal) return { kind: 'server', answers: server };
  if (stableJson(journal.answers) === stableJson(server)) return { kind: 'synced', answers: server };
  if (journal.baseRevision === serverRevision) return { kind: 'restored', answers: journal.answers };
  return { kind: 'conflict', answers: journal.answers, server };
}
