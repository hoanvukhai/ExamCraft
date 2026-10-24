import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { checkLoginRateLimit, verifyPassword, createSession, logAudit, SESSION_COOKIE_NAME } from '@/lib/auth';
import { loginBucket, requestAuditIp } from '@/lib/auth-security';
import { isSameOriginMutation } from '@/lib/attempt-access';
import { apiErrorResponse } from '@/lib/api-error';
const schema = z.object({ email: z.email().trim().max(254), password: z.string().min(1).max(1024) }).strict();
export async function POST(req: NextRequest) {
  try {
    if (!isSameOriginMutation(req)) return NextResponse.json({ error: 'Yêu cầu không hợp lệ' }, { status: 403 });
    const input = schema.safeParse(await req.json());
    if (!input.success) return NextResponse.json({ error: 'Email hoặc mật khẩu không hợp lệ' }, { status: 400 });
    const email = input.data.email.toLowerCase(), ip = requestAuditIp(req.headers);
    const rate = await checkLoginRateLimit(email, ip);
    if (!rate.allowed) return NextResponse.json({ error: 'Đã thử đăng nhập quá nhiều lần cho tài khoản này. Hãy đợi 15 phút rồi thử lại.' }, { status: 429, headers: { 'Retry-After': '900' } });
    const user = await prisma.user.findUnique({ where: { email } });
    const valid = user?.isActive && await verifyPassword(input.data.password, user.passwordHash);
    if (!valid || !user) {
      await prisma.auditLog.create({ data: { actorId: user?.id, action: 'user.login_failed', targetType: 'LoginBucket', targetId: loginBucket(email), ip } });
      return NextResponse.json({ error: 'Email hoặc mật khẩu không chính xác' }, { status: 401 });
    }
    const session = await createSession(user.id, user.passwordHash);
    await prisma.user.updateMany({ where: { id: user.id, isActive: true }, data: { lastLoginAt: new Date() } });
    await logAudit({ actorId: user.id, action: 'user.login', ip });
    const response = NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role, mustChangePassword: user.mustChangePassword, aiDailyLimit: user.aiDailyLimit } }, { headers: { 'Cache-Control': 'no-store' } });
    response.cookies.set({ name: SESSION_COOKIE_NAME, value: session.token, httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', expires: session.expiresAt });
    return response;
  } catch (error) { return apiErrorResponse(error, 'Chưa đăng nhập được. Vui lòng thử lại sau.'); }
}
