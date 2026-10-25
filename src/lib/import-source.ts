import type { Question } from '@/types/exam';

export function importSourceLabel(kind: string, index: number, fileName?: unknown) {
  const name = typeof fileName === 'string' ? fileName.replace(/[\r\n\u0000-\u001f]/g, ' ').trim().slice(0, 250) : '';
  return `${kind}${name ? ` · ${name}` : ''} · câu ${index + 1}`;
}

export function withImportSources(questions: Question[], kind: string, fileName?: string): Question[] {
  return questions.map((q, index) => ({ ...q, source: q.source?.trim() || importSourceLabel(kind, index, fileName), importedFromFile: true }));
}
