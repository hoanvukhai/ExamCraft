import { GoogleGenAI } from '@google/genai';
import { randomUUID } from 'node:crypto';
import prisma from './prisma';
import { executeWithKeyRotation, readProviderJson, type ProviderBudget } from './gemini-keys';
import {
  generationPlanSchema,
  validateGeneratedExam,
  type GenerationPlan,
} from './generation-plan';
import { buildGenerationPrompt } from './generation-prompt';
import { balanceChoiceOrder } from './choice-balance';
import { parseKnowledgePackage, knowledgeScopeContext } from './knowledge-package';
import { normalizeExamDocument } from './exam-document';
import { ApiError } from './api-error';
import { PRACTICE_LABEL, type BootstrapFacts } from './exam-request';
import type { Exam, Subject, OutlineNode } from '@/types/exam';
/** Both generation entry points use this same plan, provider budget and output validation. */
export async function generateExamForPlan(
  input: GenerationPlan,
  userId: string,
  signal: AbortSignal,
  customKey?: string,
  options: { budget?: ProviderBudget; practice?: boolean; facts?: BootstrapFacts } = {},
) {
  const plan = generationPlanSchema.parse(input);
  const knowledgePackage = plan.knowledgePackage
    ? parseKnowledgePackage(plan.knowledgePackage, plan)
    : undefined;
  const scope =
    knowledgePackage && plan.knowledgeScope
      ? knowledgeScopeContext(knowledgePackage, plan.knowledgeScope)
      : undefined;
  const preferences = await prisma.teacherAiMemory.findMany({
    where: { userId, isActive: true, OR: [{ subject: plan.subject }, { subject: 'all' }] },
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: { title: true, insight: true },
  });
  const { contents, systemInstruction } = buildGenerationPrompt({ plan, scope, preferences });
  const text = await executeWithKeyRotation(
    customKey,
    async (apiKey, model) => {
      const response = await new GoogleGenAI({
        apiKey,
        httpOptions: { retryOptions: { attempts: 1 } },
      }).models.generateContent({
        model,
        contents,
        config: {
          abortSignal: signal,
          responseMimeType: 'application/json',
          temperature: 0.4,
          systemInstruction:
            systemInstruction +
            '\nCó thể trả passages:[{id,title,content,source,figures}], parts:[{id,title,questionIds}] và id/passageId/parts/figures ở câu; các ID tạm phải nhất quán. Để tên phần trống nếu đề không chia phần. Một bài nhiều ý dùng parts trong câu, không đếm thành nhiều bài. Không viết xem hình khi không trả được hình. Không bịa URL ảnh hoặc nguồn chính thức.',
        },
      });
      if (response.candidates?.some((c) => c.finishReason === 'MAX_TOKENS'))
        throw new ApiError(
          422,
          'AI trả lời chưa đủ đề. Chưa có bản hoàn chỉnh để nhận.',
          'AI_INCOMPLETE',
        );
      return response.text ?? '{}';
    },
    {
      userId,
      endpoint: 'exam.generate',
      signal,
      budget: options.budget,
      ...(knowledgePackage
        ? { dataVersion: knowledgePackage.id + '@' + knowledgePackage.revision }
        : {}),
    },
  );
  return assembleGeneratedExam(readProviderJson(text), plan, options);
}
export function assembleGeneratedExam(
  value: unknown,
  input: GenerationPlan,
  options: { practice?: boolean; facts?: BootstrapFacts } = {},
) {
  const plan = generationPlanSchema.parse(input);
  const knowledgePackage = plan.knowledgePackage
    ? parseKnowledgePackage(plan.knowledgePackage, plan)
    : undefined;
  let result: ReturnType<typeof validateGeneratedExam>;
  try {
    result = validateGeneratedExam(value, plan);
  } catch (error) {
    throw new ApiError(
      422,
      error instanceof Error && error.name !== 'ZodError' && !(error instanceof SyntaxError)
        ? error.message
        : 'AI chưa tạo đúng cấu trúc, số câu hoặc đáp án. Chưa áp dụng kết quả.',
      'AI_BAD_OUTPUT',
    );
  }
  const ids = new Map<string, string>();
  for (const [i, q] of result.questions.entries()) {
    const old = q.id ?? 'question-' + (i + 1);
    if (ids.has(old)) throw new ApiError(422, 'AI trả mã câu trùng nhau.', 'AI_BAD_OUTPUT');
    ids.set(old, 'q_' + randomUUID());
  }
  const passages = (result.passages ?? []).map((p) => ({ ...p, id: 'p_' + randomUUID() }));
  const passageIds = new Map((result.passages ?? []).map((p, i) => [p.id, passages[i].id]));
  if (passageIds.size !== (result.passages ?? []).length)
    throw new ApiError(422, 'AI trả mã ngữ liệu trùng nhau.', 'AI_BAD_OUTPUT');
  const questions = balanceChoiceOrder(result.questions).map((q, i) => {
    if (q.passageId && !passageIds.has(q.passageId))
      throw new ApiError(422, 'Câu hỏi tham chiếu ngữ liệu không có.', 'AI_BAD_OUTPUT');
    return {
      ...q,
      id: ids.get(q.id ?? 'question-' + (i + 1))!,
      sectionId: undefined,
      passageId: q.passageId ? passageIds.get(q.passageId) : undefined,
      subject: plan.subject as Subject,
      grade: plan.grade,
      aiGenerated: true,
      status: 'draft' as const,
      verifiedBy: 'none' as const,
      version: 1,
      ...(knowledgePackage
        ? {
            knowledgeReference: {
              packageId: knowledgePackage.id,
              packageRevision: knowledgePackage.revision,
            },
          }
        : {}),
    };
  });
  let outline: OutlineNode[] | undefined;
  if (result.parts?.length || passages.length) {
    const used = new Set<string>();
    const nodes = (questionIds: string[]): OutlineNode[] => {
      const output: OutlineNode[] = [];
      for (const old of questionIds) {
        const id = ids.get(old),
          question = questions.find((q) => q.id === id);
        if (!id || !question || used.has(id))
          throw new ApiError(422, 'Dàn ý thiếu/trùng mã câu.', 'AI_BAD_OUTPUT');
        used.add(id);
        const node: OutlineNode = { id: randomUUID(), kind: 'question', questionId: id };
        const previous = output.at(-1);
        if (question.passageId) {
          if (previous?.kind === 'group' && previous.passageId === question.passageId)
            previous.children!.push(node);
          else
            output.push({
              id: randomUUID(),
              kind: 'group',
              title: '',
              passageId: question.passageId,
              children: [node],
            });
        } else output.push(node);
      }
      return output;
    };
    outline = result.parts?.length
      ? result.parts.map((part) => ({
          id: randomUUID(),
          kind: 'part' as const,
          sectionId: null,
          title: part.title,
          children: nodes(part.questionIds),
        }))
      : [
          {
            id: randomUUID(),
            kind: 'part',
            sectionId: null,
            title: '',
            children: nodes([...ids.keys()]),
          },
        ];
    if (used.size !== questions.length)
      throw new ApiError(422, 'Dàn ý chưa chứa đủ các câu.', 'AI_INCOMPLETE');
  }
  const rejectRemote = (value: unknown): void => {
    if (Array.isArray(value)) {
      value.forEach(rejectRemote);
      return;
    }
    if (value && typeof value === 'object') {
      const record = value as Record<string, unknown>;
      if (record.kind === 'image') {
        const data =
          typeof record.data === 'string'
            ? record.data
            : typeof record.data === 'object' && record.data
              ? (record.data as Record<string, unknown>).url
              : undefined;
        if (typeof data !== 'string' || !data.startsWith('data:image/'))
          throw new ApiError(
            422,
            'AI chưa trả ảnh dùng được; không tự tải ảnh từ địa chỉ do AI tạo.',
            'AI_INCOMPLETE',
          );
      }
      Object.values(record).forEach(rejectRemote);
    }
  };
  rejectRemote({ questions, passages });
  if (options.practice && plan.assessmentMode === 'scored') {
    if (
      questions.some(
        (q) =>
          q.type === 'essay' &&
          !q.rubric?.length &&
          !(
            q.parts?.length &&
            q.parts.every((part) => part.rubric?.length || part.answer || part.solution)
          ),
      )
    )
      throw new ApiError(422, 'Đề tự luận chưa đủ đáp án/barem.', 'AI_INCOMPLETE');
    if (
      plan.totalPoints !== undefined &&
      (questions.some((q) => q.points === undefined) ||
        Math.abs(questions.reduce((sum, q) => sum + (q.points ?? 0), 0) - plan.totalPoints) > 0.001)
    )
      throw new ApiError(422, 'Tổng điểm chưa khớp yêu cầu.', 'AI_INCOMPLETE');
  }
  const now = new Date(),
    year = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  const exam: Exam = {
    id: 'draft_' + randomUUID(),
    metadata: {
      title: options.practice
        ? options.facts?.title || 'Đề luyện tập'
        : result.title || 'Bản nháp mới',
      schoolName: '',
      departmentName: '',
      subject: plan.subject as Subject,
      grade: plan.grade,
      durationMinutes: plan.durationMinutes,
      academicYear:
        options.facts?.academicYear ?? (options.practice ? undefined : `${year} - ${year + 1}`),
      assessmentMode: plan.assessmentMode,
      cognitiveFrameworkId: plan.cognitiveFrameworkId,
      sourcePackageId: plan.sourcePackageId,
      language: plan.language,
      languageRole: plan.languageRole,
      locality: plan.locality,
      knowledgePackage,
      knowledgeScope: plan.knowledgeScope,
      ...(options.facts?.targetExam ? { targetExam: options.facts.targetExam } : {}),
      ...(options.practice ? { notes: PRACTICE_LABEL } : {}),
    },
    questions,
    ...(passages.length ? { passages } : {}),
    ...(outline ? { outline } : {}),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
  return normalizeExamDocument(exam);
}
