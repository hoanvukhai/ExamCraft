import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireRequestAuth } from '@/lib/request-auth';
import { isSameOriginMutation } from '@/lib/attempt-access';
import { ApiError, apiErrorResponse } from '@/lib/api-error';
import { rollbackQuestion } from '@/lib/question-history';
type Context = { params: Promise<{ id: string }> };
export async function GET(req: NextRequest, { params }: Context) {
  try {
    const user = await requireRequestAuth(req), { id } = await params;
    if (!await prisma.question.findFirst({ where: { id, ownerId: user.id, deletedAt: null } })) throw new ApiError(404, 'Không tìm thấy câu hỏi trong kho riêng');
    const revisions = await prisma.questionRevision.findMany({ where: { questionId: id }, orderBy: { version: 'desc' }, take: 100 });
    return NextResponse.json({ revisions }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return apiErrorResponse(error, 'Không tải được lịch sử câu hỏi'); }
}
export async function POST(req: NextRequest, { params }: Context) {
  try {
    if (!isSameOriginMutation(req)) throw new ApiError(403, 'Yêu cầu không hợp lệ');
    const user = await requireRequestAuth(req), { id } = await params;
    const parsed = z.object({ targetVersion: z.number().int().positive(), baseVersion: z.number().int().positive().optional() }).strict().safeParse(await req.json());
    if (!parsed.success) throw new ApiError(400, 'Phiên bản khôi phục không hợp lệ');
    if (!parsed.data.baseVersion) throw new ApiError(428, 'Cần phiên bản hiện tại trước khi khôi phục', 'VERSION_REQUIRED');
    const { targetVersion, baseVersion } = parsed.data;
    const question = await prisma.$transaction(tx => rollbackQuestion(tx, user.id, id, targetVersion, baseVersion));
    return NextResponse.json({ success: true, question }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return apiErrorResponse(error, 'Chưa khôi phục được câu hỏi'); }
}
