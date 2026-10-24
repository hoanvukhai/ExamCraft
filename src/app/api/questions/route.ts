import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { forkPayload } from '@/lib/question-history';
import { ApiError, apiErrorResponse } from '@/lib/api-error';
import { isSameOriginMutation } from '@/lib/attempt-access';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireRequestAuth } from '@/lib/request-auth';
import { QuestionType, Difficulty, Visibility, SourceKind } from '@prisma/client';

const CreateQuestionSchema = z.object({
  passageId: z.string().min(1).optional(),
  passage: z.object({ title: z.string().max(500).optional(), content: z.string().min(1).max(500000), source: z.string().max(4000).optional(), figures: z.unknown().optional() }).optional(),
  subject: z.string().min(1, 'Mã môn học là bắt buộc'),
  grade: z.number().int().min(1).max(12),
  type: z.nativeEnum(QuestionType),
  difficulty: z.nativeEnum(Difficulty),
  content: z.string().min(1, 'Nội dung câu hỏi không được để trống'),
  figures: z.any().optional(),
  payload: z.record(z.string(), z.any()), // choices, sub_questions, correct, accepted_answers...
  solution: z.string().default(''),
  points: z.number().finite().nonnegative().max(999.99).optional(),
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
    const user = await requireRequestAuth(req);
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
      NOT: { tags: { has: '__workspace_only' } },
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
          passage: true,
          author: {
            select: { id: true, name: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.question.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      questions: questions.map(q => ({ ...q, passage: q.passage && q.passage.ownerId === q.ownerId ? { id: q.passage.id, title: q.passage.title, content: q.passage.content, source: q.passage.source, figures: q.passage.figures } : null, passageUnavailable: !!q.passage && q.passage.ownerId !== q.ownerId })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error: unknown) {
    if (error instanceof ApiError) return apiErrorResponse(error, 'Yêu cầu tải ngân hàng bị từ chối');
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
    if (!isSameOriginMutation(req)) throw new ApiError(403, 'Yêu cầu không hợp lệ');
    const user = await requireRequestAuth(req);
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
      let passageId: string | undefined;
      if (data.passage) {
        const passage = await tx.passage.create({ data: { ownerId: user.id, title: data.passage.title, content: data.passage.content, source: data.passage.source, figures: data.passage.figures == null ? undefined : JSON.parse(JSON.stringify(data.passage.figures)) } });
        passageId = passage.id;
      } else if (data.passageId) {
        const passage = await tx.passage.findFirst({ where: { id: data.passageId, ownerId: user.id }, select: { id: true } });
        if (!passage) throw new ApiError(400, 'Chưa có ngữ liệu trong kho riêng; hãy truyền cả nội dung ngữ liệu khi lưu câu hỏi');
        passageId = passage.id;
      }
      const id = `q_${randomUUID()}`;
      const q = await tx.question.create({
        data: {
          id, ownerId: user.id, passageId,
          authorId: user.id,
          subject: data.subject,
          grade: data.grade,
          type: data.type,
          difficulty: data.difficulty,
          content: data.content,
          figures: data.figures ? JSON.parse(JSON.stringify(data.figures)) : undefined,
          payload: forkPayload(data.payload, id, passageId ?? null),
          solution: data.solution,
          points: data.points !== undefined ? data.points : undefined,
          topics: data.topics,
          tags: data.tags.filter(tag => tag !== '__workspace_only'),
          visibility: data.visibility,
          sourceKind: data.sourceKind,
          sourceUrl: data.sourceUrl,
          shareable,
          aiGenerated: data.aiGenerated,
          source: data.source,
          version: 1,
        },
        include: {
          passage: true,
          author: {
            select: { id: true, name: true },
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
  } catch (error) { return apiErrorResponse(error, 'Chưa tạo được câu hỏi'); }
}
