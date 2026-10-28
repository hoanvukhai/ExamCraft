'use client';
import { useEffect, useRef, useState, type ComponentType } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, FileDown, Settings2, Sparkles, Plus, MoreHorizontal } from 'lucide-react';
import type { Exam } from '@/types/exam';
export type ExportView = 'exam' | 'answers' | 'solutions' | 'matrix' | 'parallel';
type Icon = ComponentType<{ className?: string }>;
export interface MenuItem {
  label: string;
  title?: string;
  onClick: () => void;
  disabled?: boolean;
}
const button =
  'app-button-secondary shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 min-h-9 px-2.5 rounded-lg text-xs ' +
  'font-medium cursor-pointer disabled:opacity-40';
export function ToolMenu({
  label,
  Icon,
  items,
  compact = false,
}: {
  label: string;
  Icon: Icon;
  items: MenuItem[];
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false),
    [where, setWhere] = useState({ top: 0, left: 0 });
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
    if (fieldset) permissions.observe(fieldset, { attributes: true, attributeFilter: ['disabled'] });
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
          setWhere({
            top: Math.max(8, Math.min(rect.bottom + 4, innerHeight - 330)),
            left: Math.max(8, Math.min(rect.left, innerWidth - 256)),
          });
          setOpen((value) => !value);
        }}
        className={button}
      >
        <Icon className="w-4 h-4 shrink-0" />
        {!compact && <span className="@max-[300px]:hidden">{label}</span>}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open &&
        createPortal(
          <div
            ref={menu}
            role="menu"
            aria-label={label}
            style={where}
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
  ready: boolean;
  hasQuestions: boolean;
  hasServerExam: boolean;
  hasAssignments: boolean;
  access?: Exam['access'];
  submissionCount: number;
  copilotOpen: boolean;
  onCopilot: () => void;
  onAdd: () => void;
  onGenerate: () => void;
  onImport: () => void;
  onBank: () => void;
  onSettings: () => void;
  onShuffle: () => void;
  onExportWord: (view: ExportView) => void;
  onPrint: () => void;
  onPresent: () => void;
  onReview: () => void;
  onCollaborate: () => void;
  onResults: () => void;
  onTemplate: () => void;
}
export function EditorToolbar(p: Props) {
  const outputs: MenuItem[] = (
    [
      ['exam', 'Word – đề'],
      ['answers', 'Word – đáp án/barem'],
      ['solutions', 'Word – lời giải'],
      ['matrix', 'Word – ma trận'],
      ['parallel', 'Word – đề song song'],
    ] as const
  ).map(([view, label]) => ({ label, onClick: () => p.onExportWord(view) }));
  outputs.push(
    { label: 'In / PDF', onClick: p.onPrint },
    { label: 'Trình chiếu', onClick: p.onPresent, disabled: !p.ready || !p.hasQuestions },
  );
  if (p.canEdit) outputs.push({ label: 'Trộn mã đề…', onClick: p.onShuffle });
  const templates: MenuItem[] = p.canEdit
    ? [{ label: 'Dùng mẫu / lưu thành mẫu', onClick: p.onTemplate }]
    : [];
  const secondary: MenuItem[] = [
    { label: 'Rà soát đề', onClick: p.onReview },
    ...templates,
    ...(p.hasAssignments ? [{ label: `Kết quả (${p.submissionCount})`, onClick: p.onResults }] : []),
    ...(p.hasServerExam ? [{ label: 'Cùng soạn', onClick: p.onCollaborate }] : []),
  ];
  const badge =
    p.access && !p.access.canManage
      ? p.access.canEdit
        ? 'Được mời sửa'
        : p.access.canComment
          ? 'Xem và góp ý'
          : 'Chỉ xem'
      : null;
  return (
    <div className="@container no-print shrink-0 border-b bg-[var(--ui-surface)]">
      <div
        role="toolbar"
        aria-label="Công cụ soạn đề"
        className="px-2 sm:px-3 py-2 flex items-center gap-1 min-w-0"
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
              ]}
            />
            <button
              type="button"
              aria-label="Thông tin đề"
              title="Thông tin đề"
              className={button}
              onClick={p.onSettings}
            >
              <Settings2 className="w-4 h-4" />
              <span className="hidden @min-[500px]:inline">Thông tin đề</span>
            </button>
            <button
              type="button"
              aria-label="Sửa đề bằng Trợ lý AI"
              title="Sửa bằng AI"
              aria-pressed={p.copilotOpen}
              className={button}
              onClick={p.onCopilot}
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden @min-[500px]:inline">Sửa bằng AI</span>
            </button>
          </>
        )}
        <div className="ml-auto">
          <ToolMenu label="Xuất" Icon={FileDown} items={outputs} />
        </div>
        <ToolMenu label="Thêm công cụ" compact Icon={MoreHorizontal} items={secondary} />
        {badge && <span className="hidden @min-[1100px]:inline text-xs">{badge}</span>}
      </div>
    </div>
  );
}
