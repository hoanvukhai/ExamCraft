import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { apiErrorResponse, ApiError } from '@/lib/api-error';
import { updateExam, updateExamSchema, checkLinkedOwners, recordExamRevision } from '@/lib/exam-persistence';
import { fromDatabaseExam } from '@/lib/exam-document';
import { examAccess, lockExam } from '@/lib/exam-collaboration';
import { isSameOriginMutation } from '@/lib/attempt-access';
import { assertRequestAccount } from '@/lib/request-account';
type Context = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Context) {
  try {
    const user = await requireAuth(), { id } = await params;
    assertRequestAccount(_req.headers, user.id);
    const exam = await prisma.exam.findFirst({ where: { id, deletedAt: null }, include: { items: { include: { question: { include: { passage: true } } }, orderBy: { position: 'asc' } } } });
    if (!exam) throw new ApiError(404, 'Không tìm thấy đề thi');
    const permissions = await examAccess(prisma, exam, user.id);
    checkLinkedOwners(exam, exam.ownerId);
    return NextResponse.json({ ...(permissions.canManage ? { exam } : {}), document: fromDatabaseExam(exam), permissions }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return apiErrorResponse(error, 'Không tải được đề thi'); }
}

export async function PATCH(req: NextRequest, { params }: Context) {
  try {
    if (!isSameOriginMutation(req)) throw new ApiError(403, 'Yêu cầu không hợp lệ');
    const user = await requireAuth(), { id } = await params;
    assertRequestAccount(req.headers, user.id);
    const parsed = updateExamSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' }, { status: 400 });
    const exam = await prisma.$transaction(tx => updateExam(tx, user.id, id, parsed.data), { timeout: 30000 });
    const permissions = await examAccess(prisma, exam, user.id);
    return NextResponse.json({ success: true, ...(permissions.canManage ? { exam } : {}), document: fromDatabaseExam(exam), permissions }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return apiErrorResponse(error, 'Chưa cập nhật được đề thi'); }
}

export async function DELETE(req: NextRequest, { params }: Context) {
  try {
    if (!isSameOriginMutation(req)) throw new ApiError(403, 'Yêu cầu không hợp lệ');
    const user = await requireAuth(), { id } = await params;
    assertRequestAccount(req.headers, user.id);
    // Permanent removal is a separate, explicit action: only the owner, only for an exam already in the trash, and never while an assignment still points at it.
    if (new URL(req.url).searchParams.get('permanent') === '1') {
      await prisma.$transaction(async tx => {
        await lockExam(tx, id);
        const exam = await tx.exam.findFirst({ where: { id, ownerId: user.id }, select: { id: true, title: true, deletedAt: true } });
        if (!exam) throw new ApiError(404, 'Không tìm thấy đề thi của bạn');
        if (!exam.deletedAt) throw new ApiError(409, 'Chỉ xóa vĩnh viễn được đề đang ở thùng rác', 'NOT_IN_TRASH');
        const assignments = await tx.assignment.count({ where: { examId: id } });
        if (assignments) throw new ApiError(409, 'Đề này đã được giao cho học sinh nên không xóa vĩnh viễn được. Hãy để trong thùng rác hoặc xóa bài giao trước.', 'EXAM_HAS_ASSIGNMENTS');
        await tx.auditLog.create({ data: { actorId: user.id, action: 'exam.purge', targetType: 'Exam', targetId: id, meta: { title: exam.title } } });
        await tx.exam.delete({ where: { id } });
      }, { timeout: 30000 });
      return NextResponse.json({ success: true, purged: true });
    }
    const baseVersion = Number(req.headers.get('if-match')?.replaceAll('"', '') ?? new URL(req.url).searchParams.get('baseVersion'));
    if (!Number.isInteger(baseVersion) || baseVersion < 1) throw new ApiError(428, 'Cần tải lại phiên bản đề trước khi chuyển vào thùng rác', 'VERSION_REQUIRED');
    await prisma.$transaction(async tx => {
      await lockExam(tx, id);
      const exam = await tx.exam.findFirst({ where: { id, ownerId: user.id, deletedAt: null }, include: { items: { include: { question: { include: { passage: true } } }, orderBy: { position: 'asc' } } } });
      if (!exam) throw new ApiError(404, 'Không tìm thấy đề thi của bạn');
      await recordExamRevision(tx, exam, null, 'Bản nền trước khi chuyển vào thùng rác');
      const result = await tx.exam.updateMany({ where: { id, ownerId: user.id, version: baseVersion, deletedAt: null }, data: { deletedAt: new Date(), version: { increment: 1 } } });
      if (!result.count) throw new ApiError(409, 'Đề đã thay đổi; hãy tải lại danh sách', 'VERSION_CONFLICT');
      const saved = { ...exam, version: exam.version + 1 };
      await recordExamRevision(tx, saved, user.id, 'Chuyển vào thùng rác');
    });
    return NextResponse.json({ success: true });
  } catch (error) { return apiErrorResponse(error, 'Chưa chuyển được đề vào thùng rác'); }
}
