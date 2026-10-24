import { Exam, Question } from '@/types/exam';
import { freezeExamScoring } from './snapshot-scoring';
import { requiresNumericScore } from './education-catalog';

/**
 * Chỉ đọc điểm của câu hoặc cấu trúc mà giáo viên đã chọn; không tự suy mẫu từ tên môn/lớp.
 */
export function getDefaultPointsForQuestion(question: Question, subjectExam?: Exam): number {
  if (!requiresNumericScore(subjectExam?.metadata?.assessmentMode)) return 0;
  if (question.points !== undefined && question.points !== null) return Number.isFinite(question.points) && question.points >= 0 ? question.points : 0;
  if (!subjectExam) return 0;
  return freezeExamScoring({ ...subjectExam, questions: [question] }).questions[0]?.points ?? 0;
}

/**
 * Tính tổng điểm của toàn bộ đề thi
 */
export function calculateExamTotalPoints(exam: Exam): number {
  if (!requiresNumericScore(exam.metadata?.assessmentMode)) return 0;
  return Math.round(freezeExamScoring(exam).questions.reduce((sum, question) => sum + (question.points ?? 0), 0) * 100) / 100;
}

/**
 * Định dạng chuỗi hiển thị điểm (ví dụ: "0,25 điểm")
 */
export function formatPointsString(points: number): string {
  const formatted = points.toString().replace('.', ',');
  return `${formatted} điểm`;
}

/**
 * Thống kê ma trận điểm số theo từng phần thi dựa trên cấu hình môn học
 */
export function getExamScoreBreakdown(exam: Exam): {
  part1Count: number;
  part1Points: number;
  part2Count: number;
  part2Points: number;
  part3Count: number;
  part3Points: number;
  part4Count: number;
  part4Points: number;
  totalPoints: number;
} {
  const frozen = freezeExamScoring(exam);

  let part1Count = 0, part1Points = 0;
  let part2Count = 0, part2Points = 0;
  let part3Count = 0, part3Points = 0;
  let part4Count = 0, part4Points = 0;

  frozen.questions.forEach((q) => {
    const pts = requiresNumericScore(exam.metadata?.assessmentMode) ? (q.points ?? 0) : 0;
    if (q.type === 'multiple_choice') {
      part1Count++;
      part1Points += pts;
    } else if (q.type === 'true_false_group') {
      part2Count++;
      part2Points += pts;
    } else if (q.type === 'short_answer') {
      part3Count++;
      part3Points += pts;
    } else {
      // essay, fill_blank, matching, ordering
      part4Count++;
      part4Points += pts;
    }
  });

  return {
    part1Count,
    part1Points: Math.round(part1Points * 100) / 100,
    part2Count,
    part2Points: Math.round(part2Points * 100) / 100,
    part3Count,
    part3Points: Math.round(part3Points * 100) / 100,
    part4Count,
    part4Points: Math.round(part4Points * 100) / 100,
    totalPoints: Math.round((part1Points + part2Points + part3Points + part4Points) * 100) / 100,
  };
}
