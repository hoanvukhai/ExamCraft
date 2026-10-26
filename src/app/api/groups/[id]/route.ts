import { ApiError, apiErrorResponse } from '@/lib/api-error';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireRequestAuth } from '@/lib/request-auth';

const UpdateGroupSchema = z.object({
  name: z.string().min(1).optional(),
  note: z.string().optional(),
  newStudentNames: z.array(z.string()).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRequestAuth(req);
    const { id } = await params;

    const group = await prisma.group.findFirst({
      where: { id, ownerId: user.id, archivedAt: null },
      include: {
        students: {
          where: { archivedAt: null },
          orderBy: { displayName: 'asc' },
          include: {
            _count: { select: { attempts: true } },
          },
        },
        assignments: {
          where: { ownerId: user.id },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            publicId: true,
            mode: true,
            status: true,
            opensAt: true,
            closesAt: true,
            _count: { select: { attempts: true } },
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: 'Không tìm thấy lớp học' }, { status: 404 });
    }

    return NextResponse.json({ group: { ...group, students: group.students.map(({ pinHash, personalToken, ...student }) => ({ ...student, hasPin: Boolean(pinHash), hasPersonalLink: Boolean(personalToken) })) } });
  } catch (error: unknown) {
    if (error instanceof ApiError) return apiErrorResponse(error, 'Yêu cầu bị từ chối');
    const err = error as Error;
    if (err.message === 'MUST_CHANGE_PASSWORD') return NextResponse.json({ error: 'Vui lòng đổi mật khẩu trước khi tiếp tục', code: 'MUST_CHANGE_PASSWORD' }, { status: 403 });
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }
    console.error('Lỗi GET /api/groups/[id]:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRequestAuth(req);
    const { id } = await params;
    const body = await req.json();
    const parsed = UpdateGroupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 });
    }

    const currentGroup = await prisma.group.findFirst({
      where: { id, ownerId: user.id, archivedAt: null },
    });

    if (!currentGroup) {
      return NextResponse.json({ error: 'Không tìm thấy lớp học' }, { status: 404 });
    }

    const { name, note, newStudentNames } = parsed.data;

    const updated = await prisma.$transaction(async (tx) => {
      const g = await tx.group.update({
        where: { id },
        data: {
          name: name !== undefined ? name : undefined,
          note: note !== undefined ? note : undefined,
        },
      });

      if (newStudentNames && newStudentNames.length > 0) {
        const cleaned = Array.from(new Set(newStudentNames.map((n) => n.trim()).filter((n) => n.length > 0)));
        for (const displayName of cleaned) {
          await tx.student.upsert({
            where: {
              groupId_displayName: {
                groupId: id,
                displayName,
              },
            },
            create: {
              groupId: id,
              displayName,
            },
            update: {
              archivedAt: null, // Bỏ lưu trữ nếu đã từng tồn tại
            },
          });
        }
      }

      return g;
    });

    return NextResponse.json({ success: true, group: updated });
  } catch (error: unknown) {
    if (error instanceof ApiError) return apiErrorResponse(error, 'Yêu cầu bị từ chối');
    const err = error as Error;
    if (err.message === 'MUST_CHANGE_PASSWORD') return NextResponse.json({ error: 'Vui lòng đổi mật khẩu trước khi tiếp tục', code: 'MUST_CHANGE_PASSWORD' }, { status: 403 });
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }
    console.error('Lỗi PATCH /api/groups/[id]:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRequestAuth(req);
    const { id } = await params;

    const currentGroup = await prisma.group.findFirst({
      where: { id, ownerId: user.id, archivedAt: null },
    });

    if (!currentGroup) {
      return NextResponse.json({ error: 'Không tìm thấy lớp học' }, { status: 404 });
    }

    await prisma.group.update({
      where: { id },
      data: { archivedAt: new Date() },
    });

    return NextResponse.json({ success: true, message: 'Đã lưu trữ lớp học thành công!' });
  } catch (error: unknown) {
    if (error instanceof ApiError) return apiErrorResponse(error, 'Yêu cầu bị từ chối');
    const err = error as Error;
    if (err.message === 'MUST_CHANGE_PASSWORD') return NextResponse.json({ error: 'Vui lòng đổi mật khẩu trước khi tiếp tục', code: 'MUST_CHANGE_PASSWORD' }, { status: 403 });
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }
    console.error('Lỗi DELETE /api/groups/[id]:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}
