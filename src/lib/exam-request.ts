import { z } from 'zod';
export const examTargetSchema = z
  .object({
    kind: z.enum(['regular', 'entrance', 'competition', 'survey', 'practice']),
    targetGrade: z.number().int().min(1).max(12).optional(),
    year: z.number().int().min(2000).max(2200).optional(),
    locality: z.string().max(200).optional(),
    branch: z.string().max(200).optional(),
  })
  .strict();
export type ExamTarget = z.infer<typeof examTargetSchema>;
export const bootstrapFactsSchema = z
  .object({
    subject: z.string().max(100).nullable().optional(),
    grade: z.number().int().min(1).max(12).nullable().optional(),
    durationMinutes: z.number().int().min(1).max(1440).nullable().optional(),
    title: z.string().max(500).optional(),
    academicYear: z.string().max(200).optional(),
    targetExam: examTargetSchema.optional(),
  })
  .strict();
export type BootstrapFacts = z.infer<typeof bootstrapFactsSchema>;
export const PRACTICE_LABEL = 'Đề luyện tập, cấu trúc do AI đề xuất, chưa đối chiếu văn bản';

export const factOriginsSchema = z.partialRecord(
  z.enum(['subject', 'grade', 'durationMinutes', 'title', 'academicYear', 'targetExam']),
  z
    .object({
      status: z.enum(['unknown', 'proposed', 'resolved']),
      source: z.enum(['manual', 'inferred']),
      revision: z.number().int().nonnegative(),
    })
    .strict(),
);
export type FactOrigins = z.infer<typeof factOriginsSchema>;
export function trackFactOrigins(
  previous: BootstrapFacts,
  next: BootstrapFacts,
  origins: FactOrigins,
  source: 'manual' | 'inferred',
): FactOrigins {
  const result = { ...origins };
  for (const key of [
    'subject',
    'grade',
    'durationMinutes',
    'title',
    'academicYear',
    'targetExam',
  ] as const) {
    if (JSON.stringify(previous[key]) === JSON.stringify(next[key])) continue;
    result[key] = {
      source,
      status:
        next[key] === null || next[key] === undefined
          ? 'unknown'
          : source === 'manual'
            ? 'resolved'
            : 'proposed',
      revision: (origins[key]?.revision ?? 0) + 1,
    };
  }
  return result;
}
