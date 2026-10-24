import type { Exam, Question } from '@/types/exam';
import { questionValueStamp, type QuestionManualSubmission } from './question-draft';

export interface QuestionUndoEntry { before: Question; afterStamp: string; sourceStamp: string }
export function prepareQuestionUndo(question: Question, sourceStamp: string, entry: QuestionUndoEntry, ownerId: string, documentId: string): QuestionManualSubmission | null {
  if (question.id !== entry.before.id || questionValueStamp(question) !== entry.afterStamp || sourceStamp !== entry.sourceStamp) return null;
  return { ownerId, documentId, questionId: question.id, baseStamp: questionValueStamp(question), baseSourceStamp: sourceStamp, token: `undo:${question.version ?? 1}`, value: { ...structuredClone(entry.before), version: (question.version ?? 1) + 1, status: 'draft', verifiedBy: 'none' } };
}
export function confirmedUndoHistory(history: QuestionUndoEntry[], expectedStamp: string | undefined, question: Question) {
  if (!expectedStamp || questionValueStamp(question) !== expectedStamp) return history;
  const remaining = history.slice(0, -1);
  if (remaining.length) remaining[remaining.length - 1] = { ...remaining[remaining.length - 1], afterStamp: questionValueStamp(question) };
  return remaining;
}
export function applyQuestionOrderCommand(previous: Exam, command: { documentId: string; baseOrder: string[]; questionId: string; action: 'up' | 'down' | 'duplicate'; newId?: string }): Exam {
  if (previous.id !== command.documentId || previous.access?.canEdit === false || JSON.stringify(previous.questions.map(question => question.id)) !== JSON.stringify(command.baseOrder)) return previous;
  const index = previous.questions.findIndex(question => question.id === command.questionId);
  if (index < 0) return previous;
  const questions = [...previous.questions];
  if (command.action === 'duplicate') {
    if (!command.newId || questions.some(question => question.id === command.newId)) return previous;
    questions.splice(index + 1, 0, { ...structuredClone(questions[index]), id: command.newId, version: 1, status: 'draft', verifiedBy: 'none' });
  } else {
    const destination = index + (command.action === 'up' ? -1 : 1);
    if (destination < 0 || destination >= questions.length) return previous;
    [questions[index], questions[destination]] = [questions[destination], questions[index]];
  }
  return { ...previous, questions };
}
