'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

function Confirmation({ message, finish }: { message: string; finish: (accepted: boolean) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { dialog.current?.showModal(); }, []);
  return <dialog ref={dialog} onCancel={event => { event.preventDefault(); finish(false); }} className="app-dialog w-full max-w-md fixed inset-0 m-auto p-6 backdrop:bg-black/50" aria-labelledby="admin-confirm-title">
    <h2 id="admin-confirm-title" className="text-lg font-semibold mb-3">Xác nhận thao tác</h2>
    <p className="text-sm [overflow-wrap:anywhere]">{message}</p>
    <div className="flex flex-wrap justify-end gap-3 mt-6">
      <button autoFocus className="app-button-secondary px-4 py-2 text-sm" onClick={() => finish(false)}>Hủy</button>
      <button className="app-button-primary px-4 py-2 text-sm" onClick={() => finish(true)}>Xác nhận</button>
    </div>
  </dialog>;
}

export function useConfirmAction() {
  const [message, setMessage] = useState<string | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);
  const confirmAction = useCallback((text: string) => new Promise<boolean>(resolve => {
    resolver.current?.(false); resolver.current = resolve; setMessage(text);
  }), []);
  const finish = useCallback((value: boolean) => {
    const resolve = resolver.current; resolver.current = null; setMessage(null); resolve?.(value);
  }, []);
  useEffect(() => () => { resolver.current?.(false); }, []);
  return { confirmAction, confirmation: message === null ? null : <Confirmation message={message} finish={finish} /> };
}
