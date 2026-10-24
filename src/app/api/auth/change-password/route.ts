import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireAuth, hashPassword, verifyPassword, logAudit, SESSION_COOKIE_NAME } from '@/lib/auth';
import { requestAuditIp } from '@/lib/auth-security';
import { isSameOriginMutation } from '@/lib/attempt-access';
import { apiErrorResponse, ApiError } from '@/lib/api-error';
const schema = z.object({ currentPassword: z.string().max(1024).optional(), newPassword: z.string().min(8).max(72) }).strict();
export async function POST(req: NextRequest) {
  try {
    if (!isSameOriginMutation(req)) throw new ApiError(403, 'Yêu cầu không hợp lệ');
    const session = await requireAuth({ allowMustChangePassword: true });
    const input = schema.safeParse(await req.json());
    if (!input.success || new TextEncoder().encode(input.data.newPassword).length > 72) throw new ApiError(400, 'Mật khẩu mới cần ít nhất 8 ký tự và tối đa 72 byte');
    const user = await prisma.user.findUnique({ where: { id: session.id } });
    if (!user?.isActive) throw new ApiError(401, 'Vui lòng đăng nhập lại');
    if (!user.mustChangePassword && (!input.data.currentPassword || !await verifyPassword(input.data.currentPassword, user.passwordHash))) throw new ApiError(400, 'Mật khẩu hiện tại không chính xác');
    if (await verifyPassword(input.data.newPassword, user.passwordHash)) throw new ApiError(400, 'Hãy chọn mật khẩu mới khác mật khẩu hiện tại');
    const passwordHash = await hashPassword(input.data.newPassword), token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
    if (!token) throw new ApiError(401, 'Vui lòng đăng nhập lại');
    await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${user.id} FOR UPDATE`;
      const existingSession = await tx.session.findFirst({ where: { token, userId: user.id, expiresAt: { gt: new Date() } } });
      if (!existingSession) throw new ApiError(401, 'Phiên đăng nhập đã thay đổi; hãy đăng nhập lại');
      const result = await tx.user.updateMany({ where: { id: user.id, isActive: true, passwordHash: user.passwordHash }, data: { passwordHash, mustChangePassword: false } });
      if (!result.count) throw new ApiError(409, 'Mật khẩu hoặc trạng thái tài khoản vừa đổi; hãy đăng nhập lại');
      await tx.session.deleteMany({ where: { userId: user.id, token: { not: token } } });
    });
    await logAudit({ actorId: user.id, action: 'user.change_password', ip: requestAuditIp(req.headers) });
    return NextResponse.json({ success: true, message: 'Đã đổi mật khẩu và đăng xuất các phiên khác' }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return apiErrorResponse(error, 'Chưa đổi được mật khẩu'); }
}
