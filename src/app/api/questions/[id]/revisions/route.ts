import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

const RollbackSchema = z.object({
  targetVersion: z.number().int().min(1, 'Phiên bản hoàn tác không hợp lệ'),
});

// GET: Lấy toàn bộ lịch sử các phiên bản sửa đổi (revisions) để so sánh diff
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const question = await prisma.question.findFirst({
      where: { id, deletedAt: null },
    });

    if (!question) {
      return NextResponse.json({ error: 'Không tìm thấy câu hỏi' }, { status: 404 });
    }

    if (question.ownerId !== user.id) {
      return NextResponse.json({ error: 'Bạn không có quyền xem lịch sử câu hỏi này' }, { status: 403 });
    }

    const revisions = await prisma.questionRevision.findMany({
      where: { questionId: id },
      orderBy: { version: 'desc' },
    });

    return NextResponse.json({ revisions });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }
    console.error('Lỗi GET revisions:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi lấy danh sách phiên bản' }, { status: 500 });
  }
}

// POST: Hoàn tác (Rollback) câu hỏi về một phiên bản cũ
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await req.json();
    const parsed = RollbackSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const { targetVersion } = parsed.data;

    const question = await prisma.question.findFirst({
      where: { id, deletedAt: null },
    });

    if (!question) {
      return NextResponse.json({ error: 'Không tìm thấy câu hỏi' }, { status: 404 });
    }

    if (question.ownerId !== user.id) {
      return NextResponse.json({ error: 'Bạn không có quyền sửa câu hỏi này' }, { status: 403 });
    }

    // Tìm snapshot của phiên bản cần hoàn tác
    const targetRevision = await prisma.questionRevision.findUnique({
      where: {
        questionId_version: {
          questionId: id,
          version: targetVersion,
        },
      },
    });

    if (!targetRevision) {
      return NextResponse.json({ error: `Không tìm thấy phiên bản v${targetVersion}` }, { status: 404 });
    }

    const snapshot = targetRevision.snapshot as Record<string, unknown>;
    const nextVersion = question.version + 1;

    // Khôi phục nội dung từ snapshot và tạo revision mới cho lần rollback này
    const rolledBack = await prisma.$transaction(async (tx) => {
      const q = await tx.question.update({
        where: { id },
        data: {
          content: snapshot.content as string,
          payload: snapshot.payload as object,
          solution: snapshot.solution as string,
          figures: snapshot.figures ? JSON.parse(JSON.stringify(snapshot.figures)) : undefined,
          difficulty: snapshot.difficulty as any,
          type: snapshot.type as any,
          points: snapshot.points as any,
          topics: (snapshot.topics as string[]) || [],
          tags: (snapshot.tags as string[]) || [],
          version: nextVersion,
        },
      });

      await tx.questionRevision.create({
        data: {
          questionId: id,
          version: nextVersion,
          snapshot: JSON.parse(JSON.stringify(q)),
          note: `Hoàn tác dữ liệu từ phiên bản v${targetVersion}`,
        },
      });

      return q;
    });

    return NextResponse.json({
      success: true,
      question: rolledBack,
      message: `Đã hoàn tác câu hỏi về phiên bản v${targetVersion} thành công (tạo phiên bản v${nextVersion})!`,
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }
    console.error('Lỗi POST rollback revisions:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi hoàn tác phiên bản' }, { status: 500 });
  }
}
