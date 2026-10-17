import prisma from './prisma';
import { AiKeyStatus } from '@prisma/client';

export interface KeyInfo {
  alias: string;
  rawKey: string;
}

/**
 * Lấy danh sách ánh xạ alias -> rawKey từ biến môi trường
 * TUYỆT ĐỐI không in rawKey ra log hay trả về client!
 */
export function getRegisteredKeys(): KeyInfo[] {
  const result: KeyInfo[] = [];

  for (let i = 1; i <= 7; i++) {
    const rawKey = process.env[`GEMINI_API_KEY_${i}`];
    if (rawKey && rawKey.trim()) {
      result.push({
        alias: `key${i}`,
        rawKey: rawKey.trim(),
      });
    }
  }

  // Fallback: nếu dùng biến đơn GEMINI_API_KEY
  if (result.length === 0 && process.env.GEMINI_API_KEY) {
    result.push({
      alias: 'key1',
      rawKey: process.env.GEMINI_API_KEY.trim(),
    });
  }

  return result;
}

export function getAllGeminiKeys(): string[] {
  return getRegisteredKeys().map((k) => k.rawKey);
}

export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL || 'gemini-2.5-flash';
}

/**
 * Kiểm tra hạn mức gọi AI trong ngày của giáo viên
 */
export async function checkUserAiQuota(userId: string): Promise<{ allowed: boolean; limit: number; used: number }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { aiDailyLimit: true },
  });

  if (!user) {
    return { allowed: false, limit: 0, used: 0 };
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const usedToday = await prisma.aiUsageLog.count({
    where: {
      userId,
      createdAt: { gte: startOfDay },
      httpStatus: 200,
    },
  });

  return {
    allowed: usedToday < user.aiDailyLimit,
    limit: user.aiDailyLimit,
    used: usedToday,
  };
}

/**
 * Chọn key thông minh nhất từ cơ sở dữ liệu (least used, không bị cooldown hay dead)
 */
async function selectBestKey(registeredKeys: KeyInfo[], excludeAliases: string[] = []): Promise<KeyInfo | null> {
  const now = new Date();

  // Lấy trạng thái của các key từ DB
  const dbStates = await prisma.aiKeyState.findMany({
    where: {
      alias: { in: registeredKeys.map((k) => k.alias) },
    },
  });

  const stateMap = new Map(dbStates.map((s) => [s.alias, s]));

  // Lọc các key khả dụng
  const eligibleKeys = registeredKeys.filter((k) => {
    if (excludeAliases.includes(k.alias)) return false;
    const state = stateMap.get(k.alias);
    if (!state) return true; // Chưa có bản ghi thì khả dụng

    if (state.status === AiKeyStatus.DEAD) return false;
    if (state.status === AiKeyStatus.COOLDOWN) {
      if (state.cooldownUntil && state.cooldownUntil > now) {
        return false; // Vẫn đang trong thời gian cooldown
      }
    }
    return true;
  });

  if (eligibleKeys.length === 0) {
    return null;
  }

  // Sắp xếp theo số lượt gọi trong ngày ít nhất, sau đó đến thời điểm dùng cũ nhất
  eligibleKeys.sort((a, b) => {
    const stateA = stateMap.get(a.alias);
    const stateB = stateMap.get(b.alias);

    const countA = stateA?.dailyCount || 0;
    const countB = stateB?.dailyCount || 0;
    if (countA !== countB) return countA - countB;

    const timeA = stateA?.lastUsedAt ? new Date(stateA.lastUsedAt).getTime() : 0;
    const timeB = stateB?.lastUsedAt ? new Date(stateB.lastUsedAt).getTime() : 0;
    return timeA - timeB;
  });

  return eligibleKeys[0];
}

/**
 * Thực thi gọi AI với điều phối 7 Keys, ghi log DB và tự động xoay tua khi có lỗi
 */
export async function executeWithKeyRotation<T>(
  customKey: string | undefined,
  operation: (apiKey: string) => Promise<T>,
  context?: {
    userId?: string;
    endpoint?: string;
    model?: string;
  }
): Promise<T> {
  const startTime = Date.now();
  const endpoint = context?.endpoint || 'ai.generate';
  const model = context?.model || getGeminiModel();

  // 1. Nếu dùng Custom Key (BYOK)
  if (customKey && customKey.trim()) {
    try {
      const res = await operation(customKey.trim());
      if (context?.userId) {
        await prisma.aiUsageLog.create({
          data: {
            userId: context.userId,
            keyAlias: 'byok_custom',
            endpoint,
            model,
            httpStatus: 200,
            latencyMs: Date.now() - startTime,
          },
        });
      }
      return res;
    } catch (err) {
      if (context?.userId) {
        await prisma.aiUsageLog.create({
          data: {
            userId: context.userId,
            keyAlias: 'byok_custom',
            endpoint,
            model,
            httpStatus: 500,
            latencyMs: Date.now() - startTime,
          },
        });
      }
      throw err;
    }
  }

  // 2. Kiểm tra hạn mức cá nhân của giáo viên
  if (context?.userId) {
    const quota = await checkUserAiQuota(context.userId);
    if (!quota.allowed) {
      throw new Error(
        `Thầy/Cô đã dùng hết hạn mức AI trong ngày (${quota.used}/${quota.limit} lệnh). Vui lòng liên hệ Quản trị viên để nâng hạn mức.`
      );
    }
  }

  const registeredKeys = getRegisteredKeys();
  if (registeredKeys.length === 0) {
    throw new Error('Chưa cấu hình GEMINI_API_KEY trong hệ thống (.env.local).');
  }

  const maxAttempts = Math.min(registeredKeys.length, 7);
  const usedAliases: string[] = [];
  let lastError: unknown = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const bestKey = await selectBestKey(registeredKeys, usedAliases);
    if (!bestKey) break;

    usedAliases.push(bestKey.alias);
    const attemptStartTime = Date.now();

    try {
      const result = await operation(bestKey.rawKey);

      // Cập nhật trạng thái thành công trong DB
      await prisma.$transaction([
        prisma.aiKeyState.upsert({
          where: { alias: bestKey.alias },
          create: {
            alias: bestKey.alias,
            status: AiKeyStatus.ACTIVE,
            dailyCount: 1,
            lastUsedAt: new Date(),
            lastError: null,
          },
          update: {
            status: AiKeyStatus.ACTIVE,
            dailyCount: { increment: 1 },
            lastUsedAt: new Date(),
            lastError: null,
          },
        }),
        prisma.aiUsageLog.create({
          data: {
            userId: context?.userId,
            keyAlias: bestKey.alias,
            endpoint,
            model,
            httpStatus: 200,
            latencyMs: Date.now() - attemptStartTime,
          },
        }),
      ]);

      return result;
    } catch (err: unknown) {
      lastError = err;
      const errorMsg = String(err);
      const isKeyDead = errorMsg.includes('API_KEY_INVALID') || errorMsg.includes('401') || errorMsg.includes('403');
      const isRateLimit = errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED') || errorMsg.includes('quota');
      const isDemandSpike = errorMsg.includes('503') || errorMsg.includes('high demand') || errorMsg.includes('UNAVAILABLE');

      console.warn(`[GeminiCoordinator] Key ${bestKey.alias} thất bại:`, errorMsg);

      // Cập nhật trạng thái lỗi vào DB
      if (isKeyDead) {
        await prisma.aiKeyState.upsert({
          where: { alias: bestKey.alias },
          create: { alias: bestKey.alias, status: AiKeyStatus.DEAD, lastError: errorMsg },
          update: { status: AiKeyStatus.DEAD, lastError: errorMsg },
        });
      } else if (isRateLimit || isDemandSpike) {
        // Cooldown 60 giây
        const cooldownUntil = new Date(Date.now() + 60 * 1000);
        await prisma.aiKeyState.upsert({
          where: { alias: bestKey.alias },
          create: { alias: bestKey.alias, status: AiKeyStatus.COOLDOWN, cooldownUntil, lastError: errorMsg },
          update: { status: AiKeyStatus.COOLDOWN, cooldownUntil, lastError: errorMsg },
        });
      }

      await prisma.aiUsageLog.create({
        data: {
          userId: context?.userId,
          keyAlias: bestKey.alias,
          endpoint,
          model,
          httpStatus: isKeyDead ? 403 : isRateLimit ? 429 : 500,
          latencyMs: Date.now() - attemptStartTime,
        },
      });

      // Thử key tiếp theo với một chút jitter backoff
      if (attempt < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
      }
    }
  }

  // Xử lý thông báo thân thiện
  const finalMsg = String(lastError);
  if (finalMsg.includes('503') || finalMsg.includes('high demand')) {
    throw new Error('Máy chủ Google AI hiện đang quá tải tạm thời (Spikes in demand 503). Đã tự động xoay tua qua 7 key. Thầy/Cô vui lòng bấm thử lại sau vài giây.');
  }
  if (finalMsg.includes('429') || finalMsg.includes('RESOURCE_EXHAUSTED')) {
    throw new Error('Tất cả 7 Google Gemini API Keys hiện đã chạm hạn mức số lượt gọi tạm thời. Vui lòng đợi 30-60 giây để hệ thống phục hồi.');
  }

  throw lastError || new Error('Tất cả các API Key đều không thể kết nối tới Google Gemini.');
}
