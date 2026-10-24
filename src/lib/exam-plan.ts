import { z } from 'zod';
import type { Exam, Question } from '@/types/exam';
import { getCognitiveFramework, requiresNumericScore } from './education-catalog';
import { freezeExamScoring } from './snapshot-scoring';
import { resolveKnowledgeScope } from './knowledge-package';

export const PLAN_TYPES = ['multiple_choice', 'true_false_group', 'short_answer', 'essay', 'fill_blank', 'matching', 'ordering'] as const;
const id = z.string().trim().min(1).max(200);
const slotSchema = z.object({ id, type: z.enum(PLAN_TYPES), cognitiveLevel: id.nullable(), outcomeId: id.optional(), count: z.number().int().min(0).max(1000), targetPointsHundredths: z.number().int().min(0).max(100000000).nullable() }).strict();
export const examPlanSchema = z.object({
  formatVersion: z.literal(1), subject: z.string().min(1).max(100), grade: z.number().int().min(1).max(12),
  assessmentMode: z.enum(['scored', 'comment_only', 'rubric', 'survey']), frameworkId: id.nullable(),
  packageReference: z.object({ packageId: id, packageRevision: id }).strict().nullable(),
  slots: z.array(slotSchema).max(100),
}).strict().superRefine((plan, ctx) => {
  if (plan.slots.reduce((sum, slot) => sum + slot.count, 0) > 1000) ctx.addIssue({ code: 'custom', message: 'Tổng kế hoạch không vượt 1.000 câu.' });
  const ids = new Set<string>(), cells = new Set<string>();
  for (const slot of plan.slots) {
    const cell = JSON.stringify([slot.type, slot.cognitiveLevel, slot.outcomeId ?? null]);
    if (ids.has(slot.id) || cells.has(cell)) ctx.addIssue({ code: 'custom', message: 'Mã ô hoặc tổ hợp dạng/mức/yêu cầu bị trùng.' });
    if (slot.count === 0 && slot.targetPointsHundredths !== null && slot.targetPointsHundredths !== 0) ctx.addIssue({ code: 'custom', message: 'Ô 0 câu chỉ có mục tiêu 0 điểm hoặc chưa đặt điểm.' });
    ids.add(slot.id); cells.add(cell);
  }
});
export type ExamPlan = z.infer<typeof examPlanSchema>;
export type ExamPlanSlot = ExamPlan['slots'][number];

/** Syntax only: a historical plan remains readable after its framework/package changes. */
export const parseExamPlan = (input: unknown): ExamPlan => examPlanSchema.parse(input);
export function createExamPlan(exam: Exam): ExamPlan {
  const pkg = exam.metadata.knowledgePackage;
  return { formatVersion: 1, subject: exam.metadata.subject, grade: exam.metadata.grade, assessmentMode: exam.metadata.assessmentMode ?? 'scored', frameworkId: exam.metadata.cognitiveFrameworkId ?? null, packageReference: pkg ? { packageId: pkg.id, packageRevision: pkg.revision } : null, slots: [] };
}

/** Decimal input is exact to hundredths; finer precision is reported, never rounded away. */
export function pointsToHundredths(input: string | number): number {
  const text = String(input).trim().replace(',', '.');
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) throw Error('Điểm cần là số không âm, tối đa hai chữ số thập phân.');
  const [whole, fraction = ''] = text.split('.');
  const value = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(value) || value > 100000000) throw Error('Điểm vượt giới hạn tính chính xác (1.000.000 điểm mỗi giá trị).');
  return value;
}
export const formatHundredths = (value: number) => `${value < 0 ? '-' : ''}${Math.floor(Math.abs(value) / 100)},${String(Math.abs(value) % 100).padStart(2, '0')}`;

export function examPlanContextStamp(exam: Exam): string {
  return JSON.stringify({ id: exam.id, context: createExamPlan(exam), package: exam.metadata.knowledgePackage ?? null, scope: exam.metadata.knowledgeScope ?? null, plan: exam.metadata.examPlan ?? null });
}

export function compareExamPlan(exam: Exam, input: unknown = exam.metadata.examPlan) {
  const plan = parseExamPlan(input), expected = createExamPlan(exam), warnings: string[] = [];
  const stale = plan.subject !== expected.subject || plan.grade !== expected.grade || plan.assessmentMode !== expected.assessmentMode || plan.frameworkId !== expected.frameworkId || JSON.stringify(plan.packageReference) !== JSON.stringify(expected.packageReference);
  if (stale) warnings.push('Kế hoạch thuộc môn/lớp, cách đánh giá, khung mức hoặc phiên bản gói khác. Cần giáo viên rà soát lại.');
  const framework = getCognitiveFramework(plan.frameworkId ?? undefined), numeric = requiresNumericScore(exam.metadata.assessmentMode);
  const pkg = exam.metadata.knowledgePackage;
  let scopedOutcomes: Set<string> | undefined;
  if (pkg && exam.metadata.knowledgeScope) {
    try { scopedOutcomes = new Set(resolveKnowledgeScope(pkg, exam.metadata.knowledgeScope).outcomes.map(o => o.id)); }
    catch { warnings.push('Phạm vi kiến thức đang khác phiên bản; cần kiểm lại mục tiêu.'); }
  }
  const rows = plan.slots.map(slot => {
    const issues: string[] = [];
    if (slot.cognitiveLevel !== null && (!framework?.grades.includes(exam.metadata.grade) || !framework.levels.some(level => level.id === slot.cognitiveLevel))) issues.push('Mức nhận thức không thuộc khung phù hợp hiện tại.');
    const outcome = slot.outcomeId ? pkg?.outcomes.find(o => o.id === slot.outcomeId) : undefined;
    if (slot.outcomeId && !outcome) issues.push('Yêu cầu cần đạt chưa có trong gói hiện tại.');
    if (slot.outcomeId && scopedOutcomes && !scopedOutcomes.has(slot.outcomeId)) issues.push('Mục tiêu ngoài phạm vi đã chọn; cần rà soát.');
    if (numeric && slot.targetPointsHundredths === null) issues.push('Chưa đặt mục tiêu điểm.');
    if (!numeric && slot.targetPointsHundredths !== null) issues.push('Bài không chấm điểm: mục tiêu điểm cũ được giữ để rà soát, không dùng so khớp.');
    return { slot, outcomeText: outcome?.text, issues, questionIds: [] as string[], actualCount: 0, knownPointsHundredths: 0, unknownPointIds: [] as string[], precisionPointIds: [] as string[], countDelta: -slot.count, pointsDeltaHundredths: null as number | null, matches: false };
  });
  const unmatched: { questionId: string; number: number; reason: string }[] = [], ambiguous: { questionId: string; number: number; slotIds: string[] }[] = [];
  const frozen = freezeExamScoring(exam);
  const allUnknownPoints: string[] = [], allPrecisionPoints: string[] = [];
  let actualKnownPointsHundredths = 0;
  frozen.questions.forEach((question, index) => {
    let cents: number | null = null, precision = false;
    if (numeric) {
      if (question.points === undefined) allUnknownPoints.push(question.id);
      else { try { cents = pointsToHundredths(question.points); actualKnownPointsHundredths += cents; } catch { precision = true; allPrecisionPoints.push(question.id); } }
    }
    const candidates = stale ? [] : rows.filter(({ slot, issues }) => {
      if (issues.some(issue => issue.startsWith('Mức nhận thức') || issue.startsWith('Yêu cầu cần đạt'))) return false;
      if (slot.type !== question.type || slot.cognitiveLevel !== (question.cognitiveLevel ?? null)) return false;
      return !slot.outcomeId || currentOutcome(question, slot.outcomeId, plan);
    });
    if (!candidates.length) { unmatched.push({ questionId: question.id, number: index + 1, reason: stale ? 'Ngữ cảnh kế hoạch đã thay đổi.' : 'Chưa có ô khớp dạng/mức/yêu cầu và phiên bản liên kết.' }); return; }
    if (candidates.length > 1) { ambiguous.push({ questionId: question.id, number: index + 1, slotIds: candidates.map(row => row.slot.id) }); return; }
    const row = candidates[0]; row.questionIds.push(question.id); row.actualCount++;
    if (numeric && cents !== null) row.knownPointsHundredths += cents;
    else if (precision) row.precisionPointIds.push(question.id);
    else if (numeric) row.unknownPointIds.push(question.id);
  });
  rows.forEach(row => {
    row.countDelta = row.actualCount - row.slot.count;
    if (numeric && row.slot.targetPointsHundredths !== null && !row.unknownPointIds.length && !row.precisionPointIds.length) row.pointsDeltaHundredths = row.knownPointsHundredths - row.slot.targetPointsHundredths;
    row.matches = !stale && !warnings.length && !row.issues.length && row.countDelta === 0 && (!numeric || row.pointsDeltaHundredths === 0);
  });
  const targetCount = plan.slots.reduce((sum, slot) => sum + slot.count, 0);
  const targetPointsHundredths = numeric && plan.slots.every(slot => slot.targetPointsHundredths !== null) ? plan.slots.reduce((sum, slot) => sum + slot.targetPointsHundredths!, 0) : null;
  return { plan, stale, numeric, warnings, rows, unmatched, ambiguous, targetCount, actualCount: exam.questions.length, targetPointsHundredths, actualKnownPointsHundredths, unknownPointIds: allUnknownPoints, precisionPointIds: allPrecisionPoints,
    matches: !stale && !warnings.length && !unmatched.length && !ambiguous.length && rows.every(row => row.matches) && !allUnknownPoints.length && !allPrecisionPoints.length };
}

function currentOutcome(question: Question, outcomeId: string, plan: ExamPlan) {
  const ref = plan.packageReference;
  return !!ref && question.knowledgeReference?.packageId === ref.packageId && question.knowledgeReference.packageRevision === ref.packageRevision && !!question.outcomeIds?.includes(outcomeId);
}

export function applyExamPlan(previous: Exam, plan: unknown, baseStamp: string): Exam {
  if (previous.access?.canEdit === false) throw Error('Bạn không có quyền sửa kế hoạch.');
  if (examPlanContextStamp(previous) !== baseStamp) throw Error('Kế hoạch hoặc ngữ cảnh đã đổi. Giữ nháp; hãy đối chiếu bản mới trước khi áp dụng.');
  return { ...previous, metadata: { ...previous.metadata, examPlan: parseExamPlan(plan) } };
}
