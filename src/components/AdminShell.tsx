'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { logoutSession } from '@/lib/auth-client';

const destinations = [['/admin/users', 'Tài khoản'], ['/admin/keys', 'Cấp khóa AI'], ['/admin/ai', 'Hoạt động AI']] as const;

export function AdminShell({ user, children }: { user: { id: string; name: string }; children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [error, setError] = useState('');
  const [leaving, setLeaving] = useState(false);
  const leave = async () => {
    setLeaving(true); setError('');
    try { await logoutSession(user.id); router.push('/login'); router.refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Chưa đăng xuất được.'); setLeaving(false); }
  };
  return <div className="app-page min-h-dvh bg-background text-foreground">
    <header className="app-bar border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/admin/users" className="font-semibold text-base">ExamCraft <span className="text-[var(--ui-text-secondary)] font-normal">· Quản trị</span></Link>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="hidden sm:inline text-[var(--ui-text-secondary)]">{user.name}</span>
            <Link href="/" className="app-button-secondary inline-flex items-center px-3 py-2">Về kho đề</Link>
            <button onClick={toggleTheme} className="app-button-secondary inline-flex items-center p-2" aria-label={theme === 'dark' ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}>{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
            <button onClick={() => void leave()} disabled={leaving} className="app-button-secondary px-3 py-2 disabled:opacity-50">{leaving ? 'Đang đăng xuất...' : 'Đăng xuất'}</button>
          </div>
        </div>
        <nav aria-label="Quản trị" className="flex flex-wrap gap-2 text-sm">
          {destinations.map(([href, label]) => <Link key={href} href={href} aria-current={path === href ? 'page' : undefined} className={`inline-flex items-center min-h-10 px-4 py-2 ${path === href ? 'app-button-primary' : 'app-button-secondary'}`}>{label}</Link>)}
        </nav>
        {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}
      </div>
    </header>
    {children}
  </div>;
}
