import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { Exam } from '@/types/exam';
import { normalizeQuestion } from './exam-document';
import { ApiError } from './api-error';

const responseSchema = z.object({
  type: z.enum(['clarification', 'action']),
  message: z.string().max(4000).optional(),
  quickOptions: z.array(z.string().max(300)).max(6).optional(),
  action: z.enum(['modify_single_question', 'add_question', 'delete_question', 'modify_all_numbers']).optional(),
  targetQuestionId: z.string().nullable().optional(),
  targetQuestionIndex: z.number().int().positive().nullable().optional(),
  explanation: z.string().max(4000).optional(),
  modifiedQuestion: z.record(z.string(), z.unknown()).nullable().optional(),
});

export function validateCopilotResult(input: unknown, exam: Exam, requestedTarget?: string) {
  const result = responseSchema.parse(input);
  if (result.type === 'clarification') return { ...result, message: result.message || 'Thầy/cô muốn sửa phần nào?', quickOptions: result.quickOptions ?? [] };
  if (result.action === 'modify_all_numbers') return { type: 'clarification', message: 'Hãy chọn từng câu để xem và duyệt thay đổi trước khi áp dụng.', quickOptions: [] };
  if (!result.action) throw new ApiError(422, 'AI chưa trả về hành động hợp lệ.');
  let original = result.targetQuestionId ? exam.questions.find(q => q.id === result.targetQuestionId) : undefined;
  if (result.targetQuestionId && !original) throw new ApiError(422, 'AI đề nghị sửa một câu không có trong đề.');
  if (!original && result.targetQuestionIndex) original = exam.questions[result.targetQuestionIndex - 1];
  if (!original && requestedTarget) original = exam.questions.find(q => q.id === requestedTarget);
  if (result.action !== 'add_question' && (!original || (requestedTarget && original.id !== requestedTarget))) throw new ApiError(422, 'Chưa xác định đúng câu cần sửa. Hãy chọn câu và gửi lại.');
  if (result.targetQuestionIndex && original && exam.questions[result.targetQuestionIndex - 1]?.id !== original.id) throw new ApiError(422, 'AI trả về vị trí và mã câu không khớp.');
  if (result.action === 'delete_question') return { ...result, targetQuestionId: original!.id, modifiedQuestion: null };
  if (!result.modifiedQuestion) throw new ApiError(422, 'AI chưa trả về nội dung câu hỏi.');
  const question = normalizeQuestion({ ...(result.action === 'modify_single_question' ? original : {}), ...result.modifiedQuestion,
    id: result.action === 'add_question' ? `q_${randomUUID()}` : original!.id,
    status: 'draft', verifiedBy: 'none', aiGenerated: true, version: (original?.version ?? 0) + 1,
  });
  if (!question.content.trim()) throw new ApiError(422, 'AI trả về câu hỏi trống.');
  if (question.type === 'multiple_choice' && (!question.choices?.length || new Set(question.choices.map(c => c.key)).size !== question.choices.length)) throw new ApiError(422, 'Phương án trả về chưa hợp lệ.');
  return { ...result, targetQuestionId: original?.id, modifiedQuestion: question };
}
