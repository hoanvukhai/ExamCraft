'use client';

import { useEffect, useRef, useState } from 'react';
import type { Question, QuestionType } from '@/types/exam';
import { getCognitiveFramework } from '@/lib/education-catalog';
import { FigureEditor } from './FigureEditor';
import type { KnowledgePackage, KnowledgeScope } from '@/lib/knowledge-package';
import { bindQuestionKnowledge, reviewQuestionKnowledge } from '@/lib/question-knowledge';
import { listQuestionDrafts, questionValueStamp, resumeQuestionDraft, writeQuestionDraft, type QuestionDraft, type QuestionManualSubmission } from '@/lib/question-draft';
import { normalizeQuestion } from '@/lib/exam-document';

const types: [QuestionType, string][] = [['multiple_choice', 'Lựa chọn'], ['true_false_group', 'Đúng / Sai'], ['short_answer', 'Trả lời ngắn'], ['essay', 'Tự luận / thực hành'], ['fill_blank', 'Điền khuyết'], ['matching', 'Ghép nối'], ['ordering', 'Sắp xếp']];
const field = 'border rounded p-2 w-full bg-transparent text-sm';

export function QuestionEditor({ ownerId, documentId, sourceStamp, question, frameworkId, knowledgePackage, knowledgeScope, onSave, onApplied, onCancel }: { ownerId: string; documentId: string; sourceStamp: string; question: Question; frameworkId?: string; knowledgePackage?: KnowledgePackage; knowledgeScope?: KnowledgeScope; onSave: (value: QuestionManualSubmission) => void; onApplied: (previous: Question) => void; onCancel: () => void }) {
  const fresh = () => {
    const recovered = listQuestionDrafts(ownerId, documentId).find(entry => entry.value?.questionId === question.id);
    const restored = recovered?.value ? resumeQuestionDraft(recovered.value, question, sourceStamp) : null;
    const record: QuestionDraft = restored ? { ...restored.record, journalId: crypto.randomUUID(), token: crypto.randomUUID() } : { formatVersion: 1, ownerId, documentId, questionId: question.id, journalId: crypto.randomUUID(), token: crypto.randomUUID(), updatedAt: new Date().toISOString(), baseQuestion: structuredClone(question), baseSourceStamp: sourceStamp, draft: structuredClone(question) };
    return { record, recovered: !!recovered && !restored?.alreadyApplied };
  };
  const [editor, setEditor] = useState(fresh);
  const [warning, setWarning] = useState('');
  const [attempt, setAttempt] = useState<{ value: Question; token: string } | null>(null);
  const draft = editor.record.draft;
  const acknowledged = attempt !== null && questionValueStamp(question) === questionValueStamp(attempt.value);
  const appliedToken = useRef<string | null>(null);
  const stale = !acknowledged && (questionValueStamp(question) !== questionValueStamp(editor.record.baseQuestion) || sourceStamp !== editor.record.baseSourceStamp);
  useEffect(() => {
    if (acknowledged && attempt && appliedToken.current !== attempt.token) {
      appliedToken.current = attempt.token;
      onApplied(editor.record.baseQuestion);
    }
  }, [acknowledged, attempt, editor.record.baseQuestion, onApplied]);
  const setDraft = (value: Question) => {
    const record = { ...editor.record, ...(acknowledged ? { baseQuestion: structuredClone(question), baseSourceStamp: sourceStamp } : {}), token: crypto.randomUUID(), updatedAt: new Date().toISOString(), draft: value };
    try {
      const result = writeQuestionDraft(record);
      setWarning(result.durable ? '' : 'Nháp hiện chỉ được giữ trong tab này; bộ nhớ máy không lưu được. Hãy tải nháp trước khi rời trang.');
    } catch { setWarning('Dữ liệu nháp chưa lưu được trên máy. Giữ tab này và sửa giá trị chưa hợp lệ trước khi rời trang.'); }
    setEditor({ ...editor, record }); setAttempt(null);
  };
  const update = (value: Partial<Question>) => setDraft({ ...draft, ...value });
  const submit = () => {
    if (stale) return;
    const value: Question = { ...draft, status: 'draft', verifiedBy: 'none', version: (editor.record.baseQuestion.version ?? 1) + 1 };
    try { normalizeQuestion(value); } catch { setWarning('Nội dung câu chưa hợp lệ. Kiểm các phương án, đáp án và điểm; nháp vẫn được giữ.'); return; }
    setAttempt({ value, token: editor.record.token });
    onSave({ ownerId, documentId, questionId: question.id, baseStamp: questionValueStamp(editor.record.baseQuestion), baseSourceStamp: editor.record.baseSourceStamp, token: editor.record.token, value });
  };
  const framework = getCognitiveFramework(frameworkId);
  const knowledgeReview = reviewQuestionKnowledge(draft, knowledgePackage, knowledgeScope);
  const toggleLink = (kind: 'knowledgeIds' | 'outcomeIds', id: string, selected: boolean) => {
    if (!knowledgePackage) return;
    const next = selected ? [...(draft[kind] ?? []), id] : (draft[kind] ?? []).filter(value => value !== id);
    setDraft(bindQuestionKnowledge(draft, knowledgePackage, kind === 'knowledgeIds' ? next : draft.knowledgeIds ?? [], kind === 'outcomeIds' ? next : draft.outcomeIds ?? []));
  };
  return <div className="space-y-3">
    <p className="text-xs">Nháp từng câu được giữ riêng trên máy. Bấm Áp dụng câu rồi lưu đề để lưu nội dung này trên máy chủ; đóng bảng sửa vẫn giữ nháp.</p>
    {editor.recovered && <p role="status" className="text-xs">Đã mở lại nháp câu chưa áp dụng. Các bản nháp khác vẫn có trong bảng Nháp câu hỏi.</p>}
    {warning && <p role="alert" className="text-xs text-amber-700">{warning}</p>}
    {stale && <div role="alert" className="border rounded p-2 text-sm text-amber-700"><p>Câu hỏi hoặc cấu hình liên quan đã đổi. Chưa áp dụng để tránh ghi đè bản mới; nội dung nháp vẫn giữ trong bảng sửa này. Kiểm bản lưu ở Nháp câu hỏi trước khi rời trang.</p><details><summary>Xem câu hiện tại để đối chiếu</summary><p>{question.content}</p><p>{question.step_by_step_solution}</p></details></div>}
    {acknowledged && <p role="status" className="text-sm">Đã áp dụng câu vào bản soạn. Trạng thái lưu đề cho biết kết quả lưu trên máy chủ.</p>}
    <div className="grid grid-cols-2 gap-3">
      <label className="text-sm">Dạng câu<select aria-label="Dạng câu" className={field} value={draft.type} onChange={e => update({ type: e.target.value as QuestionType })}>{types.map(([value, name]) => <option key={value} value={value}>{name}</option>)}</select></label>
      <label className="text-sm">Điểm (có thể để trống)<input aria-label="Điểm câu" className={field} type="number" min="0" step="0.01" value={draft.points ?? ''} onChange={e => update({ points: e.target.value === '' ? undefined : e.target.valueAsNumber })} /></label>
    </div>
    <label className="block text-sm">Nội dung câu hỏi<textarea aria-label="Nội dung câu hỏi" rows={4} className={field} value={draft.content} onChange={e => update({ content: e.target.value })} /></label>
    {draft.type === 'multiple_choice' && <fieldset className="space-y-2"><legend>Các phương án</legend>
      {(draft.choices ?? []).map((choice, index) => <div key={choice.key} className="flex gap-2 items-center">
        <label className="sr-only" htmlFor={`choice-${question.id}-${choice.key}`}>Phương án {choice.key}</label><span>{choice.key}</span><input id={`choice-${question.id}-${choice.key}`} className={field} value={choice.text} onChange={e => update({ choices: draft.choices!.map((c, i) => i === index ? { ...c, text: e.target.value } : c) })} />
        <button type="button" onClick={() => update({ choices: draft.choices!.filter((_, i) => i !== index), correct_answer: draft.correct_answer === choice.key ? undefined : draft.correct_answer })}>Bỏ</button>
        <label className="text-xs whitespace-nowrap"><input type="checkbox" checked={choice.pinned ?? false} onChange={e => update({ choices: draft.choices!.map((c, i) => i === index ? { ...c, pinned: e.target.checked } : c) })} /> Giữ vị trí</label>
      </div>)}
      <button type="button" onClick={() => { const used = new Set(draft.choices?.map(c => c.key)); const key = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').find(k => !used.has(k)); if (key) update({ choices: [...(draft.choices ?? []), { key, text: '' }] }); }}>Thêm phương án</button>
      <label className="block text-sm">Đáp án<select className={field} aria-label="Đáp án lựa chọn" value={draft.correct_answer ?? ''} onChange={e => update({ correct_answer: e.target.value || undefined })}><option value="">Chưa đặt đáp án</option>{draft.choices?.map(c => <option key={c.key} value={c.key}>{c.key}</option>)}</select></label>
    </fieldset>}
    {draft.type === 'true_false_group' && <fieldset className="space-y-2"><legend>Các ý đúng / sai</legend>
      {(draft.sub_questions ?? []).map((item, index) => <div key={item.key} className="grid grid-cols-[1fr_auto_auto] gap-2">
        <label className="text-sm">Ý {item.key}<textarea aria-label={`Nội dung ý ${item.key}`} className={field} value={item.content} onChange={e => update({ sub_questions: draft.sub_questions!.map((s, i) => i === index ? { ...s, content: e.target.value } : s) })} /></label>
        <label className="text-sm">Đáp án<select aria-label={`Đáp án ý ${item.key}`} className={field} value={item.isCorrect === undefined ? '' : String(item.isCorrect)} onChange={e => update({ sub_questions: draft.sub_questions!.map((s, i) => i === index ? { ...s, isCorrect: e.target.value === '' ? undefined : e.target.value === 'true' } : s) })}><option value="">Chưa đặt</option><option value="true">Đúng</option><option value="false">Sai</option></select></label>
        <button type="button" onClick={() => update({ sub_questions: draft.sub_questions!.filter((_, i) => i !== index) })}>Bỏ ý</button>
      </div>)}
      <button type="button" onClick={() => { const used = new Set(draft.sub_questions?.map(s => s.key)); const key = 'abcdefghijklmnopqrstuvwxyz'.split('').find(k => !used.has(k)); if (key) update({ sub_questions: [...(draft.sub_questions ?? []), { key, content: '' }] }); }}>Thêm ý</button>
    </fieldset>}
    {['short_answer', 'fill_blank'].includes(draft.type) && <>
      <label className="block text-sm">Đáp án chính<input aria-label="Đáp án chính" className={field} value={draft.correct_answer ?? ''} onChange={e => update({ correct_answer: e.target.value || undefined })} /></label>
      <label className="block text-sm">Các cách trả lời được chấp nhận (mỗi dòng một cách)<textarea aria-label="Đáp án được chấp nhận" className={field} value={(draft.accepted_answers ?? []).join('\n')} onChange={e => update({ accepted_answers: e.target.value.split('\n') })} /></label>
    </>}
    {draft.type === 'matching' && <fieldset className="space-y-2"><legend>Cặp ghép đúng</legend>{(draft.matchingPairs ?? []).map((pair, index) => <div key={pair.id} className="flex gap-2">
      <input className={field} aria-label={`Vế trái ${index + 1}`} value={pair.left} onChange={e => update({ matchingPairs: draft.matchingPairs!.map((p, i) => i === index ? { ...p, left: e.target.value } : p) })} />
      <input className={field} aria-label={`Vế phải ${index + 1}`} value={pair.right} onChange={e => update({ matchingPairs: draft.matchingPairs!.map((p, i) => i === index ? { ...p, right: e.target.value } : p) })} />
      <button type="button" onClick={() => update({ matchingPairs: draft.matchingPairs!.filter((_, i) => i !== index) })}>Bỏ</button>
    </div>)}<button type="button" onClick={() => update({ matchingPairs: [...(draft.matchingPairs ?? []), { id: crypto.randomUUID(), left: '', right: '' }] })}>Thêm cặp</button></fieldset>}
    {draft.type === 'ordering' && <label className="block text-sm">Thứ tự đúng (mỗi dòng một mục)<textarea className={field} aria-label="Thứ tự đúng" value={(draft.correctOrder ?? []).join('\n')} onChange={e => update({ correctOrder: e.target.value.split('\n') })} /></label>}
    <label className="block text-sm">Lời giải / hướng dẫn thực hiện<textarea aria-label="Lời giải" rows={4} className={field} value={draft.step_by_step_solution ?? ''} onChange={e => update({ step_by_step_solution: e.target.value })} /></label>
    <FigureEditor figures={draft.figures ?? []} onChange={figures => update({ figures })} />
    <details><summary className="cursor-pointer">Tiêu chí chấm và kiến thức</summary><div className="space-y-2 mt-2">
      {(draft.rubric ?? []).map((criterion, index) => <div key={index} className="flex gap-2"><input aria-label={`Tiêu chí ${index + 1}`} className={field} value={criterion.criterion} onChange={e => update({ rubric: draft.rubric!.map((r, i) => i === index ? { ...r, criterion: e.target.value } : r) })} /><input aria-label={`Điểm tiêu chí ${index + 1}`} className={field} type="number" min="0" step="0.01" value={criterion.maxPoints} onChange={e => update({ rubric: draft.rubric!.map((r, i) => i === index ? { ...r, maxPoints: e.target.valueAsNumber || 0 } : r) })} /><button type="button" onClick={() => update({ rubric: draft.rubric!.filter((_, i) => i !== index) })}>Bỏ</button></div>)}
      <button type="button" onClick={() => update({ rubric: [...(draft.rubric ?? []), { criterion: '', maxPoints: 0 }] })}>Thêm tiêu chí</button>
      <label className="block text-sm">Yêu cầu cần đạt<input aria-label="Yêu cầu cần đạt" className={field} value={draft.learningOutcome ?? ''} onChange={e => update({ learningOutcome: e.target.value })} /></label>
      <p className="text-xs" role="status">{knowledgeReview.message}</p>
      {knowledgePackage ? <>
        {['stale', 'unknown'].includes(knowledgeReview.state) && <div className="text-xs border rounded p-2"><p>Giữ các mã cũ khi lưu nếu chưa muốn đổi: {[...(draft.knowledgeIds ?? []), ...(draft.outcomeIds ?? [])].join(', ')}. Chọn lại sẽ thay các liên kết này; có thể Hủy để giữ bản trước.</p><button type="button" className="underline mt-2" onClick={() => setDraft(bindQuestionKnowledge(draft, knowledgePackage, [], []))}>Chọn lại liên kết theo gói hiện tại</button></div>}
        <fieldset disabled={['stale', 'unknown'].includes(knowledgeReview.state)} className="max-h-64 overflow-auto border rounded p-2 space-y-2"><legend className="text-sm">Kiến thức của câu</legend>{knowledgePackage.knowledge.map(item => <label key={item.id} className="flex gap-2 text-sm"><input type="checkbox" checked={draft.knowledgeIds?.includes(item.id) ?? false} onChange={e => toggleLink('knowledgeIds', item.id, e.target.checked)} />{item.title}</label>)}</fieldset>
        <fieldset disabled={['stale', 'unknown'].includes(knowledgeReview.state)} className="max-h-64 overflow-auto border rounded p-2 space-y-2"><legend className="text-sm">Yêu cầu cần đạt liên kết</legend>{knowledgePackage.outcomes.map(item => <label key={item.id} className="flex gap-2 text-sm"><input type="checkbox" checked={draft.outcomeIds?.includes(item.id) ?? false} onChange={e => toggleLink('outcomeIds', item.id, e.target.checked)} />{item.text}</label>)}</fieldset>
        <p className="text-xs">Có thể giữ câu ngoài phạm vi để sửa sau; hệ thống sẽ báo cần kiểm lại. Việc gắn mã không tự xác nhận nội dung đúng.</p>
      </> : <p className="text-xs">Có thể tự mô tả yêu cầu bằng chữ. Muốn gắn mã, hãy chọn gói trong mục Kiến thức và phạm vi ra đề.</p>}
      {framework && <label className="block text-sm">{framework.label}<select aria-label="Mức nhận thức" className={field} value={draft.cognitiveLevel ?? ''} onChange={e => update({ cognitiveLevel: e.target.value || undefined })}><option value="">Chưa gắn mức</option>{framework.levels.map(level => <option key={level.id} value={level.id}>{level.label}</option>)}</select></label>}
    </div></details>
    <div className="flex flex-wrap gap-3 justify-end"><button type="button" onClick={onCancel}>Đóng, giữ nháp</button><button type="button" disabled={stale || acknowledged} className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50" onClick={submit}>Áp dụng câu vào đề</button></div>
  </div>;
}
