'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { SaveState } from '@/components/useExamPersistence';
export function EditorSaveStatus({ state, children }: { state: SaveState; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null), popup = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => { if (!trigger.current?.contains(event.target as Node) && !popup.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); trigger.current?.focus(); } };
    document.addEventListener('mousedown', close); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', escape); };
  }, [open]);
  return <><button ref={trigger} type="button" aria-label="Trạng thái lưu" aria-expanded={open} title="Lưu các thay đổi lên máy chủ" onClick={() => setOpen(value => !value)} className="no-print shrink-0 min-h-9 text-xs flex items-center gap-1"><span className={state === 'saved' ? 'text-emerald-600' : ['error','offline','conflict'].includes(state) ? 'text-amber-600' : ''}>●</span><span className="hidden @min-[500px]:inline">{state === 'saved' ? 'Đã lưu' : state === 'saving' ? 'Đang lưu…' : state === 'dirty' ? 'Đang chờ lưu' : 'Cần xử lý lưu'}</span></button>{open && createPortal(<div ref={popup} role="region" aria-label="Chi tiết lưu đề" className="no-print app-menu fixed z-50 left-3 right-3 sm:left-auto sm:right-16 sm:w-[min(36rem,calc(100vw-2rem))] top-14 max-h-[80dvh] overflow-auto rounded-xl border p-4 bg-[var(--ui-surface)] shadow-lg">{children}</div>, document.body)}</>;
}
