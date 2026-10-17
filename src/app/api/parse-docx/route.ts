import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';
import { GoogleGenAI, Type } from '@google/genai';
import { z } from 'zod';
import { executeWithKeyRotation, getGeminiModel } from '@/lib/gemini-keys';

const ChoiceItemZod = z.object({
  key: z.string(),
  text: z.string(),
});

const TrueFalseSubItemZod = z.object({
  key: z.string(),
  content: z.string(),
  isCorrect: z.boolean().default(true),
  explanation: z.string().optional(),
});

const DocxQuestionZod = z.object({
  type: z.enum(['multiple_choice', 'true_false_group', 'short_answer', 'essay']).default('multiple_choice'),
  difficulty: z.enum(['nhan_biet', 'thong_hieu', 'van_dung', 'van_dung_cao']).default('thong_hieu'),
  content: z.string().min(1),
  choices: z.array(ChoiceItemZod).optional(),
  sub_questions: z.array(TrueFalseSubItemZod).optional(),
  step_by_step_solution: z.string().default('Lời giải đang được cập nhật.'),
  correct_answer: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const DocxResponseZod = z.object({
  questions: z.array(DocxQuestionZod),
});

const parseResponseSchema = {
  type: Type.OBJECT,
  properties: {
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, enum: ['multiple_choice', 'true_false_group', 'short_answer', 'essay'] },
          difficulty: { type: Type.STRING, enum: ['nhan_biet', 'thong_hieu', 'van_dung', 'van_dung_cao'] },
          content: { type: Type.STRING },
          choices: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
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
              properties: {
                key: { type: Type.STRING, enum: ['a', 'b', 'c', 'd'] },
                content: { type: Type.STRING },
                explanation: { type: Type.STRING },
                isCorrect: { type: Type.BOOLEAN },
              },
              required: ['key', 'content', 'isCorrect'],
            },
          },
          step_by_step_solution: { type: Type.STRING },
          correct_answer: { type: Type.STRING },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['type', 'difficulty', 'content', 'step_by_step_solution'],
      },
    },
  },
  required: ['questions'],
};

export async function POST(req: NextRequest) {
  try {
    let fileBuffer: Buffer | null = null;
    let userApiKey: string | undefined = undefined;

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      userApiKey = (formData.get('userApiKey') as string) || undefined;

      if (!file) {
        return NextResponse.json(
          { success: false, error: 'Không tìm thấy file Word được tải lên.' },
          { status: 400 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
    } else {
      const body = await req.json();
      if (body.docxBase64) {
        let clean = body.docxBase64;
        if (clean.includes(';base64,')) {
          clean = clean.split(';base64,')[1];
        }
        fileBuffer = Buffer.from(clean, 'base64');
      }
      userApiKey = body.userApiKey;
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Nội dung file Word bị rỗng hoặc không đúng định dạng.' },
        { status: 400 }
      );
    }

    // 1. Dùng mammoth để trích xuất văn bản thô từ file docx
    const mammothResult = await mammoth.extractRawText({ buffer: fileBuffer });
    const rawText = mammothResult.value;

    if (!rawText || rawText.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'File Word không chứa nội dung văn bản có thể đọc được.' },
        { status: 400 }
      );
    }

    // 2. Dùng Gemini AI để phân rã cấu trúc câu hỏi
    const prompt = `
Bạn là chuyên gia phân tích đề thi sư phạm chuẩn Bộ Giáo Dục Việt Nam.
Hãy đọc kỹ đoạn văn bản trích xuất từ file Word dưới đây và chuyển đổi toàn bộ các câu hỏi thành danh sách JSON chuẩn:

QUY TẮC BẮT BUỘC:
1. Nhận diện các câu hỏi: Câu 1, Câu 2, ..., các phương án A, B, C, D.
2. Công thức toán, lí, hoá phải được bọc trong $...$ hoặc $$...$$.
3. Với câu hỏi dạng Đúng/Sai (chuẩn GDPT 2018), tách thành 4 ý a), b), c), d) trong mảng sub_questions.
4. Tự động xác định type (multiple_choice, true_false_group, short_answer, essay).
5. Phân tích lời giải và tìm đáp án đúng (A/B/C/D hoặc số) gán vào correct_answer.
6. ĐẶC BIỆT VỚI ĐỀ THI TỰ LUẬN PHÂN CẤP (như Đề Vào 10, Đề kiểm tra tự luận):
   - Khi gặp cấu trúc phân cấp: "Câu I", "Câu II", "Câu III", "Bài 1", "Bài 2" có phần mở đầu/biểu thức chung và các ý nhỏ 1), 2), 3) hoặc a), b), c):
   - BẮT BUỘC coi mỗi "Câu I", "Câu II" là MỘT CÂU HỎI TỰ LUẬN HOÀN CHỈNH (type: 'essay').
   - Trong content: Giữ trọn vẹn phần dẫn chung và toàn bộ các ý con 1), 2), 3).
   - TUYỆT ĐỐI KHÔNG xé nhỏ từng ý thành các câu hỏi riêng biệt.

VĂN BẢN ĐỀ THI TỪ FILE WORD:
${rawText.slice(0, 45000)}
`;

    const modelName = getGeminiModel();

    const aiResult = await executeWithKeyRotation(userApiKey, async (apiKey: string) => {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: parseResponseSchema,
          temperature: 0.2,
        },
      });
      return response.text || '{}';
    });

    if (!aiResult || aiResult === '{}') {
      return NextResponse.json(
        { success: false, error: 'AI không thể phân tích văn bản từ file Word.' },
        { status: 500 }
      );
    }

    const rawParsed = JSON.parse(aiResult);
    const validated = DocxResponseZod.parse(rawParsed);

    const questions = validated.questions.map((q, idx) => ({
      ...q,
      id: `docx_${Date.now()}_${idx + 1}`,
      status: 'draft' as const,
      aiGenerated: true,
      source: 'Word (.docx) Ingestion',
    }));

    return NextResponse.json({
      success: true,
      rawTextSnippet: rawText.slice(0, 500),
      questions,
      totalCount: questions.length,
    });
  } catch (error: any) {
    console.error('Lỗi khi bóc tách file Word:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Không thể bóc tách nội dung file Word.',
      },
      { status: 500 }
    );
  }
}
