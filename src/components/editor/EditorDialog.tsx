'use client';
import { useEffect, useRef, type ReactNode } from 'react';
export function EditorDialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement;
    dialog.current?.showModal();
    return () => { if (previous instanceof HTMLElement && previous.isConnected) previous.focus(); };
  }, []);
  return <dialog ref={dialog} aria-label={title} onCancel={event => { event.preventDefault(); onClose(); }}
    className="app-dialog w-full max-w-lg m-auto fixed inset-0 p-5 backdrop:bg-black/50">
    <header className="flex items-center justify-between gap-3 mb-3">
      <h2 className="font-semibold">{title}</h2><button type="button" onClick={onClose}>Đóng</button>
    </header>
    {children}
  </dialog>;
}
