import { ApiError, apiErrorResponse } from '@/lib/api-error';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireRequestAuth } from '@/lib/request-auth';

const UpdateFolderSchema = z.object({
  name: z.string().trim().min(1, 'Tên thư mục không được để trống').max(80).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Mã màu không hợp lệ').optional(),
});

// PATCH: Đổi tên hoặc đổi màu thư mục
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRequestAuth(req);
    const { id } = await params;
    const body = await req.json();
    const parsed = UpdateFolderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const folder = await prisma.folder.findFirst({
      where: { id, ownerId: user.id },
    });

    if (!folder) {
      return NextResponse.json({ error: 'Không tìm thấy thư mục' }, { status: 404 });
    }

    const updated = await prisma.folder.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({
      success: true,
      folder: updated,
      message: 'Cập nhật thư mục thành công!',
    });
  } catch (error: unknown) {
    if (error instanceof ApiError) return apiErrorResponse(error, 'Yêu cầu bị từ chối');
    const err = error as Error;
    if (err.message === 'MUST_CHANGE_PASSWORD') return NextResponse.json({ error: 'Vui lòng đổi mật khẩu trước khi tiếp tục', code: 'MUST_CHANGE_PASSWORD' }, { status: 403 });
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }
    console.error('Lỗi PATCH /api/folders/[id]:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi cập nhật thư mục' }, { status: 500 });
  }
}

// DELETE: Xóa thư mục (các đề thi bên trong sẽ được tự động giữ lại và chuyển ra ngoài thư mục gốc)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRequestAuth(req);
    const { id } = await params;

    const folder = await prisma.folder.findFirst({
      where: { id, ownerId: user.id },
      include: { children: true },
    });

    if (!folder) {
      return NextResponse.json({ error: 'Không tìm thấy thư mục' }, { status: 404 });
    }

    // Các đề thi trong thư mục này và thư mục con sẽ được set folderId = null (ra ngoài root, không bị mất)
    const childIds = folder.children.map(c => c.id);
    const allFolderIds = [id, ...childIds];

    if (folder.children.some(child => child.ownerId !== user.id) || await prisma.exam.count({ where: { folderId: { in: allFolderIds }, ownerId: { not: user.id } } })) {
      return NextResponse.json({ error: 'Thư mục có liên kết dữ liệu khác chủ từ nguồn cũ. Chưa xóa; cần kiểm tra liên kết trước.' }, { status: 409 });
    }

    await prisma.$transaction([
      prisma.exam.updateMany({
        where: { folderId: { in: allFolderIds }, ownerId: user.id },
        data: { folderId: null },
      }),
      prisma.folder.delete({
        where: { id },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Đã xóa thư mục. Các đề thi bên trong đã được chuyển an toàn ra ngoài thư viện chung.',
    });
  } catch (error: unknown) {
    if (error instanceof ApiError) return apiErrorResponse(error, 'Yêu cầu bị từ chối');
    const err = error as Error;
    if (err.message === 'MUST_CHANGE_PASSWORD') return NextResponse.json({ error: 'Vui lòng đổi mật khẩu trước khi tiếp tục', code: 'MUST_CHANGE_PASSWORD' }, { status: 403 });
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }
    console.error('Lỗi DELETE /api/folders/[id]:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi xóa thư mục' }, { status: 500 });
  }
}
