'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Brain,
  Sparkles,
  RefreshCw,
  Plus,
  Trash2,
  Check,
  X,
  AlertCircle,
  Lightbulb,
  Sliders,
  CheckCircle2,
  Bot
} from 'lucide-react';

interface TeacherMemory {
  id: string;
  subject: string;
  category: string;
  title: string;
  insight: string;
  confidence: number;
  isActive: boolean;
  sourceAction: string;
  createdAt: string;
}

interface AiLearningModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: {
    id: string;
    name: string;
  };
}

export const AiLearningModal: React.FC<AiLearningModalProps> = ({ isOpen, onClose }) => {
  const archiveInput = useRef<HTMLInputElement>(null);
  const [archiveBusy, setArchiveBusy] = useState(false);
  const [memories, setMemories] = useState<TeacherMemory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');

  // Form thêm thủ công
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newInsight, setNewInsight] = useState('');
  const [newCategory, setNewCategory] = useState('PEDAGOGICAL_STYLE');
  const [newSubject, setNewSubject] = useState('toan');

  const exportNotes = async () => {
    setArchiveBusy(true);
    try {
      const response = await fetch('/api/teacher/ai-memory/archive');
      if (!response.ok) { const body = await response.json(); throw new Error(body.error); }
      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'examcraft-ghi-chu-rieng.json'; anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatusMessage('Đã xuất ghi chú riêng. Hãy giữ tệp này ở nơi bạn tin cậy.');
    } catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Chưa xuất được ghi chú.'); }
    finally { setArchiveBusy(false); }
  };
  const importNotes = async (file?: File) => {
    if (!file) return;
    setArchiveBusy(true);
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error('Tệp vượt 5 MB; hãy chia nhỏ trước khi nhập.');
      const archive: unknown = JSON.parse(await file.text());
      const send = (dryRun: boolean) => fetch('/api/teacher/ai-memory/archive', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ archive, dryRun, confirmPrivateOwnership: !dryRun }) });
      const previewResponse = await send(true); const preview = await previewResponse.json();
      if (!previewResponse.ok) throw new Error(preview.error);
      if (!confirm(`Nhập ${preview.toImport} ghi chú vào kho riêng? ${preview.duplicates} mục trùng sẽ bỏ qua. Các ghi chú nhập sẽ để tắt để bạn đọc trước khi bật.`)) return;
      const response = await send(false); const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setStatusMessage(`Đã nhập ${result.imported} ghi chú riêng. Chưa bật tự động.`); await loadMemories();
    } catch (error) { setStatusMessage(error instanceof Error ? error.message : 'Chưa nhập được ghi chú.'); }
    finally { setArchiveBusy(false); if (archiveInput.current) archiveInput.current.value = ''; }
  };

  const loadMemories = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/teacher/ai-memory');
      if (res.ok) {
        const data = await res.json();
        setMemories(data.memories || []);
      }
    } catch (err) {
      console.error('Lỗi khi tải tri thức AI:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadMemories();
    }
  }, [isOpen]);

  const handleToggleActive = async (memory: TeacherMemory) => {
    try {
      const res = await fetch('/api/teacher/ai-memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: memory.id,
          isActive: !memory.isActive,
        }),
      });
      if (res.ok) {
        setMemories((prev) =>
          prev.map((m) => (m.id === memory.id ? { ...m, isActive: !m.isActive } : m))
        );
      }
    } catch {
      alert('Không thể cập nhật trạng thái');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Thầy/Cô có chắc chắn muốn xóa quy tắc phong cách này của AI?')) return;
    try {
      const res = await fetch(`/api/teacher/ai-memory?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setMemories((prev) => prev.filter((m) => m.id !== id));
      }
    } catch {
      alert('Không thể xóa quy tắc');
    }
  };

  const handleRunAutoAnalysis = async () => {
    setIsAnalyzing(true);
    setStatusMessage('AI đang quét kho đề thi và các câu hỏi của Thầy/Cô để đúc kết phong cách...');
    try {
      const res = await fetch('/api/teacher/ai-memory/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoScan: true }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(data.message || 'AI đã phân tích và học xong!');
        loadMemories();
        setTimeout(() => setStatusMessage(null), 4000);
      } else {
        alert(data.error || 'Có lỗi xảy ra khi AI phân tích');
        setStatusMessage(null);
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối khi phân tích');
      setStatusMessage(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateManualRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newInsight.trim()) return;

    try {
      const res = await fetch('/api/teacher/ai-memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          insight: newInsight.trim(),
          category: newCategory,
          subject: newSubject,
        }),
      });

      if (res.ok) {
        setNewTitle('');
        setNewInsight('');
        setIsAddingNew(false);
        loadMemories();
      }
    } catch {
      alert('Không thể tạo quy tắc');
    }
  };

  if (!isOpen) return null;

  const filteredMemories =
    activeCategoryFilter === 'all'
      ? memories
      : memories.filter((m) => m.category === activeCategoryFilter);

  const categoryLabels: Record<string, { label: string; color: string }> = {
    PEDAGOGICAL_STYLE: { label: 'Phong cách giảng dạy', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200' },
    TRICK_OR_TRAP: { label: 'Cài bẫy & Sai lầm học sinh', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200' },
    REAL_WORLD_CONTEXT: { label: 'Bối cảnh thực tế', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200' },
    DIFFICULTY_BALANCE: { label: 'Phân bổ độ khó', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200' },
    EXPLANATION_RULE: { label: 'Quy tắc lời giải', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-200' },
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1e1e1e] rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-[#dadce0] dark:border-[#3c4043] relative max-h-[90vh] flex flex-col text-[#202124] dark:text-[#e3e3e3] animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#dadce0] dark:border-[#3c4043] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-[#202124] dark:text-white">
                  Bộ Não AI Sư Phạm & Tự Học
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
                  Adaptive Learning
                </span>
              </div>
              <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">
                AI tự động phân tích và học phong cách ra đề của Thầy/Cô để tự thích ứng khi biên soạn đề mới
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#5f6368] hover:text-[#202124] dark:text-[#9aa0a6] dark:hover:text-white rounded-full hover:bg-black/5 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="py-3 flex flex-wrap items-center justify-between gap-2 border-b border-[#dadce0] dark:border-[#3c4043] shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleRunAutoAnalysis}
              disabled={isAnalyzing}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {isAnalyzing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>{isAnalyzing ? 'Đang phân tích...' : 'AI Phân tích từ kho đề của tôi'}</span>
            </button>

            <button
              onClick={() => setIsAddingNew(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#dadce0] dark:border-[#3c4043] hover:bg-[#f1f3f4] dark:hover:bg-[#282828] text-xs font-medium cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Dạy AI quy tắc mới</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[#5f6368] dark:text-[#9aa0a6]">
            <span>Đã học: </span>
            <strong className="text-purple-600 dark:text-purple-400 font-bold">{memories.length}</strong>
            <span>quy tắc (</span>
            <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
              {memories.filter((m) => m.isActive).length}
            </strong>
            <span>đang bật)</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 py-2 text-xs">
          <button type="button" disabled={archiveBusy} onClick={() => void exportNotes()} className="border rounded px-3 py-2 disabled:opacity-50">Xuất ghi chú riêng</button>
          <button type="button" disabled={archiveBusy} onClick={() => archiveInput.current?.click()} className="border rounded px-3 py-2 disabled:opacity-50">Nhập tệp ghi chú</button>
          <input ref={archiveInput} type="file" accept=".json,application/json" className="hidden" aria-label="Tệp ghi chú riêng" onChange={e => void importNotes(e.target.files?.[0])} />
          <p className="w-full text-gray-500">Ghi chú ở kho riêng. Phân tích mới chỉ tạo đề xuất; bạn đọc rồi bật từng mục muốn áp dụng.</p>
        </div>
        {/* Thông báo trạng thái */}
        {statusMessage && (
          <div className="my-2 p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-200 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-purple-600" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Form thêm thủ công */}
        {isAddingNew && (
          <form
            onSubmit={handleCreateManualRule}
            className="my-3 p-4 rounded-2xl bg-[#f8f9fa] dark:bg-[#282828] border border-purple-300 dark:border-purple-700 space-y-3 shrink-0 animate-in fade-in"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4" />
                <span>Thêm quy tắc sư phạm để AI luôn ghi nhớ</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="p-1 rounded-full text-[#5f6368] hover:bg-black/5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#5f6368] mb-1">
                  Tiêu đề quy tắc ngắn gọn:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Không cho thử ngược nghiệm Casio"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 bg-white dark:bg-[#1e1e1e] border border-[#dadce0] dark:border-[#3c4043] rounded-lg outline-hidden focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#5f6368] mb-1">
                  Nhóm tri thức:
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 bg-white dark:bg-[#1e1e1e] border border-[#dadce0] dark:border-[#3c4043] rounded-lg outline-hidden focus:border-purple-600"
                >
                  <option value="PEDAGOGICAL_STYLE">Phong cách giảng dạy</option>
                  <option value="TRICK_OR_TRAP">Cài bẫy & Sai lầm học sinh</option>
                  <option value="REAL_WORLD_CONTEXT">Bối cảnh thực tế</option>
                  <option value="DIFFICULTY_BALANCE">Phân bổ độ khó</option>
                  <option value="EXPLANATION_RULE">Quy tắc lời giải</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#5f6368] mb-1">
                Chỉ dẫn chi tiết cho AI (AI sẽ áp dụng chính xác chỉ dẫn này khi sinh đề):
              </label>
              <textarea
                required
                rows={2}
                placeholder="Ví dụ: Khi ra câu hỏi phương trình hoặc hàm số, các hệ số phải được tính toán sao cho không thể bấm CALC Casio ra ngay kết quả, bắt buộc học sinh phải biến đổi toán học."
                value={newInsight}
                onChange={(e) => setNewInsight(e.target.value)}
                className="w-full text-xs p-2 bg-white dark:bg-[#1e1e1e] border border-[#dadce0] dark:border-[#3c4043] rounded-lg outline-hidden focus:border-purple-600"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="px-3 py-1.5 text-xs text-[#5f6368] hover:bg-black/5 rounded-lg font-medium cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold shadow-xs cursor-pointer"
              >
                Lưu vào bộ não AI
              </button>
            </div>
          </form>
        )}

        {/* Danh sách các tri thức đã học */}
        <div className="grow overflow-y-auto py-3 space-y-2 pr-1">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-[#5f6368] dark:text-[#9aa0a6] flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-purple-600" />
              <span>Đang tải các tri thức sư phạm của AI...</span>
            </div>
          ) : memories.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center mx-auto">
                <Brain className="w-6 h-6" />
              </div>
              <div className="text-xs font-semibold text-[#202124] dark:text-[#e3e3e3]">
                AI chưa lưu phong cách sư phạm cá nhân nào
              </div>
              <p className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] max-w-sm mx-auto">
                Bấm nút <strong>&quot;AI Phân tích từ kho đề của tôi&quot;</strong> để AI tự động quét các đề thi và câu hỏi Thầy/Cô đã tạo để học phong cách ra đề!
              </p>
            </div>
          ) : (
            filteredMemories.map((m) => {
              const catInfo = categoryLabels[m.category] || {
                label: m.category,
                color: 'bg-gray-100 text-gray-800',
              };

              return (
                <div
                  key={m.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    m.isActive
                      ? 'bg-white dark:bg-[#252525] border-purple-200 dark:border-purple-900/60 shadow-2xs'
                      : 'bg-[#f8f9fa] dark:bg-[#1a1a1a] border-[#dadce0] dark:border-[#3c4043] opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 grow">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${catInfo.color}`}>
                          {catInfo.label}
                        </span>
                        <h4 className="font-bold text-xs text-[#202124] dark:text-white">
                          {m.title}
                        </h4>
                        <span className="text-[10px] text-[#5f6368] dark:text-[#9aa0a6]">
                          Độ tin cậy: {Math.round(m.confidence * 100)}%
                        </span>
                      </div>

                      <p className="text-xs text-[#3c4043] dark:text-[#cccccc] leading-relaxed pt-1">
                        {m.insight}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 pt-0.5">
                      <button
                        onClick={() => handleToggleActive(m)}
                        title={m.isActive ? 'Tạm tắt quy tắc này' : 'Bật quy tắc này'}
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-colors cursor-pointer ${
                          m.isActive
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                        }`}
                      >
                        {m.isActive ? 'Đang áp dụng' : 'Đang tắt'}
                      </button>

                      <button
                        onClick={() => handleDelete(m.id)}
                        title="Xóa quy tắc này"
                        className="p-1 rounded-full text-[#5f6368] hover:text-red-500 hover:bg-black/5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#dadce0] dark:border-[#3c4043] flex items-center justify-between shrink-0">
          <p className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6]">
            Mọi quy tắc đang bật sẽ tự động được gửi kèm cho Gemini mỗi khi Thầy/Cô bấm <strong>Sinh đề AI</strong>.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-full font-semibold shadow-xs cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
