'use client';

import type { Question } from '@/types/exam';

export function importAnswerMissing(q: Question) {
  if (q.type === 'true_false_group') return !q.sub_questions?.length || q.sub_questions.some(item => item.isCorrect === undefined);
  if (q.type === 'multiple_choice') return !q.choices?.some(item => item.key === q.correct_answer);
  if (q.type === 'matching') return !q.matchingPairs?.length;
  if (q.type === 'ordering') return !q.correctOrder?.length;
  return !q.correct_answer?.trim() && !q.accepted_answers?.length && !q.rubric?.length;
}

/** A compact transcription correction form; changes stay in preview until the teacher imports. */
export function ImportQuestionEditor({ question: q, onChange, disabled }: { question: Question; onChange: (q: Question) => void; disabled: boolean }) {
  const change = (patch: Partial<Question>) => onChange({ ...q, ...patch, status: 'draft', verifiedBy: 'none' });
  const field = 'w-full border rounded p-2 bg-white dark:bg-neutral-900 text-sm';
  return <fieldset disabled={disabled} className="space-y-2 border rounded p-2">
    <label className="block">Nội dung câu<textarea aria-label="Nội dung câu nhập" className={field} value={q.content} onChange={e => change({ content: e.target.value })} /></label>
    {q.choices?.map((item, index) => <label className="block" key={item.key}>Phương án {item.key}<input aria-label={`Phương án ${item.key}`} className={field} value={item.text} onChange={e => change({ choices: q.choices!.map((choice, i) => i === index ? { ...choice, text: e.target.value } : choice) })} /></label>)}
    {q.type === 'multiple_choice' ? <label className="block">Đáp án<select aria-label="Đáp án câu nhập" className={field} value={q.correct_answer ?? ''} onChange={e => change({ correct_answer: e.target.value || undefined })}><option value="">Chưa đặt</option>{q.choices?.map(item => <option key={item.key} value={item.key}>{item.key}</option>)}</select></label>
      : q.type === 'true_false_group' ? q.sub_questions?.map((item, index) => <div key={item.key} className="space-y-1"><label>Ý {item.key}<textarea aria-label={`Nội dung ý ${item.key}`} className={field} value={item.content} onChange={e => change({ sub_questions: q.sub_questions!.map((sub, i) => i === index ? { ...sub, content: e.target.value } : sub) })} /></label><select aria-label={`Đáp án ý ${item.key}`} className={field} value={item.isCorrect === undefined ? '' : String(item.isCorrect)} onChange={e => change({ sub_questions: q.sub_questions!.map((sub, i) => i === index ? { ...sub, isCorrect: e.target.value === '' ? undefined : e.target.value === 'true' } : sub) })}><option value="">Chưa đặt</option><option value="true">Đúng</option><option value="false">Sai</option></select></div>)
      : <label className="block">Đáp án / hướng dẫn chấm<input aria-label="Đáp án câu nhập" className={field} value={q.correct_answer ?? ''} onChange={e => change({ correct_answer: e.target.value || undefined, accepted_answers: undefined })} /></label>}
    <p className="text-xs">Bản sửa chỉ ở phần xem trước, chưa lưu vào đề hay ngân hàng.</p>
  </fieldset>;
}
