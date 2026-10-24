import type { Question } from '@/types/exam';

/**
 * Right-hand column of the side-by-side (Đề | Đáp án) view. Missing data is said out loud:
 * an unset answer is never shown as correct, and 0 or false are real answers.
 */
export interface ParallelAnswer { headline: string; details: string[]; solution: string }

const NO_ANSWER = 'Chưa có đáp án';

export function parallelAnswer(question: Question): ParallelAnswer {
  const details: string[] = [];
  let headline: string;
  switch (question.type) {
    case 'multiple_choice':
      headline = question.correct_answer?.trim() ? `Đáp án: ${question.correct_answer.trim()}` : NO_ANSWER;
      break;
    case 'true_false_group': {
      const subs = question.sub_questions ?? [];
      headline = subs.length ? subs.map(sub => `${sub.key}) ${typeof sub.isCorrect === 'boolean' ? (sub.isCorrect ? 'Đúng' : 'Sai') : NO_ANSWER}`).join('; ') : NO_ANSWER;
      for (const sub of subs) if (sub.explanation?.trim()) details.push(`${sub.key}) ${sub.explanation.trim()}`);
      break;
    }
    case 'short_answer':
    case 'fill_blank': {
      const main = question.correct_answer === undefined || question.correct_answer === null ? '' : String(question.correct_answer).trim();
      headline = main ? `Đáp số: ${main}` : NO_ANSWER;
      const others = (question.accepted_answers ?? []).map(value => String(value).trim()).filter(value => value && value !== main);
      if (others.length) details.push(`Cũng chấp nhận: ${others.join('; ')}`);
      break;
    }
    case 'matching': {
      const pairs = (question.matchingPairs ?? []).filter(pair => pair.left.trim() || pair.right.trim());
      headline = pairs.length ? pairs.map(pair => `${pair.left} → ${pair.right}`).join('; ') : NO_ANSWER;
      break;
    }
    case 'ordering': {
      const order = question.correctOrder ?? [];
      const labelOf = (key: string) => question.choices?.find(choice => choice.key === key)?.text ?? key;
      headline = order.length ? order.map(labelOf).join(' → ') : NO_ANSWER;
      break;
    }
    case 'essay':
      headline = question.rubric?.length ? 'Chấm theo tiêu chí' : 'Giáo viên đánh giá';
      for (const row of question.rubric ?? []) details.push(`${row.criterion}: ${row.maxPoints} điểm`);
      break;
    default:
      headline = NO_ANSWER;
  }
  return { headline, details, solution: question.step_by_step_solution?.trim() ?? '' };
}
