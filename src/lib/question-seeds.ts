import type { Exam, Question, QuestionType } from '@/types/exam';

/** The empty form of each kind of question, as it is inserted from "Thêm". It is valid for saving but has no content yet. */
export function blankQuestion(exam: Exam, type: QuestionType = 'multiple_choice'): Question {
  const id = 'q_' + crypto.randomUUID();
  const base: Question = {
    id,
    type,
    difficulty: 'thong_hieu',
    content: '',
    subject: exam.metadata.subject,
    grade: exam.metadata.grade,
    step_by_step_solution: '',
  };
  switch (type) {
    case 'multiple_choice':
      return { ...base, choices: ['A', 'B', 'C', 'D'].map((key) => ({ key, text: '' })) };
    case 'true_false_group':
      return { ...base, sub_questions: ['a', 'b', 'c', 'd'].map((key) => ({ key, content: '' })) };
    case 'matching':
      return { ...base, matchingPairs: [1, 2].map(() => ({ id: crypto.randomUUID(), left: '', right: '' })) };
    case 'ordering':
      return { ...base, correctOrder: ['', ''] };
    default:
      return base;
  }
}

export const QUESTION_KINDS: { type: QuestionType; label: string }[] = [
  { type: 'multiple_choice', label: 'Tự soạn câu mới' },
  { type: 'true_false_group', label: 'Câu đúng/sai' },
  { type: 'short_answer', label: 'Câu trả lời ngắn' },
  { type: 'essay', label: 'Câu tự luận' },
  { type: 'fill_blank', label: 'Câu điền khuyết' },
  { type: 'matching', label: 'Câu ghép nối' },
  { type: 'ordering', label: 'Câu sắp xếp' },
];
