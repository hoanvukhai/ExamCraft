import type { Exam, OutlineNode, Passage, Question } from '@/types/exam';
import { syncOutline } from './exam-outline';

/** What one edit changed, by object. Reverting only touches objects that are still exactly as the edit left them. */
export type Change = { before: Exam; after: Exam; at: number; signature: string };

const canonical = (value: unknown): string =>
  JSON.stringify(value, (_key, item) =>
    item && typeof item === 'object' && !Array.isArray(item)
      ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b)))
      : item,
  );
const same = (a: unknown, b: unknown) => a === b || canonical(a) === canonical(b);

export type ExamDiff = {
  questions: string[];
  passages: string[];
  metadata: string[];
  outline: boolean;
};

export function diffExam(before: Exam, after: Exam): ExamDiff {
  const ids = <T extends { id: string }>(list: T[] | undefined) => new Map((list ?? []).map((item) => [item.id, item]));
  const changed = <T extends { id: string }>(a: T[] | undefined, b: T[] | undefined) => {
    const left = ids(a),
      right = ids(b);
    return [...new Set([...left.keys(), ...right.keys()])].filter((id) => !same(left.get(id), right.get(id)));
  };
  const keys = new Set([...Object.keys(before.metadata), ...Object.keys(after.metadata)]);
  const metaKeys = [...keys].filter(
    (key) => !same((before.metadata as unknown as Record<string, unknown>)[key], (after.metadata as unknown as Record<string, unknown>)[key]),
  );
  return {
    questions: changed(before.questions, after.questions),
    passages: changed(before.passages, after.passages),
    metadata: metaKeys,
    outline: !same(before.outline, after.outline) || !same(before.questions.map((q) => q.id), after.questions.map((q) => q.id)),
  };
}

export const hasChange = (diff: ExamDiff) =>
  diff.questions.length > 0 || diff.passages.length > 0 || diff.metadata.length > 0 || diff.outline;

export const diffSignature = (diff: ExamDiff) => canonical(diff);

export function makeChange(before: Exam, after: Exam, at = Date.now()): Change | null {
  const diff = diffExam(before, after);
  return hasChange(diff) ? { before, after, at, signature: diffSignature(diff) } : null;
}

/** Edits to the same objects made in quick succession (typing) become one step. */
export function mergeChange(previous: Change | undefined, next: Change, windowMs = 1000): Change[] {
  if (previous && next.at - previous.at < windowMs && previous.signature === next.signature)
    return [{ before: previous.before, after: next.after, at: next.at, signature: next.signature }];
  return previous ? [previous, next] : [next];
}

export type Reverted = { exam: Exam; skipped: string[]; changed: boolean };

/**
 * Put back what `change` altered, but only where the current exam still equals the result of the change.
 * Anything someone else (or a later edit) touched in the meantime is left alone and reported.
 */
export function revertChange(current: Exam, change: Change): Reverted {
  const diff = diffExam(change.before, change.after);
  const skipped: string[] = [];
  const pick = <T extends { id: string }>(list: T[] | undefined, id: string) => (list ?? []).find((item) => item.id === id);

  const apply = (withStructure: boolean): Exam => {
    let questions = [...current.questions];
    let passages: Passage[] | undefined = current.passages ? [...current.passages] : undefined;
    const metadata = { ...current.metadata } as unknown as Record<string, unknown>;
    let outline: OutlineNode[] | undefined = current.outline;

    for (const id of diff.questions) {
      const was = pick(change.before.questions, id),
        became = pick(change.after.questions, id),
        now = questions.find((item) => item.id === id);
      if (was && became) {
        if (now && same(now, became)) questions = questions.map((item) => (item.id === id ? (was as Question) : item));
        else if (!withStructure) continue;
        else skipped.push('câu đã được sửa tiếp');
      } else if (became && !was) {
        if (!withStructure) continue;
        if (now && same(now, became)) questions = questions.filter((item) => item.id !== id);
        else skipped.push('câu thêm vào đã được sửa tiếp');
      } else if (was && !became) {
        if (!withStructure) continue;
        if (!now) questions.push(was as Question);
      }
    }
    for (const id of diff.passages) {
      const was = pick(change.before.passages, id),
        became = pick(change.after.passages, id),
        now = pick(passages, id);
      if (was && became) {
        if (now && same(now, became)) passages = passages!.map((item) => (item.id === id ? was : item));
        else skipped.push('ngữ liệu đã được sửa tiếp');
      } else if (became && !was) {
        if (now && same(now, became)) passages = passages!.filter((item) => item.id !== id);
      } else if (was && !became && !now) passages = [...(passages ?? []), was];
    }
    for (const key of diff.metadata) {
      const was = (change.before.metadata as unknown as Record<string, unknown>)[key];
      const became = (change.after.metadata as unknown as Record<string, unknown>)[key];
      if (same(metadata[key], became)) {
        if (was === undefined) delete metadata[key];
        else metadata[key] = was;
      } else skipped.push('thông tin đã được sửa tiếp');
    }
    if (withStructure && diff.outline) {
      if (same(current.outline, change.after.outline)) outline = change.before.outline;
      else skipped.push('thứ tự và cấu trúc đã đổi sau đó');
    }
    return { ...current, questions, passages, metadata: metadata as unknown as Exam['metadata'], outline } as Exam;
  };

  let result: Exam;
  try {
    result = syncOutline(apply(true));
  } catch {
    // Structure cannot be put back consistently (someone else moved things): keep edits to existing questions only.
    skipped.length = 0;
    skipped.push('cấu trúc đã đổi, chỉ hoàn tác nội dung');
    result = apply(false);
  }
  return { exam: result, skipped: [...new Set(skipped)], changed: !same(result, current) };
}
