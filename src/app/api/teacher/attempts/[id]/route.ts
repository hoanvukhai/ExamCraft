import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRequestAuth } from '@/lib/request-auth';
import { z } from 'zod';
import { ApiError, apiErrorResponse } from '@/lib/api-error';
import { isSameOriginMutation } from '@/lib/attempt-access';
import { manualGradeTarget, summarizeManualGrades, teacherSnapshotQuestions } from '@/lib/manual-grading';
import { gradeSnapshot } from '@/lib/attempt-grading';
import { asObject } from '@/lib/public-exam';
import { manualGradeRevision, manualGradeState, manualGradeAlreadyApplied } from '@/lib/manual-grade-revision';

// GET: Xem chi tiết bài làm của một học sinh
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRequestAuth(req);
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

    const snapshot = asObject(attempt.assignment.snapshot);
    const questions = teacherSnapshotQuestions(snapshot);

    // Map câu trả lời của học sinh theo questionKey
    const answerMap = new Map(
      attempt.answers.map((ans) => [ans.questionKey, ans])
    );

    const automatic = gradeSnapshot(snapshot, {});
    const detailedQuestions = questions.map((q, idx) => {
      const studentAns = answerMap.get(q.id);

      return {
        questionId: q.id,
        index: idx + 1,
        type: q.type,
        difficulty: q.difficulty,
        content: q.content,
        figures: q.figures,
        passageId: q.passageId,
        payload: q.payload,
        solution: q.solution,
        points: automatic.gradedAnswers.find(answer => answer.questionKey === String(q.id))?.maxPoints ?? 0,
        studentResponse: studentAns ? studentAns.response : null,
        isCorrect: studentAns ? studentAns.isCorrect : null,
        earned: studentAns ? Number(studentAns.earned) : 0,
        teacherComment: studentAns?.comment || null,
        gradeRevision: manualGradeRevision(attempt.id, q.id, studentAns),
      };
    });

    const gradingHistory = await prisma.auditLog.findMany({ where: { action: 'attempt.grade', targetType: 'Attempt', targetId: id }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 51, select: { id: true, createdAt: true, meta: true } });
    return NextResponse.json({
      attempt: {
        id: attempt.id,
        studentName: attempt.student.displayName,
        attemptNo: attempt.attemptNo,
        status: attempt.status,
        score: attempt.score !== null ? Number(attempt.score) : null,
        maxScore: attempt.maxScore !== null ? Number(attempt.maxScore) : null,
        needsGrading: attempt.needsGrading,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        assignmentTitle: attempt.assignment.title,
        assessmentMode: asObject(snapshot.metadata).assessmentMode,
      },
      questions: detailedQuestions,
      gradingHistory: gradingHistory.slice(0, 50),
      historyHasMore: gradingHistory.length > 50,
      passages: Array.isArray(snapshot?.passages) ? snapshot.passages : [],
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error: unknown) {
    if (error instanceof ApiError) return apiErrorResponse(error, 'Chưa đọc được bài làm');
    const err = error as Error;
    if (err.message === 'MUST_CHANGE_PASSWORD') return NextResponse.json({ error: 'Vui lòng đổi mật khẩu trước khi tiếp tục', code: 'MUST_CHANGE_PASSWORD' }, { status: 403 });
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }
    console.error('Lỗi GET /api/teacher/attempts/[id]:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}


// Grading and deletion serialize with other writes to the same attempt.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!isSameOriginMutation(req)) throw new ApiError(403, 'Yêu cầu không hợp lệ');
    const user = await requireRequestAuth(req), { id } = await params;
    const parsed = z.object({ questionKey: z.string().min(1).max(200), earned: z.number().finite().nullable().optional(), teacherComment: z.string().max(5000).optional(), baseGradeRevision: z.string().regex(/^[a-f0-9]{64}$/) }).strict().safeParse(await req.json());
    if (!parsed.success) throw new ApiError(400, 'Dữ liệu điểm hoặc nhận xét không hợp lệ');
    const updatedAttempt = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT "id" FROM "Attempt" WHERE "id" = ${id} FOR UPDATE`;
      const attempt = await tx.attempt.findFirst({ where: { id, assignment: { ownerId: user.id } }, include: { assignment: { select: { snapshot: true } } } });
      if (!attempt) throw new ApiError(404, 'Không tìm thấy bài làm của bạn');
      if (attempt.status !== 'SUBMITTED') throw new ApiError(409, 'Chỉ chấm bài đã nộp');
      const { questionKey, earned, teacherComment, baseGradeRevision } = parsed.data;
      const grade = manualGradeTarget(attempt.assignment.snapshot, questionKey, earned);
      if (!grade.numeric && !teacherComment?.trim()) throw new ApiError(400, 'Hãy nhập nhận xét cho câu này');
      const previous = await tx.attemptAnswer.findUnique({ where: { attemptId_questionKey: { attemptId: id, questionKey } } });
      const alreadyApplied = manualGradeAlreadyApplied(previous, grade.earned, teacherComment);
      if (baseGradeRevision !== manualGradeRevision(id, questionKey, previous) && !alreadyApplied) throw new ApiError(409, 'Điểm hoặc nhận xét đã được sửa ở trang khác. Chưa ghi đè; giữ số đang nhập để đối chiếu rồi mở lại bài.', 'GRADE_CONFLICT');
      if (alreadyApplied) return attempt;
      const before = manualGradeState(previous);
      await tx.attemptAnswer.upsert({ where: { attemptId_questionKey: { attemptId: id, questionKey } },
        create: { attemptId: id, questionKey, response: {}, earned: grade.earned, manualScore: grade.earned, isCorrect: grade.isCorrect, comment: teacherComment ?? null },
        update: { earned: grade.earned, manualScore: grade.earned, isCorrect: grade.isCorrect, comment: teacherComment },
      });
      const answers = await tx.attemptAnswer.findMany({ where: { attemptId: id } });
      const summary = summarizeManualGrades(attempt.assignment.snapshot, answers);
      const updated = await tx.attempt.update({ where: { id }, data: summary });
      const after = manualGradeState(answers.find(answer => answer.questionKey === questionKey));
      await tx.auditLog.create({ data: { actorId: user.id, action: 'attempt.grade', targetType: 'Attempt', targetId: id, meta: { questionKey, before, after, scoreBefore: attempt.score == null ? null : Number(attempt.score), scoreAfter: updated.score == null ? null : Number(updated.score) } } });
      return updated;
    });
    return NextResponse.json({ success: true, newScore: updatedAttempt.score == null ? null : Number(updatedAttempt.score), needsGrading: updatedAttempt.needsGrading, message: 'Đã lưu điểm và nhận xét' });
  } catch (error) { return apiErrorResponse(error, 'Chưa lưu được điểm và nhận xét'); }
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!isSameOriginMutation(req)) throw new ApiError(403, 'Yêu cầu không hợp lệ');
    const user = await requireRequestAuth(req), { id } = await params;
    await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT "id" FROM "Attempt" WHERE "id" = ${id} FOR UPDATE`;
      const attempt = await tx.attempt.findFirst({ where: { id, assignment: { ownerId: user.id } } });
      if (!attempt) throw new ApiError(404, 'Không tìm thấy bài làm của bạn');
      await tx.attempt.delete({ where: { id } });
    });
    return NextResponse.json({ success: true, message: 'Đã xóa lượt làm bài' });
  } catch (error) { return apiErrorResponse(error, 'Chưa xóa được lượt làm bài'); }
}
