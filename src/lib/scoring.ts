import { Exam, Question } from '@/types/exam';
import { getSubjectConfig, getQuestionPoints } from './subject-config';

/**
 * Trả về số điểm mặc định cho từng loại câu hỏi theo chuẩn thi GDPT 2018 (Từ 2025)
 * Tự động căn cứ vào cấu hình môn học (Toán, Lý, Hóa, Sinh, Văn, Anh...)
 */
export function getDefaultPointsForQuestion(question: Question, subjectExam?: Exam): number {
  if (question.points !== undefined && question.points !== null) {
    return question.points;
  }

  const subject = question.subject || subjectExam?.metadata?.subject || 'toan';
  const grade = question.grade || subjectExam?.metadata?.grade || 12;
  const config = getSubjectConfig(subject, grade);

  return getQuestionPoints(question, config);
}

/**
 * Tính tổng điểm của toàn bộ đề thi
 */
export function calculateExamTotalPoints(exam: Exam): number {
  const subject = exam.metadata?.subject || 'toan';
  const grade = exam.metadata?.grade || 12;
  const config = getSubjectConfig(subject, grade);

  const total = exam.questions.reduce((sum, q) => sum + getQuestionPoints(q, config), 0);
  return Math.round(total * 100) / 100;
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
  const subject = exam.metadata?.subject || 'toan';
  const grade = exam.metadata?.grade || 12;
  const config = getSubjectConfig(subject, grade);

  let part1Count = 0, part1Points = 0;
  let part2Count = 0, part2Points = 0;
  let part3Count = 0, part3Points = 0;
  let part4Count = 0, part4Points = 0;

  exam.questions.forEach((q) => {
    const pts = getQuestionPoints(q, config);
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
