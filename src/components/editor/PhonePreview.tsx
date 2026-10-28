'use client';
import { createPortal } from 'react-dom';
import type { Exam } from '@/types/exam';
import { A4Preview } from '@/components/A4Preview';
import { useSidePanel } from '@/hooks/useSidePanel';
export function PhonePreview({ exam, open, onClose }: { exam: Exam; open: boolean; onClose: () => void }) {
  const { panelRef } = useSidePanel(open, onClose);
  if (!open) return null;
  return createPortal(<section ref={panelRef} role="dialog" aria-modal="true" aria-label="Xem đề toàn màn hình" className="no-print fixed inset-0 z-50 bg-[var(--ui-surface)] flex flex-col p-2 gap-2"><header className="flex justify-between items-center shrink-0"><h2>Xem đề</h2><button type="button" className="app-button-secondary px-3 min-h-10" onClick={onClose}>Đóng xem đề</button></header><div className="flex-1 min-h-0 [&_.a4-preview-container]:min-h-0"><A4Preview exam={exam} /></div></section>, document.body);
}
