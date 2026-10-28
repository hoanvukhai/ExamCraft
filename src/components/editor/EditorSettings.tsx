'use client';
import { useEffect, useRef, useState } from 'react';
import type { Exam } from '@/types/exam';
import { HeaderForm } from '@/components/HeaderSettingsModal';
import { ExamStructureEditor } from '@/components/ExamStructureEditor';
import { ExamTemplatePanel } from '@/components/ExamTemplatePanel';
import { KnowledgeScopeEditor } from '@/components/KnowledgeScopeEditor';
import { ExamPlanEditor } from '@/components/ExamPlanEditor';
import { applyHeaderSubmission } from '@/lib/header-layout';
import { useSidePanel } from '@/hooks/useSidePanel';
export type SettingsTab = 'info' | 'structure' | 'matrix' | 'scope' | 'template';
const tabs = [{ id: 'info', name: 'Thông tin', hint: 'Môn, lớp, thời lượng, cách đánh giá và các dòng in.' }, { id: 'structure', name: 'Phần & ngữ liệu', hint: 'Chia đề thành các phần; dùng một bài đọc cho nhiều câu.' }, { id: 'matrix', name: 'Ma trận', hint: 'Đặt mục tiêu số câu, điểm và đối chiếu với đề thực tế.' }, { id: 'scope', name: 'Phạm vi kiến thức', hint: 'Chọn bài được phép ra và loại trừ phần chưa học. Tùy chọn.' }, { id: 'template', name: 'Mẫu', hint: 'Dùng mẫu đã lưu hoặc lưu cấu hình đề này làm mẫu.' }] as const;
export function EditorSettings({ ownerId, exam, canEdit, hasActiveKey, onChange, isOpen, tab, onTab, onClose }: { ownerId: string; exam: Exam; canEdit: boolean; hasActiveKey: boolean; onChange: React.Dispatch<React.SetStateAction<Exam>>; isOpen: boolean; tab: SettingsTab; onTab: (tab: SettingsTab) => void; onClose: () => void }) {
  const { panelRef, modal } = useSidePanel(isOpen, onClose);
  const body = useRef<HTMLDivElement>(null);
  const [visited, setVisited] = useState<SettingsTab[]>([]);
  useEffect(() => { if (isOpen) { setVisited(previous => previous.includes(tab) ? previous : [...previous, tab]); } }, [isOpen, tab]);
  useEffect(() => { const outer = body.current?.querySelector<HTMLElement>(`[data-settings-tab="${tab}"]`); const details = outer?.querySelector('details'); if (details) details.open = true; }, [isOpen, tab, visited]);
  return <aside ref={panelRef} role={isOpen && modal ? 'dialog' : undefined} aria-modal={isOpen && modal || undefined} aria-label="Thiết lập đề" className={isOpen ? 'no-print fixed inset-0 z-40 flex flex-col w-full lg:relative lg:inset-auto lg:z-auto lg:w-[480px] shrink-0 h-full min-h-0 border-l bg-[var(--ui-surface)]' : 'hidden'}><header className="flex items-center justify-between p-4 border-b"><h2 className="font-semibold">Thiết lập đề</h2><button type="button" aria-label="Đóng thiết lập đề" onClick={onClose}>Đóng</button></header><nav aria-label="Các thẻ thiết lập" className="flex overflow-x-auto p-2 gap-1 shrink-0">{tabs.map(item => <button type="button" key={item.id} aria-pressed={tab === item.id} onClick={() => onTab(item.id)} className={(tab === item.id ? 'app-button-tonal' : 'app-button-secondary') + ' px-3 min-h-10 text-xs whitespace-nowrap'}>{item.name}</button>)}</nav><div ref={body} className="overflow-auto min-h-0 p-3 flex-1"><p className="text-sm mb-3">{tabs.find(item => item.id === tab)?.hint}</p>{tabs.filter(item => visited.includes(item.id)).map(item => <div key={item.id} hidden={item.id !== tab} data-settings-tab={item.id}><fieldset disabled={!canEdit} className="min-w-0">{item.id === 'info' ? <HeaderForm embedded isOpen metadata={exam.metadata} documentId={exam.id} ownerId={ownerId} onClose={onClose} onSaveMetadata={submission => onChange(previous => applyHeaderSubmission(previous, submission))} /> : item.id === 'structure' ? <ExamStructureEditor exam={exam} onChange={onChange} /> : item.id === 'matrix' ? <ExamPlanEditor exam={exam} onChange={onChange} /> : item.id === 'scope' ? <KnowledgeScopeEditor exam={exam} ownerId={ownerId} hasActiveKey={hasActiveKey} onChange={onChange} /> : <ExamTemplatePanel exam={exam} ownerId={ownerId} onChange={onChange} />}</fieldset></div>)}</div></aside>;
}
