import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AssignmentStatus } from '@prisma/client';

// Helper làm sạch 1 câu hỏi (xóa bỏ đáp án, cờ đúng/sai, lời giải, giải thích)
function sanitizeSingleQuestionForStudent(q: any) {
  if (!q) return q;
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

  // Làm sạch nếu choices hoặc sub_questions nằm ở cấp câu hỏi
  const cleanChoices = Array.isArray(q.choices)
    ? q.choices.map((c: any) => ({ key: c.key, text: c.text }))
    : undefined;

  const cleanSubQuestions = Array.isArray(q.sub_questions)
    ? q.sub_questions.map((sub: any) => ({ key: sub.key, content: sub.content }))
    : undefined;

  return {
    id: q.id,
    sectionId: q.sectionId,
    position: q.position,
    type: q.type,
    difficulty: q.difficulty,
    content: q.content,
    figures: q.figures,
    payload: Object.keys(cleanPayload).length > 0 ? cleanPayload : (cleanChoices ? { choices: cleanChoices } : (cleanSubQuestions ? { sub_questions: cleanSubQuestions } : undefined)),
    choices: cleanChoices,
    sub_questions: cleanSubQuestions,
    points: q.points,
    // TUYỆT ĐỐI KHÔNG gửi solution, correct_answer, hay explanation
  };
}

// Helper làm sạch đáp án và lời giải tuyệt đối trước khi gửi cho học sinh (ROOM-BUG-001 - R5)
export function sanitizeSnapshotForStudent(snapshot: any) {
  if (!snapshot) return snapshot;

  const sanitizedQuestions = Array.isArray(snapshot.questions)
    ? snapshot.questions.map(sanitizeSingleQuestionForStudent)
    : [];

  // Làm sạch đệ quy bên trong sections[].questions nếu đề thi lưu cấu trúc phân mục lồng nhau
  const sanitizedSections = Array.isArray(snapshot.sections)
    ? snapshot.sections.map((sec: any) => {
        if (!sec) return sec;
        const cleanSec = { ...sec };
        if (Array.isArray(cleanSec.questions)) {
          cleanSec.questions = cleanSec.questions.map(sanitizeSingleQuestionForStudent);
        }
        return cleanSec;
      })
    : snapshot.sections;

  return {
    title: snapshot.title,
    subject: snapshot.subject,
    grade: snapshot.grade,
    durationMinutes: snapshot.durationMinutes,
    metadata: snapshot.metadata,
    sections: sanitizedSections,
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
