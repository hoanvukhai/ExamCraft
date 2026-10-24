import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireRequestAuth } from '@/lib/request-auth';
import { ApiError, apiErrorResponse } from '@/lib/api-error';
import { isSameOriginMutation } from '@/lib/attempt-access';

const Schema = z.object({ showAnswers: z.boolean().default(false), allowCopy: z.boolean().default(false), expiresAt: z.iso.datetime({ offset: true }).optional() });
function failure(error: unknown) {
  if (error instanceof ApiError) return apiErrorResponse(error, 'Chưa xử lý được chia sẻ');
  const message = error instanceof Error ? error.message : '';
  if (message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  if (message === 'MUST_CHANGE_PASSWORD') return NextResponse.json({ error: 'Vui lòng đổi mật khẩu trước khi chia sẻ' }, { status: 403 });
  console.error('Share link operation failed', error);
  return NextResponse.json({ error: 'Chưa thể xử lý liên kết chia sẻ' }, { status: 500 });
}
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOriginMutation(req)) return NextResponse.json({ error: 'Yêu cầu không hợp lệ' }, { status: 403 });
  try {
    const user = await requireRequestAuth(req); const { id } = await params;
    const parsed = Schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success || (parsed.data.expiresAt && new Date(parsed.data.expiresAt) <= new Date())) return NextResponse.json({ error: 'Cấu hình chia sẻ không hợp lệ' }, { status: 400 });
    const exam = await prisma.exam.findFirst({ where: { id, ownerId: user.id, deletedAt: null }, include: { items: { include: { question: { select: { shareable: true, deletedAt: true, ownerId: true } } } } } });
    if (!exam) return NextResponse.json({ error: 'Không tìm thấy đề thi của bạn' }, { status: 404 });
    if (exam.items.some(item => !item.question.shareable || item.question.deletedAt || item.question.ownerId !== user.id)) return NextResponse.json({ error: 'Đề có câu hỏi không được phép chia sẻ hoặc đã xóa' }, { status: 403 });
    const link = await prisma.shareLink.create({ data: { examId: id, token: randomBytes(32).toString('base64url'), showAnswers: parsed.data.showAnswers, allowCopy: parsed.data.allowCopy, expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null } });
    return NextResponse.json({ success: true, link: { id: link.id, showAnswers: link.showAnswers, allowCopy: link.allowCopy, expiresAt: link.expiresAt }, publicLink: '/share/' + link.token }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return failure(error); }
}
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRequestAuth(req); const { id } = await params;
    const exam = await prisma.exam.findFirst({ where: { id, ownerId: user.id, deletedAt: null }, select: { id: true } });
    if (!exam) return NextResponse.json({ error: 'Không tìm thấy đề thi của bạn' }, { status: 404 });
    const links = await prisma.shareLink.findMany({ where: { examId: id, revokedAt: null }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ links: links.map(link => ({ id: link.id, publicLink: '/share/' + link.token, showAnswers: link.showAnswers, allowCopy: link.allowCopy, expiresAt: link.expiresAt })) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return failure(error); }
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOriginMutation(req)) return NextResponse.json({ error: 'Yêu cầu không hợp lệ' }, { status: 403 });
  try {
    const user = await requireRequestAuth(req); const { id } = await params;
    const body = await req.json().catch(() => null);
    if (typeof body?.linkId !== 'string') return NextResponse.json({ error: 'Thiếu mã liên kết' }, { status: 400 });
    const result = await prisma.shareLink.updateMany({ where: { id: body.linkId, examId: id, exam: { ownerId: user.id, deletedAt: null } }, data: { revokedAt: new Date() } });
    if (!result.count) return NextResponse.json({ error: 'Không tìm thấy liên kết thuộc quyền của bạn' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) { return failure(error); }
}
