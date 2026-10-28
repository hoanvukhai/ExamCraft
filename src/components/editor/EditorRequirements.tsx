'use client';
import { useEffect, useRef, useState } from 'react';
import type { Exam } from '@/types/exam';
import { KnowledgeScopeEditor } from '@/components/KnowledgeScopeEditor';
import { ExamPlanEditor } from '@/components/ExamPlanEditor';
import { ExamTemplatePanel } from '@/components/ExamTemplatePanel';
import { COGNITIVE_FRAMEWORKS } from '@/lib/education-catalog';
import { applyHeaderSubmission, headerEditableSnapshot } from '@/lib/header-layout';

type Props = { ownerId: string; exam: Exam; canEdit: boolean; onChange: React.Dispatch<React.SetStateAction<Exam>> };
export function EditorRequirements({ ownerId, exam, canEdit, hasActiveKey, onChange }: Props & { hasActiveKey: boolean }) {
  const [visited, setVisited] = useState(false);
  const frameworks = COGNITIVE_FRAMEWORKS.filter(item => item.grades.includes(exam.metadata.grade));
  const invalid = !!exam.metadata.cognitiveFrameworkId && !frameworks.some(item => item.id === exam.metadata.cognitiveFrameworkId);
  return <details aria-label="Yêu cầu ra đề" className="rounded-xl border p-4 min-w-0 bg-[var(--ui-surface)]" onToggle={event => { if (event.currentTarget.open) setVisited(true); }}><summary className="cursor-pointer font-semibold text-sm">Yêu cầu ra đề <span className="font-normal text-[var(--ui-text-secondary)]">· tùy chọn</span></summary><p className="text-xs my-3 text-[var(--ui-text-secondary)]">Chọn nội dung được ra, mức nhận thức và phân bổ câu hỏi. Có thể bỏ qua để soạn trực tiếp.</p>{visited && <fieldset disabled={!canEdit} className="space-y-3 min-w-0"><KnowledgeScopeEditor exam={exam} ownerId={ownerId} hasActiveKey={hasActiveKey} onChange={onChange} /><label className="block text-sm">Khung mức nhận thức<select aria-label="Khung mức nhận thức" className="block w-full min-w-0 border rounded p-2 mt-1 bg-[var(--ui-surface)]" value={exam.metadata.cognitiveFrameworkId ?? ''} onChange={event => { const submission = { documentId: exam.id, base: headerEditableSnapshot(exam.metadata), patch: { cognitiveFrameworkId: event.target.value || undefined } }; onChange(previous => applyHeaderSubmission(previous, submission)); }}><option value="">Không sử dụng / chưa chọn</option>{invalid && <option value={exam.metadata.cognitiveFrameworkId}>Khung cũ cần rà soát: {exam.metadata.cognitiveFrameworkId}</option>}{frameworks.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>{invalid && <p role="alert" className="text-xs">Khung đang lưu chưa phù hợp lớp hiện tại. Chọn lại khi cần; dữ liệu cũ vẫn được giữ.</p>}<ExamPlanEditor exam={exam} onChange={onChange} /></fieldset>}</details>;
}

export function EditorTemplate({ ownerId, exam, canEdit, onChange, open, onClose }: Props & { open: boolean; onClose: () => void }) {
  const [visited, setVisited] = useState(false);
  const body = useRef<HTMLDivElement>(null);
  if (open && !visited) setVisited(true);
  useEffect(() => { const details = body.current?.querySelector('details'); if (open && details) details.open = true; }, [open, visited]);
  return <section aria-label="Dùng và lưu mẫu đề" className={open ? 'min-w-0 border rounded-xl p-4 space-y-3 bg-[var(--ui-surface)]' : 'hidden'}><header className="flex items-center justify-between gap-3"><h2 className="text-sm font-semibold">Dùng và lưu mẫu đề</h2><button type="button" onClick={onClose}>Đóng mẫu</button></header><p className="text-xs">Mẫu dùng lại cấu hình và bố cục. Muốn dùng lại cả câu hỏi, hãy nhân bản đề trong kho.</p>{visited && <div ref={body}><fieldset disabled={!canEdit} className="min-w-0"><ExamTemplatePanel ownerId={ownerId} exam={exam} onChange={onChange} /></fieldset></div>}</section>;
}
