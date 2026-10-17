'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Question, Subject, QuestionType, DifficultyLevel } from '@/types/exam';
import { dbGetAllQuestionsFromBank, dbDeleteQuestionFromBank, dbSaveQuestionToBank } from '@/lib/db';
import { getAllSupportedSubjects } from '@/lib/subject-config';
import { MathRenderer } from './MathRenderer';
import { VariationTable } from './VariationTable';
import { FunctionPlot } from './FunctionPlot';
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
  isOpen: boolean;
  onClose: () => void;
  onInsertQuestion: (question: Question) => void;
}

export const QuestionBankModal: React.FC<QuestionBankModalProps> = ({
  isOpen,
  onClose,
  onInsertQuestion,
}) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [insertedIds, setInsertedIds] = useState<Set<string>>(new Set());
  const [bankTab, setBankTab] = useState<'personal' | 'shared'>('personal');
  const [sharedQuestions, setSharedQuestions] = useState<any[]>([]);
  const [loadingShared, setLoadingShared] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Nạp danh sách câu hỏi cá nhân từ IndexedDB
  const loadBankQuestions = async () => {
    setLoading(true);
    try {
      const allQ = await dbGetAllQuestionsFromBank();
      setQuestions(allQ);
    } catch (err) {
      console.error('Lỗi khi nạp ngân hàng câu hỏi:', err);
    } finally {
      setLoading(false);
    }
  };

  // Nạp danh sách câu hỏi dùng chung nội bộ từ PostgreSQL server
  const loadSharedQuestions = async () => {
    setLoadingShared(true);
    try {
      const res = await fetch('/api/questions/shared');
      if (res.ok) {
        const data = await res.json();
        setSharedQuestions(data.questions || []);
      }
    } catch (e) {
      console.error('Lỗi khi nạp ngân hàng dùng chung:', e);
    } finally {
      setLoadingShared(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (bankTab === 'personal') {
        loadBankQuestions();
      } else {
        loadSharedQuestions();
      }
    }
  }, [isOpen, bankTab]);

  // Nhân bản câu hỏi dùng chung về kho cá nhân
  const handleForkQuestion = async (q: any) => {
    try {
      const res = await fetch(`/api/questions/${q.id}/fork`, { method: 'POST' });
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
      await dbDeleteQuestionFromBank(id);
      setQuestions(prev => prev.filter(q => q.id !== id));
    } catch (err) {
      console.error('Lỗi khi xóa câu hỏi:', err);
    }
  };

  // Thêm vào đề thi hiện tại
  const handleInsert = (q: Question) => {
    onInsertQuestion(q);
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
      await dbSaveQuestionToBank(q);
    }
    await loadBankQuestions();
  };

  // Lọc danh sách câu hỏi theo tab đang chọn (Cá nhân hoặc Dùng chung nội bộ)
  const targetList = bankTab === 'personal' ? questions : sharedQuestions;

  const filteredQuestions = useMemo(() => {
    return targetList.filter((q: any) => {
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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header Modal */}
        <div className="px-6 py-4 bg-linear-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/80 border border-indigo-400/40 flex items-center justify-center text-white shadow-md">
              <BookMarked className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg text-white">Ngân hàng Câu hỏi Nguyên tử (Atomic Question Bank)</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/30 border border-indigo-400/30 text-indigo-200">
                  {questions.length} câu đã lưu
                </span>
              </div>
              <p className="text-xs text-slate-300">Kho câu hỏi độc lập lưu an toàn trên máy (IndexedDB). Tái sử dụng và chèn vào đề thi tức thì.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {questions.length === 0 && (
              <button
                onClick={handleSeedSampleQuestions}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white transition-colors shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Nạp 4 câu mẫu chuẩn</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Thông báo Toast */}
        {toastMessage && (
          <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-semibold flex items-center gap-2 shrink-0 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Tab Switcher: Ngân hàng của tôi vs Ngân hàng dùng chung nội bộ */}
        <div className="bg-slate-100 px-5 py-2 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBankTab('personal')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                bankTab === 'personal'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <BookMarked className="w-3.5 h-3.5" />
              <span>Ngân hàng của tôi ({questions.length})</span>
            </button>

            <button
              onClick={() => setBankTab('shared')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                bankTab === 'shared'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-indigo-600" />
              <span>Ngân hàng dùng chung nội bộ ({sharedQuestions.length})</span>
            </button>
          </div>
        </div>

        {/* Thanh tìm kiếm & Bộ lọc nâng cao */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 shrink-0 space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative grow w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm nội dung, công thức LaTeX, chủ đề kiến thức, từ khóa tag..."
                className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
            <div className="text-xs text-slate-500 font-semibold shrink-0">
              Khớp <span className="text-indigo-600 font-bold">{filteredQuestions.length}</span> / {questions.length} câu
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {/* Lọc Môn học */}
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500"
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
              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500"
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
              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500"
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
              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500"
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
        <div className="grow overflow-y-auto p-4 space-y-3 bg-slate-100/70">
          {loading ? (
            <div className="py-20 text-center text-slate-400">Đang nạp ngân hàng câu hỏi...</div>
          ) : filteredQuestions.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center mx-auto shadow-xs">
                <BookMarked className="w-7 h-7" />
              </div>
              <div className="text-slate-600 font-bold text-sm">Chưa có câu hỏi nào phù hợp với bộ lọc</div>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Để lưu câu hỏi vào ngân hàng, hãy bấm biểu tượng Bookmark trên từng thẻ câu hỏi khi đang soạn đề.
              </p>
              {questions.length === 0 && (
                <button
                  onClick={handleSeedSampleQuestions}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
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
                <div key={q.id} className="bg-white rounded-xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-all overflow-hidden">
                  {/* Top Bar của câu hỏi */}
                  <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-indigo-600 text-white font-bold text-[11px] flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <span className="font-bold text-slate-800 uppercase text-[11px]">
                        {q.subject ? q.subject.toUpperCase() : 'TOÁN'} {q.grade ? `LỚP ${q.grade}` : ''}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200 text-slate-700">
                        {q.type === 'multiple_choice' ? 'Trắc nghiệm' : q.type === 'true_false_group' ? 'Đúng/Sai' : q.type === 'short_answer' ? 'Trả lời ngắn' : 'Tự luận'}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        q.difficulty === 'nhan_biet' ? 'bg-emerald-100 text-emerald-800' :
                        q.difficulty === 'thong_hieu' ? 'bg-blue-100 text-blue-800' :
                        q.difficulty === 'van_dung' ? 'bg-amber-100 text-amber-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {q.difficulty === 'nhan_biet' ? 'Nhận biết' : q.difficulty === 'thong_hieu' ? 'Thông hiểu' : q.difficulty === 'van_dung' ? 'Vận dụng' : 'Vận dụng cao'}
                      </span>
                      {q.status === 'verified' && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <ShieldCheck className="w-3 h-3" /> Đã kiểm định
                        </span>
                      )}

                      {bankTab === 'shared' && q.author?.name && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>Tác giả: {q.author.name}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {bankTab === 'shared' && (
                        <button
                          onClick={() => handleForkQuestion(q)}
                          title="Nhân bản câu hỏi này về ngân hàng cá nhân của bạn"
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors cursor-pointer"
                        >
                          <GitFork className="w-3.5 h-3.5" />
                          <span>Nhân bản</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleInsert(q)}
                        className={`flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-lg transition-all shadow-xs cursor-pointer ${
                          isInserted
                            ? 'bg-emerald-600 text-white'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                      >
                        {isInserted ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                        <span>{isInserted ? 'Đã thêm vào đề!' : 'Thêm vào đề'}</span>
                      </button>

                      {bankTab === 'personal' && (
                        <button
                          onClick={() => handleDelete(q.id)}
                          title="Xóa khỏi ngân hàng"
                          className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Body câu hỏi */}
                  <div className="p-4 space-y-3">
                    <div className="text-sm text-slate-900 leading-relaxed font-serif">
                      <MathRenderer content={q.content} />
                    </div>

                    {/* Figures nếu có */}
                    {q.figures && q.figures.length > 0 && (
                      <div className="my-2 space-y-2">
                        {q.figures.map((fig: any) => {
                          if (fig.kind === 'variation_table') return <VariationTable key={fig.id} data={fig.data as any} />;
                          if (fig.kind === 'function_plot') return <FunctionPlot key={fig.id} data={fig.data as any} />;
                          if (fig.kind === 'image') {
                            const src = (fig.data as any)?.url || fig.renderedBase64 || (typeof fig.data === 'string' ? fig.data : '');
                            if (src) {
                              return (
                                <div key={fig.id} className="py-1">
                                  <img
                                    src={src}
                                    alt={fig.caption || ''}
                                    className="max-h-40 max-w-full rounded border border-slate-200 object-contain"
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
                        {q.choices.map((c: any) => {
                          const isCorrect = c.key === q.correct_answer;
                          return (
                            <div
                              key={c.key}
                              className={`p-2 rounded-lg border flex items-baseline gap-2 ${
                                isCorrect
                                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-medium'
                                  : 'bg-slate-50/60 border-slate-200 text-slate-800'
                              }`}
                            >
                              <span className={`w-4 h-4 rounded font-bold text-[10px] flex items-center justify-center shrink-0 ${
                                isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                              }`}>
                                {c.key}
                              </span>
                              <div className="grow">
                                <MathRenderer content={c.text} inline />
                              </div>
                              {isCorrect && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 self-center ml-auto" />}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Sub questions Đúng/Sai */}
                    {q.sub_questions && q.sub_questions.length > 0 && (
                      <div className="space-y-1 pt-1 text-xs">
                        {q.sub_questions.map((sub: any) => (
                          <div key={sub.key} className="flex items-baseline justify-between p-1.5 rounded-lg bg-slate-50 border border-slate-200">
                            <div className="flex items-baseline gap-2 grow pr-2">
                              <span className="font-bold">{sub.key})</span>
                              <MathRenderer content={sub.content} inline />
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                              sub.isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {sub.isCorrect ? 'ĐÚNG' : 'SAI'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Short Answer */}
                    {q.type === 'short_answer' && (
                      <div className="p-2 bg-teal-50/70 border border-teal-200 rounded-lg text-xs flex items-center gap-2">
                        <span className="font-bold text-teal-900">Đáp án:</span>
                        <span className="font-mono font-bold text-teal-800 bg-white px-2 py-0.5 rounded border border-teal-300">
                          {q.correct_answer}
                        </span>
                      </div>
                    )}

                    {/* Solution */}
                    {q.step_by_step_solution && (
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 font-serif leading-relaxed">
                        <span className="font-bold font-sans text-slate-900 block text-[11px] mb-0.5">Lời giải:</span>
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
