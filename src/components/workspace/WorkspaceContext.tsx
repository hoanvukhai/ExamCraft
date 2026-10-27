'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, FolderPlus, X } from 'lucide-react';
import { accountFetch } from '@/lib/account-fetch';
import { teacherErrorMessage } from '@/lib/teacher-ui';
import { useConfirmAction } from '@/components/ConfirmAction';
import { ApiKeyModal } from '@/components/ApiKeyModal';
import { AiLearningModal } from '@/components/AiLearningModal';
import { TeacherAiSecretaryDrawer } from '@/components/TeacherAiSecretaryDrawer';

export interface WorkspaceUser { id: string; name: string; email: string; role: string }
export interface FolderData { id: string; name: string; color?: string; parentId?: string | null; _count?: { exams: number }; children?: FolderData[] }

interface Workspace {
  user: WorkspaceUser;
  folders: FolderData[];
  reloadFolders: () => Promise<void>;
  openCreateFolder: (parentId?: string | null) => void;
  deleteFolder: (id: string, name: string) => Promise<void>;
  keyCount: number;
  hasActiveKey: boolean;
  openKeys: () => void;
  assistantOpen: boolean;
  toggleAssistant: () => void;
  openAiNotes: () => void;
  menuExpanded: boolean;
  setMenuExpanded: (value: boolean) => void;
  topbarSlot: HTMLElement | null;
  setTopbarSlot: (element: HTMLElement | null) => void;
  toast: (message: string) => void;
  confirmAction: (message: string) => Promise<boolean>;
}

const WorkspaceContext = createContext<Workspace | null>(null);
export function useWorkspace(): Workspace {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error('useWorkspace must be used inside the workspace frame.');
  return value;
}

const menuKey = 'examcraft_menu_collapsed';
const palette = ['#202124', '#3c4043', '#5f6368', '#80868b', '#9aa0a6', '#bdc1c6'];

/** Holds what every teacher page shares: folders, AI key status, the assistant and notes dialogs, the menu state and one confirmation/toast. */
export function WorkspaceProvider({ user, children }: { user: WorkspaceUser; children: ReactNode }) {
  const router = useRouter(), params = useSearchParams();
  const { confirmAction, confirmation } = useConfirmAction();
  const [folders, setFolders] = useState<FolderData[]>([]);
  const [keyCount, setKeyCount] = useState(0);
  const [keysOpen, setKeysOpen] = useState(false), [notesOpen, setNotesOpen] = useState(false), [assistantOpen, setAssistantOpen] = useState(false);
  const [folderDialog, setFolderDialog] = useState<{ parentId: string | null } | null>(null);
  const [folderName, setFolderName] = useState(''), [folderColor, setFolderColor] = useState('#3c4043');
  const [menuExpanded, setMenuState] = useState(true);
  const [topbarSlot, setTopbarSlot] = useState<HTMLElement | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try { if (localStorage.getItem(menuKey) === '1') { // eslint-disable-next-line react-hooks/set-state-in-effect
      setMenuState(false); } } catch { /* A per-viewer convenience only. */ }
  }, []);
  const setMenuExpanded = useCallback((value: boolean) => {
    setMenuState(value);
    try { localStorage.setItem(menuKey, value ? '0' : '1'); } catch { /* ignore */ }
  }, []);
  const toast = useCallback((message: string) => {
    setToastMessage(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMessage(null), 3500);
  }, []);

  const reloadKeys = useCallback(() => accountFetch(user.id, '/api/user/keys').then(async response => {
    if (response.ok) { const data = await response.json(); setKeyCount((data.keys || []).filter((key: { isActive: boolean }) => key.isActive).length); }
  }).catch(() => { /* Keep the last acknowledged state if offline. */ }), [user.id]);
  const reloadFolders = useCallback(() => accountFetch(user.id, '/api/folders').then(async response => {
    if (response.ok) { const data = await response.json(); setFolders(data.folders || []); }
  }).catch(() => { /* The menu keeps the last list while offline. */ }), [user.id]);
  useEffect(() => { void reloadKeys(); void reloadFolders(); }, [reloadKeys, reloadFolders]);

  const openCreateFolder = useCallback((parentId: string | null = null) => { setFolderName(''); setFolderDialog({ parentId }); }, []);
  const createFolder = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!folderName.trim() || !folderDialog) return;
    try {
      const response = await accountFetch(user.id, '/api/folders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: folderName.trim(), color: folderColor, parentId: folderDialog.parentId }) });
      const data = await response.json();
      if (!response.ok) { toast(data.error || 'Không thể tạo thư mục'); return; }
      toast('Đã tạo thư mục mới thành công!'); setFolderDialog(null); setFolderName(''); void reloadFolders();
    } catch { toast('Lỗi kết nối máy chủ khi tạo thư mục'); }
  };
  const deleteFolder = useCallback(async (id: string, name: string) => {
    if (!await confirmAction(`Xóa thư mục “${name}”? Các đề bên trong được chuyển ra ngoài, không bị xóa.`)) return;
    try {
      const response = await accountFetch(user.id, `/api/folders/${id}`, { method: 'DELETE' });
      if (!response.ok) { const result = await response.json(); throw Error(result.error || 'Chưa xóa được thư mục.'); }
      toast('Đã xóa thư mục.');
      if (params.get('folder') === id) router.push('/');
      await reloadFolders(); router.refresh();
    } catch (cause) { toast(teacherErrorMessage(cause, 'Chưa kết nối được để xóa thư mục. Hãy thử lại.')); }
  }, [confirmAction, params, reloadFolders, router, toast, user.id]);

  const value = useMemo<Workspace>(() => ({
    user, folders, reloadFolders, openCreateFolder, deleteFolder, keyCount, hasActiveKey: keyCount > 0, openKeys: () => setKeysOpen(true),
    assistantOpen, toggleAssistant: () => setAssistantOpen(open => !open), openAiNotes: () => setNotesOpen(true),
    menuExpanded, setMenuExpanded, topbarSlot, setTopbarSlot, toast, confirmAction,
  }), [user, folders, reloadFolders, openCreateFolder, deleteFolder, keyCount, assistantOpen, menuExpanded, setMenuExpanded, topbarSlot, toast, confirmAction]);

  return <WorkspaceContext.Provider value={value}>
    {children}
    {confirmation}
    {folderDialog && <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <form onSubmit={createFolder} className="app-dialog bg-[var(--ui-surface)] rounded-2xl p-6 max-w-sm w-full border shadow-xs">
        <div className="app-dialog-header flex items-center justify-between pb-3 border-b mb-4">
          <h3 className="font-semibold text-sm flex items-center gap-2"><FolderPlus className="w-4 h-4" /><span>{folderDialog.parentId ? 'Tạo Thư Mục Con (Cấp 2)' : 'Tạo Thư Mục Mới (Cấp 1)'}</span></h3>
          <button aria-label="Đóng hộp thoại" type="button" onClick={() => setFolderDialog(null)} className="p-1 rounded-lg hover:bg-[var(--ui-surface-variant)] cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3 mb-5">
          <div><label htmlFor="workspace-folder-name" className="block text-xs font-semibold text-[var(--ui-text-secondary)] mb-1">Tên thư mục</label>
            <input id="workspace-folder-name" type="text" required autoFocus value={folderName} onChange={event => setFolderName(event.target.value)} placeholder="Ví dụ: Khối 12, Học kỳ 1, Ôn thi HSG..." className="teacher-field w-full px-3.5 text-sm" /></div>
          <div><span className="block text-xs font-semibold text-[var(--ui-text-secondary)] mb-1">Màu sắc nhận diện</span>
            <div className="flex items-center gap-2">{palette.map(color => <button key={color} type="button" aria-label={`Màu ${color}`} onClick={() => setFolderColor(color)} className={`w-6 h-6 rounded-lg cursor-pointer transition-transform ${folderColor === color ? 'scale-125 ring-2 ring-black/40' : ''}`} style={{ backgroundColor: color }} />)}</div></div>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button type="button" onClick={() => setFolderDialog(null)} className="app-button-secondary min-h-10 px-4 text-sm">Hủy</button>
          <button type="submit" className="app-button-primary min-h-10 px-4 text-sm font-semibold">Tạo thư mục</button>
        </div>
      </form>
    </div>}
    {toastMessage && <div role="status" className="no-print fixed bottom-6 right-6 z-50 bg-[var(--ui-accent)] text-[var(--ui-on-primary)] px-4 py-2.5 rounded-full text-xs font-semibold shadow-xs flex items-center gap-2"><Check className="w-4 h-4" /><span>{toastMessage}</span></div>}
    <ApiKeyModal ownerId={user.id} key={`keys:${user.id}`} isOpen={keysOpen} onClose={() => { setKeysOpen(false); void reloadKeys(); }} onKeyUpdated={() => void reloadKeys()} />
    <AiLearningModal isOpen={notesOpen} onClose={() => setNotesOpen(false)} currentUser={{ id: user.id, name: user.name }} />
    <TeacherAiSecretaryDrawer isOpen={assistantOpen} onClose={() => setAssistantOpen(false)} currentUser={user} onOpenAiLearningModal={() => setNotesOpen(true)} />
  </WorkspaceContext.Provider>;
}
