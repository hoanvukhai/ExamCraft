import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { apiErrorResponse, ApiError } from '@/lib/api-error';
import { createExam } from '@/lib/exam-persistence';
import { fromDatabaseExam, normalizeExamDocument } from '@/lib/exam-document';
import { pinnedVersion } from '@/lib/share-version';
import { isSameOriginMutation } from '@/lib/attempt-access';
import { assertRequestAccount } from '@/lib/request-account';
import { buildShareCopy, shareCopyClientId } from '@/lib/share-copy';
import { z } from 'zod';
import { lockExam } from '@/lib/exam-collaboration';

const copySchema = z.object({ sourceVersion: z.number().int().positive().optional() }).strict();

/** A signed-in teacher copies a shared exam into their own library on the server. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!isSameOriginMutation(req)) throw new ApiError(403, 'Yêu cầu không hợp lệ');
    const user = await requireAuth();
    assertRequestAccount(req.headers, user.id);
    const raw = await req.text();
    const parsed = copySchema.safeParse(raw.trim() ? JSON.parse(raw) : {});
    if (!parsed.success) throw new ApiError(400, 'Thông tin phiên bản sao chép không hợp lệ.');
    const { sourceVersion } = parsed.data;
    const { id: token } = await params;
    // This first lookup only locates the rows. Permission and content are re-read under locks below.
    const target = await prisma.shareLink.findUnique({ where: { token }, select: { id: true, examId: true } });
    if (!target) throw new ApiError(404, 'Liên kết không tồn tại, đã hết hạn hoặc đã được thu hồi.');
    try {
      const exam = await prisma.$transaction(async tx => {
        // Same order as exam updates/deletion: exam first, then link. Revocation updates this link row.
        // These locks also serialize two requests creating the same copy.
        await lockExam(tx, target.examId);
        await tx.$queryRaw`SELECT "id" FROM "ShareLink" WHERE "id" = ${target.id} FOR UPDATE`;
        await tx.$queryRaw`SELECT q."id" FROM "Question" q JOIN "ExamQuestion" item ON item."questionId" = q."id" WHERE item."examId" = ${target.examId} ORDER BY q."id" FOR SHARE OF q`;
        const link = await tx.shareLink.findUnique({ where: { token }, include: { exam: { include: { items: { include: { question: { include: { passage: true } } }, orderBy: { position: 'asc' } } } } } });
        if (!link || link.examId !== target.examId || link.revokedAt || (link.expiresAt && link.expiresAt <= new Date()) || link.exam.deletedAt || link.exam.items.some(item => item.question.deletedAt || !item.question.shareable || item.question.ownerId !== link.exam.ownerId || (item.question.passage && item.question.passage.ownerId !== link.exam.ownerId))) {
          throw new ApiError(404, 'Liên kết không tồn tại, đã hết hạn hoặc đã được thu hồi.');
        }
        if (!link.allowCopy) throw new ApiError(403, 'Chủ đề chưa cho phép sao chép từ liên kết này.', 'COPY_NOT_ALLOWED');
        // A pinned link copies the version it was made from, so the copy matches what the viewer saw.
        const pinned = pinnedVersion(token);
        let source = fromDatabaseExam(link.exam), currentVersion = link.exam.version;
        if (pinned !== null) {
          const revision = await tx.examRevision.findUnique({ where: { examId_version: { examId: link.examId, version: pinned } }, select: { snapshot: true } });
          if (!revision) throw new ApiError(404, 'Liên kết không tồn tại, đã hết hạn hoặc đã được thu hồi.');
          source = normalizeExamDocument(revision.snapshot); currentVersion = pinned;
        }
        if (sourceVersion !== undefined && sourceVersion !== currentVersion) throw new ApiError(409, 'Đề nguồn đã thay đổi. Hãy tải lại để xem bản mới trước khi sao chép.', 'SOURCE_CHANGED');
        const document = buildShareCopy(source, { ...link, sourceVersion });
        const clientId = shareCopyClientId(link.id, sourceVersion);
        return createExam(tx, user.id, { document, clientId });
      }, { timeout: 30000 });
      return NextResponse.json({ success: true, id: exam.id, title: exam.title }, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
      if (error instanceof ApiError && error.code === 'CREATE_CONFLICT') {
        throw new ApiError(409, 'Bạn đã sao chép đề này trước đó hoặc đề đã được chuyển vào thùng rác. Hãy mở từ kho đề của bạn.', 'ALREADY_COPIED');
      }
      throw error;
    }
  } catch (error) { return apiErrorResponse(error, 'Chưa sao chép được đề'); }
}
