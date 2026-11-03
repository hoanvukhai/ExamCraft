import { applyCopilotMetadata, metadataStamp, type CopilotMetadataPatch } from './copilot-metadata';
import type { ExamMetadata } from '@/types/exam';
import type { Exam, Question } from '@/types/exam';
import { normalizeQuestion } from './exam-document';
import { captureQuestionAiBase, prepareQuestionAiSubmission } from './question-ai-review';
import { sameQuestionSourceStamp, questionDraftSourceStamp } from './question-draft';

export interface CopilotBase {
  ownerId: string;
  documentId: string;
  sourceStamp: string;
  questions: Question[];
  metadata?: ExamMetadata;
}
export interface CopilotActionResult {
  action: string;
  metadataPatch?: CopilotMetadataPatch;
  modifiedQuestion?: Question;
  targetQuestionId?: string;
  explanation?: string;
}
export interface CopilotSubmission {
  base: CopilotBase;
  token: string;
  questions: Question[];
  metadata?: ExamMetadata;
}

export function copilotQuestionsStamp(questions: Question[]): string {
  return JSON.stringify(questions, (_key, item) => item && typeof item === 'object' && !Array.isArray(item)
    ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b))) : item);
}
export function captureCopilotBase(ownerId: string, exam: Exam): CopilotBase {
  return { ownerId, documentId: exam.id, sourceStamp: questionDraftSourceStamp(exam), questions: structuredClone(exam.questions), metadata: structuredClone(exam.metadata) };
}
export function copilotBaseMatches(base: CopilotBase, ownerId: string, exam: Exam): boolean {
  return (!base.metadata || metadataStamp(base.metadata) === metadataStamp(exam.metadata)) && base.ownerId === ownerId && base.documentId === exam.id && sameQuestionSourceStamp(base.sourceStamp, questionDraftSourceStamp(exam))
    && copilotQuestionsStamp(base.questions) === copilotQuestionsStamp(exam.questions);
}
function validatedQuestions(questions: Question[]): Question[] {
  if (!Array.isArray(questions) || questions.length > 1000) throw Error('Question count exceeds document limit.');
  if (questions.some(question => typeof question?.id !== 'string' || !question.id.trim())) throw Error('Missing question ID.');
  const canonical = questions.map(normalizeQuestion);
  if (new Set(canonical.map(question => question.id)).size !== canonical.length) throw Error('Duplicate question ID.');
  // Validate every row, but keep untouched rows exactly as the teacher had them.
  return structuredClone(questions);
}

/** Explicit accept only. A stale whole-document question list never partially applies. */
export function prepareCopilotSubmission(base: CopilotBase, result: CopilotActionResult, ownerId: string, exam: Exam): CopilotSubmission | null {
  if (exam.access?.canEdit === false || !copilotBaseMatches(base, ownerId, exam)) return null;
  try {
    const questions = structuredClone(base.questions);
    if (result.action === 'update_metadata') {
      if (!base.metadata || !result.metadataPatch) return null;
      return {base:structuredClone(base),token:crypto.randomUUID(),questions,metadata:applyCopilotMetadata(exam,result.metadataPatch)};
    }
    if (result.action === 'modify_single_question' || result.action === 'delete_question') {
      if (!result.targetQuestionId) return null;
      const index = questions.findIndex(question => question.id === result.targetQuestionId);
      if (index < 0) return null;
      if (result.action === 'delete_question') questions.splice(index, 1);
      else {
        if (!result.modifiedQuestion) return null;
        const target = questions[index];
        const displayed = { ...target, subject: target.subject ?? exam.metadata.subject, grade: target.grade ?? exam.metadata.grade };
        const questionBase = captureQuestionAiBase(base.ownerId, base.documentId, base.sourceStamp, displayed);
        const submission = prepareQuestionAiSubmission(questionBase, result.modifiedQuestion, ownerId, exam.id, questionDraftSourceStamp(exam), displayed);
        if (!submission) return null;
        questions[index] = submission.value;
      }
    } else if (result.action === 'add_question') {
      if (!result.modifiedQuestion || questions.length >= 1000) return null;
      const candidate = normalizeQuestion({ ...result.modifiedQuestion, id: crypto.randomUUID() });
      const added = normalizeQuestion({ ...candidate, subject: exam.metadata.subject, grade: exam.metadata.grade,
        points: undefined, sectionId: undefined, passageId: undefined,
        knowledgeIds: undefined, outcomeIds: undefined, knowledgeReference: undefined,
        subBranch: undefined, curriculumTrack: undefined,
        aiGenerated: true, status: 'draft', verifiedBy: 'none', version: 1,
      });
      questions.push(added);
    } else return null;
    return { base: structuredClone(base), token: crypto.randomUUID(), questions: validatedQuestions(questions) };
  } catch { return null; }
}

export function applyCopilotSubmission(previous: Exam, submission: CopilotSubmission, ownerId: string): Exam {
  if (previous.access?.canEdit === false || !copilotBaseMatches(submission.base, ownerId, previous)) return previous;
  try {
    if(submission.metadata) {
      if (!submission.base.metadata || copilotQuestionsStamp(submission.questions)!==copilotQuestionsStamp(submission.base.questions)) return previous;
      const patch=Object.fromEntries(Object.entries(submission.metadata).filter(([key,value])=>JSON.stringify(value)!==JSON.stringify(submission.base.metadata?.[key as keyof ExamMetadata])));
      const metadata=applyCopilotMetadata(previous,patch);
      return {...previous,metadata};
    }
    return { ...previous, questions: validatedQuestions(submission.questions) }; }
  catch { return previous; }
}
