export interface ProviderFailure {
  status: number;
  code: 'RATE_LIMITED' | 'INVALID_KEY' | 'PERMISSION_DENIED' | 'MODEL_UNAVAILABLE' | 'BAD_REQUEST' | 'PROVIDER_UNAVAILABLE' | 'NETWORK_ERROR';
  message: string;
  retryAnotherKey: boolean;
  disableKey: boolean;
}

export function classifyProviderFailure(error: unknown): ProviderFailure {
  const record = error && typeof error === 'object' ? error as Record<string, unknown> : {};
  const nested = record.error && typeof record.error === 'object' ? record.error as Record<string, unknown> : {};
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : String(record.message ?? nested.message ?? record.reason ?? '');
  const explicit = Number(record.status ?? record.statusCode ?? record.code);
  const status = Number.isInteger(explicit) && explicit >= 400 && explicit <= 599 ? explicit : Number(message.match(/\b(400|401|403|404|408|429|500|502|503|504)\b/)?.[1] ?? 0);
  const invalid = /API_KEY_INVALID|API key not valid|API_KEY_EXPIRED/i.test(message);
  if (invalid) return { status: status || 400, code: 'INVALID_KEY', message: 'Nhà cung cấp báo khóa không hợp lệ hoặc đã hết hiệu lực.', retryAnotherKey: true, disableKey: true };
  if (status === 429 || /RESOURCE_EXHAUSTED/i.test(message)) return { status: 429, code: 'RATE_LIMITED', message: 'Nhà cung cấp đang giới hạn yêu cầu. Kiểm tra quota, tốc độ gửi và billing của project trong AI Studio; chưa thể kết luận gói miễn phí hay trả phí.', retryAnotherKey: true, disableKey: false };
  if (status === 401 || status === 403) return { status: status || 403, code: 'PERMISSION_DENIED', message: 'Project hoặc khóa chưa có quyền thực hiện yêu cầu này. Kiểm tra hạn chế khóa, khu vực, model và billing.', retryAnotherKey: false, disableKey: false };
  if (status === 404) return { status, code: 'MODEL_UNAVAILABLE', message: 'Model không có trong dịch vụ đang dùng hoặc chưa được cấp quyền. Hãy chọn model khác; hệ thống không tự đổi model.', retryAnotherKey: false, disableKey: false };
  if (status === 400) return { status, code: 'BAD_REQUEST', message: 'Nhà cung cấp không nhận cấu trúc yêu cầu. Khóa không tự bị vô hiệu hóa vì lỗi này.', retryAnotherKey: false, disableKey: false };
  if (status >= 500) return { status, code: 'PROVIDER_UNAVAILABLE', message: 'Dịch vụ AI đang bận hoặc gặp lỗi. Vui lòng thử lại sau.', retryAnotherKey: false, disableKey: false };
  return { status: status || 503, code: 'NETWORK_ERROR', message: 'Chưa kết nối được dịch vụ AI. Vui lòng thử lại sau.', retryAnotherKey: false, disableKey: false };
}

export function normalizeModelId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const model = value.trim().replace(/^models\//, '');
  return /^[a-z][a-z0-9._-]{1,100}$/i.test(model) ? model : null;
}

/** These aliases all mean a transient key for this request. Never silently choose one conflicting value. */
export function requestApiKey(input: unknown): string | undefined {
  if (!input || typeof input !== 'object') return undefined;
  const record = input as Record<string, unknown>;
  const values = ['customApiKey', 'userApiKey', 'apiKey'].map(key => record[key]).filter(value => value !== undefined && value !== null && value !== '');
  if (values.some(value => typeof value !== 'string' || value.length > 500)) throw new Error('API_KEY_INPUT_INVALID');
  const keys = [...new Set(values.map(value => String(value).trim()).filter(Boolean))];
  if (keys.length > 1) throw new Error('API_KEY_INPUT_CONFLICT');
  return keys[0];
}

export const applicationDayStart = (now = new Date()) => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
export function applicationQuota(limit: number, used: number) {
  const safeLimit = Number.isFinite(limit) && limit >= 0 ? Math.floor(limit) : 0;
  const safeUsed = Number.isFinite(used) && used >= 0 ? Math.floor(used) : 0;
  return { allowed: safeUsed < safeLimit, limit: safeLimit, used: safeUsed, remaining: Math.max(0, safeLimit - safeUsed), percentageUsed: safeLimit ? Math.min(100, Math.round(safeUsed / safeLimit * 100)) : 100 };
}
