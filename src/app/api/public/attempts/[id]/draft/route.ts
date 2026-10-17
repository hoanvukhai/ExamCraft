import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AttemptStatus } from '@prisma/client';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const draft = body.draft || {};

    const attempt = await prisma.attempt.findUnique({
      where: { id },
      select: { id: true, status: true, deadlineAt: true },
    });

    if (!attempt) {
      return NextResponse.json({ error: 'Không tìm thấy lượt làm bài' }, { status: 404 });
    }

    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      return NextResponse.json({ error: 'Bài làm đã nộp hoặc đã đóng, không thể lưu nháp' }, { status: 400 });
    }

    // Cho phép dung sai 15 giây trễ mạng
    if (attempt.deadlineAt) {
      const gracePeriodMs = 15 * 1000;
      if (new Date().getTime() > attempt.deadlineAt.getTime() + gracePeriodMs) {
        return NextResponse.json({ error: 'Đã hết giờ làm bài' }, { status: 403 });
      }
    }

    await prisma.attempt.update({
      where: { id },
      data: {
        draft: draft as object,
      },
    });

    return NextResponse.json({ success: true, savedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Lỗi PATCH draft:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi lưu nháp' }, { status: 500 });
  }
}
