import { z } from 'zod';
import type { Exam, ExamMetadata } from '@/types/exam';
import { headerLayoutSchema, sameHeaderValue } from './header-layout';
import { examPlanSchema, PLAN_TYPES } from './exam-plan';

const id = z.string().trim().min(1).max(200), text = z.string().max(2000);
export const templateSourceSchema = z.object({ title: z.string().trim().min(1).max(500), url: z.url().max(4000).refine(value => /^https?:\/\//i.test(value), 'Nguồn cần URL http hoặc https').optional(), version: z.string().max(200).optional(), effectiveFrom: z.iso.date().optional(), effectiveTo: z.iso.date().optional(), rights: z.enum(['unknown', 'link_only', 'permission', 'open']).default('unknown') }).strict().refine(source => !source.effectiveFrom || !source.effectiveTo || source.effectiveFrom <= source.effectiveTo, 'Ngày nguồn chưa hợp lệ.');
const sectionSchema = z.object({ id, name: z.string().min(1).max(500), title: text.optional(), label: text.optional(), type: z.enum(PLAN_TYPES).optional(), pointsPerQuestion: z.number().finite().min(0).max(1000000).optional(), progressiveScoring: z.array(z.number().finite().min(0).max(1000000)).max(100).optional(), questionCount: z.number().int().min(0).max(1000).optional(), totalPoints: z.number().finite().min(0).max(1000000).optional(), instruction: text.optional() }).strict();
export const templateSnapshotSchema = z.object({
  headerFields: z.object({ schoolName: text.optional(), departmentName: text.optional(), title: z.string().max(500).refine(value => !!value.trim()).optional(), examCode: text.optional(), academicYear: text.optional(), semester: text.optional(), notes: text.optional(), headerLayout: headerLayoutSchema.nullable().optional() }).strict(),
  assessmentContext: z.object({ subject: z.string().min(1).max(100), grade: z.number().int().min(1).max(12).optional(), assessmentMode: z.enum(['scored', 'comment_only', 'rubric', 'survey']).optional(), cognitiveFrameworkId: id.nullable().optional(), durationMinutes: z.number().finite().min(0).max(1440).optional() }).strict(),
  examPlan: examPlanSchema.optional(), sections: z.array(sectionSchema).max(100),
}).strict().refine(snapshot => new Set(snapshot.sections.map(section => section.id)).size === snapshot.sections.length, 'Mã phần của mẫu bị trùng.');
export type TemplateSnapshot = z.infer<typeof templateSnapshotSchema>;
export const templateOriginSchema = z.object({ templateId: id, revision: id }).strict();
export const templateEnvelopeSchema = z.object({ format: z.literal('examcraft-personal-template'), formatVersion: z.literal(1), revision: id, requestFingerprint: z.string().regex(/^[a-f0-9]{64}$/), category: z.literal('personal'), status: z.literal('needs_review'), sources: z.array(templateSourceSchema).max(30), origin: templateOriginSchema.nullable(), snapshot: templateSnapshotSchema }).strict();
export type TemplateEnvelope = z.infer<typeof templateEnvelopeSchema>;
export const saveTemplateSchema = z.object({ clientRequestId: z.uuid(), name: z.string().trim().min(1).max(500), subject: z.string().min(1).max(100), gradeFrom: z.number().int().min(1).max(12), gradeTo: z.number().int().min(1).max(12), source: z.object({ id, revision: id }).strict().optional(), sources: z.array(templateSourceSchema).max(30), snapshot: templateSnapshotSchema }).strict().superRefine((value, ctx) => {
  if (value.gradeFrom > value.gradeTo || value.snapshot.assessmentContext.subject !== value.subject || value.snapshot.assessmentContext.grade !== undefined && (value.snapshot.assessmentContext.grade < value.gradeFrom || value.snapshot.assessmentContext.grade > value.gradeTo)) ctx.addIssue({ code: 'custom', message: 'Môn/lớp/phạm vi của mẫu chưa khớp.' });
});
export type SaveTemplateInput = z.infer<typeof saveTemplateSchema>;
export interface PersonalTemplate {
  id: string; name: string; subject: string; gradeFrom: number; gradeTo: number; createdAt: string; revision: string;
  category: 'personal' | 'system_unreviewed' | 'legacy_unreviewed'; status: 'needs_review'; legacy: boolean;
  sources: TemplateEnvelope['sources']; origin: TemplateEnvelope['origin']; snapshot: TemplateSnapshot;
}
const templateCategory = z.enum(['personal', 'system_unreviewed', 'legacy_unreviewed']);
const templateSummarySchema = z.object({ id, name: z.string().max(500), subject: z.string().max(100), gradeFrom: z.number().int().min(1).max(12), gradeTo: z.number().int().min(1).max(12), category: templateCategory, readable: z.boolean() });
export type TemplateSummary = z.infer<typeof templateSummarySchema>;
const templateDetailSchema = z.object({ id, name: z.string().max(500), subject: z.string().max(100), gradeFrom: z.number().int().min(1).max(12), gradeTo: z.number().int().min(1).max(12), createdAt: z.string(), revision: id, category: templateCategory, status: z.literal('needs_review'), legacy: z.boolean(), sources: z.array(templateSourceSchema).max(30), origin: templateOriginSchema.nullable(), snapshot: templateSnapshotSchema });
const unreadableTemplate = 'Mẫu này chưa đọc được đầy đủ; dữ liệu gốc được giữ, chưa thể dùng.';
/** Read a list response without trusting its shape; rows that cannot be shown are counted, not guessed. */
export function parseTemplateList(data: unknown, requestedPage: number) {
  const body = data && typeof data === 'object' ? data as { templates?: unknown; pagination?: { page?: unknown; pages?: unknown } } : {};
  const { page, pages } = body.pagination ?? {};
  if (!Array.isArray(body.templates) || !Number.isInteger(page) || !Number.isInteger(pages) || (page as number) < 1 || (pages as number) < 0) throw Error('Danh sách mẫu trả về không đọc được. Danh sách đang xem được giữ nguyên; hãy thử tải lại.');
  if (page !== requestedPage) throw Error('Danh sách trả về không đúng trang đã chọn. Danh sách đang xem được giữ nguyên; hãy thử tải lại.');
  if ((pages as number) > 0 && (page as number) > (pages as number)) throw Error('Danh sách mẫu đã thay đổi và trang này không còn. Hãy tải lại từ trang đầu.');
  const rows = body.templates.map(row => templateSummarySchema.safeParse(row)), seen = new Set<string>();
  const templates = rows.flatMap(row => row.success && !seen.has(row.data.id) && seen.add(row.data.id) ? [row.data] : []);
  return { templates, page: page as number, pages: pages as number, skipped: body.templates.length - templates.length };
}
/** Read one opened template; it must be the one that was asked for and fully readable before any preview. */
export function parseOpenedTemplate(data: unknown, expectedId: string): PersonalTemplate {
  const parsed = templateDetailSchema.safeParse(data && typeof data === 'object' ? (data as { template?: unknown }).template : undefined);
  if (!parsed.success) throw Error(unreadableTemplate);
  if (parsed.data.id !== expectedId) throw Error('Phản hồi không đúng mẫu đã chọn nên chưa mở. Hãy chọn lại.');
  return parsed.data;
}
/** A saved-template acknowledgement must name the saved template before the list or notice may change. */
export function parseSavedTemplate(data: unknown): TemplateSummary & { name: string } {
  const body = data && typeof data === 'object' ? data as { success?: unknown; template?: unknown } : {};
  const parsed = templateSummarySchema.safeParse(body.success === true && body.template && typeof body.template === 'object' ? { ...body.template, readable: true } : undefined);
  if (!parsed.success) throw Error('Chưa chắc bản mẫu đã được lưu. Nội dung vẫn được giữ; bấm lưu lại sẽ dùng đúng mã yêu cầu cũ nên không tạo bản trùng.');
  return parsed.data;
}
export function parseTemplateSnapshot(input: unknown): TemplateSnapshot { return templateSnapshotSchema.parse(input); }
export function captureTemplateSnapshot(exam: Exam): TemplateSnapshot {
  const m = exam.metadata;
  return parseTemplateSnapshot({ headerFields: { schoolName: m.schoolName, departmentName: m.departmentName, title: m.title, examCode: m.examCode ?? '', academicYear: m.academicYear ?? '', semester: m.semester ?? '', notes: m.notes ?? '', headerLayout: m.headerLayout ?? null }, assessmentContext: { subject: m.subject, grade: m.grade, assessmentMode: m.assessmentMode ?? 'scored', cognitiveFrameworkId: m.cognitiveFrameworkId ?? null, durationMinutes: m.durationMinutes }, examPlan: m.examPlan, sections: exam.sections ?? [] });
}
export function legacyTemplateSnapshot(subject: string, sections: unknown): TemplateSnapshot {
  if (!Array.isArray(sections)) throw Error('Mẫu cũ chưa đọc được cấu trúc phần.');
  // Legacy enum spelling is adapted only; no inferred framework, grade, count or point defaults.
  return parseTemplateSnapshot({ headerFields: {}, assessmentContext: { subject }, sections: sections.map(section => {
    if (!section || typeof section !== 'object' || Array.isArray(section)) throw Error('Phần của mẫu cũ chưa hợp lệ.');
    const row = section as Record<string, unknown>;
    return { ...row, ...(typeof row.type === 'string' ? { type: row.type.toLowerCase() } : {}) };
  }) });
}

export const templateApplyOptionsSchema = z.object({ header: z.boolean(), context: z.boolean(), plan: z.boolean(), sections: z.boolean() }).strict();
export type TemplateApplyOptions = z.infer<typeof templateApplyOptionsSchema>;
export const templateApplicationSchema = z.object({ formatVersion: z.literal(1), source: z.object({ id, revision: id, name: z.string().max(500), category: z.enum(['personal', 'system_unreviewed', 'legacy_unreviewed']) }).strict(), snapshot: templateSnapshotSchema, appliedOptions: templateApplyOptionsSchema, appliedAt: z.iso.datetime() }).strict();
export type TemplateApplication = z.infer<typeof templateApplicationSchema>;
export function templateDocumentStamp(exam: Exam) {
  return JSON.stringify({ id: exam.id, metadata: exam.metadata, sections: exam.sections, questions: exam.questions }, (_key, value) => value && typeof value === 'object' && !Array.isArray(value) ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b))) : value);
}
export function templateSourceDateLabel(source: TemplateEnvelope['sources'][number]) {
  return `Khoảng ngày tự khai: từ ${source.effectiveFrom ?? 'chưa ghi'} đến ${source.effectiveTo ?? 'chưa ghi'}.`;
}
export function templateSectionPreview(sections: readonly unknown[]) {
  const amount = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? String(value).replace('.', ',') : 'Chưa đặt';
  return sections.map(section => {
    const row = section && typeof section === 'object' && !Array.isArray(section) ? section as Record<string, unknown> : {};
    return { name: String(row.title ?? row.name ?? 'Chưa đặt tên'), type: typeof row.type === 'string' ? row.type.toLowerCase() : '', count: amount(row.questionCount), points: amount(row.pointsPerQuestion), total: amount(row.totalPoints), progression: Array.isArray(row.progressiveScoring) && row.progressiveScoring.length ? row.progressiveScoring.map(amount).join(' → ') : 'Chưa đặt', instruction: typeof row.instruction === 'string' ? row.instruction : '' };
  });
}
const localDate = () => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; };
export function templateApplyWarnings(exam: Exam, template: PersonalTemplate, options: TemplateApplyOptions, today = localDate()) {
  const warnings = ['Bản sao cá nhân, nguồn tự khai hoặc mẫu cũ chưa đối chiếu; cần giáo viên kiểm, không chứng nhận phù hợp chính thức.'];
  if (exam.metadata.subject !== template.subject || exam.metadata.grade < template.gradeFrom || exam.metadata.grade > template.gradeTo) warnings.push('Mẫu khác môn hoặc phạm vi lớp; kiểm lại trước khi áp dụng.');
  if (exam.questions.length && options.sections) warnings.push('Đề đã có câu: không áp dụng phần của mẫu để giữ liên kết câu và điểm hiện tại.');
  if (options.context) warnings.push('Ngữ cảnh được sao chép đúng như mẫu; gói/phạm vi hiện tại giữ nguyên và có thể cần rà soát.');
  if (options.plan && template.snapshot.examPlan) warnings.push('Giữ nguyên tham chiếu gói/khung của kế hoạch mẫu; không tự quy đổi outcome. Kiểm cảnh báo kế hoạch sau áp dụng.');
  for (const source of template.sources) if (source.effectiveFrom && today < source.effectiveFrom || source.effectiveTo && today > source.effectiveTo) warnings.push(`Nguồn tự khai “${source.title}” nằm ngoài khoảng ngày đã ghi. Cần rà soát; thông tin này không xác nhận hiệu lực pháp lý.`);
  return warnings;
}
export interface TemplateApplyAttempt { documentId: string; baseStamp: string; expectedStamp: string; application: TemplateApplication }
export function makeTemplateApplyAttempt(previous: Exam, next: Exam): TemplateApplyAttempt {
  if (previous === next || !next.metadata.templateApplication) throw Error('Chưa áp dụng bản sao; đề hoặc quyền sửa đã đổi.');
  return { documentId: previous.id, baseStamp: templateDocumentStamp(previous), expectedStamp: templateDocumentStamp(next), application: templateApplicationSchema.parse(next.metadata.templateApplication) };
}
export function templateApplyAcknowledgement(exam: Exam, attempt: TemplateApplyAttempt, stamp = templateDocumentStamp(exam)): 'pending' | 'applied' | 'applied_changed' | 'rejected' {
  if (exam.id !== attempt.documentId) return 'rejected';
  if (sameHeaderValue(exam.metadata.templateApplication, attempt.application)) return stamp === attempt.expectedStamp ? 'applied' : 'applied_changed';
  if (exam.access?.canEdit === false || stamp !== attempt.baseStamp) return 'rejected';
  return 'pending';
}
export function applyPersonalTemplate(previous: Exam, template: PersonalTemplate, options: TemplateApplyOptions, baseStamp: string, sectionIds: string[], appliedAt: string): Exam {
  if (previous.access?.canEdit === false || templateDocumentStamp(previous) !== baseStamp) return previous;
  const snapshot = parseTemplateSnapshot(template.snapshot), checked = templateApplyOptionsSchema.parse(options);
  const metadata: ExamMetadata = { ...previous.metadata };
  if (checked.header) {
    const { headerLayout, ...textFields } = snapshot.headerFields;
    Object.assign(metadata, textFields);
    if (Object.hasOwn(snapshot.headerFields, 'headerLayout')) metadata.headerLayout = headerLayout ?? undefined;
  }
  if (checked.context) {
    const { cognitiveFrameworkId, ...context } = snapshot.assessmentContext;
    Object.assign(metadata, context);
    if (Object.hasOwn(snapshot.assessmentContext, 'cognitiveFrameworkId')) metadata.cognitiveFrameworkId = cognitiveFrameworkId ?? undefined;
  }
  if (checked.plan && snapshot.examPlan) metadata.examPlan = snapshot.examPlan;
  const applySections = checked.sections && previous.questions.length === 0;
  if (applySections && (sectionIds.length !== snapshot.sections.length || new Set(sectionIds).size !== sectionIds.length || sectionIds.some(value => !value || snapshot.sections.some(section => section.id === value) || previous.sections?.some(section => section.id === value)))) throw Error('Các phần sao chép cần mã mới riêng.');
  metadata.templateApplication = templateApplicationSchema.parse({ formatVersion: 1, source: { id: template.id, revision: template.revision, name: template.name, category: template.category }, snapshot, appliedOptions: { ...checked, plan: checked.plan && snapshot.examPlan !== undefined, sections: applySections }, appliedAt });
  return { ...previous, metadata, ...(applySections ? { sections: snapshot.sections.map((section, index) => ({ ...section, id: sectionIds[index] })) } : {}) };
}
export function templateDeviations(exam: Exam): string[] {
  const application = exam.metadata.templateApplication;
  if (!application) return [];
  const { snapshot, appliedOptions } = application, result: string[] = [];
  if (appliedOptions.header && Object.entries(snapshot.headerFields).some(([key, value]) => !sameHeaderValue(exam.metadata[key as keyof ExamMetadata], key === 'headerLayout' && value === null ? undefined : value))) result.push('Tiêu đề/bố cục đã tùy chỉnh so với bản sao mẫu.');
  if (appliedOptions.context && Object.entries(snapshot.assessmentContext).some(([key, value]) => !sameHeaderValue(exam.metadata[key as keyof ExamMetadata], key === 'cognitiveFrameworkId' && value === null ? undefined : value))) result.push('Ngữ cảnh đánh giá đã tùy chỉnh so với mẫu.');
  if (appliedOptions.plan && !sameHeaderValue(exam.metadata.examPlan, snapshot.examPlan)) result.push('Kế hoạch đã tùy chỉnh so với mẫu.');
  if (appliedOptions.sections) {
    const withoutId = (sections: unknown[]) => sections.map(section => { const { id: _id, ...rest } = section as Record<string, unknown>; void _id; return rest; });
    if (!sameHeaderValue(withoutId(exam.sections ?? []), withoutId(snapshot.sections))) result.push('Phần của đề đã tùy chỉnh so với mẫu.');
  }
  return result;
}
