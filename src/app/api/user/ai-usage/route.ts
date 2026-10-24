import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRequestAuth } from '@/lib/request-auth';
import { apiErrorResponse } from '@/lib/api-error';
import { applicationDayStart } from '@/lib/ai-policy';

const ENDPOINT_LABELS: Record<string, string> = {
  'knowledge.scope.propose': 'Đề nghị phạm vi kiến thức',
  'teacher.ai_memory.analyze': 'Phân tích phong cách AI',
  'teacher.assistant.chat': 'Chat Trợ lý Sư phạm',
  'ai.generate': 'Sinh đề thi',
  'exam.copilot': 'Copilot Đề thi',
  'question.verify': 'Kiểm duyệt câu hỏi',
  'question.tweak': 'Cải tiến câu hỏi',
  'ocr.exam_image': 'Nhận dạng ảnh (OCR)',
  'parse.docx': 'Trích xuất Word',
  'parse.exam_text': 'Phân tích văn bản đề',
};

/**
 * GET /api/user/ai-usage
 * Nhật ký sử dụng AI thời gian thực của giáo viên
 */
export async function GET(req: NextRequest) {
  try {
  const user = await requireRequestAuth(req);

  const startOfDay = applicationDayStart();

  const [logs, errorCount, avgLatency, totalToday] = await Promise.all([
    prisma.aiUsageLog.findMany({
      where: { userId: user.id, createdAt: { gte: startOfDay } },
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: { id: true, keyAlias: true, endpoint: true, model: true, httpStatus: true, latencyMs: true, createdAt: true },
    }),
    prisma.aiUsageLog.count({
      where: { userId: user.id, createdAt: { gte: startOfDay }, httpStatus: { notIn: [102, 200] } },
    }),
    prisma.aiUsageLog.aggregate({
      where: { userId: user.id, createdAt: { gte: startOfDay }, httpStatus: 200 },
      _avg: { latencyMs: true },
    }),
    prisma.aiUsageLog.count({ where: { userId: user.id, createdAt: { gte: startOfDay } } }),
  ]);

  const logsWithLabels = logs.map((l) => ({
    ...l,
    endpointLabel: ENDPOINT_LABELS[l.endpoint] ?? l.endpoint,
    isSuccess: l.httpStatus === 200,
  }));

  return NextResponse.json({
    logs: logsWithLabels,
    stats: {
      totalToday,
      errorCount,
      avgLatencyMs: Math.round(avgLatency._avg.latencyMs ?? 0),
    },
  }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return apiErrorResponse(error, 'Chưa tải được nhật ký AI'); }
}
