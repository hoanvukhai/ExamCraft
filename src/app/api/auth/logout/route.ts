import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { deleteSession, getCurrentUser, logAudit, SESSION_COOKIE_NAME } from '@/lib/auth';
import { requestAuditIp } from '@/lib/auth-security';
import { isSameOriginMutation } from '@/lib/attempt-access';
import { apiErrorResponse } from '@/lib/api-error';
import { assertRequestAccount } from '@/lib/request-account';
export async function POST(req: NextRequest) {
  try {
    if (!isSameOriginMutation(req)) return NextResponse.json({ error: 'Yêu cầu không hợp lệ' }, { status: 403 });
    const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
    const user = await getCurrentUser();
    if (user) assertRequestAccount(req.headers, user.id);
    if (token) await deleteSession(token);
    if (user) await logAudit({ actorId: user.id, action: 'user.logout', ip: requestAuditIp(req.headers) });
    const response = NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
    response.cookies.set({ name: SESSION_COOKIE_NAME, value: '', httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 });
    return response;
  } catch (error) { return apiErrorResponse(error, 'Chưa đăng xuất được trên máy chủ. Vui lòng thử lại.'); }
}
