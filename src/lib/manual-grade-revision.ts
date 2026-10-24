import { attemptDraftRevision } from './attempt-draft-revision';

type Answer = { response?: unknown; earned?: unknown; manualScore?: unknown; comment?: string | null; isCorrect?: boolean | null };
export function manualGradeState(answer: Answer | null | undefined) {
  return { earned: Number(answer?.earned ?? 0), manualScore: answer?.manualScore == null ? null : Number(answer.manualScore), comment: answer?.comment ?? null, isCorrect: answer?.isCorrect ?? null };
}
export function manualGradeRevision(attemptId: string, questionKey: string, answer: Answer | null | undefined) {
  return attemptDraftRevision({ attemptId, questionKey, response: answer?.response ?? null, ...manualGradeState(answer) });
}
export function manualGradeAlreadyApplied(answer: Answer | null | undefined, earned: number, comment: string | undefined) {
  return answer?.manualScore != null && Number(answer.manualScore) === earned && (comment === undefined || answer.comment === comment);
}
