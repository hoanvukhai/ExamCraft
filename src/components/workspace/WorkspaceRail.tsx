'use client';
import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Activity, AlertCircle, Bot, Brain, CheckCircle2, Key, LogOut, Moon, ShieldCheck, Sparkles, Sun } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { logoutSession } from '@/lib/auth-client';
import { useWorkspace } from './WorkspaceContext';
import type { WorkspaceVariant } from './WorkspaceMenu';

const buttonClass = (pressed = false) => `relative w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer ${pressed ? 'app-button-tonal' : 'text-[var(--ui-text-secondary)] hover:bg-[var(--ui-surface-variant)] hover:text-[var(--ui-text-primary)]'}`;

function RailButton({ title, label, onClick, pressed, children }: { title: string; label: string; onClick: () => void; pressed?: boolean; children: ReactNode }) {
  return <button type="button" onClick={onClick} title={title} aria-label={label} aria-pressed={pressed} className={buttonClass(pressed)}>{children}</button>;
}

/** The account: who is signed in, the state of the AI keys, and sign out. It opens beside the rail (or under the phone bar). */
function AccountMenu({ row }: { row: boolean }) {
  const { user, hasActiveKey, keyCount, keyErrorCount, usedToday, openKeys } = useWorkspace(), router = useRouter();
  const [open, setOpen] = useState(false), [leaving, setLeaving] = useState(false), [error, setError] = useState('');
  const leave = async () => {
    if (leaving) return;
    setLeaving(true); setError('');
    try { await logoutSession(user.id); router.push('/login'); router.refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Chưa đăng xuất được. Vui lòng thử lại.'); setLeaving(false); }
  };
  return <div className="relative">
    <button type="button" aria-label="Mở menu tài khoản" aria-expanded={open} title={user.name} onClick={() => setOpen(value => !value)} className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer">
      <span className="w-8 h-8 rounded-full bg-[var(--ui-accent)] text-[var(--ui-on-primary)] flex items-center justify-center text-xs font-bold">{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
    </button>
    {open && <>
      <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      <div role="region" aria-label="Tài khoản và khóa AI" className={`app-menu absolute z-50 w-72 rounded-2xl border bg-[var(--ui-surface)] p-2.5 text-xs shadow-lg divide-y ${row ? 'right-0 top-full mt-2' : 'right-full top-0 mr-2'}`}>
        <div className="p-2">
          <p className="font-bold text-sm truncate">{user.name}</p>
          <p className="text-[11px] text-[var(--ui-text-secondary)] truncate">{user.email}</p>
          <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[var(--ui-surface-variant)]">{user.role === 'SUPER_ADMIN' ? 'Quản trị viên' : 'Giáo viên'}</span>
        </div>
        <div className="py-2.5">
          <div className="p-3 rounded-xl border bg-[var(--ui-surface-variant)] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /><span>Kho Khóa AI Của Bạn</span></span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${keyErrorCount > 0 ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' : 'bg-[var(--ui-surface)]'}`}>{!hasActiveKey ? 'Chưa có key' : keyErrorCount > 0 ? `${keyErrorCount} key lỗi/429` : `${keyCount} key sẵn sàng`}</span>
            </div>
            <div className="text-xs text-[var(--ui-text-secondary)] space-y-1"><p>Thành công hôm nay: {usedToday} lượt</p><p>Hạn mức do nhà cung cấp áp dụng; chưa biết số lượt còn lại.</p></div>
            {!hasActiveKey ? <p className="text-[11px] text-[var(--ui-text-secondary)] flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5 shrink-0" /><span>Chưa thêm khóa AI cá nhân!</span></p>
              : keyErrorCount > 0 ? <p className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5 shrink-0" /><span>Có khóa đang chạm hạn mức 429!</span></p>
              : <p className="text-[11px] text-[var(--ui-text-secondary)] flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" /><span>Tự động xoay tua đa khóa sẵn sàng</span></p>}
            <button type="button" onClick={() => { setOpen(false); openKeys(); }} className="app-button-secondary w-full min-h-9 px-3 text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer"><Key className="w-3.5 h-3.5" /><span>Quản lý &amp; Kiểm tra Khóa AI</span></button>
          </div>
        </div>
        {user.role === 'SUPER_ADMIN' && <div className="py-1"><Link href="/admin/users" onClick={() => setOpen(false)} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[var(--ui-surface-variant)]"><ShieldCheck className="w-4 h-4" /><span>Quản trị người dùng</span></Link></div>}
        <div className="pt-2">
          <button type="button" onClick={() => void leave()} disabled={leaving} className="app-button-secondary w-full min-h-10 px-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"><LogOut className="w-4 h-4" />{leaving ? 'Đang đăng xuất...' : 'Đăng xuất'}</button>
          {error && <p role="alert" className="mt-2 px-1 text-[11px] text-red-700 dark:text-red-300">{error}</p>}
        </div>
      </div>
    </>}
  </div>;
}

/** Everything that is about *me* and the assistant, in one place: account, assistant, notes, AI keys, light/dark. */
function RailButtons({ variant, row }: { variant: WorkspaceVariant; row: boolean }) {
  const { toggleAssistant, assistantOpen, openAiNotes, openKeys, hasActiveKey, keyErrorCount, copilotAvailable, copilotOpen, setCopilotOpen } = useWorkspace();
  const { theme, toggleTheme } = useTheme();
  const admin = variant === 'admin', dot = !hasActiveKey ? 'bg-[var(--ui-text-secondary)]' : keyErrorCount > 0 ? 'bg-rose-500' : 'bg-emerald-500';
  return <>
    <AccountMenu row={row} />
    {!row && <span aria-hidden className="w-6 h-px bg-[var(--ui-border)]" />}
    {copilotAvailable && <RailButton title={copilotOpen ? 'Thu gọn dải công cụ' : 'Mở rộng bảng Trợ lý AI'} label="Sửa đề bằng Trợ lý AI" pressed={copilotOpen} onClick={() => setCopilotOpen(open => !open)}><Sparkles className="w-5 h-5" /></RailButton>}
    {!admin && <RailButton title="Mở Thư ký AI trợ lý riêng của Thầy/Cô" label="Hỏi đáp với Trợ lý AI" pressed={assistantOpen} onClick={toggleAssistant}><Bot className="w-5 h-5" /></RailButton>}
    {!admin && <RailButton title="Bộ não AI Sư Phạm: Xem và dạy các phong cách ra đề cho AI" label="Ghi chú riêng cho AI" onClick={openAiNotes}><Brain className="w-5 h-5" /></RailButton>}
    <RailButton title="Quản lý Google Gemini API Key" label="Quản lý khóa AI" onClick={openKeys}><Key className="w-5 h-5" /><span className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ring-2 ring-[var(--ui-surface)] ${dot}`} /></RailButton>
    <div className={row ? '' : 'mt-auto'}><RailButton title="Đổi giao diện Sáng / Tối" label={`Chuyển sang giao diện ${theme === 'dark' ? 'Sáng' : 'Tối'}`} onClick={toggleTheme}>{theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}</RailButton></div>
  </>;
}

/** The right-hand rail (wide screens). In the editor it also carries the "edit this exam" assistant button. */
export function WorkspaceRail({ variant }: { variant: WorkspaceVariant }) {
  return <aside aria-label="Tài khoản và trợ lý" className="no-print hidden lg:flex flex-col items-center gap-2 w-14 shrink-0 border-l bg-[var(--ui-surface)] py-3"><RailButtons variant={variant} row={false} /></aside>;
}

/** Phones: the same buttons in one row under a slim brand bar, because there is no rail. */
export function PhoneBar({ variant, brand }: { variant: WorkspaceVariant; brand: ReactNode }) {
  return <header className="app-bar no-print lg:hidden h-12 px-3 flex items-center justify-between gap-2 border-b shrink-0">{brand}<div className="flex items-center gap-0.5"><RailButtons variant={variant} row /></div></header>;
}
