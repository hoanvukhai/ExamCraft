import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { z } from 'zod';
import { GenerationParams, Question, Exam } from '@/types/exam';
import { executeWithKeyRotation, getGeminiModel } from '@/lib/gemini-keys';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Bộ đề mẫu sẵn có chuẩn xác 100% nếu chưa cấu hình API Key
function getFallbackExam(params: GenerationParams): Exam {
  const isMath12 = params.grade === 12 && params.subject === 'toan';

  const sampleQuestions: Question[] = isMath12
    ? [
        {
          id: 'q_sample_1',
          type: 'multiple_choice',
          difficulty: 'nhan_biet',
          content: 'Cho hàm số $y = \\frac{2x + 1}{x - 3}$. Đường tiệm cận ngang của đồ thị hàm số có phương trình là:',
          choices: [
            { key: 'A', text: '$y = 2$' },
            { key: 'B', text: '$x = 3$' },
            { key: 'C', text: '$y = -\\frac{1}{3}$' },
            { key: 'D', text: '$x = -\\frac{1}{2}$' },
          ],
          correct_answer: 'A',
          step_by_step_solution: 'Ta có $\\lim_{x \\to \\pm\\infty} y = \\lim_{x \\to \\pm\\infty} \\frac{2x + 1}{x - 3} = \\lim_{x \\to \\pm\\infty} \\frac{2 + \\frac{1}{x}}{1 - \\frac{3}{x}} = 2$. Do đó tiệm cận ngang là đường thẳng $y = 2$.',
          tags: ['Tiem_can', 'Ham_so'],
        },
        {
          id: 'q_sample_2',
          type: 'multiple_choice',
          difficulty: 'thong_hieu',
          content: 'Tìm tập xác định $D$ của hàm số $y = (x^2 - 4)^{-3}$.',
          choices: [
            { key: 'A', text: '$D = \\mathbb{R} \\setminus \\{-2; 2\\}$' },
            { key: 'B', text: '$D = (-2; 2)$' },
            { key: 'C', text: '$D = \\mathbb{R}$' },
            { key: 'D', text: '$D = (-\\infty; -2) \\cup (2; +\\infty)$' },
          ],
          correct_answer: 'A',
          step_by_step_solution: 'Vì số mũ $-3 \\in \\mathbb{Z}^-$, hàm số xác định khi và chỉ khi $x^2 - 4 \\ne 0 \\Leftrightarrow x \\ne \\pm 2$. Vậy tập xác định là $D = \\mathbb{R} \\setminus \\{-2; 2\\}$.',
          tags: ['Tap_xac_dinh', 'Ham_so_luy_thua'],
        },
        {
          id: 'q_sample_3',
          type: 'multiple_choice',
          difficulty: 'van_dung',
          content: 'Biết $\\int_{1}^{2} \\frac{x + 1}{x^2 + 2x} dx = a\\ln 2 + b\\ln 3$ với $a, b \\in \\mathbb{Q}$. Tính giá trị biểu thức $S = 2a + 3b$.',
          choices: [
            { key: 'A', text: '$S = \\frac{3}{2}$' },
            { key: 'B', text: '$S = 2$' },
            { key: 'C', text: '$S = 1$' },
            { key: 'D', text: '$S = -\\frac{1}{2}$' },
          ],
          correct_answer: 'A',
          step_by_step_solution: 'Đặt $t = x^2 + 2x \\Rightarrow dt = 2(x + 1)dx \\Rightarrow (x + 1)dx = \\frac{1}{2}dt$.\nĐổi cận: $x = 1 \\Rightarrow t = 3$; $x = 2 \\Rightarrow t = 8$.\nKhi đó: $I = \\int_{3}^{8} \\frac{1}{2t} dt = \\frac{1}{2} \\ln|t| \\Big|_3^8 = \\frac{1}{2}(\\ln 8 - \\ln 3) = \\frac{1}{2}(3\\ln 2 - \\ln 3) = \\frac{3}{2}\\ln 2 - \\frac{1}{2}\\ln 3$.\nSuy ra $a = \\frac{3}{2}$ và $b = -\\frac{1}{2}$.\nDo đó $S = 2\\left(\\frac{3}{2}\\right) + 3\\left(-\\frac{1}{2}\\right) = 3 - \\frac{3}{2} = \\frac{3}{2}$.',
          tags: ['Tich_phan', 'Doi_bien'],
        },
        {
          id: 'q_sample_4',
          type: 'true_false_group',
          difficulty: 'thong_hieu',
          content: 'Cho hàm số $y = f(x) = x^3 - 3x^2 + 2$. Xét tính đúng/sai của các mệnh đề sau:',
          sub_questions: [
            { key: 'a', content: 'Hàm số đã cho đồng biến trên khoảng $(0; 2)$.', isCorrect: false, explanation: '$f\'(x) = 3x^2 - 6x = 3x(x - 2) < 0$ trên $(0; 2)$ nên hàm số nghịch biến.' },
            { key: 'b', content: 'Điểm cực đại của đồ thị hàm số là $(0; 2)$.', isCorrect: true, explanation: '$f\'(x) = 0 \\Leftrightarrow x = 0$ hoặc $x = 2$. Qua $x = 0$, $f\'$ đổi dấu từ dương sang âm, $f(0) = 2$.' },
            { key: 'c', content: 'Giá trị nhỏ nhất của hàm số trên đoạn $[-1; 1]$ bằng $-2$.', isCorrect: true, explanation: 'Xét trên $[-1; 1]$: $f(-1) = -2, f(0) = 2, f(1) = 0$. Vậy GTNN là $-2$.' },
            { key: 'd', content: 'Đồ thị hàm số nhận điểm $I(1; 0)$ làm tâm đối xứng.', isCorrect: true, explanation: '$f\'\'(x) = 6x - 6 = 0 \\Leftrightarrow x = 1 \\Rightarrow y = 0$. Điểm uốn $I(1; 0)$ là tâm đối xứng.' },
          ],
          correct_answer: 'a:S, b:Đ, c:Đ, d:Đ',
          step_by_step_solution: '1. $f\'(x) = 3x^2 - 6x = 3x(x - 2)$. Suy ra $f\'(x) < 0$ trên $(0; 2)$, do đó mệnh đề a Sai.\n2. Cực đại tại $x = 0, y = 2$, đồ thị có điểm CĐ $(0; 2)$, mệnh đề b Đúng.\n3. Trên $[-1; 1]$, so sánh $f(-1)=-2, f(0)=2, f(1)=0 \\Rightarrow \\min = -2$, mệnh đề c Đúng.\n4. Điểm uốn $f\'\'(x) = 0 \\Leftrightarrow x = 1, y = 0 \\Rightarrow I(1; 0)$ là tâm đối xứng, mệnh đề d Đúng.',
          tags: ['Khao_sat_ham_so', 'Dung_Sai'],
        },
        {
          id: 'q_sample_5',
          type: 'short_answer',
          difficulty: 'van_dung',
          content: 'Một công ty sản xuất muốn thiết kế một thùng chứa hình hộp chữ nhật không nắp có thể tích $V = 32\\text{ m}^3$. Đáy thùng là hình vuông cạnh $x$ (mét). Chiều cao thùng bằng bao nhiêu mét để tổng diện tích vật liệu làm thùng đạt giá trị nhỏ nhất?',
          correct_answer: '2',
          step_by_step_solution: 'Thể tích: $V = x^2 h = 32 \\Rightarrow h = \\frac{32}{x^2}$.\nDiện tích toàn phần không nắp: $S(x) = x^2 + 4xh = x^2 + 4x\\left(\\frac{32}{x^2}\\right) = x^2 + \\frac{128}{x}$ với $x > 0$.\n$S\'(x) = 2x - \\frac{128}{x^2} = 0 \\Leftrightarrow 2x^3 = 128 \\Leftrightarrow x^3 = 64 \\Leftrightarrow x = 4$.\nKhi $x = 4$, chiều cao $h = \\frac{32}{4^2} = \\frac{32}{16} = 2\\text{ m}$.\nVậy chiều cao cần tìm là $2$.',
          tags: ['Toan_thuc_te', 'Gia_tri_lon_nhat_nho_nhat'],
        },
      ]
    : [
        {
          id: 'q_sample_gen_1',
          type: 'multiple_choice',
          difficulty: 'nhan_biet',
          content: `Câu hỏi mẫu môn ${params.subject.toUpperCase()} Lớp ${params.grade}: Cho bài toán cơ bản thuộc chủ đề ${params.topic || 'Kiến thức trọng tâm'}. Khẳng định nào sau đây đúng?`,
          choices: [
            { key: 'A', text: 'Khẳng định cơ bản A đúng quy chuẩn' },
            { key: 'B', text: 'Khẳng định phương án B' },
            { key: 'C', text: 'Khẳng định phương án C' },
            { key: 'D', text: 'Khẳng định phương án D' },
          ],
          correct_answer: 'A',
          step_by_step_solution: 'Dựa vào định nghĩa và lý thuyết trong chương trình SGK, ta suy ra đáp án A là chính xác.',
          tags: ['Co_ban'],
        },
      ];

  return {
    id: `exam-${Date.now()}`,
    metadata: {
      title: `ĐỀ KIỂM TRA ĐỊNH KỲ MÔN ${params.subject.toUpperCase()}`,
      schoolName: 'SỞ GIÁO DỤC VÀ ĐÀO TẠO',
      departmentName: 'TRƯỜNG THPT CHUYÊN',
      subject: params.subject,
      grade: params.grade,
      durationMinutes: params.durationMinutes || 45,
      examCode: '101',
      academicYear: '2025 - 2026',
      notes: 'Học sinh không được sử dụng tài liệu. Cán bộ coi thi không giải thích gì thêm.',
      integratedSubBranch: params.integratedSubBranch || 'all',
      curriculumTrack: params.curriculumTrack || 'core',
    },
    questions: sampleQuestions,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// 1. Gemini Response Schema
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

const examResponseSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    questions: { type: Type.ARRAY, items: questionSchema },
  },
  required: ['title', 'questions'],
};

// 2. Zod Validator để kiểm tra logic sư phạm chặt chẽ
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

const ExamZodSchema = z.object({
  title: z.string().optional(),
  questions: z.array(QuestionZodSchema).min(1),
});

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    const body = await req.json();
    const { params, customApiKey } = body as { params: GenerationParams; customApiKey?: string };

    let hasKeys = Boolean(customApiKey && customApiKey.trim());
    if (!hasKeys && currentUser) {
      const activeCount = await prisma.userApiKey.count({
        where: { userId: currentUser.id, isActive: true },
      });
      hasKeys = activeCount > 0;
    }

    // Nếu người dùng chưa cấu hình API Key nào, trả về bộ đề mẫu chuẩn
    if (!hasKeys) {
      const fallbackExam = getFallbackExam(params);
      return NextResponse.json({
        success: true,
        exam: fallbackExam,
        isFallback: true,
        message: 'Đang dùng bộ đề mẫu tiêu chuẩn do tài khoản chưa thêm Google Gemini API Key. Nhấn vào Avatar hoặc mục "Kho Khóa AI" để thêm khóa của bạn!',
      });
    }

    const systemPrompt = `
Bạn là một chuyên gia khảo thí và giáo viên giỏi bậc nhất tại Việt Nam, am hiểu sâu sắc chương trình GDPT 2018 và Thông tư 17/2025/TT-BGDĐT.
Nhiệm vụ: Biên soạn đề thi chất lượng cao, đúng chuẩn cấu trúc thi của Bộ GD&ĐT.

KỶ LUẬT THÉP VỀ NỘI DUNG VÀ ĐỊNH DẠNG:
1. TOÀN BỘ công thức toán học, ký hiệu khoa học, phương trình phải được bọc trong dấu $...$ (nội dòng) hoặc $$...$$ (khối). Ví dụ: $x^2 - 4x + 3 = 0$, $\\frac{a}{b}$, $\\int_0^1 f(x)dx$.
2. KHÔNG BAO GIỜ dùng phân số viết tay dạng a/b trong văn bản khoa học, luôn dùng \\frac{a}{b}.
3. QUY TẮC "GIẢI TRƯỚC - CHỌN ĐÁP ÁN SAU":
   - Bắt buộc phải viết chi tiết trường step_by_step_solution trước và tính toán ra nghiệm cụ thể.
   - Sau đó mới gán đáp án chính xác vào correct_answer.
4. LỜI GIẢI KHÔNG ĐƯỢC NHẮC CHỮ CÁI PHƯƠNG ÁN ("chọn A", "đáp án B"); chỉ nêu giá trị hoặc kết luận toán học để bảo toàn khi trộn đề.
5. KHÔNG BAO GIỜ sinh các phương án phụ thuộc như "Cả A và B đều đúng", "Tất cả các đáp án trên đều sai".
6. CÁC PHƯƠNG ÁN KHÔNG ĐƯỢC CHỒNG LẤN NHAU (ví dụ khi hỏi khoảng đồng biến không đưa đồng thời $(-1;1)$ và $(0;1)$).
7. KHÔNG TẠO CÂU CẦN BẢNG BIẾN THIÊN / ĐỒ THỊ / HÌNH VẼ NẾU CHƯA CÓ DỮ LIỆU.
8. ĐÚNG/SAI: Bắt buộc đủ 4 ý a, b, c, d; mỗi ý có isCorrect (boolean) và explanation chi tiết.
9. TRẢ LỜI NGẮN: correct_answer là một số cụ thể (dùng dấu chấm thập phân).
10. PHÁP LÝ & DỮ LIỆU MỚI NHẤT (THÔNG TƯ 17/2025/TT-BGDĐT):
   - Đối với Lịch sử, Địa lí, Lịch sử và Địa lí, Giáo dục công dân, Giáo dục kinh tế & pháp luật:
     + BẮT BUỘC cập nhật địa giới hành chính mới nhất (sau các đợt sắp xếp, sáp nhập đơn vị hành chính cấp tỉnh, huyện, xã). Tuyệt đối không dùng địa danh hoặc đơn vị hành chính đã bị bãi bỏ.
     + BẮT BUỘC cập nhật số liệu thống kê kinh tế - xã hội, dân số, tài nguyên theo niên giám mới nhất (không dùng dữ liệu cũ trước 2020).
     + Cập nhật các nội dung mới của Hiến pháp sửa đổi và hệ thống văn bản pháp luật hiện hành.
`;

    // Diễn giải phân môn THCS nếu có
    let subBranchInstruction = '';
    if (params.integratedSubBranch && params.integratedSubBranch !== 'all') {
      const branchNames: Record<string, string> = {
        physics: 'Phân môn VẬT LÍ (Mạch Năng lượng và sự biến đổi). Tất cả câu hỏi phải thuộc kiến thức Vật lí.',
        chemistry: 'Phân môn HÓA HỌC (Mạch Chất và sự biến đổi của chất). Tất cả câu hỏi phải thuộc kiến thức Hóa học.',
        biology: 'Phân môn SINH HỌC (Mạch Vật sống). Tất cả câu hỏi phải thuộc kiến thức Sinh học.',
        history: 'Phân môn LỊCH SỬ. Tất cả câu hỏi phải thuộc kiến thức Lịch sử.',
        geography: 'Phân môn ĐỊA LÍ. Tất cả câu hỏi phải thuộc kiến thức Địa lí.',
      };
      subBranchInstruction = `- YÊU CẦU PHÂN MÔN: ${branchNames[params.integratedSubBranch] || ''}\n`;
    } else if (params.subject === 'khtn') {
      subBranchInstruction = `- YÊU CẦU ĐỀ TỔNG HỢP: Phân bổ cân đối số câu giữa 3 phân môn Vật lí, Hóa học và Sinh học.\n`;
    } else if (params.subject === 'lich_su_dia_ly') {
      subBranchInstruction = `- YÊU CẦU ĐỀ TỔNG HỢP: Phân bổ cân đối số câu giữa 2 phân môn Lịch sử và Địa lí.\n`;
    }

    // Diễn giải cụm chuyên đề THPT nếu có
    const trackInstruction = params.curriculumTrack === 'advanced_topic'
      ? '- KHUNG CHƯƠNG TRÌNH: CỤM CHUYÊN ĐỀ HỌC TẬP NÂNG CAO (35 tiết). Đề kiểm tra chuyên sâu định hướng vận dụng cao, mô hình hóa bài toán thực tế và thi đại học.\n'
      : '- KHUNG CHƯƠNG TRÌNH: Chương trình cốt lõi chuẩn GDPT 2018 (70 tiết).\n';

    const userPrompt = `
Hãy sinh đề thi cho:
- Môn: ${params.subject}
- Khối lớp: ${params.grade}
${subBranchInstruction}${trackInstruction}- Chủ đề: ${params.topic || 'Tổng hợp theo chương trình học'}
- Thời gian làm bài: ${params.durationMinutes} phút
- Số câu trắc nghiệm nhiều lựa chọn (Phần I): ${params.numMultipleChoice || 12}
- Số câu trắc nghiệm Đúng/Sai 4 ý a,b,c,d (Phần II): ${params.numTrueFalse || 4}
- Số câu trả lời ngắn / điền số (Phần III): ${params.numShortAnswer || 6}
- Số câu tự luận (Phần IV): ${params.numEssay || 0}
- Hướng dẫn bổ sung: ${params.customInstructions || 'Đảm bảo ma trận phân hóa chuẩn GDPT 2018 và Thông tư 17/2025/TT-BGDĐT.'}
`;

    const modelName = getGeminiModel();

    // Gọi AI với cơ chế xoay tua key tự động nếu gặp lỗi 429
    const responseText = await executeWithKeyRotation(
      customApiKey,
      async (apiKey) => {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: modelName,
          contents: userPrompt,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
            responseSchema: examResponseSchema,
            temperature: 0.4,
          },
        });
        return response.text || '{}';
      },
      {
        userId: currentUser?.id,
        endpoint: 'exam.generate',
      }
    );

    const parsedRaw = JSON.parse(responseText);

    // Validate nghiêm ngặt qua Zod
    const validationResult = ExamZodSchema.safeParse(parsedRaw);
    if (!validationResult.success) {
      console.error('Zod Validation Failed on Exam:', validationResult.error.format());
      return NextResponse.json(
        {
          success: false,
          error: `AI trả về dữ liệu chưa khớp cấu trúc chuẩn: ${validationResult.error.issues.map(i => i.message).join('; ')}`,
        },
        { status: 422 }
      );
    }

    const validatedData = validationResult.data;

    const questions: Question[] = validatedData.questions.map((q, idx) => ({
      id: q.id || `q_${Date.now()}_${idx + 1}`,
      type: q.type,
      difficulty: q.difficulty,
      content: q.content,
      choices: q.choices,
      correct_answer: q.correct_answer,
      step_by_step_solution: q.step_by_step_solution,
      sub_questions: q.sub_questions,
      tags: q.tags || [],
    }));

    const exam: Exam = {
      id: `exam-${Date.now()}`,
      metadata: {
        title: validatedData.title || `ĐỀ KIỂM TRA MÔN ${params.subject.toUpperCase()}`,
        schoolName: 'SỞ GIÁO DỤC VÀ ĐÀO TẠO',
        departmentName: 'TRƯỜNG THPT CHUYÊN',
        subject: params.subject,
        grade: params.grade,
        durationMinutes: params.durationMinutes,
        examCode: '101',
        academicYear: '2025 - 2026',
        notes: 'Học sinh không được sử dụng tài liệu.',
      },
      questions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      exam,
      isFallback: false,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('API Generate Exam Error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Lỗi khi gọi API AI sinh đề thi',
      },
      { status: 500 }
    );
  }
}
