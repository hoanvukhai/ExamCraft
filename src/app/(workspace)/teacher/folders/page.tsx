'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronRight, FileText, Folder, FolderOpen, FolderPlus, Pencil, Trash2, X } from 'lucide-react';
import { accountFetch } from '@/lib/account-fetch';
import { folderPalette, useWorkspace, type FolderData } from '@/components/workspace/WorkspaceContext';
import { EmptyState, LoadingBlock, PageBody, PageHeader, Panel, SearchField, Tag } from '@/components/workspace/ui';

interface FolderExam { id: string; title: string; updatedAt: string }
const flatten = (folders: FolderData[]) => folders.flatMap(folder => [folder, ...(folder.children ?? [])]);

function EditDialog({ folder, onClose }: { folder: FolderData; onClose: () => void }) {
  const { updateFolder } = useWorkspace();
  const [name, setName] = useState(folder.name), [color, setColor] = useState(folder.color || folderPalette[1]), [busy, setBusy] = useState(false);
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    const ok = await updateFolder(folder.id, { name: name.trim(), color });
    setBusy(false);
    if (ok) onClose();
  };
  return <div role="dialog" aria-modal="true" aria-label="Sửa thư mục" className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center">
    <form onSubmit={save} className="app-dialog bg-[var(--ui-surface)] rounded-2xl p-6 max-w-sm w-full border shadow-xs space-y-4">
      <div className="flex items-center justify-between"><h2 className="font-semibold text-sm">Sửa thư mục</h2><button type="button" aria-label="Đóng hộp thoại" onClick={onClose} className="p-1 rounded-lg hover:bg-[var(--ui-surface-variant)] cursor-pointer"><X className="w-4 h-4" /></button></div>
      <label className="block text-xs font-semibold space-y-1.5"><span>Tên thư mục</span><input type="text" required autoFocus value={name} onChange={event => setName(event.target.value)} className="teacher-field w-full" /></label>
      <div className="space-y-1.5"><p className="text-xs font-semibold">Màu</p><div className="flex items-center gap-2">{folderPalette.map(item => <button key={item} type="button" aria-label={`Màu ${item}`} onClick={() => setColor(item)} className={`w-6 h-6 rounded-lg cursor-pointer ${color === item ? 'scale-125 ring-2 ring-black/40' : ''}`} style={{ backgroundColor: item }} />)}</div></div>
      <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="app-button-secondary min-h-10 px-4 text-sm">Hủy</button><button type="submit" disabled={busy || !name.trim()} className="app-button-primary min-h-10 px-4 text-sm disabled:opacity-50">{busy ? 'Đang lưu...' : 'Lưu'}</button></div>
    </form>
  </div>;
}

function FolderExams({ folderId }: { folderId: string }) {
  const { user } = useWorkspace();
  const [state, setState] = useState<{ folderId: string; exams: FolderExam[] | null; error: string }>({ folderId, exams: null, error: '' });
  useEffect(() => {
    let live = true;
    accountFetch(user.id, `/api/exams?folderId=${encodeURIComponent(folderId)}&limit=50`).then(async response => {
      const data = await response.json();
      if (!live) return;
      setState(response.ok ? { folderId, exams: data.exams || [], error: '' } : { folderId, exams: [], error: data.error || 'Chưa tải được đề trong thư mục.' });
    }).catch(() => { if (live) setState({ folderId, exams: [], error: 'Chưa kết nối được để tải đề trong thư mục.' }); });
    return () => { live = false; };
  }, [folderId, user.id]);
  if (state.folderId !== folderId || state.exams === null) return <LoadingBlock text="Đang tải đề trong thư mục..." />;
  if (state.error) return <p role="alert" className="border rounded-lg p-3 text-sm">{state.error}</p>;
  if (!state.exams.length) return <EmptyState Icon={FileText} title="Thư mục này chưa có đề" text="Mở một đề trong Kho đề và chuyển nó vào đây." action={<Link href="/" className="app-button-secondary inline-flex items-center min-h-10 px-4 text-sm">Về Kho đề</Link>} />;
  return <Panel className="divide-y">{state.exams.map(exam => <Link key={exam.id} href={`/editor/${exam.id}`} className="flex items-center gap-3 px-4 min-h-12 text-sm hover:bg-[var(--ui-surface-variant)]"><FileText className="w-4 h-4 shrink-0 text-[var(--ui-text-secondary)]" /><span className="truncate flex-1">{exam.title}</span><span className="text-xs text-[var(--ui-text-secondary)] shrink-0">{new Date(exam.updatedAt).toLocaleDateString('vi-VN')}</span></Link>)}</Panel>;
}

export default function TeacherFoldersPage() {
  const { folders, openCreateFolder, deleteFolder } = useWorkspace(), params = useSearchParams();
  const [term, setTerm] = useState(''), [editing, setEditing] = useState<FolderData | null>(null);
  const all = flatten(folders), openId = params.get('folder'), current = all.find(folder => folder.id === openId) || null;
  const parent = current?.parentId ? all.find(folder => folder.id === current.parentId) : null;
  const shown = (current ? current.children ?? [] : folders).filter(folder => folder.name.toLowerCase().includes(term.trim().toLowerCase()));

  return <PageBody>
    <PageHeader
      title={current ? current.name : 'Thư mục'}
      description={current ? 'Các đề và thư mục con nằm trong thư mục này.' : 'Gom đề thi theo khối, học kỳ hay chuyên đề. Mở một thư mục để xem các đề bên trong.'}
      actions={<>
        {current && <button type="button" onClick={() => setEditing(current)} className="app-button-secondary inline-flex items-center gap-2 min-h-10 px-4 text-sm"><Pencil className="w-4 h-4" /><span>Sửa</span></button>}
        {current && <button type="button" onClick={() => void deleteFolder(current.id, current.name)} className="app-button-secondary inline-flex items-center gap-2 min-h-10 px-4 text-sm text-red-700 dark:text-red-300"><Trash2 className="w-4 h-4" /><span>Xóa</span></button>}
        {(!current || !current.parentId) && <button type="button" onClick={() => openCreateFolder(current?.id ?? null)} className="app-button-primary inline-flex items-center gap-2 min-h-10 px-4 text-sm font-semibold"><FolderPlus className="w-4 h-4" /><span>{current ? 'Tạo thư mục con' : 'Tạo thư mục'}</span></button>}
      </>}
    />
    <nav aria-label="Đường dẫn thư mục" className="flex flex-wrap items-center gap-1.5 text-sm">
      <Link href="/teacher/folders" className={current ? 'text-[var(--ui-text-secondary)] hover:underline' : 'font-semibold'}>Tất cả thư mục</Link>
      {parent && <><ChevronRight className="w-3.5 h-3.5 text-[var(--ui-text-secondary)]" /><Link href={`/teacher/folders?folder=${parent.id}`} className="text-[var(--ui-text-secondary)] hover:underline">{parent.name}</Link></>}
      {current && <><ChevronRight className="w-3.5 h-3.5 text-[var(--ui-text-secondary)]" /><span className="font-semibold">{current.name}</span></>}
    </nav>
    {(folders.length > 0 || current) && <div className="flex flex-wrap items-center gap-3"><SearchField value={term} onChange={setTerm} placeholder="Tìm thư mục..." label="Tìm thư mục" /></div>}
    {shown.length > 0 && <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
      {shown.map(folder => <article key={folder.id} className="rounded-xl border bg-[var(--ui-surface)] hover:bg-[var(--ui-surface-variant)] transition-colors">
        <Link href={`/teacher/folders?folder=${folder.id}`} className="flex items-center gap-3 p-4">
          <span className="w-10 h-10 rounded-xl bg-[var(--ui-surface-variant)] flex items-center justify-center shrink-0"><Folder className="w-5 h-5" style={{ color: folder.color || undefined }} /></span>
          <span className="min-w-0 flex-1"><span className="block font-semibold text-sm truncate">{folder.name}</span><span className="block text-xs text-[var(--ui-text-secondary)] mt-0.5">{folder._count?.exams ?? 0} đề{folder.children?.length ? ` · ${folder.children.length} thư mục con` : ''}</span></span>
        </Link>
      </article>)}
    </div>}
    {!current && folders.length === 0 && <EmptyState Icon={FolderOpen} title="Chưa có thư mục nào" text="Tạo thư mục để gom các đề thi theo khối, học kỳ hay chuyên đề." action={<button type="button" onClick={() => openCreateFolder(null)} className="app-button-primary inline-flex items-center gap-2 min-h-10 px-4 text-sm font-semibold"><FolderPlus className="w-4 h-4" /><span>Tạo thư mục</span></button>} />}
    {!current && folders.length > 0 && shown.length === 0 && <EmptyState Icon={Folder} title="Không có thư mục khớp" text="Thử từ khóa khác." />}
    {current && <section className="space-y-3"><h2 className="text-sm font-semibold flex items-center gap-2">Đề trong thư mục <Tag>{current._count?.exams ?? 0}</Tag></h2><FolderExams folderId={current.id} /></section>}
    {editing && <EditDialog key={editing.id} folder={editing} onClose={() => setEditing(null)} />}
  </PageBody>;
}
