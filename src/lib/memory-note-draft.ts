/**
 * Browser-side backup of a private AI-memory note the teacher is still typing (title, instruction, group, subject).
 *
 * It is not the note: the server is the only place a note exists, and nothing here saves, enables, shares or sends
 * anything to a provider. A draft belongs to one account (owner) and one page (writer); another account never sees it.
 * localStorage is shared by everyone who uses this browser profile and is not encrypted. It is not transactional either.
 */
export const NOTE_CATEGORIES = ['PEDAGOGICAL_STYLE', 'TRICK_OR_TRAP', 'REAL_WORLD_CONTEXT', 'DIFFICULTY_BALANCE', 'EXPLANATION_RULE'] as const;
export interface NoteFields { title: string; insight: string; category: string; subject: string }
export interface NoteDraftRecord extends NoteFields { v: 1; context: 'manual-note'; ownerId: string; writerId: string; savedAt: string }
export interface NoteDraftEntry { key: string; raw: string; value?: NoteDraftRecord }
export type NoteDraftStorage = Pick<Storage, 'length' | 'key' | 'getItem' | 'setItem' | 'removeItem'>;
export type NoteDraftWrite = 'saved' | 'empty' | 'unavailable' | 'blocked' | 'too_large' | 'invalid';

const MAX_RAW_BYTES = 64 * 1024, LIMITS = { title: 500, insight: 12000, category: 100, subject: 100 };
const enc = encodeURIComponent;
const isRecord = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const prefix = (ownerId: string) => `examcraft:memory-note-draft:v1:${enc(ownerId)}:manual-note:`;
export const noteDraftKey = (ownerId: string, writerId: string) => prefix(ownerId) + enc(writerId);

function parseEntry(key: string, raw: string): NoteDraftEntry {
  const entry: NoteDraftEntry = { key, raw };
  try {
    if (new TextEncoder().encode(raw).length > MAX_RAW_BYTES) return entry;
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value) || value.v !== 1 || value.context !== 'manual-note') return entry;
    const { ownerId, writerId, title, insight, category, subject, savedAt } = value;
    if (typeof ownerId !== 'string' || !ownerId || typeof writerId !== 'string' || !writerId || typeof savedAt !== 'string') return entry;
    if (typeof title !== 'string' || title.length > LIMITS.title || typeof insight !== 'string' || insight.length > LIMITS.insight) return entry;
    if (typeof category !== 'string' || category.length > LIMITS.category || typeof subject !== 'string' || subject.length > LIMITS.subject) return entry;
    // Copied under another account or page key: kept as raw for export, never trusted as that key's draft.
    if (key === noteDraftKey(ownerId, writerId)) entry.value = { v: 1, context: 'manual-note', ownerId, writerId, title, insight, category, subject, savedAt };
  } catch { /* Keep the exact raw bytes available for export, without applying them. */ }
  return entry;
}

/** Every draft this account has on this browser (one per page that wrote one). */
export function readNoteDrafts(getStorage: () => NoteDraftStorage, ownerId: string): { entries: NoteDraftEntry[]; unavailable: boolean } {
  try {
    const storage = getStorage(), wanted = prefix(ownerId), keys: string[] = [];
    for (let i = 0; i < storage.length; i++) { const key = storage.key(i); if (key?.startsWith(wanted)) keys.push(key); }
    const entries: NoteDraftEntry[] = [];
    for (const key of keys.sort()) { const raw = storage.getItem(key); if (raw !== null) entries.push(parseEntry(key, raw)); }
    return { entries, unavailable: false };
  } catch { return { entries: [], unavailable: true }; }
}

/**
 * Back up this page's typing. A form with no title and no text is not written (and an earlier draft is left alone,
 * never deleted by emptiness). An unreadable record sitting in this page's own slot is kept, not overwritten.
 */
export function writeNoteDraft(getStorage: () => NoteDraftStorage, ownerId: string, writerId: string, fields: NoteFields, now = new Date()): NoteDraftWrite {
  if (!ownerId || !writerId) return 'invalid';
  if (!fields.title.trim() && !fields.insight.trim()) return 'empty';
  const record: NoteDraftRecord = { v: 1, context: 'manual-note', ownerId, writerId, ...fields, savedAt: now.toISOString() };
  const raw = JSON.stringify(record);
  if (fields.title.length > LIMITS.title || fields.insight.length > LIMITS.insight || fields.category.length > LIMITS.category || fields.subject.length > LIMITS.subject || new TextEncoder().encode(raw).length > MAX_RAW_BYTES) return 'too_large';
  try {
    const storage = getStorage(), key = noteDraftKey(ownerId, writerId), existing = storage.getItem(key);
    if (existing !== null && !parseEntry(key, existing).value) return 'blocked';
    storage.setItem(key, raw);
    return 'saved';
  } catch { return 'unavailable'; }
}

/** What the server saved (it trims title and instruction); the draft matches only when nothing else was typed since. */
const sameSaved = (record: NoteDraftRecord, saved: NoteFields) =>
  record.title.trim() === saved.title.trim() && record.insight.trim() === saved.insight.trim() && record.category === saved.category && record.subject === saved.subject;

/**
 * After the server acknowledged a saved note, remove only this page's draft and only if it holds exactly that note.
 * Typing after the request was sent leaves a different record, which is kept; so is any other page's draft.
 */
export function retireWriterNoteDraft(getStorage: () => NoteDraftStorage, ownerId: string, writerId: string, saved: NoteFields): boolean {
  try {
    const storage = getStorage(), key = noteDraftKey(ownerId, writerId), raw = storage.getItem(key);
    if (raw === null) return true;
    const value = parseEntry(key, raw).value;
    if (!value || !sameSaved(value, saved) || storage.getItem(key) !== raw) return false;
    storage.removeItem(key);
    return true;
  } catch { return false; }
}

/**
 * The teacher explicitly dropped one draft in the panel. Only a readable record of this account is removed, and only if
 * its stored bytes are still exactly what the panel showed (another page may have rewritten it meanwhile).
 */
export function discardNoteDraftEntry(getStorage: () => NoteDraftStorage, ownerId: string, entry: NoteDraftEntry): boolean {
  try {
    if (!entry.value || entry.value.ownerId !== ownerId || entry.key !== noteDraftKey(ownerId, entry.value.writerId)) return false;
    const storage = getStorage(), raw = storage.getItem(entry.key);
    if (raw === null) return true;
    if (raw !== entry.raw) return false;
    storage.removeItem(entry.key);
    return true;
  } catch { return false; }
}

export type NoteDraftApply = { allowed: true; mode: 'fill_empty' | 'replace_existing' } | { allowed: false; reason: 'foreign' };
/**
 * May this record fill the open form? Another account's never. Into a form that already has text it needs an explicit
 * confirmation (the parent keeps the current text until the teacher agrees), and it only fills the form: it is not a note yet.
 */
export function canApplyNoteDraft(ownerId: string, record: NoteDraftRecord, form: NoteFields): NoteDraftApply {
  if (record.ownerId !== ownerId) return { allowed: false, reason: 'foreign' };
  return { allowed: true, mode: form.title.trim() || form.insight.trim() ? 'replace_existing' : 'fill_empty' };
}
/** A stored group the form does not offer is shown as it is, never silently swapped for another group. */
export const isKnownNoteCategory = (category: string) => (NOTE_CATEGORIES as readonly string[]).includes(category);

/** The exact stored bytes, so a draft that cannot be applied can still be saved as a file. */
export const exportNoteDraft = (entry: NoteDraftEntry, index: number) => ({ fileName: `examcraft-nhap-ghi-chu-${index + 1}.json`, raw: entry.raw });
