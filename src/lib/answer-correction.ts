import { createHash } from 'node:crypto';
import { ApiError } from './api-error';
import { gradeSnapshot } from './attempt-grading';
import { asObject, snapshotQuestions } from './public-exam';

type Data = Record<string, unknown>;
export type AnswerKey = { correct: string | null; accepted: string[] };
export type AnswerChange = { correctAnswer?: string; acceptedAnswers?: string[] };

/** Types whose points depend only on a stored answer key, so a corrected key can be re-applied to stored responses. */
const REGRADABLE = new Set(['MULTIPLE_CHOICE', 'SHORT_ANSWER', 'FILL_BLANK']);
const scalarRegradable = (question: Data) => REGRADABLE.has(String(question.type).toUpperCase()) &&
  !(Array.isArray(question.parts) && question.parts.length);
const list = (value: unknown): unknown[] => Array.isArray(value) ? value : [];

/** Reads the key the same way gradeSnapshot does, so what is shown is what is graded. */
export function readAnswerKey(question: Data): AnswerKey {
  const payload = asObject(question.payload);
  const correct = payload.correct ?? payload.correct_answer ?? question.correct_answer;
  const accepted = payload.accepted_answers ?? question.accepted_answers;
  return {
    correct: typeof correct === 'string' || typeof correct === 'number' ? String(correct) : null,
    accepted: Array.isArray(accepted) ? accepted.filter(a => typeof a === 'string' || typeof a === 'number').map(String) : [],
  };
}

export function regradableQuestions(snapshot: unknown) {
  // `number` is the position in the whole exam, the same number the teacher sees when grading.
  return snapshotQuestions(snapshot).map((question, index) => ({ question, number: index + 1 })).filter(({ question }) => scalarRegradable(question)).map(({ question, number }) => ({
    number, id: String(question.id), type: String(question.type).toUpperCase(), content: String(question.content ?? ''), key: readAnswerKey(question),
    choiceKeys: list(question.choices ?? asObject(question.payload).choices).map(choice => String(asObject(choice).key ?? '')).filter(Boolean),
  }));
}

export function correctionHistory(snapshot: unknown, questionKey: string): Data[] {
  return list(asObject(asObject(snapshot).corrections)[questionKey]).map(asObject);
}

/** Changes whenever the key or the correction history changes, so a stale form cannot overwrite a newer correction. */
export function correctionRevision(assignmentId: string, snapshot: unknown, questionKey: string) {
  const question = snapshotQuestions(snapshot).find(item => String(item.id) === questionKey);
  return createHash('sha256').update(JSON.stringify([assignmentId, questionKey, question ? readAnswerKey(question) : null, correctionHistory(snapshot, questionKey).length])).digest('hex');
}

function patchQuestion(question: Data, type: string, key: AnswerKey): Data {
  const next: Data = { ...question, correct_answer: key.correct ?? undefined };
  if (type !== 'MULTIPLE_CHOICE') next.accepted_answers = key.accepted;
  if (question.payload && typeof question.payload === 'object' && !Array.isArray(question.payload)) {
    const payload: Data = { ...(question.payload as Data), correct: key.correct ?? undefined };
    if ('correct_answer' in payload) payload.correct_answer = key.correct ?? undefined;
    if (type !== 'MULTIPLE_CHOICE') payload.accepted_answers = key.accepted;
    next.payload = payload;
  }
  return next;
}

/**
 * Returns a copy of the snapshot with one corrected answer key and an appended history entry.
 * Only keys of auto-graded types are accepted; everything else about the frozen exam stays byte for byte.
 */
export function applyAnswerCorrection(snapshotValue: unknown, questionKey: string, change: AnswerChange, meta: { at: string; by: string; reason: string }) {
  const snapshot = structuredClone(asObject(snapshotValue)) as Data;
  const question = snapshotQuestions(snapshot).find(item => String(item.id) === questionKey);
  if (!question) throw new ApiError(404, 'Câu hỏi không có trong bản đề đã giao');
  const type = String(question.type).toUpperCase();
  if (!scalarRegradable(question)) throw new ApiError(422, 'Chỉ sửa đáp án và chấm lại tự động cho câu trắc nghiệm một đáp án, trả lời ngắn và điền khuyết. Câu khác hãy chấm tay.', 'REGRADE_TYPE_UNSUPPORTED');
  const before = readAnswerKey(question);
  let after: AnswerKey;
  if (type === 'MULTIPLE_CHOICE') {
    const correct = change.correctAnswer?.trim().toUpperCase();
    if (!correct) throw new ApiError(400, 'Cần chọn đáp án đúng mới');
    const keys = list(question.choices ?? asObject(question.payload).choices).map(choice => String(asObject(choice).key ?? '').toUpperCase()).filter(Boolean);
    if (keys.length && !keys.includes(correct)) throw new ApiError(400, 'Đáp án đúng phải là một trong các phương án của câu');
    after = { correct, accepted: [] };
  } else {
    const accepted = [...new Set((change.acceptedAnswers ?? []).map(value => value.trim()).filter(Boolean))];
    if (!accepted.length || accepted.length > 20 || accepted.some(value => value.length > 200)) throw new ApiError(400, 'Cần từ 1 đến 20 đáp án chấp nhận, mỗi đáp án tối đa 200 ký tự');
    after = { correct: accepted[0], accepted };
  }
  const replace = (items: unknown) => list(items).map(item => String(asObject(item).id) === questionKey ? patchQuestion(asObject(item), type, after) : item);
  if (Array.isArray(snapshot.questions)) snapshot.questions = replace(snapshot.questions);
  if (Array.isArray(snapshot.sections)) snapshot.sections = snapshot.sections.map(section => Array.isArray(asObject(section).questions) ? { ...asObject(section), questions: replace(asObject(section).questions) } : section);
  const readBack = snapshotQuestions(snapshot).find(item => String(item.id) === questionKey);
  const applied = readBack ? readAnswerKey(readBack) : null;
  if (!applied || applied.correct !== after.correct || (type !== 'MULTIPLE_CHOICE' && JSON.stringify(applied.accepted) !== JSON.stringify(after.accepted))) throw new ApiError(422, 'Không áp dụng được đáp án mới vào cấu trúc câu này', 'REGRADE_KEY_NOT_APPLIED');
  const corrections = asObject(snapshot.corrections);
  snapshot.corrections = { ...corrections, [questionKey]: [...list(corrections[questionKey]), { at: meta.at, by: meta.by, reason: meta.reason, before, after }] };
  return { snapshot, type, before, after };
}

/** Auto-graded result of one stored response under the (corrected) snapshot. */
export function autoResult(snapshot: unknown, questionKey: string, response: unknown) {
  const graded = gradeSnapshot(snapshot, { [questionKey]: response }).gradedAnswers.find(answer => answer.questionKey === questionKey);
  return graded ? { isCorrect: graded.isCorrect, earned: graded.earned } : null;
}
