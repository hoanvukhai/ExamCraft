import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { QuestionType, Difficulty, Visibility } from '@prisma/client';

// GET: Lấy danh sách câu hỏi trong Ngân hàng dùng chung nội bộ giữa các giáo viên
export async function GET(req: NextRequest) {
  try {
    await requireAuth();
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
      visibility: Visibility.SHARED,
      shareable: true,
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
        orderBy: { createdAt: 'desc' },
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
      return NextResponse.json({ error: 'Vui lòng đăng nhập để xem ngân hàng dùng chung' }, { status: 401 });
    }
    console.error('Lỗi GET /api/questions/shared:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi lấy ngân hàng câu hỏi chung' }, { status: 500 });
  }
}
