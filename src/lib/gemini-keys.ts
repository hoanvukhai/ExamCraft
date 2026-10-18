import prisma from './prisma';
import { decryptApiKey } from './crypto';

export interface KeyInfo {
  alias: string;
  rawKey: string;
}

/**
 * Tương thích ngược: Hệ thống v3.2 hoạt động theo mô hình Bring-Your-Own-Key (BYOK) thuần túy.
 * Toàn bộ API Key được lưu riêng biệt và mã hóa AES-256-GCM trong PostgreSQL của từng tài khoản.
 */
export function getRegisteredKeys(): KeyInfo[] {
  return [];
}

export function getAllGeminiKeys(): string[] {
  return [];
}

export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL || 'gemini-2.5-flash';
}

/**
 * Kiểm tra hạn mức gọi AI trong ngày của giáo viên (aiDailyLimit)
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
 * THỰC THI GỌI AI VỚI CƠ CHẾ XOAY TUA KEY CỦA CHÍNH TÀI KHOẢN (BYOK)
 * - Người dùng thêm 1 key -> Dùng 1 key
 * - Người dùng thêm 2, 3, 5 key -> Tự động xoay tua Round-Robin
 * - Khi 1 key gặp lỗi hạn mức (Quota 429) -> Tự động Fallback sang key tiếp theo của người dùng
 * - Tuyệt đối không dùng key chung hệ thống
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

  // 1. Trường hợp người dùng truyền trực tiếp key tạm thời (BYOK Custom Input)
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

  // 2. Bắt buộc phải có thông tin tài khoản người dùng
  if (!context?.userId) {
    throw new Error('Chưa đăng nhập tài khoản. Vui lòng đăng nhập để sử dụng tính năng AI.');
  }

  // 3. Kiểm tra hạn mức gọi AI trong ngày của giáo viên
  const quota = await checkUserAiQuota(context.userId);
  if (!quota.allowed) {
    throw new Error(
      `Thầy/Cô đã dùng hết hạn mức AI trong ngày (${quota.used}/${quota.limit} lệnh). Vui lòng liên hệ Quản trị viên để nâng hạn mức hoặc chờ sau 00:00 đêm.`
    );
  }

  // 4. Lấy toàn bộ API Key cá nhân đang hoạt động của người dùng trong PostgreSQL
  const userKeys = await prisma.userApiKey.findMany({
    where: { userId: context.userId, isActive: true },
    orderBy: [
      { errorCount: 'asc' }, // Ưu tiên các key chưa gặp lỗi
      { lastUsedAt: 'asc' },  // Xoay tua round-robin (chọn key ít dùng nhất gần đây)
    ],
  });

  if (userKeys.length === 0) {
    throw new Error(
      'Tài khoản của Thầy/Cô chưa có Google Gemini API Key nào đang kích hoạt. Vui lòng bấm vào Avatar hoặc mục "Kho Khóa AI" ở menu bên trái để thêm khóa API của mình.'
    );
  }

  // 5. Vòng lặp xoay tua giữa các key của chính người dùng
  let lastError: unknown = null;

  for (let i = 0; i < userKeys.length; i++) {
    const currentKeyRecord = userKeys[i];
    const attemptStartTime = Date.now();

    try {
      // Giải mã an toàn trong bộ nhớ RAM
      const plainApiKey = decryptApiKey(
        currentKeyRecord.keyEncrypted,
        currentKeyRecord.keyIv,
        currentKeyRecord.keyTag
      );

      const result = await operation(plainApiKey);

      // Gọi thành công -> Cập nhật trạng thái tốt cho key
      await prisma.$transaction([
        prisma.userApiKey.update({
          where: { id: currentKeyRecord.id },
          data: {
            lastUsedAt: new Date(),
            errorCount: 0,
          },
        }),
        prisma.aiUsageLog.create({
          data: {
            userId: context.userId,
            keyAlias: `user_key:${currentKeyRecord.label}`,
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
      const isRateLimit = errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('RESOURCE_EXHAUSTED');
      const isDead = errorMsg.includes('API_KEY_INVALID') || errorMsg.includes('400') || errorMsg.includes('403');

      console.warn(`[UserKeyRotation] Key cá nhân "${currentKeyRecord.label}" (${currentKeyRecord.keyMasked}) thất bại:`, errorMsg);

      // Cập nhật lỗi cho key này
      await prisma.userApiKey.update({
        where: { id: currentKeyRecord.id },
        data: {
          errorCount: { increment: 1 },
          ...(isDead ? { isActive: false } : {}),
        },
      });

      await prisma.aiUsageLog.create({
        data: {
          userId: context.userId,
          keyAlias: `user_key:${currentKeyRecord.label}`,
          endpoint,
          model,
          httpStatus: isDead ? 403 : isRateLimit ? 429 : 500,
          latencyMs: Date.now() - attemptStartTime,
        },
      });

      // Nếu còn key tiếp theo trong danh sách của người dùng -> Thử key tiếp theo ngay!
      if (i < userKeys.length - 1) {
        console.info(`[UserKeyRotation] Tự động chuyển sang key tiếp theo của Thầy/Cô (${userKeys[i + 1].label})...`);
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }
  }

  // 6. Nếu tất cả các key của người dùng đều thất bại
  const errMsg = String(lastError);
  if (errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')) {
    throw new Error(
      `Tất cả ${userKeys.length} Google Gemini API Key của Thầy/Cô đều đang chạm trần hạn mức (Quota 429). Thầy/Cô vui lòng đợi vài phút hoặc bấm vào Avatar để thêm/kiểm tra các khóa.`
    );
  }

  throw new Error(
    `Không thể kết nối đến Google Gemini với các API Key của bạn: ${errMsg}. Vui lòng mở mục "Kho Khóa AI" để kiểm tra.`
  );
}
