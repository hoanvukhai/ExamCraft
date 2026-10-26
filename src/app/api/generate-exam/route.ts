import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { randomUUID } from 'node:crypto';
import { requireAuth } from '@/lib/auth';
import { isSameOriginMutation } from '@/lib/attempt-access';
import prisma from '@/lib/prisma';
import { requestApiKey } from '@/lib/ai-policy';
import { executeWithKeyRotation, readProviderJson } from '@/lib/gemini-keys';
import { apiErrorResponse } from '@/lib/api-error';
import { generationPlanSchema, validateGeneratedExam } from '@/lib/generation-plan';
import { buildGenerationPrompt } from '@/lib/generation-prompt';
import { balanceChoiceOrder } from '@/lib/choice-balance';
import type { Exam, Subject } from '@/types/exam';
import { parseKnowledgePackage, knowledgeScopeContext } from '@/lib/knowledge-package';
import { assertRequestAccount } from '@/lib/request-account';

// Several AI calls in a row (long Word imports, full exams) need more than a serverless default.
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    if (!isSameOriginMutation(req)) return NextResponse.json({ error: 'Yêu cầu không hợp lệ' }, { status: 403 });
    const user = await requireAuth();
    assertRequestAccount(req.headers, user.id);
    const body = await req.json();
    const validation = generationPlanSchema.safeParse(body.params);
    if (!validation.success) return NextResponse.json({ success: false, error: validation.error.issues.map(i => i.message).join('; ') }, { status: 400 });
    const plan = validation.data;
    const knowledgePackage = plan.knowledgePackage ? parseKnowledgePackage(plan.knowledgePackage, plan) : undefined;
    const scope = knowledgePackage && plan.knowledgeScope ? knowledgeScopeContext(knowledgePackage, plan.knowledgeScope) : undefined;
    const preferences = await prisma.teacherAiMemory.findMany({ where: { userId: user.id, isActive: true, OR: [{ subject: plan.subject }, { subject: 'all' }] }, take: 5, orderBy: { createdAt: 'desc' }, select: { title: true, insight: true } });
    const { contents, systemInstruction } = buildGenerationPrompt({ plan, scope, preferences });
    const text = await executeWithKeyRotation(requestApiKey(body), async (apiKey, model) => {
      const response = await new GoogleGenAI({ apiKey }).models.generateContent({ model, contents,
        config: { abortSignal: req.signal, responseMimeType: 'application/json', temperature: 0.4, systemInstruction } });
      return response.text ?? '{}';
    }, { userId: user.id, endpoint: 'exam.generate', signal: req.signal, ...(knowledgePackage ? { dataVersion: knowledgePackage.id + '@' + knowledgePackage.revision } : {}) });
    let result;
    try { result = validateGeneratedExam(readProviderJson(text), plan); }
    catch (error) { return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'AI chưa trả đúng cấu trúc; chưa áp dụng kết quả' }, { status: 422 }); }
    result.questions = balanceChoiceOrder(result.questions);
    const now = new Date(), year = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
    const exam: Exam = { id: `draft_${randomUUID()}`, metadata: {
      title: result.title || 'Bản nháp mới', schoolName: '', departmentName: '', subject: plan.subject as Subject, grade: plan.grade, durationMinutes: plan.durationMinutes,
      academicYear: `${year} - ${year + 1}`, assessmentMode: plan.assessmentMode, cognitiveFrameworkId: plan.cognitiveFrameworkId, sourcePackageId: plan.sourcePackageId,
      language: plan.language, languageRole: plan.languageRole, locality: plan.locality,
      knowledgePackage, knowledgeScope: plan.knowledgeScope,
    }, questions: result.questions.map(q => ({ ...q, ...(knowledgePackage ? { knowledgeReference: { packageId: knowledgePackage.id, packageRevision: knowledgePackage.revision } } : {}), id: `q_${randomUUID()}`, subject: plan.subject as Subject, grade: plan.grade, aiGenerated: true, status: 'draft', verifiedBy: 'none', version: 1 })), createdAt: now.toISOString(), updatedAt: now.toISOString() };
    return NextResponse.json({ success: true, exam, isFallback: false, warnings: ['Bản nháp do AI tạo; giáo viên cần kiểm nội dung, đáp án, điểm và phạm vi trước khi dùng.'] });
  } catch (error) { return apiErrorResponse(error, 'AI chưa hoàn tất yêu cầu tạo bài'); }
}
