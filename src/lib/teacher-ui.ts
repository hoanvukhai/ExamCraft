import { getCatalogSubjects } from './education-catalog';
export const questionTypeLabels: Record<string, string> = { multiple_choice: 'Trắc nghiệm', true_false_group: 'Đúng / Sai', short_answer: 'Trả lời ngắn', essay: 'Tự luận', fill_blank: 'Điền khuyết', matching: 'Ghép đôi', ordering: 'Sắp xếp' };
export function subjectLabel(key: string) { return getCatalogSubjects().find(item => item.key === key)?.label ?? key; }
export function assignmentStatusLabel(status: string) { return status === 'OPEN' ? 'Đang mở' : status === 'ARCHIVED' ? 'Đã lưu trữ' : 'Đã đóng'; }
export function teacherErrorMessage(cause: unknown, fallback: string) { return cause instanceof Error && !(cause instanceof TypeError) && !(cause instanceof SyntaxError) ? cause.message : fallback; }
