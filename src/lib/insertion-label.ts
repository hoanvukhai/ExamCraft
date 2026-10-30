import type { Exam } from '@/types/exam';
import { outlineEntries, type InsertPoint } from './exam-outline';

/** Where new content will go, in words a teacher would use: "sau Câu 5", "cuối Phần I", "cuối đề". */
export function describeInsertion(exam: Exam, point: InsertPoint): string {
  const byId = new Map(outlineEntries(exam).map((entry) => [entry.node.id, entry]));
  const after = point.afterId ? byId.get(point.afterId) : undefined;
  if (after?.question) return `sau Câu ${after.number}`;
  if (after) {
    const name = after.node.title?.trim();
    return `sau ${name || (after.node.kind === 'part' ? 'phần trước' : 'nhóm trước')}`;
  }
  const parent = point.parentId ? byId.get(point.parentId) : undefined;
  if (parent) {
    const name = parent.node.title?.trim();
    return parent.node.kind === 'part' ? `cuối ${name || 'phần này'}` : 'cuối nhóm câu';
  }
  return 'cuối đề';
}
