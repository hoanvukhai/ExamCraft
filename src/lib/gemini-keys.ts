import { Prisma } from '@prisma/client';
import { promptVersionFor } from './prompt-versions';
import prisma from './prisma';
import { decryptApiKey } from './crypto';
import { applicationDayStart, classifyProviderFailure, normalizeModelId } from './ai-policy';
import { ApiError } from './api-error';

export interface KeyInfo { alias: string; rawKey: string; }
export function getRegisteredKeys(): KeyInfo[] { return []; }
export function getAllGeminiKeys(): string[] { return []; }
export const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash';
export function getGeminiModel() { return normalizeModelId(process.env.GEMINI_MODEL) ?? DEFAULT_GEMINI_MODEL; }
export interface AiModelOption { id: string; name: string; badge: string; badgeColor: 'emerald' | 'amber' | 'purple' | 'blue'; tier: 'UNKNOWN'; description: string; recommended?: boolean; }
// Default matches the schema default; probed 24/10/2026 with one project's key. Actual availability is checked with the user's own project.
export const AVAILABLE_GEMINI_MODELS: AiModelOption[] = [
  ['gemini-3.5-flash', 'Gemini 3.5 Flash'], ['gemini-3.6-flash', 'Gemini 3.6 Flash'], ['gemini-3.5-flash-lite', 'Gemini 3.5 Flash-Lite'], ['gemini-3.8-flash', 'Gemini 3.8 Flash'], ['gemini-4-argon', 'Gemini 4 Argon'],
].map(([id, name]) => ({ id, name, badge: 'Kiểm tra với project', badgeColor: 'blue', tier: 'UNKNOWN', description: 'Quyền truy cập, giá và quota phụ thuộc project/model; chưa xác minh bằng khóa của bạn.' }));
export function resolveModelId(model: string | null | undefined) { return normalizeModelId(model) ?? getGeminiModel(); }
export class AiRequestError extends ApiError { constructor(message: string, status: number, code: string) { super(status, message, code); this.name = 'AiRequestError'; } }

/** Historical name retained for callers: read-only usage, no application cap; provider capacity is unknown. */
export async function checkUserAiQuota(userId: string) {
  const [used, activeKeyCount] = await Promise.all([
    prisma.aiUsageLog.count({ where: { userId, createdAt: { gte: applicationDayStart() }, httpStatus: 200 } }),
    prisma.userApiKey.count({ where: { userId, isActive: true } }),
  ]);
  return { allowed: true, limit: null, used, remaining: null, percentageUsed: null, activeKeyCount, source: 'provider' as const, providerQuota: null, resetsAt: null };
}

async function reserveOperation(userId: string, endpoint: string, requestedModel?: string, dataVersion?: string) {
  for (let retry = 0; retry < 3; retry++) {
    try {
      return await prisma.$transaction(async tx => {
        const user = await tx.user.findUnique({ where: { id: userId }, select: { selectedAiModel: true, isActive: true, mustChangePassword: true } });
        if (!user?.isActive) throw new AiRequestError('Vui lòng đăng nhập để dùng AI.', 401, 'UNAUTHORIZED');
        if (user.mustChangePassword) throw new AiRequestError('Vui lòng đổi mật khẩu trước khi dùng AI.', 403, 'MUST_CHANGE_PASSWORD');
        const model = resolveModelId(requestedModel ?? user.selectedAiModel);
        const log = await tx.aiUsageLog.create({ data: { userId, endpoint, model, keyAlias: 'pending', httpStatus: 102, promptVersion: promptVersionFor(endpoint), dataVersion: dataVersion?.slice(0, 200) ?? null } });
        return { logId: log.id, model };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034' && retry < 2) continue;
      throw error;
    }
  }
  throw new AiRequestError('Chưa thể giữ lượt gọi AI; hãy thử lại.', 503, 'RESERVATION_CONFLICT');
}

/** The provider answered, but not with JSON we can read: say so, instead of blaming the request that was sent. */
/**
 * Reads provider JSON. Models often write LaTeX such as `\omega` with a single backslash inside a string, which is not valid JSON.
 * Only when the first read fails, a backslash that does not start a valid JSON escape is doubled and the text is read again;
 * text that already parses is never touched.
 */
export function readProviderJson(text: string): unknown {
  try { return JSON.parse(text); }
  catch (first) {
    const repaired = text.replace(/\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})/g, '\\\\');
    if (repaired === text) throw first;
    return JSON.parse(repaired);
  }
}

export function parseProviderJson(text: string): unknown {
  try { return readProviderJson(text); }
  catch { throw new ApiError(502, 'AI trả về kết quả không đọc được. Chưa có gì được lưu; hãy thử lại hoặc nhập thủ công.', 'AI_BAD_OUTPUT'); }
}

/** One authenticated operation uses only the user's temporary key or saved keys. No implicit model change. */
export async function executeWithKeyRotation<T>(customKey: string | undefined, operation: (apiKey: string, model: string) => Promise<T>, context?: { userId?: string; endpoint?: string; model?: string; signal?: AbortSignal; dataVersion?: string }): Promise<T> {
  if (!context?.userId) throw new AiRequestError('Vui lòng đăng nhập để dùng AI.', 401, 'UNAUTHORIZED');
  const cancelled = () => new AiRequestError('Đã hủy yêu cầu AI; chưa áp dụng kết quả.', 499, 'AI_CANCELLED');
  if (context.signal?.aborted) throw cancelled();
  const endpoint = context.endpoint ?? 'ai.generate';
  const reservation = await reserveOperation(context.userId, endpoint, context.model, context.dataVersion);
  const startedAt = Date.now();
  const finish = async (status: number, alias: string) => {
    try { await prisma.aiUsageLog.update({ where: { id: reservation.logId }, data: { httpStatus: status, keyAlias: alias, latencyMs: Date.now() - startedAt } }); }
    catch { console.warn('AI usage state could not be finalized', { operationId: reservation.logId, status }); }
  };
  let keys: { id?: string; alias: string; rawKey: string }[] = [];
  try {
    if (customKey?.trim()) keys = [{ alias: 'byok_temporary', rawKey: customKey.trim() }];
    else {
      const saved = await prisma.userApiKey.findMany({ where: { userId: context.userId, isActive: true }, orderBy: [{ errorCount: 'asc' }, { lastUsedAt: 'asc' }], take: 3 });
      keys = saved.map(key => ({ id: key.id, alias: 'user_key:' + key.id, rawKey: decryptApiKey(key.keyEncrypted, key.keyIv, key.keyTag) }));
    }
  } catch {
    await finish(500, 'key_unavailable');
    throw new AiRequestError('Chưa đọc được khóa đã mã hóa. Kiểm tra cấu hình mã hóa và bản sao lưu; không thêm đè khóa cũ.', 503, 'KEY_DECRYPTION_FAILED');
  }
  if (!keys.length) { await finish(400, 'no_key'); throw new AiRequestError('Hãy thêm hoặc bật khóa Gemini của bạn trong mục Khóa AI.', 400, 'NO_API_KEY'); }
  for (let index = 0; index < keys.length; index++) {
    const key = keys[index];
    let result: T;
    try {
      if (context.signal?.aborted) throw cancelled();
      result = await operation(key.rawKey, reservation.model);
      if (context.signal?.aborted) throw cancelled();
    }
    catch (error) {
      if (context.signal?.aborted) { await finish(499, key.alias); throw cancelled(); }
      const failure = classifyProviderFailure(error);
      if (key.id) {
        try { await prisma.userApiKey.updateMany({ where: { id: key.id, userId: context.userId }, data: { errorCount: { increment: 1 }, ...(failure.disableKey ? { isActive: false } : {}) } }); }
        catch { console.warn('AI key state could not be updated', { keyId: key.id, code: failure.code }); }
      }
      if (failure.retryAnotherKey && index < keys.length - 1) continue;
      await finish(failure.status, key.alias);
      throw new AiRequestError(failure.message, failure.status, failure.code);
    }
    // Logging failure must never trigger another provider call after successful generation.
    await finish(200, key.alias);
    if (key.id) { try { await prisma.userApiKey.updateMany({ where: { id: key.id, userId: context.userId }, data: { lastUsedAt: new Date(), errorCount: 0 } }); } catch { console.warn('AI last-used state could not be updated', { keyId: key.id }); } }
    return result;
  }
  await finish(503, 'unavailable');
  throw new AiRequestError('Chưa gọi được AI bằng các khóa của bạn.', 503, 'KEYS_UNAVAILABLE');
}
