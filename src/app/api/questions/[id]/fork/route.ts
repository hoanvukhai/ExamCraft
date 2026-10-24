import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRequestAuth } from '@/lib/request-auth';
import { isSameOriginMutation } from '@/lib/attempt-access';
import { ApiError, apiErrorResponse } from '@/lib/api-error';
import { forkQuestion } from '@/lib/question-history';
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!isSameOriginMutation(req)) throw new ApiError(403, 'Yêu cầu không hợp lệ');
    const user = await requireRequestAuth(req), { id } = await params;
    const question = await prisma.$transaction(tx => forkQuestion(tx, user.id, id));
    return NextResponse.json({ success: true, question, message: 'Đã tạo bản sao riêng kèm ngữ liệu' }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return apiErrorResponse(error, 'Chưa nhân bản được câu hỏi'); }
}
