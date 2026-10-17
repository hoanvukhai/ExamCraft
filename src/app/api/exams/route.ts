import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

const CreateExamSchema = z.object({
  title: z.string().min(1, 'Tiêu đề đề thi không được để trống'),
  subject: z.string().min(1, 'Mã môn học là bắt buộc'),
  grade: z.number().int().min(1).max(12),
  durationMinutes: z.number().int().min(1).optional(),
  templateId: z.string().optional(),
  metadata: z.record(z.string(), z.any()).default({}),
  sections: z.array(z.record(z.string(), z.any())).min(1, 'Cần ít nhất một phần cấu trúc đề'),
  variantCount: z.number().int().min(1).max(10).default(1),
  questionItems: z
    .array(
      z.object({
        questionId: z.string(),
        sectionId: z.string(),
        position: z.number().int(),
        pointsOverride: z.number().optional(),
      })
    )
    .optional(),
});

// GET: Lấy danh sách đề thi của giáo viên
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);

    const subject = searchParams.get('subject') || undefined;
    const gradeParam = searchParams.get('grade');
    const grade = gradeParam ? parseInt(gradeParam, 10) : undefined;
    const search = searchParams.get('search') || undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const whereClause: Record<string, unknown> = {
      ownerId: user.id,
      deletedAt: null,
    };

    if (subject) whereClause.subject = subject;
    if (grade) whereClause.grade = grade;
    if (search) {
      whereClause.title = { contains: search, mode: 'insensitive' };
    }

    const [exams, totalCount] = await Promise.all([
      prisma.exam.findMany({
        where: whereClause,
        include: {
          _count: {
            select: {
              items: true,
              assignments: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.exam.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      exams,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }
    console.error('Lỗi GET /api/exams:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi lấy danh sách đề thi' }, { status: 500 });
  }
}

// POST: Tạo đề thi mới và lưu vào PostgreSQL
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const parsed = CreateExamSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Dữ liệu đề thi không hợp lệ' },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const exam = await prisma.$transaction(async (tx) => {
      const created = await tx.exam.create({
        data: {
          ownerId: user.id,
          title: data.title,
          subject: data.subject,
          grade: data.grade,
          durationMinutes: data.durationMinutes,
          templateId: data.templateId,
          metadata: data.metadata,
          sections: data.sections,
          variantCount: data.variantCount,
        },
      });

      if (data.questionItems && data.questionItems.length > 0) {
        await tx.examQuestion.createMany({
          data: data.questionItems.map((item) => ({
            examId: created.id,
            questionId: item.questionId,
            sectionId: item.sectionId,
            position: item.position,
            pointsOverride: item.pointsOverride,
          })),
        });
      }

      return created;
    });

    return NextResponse.json({
      success: true,
      exam,
      message: 'Lưu đề thi thành công vào cơ sở dữ liệu!',
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }
    console.error('Lỗi POST /api/exams:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi tạo đề thi' }, { status: 500 });
  }
}
