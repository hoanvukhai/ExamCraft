import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { Visibility, SourceKind } from '@prisma/client';

// POST: Giáo viên nhân bản câu hỏi dùng chung về kho câu hỏi riêng của mình
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const originalQuestion = await prisma.question.findFirst({
      where: { id, deletedAt: null },
      include: {
        author: { select: { id: true, name: true } },
      },
    });

    if (!originalQuestion) {
      return NextResponse.json({ error: 'Không tìm thấy câu hỏi gốc' }, { status: 404 });
    }

    // Kiểm tra quyền chia sẻ & quyền truy cập
    if (originalQuestion.ownerId !== user.id && originalQuestion.visibility !== Visibility.SHARED) {
      return NextResponse.json({ error: 'Câu hỏi này không được chia sẻ' }, { status: 403 });
    }

    if (!originalQuestion.shareable) {
      return NextResponse.json(
        { error: 'Câu hỏi này có nguồn gốc cá nhân (ví dụ: nhập từ web), không được phép chia sẻ hoặc nhân bản' },
        { status: 400 }
      );
    }

    // Nhân bản câu hỏi: tạo bản sao mới với ownerId = user.id, authorId giữ nguyên tác giả gốc, originId trỏ tới câu gốc
    const forkedQuestion = await prisma.$transaction(async (tx) => {
      const q = await tx.question.create({
        data: {
          ownerId: user.id,
          authorId: originalQuestion.authorId, // Giữ nguyên tác giả gốc
          originId: originalQuestion.id, // Lưu liên kết tới câu gốc
          subject: originalQuestion.subject,
          grade: originalQuestion.grade,
          type: originalQuestion.type,
          difficulty: originalQuestion.difficulty,
          content: originalQuestion.content,
          figures: originalQuestion.figures ? JSON.parse(JSON.stringify(originalQuestion.figures)) : undefined,
          payload: originalQuestion.payload as object,
          solution: originalQuestion.solution,
          points: originalQuestion.points,
          topics: originalQuestion.topics,
          tags: originalQuestion.tags,
          visibility: Visibility.PRIVATE, // Bản nhân bản bắt đầu ở chế độ riêng tư
          sourceKind: SourceKind.FORKED,
          shareable: true,
          aiGenerated: originalQuestion.aiGenerated,
          source: `Nhân bản từ câu hỏi của ${originalQuestion.author.name}`,
          version: 1,
        },
        include: {
          author: { select: { id: true, name: true, email: true } },
        },
      });

      await tx.questionRevision.create({
        data: {
          questionId: q.id,
          version: 1,
          snapshot: JSON.parse(JSON.stringify(q)),
          note: `Nhân bản từ câu hỏi gốc của tác giả ${originalQuestion.author.name}`,
        },
      });

      return q;
    });

    return NextResponse.json({
      success: true,
      question: forkedQuestion,
      message: `Đã thêm câu hỏi vào ngân hàng cá nhân của bạn!`,
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }
    console.error('Lỗi POST /api/questions/[id]/fork:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi nhân bản câu hỏi' }, { status: 500 });
  }
}
