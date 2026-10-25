import { NextRequest, NextResponse } from 'next/server';
import { attemptDraftRevision, validDraftRevision } from '@/lib/attempt-draft-revision';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { hasActiveAttemptAccess, canAcceptSubmissionAnswers, isPolicyVisible, isSameOriginMutation } from '@/lib/attempt-access';
import { asObject, snapshotQuestions, solutionForQuestion, validateResponses } from '@/lib/public-exam';
import { gradeSnapshot } from '@/lib/attempt-grading';
import { isRetryableTransactionError } from '@/lib/transaction-retry';
import { requiresNumericScore, type AssessmentMode } from '@/lib/education-catalog';

const include = { assignment: { include: { group: true } }, student: { select: { displayName: true, archivedAt: true, groupId: true } } } as const;
type AttemptWithRelations = Prisma.AttemptGetPayload<{ include: typeof include }>;

async function resultResponse(attempt: AttemptWithRelations, idempotent: boolean) {
  const assignment = attempt.assignment;
  const answers = await prisma.attemptAnswer.findMany({ where: { attemptId: attempt.id }, select: { questionKey: true, response: true } });
  const mode = asObject(asObject(assignment.snapshot).metadata).assessmentMode as AssessmentMode | undefined;
  const numeric = requiresNumericScore(mode);
  const showResult = numeric && isPolicyVisible(assignment.showResult, assignment);
  const showSolution = mode !== 'survey' && isPolicyVisible(assignment.showSolution, assignment);
  let leaderboard = null;
  if (showResult && assignment.leaderboard === 'TOP_AND_ME' && isPolicyVisible(assignment.leaderboardReveal, assignment)) {
    const ranked = await prisma.attempt.findMany({ where: { assignmentId: assignment.id, status: 'SUBMITTED', needsGrading: false, score: { not: null } }, select: { studentId: true, score: true, student: { select: { displayName: true } } }, orderBy: [{ score: 'desc' }, { submittedAt: 'asc' }] });
    const best = [...new Map(ranked.map(a => [a.studentId, ranked.find(row => row.studentId === a.studentId)!])).values()];
    const rank = best.findIndex(a => a.studentId === attempt.studentId) + 1;
    leaderboard = { top: best.slice(0, assignment.leaderboardTopN).map((a, i) => ({ rank: i + 1, name: assignment.leaderboardAnonymous ? 'Học sinh ' + (i + 1) : a.student.displayName, score: Number(a.score) })), me: { rank: rank || null, total: best.length, score: attempt.needsGrading ? null : Number(attempt.score) } };
  }
  return NextResponse.json({ success: true, idempotent, score: showResult ? attempt.score : null, maxScore: showResult ? attempt.maxScore : null,
    responses: Object.fromEntries(answers.map(answer => [answer.questionKey, answer.response])),
    needsGrading: attempt.needsGrading, submittedAt: attempt.submittedAt, studentName: attempt.student.displayName,
    leaderboard, solutions: showSolution ? snapshotQuestions(assignment.snapshot).map(solutionForQuestion) : null,
    message: mode === 'survey' ? 'Phản hồi của em đã được ghi nhận.' : !numeric ? 'Bài làm đã được ghi nhận theo chế độ nhận xét, không dùng điểm số.' : attempt.needsGrading ? 'Bài làm đã lưu; một số câu đang chờ giáo viên chấm.' : 'Bài làm đã được ghi nhận.',
  }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const attempt = await prisma.attempt.findUnique({ where: { id }, include });
    if (!attempt || !hasActiveAttemptAccess(req, attempt)) return NextResponse.json({ error: 'Không có quyền xem lượt làm bài' }, { status: 403 });
    if (attempt.status !== 'SUBMITTED') return NextResponse.json({ error: 'Bài chưa được nộp' }, { status: 409 });
    return resultResponse(attempt, true);
  } catch (error) {
    console.error('Read attempt result failed', error);
    return NextResponse.json({ error: 'Chưa thể tải kết quả' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOriginMutation(req)) return NextResponse.json({ error: 'Yêu cầu không hợp lệ' }, { status: 403 });
  try {
    const { id } = await params;
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ error: 'Dữ liệu nộp bài không hợp lệ' }, { status: 400 });
    if (body.useSavedDraftOnly !== undefined && typeof body.useSavedDraftOnly !== 'boolean') return NextResponse.json({ error: 'Chế độ nộp bài không hợp lệ' }, { status: 400 });
    for (let retry = 0; retry < 3; retry++) {
      try {
        const outcome = await prisma.$transaction(async tx => {
          await tx.$queryRaw`SELECT id FROM "Attempt" WHERE id = ${id} FOR UPDATE`;
          const attempt = await tx.attempt.findUnique({ where: { id }, include });
          if (!attempt || !hasActiveAttemptAccess(req, attempt)) return { error: 'Không có quyền truy cập lượt làm bài', status: 403 } as const;
          if (attempt.status === 'SUBMITTED') return { attempt, idempotent: true };
          if (attempt.status !== 'IN_PROGRESS') return { error: 'Lượt này đã hết hiệu lực', status: 409 } as const;
          if (!validateResponses(body.answers ?? {}, attempt.assignment.snapshot)) return { error: 'Câu trả lời không hợp lệ', status: 400 } as const;
          // After the server deadline plus the fixed 15-second transport allowance, only the on-time draft can be finalized.
          const acceptNewAnswers = body.useSavedDraftOnly !== true && canAcceptSubmissionAnswers(attempt, attempt.assignment);
          if (acceptNewAnswers && !validDraftRevision(body.baseDraftRevision)) return { error: 'Thiếu phiên bản nháp. Hãy giữ câu trả lời rồi mở lại lượt làm.', status: 400, code: 'DRAFT_REVISION_REQUIRED' } as const;
          if (acceptNewAnswers && body.baseDraftRevision !== attemptDraftRevision(attempt.draft)) return { error: 'Nháp đã được sửa ở trang khác. Chưa nộp bản cũ; hãy tải bản đang nhập để đối chiếu.', status: 409, code: 'DRAFT_CONFLICT' } as const;
          const answers = { ...asObject(attempt.draft), ...(acceptNewAnswers ? asObject(body.answers) : {}) };
          const grade = gradeSnapshot(attempt.assignment.snapshot, answers);
          const numeric = requiresNumericScore(asObject(asObject(attempt.assignment.snapshot).metadata).assessmentMode as AssessmentMode | undefined);
          const score = numeric ? grade.score : null, maxScore = numeric ? grade.maxScore : null;
          const submittedAt = new Date();
          const updated = await tx.attempt.updateMany({ where: { id, status: 'IN_PROGRESS' }, data: { status: 'SUBMITTED', score, maxScore, needsGrading: grade.needsGrading, submittedAt } });
          if (!updated.count) throw new Error('ATTEMPT_WRITE_CONFLICT');
          for (const answer of grade.gradedAnswers) {
            await tx.attemptAnswer.create({ data: { attemptId: id, questionKey: answer.questionKey,
              response: answer.response === null ? Prisma.JsonNull : answer.response as Prisma.InputJsonValue,
              isCorrect: answer.isCorrect, earned: answer.earned,
            } });
          }
          return { attempt: { ...attempt, status: 'SUBMITTED' as const, score: score === null ? null : new Prisma.Decimal(score), maxScore: maxScore === null ? null : new Prisma.Decimal(maxScore), needsGrading: grade.needsGrading, submittedAt }, idempotent: false };
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
        if ('error' in outcome) return NextResponse.json({ error: outcome.error, code: 'code' in outcome ? outcome.code : undefined }, { status: outcome.status });
        return resultResponse(outcome.attempt, outcome.idempotent);
      } catch (error) {
        if (retry < 2 && (isRetryableTransactionError(error) || error instanceof Error && error.message === 'ATTEMPT_WRITE_CONFLICT')) continue;
        throw error;
      }
    }
  } catch (error) {
    console.error('Submit attempt failed', error);
    return NextResponse.json({ error: 'Chưa ghi nhận được bài nộp. Em có thể thử nộp lại an toàn.' }, { status: 503 });
  }
}
