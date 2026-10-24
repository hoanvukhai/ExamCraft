import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { isSameOriginMutation } from '@/lib/attempt-access';
import { apiErrorResponse, ApiError } from '@/lib/api-error';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const subject = searchParams.get('subject');

    const whereClause: Prisma.TeacherAiMemoryWhereInput = { userId: user.id };
    if (subject && subject !== 'all') {
      whereClause.OR = [{ subject: subject }, { subject: 'all' }];
    }

    const memories = await prisma.teacherAiMemory.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    const activeCount = memories.filter((m) => m.isActive).length;

    return NextResponse.json({
      success: true,
      memories,
      stats: {
        total: memories.length,
        activeCount,
      },
    });
  } catch (error: unknown) {
    return apiErrorResponse(error, 'Không thể xử lý ghi chú hoặc yêu cầu AI lúc này.');
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!isSameOriginMutation(req)) throw new ApiError(403, 'Yêu cầu không hợp lệ');
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const body = await req.json();
    const { id, subject, category, title, insight, sampleQuestion, isActive } = body;

    if (id) {
      // Cập nhật memory hiện có (ví dụ bật/tắt isActive)
      const updated = await prisma.teacherAiMemory.update({
        where: { id, userId: user.id },
        data: {
          ...(typeof isActive === 'boolean' ? { isActive } : {}),
          ...(title ? { title: title.trim() } : {}),
          ...(insight ? { insight: insight.trim() } : {}),
          ...(category ? { category } : {}),
        },
      });
      return NextResponse.json({ success: true, memory: updated });
    }

    if (!title || !insight) {
      return NextResponse.json({ error: 'Tiêu đề và nội dung insight không được trống' }, { status: 400 });
    }

    const created = await prisma.teacherAiMemory.create({
      data: {
        userId: user.id,
        subject: subject || 'all',
        category: category || 'PEDAGOGICAL_STYLE',
        title: title.trim(),
        insight: insight.trim(),
        sampleQuestion: (sampleQuestion as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        sourceAction: 'MANUAL_NOTE',
        confidence: 1.0,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, memory: created });
  } catch (error: unknown) {
    return apiErrorResponse(error, 'Không thể xử lý ghi chú hoặc yêu cầu AI lúc này.');
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!isSameOriginMutation(req)) throw new ApiError(403, 'Yêu cầu không hợp lệ');
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Thiếu id tri thức cần xóa' }, { status: 400 });
    }

    await prisma.teacherAiMemory.deleteMany({
      where: { id, userId: user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return apiErrorResponse(error, 'Không thể xử lý ghi chú hoặc yêu cầu AI lúc này.');
  }
}
