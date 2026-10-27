'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Bot, GraduationCap, Key, LogOut, Moon, Search, Sun, X } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { logoutSession } from '@/lib/auth-client';
import { useWorkspace } from './WorkspaceContext';
import type { WorkspaceVariant } from './WorkspaceMenu';

/** Brand mark plus the account side of the bar. The editor draws its own bar into the same slot (see EditorTopBar) and reuses these pieces. */
export function BrandLink({ variant }: { variant: WorkspaceVariant }) {
  return <Link href={variant === 'admin' ? '/admin/users' : '/'} className="flex items-center gap-2.5 shrink-0">
    <span className="w-9 h-9 rounded-xl bg-[var(--ui-accent)] text-[var(--ui-on-primary)] flex items-center justify-center"><GraduationCap className="w-5 h-5" /></span>
    <span className="font-semibold text-base tracking-tight">ExamCraft</span>
    <span className="hidden sm:inline-flex text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[var(--ui-surface-variant)] text-[var(--ui-text-secondary)]">{variant === 'admin' ? 'Quản trị' : 'Giáo viên'}</span>
  </Link>;
}

export function AccountCluster({ showAssistant = true }: { showAssistant?: boolean }) {
  const { user, keyCount, hasActiveKey, openKeys, toggleAssistant, assistantOpen } = useWorkspace();
  const { theme, toggleTheme } = useTheme(), router = useRouter();
  const [leaving, setLeaving] = useState(false), [error, setError] = useState('');
  const leave = async () => {
    setLeaving(true); setError('');
    try { await logoutSession(user.id); router.push('/login'); router.refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Chưa đăng xuất được.'); setLeaving(false); }
  };
  return <div className="flex items-center gap-2">
    {showAssistant && <button type="button" onClick={toggleAssistant} aria-pressed={assistantOpen} title="Mở Thư ký AI trợ lý riêng của Thầy/Cô" className={`flex items-center gap-1.5 min-h-9 px-3 rounded-lg text-xs font-semibold cursor-pointer ${assistantOpen ? 'app-button-primary' : 'app-button-secondary'}`}><Bot className="w-3.5 h-3.5" /><span className="hidden sm:inline">Trợ lý AI</span></button>}
    <button type="button" onClick={openKeys} title="Quản lý Google Gemini API Key" className="app-button-secondary flex items-center gap-1.5 min-h-9 px-3 rounded-lg text-xs cursor-pointer"><Key className="w-3.5 h-3.5" /><span className="hidden sm:inline">Khóa AI: {keyCount}</span>{!hasActiveKey && <span className="sr-only">chưa có khóa đang dùng</span>}</button>
    <button type="button" onClick={toggleTheme} title="Đổi giao diện Sáng / Tối" aria-label={`Chuyển sang giao diện ${theme === 'dark' ? 'Sáng' : 'Tối'}`} className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-[var(--ui-surface-variant)] cursor-pointer">{theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}</button>
    <details className="relative">
      <summary className="list-none flex items-center gap-2 pl-2 border-l cursor-pointer" aria-label="Tài khoản">
        <span className="w-8 h-8 rounded-full bg-[var(--ui-accent)] text-[var(--ui-on-primary)] flex items-center justify-center font-semibold text-xs">{user.name.charAt(0).toUpperCase()}</span>
        <span className="hidden lg:block text-left text-xs"><span className="block font-semibold truncate max-w-[120px]">{user.name}</span><span className="block text-[10px] text-[var(--ui-text-secondary)]">{user.role === 'SUPER_ADMIN' ? 'Quản trị viên' : 'Giáo viên'}</span></span>
      </summary>
      <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border bg-[var(--ui-surface)] p-2 shadow-lg z-40">
        <p className="px-2 py-1 text-xs text-[var(--ui-text-secondary)] [overflow-wrap:anywhere]">{user.email}</p>
        <button type="button" onClick={() => void leave()} disabled={leaving} className="app-button-secondary w-full min-h-10 flex items-center justify-center gap-2 px-3 text-sm disabled:opacity-50 cursor-pointer"><LogOut className="w-4 h-4" />{leaving ? 'Đang đăng xuất...' : 'Đăng xuất'}</button>
        {error && <p role="alert" className="mt-2 px-2 text-xs text-red-700 dark:text-red-300">{error}</p>}
      </div>
    </details>
  </div>;
}

/** Default bar for every page except the editor. The search box appears on the library only. */
export function WorkspaceTopBar({ variant }: { variant: WorkspaceVariant }) {
  const params = useSearchParams(), search = params.get('search') || '';
  const change = (value: string) => {
    const next = new URLSearchParams(window.location.search);
    if (value) next.set('search', value); else next.delete('search');
    next.delete('page');
    window.history.replaceState(null, '', '/?' + next.toString());
  };
  return <header className="app-bar no-print h-16 px-4 sm:px-6 flex items-center justify-between gap-3 border-b shrink-0">
    <BrandLink variant={variant} />
    {variant === 'library' && <div className="flex-1 max-w-xl mx-2 lg:mx-8 hidden md:block"><div className="relative">
      <Search className="w-4 h-4 text-[var(--ui-text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
      <input type="text" aria-label="Tìm đề theo tên" value={search} onChange={event => change(event.target.value)} placeholder="Tìm theo tên đề..." className="teacher-field w-full rounded-full text-sm" style={{ paddingLeft: '2.5rem', paddingRight: '2.25rem' }} />
      {search && <button type="button" aria-label="Xóa ô tìm" onClick={() => change('')} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"><X className="w-3.5 h-3.5" /></button>}
    </div></div>}
    <AccountCluster showAssistant={variant !== 'admin'} />
  </header>;
}
