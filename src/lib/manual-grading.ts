import { ApiError } from './api-error';
import { gradeSnapshot } from './attempt-grading';
import { asObject, snapshotQuestions } from './public-exam';
import { requiresNumericScore, type AssessmentMode } from './education-catalog';

/** Teacher-only presentation adapter; never use for a public student response. */
export function teacherSnapshotQuestions(snapshot: unknown): (Record<string, unknown> & { id: string; type: string; solution: unknown; payload: Record<string, unknown> })[] {
  return snapshotQuestions(snapshot).map(question => {
    const payload = asObject(question.payload);
    return { ...question, id: String(question.id), type: String(question.type).toUpperCase(),
      solution: question.solution ?? question.step_by_step_solution ?? '',
      payload: { ...payload,
        choices: question.choices ?? payload.choices,
        sub_questions: question.sub_questions ?? payload.sub_questions,
        correct: question.correct_answer ?? payload.correct ?? payload.correct_answer,
        accepted_answers: question.accepted_answers ?? payload.accepted_answers,
        rubric: question.rubric ?? payload.rubric,
        matchingPairs: question.matchingPairs ?? payload.matchingPairs,
        correctOrder: question.correctOrder ?? payload.correctOrder,
      },
    };
  });
}

export function manualGradeTarget(snapshot: unknown, questionKey: string, earned: unknown) {
  const mode = asObject(asObject(snapshot).metadata).assessmentMode as AssessmentMode | undefined;
  const numeric = requiresNumericScore(mode);
  const automatic = gradeSnapshot(snapshot, {});
  const target = automatic.gradedAnswers.find(answer => answer.questionKey === questionKey);
  if (!target) throw new ApiError(400, 'Câu hỏi không có trong bản đề đã giao');
  if (!numeric) {
    if (earned !== undefined && earned !== 0 && earned !== null) throw new ApiError(400, 'Bài khảo sát/nhận xét không chấm điểm số');
    return { numeric, earned: 0, maxPoints: 0, isCorrect: null };
  }
  if (!('pointsConfigured' in target) || !target.pointsConfigured) throw new ApiError(409, 'Bản đề đã giao chưa có điểm hợp lệ cho câu này; cần kiểm tra cấu hình trước khi chấm');
  if (typeof earned !== 'number' || !Number.isFinite(earned) || earned < 0 || earned > target.maxPoints || Math.abs(Math.round(earned * 100) - earned * 100) > 1e-8) throw new ApiError(400, `Điểm cần từ 0 đến ${target.maxPoints}, tối đa hai chữ số thập phân`);
  return { numeric, earned, maxPoints: target.maxPoints, isCorrect: target.maxPoints > 0 ? earned === target.maxPoints : null };
}
export function summarizeManualGrades(snapshot: unknown, answers: { questionKey: string; response: unknown; earned: unknown; manualScore: unknown; isCorrect: boolean | null }[]) {
  const mode = asObject(asObject(snapshot).metadata).assessmentMode as AssessmentMode | undefined;
  const numeric = requiresNumericScore(mode);
  const automatic = gradeSnapshot(snapshot, Object.fromEntries(answers.map(answer => [answer.questionKey, answer.response])));
  const byKey = new Map(answers.map(answer => [answer.questionKey, answer]));
  const score = automatic.gradedAnswers.reduce((sum, question) => {
    const answer = byKey.get(question.questionKey);
    const value = Number(answer?.manualScore ?? answer?.earned ?? 0);
    return sum + (Number.isFinite(value) && value >= 0 ? Math.min(value, question.maxPoints) : 0);
  }, 0);
  const needsGrading = mode === 'survey' ? false : automatic.gradedAnswers.some(question => {
    const answer = byKey.get(question.questionKey);
    if (numeric && !('pointsConfigured' in question && question.pointsConfigured)) return true;
    if (answer?.manualScore != null) {
      const manual = Number(answer.manualScore);
      return !Number.isFinite(manual) || manual < 0 || manual > question.maxPoints;
    }
    return numeric ? question.isCorrect === null || !('pointsConfigured' in question && question.pointsConfigured) : true;
  });
  return { score: numeric ? Math.round(score * 100) / 100 : null, maxScore: numeric ? automatic.maxScore : null, needsGrading };
}
