import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { QuestionType, Difficulty, Visibility, SourceKind } from '@prisma/client';

const CreateQuestionSchema = z.object({
  subject: z.string().min(1, 'Mã môn học là bắt buộc'),
  grade: z.number().int().min(1).max(12),
  type: z.nativeEnum(QuestionType),
  difficulty: z.nativeEnum(Difficulty),
  content: z.string().min(1, 'Nội dung câu hỏi không được để trống'),
  figures: z.any().optional(),
  payload: z.record(z.string(), z.any()), // choices, sub_questions, correct, accepted_answers...
  solution: z.string().default(''),
  points: z.number().optional(),
  topics: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  visibility: z.nativeEnum(Visibility).default(Visibility.PRIVATE),
  sourceKind: z.nativeEnum(SourceKind).default(SourceKind.TEACHER_WRITTEN),
  sourceUrl: z.string().optional(),
  shareable: z.boolean().default(true),
  aiGenerated: z.boolean().default(false),
  source: z.string().optional(),
});

// GET: Lấy danh sách câu hỏi của giáo viên đang đăng nhập
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);

    const subject = searchParams.get('subject') || undefined;
    const gradeParam = searchParams.get('grade');
    const grade = gradeParam ? parseInt(gradeParam, 10) : undefined;
    const typeParam = searchParams.get('type') as QuestionType | null;
    const type = typeParam && Object.values(QuestionType).includes(typeParam) ? typeParam : undefined;
    const difficultyParam = searchParams.get('difficulty') as Difficulty | null;
    const difficulty = difficultyParam && Object.values(Difficulty).includes(difficultyParam) ? difficultyParam : undefined;
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
    if (type) whereClause.type = type;
    if (difficulty) whereClause.difficulty = difficulty;
    if (search) {
      whereClause.content = {
        contains: search,
        mode: 'insensitive',
      };
    }

    const [questions, totalCount] = await Promise.all([
      prisma.question.findMany({
        where: whereClause,
        include: {
          author: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.question.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      questions,
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
      return NextResponse.json({ error: 'Vui lòng đăng nhập để xem danh sách câu hỏi' }, { status: 401 });
    }
    if (err.message === 'MUST_CHANGE_PASSWORD') {
      return NextResponse.json({ error: 'Tài khoản bắt buộc phải đổi mật khẩu trước khi tiếp tục', code: 'MUST_CHANGE_PASSWORD' }, { status: 403 });
    }
    console.error('Lỗi GET /api/questions:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi lấy danh sách câu hỏi' }, { status: 500 });
  }
}

// POST: Tạo câu hỏi mới trong ngân hàng của giáo viên
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const parsed = CreateQuestionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Dữ liệu câu hỏi không hợp lệ' },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Nếu câu hỏi từ IMPORTED_WEB thì mặc định khóa shareable = false
    const shareable = data.sourceKind === SourceKind.IMPORTED_WEB ? false : data.shareable;

    // Tạo câu hỏi kèm revision đầu tiên (version 1) trong transaction
    const question = await prisma.$transaction(async (tx) => {
      const q = await tx.question.create({
        data: {
          ownerId: user.id,
          authorId: user.id,
          subject: data.subject,
          grade: data.grade,
          type: data.type,
          difficulty: data.difficulty,
          content: data.content,
          figures: data.figures ? JSON.parse(JSON.stringify(data.figures)) : undefined,
          payload: data.payload,
          solution: data.solution,
          points: data.points !== undefined ? data.points : undefined,
          topics: data.topics,
          tags: data.tags,
          visibility: data.visibility,
          sourceKind: data.sourceKind,
          sourceUrl: data.sourceUrl,
          shareable,
          aiGenerated: data.aiGenerated,
          source: data.source,
          version: 1,
        },
        include: {
          author: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      // Tạo revision 1
      await tx.questionRevision.create({
        data: {
          questionId: q.id,
          version: 1,
          snapshot: JSON.parse(JSON.stringify(q)),
          note: 'Khởi tạo câu hỏi ban đầu',
        },
      });

      return q;
    });

    return NextResponse.json({
      success: true,
      question,
      message: 'Tạo câu hỏi thành công!',
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Vui lòng đăng nhập để tạo câu hỏi' }, { status: 401 });
    }
    if (err.message === 'MUST_CHANGE_PASSWORD') {
      return NextResponse.json({ error: 'Tài khoản bắt buộc phải đổi mật khẩu trước khi tiếp tục', code: 'MUST_CHANGE_PASSWORD' }, { status: 403 });
    }
    console.error('Lỗi POST /api/questions:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi tạo câu hỏi' }, { status: 500 });
  }
}
