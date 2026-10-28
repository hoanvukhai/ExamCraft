import type { Exam, OutlineNode, Passage, Question } from '@/types/exam';
import { outlineEntries, outlineNumber, syncOutline } from './exam-outline';

export interface StructureBlock {
  id: string;
  kind: 'part' | 'group';
  title: string;
  instructions?: string;
  passage?: Passage;
  missingPassageId?: string;
}
export function outlineView(exam: Exam) {
  const synchronized = syncOutline(exam);
  const before = new Map<string, StructureBlock[]>();
  const numbers = new Map<string, number>();
  let pending: StructureBlock[] = [];
  for (const entry of outlineEntries(synchronized)) {
    const { node, label } = entry;
    if (entry.question) {
      before.set(entry.question.id, pending);
      numbers.set(entry.question.id, entry.number!);
      pending = [];
    } else {
      pending.push({
        id: node.id,
        kind: node.kind as 'part' | 'group',
        title: [label, node.title || (node.kind === 'part' ? 'Phần chưa đặt tên' : '')]
          .filter(Boolean)
          .join('. '),
        instructions: node.instructions,
        passage:
          node.kind === 'group' ? exam.passages?.find((passage) => passage.id === node.passageId) : undefined,
        missingPassageId:
          node.passageId && !exam.passages?.some((passage) => passage.id === node.passageId)
            ? node.passageId
            : undefined,
      });
    }
  }
  return { questions: synchronized.questions, before, numbers, trailing: pending };
}
export function questionPartLabel(question: Question, index: number, number?: number): string {
  const explicit = question.parts?.[index]?.label;
  if (explicit) return explicit;
  if (question.partsNumbering === 'decimal') return `${number ?? 1}.${index + 1}`;
  return outlineNumber(index, question.partsNumbering === 'roman' ? 'roman' : 'letters').toLowerCase();
}
export function publicOutline(nodes: OutlineNode[]): OutlineNode[] {
  return nodes.map((node) => ({
    id: node.id,
    kind: node.kind,
    ...(node.title !== undefined ? { title: node.title } : {}),
    ...(node.instructions !== undefined ? { instructions: node.instructions } : {}),
    ...(node.numbering !== undefined ? { numbering: node.numbering } : {}),
    ...(node.questionNumbering !== undefined ? { questionNumbering: node.questionNumbering } : {}),
    ...(node.questionId !== undefined ? { questionId: node.questionId } : {}),
    ...(node.sectionId !== undefined ? { sectionId: node.sectionId } : {}),
    ...(node.passageId !== undefined ? { passageId: node.passageId } : {}),
    ...(node.children ? { children: publicOutline(node.children) } : {}),
  }));
}
