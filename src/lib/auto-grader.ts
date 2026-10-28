import type { Exam } from '@/types/exam';
import { gradeSnapshot } from './attempt-grading';
import { freezeExamScoring } from './snapshot-scoring';
import { solutionForQuestion } from './public-exam';

export interface GradingResult {
  totalScore: number;
  maxScore: number;
  part1Score: number;
  part2Score: number;
  part3Score: number;
  part4Score: number;
  needsGrading: boolean;
  details: {
    questionId: string;
    questionIndex: number;
    type: string;
    studentAnswer: unknown;
    correctAnswer: unknown;
    isCorrect: boolean | null;
    scoreEarned: number;
    maxScore: number;
    explanation?: string;
  }[];
}

/** Compatibility adapter. All actual grading goes through the same immutable-snapshot engine. */
export function gradeStudentExam(exam: Exam, studentAnswers: Record<string, unknown>): GradingResult {
  const { questions: prepared, sections } = freezeExamScoring(exam);
  const grade = gradeSnapshot({ ...exam, sections, questions: prepared }, studentAnswers);
  const details = grade.gradedAnswers.map((answer, i) => {
    const q = prepared.find((question) => question.id === answer.questionKey)!;
    const solution = solutionForQuestion(q);
    const correctAnswer =
      q.type === 'true_false_group'
        ? Object.fromEntries(
            (q.sub_questions ?? [])
              .filter((sub) => typeof sub.isCorrect === 'boolean')
              .map((sub) => [sub.key, sub.isCorrect]),
          )
        : q.type === 'matching'
          ? (q.matchingPairs ?? null)
          : q.type === 'ordering'
            ? (q.correctOrder ?? null)
            : (solution.correct ?? null);
    return {
      questionId: q.id,
      questionIndex: i + 1,
      type: q.type,
      studentAnswer: answer.response,
      correctAnswer,
      isCorrect: answer.isCorrect,
      scoreEarned: answer.earned,
      maxScore: answer.maxPoints,
      explanation: q.step_by_step_solution,
    };
  });
  const partScore = (types: string[]) =>
    Math.round(
      details
        .filter((answer) => types.includes(answer.type))
        .reduce((sum, answer) => sum + answer.scoreEarned, 0) * 100,
    ) / 100;
  return {
    totalScore: grade.score,
    maxScore: grade.maxScore,
    needsGrading: grade.needsGrading,
    part1Score: partScore(['multiple_choice']),
    part2Score: partScore(['true_false_group']),
    part3Score: partScore(['short_answer']),
    part4Score: partScore(['essay', 'fill_blank', 'matching', 'ordering']),
    details,
  };
}
