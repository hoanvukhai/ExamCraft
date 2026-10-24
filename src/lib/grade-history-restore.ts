/** Pure rules shared by the grading route and screen: restoring a state from a grading event, and building a grade submission. */
export type GradeHistorySide = 'before' | 'after';
export interface GradeState { earned: number; manualScore: number | null; comment: string | null; isCorrect: boolean | null }
export type HistoryStateRead = { ok: true; state: GradeState } | { ok: false; message: string };
export interface RestoreLimits { numeric: boolean; maxPoints: number; pointsConfigured: boolean }

const MAX_COMMENT = 5000;
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const nonNegative = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const reject = (message: string): HistoryStateRead => ({ ok: false, message });
export const isGradeHistorySide = (value: unknown): value is GradeHistorySide => value === 'before' || value === 'after';

/**
 * Read one side of a stored grading event. Every field must be present with its exact type: an old or hand-edited event
 * that lacks one is refused instead of guessed, so a pending answer can never become a graded zero by omission.
 */
export function readHistoryState(meta: unknown, side: unknown, questionKey?: string): HistoryStateRead {
  if (!isRecord(meta) || typeof meta.questionKey !== 'string' || !meta.questionKey) return reject('Sự kiện lịch sử không ghi rõ câu hỏi nên chưa thể khôi phục.');
  if (questionKey !== undefined && meta.questionKey !== questionKey) return reject('Sự kiện lịch sử thuộc câu khác.');
  if (!isGradeHistorySide(side)) return reject('Cần chọn trạng thái trước hoặc sau của sự kiện.');
  const raw = meta[side];
  if (!isRecord(raw)) return reject('Sự kiện lịch sử cũ không lưu đủ trạng thái để khôi phục.');
  const { earned, manualScore, comment, isCorrect } = raw;
  if (!nonNegative(earned)) return reject('Điểm trong sự kiện lịch sử không hợp lệ.');
  if (!('manualScore' in raw) || (manualScore !== null && !nonNegative(manualScore))) return reject('Sự kiện lịch sử cũ không phân biệt được chấm tay hay chờ chấm.');
  if (!('comment' in raw) || (comment !== null && (typeof comment !== 'string' || comment.length > MAX_COMMENT))) return reject('Nhận xét trong sự kiện lịch sử không hợp lệ.');
  if (!('isCorrect' in raw) || (isCorrect !== null && typeof isCorrect !== 'boolean')) return reject('Sự kiện lịch sử cũ không ghi trạng thái đúng/sai.');
  return { ok: true, state: { earned, manualScore, comment, isCorrect } };
}

/** Old or incomplete audit metadata must remain visible without crashing the grading screen. */
export function describeGradeHistory(meta: unknown) {
  const questionKey = isRecord(meta) && typeof meta.questionKey === 'string' ? meta.questionKey : null;
  return { questionKey, before: readHistoryState(meta, 'before'), after: readHistoryState(meta, 'after'),
    restored: isRecord(meta) && isRecord(meta.restoredFrom) && typeof meta.restoredFrom.eventId === 'string' && isGradeHistorySide(meta.restoredFrom.side) };
}

/** Check a stored state against the assigned snapshot's limits for that question (the same rules a teacher's own save obeys). */
export function validateRestoreState(state: GradeState, limits: RestoreLimits): { ok: true } | { ok: false; message: string } {
  const bad = (message: string) => ({ ok: false as const, message });
  if (!limits.numeric) {
    if (state.manualScore !== null && state.manualScore !== 0) return bad('Bài nhận xét/khảo sát không có điểm số.');
    if (state.earned !== 0 || state.isCorrect !== null) return bad('Trạng thái lịch sử không khớp loại bài nhận xét/khảo sát.');
    return { ok: true };
  }
  if (state.earned > limits.maxPoints) return bad(`Điểm trong lịch sử vượt tối đa hiện tại của câu (${limits.maxPoints}).`);
  if (state.manualScore === null) return { ok: true };
  if (!limits.pointsConfigured) return bad('Bản đề đã giao chưa có điểm hợp lệ cho câu này.');
  if (state.manualScore > limits.maxPoints || Math.abs(Math.round(state.manualScore * 100) - state.manualScore * 100) > 1e-8) return bad(`Điểm chấm tay cần từ 0 đến ${limits.maxPoints}, tối đa hai chữ số thập phân.`);
  if (state.earned !== state.manualScore) return bad('Điểm chấm tay và điểm tính không khớp trong lịch sử.');
  if (state.isCorrect !== (limits.maxPoints > 0 ? state.manualScore === limits.maxPoints : null)) return bad('Trạng thái đúng/sai không khớp điểm trong lịch sử.');
  return { ok: true };
}

/** Strict equality: pending (manualScore null) differs from a graded 0, and null differs from an empty comment or false. */
export function sameGradeState(a: GradeState, b: GradeState) {
  return a.earned === b.earned && a.manualScore === b.manualScore && a.comment === b.comment && a.isCorrect === b.isCorrect;
}

/** noop = already in the requested state (a retry); conflict = someone changed it since the page was read. */
export function decideRestore(current: GradeState, target: GradeState, baseMatchesCurrent: boolean): 'noop' | 'apply' | 'conflict' {
  if (sameGradeState(current, target)) return 'noop';
  return baseMatchesCurrent ? 'apply' : 'conflict';
}

export interface EditableQuestion { points: number; earned: number; manualScore?: number | null; isCorrect: boolean | null; teacherComment?: string | null }
export interface GradeDraft { score: string; comment: string; base: string }

/** What the score box shows before the teacher types: nothing for a pending answer, so Save never invents a 0. */
export const isPendingGrade = (question: EditableQuestion, numeric: boolean) => numeric && question.manualScore == null && question.isCorrect === null;
export const initialScoreText = (question: EditableQuestion, numeric: boolean) => (!numeric || isPendingGrade(question, numeric) ? '' : String(question.manualScore ?? question.earned));
export const initialCommentText = (question: EditableQuestion) => question.teacherComment ?? '';
export function isGradeDraftDirty(question: EditableQuestion, draft: Pick<GradeDraft, 'score' | 'comment'> | undefined, numeric: boolean) {
  return !!draft && ((numeric && draft.score !== initialScoreText(question, numeric)) || draft.comment !== initialCommentText(question));
}

/** Turn a draft into the POST fields; the server still validates everything again. */
export function buildGradeSubmission(question: EditableQuestion, draft: Pick<GradeDraft, 'score' | 'comment'>, numeric: boolean):
  { ok: true; earned: number | null; teacherComment: string | undefined } | { ok: false; message: string } {
  if (draft.comment.length > MAX_COMMENT) return { ok: false, message: `Nhận xét tối đa ${MAX_COMMENT} ký tự.` };
  const commentChanged = draft.comment !== initialCommentText(question);
  const teacherComment = commentChanged ? draft.comment : undefined;
  if (!numeric) {
    if (!draft.comment.trim()) return { ok: false, message: 'Hãy nhập nhận xét cho câu này.' };
    return commentChanged ? { ok: true, earned: null, teacherComment } : { ok: false, message: 'Nhận xét chưa thay đổi.' };
  }
  const text = draft.score.trim().replace(',', '.');
  if (!text) return { ok: false, message: isPendingGrade(question, numeric) ? 'Câu đang chờ chấm: hãy nhập điểm rõ ràng (có thể là 0) trước khi lưu.' : 'Hãy nhập điểm.' };
  const earned = /^\d+(\.\d+)?$/.test(text) ? Number(text) : NaN;
  if (!Number.isFinite(earned) || earned < 0 || earned > question.points || Math.abs(Math.round(earned * 100) - earned * 100) > 1e-8) return { ok: false, message: `Điểm cần từ 0 đến ${question.points}, tối đa hai chữ số thập phân.` };
  return { ok: true, earned, teacherComment };
}
