'use client';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Database, FileText, GraduationCap, Plus, ShieldCheck, Trash2, Users } from 'lucide-react';
import { useTheme } from './ThemeProvider';

/** The one list of places a teacher can go. The side menu (wide screens) and the tab bar (phones) both draw from it, so a place is never listed twice on one screen. */
function useDestinations() {
  const pathname = usePathname(), params = useSearchParams();
  const trash = pathname === '/' && params.get('view') === 'trash';
  return {
    inLibrary: pathname === '/' && !trash,
    items: [
      { href: '/', label: 'Kho đề', Icon: FileText, active: pathname === '/' && !trash },
      { href: '/teacher/questions', label: 'Ngân hàng câu hỏi', Icon: Database, active: pathname.startsWith('/teacher/questions') },
      { href: '/teacher/groups', label: 'Lớp học', Icon: Users, active: pathname.startsWith('/teacher/groups') },
      { href: '/teacher/assignments', label: 'Bài đã giao', Icon: GraduationCap, active: pathname.startsWith('/teacher/assignments') },
      { href: '/?view=trash', label: 'Thùng rác', Icon: Trash2, active: trash },
    ],
  };
}

const linkClass = (active: boolean) => `min-h-10 flex items-center gap-2.5 px-3 rounded-lg text-sm ${active ? 'app-button-tonal font-semibold' : 'text-[var(--ui-text-primary)] hover:bg-[var(--ui-surface-variant)]'}`;

/** Phones and narrow windows: one row of tabs. From the large breakpoint up it is replaced by TeacherSidebar. */
export function TeacherNavigation({ header = false, name }: { header?: boolean; name?: string }) {
  const { theme, toggleTheme } = useTheme(), { items } = useDestinations();
  return <div className={`no-print shrink-0 bg-[var(--ui-surface)] border-b ${header ? '' : 'lg:hidden'}`}>
    {header && <header className="app-bar flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b"><Link href="/" className="font-semibold text-lg">ExamCraft <span className="text-sm font-normal text-[var(--ui-text-secondary)]">· Giáo viên</span></Link><div className="flex flex-wrap items-center gap-3 text-sm"><span>{name}</span><button type="button" className="app-button-secondary min-h-10 px-3" onClick={toggleTheme} aria-label={`Chuyển sang giao diện ${theme === 'dark' ? 'sáng' : 'tối'}`}>{theme === 'dark' ? 'Sáng' : 'Tối'}</button></div></header>}
    <nav aria-label="Không gian giáo viên" className="lg:hidden flex flex-wrap gap-1 px-3 sm:px-6 py-2 text-sm">{items.map(({ href, label, active }) => <Link key={href} href={href} aria-current={active ? 'page' : undefined} className={`min-h-10 inline-flex items-center px-3 rounded-lg ${active ? 'app-button-tonal font-semibold' : 'hover:bg-[var(--ui-surface-variant)]'}`}>{label}</Link>)}</nav>
  </div>;
}

/** Wide screens: the same menu on every teacher page. `libraryExtras` appear under "Kho đề" only while the library itself is open; `children` (for example the folder tree) go below the menu. */
export function TeacherSidebar({ isAdmin = false, libraryExtras, children }: { isAdmin?: boolean; libraryExtras?: ReactNode; children?: ReactNode }) {
  const { items, inLibrary } = useDestinations();
  return <aside aria-label="Menu giáo viên" className="no-print hidden lg:flex flex-col gap-4 w-64 shrink-0 h-full overflow-y-auto border-r bg-[var(--ui-surface)] p-3">
    <Link href="/editor/new" className="app-button-primary flex items-center justify-center gap-2 min-h-11 px-4 rounded-xl text-sm font-semibold"><Plus className="w-4 h-4" /><span>Soạn đề thi mới</span></Link>
    <nav aria-label="Không gian giáo viên" className="space-y-0.5">
      {items.map(({ href, label, Icon, active }) => <div key={href}>
        <Link href={href} aria-current={active ? 'page' : undefined} className={linkClass(active)}><Icon className="w-4 h-4 shrink-0 text-[var(--ui-text-secondary)]" /><span>{label}</span></Link>
        {href === '/' && inLibrary && libraryExtras && <div className="mt-0.5 ml-4 pl-2 border-l space-y-0.5">{libraryExtras}</div>}
      </div>)}
    </nav>
    {children}
    {isAdmin && <div className="mt-auto pt-3 border-t"><Link href="/admin/users" className="min-h-10 flex items-center gap-2.5 px-3 rounded-lg text-sm font-semibold bg-[var(--ui-surface-variant)] hover:bg-[var(--ui-primary-container)]"><ShieldCheck className="w-4 h-4" /><span>Trang quản trị hệ thống</span></Link></div>}
  </aside>;
}
