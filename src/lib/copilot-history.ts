import type { Exam, Question } from '@/types/exam';
import { captureCopilotBase, copilotQuestionsStamp, type CopilotSubmission } from './copilot-submission';
import { questionDraftSourceStamp } from './question-draft';
import { normalizeQuestion } from './exam-document';

export interface CopilotHistoryEntry { id: string; ownerId: string; documentId: string; sourceStamp: string; before: Question[]; after: Question[] }
export interface CopilotHistory { undo: CopilotHistoryEntry[]; redo: CopilotHistoryEntry[] }
export const emptyCopilotHistory = (): CopilotHistory => ({ undo: [], redo: [] });
export function appendCopilotHistory(history: CopilotHistory, submission: CopilotSubmission): CopilotHistory {
  if (history.undo.some(entry => entry.id === submission.token)) return history;
  return { undo: [...history.undo, { id: submission.token, ownerId: submission.base.ownerId, documentId: submission.base.documentId, sourceStamp: submission.base.sourceStamp, before: structuredClone(submission.base.questions), after: structuredClone(submission.questions) }], redo: [] };
}
const bodyStamp = (question: Question) => copilotQuestionsStamp([{ ...question, version: undefined, status: undefined, verifiedBy: undefined }]);
export function prepareCopilotTravel(entry: CopilotHistoryEntry, direction: 'undo' | 'redo', ownerId: string, exam: Exam): CopilotSubmission | null {
  if (exam.access?.canEdit === false || entry.ownerId !== ownerId || entry.documentId !== exam.id || entry.sourceStamp !== questionDraftSourceStamp(exam)) return null;
  const expected = direction === 'undo' ? entry.after : entry.before, target = direction === 'undo' ? entry.before : entry.after;
  if (copilotQuestionsStamp(exam.questions) !== copilotQuestionsStamp(expected)) return null;
  try {
    const questions = target.map(question => {
      const current = exam.questions.find(value => value.id === question.id);
      if (current && bodyStamp(current) === bodyStamp(question)) return structuredClone(current);
      const versions = [...entry.before, ...entry.after, ...exam.questions].filter(value => value.id === question.id).map(value => value.version ?? 1);
      return normalizeQuestion({ ...structuredClone(question), version: Math.max(...versions) + 1, status: 'draft', verifiedBy: 'none' });
    });
    return { base: captureCopilotBase(ownerId, exam), token: crypto.randomUUID(), questions };
  } catch { return null; }
}
/** Advance only after the parent has acknowledged the exact travel result. */
export function confirmCopilotTravel(history: CopilotHistory, entryId: string, direction: 'undo' | 'redo', submission: CopilotSubmission): CopilotHistory {
  const source = direction === 'undo' ? history.undo : history.redo, entry = source.at(-1);
  if (!entry || entry.id !== entryId) return history;
  if (entry.ownerId !== submission.base.ownerId || entry.documentId !== submission.base.documentId || entry.sourceStamp !== submission.base.sourceStamp || copilotQuestionsStamp(direction === 'undo' ? entry.after : entry.before) !== copilotQuestionsStamp(submission.base.questions)) return history;
  const remaining = source.slice(0, -1).map(value => structuredClone(value));
  if (remaining.length) {
    const last = remaining[remaining.length - 1];
    if (direction === 'undo') last.after = structuredClone(submission.questions); else last.before = structuredClone(submission.questions);
  }
  return direction === 'undo'
    ? { undo: remaining, redo: [...history.redo, { ...entry, before: structuredClone(submission.questions) }] }
    : { undo: [...history.undo, { ...entry, after: structuredClone(submission.questions) }], redo: remaining };
}
