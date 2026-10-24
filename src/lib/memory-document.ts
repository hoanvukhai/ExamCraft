import { createHash } from 'node:crypto';
import { z } from 'zod';

export const memoryEntrySchema = z.object({
  subject: z.string().min(1).max(100).default('all'),
  category: z.string().min(1).max(100),
  title: z.string().trim().min(1).max(500),
  insight: z.string().trim().min(1).max(12000),
  confidence: z.number().min(0).max(1).default(0),
  sampleQuestion: z.unknown().optional(),
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
