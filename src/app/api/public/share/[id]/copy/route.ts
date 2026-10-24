import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { apiErrorResponse, ApiError } from '@/lib/api-error';
import { createExam } from '@/lib/exam-persistence';
import { fromDatabaseExam } from '@/lib/exam-document';
import { isSameOriginMutation } from '@/lib/attempt-access';
import { assertRequestAccount } from '@/lib/request-account';
import { buildShareCopy, shareCopyClientId } from '@/lib/share-copy';

/** A signed-in teacher copies a shared exam into their own library on the server. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!isSameOriginMutation(req)) throw new ApiError(403, 'Yêu cầu không hợp lệ');
    const user = await requireAuth();
    assertRequestAccount(req.headers, user.id);
    const { id: token } = await params;
    const link = await prisma.shareLink.findUnique({ where: { token }, include: { exam: { include: { items: { include: { question: { include: { passage: true } } }, orderBy: { position: 'asc' } } } } } });
    if (!link || link.revokedAt || (link.expiresAt && link.expiresAt <= new Date()) || link.exam.deletedAt || link.exam.items.some(item => item.question.deletedAt || !item.question.shareable || item.question.ownerId !== link.exam.ownerId)) {
      throw new ApiError(404, 'Liên kết không tồn tại, đã hết hạn hoặc đã được thu hồi.');
    }
    if (!link.allowCopy) throw new ApiError(403, 'Chủ đề chưa cho phép sao chép từ liên kết này.', 'COPY_NOT_ALLOWED');
    const document = buildShareCopy(fromDatabaseExam(link.exam), link);
    try {
      const exam = await prisma.$transaction(tx => createExam(tx, user.id, { document, clientId: shareCopyClientId(link.id) }), { timeout: 30000 });
      return NextResponse.json({ success: true, id: exam.id, title: exam.title }, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
      if (error instanceof ApiError && error.code === 'CREATE_CONFLICT') {
        throw new ApiError(409, 'Bạn đã sao chép đề này trước đó hoặc đề đã được chuyển vào thùng rác. Hãy mở từ kho đề của bạn.', 'ALREADY_COPIED');
      }
      throw error;
    }
  } catch (error) { return apiErrorResponse(error, 'Chưa sao chép được đề'); }
}
