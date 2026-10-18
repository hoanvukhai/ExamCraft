import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Question } from '@/types/exam';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const examRecord = await prisma.exam.findFirst({
      where: { id, deletedAt: null },
      include: {
        items: {
          include: { question: true },
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!examRecord) {
      return NextResponse.json(
        { success: false, error: 'Đề thi không tồn tại hoặc đã bị xóa.' },
        { status: 404 }
      );
    }

    const questions: Question[] = examRecord.items.map((item) => {
      const q = item.question;
      const payload = (q.payload || {}) as Record<string, any>;
      return {
        id: q.id,
        sectionId: item.sectionId,
        type: q.type.toLowerCase() as any,
        difficulty: q.difficulty.toLowerCase() as any,
        content: q.content,
        figures: (q.figures as any) || undefined,
        choices: payload.choices,
        sub_questions: payload.sub_questions,
        correct_answer: payload.correct,
        step_by_step_solution: q.solution,
        tags: q.tags,
      };
    });

    const meta = (examRecord.metadata || {}) as Record<string, any>;

    const formattedExam = {
      id: examRecord.id,
      title: examRecord.title,
      subject: examRecord.subject,
      grade: examRecord.grade,
      durationMinutes: examRecord.durationMinutes || 90,
      metadata: {
        title: examRecord.title,
        subject: examRecord.subject,
        grade: examRecord.grade,
        durationMinutes: examRecord.durationMinutes || 90,
        ...meta,
      },
      sections: examRecord.sections,
      questions,
      createdAt: examRecord.createdAt.toISOString(),
      updatedAt: examRecord.updatedAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      exam: formattedExam,
    });
  } catch (error) {
    console.error('Lỗi GET /api/public/share/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi máy chủ khi tải đề thi chia sẻ' },
      { status: 500 }
    );
  }
}
