// Phiên bản sửa của test_scenario.mjs: ép schema + validate + kiểm số câu.
import { GoogleGenAI, Type } from '@google/genai';
import { z } from 'zod';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const apiKey = envFile.match(/GEMINI_API_KEY_1=([^\r\n]+)/)?.[1].trim();
if (!apiKey) throw new Error('Thiếu GEMINI_API_KEY_1');

// Dùng gemini-3.8-flash vì gemini-2.5-flash bị 404 trên tài khoản mới
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
console.log('Using model:', MODEL);
const ai = new GoogleGenAI({ apiKey });

const PARAMS = { numMC: 12, numTF: 4, numSA: 6, numEssay: 0 };

// 1) Schema gửi cho Gemini. propertyOrdering ép giải TRƯỚC, chốt đáp án SAU.
const questionSchema = {
  type: Type.OBJECT,
  propertyOrdering: ['type', 'difficulty', 'content', 'choices', 'sub_questions',
    'step_by_step_solution', 'correct_answer', 'tags'],
  properties: {
    type: { type: Type.STRING, enum: ['multiple_choice', 'true_false_group', 'short_answer', 'essay'] },
    difficulty: { type: Type.STRING, enum: ['nhan_biet', 'thong_hieu', 'van_dung', 'van_dung_cao'] },
    content: { type: Type.STRING },
    choices: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        propertyOrdering: ['key', 'text'],
        properties: { key: { type: Type.STRING, enum: ['A', 'B', 'C', 'D'] }, text: { type: Type.STRING } },
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

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    questions: { type: Type.ARRAY, items: questionSchema },
  },
  required: ['title', 'questions'],
};

// 2) Validate lại bằng zod: schema của Gemini không đảm bảo đúng nghiệp vụ.
const Choice = z.object({ key: z.enum(['A', 'B', 'C', 'D']), text: z.string().min(1) });
const Sub = z.object({ key: z.enum(['a', 'b', 'c', 'd']), content: z.string().min(1), isCorrect: z.boolean() }).passthrough();
const Q = z.object({
  type: z.enum(['multiple_choice', 'true_false_group', 'short_answer', 'essay']),
  difficulty: z.enum(['nhan_biet', 'thong_hieu', 'van_dung', 'van_dung_cao']),
  content: z.string().min(1),
  choices: z.array(Choice).optional(),
  sub_questions: z.array(Sub).optional(),
  step_by_step_solution: z.string().min(1),
  correct_answer: z.string().optional(),
  tags: z.array(z.string()).optional(),
}).superRefine((q, ctx) => {
  const bad = (m) => ctx.addIssue({ code: 'custom', message: m });
  if (q.type === 'multiple_choice') {
    if (q.choices?.length !== 4) bad('MC cần đúng 4 phương án');
    if (new Set(q.choices?.map(c => c.text.trim())).size !== q.choices?.length) bad('Có phương án trùng nhau');
    if (!q.choices?.some(c => c.key === q.correct_answer)) bad('correct_answer không khớp phương án nào');
    if (/cả\s+[A-D]\s+và\s+[A-D]|tất cả.*(đúng|sai)/i.test(JSON.stringify(q.choices))) bad('Phương án phụ thuộc nhau');
    if (/\b(chọn|đáp án)\s+[A-D]\b/i.test(q.step_by_step_solution)) bad('Lời giải nhắc chữ cái đáp án (sẽ sai sau khi trộn)');
  }
  if (q.type === 'true_false_group' && q.sub_questions?.length !== 4) bad('Đúng/Sai cần đúng 4 ý');
  if (q.type === 'short_answer' && !q.correct_answer?.trim()) bad('Thiếu đáp số');
  if (/(bảng biến thiên|đồ thị|hình vẽ|hình bên)\s*(như sau|dưới đây|bên)/i.test(q.content)) bad('Câu tham chiếu hình/bảng không có dữ liệu đi kèm');
});

const systemPrompt = `
Bạn là chuyên gia khảo thí Việt Nam, am hiểu chương trình GDPT 2018.
- Mọi công thức bọc trong $...$ hoặc $$...$$, phân số dùng \\frac{a}{b}.
- Viết step_by_step_solution trước, tính ra nghiệm cụ thể, rồi mới ghi correct_answer.
- Trắc nghiệm: đúng 4 phương án, chỉ MỘT phương án đúng, các phương án không được chồng lấn nhau
  (ví dụ không đưa $(-1;1)$ và $(0;1)$ cùng lúc khi hỏi "đồng biến trên khoảng nào").
- Không dùng "Cả A và B đúng", "Tất cả đều đúng".
- Lời giải KHÔNG được nhắc chữ cái phương án ("chọn A"); chỉ nêu giá trị/kết luận.
- Không tạo câu cần bảng biến thiên/đồ thị/hình vẽ vì hệ thống chưa truyền được dữ liệu đó.
- Đúng/Sai: đúng 4 ý a,b,c,d, mỗi ý có isCorrect và explanation.
- Trả lời ngắn: correct_answer là một số (dùng dấu chấm thập phân).
`;

const userPrompt = `
Sinh đề Toán 12, chủ đề Khảo sát hàm số và nguyên hàm tích phân, 90 phút.
Đúng ${PARAMS.numMC} câu multiple_choice, ${PARAMS.numTF} câu true_false_group,
${PARAMS.numSA} câu short_answer, ${PARAMS.numEssay} câu essay. Sắp xếp theo thứ tự các phần đó.
Phân hóa theo chuẩn GDPT 2018.
`;

async function run() {
  console.log('Calling Gemini with responseSchema...');
  const res = await ai.models.generateContent({
    model: MODEL,
    contents: userPrompt,
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: 'application/json',
      responseSchema,
      temperature: 0.4,
    },
  });

  const responseText = res.text ?? '';
  fs.writeFileSync('./scripts/raw_ai_exam_fixed.json', responseText, 'utf-8');
  console.log('Saved raw_ai_exam_fixed.json. Length:', responseText.length);

  const data = JSON.parse(responseText || '{}');

  const problems = [];
  const valid = [];
  (data.questions ?? []).forEach((q, i) => {
    const r = Q.safeParse(q);
    if (r.success) {
      valid.push(r.data);
    } else {
      problems.push(`Câu ${i + 1}: ${r.error.issues.map(x => x.message).join('; ')}`);
    }
  });

  const count = t => valid.filter(q => q.type === t).length;
  const got = { mc: count('multiple_choice'), tf: count('true_false_group'), sa: count('short_answer') };
  if (got.mc !== PARAMS.numMC || got.tf !== PARAMS.numTF || got.sa !== PARAMS.numSA) {
    problems.push(`Sai số câu: nhận ${JSON.stringify(got)}, cần ${JSON.stringify(PARAMS)}`);
  }

  const total = got.mc * 0.25 + got.tf * 1.0 + got.sa * 0.5;
  console.log('\n================ KẾT QUẢ KIỂM THỬ ================');
  console.log('Tổng số câu trả về:', (data.questions ?? []).length);
  console.log('Hợp lệ (Pass Zod):', valid.length, '/', (data.questions ?? []).length);
  console.log('Chi tiết số câu hợp lệ:', JSON.stringify(got));
  console.log('Tổng điểm tính được:', total, '(Chuẩn 10.0?', total === 10 ? 'ĐẠT' : 'CHƯA ĐẠT', ')');
  console.log('==================================================');
  if (problems.length) {
    console.log('CÁC VẤN ĐỀ PHÁT HIỆN QUA VALIDATION:\n- ' + problems.join('\n- '));
  } else {
    console.log('XUẤT SẮC: Toàn bộ câu hỏi đều vượt qua kiểm tra Zod và khớp 100% nghiệp vụ!');
  }
}

run().catch(err => {
  console.error('Lỗi khi chạy script:', err);
});
