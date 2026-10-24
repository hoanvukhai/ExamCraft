import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { assertRequestAccount } from '@/lib/request-account';
import { ApiError, apiErrorResponse } from '@/lib/api-error';
import { isSameOriginMutation } from '@/lib/attempt-access';
import { requireExamAccess, lockExam } from '@/lib/exam-collaboration';
import { fromDatabaseExam } from '@/lib/exam-document';
import { updateExam } from '@/lib/exam-persistence';
type Context = { params: Promise<{ id: string }> };
export async function GET(req: NextRequest, { params }: Context) {
  try {
    const user = await requireAuth(), { id } = await params;
    assertRequestAccount(req.headers, user.id);
    const { permissions } = await requireExamAccess(prisma, id, user.id);
    const version = new URL(req.url).searchParams.get('version');
    if (version !== null) {
      if (!Number.isInteger(Number(version)) || Number(version) < 1) throw new ApiError(400, 'Phiên bản không hợp lệ');
      const revision = await prisma.examRevision.findUnique({ where: { examId_version: { examId: id, version: Number(version) } }, select: { version: true, snapshot: true, note: true, createdAt: true, actor: { select: { name: true } } } });
      if (!revision) throw new ApiError(404, 'Chưa có bản lưu cho phiên bản này');
      return NextResponse.json({ revision, permissions }, { headers: { 'Cache-Control': 'no-store' } });
    }
    const revisions = await prisma.examRevision.findMany({ where: { examId: id }, select: { version: true, note: true, createdAt: true, actor: { select: { name: true } } }, orderBy: { version: 'desc' }, take: 100 });
    return NextResponse.json({ revisions, permissions }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return apiErrorResponse(error, 'Không tải được lịch sử đề'); }
}
export async function POST(req: NextRequest, { params }: Context) {
  try {
    if (!isSameOriginMutation(req)) throw new ApiError(403, 'Yêu cầu không hợp lệ');
    const user = await requireAuth(), { id } = await params;
    assertRequestAccount(req.headers, user.id);
    const input = z.object({ version: z.number().int().positive(), baseVersion: z.number().int().positive() }).strict().safeParse(await req.json());
    if (!input.success) throw new ApiError(400, 'Cần phiên bản nguồn và phiên bản đề hiện tại');
    const exam = await prisma.$transaction(async tx => {
      await lockExam(tx, id);
      await requireExamAccess(tx, id, user.id, 'manage');
      const source = await tx.examRevision.findUnique({ where: { examId_version: { examId: id, version: input.data.version } } });
      if (!source) throw new ApiError(404, 'Không tìm thấy bản lịch sử');
      return updateExam(tx, user.id, id, { baseVersion: input.data.baseVersion, document: source.snapshot });
    }, { timeout: 30000 });
    return NextResponse.json({ success: true, document: fromDatabaseExam(exam) });
  } catch (error) { return apiErrorResponse(error, 'Chưa khôi phục được phiên bản đề'); }
}
