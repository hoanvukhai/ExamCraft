import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { requireRequestAuth } from '@/lib/request-auth';
import { apiErrorResponse, ApiError } from '@/lib/api-error';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

const failureMessage = 'Không thể xử lý ghi chú hoặc yêu cầu AI lúc này.';
const noStore = { 'Cache-Control': 'private, no-store' };
const fields = { title: z.string().trim().min(1).max(500), insight: z.string().trim().min(1).max(12000), category: z.string().trim().min(1).max(100) };
const updateSchema = z.object({ id: z.string().min(1).max(200), isActive: z.boolean().optional(), title: fields.title.optional(), insight: fields.insight.optional(), category: fields.category.optional() }).strict();
const createSchema = z.object({ ...fields, subject: z.string().trim().min(1).max(100).optional(), sampleQuestion: z.unknown().optional(), clientRequestId: z.uuid().optional() }).strict();
// The same account and request ID always name the same note, so a retry after a lost reply cannot add a second one.
const requestNoteId = (ownerId: string, clientRequestId: string) => `mem_req_${createHash('sha256').update(JSON.stringify([ownerId, clientRequestId])).digest('hex').slice(0, 40)}`;

export async function GET(req: NextRequest) {
  try {
    const user = await requireRequestAuth(req);
    const subject = new URL(req.url).searchParams.get('subject');
    const whereClause: Prisma.TeacherAiMemoryWhereInput = { userId: user.id };
    if (subject && subject !== 'all') whereClause.OR = [{ subject }, { subject: 'all' }];
    const memories = await prisma.teacherAiMemory.findMany({ where: whereClause, orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ success: true, memories, stats: { total: memories.length, activeCount: memories.filter(memory => memory.isActive).length } }, { headers: noStore });
  } catch (error: unknown) {
    return apiErrorResponse(error, failureMessage);
  }
}

export async function POST(req: NextRequest) {
  try {
    // Account and origin are settled before the body is read or the database is touched.
    const user = await requireRequestAuth(req);
    const body: unknown = await req.json();
    if (body && typeof body === 'object' && 'id' in body) {
      const parsed = updateSchema.safeParse(body);
      if (!parsed.success) throw new ApiError(400, 'Dữ liệu cập nhật ghi chú không hợp lệ');
      const { id, ...changes } = parsed.data;
      const result = await prisma.teacherAiMemory.updateMany({ where: { id, userId: user.id }, data: changes });
      if (!result.count) throw new ApiError(404, 'Không tìm thấy ghi chú trong kho riêng của bạn');
      return NextResponse.json({ success: true, memory: await prisma.teacherAiMemory.findFirst({ where: { id, userId: user.id } }) }, { headers: noStore });
    }
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) throw new ApiError(400, 'Tiêu đề và nội dung insight không được trống');
    const { title, insight, category, subject, sampleQuestion, clientRequestId } = parsed.data;
    const data = { userId: user.id, subject: subject ?? 'all', category, title, insight, sampleQuestion: (sampleQuestion as Prisma.InputJsonValue | undefined) ?? Prisma.JsonNull, sourceAction: 'MANUAL_NOTE', confidence: 1.0, isActive: true };
    if (!clientRequestId) return NextResponse.json({ success: true, memory: await prisma.teacherAiMemory.create({ data }) }, { headers: noStore });
    const id = requestNoteId(user.id, clientRequestId);
    try {
      return NextResponse.json({ success: true, memory: await prisma.teacherAiMemory.create({ data: { ...data, id } }) }, { headers: noStore });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') throw error;
      const existing = await prisma.teacherAiMemory.findFirst({ where: { id, userId: user.id } });
      if (!existing || existing.title !== title || existing.insight !== insight || existing.category !== category || existing.subject !== data.subject) throw new ApiError(409, 'Mã yêu cầu này đã lưu nội dung khác. Hãy lưu lại để tạo yêu cầu mới.');
      return NextResponse.json({ success: true, replayed: true, memory: existing }, { headers: noStore });
    }
  } catch (error: unknown) {
    return apiErrorResponse(error, failureMessage);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireRequestAuth(req);
    const id = new URL(req.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Thiếu id tri thức cần xóa' }, { status: 400 });
    const result = await prisma.teacherAiMemory.deleteMany({ where: { id, userId: user.id } });
    return NextResponse.json({ success: true, deleted: result.count }, { headers: noStore });
  } catch (error: unknown) {
    return apiErrorResponse(error, failureMessage);
  }
}
