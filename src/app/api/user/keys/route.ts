import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { encryptApiKey, maskApiKey } from '@/lib/crypto';

/**
 * GET /api/user/keys
 * Lấy danh sách API Key cá nhân của người dùng hiện tại kèm thông tin dung lượng/lượt dùng
 */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  // Lấy các key đã lưu của user
  const keys = await prisma.userApiKey.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      label: true,
      keyMasked: true,
      isActive: true,
      createdAt: true,
      lastUsedAt: true,
      errorCount: true,
    },
  });

  // Tính số lượt AI đã dùng trong ngày hôm nay
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const usedToday = await prisma.aiUsageLog.count({
    where: {
      userId: user.id,
      createdAt: { gte: startOfDay },
      httpStatus: 200,
    },
  });

  return NextResponse.json({
    keys,
    quota: {
      dailyLimit: user.aiDailyLimit,
      usedToday,
      remaining: Math.max(0, user.aiDailyLimit - usedToday),
    },
    hasActiveKey: keys.some((k) => k.isActive),
  });
}

/**
 * POST /api/user/keys
 * Mã hóa và lưu API Key mới vào Database bằng AES-256-GCM
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { apiKey, label } = body;

    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 10) {
      return NextResponse.json(
        { error: 'API Key không hợp lệ. Vui lòng nhập đúng Google Gemini API Key (bắt đầu bằng AIza...)' },
        { status: 400 }
      );
    }

    const trimmedKey = apiKey.trim();

    // Mã hóa bằng AES-256-GCM với IV và Auth Tag
    const encryptedData = encryptApiKey(trimmedKey);

    const keyLabel = label && typeof label === 'string' && label.trim().length > 0 
      ? label.trim() 
      : `Google Gemini Key ${new Date().toLocaleDateString('vi-VN')}`;

    const newKey = await prisma.userApiKey.create({
      data: {
        userId: user.id,
        label: keyLabel,
        keyEncrypted: encryptedData.keyEncrypted,
        keyIv: encryptedData.keyIv,
        keyTag: encryptedData.keyTag,
        keyMasked: encryptedData.keyMasked,
        isActive: true,
      },
      select: {
        id: true,
        label: true,
        keyMasked: true,
        isActive: true,
        createdAt: true,
        lastUsedAt: true,
        errorCount: true,
      },
    });

    return NextResponse.json({
      success: true,
      key: newKey,
      message: 'Đã lưu và mã hóa API Key an toàn vào hệ thống!',
    });
  } catch (err: unknown) {
    console.error('Lỗi khi lưu API Key:', err);
    return NextResponse.json(
      { error: 'Không thể mã hóa và lưu API Key. Vui lòng thử lại.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/keys
 * Xóa một API Key khỏi tài khoản
 */
export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Thiếu ID của API Key cần xóa' }, { status: 400 });
    }

    // Kiểm tra quyền sở hữu
    const existingKey = await prisma.userApiKey.findUnique({
      where: { id },
    });

    if (!existingKey || existingKey.userId !== user.id) {
      return NextResponse.json({ error: 'Không tìm thấy API Key hoặc bạn không có quyền xóa' }, { status: 404 });
    }

    await prisma.userApiKey.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Đã xóa API Key' });
  } catch (err) {
    console.error('Lỗi khi xóa API Key:', err);
    return NextResponse.json({ error: 'Lỗi server khi xóa API Key' }, { status: 500 });
  }
}

/**
 * PATCH /api/user/keys
 * Bật/tắt trạng thái hoạt động hoặc cập nhật nhãn của API Key
 */
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, isActive, label } = body;

    if (!id) {
      return NextResponse.json({ error: 'Thiếu ID của API Key' }, { status: 400 });
    }

    const existingKey = await prisma.userApiKey.findUnique({
      where: { id },
    });

    if (!existingKey || existingKey.userId !== user.id) {
      return NextResponse.json({ error: 'Không tìm thấy API Key' }, { status: 404 });
    }

    const updated = await prisma.userApiKey.update({
      where: { id },
      data: {
        ...(typeof isActive === 'boolean' ? { isActive } : {}),
        ...(typeof label === 'string' && label.trim() ? { label: label.trim() } : {}),
      },
      select: {
        id: true,
        label: true,
        keyMasked: true,
        isActive: true,
        createdAt: true,
        lastUsedAt: true,
        errorCount: true,
      },
    });

    return NextResponse.json({ success: true, key: updated });
  } catch (err) {
    console.error('Lỗi khi cập nhật API Key:', err);
    return NextResponse.json({ error: 'Lỗi server khi cập nhật API Key' }, { status: 500 });
  }
}
