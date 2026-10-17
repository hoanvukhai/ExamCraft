import { Exam, Question } from '@/types/exam';

export interface GradingResult {
  totalScore: number;
  maxScore: number;
  part1Score: number;
  part2Score: number;
  part3Score: number;
  details: {
    questionId: string;
    questionIndex: number;
    type: string;
    studentAnswer: any;
    correctAnswer: any;
    isCorrect: boolean;
    scoreEarned: number;
    maxScore: number;
    explanation?: string;
  }[];
}

/**
 * Chuẩn hóa chuỗi số hoặc câu trả lời ngắn để so khớp công bằng
 * Ví dụ: " 3.0 " -> "3", "3,5" -> "3.5", "1/2" -> "0.5"
 */
function normalizeAnswerString(str: string | undefined | null): string {
  if (!str) return '';
  let clean = str.toString().trim().toLowerCase().replace(/,/g, '.').replace(/\s+/g, '');
  // Nếu là phân số dạng a/b
  if (/^[-+]?\d+\/\d+$/.test(clean)) {
    const [num, den] = clean.split('/').map(Number);
    if (den !== 0) {
      return (num / den).toFixed(3).replace(/\.?0+$/, '');
    }
  }
  // Nếu là số thực dạng 3.0 -> 3
  const num = Number(clean);
  if (!isNaN(num) && isFinite(num)) {
    return num.toFixed(3).replace(/\.?0+$/, '');
  }
  return clean;
}

/**
 * Chấm điểm bài làm của học sinh theo chuẩn Thông tư 17/2025/TT-BGDĐT
 */
export function gradeStudentExam(
  exam: Exam,
  studentAnswers: Record<string, any> // key: questionId, value: student answer
): GradingResult {
  let part1Score = 0;
  let part2Score = 0;
  let part3Score = 0;
  let totalScore = 0;
  let maxScore = 0;

  const details: GradingResult['details'] = [];

  exam.questions.forEach((q, idx) => {
    const sAns = studentAnswers[q.id];

    if (q.type === 'multiple_choice') {
      const qMax = 0.25;
      maxScore += qMax;
      const isCorrect = typeof sAns === 'string' && sAns.toUpperCase() === (q.correct_answer || '').toUpperCase();
      const score = isCorrect ? qMax : 0;
      part1Score += score;
      totalScore += score;

      details.push({
        questionId: q.id,
        questionIndex: idx + 1,
        type: q.type,
        studentAnswer: sAns || 'Chưa trả lời',
        correctAnswer: q.correct_answer || 'A',
        isCorrect,
        scoreEarned: score,
        maxScore: qMax,
        explanation: q.step_by_step_solution,
      });
    } else if (q.type === 'true_false_group') {
      const qMax = 1.0;
      maxScore += qMax;

      // sAns là object dạng: { a: true, b: false, c: true, d: false }
      const subQuestions = q.sub_questions || [];
      let correctSubCount = 0;

      subQuestions.forEach((sub) => {
        if (sAns && typeof sAns[sub.key] === 'boolean') {
          if (sAns[sub.key] === sub.isCorrect) {
            correctSubCount++;
          }
        }
      });

      // Thang điểm Bộ GD&ĐT 2025 cho câu hỏi Đúng/Sai 4 ý:
      // Đúng 1 ý: 0.1đ | Đúng 2 ý: 0.25đ | Đúng 3 ý: 0.5đ | Đúng 4 ý: 1.0đ
      let score = 0;
      if (correctSubCount === 1) score = 0.1;
      else if (correctSubCount === 2) score = 0.25;
      else if (correctSubCount === 3) score = 0.5;
      else if (correctSubCount === 4) score = 1.0;

      part2Score += score;
      totalScore += score;

      details.push({
        questionId: q.id,
        questionIndex: idx + 1,
        type: q.type,
        studentAnswer: sAns || {},
        correctAnswer: subQuestions.reduce((acc, sub) => {
          acc[sub.key] = sub.isCorrect;
          return acc;
        }, {} as Record<string, boolean>),
        isCorrect: correctSubCount === 4,
        scoreEarned: score,
        maxScore: qMax,
        explanation: q.step_by_step_solution,
      });
    } else if (q.type === 'short_answer') {
      const qMax = 0.5;
      maxScore += qMax;

      const normStudent = normalizeAnswerString(sAns);
      const normCorrect = normalizeAnswerString(q.correct_answer);

      const isCorrect = normStudent !== '' && normStudent === normCorrect;
      const score = isCorrect ? qMax : 0;
      part3Score += score;
      totalScore += score;

      details.push({
        questionId: q.id,
        questionIndex: idx + 1,
        type: q.type,
        studentAnswer: sAns || 'Chưa điền',
        correctAnswer: q.correct_answer || '',
        isCorrect,
        scoreEarned: score,
        maxScore: qMax,
        explanation: q.step_by_step_solution,
      });
    } else {
      // Các câu tự luận hoặc loại khác
      const qMax = q.points || 1.0;
      maxScore += qMax;
      details.push({
        questionId: q.id,
        questionIndex: idx + 1,
        type: q.type,
        studentAnswer: sAns || 'Chưa nộp',
        correctAnswer: 'Giáo viên chấm tự luận',
        isCorrect: false,
        scoreEarned: 0,
        maxScore: qMax,
        explanation: q.step_by_step_solution,
      });
    }
  });

  return {
    totalScore: Math.round(totalScore * 100) / 100,
    maxScore: Math.round(maxScore * 100) / 100,
    part1Score: Math.round(part1Score * 100) / 100,
    part2Score: Math.round(part2Score * 100) / 100,
    part3Score: Math.round(part3Score * 100) / 100,
    details,
  };
}
