import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRequestAuth } from '@/lib/request-auth';
import { ApiError, apiErrorResponse } from '@/lib/api-error';
import { AssignmentStatus, AttemptStatus } from '@prisma/client';
import { z } from 'zod';
import { isSameOriginMutation } from '@/lib/attempt-access';
import { asObject } from '@/lib/public-exam';
import { requiresNumericScore, type AssessmentMode } from '@/lib/education-catalog';
const UpdateSchema = z.object({ status: z.nativeEnum(AssignmentStatus).optional(), closesAt: z.iso.datetime({ offset: true }).nullable().optional(), durationMinutes: z.number().int().min(1).max(1440).optional(), maxAttempts: z.number().int().min(1).max(10).optional() }).strict();

// GET: Lấy thông tin bài giao, danh sách bài làm và phân tích thống kê theo câu hỏi
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRequestAuth(req);
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
    const numeric = requiresNumericScore(asObject(asObject(assignment.snapshot).metadata).assessmentMode as AssessmentMode | undefined);
    const questions: any[] = snapshot?.questions || [];
    const sections: any[] = snapshot?.sections || [];

    // Phân loại các lượt làm bài
    const submittedAttempts = assignment.attempts.filter(
      (a) => numeric && a.status === AttemptStatus.SUBMITTED && a.score !== null && !a.needsGrading
    );
    const inProgressAttempts = assignment.attempts.filter(
      (a) => a.status === AttemptStatus.IN_PROGRESS
    );

    // Tính toán phổ điểm và điểm trung bình
    const scores = submittedAttempts.map((a) => Number(a.score));
    const totalSubmitted = assignment.attempts.filter(a => a.status === AttemptStatus.SUBMITTED).length;
    const totalPendingGrading = assignment.attempts.filter(a => a.status === AttemptStatus.SUBMITTED && a.needsGrading).length;
    const totalGraded = assignment.attempts.filter(a => a.status === AttemptStatus.SUBMITTED && !a.needsGrading).length;
    const avgScore = scores.length ? scores.reduce((sum, s) => sum + s, 0) / scores.length : 0;
    const maxScore = scores.length ? Math.max(...scores) : 0;
    const minScore = scores.length ? Math.min(...scores) : 0;

    const distribution = {
      under5: scores.filter((s) => s < 5.0).length,
      from5to65: scores.filter((s) => s >= 5.0 && s < 6.5).length,
      from65to8: scores.filter((s) => s >= 6.5 && s < 8.0).length,
      from8to10: scores.filter((s) => s >= 8.0).length,
    };

    // Phân tích tỷ lệ đúng theo từng câu hỏi (Item Analysis)
    const itemAnalysis = numeric ? questions.map((q, idx) => {
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
        points: q.points ?? 0.25,
        content: q.content,
        totalAnswered,
        correctCount,
        correctRate,
      };
    }) : [];

    return NextResponse.json({
      assignment: {
        id: assignment.id,
        title: assignment.title,
        assessmentMode: asObject(snapshot.metadata).assessmentMode,
        publicId: assignment.publicId,
        mode: assignment.mode,
        status: assignment.status,
        identityMode: assignment.identityMode,
        durationMinutes: assignment.durationMinutes,
        maxAttempts: assignment.maxAttempts,
        opensAt: assignment.opensAt,
        closesAt: assignment.closesAt,
        joinCode: assignment.joinCode,
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
        totalPendingGrading,
        totalGraded,
        totalInProgress: inProgressAttempts.length,
        avgScore: numeric ? Math.round(avgScore * 100) / 100 : null,
        maxScore: numeric ? maxScore : null,
        minScore: numeric ? minScore : null,
        distribution,
      },
      itemAnalysis,
      attempts: assignment.attempts.map((att) => ({
        id: att.id,
        studentId: att.studentId,
        studentName: att.student.displayName,
        attemptNo: att.attemptNo,
        status: att.status,
        score: numeric && att.score !== null ? Number(att.score) : null,
        maxScore: numeric && att.maxScore !== null ? Number(att.maxScore) : null,
        startedAt: att.startedAt,
        submittedAt: att.submittedAt,
        deadlineAt: att.deadlineAt,
        answersCount: att.answers.length,
        needsGrading: att.needsGrading,
      })),
    });
  } catch (error: unknown) {
    if (error instanceof ApiError) return apiErrorResponse(error, 'Chưa đọc được bài giao');
    const err = error as Error;
    if (err.message === 'MUST_CHANGE_PASSWORD') return NextResponse.json({ error: 'Vui lòng đổi mật khẩu trước khi tiếp tục' }, { status: 403 });
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
    const user = await requireRequestAuth(req);
    const { id } = await params;
    if (!isSameOriginMutation(req)) return NextResponse.json({ error: 'Yêu cầu không hợp lệ' }, { status: 403 });
    const parsed = UpdateSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Cấu hình bài giao không hợp lệ' }, { status: 400 });
    const body = parsed.data;

    const assignment = await prisma.assignment.findFirst({
      where: { id, ownerId: user.id },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Không tìm thấy bài giao' }, { status: 404 });
    }

    if (body.closesAt && assignment.opensAt && new Date(body.closesAt) <= assignment.opensAt) return NextResponse.json({ error: 'Thời gian đóng phải sau thời gian mở' }, { status: 400 });
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
    if (error instanceof ApiError) return apiErrorResponse(error, 'Chưa đổi được trạng thái bài giao');
    const err = error as Error;
    if (err.message === 'MUST_CHANGE_PASSWORD') return NextResponse.json({ error: 'Vui lòng đổi mật khẩu trước khi tiếp tục' }, { status: 403 });
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }
    console.error('Lỗi PATCH /api/teacher/assignments/[id]:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}
