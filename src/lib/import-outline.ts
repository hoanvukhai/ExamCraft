import type { Question } from '@/types/exam';

export type ImportedPart = { title: string; instructions?: string; questionIds: string[] };

/** Suggest structure only when every numbered source question maps in order. Never guess a partial import. */
export function suggestImportedParts(text: string, questions: Question[]): ImportedPart[] {
  const headings = [...text.matchAll(/^[\t ]*(PHẦN\s+(?:[IVXLCDM]+|\d+|[A-Z])\b[^\r\n]*)/gim)];
  if (!headings.length) return [];
  const markers = [...text.matchAll(/^[\t ]*(?:Câu|Bài)\s*\d+\s*[.:)]/gim)];
  if (markers.length !== questions.length || markers.some((m) => m.index! < headings[0].index!)) return [];
  let offset = 0;
  return headings.map((heading, index) => {
    const end = headings[index + 1]?.index ?? text.length;
    const count = markers.filter((m) => m.index! > heading.index! && m.index! < end).length;
    const questionIds = questions.slice(offset, offset + count).map((q) => q.id);
    offset += count;
    const firstQuestion = markers.find((m) => m.index! > heading.index! && m.index! < end)?.index ?? end;
    const instructions = text.slice(heading.index! + heading[0].length, firstQuestion).trim();
    return { title: heading[1].trim(), ...(instructions ? { instructions } : {}), questionIds };
  });
}
