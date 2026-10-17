import { Subject, Question, QuestionType, Exam } from '@/types/exam';

import toanThpt from '@/config/subjects/toan_thpt.json';
import vatLyThpt from '@/config/subjects/vat_ly_thpt.json';
import hoaHocThpt from '@/config/subjects/hoa_hoc_thpt.json';
import sinhHocThpt from '@/config/subjects/sinh_hoc_thpt.json';
import nguVanThpt from '@/config/subjects/ngu_van_thpt.json';
import tiengAnhThpt from '@/config/subjects/tieng_anh_thpt.json';
import lichSuThpt from '@/config/subjects/lich_su_thpt.json';
import diaLyThpt from '@/config/subjects/dia_ly_thpt.json';
import gdktPlThpt from '@/config/subjects/gdkt_pl_thpt.json';
import tinHocThpt from '@/config/subjects/tin_hoc_thpt.json';
import congNgheThpt from '@/config/subjects/cong_nghe_thpt.json';
import khtnThcs from '@/config/subjects/khtn_thcs.json';
import lichSuDiaLyThcs from '@/config/subjects/lich_su_dia_ly_thcs.json';
import tiengVietTh from '@/config/subjects/tieng_viet_th.json';

export interface SubjectSectionConfig {
  id: string;
  name: string;
  instruction?: string;
  type: QuestionType;
  questionCount: number;
  pointsPerQuestion?: number;
  progressiveScoring?: number[]; // Ví dụ [0.0, 0.1, 0.25, 0.5, 1.0] cho Đúng/Sai
  totalPoints: number;
}

export interface SubjectConfig {
  subject: Subject;
  name: string;
  applicableGrades: number[];
  defaultDurationMinutes: number;
  sections: SubjectSectionConfig[];
  totalExamPoints: number;
}

const CONFIG_MAP: Partial<Record<Subject, SubjectConfig>> = {
  toan: toanThpt as SubjectConfig,
  vat_ly: vatLyThpt as SubjectConfig,
  hoa_hoc: hoaHocThpt as SubjectConfig,
  sinh_hoc: sinhHocThpt as SubjectConfig,
  ngu_van: nguVanThpt as SubjectConfig,
  tieng_anh: tiengAnhThpt as SubjectConfig,
  lich_su: lichSuThpt as SubjectConfig,
  dia_ly: diaLyThpt as SubjectConfig,
  gdkt_pl: gdktPlThpt as SubjectConfig,
  tin_hoc: tinHocThpt as SubjectConfig,
  cong_nghe: congNgheThpt as SubjectConfig,
  khtn: khtnThcs as SubjectConfig,
  lich_su_dia_ly: lichSuDiaLyThcs as SubjectConfig,
  tieng_viet: tiengVietTh as SubjectConfig,
  tu_nhien_xa_hoi: tiengVietTh as unknown as SubjectConfig,
  khoa_hoc: khtnThcs as unknown as SubjectConfig,
  tin_hoc_cong_nghe: tinHocThpt as unknown as SubjectConfig,
  dao_duc: lichSuThpt as unknown as SubjectConfig,
  giao_duc_cong_dan: gdktPlThpt as unknown as SubjectConfig,
};

/**
 * Lấy cấu hình đề thi theo môn học và khối lớp
 */
export function getSubjectConfig(subject: Subject, grade: number = 12): SubjectConfig {
  const config = CONFIG_MAP[subject];
  if (config) {
    return config;
  }

  // Fallback mặc định theo chuẩn thi GDPT 2018 Toán
  return toanThpt as SubjectConfig;
}

export interface SubjectInfo {
  key: Subject;
  label: string;
  category?: 'Bắt buộc' | 'Lựa chọn' | 'Tự chọn' | 'Môn học';
  grades: number[];
}

/**
 * Lấy danh sách môn học chính xác theo từng khối lớp chuẩn GDPT 2018
 * (Căn cứ Thông tư 32/2018/TT-BGDĐT và sửa đổi Thông tư 13/2022/TT-BGDĐT)
 */
export function getSubjectsForGrade(grade: number): SubjectInfo[] {
  // Cấp 1: Tiểu học (Lớp 1 - 5)
  if (grade >= 1 && grade <= 2) {
    return [
      { key: 'toan', label: 'Toán', category: 'Bắt buộc', grades: [grade] },
      { key: 'tieng_viet', label: 'Tiếng Việt', category: 'Bắt buộc', grades: [grade] },
      { key: 'tu_nhien_xa_hoi', label: 'Tự nhiên và Xã hội', category: 'Bắt buộc', grades: [grade] },
      { key: 'dao_duc', label: 'Đạo đức', category: 'Bắt buộc', grades: [grade] },
      { key: 'tieng_anh', label: 'Tiếng Anh (Tự chọn)', category: 'Tự chọn', grades: [grade] },
    ];
  }

  if (grade === 3) {
    return [
      { key: 'toan', label: 'Toán', category: 'Bắt buộc', grades: [3] },
      { key: 'tieng_viet', label: 'Tiếng Việt', category: 'Bắt buộc', grades: [3] },
      { key: 'tieng_anh', label: 'Tiếng Anh', category: 'Bắt buộc', grades: [3] },
      { key: 'tu_nhien_xa_hoi', label: 'Tự nhiên và Xã hội', category: 'Bắt buộc', grades: [3] },
      { key: 'tin_hoc_cong_nghe', label: 'Tin học và Công nghệ', category: 'Bắt buộc', grades: [3] },
      { key: 'dao_duc', label: 'Đạo đức', category: 'Bắt buộc', grades: [3] },
    ];
  }

  if (grade >= 4 && grade <= 5) {
    return [
      { key: 'toan', label: 'Toán', category: 'Bắt buộc', grades: [grade] },
      { key: 'tieng_viet', label: 'Tiếng Việt', category: 'Bắt buộc', grades: [grade] },
      { key: 'tieng_anh', label: 'Tiếng Anh', category: 'Bắt buộc', grades: [grade] },
      { key: 'khoa_hoc', label: 'Khoa học', category: 'Bắt buộc', grades: [grade] },
      { key: 'lich_su_dia_ly', label: 'Lịch sử và Địa lí', category: 'Bắt buộc', grades: [grade] },
      { key: 'tin_hoc_cong_nghe', label: 'Tin học và Công nghệ', category: 'Bắt buộc', grades: [grade] },
      { key: 'dao_duc', label: 'Đạo đức', category: 'Bắt buộc', grades: [grade] },
    ];
  }

  // Cấp 2: THCS (Lớp 6 - 9)
  if (grade >= 6 && grade <= 9) {
    return [
      { key: 'toan', label: 'Toán', category: 'Bắt buộc', grades: [grade] },
      { key: 'ngu_van', label: 'Ngữ văn', category: 'Bắt buộc', grades: [grade] },
      { key: 'tieng_anh', label: 'Tiếng Anh', category: 'Bắt buộc', grades: [grade] },
      { key: 'khtn', label: 'Khoa học tự nhiên (Lý - Hóa - Sinh)', category: 'Bắt buộc', grades: [grade] },
      { key: 'lich_su_dia_ly', label: 'Lịch sử và Địa lí', category: 'Bắt buộc', grades: [grade] },
      { key: 'tin_hoc', label: 'Tin học', category: 'Bắt buộc', grades: [grade] },
      { key: 'cong_nghe', label: 'Công nghệ', category: 'Bắt buộc', grades: [grade] },
      { key: 'giao_duc_cong_dan', label: 'Giáo dục công dân', category: 'Bắt buộc', grades: [grade] },
    ];
  }

  // Cấp 3: THPT (Lớp 10 - 12) - Theo Thông tư 13/2022/TT-BGDĐT
  return [
    // 4 Môn bắt buộc
    { key: 'toan', label: 'Toán', category: 'Bắt buộc', grades: [grade] },
    { key: 'ngu_van', label: 'Ngữ văn', category: 'Bắt buộc', grades: [grade] },
    { key: 'tieng_anh', label: 'Tiếng Anh', category: 'Bắt buộc', grades: [grade] },
    { key: 'lich_su', label: 'Lịch sử (Bắt buộc theo TT 13)', category: 'Bắt buộc', grades: [grade] },
    // Các môn lựa chọn
    { key: 'vat_ly', label: 'Vật lí (KHTN)', category: 'Lựa chọn', grades: [grade] },
    { key: 'hoa_hoc', label: 'Hóa học (KHTN)', category: 'Lựa chọn', grades: [grade] },
    { key: 'sinh_hoc', label: 'Sinh học (KHTN)', category: 'Lựa chọn', grades: [grade] },
    { key: 'dia_ly', label: 'Địa lí (KHXH)', category: 'Lựa chọn', grades: [grade] },
    { key: 'gdkt_pl', label: 'Giáo dục kinh tế & Pháp luật (KHXH)', category: 'Lựa chọn', grades: [grade] },
    { key: 'tin_hoc', label: 'Tin học', category: 'Lựa chọn', grades: [grade] },
    { key: 'cong_nghe', label: 'Công nghệ', category: 'Lựa chọn', grades: [grade] },
  ];
}

/**
 * Danh sách toàn bộ các môn học đang được hệ thống hỗ trợ
 */
export function getAllSupportedSubjects(): SubjectInfo[] {
  return [
    // Toán & Văn & Ngoại ngữ
    { key: 'toan', label: 'Toán học', grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
    { key: 'tieng_viet', label: 'Tiếng Việt', grades: [1, 2, 3, 4, 5] },
    { key: 'ngu_van', label: 'Ngữ văn', grades: [6, 7, 8, 9, 10, 11, 12] },
    { key: 'tieng_anh', label: 'Tiếng Anh', grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
    // Tiểu học
    { key: 'tu_nhien_xa_hoi', label: 'Tự nhiên và Xã hội', grades: [1, 2, 3] },
    { key: 'khoa_hoc', label: 'Khoa học', grades: [4, 5] },
    { key: 'tin_hoc_cong_nghe', label: 'Tin học và Công nghệ', grades: [3, 4, 5] },
    { key: 'dao_duc', label: 'Đạo đức', grades: [1, 2, 3, 4, 5] },
    // Tích hợp THCS & Lớp 4-5
    { key: 'lich_su_dia_ly', label: 'Lịch sử và Địa lí', grades: [4, 5, 6, 7, 8, 9] },
    { key: 'khtn', label: 'Khoa học tự nhiên', grades: [6, 7, 8, 9] },
    { key: 'giao_duc_cong_dan', label: 'Giáo dục công dân', grades: [6, 7, 8, 9] },
    // Tin học & Công nghệ THCS/THPT
    { key: 'tin_hoc', label: 'Tin học', grades: [6, 7, 8, 9, 10, 11, 12] },
    { key: 'cong_nghe', label: 'Công nghệ', grades: [6, 7, 8, 9, 10, 11, 12] },
    // THPT độc lập
    { key: 'lich_su', label: 'Lịch sử', grades: [10, 11, 12] },
    { key: 'dia_ly', label: 'Địa lí', grades: [10, 11, 12] },
    { key: 'gdkt_pl', label: 'Giáo dục kinh tế và Pháp luật', grades: [10, 11, 12] },
    { key: 'vat_ly', label: 'Vật lí', grades: [10, 11, 12] },
    { key: 'hoa_hoc', label: 'Hóa học', grades: [10, 11, 12] },
    { key: 'sinh_hoc', label: 'Sinh học', grades: [10, 11, 12] },
  ];
}

/**
 * Tính điểm cho một câu hỏi dựa trên cấu hình môn học hoặc thuộc tính câu hỏi
 */
export function getQuestionPoints(question: Question, subjectConfig?: SubjectConfig): number {
  if (question.points !== undefined && question.points !== null) {
    return question.points;
  }

  const config = subjectConfig || getSubjectConfig(question.subject || 'toan', question.grade || 12);
  const section = config.sections.find(s => s.type === question.type);

  if (section) {
    if (section.pointsPerQuestion !== undefined) {
      return section.pointsPerQuestion;
    }
    if (section.progressiveScoring && section.progressiveScoring.length > 0) {
      // Điểm tối đa khi đúng cả 4 ý
      return section.progressiveScoring[section.progressiveScoring.length - 1];
    }
  }

  // Fallback an toàn
  switch (question.type) {
    case 'multiple_choice':
      return 0.25;
    case 'true_false_group':
      return 1.0;
    case 'short_answer':
      return 0.5;
    case 'essay':
      return 1.0;
    case 'fill_blank':
      return 0.2;
    default:
      return 0.25;
  }
}
