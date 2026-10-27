import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireAdmin, hashPassword, logAudit } from '@/lib/auth';
import { Role } from '@prisma/client';
import { isSameOriginMutation } from '@/lib/attempt-access';

const UpdateUserSchema = z.object({
  isActive: z.boolean().optional(),
  resetPassword: z.string().min(6, 'Mật khẩu tạm phải có ít nhất 6 ký tự').optional(),
  name: z.string().min(2).optional(),
  role: z.nativeEnum(Role).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isSameOriginMutation(req)) return NextResponse.json({ error: 'Yêu cầu không hợp lệ' }, { status: 403 });
    const admin = await requireAdmin();
    const { id } = await params;
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const body = await req.json();
    const parsed = UpdateUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Không tìm thấy người dùng' }, { status: 404 });
    }

    // Không cho phép tự khóa tài khoản của chính mình
    if (parsed.data.isActive === false && targetUser.id === admin.id) {
      return NextResponse.json(
        { error: 'Bạn không thể tự khóa tài khoản của chính mình' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (parsed.data.name !== undefined) {
      updateData.name = parsed.data.name;
    }

    if (parsed.data.isActive !== undefined) {
      updateData.isActive = parsed.data.isActive;
    }



    if (parsed.data.role !== undefined) {
      updateData.role = parsed.data.role;
    }

    if (parsed.data.resetPassword) {
      updateData.passwordHash = await hashPassword(parsed.data.resetPassword);
      updateData.mustChangePassword = true; // Bắt buộc đổi lại khi đăng nhập
    }

    const updated = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${id} FOR UPDATE`;
      const updated = await tx.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        aiDailyLimit: true,
        updatedAt: true,
      },
    });
      if (parsed.data.resetPassword || parsed.data.isActive === false || parsed.data.role !== undefined) await tx.session.deleteMany({ where: { userId: id } });
      return updated;
    });

    await logAudit({
      actorId: admin.id,
      action: parsed.data.resetPassword
        ? 'user.reset_password'
        : parsed.data.isActive !== undefined
        ? parsed.data.isActive
          ? 'user.enable'
          : 'user.disable'
        : 'user.update',
      targetType: 'User',
      targetId: id,
      ip,
      meta: { changes: Object.keys(updateData) },
    });

    return NextResponse.json({
      success: true,
      user: updated,
      message: 'Cập nhật tài khoản thành công!',
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'MUST_CHANGE_PASSWORD') return NextResponse.json({ error: 'Vui lòng đổi mật khẩu trước khi tiếp tục', code: 'MUST_CHANGE_PASSWORD' }, { status: 403 });
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }
    if (err.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Bạn không có quyền quản trị viên' }, { status: 403 });
    }
    console.error('Lỗi API Admin PATCH user:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi cập nhật tài khoản' }, { status: 500 });
  }
}
