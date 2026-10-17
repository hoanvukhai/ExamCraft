import { NextRequest, NextResponse } from 'next/server';
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

const OcrQuestionZod = z.object({
  id: z.string().default(() => `ocr_q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`),
  type: z.enum(['multiple_choice', 'true_false_group', 'short_answer', 'essay']).default('multiple_choice'),
  difficulty: z.enum(['nhan_biet', 'thong_hieu', 'van_dung', 'van_dung_cao']).default('thong_hieu'),
  content: z.string().min(1, 'Nội dung câu hỏi không được rỗng'),
  choices: z.array(ChoiceItemZod).optional(),
  correct_answer: z.string().optional(),
  step_by_step_solution: z.string().default('Lời giải đang được cập nhật.'),
  sub_questions: z.array(TrueFalseSubItemZod).optional(),
  points: z.number().optional(),
  tags: z.array(z.string()).optional(),
});

const OcrResponseZod = z.object({
  questions: z.array(OcrQuestionZod),
});

const geminiOcrSchema = {
  type: Type.OBJECT,
  properties: {
    questions: {
      type: Type.ARRAY,
      description: 'Danh sách các câu hỏi bóc tách được từ hình ảnh đề thi',
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          type: {
            type: Type.STRING,
            enum: ['multiple_choice', 'true_false_group', 'short_answer', 'essay'],
            description: 'Phân loại câu hỏi: multiple_choice (4 lựa chọn A-B-C-D), true_false_group (Đúng/Sai a-b-c-d), short_answer (trả lời ngắn), essay (tự luận)',
          },
          difficulty: {
            type: Type.STRING,
            enum: ['nhan_biet', 'thong_hieu', 'van_dung', 'van_dung_cao'],
          },
          content: {
            type: Type.STRING,
            description: 'Đề bài câu hỏi, công thức toán học bắt buộc bọc trong $...$ hoặc $$...$$',
          },
          choices: {
            type: Type.ARRAY,
            description: 'Danh sách 4 phương án A, B, C, D (dùng cho multiple_choice)',
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
            description: 'Danh sách 4 mệnh đề a, b, c, d (dùng cho true_false_group)',
            items: {
              type: Type.OBJECT,
              properties: {
                key: { type: Type.STRING, enum: ['a', 'b', 'c', 'd'] },
                content: { type: Type.STRING },
                isCorrect: { type: Type.BOOLEAN },
                explanation: { type: Type.STRING },
              },
              required: ['key', 'content', 'isCorrect'],
            },
          },
          step_by_step_solution: {
            type: Type.STRING,
            description: 'Lời giải chi tiết từng bước, không chứa chữ cái đáp án A/B/C/D',
          },
          correct_answer: {
            type: Type.STRING,
            description: 'Ký tự đáp án đúng (ví dụ: A, B, C, D hoặc giá trị số cho short_answer)',
          },
          tags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ['id', 'type', 'difficulty', 'content', 'step_by_step_solution'],
      },
    },
  },
  required: ['questions'],
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64, mimeType = 'image/jpeg', subject = 'toan', userApiKey } = body;

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Dữ liệu ảnh không hợp lệ hoặc bị rỗng.' },
        { status: 400 }
      );
    }

    // Làm sạch chuỗi Base64 nếu có chứa data URI prefix
    let cleanBase64 = imageBase64;
    let detectedMime = mimeType;
    if (imageBase64.includes(';base64,')) {
      const parts = imageBase64.split(';base64,');
      detectedMime = parts[0].replace('data:', '');
      cleanBase64 = parts[1];
    }

    const promptText = `
Bạn là chuyên gia số hóa đề thi sư phạm hàng đầu Việt Nam.
Hãy quan sát kỹ bức ảnh đề thi đính kèm và thực hiện các nhiệm vụ sau:
1. Nhận diện và bóc tách TOÀN BỘ các câu hỏi có trong ảnh thành các Object câu hỏi có cấu trúc.
2. Công thức toán học, vật lí, hóa học bắt buộc phải chuyển đổi sang mã KaTeX chuẩn mực bọc trong $...$ (inline) hoặc $$...$$ (display block).
3. Tuyệt đối không để sót các lựa chọn A, B, C, D của câu trắc nghiệm.
4. Với câu hỏi dạng Đúng/Sai (chuẩn GDPT 2018), tách thành 4 ý a), b), c), d) trong mảng sub_questions.
5. Nếu trong đề đã có khoanh sẵn đáp án đúng, hãy giữ lại đáp án đó. Nếu không có đáp án, hãy giải chi tiết và điền đáp án đúng vào correct_answer.
6. Môn học dự kiến: ${subject}. Mọi câu hỏi phải giữ nguyên văn bản tiếng Việt chuẩn, không thêm bớt sai lệch nội dung gốc.
7. ĐẶC BIỆT ĐỐI VỚI ĐỀ THI TỰ LUẬN PHÂN CẤP (như Đề tuyển sinh Vào 10, Đề thi tự luận Toán/Văn/Lý/Hóa):
   - Khi gặp cấu trúc phân cấp: "Câu I (1,5 điểm)", "Câu II (1,5 điểm)", "Câu III (2,5 điểm)", "Bài 1", "Bài 2" có phần mở đầu/biểu thức chung và các ý nhỏ 1), 2), 3) hoặc a), b), c):
   - BẮT BUỘC coi mỗi "Câu I", "Câu II", "Câu III" là MỘT CÂU HỎI TỰ LUẬN HOÀN CHỈNH (type: 'essay').
   - Trong content: Giữ trọn vẹn cả tiêu đề câu, điểm số (ví dụ: "Câu II (1,5 điểm)"), phần dẫn chung (ví dụ: "Cho hai biểu thức A = ... và B = ..."), và toàn bộ các ý hỏi 1), 2), 3).
   - TUYỆT ĐỐI KHÔNG XÉ NHỎ các ý 1), 2), 3) thành các câu hỏi riêng biệt, vì sẽ làm mất ngữ cảnh chung của bài toán.
   - Trong step_by_step_solution: Trình bày chi tiết lời giải cho từng ý 1), 2), 3) đầy đủ, chuẩn xác.
`;

    const modelName = getGeminiModel();

    const result = await executeWithKeyRotation(userApiKey, async (apiKey: string) => {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [
          {
            inlineData: {
              mimeType: detectedMime,
              data: cleanBase64,
            },
          },
          {
            text: promptText,
          },
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: geminiOcrSchema,
          temperature: 0.2, // Giảm temperature để OCR chuẩn xác tuyệt đối
        },
      });

      return response.text || '{}';
    });

    if (!result || result === '{}') {
      return NextResponse.json(
        { success: false, error: 'Không nhận được dữ liệu phản hồi từ AI Vision.' },
        { status: 500 }
      );
    }

    const rawParsed = JSON.parse(result);
    const validated = OcrResponseZod.parse(rawParsed);

    // Gán ID duy nhất và nhãn draft cho từng câu hỏi
    const questions = validated.questions.map((q, idx) => ({
      ...q,
      id: `ocr_${Date.now()}_${idx + 1}`,
      status: 'draft' as const,
      aiGenerated: true,
      source: 'Gemini Multimodal OCR',
    }));

    return NextResponse.json({
      success: true,
      questions,
      totalCount: questions.length,
    });
  } catch (error: any) {
    console.error('Lỗi API OCR Image:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Không thể xử lý ảnh đề thi.',
      },
      { status: 500 }
    );
  }
}
