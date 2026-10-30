'use client';
import { useCallback, useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react';

/** A width that survives reloads. Only a per-viewer convenience: a failed read or write just keeps the default. */
export function useStoredWidth(key: string, fallback: number, min: number, max: number) {
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem(key));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved >= min && saved <= max) setWidth(saved);
    } catch {
      /* default width */
    }
  }, [key, min, max]);
  const change = useCallback(
    (value: number) => {
      const next = Math.min(max, Math.max(min, Math.round(value)));
      setWidth(next);
      try {
        localStorage.setItem(key, String(next));
      } catch {
        /* ignore */
      }
    },
    [key, max, min],
  );
  return [width, change] as const;
}

/** A side panel that docks beside the sheet on wide screens. The drag handle (and the arrow keys) change its width. */
export function ResizablePanel({
  side,
  label,
  width,
  onWidth,
  min,
  max,
  className = '',
  children,
}: {
  side: 'left' | 'right';
  label: string;
  width: number;
  onWidth: (value: number) => void;
  min: number;
  max: number;
  className?: string;
  children: ReactNode;
}) {
  const start = useRef<{ x: number; width: number } | null>(null);
  const edge = side === 'left' ? 'right-0 translate-x-1/2' : 'left-0 -translate-x-1/2';
  return (
    <aside
      aria-label={label}
      style={{ ['--panel-width' as string]: width + 'px' }}
      className={`no-print relative min-h-0 min-w-0 flex-col bg-[var(--ui-surface)] ${
        side === 'left' ? 'border-r' : 'border-l'
      } w-full lg:w-[var(--panel-width)] lg:shrink-0 ${className}`}
    >
      {children}
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label={'Đổi độ rộng ' + label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={width}
        tabIndex={0}
        title="Kéo để đổi độ rộng"
        className={`hidden lg:block absolute top-0 bottom-0 w-2 ${edge} z-20 cursor-col-resize hover:bg-[var(--ui-accent)]/30 focus-visible:bg-[var(--ui-accent)]/40 outline-none`}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          start.current = { x: event.clientX, width };
        }}
        onPointerMove={(event) => {
          if (!start.current) return;
          const delta = event.clientX - start.current.x;
          onWidth(start.current.width + (side === 'left' ? delta : -delta));
        }}
        onPointerUp={() => {
          start.current = null;
        }}
        onKeyDown={(event) => {
          const step = event.shiftKey ? 64 : 16;
          if (event.key === 'ArrowLeft') onWidth(width + (side === 'left' ? -step : step));
          if (event.key === 'ArrowRight') onWidth(width + (side === 'left' ? step : -step));
        }}
      />
    </aside>
  );
}

export type RailItem<T extends string> = {
  id: T;
  label: string;
  Icon: ComponentType<{ className?: string }>;
};

/** The icon column on the far left. Pressing the open tab again folds the panel away. */
export function EditorRail<T extends string>({
  items,
  tab,
  open,
  onTab,
}: {
  items: RailItem<T>[];
  tab: T;
  open: boolean;
  onTab: (id: T) => void;
}) {
  return (
    <nav
      aria-label="Bảng tài nguyên"
      className="no-print hidden lg:flex flex-col items-center gap-1 w-[72px] shrink-0 border-r bg-[var(--ui-surface)] py-2"
    >
      {items.map(({ id, label, Icon }) => {
        const active = open && tab === id;
        return (
          <button
            key={id}
            type="button"
            aria-label={label}
            title={label}
            aria-pressed={active}
            onClick={() => onTab(id)}
            className={`w-16 min-h-14 rounded-xl flex flex-col items-center justify-center gap-0.5 text-[10px] leading-tight cursor-pointer ${
              active
                ? 'app-button-tonal font-semibold'
                : 'text-[var(--ui-text-secondary)] hover:bg-[var(--ui-surface-variant)] hover:text-[var(--ui-text-primary)]'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="max-w-full px-0.5 whitespace-nowrap">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
