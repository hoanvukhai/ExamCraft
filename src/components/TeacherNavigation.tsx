'use client';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useTheme } from './ThemeProvider';
export function TeacherNavigation({ header = false, name }: { header?: boolean; name?: string }) {
  const pathname = usePathname(), params = useSearchParams(), { theme, toggleTheme } = useTheme();
  const trash = pathname === '/' && params.get('view') === 'trash';
  const links = [['/', 'Kho đề', pathname === '/' && !trash], ['/teacher/questions', 'Ngân hàng câu hỏi', pathname.startsWith('/teacher/questions')], ['/teacher/groups', 'Lớp học', pathname.startsWith('/teacher/groups')], ['/teacher/assignments', 'Bài đã giao', pathname.startsWith('/teacher/assignments')], ['/?view=trash', 'Thùng rác', trash]] as const;
  return <div className="no-print shrink-0 bg-[var(--ui-surface)] border-b">
    {header && <header className="app-bar flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b"><Link href="/" className="font-semibold text-lg">ExamCraft <span className="text-sm font-normal text-[var(--ui-text-secondary)]">· Giáo viên</span></Link><div className="flex flex-wrap items-center gap-3 text-sm"><span>{name}</span><button type="button" className="app-button-secondary min-h-10 px-3" onClick={toggleTheme} aria-label={`Chuyển sang giao diện ${theme === 'dark' ? 'sáng' : 'tối'}`}>{theme === 'dark' ? 'Sáng' : 'Tối'}</button></div></header>}
    <nav aria-label="Không gian giáo viên" className="flex flex-wrap gap-1 px-3 sm:px-6 py-2 text-sm">{links.map(([href, label, active]) => <Link key={href} href={href} aria-current={active ? 'page' : undefined} className={`min-h-10 inline-flex items-center px-3 rounded-lg ${active ? 'app-button-tonal font-semibold' : 'hover:bg-[var(--ui-surface-variant)]'}`}>{label}</Link>)}</nav>
  </div>;
}
