/** Pure decisions for the AI-key dialog. Secrets never pass through here except as the draft the caller compares. */
import { MemoryGate as KeyGate, type MemoryToken as KeyToken } from './ai-memory-request-context';
export { KeyGate, type KeyToken };

export interface UserKeyRow { id: string; label: string; keyMasked: string; isActive: boolean; usedToday: number; errorCount: number; granted?: boolean }
export interface AppQuotaRow { limit: number; usedToday: number; remaining: number; resetsAt?: string }
export interface ModelOptionRow { id: string; name: string }

const text = (value: unknown, max: number): value is string => typeof value === 'string' && value.length <= max;
const count = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;

/** Read the key list response without trusting its shape. Unreadable or repeated rows are counted, never guessed. */
export function parseKeyList(data: unknown) {
  const body = data && typeof data === 'object' ? data as Record<string, unknown> : {};
  if (!Array.isArray(body.keys)) throw Error('Danh sách khóa trả về không đọc được. Danh sách đang xem được giữ nguyên; hãy thử lại.');
  const seen = new Set<string>(), keys: UserKeyRow[] = [];
  for (const row of body.keys) {
    const value = row && typeof row === 'object' ? row as Record<string, unknown> : {};
    if (!text(value.id, 200) || !value.id || seen.has(value.id) || !text(value.label, 500) || !text(value.keyMasked, 200) || typeof value.isActive !== 'boolean') continue;
    seen.add(value.id);
    keys.push({ id: value.id, label: value.label, keyMasked: value.keyMasked, isActive: value.isActive, usedToday: count(value.usedToday), errorCount: count(value.errorCount), ...(value.granted === true ? { granted: true } : {}) });
  }
  const quota = body.poolQuota && typeof body.poolQuota === 'object' ? body.poolQuota as Record<string, unknown> : null;
  const models = Array.isArray(body.availableModels) ? body.availableModels.flatMap(option => {
    const value = option && typeof option === 'object' ? option as Record<string, unknown> : {};
    return text(value.id, 200) && value.id && text(value.name, 300) ? [{ id: value.id, name: value.name }] : [];
  }) : [];
  return {
    keys, skipped: body.keys.length - keys.length, models,
    selectedModel: text(body.selectedAiModel, 200) ? body.selectedAiModel : '',
    quota: quota && [quota.limit, quota.usedToday, quota.remaining].every(item => typeof item === 'number' && Number.isFinite(item)) ? { limit: quota.limit as number, usedToday: quota.usedToday as number, remaining: quota.remaining as number, ...(text(quota.resetsAt, 100) ? { resetsAt: quota.resetsAt } : {}) } : null,
  };
}

/** Toggle, delete and test may only act on a row of the list loaded for the same owner, found by id (never by position). */
export function canActOnKey(list: { ownerId: string; items: readonly { id: string }[] }, currentOwnerId: string | null, id: string) {
  return !!currentOwnerId && list.ownerId === currentOwnerId && list.items.some(item => item.id === id);
}

/** A late test reply belongs to one key of one list; if that key is gone it is dropped instead of landing on another row. */
export function applyKeyTestResult(results: Record<string, string>, items: readonly { id: string }[], id: string, message: string) {
  return items.some(item => item.id === id) ? { ...results, [id]: message } : results;
}
/** After a refresh, results of keys that no longer exist are removed. */
export function pruneKeyTestResults(results: Record<string, string>, items: readonly { id: string }[]) {
  const ids = new Set(items.map(item => item.id));
  return Object.fromEntries(Object.entries(results).filter(([id]) => ids.has(id)));
}

export interface KeyDraft { label: string; apiKey: string }
/** After a successful save, clear only what was sent; anything typed since pressing Save is a new draft. */
export const shouldClearKeyDraft = (sent: KeyDraft, current: KeyDraft) => sent.label === current.label && sent.apiKey === current.apiKey;

/**
 * The server has no idempotency for adding a key. When the outcome is unknown the form is kept and the teacher must
 * look at the list before saving again, otherwise a lost reply could store the same key twice.
 */
export function classifyAddFailure(status: number | null): 'unknown_outcome' | 'rejected' {
  return status !== null && status >= 400 && status < 500 ? 'rejected' : 'unknown_outcome';
}

/**
 * A refresh or a save reply brings the saved model back. It replaces the box only while the box still holds what the
 * reply is about (the last saved value for a refresh, the value that was sent for a save); newer typing is kept.
 */
export function nextModelDraft(draft: string, replaceWhen: string, incoming: string) {
  return { draft: draft === replaceWhen ? incoming : draft, baseline: incoming };
}

/** The add reply counts only if it names the saved key (id, label, masked value, flag); a 200 with a broken body does not. */
export function parseSavedKey(data: unknown): UserKeyRow | null {
  const body = data && typeof data === 'object' ? data as { success?: unknown; key?: unknown } : {};
  return body.success === true ? parseKeyList({ keys: [body.key] }).keys[0] ?? null : null;
}

export type KeyLane = 'main' | 'logs';
/**
 * Both request lanes of one dialog (actions and the usage log) share one account-loss fact: when either lane gets 401 or
 * ACCOUNT_CHANGED, every token of this context stops being live. A token of an older context can neither lock nor revive
 * a newer one, because liveness is always asked through the token's own gate.
 */
export class KeyContext {
  private readonly lanes: Record<KeyLane, KeyGate> = { main: new KeyGate(), logs: new KeyGate() };
  private lost = false;
  get accountLost() { return this.lost; }
  begin(lane: KeyLane): KeyToken | null { return this.lost ? null : this.lanes[lane].begin(); }
  isLive(token: KeyToken) { return !this.lost && token.isLive(); }
  /** Returns true only for the live token that really discovered the loss. */
  loseAccount(lane: KeyLane, token: KeyToken) {
    if (this.lost || !token.isLive() || !token.lockAccount()) return false;
    this.lost = true;
    this.lanes[lane === 'main' ? 'logs' : 'main'].dispose();
    return true;
  }
  /** Close the dialog: synchronously ends every request of both lanes. */
  dispose() { this.lanes.main.dispose(); this.lanes.logs.dispose(); }
}
