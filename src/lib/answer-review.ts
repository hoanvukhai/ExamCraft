import type { Question } from '@/types/exam';

export interface AnswerReview {
  solvedAnswer: string;
  recommendation: string;
  discrepancies: string[];
  subQuestionsAssessment?: { key: string; isCorrect: boolean; reason: string }[];
}

/** A comparison is assistance for teacher review, never a certification. */
export function compareAnswerReview(question: Question, review: AnswerReview) {
  const discrepancies = [...review.discrepancies];
  // The same relation is written "x ≥ 3", "x >= 3" or "x \ge 3"; they are one answer, so a model's symbol choice is not a discrepancy.
  const normalize = (value: string) => value.trim().toLowerCase()
    .replace(/\\(?:geq?|geqslant)\b|≥/g, '>=').replace(/\\(?:leq?|leqslant)\b|≤/g, '<=').replace(/\\neq?\b|≠/g, '!=')
    .replace(/\\times\b|\\cdot\b|×|·/g, '*').replace(/\\div\b|÷/g, '/').replace(/−/g, '-').replace(/\$/g, '').replace(/\s+/g, '');
  let complete = false;
  let isMatch = false;
  if (question.type === 'multiple_choice') {
    const solved = review.solvedAnswer.trim().toUpperCase();
    const current = question.correct_answer?.trim().toUpperCase();
    const keys = question.choices?.map(choice => choice.key.toUpperCase()) ?? [];
    complete = !!current && keys.includes(current) && keys.includes(solved);
    isMatch = complete && solved === current;
  } else if (question.type === 'true_false_group') {
    const subs = question.sub_questions ?? [];
    const assessments = review.subQuestionsAssessment ?? [];
    const keys = assessments.map(item => item.key.toLowerCase());
    complete = subs.length > 0 && assessments.length === subs.length && new Set(keys).size === keys.length
      && new Set(subs.map(sub => sub.key.toLowerCase())).size === subs.length
      && subs.every(sub => typeof sub.isCorrect === 'boolean' && keys.includes(sub.key.toLowerCase()))
      && assessments.every(item => typeof item.isCorrect === 'boolean');
    isMatch = complete && subs.every(sub => assessments.find(item => item.key.toLowerCase() === sub.key.toLowerCase())?.isCorrect === sub.isCorrect);
  } else if (question.type === 'short_answer' || question.type === 'fill_blank') {
    const solved = normalize(review.solvedAnswer);
    const accepted = [question.correct_answer, ...(question.accepted_answers ?? [])]
      .filter((value): value is string => typeof value === 'string' && normalize(value) !== '');
    complete = solved !== '' && accepted.length > 0;
    // A solver may list its answer in two spellings ("did not visit / didn't visit"); the answer matches when any listed form is an accepted one.
    const forms = [solved, ...review.solvedAnswer.split(' / ').map(normalize).filter(form => form !== '')];
    isMatch = complete && accepted.some(answer => forms.includes(normalize(answer)));
  }
  if (!complete) discrepancies.push('Chưa đủ dữ liệu để đối chiếu tự động; giáo viên cần kiểm tra đáp án và lời giải.');
  else if (!isMatch) discrepancies.push('Kết quả AI khác đáp án hiện tại; giáo viên cần xem lại trước khi áp dụng.');
  isMatch = isMatch && review.recommendation === 'match' && discrepancies.length === 0;
  return { complete, isMatch, discrepancies };
}
