'use client';
import { useState } from 'react';
import type { Exam } from '@/types/exam';
import { HeaderForm } from '@/components/HeaderSettingsModal';
import { applyHeaderSubmission, type HeaderSubmission } from '@/lib/header-layout';
export function EditorSettings({ ownerId, exam, canEdit, onChange, isOpen, onClose, onPreview }: { ownerId: string; exam: Exam; canEdit: boolean; onChange: React.Dispatch<React.SetStateAction<Exam>>; isOpen: boolean; onClose: () => void; onPreview: (submission: HeaderSubmission | null) => void }) {
  const [visited, setVisited] = useState(false);
  if (isOpen && !visited) setVisited(true);
  return <aside aria-label="Thiết lập đề" className={isOpen ? 'no-print min-w-0 rounded-xl border bg-[var(--ui-surface)]' : 'hidden'}><header className="flex items-center justify-between p-4 border-b"><h2 className="font-semibold">Thông tin và đầu đề</h2><button type="button" aria-label="Đóng thiết lập đề" onClick={onClose}>Đóng</button></header>{visited && <fieldset disabled={!canEdit} className="min-w-0 p-3"><HeaderForm embedded onPreview={isOpen ? onPreview : undefined} isOpen metadata={exam.metadata} documentId={exam.id} ownerId={ownerId} onClose={onClose} onSaveMetadata={submission => onChange(previous => applyHeaderSubmission(previous, submission))} /></fieldset>}</aside>;
}
