import { Subject, Question, QuestionType } from '@/types/exam';
import { AssessmentMode, getCatalogSubjects, getEducationReadiness, isValidGrade } from './education-catalog';

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
  assessmentMode?: AssessmentMode;
  templateStatus?: 'example' | 'manual';
  sourceIds?: string[];
  warnings?: string[];
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
};

/**
 * Lấy cấu hình đề thi theo môn học và khối lớp
 */
export function getSubjectConfig(subject: Subject | string | undefined, grade?: number): SubjectConfig {
  const info = getCatalogSubjects().find(entry => entry.key === subject);
  const readiness = getEducationReadiness(subject ?? '', grade ?? 0);
  const configured = CONFIG_MAP[subject as Subject];
  const warnings = [readiness.label];
  if (!grade || !isValidGrade(grade) || !info?.grades.includes(grade)) warnings.push('Cần chọn đúng môn và lớp; không tự lấy mẫu môn khác');
  if (configured && grade !== undefined && configured.applicableGrades.includes(grade)) {
    return { ...configured, assessmentMode: info?.assessmentMode ?? 'scored', templateStatus: 'example', sourceIds: readiness.sourceIds, warnings };
  }
  return { subject: subject as Subject, name: info?.label ?? 'Môn chưa có gói', applicableGrades: info?.grades ?? [], defaultDurationMinutes: 45,
    sections: [], totalExamPoints: 0, assessmentMode: info?.assessmentMode ?? 'scored', templateStatus: 'manual', sourceIds: readiness.sourceIds, warnings };
}

export interface SubjectInfo {
  key: Subject;
  label: string;
  category?: 'Bắt buộc' | 'Lựa chọn' | 'Tự chọn' | 'Môn học';
  grades: number[];
}

export function getSubjectsForGrade(grade: number): SubjectInfo[] { return getCatalogSubjects(grade); }
export function getAllSupportedSubjects(): SubjectInfo[] { return getCatalogSubjects(); }

export function getQuestionPointConfiguration(question: Question, subjectConfig?: SubjectConfig): { points: number; source: 'question' | 'template' } | null {
  if (question.points !== undefined && question.points !== null) return Number.isFinite(question.points) && question.points >= 0 ? { points: question.points, source: 'question' } : null;
  if (!subjectConfig) return null;
  const config = subjectConfig;
  if (config.assessmentMode && config.assessmentMode !== 'scored') return null;
  const section = config.sections.find(section => section.type === question.type);
  if (section?.pointsPerQuestion !== undefined && Number.isFinite(section.pointsPerQuestion) && section.pointsPerQuestion >= 0) return { points: section.pointsPerQuestion, source: 'template' };
  if (section?.progressiveScoring?.length) {
    const points = section.progressiveScoring[section.progressiveScoring.length - 1];
    if (Number.isFinite(points) && points >= 0) return { points, source: 'template' };
  }
  return null;
}

/** Use only explicit question points or a selected subject/grade template; missing points remain unconfigured. */
export function getQuestionPoints(question: Question, subjectConfig?: SubjectConfig): number {
  return getQuestionPointConfiguration(question, subjectConfig)?.points ?? 0;
}
