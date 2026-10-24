import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireRequestAuth } from '@/lib/request-auth';
import { ApiError, apiErrorResponse } from '@/lib/api-error';
import { encryptApiKey } from '@/lib/crypto';
import { AVAILABLE_GEMINI_MODELS, checkUserAiQuota, resolveModelId } from '@/lib/gemini-keys';
import { applicationDayStart, normalizeModelId } from '@/lib/ai-policy';
import { isSameOriginMutation } from '@/lib/attempt-access';
import { createHash, timingSafeEqual } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { decryptApiKey } from '@/lib/crypto';

const selection = { id: true, label: true, keyMasked: true, isActive: true, createdAt: true, lastUsedAt: true, errorCount: true } as const;
const CreateSchema = z.object({ apiKey: z.string().trim().min(10).max(500), label: z.string().trim().min(1).max(120).optional(), clientRequestId: z.uuid().optional() });
function failure(error: unknown) {
  if (error instanceof ApiError) return apiErrorResponse(error, 'Yêu cầu quản lý khóa bị từ chối');
  const message = error instanceof Error ? error.message : '';
  if (message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  if (message === 'MUST_CHANGE_PASSWORD') return NextResponse.json({ error: 'Vui lòng đổi mật khẩu trước khi quản lý khóa' }, { status: 403 });
  console.warn('AI key operation failed');
  return NextResponse.json({ error: 'Chưa thể xử lý khóa AI. Kiểm tra cấu hình và thử lại.' }, { status: 500 });
}
export async function GET(req: NextRequest) {
  try {
    const user = await requireRequestAuth(req);
    const [keys, quota, usage, settings] = await Promise.all([
      prisma.userApiKey.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, select: selection }),
      checkUserAiQuota(user.id),
      prisma.aiUsageLog.groupBy({ by: ['keyAlias'], where: { userId: user.id, createdAt: { gte: applicationDayStart() }, httpStatus: 200 }, _count: { id: true } }),
      prisma.user.findUnique({ where: { id: user.id }, select: { selectedAiModel: true } }),
    ]);
    const used = new Map(usage.map(row => [row.keyAlias, row._count.id]));
    return NextResponse.json({ keys: keys.map(key => ({ ...key, usedToday: used.get('user_key:' + key.id) ?? 0 })),
      poolQuota: { activeKeyCount: quota.activeKeyCount, limit: quota.limit, usedToday: quota.used, remaining: quota.remaining, percentageUsed: quota.percentageUsed, source: 'application', resetsAt: quota.resetsAt },
      providerQuota: null, selectedAiModel: resolveModelId(settings?.selectedAiModel), availableModels: AVAILABLE_GEMINI_MODELS,
      hasActiveKey: keys.some(key => key.isActive), providerQuotaMessage: 'Quota và billing của Google phụ thuộc project/model; kiểm tra trong AI Studio. Nhiều khóa cùng project không nhân hạn mức.',
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return failure(error); }
}
export async function POST(req: NextRequest) {
  if (!isSameOriginMutation(req)) return NextResponse.json({ error: 'Yêu cầu không hợp lệ' }, { status: 403 });
  try {
    const user = await requireRequestAuth(req);
    const parsed = CreateSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Khóa hoặc tên khóa không hợp lệ' }, { status: 400 });
    const { apiKey, clientRequestId } = parsed.data;
    const label = parsed.data.label ?? 'Khóa Gemini';
    const id = clientRequestId ? `key_req_${createHash('sha256').update(JSON.stringify([user.id, clientRequestId])).digest('hex').slice(0, 40)}` : undefined;
    try {
      const key = await prisma.userApiKey.create({ data: { ...(id ? { id } : {}), userId: user.id, label, ...encryptApiKey(apiKey), isActive: true }, select: selection });
      return NextResponse.json({ success: true, key }, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
      if (!id || !(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') throw error;
      const saved = await prisma.userApiKey.findFirst({ where: { id, userId: user.id } });
      if (!saved) throw new ApiError(409, 'Chưa xác nhận được lần lưu trước. Hãy tải lại danh sách khóa.', 'KEY_REQUEST_CONFLICT');
      // Compare only in server memory. Neither plaintext nor encrypted material belongs in a receipt.
      const previous = Buffer.from(decryptApiKey(saved.keyEncrypted, saved.keyIv, saved.keyTag));
      const incoming = Buffer.from(apiKey);
      if (saved.label !== label || previous.length !== incoming.length || !timingSafeEqual(previous, incoming)) throw new ApiError(409, 'Mã yêu cầu đã lưu nội dung khác. Chưa ghi đè khóa; hãy kiểm tra danh sách trước khi lưu mới.', 'KEY_REQUEST_CONFLICT');
      const key = Object.fromEntries(Object.keys(selection).map(field => [field, saved[field as keyof typeof selection]]));
      return NextResponse.json({ success: true, replayed: true, key }, { headers: { 'Cache-Control': 'no-store' } });
    }
  } catch (error) { return failure(error); }
}
export async function DELETE(req: NextRequest) {
  if (!isSameOriginMutation(req)) return NextResponse.json({ error: 'Yêu cầu không hợp lệ' }, { status: 403 });
  try {
    const user = await requireRequestAuth(req); const id = new URL(req.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Thiếu mã khóa' }, { status: 400 });
    const result = await prisma.userApiKey.deleteMany({ where: { id, userId: user.id } });
    return NextResponse.json(result.count ? { success: true } : { error: 'Không tìm thấy khóa của bạn' }, { status: result.count ? 200 : 404 });
  } catch (error) { return failure(error); }
}
export async function PATCH(req: NextRequest) {
  if (!isSameOriginMutation(req)) return NextResponse.json({ error: 'Yêu cầu không hợp lệ' }, { status: 403 });
  try {
    const user = await requireRequestAuth(req); const body = await req.json().catch(() => null);
    if (body?.action === 'set_model') {
      const model = normalizeModelId(body.model);
      if (!model) return NextResponse.json({ error: 'Mã model không hợp lệ' }, { status: 400 });
      await prisma.user.update({ where: { id: user.id }, data: { selectedAiModel: model } });
      return NextResponse.json({ success: true, selectedAiModel: model, verified: false });
    }
    const parsed = z.object({ id: z.string().min(1), isActive: z.boolean().optional(), label: z.string().trim().min(1).max(120).optional() }).strict().safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Dữ liệu cập nhật không hợp lệ' }, { status: 400 });
    const result = await prisma.userApiKey.updateMany({ where: { id: parsed.data.id, userId: user.id }, data: { isActive: parsed.data.isActive, label: parsed.data.label } });
    if (!result.count) return NextResponse.json({ error: 'Không tìm thấy khóa của bạn' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) { return failure(error); }
}
