import { generateExamForPlan } from '@/lib/exam-generation';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { isSameOriginMutation } from '@/lib/attempt-access';
import { requestApiKey } from '@/lib/ai-policy';
import { apiErrorResponse } from '@/lib/api-error';
import { generationPlanSchema } from '@/lib/generation-plan';
import { assertRequestAccount } from '@/lib/request-account';

// Several AI calls in a row (long Word imports, full exams) need more than a serverless default.
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    if (!isSameOriginMutation(req))
      return NextResponse.json({ error: 'Yêu cầu không hợp lệ' }, { status: 403 });
    const user = await requireAuth();
    assertRequestAccount(req.headers, user.id);
    const body = await req.json();
    const validation = generationPlanSchema.safeParse(body.params);
    if (!validation.success)
      return NextResponse.json(
        { success: false, error: validation.error.issues.map((i) => i.message).join('; ') },
        { status: 400 },
      );
    const exam = await generateExamForPlan(
      validation.data,
      user.id,
      req.signal,
      requestApiKey(body),
    );
    return NextResponse.json({
      success: true,
      exam,
      isFallback: false,
      warnings: [
        'Bản nháp do AI tạo; giáo viên cần kiểm nội dung, đáp án, điểm và phạm vi trước khi dùng.',
      ],
    });
  } catch (error) {
    return apiErrorResponse(error, 'AI chưa hoàn tất yêu cầu tạo bài');
  }
}
