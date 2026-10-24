import { createHash } from 'node:crypto';
import type { Prisma, PrismaClient } from '@prisma/client';
import { normalizeExamDocument, normalizeQuestion, questionToDatabase, fromDatabaseExam } from './exam-document';
import { createExam } from './exam-persistence';

const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 40);
type Data = Record<string, unknown>;
const object = (v: unknown): Data => v && typeof v === 'object' && !Array.isArray(v) ? v as Data : {};

/** Detect variants before importing any member of a same-ID group. Key order is immaterial. */
export function conflictingLegacyIds(values: unknown[]): Set<string> {
  const first = new Map<string, string>(), conflicts = new Set<string>();
  for (const value of values) {
    const id = object(value).id;
    if (typeof id !== 'string' || !id.trim()) continue;
    const signature = JSON.stringify(value, (_key, entry) => entry && typeof entry === 'object' && !Array.isArray(entry)
      ? Object.fromEntries(Object.keys(entry).sort().map(key => [key, entry[key]])) : entry);
    if (first.has(id) && first.get(id) !== signature) conflicts.add(id);
    else first.set(id, signature);
  }
  return conflicts;
}

const variantError = 'Có nhiều bản cùng mã nhưng khác nội dung trong lượt nhập này. Chưa nhập bản nào thuộc nhóm đó. Hãy giữ các bản nguồn và tạo bản sao có mã riêng trước khi nhập lại.';

export function legacySourceFingerprint(value: unknown): string {
  const source = { ...object(value) };
  for (const key of ['id', 'serverId', 'access', 'version', 'createdAt', 'updatedAt', '_legacyImport']) delete source[key];
  return createHash('sha256').update(JSON.stringify(source, (_key, entry) => entry && typeof entry === 'object' && !Array.isArray(entry)
    ? Object.fromEntries(Object.keys(entry).sort().map(key => [key, entry[key]])) : entry)).digest('hex');
}

class SourceConflict extends Error {}
const receipt = (fingerprint: string) => ({ version: 1, fingerprint });
const receiptMatches = (snapshot: unknown, fingerprint: string) => {
  const stored = object(object(snapshot)._legacyImport);
  return stored.version === 1 && stored.fingerprint === fingerprint;
};

/** Serialize each source across requests, including the initially absent row. Never update a saved document. */
async function resolveSource(tx: Prisma.TransactionClient, ownerId: string, kind: 'exam' | 'question', sourceId: string, fingerprint: string, copyConflicts: boolean, groupedConflict: boolean) {
  const prefix = kind === 'exam' ? 'ex' : 'lq';
  const baseId = `${prefix}_${hash([ownerId, sourceId])}`;
  const copySourceId = `legacy-copy:${hash([kind, sourceId, fingerprint])}`;
  const copyId = `${prefix}_${hash([ownerId, copySourceId])}`;
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${baseId}))`;
  const lookup = async (id: string) => {
    if (kind === 'exam') {
      const row = await tx.exam.findUnique({ where: { id }, select: { ownerId: true } });
      if (!row) return null;
      const first = await tx.examRevision.findUnique({ where: { examId_version: { examId: id, version: 1 } }, select: { snapshot: true } });
      return { owned: row.ownerId === ownerId, matches: receiptMatches(first?.snapshot, fingerprint) };
    }
    const row = await tx.question.findUnique({ where: { id }, select: { ownerId: true } });
    if (!row) return null;
    const first = await tx.questionRevision.findUnique({ where: { questionId_version: { questionId: id, version: 1 } }, select: { snapshot: true } });
    return { owned: row.ownerId === ownerId, matches: receiptMatches(first?.snapshot, fingerprint) };
  };
  const base = await lookup(baseId);
  if (base?.owned && base.matches) return { id: baseId, already: true, clientId: sourceId, copy: false };
  const copy = await lookup(copyId);
  if (copy?.owned && copy.matches) return { id: copyId, already: true, clientId: copySourceId, copy: true };
  if (copy || (base && !base.owned)) throw new Error('Mã bản nhập đã được sử dụng nhưng không xác minh được nguồn. Chưa ghi thay đổi.');
  if ((base || groupedConflict) && !copyConflicts) throw new SourceConflict(base
    ? 'Bản cùng mã đã có trên máy chủ nhưng nguồn khác hoặc lần nhập cũ chưa có dấu đối chiếu. Bản đang lưu được giữ nguyên; có thể chọn nhập thành bản sao riêng.'
    : variantError);
  const useCopy = Boolean(base || groupedConflict);
  return { id: useCopy ? copyId : baseId, already: false, clientId: useCopy ? copySourceId : sourceId, copy: useCopy };
}

export function prepareLegacyExam(value: unknown) {
  const original = { ...object(value) };
  delete original._legacyImport;
  if ((original.questions !== undefined && !Array.isArray(original.questions)) || (original.items !== undefined && !Array.isArray(original.items))) throw new Error('Danh sách câu cũ không hợp lệ; giữ nguồn để sửa trước khi nhập');
  let raw = original;
  if (!Array.isArray(original.questions) && Array.isArray(original.items)) {
    const metadata = object(original.metadata), items = original.items.map(object);
    if (items.some(item => !Number.isInteger(item.position) || Number(item.position) < 0) || new Set(items.map(item => item.position)).size !== items.length) throw new Error('Vị trí câu cũ thiếu hoặc trùng; cần kiểm tra trước khi nhập');
    raw = object(fromDatabaseExam({ ...original, id: original.id ?? `legacy-source:${hash(original)}`, title: original.title ?? metadata.title, subject: original.subject ?? metadata.subject, grade: original.grade ?? metadata.grade, items: [...items].sort((a, b) => Number(a.position) - Number(b.position)) }));
  }
  const metadata = object(raw.metadata), questions = Array.isArray(raw.questions) ? raw.questions : [];
  return normalizeExamDocument({ ...raw, id: typeof original.id === 'string' ? `legacy:${original.id}` : `legacy:${hash(original)}`, serverId: undefined, version: undefined,
    metadata: { ...metadata, title: metadata.title ?? raw.title, subject: metadata.subject ?? raw.subject, grade: metadata.grade ?? raw.grade, durationMinutes: metadata.durationMinutes ?? raw.durationMinutes ?? 0 },
    questions: questions.map((q, i) => normalizeQuestion({ ...object(q), id: object(q).id ?? `legacy-q-${i}-${hash(q)}`, status: 'draft', verifiedBy: 'none' }, i)),
    createdAt: raw.createdAt ?? new Date().toISOString(), updatedAt: raw.updatedAt ?? new Date().toISOString() });
}

export async function importLegacy(db: PrismaClient, ownerId: string, input: { exams: unknown[]; questions: unknown[]; dryRun: boolean; copyConflicts?: boolean }) {
  const results: { kind: string; index: number; status: string; id?: string; error?: string; canImportCopy?: boolean; copy?: boolean }[] = [];
  const examConflicts = conflictingLegacyIds(input.exams), questionConflicts = conflictingLegacyIds(input.questions);
  for (const [index, raw] of input.exams.entries()) {
    try {
      const sourceId = object(raw).id;
      const groupedConflict = typeof sourceId === 'string' && examConflicts.has(sourceId);
      if (groupedConflict && !input.copyConflicts) throw new SourceConflict(variantError);
      const document = prepareLegacyExam(raw);
      const fingerprint = legacySourceFingerprint(raw);
      const result = await db.$transaction(async tx => {
        const target = await resolveSource(tx, ownerId, 'exam', document.id, fingerprint, Boolean(input.copyConflicts), groupedConflict);
        if (target.already) return { status: 'already_imported', id: target.id, copy: target.copy };
        if (input.dryRun) return { status: 'ready', copy: target.copy };
        const saved = await createExam(tx, ownerId, { document: target.copy ? { ...document, metadata: { ...document.metadata, title: `${document.metadata.title} (Bản nhập riêng)` } } : document, clientId: target.clientId });
        const first = await tx.examRevision.findUniqueOrThrow({ where: { examId_version: { examId: saved.id, version: 1 } } });
        await tx.examRevision.update({ where: { id: first.id }, data: { snapshot: JSON.parse(JSON.stringify({ ...object(first.snapshot), _legacyImport: receipt(fingerprint) })) } });
        return { status: 'imported', id: saved.id, copy: target.copy };
      }, { timeout: 30000 });
      results.push({ kind: 'exam', index, ...result });
    } catch (error) { results.push({ kind: 'exam', index, status: 'error', error: error instanceof Error ? error.message : 'Không đọc được đề', canImportCopy: error instanceof SourceConflict }); }
  }
  for (const [index, value] of input.questions.entries()) {
    try {
      const sourceId = object(value).id;
      const groupedConflict = typeof sourceId === 'string' && questionConflicts.has(sourceId);
      if (groupedConflict && !input.copyConflicts) throw new SourceConflict(variantError);
      const raw = object(value), q = normalizeQuestion({ ...raw, id: raw.id ?? `legacy:${hash(raw)}`, status: 'draft', verifiedBy: 'none' }, index);
      if (q.passageId || raw.passage != null || object(object(raw.payload).editorData).passage != null) throw new Error('Câu rời có ngữ liệu liên kết chưa được chuyển an toàn. Hãy nhập kèm đề chứa ngữ liệu hoặc bổ sung ngữ liệu trong kho mới; nguồn cũ vẫn giữ nguyên.');
      if (!q.subject || !q.grade || !Number.isInteger(q.grade) || q.grade < 1 || q.grade > 12) throw new Error('Câu rời thiếu môn/lớp; cần bổ sung trước khi nhập');
      const fingerprint = legacySourceFingerprint(value);
      const result = await db.$transaction(async tx => {
        const target = await resolveSource(tx, ownerId, 'question', q.id, fingerprint, Boolean(input.copyConflicts), groupedConflict);
        if (target.already) return { status: 'already_imported', id: target.id, copy: target.copy };
        if (input.dryRun) return { status: 'ready', copy: target.copy };
        const question = await tx.question.create({ data: { ...questionToDatabase(q, { ownerId, examId: 'legacy-bank', questionId: target.id, subject: q.subject!, grade: q.grade! }), tags: (q.tags ?? []).filter(tag => tag !== '__workspace_only'), sourceKind: 'IMPORTED_FILE' } });
        await tx.questionRevision.create({ data: { questionId: target.id, version: 1, snapshot: JSON.parse(JSON.stringify({ ...question, _legacyImport: receipt(fingerprint) })), note: 'Nhập câu rời từ kho cũ, chưa duyệt' } });
        return { status: 'imported', id: target.id, copy: target.copy };
      }, { timeout: 30000 });
      results.push({ kind: 'question', index, ...result });
    } catch (error) { results.push({ kind: 'question', index, status: 'error', error: error instanceof Error ? error.message : 'Không đọc được câu', canImportCopy: error instanceof SourceConflict }); }
  }
  return { success: true, dryRun: input.dryRun, results, importedExamsCount: results.filter(r => r.kind === 'exam' && r.status === 'imported').length, importedQuestionsCount: results.filter(r => r.kind === 'question' && r.status === 'imported').length,
    errorCount: results.filter(r => r.status === 'error').length, message: input.dryRun ? 'Đã kiểm tra bản nhập. Chưa ghi dữ liệu.' : 'Đã xử lý bản nhập; các mục lỗi vẫn giữ nguyên ở nguồn cũ. Nhập lại không ghi đè bản đã chuyển.' };
}
