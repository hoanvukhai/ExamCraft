import { NextRequest, NextResponse } from 'next/server';
import { importResponseSchema, parseImportedDocument, IMPORT_SOURCE_RULES } from '@/lib/import-document';
import { GoogleGenAI } from '@google/genai';
import { requireRequestAuth } from '@/lib/request-auth';
import { isSameOriginMutation } from '@/lib/attempt-access';
import { apiErrorResponse } from '@/lib/api-error';
import prisma from '@/lib/prisma';
import { requestApiKey } from '@/lib/ai-policy';
import { executeWithKeyRotation, parseProviderJson } from '@/lib/gemini-keys';

export async function POST(req: NextRequest) {
  try {
    if (!isSameOriginMutation(req)) return NextResponse.json({ error: 'Yêu cầu không hợp lệ' }, { status: 403 });
    const currentUser = await requireRequestAuth(req);
    const body = await req.json();
    const { rawText } = body as { rawText: string };
    const customApiKey = requestApiKey(body);

    if (typeof rawText !== 'string' || !rawText.trim()) {
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

    const systemPrompt = IMPORT_SOURCE_RULES;


    const responseText = await executeWithKeyRotation(
      customApiKey,
      async (apiKey, modelName) => {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: modelName,
          contents: rawText,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
            responseSchema: importResponseSchema,
            temperature: 0.2,
          },
        });
        return response.text || '{}';
      },
      {
        userId: currentUser.id,
        endpoint: 'exam.parse',
      }
    );

    const imported = parseImportedDocument(parseProviderJson(responseText), 'Văn bản nhập');
    return NextResponse.json({ success: true, ...imported, totalCount: imported.questions.length });
  } catch (error: unknown) {
    return apiErrorResponse(error, 'Không thể xử lý yêu cầu AI lúc này.');
  }
}
