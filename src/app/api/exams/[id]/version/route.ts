import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { apiErrorResponse, ApiError } from '@/lib/api-error';
import { examAccess } from '@/lib/exam-collaboration';
import { assertRequestAccount } from '@/lib/request-account';

type Context = { params: Promise<{ id: string }> };

/**
 * Only the version number and this person's permissions: what a tab asks every so often to learn whether
 * the full exam must be loaded again. It reads one row and none of the questions.
 */
export async function GET(req: NextRequest, { params }: Context) {
  try {
    const user = await requireAuth(),
      { id } = await params;
    assertRequestAccount(req.headers, user.id);
    const exam = await prisma.exam.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, ownerId: true, version: true },
    });
    if (!exam) throw new ApiError(404, 'Không tìm thấy đề thi');
    const permissions = await examAccess(prisma, exam, user.id);
    return NextResponse.json(
      { version: exam.version, permissions },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    return apiErrorResponse(error, 'Không kiểm tra được phiên bản đề');
  }
}
