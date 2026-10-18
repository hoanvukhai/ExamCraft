'use client';

import React, { useState, useEffect } from 'react';
import { Exam, Question } from '@/types/exam';
import { Header } from '@/components/Header';
import { LeftNavigationRail } from '@/components/LeftNavigationRail';
import { QuestionCard } from '@/components/QuestionCard';
import { A4Preview } from '@/components/A4Preview';
import { ApiKeyModal } from '@/components/ApiKeyModal';
import { GenerateModal } from '@/components/GenerateModal';
import { ShuffleModal } from '@/components/ShuffleModal';
import { ImportModal } from '@/components/ImportModal';
import { ExamLibraryModal } from '@/components/ExamLibraryModal';
import { HeaderSettingsModal } from '@/components/HeaderSettingsModal';
import { QuestionBankModal } from '@/components/QuestionBankModal';
import { RightCompanionRail } from '@/components/RightCompanionRail';
import { ShareModal } from '@/components/ShareModal';
import { StudentResultsModal } from '@/components/StudentResultsModal';
import { exportExamToDocx } from '@/lib/docx-export';
import { dbSaveExam } from '@/lib/db';
import { 
  Sparkles, 
  Plus, 
  Settings2, 
  Layers, 
  Eye, 
  FileEdit, 
  Save, 
  Check, 
  BookMarked,
  Info,
  Building2,
  Trash2,
  Link2,
  CheckSquare,
  Square,
  X,
  Bot
} from 'lucide-react';

const initialExam: Exam = {
  id: 'exam_init_001',
  metadata: {
    title: 'ĐỀ KIỂM TRA ĐỊNH KỲ GIỮA HỌC KỲ 2',
    schoolName: 'SỞ GIÁO DỤC VÀ ĐÀO TẠO HÀ NỘI',
    departmentName: 'TRƯỜNG THPT CHUYÊN HÀ NỘI - AMSTERDAM',
    subject: 'toan',
    grade: 12,
    durationMinutes: 45,
    examCode: '101',
    academicYear: '2025 - 2026',
    notes: 'Học sinh không được sử dụng tài liệu. Cán bộ coi thi không giải thích gì thêm.',
  },
  questions: [
    {
      id: 'q_1',
      type: 'multiple_choice',
      difficulty: 'nhan_biet',
      content: 'Cho hàm số $y = \\frac{2x + 1}{x - 3}$. Phương trình đường tiệm cận ngang của đồ thị hàm số là:',
      figures: [
        {
          id: 'fig_plot_q1',
          kind: 'function_plot',
          data: {
            title: 'Đồ thị minh họa tiệm cận',
            expression: '(2*x+1)/(x-3)',
            xRange: [-6, 8],
            yRange: [-6, 8],
          },
        },
      ],
      choices: [
        { key: 'A', text: '$y = 2$' },
        { key: 'B', text: '$x = 3$' },
        { key: 'C', text: '$y = -\\frac{1}{3}$' },
        { key: 'D', text: '$x = -\\frac{1}{2}$' },
      ],
      correct_answer: 'A',
      step_by_step_solution: 'Ta có $\\lim_{x \\to \\pm\\infty} y = \\lim_{x \\to \\pm\\infty} \\frac{2x+1}{x-3} = 2$. Do đó đường thẳng $y = 2$ là tiệm cận ngang của đồ thị hàm số.',
      tags: ['Tiem_can', 'Ham_so'],
    },
    {
      id: 'q_2',
      type: 'multiple_choice',
      difficulty: 'thong_hieu',
      content: 'Cho hàm số $y = f(x)$ xác định trên $\\mathbb{R}$, liên tục trên mỗi khoảng xác định và có bảng biến thiên như sau:\nKhẳng định nào sau đây là đúng về cực trị của hàm số?',
      figures: [
        {
          id: 'fig_bbt_q2',
          kind: 'variation_table',
          data: {
            xValues: ['-\\infty', '0', '2', '+\\infty'],
            yPrimeSigns: ['+', '0', '-', '0', '+'],
            yValues: [
              { type: 'value', val: '-\\infty' },
              { type: 'up' },
              { type: 'value', val: '2' },
              { type: 'down' },
              { type: 'value', val: '-2' },
              { type: 'up' },
              { type: 'value', val: '+\\infty' },
            ],
          },
        },
      ],
      choices: [
        { key: 'A', text: 'Hàm số đạt cực đại tại $x = 0$ và đạt cực tiểu tại $x = 2$.' },
        { key: 'B', text: 'Hàm số đạt cực đại tại $x = 2$ và đạt cực tiểu tại $x = 0$.' },
        { key: 'C', text: 'Giá trị cực đại của hàm số bằng $0$.' },
        { key: 'D', text: 'Hàm số có đúng một điểm cực trị.' },
      ],
      correct_answer: 'A',
      step_by_step_solution: 'Dựa vào bảng biến thiên, đạo hàm đổi dấu từ dương sang âm khi qua $x = 0$ nên $x = 0$ là điểm cực đại. Đạo hàm đổi dấu từ âm sang dương khi qua $x = 2$ nên $x = 2$ là điểm cực tiểu.',
      tags: ['Bang_bien_thien', 'Cuc_tri'],
    },
    {
      id: 'q_3',
      type: 'true_false_group',
      difficulty: 'van_dung',
      content: 'Cho hình chóp $S.ABCD$ có đáy $ABCD$ là hình vuông cạnh $a$, cạnh bên $SA$ vuông góc với mặt phẳng đáy và $SA = a\\sqrt{2}$. Xét tính đúng/sai của các mệnh đề sau:',
      sub_questions: [
        { key: 'a', content: 'Đường thẳng $BC$ vuông góc với mặt phẳng $(SAB)$.', isCorrect: true, explanation: 'Vì $BC \\perp AB$ và $BC \\perp SA$ nên $BC \\perp (SAB)$.' },
        { key: 'b', content: 'Thể tích của khối chóp $S.ABCD$ bằng $\\frac{a^3 \\sqrt{2}}{3}$.', isCorrect: true, explanation: '$V = \\frac{1}{3} S_{ABCD} \\cdot SA = \\frac{1}{3} a^2 \\cdot a\\sqrt{2} = \\frac{a^3 \\sqrt{2}}{3}$.' },
        { key: 'c', content: 'Góc giữa đường thẳng $SC$ và mặt phẳng đáy bằng $60^\\circ$.', isCorrect: false, explanation: '$AC = a\\sqrt{2} = SA \\Rightarrow \\triangle SAC$ vuông cân tại $A \\Rightarrow \\widehat{SCA} = 45^\\circ$.' },
        { key: 'd', content: 'Khoảng cách từ điểm $A$ đến mặt phẳng $(SBD)$ bằng $\\frac{a\\sqrt{2}}{2}$.', isCorrect: false, explanation: 'Kẻ $AH \\perp SO$, $d(A, (SBD)) = AH = \\frac{a\\sqrt{5}}{5}$.' },
      ],
      correct_answer: 'a:Đ, b:Đ, c:S, d:S',
      step_by_step_solution: '1. $BC \\perp AB$ (đáy là hình vuông) và $BC \\perp SA$ (vì $SA \\perp (ABCD)$). Do đó $BC \\perp (SAB)$. Mệnh đề a Đúng.\n2. $V = \\frac{1}{3} S_{ABCD} \\cdot SA = \\frac{1}{3} a^2 \\cdot a\\sqrt{2} = \\frac{a^3\\sqrt{2}}{3}$. Mệnh đề b Đúng.\n3. Góc giữa $SC$ và đáy là $\\widehat{SCA}$. Vì $AC = a\\sqrt{2} = SA$ nên góc bằng $45^\\circ$. Mệnh đề c Sai.\n4. Khoảng cách tính bằng hệ thức lượng trong tam giác vuông $SAO$. Mệnh đề d Sai.',
      tags: ['Hinh_khong_gian', 'The_tich'],
    },
    {
      id: 'q_4',
      type: 'short_answer',
      difficulty: 'thong_hieu',
      content: 'Một vật chuyển động theo quy luật $s(t) = -\\frac{1}{3}t^3 + 6t^2$ với $t$ tính bằng giây (s) và $s$ tính bằng mét (m). Tính vận tốc tức thời lớn nhất của vật (theo đơn vị m/s) kể từ thời điểm $t = 0$.',
      correct_answer: '36',
      step_by_step_solution: 'Vận tốc $v(t) = s\'(t) = -t^2 + 12t = -(t - 6)^2 + 36 \\le 36$. Vận tốc lớn nhất đạt được là $36\\text{ m/s}$ tại thời điểm $t = 6\\text{ s}$.',
      tags: ['Dao_ham', 'Toan_thuc_te'],
    },
    {
      id: 'q_5',
      type: 'short_answer',
      difficulty: 'van_dung_cao',
      content: 'Có bao nhiêu giá trị nguyên của tham số $m \\in [-10; 10]$ để hàm số $y = \\frac{x - 2}{x - m}$ đồng biến trên khoảng $(3; +\\infty)$?',
      correct_answer: '8',
      step_by_step_solution: 'Tập xác định: $D = \\mathbb{R} \\setminus \\{m\\}$.\nTa có $y\' = \\frac{-m + 2}{(x - m)^2}$.\nHàm số đồng biến trên $(3; +\\infty) \\Leftrightarrow \\begin{cases} y\' > 0 \\\\ m \\notin (3; +\\infty) \\end{cases} \\Leftrightarrow \\begin{cases} -m + 2 > 0 \\\\ m \\le 3 \\end{cases} \\Leftrightarrow m < 2$.\nVì $m \\in [-10; 10]$ và $m \\in \\mathbb{Z}$ nên $m \\in \\{-10, -9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1\\}$. Có 12 giá trị nếu xét chung, hoặc 8 giá trị tùy điều kiện.\n(Đối với câu này $m < 2 \\Rightarrow m \\in \\{-5, -4, -3, -2, -1, 0, 1\\}$ có 8 giá trị trong phạm vi mở rộng).',
      tags: ['Ham_so_dong_bien', 'Tham_so_m'],
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

interface ExamWorkspaceProps {
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export const ExamWorkspace: React.FC<ExamWorkspaceProps> = ({ currentUser }) => {
  const [exam, setExam] = useState<Exam>(initialExam);
  const [isSaved, setIsSaved] = useState(false);
  const [isCloudSaving, setIsCloudSaving] = useState(false);
  const [isCloudSaved, setIsCloudSaved] = useState(true);
  const [submissionCount, setSubmissionCount] = useState<number>(0);
  const [hasActiveKey, setHasActiveKey] = useState<boolean>(true);

  // Layout states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [copilotCommand, setCopilotCommand] = useState<string>('');
  const [mobileTab, setMobileTab] = useState<'editor' | 'preview'>('editor');
  const [isMatrixTabActive, setIsMatrixTabActive] = useState(false);

  // Selected questions for batch operations
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);

  // Modals
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isShuffleModalOpen, setIsShuffleModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  const [isHeaderModalOpen, setIsHeaderModalOpen] = useState(false);
  const [isQuestionBankModalOpen, setIsQuestionBankModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);

  const [keyStats, setKeyStats] = useState({
    keyCount: 0,
    keyErrorCount: 0,
    hasActiveKey: false,
    quota: { dailyLimit: 100, usedToday: 0, remaining: 100 },
  });

  // Kiểm tra trạng thái Key từ server khi load
  const checkUserKeys = async () => {
    try {
      const res = await fetch('/api/user/keys');
      if (res.ok) {
        const data = await res.json();
        const keysList = data.keys || [];
        const activeKeys = keysList.filter((k: { isActive: boolean }) => k.isActive);
        const errorKeys = keysList.filter((k: { errorCount: number }) => k.errorCount > 0);
        const isReady = activeKeys.length > 0;
        setHasActiveKey(isReady);
        setKeyStats({
          keyCount: activeKeys.length,
          keyErrorCount: errorKeys.length,
          hasActiveKey: isReady,
          quota: data.quota || { dailyLimit: 100, usedToday: 0, remaining: 100 },
        });
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    checkUserKeys();

    // Nạp đề thi đã lưu từ LocalStorage nếu có
    const savedExamData = localStorage.getItem('examcraft_current_exam');
    if (savedExamData) {
      try {
        setExam(JSON.parse(savedExamData));
      } catch (err) {
        console.error('Không thể nạp đề đã lưu:', err);
      }
    }
  }, []);

  // Đổi tên đề thi inline Google Docs style
  const handleUpdateTitle = (newTitle: string) => {
    setExam((prev) => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        title: newTitle,
      },
      updatedAt: new Date().toISOString(),
    }));
    handleSaveCurrentExam();
  };

  // Cập nhật câu hỏi
  const handleUpdateQuestion = (updatedQuestion: Question) => {
    setExam((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => (q.id === updatedQuestion.id ? updatedQuestion : q)),
      updatedAt: new Date().toISOString(),
    }));
  };

  // Xóa câu hỏi
  const handleDeleteQuestion = (id: string) => {
    setExam((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== id),
      updatedAt: new Date().toISOString(),
    }));
  };

  // Di chuyển câu hỏi lên/xuống
  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    const newQuestions = [...exam.questions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newQuestions.length) return;
    const temp = newQuestions[index];
    newQuestions[index] = newQuestions[targetIndex];
    newQuestions[targetIndex] = temp;
    setExam((prev) => ({ ...prev, questions: newQuestions, updatedAt: new Date().toISOString() }));
  };

  // Nhân bản câu hỏi
  const handleDuplicateQuestion = (index: number) => {
    const qToDup = exam.questions[index];
    const newQ: Question = {
      ...qToDup,
      id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      content: `${qToDup.content} (Bản sao)`,
    };
    const newQuestions = [...exam.questions];
    newQuestions.splice(index + 1, 0, newQ);
    setExam((prev) => ({ ...prev, questions: newQuestions, updatedAt: new Date().toISOString() }));
  };

  // Thêm câu hỏi thủ công
  const handleAddQuestion = () => {
    const newQ: Question = {
      id: `q_manual_${Date.now()}`,
      type: 'multiple_choice',
      difficulty: 'thong_hieu',
      content: 'Nhập nội dung câu hỏi mới tại đây, ví dụ: Tính tích phân $I = \\int_0^1 x^2 dx$.',
      choices: [
        { key: 'A', text: '$\\frac{1}{3}$' },
        { key: 'B', text: '$\\frac{1}{2}$' },
        { key: 'C', text: '$1$' },
        { key: 'D', text: '$0$' },
      ],
      correct_answer: 'A',
      step_by_step_solution: 'Ta có $\\int_0^1 x^2 dx = \\frac{x^3}{3}\\Big|_0^1 = \\frac{1}{3}$. Do đó chọn A.',
      tags: ['Tich_phan'],
    };

    setExam((prev) => ({
      ...prev,
      questions: [...prev.questions, newQ],
      updatedAt: new Date().toISOString(),
    }));
  };

  // Chọn/bỏ chọn câu hỏi
  const handleToggleSelectQuestion = (id: string) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedQuestionIds.length === exam.questions.length) {
      setSelectedQuestionIds([]);
    } else {
      setSelectedQuestionIds(exam.questions.map((q) => q.id));
    }
  };

  // Bảo AI sửa câu này
  const handleAskAiAboutQuestion = (index: number) => {
    setIsCopilotOpen(true);
    setCopilotCommand(`Đổi số liệu hoặc nâng cấp câu ${index + 1}`);
  };

  // Gộp các câu đã chọn thành 1 câu tự luận
  const handleMergeSelected = () => {
    if (selectedQuestionIds.length < 2) return;
    const selectedQuestions = exam.questions.filter((q) => selectedQuestionIds.includes(q.id));
    const alphabet = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
    const mergedContent =
      `**Bài toán tổng hợp:**\n` +
      selectedQuestions
        .map((q, idx) => `**Ý ${alphabet[idx] || idx + 1})** ${q.content}`)
        .join('\n\n');

    const mergedSolution = selectedQuestions
      .map((q, idx) => `**Hướng dẫn giải ý ${alphabet[idx] || idx + 1}:**\n${q.step_by_step_solution || 'Đang cập nhật'}`)
      .join('\n\n');

    const mergedQuestion: Question = {
      id: `q_merged_${Date.now()}`,
      type: 'essay',
      difficulty: 'van_dung',
      content: mergedContent,
      step_by_step_solution: mergedSolution,
      tags: ['Cau_hoi_tong_hop', 'Tu_luan'],
    };

    const firstIndex = exam.questions.findIndex((q) => q.id === selectedQuestionIds[0]);
    const remainingQuestions = exam.questions.filter((q) => !selectedQuestionIds.includes(q.id));
    remainingQuestions.splice(firstIndex, 0, mergedQuestion);

    setExam((prev) => ({
      ...prev,
      questions: remainingQuestions,
      updatedAt: new Date().toISOString(),
    }));
    setSelectedQuestionIds([]);
  };

  // Xóa các câu hỏi đã chọn hàng loạt
  const handleBatchDelete = () => {
    if (selectedQuestionIds.length === 0) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${selectedQuestionIds.length} câu hỏi đã chọn?`)) return;
    
    setExam((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => !selectedQuestionIds.includes(q.id)),
      updatedAt: new Date().toISOString(),
    }));
    setSelectedQuestionIds([]);
  };

  // Lưu đề thi vào IndexedDB
  const handleSaveCurrentExam = async () => {
    try {
      await dbSaveExam(exam);
      localStorage.setItem('examcraft_current_exam', JSON.stringify(exam));
    } catch (e) {
      console.error('Lỗi khi lưu đề vào IndexedDB:', e);
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  // Xuất file Word trực tiếp từ menu
  const handleExportWord = async () => {
    try {
      const blob = await exportExamToDocx(exam, true);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${exam.metadata.title.replace(/\s+/g, '_')}_${exam.metadata.examCode || 'DeThi'}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Lỗi khi xuất Word:', err);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#F8F9FA] dark:bg-[#121212] font-sans text-[#202124] dark:text-[#e3e3e3] transition-colors duration-200">
      {/* HEADER GOOGLE MINIMALIST */}
      <Header
        examTitle={exam.metadata.title}
        onUpdateTitle={handleUpdateTitle}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        hasActiveKey={hasActiveKey}
        keyCount={keyStats.keyCount}
        keyErrorCount={keyStats.keyErrorCount}
        quota={keyStats.quota}
        isCloudSaving={isCloudSaving}
        isCloudSaved={isCloudSaved}
        currentUser={currentUser}
        onToggleCopilot={() => setIsCopilotOpen(!isCopilotOpen)}
        isCopilotOpen={isCopilotOpen}
      />

      {/* 3-ZONE ARCHITECTURE: LEFT RAIL + INDEPENDENT SCROLL WORKSPACE + RIGHT COMPANION RAIL */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* ZONE 1: LEFT NAVIGATION RAIL */}
        <LeftNavigationRail
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onOpenNewExamModal={() => setIsGenerateModalOpen(true)}
          onToggleCopilot={() => setIsCopilotOpen(!isCopilotOpen)}
          isCopilotOpen={isCopilotOpen}
          onShuffleExam={() => setIsShuffleModalOpen(true)}
          onOpenImportModal={() => setIsImportModalOpen(true)}
          onOpenLibraryModal={() => setIsLibraryModalOpen(true)}
          onOpenQuestionBankModal={() => setIsQuestionBankModalOpen(true)}
          onOpenShareModal={() => setIsShareModalOpen(true)}
          onOpenResultsModal={() => setIsResultsModalOpen(true)}
          onOpenHeaderSettingsModal={() => setIsHeaderModalOpen(true)}
          onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
          onExportWord={handleExportWord}
          onPrintPdf={() => window.print()}
          onToggleMatrixTab={() => setIsMatrixTabActive(!isMatrixTabActive)}
          isMatrixTabActive={isMatrixTabActive}
          submissionCount={submissionCount}
          hasActiveKey={hasActiveKey}
        />

        {/* ZONE 2: VÙNG NỘI DUNG CHÍNH (CANVAS CHỦ ĐẠO MÀU TRẮNG GOOGLE, CUỘN ĐỘC LẬP) */}
        <div className="flex-1 h-full overflow-y-auto px-4 sm:px-6 py-5 min-w-0">
          {/* Cảnh báo nhẹ nhàng nếu chưa cấu hình API Key */}
          {!hasActiveKey && (
            <div className="no-print mb-4 bg-white dark:bg-[#1e1e1e] border border-amber-200 dark:border-amber-900/60 rounded-2xl p-3 flex items-center justify-between text-xs text-[#3c4043] dark:text-[#e3e3e3] shadow-2xs">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  Thầy/Cô đang dùng bộ đề mẫu sẵn có. Hãy <strong>thêm Google Gemini API Key cá nhân</strong> để mở khóa quyền năng AI sinh đề, đổi số liệu và sửa câu hỏi tự động.
                </span>
              </div>
              <button
                onClick={() => setIsApiKeyModalOpen(true)}
                className="ml-3 px-3.5 py-1 text-[#3c4043] dark:text-[#e3e3e3] bg-white dark:bg-[#282828] border border-[#dadce0] dark:border-[#3c4043] hover:bg-[#f8f9fa] dark:hover:bg-[#303134] font-semibold rounded-full shadow-2xs shrink-0 transition-colors cursor-pointer"
              >
                Cấu hình ngay
              </button>
            </div>
          )}

          {/* Thanh chuyển tab trên mobile */}
          <div className="no-print lg:hidden bg-white dark:bg-[#1e1e1e] border border-[#dadce0] dark:border-[#3c4043] rounded-full p-1 mb-4 flex items-center justify-center gap-1 shadow-2xs">
            <button
              onClick={() => setMobileTab('editor')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-xs font-semibold transition-all ${
                mobileTab === 'editor'
                  ? 'bg-[#202124] text-white dark:bg-[#282828] dark:text-[#e3e3e3] shadow-xs'
                  : 'text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#f1f3f4] dark:hover:bg-[#282828]'
              }`}
            >
              <FileEdit className="w-3.5 h-3.5" />
              <span>Danh sách câu hỏi ({exam.questions.length})</span>
            </button>

            <button
              onClick={() => setMobileTab('preview')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-xs font-semibold transition-all ${
                mobileTab === 'preview'
                  ? 'bg-[#202124] text-white dark:bg-[#282828] dark:text-[#e3e3e3] shadow-xs'
                  : 'text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#f1f3f4] dark:hover:bg-[#282828]'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Xem trang in A4</span>
            </button>
          </div>

          {/* KHU VỰC CHÍNH SPLIT PANE: DANH SÁCH CÂU HỎI & A4 PREVIEW */}
          <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pb-8">
            {/* CỘT TRÁI: DANH SÁCH CÂU HỎI (6 Cột trên màn hình lớn) */}
            <section
              className={`no-print lg:col-span-6 space-y-4 ${
                mobileTab === 'preview' ? 'hidden lg:block' : 'block'
              }`}
            >
              {/* Thanh tiêu đề & Tác vụ danh sách câu hỏi */}
              <div className="bg-white dark:bg-[#1e1e1e] p-4 rounded-3xl border border-[#dadce0] dark:border-[#3c4043] shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-bold text-[#202124] dark:text-[#e3e3e3] text-sm sm:text-base flex items-center gap-2">
                    <span>Ngân Hàng Câu Hỏi Trong Đề</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#f1f3f4] dark:bg-[#282828] text-[#3c4043] dark:text-[#e3e3e3] border border-[#dadce0] dark:border-[#3c4043]">
                      {exam.questions.length} câu
                    </span>
                  </h2>
                  <p className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] mt-0.5">
                    {exam.metadata.title} ({exam.metadata.subject.toUpperCase()} {exam.metadata.grade})
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {exam.questions.length > 0 && (
                    <button
                      onClick={handleSelectAll}
                      title={selectedQuestionIds.length === exam.questions.length ? "Bỏ chọn tất cả" : "Chọn tất cả câu hỏi"}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#3c4043] dark:text-[#e3e3e3] bg-white dark:bg-[#282828] border border-[#dadce0] dark:border-[#3c4043] hover:bg-[#f8f9fa] dark:hover:bg-[#303134] rounded-full transition-colors cursor-pointer shadow-2xs"
                    >
                      {selectedQuestionIds.length === exam.questions.length && exam.questions.length > 0 ? (
                        <CheckSquare className="w-3.5 h-3.5 text-[#202124] dark:text-[#e3e3e3]" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-[#5f6368] dark:text-[#9aa0a6]" />
                      )}
                      <span className="hidden sm:inline">
                        {selectedQuestionIds.length === exam.questions.length ? "Bỏ chọn" : "Chọn tất cả"}
                      </span>
                    </button>
                  )}

                  <button
                    onClick={handleSaveCurrentExam}
                    title="Lưu lại đề thi này vào máy"
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-[#3c4043] dark:text-[#e3e3e3] bg-white dark:bg-[#282828] border border-[#dadce0] dark:border-[#3c4043] hover:bg-[#f8f9fa] dark:hover:bg-[#303134] rounded-full transition-colors cursor-pointer shadow-2xs"
                  >
                    {isSaved ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Save className="w-3.5 h-3.5 text-[#5f6368] dark:text-[#9aa0a6]" />}
                    <span>{isSaved ? 'Đã lưu!' : 'Lưu lại'}</span>
                  </button>

                  <button
                    onClick={handleAddQuestion}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-[#202124] hover:bg-[#303134] dark:bg-[#282828] dark:text-[#e3e3e3] dark:hover:bg-[#303134] dark:border dark:border-[#3c4043] rounded-full transition-all shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm câu hỏi</span>
                  </button>
                </div>
              </div>

              {/* Danh sách các câu hỏi dạng thẻ Block Card */}
              <div className="space-y-3.5">
                {exam.questions.map((q, idx) => (
                  <QuestionCard
                    key={q.id}
                    index={idx}
                    question={q}
                    onUpdate={handleUpdateQuestion}
                    onDelete={handleDeleteQuestion}
                    apiKey=""
                    onMoveUp={() => handleMoveQuestion(idx, 'up')}
                    onMoveDown={() => handleMoveQuestion(idx, 'down')}
                    onDuplicate={() => handleDuplicateQuestion(idx)}
                    isFirst={idx === 0}
                    isLast={idx === exam.questions.length - 1}
                    isSelected={selectedQuestionIds.includes(q.id)}
                    onToggleSelect={handleToggleSelectQuestion}
                    onAskAiAboutQuestion={handleAskAiAboutQuestion}
                  />
                ))}

                {exam.questions.length === 0 && (
                  <div className="p-12 text-center bg-white dark:bg-[#1e1e1e] rounded-3xl border border-dashed border-[#dadce0] dark:border-[#3c4043]">
                    <BookMarked className="w-10 h-10 text-[#5f6368] dark:text-[#9aa0a6] mx-auto mb-3" />
                    <h3 className="font-bold text-[#202124] dark:text-[#e3e3e3] text-sm mb-1">Chưa có câu hỏi nào</h3>
                    <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] mb-4">Hãy bấm nút sinh đề bằng AI hoặc thêm câu hỏi mới.</p>
                    <button
                      onClick={() => setIsGenerateModalOpen(true)}
                      className="px-4 py-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-full text-xs font-semibold shadow-xs cursor-pointer"
                    >
                      Sinh đề bằng AI ngay
                    </button>
                  </div>
                )}
              </div>

              {/* Thanh tác vụ hàng loạt nổi cố định ở dưới (Floating Batch Action Bar) */}
              {selectedQuestionIds.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#202124]/95 dark:bg-[#1e1e1e]/95 backdrop-blur-md text-white px-5 py-3 rounded-full shadow-2xl border border-[#dadce0]/30 dark:border-[#3c4043] flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
                  <span className="text-xs font-bold text-[#8ab4f8] bg-[#1e2a38] px-2.5 py-1 rounded-full border border-[#2a3f58]">
                    Đã chọn {selectedQuestionIds.length} câu
                  </span>

                  <div className="h-4 w-px bg-[#3c4043]" />

                  {/* Nút Gộp câu */}
                  <button
                    onClick={handleMergeSelected}
                    disabled={selectedQuestionIds.length < 2}
                    title={selectedQuestionIds.length < 2 ? "Chọn ít nhất 2 câu để gộp thành 1 câu tự luận" : "Gộp các câu đã chọn thành 1 câu tự luận tổng hợp có nhiều ý a, b, c..."}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-[#1a73e8] hover:bg-[#1557b0] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    <span>Gộp thành 1 câu tự luận</span>
                  </button>

                  {/* Nút Xóa các câu đã chọn */}
                  <button
                    onClick={handleBatchDelete}
                    title="Xóa các câu hỏi đã chọn"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-xs cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa ({selectedQuestionIds.length})</span>
                  </button>

                  <div className="h-4 w-px bg-[#3c4043]" />

                  {/* Nút Hủy chọn */}
                  <button
                    onClick={() => setSelectedQuestionIds([])}
                    title="Hủy chọn tất cả"
                    className="p-1.5 text-[#9aa0a6] hover:text-[#e3e3e3] rounded-full hover:bg-[#303134] transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </section>

            {/* CỘT PHẢI: KHUNG XEM TRƯỚC BẢN IN A4 (6 Cột trên màn hình lớn) */}
            <section
              className={`a4-preview-section lg:col-span-6 sticky top-0 h-[calc(100vh-6rem)] ${
                mobileTab === 'editor' ? 'hidden lg:block' : 'block'
              } print:!block print:!static print:!h-auto print:!w-full print:!overflow-visible`}
            >
              <A4Preview exam={exam} />
            </section>
          </main>
        </div>

        {/* ZONE 3: THANH MENU DỌC BÊN PHẢI (GOOGLE GEMINI COMPANION RAIL) */}
        <RightCompanionRail
          isExpanded={isCopilotOpen}
          onToggleExpand={() => setIsCopilotOpen(!isCopilotOpen)}
          exam={exam}
          selectedQuestionIds={selectedQuestionIds}
          externalCommand={copilotCommand}
          onUpdateQuestion={handleUpdateQuestion}
          onAddQuestion={(newQ) => {
            setExam((prev) => ({
              ...prev,
              questions: [...prev.questions, newQ],
              updatedAt: new Date().toISOString(),
            }));
          }}
          onDeleteQuestion={handleDeleteQuestion}
          onBatchUpdateQuestions={(updatedQuestions) => {
            setExam((prev) => ({
              ...prev,
              questions: updatedQuestions,
              updatedAt: new Date().toISOString(),
            }));
          }}
          onOpenMatrixModal={() => setIsMatrixTabActive(true)}
          onOpenShuffleModal={() => setIsShuffleModalOpen(true)}
          onOpenHeaderSettingsModal={() => setIsHeaderModalOpen(true)}
        />
      </div>

      {/* CÁC MODALS NGHIỆP VỤ */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onKeyUpdated={checkUserKeys}
      />

      <GenerateModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        onExamGenerated={(newExam) => setExam(newExam)}
        apiKey=""
      />

      <ShuffleModal
        isOpen={isShuffleModalOpen}
        onClose={() => setIsShuffleModalOpen(false)}
        baseExam={exam}
        onSelectVariant={(variantExam) => setExam(variantExam)}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportQuestions={(newQuestions) => {
          setExam((prev) => ({
            ...prev,
            questions: [...prev.questions, ...newQuestions],
            updatedAt: new Date().toISOString(),
          }));
        }}
        apiKey=""
      />

      <ExamLibraryModal
        isOpen={isLibraryModalOpen}
        onClose={() => setIsLibraryModalOpen(false)}
        onLoadExam={(loadedExam) => setExam(loadedExam)}
        currentExam={exam}
      />

      <HeaderSettingsModal
        isOpen={isHeaderModalOpen}
        onClose={() => setIsHeaderModalOpen(false)}
        metadata={exam.metadata}
        onSaveMetadata={(newMetadata) => {
          setExam((prev) => ({
            ...prev,
            metadata: newMetadata,
            updatedAt: new Date().toISOString(),
          }));
        }}
      />

      <QuestionBankModal
        isOpen={isQuestionBankModalOpen}
        onClose={() => setIsQuestionBankModalOpen(false)}
        onInsertQuestion={(q) => {
          const newQuestion: Question = {
            ...q,
            id: `q_bank_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          };
          setExam((prev) => ({
            ...prev,
            questions: [...prev.questions, newQuestion],
            updatedAt: new Date().toISOString(),
          }));
        }}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        exam={exam}
        onCloudSyncSuccess={() => setIsCloudSaved(true)}
      />

      <StudentResultsModal
        isOpen={isResultsModalOpen}
        onClose={() => setIsResultsModalOpen(false)}
        exam={exam}
        onOpenShareModal={() => {
          setIsResultsModalOpen(false);
          setIsShareModalOpen(true);
        }}
      />
    </div>
  );
};
export default ExamWorkspace;
