'use client';

import React, { useRef, useState } from 'react';
import { Question } from '@/types/exam';
import { ToolMenu } from './EditorToolbar';
import { MoreHorizontal } from 'lucide-react';
import { MathRenderer } from './MathRenderer';
import { QuestionEditor } from './QuestionEditor';
import { QuestionAiReview } from './QuestionAiReview';
import { captureQuestionAiBase, questionAiBaseMatches, type QuestionAiBase } from '@/lib/question-ai-review';
import { createAiProposal } from '@/lib/ai-proposal-journal';
import { useAiProposal } from '@/hooks/useAiProposal';
import { accountFetch } from '@/lib/account-fetch';
import { normalizeQuestion } from '@/lib/exam-document';
import { getCognitiveFramework } from '@/lib/education-catalog';
import { FigureView } from './FigureView';
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
import { formatPointsString } from '@/lib/scoring';
import { dbSaveQuestionToBank } from '@/lib/db';
import type { BankPassage } from '@/lib/question-client';
import type { KnowledgePackage, KnowledgeScope } from '@/lib/knowledge-package';
import { questionValueStamp, type QuestionManualSubmission } from '@/lib/question-draft';
import { confirmedUndoHistory, prepareQuestionUndo, type QuestionUndoEntry } from '@/lib/question-commands';

interface QuestionCardProps {
  withAi?: (action: () => void) => void;
  ownerId: string;
  documentId: string;
  sourceStamp: string;
  onManualSave: (submission: QuestionManualSubmission) => void;
  question: Question;
  cognitiveFrameworkId?: string;
  knowledgePackage?: KnowledgePackage;
  knowledgeScope?: KnowledgeScope;
  displayPoints?: number;
  numericScore?: boolean;
  passage?: BankPassage;
  index: number;
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
  withAi = action => action(),
  ownerId,
  documentId,
  sourceStamp,
  onManualSave,
  question,
  cognitiveFrameworkId,
  knowledgePackage,
  knowledgeScope,
  displayPoints,
  numericScore = true,
  passage,
  index,
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
  const proposalJournal = useAiProposal(ownerId, documentId, 'question', question.id);
  const pendingNewQuestion = proposalJournal.entry?.record?.kind === 'question' ? proposalJournal.entry.record : null;
  const [undoHistory, setUndoHistory] = useState<QuestionUndoEntry[]>([]);
  const [pendingUndo, setPendingUndo] = useState<QuestionManualSubmission | null>(null);
  const [undoMessage, setUndoMessage] = useState('');
  const activeUndoHistory = confirmedUndoHistory(undoHistory, pendingUndo ? questionValueStamp(pendingUndo.value) : undefined, question);
  const [redoHistory, setRedoHistory] = useState<QuestionUndoEntry[]>([]);
  const [pendingRedo, setPendingRedo] = useState<QuestionManualSubmission | null>(null);
  const activeRedoHistory = confirmedUndoHistory(redoHistory, pendingRedo ? questionValueStamp(pendingRedo.value) : undefined, question);
  const [bankSavedNotification, setBankSavedNotification] = useState(false);
  const bankSaveInFlight = useRef(false);
  const [bankSaving, setBankSaving] = useState(false);
  const [bankSaveError, setBankSaveError] = useState('');

  // Quản lý Thẩm định AI (Dual-Solve Verifier)
  const [isVerifying, setIsVerifying] = useState(false);
  const [verification, setVerification] = useState<{ base: QuestionAiBase; result: {
    isMatch: boolean;
    confidence: number;
    solvedAnswer: string;
    solutionSteps: string;
    discrepancies: string[];
    recommendation: string;
  } } | null>(null);
  const [showVerifyDetails, setShowVerifyDetails] = useState(false);
  const verificationCurrent = verification && questionAiBaseMatches(verification.base, ownerId, documentId, sourceStamp, question);
  const verifyResult = verification && verificationCurrent ? verification.result : null;

  // Xử lý gọi AI biến đổi vi mô
  const handleAiTweak = async (
    action: 'change_numbers' | 'similar_question' | 'increase_difficulty' | 'decrease_difficulty' | 'custom',
    customInstruction?: string
  ) => {
    if (pendingNewQuestion || isLoadingAi) return;
    const base = captureQuestionAiBase(ownerId, documentId, sourceStamp, question);
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
      const res = await accountFetch(ownerId, '/api/tweak-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: base.question,
          action,
          customInstruction,
          customApiKey: apiKey,
        }),
      });

      const data = await res.json();
      if (data.success && data.question) {
        normalizeQuestion({ ...data.question, id: base.question.id });
        createAiProposal({ kind: 'question', base, question: data.question });
      } else { alert(data.error || 'Chưa tạo được đề xuất sửa câu.'); }
    } catch (err) {
      console.error('Tweak failed:', err);
    } finally {
      setIsLoadingAi(false);
      setAiActionMessage(null);
      setShowCustomPrompt(false);
      setCustomPromptText('');
    }
  };

  // Hủy bỏ bản mới, giữ lại bản cũ
  const handleDiscardPendingQuestion = () => {
    proposalJournal.archive();
  };

  // Hoàn tác (Undo) về phiên bản trước
  const handleUndo = () => {
    const entry = activeUndoHistory[activeUndoHistory.length - 1];
    if (!entry) return;
    const submission = prepareQuestionUndo(question, sourceStamp, entry, ownerId, documentId);
    if (!submission) { setUndoMessage('Câu hoặc cấu hình đã đổi sau lần sửa này. Chưa hoàn tác để giữ bản mới; hãy đối chiếu trong Lịch sử.'); return; }
    setRedoHistory([...activeRedoHistory, { before: structuredClone(question), afterStamp: questionValueStamp(submission.value), sourceStamp }]); setPendingRedo(null);
    setUndoHistory(activeUndoHistory); setPendingUndo(submission); setUndoMessage('');
    onManualSave(submission);
  };
  const handleRedo = () => {
    const entry = activeRedoHistory.at(-1);
    if (!entry) return;
    const submission = prepareQuestionUndo(question, sourceStamp, entry, ownerId, documentId);
    if (!submission) { setUndoMessage('Câu hoặc cấu hình đã đổi. Chưa làm lại để giữ bản mới.'); return; }
    setUndoHistory([...activeUndoHistory, { before: structuredClone(question), afterStamp: questionValueStamp(submission.value), sourceStamp }]); setPendingUndo(null);
    setRedoHistory(activeRedoHistory); setPendingRedo(submission); setUndoMessage(''); onManualSave(submission);
  };

  // Lưu câu hỏi vào Ngân hàng câu hỏi cá nhân
  const handleSaveToBank = async () => {
    if (bankSaveInFlight.current || isEditing || pendingNewQuestion) return;
    bankSaveInFlight.current = true;
    setBankSaving(true);
    setBankSaveError('');
    setBankSavedNotification(false);
    try {
      await dbSaveQuestionToBank(question, ownerId, passage);
      setBankSavedNotification(true);
      setTimeout(() => setBankSavedNotification(false), 2500);
    } catch (err) {
      setBankSaveError(err instanceof Error ? err.message : 'Chưa lưu được câu hỏi vào ngân hàng');
    } finally { bankSaveInFlight.current = false; setBankSaving(false); }
  };

  // Thẩm định đáp án câu hỏi bằng AI Dual-Solve
  const handleVerifyQuestion = async () => {
    const base = captureQuestionAiBase(ownerId, documentId, sourceStamp, question);
    setIsVerifying(true);
    try {
      const res = await accountFetch(ownerId, '/api/verify-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: base.question, customApiKey: apiKey }),
      });
      const data = await res.json();
      if (data.success) {
        setVerification({ base, result: {
          isMatch: data.isMatch,
          confidence: data.confidence,
          solvedAnswer: data.solvedAnswer,
          solutionSteps: data.solutionSteps,
          discrepancies: data.discrepancies || [],
          recommendation: data.recommendation,
        } });
        setShowVerifyDetails(true);
      } else {
        alert(data.error || 'Kiểm định câu hỏi thất bại');
      }
    } catch (err) {
      console.error('Verify error:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  // Badge màu theo mức độ nhận thức Google Minimalist
  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'nhan_biet':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#e6f4ea] dark:bg-[#0f291e] text-[#137333] dark:text-[#5bb98c] border border-[#ceead6] dark:border-[#1e4a34]">Nhận biết</span>;
      case 'thong_hieu':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f1f3f4] dark:bg-[#292a2d] text-[#3c4043] dark:text-[#e3e3e3] border border-[#dadce0] dark:border-[#3c4043]">Thông hiểu</span>;
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
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f1f3f4] dark:bg-[#292a2d] text-[#3c4043] dark:text-[#e3e3e3] border border-[#dadce0] dark:border-[#3c4043]">Trắc nghiệm 4 lựa chọn</span>;
      case 'true_false_group':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f1f3f4] dark:bg-[#292a2d] text-[#3c4043] dark:text-[#e3e3e3] border border-[#dadce0] dark:border-[#3c4043]">Đúng / Sai (4 ý)</span>;
      case 'short_answer':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f1f3f4] dark:bg-[#292a2d] text-[#3c4043] dark:text-[#e3e3e3] border border-[#dadce0] dark:border-[#3c4043]">Trả lời ngắn</span>;
      case 'essay':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f1f3f4] dark:bg-[#292a2d] text-[#3c4043] dark:text-[#e3e3e3] border border-[#dadce0] dark:border-[#3c4043]">Tự luận</span>;
      default:
        return null;
    }
  };

  return (
    <div className={`bg-white dark:bg-[#202124] rounded-2xl border transition-all duration-200 overflow-hidden relative group ${
      isSelected
        ? 'border-[var(--ui-border)] dark:border-[#e3e3e3] ring-2 ring-[#e3e3e3]/30 shadow-xs'
        : 'border-[#dadce0] dark:border-[#3c4043] shadow-xs hover:shadow-xs'
    }`}>
      {/* Loading Overlay khi AI đang xử lý */}
      {isLoadingAi && (
        <div className="absolute inset-0 bg-white/85 dark:bg-[#202124]/85 backdrop-blur-xs z-20 flex flex-col items-center justify-center gap-2">
          <RefreshCw className="w-6 h-6 text-[#202124] dark:text-[#e3e3e3] animate-spin" />
          <span className="text-sm font-semibold text-[#202124] dark:text-[#e3e3e3]">{aiActionMessage}</span>
        </div>
      )}

      {/* Header của thẻ câu hỏi */}
      <div className="bg-[#f8f9fa] dark:bg-[#292a2d]/60 px-4 py-2.5 border-b border-[#dadce0] dark:border-[#3c4043] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {onToggleSelect && (
            <input
              type="checkbox"
              checked={isSelected || false}
              onChange={() => onToggleSelect(question.id)}
              title="Chọn câu hỏi này để gộp câu hoặc thao tác hàng loạt"
              aria-label={'Chọn câu ' + (index + 1)}
              className={'w-4 h-4 rounded lg:opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100 ' + (isSelected ? '!opacity-100 ' : '') + 'text-[var(--ui-accent)] focus:ring-[var(--ui-accent)] border-[#dadce0] cursor-pointer'}
            />
          )}
          <span className="w-7 h-7 rounded-full bg-[#202124] text-white dark:bg-[#303134] dark:text-[#e3e3e3] dark:border dark:border-[#3c4043] font-bold text-xs flex items-center justify-center shadow-2xs">
            {index + 1}
          </span>
          {getTypeBadge(question.type)}
          {question.cognitiveLevel && <span className="px-2 py-1 text-xs rounded bg-neutral-50 text-[var(--ui-accent)]">{getCognitiveFramework(cognitiveFrameworkId)?.levels.find(level => level.id === question.cognitiveLevel)?.label ?? 'Mức cần kiểm tra'}</span>}
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800">
            {numericScore ? displayPoints === undefined ? 'Chưa đặt điểm' : formatPointsString(displayPoints) : 'Không chấm điểm số'}
          </span>

          {/* Nút Hoàn tác (Undo) nếu có lịch sử */}
          {activeRedoHistory.length > 0 && <button type="button" onClick={handleRedo}>Làm lại câu ({activeRedoHistory.length})</button>}
          {activeUndoHistory.length > 0 && (
            <button
              onClick={handleUndo}
              title={`Hoàn tác về phiên bản trước (còn ${activeUndoHistory.length} bản lưu)`}
              className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-[#f1f3f4] dark:bg-[#292a2d] text-[#3c4043] dark:text-[#e3e3e3] hover:bg-[#e8eaed] dark:hover:bg-[#383a3d] border border-[#dadce0] dark:border-[#3c4043] transition-colors"
            >
              <Undo2 className="w-3 h-3" />
              <span>Hoàn tác ({activeUndoHistory.length})</span>
            </button>
          )}

          {bankSavedNotification && (
            <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
              <Check className="w-3 h-3" /> Đã lưu bản sao riêng vào ngân hàng
            </span>
          )}
          {bankSaveError && <span role="alert" className="text-xs text-red-600">{bankSaveError}</span>}
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          <button type="button" aria-label={'Sửa câu ' + (index + 1)} title="Sửa nội dung câu hỏi thủ công" onClick={() => setIsEditing(!isEditing)} className="app-button-secondary px-3 min-h-9 text-xs inline-flex gap-1 items-center"><Edit3 className="w-3.5 h-3.5" />Sửa</button>
          <ToolMenu label={'AI câu ' + (index + 1)} Icon={Sparkles} items={[
            { label: 'Đổi số liệu', title: 'Đổi số liệu bài toán bằng AI', disabled: isLoadingAi || !!pendingNewQuestion, onClick: () => withAi(() => void handleAiTweak('change_numbers')) },
            { label: 'Tạo câu tương đương', title: 'Tạo câu hỏi tương đương bằng AI', disabled: isLoadingAi || !!pendingNewQuestion, onClick: () => withAi(() => void handleAiTweak('similar_question')) },
            { label: isVerifying ? 'Đang thẩm định…' : 'Thẩm định', disabled: isVerifying, onClick: () => withAi(() => void handleVerifyQuestion()) },
            ...(onAskAiAboutQuestion ? [{ label: 'Bảo AI sửa', onClick: () => withAi(() => onAskAiAboutQuestion(index)) }] : [])
          ]} />
          <ToolMenu label={'Thao tác câu ' + (index + 1)} compact Icon={MoreHorizontal} items={[
            ...(onMoveUp ? [{ label: 'Di chuyển lên', disabled: isFirst, onClick: onMoveUp }] : []),
            ...(onMoveDown ? [{ label: 'Di chuyển xuống', disabled: isLast, onClick: onMoveDown }] : []),
            ...(onDuplicate ? [{ label: 'Nhân bản câu', onClick: onDuplicate }] : []),
            { label: 'Lưu bản sao vào ngân hàng', disabled: bankSaving || isEditing || !!pendingNewQuestion, onClick: () => void handleSaveToBank() },
            { label: 'Xóa câu hỏi này', onClick: () => onDelete(question.id) }
          ]} />
        </div>
      </div>

      {/* KHUNG KẾT QUẢ THẨM ĐỊNH DUAL-SOLVE AI */}
      {verification && !verificationCurrent && <p role="alert" className="m-3 text-sm text-amber-700">Câu hoặc phạm vi đã đổi từ khi rà soát. Kết quả AI cũ chưa được dùng cho bản hiện tại; hãy rà soát lại khi cần.</p>}
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
                  <span>AI đề xuất đáp án khớp — cần giáo viên duyệt</span>
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
            <div className="p-2.5 bg-white dark:bg-[#292a2d] rounded-xl border border-[#dadce0] dark:border-[#3c4043]">
              <span className="text-[#5f6368] dark:text-[#9aa0a6] font-semibold block text-[11px]">Đáp án hiện tại trong đề:</span>
              <span className="text-[#202124] dark:text-[#e3e3e3] font-bold font-mono text-sm">{question.correct_answer || 'Chưa thiết lập'}</span>
            </div>
            <div className="p-2.5 bg-white dark:bg-[#292a2d] rounded-xl border border-[#dadce0] dark:border-[#3c4043]">
              <span className="text-[#5f6368] dark:text-[#9aa0a6] font-semibold block text-[11px]">AI thẩm định giải độc lập ra:</span>
              <span className={`font-mono text-sm ${verifyResult.isMatch ? 'text-emerald-700 dark:text-emerald-300 font-bold' : 'text-amber-800 dark:text-amber-300 font-semibold'}`}>
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

          <div className="p-2.5 bg-white dark:bg-[#292a2d] rounded-xl border border-[#dadce0] dark:border-[#3c4043] leading-relaxed font-serif text-[#202124] dark:text-[#e3e3e3]">
            <span className="font-bold font-sans text-[#5f6368] dark:text-[#9aa0a6] block text-[11px] mb-1">Lời giải kiểm định độc lập của AI:</span>
            <MathRenderer content={verifyResult.solutionSteps} />
          </div>
        </div>
      )}

      {/* KHUNG DIFF PREVIEW: SO SÁNH BẢN CŨ VS BẢN MỚI TỪ AI */}
      {pendingNewQuestion && (
        <QuestionAiReview key={proposalJournal.entry!.key} base={pendingNewQuestion.base} candidate={pendingNewQuestion.question} ownerId={ownerId} documentId={documentId} sourceStamp={sourceStamp} question={question}
          onSubmit={submission => { setUndoHistory(activeUndoHistory); setPendingUndo(null); onManualSave(submission); }}
          onApplied={(before, after) => { setUndoHistory([...activeUndoHistory, { before, afterStamp: questionValueStamp(after), sourceStamp }]); setPendingUndo(null); setRedoHistory([]); setPendingRedo(null); setUndoMessage(''); setVerification(null); proposalJournal.archive(); }}
          onDiscard={handleDiscardPendingQuestion} />
      )}

      {/* Nội dung câu hỏi chính */}
      {proposalJournal.notice && <p role="status" className="m-3 text-sm text-amber-700">{proposalJournal.notice}</p>}
      <div className="p-4 space-y-3">
        {undoMessage && <p role="alert" className="text-sm text-amber-700">{undoMessage}</p>}
        {isEditing ? (
          <QuestionEditor ownerId={ownerId} documentId={documentId} sourceStamp={sourceStamp} question={question} frameworkId={cognitiveFrameworkId} knowledgePackage={knowledgePackage} knowledgeScope={knowledgeScope} onCancel={() => setIsEditing(false)} onSave={submission => { setUndoHistory(activeUndoHistory); setPendingUndo(null); onManualSave(submission); }} onApplied={previous => { setUndoHistory([...activeUndoHistory, { before: previous, afterStamp: questionValueStamp(question), sourceStamp }]); setPendingUndo(null); setRedoHistory([]); setPendingRedo(null); setUndoMessage(''); setVerification(null); setIsEditing(false); }} />
        ) : (
          <div className="text-sm text-[#202124] dark:text-[#e3e3e3] leading-relaxed font-serif">
            <MathRenderer content={question.content} />
          </div>
        )}

        {!isEditing && question.passageId && <details className="border rounded p-3"><summary className="cursor-pointer text-sm">{passage?.title || 'Ngữ liệu dùng chung'}</summary>{passage ? <><MathRenderer content={passage.content} />{passage.figures?.map(figure => <FigureView key={figure.id} figure={figure} />)}{passage.source && <p className="text-xs italic">{passage.source}</p>}</> : <p role="note">Chưa tìm thấy ngữ liệu liên kết. Hãy bổ sung trong phần ngữ liệu của đề.</p>}</details>}

        {/* Render Hình vẽ / Bảng biến thiên (figures) nếu có */}
        {!isEditing && question.figures && question.figures.length > 0 && (
          <div className="my-2 space-y-2">
            {question.figures.map(figure => <FigureView key={figure.id} figure={figure} />)}
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
                  {sub.isCorrect === undefined ? 'CHƯA CÓ ĐÁP ÁN' : sub.isCorrect ? 'ĐÚNG' : 'SAI'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* TRẢ LỜI NGẮN (Short Answer) */}
        {!isEditing && question.type === 'short_answer' && (
          <div className="p-3 bg-[#e6f4ea]/80 dark:bg-[#0f291e] border border-[#ceead6] dark:border-[#1e4a34] rounded-xl flex items-center gap-3 text-xs">
            <span className="font-bold text-[#137333] dark:text-[#5bb98c]">Đáp số chuẩn xác:</span>
            <span className="px-3 py-1 bg-white dark:bg-[#202124] font-mono font-bold text-[#137333] dark:text-[#5bb98c] border border-[#ceead6] dark:border-[#1e4a34] rounded-lg shadow-2xs">
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
                  <table className="w-full border-collapse border border-[#feefc3] dark:border-[#533f16] text-left bg-white dark:bg-[#202124] rounded-lg overflow-hidden">
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
          <div className="p-3 bg-[#f1f3f4]/80 dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-xl space-y-2 text-xs">
            <span className="font-bold text-[#3c4043] dark:text-[#e3e3e3] block">Đáp án điền từ vào chỗ trống:</span>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-white dark:bg-[#202124] font-mono font-bold text-[#3c4043] dark:text-[#e3e3e3] border border-[#dadce0] dark:border-[#3c4043] rounded-lg shadow-2xs">
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
          <div className="p-3 bg-[#f1f3f4]/80 dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] rounded-xl space-y-2 text-xs">
            <span className="font-bold text-[#3c4043] dark:text-[#e3e3e3] block">Ghép nối tương ứng:</span>
            <div className="text-[#3c4043] dark:text-[#e3e3e3] font-mono font-bold">
              {question.matchingPairs?.map(pair => `${pair.left} → ${pair.right}`).join('; ') || question.correct_answer || 'Chưa thiết lập'}
            </div>
          </div>
        )}

        {/* Lời giải chi tiết (Toggle xem) */}
        <div className="pt-2 border-t border-[#dadce0] dark:border-[#3c4043]">
          <button
            onClick={() => setShowSolution(!showSolution)}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#3c4043] dark:text-[#e3e3e3] hover:text-[#303134] dark:hover:text-[#f1f3f4] cursor-pointer"
          >
            {showSolution ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span>{showSolution ? 'Thu gọn lời giải' : 'Xem lời giải chi tiết'}</span>
          </button>

          {showSolution && (
            <div className="mt-2.5 p-3.5 bg-[#f8f9fa] dark:bg-[#242424] rounded-xl border border-[#dadce0] dark:border-[#3c4043] text-xs text-[#202124] dark:text-[#e3e3e3] space-y-1.5 leading-relaxed font-serif">
              <div className="font-bold text-[#3c4043] dark:text-[#e3e3e3] font-sans text-xs">Hướng dẫn giải từng bước:</div>
              <MathRenderer content={question.step_by_step_solution} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
