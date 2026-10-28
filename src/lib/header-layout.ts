import { z } from 'zod';
import type { Exam, ExamMetadata } from '@/types/exam';
import { getCatalogSubjects, requiresNumericScore } from './education-catalog';
import { freezeExamScoring } from './snapshot-scoring';
import { formatHundredths, pointsToHundredths } from './exam-plan';

export const HEADER_BINDINGS = ['schoolName', 'departmentName', 'examCode', 'title', 'academicYear', 'semester', 'subjectGrade', 'durationScore', 'notes'] as const;
export const headerLayoutSchema = z.object({ formatVersion: z.literal(1), lines: z.array(z.object({
  id: z.string().trim().min(1).max(200), area: z.enum(['left', 'right', 'footer']), align: z.enum(['left', 'center', 'right']), hidden: z.boolean(),
  binding: z.enum(HEADER_BINDINGS).optional(), text: z.string().max(2000).optional(), override: z.string().max(2000).optional(),
}).strict().refine(line => (line.binding !== undefined) !== (line.text !== undefined), 'Mỗi dòng cần đúng một trường liên kết hoặc văn bản riêng.').refine(line => line.binding !== undefined || line.override === undefined, 'Chỉ ghi đè dòng liên kết.')).max(30) }).strict().refine(layout => new Set(layout.lines.map(line => line.id)).size === layout.lines.length, 'Mã dòng không được trùng.');
export type HeaderLayout = z.infer<typeof headerLayoutSchema>;
export const parseHeaderLayout = (input: unknown): HeaderLayout => headerLayoutSchema.parse(input);
export function defaultHeaderLayout(): HeaderLayout {
  return { formatVersion: 1, lines: HEADER_BINDINGS.map(binding => ({ id: `header-${binding}`, binding, area: binding === 'notes' ? 'footer' : ['schoolName', 'departmentName', 'examCode'].includes(binding) ? 'left' : 'right', align: binding === 'notes' ? 'left' : 'center', hidden: false })) };
}

export const HEADER_EDITABLE_KEYS = ['schoolName', 'departmentName', 'title', 'examCode', 'academicYear', 'semester', 'notes', 'durationMinutes', 'grade', 'subject', 'assessmentMode', 'cognitiveFrameworkId', 'headerLayout'] as const;
export type HeaderSnapshot = Pick<ExamMetadata, typeof HEADER_EDITABLE_KEYS[number]>;
export type HeaderPatch = Partial<HeaderSnapshot>;
export type HeaderSubmission = { documentId: string; base: HeaderSnapshot; patch: HeaderPatch };
const fields = {
  schoolName: z.string().max(500), departmentName: z.string().max(500), title: z.string().max(500).refine(value => !!value.trim(), 'Tên đề không được để trống; có thể ẩn dòng tên khi in.'),
  examCode: z.string().max(200).optional(), academicYear: z.string().max(200).optional(), semester: z.string().max(200).optional(), notes: z.string().max(2000).optional(),
  durationMinutes: z.number().finite().min(0).max(1440), grade: z.number().int().min(1).max(12), subject: z.string().min(1).max(100),
  assessmentMode: z.enum(['scored', 'comment_only', 'rubric', 'survey']).optional(), cognitiveFrameworkId: z.string().max(200).optional(), headerLayout: headerLayoutSchema.optional(),
};
const canonical = (value: unknown) => JSON.stringify(value, (_key, item) => item && typeof item === 'object' && !Array.isArray(item) ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b))) : item);
export const sameHeaderValue = (a: unknown, b: unknown) => canonical(a) === canonical(b);
export function headerEditableSnapshot(metadata: ExamMetadata): HeaderSnapshot {
  return Object.fromEntries(HEADER_EDITABLE_KEYS.map(key => [key, metadata[key]])) as HeaderSnapshot;
}
export function headerPatch(base: HeaderSnapshot, next: HeaderSnapshot): HeaderPatch {
  return Object.fromEntries(HEADER_EDITABLE_KEYS.filter(key => !sameHeaderValue(base[key], next[key])).map(key => [key, next[key]])) as HeaderPatch;
}
export function validateHeaderSubmission(submission: HeaderSubmission) {
  for (const key of Object.keys(submission.patch)) {
    if (!(HEADER_EDITABLE_KEYS as readonly string[]).includes(key) || !Object.hasOwn(submission.base, key)) throw Error('Bản chỉnh tiêu đề có trường không được hỗ trợ.');
    fields[key as keyof typeof fields].parse(submission.patch[key as keyof HeaderPatch]);
  }
}
export function headerSubmissionConflict(metadata: ExamMetadata, submission: HeaderSubmission): boolean {
  return Object.keys(submission.patch).some(key => !sameHeaderValue(metadata[key as keyof HeaderSnapshot], submission.base[key as keyof HeaderSnapshot]));
}
export function headerSubmissionApplied(metadata: ExamMetadata, submission: HeaderSubmission): boolean {
  return Object.keys(submission.patch).length > 0 && Object.keys(submission.patch).every(key => sameHeaderValue(metadata[key as keyof HeaderSnapshot], submission.patch[key as keyof HeaderPatch]));
}
/** Guard only edited fields. A newer plan/scope or unedited header value is preserved. */
export function applyHeaderSubmission(previous: Exam, submission: HeaderSubmission): Exam {
  try { validateHeaderSubmission(submission); } catch { return previous; }
  if (!Object.keys(submission.patch).length) return previous;
  if (previous.id !== submission.documentId || previous.access?.canEdit === false || headerSubmissionConflict(previous.metadata, submission)) return previous;
  return { ...previous, metadata: { ...previous.metadata, ...submission.patch } };
}

export function resolveHeaderLines(exam: Exam) {
  const { metadata } = exam, explicit = metadata.headerLayout !== undefined;
  const layout = explicit ? parseHeaderLayout(metadata.headerLayout) : defaultHeaderLayout();
  const subject = getCatalogSubjects().find(item => item.key === metadata.subject)?.label ?? metadata.subject;
  const frozen = freezeExamScoring(exam), numeric = requiresNumericScore(metadata.assessmentMode);
  let score = 'Không tính điểm';
  if (numeric) {
    if (frozen.missing.length) score = 'Chưa cấu hình đủ điểm';
    else { try { score = `Tổng ${formatHundredths(frozen.questions.reduce((sum, question) => sum + pointsToHundredths(question.points ?? 0), 0))} điểm`; } catch { score = 'Điểm cần rà soát độ chính xác'; } }
  }
  const bound: Record<typeof HEADER_BINDINGS[number], string> = {
    schoolName: metadata.schoolName ?? '', departmentName: metadata.departmentName ?? '', title: metadata.title ?? '',
    examCode: metadata.examCode ? `Mã đề: ${metadata.examCode}` : '', academicYear: metadata.academicYear ? `Năm học: ${metadata.academicYear}` : '', semester: metadata.semester ?? '',
    subjectGrade: `Môn: ${subject} · Lớp ${metadata.grade}`, durationScore: `${typeof metadata.durationMinutes === 'number' && Number.isFinite(metadata.durationMinutes) ? 'Thời gian làm bài: ' + metadata.durationMinutes + ' phút' : 'Chưa đặt thời gian làm bài'} · ${score}`, notes: metadata.notes ?? '',
  };
  return layout.lines.filter(line => !line.hidden).map(line => ({ id: line.id, area: line.area, align: line.align, text: line.binding ? line.override ?? bound[line.binding] : line.text ?? '', bold: !!line.binding && ['schoolName', 'departmentName', 'title', 'examCode', 'subjectGrade'].includes(line.binding), italic: line.binding === 'notes' || line.binding === 'durationScore' })).filter(line => explicit || line.text !== '');
}
