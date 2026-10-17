import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AssignmentStatus } from '@prisma/client';

// Helper làm sạch đáp án và lời giải tuyệt đối trước khi gửi cho học sinh
export function sanitizeSnapshotForStudent(snapshot: any) {
  if (!snapshot || !Array.isArray(snapshot.questions)) return snapshot;

  const sanitizedQuestions = snapshot.questions.map((q: any) => {
    const cleanPayload: Record<string, any> = {};

    if (q.payload) {
      // 1. Trắc nghiệm: chỉ giữ lại choices, xóa correct
      if (Array.isArray(q.payload.choices)) {
        cleanPayload.choices = q.payload.choices.map((c: any) => ({
          key: c.key,
          text: c.text,
        }));
      }

      // 2. Đúng/Sai: chỉ giữ lại nội dung ý a,b,c,d; xóa isCorrect và explanation
      if (Array.isArray(q.payload.sub_questions)) {
        cleanPayload.sub_questions = q.payload.sub_questions.map((sub: any) => ({
          key: sub.key,
          content: sub.content,
        }));
      }
    }

    return {
      id: q.id,
      sectionId: q.sectionId,
      position: q.position,
      type: q.type,
      difficulty: q.difficulty,
      content: q.content,
      figures: q.figures,
      payload: cleanPayload,
      points: q.points,
      // TUYỆT ĐỐI KHÔNG gửi solution hoặc correct_answer
    };
  });

  return {
    title: snapshot.title,
    subject: snapshot.subject,
    grade: snapshot.grade,
    durationMinutes: snapshot.durationMinutes,
    metadata: snapshot.metadata,
    sections: snapshot.sections,
    questions: sanitizedQuestions,
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ publicId: string }> }
) {
  try {
    const { publicId } = await params;

    const assignment = await prisma.assignment.findUnique({
      where: { publicId },
      include: {
        group: {
          include: {
            students: {
              where: { archivedAt: null },
              select: { id: true, displayName: true },
              orderBy: { displayName: 'asc' },
            },
          },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Bài giao không tồn tại hoặc link không chính xác' }, { status: 404 });
    }

    const now = new Date();

    // Kiểm tra thời gian mở / đóng
    if (assignment.status !== AssignmentStatus.OPEN) {
      return NextResponse.json({ error: 'Bài thi này hiện đang tạm đóng' }, { status: 403 });
    }

    if (assignment.opensAt && assignment.opensAt > now) {
      return NextResponse.json(
        {
          error: `Bài thi chưa mở. Thời gian mở: ${assignment.opensAt.toLocaleString('vi-VN')}`,
          opensAt: assignment.opensAt,
        },
        { status: 403 }
      );
    }

    if (assignment.closesAt && assignment.closesAt < now) {
      return NextResponse.json(
        {
          error: `Bài thi đã kết thúc thời gian làm bài lúc ${assignment.closesAt.toLocaleString('vi-VN')}`,
          closesAt: assignment.closesAt,
        },
        { status: 403 }
      );
    }

    // Làm sạch đề thi (bóc tách toàn bộ đáp án)
    const sanitizedExam = sanitizeSnapshotForStudent(assignment.snapshot);

    return NextResponse.json({
      assignment: {
        id: assignment.id,
        title: assignment.title,
        publicId: assignment.publicId,
        mode: assignment.mode,
        identityMode: assignment.identityMode,
        durationMinutes: assignment.durationMinutes,
        maxAttempts: assignment.maxAttempts,
        opensAt: assignment.opensAt,
        closesAt: assignment.closesAt,
        requirePin: assignment.requirePin,
        leaderboard: assignment.leaderboard,
        group: assignment.group
          ? {
              id: assignment.group.id,
              name: assignment.group.name,
              students: assignment.group.students,
            }
          : null,
      },
      exam: sanitizedExam,
    });
  } catch (error) {
    console.error('Lỗi GET /api/public/assignments/[publicId]:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi lấy đề thi' }, { status: 500 });
  }
}
