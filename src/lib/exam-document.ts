import type { Prisma } from '@prisma/client';
import type { Exam, Question, QuestionType, DifficultyLevel, Subject, Figure } from '@/types/exam';
import { parseKnowledgePackage, resolveKnowledgeScope } from './knowledge-package';
import { parseExamPlan } from './exam-plan';
import { parseHeaderLayout } from './header-layout';
import { templateApplicationSchema } from './exam-template';

const questionTypes = new Set(['multiple_choice', 'true_false_group', 'short_answer', 'essay', 'fill_blank', 'matching', 'ordering']);
const levels = new Set(['nhan_biet', 'thong_hieu', 'van_dung', 'van_dung_cao']);
type RecordValue = Record<string, unknown>;
const record = (value: unknown): RecordValue => value && typeof value === 'object' && !Array.isArray(value) ? value as RecordValue : {};
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

export class DocumentValidationError extends Error {
  constructor(message: string) { super(message); this.name = 'DocumentValidationError'; }
}

function number(value: unknown, label: string, allowZero = true): number {
  const scalar = value && typeof value === 'object' && 'toNumber' in value && typeof value.toNumber === 'function' ? value.toNumber() : value;
  const n = typeof scalar === 'string' && scalar.trim() !== '' ? Number(scalar) : scalar;
  if (typeof n !== 'number' || !Number.isFinite(n) || n < (allowZero ? 0 : 1)) throw new DocumentValidationError(`${label} không hợp lệ`);
  return n;
}

function figures(value: unknown): Figure[] | undefined {
  if (value == null) return undefined;
  const list = Array.isArray(value) ? value : Object.entries(record(value)).map(([key, v]) => ({ ...record(v), id: record(v).id ?? key }));
  if (!Array.isArray(value) && typeof value !== 'object') throw new DocumentValidationError('Không đọc được cấu trúc hình; dữ liệu gốc cần được giữ lại');
  return list.map((v, index) => {
    const f = record(v);
    if (!['variation_table', 'function_plot', 'geometry', 'image'].includes(String(f.kind))) throw new DocumentValidationError(`Hình ${index + 1} chưa được hỗ trợ`);
    return { ...clone(f), id: String(f.id ?? `figure-${index + 1}`) } as unknown as Figure;
  });
}

export function normalizeQuestion(input: unknown, index = 0): Question {
  const q = record(input), payload = record(q.payload), editor = record(payload.editorData);
  const combined = { ...editor, ...q };
  // Presence, rather than truthiness/nullishness, distinguishes a teacher's clear
  // from a legacy document which has never supplied the canonical field.
  const field = (key: string, ...fallbacks: [RecordValue, string][]) => {
    for (const [source, name] of [[q, key], ...fallbacks] as [RecordValue, string][]) {
      if (Object.hasOwn(source, name)) return source[name];
    }
    return undefined;
  };
  const type = String(q.type ?? editor.type ?? '').toLowerCase();
  if (!questionTypes.has(type)) throw new DocumentValidationError(`Câu ${index + 1}: dạng câu không được hỗ trợ`);
  const difficulty = String(q.difficulty ?? editor.difficulty ?? 'thong_hieu').toLowerCase();
  if (!levels.has(difficulty)) throw new DocumentValidationError(`Câu ${index + 1}: nhãn mức cũ không hợp lệ`);
  if (typeof q.content !== 'string') throw new DocumentValidationError(`Câu ${index + 1}: thiếu nội dung`);
  const result = {
    ...clone(editor), ...clone(combined),
    id: String(editor.id ?? q.id ?? `question-${index + 1}`),
    type: type as QuestionType, difficulty: difficulty as DifficultyLevel,
    content: q.content,
    choices: field('choices', [payload, 'choices'], [editor, 'choices']),
    sub_questions: field('sub_questions', [payload, 'sub_questions'], [editor, 'sub_questions']),
    correct_answer: field('correct_answer', [q, 'correctAnswer'], [payload, 'correct'], [payload, 'correct_answer'], [editor, 'correct_answer']),
    accepted_answers: field('accepted_answers', [payload, 'accepted_answers'], [editor, 'accepted_answers']),
    rubric: field('rubric', [payload, 'rubric'], [editor, 'rubric']),
    step_by_step_solution: field('step_by_step_solution', [q, 'solution'], [editor, 'step_by_step_solution']) ?? '',
    // A canonical DB null means removed, not "reuse the older editor payload".
    figures: figures(Object.hasOwn(q, 'figures') ? q.figures : editor.figures),
    subBranch: field('subBranch', [payload, 'subBranch'], [editor, 'subBranch']),
    curriculumTrack: field('curriculumTrack', [payload, 'curriculumTrack'], [editor, 'curriculumTrack']),
    matchingPairs: field('matchingPairs', [payload, 'matchingPairs'], [payload, 'pairs'], [editor, 'matchingPairs']),
    correctOrder: field('correctOrder', [payload, 'correctOrder'], [payload, 'correct_order'], [editor, 'correctOrder']),
  } as unknown as Question;
  const fail = (label: string): never => { throw new DocumentValidationError(`Câu ${index + 1}: ${label}`); };
  for (const field of ['knowledgeIds', 'outcomeIds'] as const) if (result[field] != null && (!Array.isArray(result[field]) || result[field]!.length > 100 || result[field]!.some(id => typeof id !== 'string' || !id.trim() || id.length > 200))) fail('liên kết kiến thức phải gồm tối đa 100 mã hợp lệ');
  if (result.knowledgeReference != null) {
    const ref = record(result.knowledgeReference);
    if (typeof ref.packageId !== 'string' || !ref.packageId.trim() || ref.packageId.length > 200 || typeof ref.packageRevision !== 'string' || !ref.packageRevision.trim() || ref.packageRevision.length > 200) fail('phiên bản liên kết kiến thức chưa hợp lệ');
  }
  const validateList = (value: unknown, label: string) => {
    if (value === undefined || value === null) return [];
    if (!Array.isArray(value) || value.length > 100) return fail(`${label} phải là danh sách tối đa 100 mục`);
    return value.map(record);
  };
  const choices = validateList(result.choices, 'phương án');
  if (choices.some(c => typeof c.key !== 'string' || !c.key.trim() || typeof c.text !== 'string') || new Set(choices.map(c => c.key)).size !== choices.length) fail('nhãn phương án bị trùng hoặc thiếu nội dung');
  const subs = validateList(result.sub_questions, 'ý đúng/sai');
  if (subs.some(s => typeof s.key !== 'string' || !s.key.trim() || typeof s.content !== 'string' || (s.isCorrect !== undefined && typeof s.isCorrect !== 'boolean')) || new Set(subs.map(s => s.key)).size !== subs.length) fail('ý đúng/sai bị trùng nhãn hoặc đáp án không hợp lệ');
  if (result.correct_answer != null && typeof result.correct_answer !== 'string') fail('đáp án phải là văn bản');
  if (result.accepted_answers != null && (!Array.isArray(result.accepted_answers) || result.accepted_answers.some(a => typeof a !== 'string'))) fail('các đáp án được chấp nhận phải là danh sách văn bản');
  const pairs = validateList(result.matchingPairs, 'cặp ghép');
  if (pairs.some(pair => typeof pair.left !== 'string' || typeof pair.right !== 'string')) fail('cặp ghép phải có hai vế văn bản');
  if (result.correctOrder != null && (!Array.isArray(result.correctOrder) || result.correctOrder.length > 100 || result.correctOrder.some(item => typeof item !== 'string'))) fail('thứ tự đúng phải là danh sách văn bản');
  const rubric = validateList(result.rubric, 'tiêu chí');
  if (rubric.some(row => typeof row.criterion !== 'string' || typeof row.maxPoints !== 'number' || !Number.isFinite(row.maxPoints) || row.maxPoints < 0)) fail('tiêu chí hoặc điểm tối đa không hợp lệ');
  const pointValue = Object.hasOwn(q, 'points') ? q.points : editor.points;
  if (pointValue != null) result.points = number(pointValue, `Điểm câu ${index + 1}`);
  else delete result.points;
  if (combined.version != null) result.version = number(combined.version, 'Phiên bản câu', false);
  if (typeof combined.status === 'string') result.status = combined.status.toLowerCase() === 'verified' ? 'verified' : 'draft';
  if (typeof combined.verifiedBy === 'string') {
    const verified = combined.verifiedBy.toLowerCase();
    result.verifiedBy = verified === 'human' ? 'human' : ['dual_solve', 'ai_consensus'].includes(verified) ? 'dual_solve' : ['sympy', 'math_engine'].includes(verified) ? 'sympy' : 'none';
  }
  // Consume known legacy representations once: serializing an undefined clear
  // must not expose an old alias on the next normalization. Preserve unknown
  // source payload as opaque data, without using it as a second editable copy.
  const opaquePayload = { ...record(editor.payload), ...payload };
  for (const key of ['editorData', 'workspaceExamId', 'choices', 'sub_questions', 'correct', 'correct_answer', 'accepted_answers', 'rubric', 'subBranch', 'curriculumTrack', 'matchingPairs', 'pairs', 'correctOrder', 'correct_order']) delete opaquePayload[key];
  const portable = result as unknown as RecordValue;
  if (Object.keys(opaquePayload).length) portable.payload = clone(opaquePayload);
  else delete portable.payload;
  // DB authority and consumed aliases do not belong to the portable document.
  for (const key of ['correctAnswer', 'solution', 'ownerId', 'authorId', 'owner', 'author', 'revisions', 'copies', 'examItems']) delete portable[key];
  return clone(result);
}

export function normalizeExamDocument(input: unknown): Exam {
  const raw = record(input), metadata = record(raw.metadata);
  if (typeof raw.id !== 'string' || !raw.id || raw.id.length > 200) throw new DocumentValidationError('Thiếu mã bản nháp');
  if (typeof metadata.title !== 'string' || !metadata.title.trim()) throw new DocumentValidationError('Tên đề không được để trống');
  if (typeof metadata.subject !== 'string' || !metadata.subject.trim()) throw new DocumentValidationError('Cần chọn môn học; hệ thống không tự thay bằng Toán');
  const grade = number(metadata.grade, 'Lớp', false);
  if (!Number.isInteger(grade) || grade > 12) throw new DocumentValidationError('Lớp phải từ 1 đến 12');
  if (!Array.isArray(raw.questions) || raw.questions.length > 1000) throw new DocumentValidationError('Danh sách câu hỏi không hợp lệ hoặc quá 1.000 câu');
  const questions = raw.questions.map(normalizeQuestion);
  if (new Set(questions.map(q => q.id)).size !== questions.length) throw new DocumentValidationError('Mã câu hỏi bị trùng; cần tạo bản sao với mã riêng');
  const document = { ...clone(raw), metadata: { ...clone(metadata), grade }, questions } as unknown as Exam;
  if (metadata.templateApplication !== undefined) {
    try { document.metadata.templateApplication = templateApplicationSchema.parse(metadata.templateApplication); }
    catch { throw new DocumentValidationError('Bản sao mẫu chưa đúng định dạng; cần giữ nguồn, phiên bản và cấu trúc hợp lệ.'); }
  }
  if (metadata.headerLayout !== undefined) {
    try { document.metadata.headerLayout = parseHeaderLayout(metadata.headerLayout); }
    catch { throw new DocumentValidationError('Bố cục tiêu đề chưa hợp lệ; tối đa 30 dòng có mã riêng và liên kết hợp lệ.'); }
  }
  if (metadata.examPlan !== undefined) {
    try { document.metadata.examPlan = parseExamPlan(metadata.examPlan); }
    catch { throw new DocumentValidationError('Kế hoạch đề chưa đúng định dạng, số câu hoặc điểm. Cần tối đa 100 ô và 1.000 câu; mã ô và tổ hợp không trùng.'); }
  }
  if (metadata.knowledgePackage !== undefined) {
    try {
      const pkg = parseKnowledgePackage(metadata.knowledgePackage, { subject: String(metadata.subject), grade });
      document.metadata.knowledgePackage = pkg;
      if (metadata.knowledgeScope !== undefined) document.metadata.knowledgeScope = resolveKnowledgeScope(pkg, metadata.knowledgeScope).scope;
    } catch { throw new DocumentValidationError('Gói kiến thức hoặc phạm vi chưa hợp lệ với môn, lớp và phiên bản của đề. Hãy kiểm tra lại gói.'); }
  } else if (metadata.knowledgeScope !== undefined) throw new DocumentValidationError('Phạm vi cần gói kiến thức đi kèm.');
  if (raw.sections !== undefined) {
    if (!Array.isArray(raw.sections) || raw.sections.length > 100) throw new DocumentValidationError('Danh sách phần phải là danh sách tối đa 100 phần');
    const ids = new Set<string>();
    for (const entry of raw.sections) {
      const section = record(entry);
      if (typeof section.id !== 'string' || !section.id.trim() || ids.has(section.id)) throw new DocumentValidationError('Mã phần thiếu hoặc bị trùng');
      ids.add(section.id);
      for (const field of ['title', 'name', 'label']) if (section[field] !== undefined && typeof section[field] !== 'string') throw new DocumentValidationError('Tên phần phải là văn bản');
      if (section.pointsPerQuestion !== undefined) number(section.pointsPerQuestion, 'Điểm mỗi câu trong phần');
      if (section.progressiveScoring !== undefined && (!Array.isArray(section.progressiveScoring) || section.progressiveScoring.some(value => typeof value !== 'number' || !Number.isFinite(value) || value < 0))) throw new DocumentValidationError('Bảng điểm của phần phải gồm các số hữu hạn không âm');
    }
  }
  if (metadata.durationMinutes != null) document.metadata.durationMinutes = number(metadata.durationMinutes, 'Thời lượng');
  if (raw.version != null) document.version = number(raw.version, 'Phiên bản đề', false);
  if (raw.passages != null && !Array.isArray(raw.passages)) throw new DocumentValidationError('Ngữ liệu dùng chung không hợp lệ');
  if (document.passages) {
    if (document.passages.some(p => typeof p.id !== 'string' || !p.id || typeof p.content !== 'string') || new Set(document.passages.map(p => p.id)).size !== document.passages.length) throw new DocumentValidationError('Ngữ liệu thiếu mã, trùng mã hoặc thiếu nội dung');
    document.passages = document.passages.map(p => ({ ...p, ...(p.figures != null ? { figures: figures(p.figures) } : {}) }));
  }
  if (BufferByteLength(JSON.stringify(document)) > 15 * 1024 * 1024) throw new DocumentValidationError('Đề vượt 15 MB; hãy giảm dung lượng ảnh trước khi lưu');
  return document;
}

function BufferByteLength(value: string): number { return new TextEncoder().encode(value).length; }

export function fromDatabaseExam(input: unknown): Exam {
  const ex = record(input), metadata = record(ex.metadata);
  const saved = record(metadata.workspaceDocument);
  if (saved.id && Array.isArray(saved.questions)) {
    return normalizeExamDocument({ ...saved, id: ex.id, serverId: ex.id, version: ex.version, createdAt: ex.createdAt, updatedAt: ex.updatedAt,
      metadata: { ...record(saved.metadata), ...Object.fromEntries(Object.entries(metadata).filter(([key]) => key !== 'workspaceDocument')), title: ex.title, subject: ex.subject, grade: ex.grade, durationMinutes: ex.durationMinutes ?? record(saved.metadata).durationMinutes } });
  }
  const items = Array.isArray(ex.items) ? ex.items : [];
  const passages = [...new Map(items.map(i => record(record(i).question).passage).filter(Boolean).map(p => [String(record(p).id), p])).values()];
  return normalizeExamDocument({ id: ex.id, serverId: ex.id, version: ex.version, metadata: { ...metadata, title: ex.title, subject: ex.subject, grade: ex.grade,
    schoolName: metadata.schoolName ?? '', departmentName: metadata.departmentName ?? '', durationMinutes: ex.durationMinutes ?? 0 },
    questions: items.map((item, i) => { const it = record(item); const q = normalizeQuestion(it.question, i); q.sectionId = String(it.sectionId ?? 'workspace'); if (it.pointsOverride != null) q.points = number(it.pointsOverride, 'Điểm ghi đè'); return q; }),
    passages, sections: ex.sections, createdAt: ex.createdAt, updatedAt: ex.updatedAt });
}

export function questionToDatabase(q: Question, context: { ownerId: string; subject: string; grade: number; examId: string; questionId: string }): Prisma.QuestionUncheckedCreateInput {
  const editorData = clone(q);
  return {
    id: context.questionId, ownerId: context.ownerId, authorId: context.ownerId,
    subject: q.subject ?? context.subject, grade: q.grade ?? context.grade,
    type: q.type.toUpperCase() as Prisma.QuestionUncheckedCreateInput['type'],
    difficulty: q.difficulty.toUpperCase() as Prisma.QuestionUncheckedCreateInput['difficulty'],
    content: q.content, figures: q.figures == null ? undefined : clone(q.figures) as unknown as Prisma.InputJsonValue,
    payload: clone({ choices: q.choices, sub_questions: q.sub_questions, correct: q.correct_answer, accepted_answers: q.accepted_answers, rubric: q.rubric, subBranch: q.subBranch, curriculumTrack: q.curriculumTrack, editorData, workspaceExamId: context.examId }) as unknown as Prisma.InputJsonValue,
    solution: q.step_by_step_solution ?? '', points: q.points,
    topics: q.topics ?? [], tags: q.tags ?? [], visibility: 'PRIVATE',
    sourceKind: q.aiGenerated ? 'AI_GENERATED' : 'TEACHER_WRITTEN',
    aiGenerated: q.aiGenerated ?? false, source: q.source, licenseNote: q.licenseNote,
    // Saving a draft never grants human verification.
    status: 'DRAFT', verifiedBy: 'NONE', version: 1,
  };
}

export type { Subject };
