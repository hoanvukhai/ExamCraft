import type { Exam, OutlineNode, Question } from '@/types/exam';
import { outlineEntries, outlineNodes, viewSyncedOutline, type InsertPoint } from './exam-outline';
import { questionPartLabel } from './outline-view';
import { editorInsertionPoint, withEditorParts } from './editor-parts';

/** What a click on the sheet can select. The code is a plain string so it can sit in an attribute and in React state. */
export type CanvasObject =
  | { kind: 'exam' }
  | { kind: 'print'; zone: 'header' | 'student' | 'intro' | 'end' | 'footer'; id?: string }
  | { kind: 'part' | 'group'; id: string }
  | { kind: 'question'; id: string }
  | { kind: 'choice' | 'statement' | 'item' | 'pair' | 'order'; question: string; key: string }
  | { kind: 'figure'; question: string; id: string }
  | { kind: 'insert'; parent: string | null; after: string | null };

export const EXAM_CODE = 'exam';

export function codeOf(object: CanvasObject): string {
  switch (object.kind) {
    case 'exam':
      return EXAM_CODE;
    case 'print':
      return ['print', object.zone, object.id].filter(Boolean).join(':');
    case 'part':
    case 'group':
    case 'question':
      return `${object.kind}:${object.id}`;
    case 'figure':
      return `figure:${object.question}:${object.id}`;
    case 'insert':
      return `insert:${object.parent ?? 'root'}:${object.after ?? 'start'}`;
    default:
      return `${object.kind}:${object.question}:${object.key}`;
  }
}

/** Ids may themselves contain ":" (legacy-question:q1), so the fixed-shape kinds split from the right. */
export function parseCode(code: string | null | undefined): CanvasObject {
  if (!code || code === EXAM_CODE) return { kind: 'exam' };
  const colon = code.indexOf(':');
  const kind = code.slice(0, colon);
  const rest = code.slice(colon + 1);
  if (kind === 'print') {
    const [zone, ...id] = rest.split(':');
    return { kind: 'print', zone: zone as 'header', ...(id.length ? { id: id.join(':') } : {}) };
  }
  if (kind === 'part' || kind === 'group' || kind === 'question') return { kind, id: rest };
  if (kind === 'insert') {
    const split = rest.lastIndexOf(':');
    const parent = rest.slice(0, split);
    const after = rest.slice(split + 1);
    return { kind: 'insert', parent: parent === 'root' ? null : parent, after: after === 'start' ? null : after };
  }
  if (kind === 'figure') {
    const split = rest.lastIndexOf(':');
    return { kind: 'figure', question: rest.slice(0, split), id: rest.slice(split + 1) };
  }
  if (['choice', 'statement', 'item', 'pair', 'order'].includes(kind)) {
    const split = rest.lastIndexOf(':');
    return { kind: kind as 'choice', question: rest.slice(0, split), key: rest.slice(split + 1) };
  }
  return { kind: 'exam' };
}

type Located = { node: OutlineNode; parent: OutlineNode | null; index: number; siblings: OutlineNode[] };

/** The outline as the editor shows it: stored outline, or the one rebuilt from question order, with implicit parts. */
export function displayOutline(exam: Exam): OutlineNode[] {
  return withEditorParts(viewSyncedOutline(exam)).outline ?? [];
}

export function locateNode(outline: OutlineNode[], id: string): Located | undefined {
  const visit = (nodes: OutlineNode[], parent: OutlineNode | null): Located | undefined => {
    for (const [index, node] of nodes.entries()) {
      if (node.id === id) return { node, parent, index, siblings: nodes };
      const found = node.children && visit(node.children, node);
      if (found) return found;
    }
  };
  return visit(outline, null);
}

export function nodeOfQuestion(exam: Exam, questionId: string): Located | undefined {
  const outline = displayOutline(exam);
  const node = outlineNodes(outline).find((item) => item.kind === 'question' && item.questionId === questionId);
  return node && locateNode(outline, node.id);
}

export type ChainStep = { code: string; label: string };

const choiceKeyLabel = (key: string) => key.toUpperCase();

/** "Toàn đề › Phần I › Câu 3 › Phương án B": every step can be clicked to select that level. */
export function selectionChain(exam: Exam, code: string): ChainStep[] {
  const steps: ChainStep[] = [{ code: EXAM_CODE, label: 'Toàn đề' }];
  const object = parseCode(code);
  if (object.kind === 'exam') return steps;
  const view = viewSyncedOutline(exam);
  const entries = new Map(outlineEntries(view).map((entry) => [entry.node.id, entry]));
  const outline = displayOutline(exam);
  const labelOfNode = (node: OutlineNode) => {
    const entry = entries.get(node.id);
    const title = node.title?.trim();
    if (node.kind === 'part') return ['Phần', entry?.label, title && !entry?.label ? title : ''].filter(Boolean).join(' ') || 'Phần';
    const material = exam.passages?.find((passage) => passage.id === node.passageId);
    return `Ngữ liệu${material?.title?.trim() || title ? ' ' + (material?.title?.trim() || title) : ''}`;
  };
  const pushAncestors = (id: string) => {
    const chain: Located[] = [];
    let found = locateNode(outline, id);
    while (found?.parent) {
      const parent = locateNode(outline, found.parent.id);
      if (parent) chain.unshift(parent);
      found = parent;
    }
    for (const item of chain) {
      const kind = item.node.kind === 'part' ? 'part' : 'group';
      // A hidden implicit part has nothing on the sheet to select.
      if (item.node.id.startsWith('editor-part:') && !item.node.title?.trim()) continue;
      steps.push({ code: `${kind}:${item.node.id}`, label: labelOfNode(item.node) });
    }
  };
  const questionStep = (questionId: string) => {
    const located = nodeOfQuestion(exam, questionId);
    const entry = located && entries.get(located.node.id);
    if (located) pushAncestors(located.node.id);
    steps.push({ code: `question:${questionId}`, label: entry?.number ? `Câu ${entry.number}` : 'Câu' });
  };
  switch (object.kind) {
    case 'print':
      steps.push({
        code,
        label: { header: 'Đầu trang', student: 'Dòng thí sinh', intro: 'Lời dặn', end: 'Cuối đề', footer: 'Chân trang' }[object.zone],
      });
      break;
    case 'part':
    case 'group': {
      pushAncestors(object.id);
      const located = locateNode(outline, object.id);
      steps.push({ code, label: located ? labelOfNode(located.node) : object.kind === 'part' ? 'Phần' : 'Ngữ liệu' });
      break;
    }
    case 'question':
      questionStep(object.id);
      break;
    case 'insert':
      steps.push({ code, label: 'Điểm chèn' });
      break;
    default: {
      questionStep(object.question);
      const question = exam.questions.find((item) => item.id === object.question);
      if (object.kind === 'figure') {
        const index = question?.figures?.findIndex((figure) => figure.id === object.id) ?? -1;
        steps.push({ code, label: index >= 0 ? `Hình ${index + 1}` : 'Hình' });
      } else if (object.kind === 'choice') steps.push({ code, label: `Phương án ${choiceKeyLabel(object.key)}` });
      else if (object.kind === 'statement') steps.push({ code, label: `Mệnh đề ${object.key}` });
      else if (object.kind === 'item') {
        const index = question?.parts?.findIndex((part) => part.id === object.key) ?? -1;
        steps.push({ code, label: index >= 0 && question ? `Ý ${questionPartLabel(question, index)}` : 'Ý' });
      } else if (object.kind === 'pair') steps.push({ code, label: 'Cặp ghép' });
      else steps.push({ code, label: 'Mục sắp xếp' });
    }
  }
  return steps;
}

/** The question an object belongs to, if any (a choice or a figure still selects "its" question for question-level tools). */
export function questionOf(code: string): string | undefined {
  const object = parseCode(code);
  if (object.kind === 'question') return object.id;
  if ('question' in object) return object.question;
}

/** The step one level up, or the whole exam. Esc walks this chain. */
export function parentCode(exam: Exam, code: string): string {
  const chain = selectionChain(exam, code);
  return chain.length > 1 ? chain[chain.length - 2].code : EXAM_CODE;
}

/** Where "Thêm" puts new content for the current selection. */
export function insertionFor(exam: Exam, code: string): InsertPoint {
  const object = parseCode(code);
  const outline = displayOutline(exam);
  const endOf = (id: string): InsertPoint => {
    const located = locateNode(outline, id);
    return { parentId: id, afterId: located?.node.children?.at(-1)?.id ?? null };
  };
  switch (object.kind) {
    case 'part':
    case 'group':
      return locateNode(outline, object.id) ? endOf(object.id) : editorInsertionPoint(exam);
    case 'insert':
      return { parentId: object.parent, afterId: object.after };
    case 'exam':
    case 'print':
      return editorInsertionPoint(exam);
    default: {
      const questionId = questionOf(code)!;
      const located = nodeOfQuestion(exam, questionId);
      return located
        ? { parentId: located.parent?.id ?? null, afterId: located.node.id }
        : editorInsertionPoint(exam);
    }
  }
}

/** Sibling in the reading order: used by the arrow keys. */
export function neighbourCode(exam: Exam, code: string, step: 1 | -1): string | undefined {
  const object = parseCode(code);
  const view = viewSyncedOutline(exam);
  if (object.kind === 'question' || object.kind === 'part' || object.kind === 'group') {
    const outline = displayOutline(exam);
    const located =
      object.kind === 'question' ? nodeOfQuestion(exam, object.id) : locateNode(outline, object.id);
    const next = located?.siblings[located.index + step];
    if (!next) return undefined;
    return next.kind === 'question' ? `question:${next.questionId}` : `${next.kind}:${next.id}`;
  }
  const question = view.questions.find((item) => item.id === (questionOf(code) ?? ''));
  if (!question) return undefined;
  const keys = rowKeys(question, object.kind);
  const key = ('key' in object ? object.key : 'id' in object ? object.id : '') ?? '';
  const at = keys.indexOf(key);
  const target = keys[at + step];
  return at >= 0 && target !== undefined && 'question' in object
    ? codeOf({ ...object, ...(object.kind === 'figure' ? { id: target } : { key: target }) } as CanvasObject)
    : undefined;
}

/** The ordered keys of one kind of row inside a question. */
export function rowKeys(question: Question, kind: CanvasObject['kind']): string[] {
  switch (kind) {
    case 'choice':
      return (question.choices ?? []).map((choice) => choice.key);
    case 'statement':
      return (question.sub_questions ?? []).map((sub) => sub.key);
    case 'item':
      return (question.parts ?? []).map((part) => part.id);
    case 'pair':
      return (question.matchingPairs ?? []).map((pair) => pair.id);
    case 'order':
      return question.correctOrder ?? [];
    case 'figure':
      return (question.figures ?? []).map((figure) => figure.id);
    default:
      return [];
  }
}

/** The field of the Chi tiết form that belongs to a selection, so a click on "option B" puts the cursor there. */
export function fieldFor(code: string): string | undefined {
  const object = parseCode(code);
  switch (object.kind) {
    case 'question':
      return 'content';
    case 'choice':
      return `choice:${object.key}`;
    case 'statement':
      return `sub:${object.key}`;
    case 'item':
      return `item:${object.key}`;
    default:
      return undefined;
  }
}

/** The "+" points shown after each question: inside its own group or part, and after the group when it was the last one. */
export function insertDotsAfterQuestions(exam: Exam): Map<string, string[]> {
  const outline = displayOutline(exam);
  const dots = new Map<string, string[]>();
  const visit = (nodes: OutlineNode[], parent: OutlineNode | null, grand: OutlineNode | null) => {
    nodes.forEach((node, index) => {
      if (node.kind !== 'question') {
        visit(node.children ?? [], node, parent);
        return;
      }
      const codes = [`insert:${parent?.id ?? 'root'}:${node.id}`];
      if (parent?.kind === 'group' && index === nodes.length - 1)
        codes.push(`insert:${grand?.id ?? 'root'}:${parent.id}`);
      dots.set(node.questionId!, codes);
    });
  };
  visit(outline, null, null);
  return dots;
}

/** False when the selected object is gone (deleted, moved out of the exam, undone). The editor then falls back to the whole exam. */
export function objectExists(exam: Exam, code: string): boolean {
  const object = parseCode(code);
  switch (object.kind) {
    case 'exam':
    case 'print':
      return true;
    case 'part':
    case 'group':
      return !!locateNode(displayOutline(exam), object.id);
    case 'question':
      return exam.questions.some((question) => question.id === object.id);
    case 'insert':
      return (
        (object.parent === null || !!locateNode(displayOutline(exam), object.parent)) &&
        (object.after === null || !!locateNode(displayOutline(exam), object.after))
      );
    default: {
      const question = exam.questions.find((item) => item.id === object.question);
      if (!question) return false;
      if (object.kind === 'figure') return !!question.figures?.some((figure) => figure.id === object.id);
      return rowKeys(question, object.kind).includes(object.key);
    }
  }
}

/** The first thing inside an object, for the → key. */
export function firstChildCode(exam: Exam, code: string): string | undefined {
  const object = parseCode(code);
  if (object.kind === 'part' || object.kind === 'group') {
    const node = locateNode(displayOutline(exam), object.id)?.node.children?.[0];
    return node ? (node.kind === 'question' ? `question:${node.questionId}` : `${node.kind}:${node.id}`) : undefined;
  }
  if (object.kind === 'question') {
    const question = exam.questions.find((item) => item.id === object.id);
    if (!question) return undefined;
    for (const kind of ['choice', 'statement', 'item', 'pair', 'order'] as const) {
      const key = rowKeys(question, kind)[0];
      if (key !== undefined) return codeOf({ kind, question: question.id, key });
    }
  }
}
