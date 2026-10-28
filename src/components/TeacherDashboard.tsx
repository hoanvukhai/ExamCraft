'use client';

import { ExamLibraryModal } from './ExamLibraryModal';
import { LibraryFolders } from './LibraryFolders';
import { SearchField } from '@/components/workspace/ui';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { useConfirmAction } from './ConfirmAction';
import { subjectLabel, teacherErrorMessage } from '@/lib/teacher-ui';
import { Sparkles, Plus, Folder, FileText, Star, Trash2, RotateCcw, Download, Edit3, Copy, LayoutGrid, List, Upload, X } from 'lucide-react';
import { GenerateModal } from '@/components/GenerateModal';
import { ImportModal } from '@/components/ImportModal';
import { exportExamToDocx } from '@/lib/docx-export';
import { prepareExportFigures } from '@/lib/export-figures';
import { Exam } from '@/types/exam';
import { loadExam, persistExam } from '@/lib/exam-client';
import { writeDraft } from '@/lib/exam-draft';
import { accountFetch } from '@/lib/account-fetch';
import { AccountRecovery } from '@/components/editor/AccountRecovery';
import { getCatalogSubjects } from '@/lib/education-catalog';

interface ExamSummary {
  permissions?: Exam['access'];
  id: string;
  version: number;
  title: string;
  subject: string;
  grade: number;
  durationMinutes?: number | null;
  isStarred: boolean;
  folderId?: string | null;
  folder?: { id: string; name: string; color?: string } | null;
  updatedAt: string;
  createdAt: string;
  deletedAt?: string | null;
  _count?: {
    items: number;
    assignments: number;
  };
}

interface TeacherDashboardProps {
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ currentUser }) => {
  const router = useRouter();
  const { folders, foldersReady, foldersError, reloadFolders, toast: showToast } = useWorkspace();

  // State dữ liệu
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const location = useSearchParams();
  const page = Math.max(1, Number(location.get('page')) || 1);
  const changeLocation = (key: string, value: string | null) => {
    const params = new URLSearchParams(window.location.search);
    if ((params.get(key) || null) === (value || null)) return;
    setIsLoading(true); setLoadError('');
    if (value) params.set(key, value); else params.delete(key);
    if (key === 'view' && value === 'trash') params.delete('folder');
    if (key === 'folder' && value) params.delete('view');
    if (key !== 'page') params.delete('page');
    const url = '/?' + params.toString();
    if (key === 'search') window.history.replaceState(null, '', url); else window.history.pushState(null, '', url);
  };
  const setPage = (value: React.SetStateAction<number>) => changeLocation('page', String(typeof value === 'function' ? value(page) : value));
  const [totalPages, setTotalPages] = useState(1);
  const [totalExams, setTotalExams] = useState(0);
  const loadSequence = useRef(0);
  const [loadedQuery, setLoadedQuery] = useState('');

  // Bộ lọc & Điều hướng
  const currentView = ['starred', 'recent', 'trash'].includes(location.get('view') || '') ? location.get('view') as 'starred' | 'recent' | 'trash' : 'all';
  const setCurrentView = (value: string) => changeLocation('view', value === 'all' ? null : value);
  const selectedFolderId = location.get('folder');
  const searchQuery = location.get('search') || '';
  const setSearchQuery = (value: string) => changeLocation('search', value);
  const selectedSubject = location.get('subject') || 'all';
  const setSelectedSubject = (value: string) => changeLocation('subject', value === 'all' ? null : value);
  const selectedGrade = location.get('grade') || 'all';
  const setSelectedGrade = (value: string) => changeLocation('grade', value === 'all' ? null : value);
  const queryKey = JSON.stringify([currentUser.id, currentView, selectedFolderId, searchQuery, selectedSubject, selectedGrade, page]);
  const pendingList = isLoading || loadedQuery !== queryKey;
  const rootScope = currentView === 'all' && !selectedFolderId && !searchQuery.trim() && selectedSubject === 'all' && selectedGrade === 'all';
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modals & Popups
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Thao tác với đề thi
  const [isRenameExamModalOpen, setIsRenameExamModalOpen] = useState(false);
  const [isMoveExamModalOpen, setIsMoveExamModalOpen] = useState(false);
  const [activeExam, setActiveExam] = useState<ExamSummary | null>(null);
  const [newExamTitle, setNewExamTitle] = useState('');
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [pendingExam, setPendingExam] = useState('');
  const mutation = useRef(false);
  const { confirmAction, confirmation } = useConfirmAction();

  // Key stats


  // Nạp danh sách Đề thi theo bộ lọc
  const readExams = useCallback(() => {
    const sequence = ++loadSequence.current;
    setIsLoading(true); setLoadError(''); setExams([]);
      const params = new URLSearchParams();
      params.set('page', String(page)); params.set('limit', '20');
      if (searchQuery) params.append('search', searchQuery);
      if (rootScope) params.set('location', 'root');
      if (selectedSubject !== 'all') params.append('subject', selectedSubject);
      if (selectedGrade !== 'all') params.append('grade', selectedGrade);

      if (currentView === 'trash') {
        params.append('isTrash', 'true');
      } else {
        if (currentView === 'starred') {
          params.append('isStarred', 'true');
        }
        if (currentView === 'recent') params.set('recent', 'true');
        if (selectedFolderId) {
          params.append('folderId', selectedFolderId);
        }
      }

      return accountFetch(currentUser.id, `/api/exams?${params.toString()}`).then(async res => {
      if (res.ok) {
        const data = await res.json();
        if (sequence !== loadSequence.current) return;
        setExams(data.exams || []);
        setTotalPages(Math.max(1, data.pagination?.totalPages ?? 1));
        setTotalExams(data.pagination?.totalCount ?? 0);
        if (page > Math.max(1, data.pagination?.totalPages ?? 1)) { const params = new URLSearchParams(window.location.search); params.set('page', String(Math.max(1, data.pagination?.totalPages ?? 1))); window.history.replaceState(null, '', '/?' + params); }
      } else {
        const data = await res.json();
        if (sequence === loadSequence.current) setLoadError(data.error || 'Chưa tải được kho đề.');
      }
      }).catch(() => { if (sequence === loadSequence.current) setLoadError('Chưa kết nối được để tải kho đề. Hãy thử lại.'); }).finally(() => {
        if (sequence === loadSequence.current) { setLoadedQuery(queryKey); setIsLoading(false); }
      });
  }, [currentUser.id, currentView, selectedFolderId, selectedSubject, selectedGrade, searchQuery, page, rootScope, queryKey]);
  const loadExams = () => { setIsLoading(true); return readExams(); };

  // Refresh folder counts when returning from the editor to this screen.
  useEffect(() => { void reloadFolders(); }, [reloadFolders]);

  useEffect(() => {
    // Prevent actions on rows belonging to the previous view while loading this one.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void readExams();
  }, [readExams]);

  // Đổi trạng thái Gắn sao (Starred)
  const handleToggleStar = async (exam: ExamSummary, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await accountFetch(currentUser.id, `/api/exams/${exam.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isStarred: !exam.isStarred, baseVersion: exam.version }),
      });
      if (!res.ok) { const result = await res.json(); showToast(result.error || 'Thao tác chưa được lưu'); await loadExams(); return; }
      if (res.ok) {
        await loadExams();
      }
    } catch {
      // ignore
    }
  };

  // Đổi tên đề thi
  const handleRenameExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeExam || !newExamTitle.trim()) return;

    try {
      const res = await accountFetch(currentUser.id, `/api/exams/${activeExam.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newExamTitle.trim(), baseVersion: activeExam.version }),
      });
      if (!res.ok) { const result = await res.json(); showToast(result.error || 'Thao tác chưa được lưu'); await loadExams(); return; }
      if (res.ok) {
        showToast('Đã đổi tên đề thi thành công!');
        setIsRenameExamModalOpen(false);
        await loadExams();
      }
    } catch {
      alert('Lỗi khi đổi tên đề thi');
    }
  };

  // Di chuyển đề thi vào thư mục
  const handleMoveExam = async (targetFolderId: string | null) => {
    if (!activeExam) return;

    try {
      const res = await accountFetch(currentUser.id, `/api/exams/${activeExam.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId: targetFolderId, baseVersion: activeExam.version }),
      });
      if (!res.ok) { const result = await res.json(); showToast(result.error || 'Thao tác chưa được lưu'); await loadExams(); return; }
      if (res.ok) {
        showToast('Đã di chuyển đề thi vào thư mục mới!');
        setIsMoveExamModalOpen(false);
        loadExams();
        reloadFolders();
      }
    } catch {
      alert('Lỗi khi di chuyển đề thi');
    }
  };

  // Xóa đề thi vào thùng rác
  const handleDeleteExam = async (examId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (mutation.current) return;
    const item = exams.find(exam => exam.id === examId);
    if (!item || item.permissions?.canManage === false) return;
    const restore = currentView === 'trash';
    mutation.current = true; setPendingExam(examId); setActionError('');
    try {
      if (!restore && !await confirmAction(`Chuyển “${item.title}” vào thùng rác? Bạn có thể khôi phục sau.`)) return;
      const res = await accountFetch(currentUser.id, `/api/exams/${examId}`, restore ? { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ restore: true, baseVersion: item.version }) } : { method: 'DELETE', headers: { 'If-Match': String(item.version) } });
      const result = await res.json();
      if (!res.ok) throw Error(result.error || 'Thao tác chưa được lưu.');
      showToast(restore ? 'Đã khôi phục đề.' : 'Đã chuyển đề vào thùng rác.');
      await loadExams(); await reloadFolders();
    } catch (cause) { setActionError(teacherErrorMessage(cause, 'Chưa kết nối được. Hãy thử lại thao tác.')); }
    finally { mutation.current = false; setPendingExam(''); }
  };

  // Xóa vĩnh viễn: chỉ trong thùng rác, có xác nhận riêng; máy chủ từ chối nếu đề đã giao
  const purgeOne = async (item: ExamSummary) => {
    const res = await accountFetch(currentUser.id, `/api/exams/${item.id}?permanent=1`, { method: 'DELETE' });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) throw Error(result.error || 'Chưa xóa vĩnh viễn được.');
  };
  const handlePurgeExam = async (examId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (mutation.current || currentView !== 'trash') return;
    const item = exams.find(exam => exam.id === examId);
    if (!item || item.permissions?.canManage === false) return;
    mutation.current = true; setPendingExam(examId); setActionError('');
    try {
      if (!await confirmAction(`Xóa vĩnh viễn “${item.title}”? Không thể khôi phục. Các câu hỏi đã lưu trong Ngân hàng câu hỏi không bị xóa.`)) return;
      await purgeOne(item);
      showToast('Đã xóa vĩnh viễn đề.');
      await loadExams(); await reloadFolders();
    } catch (cause) { setActionError(teacherErrorMessage(cause, 'Chưa kết nối được. Hãy thử lại thao tác.')); }
    finally { mutation.current = false; setPendingExam(''); }
  };
  const handleEmptyTrash = async () => {
    if (mutation.current || currentView !== 'trash' || !exams.length) return;
    const targets = exams.filter(exam => exam.permissions?.canManage !== false);
    mutation.current = true; setPendingExam('all'); setActionError('');
    try {
      if (!await confirmAction(`Xóa vĩnh viễn ${targets.length} đề đang hiển thị trong thùng rác? Không thể khôi phục. Đề đã giao cho học sinh sẽ được giữ lại.`)) return;
      let removed = 0; const failures: string[] = [];
      for (const item of targets) { try { await purgeOne(item); removed++; } catch (cause) { failures.push(`“${item.title}”: ${teacherErrorMessage(cause, 'chưa xóa được')}`); } }
      if (removed) showToast(`Đã xóa vĩnh viễn ${removed} đề.`);
      if (failures.length) setActionError(`${failures.length} đề chưa xóa được. ${failures[0]}`);
      await loadExams(); await reloadFolders();
    } finally { mutation.current = false; setPendingExam(''); }
  };

  // Nhân bản đề thi (Clone)
  const handleCloneExam = async (exam: ExamSummary, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const original = await loadExam(exam.id, currentUser.id);
      await persistExam({ ...original, id: 'draft_' + crypto.randomUUID(), serverId: undefined, version: undefined, creationFolderId: selectedFolderId ?? null, metadata: { ...original.metadata, title: original.metadata.title + ' (Bản sao)' } }, currentUser.id);
      const resCreate = { ok: true };

      if (resCreate.ok) {
        showToast('Đã nhân bản đề thi thành công!');
        loadExams();
        reloadFolders();
      }
    } catch {
      alert('Lỗi khi nhân bản đề thi');
    }
  };

  // Mở soạn thảo đề thi
  const handleOpenEditor = (examId?: string) => {
    if (examId) {
      router.push(`/editor/${examId}`);
    } else {
      router.push(selectedFolderId ? `/editor/new?folder=${encodeURIComponent(selectedFolderId)}` : '/editor/new');
    }
  };

  // Khi AI sinh đề thành công từ Dashboard
  const handleExamGeneratedFromAi = async (generatedExam: Exam) => {
    // Keep the preview open if preserving the draft fails.
    writeDraft(localStorage, currentUser.id, 'new', { ...generatedExam, id: 'draft_' + crypto.randomUUID(), serverId: undefined, version: undefined, creationFolderId: selectedFolderId ?? null });
    setIsGenerateModalOpen(false);
    showToast('Đã giữ bản nháp. Đang mở bàn soạn...');
    router.push(selectedFolderId ? `/editor/new?folder=${encodeURIComponent(selectedFolderId)}` : '/editor/new');
  };

  // Xuất file Word nhanh từ danh sách
  const handleQuickExportDocx = async (examSummary: ExamSummary, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      showToast('Đang chuẩn bị file Word...');
      const fullExamObj = await loadExam(examSummary.id, currentUser.id);

      const blob = await exportExamToDocx(await prepareExportFigures(fullExamObj), true);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${examSummary.title.replace(/\s+/g, '_')}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Tải file Word thành công!');
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Lỗi khi xuất file Word');
    }
  };

  const currentFolder = folders.find(f => f.id === selectedFolderId) ||
    folders.flatMap(f => f.children || []).find(c => c.id === selectedFolderId);

  const folderUnavailable = selectedFolderId && (!foldersReady || foldersError || !currentFolder);

  return (
    <>
      <ExamLibraryModal ownerId={currentUser.id} isOpen={libraryOpen} onClose={() => setLibraryOpen(false)} onLoadExam={value => router.push('/editor/' + value.id)} />
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER TRÊN CÙNG (Google App Bar Style)
      ───────────────────────────────────────────────────────────── */}
      {confirmation}

      {/* ─────────────────────────────────────────────────────────────
          2. KHU VỰC CHÍNH (3 CỘT: MENU TRÁI + VÙNG GIỮA + AI CỘT PHẢI)
      ───────────────────────────────────────────────────────────── */}
        {/* CỘT TRÁI: MENU QUẢN LÝ & CÂY THƯ MỤC */}

        {/* VÙNG GIỮA: NỘI DUNG CHÍNH (CANVAS QUẢN LÝ ĐỀ THI) */}
        <main className="app-page px-4 sm:px-6 py-5 min-w-0">
          {currentView !== 'trash' && <AccountRecovery ownerId={currentUser.id} />}
          {location.get('choose') === 'assign' && currentView !== 'trash' && <p role="status" className="border rounded-lg p-3 mb-4 text-sm">Chọn một đề để mở, rồi bấm “Giao bài” để giao cho học sinh.</p>}
          {currentView !== 'trash' && <>
            <header className="flex flex-wrap items-start justify-between gap-3 mb-5">
              <div><h1 className="text-2xl font-semibold">{selectedFolderId ? currentFolder?.name || 'Thư mục' : 'Thư mục và đề thi'}</h1><p className="text-sm text-[var(--ui-text-secondary)] mt-1">{selectedFolderId ? 'Thư mục con và đề tại vị trí này.' : 'Sắp xếp đề theo môn học, học kỳ, dự án hoặc cách riêng của bạn.'}</p></div>
              <div className="flex flex-wrap gap-2 text-sm"><button type="button" className="app-button-secondary min-h-10 px-3" onClick={() => setLibraryOpen(true)}>Sao lưu · Nhập kho cũ</button><button type="button" disabled={!!folderUnavailable} onClick={() => handleOpenEditor()} className="app-button-primary min-h-10 px-4 inline-flex items-center gap-2 disabled:opacity-40"><Plus size={16} />Tạo đề</button><button type="button" disabled={!!folderUnavailable} onClick={() => setIsGenerateModalOpen(true)} className="app-button-secondary min-h-10 px-3 inline-flex items-center gap-2 disabled:opacity-40"><Sparkles size={16} />AI soạn đề</button><button type="button" disabled={!!folderUnavailable} onClick={() => setIsImportModalOpen(true)} className="app-button-secondary min-h-10 px-3 inline-flex items-center gap-2 disabled:opacity-40"><Upload size={16} />Nhập Word / ảnh</button></div>
            </header>
            <nav aria-label="Chế độ kho đề" className="flex flex-wrap gap-2 mb-4 text-sm">{([{ key: 'all', label: 'Tất cả' }, { key: 'recent', label: 'Đã sửa gần đây' }, { key: 'starred', label: 'Gắn sao' }] as const).map(view => <button key={view.key} type="button" aria-pressed={currentView === view.key} onClick={() => setCurrentView(view.key)} className={(currentView === view.key ? 'app-button-tonal' : 'app-button-secondary') + ' min-h-10 px-3'}>{view.label}</button>)}</nav>
            <LibraryFolders folderId={selectedFolderId} showCards={currentView === 'all' && !searchQuery.trim() && selectedSubject === 'all' && selectedGrade === 'all'} />
          </>}
          {currentView === 'trash' && <section className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-semibold">Thùng rác</h1><p className="text-sm text-[var(--ui-text-secondary)] mt-2">Đề đã chuyển vào thùng rác. Khôi phục để tiếp tục mở và chỉnh sửa, hoặc xóa vĩnh viễn nếu không cần nữa. Đề đã giao cho học sinh không xóa vĩnh viễn được.</p></div>
            {exams.length > 0 && <button type="button" disabled={!!pendingExam} onClick={() => void handleEmptyTrash()} className="app-button-secondary inline-flex items-center gap-2 min-h-10 px-4 text-sm text-red-700 dark:text-red-300 disabled:opacity-40"><Trash2 className="w-4 h-4" /><span>Dọn thùng rác</span></button>}</section>}
          {actionError && <p role="alert" className="border border-red-400 rounded-lg p-3 mb-4 text-sm">{actionError}</p>}
          {/* Thanh Toolbar lọc & chế độ xem */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 bg-white dark:bg-[#202124] p-3 rounded-xl border border-[#dadce0] dark:border-[#3c4043]">
            {/* Breadcrumb tiêu đề vùng làm việc */}
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="text-[#5f6368] dark:text-[#9aa0a6]">
                {currentView === 'trash' ? 'Thùng rác' : currentView === 'starred' ? 'Đề quan trọng' : currentView === 'recent' ? 'Đã sửa trong 30 ngày' : selectedFolderId ? 'Đề trong thư mục' : rootScope ? 'Đề ở ngoài thư mục và đề được chia sẻ' : 'Kết quả trong toàn kho'}
              </span>
              <span className="text-[11px] font-normal text-[#5f6368] dark:text-[#9aa0a6]">
                ({pendingList ? 'Đang tải' : totalExams} đề thi)
              </span>
            </div>

            {/* Các dropdown lọc nhanh */}
            <div className="flex flex-wrap min-w-0 max-w-full items-center gap-2">
              <SearchField value={searchQuery} onChange={setSearchQuery} placeholder="Tìm theo tên đề..." label="Tìm đề trong kho" />
              {/* Lọc theo môn */}
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="teacher-field px-2.5 py-1.5 text-xs bg-[#f1f3f4] dark:bg-[#292a2d] border border-transparent rounded-lg text-[#3c4043] dark:text-[#e3e3e3] outline-hidden cursor-pointer"
              >
                <option value="all">Tất cả môn</option>
                {getCatalogSubjects(selectedGrade === 'all' ? undefined : Number(selectedGrade)).map(subject => <option key={subject.key} value={subject.key}>{subject.label}</option>)}
              </select>

              {/* Lọc theo khối */}
              <select
                value={selectedGrade}
                onChange={(e) => { setSelectedGrade(e.target.value); setSelectedSubject('all'); }}
                className="teacher-field px-2.5 py-1.5 text-xs bg-[#f1f3f4] dark:bg-[#292a2d] border border-transparent rounded-lg text-[#3c4043] dark:text-[#e3e3e3] outline-hidden cursor-pointer"
              >
                <option value="all">Tất cả khối</option>
                {Array.from({ length: 12 }, (_, index) => index + 1).map(grade => <option key={grade} value={grade}>Lớp {grade}</option>)}
              </select>

              {/* Toggle Grid / List view */}
              <div className="flex items-center bg-[#f1f3f4] dark:bg-[#292a2d] p-0.5 rounded-lg border border-transparent">
                <button
                  onClick={() => setViewMode('grid')}
                  title="Chế độ xem thẻ"
                  className={`p-1.5 rounded-md cursor-pointer transition-colors ${
                    viewMode === 'grid' ? 'bg-white dark:bg-[#202124] shadow-xs text-[#3c4043]' : 'text-[#5f6368]'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  title="Chế độ xem danh sách"
                  className={`p-1.5 rounded-md cursor-pointer transition-colors ${
                    viewMode === 'list' ? 'bg-white dark:bg-[#202124] shadow-xs text-[#3c4043]' : 'text-[#5f6368]'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* VÙNG DANH SÁCH ĐỀ THI */}
          {folderUnavailable && currentView !== 'trash' ? null : loadError && loadedQuery === queryKey ? <div role="alert" className="border rounded-xl p-5"><p>{loadError}</p><button type="button" onClick={() => void loadExams()} className="app-button-secondary min-h-10 px-3 mt-3">Thử lại</button></div> : pendingList ? (
            <div className="py-24 text-center text-xs text-[#5f6368] dark:text-[#9aa0a6]">
              Đang tải danh sách đề thi...
            </div>
          ) : exams.length === 0 ? (
            <div className="p-16 text-center bg-white dark:bg-[#202124] rounded-2xl border border-dashed border-[#dadce0] dark:border-[#3c4043]">
              <div className="w-14 h-14 rounded-xl bg-[#f1f3f4] dark:bg-[#292a2d] flex items-center justify-center mx-auto mb-3 text-[#5f6368]">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="font-semibold text-[#202124] dark:text-[#e3e3e3] text-sm mb-1">
                {currentView === 'trash' ? 'Thùng rác trống' : currentView === 'starred' ? 'Chưa có đề gắn sao trong mục này' : currentView === 'recent' ? 'Chưa có đề sửa gần đây trong mục này' : searchQuery ? 'Không tìm thấy đề phù hợp' : 'Chưa có đề ở vị trí này'}
              </h3>
              <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] mb-5 max-w-sm mx-auto">
                {currentView === 'trash'
                  ? 'Không có đề thi nào bị xóa.'
                  : currentView === 'starred' ? 'Bấm ngôi sao trên thẻ đề để đánh dấu và tìm lại nhanh.' : currentView === 'recent' ? 'Mục này chỉ hiện đề có chỉnh sửa trong 30 ngày gần đây.' : searchQuery ? 'Thử tên đề hoặc bộ lọc khác.' : 'Dùng nút Tạo đề ở phía trên; các đề đã xếp sẽ nằm trong thư mục tương ứng.'}
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            /* DẠNG THẺ GRID CARDS */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {exams.map((exam) => (
                <div
                  key={exam.id}
                  data-library-exam={exam.id}
                  onClick={currentView === 'trash' ? undefined : () => handleOpenEditor(exam.id)}
                  className="group bg-white dark:bg-[#202124] p-4 rounded-xl border border-[#dadce0] dark:border-[#3c4043] hover:border-[#3c4043] dark:hover:border-[#e3e3e3] hover:shadow-xs transition-all cursor-pointer relative flex flex-col justify-between"
                >
                  {/* Top card: Badge môn học & Nút gắn sao */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-[#f1f3f4] dark:bg-[#292a2d] text-[#3c4043] dark:text-[#e3e3e3]">
                          {subjectLabel(exam.subject)} {exam.grade ? `Khối ${exam.grade}` : ''}
                        </span>
                        {exam.folder && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#f1f3f4] dark:bg-[#292a2d] text-[#5f6368] dark:text-[#9aa0a6]">
                            <Folder className="w-2.5 h-2.5 dark:!text-[var(--ui-text-primary)]" style={{ color: exam.folder.color }} />
                            <span>{exam.folder.name}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-1">
                        {currentView !== 'trash' && <button
                          disabled={!!pendingExam || exam.permissions?.canManage === false}
                          onClick={(e) => handleToggleStar(exam, e)}
                          title={exam.isStarred ? 'Bỏ gắn sao' : 'Gắn sao đề quan trọng'}
                          className="p-1 rounded-lg text-[#5f6368] hover:text-amber-500 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                        >
                          <Star className={`w-4 h-4 ${exam.isStarred ? 'text-amber-500 fill-amber-500' : ''}`} />
                        </button>}
                      </div>
                    </div>

                    {/* Tiêu đề đề thi */}
                    <h4 className="font-semibold text-xs text-[#202124] dark:text-white line-clamp-2 mb-2 group-hover:text-[#3c4043] transition-colors">
                      {exam.title}
                      {exam.permissions?.canManage === false && <span className="block text-xs font-normal mt-1">Được mời: {exam.permissions.canEdit ? 'Cùng sửa' : exam.permissions.canComment ? 'Góp ý' : 'Chỉ xem'}</span>}
                    </h4>
                  </div>

                  {/* Bottom card: Thông số câu hỏi & Thao tác */}
                  <div className="app-dialog-footer pt-3 border-t border-[#f1f3f4] dark:border-[#3c4043]/60 flex items-center justify-between text-[11px] text-[#5f6368] dark:text-[#9aa0a6]">
                    <div className="flex items-center gap-2">
                      <span>{exam._count?.items || 0} câu</span>
                      <span>•</span>
                      <span>{currentView === 'trash' ? `Xóa ${new Date(exam.deletedAt || exam.updatedAt).toLocaleDateString('vi-VN')}` : `${exam.durationMinutes || 45} phút`}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1">
                      {currentView !== 'trash' && <>
                      {/* Nút tải Word nhanh */}
                      <button
                        onClick={(e) => handleQuickExportDocx(exam, e)}
                        title="Tải file Word (.docx)"
                        className="p-1.5 rounded-lg hover:bg-[#f1f3f4] dark:hover:bg-[#292a2d] text-[#5f6368] hover:text-[#3c4043] cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      {/* Nút nhân bản */}
                      <button
                        onClick={(e) => handleCloneExam(exam, e)}
                        title="Nhân bản đề này"
                        className="p-1.5 rounded-lg hover:bg-[#f1f3f4] dark:hover:bg-[#292a2d] text-[#5f6368] hover:text-[#3c4043] cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {/* Nút chuyển thư mục */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveExam(exam);
                          setIsMoveExamModalOpen(true);
                        }}
                        disabled={!!pendingExam || exam.permissions?.canManage === false}
                          title="Di chuyển vào thư mục"
                        className="p-1.5 rounded-lg hover:bg-[#f1f3f4] dark:hover:bg-[#292a2d] text-[#5f6368] hover:text-[#3c4043] cursor-pointer"
                      >
                        <Folder className="w-3.5 h-3.5" />
                      </button>

                      {/* Nút đổi tên */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveExam(exam);
                          setNewExamTitle(exam.title);
                          setIsRenameExamModalOpen(true);
                        }}
                        disabled={!!pendingExam || exam.permissions?.canManage === false}
                          title="Đổi tên đề"
                        className="p-1.5 rounded-lg hover:bg-[#f1f3f4] dark:hover:bg-[#292a2d] text-[#5f6368] hover:text-[#3c4043] cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      </>}
                      {/* Nút xóa */}
                      <button
                        disabled={!!pendingExam || exam.permissions?.canManage === false}
                          onClick={(e) => handleDeleteExam(exam.id, e)}
                        title={currentView === 'trash' ? 'Khôi phục đề' : 'Chuyển vào thùng rác'}
                        className="inline-flex items-center gap-1 min-h-10 px-2 rounded-lg hover:bg-[var(--ui-surface-variant)] text-[var(--ui-text-secondary)] cursor-pointer disabled:opacity-40"
                      >
                        {currentView === 'trash' ? <><RotateCcw className="w-3.5 h-3.5" /><span>Khôi phục</span></> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                      {currentView === 'trash' && <button type="button" disabled={!!pendingExam || exam.permissions?.canManage === false} onClick={(e) => void handlePurgeExam(exam.id, e)} title="Xóa vĩnh viễn đề này" className="inline-flex items-center gap-1 min-h-10 px-2 rounded-lg hover:bg-[var(--ui-surface-variant)] text-red-700 dark:text-red-300 cursor-pointer disabled:opacity-40"><Trash2 className="w-3.5 h-3.5" /><span>Xóa vĩnh viễn</span></button>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* DẠNG BẢNG DANH SÁCH (LIST VIEW) */
            <div className="bg-white dark:bg-[#202124] rounded-xl border border-[#dadce0] dark:border-[#3c4043] overflow-hidden shadow-2xs">
              <table className="app-exam-table w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-[#f8f9fa] dark:bg-[#292a2d] border-b border-[#dadce0] dark:border-[#3c4043] text-[#5f6368] dark:text-[#9aa0a6] font-semibold">
                    <th className="py-3 px-4 w-10 text-center">⭐</th>
                    <th className="py-3 px-4">Tên đề thi</th>
                    <th className="py-3 px-4">Môn & Khối</th>
                    <th className="py-3 px-4">Thư mục</th>
                    <th className="py-3 px-4">Số câu</th>
                    <th className="py-3 px-4">{currentView === 'trash' ? 'Ngày xóa' : 'Cập nhật'}</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f3f4] dark:divide-[#3c4043]">
                  {exams.map((exam) => (
                    <tr
                      key={exam.id} data-library-exam={exam.id}
                      onClick={currentView === 'trash' ? undefined : () => handleOpenEditor(exam.id)}
                      className="hover:bg-[#f8f9fa] dark:hover:bg-[#292a2d] transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 text-center">
                        {currentView !== 'trash' && <button
                          disabled={!!pendingExam || exam.permissions?.canManage === false}
                          onClick={(e) => handleToggleStar(exam, e)}
                          className="p-1 hover:text-amber-500 cursor-pointer"
                        >
                          <Star className={`w-3.5 h-3.5 ${exam.isStarred ? 'text-amber-500 fill-amber-500' : 'text-[#dadce0]'}`} />
                        </button>}
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#202124] dark:text-white group-hover:text-[#3c4043]">
                        {exam.title}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-[#f1f3f4] dark:bg-[#292a2d] text-[#3c4043] dark:text-[#e3e3e3]">
                          {subjectLabel(exam.subject)} {exam.grade ? `K${exam.grade}` : ''}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#5f6368] dark:text-[#9aa0a6]">
                        {exam.folder ? (
                          <span className="flex items-center gap-1.5">
                            <Folder className="w-3.5 h-3.5 dark:!text-[var(--ui-text-primary)]" style={{ color: exam.folder.color }} />
                            <span>{exam.folder.name}</span>
                          </span>
                        ) : (
                          <span className="italic text-[11px] text-[#9aa0a6]">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[#5f6368] dark:text-[#9aa0a6]">
                        {exam._count?.items || 0} câu
                      </td>
                      <td data-label={currentView === 'trash' ? 'Ngày xóa' : 'Cập nhật'} className="py-3 px-4 text-[#5f6368] dark:text-[#9aa0a6] text-[11px]">
                        {new Date(currentView === 'trash' ? exam.deletedAt || exam.updatedAt : exam.updatedAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {currentView !== 'trash' && <>
                          <button
                            onClick={(e) => handleQuickExportDocx(exam, e)}
                            title="Tải Word"
                            className="p-3 sm:p-1.5 rounded-lg hover:bg-black/5 text-[#5f6368] hover:text-[#3c4043] cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleCloneExam(exam, e)}
                            title="Nhân bản"
                            className="p-3 sm:p-1.5 rounded-lg hover:bg-black/5 text-[#5f6368] hover:text-[#3c4043] cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
<button type="button" title="Đổi tên đề" disabled={!!pendingExam || exam.permissions?.canManage === false} className="min-h-10 px-2" onClick={e => { e.stopPropagation(); setActiveExam(exam); setNewExamTitle(exam.title); setIsRenameExamModalOpen(true); }}><Edit3 className="w-4 h-4" /></button>
                          <button type="button" title="Di chuyển vào thư mục" disabled={!!pendingExam || exam.permissions?.canManage === false} className="min-h-10 px-2" onClick={e => { e.stopPropagation(); setActiveExam(exam); setIsMoveExamModalOpen(true); }}><Folder className="w-4 h-4" /></button>
                          </>}
                          <button
                            disabled={!!pendingExam || exam.permissions?.canManage === false}
                          onClick={(e) => handleDeleteExam(exam.id, e)}
                            title={currentView === 'trash' ? 'Khôi phục đề' : 'Chuyển vào thùng rác'}
                            className="inline-flex items-center gap-1 min-h-10 px-2 rounded-lg hover:bg-[var(--ui-surface-variant)] text-[var(--ui-text-secondary)] cursor-pointer disabled:opacity-40"
                          >
                            {currentView === 'trash' ? <><RotateCcw className="w-3.5 h-3.5" /><span>Khôi phục</span></> : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                          {currentView === 'trash' && <button type="button" disabled={!!pendingExam || exam.permissions?.canManage === false} onClick={(e) => void handlePurgeExam(exam.id, e)} title="Xóa vĩnh viễn đề này" className="inline-flex items-center gap-1 min-h-10 px-2 rounded-lg hover:bg-[var(--ui-surface-variant)] text-red-700 dark:text-red-300 cursor-pointer disabled:opacity-40"><Trash2 className="w-3.5 h-3.5" /><span>Xóa vĩnh viễn</span></button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {totalPages > 1 && <nav aria-label="Trang kho đề" className="flex justify-center items-center gap-4 py-5 text-sm"><button type="button" disabled={pendingList || page <= 1} onClick={() => setPage(p => p - 1)} className="border rounded px-3 py-2 disabled:opacity-40">Trang trước</button><span>Trang {page} / {totalPages}</span><button type="button" disabled={pendingList || page >= totalPages} onClick={() => setPage(p => p + 1)} className="border rounded px-3 py-2 disabled:opacity-40">Trang sau</button></nav>}
        </main>

        {/* ─────────────────────────────────────────────────────────────
            CỘT PHẢI: TRỢ LÝ THƯ KÝ AI (COMPANION RAIL)
            (Mở cùng drawer với nút ở thanh trên)
        ───────────────────────────────────────────────────────────── */}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: TẠO THƯ MỤC
      ───────────────────────────────────────────────────────────── */}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: DI CHUYỂN ĐỀ VÀO THƯ MỤC
      ───────────────────────────────────────────────────────────── */}
      {isMoveExamModalOpen && activeExam && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="app-dialog bg-white dark:bg-[#202124] rounded-2xl p-6 max-w-sm w-full border border-[#dadce0] dark:border-[#3c4043] shadow-xs animate-in fade-in zoom-in-95">
            <div className="app-dialog-header flex items-center justify-between pb-3 border-b border-[#dadce0] dark:border-[#3c4043] mb-3">
              <h3 className="font-semibold text-sm text-[#202124] dark:text-white flex items-center gap-2">
                <Folder className="w-4 h-4 text-[#3c4043]" />
                <span>Di chuyển đề thi</span>
              </h3>
              <button aria-label="Đóng hộp thoại"
                onClick={() => setIsMoveExamModalOpen(false)}
                className="p-1 rounded-lg text-[#5f6368] hover:bg-black/5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] mb-3">
              Chọn thư mục đích cho đề <strong>&quot;{activeExam.title}&quot;</strong>:
            </p>

            <div className="space-y-1 max-h-60 overflow-y-auto mb-4 border border-[#dadce0] dark:border-[#3c4043] rounded-xl p-1.5">
              <button
                type="button"
                onClick={() => handleMoveExam(null)}
                className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-[#f1f3f4] dark:hover:bg-[#292a2d] cursor-pointer flex items-center gap-2 font-medium"
              >
                <FileText className="w-3.5 h-3.5 text-[#5f6368]" />
                <span>-- Thư viện gốc (Không thuộc thư mục nào) --</span>
              </button>

              {folders.map(folder => (
                <div key={folder.id} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => handleMoveExam(folder.id)}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs hover:bg-[#f1f3f4] dark:hover:bg-[#292a2d] cursor-pointer flex items-center gap-2 font-medium"
                  >
                    <Folder className="w-3.5 h-3.5 dark:!text-[var(--ui-text-primary)]" style={{ color: folder.color }} />
                    <span>{folder.name}</span>
                  </button>

                  {folder.children && folder.children.map(sub => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => handleMoveExam(sub.id)}
                      className="w-full text-left pl-6 pr-3 py-1.5 rounded-lg text-xs hover:bg-[#f1f3f4] dark:hover:bg-[#292a2d] cursor-pointer flex items-center gap-2 text-[#5f6368]"
                    >
                      <Folder className="w-3 h-3" style={{ color: sub.color || folder.color }} />
                      <span>{sub.name}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setIsMoveExamModalOpen(false)}
                className="px-4 py-1.5 text-xs text-[#5f6368] hover:bg-black/5 rounded-lg cursor-pointer font-medium"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: ĐỔI TÊN ĐỀ THI
      ───────────────────────────────────────────────────────────── */}
      {isRenameExamModalOpen && activeExam && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleRenameExam}
            className="app-dialog bg-white dark:bg-[#202124] rounded-2xl p-6 max-w-sm w-full border border-[#dadce0] dark:border-[#3c4043] shadow-xs animate-in fade-in zoom-in-95"
          >
            <div className="app-dialog-header flex items-center justify-between pb-3 border-b border-[#dadce0] dark:border-[#3c4043] mb-4">
              <h3 className="font-semibold text-sm text-[#202124] dark:text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#3c4043]" />
                <span>Đổi tên đề thi</span>
              </h3>
              <button aria-label="Đóng hộp thoại"
                type="button"
                onClick={() => setIsRenameExamModalOpen(false)}
                className="p-1 rounded-lg text-[#5f6368] hover:bg-black/5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-semibold text-[#5f6368] mb-1">Tên đề mới</label>
              <input
                type="text"
                required
                value={newExamTitle}
                onChange={(e) => setNewExamTitle(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-[#f1f3f4] dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-xl outline-hidden focus:border-[#3c4043]"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsRenameExamModalOpen(false)}
                className="px-4 py-2 text-xs text-[#5f6368] hover:bg-black/5 rounded-lg cursor-pointer font-medium"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs app-button-primary text-white rounded-lg font-semibold shadow-xs cursor-pointer"
              >
                Lưu tên mới
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TOAST NOTIFICATION */}

      {/* CÁC MODAL HỆ THỐNG DÙNG CHUNG */}
      <GenerateModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        onExamGenerated={handleExamGeneratedFromAi}
        documentStamp={`new:${currentUser.id}`}
        expectedUserId={currentUser.id}
        apiKey=""
      />

      <ImportModal
        ownerId={currentUser.id}
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportQuestions={(importedQuestions, context) => {
          setIsImportModalOpen(false);
          const newExam: Exam = {
            id: `exam_import_${Date.now()}`,
            metadata: {
              title: 'ĐỀ THI NHẬP LIỆU MỚI',
              schoolName: '',
              departmentName: '',
              subject: context.subject,
              grade: context.grade,
              durationMinutes: 45,
              examCode: '',
              academicYear: '',
            },
            questions: importedQuestions,
            passages: context.passages,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          writeDraft(localStorage, currentUser.id, 'new', { ...newExam, id: 'draft_' + crypto.randomUUID(), serverId: undefined, version: undefined, creationFolderId: selectedFolderId ?? null });
          router.push(selectedFolderId ? `/editor/new?folder=${encodeURIComponent(selectedFolderId)}` : '/editor/new');
        }}
        apiKey=""
      />

    </>
  );
};

export default TeacherDashboard;
