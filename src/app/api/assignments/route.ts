import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { requireRequestAuth } from '@/lib/request-auth';
import { ApiError, apiErrorResponse } from '@/lib/api-error';
import { fromDatabaseExam } from '@/lib/exam-document';
import { freezeExamScoring } from '@/lib/snapshot-scoring';
import {
  AssignmentMode,
  IdentityMode,
  RevealPolicy,
  LeaderboardMode,
  AssignmentStatus,
} from '@prisma/client';

const CreateAssignmentSchema = z.object({
  examId: z.string().min(1, 'Mã đề thi là bắt buộc'),
  groupId: z.string().optional(),
  title: z.string().min(1, 'Tiêu đề bài giao không được để trống'),
  mode: z.nativeEnum(AssignmentMode).default(AssignmentMode.HOMEWORK),
  identityMode: z.nativeEnum(IdentityMode).default(IdentityMode.PICK_FROM_LIST),
  opensAt: z.iso.datetime({ offset: true }).optional(),
  closesAt: z.iso.datetime({ offset: true }).optional(),
  durationMinutes: z.number().int().min(1).optional(),
  maxAttempts: z.number().int().min(1).max(10).default(1),
  shuffleQuestions: z.boolean().default(false),
  shuffleChoices: z.boolean().default(false),
  showResult: z.nativeEnum(RevealPolicy).default(RevealPolicy.IMMEDIATE),
  showSolution: z.nativeEnum(RevealPolicy).default(RevealPolicy.AFTER_CLOSE),
  requirePin: z.boolean().default(false),
  leaderboard: z.nativeEnum(LeaderboardMode).default(LeaderboardMode.OFF),
  leaderboardTopN: z.number().int().min(1).max(10).default(3),
  leaderboardReveal: z.nativeEnum(RevealPolicy).default(RevealPolicy.IMMEDIATE),
  leaderboardAnonymous: z.boolean().default(false),
});

type ExamWithSections = { sections?: unknown };

function generatePublicId(): string {
  // Sinh mã slug 10 ký tự thân thiện dễ dùng trên URL
  return crypto.randomBytes(16).toString('hex');
}

// GET: Lấy danh sách bài giao của giáo viên
export async function GET(req: NextRequest) {
  try {
    const user = await requireRequestAuth(req);
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get('groupId') || undefined;

    const assignments = await prisma.assignment.findMany({
      where: {
        ownerId: user.id,
        groupId,
      },
      include: {
        group: { select: { id: true, name: true, publicCode: true } },
        _count: {
          select: { attempts: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ assignments });
  } catch (error: unknown) {
    if (error instanceof ApiError) return apiErrorResponse(error, 'Chưa đọc được bài giao');
    const err = error as Error;
    if (err.message === 'MUST_CHANGE_PASSWORD') return NextResponse.json({ error: 'Vui lòng đổi mật khẩu trước khi tiếp tục' }, { status: 403 });
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }
    console.error('Lỗi GET /api/assignments:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}

// POST: Giáo viên giao bài (tự động chụp snapshot đề thi bất biến)
export async function POST(req: NextRequest) {
  try {
    const user = await requireRequestAuth(req);
    const body = await req.json();
    const parsed = CreateAssignmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Dữ liệu giao bài không hợp lệ' },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Lấy đề thi gốc kèm toàn bộ câu hỏi để tạo snapshot bất biến
    const exam = await prisma.exam.findFirst({
      where: { id: data.examId, ownerId: user.id, deletedAt: null },
      include: {
        items: {
          include: { question: { include: { passage: true } } },
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!exam) {
      return NextResponse.json({ error: 'Không tìm thấy đề thi cần giao' }, { status: 404 });
    }

    if (exam.items.length === 0 || exam.items.some(item => item.question.deletedAt || item.question.ownerId !== user.id)) {
      return NextResponse.json({ error: 'Đề phải có câu hỏi hợp lệ thuộc quyền sở hữu của bạn' }, { status: 400 });
    }
    const opensAt = data.opensAt ? new Date(data.opensAt) : new Date();
    const closesAt = data.closesAt ? new Date(data.closesAt) : null;
    if (closesAt && closesAt <= opensAt) return NextResponse.json({ error: 'Thời gian đóng phải sau thời gian mở' }, { status: 400 });
    if (data.identityMode !== 'FREE_NAME' && !data.groupId) return NextResponse.json({ error: 'Hãy chọn lớp cho chế độ nhận diện này hoặc chọn tự nhập tên' }, { status: 400 });
    if (data.groupId) {
      const group = await prisma.group.findFirst({ where: { id: data.groupId, ownerId: user.id, archivedAt: null } });
      if (!group) return NextResponse.json({ error: 'Không tìm thấy lớp thuộc quyền quản lý của bạn' }, { status: 404 });
    }

    const document = fromDatabaseExam(exam);
    const frozen = freezeExamScoring(document, (document as ExamWithSections).sections ?? exam.sections);
    if (frozen.missing.length) return NextResponse.json({ error: 'Còn ' + frozen.missing.length + ' câu chưa có điểm. Hãy đặt điểm hoặc chọn nhận xét/khảo sát trước khi giao bài.' }, { status: 400 });
    const snapshot = {
      ...document,
      examId: exam.id, title: exam.title, subject: exam.subject, grade: exam.grade,
      durationMinutes: data.durationMinutes || exam.durationMinutes || 60,
      sections: frozen.sections, questions: frozen.questions,
      snapshotAt: new Date().toISOString(),
    };

    let publicId = generatePublicId();
    // Đảm bảo không trùng lặp publicId
    while (await prisma.assignment.findUnique({ where: { publicId } })) {
      publicId = generatePublicId();
    }

    const assignment = await prisma.assignment.create({
      data: {
        ownerId: user.id,
        examId: exam.id,
        groupId: data.groupId || null,
        title: data.title,
        mode: data.mode,
        status: AssignmentStatus.OPEN,
        identityMode: data.identityMode,
        publicId,
        snapshot: JSON.parse(JSON.stringify(snapshot)),
        opensAt,
        closesAt,
        durationMinutes: data.durationMinutes || exam.durationMinutes || 60,
        maxAttempts: data.maxAttempts,
        shuffleQuestions: data.shuffleQuestions,
        shuffleChoices: data.shuffleChoices,
        showResult: data.showResult,
        showSolution: data.showSolution,
        requirePin: data.requirePin,
        leaderboard: data.leaderboard,
        leaderboardTopN: data.leaderboardTopN,
        leaderboardReveal: data.leaderboardReveal,
        leaderboardAnonymous: data.leaderboardAnonymous,
      },
      include: {
        group: { select: { id: true, name: true, publicCode: true } },
      },
    });

    return NextResponse.json({
      success: true,
      assignment,
      publicLink: `/a/${assignment.publicId}`,
      message: 'Giao bài thành công! Bản chụp đề thi bất biến đã được tạo an toàn.',
    });
  } catch (error: unknown) {
    if (error instanceof ApiError) return apiErrorResponse(error, 'Chưa tạo được bài giao');
    const err = error as Error;
    if (err.message === 'MUST_CHANGE_PASSWORD') return NextResponse.json({ error: 'Vui lòng đổi mật khẩu trước khi tiếp tục' }, { status: 403 });
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }
    console.error('Lỗi POST /api/assignments:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi tạo bài giao' }, { status: 500 });
  }
}
