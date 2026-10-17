import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const keyMatch = envFile.match(/GEMINI_API_KEY_1=([^\r\n]+)/);
const apiKey = keyMatch ? keyMatch[1].trim() : '';

const ai = new GoogleGenAI({ apiKey });

const systemPrompt = `
Bạn là một chuyên gia khảo thí và giáo viên giỏi bậc nhất tại Việt Nam, am hiểu sâu sắc chương trình GDPT 2018 cho các môn Toán, Vật lí, Hóa học, KHTN từ lớp 1 đến 12.
Nhiệm vụ của bạn là biên soạn một đề thi chất lượng cao, đúng chuẩn cấu trúc thi của Bộ GD&ĐT.

KỶ LUẬT THÉP VỀ NỘI DUNG VÀ ĐỊNH DẠNG:
1. TOÀN BỘ công thức toán học, ký hiệu khoa học, phương trình phải được bọc trong dấu $...$ (nội dòng) hoặc $$...$$ (khối). Ví dụ: $x^2 - 4x + 3 = 0$, $\\frac{a}{b}$, $\\int_0^1 f(x)dx$.
2. KHÔNG BAO GIỜ dùng phân số viết tay dạng a/b trong văn bản khoa học, luôn dùng \\frac{a}{b}.
3. QUY TẮC "GIẢI TRƯỚC - CHỌN ĐÁP ÁN SAU":
   - Bắt buộc phải viết chi tiết trường step_by_step_solution trước và tính toán ra nghiệm cụ thể.
   - Sau đó mới gán đáp án chính xác vào correct_answer.
   - Các phương án nhiễu phải hợp lý, có tính phân loại học sinh.
4. KHÔNG BAO GIỜ sinh các phương án như "Cả A và B đều đúng", "Tất cả các đáp án trên đều sai" (vì đề thi sẽ được trộn ngẫu nhiên).
5. Trả về đúng định dạng JSON không kèm bất kỳ lời chào hay ký tự markdown thừa ngoài chuỗi JSON.
`;

const userPrompt = `
Hãy sinh đề thi cho:
- Môn: toan
- Khối lớp: 12
- Chủ đề: Khảo sát hàm số và nguyên hàm tích phân
- Thời gian làm bài: 90 phút
- Số câu trắc nghiệm nhiều lựa chọn (Phần I): 12
- Số câu trắc nghiệm Đúng/Sai 4 ý a,b,c,d (Phần II): 4
- Số câu trả lời ngắn / điền số (Phần III): 6
- Số câu tự luận (Phần IV): 0
- Hướng dẫn bổ sung: Đảm bảo phân hóa theo chuẩn GDPT 2018
`;

async function run() {
  const models = ['gemini-2.5-flash', 'gemini-3.8-flash', 'gemini-flash-latest'];
  for (const m of models) {
    console.log(`Trying model: ${m}...`);
    try {
      const response = await ai.models.generateContent({
        model: m,
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
        },
      });
      const rawJson = response.text || '{}';
      fs.writeFileSync('./scripts/raw_ai_exam.json', rawJson, 'utf-8');
      console.log(`SUCCESS with ${m}! Length:`, rawJson.length);
      return;
    } catch (err) {
      console.log(`Failed with ${m}:`, err.message);
    }
  }
}

run();
