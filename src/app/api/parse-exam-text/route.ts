import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { z } from 'zod';
import { Question } from '@/types/exam';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { executeWithKeyRotation, getGeminiModel } from '@/lib/gemini-keys';

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

const parseResponseSchema = {
  type: Type.OBJECT,
  properties: {
    questions: { type: Type.ARRAY, items: questionSchema },
  },
  required: ['questions'],
};

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
});

const ParseResultSchema = z.object({
  questions: z.array(QuestionZodSchema).min(1),
});

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    const body = await req.json();
    const { rawText, customApiKey } = body as { rawText: string; customApiKey?: string };

    if (!rawText || !rawText.trim()) {
      return NextResponse.json({ success: false, error: 'Vui lòng cung cấp nội dung đề thi cần bóc tách.' }, { status: 400 });
    }

    // Giới hạn độ dài đầu vào tối đa 50.000 ký tự
    if (rawText.length > 50000) {
      return NextResponse.json({ success: false, error: 'Nội dung đề thi quá dài (vượt quá 50.000 ký tự). Vui lòng chia nhỏ tài liệu.' }, { status: 400 });
    }

    let hasKeys = Boolean(customApiKey && customApiKey.trim());
    if (!hasKeys && currentUser) {
      const activeCount = await prisma.userApiKey.count({
        where: { userId: currentUser.id, isActive: true },
      });
      hasKeys = activeCount > 0;
    }

    if (!hasKeys) {
      return NextResponse.json({
        success: false,
        error: 'Tài khoản chưa có Google Gemini API Key. Thầy/Cô vui lòng thêm khóa API trong mục Kho Khóa AI.',
      }, { status: 401 });
    }

    const systemPrompt = `
Bạn là chuyên gia số hóa đề thi cho giáo viên Việt Nam.
Nhiệm vụ: Nhận một đoạn văn bản đề thi thô (có thể copy từ Word, PDF, Web) và bóc tách thành danh sách các câu hỏi chuẩn cấu trúc JSON.

QUY TẮC BẮT BUỘC:
1. TOÀN BỘ công thức toán học, ký hiệu khoa học, phương trình hoá học phải được bọc trong dấu $...$ (inline) hoặc $$...$$ (display).
2. Tách chính xác các phương án trắc nghiệm A, B, C, D (nếu có).
3. Nếu đề bài có sẵn đáp án đúng, hãy gán vào trường correct_answer. Nếu không có, hãy tự giải và điền đáp án đúng.
4. Tự động viết lời giải chi tiết cho từng câu trong trường step_by_step_solution.
5. Lời giải KHÔNG nhắc chữ cái đáp án ("chọn A", "đáp án B"); chỉ nêu giá trị hoặc kết luận toán học.
6. ĐẶC BIỆT VỚI ĐỀ THI TỰ LUẬN PHÂN CẤP (như Đề Vào 10, Đề kiểm tra tự luận):
   - Khi gặp cấu trúc phân cấp: "Câu I", "Câu II", "Câu III", "Bài 1", "Bài 2" có phần mở đầu/biểu thức chung và các ý nhỏ 1), 2), 3) hoặc a), b), c):
   - BẮT BUỘC coi mỗi "Câu I", "Câu II" là MỘT CÂU HỎI TỰ LUẬN HOÀN CHỈNH (type: 'essay').
   - Trong content: Giữ trọn vẹn phần dẫn chung và toàn bộ các ý con 1), 2), 3).
   - TUYỆT ĐỐI KHÔNG xé nhỏ từng ý thành các câu hỏi riêng biệt.
`;

    const modelName = getGeminiModel();

    const responseText = await executeWithKeyRotation(
      customApiKey,
      async (apiKey) => {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: modelName,
          contents: rawText,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
            responseSchema: parseResponseSchema,
            temperature: 0.2,
          },
        });
        return response.text || '{}';
      },
      {
        userId: currentUser?.id,
        endpoint: 'exam.parse',
      }
    );

    const parsedRaw = JSON.parse(responseText);
    const validationResult = ParseResultSchema.safeParse(parsedRaw);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: `Dữ liệu bóc tách không đúng định dạng: ${validationResult.error.issues.map(i => i.message).join('; ')}`,
        },
        { status: 422 }
      );
    }

    const questions: Question[] = validationResult.data.questions.map((q, idx) => ({
      id: q.id || `q_parsed_${Date.now()}_${idx + 1}`,
      type: q.type,
      difficulty: q.difficulty,
      content: q.content,
      choices: q.choices,
      correct_answer: q.correct_answer,
      step_by_step_solution: q.step_by_step_solution,
      sub_questions: q.sub_questions,
      tags: q.tags || ['AI_Parsed'],
    }));

    return NextResponse.json({
      success: true,
      questions,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('API Parse Exam Text Error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Lỗi khi bóc tách văn bản đề thi',
      },
      { status: 500 }
    );
  }
}
