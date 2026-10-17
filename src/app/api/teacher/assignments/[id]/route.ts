import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { AssignmentStatus, AttemptStatus } from '@prisma/client';

// GET: Lấy thông tin bài giao, danh sách bài làm và phân tích thống kê theo câu hỏi
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const assignment = await prisma.assignment.findFirst({
      where: {
        id,
        ownerId: user.id,
      },
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
        attempts: {
          include: {
            student: { select: { id: true, displayName: true } },
            answers: true,
          },
          orderBy: { startedAt: 'desc' },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Không tìm thấy bài giao' }, { status: 404 });
    }

    const snapshot = assignment.snapshot as any;
    const questions: any[] = snapshot?.questions || [];
    const sections: any[] = snapshot?.sections || [];

    // Phân loại các lượt làm bài
    const submittedAttempts = assignment.attempts.filter(
      (a) => a.status === AttemptStatus.SUBMITTED && a.score !== null
    );
    const inProgressAttempts = assignment.attempts.filter(
      (a) => a.status === AttemptStatus.IN_PROGRESS
    );

    // Tính toán phổ điểm và điểm trung bình
    const scores = submittedAttempts.map((a) => Number(a.score));
    const totalSubmitted = scores.length;
    const avgScore = totalSubmitted > 0 ? scores.reduce((sum, s) => sum + s, 0) / totalSubmitted : 0;
    const maxScore = totalSubmitted > 0 ? Math.max(...scores) : 0;
    const minScore = totalSubmitted > 0 ? Math.min(...scores) : 0;

    const distribution = {
      under5: scores.filter((s) => s < 5.0).length,
      from5to65: scores.filter((s) => s >= 5.0 && s < 6.5).length,
      from65to8: scores.filter((s) => s >= 6.5 && s < 8.0).length,
      from8to10: scores.filter((s) => s >= 8.0).length,
    };

    // Phân tích tỷ lệ đúng theo từng câu hỏi (Item Analysis)
    const itemAnalysis = questions.map((q, idx) => {
      let correctCount = 0;
      let totalAnswered = 0;

      submittedAttempts.forEach((att) => {
        const studentAns = att.answers.find((a) => a.questionKey === q.id);
        if (studentAns) {
          totalAnswered++;
          if (studentAns.isCorrect) {
            correctCount++;
          }
        }
      });

      const correctRate = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;

      return {
        questionId: q.id,
        questionIndex: idx + 1,
        type: q.type,
        points: q.points || 0.25,
        content: q.content,
        totalAnswered,
        correctCount,
        correctRate,
      };
    });

    return NextResponse.json({
      assignment: {
        id: assignment.id,
        title: assignment.title,
        publicId: assignment.publicId,
        mode: assignment.mode,
        status: assignment.status,
        identityMode: assignment.identityMode,
        durationMinutes: assignment.durationMinutes,
        maxAttempts: assignment.maxAttempts,
        opensAt: assignment.opensAt,
        closesAt: assignment.closesAt,
        showResult: assignment.showResult,
        showSolution: assignment.showSolution,
        leaderboard: assignment.leaderboard,
        createdAt: assignment.createdAt,
        group: assignment.group,
        totalQuestions: questions.length,
      },
      stats: {
        totalStudents: assignment.group?.students.length || assignment.attempts.length,
        totalSubmitted,
        totalInProgress: inProgressAttempts.length,
        avgScore: Math.round(avgScore * 100) / 100,
        maxScore,
        minScore,
        distribution,
      },
      itemAnalysis,
      attempts: assignment.attempts.map((att) => ({
        id: att.id,
        studentId: att.studentId,
        studentName: att.student.displayName,
        attemptNo: att.attemptNo,
        status: att.status,
        score: att.score !== null ? Number(att.score) : null,
        maxScore: att.maxScore !== null ? Number(att.maxScore) : 10,
        startedAt: att.startedAt,
        submittedAt: att.submittedAt,
        deadlineAt: att.deadlineAt,
        answersCount: att.answers.length,
      })),
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }
    console.error('Lỗi GET /api/teacher/assignments/[id]:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}

// PATCH: Giáo viên cập nhật trạng thái bài giao (Mở lại / Gia hạn / Đóng sớm)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await req.json();

    const assignment = await prisma.assignment.findFirst({
      where: { id, ownerId: user.id },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Không tìm thấy bài giao' }, { status: 404 });
    }

    const updatedData: Record<string, any> = {};

    if (body.status && Object.values(AssignmentStatus).includes(body.status)) {
      updatedData.status = body.status;
    }

    if (body.closesAt !== undefined) {
      updatedData.closesAt = body.closesAt ? new Date(body.closesAt) : null;
    }

    if (typeof body.durationMinutes === 'number') {
      updatedData.durationMinutes = body.durationMinutes;
    }

    if (typeof body.maxAttempts === 'number') {
      updatedData.maxAttempts = body.maxAttempts;
    }

    const updated = await prisma.assignment.update({
      where: { id },
      data: updatedData,
    });

    return NextResponse.json({
      success: true,
      assignment: updated,
      message: 'Cập nhật bài giao thành công',
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }
    console.error('Lỗi PATCH /api/teacher/assignments/[id]:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}
