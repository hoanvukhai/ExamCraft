import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { Exam, Question } from '@/types/exam';
import { requestApiKey } from '@/lib/ai-policy';
import { executeWithKeyRotation, parseProviderJson } from '@/lib/gemini-keys';
import { normalizeExamDocument } from '@/lib/exam-document';
import { validateCopilotResult } from '@/lib/copilot-result';
import { requireAuth } from '@/lib/auth';
import { assertRequestAccount } from '@/lib/request-account';
import { isSameOriginMutation } from '@/lib/attempt-access';
import { apiErrorResponse, ApiError } from '@/lib/api-error';
import { getTeacherAiProfilePrompt } from '@/lib/teacher-profile';

interface CopilotRequest {
  exam: Exam;
  command: string;
  targetQuestionId?: string;
  customApiKey?: string;
}

export async function POST(req: NextRequest) {
  try {
    if (!isSameOriginMutation(req)) throw new ApiError(403, 'Yêu cầu không hợp lệ');
    const currentUser = await requireAuth();
    assertRequestAccount(req.headers, currentUser.id);
    const body: CopilotRequest = await req.json();
    const { command, targetQuestionId } = body;
    let customApiKey: string | undefined;
    try { customApiKey = requestApiKey(body); } catch { throw new ApiError(400, 'Khóa tạm không hợp lệ hoặc các trường khóa không trùng nhau'); }
    if (typeof command !== 'string' || command.length > 12000) throw new ApiError(400, 'Yêu cầu cần là văn bản tối đa 12.000 ký tự');
    const exam = normalizeExamDocument(body.exam);

    if (!command || !command.trim()) {
      return NextResponse.json({ success: false, error: 'Vui lòng nhập yêu cầu cho trợ lý AI.' }, { status: 400 });
    }

    let teacherPersonaPrompt = '';
    if (currentUser) {
      const persona = await getTeacherAiProfilePrompt(currentUser.id, exam.metadata.subject);
      teacherPersonaPrompt = persona.instructionPrompt;
    }

    const currentQuestionsSummary = exam.questions.map((q, idx) => ({
      index: idx + 1,
      id: q.id,
      type: q.type,
      difficulty: q.difficulty,
      contentSummary: q.content.slice(0, 100) + '...',
    }));

    const systemPrompt = `
Bạn là Trợ Lý AI Chuyên Sâu Biên Tập Đề Thi chuẩn GDPT 2018 cho giáo viên Việt Nam.
Nhiệm vụ: Phân tích yêu cầu bằng ngôn ngữ tự nhiên của giáo viên đối với đề thi hiện tại.
${teacherPersonaPrompt}


CÓ 2 TRƯỜNG HỢP:

TRƯỜNG HỢP 1: YÊU CẦU CẦN LÀM RÕ (CLARIFICATION)
Nếu yêu cầu của giáo viên còn mơ hồ, thiếu thông tin (ví dụ: "làm khó hơn", "thay câu khác", "sửa lại đề này", "tạo đề mới môn khác").
Bạn KHÔNG được đoán mò! Hãy trả lời dạng "clarification":
{
  "type": "clarification",
  "message": "Lời giải thích ngắn gọn, lịch sự và hỏi lại giáo viên vấn đề cụ thể",
  "quickOptions": [
    "Lựa chọn 1 (rất ngắn gọn, 3-7 từ để giáo viên bấm chọn)",
    "Lựa chọn 2",
    "Lựa chọn 3"
  ]
}

TRƯỜNG HỢP 2: YÊU CẦU ĐÃ CỤ THỂ HOẶC CÓ THỂ THỰC THI (ACTION)
Các loại hành động hỗ trợ:
1. "modify_single_question": Sửa hoặc đổi số liệu 1 câu cụ thể (ví dụ: "đổi số liệu câu 2", "sửa câu 1 thành toán thực tế", "tăng độ khó câu 3").
2. "modify_all_questions": Đổi số liệu toàn bộ đề thi để làm mã đề khác (action: "change_all_numbers").
3. "add_question": Thêm 1 câu hỏi mới theo chủ đề được yêu cầu.
4. "delete_question": Xóa câu hỏi được chỉ định.

Định dạng JSON trả về cho TRƯỜNG HỢP 2:
{
  "type": "action",
  "action": "modify_single_question" | "modify_all_numbers" | "add_question" | "delete_question",
  "targetQuestionIndex": number | null (1-indexed),
  "targetQuestionId": string | null,
  "explanation": "Tóm tắt ngắn gọn việc đã làm cho giáo viên",
  "modifiedQuestion": Question | null (nếu là modify_single_question hoặc add_question),
  "instructionForQuestion": string | null
}

QUY TẮC CÔNG THỨC TOÁN HỌC:
- Mọi công thức Toán/KHTN phải được kẹp trong dấu $...$ (nội dòng) hoặc $$...$$ (khối).
- Không để sót ký tự rác hoặc thiếu dấu đóng mở ngoặc LaTeX.
- Trả về duy nhất 1 JSON hợp lệ, không bọc markdown hay text giải thích ngoài JSON.
`;

    const userPrompt = `
THÔNG TIN ĐỀ THI HIỆN TẠI:
- Tiêu đề: ${exam.metadata.title}
- Môn: ${exam.metadata.subject} - Khối: ${exam.metadata.grade}
- Tổng số câu: ${exam.questions.length} câu
- Danh sách câu hỏi hiện tại:
${JSON.stringify(currentQuestionsSummary, null, 2)}

Câu hỏi đang được chọn (nếu có): ${targetQuestionId || 'Không có'}
Yêu cầu của giáo viên: "${command}"

Nếu yêu cầu nhằm sửa 1 câu cụ thể, đây là chi tiết toàn bộ các câu:
${JSON.stringify(exam.questions, null, 2)}
`;


    const responseText = await executeWithKeyRotation(
      customApiKey,
      async (apiKey, modelName) => {
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
        return response.text || '{}';
      },
      {
        userId: currentUser.id,
        endpoint: 'exam.copilot',
      }
    );

    let cleanJson = responseText.trim();
    if (cleanJson.startsWith('```json')) cleanJson = cleanJson.slice(7);
    if (cleanJson.startsWith('```')) cleanJson = cleanJson.slice(3);
    if (cleanJson.endsWith('```')) cleanJson = cleanJson.slice(0, -3);

    const parsed = validateCopilotResult(parseProviderJson(cleanJson.trim()), exam, targetQuestionId);

    return NextResponse.json({ success: true, result: parsed });
  } catch (error: unknown) {
    return apiErrorResponse(error, 'Không thể xử lý yêu cầu AI lúc này.');
  }
}
