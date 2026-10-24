import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireRequestAuth } from '@/lib/request-auth';
import { ApiError, apiErrorResponse } from '@/lib/api-error';
import { decryptApiKey } from '@/lib/crypto';
import { classifyProviderFailure } from '@/lib/ai-policy';
import { resolveModelId, type AiModelOption } from '@/lib/gemini-keys';
import { isSameOriginMutation } from '@/lib/attempt-access';

// Read model metadata only. This does not generate content or prove remaining billing quota.
export async function POST(req: NextRequest) {
  if (!isSameOriginMutation(req)) return NextResponse.json({ error: 'Yêu cầu không hợp lệ' }, { status: 403 });
  try {
    const user = await requireRequestAuth(req);
    const parsed = z.object({ keyId: z.string().max(100).optional(), rawKey: z.string().trim().min(10).max(500).optional(), testModel: z.string().max(120).optional() }).safeParse(await req.json().catch(() => null));
    if (!parsed.success || Boolean(parsed.data.keyId) === Boolean(parsed.data.rawKey)) return NextResponse.json({ error: 'Chọn đúng một khóa lưu hoặc khóa tạm để kiểm tra' }, { status: 400 });
    let rawKey = parsed.data.rawKey;
    if (parsed.data.keyId) {
      const saved = await prisma.userApiKey.findFirst({ where: { id: parsed.data.keyId, userId: user.id } });
      if (!saved) return NextResponse.json({ error: 'Không tìm thấy khóa của bạn' }, { status: 404 });
      rawKey = decryptApiKey(saved.keyEncrypted, saved.keyIv, saved.keyTag);
    }
    const startedAt = Date.now();
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000', { headers: { 'x-goog-api-key': rawKey! }, signal: AbortSignal.timeout(10000), cache: 'no-store' });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const failure = classifyProviderFailure({ status: response.status, message: body?.error?.message ?? '' });
      return NextResponse.json({ success: false, status: failure.code, message: failure.message, providerStatus: response.status, quotaKnown: false }, { headers: { 'Cache-Control': 'no-store' } });
    }
    const body = await response.json();
    const availableModels: AiModelOption[] = (Array.isArray(body.models) ? body.models : []).filter((model: { supportedGenerationMethods?: string[] }) => model.supportedGenerationMethods?.includes('generateContent')).map((model: { name: string; displayName?: string }) => ({ id: model.name.replace(/^models\//, ''), name: model.displayName ?? model.name, badge: 'Có trong danh mục', badgeColor: 'blue', tier: 'UNKNOWN', description: 'Đã đọc danh mục bằng khóa này; chưa xác minh quota sinh nội dung hoặc giá.' }));
    const configured = resolveModelId(parsed.data.testModel);
    const listed = availableModels.some(model => model.id === configured);
    return NextResponse.json({ success: true, status: listed ? 'METADATA_AVAILABLE' : 'MODEL_NOT_LISTED', message: listed ? 'Đã đọc được danh mục và tìm thấy model đã chọn. Chưa gọi sinh nội dung hoặc xác nhận quota/billing.' : 'Đã đọc được danh mục nhưng chưa thấy model đang chọn. Hãy chọn model trong danh sách vừa tải.', availableModels, quotaKnown: false, latencyMs: Date.now() - startedAt, hasMoreModels: Boolean(body.nextPageToken) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof ApiError) return apiErrorResponse(error, 'Yêu cầu kiểm tra khóa bị từ chối');
    const message = error instanceof Error ? error.message : '';
    if (message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    if (message === 'MUST_CHANGE_PASSWORD') return NextResponse.json({ error: 'Vui lòng đổi mật khẩu trước khi kiểm tra khóa' }, { status: 403 });
    return NextResponse.json({ success: false, status: 'UNAVAILABLE', message: 'Chưa đọc được khóa hoặc chưa kết nối được nhà cung cấp. Kiểm tra cấu hình và thử lại.', quotaKnown: false }, { status: 503 });
  }
}
