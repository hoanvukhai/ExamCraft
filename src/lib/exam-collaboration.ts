import type { Prisma } from '@prisma/client';
import { ApiError } from './api-error';

export type CollaborationRole = 'OWNER' | 'VIEWER' | 'COMMENTER' | 'EDITOR';
export function collaborationPermissions(role: CollaborationRole) {
  return { role, canRead: true, canEdit: role === 'OWNER' || role === 'EDITOR', canComment: role !== 'VIEWER', canManage: role === 'OWNER', canPublish: role === 'OWNER' };
}
export type ExamPermissions = ReturnType<typeof collaborationPermissions>;
export function assertCollaborationEdit(permissions: ExamPermissions, input: Record<string, unknown>) {
  if (!permissions.canEdit) throw new ApiError(403, 'Bạn chỉ được xem hoặc góp ý đề này');
  if (!permissions.canManage) {
    const forbidden = ['folderId', 'templateId', 'isStarred', 'restore', 'questionItems', 'variantCount'];
    if (forbidden.some(field => input[field] !== undefined)) throw new ApiError(403, 'Chỉ chủ đề được thay đổi thư mục, mẫu, cấu hình phát hành hoặc quyền quản lý');
    if (input.document === undefined) throw new ApiError(400, 'Hãy lưu bản nội dung đầy đủ của đề để giữ ngữ liệu và đáp án');
  }
}
/** Serialize grant revocation and writes on the same exam row. No changes to the row itself. */
export async function lockExam(tx: Prisma.TransactionClient, id: string) {
  await tx.$queryRaw`SELECT "id" FROM "Exam" WHERE "id" = ${id} FOR UPDATE`;
}
export async function examAccess(tx: Prisma.TransactionClient, exam: { id: string; ownerId: string; deletedAt?: Date | null }, actorId: string, allowTrash = false): Promise<ExamPermissions> {
  if (exam.deletedAt && (!allowTrash || exam.ownerId !== actorId)) throw new ApiError(404, 'Không tìm thấy đề thi');
  if (exam.ownerId === actorId) return collaborationPermissions('OWNER');
  const grant = await tx.examCollaborator.findUnique({ where: { examId_userId: { examId: exam.id, userId: actorId } } });
  if (!grant || grant.revokedAt) throw new ApiError(404, 'Không tìm thấy đề hoặc quyền truy cập đã bị thu hồi');
  return collaborationPermissions(grant.role);
}
export async function requireExamAccess(tx: Prisma.TransactionClient, id: string, actorId: string, action: 'read' | 'comment' | 'manage' = 'read') {
  const exam = await tx.exam.findUnique({ where: { id } });
  if (!exam) throw new ApiError(404, 'Không tìm thấy đề thi');
  const permissions = await examAccess(tx, exam, actorId);
  if (action === 'manage' && !permissions.canManage) throw new ApiError(403, 'Chỉ chủ đề được quản lý chia sẻ và lịch sử');
  if (action === 'comment' && !permissions.canComment) throw new ApiError(403, 'Bạn chưa được cấp quyền góp ý');
  return { exam, permissions };
}

export async function setExamCollaborator(tx: Prisma.TransactionClient, examId: string, actorId: string, email: string, role: 'VIEWER' | 'COMMENTER' | 'EDITOR') {
  await lockExam(tx, examId);
  const { exam } = await requireExamAccess(tx, examId, actorId, 'manage');
  const user = await tx.user.findFirst({ where: { email: { equals: email.trim(), mode: 'insensitive' }, isActive: true }, select: { id: true } });
  if (!user) throw new ApiError(404, 'Chưa tìm thấy tài khoản đang hoạt động với email này');
  if (user.id === exam.ownerId) throw new ApiError(400, 'Chủ đề đã có toàn quyền');
  return tx.examCollaborator.upsert({ where: { examId_userId: { examId, userId: user.id } }, create: { examId, userId: user.id, role }, update: { role, revokedAt: null }, select: { id: true, role: true, userId: true } });
}
export async function revokeExamCollaborator(tx: Prisma.TransactionClient, examId: string, actorId: string, userId: string) {
  await lockExam(tx, examId);
  await requireExamAccess(tx, examId, actorId, 'manage');
  await tx.examCollaborator.updateMany({ where: { examId, userId, revokedAt: null }, data: { revokedAt: new Date() } });
}
