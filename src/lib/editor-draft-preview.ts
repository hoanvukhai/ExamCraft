import { insertOutlineNodes, type InsertPoint } from './exam-outline';
import type { Exam, Question } from '@/types/exam';
import { applyHeaderSubmission, type HeaderSubmission } from './header-layout';
import { normalizeQuestion } from './exam-document';
import { questionDraftSourceStamp, questionValueStamp, type QuestionManualSubmission } from './question-draft';

// A preview is a projection; it must never mutate the saved document or bypass CAS.
export function previewHeaderDraft(exam: Exam, submission: HeaderSubmission | null): Exam {
  return submission ? applyHeaderSubmission(exam, submission) : exam;
}

export function appendManualQuestion(exam: Exam, submission: QuestionManualSubmission, ownerId: string, seed: Question, point?: InsertPoint): Exam {
  if (exam.access?.canEdit === false || submission.ownerId !== ownerId || submission.documentId !== exam.id ||
      submission.baseSourceStamp !== questionDraftSourceStamp(exam) || submission.questionId !== seed.id ||
      submission.value.id !== seed.id || submission.baseStamp !== questionValueStamp(seed) ||
      exam.questions.some(question => question.id === seed.id)) return exam;
  try { normalizeQuestion(submission.value); } catch { return exam; }
  if (point || exam.outline) {
    try {
      return insertOutlineNodes(exam, point ?? { parentId: null, afterId: exam.outline?.at(-1)?.id ?? null }, [{
        id: 'question:' + seed.id, kind: 'question', questionId: seed.id,
      }], [submission.value]);
    } catch { return exam; }
  }
  return { ...exam, questions: [...exam.questions, submission.value] };
}
