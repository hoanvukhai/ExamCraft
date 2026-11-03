import { getCatalogSubjects } from './education-catalog';
import { z } from 'zod';
import type { Exam, ExamMetadata } from '@/types/exam';
import { normalizeExamDocument } from './exam-document';
export const copilotMetadataSchema = z.object({
 title:z.string().trim().min(1).max(500).optional(),subject:z.string().min(1).max(100).refine(value=>getCatalogSubjects().some(subject=>subject.key===value),'Môn chưa có trong danh mục.').optional(),grade:z.number().int().min(1).max(12).optional(),
 durationMinutes:z.number().finite().min(0).max(1440).optional(),academicYear:z.string().max(200).optional(),semester:z.string().max(200).optional(),
 schoolName:z.string().max(500).optional(),departmentName:z.string().max(500).optional(),examCode:z.string().max(200).optional(),notes:z.string().max(2000).optional(),
}).strict().refine(patch=>Object.keys(patch).length>0,'Cần ít nhất một trường thay đổi.');
export type CopilotMetadataPatch = z.infer<typeof copilotMetadataSchema>;
export function applyCopilotMetadata(exam: Exam, input: unknown): ExamMetadata {
 const patch=copilotMetadataSchema.parse(input);
 if(exam.questions.length && ((patch.subject!==undefined&&patch.subject!==exam.metadata.subject)||(patch.grade!==undefined&&patch.grade!==exam.metadata.grade))) throw Error('Đề đã có câu: cần đối chiếu nội dung và phạm vi khi đổi môn/lớp. Chưa đổi nhãn câu cũ.');
 return normalizeExamDocument({...exam,metadata:{...exam.metadata,...patch}}).metadata;
}
export const metadataStamp=(metadata:ExamMetadata)=>JSON.stringify(metadata,(_key,value)=>value&&typeof value==='object'&&!Array.isArray(value)?Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b))):value);
