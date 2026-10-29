import type { Exam, ExamSection, OutlineNode, Question } from '@/types/exam';

export class OutlineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OutlineError';
  }
}
export type InsertPoint = { parentId: string | null; afterId?: string | null };
const copy = <T>(value: T): T => structuredClone(value);
// A null scoring link is an implicit visual part: keep the legacy question scoring context.
const sectionId = (node: OutlineNode) => (node.sectionId === null ? undefined : (node.sectionId ?? node.id));

/** Legacy runs stay in their original order, even when parts were interleaved. */
export function legacyOutline(exam: Exam): OutlineNode[] {
  const roots: OutlineNode[] = [],
    usedSections = new Set<string>();
  let currentPart: OutlineNode | undefined;
  let currentGroup: OutlineNode | undefined;
  for (const [index, question] of exam.questions.entries()) {
    const section = exam.sections?.find((item) => item.id === question.sectionId);
    const visiblePart =
      question.sectionId && question.sectionId !== 'workspace' ? question.sectionId : undefined;
    if ((currentPart && sectionId(currentPart)) !== visiblePart) {
      currentPart = undefined;
      currentGroup = undefined;
      if (visiblePart) {
        const repeated = usedSections.has(visiblePart);
        usedSections.add(visiblePart);
        currentPart = {
          id: repeated ? `legacy-part:${index}:${visiblePart}` : `legacy-part:${visiblePart}`,
          kind: 'part',
          sectionId: visiblePart,
          title: section?.title ?? section?.label ?? section?.name ?? 'Phần cũ',
          numbering: 'none',
          children: [],
        };
        roots.push(currentPart);
      }
    }
    const siblings = currentPart?.children ?? roots;
    if (question.passageId) {
      if (!currentGroup || currentGroup.passageId !== question.passageId) {
        currentGroup = {
          id: `legacy-group:${index}:${question.passageId}`,
          kind: 'group',
          passageId: question.passageId,
          numbering: 'none',
          children: [],
        };
        siblings.push(currentGroup);
      }
    } else currentGroup = undefined;
    (currentGroup?.children ?? siblings).push({
      id: `legacy-question:${question.id}`,
      kind: 'question',
      questionId: question.id,
    });
  }
  for (const section of exam.sections ?? []) {
    if (section.id === 'workspace' || usedSections.has(section.id)) continue;
    roots.push({
      id: `legacy-part:${section.id}`,
      kind: 'part',
      sectionId: section.id,
      title: section.title ?? section.label ?? section.name,
      numbering: 'none',
      children: [],
    });
  }
  return roots;
}

export function outlineNodes(nodes: OutlineNode[]): OutlineNode[] {
  return nodes.flatMap((node) => [node, ...outlineNodes(node.children ?? [])]);
}

/** Validate the graph before recursive readers see it. Never repair an explicit invalid outline. */
export function validateOutline(input: unknown, questions: Question[]): OutlineNode[] {
  if (!Array.isArray(input)) throw new OutlineError('Dàn ý phải là một danh sách.');
  const ids = new Set<string>(),
    references = new Set<string>();
  const available = new Set(questions.map((question) => question.id));
  let count = 0;
  const visit = (list: unknown[], parent: 'root' | 'part' | 'group'): OutlineNode[] =>
    list.map((value) => {
      if (++count > 2200 || !value || typeof value !== 'object' || Array.isArray(value)) {
        throw new OutlineError('Dàn ý quá lớn hoặc có mục không hợp lệ.');
      }
      const node = value as OutlineNode;
      if (typeof node.id !== 'string' || !node.id.trim() || node.id.length > 400 || ids.has(node.id)) {
        throw new OutlineError('Mã mục trong dàn ý bị thiếu hoặc trùng.');
      }
      ids.add(node.id);
      if (
        !['part', 'group', 'question'].includes(node.kind) ||
        (parent === 'group' && node.kind !== 'question') ||
        (parent === 'part' && node.kind === 'part')
      ) {
        throw new OutlineError('Chỉ được chia Phần → Nhóm → Câu.');
      }
      for (const key of ['title', 'instructions', 'sectionId', 'passageId'] as const) {
        if (key === 'sectionId' && node.kind === 'part' && node[key] === null) continue;
        if (node[key] !== undefined && (typeof node[key] !== 'string' || node[key]!.length > 50000)) {
          throw new OutlineError('Tiêu đề, lời dẫn hoặc liên kết không hợp lệ.');
        }
      }
      if (node.numbering !== undefined && !['none', 'roman', 'letters', 'decimal'].includes(node.numbering)) {
        throw new OutlineError('Kiểu đánh số chưa được hỗ trợ.');
      }
      if (
        node.questionNumbering !== undefined &&
        !['continuous', 'restart'].includes(node.questionNumbering)
      ) {
        throw new OutlineError('Cách đánh số câu chưa được hỗ trợ.');
      }
      if (node.kind === 'question') {
        if (
          typeof node.questionId !== 'string' ||
          !available.has(node.questionId) ||
          references.has(node.questionId)
        ) {
          throw new OutlineError('Mỗi câu phải xuất hiện đúng một lần trong dàn ý.');
        }
        if (node.children !== undefined || node.passageId !== undefined || node.sectionId !== undefined) {
          throw new OutlineError('Câu không được chứa mục con hoặc liên kết của Phần/Nhóm.');
        }
        references.add(node.questionId);
        return copy(node);
      }
      if (
        node.questionId !== undefined ||
        (node.kind !== 'group' && node.passageId !== undefined) ||
        (node.kind !== 'part' && node.sectionId !== undefined) ||
        !Array.isArray(node.children)
      ) {
        throw new OutlineError('Phần và nhóm cần danh sách con đúng cấu trúc.');
      }
      return { ...copy({ ...node, children: [] }), children: visit(node.children, node.kind) };
    });
  const validated = visit(input, 'root');
  if (references.size !== available.size) throw new OutlineError('Dàn ý còn thiếu câu hỏi.');
  return validated;
}

/** Outline is authoritative. Existing section score configuration is retained verbatim. */
export function syncOutline(
  exam: Exam,
  input: unknown = exam.outline === undefined ? legacyOutline(exam) : exam.outline,
): Exam {
  const outline = validateOutline(input, exam.questions);
  const byId = new Map(exam.questions.map((question) => [question.id, question]));
  const sections: ExamSection[] = [],
    questions: Question[] = [];
  const usedSections = new Set<string>();
  const visit = (nodes: OutlineNode[], part?: string, passage?: string) => {
    for (const node of nodes) {
      if (node.kind === 'part') {
        const id = sectionId(node),
          original = exam.sections?.find((section) => section.id === id);
        if (id !== undefined && !usedSections.has(id)) {
          const oldTitle = original?.title ?? original?.label ?? original?.name;
          sections.push(
            original && oldTitle === node.title
              ? copy(original)
              : {
                  ...original,
                  id,
                  name: node.title ?? original?.name ?? '',
                  title: node.title ?? original?.title,
                },
          );
          usedSections.add(id);
        }
        visit(node.children!, id);
      } else if (node.kind === 'group') visit(node.children!, part, node.passageId);
      else {
        const question = { ...byId.get(node.questionId!)! };
        if (part !== undefined) question.sectionId = part;
        else if (question.sectionId !== 'workspace') delete question.sectionId;
        if (passage !== undefined) question.passageId = passage;
        else delete question.passageId;
        questions.push(question);
      }
    }
  };
  visit(outline);
  if (outlineNodes(outline).some((node) => node.kind === 'part' && node.sectionId === null)) {
    for (const section of exam.sections ?? []) {
      if (section.id !== 'workspace' && !usedSections.has(section.id)) sections.push(copy(section));
    }
  }
  // The hidden legacy workspace can carry an explicitly chosen scoring configuration.
  const workspace = exam.sections?.find((section) => section.id === 'workspace');
  if (workspace) sections.push(copy(workspace));
  const sectionMap = new Map(sections.map((section) => [section.id, section]));
  const orderedSections = (exam.sections ?? []).flatMap((section) => {
    const item = sectionMap.get(section.id);
    if (!item) return [];
    sectionMap.delete(section.id);
    return [item];
  });
  orderedSections.push(...sectionMap.values());
  return {
    ...exam,
    outline,
    questions,
    ...(exam.sections !== undefined || orderedSections.length ? { sections: orderedSections } : {}),
  };
}

/** For screens: a stored outline that no longer matches the questions (stale local draft, older client) is rebuilt from the question order instead of crashing the page. Saving paths keep using the strict syncOutline. */
export function viewSyncedOutline(exam: Exam): Exam {
  try {
    return syncOutline(exam);
  } catch {
    return syncOutline({ ...exam, outline: undefined });
  }
}
export function findOutlineList(nodes: OutlineNode[], parentId: string | null): OutlineNode[] | undefined {
  if (parentId === null) return nodes;
  return outlineNodes(nodes).find((node) => node.id === parentId)?.children;
}
export function outlineStamp(exam: Exam): string {
  return JSON.stringify(exam.outline ?? legacyOutline(exam));
}
export function insertOutlineNodes(
  exam: Exam,
  point: InsertPoint,
  added: OutlineNode[],
  questions: Question[] = [],
): Exam {
  if (exam.access?.canEdit === false) return exam;
  const next = copy(exam),
    outline = next.outline ?? legacyOutline(next);
  const list = findOutlineList(outline, point.parentId);
  if (!list) throw new OutlineError('Vị trí thêm đã thay đổi. Nội dung chưa được thêm.');
  const index = point.afterId == null ? -1 : list.findIndex((node) => node.id === point.afterId);
  if (point.afterId != null && index < 0) throw new OutlineError('Điểm chèn không còn tồn tại.');
  list.splice(index + 1, 0, ...copy(added));
  return syncOutline({ ...next, questions: [...next.questions, ...copy(questions)] }, outline);
}
export function removeOutlineNode(exam: Exam, nodeId: string, keepQuestions = true): Exam {
  if (exam.access?.canEdit === false) return exam;
  const next = copy(exam),
    outline = next.outline ?? legacyOutline(next);
  const remove = (nodes: OutlineNode[]): boolean => {
    const index = nodes.findIndex((node) => node.id === nodeId);
    if (index >= 0) {
      const node = nodes[index],
        children = node.children ?? [];
      if (keepQuestions && node.kind !== 'question') {
        // Dissolve a container in place; never orphan questions or silently remove passages.
        nodes.splice(index, 1, ...children);
      } else {
        const questionIds = new Set(
          outlineNodes([node])
            .map((item) => item.questionId)
            .filter(Boolean),
        );
        next.questions = next.questions.filter((question) => !questionIds.has(question.id));
        nodes.splice(index, 1);
      }
      return true;
    }
    return nodes.some((node) => node.children && remove(node.children));
  };
  if (!remove(outline)) return exam;
  return syncOutline(next, outline);
}
export function moveOutlineNode(exam: Exam, nodeId: string, point: InsertPoint): Exam {
  if (exam.access?.canEdit === false) return exam;
  const next = copy(exam),
    outline = next.outline ?? legacyOutline(next);
  let moving: OutlineNode | undefined;
  const detach = (nodes: OutlineNode[]): boolean => {
    const index = nodes.findIndex((node) => node.id === nodeId);
    if (index >= 0) {
      [moving] = nodes.splice(index, 1);
      return true;
    }
    return nodes.some((node) => node.children && detach(node.children));
  };
  if (!detach(outline) || !moving) return exam;
  const list = findOutlineList(outline, point.parentId);
  if (!list) throw new OutlineError('Không thể chuyển mục vào chính nó hoặc mục đã mất.');
  const index = point.afterId == null ? -1 : list.findIndex((node) => node.id === point.afterId);
  if (point.afterId != null && index < 0) throw new OutlineError('Điểm chuyển đã thay đổi.');
  list.splice(index + 1, 0, moving);
  return syncOutline(next, outline);
}

/** Compatibility adapter for existing explicit question-list commands during the staged transition. */
export function reconcileQuestionOutline(previous: Exam, next: Exam): Exam {
  if (!previous.outline || next.outline !== previous.outline) return next;
  const available = new Set(next.questions.map((question) => question.id));
  const seen = new Set<string>();
  const oldIds = new Set(previous.questions.map((question) => question.id));
  const added = next.questions.filter((question) => !oldIds.has(question.id));
  let placed = false;
  const newNodes = () =>
    added.map((question) => ({
      id: 'question:' + question.id,
      kind: 'question' as const,
      questionId: question.id,
    }));
  const prune = (nodes: OutlineNode[]): OutlineNode[] =>
    nodes.flatMap((node) => {
      if (node.kind === 'question') {
        if (!available.has(node.questionId!)) {
          if (!placed && added.length) {
            placed = true;
            return newNodes();
          }
          return [];
        }
        seen.add(node.questionId!);
        return [copy(node)];
      }
      return [{ ...copy(node), children: prune(node.children ?? []) }];
    });
  const outline = prune(previous.outline);
  for (const question of next.questions) {
    if (seen.has(question.id) || (placed && added.some((item) => item.id === question.id))) continue;
    outline.push({ id: `question:${question.id}`, kind: 'question', questionId: question.id });
  }
  return syncOutline(next, outline);
}

const roman = (value: number) => {
  let n = value,
    text = '';
  for (const [size, label] of [
    [1000, 'M'],
    [900, 'CM'],
    [500, 'D'],
    [400, 'CD'],
    [100, 'C'],
    [90, 'XC'],
    [50, 'L'],
    [40, 'XL'],
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ] as const) {
    while (n >= size) {
      text += label;
      n -= size;
    }
  }
  return text;
};
export function outlineNumber(index: number, numbering: OutlineNode['numbering'] = 'none'): string {
  if (numbering === 'none') return '';
  if (numbering === 'roman') return roman(index + 1);
  if (numbering === 'letters') {
    let n = index + 1,
      text = '';
    while (n > 0) {
      n--;
      text = String.fromCharCode(65 + (n % 26)) + text;
      n = Math.floor(n / 26);
    }
    return text;
  }
  return String(index + 1);
}
export type OutlineEntry = {
  node: OutlineNode;
  depth: number;
  label: string;
  question?: Question;
  number?: number;
};
export function outlineEntries(exam: Exam): OutlineEntry[] {
  const nodes = exam.outline ?? legacyOutline(exam),
    byId = new Map(exam.questions.map((question) => [question.id, question]));
  const entries: OutlineEntry[] = [];
  let number = 0;
  const visit = (list: OutlineNode[], depth: number) => {
    const counts = { part: 0, group: 0, question: 0 };
    for (const node of list) {
      const unnamedPart = node.kind === 'part' && !node.title?.trim();
      const label = unnamedPart ? '' : outlineNumber(counts[node.kind]++, node.numbering);
      if (node.kind === 'part' && node.questionNumbering === 'restart') number = 0;
      const question = node.kind === 'question' ? byId.get(node.questionId!) : undefined;
      entries.push({ node, depth, label, question, ...(question ? { number: ++number } : {}) });
      if (node.children) visit(node.children, depth + 1);
    }
  };
  visit(nodes, 0);
  return entries;
}

/** Keep legacy journal stamps valid when the outline only represents the unchanged legacy document. */
/** Node ids differ between a freshly inserted outline and one derived from a legacy exam; compare the shape only. */
function outlineShape(nodes: OutlineNode[]): string {
  const strip = (list: OutlineNode[]): unknown[] =>
    list.flatMap((node) => {
      if (
        node.kind === 'part' &&
        node.sectionId === null &&
        !node.title?.trim() &&
        !node.instructions &&
        (!node.numbering || node.numbering === 'none') &&
        (!node.questionNumbering || node.questionNumbering === 'continuous')
      ) {
        return strip(node.children ?? []);
      }
      const { children, id, ...shape } = node;
      void id;
      return [{ ...shape, ...(children ? { children: strip(children) } : {}) }];
    });
  return JSON.stringify(strip(nodes));
}
export function structuralStampFields(exam: Exam): { outline?: OutlineNode[] } {
  if (!exam.outline || outlineShape(exam.outline) === outlineShape(legacyOutline(exam))) return {};
  const unwrap = (nodes: OutlineNode[]): OutlineNode[] =>
    nodes.flatMap((node) => {
      const children = node.children ? unwrap(node.children) : undefined;
      if (
        node.kind === 'part' &&
        node.sectionId === null &&
        !node.title?.trim() &&
        !node.instructions &&
        (!node.numbering || node.numbering === 'none') &&
        (!node.questionNumbering || node.questionNumbering === 'continuous')
      ) {
        return children ?? [];
      }
      return [{ ...node, ...(children ? { children } : {}) }];
    });
  return { outline: unwrap(exam.outline) };
}
