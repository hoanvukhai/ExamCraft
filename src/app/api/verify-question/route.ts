import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { z } from 'zod';
import { Question } from '@/types/exam';
import { requireAuth } from '@/lib/auth';
import { assertRequestAccount } from '@/lib/request-account';
import { isSameOriginMutation } from '@/lib/attempt-access';
import { apiErrorResponse } from '@/lib/api-error';
import { normalizeQuestion } from '@/lib/exam-document';
import { compareAnswerReview } from '@/lib/answer-review';
import prisma from '@/lib/prisma';
import { requestApiKey } from '@/lib/ai-policy';
import { executeWithKeyRotation, parseProviderJson } from '@/lib/gemini-keys';

const geminiVerifySchema = {
  type: Type.OBJECT,
  propertyOrdering: [
    'solvedAnswer',
    'confidence',
    'solutionSteps',
    'subQuestionsAssessment',
    'discrepancies',
    'recommendation',
  ],
  properties: {
    solvedAnswer: {
      type: Type.STRING,
      description: 'Đáp án do bạn độc lập giải ra. Ví dụ: "A" cho trắc nghiệm, "3" cho trả lời ngắn, hoặc "a:Đ, b:S, c:Đ, d:Đ" cho Đúng/Sai',
    },
    confidence: {
      type: Type.INTEGER,
      description: 'Độ tin cậy từ 0 đến 100',
    },
    solutionSteps: {
      type: Type.STRING,
      description: 'Các bước giải chi tiết và căn cứ toán học/khoa học khách quan',
    },
    subQuestionsAssessment: {
      type: Type.ARRAY,
      description: 'Đánh giá độc lập từng mệnh đề nếu là câu hỏi Đúng/Sai (Part II)',
      items: {
        type: Type.OBJECT,
        propertyOrdering: ['key', 'isCorrect', 'reason'],
        properties: {
          key: { type: Type.STRING, enum: ['a', 'b', 'c', 'd'] },
          isCorrect: { type: Type.BOOLEAN },
          reason: { type: Type.STRING },
        },
        required: ['key', 'isCorrect', 'reason'],
      },
    },
    discrepancies: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Danh sách các điểm sai sót hoặc mơ hồ phát hiện được (nếu không có thì để mảng rỗng)',
    },
    recommendation: {
      type: Type.STRING,
      enum: ['match', 'discrepancy', 'error_in_question', 'ambiguous'],
      description: 'match: khớp chuẩn xác; discrepancy: giải ra khác đáp án cũ; error_in_question: đề bị sai/thiếu dữ kiện; ambiguous: đề gây tranh cãi',
    },
  },
  required: ['solvedAnswer', 'confidence', 'solutionSteps', 'discrepancies', 'recommendation'],
};

const verifyZodSchema = z.object({
  solvedAnswer: z.string(),
  confidence: z.number().min(0).max(100),
  solutionSteps: z.string(),
  subQuestionsAssessment: z.array(z.object({
    key: z.string(),
    isCorrect: z.boolean(),
    reason: z.string(),
  })).optional(),
  discrepancies: z.array(z.string()).default([]),
  recommendation: z.enum(['match', 'discrepancy', 'error_in_question', 'ambiguous']),
});

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    if (!isSameOriginMutation(req)) return NextResponse.json({ error: 'Yêu cầu không hợp lệ' }, { status: 403 });
    const currentUser = await requireAuth();
    assertRequestAccount(req.headers, currentUser.id);
    const body = await req.json();
    const customApiKey = requestApiKey(body);
    const question = normalizeQuestion(body.question);

    if (!question || !question.content) {
      return NextResponse.json({ error: 'Thiếu dữ liệu câu hỏi cần kiểm tra' }, { status: 400 });
    }

    let hasKeys = Boolean(customApiKey && customApiKey.trim());
    if (!hasKeys && currentUser) {
      const activeCount = await prisma.userApiKey.count({
        where: { userId: currentUser.id, isActive: true },
      });
      hasKeys = activeCount > 0;
    }

    if (!hasKeys) {
      return NextResponse.json(
        { error: 'Tài khoản chưa có Google Gemini API Key. Thầy/Cô vui lòng thêm khóa API trong mục Kho Khóa AI.' },
        { status: 401 }
      );
    }

    // Xây dựng đề bài giải MÙ (Blind Solve): Không cấp đáp án đã có để AI giải hoàn toàn độc lập
    let questionTextForSolver = `[NỘI DUNG ĐỀ BÀI]:\n${question.content}\n\n`;

    if (question.type === 'multiple_choice' && question.choices) {
      questionTextForSolver += `[CÁC LỰA CHỌN]:\n`;
      question.choices.forEach(c => {
        questionTextForSolver += `${c.key}. ${c.text}\n`;
      });
    } else if (question.type === 'true_false_group' && question.sub_questions) {
      questionTextForSolver += `[CÁC MỆNH ĐỀ CẦN XÉT ĐÚNG/SAI]:\n`;
      question.sub_questions.forEach(sq => {
        questionTextForSolver += `${sq.key}) ${sq.content}\n`;
      });
    }

    const prompt = `Bạn hỗ trợ giáo viên giải độc lập và rà soát câu hỏi. Không tự nhận đại diện cơ quan quản lý; kết quả cần giáo viên kiểm tra.
Nhiệm vụ của bạn là giải độc lập câu hỏi dưới đây từ các tiên đề cơ bản nhất để kiểm định chất lượng:
1. Giải bài toán từng bước một cách chặt chẽ, nêu rõ điều kiện và điều chưa chắc chắn.
2. Đưa ra kết luận đáp án độc lập (solvedAnswer).
3. Đánh giá xem đề bài có bị thiếu điều kiện xác định, thiếu dữ kiện, hoặc câu từ mơ hồ gây tranh cãi hay không.

${questionTextForSolver}

Yêu cầu xuất ra cấu trúc JSON hợp lệ theo Schema đã cung cấp.`;

    const responseText = await executeWithKeyRotation(
      customApiKey,
      async (apiKey, model) => {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: geminiVerifySchema,
            temperature: 0.1, // Nhiệt độ cực thấp cho kết quả xác định, chuẩn xác
          },
        });
        return response.text || '{}';
      },
      {
        userId: currentUser.id,
        endpoint: 'question.verify',
      }
    );

    const parsedJson = parseProviderJson(responseText) as ReturnType<typeof JSON.parse>;
    const verifiedData = verifyZodSchema.parse(parsedJson);

    const { complete, isMatch, discrepancies } = compareAnswerReview(question, verifiedData);

    return NextResponse.json({
      success: true,
      isMatch,
      complete,
      reviewedQuestionId: question.id,
      reviewedVersion: question.version,
      solvedAnswer: verifiedData.solvedAnswer,
      confidence: verifiedData.confidence,
      solutionSteps: verifiedData.solutionSteps,
      subQuestionsAssessment: verifiedData.subQuestionsAssessment,
      discrepancies,
      recommendation: verifiedData.recommendation,
      originalAnswer: question.correct_answer,
    });
  } catch (error: unknown) {
    return apiErrorResponse(error, 'Không thể rà soát câu hỏi lúc này.');
  }
}
