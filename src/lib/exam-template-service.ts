import { createHash, randomUUID } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { ApiError } from './api-error';
import { legacyTemplateSnapshot, saveTemplateSchema, templateEnvelopeSchema, type PersonalTemplate } from './exam-template';

const canonical = (value: unknown) => JSON.stringify(value, (_key, item) => item && typeof item === 'object' && !Array.isArray(item) ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b))) : item);
const digest = (value: unknown) => createHash('sha256').update(canonical(value)).digest('hex');
type Row = { id: string; ownerId: string | null; name: string; subject: string; gradeFrom: number; gradeTo: number; sections: unknown; isSystem: boolean; createdAt: Date };
const accessible = (ownerId: string) => ({ OR: [{ ownerId }, { ownerId: null, isSystem: true }] });
export function readTemplateRow(row: Row): PersonalTemplate {
  const common = { id: row.id, name: row.name, subject: row.subject, gradeFrom: row.gradeFrom, gradeTo: row.gradeTo, createdAt: row.createdAt.toISOString(), status: 'needs_review' as const };
  if (Array.isArray(row.sections)) return { ...common, revision: `legacy_${digest(row)}`, category: row.isSystem ? 'system_unreviewed' : 'legacy_unreviewed', legacy: true, sources: [], origin: null, snapshot: legacyTemplateSnapshot(row.subject, row.sections) };
  const envelope = templateEnvelopeSchema.parse(row.sections);
  return { ...common, revision: envelope.revision, category: row.isSystem ? 'system_unreviewed' : 'personal', legacy: false, sources: envelope.sources, origin: envelope.origin, snapshot: envelope.snapshot };
}
export async function getPersonalTemplate(tx: Prisma.TransactionClient, ownerId: string, id: string) {
  const row = await tx.examTemplate.findFirst({ where: { id, ...accessible(ownerId) } });
  if (!row) throw new ApiError(404, 'Không tìm thấy mẫu trong quyền truy cập.');
  try { return readTemplateRow(row); } catch { throw new ApiError(422, 'Mẫu cũ chưa đọc được đầy đủ; dữ liệu gốc được giữ, chưa thể dùng.'); }
}
export function templateListParameters(params: URLSearchParams) {
  const integer = (key: string, fallback: number, max: number) => { const n = Number(params.get(key) ?? fallback); return Number.isInteger(n) && n > 0 ? Math.min(n, max) : fallback; };
  const grade = params.get('grade'), subject = params.get('subject')?.trim();
  return { page: integer('page', 1, 10000), limit: integer('limit', 20, 50), ...(grade && Number.isInteger(Number(grade)) && Number(grade) >= 1 && Number(grade) <= 12 ? { grade: Number(grade) } : {}), ...(subject ? { subject: subject.slice(0, 100) } : {}) };
}
export async function listPersonalTemplates(tx: Prisma.TransactionClient, ownerId: string, params: ReturnType<typeof templateListParameters>) {
  const where = { ...accessible(ownerId), ...(params.subject ? { subject: params.subject } : {}), ...(params.grade ? { gradeFrom: { lte: params.grade }, gradeTo: { gte: params.grade } } : {}) };
  const [rows, count] = await Promise.all([tx.examTemplate.findMany({ where, skip: (params.page - 1) * params.limit, take: params.limit, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }] }), tx.examTemplate.count({ where })]);
  const templates = rows.map(row => {
    try { const { snapshot: _snapshot, sources: _sources, ...summary } = readTemplateRow(row); void _snapshot; void _sources; return { ...summary, readable: true }; }
    catch { return { id: row.id, name: row.name, subject: row.subject, gradeFrom: row.gradeFrom, gradeTo: row.gradeTo, createdAt: row.createdAt.toISOString(), status: 'needs_review' as const, category: row.isSystem ? 'system_unreviewed' : 'legacy_unreviewed', readable: false }; }
  });
  return { templates, pagination: { page: params.page, limit: params.limit, count, pages: Math.ceil(count / params.limit) } };
}
export async function savePersonalTemplate(tx: Prisma.TransactionClient, ownerId: string, input: unknown) {
  const parsed = saveTemplateSchema.safeParse(input);
  if (!parsed.success) throw new ApiError(400, 'Tên, phạm vi, nguồn hoặc cấu trúc mẫu chưa hợp lệ. Mẫu chỉ lưu dữ liệu cho phép.');
  const body = parsed.data;
  const id = `tpl_${digest([ownerId, body.clientRequestId]).slice(0, 40)}`;
  // Same request ID serializes creation and retry even under concurrent transactions.
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${id}, 0))::text AS locked`;
  const requestFingerprint = digest({ ...body, clientRequestId: undefined });
  const existing = await tx.examTemplate.findUnique({ where: { id } });
  if (existing) {
    const envelope = templateEnvelopeSchema.safeParse(existing.sections);
    if (existing.ownerId !== ownerId || !envelope.success || envelope.data.requestFingerprint !== requestFingerprint) throw new ApiError(409, 'Mã yêu cầu này đã lưu nội dung khác. Hãy tạo yêu cầu mới để lưu bản sao mới.');
    return { template: readTemplateRow(existing), replayed: true };
  }
  let origin: { templateId: string; revision: string } | null = null;
  if (body.source) {
    const source = await getPersonalTemplate(tx, ownerId, body.source.id);
    if (source.revision !== body.source.revision) throw new ApiError(409, 'Phiên bản mẫu nguồn đã thay đổi. Hãy tải lại trước khi lưu bản sao.');
    origin = { templateId: source.id, revision: source.revision };
  }
  const envelope = templateEnvelopeSchema.parse({ format: 'examcraft-personal-template', formatVersion: 1, revision: randomUUID(), requestFingerprint, category: 'personal', status: 'needs_review', sources: body.sources, origin, snapshot: body.snapshot });
  const row = await tx.examTemplate.create({ data: { id, ownerId, name: body.name, subject: body.subject, gradeFrom: body.gradeFrom, gradeTo: body.gradeTo, sections: JSON.parse(JSON.stringify(envelope)) as Prisma.InputJsonValue, isSystem: false } });
  return { template: readTemplateRow(row), replayed: false };
}

export async function readTemplateRequest(request: Request): Promise<unknown> {
  const max = 2 * 1024 * 1024;
  if (Number(request.headers.get('content-length')) > max) throw new ApiError(413, 'Mẫu vượt 2 MB; hãy giảm số dòng và nguồn.');
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, 'Thiếu nội dung mẫu.');
  let bytes = 0; const decoder = new TextDecoder(); let text = '';
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > max) { await reader.cancel(); throw new ApiError(413, 'Mẫu vượt 2 MB; hãy giảm số dòng và nguồn.'); }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    return JSON.parse(text);
  } finally { reader.releaseLock(); }
}
