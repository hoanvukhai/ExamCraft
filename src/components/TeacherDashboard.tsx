'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  Plus,
  Folder,
  FolderPlus,
  FolderOpen,
  FileText,
  Search,
  Star,
  Clock,
  Trash2,
  MoreVertical,
  Download,
  Edit3,
  Copy,
  LayoutGrid,
  List,
  ChevronRight,
  ChevronDown,
  Bot,
  GraduationCap,
  Users,
  Database,
  Upload,
  ArrowRight,
  Sun,
  Moon,
  Key,
  ShieldCheck,
  Check,
  X,
  AlertCircle,
  HelpCircle,
  Brain
} from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { GenerateModal } from '@/components/GenerateModal';
import { ImportModal } from '@/components/ImportModal';
import { QuestionBankModal } from '@/components/QuestionBankModal';
import { ApiKeyModal } from '@/components/ApiKeyModal';
import { AiLearningModal } from '@/components/AiLearningModal';
import { TeacherAiSecretaryDrawer } from '@/components/TeacherAiSecretaryDrawer';
import { exportExamToDocx } from '@/lib/docx-export';
import { prepareExportFigures } from '@/lib/export-figures';
import { Exam } from '@/types/exam';
import { loadExam, persistExam } from '@/lib/exam-client';
import { writeDraft } from '@/lib/exam-draft';
import { accountFetch } from '@/lib/account-fetch';
import { LocalDraftsPanel } from '@/components/LocalDraftsPanel';
import { getCatalogSubjects } from '@/lib/education-catalog';

interface FolderData {
  id: string;
  name: string;
  color?: string;
  parentId?: string | null;
  _count?: { exams: number };
  children?: FolderData[];
}

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
  const { theme, toggleTheme } = useTheme();

  // State dữ liệu
  const [folders, setFolders] = useState<FolderData[]>([]);
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPageValue] = useState(1);
  const setPage = (value: React.SetStateAction<number>) => { setIsLoading(true); setPageValue(value); };
  const [totalPages, setTotalPages] = useState(1);
  const [totalExams, setTotalExams] = useState(0);
  const loadSequence = useRef(0);

  // Bộ lọc & Điều hướng
  const [currentView, setCurrentView] = useState<'all' | 'starred' | 'recent' | 'trash'>('all');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  // Modals & Popups
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isQuestionBankOpen, setIsQuestionBankOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isAiSecretaryModalOpen, setIsAiSecretaryModalOpen] = useState(false);
  const [isAiLearningModalOpen, setIsAiLearningModalOpen] = useState(false);
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [targetParentFolderId, setTargetParentFolderId] = useState<string | null>(null);
  const [folderNameInput, setFolderNameInput] = useState('');
  const [folderColorInput, setFolderColorInput] = useState('#1a73e8');

  // Thao tác với đề thi
  const [isRenameExamModalOpen, setIsRenameExamModalOpen] = useState(false);
  const [isMoveExamModalOpen, setIsMoveExamModalOpen] = useState(false);
  const [activeExam, setActiveExam] = useState<ExamSummary | null>(null);
  const [newExamTitle, setNewExamTitle] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Key stats
  const [hasActiveKey, setHasActiveKey] = useState(false);
  const [keyCount, setKeyCount] = useState(0);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Nạp trạng thái Khóa AI
  const loadKeyStatus = () => accountFetch(currentUser.id, '/api/user/keys').then(async res => {
    if (res.ok) {
      const data = await res.json(); const activeKeys = (data.keys || []).filter((key: { isActive: boolean }) => key.isActive);
      setHasActiveKey(activeKeys.length > 0); setKeyCount(activeKeys.length);
    }
  }).catch(() => { /* Keep the last acknowledged state if offline. */ });
  const loadFolders = () => accountFetch(currentUser.id, '/api/folders').then(async res => {
    if (res.ok) { const data = await res.json(); setFolders(data.folders || []); }
  }).catch(error => { console.error('Lỗi nạp thư mục:', error); });

  // Nạp danh sách Đề thi theo bộ lọc
  const readExams = () => {
    const sequence = ++loadSequence.current;
      const params = new URLSearchParams();
      params.set('page', String(page)); params.set('limit', '20');
      if (searchQuery) params.append('search', searchQuery);
      if (selectedSubject !== 'all') params.append('subject', selectedSubject);
      if (selectedGrade !== 'all') params.append('grade', selectedGrade);

      if (currentView === 'trash') {
        params.append('isTrash', 'true');
      } else {
        if (currentView === 'starred') {
          params.append('isStarred', 'true');
        }
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
        if (page > Math.max(1, data.pagination?.totalPages ?? 1)) setPage(Math.max(1, data.pagination?.totalPages ?? 1));
      } else {
        const data = await res.json();
        if (sequence === loadSequence.current) showToast(data.error || 'Chưa tải được kho đề.');
      }
      }).catch(error => { console.error('Lỗi nạp danh sách đề thi:', error); }).finally(() => {
        if (sequence === loadSequence.current) setIsLoading(false);
      });
  };
  const loadExams = () => { setIsLoading(true); return readExams(); };

  useEffect(() => {
    loadKeyStatus();
    loadFolders();
  }, []);

  const filters = JSON.stringify([currentUser.id, currentView, selectedFolderId, selectedSubject, selectedGrade, searchQuery]);
  const [previousFilters, setPreviousFilters] = useState(filters);
  if (previousFilters !== filters) { setPreviousFilters(filters); setPage(1); }

  useEffect(() => {
    void readExams();
  }, [currentView, selectedFolderId, selectedSubject, selectedGrade, searchQuery, page]);

  // Tạo thư mục mới
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderNameInput.trim()) return;

    try {
      const res = await accountFetch(currentUser.id, '/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: folderNameInput.trim(),
          color: folderColorInput,
          parentId: targetParentFolderId,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Đã tạo thư mục mới thành công!');
        setIsCreateFolderModalOpen(false);
        setFolderNameInput('');
        setTargetParentFolderId(null);
        loadFolders();
      } else {
        alert(data.error || 'Không thể tạo thư mục');
      }
    } catch {
      alert('Lỗi kết nối máy chủ khi tạo thư mục');
    }
  };

  // Xóa thư mục
  const handleDeleteFolder = async (folderId: string, folderName: string) => {
    if (!confirm(`Thầy/Cô có chắc chắn muốn xóa thư mục "${folderName}"? Các đề thi bên trong sẽ được chuyển ra ngoài an toàn.`)) {
      return;
    }

    try {
      const res = await accountFetch(currentUser.id, `/api/folders/${folderId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Đã xóa thư mục.');
        if (selectedFolderId === folderId) setSelectedFolderId(null);
        loadFolders();
        loadExams();
      }
    } catch {
      alert('Lỗi khi xóa thư mục');
    }
  };

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
        loadFolders();
      }
    } catch {
      alert('Lỗi khi di chuyển đề thi');
    }
  };

  // Xóa đề thi vào thùng rác
  const handleDeleteExam = async (examId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (currentView === 'trash') {
      const item = exams.find(exam => exam.id === examId);
      const response = await accountFetch(currentUser.id, '/api/exams/' + examId, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ restore: true, baseVersion: item?.version }) });
      const result = await response.json();
      if (!response.ok) { showToast(result.error || 'Chưa khôi phục được đề'); return; }
      showToast('Đã khôi phục đề'); await loadExams(); return;
    }
    if (!confirm('Chuyển đề này vào thùng rác? Bạn có thể khôi phục sau.')) return;

    try {
      const res = await accountFetch(currentUser.id, `/api/exams/${examId}`, { method: 'DELETE', headers: { 'If-Match': String(exams.find(item => item.id === examId)?.version ?? '') } });
      if (!res.ok) { const result = await res.json(); showToast(result.error || 'Chưa chuyển được đề vào thùng rác'); await loadExams(); return; }
      if (res.ok) {
        showToast('Đã chuyển đề thi vào Thùng rác.');
        loadExams();
        loadFolders();
      }
    } catch {
      alert('Lỗi khi xóa đề thi');
    }
  };

  // Nhân bản đề thi (Clone)
  const handleCloneExam = async (exam: ExamSummary, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const original = await loadExam(exam.id, currentUser.id);
      await persistExam({ ...original, id: 'draft_' + crypto.randomUUID(), serverId: undefined, version: undefined, metadata: { ...original.metadata, title: original.metadata.title + ' (Bản sao)' } }, currentUser.id);
      const resCreate = { ok: true };

      if (resCreate.ok) {
        showToast('Đã nhân bản đề thi thành công!');
        loadExams();
        loadFolders();
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
      router.push('/editor/new');
    }
  };

  // Khi AI sinh đề thành công từ Dashboard
  const handleExamGeneratedFromAi = async (generatedExam: Exam) => {
    // Keep the preview open if preserving the draft fails.
    writeDraft(localStorage, currentUser.id, 'new', { ...generatedExam, id: 'draft_' + crypto.randomUUID(), serverId: undefined, version: undefined });
    setIsGenerateModalOpen(false);
    showToast('Đã giữ bản nháp. Đang mở bàn soạn...');
    router.push('/editor/new');
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

  return (
    <div className="flex flex-col h-dvh w-full bg-[#F8F9FA] dark:bg-[#181818] text-[#202124] dark:text-[#E3E3E3] font-sans antialiased overflow-hidden select-none">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER TRÊN CÙNG (Google App Bar Style)
      ───────────────────────────────────────────────────────────── */}
      <header className="app-bar app-dashboard-bar h-16 px-4 sm:px-6 bg-white dark:bg-[#1e1e1e] border-b border-[#dadce0] dark:border-[#3c4043] flex items-center justify-between z-30 shrink-0 shadow-2xs">
        {/* Góc trái: Logo & Định danh thương hiệu */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#1a73e8] flex items-center justify-center text-white shadow-xs">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-[#202124] dark:text-white">ExamCraft</span>
              <span className="hidden sm:inline-flex text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#e8f0fe] dark:bg-[#1e2a38] text-[#1a73e8] dark:text-[#8ab4f8]">
                Kho Đề Cá Nhân
              </span>
            </div>
            <p className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] hidden sm:block">
              Soạn đề, quản lý câu hỏi và giao bài
            </p>
          </div>
        </div>

        {/* Giữa: Ô tìm kiếm thông minh */}
        <div className="flex-1 max-w-xl mx-4 lg:mx-8 hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 text-[#5f6368] dark:text-[#9aa0a6] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo tên đề, mã môn, năm học..."
              className="w-full pl-10 pr-9 py-2 bg-[#f1f3f4] dark:bg-[#282828] border border-transparent focus:border-[#1a73e8] focus:bg-white dark:focus:bg-[#1e1e1e] rounded-full text-xs text-[#202124] dark:text-[#e3e3e3] outline-hidden transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5f6368] dark:text-[#9aa0a6] hover:text-black dark:hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Góc phải: Dark Mode, Kho Khóa AI, Avatar User */}
        <div className="flex items-center gap-2">
          {/* Nút Bộ Não AI Tự Học */}
          <button
            onClick={() => setIsAiLearningModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[var(--google-surface)] border border-[var(--google-border)] text-[var(--google-text-secondary)] hover:bg-[var(--google-surface-variant)] transition-colors cursor-pointer shadow-2xs"
            title="Bộ não AI Sư Phạm: Xem và dạy các phong cách ra đề cho AI"
          >
            <Brain className="w-3.5 h-3.5 text-[var(--google-blue)]" />
            <span className="hidden sm:inline">Bộ não AI</span>
          </button>

          {/* Nút Thư Ký AI */}
          <button
            onClick={() => setIsAiSecretaryModalOpen(!isAiSecretaryModalOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer shadow-2xs ${
              isAiSecretaryModalOpen
                ? 'app-button-primary text-white border-[#1a73e8]'
                : 'bg-white dark:bg-[#282828] border-[#dadce0] dark:border-[#3c4043] text-[#202124] dark:text-[#e3e3e3] hover:bg-[#f1f3f4] dark:hover:bg-[#303134]'
            }`}
            title="Mở Thư ký AI trợ lý riêng của Thầy/Cô"
          >
            <Bot className="w-3.5 h-3.5 text-blue-600 dark:text-[#8ab4f8]" />
            <span className="hidden sm:inline">Thư ký AI</span>
          </button>

          {/* Nút Kho Khóa AI */}
          <button
            onClick={() => setIsApiKeyModalOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
              hasActiveKey
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'
            }`}
            title="Quản lý Google Gemini API Key"
          >
            <Key className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Khóa AI: {keyCount}</span>
          </button>

          {/* Nút Dark/Light Mode */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#f1f3f4] dark:hover:bg-[#282828] transition-colors cursor-pointer"
            title="Đổi giao diện Sáng / Tối"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Avatar User */}
          <div className="flex items-center gap-2 pl-2 border-l border-[#dadce0] dark:border-[#3c4043]">
            <div className="w-8 h-8 rounded-full bg-[#1a73e8] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden lg:block text-left text-xs">
              <div className="font-semibold text-[#202124] dark:text-[#e3e3e3] truncate max-w-[120px]">{currentUser.name}</div>
              <div className="text-[10px] text-[#5f6368] dark:text-[#9aa0a6] capitalize">{currentUser.role === 'SUPER_ADMIN' ? 'Quản trị viên' : 'Giáo viên'}</div>
            </div>
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. KHU VỰC CHÍNH (3 CỘT: MENU TRÁI + VÙNG GIỮA + AI CỘT PHẢI)
      ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* CỘT TRÁI: MENU QUẢN LÝ & CÂY THƯ MỤC */}
        <aside className="w-64 bg-white dark:bg-[#181818] border-r border-[#dadce0] dark:border-[#3c4043] hidden lg:flex flex-col justify-between shrink-0 overflow-y-auto p-3 shadow-2xs z-20">
          <div className="space-y-4">
            {/* Nút Tạo đề mới to kiểu Google FAB */}
            <div>
              <button
                onClick={() => handleOpenEditor()}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl app-button-primary text-white font-semibold text-xs shadow-md transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Soạn Đề Thi Mới</span>
              </button>
            </div>

            {/* Mục điều hướng chính */}
            <div className="space-y-0.5">
              <button
                onClick={() => { setCurrentView('all'); setSelectedFolderId(null); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  currentView === 'all' && !selectedFolderId
                    ? 'bg-[#e8f0fe] dark:bg-[#1e2a38] text-[#1a73e8] dark:text-[#8ab4f8] font-bold'
                    : 'text-[#3c4043] dark:text-[#e3e3e3] hover:bg-[#f1f3f4] dark:hover:bg-[#282828]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-[#5f6368] dark:text-[#9aa0a6]" />
                  <span>Tất cả đề thi</span>
                </div>
                <span className="text-[10px] text-[#5f6368] dark:text-[#9aa0a6]">{exams.length}</span>
              </button>

              <button
                onClick={() => { setCurrentView('starred'); setSelectedFolderId(null); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  currentView === 'starred'
                    ? 'bg-[#e8f0fe] dark:bg-[#1e2a38] text-[#1a73e8] dark:text-[#8ab4f8] font-bold'
                    : 'text-[#3c4043] dark:text-[#e3e3e3] hover:bg-[#f1f3f4] dark:hover:bg-[#282828]'
                }`}
              >
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>Đề quan trọng (Gắn sao)</span>
              </button>

              <button
                onClick={() => { setCurrentView('recent'); setSelectedFolderId(null); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  currentView === 'recent'
                    ? 'bg-[#e8f0fe] dark:bg-[#1e2a38] text-[#1a73e8] dark:text-[#8ab4f8] font-bold'
                    : 'text-[#3c4043] dark:text-[#e3e3e3] hover:bg-[#f1f3f4] dark:hover:bg-[#282828]'
                }`}
              >
                <Clock className="w-4 h-4 text-[#5f6368] dark:text-[#9aa0a6]" />
                <span>Đã sửa gần đây</span>
              </button>
            </div>

            {/* CÂY THƯ MỤC CÁ NHÂN (Tối đa 2 cấp) */}
            <div className="pt-2 border-t border-[#f1f3f4] dark:border-[#3c4043]">
              <div className="flex items-center justify-between px-3 mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#5f6368] dark:text-[#9aa0a6]">
                  Thư mục của tôi
                </span>
                <button
                  onClick={() => {
                    setTargetParentFolderId(null);
                    setFolderNameInput('');
                    setIsCreateFolderModalOpen(true);
                  }}
                  title="Tạo thư mục mới (Cấp 1)"
                  className="p-1 rounded-md text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#f1f3f4] dark:hover:bg-[#282828] hover:text-[#1a73e8] cursor-pointer"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Danh sách các Folder */}
              <div className="space-y-0.5">
                {folders.length === 0 ? (
                  <div className="px-3 py-3 text-center text-[11px] text-[#5f6368] dark:text-[#9aa0a6] italic">
                    Chưa có thư mục nào. Bấm nút + ở trên để tạo.
                  </div>
                ) : (
                  folders.map((folder) => {
                    const isSelected = selectedFolderId === folder.id;
                    const isExpanded = !!expandedFolders[folder.id];
                    const hasChildren = folder.children && folder.children.length > 0;

                    return (
                      <div key={folder.id} className="space-y-0.5">
                        {/* Folder Cấp 1 */}
                        <div
                          className={`group flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-[#e8f0fe] dark:bg-[#1e2a38] text-[#1a73e8] dark:text-[#8ab4f8] font-semibold'
                              : 'text-[#3c4043] dark:text-[#e3e3e3] hover:bg-[#f1f3f4] dark:hover:bg-[#282828]'
                          }`}
                          onClick={() => {
                            setSelectedFolderId(folder.id);
                            setCurrentView('all');
                          }}
                        >
                          <div className="flex items-center gap-2 truncate">
                            {hasChildren ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedFolders(prev => ({ ...prev, [folder.id]: !prev[folder.id] }));
                                }}
                                className="p-0.5 hover:bg-black/5 dark:hover:bg-white/5 rounded cursor-pointer"
                              >
                                {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                              </button>
                            ) : (
                              <div className="w-3" />
                            )}
                            <Folder
                              className="w-4 h-4 shrink-0"
                              style={{ color: folder.color || '#1a73e8' }}
                            />
                            <span className="truncate">{folder.name}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-[#5f6368] dark:text-[#9aa0a6]">
                              {folder._count?.exams || 0}
                            </span>
                            {/* Thêm thư mục con cấp 2 */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setTargetParentFolderId(folder.id);
                                setFolderNameInput('');
                                setIsCreateFolderModalOpen(true);
                              }}
                              title="Thêm thư mục con vào đây"
                              className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-[#5f6368] hover:text-[#1a73e8] cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            {/* Xóa folder */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteFolder(folder.id, folder.name);
                              }}
                              title="Xóa thư mục này"
                              className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-[#5f6368] hover:text-red-500 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Thư mục con Cấp 2 (Indented) */}
                        {isExpanded && hasChildren && (
                          <div className="pl-6 space-y-0.5">
                            {folder.children!.map((sub) => {
                              const isSubSelected = selectedFolderId === sub.id;
                              return (
                                <div
                                  key={sub.id}
                                  className={`group flex items-center justify-between px-2 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
                                    isSubSelected
                                      ? 'bg-[#e8f0fe] dark:bg-[#1e2a38] text-[#1a73e8] dark:text-[#8ab4f8] font-semibold'
                                      : 'text-[#3c4043] dark:text-[#e3e3e3] hover:bg-[#f1f3f4] dark:hover:bg-[#282828]'
                                  }`}
                                  onClick={() => {
                                    setSelectedFolderId(sub.id);
                                    setCurrentView('all');
                                  }}
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <Folder
                                      className="w-3.5 h-3.5 shrink-0"
                                      style={{ color: sub.color || folder.color || '#1a73e8' }}
                                    />
                                    <span className="truncate">{sub.name}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-[#5f6368] dark:text-[#9aa0a6]">
                                      {sub._count?.exams || 0}
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteFolder(sub.id, sub.name);
                                      }}
                                      title="Xóa thư mục con"
                                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-[#5f6368] hover:text-red-500 cursor-pointer"
                                    >
                                      <Trash2 className="w-2.5 h-2.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* DẠY HỌC & KHẢO THÍ */}
            <div className="pt-2 border-t border-[#f1f3f4] dark:border-[#3c4043] space-y-0.5">
              <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#5f6368] dark:text-[#9aa0a6] block mb-1">
                Khảo thí & Lớp
              </span>

              <Link
                href="/teacher/groups"
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#3c4043] dark:text-[#e3e3e3] hover:bg-[#f1f3f4] dark:hover:bg-[#282828] transition-colors"
              >
                <Users className="w-4 h-4 text-[#5f6368] dark:text-[#9aa0a6]" />
                <span>Quản lý Lớp học</span>
              </Link>

              <Link
                href="/teacher/assignments"
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#3c4043] dark:text-[#e3e3e3] hover:bg-[#f1f3f4] dark:hover:bg-[#282828] transition-colors"
              >
                <GraduationCap className="w-4 h-4 text-[#5f6368] dark:text-[#9aa0a6]" />
                <span>Khảo thí & Bảng điểm</span>
              </Link>

              <button
                onClick={() => setIsQuestionBankOpen(true)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#3c4043] dark:text-[#e3e3e3] hover:bg-[#f1f3f4] dark:hover:bg-[#282828] transition-colors cursor-pointer"
              >
                <Database className="w-4 h-4 text-[#5f6368] dark:text-[#9aa0a6]" />
                <span>Ngân hàng câu hỏi</span>
              </button>
            </div>

            {/* THÙNG RÁC */}
            <div className="pt-2 border-t border-[#f1f3f4] dark:border-[#3c4043]">
              <button
                onClick={() => { setCurrentView('trash'); setSelectedFolderId(null); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  currentView === 'trash'
                    ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-semibold'
                    : 'text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#f1f3f4] dark:hover:bg-[#282828]'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                <span>Thùng rác</span>
              </button>
            </div>
          </div>

          {/* Dưới cùng cột trái: Link Admin nếu có quyền */}
          {currentUser.role === 'SUPER_ADMIN' && (
            <div className="pt-3 border-t border-[#f1f3f4] dark:border-[#3c4043]">
              <Link
                href="/admin/users"
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-[#1a73e8] dark:text-[#8ab4f8] font-semibold bg-[#e8f0fe] dark:bg-[#1e2a38] hover:bg-[#d2e3fc] transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Trang Quản trị Hệ thống</span>
              </Link>
            </div>
          )}
        </aside>

        {/* VÙNG GIỮA: NỘI DUNG CHÍNH (CANVAS QUẢN LÝ ĐỀ THI) */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 min-w-0">
          <LocalDraftsPanel ownerId={currentUser.id} />
          <nav aria-label="Điều hướng kho đề" className="lg:hidden my-3 flex flex-wrap items-center gap-2 text-xs">
            {([{ value: 'all', name: 'Tất cả' }, { value: 'starred', name: 'Quan trọng' }, { value: 'recent', name: 'Gần đây' }, { value: 'trash', name: 'Thùng rác' }] as const).map(view => <button key={view.value} type="button" className={`border rounded-lg p-2 ${currentView === view.value ? 'app-button-tonal' : 'hover:bg-[var(--google-surface-variant)]'}`} onClick={() => { setCurrentView(view.value); setSelectedFolderId(null); }}>{view.name}</button>)}
            <button type="button" className="border rounded-lg p-2" onClick={() => { setTargetParentFolderId(null); setIsCreateFolderModalOpen(true); }}>Tạo thư mục</button>
            <select aria-label="Chọn thư mục" className="border rounded-lg p-2 bg-transparent" value={selectedFolderId ?? ''} onChange={e => { setSelectedFolderId(e.target.value || null); setCurrentView('all'); }}><option value="">Mọi thư mục</option>{folders.flatMap(folder => [folder, ...(folder.children ?? [])]).map(folder => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select>
            <Link href="/teacher/groups" className="border rounded-lg p-2">Lớp học</Link><Link href="/teacher/assignments" className="border rounded-lg p-2">Bài đã giao</Link>
            <input aria-label="Tìm đề trong kho" placeholder="Tìm tên đề..." className="border rounded-lg p-2 bg-transparent flex-1 min-w-40" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </nav>
          {/* Top Quick Actions Banner: 3 thẻ tạo đề */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 mb-6">
            {/* Thẻ 1: Soạn đề trống */}
            <div
              onClick={() => handleOpenEditor()}
              className="bg-white dark:bg-[#1e1e1e] p-4 rounded-2xl border border-[#dadce0] dark:border-[#3c4043] hover:shadow-md hover:border-[#1a73e8] dark:hover:border-[#8ab4f8] transition-all cursor-pointer group flex items-start gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-[var(--google-surface-variant)] text-[var(--google-blue)] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-[#202124] dark:text-white mb-0.5">Soạn đề trống mới</h3>
                <p className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed">
                  Mở trang giấy A4 trắng tinh để tự nhập câu hỏi thủ công.
                </p>
              </div>
            </div>

            {/* Thẻ 2: AI Sinh đề */}
            <div
              onClick={() => setIsGenerateModalOpen(true)}
              className="bg-white dark:bg-[#1e1e1e] p-4 rounded-2xl border border-[#dadce0] dark:border-[#3c4043] hover:shadow-md hover:border-[#1a73e8] dark:hover:border-[#8ab4f8] transition-all cursor-pointer group flex items-start gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-[var(--google-surface-variant)] text-[var(--google-blue)] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-[#202124] dark:text-white mb-0.5 flex items-center gap-1.5">
                  <span>AI Sinh đề theo Ma trận</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 rounded-full">AI</span>
                </h3>
                <p className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed">
                  Chọn môn, lớp và nội dung; AI đề xuất câu hỏi để thầy cô kiểm tra.
                </p>
              </div>
            </div>

            {/* Thẻ 3: Nhập từ file Word / Ảnh */}
            <div
              onClick={() => setIsImportModalOpen(true)}
              className="bg-white dark:bg-[#1e1e1e] p-4 rounded-2xl border border-[#dadce0] dark:border-[#3c4043] hover:shadow-md hover:border-[#1a73e8] dark:hover:border-[#8ab4f8] transition-all cursor-pointer group flex items-start gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-[var(--google-surface-variant)] text-[var(--google-blue)] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-[#202124] dark:text-white mb-0.5">Nhập từ Word / Ảnh OCR</h3>
                <p className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed">
                  Bóc tách câu hỏi tự động từ file docx hoặc hình chụp đề.
                </p>
              </div>
            </div>
          </div>

          {/* Thanh Toolbar lọc & chế độ xem */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 bg-white dark:bg-[#1e1e1e] p-3 rounded-2xl border border-[#dadce0] dark:border-[#3c4043]">
            {/* Breadcrumb tiêu đề vùng làm việc */}
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="text-[#5f6368] dark:text-[#9aa0a6]">
                {currentView === 'trash' ? 'Thùng rác' : currentView === 'starred' ? 'Đề quan trọng' : currentView === 'recent' ? 'Gần đây' : 'Kho đề của tôi'}
              </span>
              {currentFolder && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-[#5f6368]" />
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#e8f0fe] dark:bg-[#1e2a38] text-[#1a73e8] dark:text-[#8ab4f8]">
                    <Folder className="w-3 h-3" style={{ color: currentFolder.color }} />
                    <span>{currentFolder.name}</span>
                  </span>
                </>
              )}
              <span className="text-[11px] font-normal text-[#5f6368] dark:text-[#9aa0a6]">
                ({totalExams} đề thi)
              </span>
            </div>

            {/* Các dropdown lọc nhanh */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Lọc theo môn */}
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-[#f1f3f4] dark:bg-[#282828] border border-transparent rounded-lg text-[#3c4043] dark:text-[#e3e3e3] outline-hidden cursor-pointer"
              >
                <option value="all">Tất cả môn</option>
                {getCatalogSubjects(selectedGrade === 'all' ? undefined : Number(selectedGrade)).map(subject => <option key={subject.key} value={subject.key}>{subject.label}</option>)}
              </select>

              {/* Lọc theo khối */}
              <select
                value={selectedGrade}
                onChange={(e) => { setSelectedGrade(e.target.value); setSelectedSubject('all'); }}
                className="px-2.5 py-1.5 text-xs bg-[#f1f3f4] dark:bg-[#282828] border border-transparent rounded-lg text-[#3c4043] dark:text-[#e3e3e3] outline-hidden cursor-pointer"
              >
                <option value="all">Tất cả khối</option>
                {Array.from({ length: 12 }, (_, index) => index + 1).map(grade => <option key={grade} value={grade}>Lớp {grade}</option>)}
              </select>

              {/* Toggle Grid / List view */}
              <div className="flex items-center bg-[#f1f3f4] dark:bg-[#282828] p-0.5 rounded-lg border border-transparent">
                <button
                  onClick={() => setViewMode('grid')}
                  title="Chế độ xem thẻ"
                  className={`p-1.5 rounded-md cursor-pointer transition-colors ${
                    viewMode === 'grid' ? 'bg-white dark:bg-[#1e1e1e] shadow-xs text-[#1a73e8]' : 'text-[#5f6368]'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  title="Chế độ xem danh sách"
                  className={`p-1.5 rounded-md cursor-pointer transition-colors ${
                    viewMode === 'list' ? 'bg-white dark:bg-[#1e1e1e] shadow-xs text-[#1a73e8]' : 'text-[#5f6368]'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* VÙNG DANH SÁCH ĐỀ THI */}
          {isLoading ? (
            <div className="py-24 text-center text-xs text-[#5f6368] dark:text-[#9aa0a6]">
              Đang tải danh sách đề thi...
            </div>
          ) : exams.length === 0 ? (
            <div className="p-16 text-center bg-white dark:bg-[#1e1e1e] rounded-3xl border border-dashed border-[#dadce0] dark:border-[#3c4043]">
              <div className="w-14 h-14 rounded-2xl bg-[#f1f3f4] dark:bg-[#282828] flex items-center justify-center mx-auto mb-3 text-[#5f6368]">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-[#202124] dark:text-[#e3e3e3] text-sm mb-1">
                {currentView === 'trash' ? 'Thùng rác trống' : 'Chưa có đề thi nào trong mục này'}
              </h3>
              <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] mb-5 max-w-sm mx-auto">
                {currentView === 'trash'
                  ? 'Không có đề thi nào bị xóa.'
                  : 'Hãy bấm Soạn đề mới hoặc nhờ AI hỗ trợ soạn bản nháp để bắt đầu.'}
              </p>
              {currentView !== 'trash' && (
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => handleOpenEditor()}
                    className="px-4 py-2 app-button-primary text-white rounded-full text-xs font-semibold shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Soạn đề trống</span>
                  </button>
                  <button
                    onClick={() => setIsGenerateModalOpen(true)}
                    className="px-4 py-2 bg-white dark:bg-[#282828] border border-[#dadce0] dark:border-[#3c4043] text-[#3c4043] dark:text-[#e3e3e3] hover:bg-[#f8f9fa] rounded-full text-xs font-semibold shadow-2xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Sinh đề AI</span>
                  </button>
                </div>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            /* DẠNG THẺ GRID CARDS */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {exams.map((exam) => (
                <div
                  key={exam.id}
                  onClick={() => handleOpenEditor(exam.id)}
                  className="group bg-white dark:bg-[#1e1e1e] p-4 rounded-2xl border border-[#dadce0] dark:border-[#3c4043] hover:border-[#1a73e8] dark:hover:border-[#8ab4f8] hover:shadow-md transition-all cursor-pointer relative flex flex-col justify-between"
                >
                  {/* Top card: Badge môn học & Nút gắn sao */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#e8f0fe] dark:bg-[#1e2a38] text-[#1a73e8] dark:text-[#8ab4f8]">
                          {exam.subject} {exam.grade ? `Khối ${exam.grade}` : ''}
                        </span>
                        {exam.folder && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#f1f3f4] dark:bg-[#282828] text-[#5f6368] dark:text-[#9aa0a6]">
                            <Folder className="w-2.5 h-2.5" style={{ color: exam.folder.color }} />
                            <span>{exam.folder.name}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          disabled={exam.permissions?.canManage === false}
                          onClick={(e) => handleToggleStar(exam, e)}
                          title={exam.isStarred ? 'Bỏ gắn sao' : 'Gắn sao đề quan trọng'}
                          className="p-1 rounded-full text-[#5f6368] hover:text-amber-500 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                        >
                          <Star className={`w-4 h-4 ${exam.isStarred ? 'text-amber-500 fill-amber-500' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Tiêu đề đề thi */}
                    <h4 className="font-bold text-xs text-[#202124] dark:text-white line-clamp-2 mb-2 group-hover:text-[#1a73e8] transition-colors">
                      {exam.title}
                      {exam.permissions?.canManage === false && <span className="block text-xs font-normal mt-1">Được mời: {exam.permissions.canEdit ? 'Cùng sửa' : exam.permissions.canComment ? 'Góp ý' : 'Chỉ xem'}</span>}
                    </h4>
                  </div>

                  {/* Bottom card: Thông số câu hỏi & Thao tác */}
                  <div className="pt-3 border-t border-[#f1f3f4] dark:border-[#3c4043]/60 flex items-center justify-between text-[11px] text-[#5f6368] dark:text-[#9aa0a6]">
                    <div className="flex items-center gap-2">
                      <span>{exam._count?.items || 0} câu</span>
                      <span>•</span>
                      <span>{exam.durationMinutes || 45} phút</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Nút tải Word nhanh */}
                      <button
                        onClick={(e) => handleQuickExportDocx(exam, e)}
                        title="Tải file Word (.docx)"
                        className="p-1.5 rounded-full hover:bg-[#f1f3f4] dark:hover:bg-[#282828] text-[#5f6368] hover:text-[#1a73e8] cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      {/* Nút nhân bản */}
                      <button
                        onClick={(e) => handleCloneExam(exam, e)}
                        title="Nhân bản đề này"
                        className="p-1.5 rounded-full hover:bg-[#f1f3f4] dark:hover:bg-[#282828] text-[#5f6368] hover:text-[#1a73e8] cursor-pointer"
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
                        disabled={exam.permissions?.canManage === false}
                          title="Di chuyển vào thư mục"
                        className="p-1.5 rounded-full hover:bg-[#f1f3f4] dark:hover:bg-[#282828] text-[#5f6368] hover:text-[#1a73e8] cursor-pointer"
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
                        disabled={exam.permissions?.canManage === false}
                          title="Đổi tên đề"
                        className="p-1.5 rounded-full hover:bg-[#f1f3f4] dark:hover:bg-[#282828] text-[#5f6368] hover:text-[#1a73e8] cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* Nút xóa */}
                      <button
                        disabled={exam.permissions?.canManage === false}
                          onClick={(e) => handleDeleteExam(exam.id, e)}
                        title={currentView === 'trash' ? 'Khôi phục đề' : 'Chuyển vào thùng rác'}
                        className="p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-950/40 text-[#5f6368] hover:text-red-500 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* DẠNG BẢNG DANH SÁCH (LIST VIEW) */
            <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-[#dadce0] dark:border-[#3c4043] overflow-hidden shadow-2xs">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-[#f8f9fa] dark:bg-[#282828] border-b border-[#dadce0] dark:border-[#3c4043] text-[#5f6368] dark:text-[#9aa0a6] font-semibold">
                    <th className="py-3 px-4 w-10 text-center">⭐</th>
                    <th className="py-3 px-4">Tên đề thi</th>
                    <th className="py-3 px-4">Môn & Khối</th>
                    <th className="py-3 px-4">Thư mục</th>
                    <th className="py-3 px-4">Số câu</th>
                    <th className="py-3 px-4">Cập nhật</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f3f4] dark:divide-[#3c4043]">
                  {exams.map((exam) => (
                    <tr
                      key={exam.id}
                      onClick={() => handleOpenEditor(exam.id)}
                      className="hover:bg-[#f8f9fa] dark:hover:bg-[#282828] transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 text-center">
                        <button
                          disabled={exam.permissions?.canManage === false}
                          onClick={(e) => handleToggleStar(exam, e)}
                          className="p-1 hover:text-amber-500 cursor-pointer"
                        >
                          <Star className={`w-3.5 h-3.5 ${exam.isStarred ? 'text-amber-500 fill-amber-500' : 'text-[#dadce0]'}`} />
                        </button>
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#202124] dark:text-white group-hover:text-[#1a73e8]">
                        {exam.title}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#e8f0fe] dark:bg-[#1e2a38] text-[#1a73e8] dark:text-[#8ab4f8]">
                          {exam.subject} {exam.grade ? `K${exam.grade}` : ''}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#5f6368] dark:text-[#9aa0a6]">
                        {exam.folder ? (
                          <span className="flex items-center gap-1.5">
                            <Folder className="w-3.5 h-3.5" style={{ color: exam.folder.color }} />
                            <span>{exam.folder.name}</span>
                          </span>
                        ) : (
                          <span className="italic text-[11px] text-[#9aa0a6]">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[#5f6368] dark:text-[#9aa0a6]">
                        {exam._count?.items || 0} câu
                      </td>
                      <td className="py-3 px-4 text-[#5f6368] dark:text-[#9aa0a6] text-[11px]">
                        {new Date(exam.updatedAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => handleQuickExportDocx(exam, e)}
                            title="Tải Word"
                            className="p-3 sm:p-1.5 rounded-full hover:bg-black/5 text-[#5f6368] hover:text-[#1a73e8] cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleCloneExam(exam, e)}
                            title="Nhân bản"
                            className="p-3 sm:p-1.5 rounded-full hover:bg-black/5 text-[#5f6368] hover:text-[#1a73e8] cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            disabled={exam.permissions?.canManage === false}
                          onClick={(e) => handleDeleteExam(exam.id, e)}
                            title={currentView === 'trash' ? 'Khôi phục đề' : 'Chuyển vào thùng rác'}
                            className="p-3 sm:p-1.5 rounded-full hover:bg-red-50 text-[#5f6368] hover:text-red-500 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {totalPages > 1 && <nav aria-label="Trang kho đề" className="flex justify-center items-center gap-4 py-5 text-sm"><button type="button" disabled={isLoading || page <= 1} onClick={() => setPage(p => p - 1)} className="border rounded px-3 py-2 disabled:opacity-40">Trang trước</button><span>Trang {page} / {totalPages}</span><button type="button" disabled={isLoading || page >= totalPages} onClick={() => setPage(p => p + 1)} className="border rounded px-3 py-2 disabled:opacity-40">Trang sau</button></nav>}
        </main>

        {/* ─────────────────────────────────────────────────────────────
            CỘT PHẢI: TRỢ LÝ THƯ KÝ AI (COMPANION RAIL)
            (Theo đúng yêu cầu của người dùng: Ấn vào báo đang phát triển)
        ───────────────────────────────────────────────────────────── */}
        <aside className="w-14 bg-white dark:bg-[#181818] border-l border-[#dadce0] dark:border-[#3c4043] hidden lg:flex flex-col items-center py-4 space-y-4 shrink-0 z-20">
          <button
            onClick={() => setIsAiSecretaryModalOpen(true)}
            title="Trợ lý Thư ký AI Cá Nhân (Bấm để xem)"
            className="w-10 h-10 rounded-2xl app-button-tonal flex items-center justify-center shadow-xs hover:shadow-md transition-all cursor-pointer relative group"
          >
            <Bot className="w-5 h-5 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-white dark:ring-[#181818]" />
          </button>

          <div className="w-8 h-px bg-[#dadce0] dark:border-[#3c4043]" />

          <button
            onClick={() => setIsApiKeyModalOpen(true)}
            title="Kho Khóa AI"
            className="w-10 h-10 rounded-xl text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#f1f3f4] dark:hover:bg-[#282828] flex items-center justify-center cursor-pointer transition-colors"
          >
            <Key className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsQuestionBankOpen(true)}
            title="Ngân hàng câu hỏi"
            className="w-10 h-10 rounded-xl text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#f1f3f4] dark:hover:bg-[#282828] flex items-center justify-center cursor-pointer transition-colors"
          >
            <Database className="w-4 h-4" />
          </button>
        </aside>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: TRỢ LÝ THƯ KÝ AI - ĐANG PHÁT TRIỂN
      ───────────────────────────────────────────────────────────── */}
      {isAiSecretaryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1e1e1e] rounded-3xl p-6 max-w-md w-full border border-[#dadce0] dark:border-[#3c4043] shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#dadce0] dark:border-[#3c4043]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#202124] dark:text-white">Trợ Lý Thư Ký AI Cá Nhân</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                    BETA / ĐANG HUẤN LUYỆN
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsAiSecretaryModalOpen(false)}
                className="p-1 rounded-full text-[#5f6368] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs text-[#3c4043] dark:text-[#e3e3e3] leading-relaxed">
              <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-2xl border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200">
                🚀 <strong>Tính năng đang trong giai đoạn phát triển & hoàn thiện!</strong>
                <p className="mt-1 text-[11px] opacity-90">
                  Thư ký AI sẽ được cấp quyền riêng biệt để quản lý tài nguyên cá nhân của riêng Thầy/Cô, giúp giảm 80% thời gian tìm kiếm và dọn dẹp đề thi.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#5f6368] dark:text-[#9aa0a6]">
                  Các quyền năng sắp ra mắt:
                </h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                    <span><strong>Tìm kiếm đề bằng tiếng Việt:</strong> <em>&quot;Tìm giúp tôi các đề kiểm tra 1 tiết Toán 11 có phần Hình không gian&quot;</em></span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                    <span><strong>Tự động dọn dẹp thư mục:</strong> <em>&quot;Tạo thư mục Ôn thi Đại học và gom 5 đề thi thử vào đó&quot;</em></span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                    <span><strong>Thư ký phân tích học tập:</strong> Tự động phát hiện dạng câu hỏi mà học sinh lớp của Thầy/Cô hay làm sai nhất.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#dadce0] dark:border-[#3c4043] flex justify-end">
              <button
                onClick={() => setIsAiSecretaryModalOpen(false)}
                className="px-5 py-2 app-button-primary text-white rounded-full text-xs font-semibold cursor-pointer shadow-xs"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: TẠO THƯ MỤC MỚI (Ràng buộc tối đa 2 cấp)
      ───────────────────────────────────────────────────────────── */}
      {isCreateFolderModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateFolder}
            className="bg-white dark:bg-[#1e1e1e] rounded-3xl p-6 max-w-sm w-full border border-[#dadce0] dark:border-[#3c4043] shadow-2xl animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#dadce0] dark:border-[#3c4043] mb-4">
              <h3 className="font-bold text-sm text-[#202124] dark:text-white flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-[#1a73e8]" />
                <span>{targetParentFolderId ? 'Tạo Thư Mục Con (Cấp 2)' : 'Tạo Thư Mục Mới (Cấp 1)'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateFolderModalOpen(false)}
                className="p-1 rounded-full text-[#5f6368] hover:bg-black/5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-semibold text-[#5f6368] mb-1">Tên thư mục</label>
                <input
                  type="text"
                  required
                  value={folderNameInput}
                  onChange={(e) => setFolderNameInput(e.target.value)}
                  placeholder="Ví dụ: Khối 12, Học kỳ 1, Ôn thi HSG..."
                  className="w-full px-3.5 py-2 text-xs bg-[#f1f3f4] dark:bg-[#282828] border border-[#dadce0] dark:border-[#3c4043] rounded-xl outline-hidden focus:border-[#1a73e8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5f6368] mb-1">Màu sắc nhận diện</label>
                <div className="flex items-center gap-2">
                  {['#1a73e8', '#e53935', '#43a047', '#fb8c00', '#8e24aa', '#00acc1'].map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFolderColorInput(color)}
                      className={`w-6 h-6 rounded-full cursor-pointer transition-transform ${
                        folderColorInput === color ? 'scale-125 ring-2 ring-black/40' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreateFolderModalOpen(false)}
                className="px-4 py-2 text-xs text-[#5f6368] hover:bg-black/5 rounded-full cursor-pointer font-medium"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs app-button-primary text-white rounded-full font-semibold shadow-xs cursor-pointer"
              >
                Tạo thư mục
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: DI CHUYỂN ĐỀ VÀO THƯ MỤC
      ───────────────────────────────────────────────────────────── */}
      {isMoveExamModalOpen && activeExam && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1e1e1e] rounded-3xl p-6 max-w-sm w-full border border-[#dadce0] dark:border-[#3c4043] shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#dadce0] dark:border-[#3c4043] mb-3">
              <h3 className="font-bold text-sm text-[#202124] dark:text-white flex items-center gap-2">
                <Folder className="w-4 h-4 text-[#1a73e8]" />
                <span>Di chuyển đề thi</span>
              </h3>
              <button
                onClick={() => setIsMoveExamModalOpen(false)}
                className="p-1 rounded-full text-[#5f6368] hover:bg-black/5 cursor-pointer"
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
                className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-[#f1f3f4] dark:hover:bg-[#282828] cursor-pointer flex items-center gap-2 font-medium"
              >
                <FileText className="w-3.5 h-3.5 text-[#5f6368]" />
                <span>-- Thư viện gốc (Không thuộc thư mục nào) --</span>
              </button>

              {folders.map(folder => (
                <div key={folder.id} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => handleMoveExam(folder.id)}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs hover:bg-[#f1f3f4] dark:hover:bg-[#282828] cursor-pointer flex items-center gap-2 font-medium"
                  >
                    <Folder className="w-3.5 h-3.5" style={{ color: folder.color }} />
                    <span>{folder.name}</span>
                  </button>

                  {folder.children && folder.children.map(sub => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => handleMoveExam(sub.id)}
                      className="w-full text-left pl-6 pr-3 py-1.5 rounded-lg text-xs hover:bg-[#f1f3f4] dark:hover:bg-[#282828] cursor-pointer flex items-center gap-2 text-[#5f6368]"
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
                className="px-4 py-1.5 text-xs text-[#5f6368] hover:bg-black/5 rounded-full cursor-pointer font-medium"
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
            className="bg-white dark:bg-[#1e1e1e] rounded-3xl p-6 max-w-sm w-full border border-[#dadce0] dark:border-[#3c4043] shadow-2xl animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#dadce0] dark:border-[#3c4043] mb-4">
              <h3 className="font-bold text-sm text-[#202124] dark:text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#1a73e8]" />
                <span>Đổi tên đề thi</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsRenameExamModalOpen(false)}
                className="p-1 rounded-full text-[#5f6368] hover:bg-black/5 cursor-pointer"
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
                className="w-full px-3.5 py-2 text-xs bg-[#f1f3f4] dark:bg-[#282828] border border-[#dadce0] dark:border-[#3c4043] rounded-xl outline-hidden focus:border-[#1a73e8]"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsRenameExamModalOpen(false)}
                className="px-4 py-2 text-xs text-[#5f6368] hover:bg-black/5 rounded-full cursor-pointer font-medium"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs app-button-primary text-white rounded-full font-semibold shadow-xs cursor-pointer"
              >
                Lưu tên mới
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#202124] text-white px-4 py-2.5 rounded-full text-xs font-semibold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

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
          writeDraft(localStorage, currentUser.id, 'new', { ...newExam, id: 'draft_' + crypto.randomUUID(), serverId: undefined, version: undefined });
          router.push('/editor/new');
        }}
        apiKey=""
      />

      <QuestionBankModal ownerId={currentUser.id} key={`bank:${currentUser.id}`}
        isOpen={isQuestionBankOpen}
        allowInsert={false}
        onClose={() => setIsQuestionBankOpen(false)}
        onInsertQuestion={() => {}}
      />

      <ApiKeyModal ownerId={currentUser.id} key={`keys:${currentUser.id}`}
        isOpen={isApiKeyModalOpen}
        onClose={() => {
          setIsApiKeyModalOpen(false);
          loadKeyStatus();
        }}
        onKeyUpdated={() => {
          loadKeyStatus();
        }}
      />

      <AiLearningModal
        isOpen={isAiLearningModalOpen}
        onClose={() => setIsAiLearningModalOpen(false)}
        currentUser={currentUser}
      />

      <TeacherAiSecretaryDrawer
        isOpen={isAiSecretaryModalOpen}
        onClose={() => setIsAiSecretaryModalOpen(false)}
        currentUser={currentUser}
        onOpenAiLearningModal={() => setIsAiLearningModalOpen(true)}
      />
    </div>
  );
};

export default TeacherDashboard;
