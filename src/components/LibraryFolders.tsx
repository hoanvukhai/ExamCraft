'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Folder, FolderPlus, Pencil, Trash2 } from 'lucide-react';
import { folderPalette, useWorkspace, type FolderData } from './workspace/WorkspaceContext';

export function LibraryFolders({ folderId, showCards }: { folderId: string | null; showCards: boolean }) {
  const { folders, foldersReady, foldersError, reloadFolders, openCreateFolder, updateFolder, deleteFolder } = useWorkspace();
  const all = folders.flatMap(folder => [folder, ...(folder.children ?? [])]);
  const current = all.find(folder => folder.id === folderId), parent = all.find(folder => folder.id === current?.parentId);
  const [editing, setEditing] = useState<FolderData | null>(null), [name, setName] = useState(''), [color, setColor] = useState(''), [busy, setBusy] = useState(false);
  const cards = current ? current.children ?? [] : folders;
  if (foldersError) return <div role="alert" className="border rounded-xl p-4 mb-4 text-sm"><p>{foldersError}</p><button type="button" className="underline min-h-10" onClick={() => void reloadFolders()}>Thử tải thư mục</button></div>;
  if (!foldersReady) return <p role="status" className="text-sm mb-4">Đang tải thư mục...</p>;
  if (folderId && !current) return <p role="alert" className="border rounded-xl p-4 mb-4">Không tìm thấy thư mục được phép xem. <Link className="underline" href="/">Về kho đề</Link></p>;
  return <section aria-label="Thư mục" className="space-y-4 mb-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <nav aria-label="Đường dẫn thư mục" className="flex flex-wrap items-center gap-1.5 text-sm"><Link href="/" className={current ? 'underline' : 'font-semibold'}>Kho đề</Link>{parent && <><ChevronRight size={14} /><Link className="underline" href={`/?folder=${encodeURIComponent(parent.id)}`}>{parent.name}</Link></>}{current && <><ChevronRight size={14} /><span className="font-semibold">{current.name}</span></>}</nav>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {current && <><button type="button" className="app-button-secondary min-h-10 px-3 inline-flex gap-2 items-center" onClick={() => { setEditing(current); setName(current.name); setColor(current.color || folderPalette[1]); }}><Pencil size={14} />Sửa thư mục</button><button type="button" className="app-button-secondary min-h-10 px-3 inline-flex gap-2 items-center" onClick={() => void deleteFolder(current.id, current.name)}><Trash2 size={14} />Xóa thư mục</button></>}
        {(!current || !current.parentId) && <button type="button" className="app-button-secondary min-h-10 px-3 inline-flex gap-2 items-center" onClick={() => openCreateFolder(current?.id ?? null)}><FolderPlus size={16} />{current ? 'Tạo thư mục con' : 'Tạo thư mục'}</button>}
      </div>
    </div>
    {showCards && <><h2 className="text-sm font-semibold">{current ? 'Thư mục con' : 'Thư mục của tôi'}</h2>{cards.length ? <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">{cards.map(folder => <Link key={folder.id} data-library-folder={folder.id} href={`/?folder=${encodeURIComponent(folder.id)}`} className="border rounded-xl bg-[var(--ui-surface)] hover:bg-[var(--ui-surface-variant)] p-4 flex items-center gap-3 min-w-0"><Folder className="w-6 h-6 shrink-0 dark:!text-[var(--ui-text-primary)]" style={{ color: folder.color || undefined }} /><span className="min-w-0"><span className="block font-semibold text-sm truncate">{folder.name}</span><span className="text-xs text-[var(--ui-text-secondary)]">{folder._count?.exams ?? 0} đề{folder.children?.length ? ` · ${folder.children.length} thư mục con` : ''}</span></span></Link>)}</div> : <p className="text-sm text-[var(--ui-text-secondary)]">{current ? 'Chưa có thư mục con.' : 'Bạn có thể tạo thư mục để sắp xếp đề; cũng có thể tạo đề ngay tại đây.'}</p>}</>}
    {editing && <div role="dialog" aria-modal="true" aria-label="Sửa thư mục" className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center"><form className="app-dialog w-full max-w-sm p-6 space-y-4" onSubmit={async event => { event.preventDefault(); if (busy || !name.trim()) return; setBusy(true); try { if (await updateFolder(editing.id, { name: name.trim(), color })) setEditing(null); } finally { setBusy(false); } }}><h2 className="font-semibold">Sửa thư mục</h2><label className="block text-sm">Tên thư mục<input autoFocus required className="teacher-field w-full" value={name} onChange={e => setName(e.target.value)} /></label><div className="flex gap-2">{folderPalette.map(item => <button key={item} type="button" aria-label={`Màu ${item}`} aria-pressed={color === item} style={{ background: item }} className={`w-8 h-8 rounded-lg ${item === color ? 'ring-2 ring-offset-2' : ''}`} onClick={() => setColor(item)} />)}</div><div className="flex justify-end gap-3"><button type="button" className="app-button-secondary min-h-10 px-3" onClick={() => setEditing(null)}>Hủy</button><button disabled={busy || !name.trim()} className="app-button-primary min-h-10 px-3">{busy ? 'Đang lưu...' : 'Lưu'}</button></div></form></div>}
  </section>;
}
