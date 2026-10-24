import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireAdmin, logAudit } from '@/lib/auth';
import { AiKeyStatus } from '@prisma/client';

const ResetKeySchema = z.object({
  alias: z.string().optional(),
  action: z.enum(['reset_key', 'reset_all']),
});

// GET: Thống kê trạng thái 7 API Keys & Nhật ký gọi AI
export async function GET() {
  try {
    await requireAdmin();

    const [keyStates, totalToday, successToday, errorToday, recentLogs] = await Promise.all([
      prisma.aiKeyState.findMany({
        orderBy: { alias: 'asc' },
      }),
      prisma.aiUsageLog.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.aiUsageLog.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
          httpStatus: 200,
        },
      }),
      prisma.aiUsageLog.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
          httpStatus: { not: 200 },
        },
      }),
      prisma.aiUsageLog.findMany({
        take: 30,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
    ]);

    return NextResponse.json({
      keyStates,
      stats: {
        totalToday,
        successToday,
        errorToday,
        successRate: totalToday > 0 ? Math.round((successToday / totalToday) * 100) : 100,
      },
      recentLogs,
    });
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

      return NextResponse.json({ success: true, message: 'Đã đặt lại trạng thái hoạt động cho tất cả 7 keys!' });
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
