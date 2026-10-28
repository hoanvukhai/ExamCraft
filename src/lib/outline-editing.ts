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
    Pick<OutlineNode, 'title' | 'instructions' | 'numbering' | 'questionNumbering' | 'passageId'>
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
