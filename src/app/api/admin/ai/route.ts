import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireAdmin, logAudit } from '@/lib/auth';
import { AiKeyStatus } from '@prisma/client';
import { summarizeAiUsage, summarizeAccountKeys } from '@/lib/admin-overview';

const ResetKeySchema = z.object({
  alias: z.string().optional(),
  action: z.enum(['reset_key', 'reset_all']),
});

// GET: Account-owned keys and real usage; legacy keyStates retained for compatibility.
export async function GET() {
  try {
    await requireAdmin();

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [usage, accountKeys, recentLogs, keyStates] = await Promise.all([
      prisma.aiUsageLog.groupBy({ by: ['httpStatus'], where: { createdAt: { gte: today } }, _count: { _all: true } }),
      prisma.userApiKey.groupBy({ by: ['isActive', 'grantId'], _count: { _all: true } }),
      prisma.aiUsageLog.findMany({ take: 30, orderBy: { createdAt: 'desc' },
        select: { id: true, endpoint: true, keyAlias: true, httpStatus: true, latencyMs: true, createdAt: true, user: { select: { name: true, email: true } } } }),
      // Kept for old API consumers; the current UI uses accountKeys, never this legacy pool.
      prisma.aiKeyState.findMany({ orderBy: { alias: 'asc' } }),
    ]);
    return NextResponse.json({ keyStates, stats: summarizeAiUsage(usage), keySummary: summarizeAccountKeys(accountKeys), recentLogs });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'MUST_CHANGE_PASSWORD') return NextResponse.json({ error: 'Vui lòng đổi mật khẩu trước khi tiếp tục', code: 'MUST_CHANGE_PASSWORD' }, { status: 403 });
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }
    if (err.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Bạn không có quyền quản trị viên' }, { status: 403 });
    }
    console.error('Lỗi GET /api/admin/ai:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi lấy dữ liệu AI' }, { status: 500 });
  }
}

// POST: Đặt lại trạng thái (Reset Cooldown / Unlock key)
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const parsed = ResetKeySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 });
    }

    const { action, alias } = parsed.data;

    if (action === 'reset_all') {
      await prisma.aiKeyState.updateMany({
        data: {
          status: AiKeyStatus.ACTIVE,
          cooldownUntil: null,
          lastError: null,
        },
      });

      await logAudit({
        actorId: admin.id,
        action: 'ai_key.reset_all',
        targetType: 'AiKeyState',
      });

      return NextResponse.json({ success: true, message: 'Đã đặt lại trạng thái theo dõi khóa cũ. Thao tác này không bật lại khóa của tài khoản.' });
    }

    if (action === 'reset_key' && alias) {
      await prisma.aiKeyState.update({
        where: { alias },
        data: {
          status: AiKeyStatus.ACTIVE,
          cooldownUntil: null,
          lastError: null,
        },
      });

      await logAudit({
        actorId: admin.id,
        action: 'ai_key.reset_key',
        targetType: 'AiKeyState',
        targetId: alias,
      });

      return NextResponse.json({ success: true, message: `Đã kích hoạt lại ${alias} thành công!` });
    }

    return NextResponse.json({ error: 'Thiếu thông số xử lý' }, { status: 400 });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'MUST_CHANGE_PASSWORD') return NextResponse.json({ error: 'Vui lòng đổi mật khẩu trước khi tiếp tục', code: 'MUST_CHANGE_PASSWORD' }, { status: 403 });
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }
    if (err.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
    }
    console.error('Lỗi POST /api/admin/ai:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}
