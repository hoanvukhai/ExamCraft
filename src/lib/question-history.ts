import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import type { Prisma as PrismaTypes } from '@prisma/client';
import { ApiError } from './api-error';
import { normalizeQuestion } from './exam-document';

const json = (value: unknown) => JSON.parse(JSON.stringify(value)) as PrismaTypes.InputJsonValue;
export function forkPayload(payload: unknown, id: string, passageId: string | null) {
  const result = payload && typeof payload === 'object' && !Array.isArray(payload) ? JSON.parse(JSON.stringify(payload)) as Record<string, unknown> : {};
  delete result.workspaceExamId;
  if (result.editorData && typeof result.editorData === 'object' && !Array.isArray(result.editorData)) {
    const editor = normalizeQuestion({ ...(result.editorData as Record<string, unknown>), id, passageId: passageId ?? undefined, status: 'draft', verifiedBy: 'none', version: 1 });
    result.editorData = editor;
  }
  return json(result);
}
export async function forkQuestion(tx: PrismaTypes.TransactionClient, actorId: string, sourceId: string) {
  await tx.$queryRaw`SELECT "id" FROM "Question" WHERE "id" = ${sourceId} FOR UPDATE`;
  const original = await tx.question.findFirst({ where: { id: sourceId, deletedAt: null }, include: { passage: true, author: { select: { name: true } } } });
  if (!original) throw new ApiError(404, 'Không tìm thấy câu hỏi gốc');
  if (original.ownerId !== actorId && original.visibility !== 'SHARED') throw new ApiError(403, 'Câu hỏi chưa được chia sẻ');
  if (!original.shareable) throw new ApiError(403, 'Nguồn câu hỏi chưa cho phép nhân bản');
  if (original.passage && original.passage.ownerId !== original.ownerId) throw new ApiError(403, 'Ngữ liệu không thuộc tác giả đang giữ câu hỏi; cần xác minh quyền trước');
  const passage = original.passage ? await tx.passage.create({ data: { ownerId: actorId, title: original.passage.title, content: original.passage.content, source: original.passage.source, figures: original.passage.figures == null ? Prisma.JsonNull : json(original.passage.figures) } }) : null;
  const id = `q_${randomUUID()}`;
  const saved = await tx.question.create({ data: {
    id, ownerId: actorId, authorId: original.authorId, originId: original.id,
    subject: original.subject, grade: original.grade, type: original.type, difficulty: original.difficulty,
    content: original.content, figures: original.figures == null ? Prisma.JsonNull : json(original.figures),
    payload: forkPayload(original.payload, id, passage?.id ?? null), solution: original.solution,
    points: original.points, topics: original.topics, tags: original.tags.filter(tag => tag !== '__workspace_only'), passageId: passage?.id,
    visibility: 'PRIVATE', sourceKind: 'FORKED', sourceUrl: original.sourceUrl, shareable: true, aiGenerated: original.aiGenerated,
    status: 'DRAFT', verifiedBy: 'NONE', source: `Nhân bản từ ${original.author.name}`, licenseNote: original.licenseNote, version: 1,
  }, include: { passage: true, author: { select: { id: true, name: true } } } });
  await tx.questionRevision.create({ data: { questionId: id, version: 1, snapshot: json(saved), note: `Nhân bản từ câu hỏi ${original.id}` } });
  return saved;
}

export async function rollbackQuestion(tx: PrismaTypes.TransactionClient, actorId: string, id: string, targetVersion: number, baseVersion: number) {
  await tx.$queryRaw`SELECT "id" FROM "Question" WHERE "id" = ${id} FOR UPDATE`;
  const current = await tx.question.findFirst({ where: { id, ownerId: actorId, deletedAt: null } });
  if (!current) throw new ApiError(404, 'Không tìm thấy câu hỏi trong kho riêng');
  if (current.tags.includes('__workspace_only')) throw new ApiError(409, 'Hãy dùng lịch sử toàn đề để khôi phục câu này cùng ngữ liệu và đáp án');
  if (current.version !== baseVersion) throw new ApiError(409, 'Câu hỏi đã đổi; hãy tải lại trước khi khôi phục', 'VERSION_CONFLICT');
  const revision = await tx.questionRevision.findUnique({ where: { questionId_version: { questionId: id, version: targetVersion } } });
  if (!revision) throw new ApiError(404, 'Không tìm thấy bản lịch sử');
  const snapshot = revision.snapshot as Record<string, unknown>;
  const normalized = normalizeQuestion({ ...snapshot, id });
  const passageId = typeof snapshot.passageId === 'string' ? snapshot.passageId : null;
  if (passageId && !await tx.passage.findFirst({ where: { id: passageId, ownerId: actorId } })) throw new ApiError(403, 'Ngữ liệu bản cũ không thuộc kho riêng; chưa thể khôi phục');
  const result = await tx.question.updateMany({ where: { id, ownerId: actorId, deletedAt: null, version: baseVersion }, data: {
    subject: normalized.subject ?? current.subject, grade: normalized.grade ?? current.grade,
    type: normalized.type.toUpperCase() as typeof current.type, difficulty: normalized.difficulty.toUpperCase() as typeof current.difficulty,
    content: normalized.content, figures: normalized.figures == null ? Prisma.JsonNull : json(normalized.figures),
    payload: forkPayload(snapshot.payload ?? { editorData: normalized }, id, passageId), solution: normalized.step_by_step_solution ?? '',
    points: normalized.points ?? null, topics: normalized.topics ?? [], tags: normalized.tags ?? [], passageId,
    // Restoring an old answer does not restore an old human/AI approval or publication grant.
    status: 'DRAFT', verifiedBy: 'NONE', version: { increment: 1 },
  } });
  if (result.count !== 1) throw new ApiError(409, 'Câu hỏi vừa thay đổi hoặc đã xóa', 'VERSION_CONFLICT');
  const saved = await tx.question.findUniqueOrThrow({ where: { id }, include: { passage: true } });
  await tx.questionRevision.create({ data: { questionId: id, version: saved.version, snapshot: json(saved), note: `Khôi phục từ phiên bản ${targetVersion}` } });
  return saved;
}
