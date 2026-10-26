import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { assertRequestAccount } from '@/lib/request-account';
import { apiErrorResponse, ApiError } from '@/lib/api-error';
import { requestApiKey } from '@/lib/ai-policy';
import { isSameOriginMutation } from '@/lib/attempt-access';

import { GoogleGenAI, Type } from '@google/genai';
import { z } from 'zod';
import { Question } from '@/types/exam';
import { executeWithKeyRotation, parseProviderJson } from '@/lib/gemini-keys';
import { syncQuestionFigures } from '@/lib/figure-sync';

export type TweakAction = 
  | 'change_numbers' 
  | 'similar_question' 
  | 'increase_difficulty' 
  | 'decrease_difficulty' 
  | 'custom';

// 1. Schema cho 1 câu hỏi
const questionSchema = {
  type: Type.OBJECT,
  propertyOrdering: [
    'type',
    'difficulty',
    'content',
    'choices',
    'sub_questions',
    'step_by_step_solution',
    'correct_answer',
    'tags',
  ],
  properties: {
    type: { type: Type.STRING, enum: ['multiple_choice', 'true_false_group', 'short_answer', 'essay'] },
    difficulty: { type: Type.STRING, enum: ['nhan_biet', 'thong_hieu', 'van_dung', 'van_dung_cao'] },
    content: { type: Type.STRING },
    choices: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        propertyOrdering: ['key', 'text'],
        properties: {
          key: { type: Type.STRING, enum: ['A', 'B', 'C', 'D'] },
          text: { type: Type.STRING },
        },
        required: ['key', 'text'],
      },
    },
    sub_questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        propertyOrdering: ['key', 'content', 'explanation', 'isCorrect'],
        properties: {
          key: { type: Type.STRING, enum: ['a', 'b', 'c', 'd'] },
          content: { type: Type.STRING },
          explanation: { type: Type.STRING },
          isCorrect: { type: Type.BOOLEAN },
        },
        required: ['key', 'content', 'explanation', 'isCorrect'],
      },
    },
    step_by_step_solution: { type: Type.STRING },
    correct_answer: { type: Type.STRING },
    tags: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ['type', 'difficulty', 'content', 'step_by_step_solution'],
};

// 2. Zod Validator cho Question
const ChoiceSchema = z.object({
  key: z.enum(['A', 'B', 'C', 'D']),
  text: z.string().min(1),
});

const SubQuestionSchema = z.object({
  key: z.enum(['a', 'b', 'c', 'd']),
  content: z.string().min(1),
  explanation: z.string().optional(),
  isCorrect: z.boolean(),
});

const QuestionZodSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['multiple_choice', 'true_false_group', 'short_answer', 'essay']),
  difficulty: z.enum(['nhan_biet', 'thong_hieu', 'van_dung', 'van_dung_cao']),
  content: z.string().min(1),
  choices: z.array(ChoiceSchema).optional(),
  sub_questions: z.array(SubQuestionSchema).optional(),
  step_by_step_solution: z.string().min(1),
  correct_answer: z.string().optional(),
  tags: z.array(z.string()).optional(),
}).superRefine((q, ctx) => {
  if (q.type === 'multiple_choice') {
    if (!q.choices || q.choices.length !== 4) {
      ctx.addIssue({ code: 'custom', message: 'Câu hỏi trắc nghiệm bắt buộc phải có đúng 4 lựa chọn A, B, C, D.' });
    }
    if (!q.correct_answer || !['A', 'B', 'C', 'D'].includes(q.correct_answer)) {
      ctx.addIssue({ code: 'custom', message: 'Đáp án đúng phải là một trong các nhãn A, B, C, D.' });
    }
  } else if (q.type === 'true_false_group') {
    if (!q.sub_questions || q.sub_questions.length !== 4) {
      ctx.addIssue({ code: 'custom', message: 'Câu hỏi Đúng/Sai bắt buộc phải có đúng 4 ý a, b, c, d.' });
    }
  } else if (q.type === 'short_answer') {
    if (!q.correct_answer || !q.correct_answer.trim()) {
      ctx.addIssue({ code: 'custom', message: 'Câu hỏi trả lời ngắn bắt buộc phải có đáp số.' });
    }
  }
});

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const currentUser = await requireAuth();
    assertRequestAccount(req.headers, currentUser.id);
    if (!isSameOriginMutation(req)) throw new ApiError(403, 'Yêu cầu không hợp lệ');
    const body = await req.json();
    const { question, action, customPrompt, customInstruction } = body as {
      question: Question;
      action: TweakAction;
      customPrompt?: string;
      customInstruction?: string;
      customApiKey?: string;
    };

    const customApiKey = requestApiKey(body);
    if (!question || typeof question.content !== 'string') throw new ApiError(400, 'Thiếu câu hỏi gốc');

    let actionInstruction = '';
    switch (action) {
      case 'change_numbers':
        actionInstruction = 'Giữ nguyên cấu trúc và phương pháp giải của bài toán gốc, chỉ thay đổi các số liệu, hệ số thành các số nguyên đẹp hoặc phân số tối giản. Tính toán lại toàn bộ lời giải chi tiết và chốt lại đáp án chính xác.';
        break;
      case 'similar_question':
        actionInstruction = 'Tạo một câu hỏi hoàn toàn mới có cùng chủ đề kiến thức, cùng mức độ nhận thức và định dạng với câu hỏi gốc.';
        break;
      case 'increase_difficulty':
        actionInstruction = 'Nâng cấp câu hỏi lên mức độ tư duy cao hơn (từ Thông hiểu lên Vận dụng, hoặc Vận dụng lên Vận dụng cao), thêm bẫy toán học hoặc dữ kiện ẩn.';
        break;
      case 'decrease_difficulty':
        actionInstruction = 'Đơn giản hóa câu hỏi về mức độ nhận biết hoặc thông hiểu cơ bản, số liệu trực quan, dễ tính toán.';
        break;
      case 'custom':
        actionInstruction = customPrompt || customInstruction || 'Chỉnh sửa câu hỏi theo yêu cầu sư phạm.';
        break;
    }

    const systemPrompt = `
Bạn là chuyên gia ra đề thi chuẩn GDPT 2018.
Nhiệm vụ: Nhận một câu hỏi gốc và thực hiện lệnh chỉnh sửa vi mô.
Yêu cầu bắt buộc:
1. Đảm bảo toàn bộ công thức toán học/ký hiệu khoa học bọc trong dấu $...$ (nội dòng) hoặc $$...$$ (khối).
2. Viết chi tiết step_by_step_solution trước khi chọn correct_answer.
3. Lời giải KHÔNG nhắc chữ cái đáp án ("chọn A", "đáp án B"); chỉ nêu giá trị hoặc kết luận toán học.
4. Trả về đúng 1 JSON Object khớp cấu trúc Question, không có text chào hỏi.
`;

    const userPrompt = `
Câu hỏi gốc:
${JSON.stringify(question, null, 2)}

Yêu cầu chỉnh sửa:
${actionInstruction}
`;


    const responseText = await executeWithKeyRotation(customApiKey, async (apiKey, modelName) => {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: modelName,
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          responseSchema: questionSchema,
          temperature: 0.4,
        },
      });
      return response.text || '{}';
    }, { userId: currentUser.id, endpoint: 'question.tweak' });

    const parsedRaw = parseProviderJson(responseText) as ReturnType<typeof JSON.parse>;
    const validationResult = QuestionZodSchema.safeParse(parsedRaw);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: `Dữ liệu chỉnh sửa chưa khớp cấu trúc: ${validationResult.error.issues.map(i => i.message).join('; ')}`,
        },
        { status: 422 }
      );
    }

    const syncedFigures = syncQuestionFigures(question.figures, validationResult.data.content);

    const parsedQuestion: Question = {
      ...validationResult.data,
      id: question.id || `q_${Date.now()}`,
      figures: syncedFigures,
    };

    return NextResponse.json({
      success: true,
      question: parsedQuestion,
      isFallback: false,
    });
  } catch (error: unknown) {
    if (error instanceof Error && ['API_KEY_INPUT_INVALID', 'API_KEY_INPUT_CONFLICT'].includes(error.message)) return NextResponse.json({ error: 'Thông tin khóa không hợp lệ hoặc có nhiều giá trị khác nhau' }, { status: 400 });
    return apiErrorResponse(error, 'Chưa thể sửa câu hỏi bằng AI');
  }
}
