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
import { requiresNumericScore, type AssessmentMode } from '@/lib/education-catalog';
import { decideRestore, readHistoryState, validateRestoreState } from '@/lib/grade-history-restore';
import { GRADE_HISTORY_PAGE_SIZE, GradeHistoryCursorError, decodeGradeHistoryCursor, gradeHistoryWhere, pageGradeHistory } from '@/lib/grade-history-pagination';

const historyRows = (id: string, cursor?: ReturnType<typeof decodeGradeHistoryCursor>) => prisma.auditLog.findMany({ where: gradeHistoryWhere(id, cursor), orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: GRADE_HISTORY_PAGE_SIZE + 1, select: { id: true, createdAt: true, meta: true } });

// GET: Xem chi tiết bài làm của một học sinh
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRequestAuth(req);
    const { id } = await params;

    // Older history only: after the owner check, read just the next page and never touch other attempts.
    const rawCursor = req.nextUrl.searchParams.get('historyCursor');
    if (rawCursor !== null) {
      // Owner first: a broken cursor for someone else's attempt must still look like "not found".
      if (!await prisma.attempt.findFirst({ where: { id, assignment: { ownerId: user.id } }, select: { id: true } })) return NextResponse.json({ error: 'Không tìm thấy bài làm' }, { status: 404 });
      const cursor = decodeGradeHistoryCursor(rawCursor, id);
      const older = pageGradeHistory(id, await historyRows(id, cursor));
      return NextResponse.json({ gradingHistory: older.items, historyHasMore: older.hasMore, historyNextCursor: older.nextCursor }, { headers: { 'Cache-Control': 'no-store' } });
    }

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

    const history = pageGradeHistory(id, await historyRows(id));
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
      gradingHistory: history.items,
      historyHasMore: history.hasMore,
      historyNextCursor: history.nextCursor,
      passages: Array.isArray(snapshot?.passages) ? snapshot.passages : [],
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error: unknown) {
    if (error instanceof GradeHistoryCursorError) return NextResponse.json({ error: error.message, code: 'HISTORY_CURSOR_INVALID' }, { status: 400 });
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
    const body: unknown = await req.json();
    if (asObject(body).action === 'restore') return await restoreGrade(user.id, id, body);
    const parsed = z.object({ questionKey: z.string().min(1).max(200), earned: z.number().finite().nullable().optional(), teacherComment: z.string().max(5000).optional(), baseGradeRevision: z.string().regex(/^[a-f0-9]{64}$/) }).strict().safeParse(body);
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
/**
 * Restore one side of a recorded grading event. Only the event id and side come from the client; the state is read back
 * from the owner's AuditLog, checked against the snapshot, and written under the same lock and token as a normal grade.
 */
async function restoreGrade(userId: string, id: string, body: unknown) {
  const parsed = z.object({ action: z.literal('restore'), eventId: z.string().min(1).max(100), side: z.enum(['before', 'after']), baseGradeRevision: z.string().regex(/^[a-f0-9]{64}$/) }).strict().safeParse(body);
  if (!parsed.success) throw new ApiError(400, 'Yêu cầu khôi phục không hợp lệ');
  const { eventId, side, baseGradeRevision } = parsed.data;
  const result = await prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT "id" FROM "Attempt" WHERE "id" = ${id} FOR UPDATE`;
    const attempt = await tx.attempt.findFirst({ where: { id, assignment: { ownerId: userId } }, include: { assignment: { select: { snapshot: true } } } });
    if (!attempt) throw new ApiError(404, 'Không tìm thấy bài làm của bạn');
    if (attempt.status !== 'SUBMITTED') throw new ApiError(409, 'Chỉ chấm bài đã nộp');
    const event = await tx.auditLog.findFirst({ where: { id: eventId, action: 'attempt.grade', targetType: 'Attempt', targetId: id }, select: { id: true, meta: true } });
    if (!event) throw new ApiError(404, 'Không tìm thấy sự kiện lịch sử của bài này');
    const questionKey = asObject(event.meta).questionKey;
    if (typeof questionKey !== 'string') throw new ApiError(422, 'Sự kiện lịch sử không ghi rõ câu hỏi nên chưa thể khôi phục.', 'HISTORY_STATE_UNUSABLE');
    const read = readHistoryState(event.meta, side, questionKey);
    if (!read.ok) throw new ApiError(422, read.message, 'HISTORY_STATE_UNUSABLE');
    const snapshot = attempt.assignment.snapshot;
    const target = gradeSnapshot(snapshot, {}).gradedAnswers.find(answer => answer.questionKey === questionKey);
    if (!target) throw new ApiError(422, 'Câu của sự kiện này không còn trong bản đề đã giao.', 'HISTORY_STATE_UNUSABLE');
    // Same mode rule as a manual grade: only scored work has numeric points.
    const numeric = requiresNumericScore(asObject(asObject(snapshot).metadata).assessmentMode as AssessmentMode | undefined);
    const limits = { numeric, maxPoints: target.maxPoints, pointsConfigured: 'pointsConfigured' in target && Boolean(target.pointsConfigured) };
    const valid = validateRestoreState(read.state, limits);
    if (!valid.ok) throw new ApiError(422, valid.message, 'HISTORY_STATE_UNUSABLE');
    const previous = await tx.attemptAnswer.findUnique({ where: { attemptId_questionKey: { attemptId: id, questionKey } } });
    const before = manualGradeState(previous);
    const decision = decideRestore(before, read.state, baseGradeRevision === manualGradeRevision(id, questionKey, previous));
    if (decision === 'conflict') throw new ApiError(409, 'Điểm hoặc nhận xét đã đổi sau khi bạn mở bài. Chưa khôi phục; hãy xem lại trạng thái hiện tại rồi chọn lại.', 'GRADE_CONFLICT');
    if (decision === 'noop') return { attempt, restored: false };
    const values = { earned: read.state.earned, manualScore: read.state.manualScore, isCorrect: read.state.isCorrect, comment: read.state.comment };
    await tx.attemptAnswer.upsert({ where: { attemptId_questionKey: { attemptId: id, questionKey } }, create: { attemptId: id, questionKey, response: {}, ...values }, update: values });
    const answers = await tx.attemptAnswer.findMany({ where: { attemptId: id } });
    const updated = await tx.attempt.update({ where: { id }, data: summarizeManualGrades(snapshot, answers) });
    const after = manualGradeState(answers.find(answer => answer.questionKey === questionKey));
    await tx.auditLog.create({ data: { actorId: userId, action: 'attempt.grade', targetType: 'Attempt', targetId: id, meta: { questionKey, before, after, scoreBefore: attempt.score == null ? null : Number(attempt.score), scoreAfter: updated.score == null ? null : Number(updated.score), restoredFrom: { eventId, side } } } });
    return { attempt: updated, restored: true };
  });
  return NextResponse.json({ success: true, restored: result.restored, newScore: result.attempt.score == null ? null : Number(result.attempt.score), needsGrading: result.attempt.needsGrading, message: result.restored ? 'Đã khôi phục điểm và nhận xét' : 'Câu này đã ở đúng trạng thái đó' });
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
