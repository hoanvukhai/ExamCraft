import type { Question } from '@/types/exam';
import { normalizeQuestion } from './exam-document';
import { questionValueStamp, type QuestionManualSubmission } from './question-draft';

export interface QuestionAiBase {
  ownerId: string;
  documentId: string;
  sourceStamp: string;
  question: Question;
}

export function captureQuestionAiBase(ownerId: string, documentId: string, sourceStamp: string, question: Question): QuestionAiBase {
  return { ownerId, documentId, sourceStamp, question: structuredClone(question) };
}

export function questionAiBaseMatches(base: QuestionAiBase, ownerId: string, documentId: string, sourceStamp: string, question: Question): boolean {
  return base.ownerId === ownerId && base.documentId === documentId && base.sourceStamp === sourceStamp
    && questionValueStamp(base.question) === questionValueStamp(question);
}

/** Prepare an explicit teacher acceptance; the parent updater must guard again. */
export function prepareQuestionAiSubmission(base: QuestionAiBase, candidate: Question, ownerId: string, documentId: string, sourceStamp: string, currentQuestion: Question): QuestionManualSubmission | null {
  if (!questionAiBaseMatches(base, ownerId, documentId, sourceStamp, currentQuestion)) return null;
  try {
    // A provider response is a question, not an arbitrary patch. Do not make a
    // malformed/empty response appear valid by filling its body from the base.
    const normalizedCandidate = normalizeQuestion({ ...candidate, id: base.question.id });
    const retained = normalizeQuestion(base.question);
    // A newly proposed body must not inherit an old answer or old type's
    // interaction fields, even when the candidate leaves them unspecified.
    for (const key of ['choices', 'sub_questions', 'correct_answer', 'accepted_answers', 'matchingPairs', 'correctOrder'] as const) delete retained[key];
    const value = normalizeQuestion({
      ...retained, ...normalizedCandidate,
      figures: Object.hasOwn(candidate, 'figures') ? normalizedCandidate.figures : retained.figures,
      id: base.question.id, subject: base.question.subject, grade: base.question.grade,
      points: base.question.points,
      sectionId: base.question.sectionId, passageId: base.question.passageId,
      knowledgeReference: base.question.knowledgeReference,
      knowledgeIds: base.question.knowledgeIds, outcomeIds: base.question.outcomeIds,
      subBranch: base.question.subBranch, curriculumTrack: base.question.curriculumTrack,
      version: (currentQuestion.version ?? 1) + 1, status: 'draft', verifiedBy: 'none', aiGenerated: true,
    });
    return { ownerId: base.ownerId, documentId: base.documentId, questionId: base.question.id,
      baseStamp: questionValueStamp(base.question), baseSourceStamp: base.sourceStamp,
      token: crypto.randomUUID(), value };
  } catch { return null; }
}
