import type { Exam, Question } from '@/types/exam';
import { getDefaultPointsForQuestion } from './scoring';
import { getCognitiveFramework, getEducationReadiness, requiresNumericScore } from './education-catalog';
import { Table, TableRow, TableCell, Paragraph, TextRun, WidthType, AlignmentType, BorderStyle, ShadingType } from 'docx';

type Counts = { part1: number; part2: number; part3: number; part4: number };
const emptyCounts = (): Counts => ({ part1: 0, part2: 0, part3: 0, part4: 0 });
const sumCounts = (counts: Counts) => Object.values(counts).reduce((sum, count) => sum + count, 0);
export interface MatrixTopicRow {
  index: number; topicName: string; nbCount: Counts; thCount: Counts; vdCount: Counts; vdcCount: Counts;
  cognitiveCounts: Record<string, Counts>; unmappedCount: number;
  totalQuestions: number; totalPoints: number; percentage: number;
}
export interface ExamMatrixData {
  rows: MatrixTopicRow[]; totalNbPoints: number; totalThPoints: number; totalVdPoints: number; totalVdcPoints: number;
  totalExamPoints: number; totalPart1: number; totalPart2: number; totalPart3: number; totalPart4: number; totalQuestions: number;
  cognitiveFrameworkId: string | null; cognitiveLabels: { id: string; label: string }[];
  cognitiveTotals: { id: string; label: string; count: number; points: number }[];
  unmappedCognitiveCount: number; warnings: string[]; assessmentMode: string;
  scoreState: 'configured' | 'unconfigured' | 'not_scored';
}
export interface SpecRow {
  index: number; topicName: string; subTopic: string; requirement: string;
  nbQuestions: number[]; thQuestions: number[]; vdQuestions: number[]; vdcQuestions: number[];
  cognitiveQuestions: Record<string, number[]>; unmappedQuestions: number[];
}
function topic(q: Question) { return q.topics?.find(t => t.trim())?.trim() || q.tags?.find(t => t.trim())?.replace(/_/g, ' ') || 'Chưa phân loại chủ đề'; }
const part = (q: Question): keyof Counts => q.type === 'multiple_choice' ? 'part1' : q.type === 'true_false_group' ? 'part2' : q.type === 'short_answer' ? 'part3' : 'part4';
const round = (n: number) => Math.round(n * 100) / 100;
function frameworkFor(exam: Exam) {
  const framework = getCognitiveFramework(exam.metadata.cognitiveFrameworkId);
  return framework?.grades.includes(exam.metadata.grade) ? framework : undefined;
}

/** Descriptive matrix of the actual document; legacy difficulty is never treated as an approved cognitive mapping. */
export function computeExamMatrix(exam: Exam): ExamMatrixData {
  const framework = frameworkFor(exam);
  const labels = framework?.levels ?? [];
  const grouped = new Map<string, Question[]>();
  for (const q of exam.questions) { const name = topic(q); grouped.set(name, [...(grouped.get(name) ?? []), q]); }
  const cognitiveTotals = labels.map(level => ({ ...level, count: 0, points: 0 }));
  const totalExamPoints = round(exam.questions.reduce((sum, q) => sum + getDefaultPointsForQuestion(q, exam), 0));
  let unmappedCognitiveCount = 0;
  const rows: MatrixTopicRow[] = [...grouped].map(([topicName, questions], i) => {
    const cognitiveCounts = Object.fromEntries(labels.map(level => [level.id, emptyCounts()]));
    let unmappedCount = 0;
    for (const q of questions) {
      const level = cognitiveTotals.find(level => level.id === q.cognitiveLevel);
      if (!level) { unmappedCount++; unmappedCognitiveCount++; continue; }
      cognitiveCounts[level.id][part(q)]++;
      level.count++; level.points += getDefaultPointsForQuestion(q, exam);
    }
    const totalPoints = round(questions.reduce((sum, q) => sum + getDefaultPointsForQuestion(q, exam), 0));
    return { index: i + 1, topicName, cognitiveCounts, unmappedCount,
      nbCount: cognitiveCounts.nhan_biet ?? cognitiveCounts.biet ?? emptyCounts(),
      thCount: cognitiveCounts.thong_hieu ?? cognitiveCounts.hieu ?? emptyCounts(),
      vdCount: cognitiveCounts.van_dung ?? emptyCounts(), vdcCount: cognitiveCounts.van_dung_cao ?? emptyCounts(),
      totalQuestions: questions.length, totalPoints, percentage: totalExamPoints > 0 ? round(totalPoints / totalExamPoints * 100) : 0,
    };
  });
  const warnings = [getEducationReadiness(exam.metadata.subject, exam.metadata.grade).label];
  if (!framework) warnings.push('Chưa chọn khung nhận thức phù hợp lớp; nhãn độ khó cũ được giữ riêng.');
  if (unmappedCognitiveCount) warnings.push(unmappedCognitiveCount + ' câu chưa gắn mức nhận thức trong khung đang chọn.');
  if (exam.questions.some(q => !q.learningOutcome?.trim())) warnings.push('Còn câu chưa gắn yêu cầu cần đạt; bản đặc tả cần giáo viên bổ sung.');
  const numeric = requiresNumericScore(exam.metadata.assessmentMode);
  const scoreState = !numeric ? 'not_scored' : totalExamPoints > 0 || exam.questions.every(q => q.points === 0) && exam.questions.length > 0 ? 'configured' : 'unconfigured';
  if (scoreState === 'unconfigured') warnings.push('Chưa cấu hình điểm; hệ thống không tự quy về thang 10.');
  const pointsFor = (...ids: string[]) => round(cognitiveTotals.filter(level => ids.includes(level.id)).reduce((sum, level) => sum + level.points, 0));
  const allParts = exam.questions.map(part);
  return { rows, totalNbPoints: pointsFor('nhan_biet', 'biet'), totalThPoints: pointsFor('thong_hieu', 'hieu'), totalVdPoints: pointsFor('van_dung'), totalVdcPoints: pointsFor('van_dung_cao'),
    totalExamPoints, totalPart1: allParts.filter(p => p === 'part1').length, totalPart2: allParts.filter(p => p === 'part2').length,
    totalPart3: allParts.filter(p => p === 'part3').length, totalPart4: allParts.filter(p => p === 'part4').length,
    totalQuestions: exam.questions.length, cognitiveFrameworkId: framework?.id ?? null, cognitiveLabels: labels,
    cognitiveTotals: cognitiveTotals.map(level => ({ ...level, points: round(level.points) })), unmappedCognitiveCount, warnings,
    assessmentMode: exam.metadata.assessmentMode ?? 'scored', scoreState,
  };
}

export function computeExamSpecification(exam: Exam): SpecRow[] {
  const levels = frameworkFor(exam)?.levels ?? [];
  const grouped = new Map<string, { q: Question; number: number }[]>();
  exam.questions.forEach((q, i) => { const name = topic(q); grouped.set(name, [...(grouped.get(name) ?? []), { q, number: i + 1 }]); });
  return [...grouped].map(([topicName, questions], i) => {
    const cognitiveQuestions = Object.fromEntries(levels.map(level => [level.id, [] as number[]]));
    const unmappedQuestions: number[] = [];
    for (const { q, number } of questions) {
      if (q.cognitiveLevel && cognitiveQuestions[q.cognitiveLevel]) cognitiveQuestions[q.cognitiveLevel].push(number);
      else unmappedQuestions.push(number);
    }
    const requirements = [...new Set(questions.map(item => item.q.learningOutcome?.trim()).filter(Boolean))];
    return { index: i + 1, topicName, subTopic: topicName,
      requirement: requirements.length ? requirements.join('; ') : 'Chưa gắn yêu cầu cần đạt; giáo viên cần bổ sung.',
      nbQuestions: cognitiveQuestions.nhan_biet ?? cognitiveQuestions.biet ?? [], thQuestions: cognitiveQuestions.thong_hieu ?? cognitiveQuestions.hieu ?? [], vdQuestions: cognitiveQuestions.van_dung ?? [], vdcQuestions: cognitiveQuestions.van_dung_cao ?? [], cognitiveQuestions, unmappedQuestions,
    };
  });
}

export function generateDocxMatrixTable(matrix: ExamMatrixData): Table {
  const border = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
  const cell = (text: string, header = false) => new TableCell({ borders: { top: border, bottom: border, left: border, right: border },
    shading: header ? { type: ShadingType.CLEAR, fill: 'E2E8F0' } : undefined,
    children: [new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text, bold: header, size: 18, font: 'Times New Roman' })] })],
  });
  const numeric = matrix.scoreState !== 'not_scored';
  const rows = [new TableRow({ children: ['TT', 'Chủ đề', ...matrix.cognitiveLabels.map(level => level.label), 'Chưa gắn mức', 'Tổng câu', numeric ? 'Điểm' : 'Đánh giá'].map(label => cell(label, true)) })];
  for (const row of matrix.rows) rows.push(new TableRow({ children: [String(row.index), row.topicName,
    ...matrix.cognitiveLabels.map(level => String(sumCounts(row.cognitiveCounts[level.id]))), String(row.unmappedCount), String(row.totalQuestions), numeric ? String(row.totalPoints) : 'Nhận xét / rubric',
  ].map(value => cell(value)) }));
  rows.push(new TableRow({ children: ['Tổng', '', ...matrix.cognitiveTotals.map(level => String(level.count)), String(matrix.unmappedCognitiveCount), String(matrix.totalQuestions), numeric ? String(matrix.totalExamPoints) : 'Không tính điểm'].map(value => cell(value, true)) }));
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows });
}
