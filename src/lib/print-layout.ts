import { z } from 'zod';
import type { Exam } from '@/types/exam';
import { freezeExamScoring } from './snapshot-scoring';
import { requiresNumericScore, getCatalogSubjects } from './education-catalog';
import { formatHundredths, pointsToHundredths } from './exam-plan';

/** Fields a teacher can place in a printed line; the page fields are only valid in the footer. */
export const PRINT_FIELDS = [
  'Đơn vị',
  'Trường',
  'Tên đề',
  'Môn',
  'Lớp',
  'Thời gian',
  'Năm học',
  'Học kì',
  'Mã đề',
  'Loại bài',
  'Tổng điểm',
  'Số câu',
] as const;
export const PRINT_PAGE_FIELDS = ['Trang', 'Tổng số trang'] as const;

export const EXAM_KINDS = {
  regular: 'Thường xuyên',
  midterm: 'Giữa kì',
  final: 'Cuối kì',
  survey: 'Khảo sát',
  mock: 'Thi thử',
  gifted: 'Học sinh giỏi',
  other: 'Khác',
} as const;
export type ExamKind = keyof typeof EXAM_KINDS;

export const STUDENT_FIELDS = {
  fullName: 'Họ và tên',
  className: 'Lớp',
  candidateNo: 'SBD',
  room: 'Phòng thi',
  secretNo: 'Số mật mã',
  proctorSign: 'Giám thị ký',
} as const;

const blockSchema = z
  .object({
    id: z.string().trim().min(1).max(100),
    text: z.string().max(500),
    bold: z.boolean().optional(),
    italic: z.boolean().optional(),
    uppercase: z.boolean().optional(),
    align: z.enum(['left', 'center', 'right']).optional(),
    hidden: z.boolean().optional(),
  })
  .strict();
const zone = z.array(blockSchema).max(12);
export const printLayoutSchema = z
  .object({
    formatVersion: z.literal(2),
    studentLine: z
      .object({
        kind: z.enum(['line', 'scoreBox', 'none']),
        fields: z.array(z.enum(Object.keys(STUDENT_FIELDS) as [keyof typeof STUDENT_FIELDS])).max(6),
      })
      .strict(),
    intro: zone,
    end: zone,
    footerLeft: zone,
    footerCenter: zone,
    footerRight: zone,
  })
  .strict()
  .refine((layout) => {
    const ids = Object.values(layout).flatMap((value) =>
      Array.isArray(value) ? value.map((b) => b.id) : [],
    );
    return new Set(ids).size === ids.length;
  }, 'Mã khối không được trùng.');
export type PrintLayout = z.infer<typeof printLayoutSchema>;
export type PrintBlock = z.infer<typeof blockSchema>;
export type PrintZone = 'intro' | 'end' | 'footerLeft' | 'footerCenter' | 'footerRight';
export const PRINT_ZONES: { key: PrintZone; label: string }[] = [
  { key: 'intro', label: 'Lời dặn đầu đề' },
  { key: 'end', label: 'Cuối đề' },
  { key: 'footerLeft', label: 'Chân trang · trái' },
  { key: 'footerCenter', label: 'Chân trang · giữa' },
  { key: 'footerRight', label: 'Chân trang · phải' },
];
export const parsePrintLayout = (input: unknown): PrintLayout => printLayoutSchema.parse(input);

const block = (id: string, text: string, extra: Partial<PrintBlock> = {}): PrintBlock => ({
  id,
  text,
  ...extra,
});
const pageLine = (id: string) => block(id, 'Trang {Trang}/{Tổng số trang}', { align: 'center' });
const END = '---------- HẾT ----------';

export const PRINT_PRESETS: { key: string; name: string; note: string; make: () => PrintLayout }[] = [
  {
    key: 'school',
    name: 'Đề kiểm tra trường',
    note: 'Dòng họ tên, lớp, SBD; HẾT; chân trang có số trang và mã đề.',
    make: () => ({
      formatVersion: 2,
      studentLine: { kind: 'line', fields: ['fullName', 'className', 'candidateNo'] },
      intro: [],
      end: [block('end-1', END, { bold: true, align: 'center' })],
      footerLeft: [],
      footerCenter: [pageLine('foot-page')],
      footerRight: [block('foot-code', 'Mã đề {Mã đề}', { align: 'right' })],
    }),
  },
  {
    key: 'ministry',
    name: 'Đề thi theo mẫu Bộ (THPT)',
    note: 'Họ tên và SBD; HẾT kèm lời dặn; mã đề ở chân trang.',
    make: () => ({
      formatVersion: 2,
      studentLine: { kind: 'line', fields: ['fullName', 'candidateNo'] },
      intro: [],
      end: [
        block('end-1', END, { bold: true, align: 'center' }),
        block('end-2', 'Thí sinh không được sử dụng tài liệu. Cán bộ coi thi không giải thích gì thêm.', {
          italic: true,
          align: 'center',
        }),
      ],
      footerLeft: [block('foot-code', 'Mã đề {Mã đề}', { align: 'left' })],
      footerCenter: [],
      footerRight: [block('foot-page', 'Trang {Trang}/{Tổng số trang}', { align: 'right' })],
    }),
  },
  {
    key: 'primary',
    name: 'Tiểu học có khung điểm',
    note: 'Khung Điểm và Lời nhận xét của giáo viên dưới đầu trang.',
    make: () => ({
      formatVersion: 2,
      studentLine: { kind: 'scoreBox', fields: ['fullName', 'className'] },
      intro: [],
      end: [block('end-1', END, { bold: true, align: 'center' })],
      footerLeft: [],
      footerCenter: [pageLine('foot-page')],
      footerRight: [],
    }),
  },
  {
    key: 'short',
    name: 'Đề ngắn 15 phút',
    note: 'Họ tên và lớp; không có chân trang.',
    make: () => ({
      formatVersion: 2,
      studentLine: { kind: 'line', fields: ['fullName', 'className'] },
      intro: [],
      end: [],
      footerLeft: [],
      footerCenter: [],
      footerRight: [],
    }),
  },
  {
    key: 'worksheet',
    name: 'Phiếu bài tập',
    note: 'Họ tên và lớp; không HẾT, không mã đề.',
    make: () => ({
      formatVersion: 2,
      studentLine: { kind: 'line', fields: ['fullName', 'className'] },
      intro: [],
      end: [],
      footerLeft: [],
      footerCenter: [],
      footerRight: [],
    }),
  },
];

export type Segment = string | { page: 'current' | 'total' };
export type ResolvedBlock = {
  id: string;
  segments: Segment[];
  bold: boolean;
  italic: boolean;
  align: 'left' | 'center' | 'right';
};

export function printFieldValues(exam: Exam): Record<string, string> {
  const { metadata } = exam;
  const subject =
    getCatalogSubjects().find((item) => item.key === metadata.subject)?.label ?? metadata.subject;
  let total = '';
  if (requiresNumericScore(metadata.assessmentMode)) {
    const frozen = freezeExamScoring(exam);
    if (!frozen.missing.length) {
      try {
        total = formatHundredths(
          frozen.questions.reduce((sum, question) => sum + pointsToHundredths(question.points ?? 0), 0),
        );
      } catch {
        total = '';
      }
    }
  }
  const kind = metadata.examKind as string | undefined;
  return {
    'Đơn vị': metadata.schoolName ?? '',
    Trường: metadata.departmentName ?? '',
    'Tên đề': metadata.title ?? '',
    Môn: subject ?? '',
    Lớp: metadata.grade ? String(metadata.grade) : '',
    'Thời gian':
      typeof metadata.durationMinutes === 'number' && metadata.durationMinutes > 0
        ? String(metadata.durationMinutes)
        : '',
    'Năm học': metadata.academicYear ?? '',
    'Học kì': metadata.semester ?? '',
    'Mã đề': metadata.examCode ?? '',
    'Loại bài': kind && kind in EXAM_KINDS ? EXAM_KINDS[kind as ExamKind] : '',
    'Tổng điểm': total,
    'Số câu': String(exam.questions.length),
  };
}

/** Fill the {fields} of one line. A line made only of empty fields is dropped, so an unset school name prints nothing. */
export function fillPrintText(text: string, values: Record<string, string>, pages = false): Segment[] | null {
  const out: Segment[] = [];
  let usedFields = 0;
  let filled = 0;
  let literal = '';
  for (const [index, part] of text.split(/(\{[^{}]+\})/).entries()) {
    const name = index % 2 ? part.slice(1, -1) : null;
    if (name === null) {
      if (part) {
        out.push(part);
        literal += part;
      }
    } else if (pages && name === 'Trang') {
      out.push({ page: 'current' });
      filled++;
      usedFields++;
    } else if (pages && name === 'Tổng số trang') {
      out.push({ page: 'total' });
      filled++;
      usedFields++;
    } else if (name in values) {
      usedFields++;
      if (values[name]) filled++;
      out.push(values[name]);
    } else {
      out.push(part);
      literal += part;
    }
  }
  if (usedFields > 0 && filled === 0 && !/[\p{L}\p{N}]/u.test(literal.replace(/\{[^{}]*\}/g, '')))
    return null;
  if (!out.length) return null;
  return out;
}

export type ResolvedPrint = {
  studentLine: { kind: 'line' | 'scoreBox' | 'none'; labels: string[] };
  intro: ResolvedBlock[];
  end: ResolvedBlock[];
  footer: { left: ResolvedBlock[]; center: ResolvedBlock[]; right: ResolvedBlock[] };
  hasFooter: boolean;
};

/** Null when the exam keeps the original fixed layout; callers then print exactly what they always did. */
export function resolvePrintLayout(exam: Exam): ResolvedPrint | null {
  const raw = exam.metadata.printLayout;
  if (raw === undefined) return null;
  let layout: PrintLayout;
  try {
    layout = parsePrintLayout(raw);
  } catch {
    return null;
  }
  const values = printFieldValues(exam);
  const resolve = (blocks: PrintBlock[], pages: boolean): ResolvedBlock[] =>
    blocks.flatMap((item) => {
      if (item.hidden) return [];
      const segments = fillPrintText(item.text, values, pages);
      if (!segments) return [];
      const mapped = item.uppercase
        ? segments.map((s) => (typeof s === 'string' ? s.toUpperCase() : s))
        : segments;
      return [
        {
          id: item.id,
          segments: mapped,
          bold: !!item.bold,
          italic: !!item.italic,
          align: item.align ?? 'left',
        },
      ];
    });
  const footer = {
    left: resolve(layout.footerLeft, true),
    center: resolve(layout.footerCenter, true),
    right: resolve(layout.footerRight, true),
  };
  return {
    studentLine: {
      kind: layout.studentLine.kind,
      labels: layout.studentLine.fields.map((field) => STUDENT_FIELDS[field]),
    },
    intro: resolve(layout.intro, false),
    end: resolve(layout.end, false),
    footer,
    hasFooter: footer.left.length + footer.center.length + footer.right.length > 0,
  };
}

/** Text of a resolved line for places that cannot show live page numbers (previews): page fields use the given numbers. */
export function segmentsToText(segments: Segment[], page = 1, pages = 1): string {
  return segments
    .map((s) => (typeof s === 'string' ? s : String(s.page === 'current' ? page : pages)))
    .join('');
}
