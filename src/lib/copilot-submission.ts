import { insertOutlineNodes } from './exam-outline';
import {
  projectQuestionField,
  resolveCopilotTarget,
  copilotInsertionPoint,
  type CopilotTarget,
} from './copilot-target';
import { applyCopilotMetadata, metadataStamp, type CopilotMetadataPatch } from './copilot-metadata';
import type { ExamMetadata } from '@/types/exam';
import type { Exam, Question } from '@/types/exam';
import { normalizeExamDocument, normalizeQuestion } from './exam-document';
import { captureQuestionAiBase, prepareQuestionAiSubmission } from './question-ai-review';
import { sameQuestionSourceStamp, questionDraftSourceStamp } from './question-draft';

export interface CopilotBase {
  ownerId: string;
  documentId: string;
  sourceStamp: string;
  questions: Question[];
  metadata?: ExamMetadata;
  target?: CopilotTarget;
  metadataOnly?: boolean;
}
export interface CopilotActionResult {
  action: string;
  metadataPatch?: CopilotMetadataPatch;
  modifiedQuestion?: Question;
  modifiedQuestions?: Question[];
  candidate?: Exam;
  targetQuestionId?: string;
  explanation?: string;
}
export interface CopilotSubmission {
  base: CopilotBase;
  token: string;
  questions: Question[];
  metadata?: ExamMetadata;
  candidate?: Exam;
}

export function copilotQuestionsStamp(questions: Question[]): string {
  return JSON.stringify(questions, (_key, item) =>
    item && typeof item === 'object' && !Array.isArray(item)
      ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b)))
      : item,
  );
}
export function captureCopilotBase(
  ownerId: string,
  exam: Exam,
  target?: CopilotTarget,
): CopilotBase {
  return {
    ownerId,
    documentId: exam.id,
    sourceStamp: questionDraftSourceStamp(exam),
    questions: structuredClone(exam.questions),
    metadata: structuredClone(exam.metadata),
    ...(target ? { target: structuredClone(target) } : {}),
  };
}
export function metadataCopilotBase(base: CopilotBase): CopilotBase {
  return { ...base, metadataOnly: true, questions: [], sourceStamp: 'metadata-only' };
}
export function copilotBaseMatches(base: CopilotBase, ownerId: string, exam: Exam): boolean {
  if (base.metadataOnly)
    return (
      !!base.metadata &&
      base.ownerId === ownerId &&
      base.documentId === exam.id &&
      metadataStamp(base.metadata) === metadataStamp(exam.metadata)
    );
  return (
    (!base.metadata || metadataStamp(base.metadata) === metadataStamp(exam.metadata)) &&
    base.ownerId === ownerId &&
    base.documentId === exam.id &&
    sameQuestionSourceStamp(base.sourceStamp, questionDraftSourceStamp(exam)) &&
    copilotQuestionsStamp(base.questions) === copilotQuestionsStamp(exam.questions)
  );
}
function validatedQuestions(questions: Question[]): Question[] {
  if (!Array.isArray(questions) || questions.length > 1000)
    throw Error('Question count exceeds document limit.');
  if (questions.some((question) => typeof question?.id !== 'string' || !question.id.trim()))
    throw Error('Missing question ID.');
  const canonical = questions.map(normalizeQuestion);
  if (new Set(canonical.map((question) => question.id)).size !== canonical.length)
    throw Error('Duplicate question ID.');
  // Validate every row, but keep untouched rows exactly as the teacher had them.
  return structuredClone(questions);
}

/** Explicit accept only. A stale whole-document question list never partially applies. */
export function prepareCopilotSubmission(
  base: CopilotBase,
  result: CopilotActionResult,
  ownerId: string,
  exam: Exam,
): CopilotSubmission | null {
  if (exam.access?.canEdit === false || !copilotBaseMatches(base, ownerId, exam)) return null;
  try {
    const questions = structuredClone(base.questions);
    const nextMetadata = result.metadataPatch
      ? applyCopilotMetadata(exam, result.metadataPatch)
      : undefined;
    const metadataForQuestions = nextMetadata ?? exam.metadata;
    const combined = (questions: Question[]): CopilotSubmission => {
      const value = validatedQuestions(questions);
      return {
        base: structuredClone(base),
        token: crypto.randomUUID(),
        questions: value,
        ...(nextMetadata
          ? {
              metadata: nextMetadata,
              candidate: normalizeExamDocument({
                ...exam,
                metadata: nextMetadata,
                questions: value,
              }),
            }
          : {}),
      };
    };
    if (result.action === 'replace_exam') {
      if (
        !result.candidate ||
        (base.target && base.target.kind !== 'document') ||
        exam.questions.some((q) => q.locked)
      )
        return null;
      const candidate = normalizeExamDocument({
        ...result.candidate,
        id: exam.id,
        serverId: exam.serverId,
        version: exam.version,
        access: exam.access,
        createdAt: exam.createdAt,
      });
      return {
        base: structuredClone(base),
        token: crypto.randomUUID(),
        questions: candidate.questions,
        metadata: candidate.metadata,
        candidate,
      };
    }
    if (result.action === 'update_metadata') {
      if (!base.metadata || !result.metadataPatch) return null;
      return {
        base: structuredClone(base),
        token: crypto.randomUUID(),
        questions,
        metadata: applyCopilotMetadata(exam, result.metadataPatch),
      };
    }
    if (result.action === 'modify_questions') {
      if (!base.target || !result.modifiedQuestions?.length) return null;
      const { ids } = resolveCopilotTarget(exam, base.target);
      if (
        ids.length !== result.modifiedQuestions.length ||
        new Set(result.modifiedQuestions.map((q) => q.id)).size !== ids.length ||
        result.modifiedQuestions.some((q) => !ids.includes(q.id))
      )
        return null;
      for (const candidate of result.modifiedQuestions) {
        const index = questions.findIndex((q) => q.id === candidate.id),
          target = questions[index];
        if (!target || target.locked) return null;
        const displayed = {
          ...target,
          subject: target.subject ?? exam.metadata.subject,
          grade: target.grade ?? exam.metadata.grade,
        };
        const submission = prepareQuestionAiSubmission(
          captureQuestionAiBase(ownerId, exam.id, base.sourceStamp, displayed),
          projectQuestionField(displayed, candidate, base.target),
          ownerId,
          exam.id,
          questionDraftSourceStamp(exam),
          displayed,
        );
        if (!submission) return null;
        questions[index] = submission.value;
      }
      return combined(questions);
    }
    if (result.action === 'modify_single_question' || result.action === 'delete_question') {
      if (!result.targetQuestionId) return null;
      const index = questions.findIndex((question) => question.id === result.targetQuestionId);
      if (index < 0 || questions[index].locked) return null;
      if (
        base.target &&
        !resolveCopilotTarget(exam, base.target).ids.includes(result.targetQuestionId)
      )
        return null;
      if (result.action === 'delete_question') questions.splice(index, 1);
      else {
        if (!result.modifiedQuestion) return null;
        const target = questions[index];
        const displayed = {
          ...target,
          subject: target.subject ?? exam.metadata.subject,
          grade: target.grade ?? exam.metadata.grade,
        };
        const questionBase = captureQuestionAiBase(
          base.ownerId,
          base.documentId,
          base.sourceStamp,
          displayed,
        );
        const submission = prepareQuestionAiSubmission(
          questionBase,
          base.target
            ? projectQuestionField(displayed, result.modifiedQuestion, base.target)
            : result.modifiedQuestion,
          ownerId,
          exam.id,
          questionDraftSourceStamp(exam),
          displayed,
        );
        if (!submission) return null;
        questions[index] = submission.value;
      }
    } else if (result.action === 'add_question') {
      if (!result.modifiedQuestion || questions.length >= 1000) return null;
      const candidate = normalizeQuestion({ ...result.modifiedQuestion, id: crypto.randomUUID() });
      if (
        (candidate.grade !== undefined && candidate.grade !== metadataForQuestions.grade) ||
        (candidate.subject !== undefined && candidate.subject !== metadataForQuestions.subject)
      )
        return null;
      const added = normalizeQuestion({
        ...candidate,
        subject: metadataForQuestions.subject,
        grade: metadataForQuestions.grade,
        points: undefined,
        sectionId: undefined,
        passageId: undefined,
        knowledgeIds: undefined,
        outcomeIds: undefined,
        knowledgeReference: undefined,
        subBranch: undefined,
        curriculumTrack: undefined,
        aiGenerated: true,
        status: 'draft',
        verifiedBy: 'none',
        version: 1,
      });
      const { outline, point } = copilotInsertionPoint(exam, base.target ?? { kind: 'document' });
      const candidateDocument = normalizeExamDocument(
        insertOutlineNodes(
          { ...exam, outline, metadata: metadataForQuestions },
          point,
          [{ id: crypto.randomUUID(), kind: 'question', questionId: added.id }],
          [added],
        ),
      );
      return {
        base: structuredClone(base),
        token: crypto.randomUUID(),
        questions: candidateDocument.questions,
        metadata: candidateDocument.metadata,
        candidate: candidateDocument,
      };
    } else return null;
    return combined(questions);
  } catch {
    return null;
  }
}

export function applyCopilotSubmission(
  previous: Exam,
  submission: CopilotSubmission,
  ownerId: string,
): Exam {
  if (previous.access?.canEdit === false || !copilotBaseMatches(submission.base, ownerId, previous))
    return previous;
  try {
    if (submission.candidate) {
      if (
        previous.questions.some(
          (q) =>
            q.locked &&
            copilotQuestionsStamp([q]) !==
              copilotQuestionsStamp(
                submission.candidate!.questions.filter((after) => after.id === q.id),
              ),
        )
      )
        return previous;
      return normalizeExamDocument({
        ...submission.candidate,
        id: previous.id,
        serverId: previous.serverId,
        version: previous.version,
        access: previous.access,
        createdAt: previous.createdAt,
      });
    }
    if (submission.metadata) {
      if (
        !submission.base.metadata ||
        (!submission.base.metadataOnly &&
          copilotQuestionsStamp(submission.questions) !==
            copilotQuestionsStamp(submission.base.questions))
      )
        return previous;
      const patch = Object.fromEntries(
        Object.entries(submission.metadata).filter(
          ([key, value]) =>
            JSON.stringify(value) !==
            JSON.stringify(submission.base.metadata?.[key as keyof ExamMetadata]),
        ),
      );
      const metadata = applyCopilotMetadata(previous, patch);
      return { ...previous, metadata };
    }
    if (
      previous.questions.some(
        (question) =>
          question.locked &&
          JSON.stringify(question) !==
            JSON.stringify(submission.questions.find((q) => q.id === question.id)),
      )
    )
      return previous;
    return { ...previous, questions: validatedQuestions(submission.questions) };
  } catch {
    return previous;
  }
}
