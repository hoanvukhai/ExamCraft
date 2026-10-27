'use client';
import { useEffect, useRef, useSyncExternalStore } from 'react';

const query = '(min-width: 1024px)';
const subscribe = (notify: () => void) => { const media = matchMedia(query); media.addEventListener('change', notify); return () => media.removeEventListener('change', notify); };
const desktopSnapshot = () => matchMedia(query).matches;
const serverSnapshot = () => false;

/** Dock on desktop; on narrow screens keep keyboard focus in the full-screen panel. */
export function useSidePanel(open: boolean, onClose: () => void) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  const modal = !useSyncExternalStore(subscribe, desktopSnapshot, serverSnapshot);
  useEffect(() => {
    const panel = panelRef.current;
    if (!open || !panel) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const controls = () => Array.from(panel.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), a[href], [tabindex="0"]')).filter(element => element.getClientRects().length > 0);
    controls()[0]?.focus();
    const keyboard = (event: KeyboardEvent) => {
      if (!panel.contains(document.activeElement)) return;
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeRef.current(); }
      if (modal && event.key === 'Tab') {
        const items = controls(), first = items[0], last = items.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', keyboard);
    return () => { document.removeEventListener('keydown', keyboard); if ((panel.contains(document.activeElement) || document.activeElement === document.body) && previous?.isConnected && previous.getClientRects().length) previous.focus(); };
  }, [open, modal]);
  return { panelRef, modal };
}
