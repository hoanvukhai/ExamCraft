import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireRequestAuth } from '@/lib/request-auth';
import { ApiError, apiErrorResponse } from '@/lib/api-error';
import { isSameOriginMutation } from '@/lib/attempt-access';
import { applyAnswerCorrection, autoResult, correctionHistory, correctionRevision, regradableQuestions } from '@/lib/answer-correction';
import { manualGradeState } from '@/lib/manual-grade-revision';
import { summarizeManualGrades } from '@/lib/manual-grading';

const RegradeSchema = z.object({
  questionKey: z.string().min(1).max(200),
  correctAnswer: z.string().max(50).optional(),
  acceptedAnswers: z.array(z.string().max(200)).max(20).optional(),
  reason: z.string().trim().min(3).max(500),
  baseCorrectionRevision: z.string().regex(/^[a-f0-9]{64}$/),
  preview: z.boolean().optional(),
}).strict();

/** Questions whose key can be corrected, with the revision the client must send back. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRequestAuth(req), { id } = await params;
    const assignment = await prisma.assignment.findFirst({ where: { id, ownerId: user.id }, select: { id: true, snapshot: true } });
    if (!assignment) throw new ApiError(404, 'Không tìm thấy bài giao');
    return NextResponse.json({ questions: regradableQuestions(assignment.snapshot).map(question => ({ ...question, revision: correctionRevision(id, assignment.snapshot, question.id), corrections: correctionHistory(assignment.snapshot, question.id) })) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return apiErrorResponse(error, 'Chưa đọc được danh sách câu sửa đáp án'); }
}

/**
 * Corrects one answer key in the frozen exam and re-applies it to submitted attempts. Hand-graded answers are never
 * touched, each changed attempt gets a grading-history event, and `preview` returns the effect without writing.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!isSameOriginMutation(req)) throw new ApiError(403, 'Yêu cầu không hợp lệ');
    const user = await requireRequestAuth(req), { id } = await params;
    const parsed = RegradeSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new ApiError(400, 'Dữ liệu sửa đáp án không hợp lệ (cần lý do từ 3 ký tự)');
    const { questionKey, correctAnswer, acceptedAnswers, reason, baseCorrectionRevision, preview } = parsed.data;
    const result = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT "id" FROM "Assignment" WHERE "id" = ${id} FOR UPDATE`;
      const assignment = await tx.assignment.findFirst({ where: { id, ownerId: user.id } });
      if (!assignment) throw new ApiError(404, 'Không tìm thấy bài giao của bạn');
      if (baseCorrectionRevision !== correctionRevision(id, assignment.snapshot, questionKey)) throw new ApiError(409, 'Đáp án câu này đã được sửa ở trang khác. Chưa ghi đè; hãy mở lại danh sách rồi chọn lại.', 'CORRECTION_CONFLICT');
      const corrected = applyAnswerCorrection(assignment.snapshot, questionKey, { correctAnswer, acceptedAnswers }, { at: new Date().toISOString(), by: user.id, reason });
      // Lock every submitted attempt in a stable order so a hand-grade in flight finishes first.
      const ids = (await tx.$queryRaw<{ id: string }[]>`SELECT "id" FROM "Attempt" WHERE "assignmentId" = ${id} AND "status" = 'SUBMITTED' ORDER BY "id" FOR UPDATE`).map(row => row.id);
      const attempts = await tx.attempt.findMany({ where: { id: { in: ids } }, include: { answers: true, student: { select: { displayName: true } } }, orderBy: { id: 'asc' } });
      const changed: { attemptId: string; student: string; scoreBefore: number | null; scoreAfter: number | null }[] = [];
      let keptManual = 0, unchanged = 0;
      for (const attempt of attempts) {
        const answer = attempt.answers.find(item => item.questionKey === questionKey);
        if (!answer) { unchanged += 1; continue; }
        if (answer.manualScore != null) { keptManual += 1; continue; }
        const next = autoResult(corrected.snapshot, questionKey, answer.response);
        if (!next || (next.isCorrect === answer.isCorrect && next.earned === Number(answer.earned ?? 0))) { unchanged += 1; continue; }
        const before = manualGradeState(answer);
        const scoreBefore = attempt.score == null ? null : Number(attempt.score);
        if (preview) {
          const rows = attempt.answers.map(item => item.questionKey === questionKey ? { ...item, isCorrect: next.isCorrect, earned: next.earned } : item);
          const summary = summarizeManualGrades(corrected.snapshot, rows);
          changed.push({ attemptId: attempt.id, student: attempt.student.displayName, scoreBefore, scoreAfter: summary.score });
          continue;
        }
        const updatedAnswer = await tx.attemptAnswer.update({ where: { id: answer.id }, data: { isCorrect: next.isCorrect, earned: next.earned } });
        const rows = attempt.answers.map(item => item.id === answer.id ? updatedAnswer : item);
        const summary = summarizeManualGrades(corrected.snapshot, rows);
        await tx.attempt.update({ where: { id: attempt.id }, data: summary });
        await tx.auditLog.create({ data: { actorId: user.id, action: 'attempt.grade', targetType: 'Attempt', targetId: attempt.id, meta: { questionKey, before, after: manualGradeState(updatedAnswer), scoreBefore, scoreAfter: summary.score, regrade: { reason, assignmentId: id } } } });
        changed.push({ attemptId: attempt.id, student: attempt.student.displayName, scoreBefore, scoreAfter: summary.score });
      }
      if (!preview) {
        await tx.assignment.update({ where: { id }, data: { snapshot: JSON.parse(JSON.stringify(corrected.snapshot)) } });
        await tx.auditLog.create({ data: { actorId: user.id, action: 'assignment.regrade', targetType: 'Assignment', targetId: id, meta: { questionKey, reason, before: corrected.before, after: corrected.after, submitted: attempts.length, changed: changed.length, keptManual, unchanged } } });
      }
      return { corrected, changed, keptManual, unchanged, submitted: attempts.length };
    });
    return NextResponse.json({
      success: true, preview: Boolean(preview), questionKey, before: result.corrected.before, after: result.corrected.after,
      submitted: result.submitted, changed: result.changed, keptManual: result.keptManual, unchanged: result.unchanged,
      revision: preview ? baseCorrectionRevision : correctionRevision(id, result.corrected.snapshot, questionKey),
      message: preview ? 'Xem trước: chưa ghi gì' : `Đã sửa đáp án và chấm lại ${result.changed.length} bài`,
    });
  } catch (error) { return apiErrorResponse(error, 'Chưa sửa được đáp án'); }
}
