'use client';
import { useState, type ComponentType } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Activity, ChevronDown, ChevronRight, Clock, Database, FileText, Folder, FolderPlus, GraduationCap, KeyRound, Menu, Plus, ShieldCheck, Star, Trash2, Users } from 'lucide-react';
import { useWorkspace, type FolderData } from './WorkspaceContext';

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
  ];
  const exams: Destination[] = [
    { href: '/teacher/groups', label: 'Lớp học', Icon: Users, active: pathname.startsWith('/teacher/groups') },
    { href: '/teacher/assignments', label: 'Bài đã giao', Icon: GraduationCap, active: pathname.startsWith('/teacher/assignments') },
  ];
  const trash: Destination = { href: '/?view=trash', label: 'Thùng rác', Icon: Trash2, active: onLibrary && view === 'trash' };
  return { admin: false as const, compose, exams, trash, folder: onLibrary ? folder : null, items: [...compose, ...exams, trash] };
}

const rowClass = (active: boolean) => `min-h-10 flex items-center gap-2.5 px-3 rounded-lg text-sm ${active ? 'app-button-tonal font-semibold' : 'text-[var(--ui-text-primary)] hover:bg-[var(--ui-surface-variant)]'}`;
const heading = 'px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--ui-text-secondary)]';

function NavLink({ item, expanded }: { item: Destination; expanded: boolean }) {
  const { Icon } = item;
  return <Link href={item.href} aria-current={item.active ? 'page' : undefined} aria-label={expanded ? undefined : item.label} title={item.label} className={`${rowClass(item.active)} ${expanded ? '' : 'justify-center px-0'}`}>
    <Icon className="w-4 h-4 shrink-0 text-[var(--ui-text-secondary)]" />{expanded && <span className="truncate">{item.label}</span>}
  </Link>;
}

function FolderRow({ folder, level, selected, expandedMap, toggle }: { folder: FolderData; level: 1 | 2; selected: string | null; expandedMap: Record<string, boolean>; toggle: (id: string) => void }) {
  const { openCreateFolder, deleteFolder } = useWorkspace();
  const hasChildren = Boolean(folder.children?.length), open = Boolean(expandedMap[folder.id]), active = selected === folder.id;
  return <div>
    <div className={`group flex items-center justify-between rounded-lg text-sm ${level === 2 ? 'pl-5' : ''} ${active ? 'app-button-tonal font-semibold' : 'hover:bg-[var(--ui-surface-variant)]'}`}>
      <div className="flex items-center min-w-0 flex-1">
        {level === 1 && (hasChildren
          ? <button type="button" aria-label={open ? 'Thu gọn thư mục' : 'Mở thư mục'} onClick={() => toggle(folder.id)} className="p-1 rounded cursor-pointer">{open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}</button>
          : <span className="w-5" />)}
        <Link href={`/?folder=${folder.id}`} aria-current={active ? 'page' : undefined} className="flex items-center gap-2 min-h-9 min-w-0 flex-1 pr-1">
          <Folder className="w-4 h-4 shrink-0" style={{ color: folder.color || undefined }} /><span className="truncate">{folder.name}</span>
        </Link>
      </div>
      <div className="flex items-center gap-1 pr-2 shrink-0">
        <span className="text-[10px] text-[var(--ui-text-secondary)]">{folder._count?.exams || 0}</span>
        {level === 1 && <button type="button" title="Thêm thư mục con vào đây" onClick={() => openCreateFolder(folder.id)} className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-0.5 rounded cursor-pointer"><Plus className="w-3 h-3" /></button>}
        <button type="button" title={level === 1 ? 'Xóa thư mục này' : 'Xóa thư mục con'} onClick={() => void deleteFolder(folder.id, folder.name)} className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-0.5 rounded cursor-pointer hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
      </div>
    </div>
    {open && hasChildren && <div className="pl-4">{folder.children!.map(sub => <FolderRow key={sub.id} folder={sub} level={2} selected={selected} expandedMap={expandedMap} toggle={toggle} />)}</div>}
  </div>;
}

/** Wide screens: the same menu on every page. In the editor it starts as a 56 px icon rail and opens over the page, so the editing area keeps its width. */
export function WorkspaceMenu({ variant }: { variant: WorkspaceVariant }) {
  const { menuExpanded, setMenuExpanded, user, folders, openCreateFolder } = useWorkspace();
  const nav = useDestinations(variant);
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});
  const overlay = variant === 'editor';
  const [peek, setPeek] = useState(false);
  const expanded = overlay ? peek : menuExpanded;
  const toggle = (id: string) => setExpandedMap(map => ({ ...map, [id]: !map[id] }));
  const frame = overlay
    ? `absolute inset-y-0 left-0 z-30 ${peek ? 'w-64 shadow-lg' : 'w-14'}`
    : `relative ${menuExpanded ? 'w-64' : 'w-14'}`;
  return <div className={`no-print hidden lg:block shrink-0 ${overlay ? 'w-14 relative' : ''}`}>
    <aside aria-label="Menu" className={`${frame} h-full flex flex-col gap-3 overflow-y-auto border-r bg-[var(--ui-surface)] p-2 transition-[width] duration-150`}>
      <button type="button" onClick={() => (overlay ? setPeek(open => !open) : setMenuExpanded(!menuExpanded))} aria-label={expanded ? 'Thu gọn menu' : 'Mở rộng menu'} title={expanded ? 'Thu gọn menu' : 'Mở rộng menu'} className="min-h-10 flex items-center gap-2.5 px-3 rounded-lg hover:bg-[var(--ui-surface-variant)] cursor-pointer text-[var(--ui-text-secondary)]">
        <Menu className="w-4 h-4 shrink-0" />{expanded && <span className="text-xs">Thu gọn</span>}
      </button>
      {!nav.admin && <Link href="/editor/new" title="Soạn đề thi mới" aria-label="Soạn đề thi mới" className={`app-button-primary flex items-center justify-center gap-2 min-h-11 rounded-xl text-sm font-semibold ${expanded ? 'px-4' : 'px-0'}`}><Plus className="w-4 h-4 shrink-0" />{expanded && <span>Soạn đề thi mới</span>}</Link>}
      <nav aria-label={nav.admin ? 'Quản trị' : 'Không gian giáo viên'} className="space-y-4">
        {nav.admin ? <div className="space-y-0.5">
          {expanded && <p className={heading}>Quản trị</p>}
          {nav.items.map(item => <NavLink key={item.href} item={item} expanded={expanded} />)}
          <NavLink item={{ href: '/', label: 'Về khu giáo viên', Icon: FileText, active: false }} expanded={expanded} />
        </div> : <>
          <div className="space-y-0.5">{expanded && <p className={heading}>Soạn đề</p>}{nav.compose.map(item => <NavLink key={item.href} item={item} expanded={expanded} />)}</div>
          {expanded
            ? <div>
              <div className="flex items-center justify-between pr-1"><p className={heading}>Thư mục của tôi</p>
                <button type="button" title="Tạo thư mục mới (Cấp 1)" aria-label="Tạo thư mục mới" onClick={() => openCreateFolder(null)} className="p-1 rounded-md hover:bg-[var(--ui-surface-variant)] cursor-pointer"><FolderPlus className="w-3.5 h-3.5 text-[var(--ui-text-secondary)]" /></button></div>
              {folders.length === 0
                ? <p className="px-3 py-2 text-[11px] text-[var(--ui-text-secondary)] italic">Chưa có thư mục nào. Bấm nút + ở trên để tạo.</p>
                : <div className="space-y-0.5">{folders.map(folder => <FolderRow key={folder.id} folder={folder} level={1} selected={nav.folder} expandedMap={expandedMap} toggle={toggle} />)}</div>}
            </div>
            : <button type="button" title="Thư mục của tôi" aria-label="Thư mục của tôi" onClick={() => (overlay ? setPeek(true) : setMenuExpanded(true))} className="w-full min-h-10 flex items-center justify-center rounded-lg hover:bg-[var(--ui-surface-variant)] cursor-pointer"><Folder className="w-4 h-4 text-[var(--ui-text-secondary)]" /></button>}
          <div className="space-y-0.5">{expanded && <p className={heading}>Khảo thí &amp; Lớp</p>}{nav.exams.map(item => <NavLink key={item.href} item={item} expanded={expanded} />)}</div>
          <div className="pt-2 border-t"><NavLink item={nav.trash} expanded={expanded} /></div>
        </>}
      </nav>
      {!nav.admin && user.role === 'SUPER_ADMIN' && <div className="mt-auto pt-3 border-t"><Link href="/admin/users" title="Trang quản trị hệ thống" aria-label="Trang quản trị hệ thống" className={`min-h-10 flex items-center gap-2.5 rounded-lg text-sm font-semibold bg-[var(--ui-surface-variant)] hover:bg-[var(--ui-primary-container)] ${expanded ? 'px-3' : 'justify-center'}`}><ShieldCheck className="w-4 h-4 shrink-0" />{expanded && <span>Trang quản trị hệ thống</span>}</Link></div>}
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
