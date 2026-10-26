import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { requireRequestAuth } from '@/lib/request-auth';
import { requestApiKey } from '@/lib/ai-policy';
import { executeWithKeyRotation } from '@/lib/gemini-keys';
import { ApiError, apiErrorResponse } from '@/lib/api-error';
import { parseScopeChatRequest, requestScopeChat, scopeChatSystemInstruction } from '@/lib/scope-chat';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const user = await requireRequestAuth(req);
    const text = await req.text();
    if (new TextEncoder().encode(text).length > 2300000) throw new ApiError(413, 'Yêu cầu vượt giới hạn gói 2 MB.');
    const body = JSON.parse(text);
    let params;
    try { params = parseScopeChatRequest(body.params); }
    catch { throw new ApiError(400, 'Gói, phiên bản, mã phạm vi hoặc yêu cầu chưa hợp lệ. Hãy kiểm tra lại lựa chọn.'); }
    const customKey = requestApiKey(body);
    const result = await requestScopeChat(params, async request => {
      const generated = await executeWithKeyRotation(customKey, async (apiKey, model) => {
        const response = await new GoogleGenAI({ apiKey }).models.generateContent({ model, contents: JSON.stringify(request), config: { responseMimeType: 'application/json', temperature: 0.1, systemInstruction: scopeChatSystemInstruction } });
        return response.text ?? '{}';
      }, { userId: user.id, endpoint: 'knowledge.scope.propose' });
      // Keep provider failures under the existing central quota/key contract.
      try { JSON.parse(generated); } catch { throw new ApiError(422, 'AI chưa trả đề nghị đúng JSON. Chưa đổi phạm vi.'); }
      return generated;
    }).catch(error => {
      if (error instanceof ApiError) throw error;
      throw new ApiError(422, 'Đề nghị AI có mã, phiên bản hoặc cấu trúc không hợp lệ. Chưa đổi phạm vi.');
    });
    return NextResponse.json({ success: true, result }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return apiErrorResponse(error, 'Chưa nhận được đề nghị phạm vi'); }
}
