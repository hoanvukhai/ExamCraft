import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { z } from 'zod';
import { Question } from '@/types/exam';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { executeWithKeyRotation, getGeminiModel } from '@/lib/gemini-keys';

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
  confidence: z.number().default(90),
  solutionSteps: z.string(),
  subQuestionsAssessment: z.array(z.object({
    key: z.string(),
    isCorrect: z.boolean(),
    reason: z.string(),
  })).optional(),
  discrepancies: z.array(z.string()).default([]),
  recommendation: z.enum(['match', 'discrepancy', 'error_in_question', 'ambiguous']).default('match'),
});

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    const body = await req.json();
    const { question, customApiKey } = body as { question: Question; customApiKey?: string };

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

    const prompt = `Bạn là một Chuyên gia Thẩm định Đề thi Quốc gia (Senior Exam Verification Auditor) thuộc Bộ Giáo dục & Đào tạo Việt Nam.
Nhiệm vụ của bạn là giải độc lập câu hỏi dưới đây từ các tiên đề cơ bản nhất để kiểm định chất lượng:
1. Giải bài toán từng bước một cách chặt chẽ, chính xác tuyệt đối.
2. Đưa ra kết luận đáp án độc lập (solvedAnswer).
3. Đánh giá xem đề bài có bị thiếu điều kiện xác định, thiếu dữ kiện, hoặc câu từ mơ hồ gây tranh cãi hay không.

${questionTextForSolver}

Yêu cầu xuất ra cấu trúc JSON hợp lệ theo Schema đã cung cấp.`;

    const responseText = await executeWithKeyRotation(
      customApiKey,
      async (apiKey) => {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: getGeminiModel(),
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
        userId: currentUser?.id,
        endpoint: 'question.verify',
      }
    );

    const parsedJson = JSON.parse(responseText);
    const verifiedData = verifyZodSchema.parse(parsedJson);

    // Tiến hành so khớp với đáp án hiện tại của câu hỏi
    let isMatch = false;
    const discrepancies: string[] = [...verifiedData.discrepancies];

    if (question.type === 'multiple_choice') {
      const solvedKey = verifiedData.solvedAnswer.trim().toUpperCase().replace(/[^ABCD]/g, '');
      const currentKey = (question.correct_answer || '').trim().toUpperCase();
      isMatch = solvedKey === currentKey;
      if (!isMatch) {
        discrepancies.push(`Đáp án hiện tại là "${currentKey}", nhưng AI thẩm định giải ra "${solvedKey}".`);
      }
    } else if (question.type === 'true_false_group' && question.sub_questions && verifiedData.subQuestionsAssessment) {
      let allSubMatch = true;
      for (const sq of question.sub_questions) {
        const aiAssessment = verifiedData.subQuestionsAssessment.find(a => a.key.toLowerCase() === sq.key.toLowerCase());
        if (aiAssessment) {
          if (aiAssessment.isCorrect !== sq.isCorrect) {
            allSubMatch = false;
            discrepancies.push(`Ý ${sq.key}): Hiện tại là "${sq.isCorrect ? 'Đúng' : 'Sai'}", nhưng thẩm định là "${aiAssessment.isCorrect ? 'Đúng' : 'Sai'}". Lý do: ${aiAssessment.reason}`);
          }
        }
      }
      isMatch = allSubMatch;
    } else {
      // short_answer hoặc essay
      const normSolved = verifiedData.solvedAnswer.trim().toLowerCase().replace(/\s+/g, '');
      const normCurrent = (question.correct_answer || '').trim().toLowerCase().replace(/\s+/g, '');
      isMatch = normSolved === normCurrent;
      if (!isMatch && question.accepted_answers) {
        const matchesAccepted = question.accepted_answers.some(ans => ans.trim().toLowerCase() === normSolved);
        if (matchesAccepted) isMatch = true;
      }
      if (!isMatch) {
        discrepancies.push(`Đáp án hiện tại là "${question.correct_answer}", nhưng AI thẩm định giải ra "${verifiedData.solvedAnswer}".`);
      }
    }

    return NextResponse.json({
      success: true,
      isMatch,
      solvedAnswer: verifiedData.solvedAnswer,
      confidence: verifiedData.confidence,
      solutionSteps: verifiedData.solutionSteps,
      subQuestionsAssessment: verifiedData.subQuestionsAssessment,
      discrepancies,
      recommendation: verifiedData.recommendation,
      originalAnswer: question.correct_answer,
    });
  } catch (error: unknown) {
    console.error('Error verifying question:', error);
    const message = error instanceof Error ? error.message : 'Lỗi hệ thống khi thẩm định câu hỏi';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
