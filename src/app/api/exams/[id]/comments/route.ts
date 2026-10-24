import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { assertRequestAccount } from '@/lib/request-account';
import { ApiError, apiErrorResponse } from '@/lib/api-error';
import { isSameOriginMutation } from '@/lib/attempt-access';
import { requireExamAccess, lockExam } from '@/lib/exam-collaboration';
import { checkLinkedOwners } from '@/lib/exam-persistence';
import { fromDatabaseExam } from '@/lib/exam-document';
type Context = { params: Promise<{ id: string }> };
export async function GET(req: NextRequest, { params }: Context) {
  try {
    const user = await requireAuth(), { id } = await params;
    assertRequestAccount(req.headers, user.id);
    const { permissions } = await requireExamAccess(prisma, id, user.id);
    const comments = await prisma.examComment.findMany({ where: { examId: id }, select: { id: true, body: true, questionId: true, createdAt: true, author: { select: { name: true } } }, orderBy: { createdAt: 'desc' }, take: 100 });
    return NextResponse.json({ comments, permissions }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return apiErrorResponse(error, 'Không tải được góp ý'); }
}
export async function POST(req: NextRequest, { params }: Context) {
  try {
    if (!isSameOriginMutation(req)) throw new ApiError(403, 'Yêu cầu không hợp lệ');
    const user = await requireAuth(), { id } = await params;
    assertRequestAccount(req.headers, user.id);
    const input = z.object({ body: z.string().trim().min(1).max(5000), questionId: z.string().min(1).max(200).optional() }).strict().safeParse(await req.json());
    if (!input.success) throw new ApiError(400, 'Góp ý cần có nội dung, tối đa 5.000 ký tự');
    const comment = await prisma.$transaction(async tx => {
      await lockExam(tx, id);
      await requireExamAccess(tx, id, user.id, 'comment');
      if (input.data.questionId) {
        const exam = await tx.exam.findUniqueOrThrow({ where: { id }, include: { items: { include: { question: { include: { passage: true } } }, orderBy: { position: 'asc' } } } });
        checkLinkedOwners(exam, exam.ownerId);
        if (!fromDatabaseExam(exam).questions.some(q => q.id === input.data.questionId)) throw new ApiError(400, 'Câu được góp ý không có trong đề');
      }
      return tx.examComment.create({ data: { examId: id, authorId: user.id, ...input.data }, select: { id: true } });
    });
    return NextResponse.json({ success: true, comment });
  } catch (error) { return apiErrorResponse(error, 'Chưa gửi được góp ý'); }
}
