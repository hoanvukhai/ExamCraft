import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET: Xem chi tiết bài làm của một học sinh
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const attempt = await prisma.attempt.findFirst({
      where: {
        id,
        assignment: { ownerId: user.id },
      },
      include: {
        student: { select: { id: true, displayName: true } },
        assignment: {
          select: {
            id: true,
            title: true,
            snapshot: true,
          },
        },
        answers: true,
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: 'Không tìm thấy bài làm' }, { status: 404 });
    }

    const snapshot = attempt.assignment.snapshot as any;
    const questions: any[] = snapshot?.questions || [];

    // Map câu trả lời của học sinh theo questionKey
    const answerMap = new Map<string, any>(
      attempt.answers.map((ans) => [ans.questionKey, ans])
    );

    const detailedQuestions = questions.map((q, idx) => {
      const studentAns = answerMap.get(q.id);

      return {
        questionId: q.id,
        index: idx + 1,
        type: q.type,
        difficulty: q.difficulty,
        content: q.content,
        figures: q.figures,
        payload: q.payload,
        solution: q.solution,
        points: q.points || 0.25,
        studentResponse: studentAns ? studentAns.response : null,
        isCorrect: studentAns ? studentAns.isCorrect : false,
        earned: studentAns ? Number(studentAns.earned) : 0,
        teacherComment: studentAns?.comment || null,
      };
    });

    return NextResponse.json({
      attempt: {
        id: attempt.id,
        studentName: attempt.student.displayName,
        attemptNo: attempt.attemptNo,
        status: attempt.status,
        score: attempt.score !== null ? Number(attempt.score) : null,
        maxScore: attempt.maxScore !== null ? Number(attempt.maxScore) : 10,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        assignmentTitle: attempt.assignment.title,
      },
      questions: detailedQuestions,
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }
    console.error('Lỗi GET /api/teacher/attempts/[id]:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}

// POST: Giáo viên chấm tay tự luận hoặc điều chỉnh điểm câu hỏi
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await req.json();

    const { questionKey, earned, teacherComment } = body;

    if (!questionKey || typeof earned !== 'number') {
      return NextResponse.json({ error: 'Dữ liệu chấm điểm không hợp lệ' }, { status: 400 });
    }

    const attempt = await prisma.attempt.findFirst({
      where: {
        id,
        assignment: { ownerId: user.id },
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: 'Không tìm thấy bài làm' }, { status: 404 });
    }

    // Cập nhật câu trả lời và tính toán lại tổng điểm trong Transaction
    const updatedAttempt = await prisma.$transaction(async (tx) => {
      await tx.attemptAnswer.upsert({
        where: {
          attemptId_questionKey: {
            attemptId: id,
            questionKey,
          },
        },
        create: {
          attemptId: id,
          questionKey,
          response: {},
          earned,
          manualScore: earned,
          isCorrect: earned > 0,
          comment: teacherComment || null,
        },
        update: {
          earned,
          manualScore: earned,
          isCorrect: earned > 0,
          comment: teacherComment !== undefined ? teacherComment : undefined,
        },
      });

      // Tính tổng điểm mới từ tất cả các câu trả lời
      const allAnswers = await tx.attemptAnswer.findMany({
        where: { attemptId: id },
      });

      const newTotalScore = allAnswers.reduce(
        (sum, a) => sum + Number(a.earned || 0),
        0
      );
      const roundedScore = Math.round(newTotalScore * 100) / 100;

      return tx.attempt.update({
        where: { id },
        data: { score: roundedScore },
      });
    });

    return NextResponse.json({
      success: true,
      newScore: Number(updatedAttempt.score),
      message: 'Đã lưu điểm và nhận xét của giáo viên thành công!',
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }
    console.error('Lỗi POST /api/teacher/attempts/[id]:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}

// DELETE: Giáo viên xóa lượt làm bài (cho phép học sinh làm lại)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const attempt = await prisma.attempt.findFirst({
      where: {
        id,
        assignment: { ownerId: user.id },
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: 'Không tìm thấy bài làm' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.attemptAnswer.deleteMany({ where: { attemptId: id } });
      await tx.attempt.delete({ where: { id } });
    });

    return NextResponse.json({
      success: true,
      message: 'Đã xóa lượt làm bài thành công',
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }
    console.error('Lỗi DELETE /api/teacher/attempts/[id]:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}
