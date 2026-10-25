import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hasActiveAttemptAccess, isAttemptOpen, isSameOriginMutation } from '@/lib/attempt-access';
import { validateResponses } from '@/lib/public-exam';
import { attemptDraftRevision, validDraftRevision } from '@/lib/attempt-draft-revision';
import { withTestTransactionTries } from '@/lib/transaction-retry';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOriginMutation(req)) return NextResponse.json({ error: 'Yêu cầu không hợp lệ' }, { status: 403 });
  try {
    const { id } = await params;
    const body = await req.json().catch(() => null);
    const attempt = await prisma.attempt.findUnique({ where: { id }, include: { assignment: { include: { group: true } }, student: { select: { archivedAt: true, groupId: true } } } });
    if (!attempt || !hasActiveAttemptAccess(req, attempt)) return NextResponse.json({ error: 'Không có quyền truy cập lượt làm bài' }, { status: 403 });
    if (!validDraftRevision(body?.baseDraftRevision)) return NextResponse.json({ error: 'Thiếu phiên bản nháp. Hãy giữ bản đang nhập rồi mở lại lượt làm.', code: 'DRAFT_REVISION_REQUIRED' }, { status: 400 });
    if (!isAttemptOpen(attempt, attempt.assignment)) return NextResponse.json({ error: 'Lượt đã đóng hoặc hết thời gian làm bài' }, { status: 409 });
    if (!validateResponses(body?.draft, attempt.assignment.snapshot)) return NextResponse.json({ error: 'Bản nháp không hợp lệ' }, { status: 400 });
    const outcome = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "Attempt" WHERE id = ${id} FOR UPDATE`;
      const current = await tx.attempt.findUnique({ where: { id }, include: { assignment: { include: { group: true } }, student: { select: { archivedAt: true, groupId: true } } } });
      if (!current || !hasActiveAttemptAccess(req, current)) return { status: 403, error: 'Không có quyền truy cập lượt làm bài' };
      if (!isAttemptOpen(current, current.assignment)) return { status: 409, error: 'Lượt đã đóng hoặc hết thời gian làm bài' };
      const revision = attemptDraftRevision(current.draft), nextRevision = attemptDraftRevision(body.draft);
      // A retry after a lost receipt is safe only when the actual content already matches.
      if (body.baseDraftRevision !== revision && nextRevision !== revision) return { status: 409, error: 'Nháp trên máy chủ đã thay đổi ở trang khác. Bản đang nhập được giữ trên trang này; hãy tải bản sao trước khi mở lại.', code: 'DRAFT_CONFLICT' };
      const now = new Date();
      const updated = await tx.attempt.updateMany({ where: { id, status: 'IN_PROGRESS', OR: [{ deadlineAt: null }, { deadlineAt: { gte: now } }], assignment: { status: 'OPEN', OR: [{ closesAt: null }, { closesAt: { gte: now } }] } }, data: { draft: body.draft } });
      if (!updated.count) return { status: 409, error: 'Lượt đã đóng hoặc đã nộp' };
      return { status: 200, success: true, savedAt: now.toISOString(), draftRevision: nextRevision };
    });
    return withTestTransactionTries(NextResponse.json(outcome, { status: outcome.status, headers: { 'Cache-Control': 'no-store' } }), 1);
  } catch (error) {
    console.error('Draft save failed', error);
    return NextResponse.json({ error: 'Chưa lưu được bản nháp' }, { status: 500 });
  }
}
