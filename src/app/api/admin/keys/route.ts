import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireAdmin, logAudit } from '@/lib/auth';
import { assertRequestAccount } from '@/lib/request-account';
import { isSameOriginMutation } from '@/lib/attempt-access';
import { ApiError, apiErrorResponse } from '@/lib/api-error';
import { decryptApiKey, encryptApiKey } from '@/lib/crypto';

const noStore = { 'Cache-Control': 'private, no-store' };
const userIds = z.array(z.string().min(1).max(200)).min(1).max(200);
const CreateSchema = z.union([
  z.object({ label: z.string().trim().min(1).max(120), apiKey: z.string().trim().min(10).max(500), userIds }).strict(),
  z.object({ grantId: z.string().min(1).max(200), userIds }).strict(),
]);
const ToggleSchema = z.object({ grantId: z.string().min(1).max(200), userId: z.string().min(1).max(200).optional(), isActive: z.boolean() }).strict();

function failure(error: unknown) {
  if (error instanceof ApiError) return apiErrorResponse(error, 'Yêu cầu cấp khóa bị từ chối');
  const message = error instanceof Error ? error.message : '';
  if (message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  if (message === 'MUST_CHANGE_PASSWORD') return NextResponse.json({ error: 'Vui lòng đổi mật khẩu trước khi tiếp tục', code: 'MUST_CHANGE_PASSWORD' }, { status: 403 });
  if (message === 'FORBIDDEN') return NextResponse.json({ error: 'Bạn không có quyền quản trị viên' }, { status: 403 });
  console.warn('Admin key grant failed');
  return NextResponse.json({ error: 'Chưa xử lý được việc cấp khóa. Kiểm tra cấu hình mã hóa và thử lại.' }, { status: 500 });
}

/** Grants without any secret: the masked tail of the key, who got it, and how it is doing. */
export async function GET() {
  try {
    await requireAdmin();
    const rows = await prisma.userApiKey.findMany({ where: { grantId: { not: null } }, orderBy: { createdAt: 'desc' },
      select: { id: true, grantId: true, grantedById: true, label: true, keyMasked: true, isActive: true, errorCount: true, lastUsedAt: true, createdAt: true, user: { select: { id: true, name: true, email: true, isActive: true } } } });
    const grants = new Map<string, { grantId: string; label: string; keyMasked: string; createdAt: Date; grantedById: string | null; recipients: unknown[] }>();
    for (const row of rows) {
      const grant = grants.get(row.grantId!) ?? { grantId: row.grantId!, label: row.label, keyMasked: row.keyMasked, createdAt: row.createdAt, grantedById: row.grantedById, recipients: [] };
      grant.recipients.push({ userId: row.user.id, name: row.user.name, email: row.user.email, accountActive: row.user.isActive, isActive: row.isActive, errorCount: row.errorCount, lastUsedAt: row.lastUsedAt });
      if (row.createdAt < grant.createdAt) grant.createdAt = row.createdAt;
      grants.set(row.grantId!, grant);
    }
    return NextResponse.json({ grants: [...grants.values()] }, { headers: noStore });
  } catch (error) { return failure(error); }
}

/** Give a new key to chosen teachers, or add teachers to a grant that already exists (the key is copied inside the server). */
export async function POST(req: NextRequest) {
  try {
    if (!isSameOriginMutation(req)) throw new ApiError(403, 'Yêu cầu không hợp lệ');
    const admin = await requireAdmin();
    assertRequestAccount(req.headers, admin.id);
    const parsed = CreateSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new ApiError(400, 'Cần tên khóa, khóa API (ít nhất 10 ký tự) và ít nhất một giáo viên nhận');
    const recipients = [...new Set(parsed.data.userIds)];
    const users = await prisma.user.findMany({ where: { id: { in: recipients }, isActive: true }, select: { id: true } });
    if (users.length !== recipients.length) throw new ApiError(404, 'Có tài khoản không tồn tại hoặc đang bị khóa');
    let grantId: string, label: string, material: ReturnType<typeof encryptApiKey>;
    if ('apiKey' in parsed.data) { grantId = randomUUID(); label = parsed.data.label; material = encryptApiKey(parsed.data.apiKey); }
    else {
      const source = await prisma.userApiKey.findFirst({ where: { grantId: parsed.data.grantId } });
      if (!source) throw new ApiError(404, 'Không tìm thấy khóa đã cấp');
      grantId = source.grantId!; label = source.label;
      material = { keyEncrypted: source.keyEncrypted, keyIv: source.keyIv, keyTag: source.keyTag, keyMasked: source.keyMasked };
      // Reading the key proves it still decrypts before more copies are made.
      decryptApiKey(source.keyEncrypted, source.keyIv, source.keyTag);
    }
    const existing = new Set((await prisma.userApiKey.findMany({ where: { grantId, userId: { in: recipients } }, select: { userId: true } })).map(row => row.userId));
    const fresh = recipients.filter(id => !existing.has(id));
    if (fresh.length) await prisma.userApiKey.createMany({ data: fresh.map(userId => ({ userId, label, ...material, isActive: true, grantId, grantedById: admin.id })) });
    await logAudit({ actorId: admin.id, action: 'admin.key.grant', targetType: 'KeyGrant', targetId: grantId, meta: { recipients: fresh.length, alreadyHad: existing.size } });
    return NextResponse.json({ success: true, grantId, added: fresh.length, alreadyHad: existing.size }, { headers: noStore });
  } catch (error) { return failure(error); }
}

/** Switch a granted key off or on, for one teacher or for everyone who received it. */
export async function PATCH(req: NextRequest) {
  try {
    if (!isSameOriginMutation(req)) throw new ApiError(403, 'Yêu cầu không hợp lệ');
    const admin = await requireAdmin();
    assertRequestAccount(req.headers, admin.id);
    const parsed = ToggleSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new ApiError(400, 'Dữ liệu cập nhật không hợp lệ');
    const result = await prisma.userApiKey.updateMany({ where: { grantId: parsed.data.grantId, ...(parsed.data.userId ? { userId: parsed.data.userId } : {}) }, data: { isActive: parsed.data.isActive, ...(parsed.data.isActive ? { errorCount: 0 } : {}) } });
    if (!result.count) throw new ApiError(404, 'Không tìm thấy khóa đã cấp');
    await logAudit({ actorId: admin.id, action: parsed.data.isActive ? 'admin.key.enable' : 'admin.key.disable', targetType: 'KeyGrant', targetId: parsed.data.grantId, meta: { rows: result.count, userId: parsed.data.userId ?? null } });
    return NextResponse.json({ success: true, rows: result.count }, { headers: noStore });
  } catch (error) { return failure(error); }
}

/** Take a granted key back: from one teacher, or from everyone. The key is deleted, not just hidden. */
export async function DELETE(req: NextRequest) {
  try {
    if (!isSameOriginMutation(req)) throw new ApiError(403, 'Yêu cầu không hợp lệ');
    const admin = await requireAdmin();
    assertRequestAccount(req.headers, admin.id);
    const params = new URL(req.url).searchParams, grantId = params.get('grantId'), userId = params.get('userId');
    if (!grantId) throw new ApiError(400, 'Thiếu mã khóa đã cấp');
    const result = await prisma.userApiKey.deleteMany({ where: { grantId, ...(userId ? { userId } : {}) } });
    if (!result.count) throw new ApiError(404, 'Không tìm thấy khóa đã cấp');
    await logAudit({ actorId: admin.id, action: 'admin.key.revoke', targetType: 'KeyGrant', targetId: grantId, meta: { rows: result.count, userId } });
    return NextResponse.json({ success: true, rows: result.count }, { headers: noStore });
  } catch (error) { return failure(error); }
}
