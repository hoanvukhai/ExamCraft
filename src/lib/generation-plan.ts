import { structuralStampFields } from './exam-outline';
import { z } from 'zod';
import { wrapBareLatex } from './bare-latex';
import { normalizeMathDelimiters } from './math-delimiters';
import { getCatalogSubjects, getCognitiveFramework } from './education-catalog';
import { knowledgePackageSchema, knowledgeScopeSchema, parseKnowledgePackage, knowledgeScopeContext } from './knowledge-package';
import type { Exam } from '@/types/exam';

export function generationDocumentStamp(exam: Exam): string {
  return JSON.stringify({ id: exam.id, metadata: exam.metadata, questions: exam.questions, passages: exam.passages, sections: exam.sections, ...structuralStampFields(exam) }, (_key, value) => value && typeof value === 'object' && !Array.isArray(value) ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b))) : value);
}

export function applyGeneratedDraft(previous: Exam, generated: Exam, baseStamp: string): Exam {
  if (generationDocumentStamp(previous) !== baseStamp) throw Error('Đề đã thay đổi trong lúc AI soạn. Chưa thay nội dung; hãy tải bản đề xuất hoặc soạn lại từ bản hiện tại.');
  const metadata = { ...previous.metadata, ...generated.metadata };
  for (const key of ['title', 'schoolName', 'departmentName', 'academicYear', 'semester', 'examCode', 'notes'] as const) Object.assign(metadata, { [key]: previous.metadata[key] });
  return { ...generated, id: previous.id, serverId: previous.serverId, version: previous.version, access: previous.access, createdAt: previous.createdAt, metadata };
}

export const generationPlanSchema = z.object({
  subject: z.string().min(1), grade: z.number().int().min(1).max(12), topic: z.string().trim().min(1).max(12000),
  durationMinutes: z.number().int().min(1).max(1440),
  numMultipleChoice: z.number().int().min(0).max(100).default(0), numTrueFalse: z.number().int().min(0).max(100).default(0),
  numShortAnswer: z.number().int().min(0).max(100).default(0), numEssay: z.number().int().min(0).max(100).default(0),
  numFillBlank: z.number().int().min(0).max(100).default(0), numMatching: z.number().int().min(0).max(100).default(0), numOrdering: z.number().int().min(0).max(100).default(0),
  assessmentMode: z.enum(['scored', 'comment_only', 'rubric', 'survey']).default('scored'), cognitiveFrameworkId: z.string().optional(), sourcePackageId: z.string().optional(),
  language: z.string().optional(), languageRole: z.enum(['NN1', 'NN2', 'ETHNIC']).optional(), locality: z.string().optional(),
  customInstructions: z.string().max(16000).optional(), integratedSubBranch: z.string().optional(), curriculumTrack: z.string().optional(),
  knowledgePackage: knowledgePackageSchema.optional(), knowledgeScope: knowledgeScopeSchema.optional(),
}).superRefine((p, ctx) => {
  if (!getCatalogSubjects(p.grade).some(s => s.key === p.subject)) ctx.addIssue({ code: 'custom', message: 'Môn không thuộc danh mục lớp đã chọn' });
  const total = p.numMultipleChoice + p.numTrueFalse + p.numShortAnswer + p.numEssay + p.numFillBlank + p.numMatching + p.numOrdering;
  if (total < 1 || total > 100) ctx.addIssue({ code: 'custom', message: 'Tổng số câu phải từ 1 đến 100' });
  if (p.cognitiveFrameworkId) { const f = getCognitiveFramework(p.cognitiveFrameworkId); if (!f || !f.grades.includes(p.grade)) ctx.addIssue({ code: 'custom', message: 'Khung mức chưa phù hợp lớp đã chọn' }); }
  if (['ngoai_ngu_khac', 'tieng_dan_toc'].includes(p.subject) && !p.language?.trim()) ctx.addIssue({ code: 'custom', message: 'Cần xác định ngôn ngữ/chương trình' });
  if (p.subject === 'giao_duc_dia_phuong' && !p.locality?.trim()) ctx.addIssue({ code: 'custom', message: 'Cần xác định địa phương' });
  if (Boolean(p.knowledgePackage) !== Boolean(p.knowledgeScope)) ctx.addIssue({ code: 'custom', message: 'Cần gửi cả gói kiến thức và phạm vi đã chọn' });
  if (p.knowledgePackage && p.knowledgeScope) try { knowledgeScopeContext(parseKnowledgePackage(p.knowledgePackage, p), p.knowledgeScope); } catch (error) { ctx.addIssue({ code: 'custom', message: error instanceof Error ? error.message : 'Gói hoặc phạm vi chưa hợp lệ' }); }
});
export type GenerationPlan = z.infer<typeof generationPlanSchema>;

const responseQuestion = z.object({
  type: z.enum(['multiple_choice', 'true_false_group', 'short_answer', 'essay', 'fill_blank', 'matching', 'ordering']),
  difficulty: z.enum(['nhan_biet', 'thong_hieu', 'van_dung', 'van_dung_cao']).default('thong_hieu'),
  content: z.string().min(1),
  choices: z.array(z.object({ key: z.string().min(1), text: z.string() })).optional(),
  sub_questions: z.array(z.object({ key: z.string().min(1), content: z.string(), isCorrect: z.boolean().optional(), explanation: z.string().optional() })).optional(),
  correct_answer: z.string().optional(), accepted_answers: z.array(z.string()).optional(),
  rubric: z.array(z.object({ criterion: z.string(), maxPoints: z.number().finite().nonnegative() })).optional(),
  points: z.number().finite().nonnegative().optional(), step_by_step_solution: z.string().default(''),
  cognitiveLevel: z.string().optional(), learningOutcome: z.string().optional(), tags: z.array(z.string()).default([]),
  knowledgeIds: z.array(z.string()).max(100).optional(), outcomeIds: z.array(z.string()).max(100).optional(),
  matchingPairs: z.array(z.object({ id: z.string().trim().min(1).max(200), left: z.string().trim().min(1).max(8000), right: z.string().trim().min(1).max(8000) })).max(100).optional(),
  correctOrder: z.array(z.string().trim().min(1).max(8000)).max(100).optional(),
});
const responseSchema = z.object({ title: z.string().optional(), questions: z.array(responseQuestion).max(100) });

/** Models write `null` for a field that does not apply (a score on a comment-only question). A missing field and a null field mean the same here. */
export function dropNulls(value: unknown): unknown {
  if (Array.isArray(value)) return value.filter(item => item !== null).map(dropNulls);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== null).map(([key, item]) => [key, dropNulls(item)]));
  return value;
}

export function validateGeneratedExam(value: unknown, plan: GenerationPlan) {
  const parsed = responseSchema.parse(dropNulls(value));
  const expected = { multiple_choice: plan.numMultipleChoice, true_false_group: plan.numTrueFalse, short_answer: plan.numShortAnswer, essay: plan.numEssay, fill_blank: plan.numFillBlank, matching: plan.numMatching, ordering: plan.numOrdering };
  for (const type of Object.keys(expected) as (keyof typeof expected)[]) if (parsed.questions.filter(q => q.type === type).length !== expected[type]) throw new Error(`AI chưa tạo đúng số câu ${type}; chưa áp dụng kết quả`);
  const framework = getCognitiveFramework(plan.cognitiveFrameworkId);
  const scope = plan.knowledgePackage && plan.knowledgeScope ? knowledgeScopeContext(parseKnowledgePackage(plan.knowledgePackage, plan), plan.knowledgeScope) : undefined;
  const allowedKnowledge = new Set(scope?.knowledge.map(item => item.id)), allowedOutcomes = new Set(scope?.outcomes.map(item => item.id));
  for (const q of parsed.questions) {
    q.content = normalizeMathDelimiters(q.content); q.step_by_step_solution = normalizeMathDelimiters(q.step_by_step_solution);
    if (q.choices) q.choices = q.choices.map(choice => ({ ...choice, text: wrapBareLatex(normalizeMathDelimiters(choice.text)) }));
    if (q.sub_questions) q.sub_questions = q.sub_questions.map(sub => ({ ...sub, content: wrapBareLatex(normalizeMathDelimiters(sub.content)), ...(sub.explanation ? { explanation: normalizeMathDelimiters(sub.explanation) } : {}) }));
    if (q.knowledgeIds?.some(id => !allowedKnowledge.has(id)) || q.outcomeIds?.some(id => !allowedOutcomes.has(id))) throw new Error('AI gắn mã kiến thức hoặc yêu cầu ngoài phạm vi được chọn');
    if (scope && plan.assessmentMode !== 'survey' && !q.knowledgeIds?.length && !q.outcomeIds?.length) throw new Error('AI chưa gắn câu hỏi với kiến thức trong phạm vi đã chọn');
    if (q.type === 'multiple_choice' && (!q.choices || q.choices.length < 2 || new Set(q.choices.map(c => c.key)).size !== q.choices.length)) throw new Error('Phương án lựa chọn thiếu hoặc trùng mã');
    if (q.type === 'true_false_group' && (!q.sub_questions?.length || new Set(q.sub_questions.map(s => s.key)).size !== q.sub_questions.length)) throw new Error('Câu đúng/sai thiếu ý hoặc trùng mã');
    if (q.type === 'matching' && (!q.matchingPairs || q.matchingPairs.length < 2 || new Set(q.matchingPairs.map(pair => pair.id)).size !== q.matchingPairs.length)) throw new Error('Câu ghép nối cần ít nhất hai cặp có mã riêng và đủ hai vế');
    if (q.type === 'ordering' && (!q.correctOrder || q.correctOrder.length < 2)) throw new Error('Câu sắp xếp cần ít nhất hai mục theo thứ tự đúng');
    if (q.cognitiveLevel && !framework?.levels.some(l => l.id === q.cognitiveLevel)) throw new Error('AI trả mức nhận thức ngoài khung đã chọn');
    if (plan.assessmentMode === 'survey') { delete q.correct_answer; delete q.accepted_answers; delete q.points; q.sub_questions = q.sub_questions?.map(sub => { const value = { ...sub }; delete value.isCorrect; return value; }); }
    else if (plan.assessmentMode === 'scored') {
      if (q.type === 'multiple_choice' && !q.choices?.some(c => c.key === q.correct_answer)) throw new Error('AI chưa cung cấp đáp án lựa chọn hợp lệ');
      if (q.type === 'true_false_group' && q.sub_questions?.some(s => typeof s.isCorrect !== 'boolean')) throw new Error('AI chưa soạn đủ đáp án các ý đúng/sai');
      if (['short_answer', 'fill_blank'].includes(q.type) && !q.correct_answer?.trim() && !q.accepted_answers?.some(a => a.trim())) throw new Error('AI chưa cung cấp đáp án ngắn hoặc điền khuyết');
    }
  }
  return parsed;
}
