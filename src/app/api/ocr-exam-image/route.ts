import { NextRequest, NextResponse } from 'next/server';
import { importResponseSchema, parseImportedDocument, IMPORT_SOURCE_RULES } from '@/lib/import-document';
import { requireRequestAuth } from '@/lib/request-auth';
import { apiErrorResponse, ApiError } from '@/lib/api-error';
import { requestApiKey } from '@/lib/ai-policy';
import { isSameOriginMutation } from '@/lib/attempt-access';

import { GoogleGenAI } from '@google/genai';
import { executeWithKeyRotation } from '@/lib/gemini-keys';

export async function POST(req: NextRequest) {
  try {
    const currentUser = await requireRequestAuth(req);
    if (!isSameOriginMutation(req)) throw new ApiError(403, 'Yêu cầu không hợp lệ');
    const body = await req.json();
    const userApiKey = requestApiKey(body);
    const { imageBase64, mimeType = 'image/jpeg' } = body;

    if (!imageBase64 || typeof imageBase64 !== 'string' || imageBase64.length > 20 * 1024 * 1024) {
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

    if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(detectedMime)) throw new ApiError(400, 'Định dạng ảnh chưa được hỗ trợ.');
    const promptText = `Số hóa nội dung trong ảnh đính kèm.
${IMPORT_SOURCE_RULES}`;


    const result = await executeWithKeyRotation(userApiKey, async (apiKey: string, modelName: string) => {
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
          responseSchema: importResponseSchema,
          temperature: 0.2,
        },
      });

      return response.text || '{}';
    }, { userId: currentUser.id, endpoint: 'ocr.exam_image' });

    if (!result || result === '{}') {
      return NextResponse.json(
        { success: false, error: 'Không nhận được dữ liệu phản hồi từ AI Vision.' },
        { status: 500 }
      );
    }

    const imported = parseImportedDocument(JSON.parse(result), 'Ảnh OCR');
    imported.warnings.unshift('Cần đối chiếu chữ, công thức và hình với ảnh gốc trước khi sử dụng.');
    return NextResponse.json({ success: true, ...imported, totalCount: imported.questions.length });
  } catch (error: unknown) {
    if (error instanceof Error && ['API_KEY_INPUT_INVALID', 'API_KEY_INPUT_CONFLICT'].includes(error.message)) return NextResponse.json({ error: 'Thông tin khóa không hợp lệ hoặc có nhiều giá trị khác nhau' }, { status: 400 });
    return apiErrorResponse(error, 'Chưa thể phân tích ảnh');
  }
}
