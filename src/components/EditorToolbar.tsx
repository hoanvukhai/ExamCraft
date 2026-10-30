'use client';
import { useEffect, useRef, useState, type ComponentType } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Sparkles, Plus } from 'lucide-react';
import { ContextSelectionToolbar } from './editor/EditorSelection';
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
interface Props {
  canEdit: boolean;
  copilotOpen: boolean;
  onCopilot: () => void;
  onAssistant: () => void;
  onAdd: () => void;
  onBank: () => void;
  onImport: () => void;
  onGenerate: () => void;
  onAddPart: () => void;
  onSettings: () => void;
}

/** The one tool row: two fixed anchors (add content, AI) and then the tools of whatever is selected. It never gets a second row. */
export function EditorToolbar(p: Props) {
  return (
    <div className="@container no-print shrink-0 border-b border-[var(--ui-border)]/60 bg-[var(--ui-surface)] order-last lg:order-none">
      <div
        role="toolbar"
        aria-label="Công cụ soạn đề"
        className="px-2 sm:px-3 h-12 flex flex-nowrap items-center gap-1.5 min-w-0 overflow-x-auto"
      >
        {p.canEdit && (
          <>
            <ToolMenu
              label="Thêm"
              Icon={Plus}
              items={[
                { label: 'Tự soạn câu mới', onClick: p.onAdd },
                { label: 'Từ ngân hàng', onClick: p.onBank },
                { label: 'Nhập Word/Ảnh', onClick: p.onImport },
                { label: 'Sinh bằng AI', onClick: p.onGenerate },
                { label: 'Phần mới', onClick: p.onAddPart },
              ]}
            />
            <ToolMenu
              label="AI"
              Icon={Sparkles}
              items={[
                {
                  label: 'Sửa đề bằng Trợ lý AI',
                  title: p.copilotOpen ? 'Đóng bảng Trợ lý AI' : 'Mở bảng Trợ lý AI',
                  onClick: p.onCopilot,
                },
                { label: 'Hỏi AI (không sửa đề)', onClick: p.onAssistant },
              ]}
            />
            <span aria-hidden className="w-px h-6 bg-[var(--ui-border)] shrink-0" />
          </>
        )}
        <ContextSelectionToolbar canEdit={p.canEdit} onSettings={p.onSettings} />
      </div>
    </div>
  );
}
