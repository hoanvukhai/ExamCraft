import type { Exam, OutlineNode } from '@/types/exam';
import {
  findOutlineList,
  legacyOutline,
  outlineNodes,
  validateOutline,
  type InsertPoint,
} from './exam-outline';

/** Reading does not save. Implicit parts preserve question IDs, score links and legacy draft stamps. */
export function withEditorParts(exam: Exam, removedPartId?: string): Exam {
  const source = exam.outline ?? legacyOutline(exam);
  try {
    validateOutline(source, exam.questions);
  } catch {
    return exam;
  }
  if (source.length && source.every((node) => node.kind === 'part'))
    return exam.outline ? exam : { ...exam, outline: source };
  const ids = new Set(outlineNodes(source).map((node) => node.id));
  // A deleted insertion target must not be recreated with the same stable presentation ID.
  if (removedPartId) ids.add(removedPartId);
  let index = 0;
  const createPart = (): OutlineNode => {
    let id: string;
    do {
      id = 'editor-part:' + index++;
    } while (ids.has(id));
    ids.add(id);
    return { id, kind: 'part', title: '', sectionId: null, children: [] };
  };
  const outline: OutlineNode[] = [];
  let implicit: OutlineNode | undefined;
  for (const node of source) {
    if (node.kind === 'part') {
      implicit = undefined;
      outline.push(node);
    } else {
      if (!implicit) {
        implicit = createPart();
        outline.push(implicit);
      }
      implicit.children!.push(node);
    }
  }
  if (!outline.length) outline.push(createPart());
  return { ...exam, outline };
}

export function editorInsertionPoint(exam: Exam, selected?: InsertPoint | null): InsertPoint {
  const outline = withEditorParts(exam).outline ?? [];
  if (selected) {
    const list = findOutlineList(outline, selected.parentId);
    if (list && (selected.afterId == null || list.some((node) => node.id === selected.afterId)))
      return selected;
  }
  const part = outline.at(-1);
  return part?.kind === 'part'
    ? { parentId: part.id, afterId: part.children?.at(-1)?.id ?? null }
    : { parentId: null, afterId: outline.at(-1)?.id ?? null };
}

/** A teacher-confirmed import of parts creates siblings, never parts nested inside another part. */
export function importedPartPoint(exam: Exam, point: InsertPoint): InsertPoint {
  if (!point.parentId) return point;
  const roots = withEditorParts(exam).outline ?? [];
  const parent = roots.find((node) => outlineNodes([node]).some((child) => child.id === point.parentId));
  if (!parent) throw Error('Phần đang chọn đã thay đổi. Bản nhập vẫn được giữ.');
  return { parentId: null, afterId: parent.id };
}
