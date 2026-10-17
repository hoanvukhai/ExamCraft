'use client';

import React, { useState, useEffect } from 'react';
import { Exam, Question } from '@/types/exam';
import { Header } from '@/components/Header';
import { QuestionCard } from '@/components/QuestionCard';
import { A4Preview } from '@/components/A4Preview';
import { ApiKeyModal } from '@/components/ApiKeyModal';
import { GenerateModal } from '@/components/GenerateModal';
import { ShuffleModal } from '@/components/ShuffleModal';
import { ImportModal } from '@/components/ImportModal';
import { ExamLibraryModal } from '@/components/ExamLibraryModal';
import { HeaderSettingsModal } from '@/components/HeaderSettingsModal';
import { QuestionBankModal } from '@/components/QuestionBankModal';
import { ExamCopilotBar } from '@/components/ExamCopilotBar';
import { ShareModal } from '@/components/ShareModal';
import { StudentResultsModal } from '@/components/StudentResultsModal';
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
  X
} from 'lucide-react';

// Dữ liệu đề thi mặc định ban đầu
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
        { key: 'A', text: 'Hàm số đạt cực đại tại $x = 0$ và đạt cực tiểu tại $x = 2$' },
        { key: 'B', text: 'Hàm số đạt cực đại tại $x = 2$ và đạt cực tiểu tại $x = 0$' },
        { key: 'C', text: 'Hàm số có giá trị cực đại bằng $0$' },
        { key: 'D', text: 'Hàm số không có cực trị' },
      ],
      correct_answer: 'A',
      step_by_step_solution: 'Dựa vào bảng biến thiên, ta thấy $y\'$ đổi dấu từ dương sang âm khi qua $x = 0$ nên hàm số đạt cực đại tại $x = 0$; $y\'$ đổi dấu từ âm sang dương khi qua $x = 2$ nên hàm số đạt cực tiểu tại $x = 2$.',
      tags: ['Bang_bien_thien', 'Cuc_tri'],
    },
    {
      id: 'q_3',
      type: 'multiple_choice',
      difficulty: 'thong_hieu',
      content: 'Tìm tập nghiệm $S$ của phương trình $\\log_2 (x - 1) + \\log_2 (x + 1) = 3$.',
      choices: [
        { key: 'A', text: '$S = \\{3\\}$' },
        { key: 'B', text: '$S = \\{-3; 3\\}$' },
        { key: 'C', text: '$S = \\{\\sqrt{7}\\}$' },
        { key: 'D', text: '$S = \\{4\\}$' },
      ],
      correct_answer: 'A',
      step_by_step_solution: 'Điều kiện xác định: $x - 1 > 0$ và $x + 1 > 0 \\Leftrightarrow x > 1$.\nPhương trình tương đương: $\\log_2 [(x-1)(x+1)] = 3 \\Leftrightarrow x^2 - 1 = 2^3 = 8 \\Leftrightarrow x^2 = 9 \\Leftrightarrow x = \\pm 3$.\nKết hợp điều kiện $x > 1$, ta nhận nghiệm $x = 3$.',
      tags: ['Logarit', 'Phuong_trinh'],
    },
    {
      id: 'q_4',
      type: 'true_false_group',
      difficulty: 'thong_hieu',
      content: 'Cho hàm số bậc ba $y = f(x) = x^3 - 3x^2 + 2$. Xét tính đúng/sai của các khẳng định sau:',
      sub_questions: [
        { key: 'a', content: 'Hàm số đồng biến trên khoảng $(0; 2)$.', isCorrect: false, explanation: '$f\'(x) = 3x^2 - 6x < 0$ trên $(0; 2)$ nên hàm số nghịch biến.' },
        { key: 'b', content: 'Đồ thị hàm số có điểm cực đại là $(0; 2)$.', isCorrect: true, explanation: '$f\'(0) = 0$ và $f(0) = 2$.' },
        { key: 'c', content: 'Giá trị nhỏ nhất của hàm số trên $[-1; 1]$ bằng $-2$.', isCorrect: true, explanation: '$f(-1) = -2, f(0) = 2, f(1) = 0 \\Rightarrow \\min = -2$.' },
        { key: 'd', content: 'Điểm uốn của đồ thị hàm số là $I(1; 0)$.', isCorrect: true, explanation: '$f\'\'(x) = 6x - 6 = 0 \\Leftrightarrow x = 1, y = 0$.' },
      ],
      correct_answer: 'a:S, b:Đ, c:Đ, d:Đ',
      step_by_step_solution: 'Tính đạo hàm $f\'(x) = 3x^2 - 6x = 3x(x - 2)$. Suy ra các khẳng định được kiểm tra lần lượt theo định lý cực trị và bảng biến thiên.',
      tags: ['Khao_sat_ham_so', 'Dung_Sai'],
    },
    {
      id: 'q_5',
      type: 'short_answer',
      difficulty: 'van_dung',
      content: 'Một xưởng sản xuất cần làm những chiếc hộp inox hình trụ có nắp với thể tích $V = 54\\pi\\text{ cm}^3$. Bán kính đáy $R$ (cm) bằng bao nhiêu để tiết kiệm nguyên liệu sản xuất nhất (diện tích toàn phần nhỏ nhất)?',
      correct_answer: '3',
      step_by_step_solution: 'Thể tích hình trụ: $V = \\pi R^2 h = 54\\pi \\Rightarrow h = \\frac{54}{R^2}$.\nDiện tích toàn phần: $S_{tp} = 2\\pi R^2 + 2\\pi R h = 2\\pi R^2 + 2\\pi R \\left(\\frac{54}{R^2}\\right) = 2\\pi \\left(R^2 + \\frac{54}{R}\\right)$.\nĐạo hàm: $S\'(R) = 2\\pi \\left(2R - \\frac{54}{R^2}\\right) = 0 \\Leftrightarrow 2R^3 = 54 \\Leftrightarrow R^3 = 27 \\Leftrightarrow R = 3\\text{ cm}$.',
      tags: ['Hinh_tru', 'Toan_thuc_te'],
    },
  ],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

export default function HomePage() {
  const [apiKey, setApiKey] = useState<string>('');
  const [exam, setExam] = useState<Exam>(initialExam);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isShuffleModalOpen, setIsShuffleModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  const [isHeaderModalOpen, setIsHeaderModalOpen] = useState(false);
  const [isQuestionBankModalOpen, setIsQuestionBankModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);
  const [isCloudSaving, setIsCloudSaving] = useState(false);
  const [isCloudSaved, setIsCloudSaved] = useState(false);
  const [submissionCount, setSubmissionCount] = useState(0);

  // Tab view trên màn hình nhỏ (Cards vs A4 Preview)
  const [mobileTab, setMobileTab] = useState<'editor' | 'preview'>('editor');
  const [isSaved, setIsSaved] = useState(false);

  // Quản lý chọn câu hỏi để thao tác hàng loạt hoặc gộp câu
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [copilotCommand, setCopilotCommand] = useState<string>('');

  const handleAskAiAboutQuestion = (index: number) => {
    setCopilotCommand(`Ở câu ${index + 1}: `);
  };

  const handleToggleSelectQuestion = (id: string) => {
    setSelectedQuestionIds(prev =>
      prev.includes(id) ? prev.filter(qId => qId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedQuestionIds.length === exam.questions.length) {
      setSelectedQuestionIds([]);
    } else {
      setSelectedQuestionIds(exam.questions.map(q => q.id));
    }
  };

  // Di chuyển câu hỏi lên / xuống
  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= exam.questions.length) return;

    setExam(prev => {
      const newQuestions = [...prev.questions];
      const temp = newQuestions[index];
      newQuestions[index] = newQuestions[targetIndex];
      newQuestions[targetIndex] = temp;
      return {
        ...prev,
        questions: newQuestions,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  // Nhân bản câu hỏi
  const handleDuplicateQuestion = (index: number) => {
    const sourceQ = exam.questions[index];
    const duplicatedQ: Question = {
      ...JSON.parse(JSON.stringify(sourceQ)),
      id: `q_copy_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    setExam(prev => {
      const newQuestions = [...prev.questions];
      newQuestions.splice(index + 1, 0, duplicatedQ);
      return {
        ...prev,
        questions: newQuestions,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  // Gộp các câu hỏi đã chọn thành 1 câu tự luận tổng hợp (Compound Question)
  const handleMergeSelected = () => {
    if (selectedQuestionIds.length < 2) return;
    
    // Tìm các câu hỏi theo thứ tự trong đề
    const selectedIndices = exam.questions
      .map((q, idx) => (selectedQuestionIds.includes(q.id) ? idx : -1))
      .filter(idx => idx !== -1);
    
    if (selectedIndices.length < 2) return;
    const firstIdx = selectedIndices[0];
    const selectedQuestions = selectedIndices.map(idx => exam.questions[idx]);

    // Gom nội dung các ý (1, 2, 3...)
    const mergedContentParts = selectedQuestions.map((q, i) => {
      return `${i + 1}) ${q.content}`;
    });

    const mergedSolutionParts = selectedQuestions.map((q, i) => {
      return `Ý ${i + 1}):\n${q.step_by_step_solution}`;
    });

    // Gom hình vẽ đồ thị / bảng biến thiên nếu có
    const mergedFigures = selectedQuestions.flatMap(q => q.figures || []);

    const mergedQuestion: Question = {
      id: `q_merged_${Date.now()}`,
      type: 'essay',
      difficulty: selectedQuestions.some(q => q.difficulty === 'van_dung_cao')
        ? 'van_dung_cao'
        : selectedQuestions.some(q => q.difficulty === 'van_dung')
        ? 'van_dung'
        : 'thong_hieu',
      content: mergedContentParts.join('\n\n'),
      step_by_step_solution: mergedSolutionParts.join('\n\n---\n\n'),
      figures: mergedFigures.length > 0 ? mergedFigures : undefined,
      tags: Array.from(new Set(selectedQuestions.flatMap(q => q.tags || []))),
    };

    setExam(prev => {
      const newQuestions: Question[] = [];
      prev.questions.forEach((q, idx) => {
        if (idx === firstIdx) {
          newQuestions.push(mergedQuestion);
        } else if (!selectedQuestionIds.includes(q.id)) {
          newQuestions.push(q);
        }
      });
      return {
        ...prev,
        questions: newQuestions,
        updatedAt: new Date().toISOString(),
      };
    });

    setSelectedQuestionIds([]);
  };

  // Xóa các câu hỏi đã chọn hàng loạt
  const handleBatchDelete = () => {
    if (selectedQuestionIds.length === 0) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${selectedQuestionIds.length} câu hỏi đã chọn?`)) return;
    
    setExam(prev => ({
      ...prev,
      questions: prev.questions.filter(q => !selectedQuestionIds.includes(q.id)),
      updatedAt: new Date().toISOString(),
    }));
    setSelectedQuestionIds([]);
  };

  // Load API Key & Exam từ LocalStorage khi khởi động
  useEffect(() => {
    const savedKey = localStorage.getItem('examcraft_gemini_api_key');
    if (savedKey) setApiKey(savedKey);

    const savedExamData = localStorage.getItem('examcraft_current_exam');
    if (savedExamData) {
      try {
        setExam(JSON.parse(savedExamData));
      } catch (err) {
        console.error('Không thể nạp đề đã lưu:', err);
      }
    }
  }, []);

  // Lưu API Key
  const handleSaveApiKey = (newKey: string) => {
    setApiKey(newKey);
    localStorage.setItem('examcraft_gemini_api_key', newKey);
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

  // Thêm một câu hỏi trắc nghiệm mới thủ công
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

  // Lưu đề thi vào IndexedDB và Thư viện cá nhân
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

  // Lưu đề thi lên Cloud Server (Cơ sở dữ liệu đám mây)
  const handleSaveCloud = async () => {
    try {
      setIsCloudSaving(true);
      const res = await fetch('/api/cloud/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exam),
      });
      const data = await res.json();
      if (data.success) {
        setIsCloudSaved(true);
        setTimeout(() => setIsCloudSaved(false), 2500);
      } else {
        alert(data.error || 'Lỗi khi lưu lên Đám mây');
      }
    } catch {
      alert('Không thể kết nối đến máy chủ Cloud');
    } finally {
      setIsCloudSaving(false);
    }
  };

  // Nạp số lượng bài nộp của học sinh
  useEffect(() => {
    if (exam?.id) {
      fetch(`/api/cloud/exams/${exam.id}/submissions`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && typeof data.totalCount === 'number') {
            setSubmissionCount(data.totalCount);
          }
        })
        .catch(() => {});
    }
  }, [exam?.id]);

  // Nạp thêm các câu hỏi từ Import
  const handleImportQuestions = (newQuestions: Question[]) => {
    setExam((prev) => ({
      ...prev,
      questions: [...prev.questions, ...newQuestions],
      updatedAt: new Date().toISOString(),
    }));
  };

  // Nạp câu hỏi từ Ngân hàng câu hỏi vào đề hiện tại
  const handleInsertFromBank = (q: Question) => {
    const newQuestion: Question = {
      ...q,
      id: `q_bank_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    setExam((prev) => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
      updatedAt: new Date().toISOString(),
    }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      {/* Header chính */}
      <Header
        apiKey={apiKey}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        onOpenNewExamModal={() => setIsGenerateModalOpen(true)}
        onShuffleExam={() => setIsShuffleModalOpen(true)}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onOpenLibraryModal={() => setIsLibraryModalOpen(true)}
        onOpenQuestionBankModal={() => setIsQuestionBankModalOpen(true)}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        onOpenResultsModal={() => setIsResultsModalOpen(true)}
        onSaveCloud={handleSaveCloud}
        isCloudSaving={isCloudSaving}
        isCloudSaved={isCloudSaved}
        submissionCount={submissionCount}
      />

      {/* Thông báo nhắc nhập API Key nếu chưa có */}
      {!apiKey && (
        <div className="no-print bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Bạn đang dùng chế độ <strong>Bộ Đề Mẫu Tiêu Chuẩn</strong>. Hãy nhập Gemini API Key để mở khóa quyền năng AI sinh đề và đổi số liệu không giới hạn!
            </span>
            <button
              onClick={() => setIsApiKeyModalOpen(true)}
              className="ml-auto underline font-bold hover:text-amber-950 shrink-0"
            >
              Cấu hình ngay
            </button>
          </div>
        </div>
      )}

      {/* Thanh chuyển tab trên mobile */}
      <div className="no-print lg:hidden bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-center gap-2">
        <button
          onClick={() => setMobileTab('editor')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold ${
            mobileTab === 'editor'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileEdit className="w-3.5 h-3.5" />
          <span>Danh sách câu hỏi ({exam.questions.length})</span>
        </button>

        <button
          onClick={() => setMobileTab('preview')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold ${
            mobileTab === 'preview'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Xem trang in A4</span>
        </button>
      </div>

      {/* Khu vực làm việc chính (Split Pane) */}
      <main className="grow max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CỘT TRÁI: QUẢN LÝ THẺ CÂU HỎI (6 Cột trên màn hình lớn) */}
        <section
          className={`no-print lg:col-span-6 space-y-4 ${
            mobileTab === 'preview' ? 'hidden lg:block' : 'block'
          }`}
        >
          {/* Thanh công cụ danh sách câu hỏi */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <span>Ngân Hàng Câu Hỏi Trong Đề</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                  {exam.questions.length} câu
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {exam.metadata.title} ({exam.metadata.subject.toUpperCase()} {exam.metadata.grade})
              </p>
            </div>

            <div className="flex items-center gap-2">
              {exam.questions.length > 0 && (
                <button
                  onClick={handleSelectAll}
                  title={selectedQuestionIds.length === exam.questions.length ? "Bỏ chọn tất cả" : "Chọn tất cả câu hỏi"}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  {selectedQuestionIds.length === exam.questions.length && exam.questions.length > 0 ? (
                    <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span className="hidden sm:inline">
                    {selectedQuestionIds.length === exam.questions.length ? "Bỏ chọn" : "Chọn tất cả"}
                  </span>
                </button>
              )}

              <button
                onClick={() => setIsHeaderModalOpen(true)}
                title="Căn chỉnh tiêu đề trường/lớp/kỳ thi"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">Tiêu đề trường</span>
              </button>

              <button
                onClick={handleSaveCurrentExam}
                title="Lưu lại đề thi này vào máy"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                {isSaved ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Save className="w-3.5 h-3.5 text-slate-600" />}
                <span>{isSaved ? 'Đã lưu!' : 'Lưu lại'}</span>
              </button>

              <button
                onClick={handleAddQuestion}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/60 rounded-xl transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm câu hỏi</span>
              </button>
            </div>
          </div>

          {/* Trợ lý AI Biên tập trực tiếp đề thi (Exam Copilot Bar) */}
          <ExamCopilotBar
            exam={exam}
            apiKey={apiKey}
            selectedQuestionIds={selectedQuestionIds}
            externalCommand={copilotCommand}
            onUpdateQuestion={handleUpdateQuestion}
            onAddQuestion={(newQ) => {
              setExam(prev => ({
                ...prev,
                questions: [...prev.questions, newQ],
                updatedAt: new Date().toISOString(),
              }));
            }}
            onDeleteQuestion={handleDeleteQuestion}
            onBatchUpdateQuestions={(updatedQuestions) => {
              setExam(prev => ({
                ...prev,
                questions: updatedQuestions,
                updatedAt: new Date().toISOString(),
              }));
            }}
          />

          {/* Danh sách các câu hỏi dạng thẻ Block Card */}
          <div className="space-y-3.5">
            {exam.questions.map((q, idx) => (
              <QuestionCard
                key={q.id}
                index={idx}
                question={q}
                onUpdate={handleUpdateQuestion}
                onDelete={handleDeleteQuestion}
                apiKey={apiKey}
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
              <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                <BookMarked className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <h3 className="font-bold text-slate-800 text-sm mb-1">Chưa có câu hỏi nào</h3>
                <p className="text-xs text-slate-500 mb-4">Hãy bấm nút sinh đề bằng AI hoặc thêm câu hỏi mới.</p>
                <button
                  onClick={() => setIsGenerateModalOpen(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  Sinh đề bằng AI ngay
                </button>
              </div>
            )}
          </div>

          {/* Thanh tác vụ hàng loạt nổi cố định ở dưới (Floating Batch Action Bar) */}
          {selectedQuestionIds.length > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
              <span className="text-xs font-bold text-indigo-300 bg-indigo-950/80 px-2.5 py-1 rounded-lg border border-indigo-700/50">
                Đã chọn {selectedQuestionIds.length} câu
              </span>

              <div className="h-4 w-px bg-slate-700" />

              {/* Nút Gộp câu */}
              <button
                onClick={handleMergeSelected}
                disabled={selectedQuestionIds.length < 2}
                title={selectedQuestionIds.length < 2 ? "Chọn ít nhất 2 câu để gộp thành 1 câu tự luận" : "Gộp các câu đã chọn thành 1 câu tự luận tổng hợp có nhiều ý a, b, c..."}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>Gộp thành 1 câu tự luận</span>
              </button>

              {/* Nút Xóa các câu đã chọn */}
              <button
                onClick={handleBatchDelete}
                title="Xóa các câu hỏi đã chọn"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa ({selectedQuestionIds.length})</span>
              </button>

              <div className="h-4 w-px bg-slate-700" />

              {/* Nút Hủy chọn */}
              <button
                onClick={() => setSelectedQuestionIds([])}
                title="Hủy chọn tất cả"
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </section>

        {/* CỘT PHẢI: KHUNG XEM TRƯỚC BẢN IN A4 (6 Cột trên màn hình lớn) */}
        <section
          className={`a4-preview-section lg:col-span-6 sticky top-20 h-[calc(100vh-6rem)] ${
            mobileTab === 'editor' ? 'hidden lg:block' : 'block'
          } print:!block print:!static print:!h-auto print:!w-full print:!overflow-visible`}
        >
          <A4Preview exam={exam} />
        </section>
      </main>

      {/* Các Modals */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        apiKey={apiKey}
        onSaveKey={handleSaveApiKey}
      />

      <GenerateModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        onExamGenerated={(newExam) => setExam(newExam)}
        apiKey={apiKey}
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
        onImportQuestions={handleImportQuestions}
        apiKey={apiKey}
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
        onInsertQuestion={handleInsertFromBank}
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
}
