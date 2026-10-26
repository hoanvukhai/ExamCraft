'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { accountFetch } from '@/lib/account-fetch';
import { Question, Subject, QuestionType, DifficultyLevel, Passage } from '@/types/exam';
import { dbGetAllQuestionsFromBank, dbDeleteQuestionFromBank, dbSaveQuestionToBank } from '@/lib/db';
import { bankPassage, type BankQuestion } from '@/lib/question-client';
import { getAllSupportedSubjects } from '@/lib/subject-config';
import { MathRenderer } from './MathRenderer';
import { VariationTable, type VariationTableData } from './VariationTable';
import { FunctionPlot, type FunctionPlotData } from './FunctionPlot';
import { 
  X, 
  Search, 
  Filter, 
  Plus, 
  Trash2, 
  BookMarked, 
  Check, 
  ShieldCheck, 
  CheckCircle2,
  Sparkles,
  Layers,
  FolderDown,
  Users,
  GitFork,
  Globe
} from 'lucide-react';

interface QuestionBankModalProps {
  ownerId: string;
  isOpen: boolean;
  onClose: () => void;
  onInsertQuestion: (question: BankQuestion, passage?: Passage) => void;
  allowInsert?: boolean;
}

export const QuestionBankModal: React.FC<QuestionBankModalProps> = props => <QuestionBankContent key={`${props.ownerId}:${props.isOpen}`} {...props} />;
const QuestionBankContent: React.FC<QuestionBankModalProps> = ({
  ownerId,
  isOpen,
  onClose,
  onInsertQuestion,
  allowInsert = true,
}) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [insertedIds, setInsertedIds] = useState<Set<string>>(new Set());
  const [bankTab, setBankTab] = useState<'personal' | 'shared'>('personal');
  const [sharedQuestions, setSharedQuestions] = useState<(BankQuestion & { solution?: string; author?: { id: string; name: string } })[]>([]);
  const [loadingShared, setLoadingShared] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Nạp danh sách câu hỏi cá nhân từ IndexedDB
  const readBankQuestions = (isLive = () => true) => dbGetAllQuestionsFromBank(ownerId).then(allQ => { if (isLive()) setQuestions(allQ); }).catch(err => {
    console.error('Lỗi khi nạp ngân hàng câu hỏi:', err);
  }).finally(() => { if (isLive()) setLoading(false); });
  const loadBankQuestions = () => { setLoading(true); return readBankQuestions(); };

  // Nạp danh sách câu hỏi dùng chung nội bộ từ PostgreSQL server
  const readSharedQuestions = (isLive = () => true) => accountFetch(ownerId, '/api/questions/shared').then(async res => {
    if (res.ok) { const data = await res.json(); if (isLive()) setSharedQuestions(data.questions || []); }
  }).catch(error => { console.error('Lỗi khi nạp ngân hàng dùng chung:', error); }).finally(() => { if (isLive()) setLoadingShared(false); });

  useEffect(() => {
    let live = true;
    if (isOpen) { if (bankTab === 'personal') void readBankQuestions(() => live); else void readSharedQuestions(() => live); }
    return () => { live = false; };
  }, [isOpen, bankTab, ownerId]);

  const changeTab = (tab: 'personal' | 'shared') => {
    if (tab === bankTab) return;
    if (tab === 'personal') setLoading(true); else setLoadingShared(true);
    setBankTab(tab);
  };
  const changeReplication = async (q: Question) => {
    const response = await accountFetch(ownerId, `/api/questions/${encodeURIComponent(q.id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ baseVersion: q.version, shareable: (q as BankQuestion).shareable === false, revisionNote: 'Giáo viên đổi quyền nhân bản nguồn' }) });
    if (!response.ok) { showToast('Chưa đổi được quyền nhân bản. Hãy tải lại ngân hàng và thử lại.'); return; }
    await loadBankQuestions();
  };

  // Nhân bản câu hỏi dùng chung về kho cá nhân
  const handleForkQuestion = async (q: { id: string }) => {
    try {
      const res = await accountFetch(ownerId, `/api/questions/${q.id}/fork`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Không thể nhân bản câu hỏi');
        return;
      }
      showToast('Đã nhân bản câu hỏi thành công vào kho của bạn!');
      loadBankQuestions();
    } catch {
      showToast('Lỗi kết nối máy chủ');
    }
  };

  // Xóa câu hỏi khỏi ngân hàng
  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa câu hỏi này khỏi Ngân hàng cá nhân?')) return;
    try {
      await dbDeleteQuestionFromBank(id, ownerId);
      setQuestions(prev => prev.filter(q => q.id !== id));
    } catch (err) {
      console.error('Lỗi khi xóa câu hỏi:', err);
    }
  };

  // Thêm vào đề thi hiện tại
  const handleInsert = (q: Question) => {
    if (!allowInsert) return;
    const passage = bankPassage((q as BankQuestion).passage);
    if ((q as BankQuestion).passageUnavailable || (q.passageId && !passage)) { showToast('Câu này chưa có ngữ liệu được phép dùng. Hãy bổ sung ngữ liệu trước khi chèn.'); return; }
    onInsertQuestion(q, passage);
    setInsertedIds(prev => new Set(prev).add(q.id));
    setTimeout(() => {
      setInsertedIds(prev => {
        const next = new Set(prev);
        next.delete(q.id);
        return next;
      });
    }, 2000);
  };

  // Nạp dữ liệu mẫu ban đầu nếu ngân hàng trống
  const handleSeedSampleQuestions = async () => {
    const sampleQuestions: Question[] = [
      {
        id: `bank_sample_1_${Date.now()}`,
        subject: 'toan',
        grade: 12,
        type: 'multiple_choice',
        difficulty: 'nhan_biet',
        content: 'Cho hàm số $y = x^4 - 2x^2 + 3$. Số điểm cực trị của hàm số đã cho là:',
        choices: [
          { key: 'A', text: '$3$' },
          { key: 'B', text: '$1$' },
          { key: 'C', text: '$2$' },
          { key: 'D', text: '$0$' },
        ],
        correct_answer: 'A',
        step_by_step_solution: 'Ta có $y\' = 4x^3 - 4x = 4x(x^2 - 1) = 0 \\Leftrightarrow x = 0$ hoặc $x = \\pm 1$. Vì đạo hàm bậc 3 có 3 nghiệm đơn phân biệt nên hàm số có 3 điểm cực trị.',
        status: 'verified',
        aiGenerated: false,
        version: 1,
        topics: ['Cực trị hàm số'],
        tags: ['Ham_trung_phuong', 'Cuc_tri'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `bank_sample_2_${Date.now()}`,
        subject: 'toan',
        grade: 12,
        type: 'true_false_group',
        difficulty: 'thong_hieu',
        content: 'Trong không gian với hệ tọa độ $Oxyz$, cho mặt cầu $(S): (x-1)^2 + (y+2)^2 + (z-3)^2 = 16$ và mặt phẳng $(P): 2x - 2y + z + 5 = 0$. Xét tính đúng/sai của các khẳng định sau:',
        sub_questions: [
          { key: 'a', content: 'Tâm của mặt cầu $(S)$ là $I(1; -2; 3)$.', isCorrect: true, explanation: 'Phương trình dạng $(x-a)^2 + (y-b)^2 + (z-c)^2 = R^2 \\Rightarrow I(1; -2; 3)$.' },
          { key: 'b', content: 'Bán kính của mặt cầu $(S)$ bằng $16$.', isCorrect: false, explanation: '$R^2 = 16 \\Rightarrow R = 4$.' },
          { key: 'c', content: 'Khoảng cách từ tâm $I$ đến mặt phẳng $(P)$ bằng $4$.', isCorrect: false, explanation: '$d(I, (P)) = \\frac{|2(1) - 2(-2) + 3 + 5|}{\\sqrt{2^2 + (-2)^2 + 1^2}} = \\frac{14}{3} \\neq 4$.' },
          { key: 'd', content: 'Mặt phẳng $(P)$ không cắt mặt cầu $(S)$.', isCorrect: true, explanation: 'Vì $d(I, (P)) = \\frac{14}{3} > R = 4$ nên $(P)$ và $(S)$ không có điểm chung.' },
        ],
        correct_answer: 'a:Đ, b:S, c:S, d:Đ',
        step_by_step_solution: 'Xác định tọa độ tâm $I(1; -2; 3)$ và bán kính $R = 4$. Tính khoảng cách $d(I, (P))$ và so sánh với bán kính $R$.',
        status: 'verified',
        aiGenerated: false,
        version: 1,
        topics: ['Hình học không gian Oxyz'],
        tags: ['Oxyz', 'Mat_cau', 'Mat_phang'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `bank_sample_3_${Date.now()}`,
        subject: 'vat_ly',
        grade: 12,
        type: 'short_answer',
        difficulty: 'van_dung',
        content: 'Một con lắc lò xo có độ cứng $k = 100\\text{ N/m}$ dao động điều hòa theo phương ngang. Khi vật có li độ $x = 3\\text{ cm}$ thì động năng của nó bằng $0,08\\text{ J}$. Cơ năng của con lắc bằng bao nhiêu Jun?',
        correct_answer: '0.125',
        accepted_answers: ['0.125', '0,125', '1/8'],
        step_by_step_solution: 'Thế năng của con lắc tại $x = 3\\text{ cm} = 0,03\\text{ m}$ là: $W_t = \\frac{1}{2} k x^2 = \\frac{1}{2} \\cdot 100 \\cdot (0,03)^2 = 0,045\\text{ J}$.\nCơ năng của con lắc là: $W = W_đ + W_t = 0,08 + 0,045 = 0,125\\text{ J}$.',
        status: 'verified',
        aiGenerated: false,
        version: 1,
        topics: ['Dao động cơ học'],
        tags: ['Con_lac_lo_xo', 'Co_nang'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `bank_sample_4_${Date.now()}`,
        subject: 'hoa_hoc',
        grade: 12,
        type: 'multiple_choice',
        difficulty: 'thong_hieu',
        content: 'Chất nào sau đây thuộc loại este no, đơn chức, mạch hở?',
        choices: [
          { key: 'A', text: '$\\text{CH}_3\\text{COOCH}_3$' },
          { key: 'B', text: '$\\text{CH}_2=\\text{CH}-\\text{COOCH}_3$' },
          { key: 'C', text: '$\\text{HCOOC}_6\\text{H}_5$' },
          { key: 'D', text: '(\\text{CH}_3\\text{COO})_2\\text{C}_2\\text{H}_4' },
        ],
        correct_answer: 'A',
        step_by_step_solution: 'Este no, đơn chức, mạch hở có công thức chung là $\\text{C}_n\\text{H}_{2n}\\text{O}_2$ ($n \\ge 2$). Methyl acetate $\\text{CH}_3\\text{COOCH}_3$ có công thức phân tử $\\text{C}_3\\text{H}_6\\text{O}_2$ thỏa mãn.',
        status: 'verified',
        aiGenerated: false,
        version: 1,
        topics: ['Este - Lipit'],
        tags: ['Este_no'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    for (const q of sampleQuestions) {
      await dbSaveQuestionToBank(q, ownerId);
    }
    await loadBankQuestions();
  };

  // Lọc danh sách câu hỏi theo tab đang chọn (Cá nhân hoặc Dùng chung nội bộ)
  const targetList: (BankQuestion & { solution?: string; author?: { id: string; name: string } })[] = bankTab === 'personal' ? questions : sharedQuestions;

  const filteredQuestions = useMemo(() => {
    return targetList.filter((q) => {
      // 1. Lọc theo từ khóa
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const contentMatch = (q.content || '').toLowerCase().includes(query);
        const solutionMatch = (q.solution || q.step_by_step_solution || '').toLowerCase().includes(query);
        const tagMatch = (q.tags || []).some((t: string) => t.toLowerCase().includes(query));
        const topicMatch = (q.topics || []).some((t: string) => t.toLowerCase().includes(query));
        if (!contentMatch && !solutionMatch && !tagMatch && !topicMatch) return false;
      }

      // 2. Lọc theo môn
      if (selectedSubject !== 'all' && q.subject !== selectedSubject) return false;

      // 3. Lọc theo khối lớp
      if (selectedGrade !== 'all' && q.grade !== Number(selectedGrade)) return false;

      // 4. Lọc theo loại câu hỏi
      if (selectedType !== 'all' && q.type?.toLowerCase() !== selectedType.toLowerCase()) return false;

      // 5. Lọc theo độ khó
      if (selectedDifficulty !== 'all' && q.difficulty?.toLowerCase() !== selectedDifficulty.toLowerCase()) return false;

      return true;
    });
  }, [targetList, searchQuery, selectedSubject, selectedGrade, selectedType, selectedDifficulty]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-[#1e1e1e] rounded-3xl shadow-2xl border border-[#dadce0] dark:border-[#3c4043] w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden text-[#202124] dark:text-[#e3e3e3] animate-in fade-in zoom-in-95 duration-150">
        {/* Header Modal */}
        <div className="px-6 py-4 bg-white dark:bg-[#1e1e1e] border-b border-[#dadce0] dark:border-[#3c4043] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#e8f0fe] dark:bg-[#1e2a38] text-[#1a73e8] dark:text-[#8ab4f8] border border-[#d2e3fc] dark:border-[#29425e] flex items-center justify-center shadow-xs">
              <BookMarked className="w-5 h-5 text-[#1a73e8] dark:text-[#8ab4f8]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-[#202124] dark:text-[#e3e3e3]">Ngân hàng Câu hỏi Nguyên tử (Atomic Question Bank)</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#e8f0fe] dark:bg-[#1e2a38] border border-[#d2e3fc] dark:border-[#29425e] text-[#1a73e8] dark:text-[#8ab4f8]">
                  {questions.length} câu đã lưu
                </span>
              </div>
              <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">Kho câu hỏi độc lập lưu an toàn trên máy (IndexedDB). Tái sử dụng và chèn vào đề thi tức thì.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {questions.length === 0 && (
              <button
                onClick={handleSeedSampleQuestions}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full app-button-primary text-xs font-medium text-white transition-colors shadow-xs cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Nạp 4 câu mẫu chuẩn</span>
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Đóng ngân hàng câu hỏi"
              className="p-1.5 text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124] dark:hover:text-[#e3e3e3] rounded-full hover:bg-[#f1f3f4] dark:hover:bg-[#282828] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Thông báo Toast */}
        {toastMessage && (
          <div className="bg-[#e6f4ea] dark:bg-[#0f291e] text-[#137333] dark:text-[#5bb98c] border-b border-[#ceead6] dark:border-[#1d4834] px-4 py-2 text-xs font-semibold flex items-center gap-2 shrink-0 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Tab Switcher: Ngân hàng của tôi vs Ngân hàng dùng chung nội bộ */}
        <div className="bg-[#f8f9fa] dark:bg-[#181818] px-5 py-2.5 border-b border-[#dadce0] dark:border-[#3c4043] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => changeTab('personal')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                bankTab === 'personal'
                  ? 'bg-white dark:bg-[#282828] text-[#1a73e8] dark:text-[#8ab4f8] shadow-xs border border-[#dadce0] dark:border-[#3c4043]'
                  : 'text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124] dark:hover:text-[#e3e3e3] hover:bg-[#f1f3f4] dark:hover:bg-[#282828]'
              }`}
            >
              <BookMarked className="w-3.5 h-3.5" />
              <span>Ngân hàng của tôi ({questions.length})</span>
            </button>

            <button
              onClick={() => changeTab('shared')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                bankTab === 'shared'
                  ? 'bg-white dark:bg-[#282828] text-[#1a73e8] dark:text-[#8ab4f8] shadow-xs border border-[#dadce0] dark:border-[#3c4043]'
                  : 'text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124] dark:hover:text-[#e3e3e3] hover:bg-[#f1f3f4] dark:hover:bg-[#282828]'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Ngân hàng dùng chung nội bộ ({sharedQuestions.length})</span>
            </button>
          </div>
        </div>

        {/* Thanh tìm kiếm & Bộ lọc nâng cao */}
        <div className="p-4 bg-[#f8f9fa] dark:bg-[#181818] border-b border-[#dadce0] dark:border-[#3c4043] shrink-0 space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative grow w-full">
              <Search className="w-4 h-4 text-[#5f6368] dark:text-[#9aa0a6] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm nội dung, công thức LaTeX, chủ đề kiến thức, từ khóa tag..."
                className="w-full text-xs pl-9 pr-3 py-2 bg-white dark:bg-[#282828] text-[#202124] dark:text-[#e3e3e3] border border-[#dadce0] dark:border-[#3c4043] rounded-full focus:border-[#1a73e8] dark:focus:border-[#8ab4f8] focus:ring-1 focus:ring-[#1a73e8] dark:focus:ring-[#8ab4f8] focus:outline-hidden"
              />
            </div>
            <div className="text-xs text-[#5f6368] dark:text-[#9aa0a6] font-medium shrink-0">
              Khớp <span className="text-[#1a73e8] dark:text-[#8ab4f8] font-bold">{filteredQuestions.length}</span> / {questions.length} câu
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {/* Lọc Môn học */}
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-3 py-1.5 bg-white dark:bg-[#282828] border border-[#dadce0] dark:border-[#3c4043] rounded-full text-[#202124] dark:text-[#e3e3e3] font-medium focus:border-[#1a73e8] dark:focus:border-[#8ab4f8] outline-hidden cursor-pointer"
            >
              <option value="all">Tất cả môn học</option>
              {getAllSupportedSubjects().map((sub) => (
                <option key={sub.key} value={sub.key}>
                  {sub.label}
                </option>
              ))}
            </select>

            {/* Lọc Khối lớp */}
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="px-3 py-1.5 bg-white dark:bg-[#282828] border border-[#dadce0] dark:border-[#3c4043] rounded-full text-[#202124] dark:text-[#e3e3e3] font-medium focus:border-[#1a73e8] dark:focus:border-[#8ab4f8] outline-hidden cursor-pointer"
            >
              <option value="all">Tất cả các lớp</option>
              {[12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((g) => (
                <option key={g} value={g}>Lớp {g}</option>
              ))}
            </select>

            {/* Lọc Dạng câu hỏi */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-1.5 bg-white dark:bg-[#282828] border border-[#dadce0] dark:border-[#3c4043] rounded-full text-[#202124] dark:text-[#e3e3e3] font-medium focus:border-[#1a73e8] dark:focus:border-[#8ab4f8] outline-hidden cursor-pointer"
            >
              <option value="all">Tất cả dạng câu</option>
              <option value="multiple_choice">Trắc nghiệm 4 lựa chọn</option>
              <option value="true_false_group">Trắc nghiệm Đúng / Sai</option>
              <option value="short_answer">Trả lời ngắn / Điền số</option>
              <option value="essay">Tự luận / Tự viết</option>
            </select>

            {/* Lọc Độ khó */}
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-3 py-1.5 bg-white dark:bg-[#282828] border border-[#dadce0] dark:border-[#3c4043] rounded-full text-[#202124] dark:text-[#e3e3e3] font-medium focus:border-[#1a73e8] dark:focus:border-[#8ab4f8] outline-hidden cursor-pointer"
            >
              <option value="all">Tất cả mức độ</option>
              <option value="nhan_biet">Nhận biết</option>
              <option value="thong_hieu">Thông hiểu</option>
              <option value="van_dung">Vận dụng</option>
              <option value="van_dung_cao">Vận dụng cao</option>
            </select>
          </div>
        </div>

        {/* Nội dung danh sách câu hỏi */}
        <div className="grow overflow-y-auto p-4 space-y-3 bg-[#f8f9fa] dark:bg-[#181818]">
          {loading ? (
            <div className="py-20 text-center text-[#5f6368] dark:text-[#9aa0a6]">Đang nạp ngân hàng câu hỏi...</div>
          ) : filteredQuestions.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-white dark:bg-[#282828] border border-[#dadce0] dark:border-[#3c4043] text-[#5f6368] dark:text-[#9aa0a6] flex items-center justify-center mx-auto shadow-xs">
                <BookMarked className="w-7 h-7" />
              </div>
              <div className="text-[#202124] dark:text-[#e3e3e3] font-bold text-sm">Chưa có câu hỏi nào phù hợp với bộ lọc</div>
              <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] max-w-md mx-auto">
                Để lưu câu hỏi vào ngân hàng, hãy bấm biểu tượng Bookmark trên từng thẻ câu hỏi khi đang soạn đề.
              </p>
              {questions.length === 0 && (
                <button
                  onClick={handleSeedSampleQuestions}
                  className="inline-flex items-center gap-1.5 px-4 py-2 app-button-primary text-white text-xs font-medium rounded-full shadow-xs transition-colors cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Nạp 4 câu hỏi mẫu chuẩn vào ngân hàng</span>
                </button>
              )}
            </div>
          ) : (
            filteredQuestions.map((q, idx) => {
              const isInserted = insertedIds.has(q.id);

              return (
                <div key={q.id} className="bg-white dark:bg-[#282828] rounded-2xl border border-[#dadce0] dark:border-[#3c4043] shadow-xs hover:border-[#1a73e8] dark:hover:border-[#8ab4f8] transition-all overflow-hidden">
                  {/* Top Bar của câu hỏi */}
                  <div className="bg-[#f8f9fa] dark:bg-[#1e1e1e] px-4 py-2 border-b border-[#dadce0] dark:border-[#3c4043] flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#1a73e8] text-white font-bold text-[11px] flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <span className="font-bold text-[#202124] dark:text-[#e3e3e3] uppercase text-[11px]">
                        {q.subject ? q.subject.toUpperCase() : 'TOÁN'} {q.grade ? `LỚP ${q.grade}` : ''}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#f1f3f4] dark:bg-[#303134] text-[#5f6368] dark:text-[#9aa0a6] border border-[#dadce0] dark:border-[#3c4043]">
                        {q.type === 'multiple_choice' ? 'Trắc nghiệm' : q.type === 'true_false_group' ? 'Đúng/Sai' : q.type === 'short_answer' ? 'Trả lời ngắn' : 'Tự luận'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        q.difficulty === 'nhan_biet' ? 'bg-[#e6f4ea] dark:bg-[#0f291e] text-[#137333] dark:text-[#5bb98c] border border-[#ceead6] dark:border-[#1d4834]' :
                        q.difficulty === 'thong_hieu' ? 'bg-[#e8f0fe] dark:bg-[#1e2a38] text-[#1a73e8] dark:text-[#8ab4f8] border border-[#d2e3fc] dark:border-[#29425e]' :
                        q.difficulty === 'van_dung' ? 'bg-[#fef7e0] dark:bg-[#33250b] text-[#b06000] dark:text-[#fdd663] border border-[#feefc3] dark:border-[#5e410f]' :
                        'bg-[#f3e8fd] dark:bg-[#2b193d] text-[#9333ea] dark:text-[#d8b4fe] border border-[#e9d5ff] dark:border-[#4c1d95]'
                      }`}>
                        {q.difficulty === 'nhan_biet' ? 'Nhận biết' : q.difficulty === 'thong_hieu' ? 'Thông hiểu' : q.difficulty === 'van_dung' ? 'Vận dụng' : 'Vận dụng cao'}
                      </span>
                      {q.status === 'verified' && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-[#137333] dark:text-[#5bb98c] bg-[#e6f4ea] dark:bg-[#0f291e] px-2 py-0.5 rounded-full border border-[#ceead6] dark:border-[#1d4834]">
                          <ShieldCheck className="w-3 h-3" /> Đã kiểm định
                        </span>
                      )}

                      {bankTab === 'shared' && q.author?.name && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#e8f0fe] dark:bg-[#1e2a38] text-[#1a73e8] dark:text-[#8ab4f8] border border-[#d2e3fc] dark:border-[#29425e] flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>Tác giả: {q.author.name}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {bankTab === 'personal' && q.importedFromFile && <button type="button" onClick={() => void changeReplication(q).catch(() => showToast('Chưa kết nối được để đổi quyền nhân bản.'))}>{(q as BankQuestion).shareable === false ? 'Cho phép nhân bản' : 'Ngừng cho nhân bản'}</button>}
                      {bankTab === 'shared' && (
                        <button
                          onClick={() => handleForkQuestion(q)}
                          title="Nhân bản câu hỏi này về ngân hàng cá nhân của bạn"
                          className="flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full bg-white dark:bg-[#282828] hover:bg-[#f8f9fa] dark:hover:bg-[#303134] text-[#1a73e8] dark:text-[#8ab4f8] border border-[#dadce0] dark:border-[#3c4043] transition-colors cursor-pointer"
                        >
                          <GitFork className="w-3.5 h-3.5" />
                          <span>Nhân bản</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleInsert(q)}
                        disabled={!allowInsert}
                        title={!allowInsert ? 'Hãy mở một đề rồi chọn ngân hàng câu hỏi để chèn.' : 'Thêm câu này vào đề đang mở'}
                        className={`flex items-center gap-1 px-3.5 py-1 text-xs font-medium rounded-full transition-all shadow-xs cursor-pointer ${
                          isInserted
                            ? 'bg-[#137333] text-white dark:bg-[#5bb98c] dark:text-[#0f291e]'
                            : 'app-button-primary text-white dark:bg-[#8ab4f8] dark:hover:bg-[#a8c7fa] dark:text-[#202124]'
                        }`}
                      >
                        {isInserted ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                        <span>{!allowInsert ? 'Mở đề để chèn' : isInserted ? 'Đã thêm vào đề!' : 'Thêm vào đề'}</span>
                      </button>

                      {bankTab === 'personal' && (
                        <button
                          onClick={() => handleDelete(q.id)}
                          title="Xóa khỏi ngân hàng"
                          className="p-1.5 text-[#5f6368] hover:text-[#c5221f] dark:text-[#9aa0a6] dark:hover:text-[#f28b82] rounded-full hover:bg-[#fce8e6] dark:hover:bg-[#371918] transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Body câu hỏi */}
                  <div className="p-4 space-y-3">
                    <div className="text-sm text-[#202124] dark:text-[#e3e3e3] leading-relaxed font-serif">
                      <MathRenderer content={q.content} />
                    </div>

                    {/* Figures nếu có */}
                    {q.figures && q.figures.length > 0 && (
                      <div className="my-2 space-y-2">
                        {q.figures.map((fig) => {
                          if (fig.kind === 'variation_table') return <VariationTable key={fig.id} data={fig.data as VariationTableData} />;
                          if (fig.kind === 'function_plot') return <FunctionPlot key={fig.id} data={fig.data as FunctionPlotData} />;
                          if (fig.kind === 'image') {
                            const src = (fig.data as { url?: string })?.url || fig.renderedBase64 || (typeof fig.data === 'string' ? fig.data : '');
                            if (src) {
                              return (
                                <div key={fig.id} className="py-1">
                                  <img
                                    src={src}
                                    alt={fig.caption || ''}
                                    className="max-h-40 max-w-full rounded-xl border border-[#dadce0] dark:border-[#3c4043] object-contain bg-white dark:bg-[#1e1e1e]"
                                  />
                                </div>
                              );
                            }
                          }
                          return null;
                        })}
                      </div>
                    )}

                    {/* Choices */}
                    {q.choices && q.choices.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                        {q.choices.map((c) => {
                          const isCorrect = c.key === q.correct_answer;
                          return (
                            <div
                              key={c.key}
                              className={`p-2.5 rounded-xl border flex items-baseline gap-2 ${
                                isCorrect
                                  ? 'bg-[#e6f4ea] dark:bg-[#0f291e] border-[#ceead6] dark:border-[#1d4834] text-[#137333] dark:text-[#5bb98c] font-medium'
                                  : 'bg-[#f8f9fa] dark:bg-[#1e1e1e] border-[#dadce0] dark:border-[#3c4043] text-[#3c4043] dark:text-[#e3e3e3]'
                              }`}
                            >
                              <span className={`w-4 h-4 rounded-full font-bold text-[10px] flex items-center justify-center shrink-0 ${
                                isCorrect ? 'bg-[#137333] text-white dark:bg-[#5bb98c] dark:text-[#0f291e]' : 'bg-[#dadce0] dark:bg-[#3c4043] text-[#3c4043] dark:text-[#e3e3e3]'
                              }`}>
                                {c.key}
                              </span>
                              <div className="grow">
                                <MathRenderer content={c.text} inline />
                              </div>
                              {isCorrect && <CheckCircle2 className="w-3.5 h-3.5 text-[#137333] dark:text-[#5bb98c] shrink-0 self-center ml-auto" />}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Sub questions Đúng/Sai */}
                    {q.sub_questions && q.sub_questions.length > 0 && (
                      <div className="space-y-1.5 pt-1 text-xs">
                        {q.sub_questions.map((sub) => (
                          <div key={sub.key} className="flex items-baseline justify-between p-2 rounded-xl bg-[#f8f9fa] dark:bg-[#1e1e1e] border border-[#dadce0] dark:border-[#3c4043] text-[#3c4043] dark:text-[#e3e3e3]">
                            <div className="flex items-baseline gap-2 grow pr-2">
                              <span className="font-bold text-[#202124] dark:text-[#e3e3e3]">{sub.key})</span>
                              <MathRenderer content={sub.content} inline />
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                              sub.isCorrect ? 'bg-[#e6f4ea] dark:bg-[#0f291e] text-[#137333] dark:text-[#5bb98c] border border-[#ceead6] dark:border-[#1d4834]' : 'bg-[#fce8e6] dark:bg-[#371918] text-[#c5221f] dark:text-[#f28b82] border border-[#fad2cf] dark:border-[#5c2523]'
                            }`}>
                              {sub.isCorrect ? 'ĐÚNG' : 'SAI'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Short Answer */}
                    {q.type === 'short_answer' && (
                      <div className="p-2.5 bg-[#e8f0fe]/60 dark:bg-[#1e2a38]/60 border border-[#d2e3fc] dark:border-[#29425e] rounded-xl text-xs flex items-center gap-2">
                        <span className="font-bold text-[#1a73e8] dark:text-[#8ab4f8]">Đáp án:</span>
                        <span className="font-mono font-bold text-[#1a73e8] dark:text-[#8ab4f8] bg-white dark:bg-[#1e1e1e] px-2.5 py-0.5 rounded border border-[#d2e3fc] dark:border-[#29425e]">
                          {q.correct_answer}
                        </span>
                      </div>
                    )}

                    {/* Solution */}
                    {q.step_by_step_solution && (
                      <div className="p-3 bg-[#f8f9fa] dark:bg-[#1e1e1e] rounded-xl border border-[#dadce0] dark:border-[#3c4043] text-xs text-[#3c4043] dark:text-[#e3e3e3] font-serif leading-relaxed">
                        <span className="font-bold font-sans text-[#1a73e8] dark:text-[#8ab4f8] block text-[11px] mb-1">Lời giải:</span>
                        <MathRenderer content={q.step_by_step_solution} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
