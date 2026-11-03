import { resolveCopilotTarget, projectQuestionField, type CopilotTarget } from './copilot-target';
import { applyCopilotMetadata, copilotMetadataSchema } from './copilot-metadata';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { Exam } from '@/types/exam';
import { normalizeQuestion } from './exam-document';
import { ApiError } from './api-error';

const responseSchema = z.object({
  type: z.enum(['answer','clarification', 'action']),
  message: z.string().max(4000).optional(),
  quickOptions: z.array(z.string().max(300)).max(6).optional(),
  action: z.enum(['modify_single_question', 'add_question', 'delete_question', 'modify_all_numbers', 'update_metadata', 'modify_questions']).optional(),
  targetQuestionId: z.string().nullable().optional(),
  targetQuestionIndex: z.number().int().positive().nullable().optional(),
  explanation: z.string().max(4000).optional(),
  metadataPatch: copilotMetadataSchema.optional(),
  modifiedQuestions: z.array(z.record(z.string(),z.unknown())).max(100).optional(),
  modifiedQuestion: z.record(z.string(), z.unknown()).nullable().optional(),
});

export function validateCopilotResult(input: unknown, exam: Exam, requestedTarget?: string, target?:CopilotTarget) {
  if(input&&typeof input==='object'&&'type' in input&&input.type==='action'&&'action' in input&&!['modify_single_question','add_question','delete_question','modify_all_numbers','update_metadata','modify_questions'].includes(String(input.action)))throw new ApiError(422,'Thao tác AI đề nghị chưa được hỗ trợ. Chưa thay đổi đề.','UNSUPPORTED_ACTION');
  const result = responseSchema.parse(input);
  if(result.type==='answer'){if(!result.message?.trim())throw new ApiError(422,'AI chưa trả lời đủ nội dung.','AI_BAD_OUTPUT');return {type:'answer' as const,message:result.message};}
  if (result.type === 'clarification') return { ...result, message: result.message || 'Thầy/cô muốn sửa phần nào?', quickOptions: result.quickOptions ?? [] };
  if(result.metadataPatch&&result.action!=='update_metadata'){try{applyCopilotMetadata(exam,result.metadataPatch);}catch{throw new ApiError(422,'Thông tin đi cùng câu hỏi chưa hợp lệ. Chưa áp dụng phần nào.','AI_BAD_OUTPUT');}}
  if(result.action==='modify_questions'){
    if(!target||!result.modifiedQuestions?.length)throw new ApiError(422,'Chưa có đủ nội dung các câu đang chọn.','AI_INCOMPLETE');
    const {ids}=resolveCopilotTarget(exam,target);
    const questions=result.modifiedQuestions.map(raw=>{
      const original=exam.questions.find(q=>q.id===raw.id);
      if(!original||original.locked||!ids.includes(original.id))throw new ApiError(422,'Đề xuất nằm ngoài vùng chọn hoặc câu đã khóa.','STALE_CONTEXT');
      return normalizeQuestion({...projectQuestionField(original,normalizeQuestion({...original,...raw,id:original.id}),target),id:original.id,status:'draft',verifiedBy:'none'});
    });
    if(questions.length!==ids.length||new Set(questions.map(q=>q.id)).size!==ids.length)throw new ApiError(422,'AI chưa trả đủ từng câu trong vùng chọn.','AI_INCOMPLETE');
    return {...result,modifiedQuestions:questions};
  }
  if (result.action === 'update_metadata') {
    try { applyCopilotMetadata(exam,result.metadataPatch); } catch { throw new ApiError(422,'Thông tin đề xuất chưa hợp lệ hoặc cần đối chiếu câu khi đổi môn/lớp. Chưa áp dụng.','AI_BAD_OUTPUT'); }
    return {...result,modifiedQuestion:null};
  }
  if (result.action === 'modify_all_numbers') return { type: 'clarification' as const, message: 'Hãy chọn từng câu để xem và duyệt thay đổi trước khi áp dụng.', quickOptions: [] };
  if (!result.action) throw new ApiError(422, 'AI chưa trả về hành động hợp lệ.');
  let original = result.targetQuestionId ? exam.questions.find(q => q.id === result.targetQuestionId) : undefined;
  if (result.targetQuestionId && !original) throw new ApiError(422, 'AI đề nghị sửa một câu không có trong đề.');
  if (!original && result.targetQuestionIndex) original = exam.questions[result.targetQuestionIndex - 1];
  if (!original && requestedTarget) original = exam.questions.find(q => q.id === requestedTarget);
  if (result.action !== 'add_question' && (!original || (requestedTarget && original.id !== requestedTarget))) throw new ApiError(422, 'Chưa xác định đúng câu cần sửa. Hãy chọn câu và gửi lại.');
  if (result.targetQuestionIndex && original && exam.questions[result.targetQuestionIndex - 1]?.id !== original.id) throw new ApiError(422, 'AI trả về vị trí và mã câu không khớp.');
  if(original?.locked)throw new ApiError(422,'Câu đang khóa; chưa áp dụng thay đổi.','STALE_CONTEXT');
  if(original && target && !resolveCopilotTarget(exam,target).ids.includes(original.id))throw new ApiError(422,'AI trả kết quả ngoài vùng chọn.','AI_BAD_OUTPUT');
  if (result.action === 'delete_question') return { ...result, targetQuestionId: original!.id, modifiedQuestion: null };
  if (!result.modifiedQuestion) throw new ApiError(422, 'AI chưa trả về nội dung câu hỏi.');
  const question = normalizeQuestion({ ...(result.action === 'modify_single_question' ? original : {}), ...result.modifiedQuestion,
    id: result.action === 'add_question' ? `q_${randomUUID()}` : original!.id,
    status: 'draft', verifiedBy: 'none', aiGenerated: true, version: (original?.version ?? 0) + 1,
  });
  if(result.action==='add_question'){const metadata=result.metadataPatch?applyCopilotMetadata(exam,result.metadataPatch):exam.metadata;if(question.grade!==undefined&&question.grade!==metadata.grade||question.subject!==undefined&&question.subject!==metadata.subject)throw new ApiError(422,'Câu AI đề xuất khác môn/lớp của đề. Hãy xác định lại phạm vi; chưa tự đổi nhãn câu.','SCOPE_MISMATCH');if(target?.kind==='field')throw new ApiError(422,'Chọn cả câu hoặc phần để thêm câu mới. Chưa mở rộng vùng đang chọn.','BAD_REQUEST');}
  if (!question.content.trim()) throw new ApiError(422, 'AI trả về câu hỏi trống.');
  if (question.type === 'multiple_choice' && (!question.choices?.length || new Set(question.choices.map(c => c.key)).size !== question.choices.length)) throw new ApiError(422, 'Phương án trả về chưa hợp lệ.');
  return { ...result, targetQuestionId: original?.id, modifiedQuestion: question };
}
