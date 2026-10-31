import type { Difficulty, PrismaClient, QuestionType } from '@prisma/client';
import { getCatalogSubjects } from './education-catalog';
import { foldText } from './help-guide';

/**
 * Read-only lookups for the assistant. The question is turned into a fixed kind of lookup with a few filters,
 * and each kind is one written query limited to what this teacher may see. The model never writes a query.
 */
export type Lookup = {
  kind: 'stats' | 'find-exams' | 'find-questions';
  subject?: string;
  grade?: number;
  difficulty?: Difficulty;
  type?: QuestionType;
  text?: string;
  starred?: boolean;
};

const LIMIT = 10;
const DIFFICULTY: [string, Difficulty][] = [
  ['van dung cao', 'VAN_DUNG_CAO'],
  ['van dung', 'VAN_DUNG'],
  ['thong hieu', 'THONG_HIEU'],
  ['nhan biet', 'NHAN_BIET'],
];
const TYPE: [string, QuestionType][] = [
  ['trac nghiem', 'MULTIPLE_CHOICE'],
  ['dung sai', 'TRUE_FALSE_GROUP'],
  ['tra loi ngan', 'SHORT_ANSWER'],
  ['dien khuyet', 'FILL_BLANK'],
  ['tu luan', 'ESSAY'],
  ['ghep', 'MATCHING'],
  ['sap xep', 'ORDERING'],
];
const TYPE_LABEL: Record<string, string> = {
  MULTIPLE_CHOICE: 'trắc nghiệm',
  TRUE_FALSE_GROUP: 'đúng/sai',
  SHORT_ANSWER: 'trả lời ngắn',
  FILL_BLANK: 'điền khuyết',
  ESSAY: 'tự luận',
  MATCHING: 'ghép',
  ORDERING: 'sắp xếp',
};
const DIFFICULTY_LABEL: Record<string, string> = {
  NHAN_BIET: 'nhận biết',
  THONG_HIEU: 'thông hiểu',
  VAN_DUNG: 'vận dụng',
  VAN_DUNG_CAO: 'vận dụng cao',
};
const ALIASES: Record<string, string> = {
  toan: 'toan',
  van: 'ngu_van',
  'ngu van': 'ngu_van',
  ly: 'vat_ly',
  'vat ly': 'vat_ly',
  hoa: 'hoa_hoc',
  'hoa hoc': 'hoa_hoc',
  sinh: 'sinh_hoc',
  'sinh hoc': 'sinh_hoc',
  anh: 'tieng_anh',
  'tieng anh': 'tieng_anh',
  su: 'lich_su',
  'lich su': 'lich_su',
  dia: 'dia_ly',
  'dia ly': 'dia_ly',
  tin: 'tin_hoc',
  'tin hoc': 'tin_hoc',
};

const has = (folded: string, phrase: string) => (' ' + folded + ' ').includes(' ' + phrase + ' ');

/** Recognise a lookup in a question, or null when the question is not one. */
export function parseLookup(question: string): Lookup | null {
  const text = foldText(question);
  if (!text) return null;
  const gradeMatch = text.match(/\b(?:lop|khoi)\s*(\d{1,2})\b/);
  const grade = gradeMatch && +gradeMatch[1] >= 1 && +gradeMatch[1] <= 12 ? +gradeMatch[1] : undefined;
  let subject: string | undefined;
  for (const item of getCatalogSubjects()) {
    const label = foldText(item.label.replace(/\(.*\)/, ''));
    if (label && has(text, label)) {
      subject = item.key;
      break;
    }
  }
  if (!subject)
    for (const [alias, key] of Object.entries(ALIASES))
      if (has(text, alias) && (alias.length > 3 || /\bmon\s+/.test(text))) {
        subject = key;
        break;
      }
  const difficulty = DIFFICULTY.find(([phrase]) => has(text, phrase))?.[1];
  const type = TYPE.find(([phrase]) => has(text, phrase))?.[1];
  const counting = /\b(bao nhieu|thong ke|tong so|so luong|dem)\b/.test(text);
  const wantsQuestions = /\bcau hoi\b|\bcau\s+(?:trac nghiem|tu luan|dung sai)\b/.test(text);
  const wantsExams = has(text, 'de');
  const finding =
    /\b(tim|liet ke|danh sach|cho toi xem|hien thi)\b/.test(text) || /\b(cac|nhung) de\b/.test(text);
  const topic = text.match(/\b(?:ve|chu de|noi dung|chua tu|co tu)\s+(.{2,40})$/)?.[1]?.trim();
  const starred = /\b(gan sao|quan trong|yeu thich)\b/.test(text) || undefined;
  if (counting && (wantsQuestions || wantsExams || /\b(kho|thu muc)\b/.test(text)))
    return { kind: 'stats', subject, grade, difficulty, type, starred };
  if (wantsQuestions && (finding || difficulty || type || subject || topic))
    return { kind: 'find-questions', subject, grade, difficulty, type, text: topic };
  if (finding && wantsExams) return { kind: 'find-exams', subject, grade, text: topic, starred };
  return null;
}

type Db = Pick<PrismaClient, 'exam' | 'question' | 'folder'>;
const subjectName = (key: string) =>
  getCatalogSubjects()
    .find((item) => item.key === key)
    ?.label.replace(/\(.*\)/, '')
    .trim() ?? key;
const clip = (value: string, length: number) => {
  const flat = value.replace(/\s+/g, ' ').trim();
  return flat.length > length ? flat.slice(0, length - 1) + '…' : flat;
};
const describe = (lookup: Lookup) =>
  [
    lookup.subject ? 'môn ' + subjectName(lookup.subject) : '',
    lookup.grade ? 'lớp ' + lookup.grade : '',
    lookup.type ? TYPE_LABEL[lookup.type] : '',
    lookup.difficulty ? DIFFICULTY_LABEL[lookup.difficulty] : '',
    lookup.starred ? 'gắn sao' : '',
    lookup.text ? 'về "' + lookup.text + '"' : '',
  ]
    .filter(Boolean)
    .join(', ');

/** Exams this teacher owns or was invited to (not revoked, not deleted). */
const examScope = (userId: string) => ({
  deletedAt: null,
  OR: [{ ownerId: userId }, { collaborators: { some: { userId, revokedAt: null } } }],
});
/** Questions this teacher owns, plus the shared bank that may be reused. */
const questionScope = (userId: string) => ({
  deletedAt: null,
  OR: [
    { ownerId: userId },
    { visibility: 'SHARED' as const, shareable: true, NOT: { tags: { has: '__workspace_only' } } },
  ],
});

export async function runLookup(db: Db, userId: string, lookup: Lookup): Promise<string> {
  const filterText = describe(lookup);
  if (lookup.kind === 'stats') {
    const examWhere = {
      ...examScope(userId),
      ...(lookup.subject ? { subject: lookup.subject } : {}),
      ...(lookup.grade ? { grade: lookup.grade } : {}),
      ...(lookup.starred ? { isStarred: true } : {}),
    };
    const questionWhere = {
      deletedAt: null,
      ownerId: userId,
      ...(lookup.subject ? { subject: lookup.subject } : {}),
      ...(lookup.grade ? { grade: lookup.grade } : {}),
      ...(lookup.difficulty ? { difficulty: lookup.difficulty } : {}),
      ...(lookup.type ? { type: lookup.type } : {}),
    };
    const [exams, questions, folders] = await Promise.all([
      db.exam.count({ where: examWhere }),
      db.question.count({ where: questionWhere }),
      db.folder.count({ where: { ownerId: userId } }),
    ]);
    return [
      `Thống kê${filterText ? ' (' + filterText + ')' : ''}:`,
      `- Đề thi: ${exams}`,
      `- Câu hỏi trong ngân hàng của bạn: ${questions}`,
      ...(filterText ? [] : [`- Thư mục: ${folders}`]),
    ].join('\n');
  }
  if (lookup.kind === 'find-exams') {
    const rows = await db.exam.findMany({
      where: {
        ...examScope(userId),
        ...(lookup.subject ? { subject: lookup.subject } : {}),
        ...(lookup.grade ? { grade: lookup.grade } : {}),
        ...(lookup.starred ? { isStarred: true } : {}),
        ...(lookup.text ? { title: { contains: lookup.text, mode: 'insensitive' as const } } : {}),
      },
      select: {
        id: true,
        title: true,
        subject: true,
        grade: true,
        updatedAt: true,
        folder: { select: { name: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: LIMIT + 1,
    });
    if (!rows.length) return `Không tìm thấy đề nào${filterText ? ' (' + filterText + ')' : ''}.`;
    const shown = rows.slice(0, LIMIT);
    return [
      `Đề tìm thấy${filterText ? ' (' + filterText + ')' : ''}:`,
      ...shown.map(
        (row) =>
          `- ${row.title} — ${subjectName(row.subject)} ${row.grade}${row.folder ? ', thư mục ' + row.folder.name : ''} — mở: /editor/${row.id}`,
      ),
      ...(rows.length > LIMIT ? [`(Chỉ hiện ${LIMIT} đề mới nhất; thêm điều kiện để thu hẹp.)`] : []),
    ].join('\n');
  }
  const rows = await db.question.findMany({
    where: {
      ...questionScope(userId),
      ...(lookup.subject ? { subject: lookup.subject } : {}),
      ...(lookup.grade ? { grade: lookup.grade } : {}),
      ...(lookup.difficulty ? { difficulty: lookup.difficulty } : {}),
      ...(lookup.type ? { type: lookup.type } : {}),
      ...(lookup.text ? { content: { contains: lookup.text, mode: 'insensitive' as const } } : {}),
    },
    select: {
      id: true,
      content: true,
      subject: true,
      grade: true,
      difficulty: true,
      type: true,
      ownerId: true,
    },
    orderBy: { updatedAt: 'desc' },
    take: LIMIT + 1,
  });
  if (!rows.length) return `Không tìm thấy câu hỏi nào${filterText ? ' (' + filterText + ')' : ''}.`;
  const shown = rows.slice(0, LIMIT);
  return [
    `Câu hỏi tìm thấy${filterText ? ' (' + filterText + ')' : ''}:`,
    ...shown.map(
      (row) =>
        `- [${subjectName(row.subject)} ${row.grade}, ${TYPE_LABEL[row.type]}, ${DIFFICULTY_LABEL[row.difficulty]}${row.ownerId === userId ? '' : ', kho chung'}] ${clip(row.content, 110)}`,
    ),
    ...(rows.length > LIMIT ? [`(Chỉ hiện ${LIMIT} câu mới nhất; thêm điều kiện để thu hẹp.)`] : []),
    'Dùng câu nào: trong trang soạn bấm "Thêm" → "Từ ngân hàng".',
  ].join('\n');
}
