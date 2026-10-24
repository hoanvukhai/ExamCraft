/**
 * Browser-side journal of a teacher's unsent score/comment for one answer of one attempt.
 *
 * The server grade stays the source of truth and the only thing that CAS-checks anything. This only keeps what was
 * typed since the last acknowledged save so a reload, crash or lost network does not lose it. A record is bound to
 * teacher + attempt + question + writer (one page) and to the grade revision it was based on. It never saves,
 * rebases, restores or changes a grade by itself, and localStorage is not transactional: other tabs can interleave.
 */
export interface GradeDraftContext { teacherId: string; attemptId: string; questionKey: string }
export interface GradeDraftRecord extends GradeDraftContext {
  v: 1; writerId: string;
  /** manualGradeRevision of the answer when this draft was started. */
  baseRevision: string;
  /** The score exactly as typed: '' (nothing), '0', '1,5' and 'abc' stay different. */
  score: string;
  comment: string;
  /** Opaque rubric state of the parent, if any; null means none. */
  rubric: Record<string, unknown> | null;
  savedAt: string;
}
export interface GradeDraftEntry { key: string; raw: string; value?: GradeDraftRecord }
export type GradeDraftStorage = Pick<Storage, 'length' | 'key' | 'getItem' | 'setItem' | 'removeItem'>;
export type GradeDraftWrite = 'saved' | 'unavailable' | 'blocked' | 'too_large' | 'invalid';

const MAX_RAW_BYTES = 256 * 1024, MAX_SCORE = 50, MAX_COMMENT = 5000;
const enc = encodeURIComponent;
const isRecord = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
export const defaultGradeDraftStorage = (): GradeDraftStorage => globalThis.localStorage;

/** Same content regardless of key order; 0, false, '' and null stay different from each other. */
export function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (isRecord(value)) return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  return JSON.stringify(value) ?? 'null';
}

const attemptPrefix = (teacherId: string, attemptId: string) => `examcraft:teacher-grade-draft:v1:${enc(teacherId)}:${enc(attemptId)}:`;
const questionPrefix = (ctx: GradeDraftContext) => `${attemptPrefix(ctx.teacherId, ctx.attemptId)}${enc(ctx.questionKey)}:`;
export const gradeDraftKey = (ctx: GradeDraftContext, writerId: string) => questionPrefix(ctx) + enc(writerId);

function parseEntry(key: string, raw: string): GradeDraftEntry {
  const entry: GradeDraftEntry = { key, raw };
  try {
    if (new TextEncoder().encode(raw).length > MAX_RAW_BYTES) return entry;
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value) || value.v !== 1) return entry;
    const { teacherId, attemptId, questionKey, writerId, baseRevision, score, comment, rubric, savedAt } = value;
    if (![teacherId, attemptId, questionKey, writerId].every(item => typeof item === 'string' && item) || typeof baseRevision !== 'string' || typeof savedAt !== 'string') return entry;
    if (typeof score !== 'string' || score.length > MAX_SCORE || typeof comment !== 'string' || comment.length > MAX_COMMENT) return entry;
    if (rubric !== null && !isRecord(rubric)) return entry;
    const record: GradeDraftRecord = { v: 1, teacherId: teacherId as string, attemptId: attemptId as string, questionKey: questionKey as string, writerId: writerId as string, baseRevision, score, comment, rubric: rubric as Record<string, unknown> | null, savedAt };
    // A record copied under another key (another teacher, attempt, question or page) is never trusted as that key's draft.
    if (key === gradeDraftKey(record, record.writerId)) entry.value = record;
  } catch { /* Keep the exact raw bytes available for export, without applying them. */ }
  return entry;
}

/** All drafts of one teacher on one attempt (every page that wrote one), optionally narrowed to a question. */
export function readGradeDrafts(getStorage: () => GradeDraftStorage, teacherId: string, attemptId: string, questionKey?: string): { entries: GradeDraftEntry[]; unavailable: boolean } {
  try {
    const storage = getStorage(), prefix = questionKey === undefined ? attemptPrefix(teacherId, attemptId) : questionPrefix({ teacherId, attemptId, questionKey }), keys: string[] = [];
    for (let i = 0; i < storage.length; i++) { const key = storage.key(i); if (key?.startsWith(prefix)) keys.push(key); }
    const entries: GradeDraftEntry[] = [];
    for (const key of keys.sort()) { const raw = storage.getItem(key); if (raw !== null) entries.push(parseEntry(key, raw)); }
    return { entries, unavailable: false };
  } catch { return { entries: [], unavailable: true }; }
}

/** Write this page's own slot. An unreadable record already sitting in the slot is kept, not overwritten. */
export function writeGradeDraft(getStorage: () => GradeDraftStorage, ctx: GradeDraftContext, writerId: string, input: { baseRevision: string; score: string; comment: string; rubric?: Record<string, unknown> | null }, now = new Date()): GradeDraftWrite {
  if (!ctx.teacherId || !ctx.attemptId || !ctx.questionKey || !writerId || !input.baseRevision) return 'invalid';
  const record: GradeDraftRecord = { v: 1, ...ctx, writerId, baseRevision: input.baseRevision, score: input.score, comment: input.comment, rubric: input.rubric ?? null, savedAt: now.toISOString() };
  const raw = JSON.stringify(record);
  if (record.score.length > MAX_SCORE || record.comment.length > MAX_COMMENT || new TextEncoder().encode(raw).length > MAX_RAW_BYTES) return 'too_large';
  try {
    const storage = getStorage(), key = gradeDraftKey(ctx, writerId), existing = storage.getItem(key);
    if (existing !== null && !parseEntry(key, existing).value) return 'blocked';
    storage.setItem(key, raw);
    return 'saved';
  } catch { return 'unavailable'; }
}

export type ParsedScore = { kind: 'blank' } | { kind: 'number'; value: number } | { kind: 'invalid' };
/** What a typed score means. Blank is not 0, and text that is not a number stays invalid instead of becoming 0. */
export function parseScoreText(raw: string): ParsedScore {
  const text = raw.trim().replace(',', '.');
  if (!text) return { kind: 'blank' };
  return /^\d+(\.\d+)?$/.test(text) ? { kind: 'number', value: Number(text) } : { kind: 'invalid' };
}

/** What the server now holds for the answer, as acknowledged by a successful save. */
export interface GradeAck { manualScore: number | null; comment: string | null; rubric?: unknown }
const sameAck = (record: GradeDraftRecord, ack: GradeAck) => {
  const score = parseScoreText(record.score);
  const scoreOk = ack.manualScore === null ? score.kind === 'blank' : score.kind === 'number' && score.value === ack.manualScore;
  const rubricOk = ack.rubric === undefined ? record.rubric === null : stableJson(record.rubric) === stableJson(ack.rubric);
  return scoreOk && record.comment === (ack.comment ?? '') && rubricOk;
};
/**
 * After a save is acknowledged, remove only this page's slot and only if it holds exactly what the server now has.
 * Anything typed after the saved request (a longer comment, another score) differs from the ack and is kept.
 */
export function retireWriterGradeDraft(getStorage: () => GradeDraftStorage, ctx: GradeDraftContext, writerId: string, ack: GradeAck): boolean {
  try {
    const storage = getStorage(), key = gradeDraftKey(ctx, writerId), raw = storage.getItem(key);
    if (raw === null) return true;
    const value = parseEntry(key, raw).value;
    if (!value || !sameAck(value, ack) || storage.getItem(key) !== raw) return false;
    storage.removeItem(key);
    return true;
  } catch { return false; }
}
/** The teacher chose to drop their own page's draft. Another page's draft and unreadable records are never touched. */
export function discardWriterGradeDraft(getStorage: () => GradeDraftStorage, ctx: GradeDraftContext, writerId: string): boolean {
  try {
    const storage = getStorage(), key = gradeDraftKey(ctx, writerId), raw = storage.getItem(key);
    if (raw === null) return true;
    if (!parseEntry(key, raw).value) return false;
    storage.removeItem(key);
    return true;
  } catch { return false; }
}

export type GradeDraftApply = { allowed: true; mode: 'same_base' | 'stale_base' } | { allowed: false; reason: 'foreign' | 'question_missing' };
/**
 * May this record be offered for the open page? It must belong to this teacher and attempt and to a question that still
 * exists. A record based on an older revision is offered for comparison only: the parent must keep its OLD base token,
 * so the editor's stale-base check blocks saving it, instead of silently rebasing it onto the newer grade.
 */
export function canApplyGradeDraft(open: { teacherId: string; attemptId: string }, currentRevisions: Readonly<Record<string, string>>, record: GradeDraftRecord): GradeDraftApply {
  if (record.teacherId !== open.teacherId || record.attemptId !== open.attemptId) return { allowed: false, reason: 'foreign' };
  const current = Object.hasOwn(currentRevisions, record.questionKey) ? currentRevisions[record.questionKey] : undefined;
  if (current === undefined) return { allowed: false, reason: 'question_missing' };
  return { allowed: true, mode: current === record.baseRevision ? 'same_base' : 'stale_base' };
}

/** The exact stored bytes, so a draft that cannot be applied can still be saved as a file. */
export const exportGradeDraft = (entry: GradeDraftEntry, index: number) => ({ fileName: `examcraft-nhap-cham-diem-${index + 1}.json`, raw: entry.raw });
