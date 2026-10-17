import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { z } from 'zod';
import { Question } from '@/types/exam';
import { executeWithKeyRotation, getGeminiModel, getAllGeminiKeys } from '@/lib/gemini-keys';
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, action, customPrompt, customInstruction, customApiKey } = body as {
      question: Question;
      action: TweakAction;
      customPrompt?: string;
      customInstruction?: string;
      customApiKey?: string;
    };

    const allKeys = getAllGeminiKeys();
    const hasKeys = (customApiKey && customApiKey.trim()) || allKeys.length > 0;

    if (!hasKeys) {
      // Giả lập biến đổi câu hỏi nếu chưa nhập API Key
      if (action === 'change_numbers') {
        const tweaked = { ...question };
        tweaked.id = `q_tweaked_${Date.now()}`;
        tweaked.content = question.content.replace(/2x \+ 1/g, '3x - 2').replace(/x - 3/g, 'x + 1');
        tweaked.step_by_step_solution = 'Số liệu đã được cập nhật mô phỏng (Vui lòng nhập API Key để AI tính toán tự động chính xác nhất).';
        return NextResponse.json({ success: true, question: tweaked, isFallback: true });
      }

      return NextResponse.json({
        success: true,
        question: { ...question, id: `q_tweaked_${Date.now()}` },
        isFallback: true,
      });
    }

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

    const modelName = getGeminiModel();

    const responseText = await executeWithKeyRotation(customApiKey, async (apiKey) => {
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
    });

    const parsedRaw = JSON.parse(responseText);
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
    const err = error as Error;
    console.error('API Tweak Question Error:', err);
    let msg = err.message || 'Lỗi khi biến đổi câu hỏi bằng AI';
    if (typeof msg === 'string') {
      if (msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('high demand')) {
        msg = 'Máy chủ Google AI hiện đang quá tải tạm thời (Spikes in demand 503). Hệ thống đã tự động thử xoay tua qua các API Key. Thầy/Cô vui lòng bấm thử lại sau vài giây.';
      } else if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
        msg = 'Các API Key hiện đã đạt hạn mức lượt gọi (Rate Limit 429). Thầy/Cô vui lòng đợi khoảng 15-30 giây rồi thử lại.';
      }
    }
    return NextResponse.json(
      {
        success: false,
        error: msg,
      },
      { status: 500 }
    );
  }
}
