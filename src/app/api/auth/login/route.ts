import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import {
  checkLoginRateLimit,
  recordFailedLogin,
  clearLoginRateLimit,
  verifyPassword,
  createSession,
  logAudit,
  SESSION_COOKIE_NAME,
} from '@/lib/auth';

const LoginSchema = z.object({
  email: z.string().email('Email không đúng định dạng'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const rateLimitKey = `${ip}:${email.toLowerCase()}`;

    // Kiểm tra giới hạn số lần thử (bền vững qua AuditLog & bộ nhớ)
    const rateCheck = await checkLoginRateLimit(rateLimitKey, ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Bạn đã thử đăng nhập sai quá nhiều lần. Vui lòng chờ ${rateCheck.waitMinutes} phút trước khi thử lại.`,
        },
        { status: 429 }
      );
    }

    // Tìm tài khoản
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      recordFailedLogin(rateLimitKey);
      await logAudit({
        action: 'user.login_failed',
        ip,
        meta: { email },
      });
      return NextResponse.json(
        { error: 'Email hoặc mật khẩu không chính xác' },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.' },
        { status: 403 }
      );
    }

    // Đối chiếu mật khẩu
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      recordFailedLogin(rateLimitKey);
      await logAudit({
        actorId: user.id,
        action: 'user.login_failed',
        ip,
        meta: { email },
      });
      return NextResponse.json(
        { error: 'Email hoặc mật khẩu không chính xác' },
        { status: 401 }
      );
    }

    // Đăng nhập thành công -> Xóa đếm thử sai
    clearLoginRateLimit(rateLimitKey);

    // Cập nhật lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Tạo phiên mới
    const session = await createSession(user.id);

    // Ghi audit log
    await logAudit({
      actorId: user.id,
      action: 'user.login',
      ip,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
        aiDailyLimit: user.aiDailyLimit,
      },
    });

    // Thiết lập Cookie HttpOnly an toàn
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: session.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: session.expiresAt,
    });

    return response;
  } catch (error) {
    console.error('Lỗi API Login:', error);
    return NextResponse.json(
      { error: 'Đã có lỗi xảy ra trên máy chủ khi đăng nhập' },
      { status: 500 }
    );
  }
}
