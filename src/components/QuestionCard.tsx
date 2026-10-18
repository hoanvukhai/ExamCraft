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

  // Badge màu theo mức độ nhận thức Google Minimalist
  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'nhan_biet':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#e6f4ea] dark:bg-[#0f291e] text-[#137333] dark:text-[#5bb98c] border border-[#ceead6] dark:border-[#1e4a34]">Nhận biết</span>;
      case 'thong_hieu':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#e8f0fe] dark:bg-[#1e2a38] text-[#1a73e8] dark:text-[#8ab4f8] border border-[#d2e3fc] dark:border-[#2a3f58]">Thông hiểu</span>;
      case 'van_dung':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#fef7e0] dark:bg-[#33250b] text-[#b06000] dark:text-[#fdd663] border border-[#feefc3] dark:border-[#533f16]">Vận dụng</span>;
      case 'van_dung_cao':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#fce8e6] dark:bg-[#371918] text-[#c5221f] dark:text-[#f28b82] border border-[#fad2cf] dark:border-[#5c2725]">Vận dụng cao</span>;
      default:
        return null;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'multiple_choice':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f1f3f4] dark:bg-[#282828] text-[#3c4043] dark:text-[#e3e3e3] border border-[#dadce0] dark:border-[#3c4043]">Trắc nghiệm 4 lựa chọn</span>;
      case 'true_false_group':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f1f3f4] dark:bg-[#282828] text-[#3c4043] dark:text-[#e3e3e3] border border-[#dadce0] dark:border-[#3c4043]">Đúng / Sai (4 ý)</span>;
      case 'short_answer':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f1f3f4] dark:bg-[#282828] text-[#3c4043] dark:text-[#e3e3e3] border border-[#dadce0] dark:border-[#3c4043]">Trả lời ngắn</span>;
      case 'essay':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f1f3f4] dark:bg-[#282828] text-[#3c4043] dark:text-[#e3e3e3] border border-[#dadce0] dark:border-[#3c4043]">Tự luận</span>;
      default:
        return null;
    }
  };

  return (
    <div className={`bg-white dark:bg-[#1e1e1e] rounded-3xl border transition-all duration-200 overflow-hidden relative group ${
      isSelected 
        ? 'border-blue-500 dark:border-[#8ab4f8] ring-2 ring-[#8ab4f8]/30 shadow-md' 
        : 'border-[#dadce0] dark:border-[#3c4043] shadow-xs hover:shadow-md'
    }`}>
      {/* Loading Overlay khi AI đang xử lý */}
      {isLoadingAi && (
        <div className="absolute inset-0 bg-white/85 dark:bg-[#1e1e1e]/85 backdrop-blur-xs z-20 flex flex-col items-center justify-center gap-2">
          <RefreshCw className="w-6 h-6 text-[#202124] dark:text-[#e3e3e3] animate-spin" />
          <span className="text-sm font-semibold text-[#202124] dark:text-[#e3e3e3]">{aiActionMessage}</span>
        </div>
      )}

      {/* Header của thẻ câu hỏi */}
      <div className="bg-[#f8f9fa] dark:bg-[#282828]/60 px-4 py-2.5 border-b border-[#dadce0] dark:border-[#3c4043] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {onToggleSelect && (
            <input
              type="checkbox"
              checked={isSelected || false}
              onChange={() => onToggleSelect(question.id)}
              title="Chọn câu hỏi này để gộp câu hoặc thao tác hàng loạt"
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-[#dadce0] cursor-pointer"
            />
          )}
          <span className="w-7 h-7 rounded-full bg-[#202124] text-white dark:bg-[#303134] dark:text-[#e3e3e3] dark:border dark:border-[#3c4043] font-bold text-xs flex items-center justify-center shadow-2xs">
            {index + 1}
          </span>
          {getTypeBadge(question.type)}
          {getDifficultyBadge(question.difficulty)}
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800">
            {formatPointsString(getDefaultPointsForQuestion(question))}
          </span>

          {/* Nút Hoàn tác (Undo) nếu có lịch sử */}
          {undoHistory.length > 0 && (
            <button
              onClick={handleUndo}
              title={`Hoàn tác về phiên bản trước (còn ${undoHistory.length} bản lưu)`}
              className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#f1f3f4] dark:bg-[#282828] text-[#3c4043] dark:text-[#e3e3e3] hover:bg-[#e8eaed] dark:hover:bg-[#383a3d] border border-[#dadce0] dark:border-[#3c4043] transition-colors"
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

        {/* Nút hành động thanh công cụ Google Ghost Pill */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => handleAiTweak('change_numbers')}
            title="Đổi số liệu bài toán bằng AI"
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-[#3c4043] dark:text-[#e3e3e3] bg-white dark:bg-[#282828] hover:bg-[#f8f9fa] dark:hover:bg-[#303134] rounded-full transition-colors border border-[#dadce0] dark:border-[#3c4043] shadow-2xs cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Đổi số liệu</span>
          </button>

          <button
            onClick={() => handleAiTweak('similar_question')}
            title="Tạo câu hỏi tương đương bằng AI"
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-[#3c4043] dark:text-[#e3e3e3] bg-white dark:bg-[#282828] hover:bg-[#f8f9fa] dark:hover:bg-[#303134] rounded-full transition-colors border border-[#dadce0] dark:border-[#3c4043] shadow-2xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#5f6368] dark:text-[#9aa0a6]" />
            <span className="hidden sm:inline">Câu tương tự</span>
          </button>

          {/* Nút Thẩm định AI Dual-Solve */}
          <button
            onClick={handleVerifyQuestion}
            disabled={isVerifying}
            title="Thẩm định độc lập bằng AI: AI giải từ đầu không nhìn đáp án để kiểm tra tính chính xác"
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full transition-colors border shadow-2xs cursor-pointer ${
              question.status === 'verified'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                : verifyResult && !verifyResult.isMatch
                ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                : 'bg-white dark:bg-[#282828] text-[#3c4043] dark:text-[#e3e3e3] border-[#dadce0] dark:border-[#3c4043] hover:bg-[#f8f9fa] dark:hover:bg-[#303134]'
            }`}
          >
            {isVerifying ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#5f6368]" />
            ) : question.status === 'verified' ? (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            ) : verifyResult && !verifyResult.isMatch ? (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            ) : (
              <CheckCheck className="w-3.5 h-3.5 text-[#5f6368] dark:text-[#9aa0a6]" />
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

          {/* Nút Trợ lý AI Sửa Câu */}
          {onAskAiAboutQuestion && (
            <button
              onClick={() => onAskAiAboutQuestion(index)}
              title="Bảo Trợ lý AI ở bên phải chỉnh sửa câu hỏi này theo ý bạn"
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-white dark:bg-[#282828] text-[#3c4043] dark:text-[#e3e3e3] hover:bg-[#f8f9fa] dark:hover:bg-[#303134] border border-[#dadce0] dark:border-[#3c4043] shadow-2xs transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Bảo AI sửa câu này</span>
            </button>
          )}

          <button
            onClick={handleSaveToBank}
            title="Lưu câu hỏi này vào Ngân hàng câu hỏi cá nhân"
            className="p-1.5 text-[#5f6368] hover:text-emerald-600 dark:text-[#9aa0a6] dark:hover:text-emerald-400 hover:bg-[#f1f3f4] dark:hover:bg-[#282828] rounded-full transition-colors cursor-pointer"
          >
            <BookmarkPlus className="w-4 h-4" />
          </button>

          {onMoveUp && (
            <button
              onClick={onMoveUp}
              disabled={isFirst}
              title="Di chuyển câu hỏi lên trên (↑)"
              className="p-1.5 text-[#5f6368] hover:text-blue-600 dark:text-[#9aa0a6] dark:hover:text-[#8ab4f8] hover:bg-[#f1f3f4] dark:hover:bg-[#282828] disabled:opacity-25 disabled:cursor-not-allowed rounded-full transition-colors cursor-pointer"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          )}

          {onMoveDown && (
            <button
              onClick={onMoveDown}
              disabled={isLast}
              title="Di chuyển câu hỏi xuống dưới (↓)"
              className="p-1.5 text-[#5f6368] hover:text-blue-600 dark:text-[#9aa0a6] dark:hover:text-[#8ab4f8] hover:bg-[#f1f3f4] dark:hover:bg-[#282828] disabled:opacity-25 disabled:cursor-not-allowed rounded-full transition-colors cursor-pointer"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
          )}

          {onDuplicate && (
            <button
              onClick={onDuplicate}
              title="Nhân bản (sao chép) câu hỏi này"
              className="p-1.5 text-[#5f6368] hover:text-emerald-600 dark:text-[#9aa0a6] dark:hover:text-emerald-400 hover:bg-[#f1f3f4] dark:hover:bg-[#282828] rounded-full transition-colors cursor-pointer"
            >
              <Copy className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => setIsEditing(!isEditing)}
            title="Sửa nội dung câu hỏi thủ công"
            className="p-1.5 text-[#5f6368] hover:text-[#202124] dark:text-[#9aa0a6] dark:hover:text-[#e3e3e3] hover:bg-[#f1f3f4] dark:hover:bg-[#282828] rounded-full transition-colors cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          <button
            onClick={() => onDelete(question.id)}
            title="Xóa câu hỏi này"
            className="p-1.5 text-[#5f6368] hover:text-red-600 dark:text-[#9aa0a6] dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-full transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KHUNG KẾT QUẢ THẨM ĐỊNH DUAL-SOLVE AI */}
      {verifyResult && showVerifyDetails && (
        <div className={`m-3 p-3.5 rounded-xl border text-xs space-y-2.5 transition-all ${
          verifyResult.isMatch
            ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
            : 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200'
        }`}>
          <div className="flex items-center justify-between font-bold">
            <div className="flex items-center gap-1.5">
              {verifyResult.isMatch ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>KẾT QUẢ THẨM ĐỊNH AI: ĐÁP ÁN TRÙNG KHỚP 100% (Độ tin cậy: {verifyResult.confidence}%)</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>CẢNH BÁO THẨM ĐỊNH AI: PHÁT HIỆN SAI LỆCH ĐÁP ÁN!</span>
                </>
              )}
            </div>
            <button
              onClick={() => setShowVerifyDetails(false)}
              className="text-[#5f6368] hover:text-[#202124] dark:text-[#9aa0a6] dark:hover:text-[#e3e3e3] p-0.5 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-sans">
            <div className="p-2.5 bg-white dark:bg-[#282828] rounded-xl border border-[#dadce0] dark:border-[#3c4043]">
              <span className="text-[#5f6368] dark:text-[#9aa0a6] font-semibold block text-[11px]">Đáp án hiện tại trong đề:</span>
              <span className="text-[#202124] dark:text-[#e3e3e3] font-bold font-mono text-sm">{question.correct_answer || 'Chưa thiết lập'}</span>
            </div>
            <div className="p-2.5 bg-white dark:bg-[#282828] rounded-xl border border-[#dadce0] dark:border-[#3c4043]">
              <span className="text-[#5f6368] dark:text-[#9aa0a6] font-semibold block text-[11px]">AI thẩm định giải độc lập ra:</span>
              <span className={`font-mono text-sm ${verifyResult.isMatch ? 'text-emerald-700 dark:text-emerald-300 font-bold' : 'text-amber-800 dark:text-amber-300 font-extrabold'}`}>
                {verifyResult.solvedAnswer}
              </span>
            </div>
          </div>

          {verifyResult.discrepancies.length > 0 && (
            <div className="p-2.5 bg-amber-100/70 dark:bg-amber-950/60 rounded-xl border border-amber-200 dark:border-amber-800 space-y-1">
              <span className="font-bold text-amber-900 dark:text-amber-200 block text-[11px]">Điểm sai lệch / Cần lưu ý:</span>
              {verifyResult.discrepancies.map((d, i) => (
                <div key={i} className="text-amber-900 dark:text-amber-200 leading-tight flex items-start gap-1">
                  <span>•</span>
                  <span>{d}</span>
                </div>
              ))}
            </div>
          )}

          <div className="p-2.5 bg-white dark:bg-[#282828] rounded-xl border border-[#dadce0] dark:border-[#3c4043] leading-relaxed font-serif text-[#202124] dark:text-[#e3e3e3]">
            <span className="font-bold font-sans text-[#5f6368] dark:text-[#9aa0a6] block text-[11px] mb-1">Lời giải kiểm định độc lập của AI:</span>
            <MathRenderer content={verifyResult.solutionSteps} />
          </div>
        </div>
      )}

      {/* KHUNG DIFF PREVIEW: SO SÁNH BẢN CŨ VS BẢN MỚI TỪ AI */}
      {pendingNewQuestion && (
        <div className="m-3 p-3.5 bg-amber-50/80 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700 rounded-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-1.5 font-bold text-xs text-amber-900 dark:text-amber-200">
              <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>AI ĐÃ TẠO BẢN THAY ĐỔI MỚI (Xem trước khác biệt):</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleAcceptPendingQuestion}
                className="flex items-center gap-1 px-4 py-1.5 bg-[#137333] hover:bg-[#0f5a28] text-white font-semibold text-xs rounded-full shadow-xs transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Chấp nhận thay đổi</span>
              </button>

              <button
                onClick={handleDiscardPendingQuestion}
                className="flex items-center gap-1 px-3 py-1.5 bg-[#f1f3f4] dark:bg-[#282828] hover:bg-[#e8eaed] dark:hover:bg-[#303134] text-[#3c4043] dark:text-[#e3e3e3] border border-[#dadce0] dark:border-[#3c4043] font-medium text-xs rounded-full transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Giữ câu gốc</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* Cột bản cũ */}
            <div className="p-2.5 bg-red-50/60 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-800 space-y-1.5">
              <span className="font-bold text-red-800 dark:text-red-300 text-[11px] uppercase tracking-wider block">Bản câu hỏi hiện tại:</span>
              <div className="text-[#202124] dark:text-[#e3e3e3] leading-relaxed">
                <MathRenderer content={question.content} inline />
              </div>
              <div className="text-[#5f6368] dark:text-[#9aa0a6] font-semibold text-[11px] pt-1">
                Đáp án: {question.correct_answer || 'Chưa có'}
              </div>
            </div>

            {/* Cột bản mới */}
            <div className="p-2.5 bg-emerald-50/80 dark:bg-emerald-950/30 rounded-xl border border-emerald-300 dark:border-emerald-800 space-y-1.5">
              <span className="font-bold text-emerald-800 dark:text-emerald-300 text-[11px] uppercase tracking-wider block">Bản câu hỏi mới đề xuất:</span>
              <div className="text-[#202124] dark:text-[#e3e3e3] leading-relaxed font-medium">
                <MathRenderer content={pendingNewQuestion.content} inline />
              </div>
              <div className="text-emerald-800 dark:text-emerald-300 font-bold text-[11px] pt-1">
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
              <label className="text-xs font-semibold text-[#202124] dark:text-[#e3e3e3] block mb-1">Nội dung câu hỏi (hỗ trợ LaTeX $...$):</label>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
                className="w-full text-sm p-3 border border-[#dadce0] dark:border-[#3c4043] bg-white dark:bg-[#242424] text-[#202124] dark:text-[#e3e3e3] rounded-xl focus:border-[#1a73e8] dark:focus:border-[#8ab4f8] outline-hidden font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#202124] dark:text-[#e3e3e3] block mb-1">Lời giải chi tiết:</label>
              <textarea
                value={editSolution}
                onChange={(e) => setEditSolution(e.target.value)}
                rows={3}
                className="w-full text-sm p-3 border border-[#dadce0] dark:border-[#3c4043] bg-white dark:bg-[#242424] text-[#202124] dark:text-[#e3e3e3] rounded-xl focus:border-[#1a73e8] dark:focus:border-[#8ab4f8] outline-hidden font-mono"
              />
            </div>
            <div className="flex items-center gap-3">
              <div>
                <label className="text-xs font-semibold text-[#202124] dark:text-[#e3e3e3] block mb-1">Đáp án đúng:</label>
                <input
                  type="text"
                  value={editAnswer}
                  onChange={(e) => setEditAnswer(e.target.value)}
                  className="w-24 text-sm p-2 border border-[#dadce0] dark:border-[#3c4043] bg-white dark:bg-[#242424] text-[#202124] dark:text-[#e3e3e3] rounded-xl text-center font-bold focus:border-[#1a73e8] dark:focus:border-[#8ab4f8] outline-hidden"
                />
              </div>
              <div className="grow flex justify-end gap-2 pt-5">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-1.5 text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#f1f3f4] dark:hover:bg-[#282828] rounded-full transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-5 py-1.5 text-xs font-semibold text-white bg-[#1a73e8] hover:bg-[#1557b0] dark:bg-[#8ab4f8] dark:text-[#181818] dark:hover:bg-[#a8c7fa] rounded-full shadow-xs transition-colors cursor-pointer"
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-[#202124] dark:text-[#e3e3e3] leading-relaxed font-serif">
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
                    {fig.caption && <div className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] italic mt-0.5">{fig.caption}</div>}
                  </div>
                );
              }
              if (fig.kind === 'function_plot') {
                return (
                  <div key={fig.id} className="overflow-x-auto py-1">
                    <FunctionPlot data={fig.data as any} />
                    {fig.caption && <div className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] italic mt-0.5">{fig.caption}</div>}
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
                        className="max-h-64 max-w-full rounded-xl border border-[#dadce0] dark:border-[#3c4043] shadow-xs object-contain bg-white dark:bg-[#242424]"
                      />
                      {fig.caption && <div className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] italic mt-1">{fig.caption}</div>}
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
                      ? 'bg-[#e6f4ea] dark:bg-[#0f291e] border-[#ceead6] dark:border-[#1e4a34] text-[#137333] dark:text-[#5bb98c] font-medium'
                      : 'bg-[#f8f9fa] dark:bg-[#242424] border-[#dadce0] dark:border-[#3c4043] text-[#202124] dark:text-[#e3e3e3]'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-md font-bold text-xs flex items-center justify-center shrink-0 ${
                    isCorrect ? 'bg-[#137333] dark:bg-[#5bb98c] text-white dark:text-[#0f291e]' : 'bg-[#e8eaed] dark:bg-[#303134] text-[#3c4043] dark:text-[#e3e3e3]'
                  }`}>
                    {c.key}
                  </span>
                  <div className="grow text-xs">
                    <MathRenderer content={c.text} inline />
                  </div>
                  {isCorrect && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 self-center ml-auto" />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* CÂU HỎI ĐÚNG / SAI 4 Ý (True / False Group) */}
        {!isEditing && question.sub_questions && question.sub_questions.length > 0 && (
          <div className="space-y-2 pt-2">
            <div className="text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider">
              Các mệnh đề Đúng / Sai:
            </div>
            {question.sub_questions.map((sub) => (
              <div
                key={sub.key}
                className="p-2.5 rounded-xl border border-[#dadce0] dark:border-[#3c4043] bg-[#f8f9fa] dark:bg-[#242424] flex items-start gap-3 text-xs"
              >
                <span className="font-bold text-[#202124] dark:text-[#e3e3e3] mt-0.5">{sub.key})</span>
                <div className="grow text-[#202124] dark:text-[#e3e3e3]">
                  <MathRenderer content={sub.content} inline />
                  {sub.explanation && (
                    <div className="text-[#5f6368] dark:text-[#9aa0a6] text-[11px] mt-1 italic">
                      Giải thích: <MathRenderer content={sub.explanation} inline />
                    </div>
                  )}
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                  sub.isCorrect
                    ? 'bg-[#e6f4ea] dark:bg-[#0f291e] text-[#137333] dark:text-[#5bb98c] border border-[#ceead6] dark:border-[#1e4a34]'
                    : 'bg-[#fce8e6] dark:bg-[#371918] text-[#c5221f] dark:text-[#f28b82] border border-[#fad2cf] dark:border-[#5c2725]'
                }`}>
                  {sub.isCorrect ? 'ĐÚNG' : 'SAI'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* TRẢ LỜI NGẮN (Short Answer) */}
        {!isEditing && question.type === 'short_answer' && (
          <div className="p-3 bg-[#e6f4ea]/80 dark:bg-[#0f291e] border border-[#ceead6] dark:border-[#1e4a34] rounded-xl flex items-center gap-3 text-xs">
            <span className="font-bold text-[#137333] dark:text-[#5bb98c]">Đáp số chuẩn xác:</span>
            <span className="px-3 py-1 bg-white dark:bg-[#1e1e1e] font-mono font-bold text-[#137333] dark:text-[#5bb98c] border border-[#ceead6] dark:border-[#1e4a34] rounded-lg shadow-2xs">
              {question.correct_answer || 'Chưa thiết lập'}
            </span>
          </div>
        )}

        {/* CÂU HỎI TỰ LUẬN (Essay) & BAREM CHẤM ĐIỂM */}
        {!isEditing && question.type === 'essay' && (
          <div className="space-y-2 pt-2">
            {question.rubric && question.rubric.length > 0 && (
              <div className="p-3 bg-[#fef7e0]/80 dark:bg-[#33250b] border border-[#feefc3] dark:border-[#533f16] rounded-xl space-y-2 text-xs">
                <span className="font-bold text-[#b06000] dark:text-[#fdd663] block">Barem tiêu chí chấm điểm chi tiết:</span>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-[#feefc3] dark:border-[#533f16] text-left bg-white dark:bg-[#1e1e1e] rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-[#feefc3] dark:bg-[#533f16]/60 text-[#b06000] dark:text-[#fdd663] font-bold text-[11px]">
                        <th className="border border-[#feefc3] dark:border-[#533f16] px-3 py-1.5">Tiêu chí đánh giá / Yêu cầu cần đạt</th>
                        <th className="border border-[#feefc3] dark:border-[#533f16] px-3 py-1.5 text-center w-24">Điểm tối đa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {question.rubric.map((r, rIdx) => (
                        <tr key={rIdx} className="hover:bg-[#fef7e0]/50 dark:hover:bg-[#533f16]/20">
                          <td className="border border-[#feefc3] dark:border-[#533f16]/60 px-3 py-1.5 text-[#202124] dark:text-[#e3e3e3]">{r.criterion}</td>
                          <td className="border border-[#feefc3] dark:border-[#533f16]/60 px-3 py-1.5 text-center font-bold font-mono text-[#b06000] dark:text-[#fdd663]">{r.maxPoints}đ</td>
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
          <div className="p-3 bg-[#e8f0fe]/80 dark:bg-[#1e2a38] border border-[#d2e3fc] dark:border-[#2a3f58] rounded-xl space-y-2 text-xs">
            <span className="font-bold text-[#1a73e8] dark:text-[#8ab4f8] block">Đáp án điền từ vào chỗ trống:</span>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-white dark:bg-[#1e1e1e] font-mono font-bold text-[#1a73e8] dark:text-[#8ab4f8] border border-[#d2e3fc] dark:border-[#2a3f58] rounded-lg shadow-2xs">
                {question.correct_answer || 'Chưa thiết lập'}
              </span>
              {question.accepted_answers && question.accepted_answers.length > 0 && (
                <span className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] italic">
                  (Chấp nhận: {question.accepted_answers.join(', ')})
                </span>
              )}
            </div>
          </div>
        )}

        {/* GHÉP NỐI HAI CỘT (Matching) */}
        {!isEditing && question.type === 'matching' && (
          <div className="p-3 bg-[#e8f0fe]/80 dark:bg-[#1e2a38] border border-[#d2e3fc] dark:border-[#2a3f58] rounded-xl space-y-2 text-xs">
            <span className="font-bold text-[#1a73e8] dark:text-[#8ab4f8] block">Ghép nối tương ứng:</span>
            <div className="text-[#1a73e8] dark:text-[#8ab4f8] font-mono font-bold">
              {question.correct_answer || '1-A, 2-B, 3-C, 4-D'}
            </div>
          </div>
        )}

        {/* Lời giải chi tiết (Toggle xem) */}
        <div className="pt-2 border-t border-[#dadce0] dark:border-[#3c4043]">
          <button
            onClick={() => setShowSolution(!showSolution)}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#1a73e8] dark:text-[#8ab4f8] hover:text-[#1557b0] dark:hover:text-[#a8c7fa] cursor-pointer"
          >
            {showSolution ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span>{showSolution ? 'Thu gọn lời giải' : 'Xem lời giải chi tiết'}</span>
          </button>

          {showSolution && (
            <div className="mt-2.5 p-3.5 bg-[#f8f9fa] dark:bg-[#242424] rounded-xl border border-[#dadce0] dark:border-[#3c4043] text-xs text-[#202124] dark:text-[#e3e3e3] space-y-1.5 leading-relaxed font-serif">
              <div className="font-bold text-[#1a73e8] dark:text-[#8ab4f8] font-sans text-xs">Hướng dẫn giải từng bước:</div>
              <MathRenderer content={question.step_by_step_solution} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
