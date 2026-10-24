export interface TeacherMemoryRow { id: string; subject: string; category: string; title: string; insight: string; confidence: number; isActive: boolean; sourceAction: string; createdAt: string }
export interface MemoryDraft { title: string; insight: string; category: string; subject: string }

/** One request token of one gate. Everything a request does afterwards (state, lock, release) goes through its own token. */
export interface MemoryToken {
  signal: AbortSignal;
  /** False once its gate was closed or locked, or when it is not the request currently holding the slot. */
  isLive(): boolean;
  /** Free the slot; true only when this token still held it, so a stale token can never un-busy a newer context. */
  release(): boolean;
  /** The server said the account changed. Locks only the token's own gate, and only while it is still live. */
  lockAccount(): boolean;
}

/** One gate per open dialog; a new open (or React's dev re-run of an effect) gets a new gate and the old one stays dead. */
export class MemoryGate {
  private holder: { token: MemoryToken; controller: AbortController } | null = null;
  private closed = false;
  private accountLost = false;
  begin(): MemoryToken | null {
    if (this.closed || this.accountLost || this.holder) return null;
    const controller = new AbortController();
    const token: MemoryToken = {
      signal: controller.signal,
      isLive: () => !this.closed && !this.accountLost && this.holder?.token === token,
      release: () => { if (this.holder?.token !== token) return false; this.holder = null; return true; },
      lockAccount: () => { if (!token.isLive()) return false; this.accountLost = true; controller.abort(); return true; },
    };
    this.holder = { token, controller };
    return token;
  }
  dispose() { this.closed = true; this.holder?.controller.abort(); this.holder = null; }
  get locked() { return this.accountLost; }
}

/** Delete/activate may only act on a row of the list that was loaded for the same owner, found by its id (never by position). */
export function canActOnMemory(list: { ownerId: string; items: readonly { id: string }[] }, currentOwnerId: string | null, id: string) {
  return !!currentOwnerId && list.ownerId === currentOwnerId && list.items.some(item => item.id === id);
}

const text = (value: unknown, max: number) => typeof value === 'string' && value.length <= max;
/** Read a memory list response without trusting its shape; unreadable or repeated rows are counted, never guessed. */
export function parseMemoryList(data: unknown) {
  const rows = data && typeof data === 'object' ? (data as { memories?: unknown }).memories : undefined;
  if (!Array.isArray(rows)) throw Error('Danh sách ghi chú trả về không đọc được. Danh sách đang xem được giữ nguyên; hãy thử lại.');
  const seen = new Set<string>(), items: TeacherMemoryRow[] = [];
  for (const row of rows) {
    const value = row && typeof row === 'object' ? row as Record<string, unknown> : {};
    if (!text(value.id, 200) || !value.id || seen.has(value.id as string) || !text(value.title, 1000) || !text(value.insight, 20000) || !text(value.category, 100) || typeof value.isActive !== 'boolean') continue;
    seen.add(value.id as string);
    items.push({ id: value.id as string, title: value.title as string, insight: value.insight as string, category: value.category as string, isActive: value.isActive,
      subject: text(value.subject, 100) ? value.subject as string : 'all', sourceAction: text(value.sourceAction, 200) ? value.sourceAction as string : '',
      confidence: typeof value.confidence === 'number' && Number.isFinite(value.confidence) ? value.confidence : 0, createdAt: text(value.createdAt, 100) ? value.createdAt as string : '' });
  }
  return { items, skipped: rows.length - items.length };
}
/** A saved note must come back with an id before it may join the list. */
export function parseSavedMemory(data: unknown): TeacherMemoryRow {
  const parsed = parseMemoryList({ memories: [data && typeof data === 'object' ? (data as { memory?: unknown }).memory : undefined] });
  if (!parsed.items[0]) throw Error('Chưa chắc ghi chú đã được lưu. Nội dung vẫn được giữ; bấm lưu lại sẽ dùng đúng mã yêu cầu cũ nên không tạo bản trùng.');
  return parsed.items[0];
}

export const memoryDraftFingerprint = (draft: MemoryDraft) => JSON.stringify([draft.subject, draft.category, draft.title.trim(), draft.insight.trim()]);
/** After a save, keep what the teacher typed since pressing Save: clear the form only if it still holds exactly what was sent. */
export const shouldClearDraft = (sent: MemoryDraft, current: MemoryDraft) => sent.title === current.title && sent.insight === current.insight && sent.category === current.category && sent.subject === current.subject;

