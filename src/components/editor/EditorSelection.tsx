'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from 'react';

export type ContextCommand = {
  label: string;
  run: () => void;
  disabled?: boolean;
};
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
    return {
      actors: new Map<string, Actor>(),
      snapshot: () => version,
      subscribe: (listener: () => void) => {
        listeners.add(listener);
        return () => {
          listeners.delete(listener);
        };
      },
      notify: () => {
        version++;
        listeners.forEach((listener) => listener());
      },
    };
  });
  return <Selection.Provider value={{ target, select, ...registry }}>{children}</Selection.Provider>;
}

// The registry retains a live command reader, never a snapshot of question data.
export function useEditorActor(id: string, label: string, commands: (field?: string) => ContextCommand[]) {
  const context = useContext(Selection);
  const reader = useRef(commands);
  const notify = context?.notify;
  useLayoutEffect(() => {
    reader.current = commands;
    (reader as Actor).label = label;
    notify?.();
  });
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
      select?.((previous) => (previous?.id === id ? null : previous));
    };
  }, [actors, id, select, notify]);
  const choose = useCallback((field?: string) => select?.({ id, label, field }), [select, id, label]);
  return {
    choose,
    active: context?.target?.id === id,
    enabled: Boolean(context),
  };
}

const noSubscribe = () => () => {};
const zeroSnapshot = () => 0;
/** The commands of the text field the cursor is in (bold, italic, formula…), live, for the tool row. */
export function useFieldCommands() {
  const context = useContext(Selection);
  useSyncExternalStore(context?.subscribe ?? noSubscribe, context?.snapshot ?? zeroSnapshot, zeroSnapshot);
  const target = context?.target;
  const actor = target ? context.actors.get(target.id) : undefined;
  const commands = target ? (actor?.current(target.field) ?? []) : [];
  return {
    label: actor?.label ?? target?.label ?? '',
    commands,
    run: (index: number, label: string) => {
      if (!target) return;
      const live = context.actors.get(target.id)?.current(target.field)[index];
      if (live && !live.disabled && live.label === label) live.run();
    },
  };
}

export function useEditorTarget() {
  return useContext(Selection)?.target ?? null;
}

export function EditorNodeScope({
  id,
  label,
  commands,
  children,
  className,
  ...attributes
}: {
  id: string;
  label: string;
  commands: ContextCommand[];
  children: ReactNode;
  className?: string;
  'data-outline-node'?: string;
  'data-outline-kind'?: string;
}) {
  const actor = useEditorActor(id, label, () => commands);
  return (
    <section
      {...attributes}
      className={
        className + (actor.active ? ' outline outline-1 outline-[var(--ui-text-secondary)] rounded-lg' : '')
      }
      onClickCapture={() => actor.choose()}
      onFocusCapture={() => actor.choose()}
    >
      {children}
    </section>
  );
}
