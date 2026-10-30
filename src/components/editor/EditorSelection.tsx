'use client';

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode, type Dispatch, type SetStateAction } from 'react';
import { ToolMenu } from '../EditorToolbar';
import { MoreHorizontal } from 'lucide-react';

export type ContextCommand = { label: string; run: () => void; disabled?: boolean };
type Target = { id: string; label: string; field?: string };
type Actor = { current: (field?: string) => ContextCommand[]; label?: string };
type SelectionContext = {
  target: Target | null;
  select: Dispatch<SetStateAction<Target | null>>;
  actors: Map<string, Actor>;
  notify: () => void;
  subscribe: (listener: () => void) => () => void;
  snapshot: () => number;
};
const Selection = createContext<SelectionContext | null>(null);

export function EditorSelectionProvider({ children }: { children: ReactNode }) {
  const [target, select] = useState<Target | null>(null);
  const [registry] = useState(() => {
    let version = 0;
    const listeners = new Set<() => void>();
    return { actors: new Map<string, Actor>(), snapshot: () => version,
      subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
      notify: () => { version++; listeners.forEach(listener => listener()); } };
  });
  return <Selection.Provider value={{ target, select, ...registry }}>{children}</Selection.Provider>;
}

// The registry retains a live command reader, never a snapshot of question data.
export function useEditorActor(id: string, label: string, commands: (field?: string) => ContextCommand[]) {
  const context = useContext(Selection);
  const reader = useRef(commands);
  const notify = context?.notify;
  useLayoutEffect(() => { reader.current = commands; (reader as Actor).label = label; notify?.(); });
  const actors = context?.actors;
  const select = context?.select;
  useEffect(() => {
    if (!actors) return;
    actors.set(id, reader);
    notify?.();
    return () => {
      actors.delete(id);
      notify?.();
      // A deleted target cannot leave commands pointing at a different question.
      select?.((previous) => previous?.id === id ? null : previous);
    };
  }, [actors, id, select, notify]);
  const choose = useCallback((field?: string) => select?.({ id, label, field }), [select, id, label]);
  return { choose, active: context?.target?.id === id, enabled: Boolean(context) };
}

const noSubscribe = () => () => {};
const zeroSnapshot = () => 0;
export function ContextSelectionToolbar({ canEdit }: { canEdit: boolean }) {
  const context = useContext(Selection);
  useSyncExternalStore(context?.subscribe ?? noSubscribe, context?.snapshot ?? zeroSnapshot, zeroSnapshot);
  if (!context?.target) return <div className="no-print shrink-0 h-28 border-b bg-[var(--ui-surface)] px-3 py-2 space-y-2" aria-label="Công cụ vùng chọn">
    <p className="text-xs min-h-10 flex items-center">Toàn đề</p>
    <p className="text-xs text-[var(--ui-text-secondary)]">Chọn câu, phương án hoặc ngữ liệu để mở công cụ tương ứng.</p>
  </div>;
  const { target, actors, select } = context;
  const actor = actors.get(target.id);
  const liveLabel = actor?.label ?? target.label;
  const commands = actor?.current(target.field) ?? [];
  return <div className="no-print shrink-0 h-28 border-b bg-[var(--ui-surface)] px-3 py-2 space-y-2" aria-label="Công cụ vùng chọn">
    <div className="flex min-w-0 items-center gap-2 text-xs">
      <button type="button" className="app-button-secondary rounded-lg px-3 min-h-10" onClick={() => select(null)}>Toàn đề</button>
      <span aria-hidden>›</span><span role="status" className="min-w-0 truncate" title={liveLabel + (target.field ? ` › ${target.field}` : '')}>{liveLabel}{target.field ? ` › ${target.field}` : ''}</span>
    </div>
    <div className="flex min-w-0 gap-2" role="group" aria-label={'Thao tác ' + liveLabel}>
      {commands.slice(0, 2).map((command, index) => <button key={command.label} type="button"
        className="app-button-secondary rounded-lg px-3 min-h-10 text-xs min-w-0 max-w-[42%] truncate"
        disabled={!canEdit || command.disabled}
        onClick={() => {
          const live = actors.get(target.id)?.current(target.field)[index];
          if (canEdit && live && !live.disabled && live.label === command.label) live.run();
        }}>{command.label}</button>)}
      {commands.length > 2 && <ToolMenu label="Khác" Icon={MoreHorizontal} items={commands.slice(2).map((command, offset) => ({
            label: command.label, disabled: !canEdit || command.disabled,
            onClick: () => {
              const live = actors.get(target.id)?.current(target.field)[offset + 2];
              if (canEdit && live && !live.disabled && live.label === command.label) live.run();
            } }))} />}
    </div>
  </div>;
}

export function useEditorTarget() { return useContext(Selection)?.target ?? null; }

export function EditorNodeScope({ id, label, commands, children, className, ...attributes }: {
  id: string; label: string; commands: ContextCommand[]; children: ReactNode; className?: string;
  'data-outline-node'?: string; 'data-outline-kind'?: string;
}) {
  const actor = useEditorActor(id, label, () => commands);
  return <section {...attributes} className={className + (actor.active ? ' outline outline-1 outline-[var(--ui-text-secondary)] rounded-lg' : '')}
    onClickCapture={() => actor.choose()} onFocusCapture={() => actor.choose()}>{children}</section>;
}
