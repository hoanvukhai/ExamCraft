import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

const UpdateExamSchema = z.object({
  title: z.string().min(1).optional(),
  subject: z.string().optional(),
  grade: z.number().int().min(1).max(12).optional(),
  durationMinutes: z.number().int().min(1).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  sections: z.array(z.record(z.string(), z.any())).optional(),
  variantCount: z.number().int().min(1).max(10).optional(),
  questionItems: z
    .array(
      z.object({
        questionId: z.string(),
        sectionId: z.string(),
        position: z.number().int(),
        pointsOverride: z.number().optional(),
      })
    )
    .optional(),
});

// GET: Lấy chi tiết đề thi kèm toàn bộ các câu hỏi trong đề
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const exam = await prisma.exam.findFirst({
      where: { id, deletedAt: null },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            question: true,
          },
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!exam) {
      return NextResponse.json({ error: 'Không tìm thấy đề thi' }, { status: 404 });
    }

    if (exam.ownerId !== user.id) {
      return NextResponse.json({ error: 'Bạn không có quyền xem đề thi này' }, { status: 403 });
    }

    return NextResponse.json({ exam });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }
    console.error('Lỗi GET /api/exams/[id]:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi lấy chi tiết đề thi' }, { status: 500 });
  }
}

// PATCH: Cập nhật đề thi
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await req.json();
    const parsed = UpdateExamSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const currentExam = await prisma.exam.findFirst({
      where: { id, deletedAt: null },
    });

    if (!currentExam) {
      return NextResponse.json({ error: 'Không tìm thấy đề thi' }, { status: 404 });
    }

    if (currentExam.ownerId !== user.id) {
      return NextResponse.json({ error: 'Bạn không có quyền sửa đề thi này' }, { status: 403 });
    }

    const { questionItems, ...updateData } = parsed.data;

    const updatedExam = await prisma.$transaction(async (tx) => {
      const exam = await tx.exam.update({
        where: { id },
        data: {
          ...updateData,
          version: currentExam.version + 1,
        },
      });

      // Nếu có cập nhật danh sách câu hỏi trong đề
      if (questionItems !== undefined) {
        await tx.examQuestion.deleteMany({ where: { examId: id } });
        if (questionItems.length > 0) {
          await tx.examQuestion.createMany({
            data: questionItems.map((item) => ({
              examId: id,
              questionId: item.questionId,
              sectionId: item.sectionId,
              position: item.position,
              pointsOverride: item.pointsOverride,
            })),
          });
        }
      }

      return exam;
    });

    return NextResponse.json({
      success: true,
      exam: updatedExam,
      message: 'Cập nhật đề thi thành công!',
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }
    console.error('Lỗi PATCH /api/exams/[id]:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi cập nhật đề thi' }, { status: 500 });
  }
}

// DELETE: Xóa mềm đề thi
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const currentExam = await prisma.exam.findFirst({
      where: { id, deletedAt: null },
    });

    if (!currentExam) {
      return NextResponse.json({ error: 'Không tìm thấy đề thi' }, { status: 404 });
    }

    if (currentExam.ownerId !== user.id) {
      return NextResponse.json({ error: 'Bạn không có quyền xóa đề thi này' }, { status: 403 });
    }

    await prisma.exam.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: 'Đã xóa đề thi thành công!',
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }
    console.error('Lỗi DELETE /api/exams/[id]:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi xóa đề thi' }, { status: 500 });
  }
}
