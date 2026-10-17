import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

const CreateGroupSchema = z.object({
  name: z.string().min(1, 'Tên lớp học không được để trống'),
  note: z.string().optional(),
  publicCode: z.string().optional(),
  studentNames: z.array(z.string()).default([]), // Danh sách tên học sinh (từ dán nhiều dòng)
});

function generateGroupCode(name: string): string {
  // Tạo mã dễ nhớ dựa trên chữ cái đầu của tên lớp + 4 ký tự ngẫu nhiên
  const cleanName = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 6);
  const randomSuffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `${cleanName || 'GROUP'}${randomSuffix}`;
}

// GET: Lấy danh sách lớp học của giáo viên
export async function GET() {
  try {
    const user = await requireAuth();

    const groups = await prisma.group.findMany({
      where: {
        ownerId: user.id,
        archivedAt: null,
      },
      include: {
        _count: {
          select: {
            students: true,
            assignments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ groups });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }
    console.error('Lỗi GET /api/groups:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}

// POST: Tạo lớp học mới và danh sách học sinh
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const parsed = CreateGroupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ' },
        { status: 400 }
      );
    }

    const { name, note, studentNames } = parsed.data;

    // Lọc và làm sạch tên học sinh (loại bỏ dòng trống, trùng lặp)
    const cleanedNames = Array.from(
      new Set(
        studentNames
          .map((n) => n.trim())
          .filter((n) => n.length > 0)
      )
    );

    let publicCode = parsed.data.publicCode?.toUpperCase().trim();
    if (!publicCode) {
      publicCode = generateGroupCode(name);
    }

    // Kiểm tra trùng publicCode
    const existingCode = await prisma.group.findUnique({
      where: { publicCode },
    });
    if (existingCode) {
      publicCode = `${publicCode}_${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    }

    const group = await prisma.$transaction(async (tx) => {
      const created = await tx.group.create({
        data: {
          ownerId: user.id,
          name,
          note,
          publicCode,
        },
      });

      if (cleanedNames.length > 0) {
        await tx.student.createMany({
          data: cleanedNames.map((displayName) => ({
            groupId: created.id,
            displayName,
            personalToken: crypto.randomBytes(8).toString('hex'),
          })),
        });
      }

      return tx.group.findUnique({
        where: { id: created.id },
        include: {
          students: {
            orderBy: { displayName: 'asc' },
          },
          _count: {
            select: { students: true, assignments: true },
          },
        },
      });
    });

    return NextResponse.json({
      success: true,
      group,
      message: `Đã tạo lớp ${name} thành công với ${cleanedNames.length} học sinh!`,
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }
    console.error('Lỗi POST /api/groups:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi tạo lớp học' }, { status: 500 });
  }
}
