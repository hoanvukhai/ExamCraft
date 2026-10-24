import coverage from '@/config/education/coverage.json';
import type { Subject } from '@/types/exam';

export type AssessmentMode = 'scored' | 'comment_only' | 'rubric' | 'survey';
export interface CognitiveFramework {
  id: string;
  label: string;
  levels: { id: string; label: string }[];
  grades: number[];
  sourceIds: string[];
  status: 'reference' | 'legacy';
}

export const COGNITIVE_FRAMEWORKS: CognitiveFramework[] = [
  { id: 'primary_tt27_3', label: 'Ba mức thiết kế câu hỏi tiểu học', grades: [1, 2, 3, 4, 5], sourceIds: ['SRC-002'], status: 'reference', levels: [{ id: 'muc_1', label: 'Mức 1' }, { id: 'muc_2', label: 'Mức 2' }, { id: 'muc_3', label: 'Mức 3' }] },
  { id: 'cv7991_3', label: 'Biết – Hiểu – Vận dụng (mẫu tham khảo THPT)', grades: [10, 11, 12], sourceIds: ['SRC-001'], status: 'reference', levels: [{ id: 'biet', label: 'Biết' }, { id: 'hieu', label: 'Hiểu' }, { id: 'van_dung', label: 'Vận dụng' }] },
  { id: 'legacy_4', label: 'Khung bốn mức cũ do giáo viên chọn', grades: Array.from({ length: 12 }, (_, i) => i + 1), sourceIds: [], status: 'legacy', levels: [{ id: 'nhan_biet', label: 'Nhận biết' }, { id: 'thong_hieu', label: 'Thông hiểu' }, { id: 'van_dung', label: 'Vận dụng' }, { id: 'van_dung_cao', label: 'Vận dụng cao' }] },
];

export const getCognitiveFramework = (id?: string) => COGNITIVE_FRAMEWORKS.find(f => f.id === id);
export const isValidGrade = (grade: number) => Number.isInteger(grade) && grade >= 1 && grade <= 12;

export function getCoverage(subject: string, grade: number) {
  return coverage.rows.find(row => row.subject === subject && row.grade === grade);
}

export function getEducationReadiness(subject: string, grade: number) {
  const row = getCoverage(subject, grade);
  const languageSources = subject === 'ngoai_ngu_khac' ? LANGUAGE_PACKAGES.filter(p => p.role !== 'ETHNIC').flatMap(p => [...p.sourceIds]) :
    subject === 'tieng_dan_toc' ? [...LANGUAGE_PACKAGES.find(p => p.role === 'ETHNIC')!.sourceIds] : [];
  const sourceIds = [...new Set(row?.programSourceIds ?? languageSources)];
  return {
    status: 'needs_review' as const,
    label: row ? 'Có đầu mối tài liệu; nội dung và mẫu đánh giá đang chờ duyệt' : 'Chưa có gói lớp–môn đã duyệt; có thể tự soạn bản nháp',
    sourceIds, bookPageIds: row?.bookPageIds ?? [],
    sources: coverage.sources.filter(source => sourceIds.includes(source.id) && Boolean(source.url)),
    missing: ['Yêu cầu cần đạt đã đối chiếu', 'Mục lục đúng ấn bản', 'Bộ đề–đáp án–rubric được giáo viên duyệt'],
  };
}

export interface CatalogSubject {
  key: Subject; label: string; grades: number[];
  category?: 'Bắt buộc' | 'Lựa chọn' | 'Tự chọn' | 'Môn học';
  assessmentMode: AssessmentMode;
}
const commentSubjects = new Set(['dao_duc', 'tu_nhien_xa_hoi', 'am_nhac', 'mi_thuat', 'giao_duc_the_chat', 'hoat_dong_trai_nghiem', 'hoat_dong_trai_nghiem_huong_nghiep', 'giao_duc_dia_phuong']);

export function getCatalogSubjects(grade?: number): CatalogSubject[] {
  if (grade !== undefined && !isValidGrade(grade)) return [];
  const names = new Map<string, CatalogSubject>();
  for (const row of coverage.rows) {
    if (grade !== undefined && row.grade !== grade) continue;
    const current = names.get(row.subject);
    if (current) current.grades.push(row.grade);
    else names.set(row.subject, { key: row.subject as Subject, label: row.label, grades: [row.grade], assessmentMode: commentSubjects.has(row.subject) ? 'comment_only' : 'scored' });
  }
  for (const item of names.values()) {
    if (grade !== undefined) item.category = item.key === 'tieng_anh' && grade <= 2 ? 'Tự chọn' : grade >= 10 && ['vat_ly', 'hoa_hoc', 'sinh_hoc', 'dia_ly', 'gdkt_pl', 'tin_hoc', 'cong_nghe', 'am_nhac', 'mi_thuat'].includes(item.key) ? 'Lựa chọn' : 'Bắt buộc';
  }
  const grades = grade === undefined ? Array.from({ length: 12 }, (_, i) => i + 1) : [grade];
  // These branches require a named language, NN1/NN2 or proficiency/local program package; no guessed grade mapping.
  names.set('ngoai_ngu_khac', { key: 'ngoai_ngu_khac', label: 'Ngoại ngữ khác (chọn ngôn ngữ và chương trình)', grades, category: 'Môn học', assessmentMode: 'scored' });
  names.set('tieng_dan_toc', { key: 'tieng_dan_toc', label: 'Tiếng dân tộc (chọn chương trình/trình độ)', grades, category: 'Tự chọn', assessmentMode: 'scored' });
  return [...names.values()];
}

export const LANGUAGE_PACKAGES = [
  { role: 'NN1', languages: ['Anh', 'Nga', 'Nhật', 'Pháp', 'Trung Quốc', 'Hàn Quốc', 'Đức'], sourceIds: ['TK-0014', 'TK-0017', 'TK-0045', 'TK-0046', 'TK-0047', 'TK-0048'], status: 'needs_review' },
  { role: 'NN2', languages: ['Đức', 'Hàn Quốc', 'Nga', 'Nhật', 'Pháp', 'Trung Quốc'], sourceIds: ['TK-0029', 'TK-0030', 'TK-0031', 'TK-0032', 'TK-0033', 'TK-0034'], status: 'needs_review' },
  { role: 'ETHNIC', languages: ['Bahnar', 'Chăm', 'Êđê', 'Jrai', 'Khmer', 'Mông', 'Mnông', 'Thái', 'Raglai'], sourceIds: ['TK-0036', 'TK-0037', 'TK-0038', 'TK-0039', 'TK-0040', 'TK-0041', 'TK-0042', 'TK-0043', 'TK-0044', 'TK-0060'], status: 'needs_review' },
] as const;

export function requiresNumericScore(mode?: AssessmentMode) { return mode === undefined || mode === 'scored'; }
