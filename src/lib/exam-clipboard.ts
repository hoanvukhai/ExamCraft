import type { Exam, OutlineNode, Passage, Question } from '@/types/exam';
import { insertOutlineNodes, outlineNodes, type InsertPoint } from './exam-outline';
import { displayOutline, locateNode } from './canvas-objects';
import { importedPartPoint } from './editor-parts';

/** What "Sao chép" keeps: whole subtrees of the outline with the questions and shared passages they use. */
export type ClipboardPayload = {
  formatVersion: 1;
  nodes: OutlineNode[];
  questions: Question[];
  passages: Passage[];
};

export const CLIPBOARD_KEY = (userId: string) => `examcraft_clipboard:${userId}`;

/** Copy parts, shared passages or questions (by outline node id). A node inside a chosen node is not copied twice. */
export function copyNodes(exam: Exam, nodeIds: string[]): ClipboardPayload | null {
  const outline = displayOutline(exam);
  const found = nodeIds.flatMap((id) => {
    const node = locateNode(outline, id)?.node;
    return node ? [node] : [];
  });
  const chosen = found.filter(
    (node) =>
      !found.some((other) => other !== node && outlineNodes([other]).some((inner) => inner.id === node.id)),
  );
  const nodes = chosen.map((node) => structuredClone(node));
  if (!nodes.length) return null;
  const questionIds = new Set(
    outlineNodes(nodes).flatMap((node) => (node.questionId ? [node.questionId] : [])),
  );
  const questions = exam.questions
    .filter((question) => questionIds.has(question.id))
    .map((question) => structuredClone(question));
  const passageIds = new Set([
    ...outlineNodes(nodes).flatMap((node) => (node.passageId ? [node.passageId] : [])),
    ...questions.flatMap((question) => (question.passageId ? [question.passageId] : [])),
  ]);
  const passages = (exam.passages ?? [])
    .filter((passage) => passageIds.has(passage.id))
    .map((passage) => structuredClone(passage));
  return { formatVersion: 1, nodes, questions, passages };
}

export function parseClipboard(raw: string | null | undefined): ClipboardPayload | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as ClipboardPayload;
    if (value?.formatVersion !== 1 || !Array.isArray(value.nodes) || !Array.isArray(value.questions))
      return null;
    return { ...value, passages: Array.isArray(value.passages) ? value.passages : [] };
  } catch {
    return null;
  }
}

/** Paste with new ids everywhere. A passage that is already in this exam, unchanged, is shared instead of copied. */
export function pasteClipboard(
  exam: Exam,
  payload: ClipboardPayload,
  point: InsertPoint,
  newId: () => string,
): Exam {
  const passages = [...(exam.passages ?? [])];
  const passageMap = new Map<string, string>();
  for (const passage of payload.passages) {
    const same = passages.find(
      (item) => item.id === passage.id && JSON.stringify(item) === JSON.stringify(passage),
    );
    if (same) passageMap.set(passage.id, same.id);
    else {
      const id = passages.some((item) => item.id === passage.id) ? newId() : passage.id;
      passages.push({ ...structuredClone(passage), id });
      passageMap.set(passage.id, id);
    }
  }
  const questions: Question[] = [];
  const copyNode = (node: OutlineNode): OutlineNode => {
    if (node.kind === 'question') {
      const source = payload.questions.find((question) => question.id === node.questionId);
      if (!source) return { id: newId(), kind: 'question', questionId: node.questionId };
      const id = 'q_' + newId();
      const question: Question = {
        ...structuredClone(source),
        id,
        version: 1,
        status: 'draft',
        verifiedBy: 'none',
      };
      delete question.locked;
      delete question.sectionId;
      if (question.passageId) question.passageId = passageMap.get(question.passageId) ?? question.passageId;
      questions.push(question);
      return {
        id: 'question:' + id,
        kind: 'question',
        questionId: id,
        ...(node.startOnNewPage ? { startOnNewPage: true } : {}),
      };
    }
    return {
      ...structuredClone({ ...node, children: undefined, sectionId: undefined }),
      id: newId(),
      ...(node.kind === 'part' ? { sectionId: null } : {}),
      ...(node.passageId ? { passageId: passageMap.get(node.passageId) ?? node.passageId } : {}),
      children: (node.children ?? []).map(copyNode),
    };
  };
  const nodes = payload.nodes.map(copyNode);
  const target = nodes.some((node) => node.kind === 'part')
    ? importedPartPoint({ ...exam, passages }, point)
    : point;
  return insertOutlineNodes({ ...exam, passages }, target, nodes, questions);
}

/** Plain text of what was copied, for pasting into Word or a chat. */
export function clipboardText(payload: ClipboardPayload): string {
  return payload.questions.map((question, index) => `Câu ${index + 1}. ${question.content}`).join('\n\n');
}
