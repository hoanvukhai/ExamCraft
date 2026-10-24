import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma, QuestionType, Difficulty, Visibility } from '@prisma/client';
import prisma from '@/lib/prisma';
import { requireRequestAuth } from '@/lib/request-auth';
import { ApiError, apiErrorResponse } from '@/lib/api-error';
import { isSameOriginMutation } from '@/lib/attempt-access';
import { forkPayload } from '@/lib/question-history';

type Context = { params: Promise<{ id: string }> };
const updateSchema = z.object({
  baseVersion: z.number().int().positive().optional(), subject: z.string().min(1).max(100).optional(), grade: z.number().int().min(1).max(12).optional(),
  type: z.nativeEnum(QuestionType).optional(), difficulty: z.nativeEnum(Difficulty).optional(), content: z.string().trim().min(1).optional(),
  figures: z.unknown().optional(), payload: z.record(z.string(), z.unknown()).optional(), solution: z.string().optional(), points: z.number().finite().nonnegative().max(999).nullable().optional(),
  topics: z.array(z.string()).max(100).optional(), tags: z.array(z.string()).max(100).optional(), visibility: z.nativeEnum(Visibility).optional(), revisionNote: z.string().max(2000).optional(),
}).strict();
const json = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
export async function GET(req: NextRequest, { params }: Context) {
  try {
    const user = await requireRequestAuth(req), { id } = await params;
    const question = await prisma.question.findFirst({ where: { id, deletedAt: null }, include: { passage: true, author: { select: { id: true, name: true } }, revisions: { select: { id: true, version: true, note: true, createdAt: true }, orderBy: { version: 'desc' }, take: 100 } } });
    if (!question || (question.ownerId !== user.id && question.visibility !== 'SHARED')) throw new ApiError(404, 'Không tìm thấy câu hỏi được phép xem');
    if (question.passage && question.passage.ownerId !== question.ownerId) throw new ApiError(403, 'Ngữ liệu ngoài quyền truy cập của câu hỏi');
    return NextResponse.json({ question: { ...question, revisions: question.ownerId === user.id ? question.revisions : [] } }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return apiErrorResponse(error, 'Không tải được câu hỏi'); }
}
export async function PATCH(req: NextRequest, { params }: Context) {
  try {
    if (!isSameOriginMutation(req)) throw new ApiError(403, 'Yêu cầu không hợp lệ');
    const user = await requireRequestAuth(req), { id } = await params;
    const parsed = updateSchema.safeParse(await req.json());
    if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message ?? 'Nội dung không hợp lệ');
    if (!parsed.data.baseVersion) throw new ApiError(428, 'Cần phiên bản câu hỏi hiện tại trước khi lưu', 'VERSION_REQUIRED');
    const { baseVersion, revisionNote, ...fields } = parsed.data;
    const question = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT "id" FROM "Question" WHERE "id" = ${id} FOR UPDATE`;
      const current = await tx.question.findFirst({ where: { id, ownerId: user.id, deletedAt: null } });
      if (!current) throw new ApiError(404, 'Không tìm thấy câu hỏi trong kho riêng');
      if (current.tags.includes('__workspace_only')) throw new ApiError(409, 'Hãy mở đề để sửa câu hỏi này cùng nội dung đề đầy đủ');
      if (current.version !== baseVersion) throw new ApiError(409, 'Câu hỏi đã thay đổi; bản đang sửa chưa bị ghi đè', 'VERSION_CONFLICT');
      const result = await tx.question.updateMany({ where: { id, ownerId: user.id, deletedAt: null, version: baseVersion }, data: {
        ...fields, figures: fields.figures === undefined ? undefined : fields.figures === null ? Prisma.JsonNull : json(fields.figures),
        payload: fields.payload ? forkPayload(fields.payload, id, current.passageId) : undefined,
        tags: fields.tags?.filter(tag => tag !== '__workspace_only'), version: { increment: 1 }, status: 'DRAFT', verifiedBy: 'NONE',
      } });
      if (result.count !== 1) throw new ApiError(409, 'Câu hỏi vừa đổi hoặc đã xóa', 'VERSION_CONFLICT');
      const saved = await tx.question.findUniqueOrThrow({ where: { id }, include: { passage: true } });
      await tx.questionRevision.create({ data: { questionId: id, version: saved.version, snapshot: json(saved), note: revisionNote ?? 'Lưu nội dung câu hỏi' } });
      return saved;
    });
    return NextResponse.json({ success: true, question }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return apiErrorResponse(error, 'Chưa lưu được câu hỏi'); }
}
export async function DELETE(req: NextRequest, { params }: Context) {
  try {
    if (!isSameOriginMutation(req)) throw new ApiError(403, 'Yêu cầu không hợp lệ');
    const user = await requireRequestAuth(req), { id } = await params;
    await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT "id" FROM "Question" WHERE "id" = ${id} FOR UPDATE`;
      const current = await tx.question.findFirst({ where: { id, ownerId: user.id, deletedAt: null } });
      if (!current) throw new ApiError(404, 'Không tìm thấy câu hỏi trong kho riêng');
      if (current.tags.includes('__workspace_only')) throw new ApiError(409, 'Hãy mở đề để sửa hoặc xóa câu hỏi này');
      const result = await tx.question.updateMany({ where: { id, ownerId: user.id, deletedAt: null, version: current.version }, data: { deletedAt: new Date(), version: { increment: 1 } } });
      if (result.count !== 1) throw new ApiError(409, 'Câu hỏi vừa thay đổi; hãy tải lại', 'VERSION_CONFLICT');
      const saved = await tx.question.findUniqueOrThrow({ where: { id } });
      await tx.questionRevision.create({ data: { questionId: id, version: saved.version, snapshot: json(saved), note: 'Xóa khỏi ngân hàng riêng' } });
    });
    return NextResponse.json({ success: true });
  } catch (error) { return apiErrorResponse(error, 'Chưa xóa được câu hỏi'); }
}
