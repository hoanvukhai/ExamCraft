import type { Exam, OutlineNode, Passage, Question } from '@/types/exam';
import { outlineNodes, syncOutline } from './exam-outline';

const canonical = (value: unknown): string =>
  JSON.stringify(value, (_key, item) =>
    item && typeof item === 'object' && !Array.isArray(item)
      ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b)))
      : item,
  );
const same = (a: unknown, b: unknown) => a === b || canonical(a) === canonical(b);

/** One place where two teachers changed the same thing in different ways. */
export type MergeConflict = { code: string; label: string; mine: string; theirs: string };
export type MergeChoices = Record<string, 'mine' | 'theirs'>;
export type MergeResult = { exam: Exam; conflicts: MergeConflict[] };

const FIELD_NAMES: Record<string, string> = {
  content: 'nội dung',
  choices: 'các phương án',
  correct_answer: 'đáp án',
  accepted_answers: 'các đáp án chấp nhận',
  step_by_step_solution: 'lời giải',
  points: 'điểm',
  type: 'dạng câu',
  sub_questions: 'các mệnh đề',
  parts: 'các ý',
  figures: 'hình',
  rubric: 'barem',
  matchingPairs: 'các cặp ghép',
  correctOrder: 'thứ tự đúng',
  cognitiveLevel: 'mức nhận thức',
  learningOutcome: 'yêu cầu cần đạt',
  locked: 'khóa',
};
const META_NAMES: Record<string, string> = {
  title: 'tên đề',
  subject: 'môn',
  grade: 'lớp',
  durationMinutes: 'thời gian',
  schoolName: 'đơn vị',
  departmentName: 'trường',
  academicYear: 'năm học',
  semester: 'học kỳ',
  examCode: 'mã đề',
  notes: 'ghi chú',
  headerLayout: 'dòng đầu trang',
  printLayout: 'bố cục in',
  pageSetup: 'trang in',
};
const show = (value: unknown) => {
  const text = typeof value === 'string' ? value : (JSON.stringify(value) ?? '(trống)');
  return text.length > 80 ? text.slice(0, 77) + '…' : text || '(trống)';
};

/**
 * Put together what I changed and what someone else saved since we both started from `base`.
 * Different questions, or different fields of one question, merge by themselves; only the same field changed
 * in two ways, or an edit against a delete, needs a choice. Without a choice a conflict keeps my version.
 */
export function mergeExams(base: Exam, mine: Exam, theirs: Exam, choices: MergeChoices = {}): MergeResult {
  const conflicts: MergeConflict[] = [];
  const pick = <T>(code: string, label: string, b: T, m: T, t: T): T => {
    if (same(m, t)) return m;
    if (same(b, m)) return t;
    if (same(b, t)) return m;
    conflicts.push({ code, label, mine: show(m), theirs: show(t) });
    return choices[code] === 'theirs' ? t : m;
  };
  const number = (id: string) => {
    const at = mine.questions.findIndex((question) => question.id === id);
    const other = theirs.questions.findIndex((question) => question.id === id);
    return 'Câu ' + ((at >= 0 ? at : other) + 1);
  };

  // ---- questions
  const byId = (exam: Exam) => new Map(exam.questions.map((question) => [question.id, question]));
  const [baseQ, mineQ, theirsQ] = [byId(base), byId(mine), byId(theirs)];
  const ids = [...new Set([...theirs.questions.map((q) => q.id), ...mine.questions.map((q) => q.id)])];
  const questions = new Map<string, Question>();
  for (const id of ids) {
    const [b, m, t] = [baseQ.get(id), mineQ.get(id), theirsQ.get(id)];
    if (m && t) {
      if (!b) {
        questions.set(id, pick(`q:${id}`, number(id), b, m, t) as Question);
        continue;
      }
      const merged: Record<string, unknown> = {};
      const keys = new Set([...Object.keys(m), ...Object.keys(t), ...Object.keys(b)]);
      for (const key of keys) {
        const value = pick<unknown>(
          `q:${id}:${key}`,
          `${number(id)} · ${FIELD_NAMES[key] ?? key}`,
          (b as unknown as Record<string, unknown>)[key],
          (m as unknown as Record<string, unknown>)[key],
          (t as unknown as Record<string, unknown>)[key],
        );
        if (value !== undefined) merged[key] = value;
      }
      questions.set(id, merged as unknown as Question);
    } else if (m && !t) {
      // They deleted it (or never had it because I added it).
      if (!b) questions.set(id, m);
      else if (!same(b, m)) {
        conflicts.push({
          code: `q:${id}:delete`,
          label: `${number(id)} · bạn sửa, người kia xóa`,
          mine: 'Giữ câu',
          theirs: 'Xóa câu',
        });
        if (choices[`q:${id}:delete`] !== 'theirs') questions.set(id, m);
      }
    } else if (t && !m) {
      // I deleted it (or they added it).
      if (!b) questions.set(id, t);
      else if (!same(b, t)) {
        conflicts.push({
          code: `q:${id}:delete`,
          label: `${number(id)} · bạn xóa, người kia sửa`,
          mine: 'Xóa câu',
          theirs: 'Giữ bản của người kia',
        });
        if (choices[`q:${id}:delete`] === 'theirs') questions.set(id, t);
      }
    }
  }

  // ---- passages (shared texts), whole by whole
  const passageMap = (exam: Exam) => new Map((exam.passages ?? []).map((passage) => [passage.id, passage]));
  const [baseP, mineP, theirsP] = [passageMap(base), passageMap(mine), passageMap(theirs)];
  const passages: Passage[] = [];
  for (const id of new Set([...theirsP.keys(), ...mineP.keys()])) {
    const [b, m, t] = [baseP.get(id), mineP.get(id), theirsP.get(id)];
    let value: Passage | undefined;
    if (m && t) value = pick(`p:${id}`, `Ngữ liệu "${m.title || t.title || id}"`, b, m, t);
    else if (m) value = b && same(b, m) ? undefined : m;
    else value = b && same(b, t) ? undefined : t;
    if (value) passages.push(value);
  }

  // ---- the exam's own information, key by key
  const metadata: Record<string, unknown> = {};
  const metaKeys = new Set([
    ...Object.keys(base.metadata),
    ...Object.keys(mine.metadata),
    ...Object.keys(theirs.metadata),
  ]);
  for (const key of metaKeys) {
    const value = pick<unknown>(
      `meta:${key}`,
      `Thông tin đề · ${META_NAMES[key] ?? key}`,
      (base.metadata as unknown as Record<string, unknown>)[key],
      (mine.metadata as unknown as Record<string, unknown>)[key],
      (theirs.metadata as unknown as Record<string, unknown>)[key],
    );
    if (value !== undefined) metadata[key] = value;
  }

  // ---- order and structure: whoever changed it wins; two different changes need a choice
  const chosen = pick<OutlineNode[] | undefined>(
    'outline',
    'Thứ tự và cấu trúc đề',
    base.outline,
    mine.outline,
    theirs.outline,
  );
  const source = chosen === mine.outline ? mine : theirs;
  const outline = chosen ? structuredClone(chosen) : undefined;
  const merged: Exam = {
    ...theirs,
    metadata: metadata as unknown as Exam['metadata'],
    passages,
    questions: [...questions.values()],
  };
  if (outline) {
    const present = new Set(questions.keys());
    const prune = (nodes: OutlineNode[]): OutlineNode[] =>
      nodes.flatMap((node) => {
        if (node.kind === 'question') return present.has(node.questionId!) ? [node] : [];
        return [{ ...node, children: prune(node.children ?? []) }];
      });
    const kept = prune(outline);
    const placed = new Set(outlineNodes(kept).flatMap((node) => (node.questionId ? [node.questionId] : [])));
    // A question that only exists in the other version goes after the one that was before it there.
    const other = source === mine ? theirs : mine;
    for (const id of questions.keys()) {
      if (placed.has(id)) continue;
      const node = outlineNodes(other.outline ?? []).find((item) => item.questionId === id);
      const add: OutlineNode = node
        ? { ...node }
        : { id: 'question:' + id, kind: 'question', questionId: id };
      let inserted = false;
      const insertAfter = (
        nodes: OutlineNode[],
        previousId: string | undefined,
        parentId: string | null | undefined,
      ): boolean => {
        for (const [index, item] of nodes.entries()) {
          if (previousId && item.id === previousId) {
            nodes.splice(index + 1, 0, add);
            return true;
          }
          if (item.children && insertAfter(item.children, previousId, parentId)) return true;
        }
        return false;
      };
      const location = (() => {
        const find = (
          nodes: OutlineNode[],
          parent: string | null,
        ): { prev?: string; parent: string | null } | undefined => {
          for (const [index, item] of nodes.entries()) {
            if (item.id === node?.id) return { prev: nodes[index - 1]?.id, parent };
            const inner = item.children && find(item.children, item.id);
            if (inner) return inner;
          }
        };
        return find(other.outline ?? [], null);
      })();
      if (location?.prev) inserted = insertAfter(kept, location.prev, location.parent);
      if (!inserted) {
        const last = kept.at(-1);
        if (last?.kind === 'part') (last.children ??= []).push(add);
        else kept.push(add);
      }
      placed.add(id);
    }
    try {
      return { exam: syncOutline(merged, kept), conflicts };
    } catch {
      /* fall through to the plain order */
    }
  }
  return { exam: { ...merged, outline: undefined }, conflicts };
}
