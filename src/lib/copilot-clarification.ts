import { z } from 'zod';
export const clarificationSchema = z
  .object({
    questionId: z.string().min(1).max(100),
    message: z.string().min(1).max(4000),
    baseStamp: z.string().max(1000000).optional(),
    quickOptions: z.array(z.string().max(300)).max(6),
    options: z
      .array(
        z
          .object({
            id: z.string().min(1).max(150),
            label: z.string().max(300),
            value: z.string().max(300),
          })
          .strict(),
      )
      .max(6)
      .optional(),
  })
  .strict();
export type CopilotClarification = z.infer<typeof clarificationSchema>;
/** Adapter for existing quickOptions records. IDs derive from the card, not its display text. */
export function clarifyCard(
  questionId: string,
  message: string,
  quickOptions: string[],
  baseStamp?: string,
): CopilotClarification {
  return clarificationSchema.parse({
    questionId,
    message,
    quickOptions,
    options: quickOptions.map((label, index) => ({
      id: questionId + ':option:' + index,
      label,
      value: label,
    })),
    ...(baseStamp ? { baseStamp } : {}),
  });
}
export function clarificationReply(card: CopilotClarification, value: string, optionId?: string) {
  if (optionId) {
    const option = (card.options ??
      clarifyCard(card.questionId, card.message, card.quickOptions).options)!.find(
      (option) => option.id === optionId,
    );
    if (!option || option.value !== value) throw Error('STALE_CLARIFICATION');
  }
  return { questionId: card.questionId, value, ...(optionId ? { optionId } : {}) };
}
export const clarificationReplySchema = z
  .object({
    questionId: z.string().min(1).max(100),
    value: z.string().min(1).max(12000),
    optionId: z.string().min(1).max(150).optional(),
  })
  .strict();
