import { ApiError, apiErrorResponse } from '@/lib/api-error';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireRequestAuth } from '@/lib/request-auth';

const CreateFolderSchema = z.object({
  name: z.string().trim().min(1, 'Tên thư mục không được để trống').max(80, 'Tên thư mục tối đa 80 ký tự'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Mã màu không hợp lệ').optional().default('#1a73e8'),
  parentId: z.string().nullable().optional(),
});

// GET: Lấy toàn bộ cây thư mục của giáo viên (tối đa 2 cấp)
export async function GET(req: NextRequest) {
  try {
    const user = await requireRequestAuth(req);

    // Lấy các thư mục gốc (parentId = null) kèm các thư mục con cấp 2 và số lượng đề
    const folders = await prisma.folder.findMany({
      where: {
        ownerId: user.id,
        parentId: null,
      },
      include: {
        _count: {
          select: { exams: { where: { deletedAt: null, ownerId: user.id } } },
        },
        children: {
          where: { ownerId: user.id },
          include: {
            _count: {
              select: { exams: { where: { deletedAt: null, ownerId: user.id } } },
            },
          },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ folders });
  } catch (error: unknown) {
    if (error instanceof ApiError) return apiErrorResponse(error, 'Yêu cầu bị từ chối');
    const err = error as Error;
    if (err.message === 'MUST_CHANGE_PASSWORD') return NextResponse.json({ error: 'Vui lòng đổi mật khẩu trước khi tiếp tục', code: 'MUST_CHANGE_PASSWORD' }, { status: 403 });
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }
    console.error('Lỗi GET /api/folders:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi lấy danh sách thư mục' }, { status: 500 });
  }
}

// POST: Tạo thư mục mới (ràng buộc tối đa 2 cấp độ sâu)
export async function POST(req: NextRequest) {
  try {
    const user = await requireRequestAuth(req);
    const body = await req.json();
    const parsed = CreateFolderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const { name, color, parentId } = parsed.data;

    // Nếu tạo thư mục con (có parentId), kiểm tra xem thư mục cha có tồn tại và đã là cấp 2 chưa
    if (parentId) {
      const parentFolder = await prisma.folder.findFirst({
        where: { id: parentId, ownerId: user.id },
      });

      if (!parentFolder) {
        return NextResponse.json({ error: 'Thư mục cha không tồn tại hoặc không thuộc quyền sở hữu' }, { status: 404 });
      }

      // Quy tắc tỷ lệ vàng: Nếu thư mục cha vốn đã có parentId (nghĩa là đã là cấp 2), từ chối tạo cấp 3!
      if (parentFolder.parentId !== null) {
        return NextResponse.json(
          { error: 'Hệ thống giới hạn tối đa 2 cấp thư mục (Thư mục cha -> Thư mục con) để đảm bảo giao diện luôn ngăn nắp và trực quan.' },
          { status: 400 }
        );
      }
    }

    // Kiểm tra trùng tên trong cùng thư mục cha
    const existing = await prisma.folder.findFirst({
      where: {
        ownerId: user.id,
        parentId: parentId || null,
        name: { equals: name, mode: 'insensitive' },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Thư mục "${name}" đã tồn tại ở cấp này.` },
        { status: 409 }
      );
    }

    const newFolder = await prisma.folder.create({
      data: {
        ownerId: user.id,
        name,
        color: color || '#1a73e8',
        parentId: parentId || null,
      },
    });

    return NextResponse.json({
      success: true,
      folder: newFolder,
      message: 'Đã tạo thư mục thành công!',
    }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof ApiError) return apiErrorResponse(error, 'Yêu cầu bị từ chối');
    const err = error as Error;
    if (err.message === 'MUST_CHANGE_PASSWORD') return NextResponse.json({ error: 'Vui lòng đổi mật khẩu trước khi tiếp tục', code: 'MUST_CHANGE_PASSWORD' }, { status: 403 });
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }
    console.error('Lỗi POST /api/folders:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi tạo thư mục' }, { status: 500 });
  }
}
