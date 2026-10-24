import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRequestAuth } from '@/lib/request-auth';
import { ApiError, apiErrorResponse } from '@/lib/api-error';
import { AttemptStatus } from '@prisma/client';
import { asObject } from '@/lib/public-exam';
import { requiresNumericScore, type AssessmentMode } from '@/lib/education-catalog';
import { csvCell as sanitizeCsvCell } from '@/lib/csv-cell';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRequestAuth(req);
    const { id } = await params;

    const assignment = await prisma.assignment.findFirst({
      where: { id, ownerId: user.id },
      include: {
        group: true,
        attempts: {
          include: {
            student: true,
            answers: true,
          },
          orderBy: { startedAt: 'desc' },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Không tìm thấy bài giao' }, { status: 404 });
    }

    const snapshot = asObject(assignment.snapshot);
    const mode = asObject(asObject(assignment.snapshot).metadata).assessmentMode as AssessmentMode | undefined;
    const numeric = requiresNumericScore(mode);
    const questions = Array.isArray(snapshot.questions) ? snapshot.questions.map(asObject) : [];

    // Header CSV
    const headers = [
      'STT',
      'Họ và tên học sinh',
      'Lớp',
      'Lượt thi',
      'Trạng thái',
      numeric ? 'Điểm số' : 'Đánh giá',
      'Thời gian nộp',
      ...questions.map((_, idx) => `Câu ${idx + 1}`),
      ...(numeric ? questions.map((_, idx) => `Nhận xét câu ${idx + 1}`) : []),
    ];

    const rows: string[] = [];

    // Nhóm theo từng học sinh để lấy lượt nộp cao nhất hoặc hiển thị tất cả
    assignment.attempts.forEach((att, index) => {
      const answersMap = new Map(
        att.answers.map((a) => [a.questionKey, a])
      );

      const questionColumns = questions.map((q) => {
        const a = answersMap.get(String(q.id));
        if (!a) return 'Chưa làm';
        if (!numeric) return a.comment || (a.response == null ? 'Chưa trả lời' : mode === 'survey' ? 'Đã ghi nhận' : a.manualScore != null ? 'Đã nhận xét' : 'Chờ nhận xét');
        if (a.isCorrect === null) return a.manualScore == null ? 'Chờ chấm' : `Đã chấm (${a.earned}đ)`;
        return a.isCorrect ? `Đúng (${a.earned}đ)` : `Sai (${a.earned}đ)`;
      });

      const row = [
        sanitizeCsvCell(index + 1),
        sanitizeCsvCell(att.student.displayName),
        sanitizeCsvCell(assignment.group?.name || 'Tự do'),
        sanitizeCsvCell(`Lần ${att.attemptNo}`),
        sanitizeCsvCell(att.status === AttemptStatus.SUBMITTED ? 'Đã nộp' : att.status === AttemptStatus.IN_PROGRESS ? 'Đang làm' : att.status === AttemptStatus.EXPIRED ? 'Đã hết hạn' : 'Đã dừng'),
        sanitizeCsvCell(!numeric ? mode === 'survey' ? 'Không chấm điểm' : att.needsGrading ? 'Chờ nhận xét' : 'Đã nhận xét' : att.needsGrading ? 'Chờ giáo viên chấm' : att.score !== null ? `${att.score} / ${att.maxScore ?? ''}` : 'Chưa có'),
        sanitizeCsvCell(
          att.submittedAt ? new Date(att.submittedAt).toLocaleString('vi-VN') : ''
        ),
        ...questionColumns.map(sanitizeCsvCell),
        ...(numeric ? questions.map(q => sanitizeCsvCell(answersMap.get(String(q.id))?.comment)) : []),
      ];

      rows.push(row.join(','));
    });

    // Thêm UTF-8 BOM (\uFEFF) ở đầu để mở trực tiếp trên Excel không bị lỗi font Tiếng Việt
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');

    const cleanTitle = assignment.title
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '_');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Cache-Control': 'no-store',
        'Content-Disposition': `attachment; filename="Bang_Diem_${cleanTitle}_${Date.now()}.csv"`,
      },
    });
  } catch (error: unknown) {
    if (error instanceof ApiError) return apiErrorResponse(error, 'Chưa xuất được bảng điểm');
    const err = error as Error;
    if (err.message === 'MUST_CHANGE_PASSWORD') return NextResponse.json({ error: 'Vui lòng đổi mật khẩu trước khi tiếp tục', code: 'MUST_CHANGE_PASSWORD' }, { status: 403 });
    if (err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }
    console.error('Lỗi GET export CSV:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi xuất CSV' }, { status: 500 });
  }
}
