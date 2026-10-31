'use client';
import { useEffect, useRef, useState } from 'react';

export type Collaborator = {
  userId: string;
  name: string;
  focus: string | null;
  editing: boolean;
  since: string;
};

const PERIOD_MS = 8000;

/**
 * Tell the server which object this tab is on and learn who else has the exam open.
 * Not realtime: a report goes out every few seconds and right after the selection changes.
 */
export function useExamPresence(
  examId: string | undefined,
  focus: string,
  editing: boolean,
  seenVersion?: number,
) {
  const [people, setPeople] = useState<Collaborator[]>([]);
  const [lastSavedBy, setLastSavedBy] = useState<string | null>(null);
  const latest = useRef({ focus, editing, seenVersion });
  useEffect(() => {
    latest.current = { focus, editing, seenVersion };
  }, [focus, editing, seenVersion]);

  useEffect(() => {
    if (!examId || examId.startsWith('draft_')) return;
    let stopped = false;
    const send = async (leave = false) => {
      if (!leave && (stopped || !navigator.onLine || document.visibilityState === 'hidden')) return;
      const body = leave
        ? { leave: true }
        : {
            focus: latest.current.focus,
            editing: latest.current.editing,
            seenVersion: latest.current.seenVersion,
          };
      try {
        const response = await fetch(`/api/exams/${encodeURIComponent(examId)}/presence`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          keepalive: leave,
        });
        if (leave || stopped || !response.ok) return;
        const data = (await response.json()) as { people?: Collaborator[]; lastSavedBy?: string | null };
        setPeople(data.people ?? []);
        setLastSavedBy(data.lastSavedBy ?? null);
      } catch {
        /* Presence is a courtesy; never disturb editing. */
      }
    };
    void send();
    const timer = setInterval(() => void send(), PERIOD_MS);
    const leave = () => void send(true);
    window.addEventListener('pagehide', leave);
    return () => {
      stopped = true;
      clearInterval(timer);
      window.removeEventListener('pagehide', leave);
      void send(true);
    };
  }, [examId]);

  // A move to another object or a start/stop of typing is reported soon, not at the next tick.
  useEffect(() => {
    if (!examId || examId.startsWith('draft_')) return;
    const timer = setTimeout(() => {
      void fetch(`/api/exams/${encodeURIComponent(examId)}/presence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ focus, editing, seenVersion }),
      })
        .then((response) => (response.ok ? response.json() : null))
        .then((data: { people?: Collaborator[]; lastSavedBy?: string | null } | null) => {
          if (!data) return;
          setPeople(data.people ?? []);
          setLastSavedBy(data.lastSavedBy ?? null);
        })
        .catch(() => undefined);
    }, 500);
    return () => clearTimeout(timer);
  }, [examId, focus, editing, seenVersion]);

  return { people, lastSavedBy };
}
