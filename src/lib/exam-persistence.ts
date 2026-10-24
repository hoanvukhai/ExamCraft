import { createHash, randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { ApiError } from './api-error';
import { normalizeExamDocument, questionToDatabase, fromDatabaseExam } from './exam-document';
import { assertKnowledgeRevision } from './knowledge-package';
import type { Exam } from '@/types/exam';
import { examAccess, assertCollaborationEdit, lockExam } from './exam-collaboration';

const item = z.object({ questionId: z.string().min(1), sectionId: z.string().min(1), position: z.number().int().nonnegative(), pointsOverride: z.number().finite().nonnegative().nullable().optional() });
const shared = {
  title: z.string().trim().min(1).max(500).optional(), subject: z.string().trim().min(1).optional(),
  grade: z.number().int().min(1).max(12).optional(), durationMinutes: z.number().int().nonnegative().nullable().optional(),
  templateId: z.string().nullable().optional(), folderId: z.string().nullable().optional(), isStarred: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(), sections: z.array(z.record(z.string(), z.unknown())).optional(),
  variantCount: z.number().int().min(1).max(100).optional(), questionItems: z.array(item).max(1000).optional(),
  document: z.unknown().optional(),
};
export const createExamSchema = z.object({ ...shared, clientId: z.string().min(1).max(200).optional() });
export const updateExamSchema = z.object({ ...shared, baseVersion: z.number().int().positive().optional(), restore: z.boolean().optional() }).strict();
export type CreateExamInput = z.infer<typeof createExamSchema>;
export type UpdateExamInput = z.infer<typeof updateExamSchema>;
const json = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
const stableId = (kind: string, ...parts: string[]) => `${kind}_${createHash('sha256').update(JSON.stringify(parts)).digest('hex').slice(0, 40)}`;

export async function assertExamReferences(tx: Prisma.TransactionClient, ownerId: string, input: CreateExamInput) {
  if (input.folderId && !await tx.folder.findFirst({ where: { id: input.folderId, ownerId }, select: { id: true } })) throw new ApiError(403, 'Thư mục không thuộc tài khoản của bạn');
  if (input.templateId && !await tx.examTemplate.findFirst({ where: { id: input.templateId, OR: [{ ownerId }, { ownerId: null, isSystem: true }] }, select: { id: true } })) throw new ApiError(403, 'Bạn không được sử dụng mẫu này');
  const ids = [...new Set(input.questionItems?.map(i => i.questionId) ?? [])];
  if (ids.length && await tx.question.count({ where: { id: { in: ids }, ownerId, deletedAt: null } }) !== ids.length) throw new ApiError(403, 'Một số câu hỏi không thuộc kho riêng của bạn; hãy tạo bản sao được phép trước');
  const positions = input.questionItems?.map(i => i.position) ?? [];
  if (new Set(positions).size !== positions.length) throw new ApiError(400, 'Vị trí câu hỏi bị trùng');
}

function documentData(document: Exam) {
  // Access comes from the current server grant, never from a portable document.
  document = JSON.parse(JSON.stringify(document));
  const raw = document as unknown as Record<string, unknown>;
  for (const key of ['access', 'permissions', 'ownerId', 'collaborators']) delete raw[key];
  const metadata = document.metadata as unknown as Record<string, unknown>;
  for (const key of ['access', 'permissions', 'workspaceDocument']) delete metadata[key];
  const sections = Array.isArray(raw.sections) && raw.sections.length ? raw.sections : [{ id: 'workspace', name: 'Nội dung bài', type: 'mixed' }];
  return { title: document.metadata.title, subject: document.metadata.subject, grade: document.metadata.grade,
    durationMinutes: document.metadata.durationMinutes ?? null,
    metadata: json({ ...document.metadata, workspaceDocument: document }), sections: json(sections) };
}

async function writeDocumentQuestions(tx: Prisma.TransactionClient, ownerId: string, examId: string, document: Exam) {
  await tx.examQuestion.deleteMany({ where: { examId } });
  for (const [position, question] of document.questions.entries()) {
    const questionId = stableId('wq', ownerId, examId, question.id);
    const existing = await tx.question.findUnique({ where: { id: questionId } });
    if (existing && existing.ownerId !== ownerId) throw new ApiError(403, 'Không thể ghi câu hỏi của tài khoản khác');
    const data = questionToDatabase(question, { ownerId, examId, questionId, subject: document.metadata.subject, grade: document.metadata.grade });
    data.tags = [...(question.tags ?? []).filter(tag => tag !== '__workspace_only'), '__workspace_only'];
    const saved = existing ? await tx.question.update({ where: { id: questionId }, data: { ...data, version: existing.version + 1, deletedAt: null } }) : await tx.question.create({ data });
    await tx.questionRevision.create({ data: { questionId, version: saved.version, snapshot: json(saved), note: `Lưu trong đề ${examId}` } });
    await tx.examQuestion.create({ data: { examId, questionId, position, sectionId: String((question as unknown as Record<string, unknown>).sectionId ?? 'workspace'), pointsOverride: question.points } });
  }
}

const include = { items: { include: { question: { include: { passage: true } } }, orderBy: { position: 'asc' as const } } };
export function checkLinkedOwners(exam: { items?: { question: { ownerId?: string; passage?: { ownerId?: string } | null } }[] }, ownerId: string) {
  if (exam.items?.some(item => item.question.ownerId !== ownerId || (item.question.passage && item.question.passage.ownerId !== ownerId))) throw new ApiError(403, 'Đề có tài liệu ngoài quyền truy cập; cần tạo bản sao được phép');
}

export async function recordExamRevision(tx: Prisma.TransactionClient, exam: Parameters<typeof fromDatabaseExam>[0] & { id: string; version: number }, actorId: string | null, note: string) {
  await tx.examRevision.createMany({ data: [{ examId: exam.id, version: exam.version, actorId, snapshot: json(fromDatabaseExam(exam)), note }], skipDuplicates: true });
}

export async function createExam(tx: Prisma.TransactionClient, ownerId: string, input: CreateExamInput) {
  await assertExamReferences(tx, ownerId, input);
  const document = input.document === undefined ? undefined : normalizeExamDocument(input.document);
  const clientId = input.clientId ?? document?.id;
  const id = clientId ? stableId('ex', ownerId, clientId) : `ex_${randomUUID()}`;
  const existing = await tx.exam.findUnique({ where: { id }, include });
  if (existing) {
    checkLinkedOwners(existing, ownerId);
    if (existing.ownerId !== ownerId || existing.deletedAt) throw new ApiError(409, 'Bản nháp đã được lưu hoặc chuyển vào thùng rác; hãy mở lại từ kho đề', 'CREATE_CONFLICT');
    // A repeat create is safe only when it is the same document, never overwrite a later save.
    const stored = existing.metadata as Record<string, unknown>;
    const originalId = document?.id;
    const saved = stored.workspaceDocument as Exam | undefined;
    // PostgreSQL JSONB reorders object keys. Compare canonical content, not wire order.
    const comparable = (d: Exam) => JSON.stringify({ ...d, id: originalId, version: undefined, updatedAt: undefined, createdAt: undefined }, (_key, value) =>
      value && typeof value === 'object' && !Array.isArray(value) ? Object.fromEntries(Object.keys(value).sort().map(key => [key, value[key]])) : value);
    if (document && saved && comparable(document) === comparable(saved)) return existing;
    throw new ApiError(409, 'Bản nháp này đã có trên máy chủ. Hãy mở bản đã lưu trước khi ghi tiếp', 'CREATE_CONFLICT');
  }
  if (!document && (!input.title || !input.subject || !input.grade)) throw new ApiError(400, 'Cần tên đề, môn và lớp');
  const data = document ? documentData({ ...document, id, version: 1 }) : {
    title: input.title!, subject: input.subject!, grade: input.grade!, durationMinutes: input.durationMinutes,
    metadata: json(Object.fromEntries(Object.entries(input.metadata ?? {}).filter(([k]) => k !== 'workspaceDocument'))), sections: json(input.sections ?? []),
  };
  await tx.exam.create({ data: { id, ownerId, ...data, folderId: input.folderId, templateId: input.templateId, isStarred: input.isStarred ?? false, variantCount: input.variantCount ?? 1 } });
  if (document) await writeDocumentQuestions(tx, ownerId, id, document);
  else if (input.questionItems?.length) await tx.examQuestion.createMany({ data: input.questionItems.map(i => ({ ...i, examId: id })) });
  const saved = await tx.exam.findUniqueOrThrow({ where: { id }, include });
  checkLinkedOwners(saved, ownerId);
  await recordExamRevision(tx, saved, ownerId, 'Tạo đề');
  return saved;
}

export async function updateExam(tx: Prisma.TransactionClient, actorId: string, id: string, input: UpdateExamInput) {
  await lockExam(tx, id);
  const current = await tx.exam.findUnique({ where: { id }, include });
  if (!current) throw new ApiError(404, 'Không tìm thấy đề thi');
  const permissions = await examAccess(tx, current, actorId, Boolean(input.restore));
  assertCollaborationEdit(permissions, input);
  const ownerId = current.ownerId;
  checkLinkedOwners(current, ownerId);
  if (current.deletedAt && !input.restore) throw new ApiError(409, 'Đề đang ở thùng rác; hãy khôi phục trước');
  if (input.questionItems && (current.metadata as Record<string, unknown>).workspaceDocument) throw new ApiError(400, 'Đề này cần được lưu bằng bản document đầy đủ để giữ ngữ liệu và đáp án');
  if (input.baseVersion == null) throw new ApiError(428, 'Cần tải lại phiên bản đề trước khi lưu', 'VERSION_REQUIRED');
  if (input.baseVersion !== current.version) throw new ApiError(409, 'Đề đã thay đổi ở phiên khác. Bản nháp của bạn vẫn được giữ để đối chiếu', 'VERSION_CONFLICT');
  await assertExamReferences(tx, ownerId, input);
  const document = input.document === undefined ? undefined : normalizeExamDocument(input.document);
  if (document && document.id !== id) throw new ApiError(400, 'Mã đề trong bản nháp không khớp đề đang lưu');
  if (document) try { assertKnowledgeRevision(fromDatabaseExam(current).metadata.knowledgePackage, document.metadata.knowledgePackage); } catch (error) { throw new ApiError(409, error instanceof Error ? error.message : 'Phiên bản gói đã thay đổi', 'KNOWLEDGE_REVISION_CONFLICT'); }
  const metadata = { ...(current.metadata as Record<string, unknown>), ...input.metadata };
  if (input.metadata && 'workspaceDocument' in input.metadata) throw new ApiError(400, 'Hãy lưu nội dung bằng trường document');
  if (input.metadata && ('knowledgePackage' in input.metadata || 'knowledgeScope' in input.metadata)) throw new ApiError(400, 'Hãy lưu gói kiến thức và phạm vi bằng document đầy đủ');
  const data: Prisma.ExamUpdateManyMutationInput = document ? documentData({ ...document, id, version: current.version + 1 }) : {
    title: input.title, subject: input.subject, grade: input.grade, durationMinutes: input.durationMinutes,
    metadata: input.metadata ? json(metadata) : undefined, sections: input.sections ? json(input.sections) : undefined,
  };
  await recordExamRevision(tx, current, null, 'Bản nền trước lần lưu tiếp theo');
  const result = await tx.exam.updateMany({ where: { id, ownerId, version: input.baseVersion }, data: { ...data, folderId: input.folderId, templateId: input.templateId, isStarred: input.isStarred, variantCount: input.variantCount, deletedAt: input.restore ? null : undefined, version: { increment: 1 } } });
  if (result.count !== 1) throw new ApiError(409, 'Đề vừa được lưu ở phiên khác; hãy đối chiếu bản nháp', 'VERSION_CONFLICT');
  if (document) await writeDocumentQuestions(tx, ownerId, id, document);
  else if (input.questionItems) { await tx.examQuestion.deleteMany({ where: { examId: id } }); if (input.questionItems.length) await tx.examQuestion.createMany({ data: input.questionItems.map(i => ({ ...i, examId: id })) }); }
  const saved = await tx.exam.findUniqueOrThrow({ where: { id }, include });
  await recordExamRevision(tx, saved, actorId, input.restore ? 'Khôi phục đề' : 'Lưu nội dung');
  return saved;
}
