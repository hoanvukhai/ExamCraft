import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY_1;
const modelName = 'gemini-3.8-flash';

async function testCopilot() {
  const currentQuestionsSummary = [
    {
      index: 1,
      id: 'q_1',
      type: 'multiple_choice',
      difficulty: 'nhan_biet',
      contentSummary: 'Cho hàm số y = (2x+1)/(x-3). Phương trình đường tiệm cận ngang...'
    }
  ];

  const systemPrompt = `
Bạn là Trợ Lý AI Chuyên Sâu Biên Tập Đề Thi chuẩn GDPT 2018 cho giáo viên Việt Nam.
Nhiệm vụ: Phân tích yêu cầu bằng ngôn ngữ tự nhiên của giáo viên đối với đề thi hiện tại.

CÓ 2 TRƯỜNG HỢP:

TRƯỜNG HỢP 1: YÊU CẦU CẦN LÀM RÕ (CLARIFICATION)
Nếu yêu cầu của giáo viên còn mơ hồ, thiếu thông tin.
{
  "type": "clarification",
  "message": "Lời giải thích ngắn gọn, lịch sự và hỏi lại giáo viên vấn đề cụ thể",
  "quickOptions": ["Lựa chọn 1", "Lựa chọn 2", "Lựa chọn 3"]
}

TRƯỜNG HỢP 2: YÊU CẦU ĐÃ CỤ THỂ HOẶC CÓ THỂ THỰC THI (ACTION)
{
  "type": "action",
  "action": "modify_single_question",
  "targetQuestionIndex": 1,
  "targetQuestionId": "q_1",
  "explanation": "Đã đổi hàm số ở câu 1 thành...",
  "modifiedQuestion": {
    "id": "q_1",
    "type": "multiple_choice",
    "difficulty": "nhan_biet",
    "content": "Cho hàm số $y = \\\\frac{3x - 1}{x + 2}$. Phương trình đường tiệm cận ngang của đồ thị hàm số là:",
    "choices": [
      { "key": "A", "text": "$y = 3$" },
      { "key": "B", "text": "$x = -2$" },
      { "key": "C", "text": "$y = -\\\\frac{1}{2}$" },
      { "key": "D", "text": "$x = 3$" }
    ],
    "correct_answer": "A",
    "step_by_step_solution": "Ta có $\\\\lim_{x \\\\to \\\\pm\\\\infty} \\\\frac{3x - 1}{x + 2} = 3$. Do đó đường tiệm cận ngang là $y = 3$."
  }
}
Trả về duy nhất 1 JSON hợp lệ.
`;

  const userPrompt = `
Yêu cầu của giáo viên: "ở câu 1 thay đổi hàm số y giúp tôi"
`;

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: modelName,
    contents: userPrompt,
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: 'application/json',
      temperature: 0.3,
    },
  });

  console.log('Result:', response.text);
}

testCopilot().catch(console.error);
