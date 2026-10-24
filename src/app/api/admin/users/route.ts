import { NextRequest, NextResponse } from 'next/server';
import { isSameOriginMutation } from '@/lib/attempt-access';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireAdmin, hashPassword, logAudit } from '@/lib/auth';
import { Role } from '@prisma/client';

const CreateUserSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  name: z.string().min(2, 'Tên người dùng phải có ít nhất 2 ký tự'),
  password: z.string().min(6, 'Mật khẩu tạm phải có ít nhất 6 ký tự'),
  role: z.nativeEnum(Role).default(Role.TEACHER),
  aiDailyLimit: z.number().int().min(0).default(100),
});

export async function GET() {
  try {
    const admin = await requireAdmin();

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        aiDailyLimit: true,
        createdAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            questions: true,
            exams: true,
            assignments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ users });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'MUST_CHANGE_PASSWORD') return NextResponse.json({ error: 'Vui lòng đổi mật khẩu trước khi tiếp tục', code: 'MUST_CHANGE_PASSWORD' }, { status: 403 });
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }
    if (err.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Bạn không có quyền quản trị viên' }, { status: 403 });
    }
    console.error('Lỗi API Admin GET users:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!isSameOriginMutation(req)) return NextResponse.json({ error: 'Yêu cầu không hợp lệ' }, { status: 403 });
    const admin = await requireAdmin();
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const body = await req.json();
    const parsed = CreateUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const { email, name, password, role, aiDailyLimit } = parsed.data;

    // Kiểm tra email trùng
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Email này đã được sử dụng trong hệ thống' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        passwordHash,
        role,
        aiDailyLimit,
        isActive: true,
        mustChangePassword: true, // Bắt buộc đổi mật khẩu ở lần đăng nhập đầu
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        aiDailyLimit: true,
        createdAt: true,
      },
    });

    await logAudit({
      actorId: admin.id,
      action: 'user.create',
      targetType: 'User',
      targetId: newUser.id,
      ip,
      meta: { email: newUser.email, role: newUser.role },
    });

    return NextResponse.json({
      success: true,
      user: newUser,
      message: 'Tạo tài khoản giáo viên thành công!',
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
    console.error('Lỗi API Admin POST user:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi tạo tài khoản' }, { status: 500 });
  }
}
