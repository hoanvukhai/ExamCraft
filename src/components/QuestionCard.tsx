'use client';

import React, { useState } from 'react';
import { Question } from '@/types/exam';
import { MathRenderer } from './MathRenderer';
import { VariationTable } from './VariationTable';
import { FunctionPlot } from './FunctionPlot';
import { 
  Sparkles, 
  RefreshCw, 
  ArrowUpRight, 
  ArrowDownRight, 
  Trash2, 
  Edit3, 
  Check, 
  ChevronDown, 
  ChevronUp,
  CheckCircle2,
  XCircle,
  Undo2,
  BookmarkPlus,
  Send,
  SlidersHorizontal,
  X,
  CheckCheck,
  ShieldCheck,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Copy
} from 'lucide-react';
import { getDefaultPointsForQuestion, formatPointsString } from '@/lib/scoring';
import { dbSaveQuestionToBank } from '@/lib/db';

interface QuestionCardProps {
  question: Question;
  index: number;
  onUpdate: (updatedQuestion: Question) => void;
  onDelete: (id: string) => void;
  apiKey?: string;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDuplicate?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  onAskAiAboutQuestion?: (index: number) => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  index,
  onUpdate,
  onDelete,
  apiKey,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  isFirst,
  isLast,
  isSelected,
  onToggleSelect,
  onAskAiAboutQuestion,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);
  const [customPromptText, setCustomPromptText] = useState('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiActionMessage, setAiActionMessage] = useState<string | null>(null);

  // Quản lý Diff Preview & Undo
  const [pendingNewQuestion, setPendingNewQuestion] = useState<Question | null>(null);
  const [undoHistory, setUndoHistory] = useState<Question[]>([]);
  const [bankSavedNotification, setBankSavedNotification] = useState(false);

  // Quản lý Thẩm định AI (Dual-Solve Verifier)
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{
    isMatch: boolean;
    confidence: number;
    solvedAnswer: string;
    solutionSteps: string;
    discrepancies: string[];
    recommendation: string;
  } | null>(null);
  const [showVerifyDetails, setShowVerifyDetails] = useState(false);

  // Edit form state
  const [editContent, setEditContent] = useState(question.content);
  const [editSolution, setEditSolution] = useState(question.step_by_step_solution);
  const [editAnswer, setEditAnswer] = useState(question.correct_answer || 'A');

  // Xử lý gọi AI biến đổi vi mô
  const handleAiTweak = async (
    action: 'change_numbers' | 'similar_question' | 'increase_difficulty' | 'decrease_difficulty' | 'custom',
    customInstruction?: string
  ) => {
    setIsLoadingAi(true);
    const actionNames: Record<string, string> = {
      change_numbers: 'Đang đổi số liệu bài toán...',
      similar_question: 'Đang tạo câu tương tự...',
      increase_difficulty: 'Đang nâng độ khó...',
      decrease_difficulty: 'Đang giảm độ khó...',
      custom: 'Đang sửa câu theo yêu cầu...',
    };
    setAiActionMessage(actionNames[action]);

    try {
      const res = await fetch('/api/tweak-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          action,
          customInstruction,
          customApiKey: apiKey,
        }),
      });

      const data = await res.json();
      if (data.success && data.question) {
        // Thay vì ghi đè thẳng, hiển thị khung Diff Preview để giáo viên duyệt
        setPendingNewQuestion(data.question);
      }
    } catch (err) {
      console.error('Tweak failed:', err);
    } finally {
      setIsLoadingAi(false);
      setAiActionMessage(null);
      setShowCustomPrompt(false);
      setCustomPromptText('');
    }
  };

  // Chấp nhận câu hỏi mới từ AI
  const handleAcceptPendingQuestion = () => {
    if (!pendingNewQuestion) return;
    // Lưu bản cũ vào Undo stack
    setUndoHistory(prev => [...prev, question]);
    onUpdate(pendingNewQuestion);
    setPendingNewQuestion(null);
  };

  // Hủy bỏ bản mới, giữ lại bản cũ
  const handleDiscardPendingQuestion = () => {
    setPendingNewQuestion(null);
  };

  // Hoàn tác (Undo) về phiên bản trước
  const handleUndo = () => {
    if (undoHistory.length === 0) return;
    const previousQuestion = undoHistory[undoHistory.length - 1];
    setUndoHistory(prev => prev.slice(0, prev.length - 1));
    onUpdate(previousQuestion);
  };

  // Lưu câu hỏi vào Ngân hàng câu hỏi cá nhân
  const handleSaveToBank = async () => {
    try {
      await dbSaveQuestionToBank(question);
      setBankSavedNotification(true);
      setTimeout(() => setBankSavedNotification(false), 2500);
    } catch (err) {
      console.error('Lỗi khi lưu vào ngân hàng:', err);
    }
  };

  // Thẩm định đáp án câu hỏi bằng AI Dual-Solve
  const handleVerifyQuestion = async () => {
    setIsVerifying(true);
    try {
      const res = await fetch('/api/verify-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, customApiKey: apiKey }),
      });
      const data = await res.json();
      if (data.success) {
        setVerifyResult({
          isMatch: data.isMatch,
          confidence: data.confidence,
          solvedAnswer: data.solvedAnswer,
          solutionSteps: data.solutionSteps,
          discrepancies: data.discrepancies || [],
          recommendation: data.recommendation,
        });
        setShowVerifyDetails(true);
        const updated: Question = {
          ...question,
          status: data.isMatch ? 'verified' : 'draft',
          verifiedBy: 'dual_solve',
        };
        onUpdate(updated);
      } else {
        alert(data.error || 'Kiểm định câu hỏi thất bại');
      }
    } catch (err) {
      console.error('Verify error:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSaveEdit = () => {
    setUndoHistory(prev => [...prev, question]);
    onUpdate({
      ...question,
      content: editContent,
      step_by_step_solution: editSolution,
      correct_answer: editAnswer,
    });
    setIsEditing(false);
  };

  // Badge màu theo mức độ nhận thức
  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'nhan_biet':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">Nhận biết</span>;
      case 'thong_hieu':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">Thông hiểu</span>;
      case 'van_dung':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">Vận dụng</span>;
      case 'van_dung_cao':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">Vận dụng cao</span>;
      default:
        return null;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'multiple_choice':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">Trắc nghiệm 4 lựa chọn</span>;
      case 'true_false_group':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700">Đúng / Sai (4 ý)</span>;
      case 'short_answer':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-teal-100 text-teal-700">Trả lời ngắn</span>;
      case 'essay':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-700">Tự luận</span>;
      default:
        return null;
    }
  };

  return (
    <div className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden relative group ${
      isSelected 
        ? 'border-indigo-500 ring-2 ring-indigo-400/40 bg-indigo-50/15 shadow-md' 
        : 'border-slate-200 shadow-sm hover:shadow-md'
    }`}>
      {/* Loading Overlay khi AI đang xử lý */}
      {isLoadingAi && (
        <div className="absolute inset-0 bg-white/85 backdrop-blur-xs z-20 flex flex-col items-center justify-center gap-2">
          <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
          <span className="text-sm font-semibold text-slate-800">{aiActionMessage}</span>
        </div>
      )}

      {/* Header của thẻ câu hỏi */}
      <div className="bg-slate-50/80 px-4 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {onToggleSelect && (
            <input
              type="checkbox"
              checked={isSelected || false}
              onChange={() => onToggleSelect(question.id)}
              title="Chọn câu hỏi này để gộp câu hoặc thao tác hàng loạt"
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
            />
          )}
          <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
            {index + 1}
          </span>
          {getTypeBadge(question.type)}
          {getDifficultyBadge(question.difficulty)}
          <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200/80">
            {formatPointsString(getDefaultPointsForQuestion(question))}
          </span>

          {/* Nút Hoàn tác (Undo) nếu có lịch sử */}
          {undoHistory.length > 0 && (
            <button
              onClick={handleUndo}
              title={`Hoàn tác về phiên bản trước (còn ${undoHistory.length} bản lưu)`}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors"
            >
              <Undo2 className="w-3 h-3" />
              <span>Hoàn tác ({undoHistory.length})</span>
            </button>
          )}

          {bankSavedNotification && (
            <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
              <Check className="w-3 h-3" /> Đã lưu vào ngân hàng!
            </span>
          )}
        </div>

        {/* Nút hành động thanh công cụ */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleAiTweak('change_numbers')}
            title="Đổi số liệu bài toán bằng AI"
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200/60"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Đổi số liệu</span>
          </button>

          <button
            onClick={() => handleAiTweak('similar_question')}
            title="Tạo câu hỏi tương đương bằng AI"
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Câu tương tự</span>
          </button>

          {/* Nút Thẩm định AI Dual-Solve */}
          <button
            onClick={handleVerifyQuestion}
            disabled={isVerifying}
            title="Thẩm định độc lập bằng AI: AI giải từ đầu không nhìn đáp án để kiểm tra tính chính xác"
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors border ${
              question.status === 'verified'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                : verifyResult && !verifyResult.isMatch
                ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
            }`}
          >
            {isVerifying ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
            ) : question.status === 'verified' ? (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            ) : verifyResult && !verifyResult.isMatch ? (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            ) : (
              <CheckCheck className="w-3.5 h-3.5 text-indigo-600" />
            )}
            <span className="hidden md:inline">
              {isVerifying
                ? 'Đang giải...'
                : question.status === 'verified'
                ? 'Đã thẩm định'
                : verifyResult && !verifyResult.isMatch
                ? 'Lệch đáp án!'
                : 'Thẩm định AI'}
            </span>
          </button>

          {/* Nút Trợ lý AI Sửa Câu - Chuyển tiếp lên thanh Copilot duy nhất */}
          {onAskAiAboutQuestion && (
            <button
              onClick={() => onAskAiAboutQuestion(index)}
              title="Bảo Trợ lý AI ở trên chỉnh sửa câu hỏi này theo ý bạn"
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Bảo AI sửa câu này</span>
            </button>
          )}

          <button
            onClick={handleSaveToBank}
            title="Lưu câu hỏi này vào Ngân hàng câu hỏi cá nhân"
            className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
          >
            <BookmarkPlus className="w-4 h-4" />
          </button>

          {onMoveUp && (
            <button
              onClick={onMoveUp}
              disabled={isFirst}
              title="Di chuyển câu hỏi lên trên (↑)"
              className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-25 disabled:cursor-not-allowed rounded transition-colors"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          )}

          {onMoveDown && (
            <button
              onClick={onMoveDown}
              disabled={isLast}
              title="Di chuyển câu hỏi xuống dưới (↓)"
              className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-25 disabled:cursor-not-allowed rounded transition-colors"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
          )}

          {onDuplicate && (
            <button
              onClick={onDuplicate}
              title="Nhân bản (sao chép) câu hỏi này"
              className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
            >
              <Copy className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => setIsEditing(!isEditing)}
            title="Sửa nội dung câu hỏi thủ công"
            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          <button
            onClick={() => onDelete(question.id)}
            title="Xóa câu hỏi này"
            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KHUNG KẾT QUẢ THẨM ĐỊNH DUAL-SOLVE AI */}
      {verifyResult && showVerifyDetails && (
        <div className={`m-3 p-3.5 rounded-xl border text-xs space-y-2.5 transition-all ${
          verifyResult.isMatch
            ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
            : 'bg-amber-50/90 border-amber-300 text-amber-950'
        }`}>
          <div className="flex items-center justify-between font-bold">
            <div className="flex items-center gap-1.5">
              {verifyResult.isMatch ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>KẾT QUẢ THẨM ĐỊNH AI: ĐÁP ÁN TRÙNG KHỚP 100% (Độ tin cậy: {verifyResult.confidence}%)</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>CẢNH BÁO THẨM ĐỊNH AI: PHÁT HIỆN SAI LỆCH ĐÁP ÁN!</span>
                </>
              )}
            </div>
            <button
              onClick={() => setShowVerifyDetails(false)}
              className="text-slate-400 hover:text-slate-700 p-0.5 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-sans">
            <div className="p-2 bg-white/90 rounded-lg border border-slate-200">
              <span className="text-slate-500 font-semibold block text-[11px]">Đáp án hiện tại trong đề:</span>
              <span className="text-slate-900 font-bold font-mono text-sm">{question.correct_answer || 'Chưa thiết lập'}</span>
            </div>
            <div className="p-2 bg-white/90 rounded-lg border border-slate-200">
              <span className="text-slate-500 font-semibold block text-[11px]">AI thẩm định giải độc lập ra:</span>
              <span className={`font-mono text-sm ${verifyResult.isMatch ? 'text-emerald-700 font-bold' : 'text-amber-800 font-extrabold'}`}>
                {verifyResult.solvedAnswer}
              </span>
            </div>
          </div>

          {verifyResult.discrepancies.length > 0 && (
            <div className="p-2.5 bg-amber-100/70 rounded-lg border border-amber-200 space-y-1">
              <span className="font-bold text-amber-900 block text-[11px]">Điểm sai lệch / Cần lưu ý:</span>
              {verifyResult.discrepancies.map((d, i) => (
                <div key={i} className="text-amber-900 leading-tight flex items-start gap-1">
                  <span>•</span>
                  <span>{d}</span>
                </div>
              ))}
            </div>
          )}

          <div className="p-2.5 bg-white/90 rounded-lg border border-slate-200 leading-relaxed font-serif">
            <span className="font-bold font-sans text-slate-700 block text-[11px] mb-1">Lời giải kiểm định độc lập của AI:</span>
            <MathRenderer content={verifyResult.solutionSteps} />
          </div>
        </div>
      )}

      {/* KHUNG DIFF PREVIEW: SO SÁNH BẢN CŨ VS BẢN MỚI TỪ AI */}
      {pendingNewQuestion && (
        <div className="m-3 p-3.5 bg-amber-50/80 border-2 border-amber-300 rounded-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-amber-200">
            <div className="flex items-center gap-1.5 font-bold text-xs text-amber-900">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>AI ĐÃ TẠO BẢN THAY ĐỔI MỚI (Xem trước khác biệt):</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleAcceptPendingQuestion}
                className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Chấp nhận thay đổi</span>
              </button>

              <button
                onClick={handleDiscardPendingQuestion}
                className="flex items-center gap-1 px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-lg transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>Giữ câu gốc</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* Cột bản cũ */}
            <div className="p-2.5 bg-red-50/60 rounded-lg border border-red-200 space-y-1.5">
              <span className="font-bold text-red-800 text-[11px] uppercase tracking-wider block">Bản câu hỏi hiện tại:</span>
              <div className="text-slate-800 leading-relaxed">
                <MathRenderer content={question.content} inline />
              </div>
              <div className="text-slate-600 font-semibold text-[11px] pt-1">
                Đáp án: {question.correct_answer || 'Chưa có'}
              </div>
            </div>

            {/* Cột bản mới */}
            <div className="p-2.5 bg-emerald-50/80 rounded-lg border border-emerald-300 space-y-1.5">
              <span className="font-bold text-emerald-800 text-[11px] uppercase tracking-wider block">Bản câu hỏi mới đề xuất:</span>
              <div className="text-slate-900 leading-relaxed font-medium">
                <MathRenderer content={pendingNewQuestion.content} inline />
              </div>
              <div className="text-emerald-800 font-bold text-[11px] pt-1">
                Đáp án mới: {pendingNewQuestion.correct_answer || 'Chưa có'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nội dung câu hỏi chính */}
      <div className="p-4 space-y-3">
        {isEditing ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Nội dung câu hỏi (hỗ trợ LaTeX $...$):</label>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
                className="w-full text-sm p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Lời giải chi tiết:</label>
              <textarea
                value={editSolution}
                onChange={(e) => setEditSolution(e.target.value)}
                rows={3}
                className="w-full text-sm p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
            <div className="flex items-center gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Đáp án đúng:</label>
                <input
                  type="text"
                  value={editAnswer}
                  onChange={(e) => setEditAnswer(e.target.value)}
                  className="w-24 text-sm p-1.5 border border-slate-300 rounded-lg text-center font-bold"
                />
              </div>
              <div className="grow flex justify-end gap-2 pt-5">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-slate-900 leading-relaxed font-serif">
            <MathRenderer content={question.content} />
          </div>
        )}

        {/* Render Hình vẽ / Bảng biến thiên (figures) nếu có */}
        {!isEditing && question.figures && question.figures.length > 0 && (
          <div className="my-2 space-y-2">
            {question.figures.map((fig) => {
              if (fig.kind === 'variation_table') {
                return (
                  <div key={fig.id} className="overflow-x-auto py-1">
                    <VariationTable data={fig.data as any} />
                    {fig.caption && <div className="text-[11px] text-slate-500 italic mt-0.5">{fig.caption}</div>}
                  </div>
                );
              }
              if (fig.kind === 'function_plot') {
                return (
                  <div key={fig.id} className="overflow-x-auto py-1">
                    <FunctionPlot data={fig.data as any} />
                    {fig.caption && <div className="text-[11px] text-slate-500 italic mt-0.5">{fig.caption}</div>}
                  </div>
                );
              }
              if (fig.kind === 'image') {
                const src = (fig.data as any)?.url || fig.renderedBase64 || (typeof fig.data === 'string' ? fig.data : '');
                if (src) {
                  return (
                    <div key={fig.id} className="py-2">
                      <img
                        src={src}
                        alt={fig.caption || 'Hình vẽ / sơ đồ đính kèm'}
                        className="max-h-64 max-w-full rounded-xl border border-slate-200 shadow-2xs object-contain bg-white"
                      />
                      {fig.caption && <div className="text-[11px] text-slate-500 italic mt-1">{fig.caption}</div>}
                    </div>
                  );
                }
              }
              return null;
            })}
          </div>
        )}

        {/* PHƯƠNG ÁN LỰA CHỌN (Multiple Choice) */}
        {!isEditing && question.choices && question.choices.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
            {question.choices.map((c) => {
              const isCorrect = c.key === question.correct_answer;
              return (
                <div
                  key={c.key}
                  className={`p-2.5 rounded-xl border flex items-baseline gap-2 transition-all ${
                    isCorrect
                      ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-medium'
                      : 'bg-slate-50/50 border-slate-200 text-slate-800'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-md font-bold text-xs flex items-center justify-center shrink-0 ${
                    isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {c.key}
                  </span>
                  <div className="grow text-xs">
                    <MathRenderer content={c.text} inline />
                  </div>
                  {isCorrect && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 self-center ml-auto" />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* CÂU HỎI ĐÚNG / SAI 4 Ý (True / False Group) */}
        {!isEditing && question.sub_questions && question.sub_questions.length > 0 && (
          <div className="space-y-2 pt-2">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Các mệnh đề Đúng / Sai:
            </div>
            {question.sub_questions.map((sub) => (
              <div
                key={sub.key}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start gap-3 text-xs"
              >
                <span className="font-bold text-slate-900 mt-0.5">{sub.key})</span>
                <div className="grow text-slate-800">
                  <MathRenderer content={sub.content} inline />
                  {sub.explanation && (
                    <div className="text-slate-500 text-[11px] mt-1 italic">
                      Giải thích: <MathRenderer content={sub.explanation} inline />
                    </div>
                  )}
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                  sub.isCorrect
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                }`}>
                  {sub.isCorrect ? 'ĐÚNG' : 'SAI'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* TRẢ LỜI NGẮN (Short Answer) */}
        {!isEditing && question.type === 'short_answer' && (
          <div className="p-3 bg-teal-50/60 border border-teal-200 rounded-xl flex items-center gap-3 text-xs">
            <span className="font-bold text-teal-900">Đáp số chuẩn xác:</span>
            <span className="px-3 py-1 bg-white font-mono font-bold text-teal-800 border border-teal-300 rounded-lg shadow-2xs">
              {question.correct_answer || 'Chưa thiết lập'}
            </span>
          </div>
        )}

        {/* CÂU HỎI TỰ LUẬN (Essay) & BAREM CHẤM ĐIỂM */}
        {!isEditing && question.type === 'essay' && (
          <div className="space-y-2 pt-2">
            {question.rubric && question.rubric.length > 0 && (
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2 text-xs">
                <span className="font-bold text-amber-950 block">Barem tiêu chí chấm điểm chi tiết:</span>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-amber-300 text-left bg-white rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-amber-100/70 text-amber-900 font-bold text-[11px]">
                        <th className="border border-amber-300 px-3 py-1.5">Tiêu chí đánh giá / Yêu cầu cần đạt</th>
                        <th className="border border-amber-300 px-3 py-1.5 text-center w-24">Điểm tối đa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {question.rubric.map((r, rIdx) => (
                        <tr key={rIdx} className="hover:bg-amber-50/50">
                          <td className="border border-amber-200 px-3 py-1.5 text-slate-800">{r.criterion}</td>
                          <td className="border border-amber-200 px-3 py-1.5 text-center font-bold font-mono text-amber-900">{r.maxPoints}đ</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ĐIỀN TỪ VÀO CHỖ TRỐNG (Fill Blank) */}
        {!isEditing && question.type === 'fill_blank' && (
          <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-xl space-y-2 text-xs">
            <span className="font-bold text-purple-950 block">Đáp án điền từ vào chỗ trống:</span>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-white font-mono font-bold text-purple-800 border border-purple-300 rounded-lg shadow-2xs">
                {question.correct_answer || 'Chưa thiết lập'}
              </span>
              {question.accepted_answers && question.accepted_answers.length > 0 && (
                <span className="text-[11px] text-purple-700 italic">
                  (Chấp nhận: {question.accepted_answers.join(', ')})
                </span>
              )}
            </div>
          </div>
        )}

        {/* GHÉP NỐI HAI CỘT (Matching) */}
        {!isEditing && question.type === 'matching' && (
          <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2 text-xs">
            <span className="font-bold text-blue-950 block">Ghép nối tương ứng:</span>
            <div className="text-blue-900 font-mono font-bold">
              {question.correct_answer || '1-A, 2-B, 3-C, 4-D'}
            </div>
          </div>
        )}

        {/* Lời giải chi tiết (Toggle xem) */}
        <div className="pt-2 border-t border-slate-100">
          <button
            onClick={() => setShowSolution(!showSolution)}
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            {showSolution ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span>{showSolution ? 'Thu gọn lời giải' : 'Xem lời giải chi tiết'}</span>
          </button>

          {showSolution && (
            <div className="mt-2.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 space-y-1.5 leading-relaxed font-serif">
              <div className="font-bold text-indigo-950 font-sans text-xs">Hướng dẫn giải từng bước:</div>
              <MathRenderer content={question.step_by_step_solution} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
