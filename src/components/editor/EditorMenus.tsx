'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Brain, FileDown, Key, LogOut, Menu, Moon, MoreHorizontal, ShieldCheck, Sun } from 'lucide-react';
import { ToolMenu, type ExportView, type MenuItem } from '../EditorToolbar';
import { useTheme } from '../ThemeProvider';
import { useWorkspace } from '../workspace/WorkspaceContext';
import { logoutSession } from '@/lib/auth-client';

/** The editor hides the page menu, so the way back to the library and the other pages lives here. */
export function AppMenu() {
  const router = useRouter();
  const go = (href: string) => () => router.push(href);
  return (
    <ToolMenu
      label="Menu ứng dụng"
      Icon={Menu}
      compact
      items={[
        { label: 'Về Kho đề', onClick: go('/') },
        { label: 'Tạo đề mới', onClick: go('/editor/new') },
        { label: 'Ngân hàng câu hỏi', onClick: go('/teacher/questions') },
        { label: 'Lớp học', onClick: go('/teacher/groups') },
        { label: 'Bài đã giao', onClick: go('/teacher/assignments') },
        { label: 'Thùng rác', onClick: go('/?view=trash') },
      ]}
    />
  );
}

export type ExportProps = {
  canEdit: boolean;
  ready: boolean;
  hasQuestions: boolean;
  onExportWord: (view: ExportView) => void;
  onPrint: () => void;
  onPresent: () => void;
  onShuffle: () => void;
};

function exportItems(p: ExportProps): MenuItem[] {
  const items: MenuItem[] = (
    [
      ['exam', 'Word – đề'],
      ['answers', 'Word – đáp án/barem'],
      ['solutions', 'Word – lời giải'],
      ['matrix', 'Word – ma trận'],
      ['parallel', 'Word – đề song song'],
    ] as const
  ).map(([view, label]) => ({ label, onClick: () => p.onExportWord(view) }));
  items.push(
    { label: 'In / PDF', onClick: p.onPrint },
    {
      label: 'Trình chiếu',
      onClick: p.onPresent,
      disabled: !p.ready || !p.hasQuestions,
    },
  );
  if (p.canEdit) items.push({ label: 'Trộn mã đề…', onClick: p.onShuffle });
  return items;
}

export function ExportMenu(p: ExportProps) {
  return <ToolMenu label="Xuất" Icon={FileDown} items={exportItems(p)} />;
}

export function MoreMenu(p: {
  canEdit: boolean;
  hasServerExam: boolean;
  hasAssignments: boolean;
  submissionCount: number;
  onReview: () => void;
  onTemplate: () => void;
  onCollaborate: () => void;
  onResults: () => void;
  /** On a phone the export menu and the invite button have no room in the top bar, so they live here. */
  phone?: ExportProps;
}) {
  const items: MenuItem[] = [
    ...(p.phone ? exportItems(p.phone) : []),
    { label: 'Rà soát đề', onClick: p.onReview },
    ...(p.canEdit ? [{ label: 'Dùng mẫu / lưu thành mẫu', onClick: p.onTemplate }] : []),
    ...(p.hasAssignments ? [{ label: `Kết quả (${p.submissionCount})`, onClick: p.onResults }] : []),
    ...(p.phone && p.hasServerExam ? [{ label: 'Cùng soạn', onClick: p.onCollaborate }] : []),
  ];
  return <ToolMenu label="Thêm công cụ" Icon={MoreHorizontal} compact items={items} />;
}

/** Account, AI notes, AI keys and light/dark: the things that are about the person, not the exam. */
export function AccountMenu() {
  const { user, openAiNotes, openKeys, hasActiveKey, keyErrorCount } = useWorkspace();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [open, setOpen] = useState(false),
    [leaving, setLeaving] = useState(false),
    [error, setError] = useState('');
  const dot = !hasActiveKey
    ? 'bg-[var(--ui-text-secondary)]'
    : keyErrorCount > 0
      ? 'bg-rose-500'
      : 'bg-emerald-500';
  const leave = async () => {
    if (leaving) return;
    setLeaving(true);
    setError('');
    try {
      await logoutSession(user.id);
      router.push('/login');
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Chưa đăng xuất được. Hãy thử lại.');
      setLeaving(false);
    }
  };
  const row =
    'w-full min-h-10 px-2.5 rounded-lg text-sm flex items-center gap-2 text-left hover:bg-[var(--ui-surface-variant)] cursor-pointer';
  return (
    <div
      className="relative shrink-0"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation();
          setOpen(false);
        }
      }}
    >
      <button
        type="button"
        aria-label="Mở menu tài khoản"
        aria-expanded={open}
        title={user.name}
        onClick={() => setOpen((value) => !value)}
        className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer"
      >
        <span className="w-8 h-8 rounded-full bg-[var(--ui-accent)] text-[var(--ui-on-primary)] flex items-center justify-center text-xs font-bold">
          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            role="region"
            aria-label="Tài khoản"
            className="app-menu fixed right-2 top-12 sm:absolute sm:right-0 sm:top-full sm:mt-2 z-50 w-72 max-w-[calc(100vw-1rem)] rounded-2xl border bg-[var(--ui-surface)] p-2 text-xs shadow-lg"
          >
            <div className="p-2 border-b mb-1">
              <p className="font-bold text-sm truncate">{user.name}</p>
              <p className="text-[11px] text-[var(--ui-text-secondary)] truncate">{user.email}</p>
            </div>
            <button
              type="button"
              className={row}
              aria-label="Ghi chú riêng cho AI"
              title="Bộ não AI Sư Phạm: Xem và dạy các phong cách ra đề cho AI"
              onClick={() => {
                setOpen(false);
                openAiNotes();
              }}
            >
              <Brain className="w-4 h-4" />
              <span>Ghi chú riêng cho AI</span>
            </button>
            <button
              type="button"
              className={row}
              aria-label="Quản lý khóa AI"
              title="Quản lý Google Gemini API Key"
              onClick={() => {
                setOpen(false);
                openKeys();
              }}
            >
              <Key className="w-4 h-4" />
              <span className="flex-1">Khóa AI</span>
              <span className={`w-2 h-2 rounded-full ${dot}`} aria-hidden />
            </button>
            <button
              type="button"
              className={row}
              aria-label={`Chuyển sang giao diện ${theme === 'dark' ? 'Sáng' : 'Tối'}`}
              title="Đổi giao diện Sáng / Tối"
              onClick={toggleTheme}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span>Giao diện {theme === 'dark' ? 'sáng' : 'tối'}</span>
            </button>
            {user.role === 'SUPER_ADMIN' && (
              <Link href="/admin/users" className={row} onClick={() => setOpen(false)}>
                <ShieldCheck className="w-4 h-4" />
                <span>Quản trị người dùng</span>
              </Link>
            )}
            <button
              type="button"
              className={row + ' border-t mt-1 rounded-t-none'}
              onClick={() => void leave()}
              disabled={leaving}
            >
              <LogOut className="w-4 h-4" />
              <span>{leaving ? 'Đang đăng xuất...' : 'Đăng xuất'}</span>
            </button>
            {error && (
              <p role="alert" className="px-2 pb-1 text-[11px] text-red-700 dark:text-red-300">
                {error}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
