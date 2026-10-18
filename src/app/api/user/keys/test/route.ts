import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { decryptApiKey } from '@/lib/crypto';
import { getGeminiModel } from '@/lib/gemini-keys';

/**
 * POST /api/user/keys/test
 * Kiểm tra thực tế trạng thái của một API Key:
 * - Còn hoạt động tốt (ACTIVE)
 * - Đang hết lượt / vượt hạn mức (QUOTA_EXCEEDED - 429)
 * - Đã hết hạn hoặc không hợp lệ (INVALID_KEY - 400/403)
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { keyId, rawKey } = body;

    let targetKey = '';

    if (rawKey && typeof rawKey === 'string') {
      targetKey = rawKey.trim();
    } else if (keyId) {
      const savedKey = await prisma.userApiKey.findUnique({
        where: { id: keyId },
      });

      if (!savedKey || savedKey.userId !== user.id) {
        return NextResponse.json({ error: 'Không tìm thấy API Key cần kiểm tra' }, { status: 404 });
      }

      // Giải mã an toàn trong bộ nhớ
      targetKey = decryptApiKey(savedKey.keyEncrypted, savedKey.keyIv, savedKey.keyTag);
    } else {
      return NextResponse.json({ error: 'Cần cung cấp keyId hoặc rawKey để kiểm tra' }, { status: 400 });
    }

    if (!targetKey) {
      return NextResponse.json({ error: 'Không thể lấy giá trị API Key' }, { status: 400 });
    }

    // Gửi thử một lệnh siêu nhẹ (1 token) tới Gemini API để kiểm tra kết nối & hạn mức
    const model = getGeminiModel();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(targetKey)}`;

    const startTime = Date.now();
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: '1+1' }] }],
        generationConfig: {
          maxOutputTokens: 2,
          temperature: 0.1,
        },
      }),
    });

    const latencyMs = Date.now() - startTime;
    const status = response.status;

    if (response.ok) {
      // Key hoạt động tốt!
      if (keyId) {
        await prisma.userApiKey.update({
          where: { id: keyId },
          data: {
            isActive: true,
            errorCount: 0,
            lastUsedAt: new Date(),
          },
        });
      }

      return NextResponse.json({
        success: true,
        status: 'ACTIVE',
        message: 'Khóa API hoàn toàn hợp lệ và đang hoạt động tốt!',
        latencyMs,
      });
    }

    const errData = await response.json().catch(() => ({}));
    const errMsg = errData?.error?.message || response.statusText;

    if (status === 429) {
      // Hết hạn mức / Lượt gọi (Quota exceeded)
      if (keyId) {
        await prisma.userApiKey.update({
          where: { id: keyId },
          data: { errorCount: { increment: 1 } },
        });
      }

      return NextResponse.json({
        success: false,
        status: 'QUOTA_EXCEEDED',
        message: 'Khóa API đã hết lượt dùng tạm thời hoặc vượt hạn mức (Quota 429). Hãy đợi vài phút hoặc dùng key khác.',
        details: errMsg,
      });
    }

    if (status === 400 || status === 403) {
      // Key sai hoặc hết hạn
      if (keyId) {
        await prisma.userApiKey.update({
          where: { id: keyId },
          data: {
            isActive: false,
            errorCount: { increment: 1 },
          },
        });
      }

      return NextResponse.json({
        success: false,
        status: 'INVALID_OR_EXPIRED',
        message: 'Khóa API không hợp lệ hoặc đã bị Google thu hồi/hết hạn.',
        details: errMsg,
      });
    }

    return NextResponse.json({
      success: false,
      status: 'ERROR',
      message: `Google Gemini trả về mã lỗi ${status}: ${errMsg}`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi kết nối';
    return NextResponse.json({
      success: false,
      status: 'NETWORK_ERROR',
      message: `Không thể kết nối đến máy chủ Google: ${message}`,
    });
  }
}
