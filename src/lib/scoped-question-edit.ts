import type { Question } from '@/types/exam';

/** Only explicit text fields may cross from a scoped AI proposal into the source question. */
export function projectScopedQuestionEdit(base: Question, suggestion: Question, field: string): Question {
  const next = structuredClone(base);
  const text = (value: unknown) => {
    if (typeof value !== 'string' || !value.trim()) throw new Error('AI chưa trả lại nội dung cho vùng đã chọn. Đề gốc vẫn được giữ.');
    return value;
  };
  if (field === 'Nội dung câu') next.content = text(suggestion.content);
  else if (field === 'Lời giải') next.step_by_step_solution = text(suggestion.step_by_step_solution);
  else if (field.startsWith('Phương án ')) {
    const key = field.slice('Phương án '.length);
    if (!base.choices?.some(c => c.key === key)) throw new Error('Phương án không còn tồn tại.');
    const replacement = text(suggestion.choices?.find(c => c.key === key)?.text);
    next.choices = base.choices.map(c => c.key === key ? { ...c, text: replacement } : structuredClone(c));
  } else if (field.startsWith('Mệnh đề ')) {
    const key = field.slice('Mệnh đề '.length);
    if (!base.sub_questions?.some(c => c.key === key)) throw new Error('Mệnh đề không còn tồn tại.');
    const replacement = text(suggestion.sub_questions?.find(c => c.key === key)?.content);
    next.sub_questions = base.sub_questions.map(c => c.key === key ? { ...c, content: replacement } : structuredClone(c));
  } else throw new Error('Vùng chọn chưa hỗ trợ sửa riêng bằng AI.');
  return next;
}
