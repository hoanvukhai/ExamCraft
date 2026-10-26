import { NextRequest, NextResponse } from 'next/server';
import { importResponseSchema, parseImportedDocument, IMPORT_SOURCE_RULES } from '@/lib/import-document';
import { requireRequestAuth } from '@/lib/request-auth';
import { apiErrorResponse, ApiError } from '@/lib/api-error';
import { requestApiKey } from '@/lib/ai-policy';
import { isSameOriginMutation } from '@/lib/attempt-access';

import mammoth from 'mammoth';
import { docxWithEquationsAsText } from '@/lib/docx-math';
import { importInBatches } from '@/lib/import-batching';
import { attachWordImages, docxWithImagesAsMarkers } from '@/lib/docx-images';
import { GoogleGenAI } from '@google/genai';
import { executeWithKeyRotation, parseProviderJson } from '@/lib/gemini-keys';

export async function POST(req: NextRequest) {
  try {
    const currentUser = await requireRequestAuth(req);
    if (!isSameOriginMutation(req)) throw new ApiError(403, 'Yêu cầu không hợp lệ');
    let fileBuffer: Buffer | null = null;
    let fileName: string | undefined;
    let userApiKey: string | undefined = undefined;

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      userApiKey = requestApiKey(Object.fromEntries(['customApiKey', 'userApiKey', 'apiKey'].map(key => [key, formData.get(key)])));
      if (file && file.size > 20 * 1024 * 1024) throw new ApiError(413, 'Tệp Word vượt 20 MB');

      if (!file) {
        return NextResponse.json(
          { success: false, error: 'Không tìm thấy file Word được tải lên.' },
          { status: 400 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      fileName = file.name;
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
      userApiKey = requestApiKey(body);
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Nội dung file Word bị rỗng hoặc không đúng định dạng.' },
        { status: 400 }
      );
    }

    if (fileBuffer.length > 20 * 1024 * 1024) throw new ApiError(413, 'Tệp Word vượt 20 MB');

    // 1. Dùng mammoth để trích xuất văn bản thô từ file docx
    // Equations are Word objects that plain extraction drops, so they are turned into $...$ text first.
    const withMath = await docxWithEquationsAsText(fileBuffer);
    const withImages = await docxWithImagesAsMarkers(withMath.buffer);
    const mammothResult = await mammoth.extractRawText({ buffer: withImages.buffer });
    const rawText = mammothResult.value;

    if (!rawText || rawText.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'File Word không chứa nội dung văn bản có thể đọc được.' },
        { status: 400 }
      );
    }

    if (rawText.length > 45000) throw new ApiError(413, 'Văn bản Word vượt 45.000 ký tự. Hãy chia nhỏ tài liệu; hệ thống không tự cắt bỏ phần cuối.');

    // 2. Dùng Gemini AI để phân rã cấu trúc câu hỏi; tài liệu dài được đọc theo từng phần và đối chiếu với số "Câu N" của nguồn
    const parsed = await importInBatches(rawText, async part => {
      const prompt = `Số hóa văn bản Word sau.
${IMPORT_SOURCE_RULES}
<source_document>
${part}
</source_document>`;
      const aiResult = await executeWithKeyRotation(userApiKey, async (apiKey: string, modelName: string) => {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: { abortSignal: req.signal,
            responseMimeType: 'application/json',
            responseSchema: importResponseSchema,
            temperature: 0.2,
          },
        });
        return response.text || '{}';
      }, { userId: currentUser.id, endpoint: 'parse.docx', signal: req.signal });
      if (!aiResult || aiResult === '{}') throw new ApiError(502, 'AI không thể phân tích văn bản từ file Word.', 'AI_BAD_OUTPUT');
      return parseImportedDocument(parseProviderJson(aiResult), 'Word (.docx)', fileName);
    }, 'tài liệu Word');
    const imported = attachWordImages(parsed, withImages.images, withImages.skipped);
    imported.warnings.unshift(withMath.equations ? `Đã đọc ${withMath.equations} công thức Word thành LaTeX; hình ảnh và bảng phức tạp cần đối chiếu với tệp gốc.` : 'Luồng Word hiện đọc văn bản; ảnh và bảng phức tạp cần đối chiếu với tệp gốc và bổ sung thủ công.');
    return NextResponse.json({ success: true, ...imported, totalCount: imported.questions.length });
  } catch (error: unknown) {
    if (error instanceof Error && ['API_KEY_INPUT_INVALID', 'API_KEY_INPUT_CONFLICT'].includes(error.message)) return NextResponse.json({ error: 'Thông tin khóa không hợp lệ hoặc có nhiều giá trị khác nhau' }, { status: 400 });
    return apiErrorResponse(error, 'Chưa thể phân tích tệp Word');
  }
}
