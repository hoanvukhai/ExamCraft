import { publicOutline } from './outline-view';
import type { Exam, OutlineNode } from '@/types/exam';
import { legacyOutline, syncOutline, validateOutline } from './exam-outline';

function shuffled<T>(values: T[], random: () => number): T[] {
  const next = [...values];
  for (let index = next.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [next[index], next[other]] = [next[other], next[index]];
  }
  return next;
}
export function shuffleOutline(exam: Exam, random: () => number, shuffleGroups = true): Exam {
  const source = syncOutline(exam);
  const visit = (nodes: OutlineNode[]): OutlineNode[] => {
    const result: OutlineNode[] = [];
    let run: OutlineNode[] = [];
    const flush = () => {
      result.push(...shuffled(run, random));
      run = [];
    };
    for (const node of nodes) {
      if (node.kind === 'part') {
        flush();
        result.push({ ...node, children: visit(node.children!) });
      } else if (node.kind === 'group' && !shuffleGroups) {
        flush();
        result.push(structuredClone(node));
      } else run.push(structuredClone(node));
    }
    flush();
    return result;
  };
  return syncOutline(source, visit(source.outline!));
}
export function outlineSkeleton(exam: Exam): OutlineNode[] {
  let index = 0;
  const prune = (nodes: OutlineNode[]): OutlineNode[] =>
    nodes.flatMap((node) => {
      if (node.kind === 'question') return [];
      const { passageId: _passage, ...container } = node;
      void _passage;
      return [
        {
          ...container,
          id: 'skeleton:' + index++,
          ...(node.kind === 'part' ? { sectionId: node.sectionId ?? node.id } : {}),
          children: prune(node.children ?? []),
        },
      ];
    });
  return publicOutline(prune(exam.outline ?? legacyOutline(exam)));
}
export function copyOutlineSkeleton(
  nodes: OutlineNode[],
  sectionMap: Map<string, string>,
  token: string,
): OutlineNode[] {
  let counter = 0;
  const visit = (list: OutlineNode[]): OutlineNode[] =>
    list.map((node) => {
      if (node.kind === 'question') throw Error('Mẫu dàn ý không được chứa câu hỏi.');
      const section = node.sectionId ?? node.id;
      return {
        ...node,
        id: `template:${token}:${counter++}`,
        ...(node.kind === 'part' ? { sectionId: sectionMap.get(section) ?? section } : {}),
        children: visit(node.children ?? []),
      };
    });
  return validateOutline(visit(nodes), []);
}
