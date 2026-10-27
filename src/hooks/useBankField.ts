'use client';
import { useCallback, useState, type SetStateAction } from 'react';
import { useSearchParams } from 'next/navigation';

/** Management filters survive navigation/reload; the editor picker stays local. */
export function useBankField<T extends string | number>(key: string, initial: T, pageMode: boolean): [T, (next: SetStateAction<T>) => void] {
  const query = useSearchParams();
  const [local, setLocal] = useState<T>(initial);
  const raw = query.get(key);
  const value = pageMode ? (typeof initial === 'number' ? Math.max(1, Math.floor(Number(raw) || 1)) : raw ?? initial) as T : local;
  const setValue = useCallback((next: SetStateAction<T>) => {
    const resolved = typeof next === 'function' ? next(value) : next;
    if (!pageMode) { setLocal(resolved); return; }
    const params = new URLSearchParams(window.location.search);
    if (String(resolved) === String(initial)) params.delete(key); else params.set(key, String(resolved));
    if (key !== 'page') params.delete('page');
    if (key === 'grade') params.delete('subject');
    const target = '/teacher/questions' + (params.size ? '?' + params : '');
    if (target === window.location.pathname + window.location.search) return;
    if (key === 'search') window.history.replaceState(null, '', target); else window.history.pushState(null, '', target);
  }, [value, initial, key, pageMode]);
  return [value, setValue];
}
