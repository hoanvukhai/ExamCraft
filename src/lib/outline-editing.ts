import type { Exam, OutlineNode } from '@/types/exam';
import { legacyOutline, moveOutlineNode, syncOutline } from './exam-outline';

export function outlineLocation(
  nodes: OutlineNode[],
  id: string,
  parentId: string | null = null,
):
  | {
      parentId: string | null;
      index: number;
      siblings: OutlineNode[];
    }
  | undefined {
  const index = nodes.findIndex((node) => node.id === id);
  if (index >= 0) return { parentId, index, siblings: nodes };
  for (const node of nodes) {
    const found = node.children && outlineLocation(node.children, id, node.id);
    if (found) return found;
  }
}
export function patchOutlineNode(
  exam: Exam,
  id: string,
  patch: Partial<
    Pick<OutlineNode, 'title' | 'instructions' | 'numbering' | 'questionNumbering' | 'passageId' | 'startOnNewPage'>
  >,
): Exam {
  if (exam.access?.canEdit === false) return exam;
  const outline = structuredClone(exam.outline ?? legacyOutline(exam));
  const location = outlineLocation(outline, id);
  if (!location) return exam;
  location.siblings[location.index] = { ...location.siblings[location.index], ...patch };
  return syncOutline(exam, outline);
}
export function nudgeOutlineNode(exam: Exam, id: string, direction: 'up' | 'down'): Exam {
  const outline = exam.outline ?? legacyOutline(exam);
  const location = outlineLocation(outline, id);
  if (!location) return exam;
  const target = location.index + (direction === 'up' ? -1 : 1);
  if (target < 0 || target >= location.siblings.length) return exam;
  const after = direction === 'up' ? location.siblings[target - 1] : location.siblings[target];
  return moveOutlineNode(exam, id, { parentId: location.parentId, afterId: after?.id ?? null });
}

/** Copy a part or group with its questions right after itself. Questions get new ids; a shared passage stays shared. */
export function duplicateOutlineNode(exam: Exam, nodeId: string, newId: () => string): Exam {
  if (exam.access?.canEdit === false) return exam;
  const outline = structuredClone(exam.outline ?? legacyOutline(exam));
  const location = outlineLocation(outline, nodeId);
  if (!location) return exam;
  const questions = [...exam.questions];
  const clone = (node: OutlineNode): OutlineNode => {
    if (node.kind === 'question') {
      const source = exam.questions.find((question) => question.id === node.questionId);
      if (!source) return { ...node };
      const id = 'q_' + newId();
      questions.push({
        ...structuredClone(source),
        id,
        version: 1,
        status: 'draft',
        verifiedBy: 'none',
        locked: undefined,
      });
      return { id: 'question:' + id, kind: 'question', questionId: id };
    }
    return {
      ...structuredClone({ ...node, children: undefined }),
      id: newId(),
      // The copy scores like the original: it keeps pointing at the same score setup.
      ...(node.kind === 'part' ? { sectionId: node.sectionId === null ? null : (node.sectionId ?? node.id) } : {}),
      children: (node.children ?? []).map(clone),
    };
  };
  const copy = clone(location.siblings[location.index]);
  location.siblings.splice(location.index + 1, 0, copy);
  return syncOutline({ ...exam, questions }, outline);
}
