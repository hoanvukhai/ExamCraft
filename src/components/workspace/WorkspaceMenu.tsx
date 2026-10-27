'use client';
import { useState, type ComponentType, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Activity, ChevronDown, ChevronLeft, ChevronRight, Clock, Database, FileText, Folder, FolderOpen, GraduationCap, KeyRound, Plus, ShieldCheck, Star, Trash2, Users } from 'lucide-react';
import { useWorkspace } from './WorkspaceContext';
import { Brand } from './Brand';

export type WorkspaceVariant = 'library' | 'page' | 'editor' | 'admin';
export function useWorkspaceVariant(): WorkspaceVariant {
  const pathname = usePathname();
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/editor')) return 'editor';
  return pathname === '/' ? 'library' : 'page';
}

type Icon = ComponentType<{ className?: string }>;
interface Destination { href: string; label: string; Icon: Icon; active: boolean }

/** The one list of places. The side menu (wide screens) and the phone tab bar both draw from it, so a place is never listed twice on a screen. */
export function useDestinations(variant: WorkspaceVariant) {
  const pathname = usePathname(), params = useSearchParams();
  if (variant === 'admin') {
    const items: Destination[] = [
      { href: '/admin/users', label: 'Tài khoản', Icon: Users, active: pathname === '/admin/users' },
      { href: '/admin/keys', label: 'Cấp khóa AI', Icon: KeyRound, active: pathname === '/admin/keys' },
      { href: '/admin/ai', label: 'Hoạt động AI', Icon: Activity, active: pathname === '/admin/ai' },
    ];
    return { admin: true as const, items };
  }
  const view = params.get('view'), folder = params.get('folder'), onLibrary = pathname === '/';
  const compose: Destination[] = [
    { href: '/', label: 'Tất cả đề thi', Icon: FileText, active: onLibrary && !view && !folder },
    { href: '/?view=starred', label: 'Đề quan trọng (Gắn sao)', Icon: Star, active: onLibrary && view === 'starred' },
    { href: '/?view=recent', label: 'Đã sửa gần đây', Icon: Clock, active: onLibrary && view === 'recent' },
    { href: '/teacher/questions', label: 'Ngân hàng câu hỏi', Icon: Database, active: pathname.startsWith('/teacher/questions') },
    { href: '/teacher/folders', label: 'Thư mục', Icon: Folder, active: pathname.startsWith('/teacher/folders') },
  ];
  const exams: Destination[] = [
    { href: '/teacher/groups', label: 'Lớp học', Icon: Users, active: pathname.startsWith('/teacher/groups') },
    { href: '/teacher/assignments', label: 'Bài đã giao', Icon: GraduationCap, active: pathname.startsWith('/teacher/assignments') },
  ];
  const trash: Destination = { href: '/?view=trash', label: 'Thùng rác', Icon: Trash2, active: onLibrary && view === 'trash' };
  return { admin: false as const, compose, exams, trash, items: [...compose, ...exams, trash] };
}

const rowClass = (active: boolean) => `min-h-10 flex items-center gap-3 px-3 rounded-lg text-sm ${active ? 'app-button-tonal font-semibold' : 'text-[var(--ui-text-primary)] hover:bg-[var(--ui-surface-variant)]'}`;

function NavLink({ item, expanded }: { item: Destination; expanded: boolean }) {
  const { Icon } = item;
  return <Link href={item.href} aria-current={item.active ? 'page' : undefined} aria-label={expanded ? undefined : item.label} title={item.label} className={`${rowClass(item.active)} ${expanded ? '' : 'justify-center px-0'}`}>
    <Icon className="w-4 h-4 shrink-0 text-[var(--ui-text-secondary)]" />{expanded && <span className="truncate">{item.label}</span>}
  </Link>;
}

/** A group that folds with an arrow, like the product categories of a console. In the icon rail the heading is gone and a rule separates the groups. */
function Section({ id, title, expanded, closed, toggle, children }: { id: string; title: string; expanded: boolean; closed: Record<string, boolean>; toggle: (id: string) => void; children: ReactNode }) {
  if (!expanded) return <div className="space-y-0.5 pt-2 border-t first:border-t-0 first:pt-0">{children}</div>;
  const isClosed = Boolean(closed[id]);
  return <div className="space-y-0.5">
    <button type="button" aria-expanded={!isClosed} onClick={() => toggle(id)} className="w-full min-h-8 flex items-center justify-between px-3 rounded-lg text-[11px] font-semibold uppercase tracking-wider text-[var(--ui-text-secondary)] hover:bg-[var(--ui-surface-variant)] cursor-pointer"><span>{title}</span>{isClosed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}</button>
    {!isClosed && children}
  </div>;
}

/** Left menu (wide screens): the brand, the places, the recent folders, and a round arrow at the foot to fold it. In the editor it starts as a 56 px icon rail and opens over the page. */
export function WorkspaceMenu({ variant }: { variant: WorkspaceVariant }) {
  const { menuExpanded, setMenuExpanded, user, folders } = useWorkspace();
  const nav = useDestinations(variant), params = useSearchParams(), pathname = usePathname();
  const [closed, setClosed] = useState<Record<string, boolean>>({}), [peek, setPeek] = useState(false);
  const overlay = variant === 'editor', expanded = overlay ? peek : menuExpanded;
  const toggle = (id: string) => setClosed(map => ({ ...map, [id]: !map[id] }));
  const frame = overlay ? `absolute inset-y-0 left-0 z-30 ${peek ? 'w-64 shadow-lg' : 'w-14'}` : `relative ${menuExpanded ? 'w-64' : 'w-14'}`;
  const openFolder = pathname.startsWith('/teacher/folders') ? params.get('folder') : null;
  const recent = folders.slice(0, 5);
  const fold = () => (overlay ? setPeek(open => !open) : setMenuExpanded(!menuExpanded));
  return <div className={`no-print hidden lg:block shrink-0 ${overlay ? 'w-14 relative' : ''}`}>
    <aside aria-label="Menu" className={`${frame} h-full flex flex-col border-r bg-[var(--ui-surface)] transition-[width] duration-150`}>
      <div className={`shrink-0 pt-3 pb-1 ${expanded ? 'px-4' : 'px-2 flex justify-center'}`}><Brand admin={nav.admin} compact={!expanded} /></div>
      <div className="flex-1 min-h-0 overflow-y-auto px-2 py-2 space-y-4">
        {!nav.admin && <Link href="/editor/new" title="Soạn đề thi mới" aria-label="Soạn đề thi mới" className={`app-button-primary flex items-center justify-center gap-2 min-h-11 rounded-xl text-sm font-semibold ${expanded ? 'px-4' : 'px-0'}`}><Plus className="w-4 h-4 shrink-0" />{expanded && <span>Soạn đề thi mới</span>}</Link>}
        <nav aria-label={nav.admin ? 'Quản trị' : 'Không gian giáo viên'} className="space-y-4">
          {nav.admin ? <>
            <Section id="admin" title="Quản trị" expanded={expanded} closed={closed} toggle={toggle}>{nav.items.map(item => <NavLink key={item.href} item={item} expanded={expanded} />)}</Section>
            <NavLink item={{ href: '/', label: 'Về khu giáo viên', Icon: FileText, active: false }} expanded={expanded} />
          </> : <>
            <Section id="compose" title="Soạn đề" expanded={expanded} closed={closed} toggle={toggle}>{nav.compose.map(item => <NavLink key={item.href} item={item} expanded={expanded} />)}</Section>
            {expanded && recent.length > 0 && <Section id="folders" title="Thư mục gần đây" expanded closed={closed} toggle={toggle}>
              {recent.map(folder => <Link key={folder.id} href={`/teacher/folders?folder=${folder.id}`} aria-current={openFolder === folder.id ? 'page' : undefined} title={folder.name} className={rowClass(openFolder === folder.id)}><FolderOpen className="w-4 h-4 shrink-0" style={{ color: folder.color || undefined }} /><span className="truncate flex-1">{folder.name}</span><span className="text-[10px] text-[var(--ui-text-secondary)]">{folder._count?.exams || 0}</span></Link>)}
            </Section>}
            <Section id="exams" title="Khảo thí & Lớp" expanded={expanded} closed={closed} toggle={toggle}>{nav.exams.map(item => <NavLink key={item.href} item={item} expanded={expanded} />)}</Section>
            <div className="pt-2 border-t"><NavLink item={nav.trash} expanded={expanded} /></div>
          </>}
        </nav>
      </div>
      <div className={`shrink-0 border-t p-2 flex items-center gap-2 ${expanded ? 'justify-between' : 'flex-col'}`}>
        {!nav.admin && user.role === 'SUPER_ADMIN'
          ? <Link href="/admin/users" title="Trang quản trị hệ thống" aria-label="Trang quản trị hệ thống" className={`min-h-9 flex items-center gap-2 rounded-lg text-xs font-semibold bg-[var(--ui-surface-variant)] hover:bg-[var(--ui-primary-container)] ${expanded ? 'px-3 flex-1' : 'justify-center w-9'}`}><ShieldCheck className="w-4 h-4 shrink-0" />{expanded && <span className="truncate">Quản trị hệ thống</span>}</Link>
          : <span />}
        <button type="button" onClick={fold} aria-label={expanded ? 'Thu gọn menu' : 'Mở rộng menu'} title={expanded ? 'Thu gọn menu' : 'Mở rộng menu'} className="w-9 h-9 rounded-full bg-[var(--ui-surface-variant)] hover:bg-[var(--ui-primary-container)] flex items-center justify-center cursor-pointer shrink-0">{expanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}</button>
      </div>
    </aside>
  </div>;
}

/** Phones and narrow windows: one row of tabs in place of the side menu. */
export function WorkspaceTabs({ variant }: { variant: WorkspaceVariant }) {
  const nav = useDestinations(variant);
  return <nav aria-label={nav.admin ? 'Quản trị' : 'Không gian giáo viên'} className="no-print lg:hidden shrink-0 flex gap-1 overflow-x-auto whitespace-nowrap px-3 sm:px-6 py-2 text-sm border-b bg-[var(--ui-surface)]">
    {nav.items.map(({ href, label, active }) => <Link key={href} href={href} aria-current={active ? 'page' : undefined} className={`min-h-10 shrink-0 inline-flex items-center px-3 rounded-lg ${active ? 'app-button-tonal font-semibold' : 'hover:bg-[var(--ui-surface-variant)]'}`}>{label}</Link>)}
  </nav>;
}
