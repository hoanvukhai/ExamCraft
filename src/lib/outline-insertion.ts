import type { Exam, OutlineNode, Passage, Question } from '@/types/exam';
import { findOutlineList, insertOutlineNodes, legacyOutline, outlineNodes } from './exam-outline';
import type { InsertPoint } from './exam-outline';
import { generationDocumentStamp } from './generation-plan';
import type { ImportedPart } from './import-outline';

export type InsertionTarget = {
  ownerId: string;
  documentId: string;
  baseStamp: string;
  point: InsertPoint;
};

export function captureInsertion(exam: Exam, ownerId: string, point: InsertPoint): InsertionTarget {
  return { ownerId, documentId: exam.id, baseStamp: generationDocumentStamp(exam), point: { ...point } };
}

/** Build an additive transaction. A failed receipt leaves the source/proposal in its dialog. */
export function insertQuestionBatch(
  exam: Exam,
  ownerId: string,
  target: InsertionTarget,
  incoming: Question[],
  materials: Passage[] = [],
  parts: ImportedPart[] = [],
): { exam: Exam; target: InsertionTarget } {
  if (ownerId !== target.ownerId || exam.id !== target.documentId || exam.access?.canEdit === false) {
    throw Error('Tài khoản hoặc quyền sửa đã đổi. Bản xem trước vẫn được giữ.');
  }
  if (generationDocumentStamp(exam) !== target.baseStamp) {
    throw Error('Đề đã thay đổi. Hãy giữ bản xem trước và chọn lại vị trí thêm câu.');
  }
  if (!incoming.length) throw Error('Chưa có câu hỏi để thêm.');
  if (parts.length && target.point.parentId)
    throw Error('Hãy chọn vị trí ngoài các phần để nhập cấu trúc chia phần.');
  if (
    parts.length &&
    JSON.stringify(parts.flatMap((p) => p.questionIds)) !== JSON.stringify(incoming.map((q) => q.id))
  ) {
    throw Error('Cấu trúc phần không khớp danh sách câu đã chọn. Hãy bỏ chọn tạo phần để chỉ nhập câu.');
  }
  const questions = structuredClone(incoming),
    passages = structuredClone(exam.passages ?? []);
  const ids = new Set(exam.questions.map((q) => q.id));
  for (const question of questions) {
    if (ids.has(question.id)) throw Error('Mã câu hỏi bị trùng; chưa thêm câu nào.');
    ids.add(question.id);
  }
  const materialIds = new Set<string>();
  for (const material of materials) {
    if (materialIds.has(material.id)) throw Error('Mã ngữ liệu bị trùng; chưa thêm câu nào.');
    materialIds.add(material.id);
    const existing = passages.find((p) => p.id === material.id);
    const id =
      existing && JSON.stringify(existing) !== JSON.stringify(material) ? crypto.randomUUID() : material.id;
    if (!passages.some((p) => p.id === id)) passages.push({ ...material, id });
    for (const question of questions) if (question.passageId === material.id) question.passageId = id;
  }
  for (const question of questions) {
    if (question.passageId && !passages.some((p) => p.id === question.passageId)) {
      throw Error('Câu hỏi thiếu ngữ liệu đi kèm. Bản xem trước vẫn được giữ.');
    }
  }
  const outline = exam.outline ?? legacyOutline(exam);
  const parent = outlineNodes(outline).find((n) => n.id === target.point.parentId);
  if (target.point.parentId && !parent) throw Error('Vị trí thêm câu không còn tồn tại.');
  let point = { ...target.point };
  const siblings = findOutlineList(outline, point.parentId);
  const previous = siblings?.find((n) => n.id === point.afterId);
  const commonPassage = questions.every((q) => q.passageId === questions[0].passageId)
    ? questions[0].passageId
    : undefined;
  // Consecutive picks from the same bank material extend the existing group.
  const reuse =
    !parts.length &&
    parent?.kind !== 'group' &&
    previous?.kind === 'group' &&
    commonPassage &&
    previous.passageId === commonPassage;
  const group = reuse ? previous : parent?.kind === 'group' ? parent : undefined;
  if (group && questions.some((q) => q.passageId && q.passageId !== group.passageId)) {
    throw Error('Ngữ liệu khác với nhóm đang chọn. Hãy chọn vị trí ngoài nhóm để thêm.');
  }
  if (reuse) point = { parentId: previous.id, afterId: previous.children?.at(-1)?.id ?? null };
  const partNodes = new Map(
    parts.map((p) => [
      p,
      {
        id: crypto.randomUUID(),
        kind: 'part' as const,
        title: p.title,
        instructions: p.instructions,
        children: [] as OutlineNode[],
      },
    ]),
  );
  const nodes: OutlineNode[] = [...partNodes.values()];
  let part: OutlineNode | undefined;
  let currentGroup: OutlineNode | undefined;
  for (const question of questions) {
    const importedPart = parts.find((p) => p.questionIds.includes(question.id));
    if (importedPart && part !== partNodes.get(importedPart)) {
      part = partNodes.get(importedPart);
      currentGroup = undefined;
    }
    const destination = part?.children ?? nodes;
    const leaf: OutlineNode = { id: crypto.randomUUID(), kind: 'question', questionId: question.id };
    if (!group && question.passageId) {
      if (!currentGroup || currentGroup.passageId !== question.passageId) {
        currentGroup = {
          id: crypto.randomUUID(),
          kind: 'group',
          passageId: question.passageId,
          children: [],
        };
        destination.push(currentGroup);
      }
      currentGroup.children!.push(leaf);
    } else {
      currentGroup = undefined;
      destination.push(leaf);
    }
  }
  const next = insertOutlineNodes({ ...exam, passages }, point, nodes, questions);
  next.updatedAt = new Date().toISOString();
  const continuation = reuse ? target.point : { ...point, afterId: nodes.at(-1)!.id };
  return { exam: next, target: captureInsertion(next, ownerId, continuation) };
}
