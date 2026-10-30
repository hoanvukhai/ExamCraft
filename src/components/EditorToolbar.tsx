'use client';
import { useEffect, useRef, useState, type ComponentType } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, MoreHorizontal, Plus, Sparkles, Type } from 'lucide-react';
import { useFieldCommands } from './editor/EditorSelection';
export type ExportView = 'exam' | 'answers' | 'solutions' | 'matrix' | 'parallel';
type Icon = ComponentType<{ className?: string }>;
export interface MenuItem {
  label: string;
  title?: string;
  onClick: () => void;
  disabled?: boolean;
}
const button =
  'app-button-secondary shrink-0 !whitespace-nowrap inline-flex items-center gap-1.5 min-h-9 px-2.5 rounded-lg text-xs ' +
  'font-medium cursor-pointer disabled:opacity-40';
export function ToolMenu({
  label,
  Icon,
  items,
  compact = false,
  className,
}: {
  label: string;
  Icon: Icon;
  items: MenuItem[];
  compact?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false),
    [where, setWhere] = useState<{
      top?: number;
      bottom?: number;
      left: number;
    }>({ left: 0 });
  const trigger = useRef<HTMLButtonElement>(null),
    menu = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    menu.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
    const away = (event: MouseEvent) => {
      if (!trigger.current?.contains(event.target as Node) && !menu.current?.contains(event.target as Node))
        setOpen(false);
    };
    const dismiss = () => setOpen(false);
    const fieldset = trigger.current?.closest('fieldset');
    const permissions = new MutationObserver(() => {
      if (trigger.current?.matches(':disabled')) setOpen(false);
    });
    if (fieldset)
      permissions.observe(fieldset, {
        attributes: true,
        attributeFilter: ['disabled'],
      });
    document.addEventListener('mousedown', away);
    window.addEventListener('resize', dismiss);
    return () => {
      permissions.disconnect();
      document.removeEventListener('mousedown', away);
      window.removeEventListener('resize', dismiss);
    };
  }, [open]);
  return (
    <>
      <button
        ref={trigger}
        type="button"
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          const rect = trigger.current!.getBoundingClientRect();
          const left = Math.max(8, Math.min(rect.left, innerWidth - 256));
          // A trigger in the lower half (the phone tool row) opens its menu upward.
          setWhere(
            rect.top > innerHeight * 0.55
              ? { bottom: innerHeight - rect.top + 4, left }
              : {
                  top: Math.max(8, Math.min(rect.bottom + 4, innerHeight - 330)),
                  left,
                },
          );
          setOpen((value) => !value);
        }}
        className={className || button}
      >
        <Icon className="w-4 h-4 shrink-0" />
        {!compact && <span className="@max-[300px]:hidden">{label}</span>}
        {!compact && <ChevronDown className="w-3 h-3" />}
      </button>
      {open &&
        createPortal(
          <div
            ref={menu}
            role="menu"
            aria-label={label}
            style={{ ...where, maxHeight: 'min(75dvh, 320px)' }}
            className="app-menu fixed w-60 max-h-[min(75dvh,320px)] overflow-auto rounded-xl border bg-[var(--ui-surface)] p-1.5 shadow-lg z-50"
            onKeyDown={(event) => {
              const items = Array.from(
                menu.current!.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'),
              );
              const index = items.indexOf(document.activeElement as HTMLButtonElement);
              if (event.key === 'Escape') {
                event.preventDefault();
                setOpen(false);
                trigger.current?.focus();
              }
              if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
                event.preventDefault();
                items[
                  event.key === 'Home'
                    ? 0
                    : event.key === 'End'
                      ? items.length - 1
                      : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length
                ]?.focus();
              }
            }}
          >
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                title={item.title}
                aria-label={item.label}
                disabled={item.disabled}
                onClick={() => {
                  setOpen(false);
                  if (!trigger.current?.matches(':disabled')) item.onClick();
                }}
                className="w-full text-left min-h-10 px-3 rounded-lg text-sm hover:bg-[var(--ui-surface-variant)] disabled:opacity-40"
              >
                {item.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}
export interface ToolCommand {
  label: string;
  title?: string;
  onClick: () => void;
  disabled?: boolean;
}
interface Props {
  canEdit: boolean;
  /** The "Thêm" menu for the current selection: new content goes exactly where the selection says. */
  addItems: MenuItem[];
  aiOpen: boolean;
  onAi: () => void;
  /** Toàn đề › Phần I › Câu 3: every step selects that level. */
  steps: { code: string; label: string }[];
  onStep: (code: string) => void;
  /** Tools of the selected object, in the order of the spec table; what does not fit goes under "Khác". */
  commands: ToolCommand[];
  inlineCount?: number;
  /** Phones only: open the panel with the details of the selection. */
  onPanel?: () => void;
}

/** The one tool row: two fixed anchors (add content, AI), the path of the selection, and the tools of what is selected. It never gets a second row. */
export function EditorToolbar(p: Props) {
  const field = useFieldCommands();
  const inline = p.commands.slice(0, p.inlineCount ?? 5);
  const more = p.commands.slice(inline.length);
  const last = p.steps.length - 1;
  return (
    <div className="@container no-print shrink-0 border-b border-[var(--ui-border)]/60 bg-[var(--ui-surface)] order-last lg:order-none">
      <div
        role="toolbar"
        aria-label="Công cụ soạn đề"
        className="px-2 sm:px-3 h-12 flex flex-nowrap items-center gap-1.5 min-w-0 overflow-x-auto"
      >
        {p.canEdit && (
          <>
            <ToolMenu label="Thêm" Icon={Plus} items={p.addItems} />
            <button
              type="button"
              aria-label="AI"
              aria-pressed={p.aiOpen}
              onClick={p.onAi}
              className={button + (p.aiOpen ? ' !bg-[var(--ui-surface-variant)]' : '')}
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>AI</span>
            </button>
            <span aria-hidden className="w-px h-6 bg-[var(--ui-border)] shrink-0" />
          </>
        )}
        {p.onPanel && (
          <button
            type="button"
            aria-label="Bảng chi tiết"
            onClick={p.onPanel}
            className={button + ' lg:hidden'}
          >
            Bảng
          </button>
        )}
        <nav aria-label="Đang chọn" className="flex min-w-0 shrink-0 items-center gap-0.5 text-xs">
          {p.steps.map((step, index) => (
            <span key={step.code} className="flex shrink-0 items-center gap-0.5">
              {index > 0 && <span aria-hidden>›</span>}
              <button
                type="button"
                aria-current={index === last ? 'true' : undefined}
                onClick={() => p.onStep(step.code)}
                className={
                  'max-w-40 truncate rounded-lg px-1.5 min-h-9 !whitespace-nowrap cursor-pointer ' +
                  (index === last
                    ? 'font-semibold'
                    : 'text-[var(--ui-text-secondary)] hover:bg-[var(--ui-surface-variant)]')
                }
              >
                {step.label}
              </button>
            </span>
          ))}
        </nav>
        {p.canEdit && (inline.length > 0 || more.length > 0) && (
          <>
            <span aria-hidden className="w-px h-6 bg-[var(--ui-border)] shrink-0" />
            <div className="flex items-center gap-1.5" role="group" aria-label="Thao tác với mục đang chọn">
              {inline.map((command) => (
                <button
                  key={command.label}
                  type="button"
                  title={command.title}
                  className="app-button-secondary rounded-lg px-3 min-h-9 text-xs !whitespace-nowrap cursor-pointer disabled:opacity-40"
                  disabled={command.disabled}
                  onClick={command.onClick}
                >
                  {command.label}
                </button>
              ))}
              {more.length > 0 && (
                <ToolMenu
                  key={String(p.canEdit) + p.steps.at(-1)?.code}
                  label="Khác"
                  Icon={MoreHorizontal}
                  items={more.map((command) => ({
                    label: command.label,
                    title: command.title,
                    disabled: command.disabled,
                    onClick: command.onClick,
                  }))}
                />
              )}
            </div>
          </>
        )}
        {p.canEdit && field.commands.length > 0 && (
          <>
            <span aria-hidden className="w-px h-6 bg-[var(--ui-border)] shrink-0" />
            <div className="flex items-center gap-1.5" role="group" aria-label="Định dạng chữ">
              {field.commands.slice(0, 3).map((command, index) => (
                <button
                  key={command.label}
                  type="button"
                  className="app-button-secondary rounded-lg px-3 min-h-9 text-xs !whitespace-nowrap cursor-pointer disabled:opacity-40"
                  disabled={command.disabled}
                  onClick={() => field.run(index, command.label)}
                >
                  {command.label}
                </button>
              ))}
              {field.commands.length > 3 && (
                <ToolMenu
                  label="Chữ"
                  Icon={Type}
                  items={field.commands.slice(3).map((command, offset) => ({
                    label: command.label,
                    disabled: command.disabled,
                    onClick: () => field.run(offset + 3, command.label),
                  }))}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
