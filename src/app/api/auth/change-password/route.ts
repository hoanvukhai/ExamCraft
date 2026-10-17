import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser, hashPassword, verifyPassword, logAudit } from '@/lib/auth';

const ChangePasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, 'Mật khẩu mới phải có ít nhất 8 ký tự'),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const userSession = await getCurrentUser();

    if (!userSession) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập để thực hiện' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = ChangePasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = parsed.data;

    // Lấy thông tin user đầy đủ từ DB
    const user = await prisma.user.findUnique({
      where: { id: userSession.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'Người dùng không tồn tại' }, { status: 404 });
    }

    // Nếu không phải lần đầu bắt buộc đổi mật khẩu, thì bắt buộc phải kiểm tra mật khẩu hiện tại
    if (!user.mustChangePassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Vui lòng nhập mật khẩu hiện tại' }, { status: 400 });
      }
      const isMatch = await verifyPassword(currentPassword, user.passwordHash);
      if (!isMatch) {
        return NextResponse.json({ error: 'Mật khẩu hiện tại không chính xác' }, { status: 400 });
      }
    }

    // Băm mật khẩu mới
    const passwordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        mustChangePassword: false,
      },
    });

    await logAudit({
      actorId: user.id,
      action: 'user.change_password',
      ip,
    });

    return NextResponse.json({
      success: true,
      message: 'Đổi mật khẩu thành công!',
    });
  } catch (error) {
    console.error('Lỗi API Change Password:', error);
    return NextResponse.json(
      { error: 'Đã có lỗi xảy ra khi đổi mật khẩu' },
      { status: 500 }
    );
  }
}
