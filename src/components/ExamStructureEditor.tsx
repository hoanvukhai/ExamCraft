'use client';

import type { Exam, Passage, ExamSection } from '@/types/exam';
import { FigureEditor } from './FigureEditor';

const field = 'w-full border rounded p-2 bg-transparent text-sm';

export function ExamStructureEditor({ exam, onChange }: { exam: Exam; onChange: (update: (previous: Exam) => Exam) => void }) {
  const passages = exam.passages ?? [], sections = exam.sections ?? [];
  const updatePassage = (id: string, update: Partial<Passage>) => onChange(previous => ({ ...previous, passages: previous.passages?.map(p => p.id === id ? { ...p, ...update } : p), questions: previous.questions.map(q => q.passageId === id ? { ...q, status: 'draft', verifiedBy: 'none', version: (q.version ?? 1) + 1 } : q) }));
  const updateSection = (id: string, update: Partial<ExamSection>) => onChange(previous => ({ ...previous, sections: previous.sections?.map(s => s.id === id ? { ...s, ...update } : s) }));
  return <details className="border rounded-xl p-3 bg-white dark:bg-[#202124]"><summary className="cursor-pointer text-sm font-semibold">Phần của đề và ngữ liệu dùng chung</summary>
    <p className="text-xs my-2">Tự đặt tên phần, gắn câu hỏi và thêm văn bản dùng chung. Các thay đổi được lưu cùng đề.</p>
    {sections.map((section, i) => <div key={section.id} className="flex gap-2 my-2 items-end"><label className="grow text-sm">Tên phần {i + 1}<input aria-label={`Tên phần ${i + 1}`} className={field} value={section.title ?? section.label ?? section.name} onChange={e => updateSection(section.id, { name: e.target.value, title: e.target.value, label: e.target.value })} /></label><button type="button" disabled={exam.questions.some(q => q.sectionId === section.id)} title="Chỉ bỏ phần khi không còn câu hỏi gắn vào phần" onClick={() => onChange(previous => ({ ...previous, sections: previous.sections?.filter(s => s.id !== section.id) }))}>Bỏ phần</button></div>)}
    <button type="button" className="text-sm my-2" onClick={() => onChange(previous => ({ ...previous, sections: [...(previous.sections ?? []), { id: crypto.randomUUID(), name: `Phần ${(previous.sections?.length ?? 0) + 1}` }] }))}>Thêm phần</button>
    {passages.map((passage, i) => <fieldset key={passage.id} className="border rounded p-3 my-3 space-y-2"><legend>Ngữ liệu {i + 1}</legend>
      <label className="block text-sm">Tên ngữ liệu<input className={field} aria-label={`Tên ngữ liệu ${i + 1}`} value={passage.title ?? ''} onChange={e => updatePassage(passage.id, { title: e.target.value })} /></label>
      <label className="block text-sm">Nội dung<textarea className={field} aria-label={`Nội dung ngữ liệu ${i + 1}`} rows={6} value={passage.content} onChange={e => updatePassage(passage.id, { content: e.target.value })} /></label>
      <label className="block text-sm">Nguồn trích dẫn<input className={field} value={passage.source ?? ''} onChange={e => updatePassage(passage.id, { source: e.target.value })} /></label>
      <FigureEditor figures={passage.figures ?? []} onChange={figures => updatePassage(passage.id, { figures })} />
      <button type="button" className="text-sm" disabled={exam.questions.some(q => q.passageId === passage.id)} title="Gỡ liên kết ở các câu hỏi trước khi bỏ ngữ liệu" onClick={() => onChange(previous => ({ ...previous, passages: previous.passages?.filter(p => p.id !== passage.id) }))}>Bỏ ngữ liệu</button>
    </fieldset>)}
    <button type="button" className="text-sm my-2" onClick={() => onChange(previous => ({ ...previous, passages: [...(previous.passages ?? []), { id: crypto.randomUUID(), title: `Ngữ liệu ${(previous.passages?.length ?? 0) + 1}`, content: '' }] }))}>Thêm ngữ liệu</button>
    {exam.questions.length > 0 && <div className="space-y-3 mt-3">{exam.questions.map((question, index) => <div key={question.id} className="grid grid-cols-2 gap-2 border-t pt-2"><p className="text-sm col-span-2 truncate">Câu {index + 1}: {question.content || 'Chưa có nội dung'}</p><label className="text-xs">Thuộc phần<select className={field} aria-label={`Phần của câu ${index + 1}`} value={question.sectionId ?? ''} onChange={e => { const id = e.target.value; onChange(previous => ({ ...previous, questions: previous.questions.map(q => q.id === question.id ? { ...q, sectionId: id || undefined } : q) })); }}><option value="">Không gắn phần</option>{sections.map(s => <option key={s.id} value={s.id}>{s.title ?? s.label ?? s.name}</option>)}</select></label><label className="text-xs">Dùng ngữ liệu<select className={field} aria-label={`Ngữ liệu của câu ${index + 1}`} value={question.passageId ?? ''} onChange={e => { const id = e.target.value; onChange(previous => ({ ...previous, questions: previous.questions.map(q => q.id === question.id ? { ...q, passageId: id || undefined, status: 'draft', verifiedBy: 'none', version: (q.version ?? 1) + 1 } : q) })); }}><option value="">Không gắn ngữ liệu</option>{passages.map((p, i) => <option key={p.id} value={p.id}>{p.title || `Ngữ liệu ${i + 1}`}</option>)}</select></label></div>)}</div>}
  </details>;
}
