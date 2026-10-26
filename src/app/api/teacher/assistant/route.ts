import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { requireAuth } from '@/lib/auth';
import { isSameOriginMutation } from '@/lib/attempt-access';
import { apiErrorResponse } from '@/lib/api-error';
import prisma from '@/lib/prisma';
import { requestApiKey } from '@/lib/ai-policy';
import { executeWithKeyRotation } from '@/lib/gemini-keys';
import { getTeacherAiProfilePrompt } from '@/lib/teacher-profile';

interface AssistantChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    if (!isSameOriginMutation(req)) return NextResponse.json({ error: 'Yêu cầu không hợp lệ' }, { status: 403 });
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const body = await req.json();
    const { message, history = [], customApiKey } = body as {
      message: string;
      history: AssistantChatMessage[];
      customApiKey?: string;
    };

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Nội dung tin nhắn không được để trống' }, { status: 400 });
    }

    // 1. Lấy thông tin ngữ cảnh kho đề của giáo viên
    const [totalExams, starredExams, folders, recentExams] = await Promise.all([
      prisma.exam.count({ where: { ownerId: user.id } }),
      prisma.exam.count({ where: { ownerId: user.id, isStarred: true } }),
      prisma.folder.findMany({
        where: { ownerId: user.id },
        select: { id: true, name: true, _count: { select: { exams: true } } },
      }),
      prisma.exam.findMany({
        where: { ownerId: user.id },
        select: { id: true, title: true, subject: true, grade: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),
    ]);

    // 2. Lấy hồ sơ chân dung cá nhân hóa của giáo viên từ TeacherAiMemory
    const teacherProfile = await getTeacherAiProfilePrompt(user.id);

    // 3. Chuẩn bị prompt cho Gemini
    const systemInstruction = `
Bạn là THƯ KÝ SỐ & TRỢ LÝ SƯ PHẠM RIÊNG CỦA GIÁO VIÊN: "${user.name}".
Bạn đồng hành cùng Thầy/Cô trong việc quản lý kho đề thi, tư vấn cấu trúc khảo thí GDPT 2018, gợi ý câu hỏi và giải đáp nghiệp vụ sư phạm.

NGỮ CẢNH KHO ĐỀ THI HIỆN TẠI CỦA THẦY/CÔ:
- Tổng số đề thi đã tạo: ${totalExams} đề (${starredExams} đề quan trọng đã gắn sao).
- Các thư mục đang có: ${folders.map((f) => `"${f.name}" (${f._count.exams} đề)`).join(', ') || 'Chưa phân thư mục'}.
- 5 đề thi cập nhật gần nhất:
${recentExams.map((e, i) => `  ${i + 1}. [${e.subject.toUpperCase()} ${e.grade}] "${e.title}"`).join('\n') || '  (Chưa có đề thi nào)'}

${teacherProfile.instructionPrompt}

QUY TẮC PHỤC VỤ SƯ PHẠM:
1. Xưng hô: Xưng là "Em" hoặc "Trợ lý", gọi người dùng là "Thầy/Cô" hoặc "Thầy", "Cô" một cách lễ phép, tận tâm, tôn trọng.
2. Trả lời:
   - Ngắn gọn, súc tích, đi thẳng vào trọng tâm chuyên môn sư phạm.
   - Khi gợi ý câu hỏi Toán/KHTN: BẮT BUỘC dùng ký hiệu LaTeX trong dấu $...$ (nội dòng) hoặc $$...$$ (khối).
   - Khi được hỏi về kho đề: Dựa vào thông tin ngữ cảnh trên để trả lời chính xác số lượng, tên đề, gợi ý tìm kiếm hoặc dọn dẹp.
   - Đưa ra lời khuyên thiết thực theo đúng thông tư, quyết định mới nhất của Bộ GD&ĐT (Thông tư 17/2025, Quyết định 764/QĐ-BGDĐT).
`;

    // 4. Gọi Gemini qua cơ chế xoay tua Key
    const reply = await executeWithKeyRotation(
      requestApiKey(body),
      async (apiKey, model) => {
        const ai = new GoogleGenAI({ apiKey });

        // Xây dựng contents từ history + message
        const chatContents = [
          ...history.slice(-6).map((h) => ({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.content }],
          })),
          {
            role: 'user',
            parts: [{ text: message.trim() }],
          },
        ];

        const response = await ai.models.generateContent({
          model,
          contents: chatContents,
          config: {
            systemInstruction,
            temperature: 0.4,
          },
        });

        return response.text || 'Dạ thưa Thầy/Cô, em đã ghi nhận yêu cầu.';
      },
      {
        userId: user.id,
        endpoint: 'teacher.assistant.chat',
      }
    );

    return NextResponse.json({
      success: true,
      reply,
    });
  } catch (error: unknown) {
    return apiErrorResponse(error, 'Không thể xử lý ghi chú hoặc yêu cầu AI lúc này.');
  }
}
