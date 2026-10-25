import { createHash } from 'node:crypto';
import { z } from 'zod';

export const memoryEntrySchema = z.object({
  subject: z.string().min(1).max(100).default('all'),
  category: z.string().min(1).max(100),
  title: z.string().trim().min(1).max(500),
  insight: z.string().trim().min(1).max(12000),
  confidence: z.number().min(0).max(1).default(0),
  sampleQuestion: z.unknown().optional(),
  evidence: z.string().max(4000).nullish(),
  uncertainty: z.string().max(4000).nullish(),
  sourceRef: z.unknown().optional(),
  sourceAction: z.string().max(200).optional(),
  isActive: z.boolean().optional(),
});
export const memoryArchiveSchema = z.object({
  format: z.literal('examcraft-private-memory'), version: z.literal(1),
  memories: z.array(memoryEntrySchema).max(2000),
});
export type MemoryEntry = z.infer<typeof memoryEntrySchema>;

export function memoryImportId(ownerId: string, entry: MemoryEntry) {
  // Exported row IDs never grant access to another owner's row.
  return `mem_import_${createHash('sha256').update(JSON.stringify([ownerId, entry.subject, entry.category, entry.title, entry.insight])).digest('hex').slice(0, 40)}`;
}

export function parseMemoryArchive(input: unknown) {
  const result = memoryArchiveSchema.parse(input);
  if (new TextEncoder().encode(JSON.stringify(result)).length > 5 * 1024 * 1024) throw new Error('Kho ghi chú vượt 5 MB; hãy chia thành các phần nhỏ.');
  return result;
}

export type MemorySourceRef = { kind: 'question' | 'exam' | 'scan' | 'manual'; examId?: string; examTitle?: string; examVersion?: number; questionIds?: string[]; analyzedAt?: string };
const refLine = (ref: unknown) => {
  if (!ref || typeof ref !== 'object') return 'Nguồn: không ghi';
  const r = ref as MemorySourceRef;
  const kinds = { question: 'một câu hỏi', exam: 'một đề', scan: 'các câu gần đây trong kho riêng', manual: 'ghi tay' } as const;
  const parts: string[] = [kinds[r.kind] ?? 'không rõ'];
  if (r.examTitle || r.examId) parts.push(`đề "${r.examTitle ?? r.examId}"${r.examVersion ? ` phiên bản ${r.examVersion}` : ''}${r.examId ? ` (mã ${r.examId})` : ''}`);
  if (r.questionIds?.length) parts.push(`câu: ${r.questionIds.join(', ')}`);
  if (r.analyzedAt) parts.push(`phân tích lúc ${r.analyzedAt}`);
  return 'Nguồn: ' + parts.join('; ');
};

/** A readable copy of the notes that keeps source, evidence and doubts next to each claim. */
export function memoriesToMarkdown(memories: { title: string; insight: string; subject: string; category: string; confidence: number; sourceAction?: string | null; isActive?: boolean; evidence?: string | null; uncertainty?: string | null; sourceRef?: unknown }[]) {
  const lines = ['# Ghi chú riêng của tôi', '', 'Các ghi chú do AI đề xuất chỉ là gợi ý chưa được giáo viên xác nhận chuyên môn.', ''];
  for (const m of memories) {
    lines.push(`## ${m.title}`, '', m.insight, '',
      `- Môn: ${m.subject}; nhóm: ${m.category}; ${m.isActive ? 'đang bật' : 'đang tắt'}`,
      `- Cách có ghi chú: ${m.sourceAction ?? 'không ghi'}${m.sourceAction?.startsWith('AI') ? `; độ tin cậy AI tự báo: ${m.confidence} (không phải xác nhận)` : ''}`,
      `- ${refLine(m.sourceRef)}`,
      `- Bằng chứng: ${m.evidence?.trim() ? m.evidence.trim().replace(/\r?\n/g, ' ') : 'chưa ghi'}`,
      `- Điều chưa chắc: ${m.uncertainty?.trim() ? m.uncertainty.trim().replace(/\r?\n/g, ' ') : 'chưa ghi'}`, '');
  }
  if (!memories.length) lines.push('_Chưa có ghi chú._', '');
  return lines.join('\n');
}
