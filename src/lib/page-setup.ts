import { z } from 'zod';
import type { Exam } from '@/types/exam';

export const FONT_FAMILIES = ['Times New Roman', 'Arial', 'Cambria'] as const;
export const FONT_SIZES = [11, 12, 13, 14] as const;
export const MARGIN_KINDS = { narrow: 'Hẹp', normal: 'Vừa', wide: 'Rộng' } as const;

/** Font, size and margins of the printed exam. Absent = what the exam has always looked like. */
export const pageSetupSchema = z
  .object({
    fontFamily: z.enum(FONT_FAMILIES),
    fontSize: z.union([z.literal(11), z.literal(12), z.literal(13), z.literal(14)]),
    margins: z.enum(['narrow', 'normal', 'wide']),
  })
  .strict();
export type PageSetup = z.infer<typeof pageSetupSchema>;

export const DEFAULT_PAGE_SETUP: PageSetup = { fontFamily: 'Times New Roman', fontSize: 11, margins: 'normal' };

export const parsePageSetup = (value: unknown): PageSetup | undefined => {
  const parsed = pageSetupSchema.safeParse(value);
  return parsed.success ? parsed.data : undefined;
};

export const resolvePageSetup = (exam: Exam): PageSetup | undefined => parsePageSetup(exam.metadata.pageSetup);

/** Page padding on the sheet in millimetres (Vừa is what the sheet has always had). */
export const SHEET_MARGIN_MM = { narrow: 12.7, normal: 18, wide: 25.4 } as const;

/** Page margins for Word in twips; Vừa keeps the existing values. */
export const WORD_MARGINS = {
  narrow: { top: 720, bottom: 720, left: 720, right: 720 },
  normal: { top: 1000, bottom: 1000, left: 1200, right: 1200 },
  wide: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
} as const;

/**
 * Word text sizes are written in many places as half-points. Rather than thread a factor through all of them, the
 * finished file is scaled and its font swapped in one pass. Only runs when the teacher chose a setup.
 */
export function applyPageSetupToWordXml(xml: string, setup: PageSetup): string {
  const factor = setup.fontSize / 11;
  let out = xml;
  if (setup.fontFamily !== 'Times New Roman') out = out.split('Times New Roman').join(setup.fontFamily);
  if (factor !== 1)
    out = out.replace(/<w:(sz|szCs) w:val="([0-9]+)"\/>/g, (_all, tag: string, value: string) => {
      const next = Math.max(2, Math.round(Number(value) * factor));
      return `<w:${tag} w:val="${next}"/>`;
    });
  return out;
}
