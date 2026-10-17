import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { QuestionType, Difficulty, Visibility, SourceKind } from '@prisma/client';

const UpdateQuestionSchema = z.object({
  subject: z.string().optional(),
  grade: z.number().int().min(1).max(12).optional(),
  type: z.nativeEnum(QuestionType).optional(),
  difficulty: z.nativeEnum(Difficulty).optional(),
  content: z.string().min(1).optional(),
  figures: z.any().optional(),
  payload: z.record(z.string(), z.any()).optional(),
  solution: z.string().optional(),
  points: z.number().optional(),
  topics: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  visibility: z.nativeEnum(Visibility).optional(),
  revisionNote: z.string().optional(),
});

// GET: Lấy chi tiết một câu hỏi kèm lịch sử revisions
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const question = await prisma.question.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
        revisions: {
          select: { id: true, version: true, note: true, createdAt: true },
          orderBy: { version: 'desc' },
        },
      },
    });

    if (!question) {
      return NextResponse.json({ error: 'Không tìm thấy câu hỏi' }, { status: 404 });
    }

    // Chỉ chủ sở hữu hoặc câu hỏi được chia sẻ SHARED mới được xem
    if (question.ownerId !== user.id && question.visibility !== Visibility.SHARED) {
      return NextResponse.json({ error: 'Bạn không có quyền xem câu hỏi này' }, { status: 403 });
    }

    return NextResponse.json({ question });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }
    console.error('Lỗi GET /api/questions/[id]:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}

// PATCH: Cập nhật câu hỏi và tự động tạo QuestionRevision mới
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await req.json();
    const parsed = UpdateQuestionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Dữ liệu cập nhật không hợp lệ' },
        { status: 400 }
      );
    }

    const currentQuestion = await prisma.question.findFirst({
      where: { id, deletedAt: null },
    });

    if (!currentQuestion) {
      return NextResponse.json({ error: 'Không tìm thấy câu hỏi' }, { status: 404 });
    }

    if (currentQuestion.ownerId !== user.id) {
      return NextResponse.json({ error: 'Bạn không có quyền sửa câu hỏi này' }, { status: 403 });
    }

    const { revisionNote, ...updateFields } = parsed.data;
    const nextVersion = currentQuestion.version + 1;

    // Cập nhật câu hỏi và ghi nhận QuestionRevision trong transaction
    const updated = await prisma.$transaction(async (tx) => {
      const q = await tx.question.update({
        where: { id },
        data: {
          ...updateFields,
          version: nextVersion,
        },
        include: {
          author: { select: { id: true, name: true, email: true } },
        },
      });

      await tx.questionRevision.create({
        data: {
          questionId: id,
          version: nextVersion,
          snapshot: JSON.parse(JSON.stringify(q)),
          note: revisionNote || `Cập nhật phiên bản v${nextVersion}`,
        },
      });

      return q;
    });

    return NextResponse.json({
      success: true,
      question: updated,
      message: `Đã cập nhật câu hỏi lên phiên bản v${nextVersion}!`,
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }
    console.error('Lỗi PATCH /api/questions/[id]:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi cập nhật câu hỏi' }, { status: 500 });
  }
}

// DELETE: Xóa mềm câu hỏi
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const currentQuestion = await prisma.question.findFirst({
      where: { id, deletedAt: null },
    });

    if (!currentQuestion) {
      return NextResponse.json({ error: 'Không tìm thấy câu hỏi' }, { status: 404 });
    }

    if (currentQuestion.ownerId !== user.id) {
      return NextResponse.json({ error: 'Bạn không có quyền xóa câu hỏi này' }, { status: 403 });
    }

    // Xóa mềm
    await prisma.question.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: 'Đã xóa câu hỏi thành công!',
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }
    console.error('Lỗi DELETE /api/questions/[id]:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi xóa câu hỏi' }, { status: 500 });
  }
}
