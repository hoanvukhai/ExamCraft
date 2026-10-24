/**
 * Advanced options of an assignment (open/close time, attempts, entry code, PIN, shuffle).
 * The same rules run in the dialog (to explain a problem before sending) and on the server
 * (the only place that decides). Defaults keep today's behavior so old flows do not change.
 */
export const MAX_ATTEMPTS_LIMIT = 10;
export const JOIN_CODE_PATTERN = /^[A-Z0-9]{4,12}$/;

export interface AssignmentOptionsInput {
  /** Value of an <input type="datetime-local"> ("2026-10-24T08:30") in the browser's own time zone; '' means not set. */
  opensAtLocal?: string;
  closesAtLocal?: string;
  /** '' or undefined means "use the default for this kind of assignment". */
  maxAttempts?: number | string;
  defaultMaxAttempts: number;
  joinCode?: string;
  requirePin?: boolean;
  shuffleQuestions?: boolean;
  shuffleChoices?: boolean;
  hasGroup: boolean;
  identityMode: string;
  now?: Date;
}

export interface AssignmentOptionsPayload {
  opensAt?: string; closesAt?: string; maxAttempts: number; joinCode?: string;
  requirePin: boolean; shuffleQuestions: boolean; shuffleChoices: boolean;
}
export type AssignmentOptionsResult = { ok: true; payload: AssignmentOptionsPayload } | { ok: false; error: string };

const pad = (n: number) => String(n).padStart(2, '0');

/** "2026-10-24T08:30" in the browser's time zone to a UTC ISO string; null when empty or not a real date. */
export function localToIso(local: string | undefined): string | null {
  const text = (local ?? '').trim();
  if (!text) return null;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(text)) return null;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return null;
  // new Date() rolls 31/02 over to March; reject it instead of silently moving the date.
  return isoToLocal(date.toISOString()) === text ? date.toISOString() : null;
}

/** UTC ISO string back to the datetime-local value of the same instant in the browser's zone. */
export function isoToLocal(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Trim and uppercase; '' becomes undefined; returns null for a value that cannot be a code. */
export function normalizeJoinCode(value: unknown): string | undefined | null {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') return null;
  const code = value.trim().toUpperCase();
  if (!code) return undefined;
  return JOIN_CODE_PATTERN.test(code) ? code : null;
}

/** Rules that depend on how students are identified. Shared with the server. */
export function assignmentPolicyError(input: { requirePin: boolean; hasGroup: boolean; identityMode: string; closesAt?: Date | null; opensAt?: Date | null; maxAttempts: number }): string | null {
  if (input.requirePin && (!input.hasGroup || input.identityMode === 'FREE_NAME')) return 'PIN chỉ dùng được khi giao cho một lớp và học sinh chọn tên trong danh sách hoặc dùng link cá nhân.';
  if (!Number.isInteger(input.maxAttempts) || input.maxAttempts < 1 || input.maxAttempts > MAX_ATTEMPTS_LIMIT) return `Số lượt làm phải từ 1 đến ${MAX_ATTEMPTS_LIMIT}.`;
  if (input.opensAt && input.closesAt && input.closesAt <= input.opensAt) return 'Giờ đóng phải sau giờ mở.';
  return null;
}

export function buildAssignmentOptions(input: AssignmentOptionsInput): AssignmentOptionsResult {
  const now = input.now ?? new Date();
  const opensAt = localToIso(input.opensAtLocal), closesAt = localToIso(input.closesAtLocal);
  if ((input.opensAtLocal ?? '').trim() && !opensAt) return { ok: false, error: 'Giờ mở chưa hợp lệ. Hãy chọn lại ngày và giờ.' };
  if ((input.closesAtLocal ?? '').trim() && !closesAt) return { ok: false, error: 'Giờ đóng chưa hợp lệ. Hãy chọn lại ngày và giờ.' };
  if (closesAt && new Date(closesAt) <= now) return { ok: false, error: 'Giờ đóng đã qua. Hãy chọn một thời điểm trong tương lai.' };

  const rawAttempts = typeof input.maxAttempts === 'string' ? input.maxAttempts.trim() : input.maxAttempts;
  const maxAttempts = rawAttempts === undefined || rawAttempts === '' ? input.defaultMaxAttempts : Number(rawAttempts);
  const joinCode = normalizeJoinCode(input.joinCode);
  if (joinCode === null) return { ok: false, error: 'Mã vào bài gồm 4–12 chữ cái hoặc chữ số, không dấu, không khoảng trắng.' };

  const requirePin = Boolean(input.requirePin);
  const policy = assignmentPolicyError({ requirePin, hasGroup: input.hasGroup, identityMode: input.identityMode, opensAt: opensAt ? new Date(opensAt) : null, closesAt: closesAt ? new Date(closesAt) : null, maxAttempts });
  if (policy) return { ok: false, error: policy };

  return { ok: true, payload: {
    ...(opensAt ? { opensAt } : {}), ...(closesAt ? { closesAt } : {}), maxAttempts,
    ...(joinCode ? { joinCode } : {}), requirePin, shuffleQuestions: Boolean(input.shuffleQuestions), shuffleChoices: Boolean(input.shuffleChoices),
  } };
}
