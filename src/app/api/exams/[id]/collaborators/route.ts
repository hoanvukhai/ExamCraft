import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { assertRequestAccount } from '@/lib/request-account';
import { ApiError, apiErrorResponse } from '@/lib/api-error';
import { isSameOriginMutation } from '@/lib/attempt-access';
import { requireExamAccess, setExamCollaborator, revokeExamCollaborator } from '@/lib/exam-collaboration';
type Context = { params: Promise<{ id: string }> };
const schema = z.object({ email: z.email().max(254), role: z.enum(['VIEWER', 'COMMENTER', 'EDITOR']) }).strict();
export async function GET(req: NextRequest, { params }: Context) {
  try {
    const user = await requireAuth(), { id } = await params;
    assertRequestAccount(req.headers, user.id);
    const { permissions, exam } = await requireExamAccess(prisma, id, user.id);
    const members = permissions.canManage ? await prisma.examCollaborator.findMany({ where: { examId: id, revokedAt: null }, select: { id: true, userId: true, role: true, user: { select: { name: true, email: true } } }, orderBy: { createdAt: 'asc' } }) : [];
    return NextResponse.json({ permissions, members, currentVersion: exam.version, ownerId: permissions.canManage ? exam.ownerId : undefined }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return apiErrorResponse(error, 'Không tải được quyền cộng tác'); }
}
export async function POST(req: NextRequest, { params }: Context) {
  try {
    if (!isSameOriginMutation(req)) throw new ApiError(403, 'Yêu cầu không hợp lệ');
    const user = await requireAuth(), { id } = await params;
    assertRequestAccount(req.headers, user.id);
    const input = schema.safeParse(await req.json());
    if (!input.success) throw new ApiError(400, 'Cần email tài khoản và quyền hợp lệ');
    const member = await prisma.$transaction(tx => setExamCollaborator(tx, id, user.id, input.data.email, input.data.role));
    return NextResponse.json({ success: true, member });
  } catch (error) { return apiErrorResponse(error, 'Chưa cấp được quyền cộng tác'); }
}
export async function DELETE(req: NextRequest, { params }: Context) {
  try {
    if (!isSameOriginMutation(req)) throw new ApiError(403, 'Yêu cầu không hợp lệ');
    const user = await requireAuth(), { id } = await params;
    assertRequestAccount(req.headers, user.id);
    const input = z.object({ userId: z.string().min(1) }).strict().safeParse(await req.json());
    if (!input.success) throw new ApiError(400, 'Cần chọn người thu hồi quyền');
    await prisma.$transaction(tx => revokeExamCollaborator(tx, id, user.id, input.data.userId));
    return NextResponse.json({ success: true });
  } catch (error) { return apiErrorResponse(error, 'Chưa thu hồi được quyền'); }
}
