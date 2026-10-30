'use client';

import { projectScopedQuestionEdit } from '@/lib/scoped-question-edit';
import { useEditorActor } from './editor/EditorSelection';
import React, { useRef, useState } from 'react';
import { Question } from '@/types/exam';
import { ToolMenu, type MenuItem } from './EditorToolbar';
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
  Edit3,
  Check,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Undo2,
  X,
  ShieldCheck,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Lock,
  Unlock,
} from 'lucide-react';
import { dbSaveQuestionToBank } from '@/lib/db';
import type { BankPassage } from '@/lib/question-client';
import type { KnowledgePackage, KnowledgeScope } from '@/lib/knowledge-package';
import { questionValueStamp, type QuestionManualSubmission } from '@/lib/question-draft';
import { confirmedUndoHistory, prepareQuestionUndo, type QuestionUndoEntry } from '@/lib/question-commands';

interface QuestionCardProps {
  selectionActive?: boolean;
  displayNumber?: number;
  extraItems?: MenuItem[];
  hidePassage?: boolean;
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
  displayNumber,
  extraItems = [],
  selectionActive = false,
  hidePassage = false,
  withAi = (action) => action(),
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
  const [imageChoice, setImageChoice] = useState<string>();
  const [scopedAi, setScopedAi] = useState<{ field: string; instruction: string } | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiActionMessage, setAiActionMessage] = useState<string | null>(null);

  // Text editing has one durable controller: QuestionEditor.
  const contentDraft = question.content;
  const choicesDraft = question.choices || [];
  const solutionDraft = question.step_by_step_solution || '';
  const shortAnswerDraft = question.correct_answer || '';
  const acceptedAnswersDraft = (question.accepted_answers ?? []).join('; ');
  const subsDraft = question.sub_questions || [];

  // Lưu nhanh trực tiếp (Chọn nội dung để sửa)
  const handleSaveInline = (patch: Partial<Question>) => {
    const updated: Question = {
      ...question,
      ...patch,
      status: 'draft',
      verifiedBy: 'none',
      version: (question.version ?? 1) + 1,
    };
    try {
      normalizeQuestion(updated);
    } catch (err) {
      console.error('Normalization error:', err);
      return;
    }
    setUndoHistory([
      ...activeUndoHistory,
      { before: structuredClone(question), afterStamp: questionValueStamp(updated), sourceStamp },
    ]);
    setPendingUndo(null);
    setRedoHistory([]);
    setPendingRedo(null);
    setUndoMessage('');
    setVerification(null);
    onManualSave({
      ownerId,
      documentId,
      questionId: question.id,
      baseStamp: questionValueStamp(question),
      baseSourceStamp: sourceStamp,
      token: crypto.randomUUID(),
      value: updated,
    });
  };

  // Quản lý Diff Preview & Undo
  const proposalJournal = useAiProposal(ownerId, documentId, 'question', question.id);
  const pendingNewQuestion =
    proposalJournal.entry?.record?.kind === 'question' ? proposalJournal.entry.record : null;
  const [undoHistory, setUndoHistory] = useState<QuestionUndoEntry[]>([]);
  const [pendingUndo, setPendingUndo] = useState<QuestionManualSubmission | null>(null);
  const [undoMessage, setUndoMessage] = useState('');
  const activeUndoHistory = confirmedUndoHistory(
    undoHistory,
    pendingUndo ? questionValueStamp(pendingUndo.value) : undefined,
    question,
  );
  const [redoHistory, setRedoHistory] = useState<QuestionUndoEntry[]>([]);
  const [pendingRedo, setPendingRedo] = useState<QuestionManualSubmission | null>(null);
  const activeRedoHistory = confirmedUndoHistory(
    redoHistory,
    pendingRedo ? questionValueStamp(pendingRedo.value) : undefined,
    question,
  );
  const [bankSavedNotification, setBankSavedNotification] = useState(false);
  const bankSaveInFlight = useRef(false);
  const [bankSaving, setBankSaving] = useState(false);
  const [bankSaveError, setBankSaveError] = useState('');

  // Quản lý Thẩm định AI (Dual-Solve Verifier)
  const [isVerifying, setIsVerifying] = useState(false);
  const [verification, setVerification] = useState<{
    base: QuestionAiBase;
    result: {
      isMatch: boolean;
      confidence: number;
      solvedAnswer: string;
      solutionSteps: string;
      discrepancies: string[];
      recommendation: string;
    };
  } | null>(null);
  const [showVerifyDetails, setShowVerifyDetails] = useState(false);
  const verificationCurrent =
    verification && questionAiBaseMatches(verification.base, ownerId, documentId, sourceStamp, question);
  const verifyResult = verification && verificationCurrent ? verification.result : null;

  // Xử lý gọi AI biến đổi vi mô
  const handleAiTweak = async (
    action: 'change_numbers' | 'similar_question' | 'increase_difficulty' | 'decrease_difficulty' | 'custom',
    customInstruction?: string,
    scopedField?: string,
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
        const proposal = scopedField ? projectScopedQuestionEdit(base.question, data.question, scopedField) : data.question;
        normalizeQuestion({ ...proposal, id: base.question.id });
        createAiProposal({ kind: 'question', base, question: proposal });
      } else {
        alert(data.error || 'Chưa tạo được đề xuất sửa câu.');
      }
    } catch (err) {
      setUndoMessage(err instanceof Error ? err.message : 'Chưa tạo được đề xuất AI; nội dung gốc vẫn được giữ.');
    } finally {
      setIsLoadingAi(false);
      setAiActionMessage(null);
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
    if (!submission) {
      setUndoMessage(
        'Câu hoặc cấu hình đã đổi sau lần sửa này. Chưa hoàn tác để giữ bản mới; hãy đối chiếu trong Lịch sử.',
      );
      return;
    }
    setRedoHistory([
      ...activeRedoHistory,
      { before: structuredClone(question), afterStamp: questionValueStamp(submission.value), sourceStamp },
    ]);
    setPendingRedo(null);
    setUndoHistory(activeUndoHistory);
    setPendingUndo(submission);
    setUndoMessage('');
    onManualSave(submission);
  };
  const handleRedo = () => {
    const entry = activeRedoHistory.at(-1);
    if (!entry) return;
    const submission = prepareQuestionUndo(question, sourceStamp, entry, ownerId, documentId);
    if (!submission) {
      setUndoMessage('Câu hoặc cấu hình đã đổi. Chưa làm lại để giữ bản mới.');
      return;
    }
    setUndoHistory([
      ...activeUndoHistory,
      { before: structuredClone(question), afterStamp: questionValueStamp(submission.value), sourceStamp },
    ]);
    setPendingUndo(null);
    setRedoHistory(activeRedoHistory);
    setPendingRedo(submission);
    setUndoMessage('');
    onManualSave(submission);
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
    } finally {
      bankSaveInFlight.current = false;
      setBankSaving(false);
    }
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
        setVerification({
          base,
          result: {
            isMatch: data.isMatch,
            confidence: data.confidence,
            solvedAnswer: data.solvedAnswer,
            solutionSteps: data.solutionSteps,
            discrepancies: data.discrepancies || [],
            recommendation: data.recommendation,
          },
        });
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
  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'multiple_choice':
        return (
          <span
            className={
              'px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--ui-surface-variant)] dark:bg-[var(--ui-surface-variant)] ' +
              'text-[var(--ui-text-primary)] dark:text-[var(--ui-text-primary)] border border-[var(--ui-border)] ' +
              'dark:border-[var(--ui-border)]'
            }
          >
            Trắc nghiệm 4 lựa chọn
          </span>
        );
      case 'true_false_group':
        return (
          <span
            className={
              'px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--ui-surface-variant)] dark:bg-[var(--ui-surface-variant)] ' +
              'text-[var(--ui-text-primary)] dark:text-[var(--ui-text-primary)] border border-[var(--ui-border)] ' +
              'dark:border-[var(--ui-border)]'
            }
          >
            Đúng / Sai (4 ý)
          </span>
        );
      case 'short_answer':
        return (
          <span
            className={
              'px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--ui-surface-variant)] dark:bg-[var(--ui-surface-variant)] ' +
              'text-[var(--ui-text-primary)] dark:text-[var(--ui-text-primary)] border border-[var(--ui-border)] ' +
              'dark:border-[var(--ui-border)]'
            }
          >
            Trả lời ngắn
          </span>
        );
      case 'essay':
        return (
          <span
            className={
              'px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--ui-surface-variant)] dark:bg-[var(--ui-surface-variant)] ' +
              'text-[var(--ui-text-primary)] dark:text-[var(--ui-text-primary)] border border-[var(--ui-border)] ' +
              'dark:border-[var(--ui-border)]'
            }
          >
            Tự luận
          </span>
        );
      default:
        return null;
    }
  };

  const editorActor = useEditorActor(question.id, `Câu ${displayNumber ?? index + 1}`, (field) => {
    const choice = field?.startsWith('Phương án ') ? field.slice('Phương án '.length) : undefined;
    return [
      { label: isEditing ? 'Đóng sửa chi tiết' : 'Chỉnh nội dung', run: () => setIsEditing(!isEditing) },
      ...(choice ? [{ label: `Hình trong ${choice}`, disabled: isLocked, run: () => { setImageChoice(choice); setIsEditing(true); } }, { label: `Đặt ${choice} làm đáp án đúng`, disabled: isLocked || isEditing || isLoadingAi,
        run: () => handleSaveInline({ correct_answer: choice }) }] : []),
      { label: showSolution ? 'Thu lời giải' : 'Xem lời giải', run: () => setShowSolution(!showSolution) },
      ...(field && (['Nội dung câu', 'Lời giải'].includes(field) || field.startsWith('Phương án ') || field.startsWith('Mệnh đề ')) && !isEditing ? [{ label: `AI sửa ${field}`, disabled: isLoadingAi || !!pendingNewQuestion, run: () => setScopedAi({ field, instruction: '' }) }] : []),
      ...(onAskAiAboutQuestion ? [{ label: 'Hỏi AI về cả câu', disabled: isLoadingAi || !!pendingNewQuestion, run: () => withAi(() => onAskAiAboutQuestion(index)) }] : []),
      ...(onMoveUp ? [{ label: 'Lên', disabled: isFirst || isEditing, run: onMoveUp }] : []),
      ...(onMoveDown ? [{ label: 'Xuống', disabled: isLast || isEditing, run: onMoveDown }] : []),
      ...(onDuplicate ? [{ label: 'Nhân bản câu', disabled: isEditing, run: onDuplicate }] : []),
      { label: isLocked ? 'Mở sửa nhanh' : 'Chống sửa nhầm', disabled: isEditing, run: () => setIsLocked(!isLocked) },
      { label: 'Đổi số liệu bằng AI (cả câu)', disabled: isLoadingAi || !!pendingNewQuestion, run: () => withAi(() => void handleAiTweak('change_numbers')) },
      { label: 'Tạo câu tương đương', disabled: isLoadingAi || !!pendingNewQuestion, run: () => withAi(() => void handleAiTweak('similar_question')) },
      { label: 'Thẩm định bằng AI', disabled: isVerifying, run: () => withAi(() => void handleVerifyQuestion()) },
      { label: 'Lưu bản sao vào ngân hàng', disabled: bankSaving || isEditing || !!pendingNewQuestion, run: () => void handleSaveToBank() },
      ...extraItems.map((item) => ({ label: item.label, disabled: item.disabled || isEditing || !!pendingNewQuestion, run: item.onClick })),
      { label: 'Xóa câu này', disabled: isEditing || isLoadingAi, run: () => { if (window.confirm('Xóa câu đang chọn khỏi đề?')) onDelete(question.id); } },
    ];
  });

  return (
    <div
      onClickCapture={(event) => {
        const field = (event.target as HTMLElement).closest<HTMLElement>('[data-editor-field]')?.dataset.editorField;
        editorActor.choose(field);
      }}
      onFocusCapture={(event) => editorActor.choose((event.target as HTMLElement).closest<HTMLElement>('[data-editor-field]')?.dataset.editorField)}
      data-editor-active={editorActor.active || undefined}
      className={`@container min-w-0 bg-[var(--ui-surface)] rounded-xl border transition-all duration-150 overflow-hidden relative group ${
        (isSelected || editorActor.active)
          ? 'border-[var(--ui-primary)] ring-2 ring-[var(--ui-primary)]/20 shadow-xs'
          : 'border-[var(--ui-border)] hover:border-[var(--ui-border)]/80 shadow-2xs'
      }`}
    >
      {/* Loading Overlay khi AI đang xử lý */}
      {isLoadingAi && (
        <div className="absolute inset-0 bg-[var(--ui-surface)]/85 backdrop-blur-xs z-20 flex flex-col items-center justify-center gap-2">
          <RefreshCw className="w-6 h-6 text-[var(--ui-text-primary)] animate-spin" />
          <span className="text-sm font-semibold text-[var(--ui-text-primary)]">
            {aiActionMessage}
          </span>
        </div>
      )}

      {/* Header của thẻ câu hỏi */}
      <div
        className={
          'px-4 pt-3 pb-2 border-b border-[var(--ui-border)]/40 flex flex-wrap items-center justify-between gap-2'
        }
      >
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          {onToggleSelect && (
            <input
              type="checkbox"
              checked={isSelected || false}
              onChange={() => onToggleSelect(question.id)}
              title="Chọn câu hỏi này để gộp câu hoặc thao tác hàng loạt"
              aria-label={'Chọn câu ' + (index + 1)}
              className={
                'w-4 h-4 rounded lg:opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100 ' +
                (isSelected || selectionActive ? '!opacity-100 ' : '') +
                'text-[var(--ui-accent)] focus:ring-[var(--ui-accent)] border-[var(--ui-border)] cursor-pointer'
              }
            />
          )}
          <span
            className={
              'px-2 py-0.5 rounded-md bg-[var(--ui-surface-variant)] text-[var(--ui-text-primary)] font-bold text-xs flex items-center justify-center'
            }
          >
            Câu {displayNumber ?? index + 1}
          </span>
          {getTypeBadge(question.type)}
          {question.cognitiveLevel && (
            <span className="px-2 py-0.5 text-xs rounded bg-neutral-100 dark:bg-neutral-800 text-[var(--ui-text-secondary)] font-medium">
              {getCognitiveFramework(cognitiveFrameworkId)?.levels.find(
                (level) => level.id === question.cognitiveLevel,
              )?.label ?? 'Mức cần kiểm tra'}
            </span>
          )}
          {numericScore ? (
            <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 rounded px-2 py-0.5">
              <span className="text-[11px] font-semibold text-amber-900 dark:text-amber-300">Điểm:</span>
              <input
                type="number"
                step="0.25"
                min="0"
                disabled={isLocked}
                value={displayPoints !== undefined ? displayPoints : (question.points ?? '')}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val) && val >= 0) {
                    handleSaveInline({ points: val });
                  } else if (e.target.value === '') {
                    handleSaveInline({ points: undefined });
                  }
                }}
                title={isLocked ? 'Điểm số câu này' : 'Nhập điểm số câu này'}
                placeholder="0"
                className="w-12 text-xs font-bold font-mono text-center rounded border border-transparent hover:border-amber-300 focus:border-blue-400 bg-white/80 dark:bg-neutral-900 focus:outline-none"
              />
            </div>
          ) : (
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300">
              Không chấm điểm số
            </span>
          )}

          {/* Nút Hoàn tác (Undo) nếu có lịch sử */}
          {activeRedoHistory.length > 0 && (
            <button type="button" onClick={handleRedo}>
              Làm lại câu ({activeRedoHistory.length})
            </button>
          )}
          {activeUndoHistory.length > 0 && (
            <button
              onClick={handleUndo}
              title={`Hoàn tác về phiên bản trước (còn ${activeUndoHistory.length} bản lưu)`}
              className={
                'flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-[var(--ui-surface-variant)] ' +
                'dark:bg-[var(--ui-surface-variant)] text-[var(--ui-text-primary)] dark:text-[var(--ui-text-primary)] hover:bg-[#e8eaed] ' +
                'dark:hover:bg-[#383a3d] border border-[var(--ui-border)] dark:border-[var(--ui-border)] transition-colors'
              }
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
          {bankSaveError && (
            <span role="alert" className="text-xs text-red-600">
              {bankSaveError}
            </span>
          )}
        </div>

        <div className={editorActor.enabled ? 'hidden' : 'flex items-center gap-1 flex-wrap'}>
          <button
            type="button"
            aria-label={isLocked ? 'Mở khóa sửa câu ' + (index + 1) : 'Khóa an toàn câu ' + (index + 1)}
            title={
              isLocked
                ? 'Đang khóa (Chế độ xem an toàn). Nhấn để mở khóa sửa nhanh'
                : 'Đang mở (Chọn nội dung để sửa). Nhấn để khóa an toàn'
            }
            onClick={() => {
              setIsLocked(!isLocked);
            }}
            className={`px-2.5 py-1 min-h-9 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-all cursor-pointer border ${
              isLocked
                ? 'bg-amber-50/90 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300 hover:bg-amber-100'
                : 'bg-emerald-50/80 border-emerald-200/90 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300'
            }`}
          >
            {isLocked ? (
              <>
                <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span className="@max-[480px]:hidden font-semibold">Đã khóa</span>
              </>
            ) : (
              <>
                <Unlock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="@max-[480px]:hidden font-semibold">Mở sửa</span>
              </>
            )}
          </button>
          {onMoveUp && (
            <button
              type="button"
              aria-label={'Di chuyển lên câu ' + (index + 1)}
              title="Di chuyển câu hỏi lên trên"
              disabled={isFirst}
              onClick={onMoveUp}
              className="p-1.5 rounded-lg text-[var(--ui-text-secondary)] hover:text-[var(--ui-text-primary)] hover:bg-[var(--ui-surface-variant)] disabled:opacity-25 disabled:pointer-events-none transition-all cursor-pointer"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          )}
          {onMoveDown && (
            <button
              type="button"
              aria-label={'Di chuyển xuống câu ' + (index + 1)}
              title="Di chuyển câu hỏi xuống dưới"
              disabled={isLast}
              onClick={onMoveDown}
              className="p-1.5 rounded-lg text-[var(--ui-text-secondary)] hover:text-[var(--ui-text-primary)] hover:bg-[var(--ui-surface-variant)] disabled:opacity-25 disabled:pointer-events-none transition-all cursor-pointer"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            aria-label={'Sửa câu ' + (index + 1)}
            title="Sửa nội dung câu hỏi thủ công"
            onClick={() => setIsEditing(!isEditing)}
            className="app-button-secondary px-3 min-h-9 text-xs inline-flex gap-1 items-center"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Sửa
          </button>
          <ToolMenu
            label={'AI câu ' + (index + 1)}
            Icon={Sparkles}
            items={[
              {
                label: 'Đổi số liệu',
                title: 'Đổi số liệu bài toán bằng AI',
                disabled: isLoadingAi || !!pendingNewQuestion,
                onClick: () => withAi(() => void handleAiTweak('change_numbers')),
              },
              {
                label: 'Tạo câu tương đương',
                title: 'Tạo câu hỏi tương đương bằng AI',
                disabled: isLoadingAi || !!pendingNewQuestion,
                onClick: () => withAi(() => void handleAiTweak('similar_question')),
              },
              {
                label: isVerifying ? 'Đang thẩm định…' : 'Thẩm định',
                disabled: isVerifying,
                onClick: () => withAi(() => void handleVerifyQuestion()),
              },
              ...(onAskAiAboutQuestion
                ? [{ label: 'Bảo AI sửa', onClick: () => withAi(() => onAskAiAboutQuestion(index)) }]
                : []),
            ]}
          />
          <ToolMenu
            label={'Thao tác câu ' + (index + 1)}
            compact
            Icon={MoreHorizontal}
            items={[
              ...(onMoveUp ? [{ label: 'Di chuyển lên', disabled: isFirst, onClick: onMoveUp }] : []),
              ...(onMoveDown ? [{ label: 'Di chuyển xuống', disabled: isLast, onClick: onMoveDown }] : []),
              ...(onDuplicate ? [{ label: 'Nhân bản câu', onClick: onDuplicate }] : []),
              {
                label: 'Lưu bản sao vào ngân hàng',
                disabled: bankSaving || isEditing || !!pendingNewQuestion,
                onClick: () => void handleSaveToBank(),
              },
              ...extraItems.map((item) => ({
                ...item,
                disabled: item.disabled || isEditing || !!pendingNewQuestion,
              })),
              { label: 'Xóa câu hỏi này', onClick: () => onDelete(question.id) },
            ]}
          />
        </div>
      </div>

      {scopedAi && <form className="m-3 border rounded-lg p-3 space-y-2" onSubmit={event => {
        event.preventDefault();
        const captured = { ...scopedAi };
        if (!captured.instruction.trim()) return;
        withAi(() => void handleAiTweak('custom', `Chỉ sửa ${captured.field}. Giữ các trường khác và đáp án. Yêu cầu: ${captured.instruction}`, captured.field));
      }}>
        <p className="text-sm font-medium">Phạm vi AI: {scopedAi.field}</p>
        <label className="block text-sm">Yêu cầu<textarea aria-label="Yêu cầu AI cho vùng chọn" className="w-full border rounded p-2 bg-transparent" value={scopedAi.instruction} onChange={e => setScopedAi({ ...scopedAi, instruction: e.target.value })} /></label>
        <p className="text-xs">AI chỉ đề xuất sửa vùng này. Kiểm lại đáp án và lời giải sau khi đổi nội dung.</p>
        <div className="flex flex-wrap gap-2"><button type="submit" disabled={!scopedAi.instruction.trim() || isLoadingAi || !!pendingNewQuestion} className="app-button-secondary min-h-11 px-3 rounded">Tạo đề xuất</button><button type="button" className="app-button-secondary min-h-11 px-3 rounded" onClick={() => setScopedAi(null)}>Đóng</button></div>
      </form>}
      {/* KHUNG KẾT QUẢ THẨM ĐỊNH DUAL-SOLVE AI */}
      {verification && !verificationCurrent && (
        <p role="alert" className="m-3 text-sm text-amber-700">
          Câu hoặc phạm vi đã đổi từ khi rà soát. Kết quả AI cũ chưa được dùng cho bản hiện tại; hãy rà soát
          lại khi cần.
        </p>
      )}
      {verifyResult && showVerifyDetails && (
        <div
          className={`m-3 p-3.5 rounded-xl border text-xs space-y-2.5 transition-all ${
            verifyResult.isMatch
              ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
              : 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200'
          }`}
        >
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
              className="text-[var(--ui-text-secondary)] hover:text-[var(--ui-text-primary)] dark:text-[var(--ui-text-secondary)] dark:hover:text-[#e3e3e3] p-0.5 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 @min-[500px]:grid-cols-2 gap-2 pt-1 font-sans">
            <div className="p-2.5 bg-[var(--ui-surface)] dark:bg-[var(--ui-surface-variant)] rounded-xl border border-[var(--ui-border)] dark:border-[var(--ui-border)]">
              <span className="text-[var(--ui-text-secondary)] dark:text-[var(--ui-text-secondary)] font-semibold block text-[11px]">
                Đáp án hiện tại trong đề:
              </span>
              <span className="text-[var(--ui-text-primary)] dark:text-[var(--ui-text-primary)] font-bold font-mono text-sm">
                {question.correct_answer || 'Chưa thiết lập'}
              </span>
            </div>
            <div className="p-2.5 bg-[var(--ui-surface)] dark:bg-[var(--ui-surface-variant)] rounded-xl border border-[var(--ui-border)] dark:border-[var(--ui-border)]">
              <span className="text-[var(--ui-text-secondary)] dark:text-[var(--ui-text-secondary)] font-semibold block text-[11px]">
                AI thẩm định giải độc lập ra:
              </span>
              <span
                className={`font-mono text-sm ${verifyResult.isMatch ? 'text-emerald-700 dark:text-emerald-300 font-bold' : 'text-amber-800 dark:text-amber-300 font-semibold'}`}
              >
                {verifyResult.solvedAnswer}
              </span>
            </div>
          </div>

          {verifyResult.discrepancies.length > 0 && (
            <div className="p-2.5 bg-amber-100/70 dark:bg-amber-950/60 rounded-xl border border-amber-200 dark:border-amber-800 space-y-1">
              <span className="font-bold text-amber-900 dark:text-amber-200 block text-[11px]">
                Điểm sai lệch / Cần lưu ý:
              </span>
              {verifyResult.discrepancies.map((d, i) => (
                <div
                  key={i}
                  className="text-amber-900 dark:text-amber-200 leading-tight flex items-start gap-1"
                >
                  <span>•</span>
                  <span>{d}</span>
                </div>
              ))}
            </div>
          )}

          <div
            className={
              'p-2.5 bg-[var(--ui-surface)] dark:bg-[var(--ui-surface-variant)] rounded-xl border border-[var(--ui-border)] ' +
              'dark:border-[var(--ui-border)] leading-relaxed font-serif text-[var(--ui-text-primary)] ' +
              'dark:text-[var(--ui-text-primary)]'
            }
          >
            <span className="font-bold font-sans text-[var(--ui-text-secondary)] dark:text-[var(--ui-text-secondary)] block text-[11px] mb-1">
              Lời giải kiểm định độc lập của AI:
            </span>
            <MathRenderer content={verifyResult.solutionSteps} />
          </div>
        </div>
      )}

      {/* KHUNG DIFF PREVIEW: SO SÁNH BẢN CŨ VS BẢN MỚI TỪ AI */}
      {pendingNewQuestion && (
        <QuestionAiReview
          key={proposalJournal.entry!.key}
          base={pendingNewQuestion.base}
          candidate={pendingNewQuestion.question}
          ownerId={ownerId}
          documentId={documentId}
          sourceStamp={sourceStamp}
          question={question}
          onSubmit={(submission) => {
            setUndoHistory(activeUndoHistory);
            setPendingUndo(null);
            onManualSave(submission);
          }}
          onApplied={(before, after) => {
            setUndoHistory([
              ...activeUndoHistory,
              { before, afterStamp: questionValueStamp(after), sourceStamp },
            ]);
            setPendingUndo(null);
            setRedoHistory([]);
            setPendingRedo(null);
            setUndoMessage('');
            setVerification(null);
            proposalJournal.archive();
          }}
          onDiscard={handleDiscardPendingQuestion}
        />
      )}

      {/* Nội dung câu hỏi chính */}
      {proposalJournal.notice && (
        <p role="status" className="m-3 text-sm text-amber-700">
          {proposalJournal.notice}
        </p>
      )}
      <div className="p-4 space-y-3">
        {undoMessage && (
          <p role="alert" className="text-sm text-amber-700">
            {undoMessage}
          </p>
        )}
        {isEditing ? (
          <QuestionEditor
            initialChoiceKey={imageChoice}
            ownerId={ownerId}
            documentId={documentId}
            sourceStamp={sourceStamp}
            question={question}
            frameworkId={cognitiveFrameworkId}
            knowledgePackage={knowledgePackage}
            knowledgeScope={knowledgeScope}
            onCancel={() => setIsEditing(false)}
            onSave={(submission) => {
              setUndoHistory(activeUndoHistory);
              setPendingUndo(null);
              onManualSave(submission);
            }}
            onApplied={(previous) => {
              setUndoHistory([
                ...activeUndoHistory,
                { before: previous, afterStamp: questionValueStamp(question), sourceStamp },
              ]);
              setPendingUndo(null);
              setRedoHistory([]);
              setPendingRedo(null);
              setUndoMessage('');
              setVerification(null);
              setIsEditing(false);
            }}
          />
        ) : (
          <div className="space-y-1.5">
            <span className="sr-only">{question.content}</span>
            <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--ui-text-secondary)]">
              <span>Nội dung câu hỏi:</span>
              {!isLocked && (
                <span className="text-[10px] text-slate-400 font-normal">
                  Gõ nội dung / công thức LaTeX. Xem bản in chuẩn ở khung bên phải.
                </span>
              )}
            </div>
            <button type="button" data-editor-field="Nội dung câu" className="min-w-0 grow text-left rounded px-2 py-1 hover:bg-[var(--ui-surface-variant)]" onClick={() => setIsEditing(true)}><MathRenderer content={contentDraft} /></button>
          </div>
        )}

        {!hidePassage && !isEditing && question.passageId && (
          <details className="border rounded-xl p-3 border-slate-200 dark:border-neutral-800">
            <summary className="cursor-pointer text-sm font-semibold">{passage?.title || 'Ngữ liệu dùng chung'}</summary>
            {passage ? (
              <div className="mt-2 space-y-2">
                <MathRenderer content={passage.content} />
                {passage.figures?.map((figure) => (
                  <FigureView key={figure.id} figure={figure} />
                ))}
                {passage.source && <p className="text-xs italic text-[var(--ui-text-secondary)]">{passage.source}</p>}
              </div>
            ) : (
              <p role="note" className="mt-2 text-xs text-amber-700">Chưa tìm thấy ngữ liệu liên kết. Hãy bổ sung trong phần ngữ liệu của đề.</p>
            )}
          </details>
        )}

        {/* Render Hình vẽ / Bảng biến thiên (figures) nếu có */}
        {!isEditing && question.figures && question.figures.length > 0 && (
          <div className="my-2 space-y-2">
            {question.figures.map((figure) => (
              <FigureView key={figure.id} figure={figure} />
            ))}
          </div>
        )}

        {/* PHƯƠNG ÁN LỰA CHỌN (Multiple Choice) */}
        {!isEditing && choicesDraft && choicesDraft.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="text-[11px] font-semibold text-[var(--ui-text-secondary)] uppercase tracking-wider flex items-center justify-between">
              <span>Các phương án lựa chọn:</span>
              {!isLocked && (
                <span className="text-[10px] text-slate-400 font-normal">
                  Chọn phương án rồi đặt đáp án trên thanh công cụ
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 @min-[500px]:grid-cols-2 gap-2">
              {choicesDraft.map((c) => {
                const isCorrect = c.key === question.correct_answer;
                return (
                  <div
                    key={c.key}
                    data-editor-field={`Phương án ${c.key}`}
                    className={`min-w-0 px-2.5 py-1.5 rounded-xl flex flex-wrap items-center gap-2 transition-all border ${
                      isCorrect
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-500/80 dark:border-emerald-700 shadow-2xs'
                        : 'bg-white dark:bg-neutral-900 border-slate-200 dark:border-neutral-800 hover:border-slate-300'
                    }`}
                  >
                    <button
                      type="button"
                      disabled={isLocked}
                      onClick={() => {
                        if (editorActor.enabled) editorActor.choose(`Phương án ${c.key}`);
                        else if (!isLocked && question.correct_answer !== c.key) handleSaveInline({ correct_answer: c.key });
                      }}
                      title={
                        isLocked
                          ? undefined
                          : isCorrect
                          ? 'Đáp án đúng'
                          : editorActor.enabled ? `Chọn phương án ${c.key} để sửa` : `Bấm để chọn ${c.key} là đáp án đúng`
                      }
                      className={`w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center shrink-0 transition-transform ${
                        !isLocked ? 'cursor-pointer hover:scale-105 active:scale-95' : 'cursor-default'
                      } ${
                        isCorrect
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 border border-slate-300 dark:border-neutral-700 hover:border-emerald-500 hover:text-emerald-600'
                      }`}
                    >
                      {c.key}
                    </button>

                    <button type="button" className="min-w-0 grow text-left rounded px-2 py-1 hover:bg-[var(--ui-surface-variant)]" onClick={() => setIsEditing(true)}><MathRenderer content={c.text || "Chưa có nội dung"} inline /></button>

                    {c.figures?.length ? <div className="w-full min-w-0">{c.figures.map(figure => <FigureView key={figure.id} figure={figure} />)}</div> : null}
                    {isCorrect && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 ml-auto" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CÂU HỎI ĐÚNG / SAI 4 Ý (True / False Group) */}
        {!isEditing && subsDraft && subsDraft.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="text-[11px] font-semibold text-[var(--ui-text-secondary)] uppercase tracking-wider flex items-center justify-between">
              <span>Các mệnh đề Đúng / Sai:</span>
              {!isLocked && (
                <span className="text-[10px] text-slate-400 font-normal">
                  Bấm nút bên phải để đổi Đúng / Sai
                </span>
              )}
            </div>
            {subsDraft.map((sub) => (
              <div
                key={sub.key}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center gap-2.5 text-xs transition-all"
              >
                <span className="font-bold text-[var(--ui-text-primary)] shrink-0">
                  {sub.key})
                </span>
                <button type="button" className="min-w-0 grow text-left rounded px-2 py-1 hover:bg-[var(--ui-surface-variant)]" onClick={() => setIsEditing(true)}><MathRenderer content={sub.content || "Chưa có nội dung"} /></button>
                <button
                  type="button"
                  disabled={isLocked}
                  onClick={() => {
                    if (!isLocked) {
                      const next =
                        sub.isCorrect === undefined ? true : sub.isCorrect ? false : true;
                      const nextSubs = subsDraft.map((item) =>
                        item.key === sub.key ? { ...item, isCorrect: next } : item,
                      );
                      handleSaveInline({ sub_questions: nextSubs });
                    }
                  }}
                  title={!isLocked ? 'Bấm để đổi Đúng / Sai' : undefined}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 transition-transform ${
                    !isLocked ? 'cursor-pointer hover:scale-105 active:scale-95' : 'cursor-default'
                  } ${
                    sub.isCorrect
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                      : sub.isCorrect === false
                      ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                      : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400'
                  }`}
                >
                  {sub.isCorrect === undefined ? 'CHƯA CHỌN' : sub.isCorrect ? 'ĐÚNG' : 'SAI'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* TRẢ LỜI NGẮN (Short Answer) */}
        {!isEditing && question.type === 'short_answer' && (
          <div className="p-3 bg-emerald-50/50 dark:bg-[#0f291e]/60 border border-emerald-200 dark:border-[#1e4a34] rounded-xl space-y-2.5 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-bold text-emerald-800 dark:text-[#5bb98c] shrink-0">Đáp số chuẩn xác:</span>
              <button type="button" className="min-w-0 grow text-left rounded px-2 py-1 hover:bg-[var(--ui-surface-variant)]" onClick={() => setIsEditing(true)}>{shortAnswerDraft || "Chưa có đáp án — chọn để soạn"}</button>
            </div>

            <div className="flex items-start gap-3 pt-2 border-t border-emerald-200/60 dark:border-emerald-900/40">
              <span className="font-semibold text-emerald-900/80 dark:text-emerald-300 shrink-0 mt-1">
                Các cách trả lời chấp nhận khác:
              </span>
              <div className="grow space-y-1">
                <button type="button" className="min-w-0 grow text-left rounded px-2 py-1 hover:bg-[var(--ui-surface-variant)]" onClick={() => setIsEditing(true)}>{acceptedAnswersDraft || "Thêm cách trả lời tương đương"}</button>
                <span className="text-[10px] text-slate-400 block">
                  Hệ thống tự động chấm đúng nếu học sinh gõ bất kỳ định dạng nào trong danh sách này.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* CÂU HỎI TỰ LUẬN (Essay) & BAREM CHẤM ĐIỂM */}
        {!isEditing && question.type === 'essay' && (
          <div className="space-y-2 pt-2">
            {question.rubric && question.rubric.length > 0 && (
              <div className="p-3 bg-amber-50/70 dark:bg-[#33250b]/60 border border-amber-200 dark:border-[#533f16] rounded-xl space-y-2 text-xs">
                <span className="font-bold text-amber-900 dark:text-[#fdd663] block">
                  Barem tiêu chí chấm điểm chi tiết:
                </span>
                <div className="overflow-x-auto">
                  <table
                    className={
                      'w-full border-collapse border border-amber-200 dark:border-[#533f16] text-left bg-white ' +
                      'dark:bg-[var(--ui-surface)] rounded-lg overflow-hidden'
                    }
                  >
                    <thead>
                      <tr className="bg-amber-100/60 dark:bg-[#533f16]/60 text-amber-900 dark:text-[#fdd663] font-bold text-[11px]">
                        <th className="border border-amber-200 dark:border-[#533f16] px-3 py-1.5">
                          Tiêu chí đánh giá / Yêu cầu cần đạt
                        </th>
                        <th className="border border-amber-200 dark:border-[#533f16] px-3 py-1.5 text-center w-24">
                          Điểm tối đa
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {question.rubric.map((r, rIdx) => (
                        <tr key={rIdx} className="hover:bg-amber-50/50 dark:hover:bg-[#533f16]/20">
                          <td className="border border-amber-200/80 dark:border-[#533f16]/60 px-3 py-1.5 text-[var(--ui-text-primary)] dark:text-[var(--ui-text-primary)]">
                            {r.criterion}
                          </td>
                          <td className="border border-amber-200/80 dark:border-[#533f16]/60 px-3 py-1.5 text-center font-bold font-mono text-amber-900 dark:text-[#fdd663]">
                            {r.maxPoints}đ
                          </td>
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
          <div
            className={
              'p-3 bg-white dark:bg-[var(--ui-surface-variant)] border border-slate-200 ' +
              'dark:border-[var(--ui-border)] rounded-xl space-y-2 text-xs'
            }
          >
            <span className="font-bold text-[var(--ui-text-primary)] dark:text-[var(--ui-text-primary)] block">
              Đáp án điền từ vào chỗ trống:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={
                  'px-3 py-1 bg-slate-50 dark:bg-[var(--ui-surface)] font-mono font-bold text-[var(--ui-text-primary)] ' +
                  'dark:text-[var(--ui-text-primary)] border border-slate-200 dark:border-[var(--ui-border)] rounded-lg shadow-2xs'
                }
              >
                {question.correct_answer || 'Chưa thiết lập'}
              </span>
              {question.accepted_answers && question.accepted_answers.length > 0 && (
                <span className="text-[11px] text-[var(--ui-text-secondary)] dark:text-[var(--ui-text-secondary)] italic">
                  (Chấp nhận: {question.accepted_answers.join(', ')})
                </span>
              )}
            </div>
          </div>
        )}

        {/* GHÉP NỐI HAI CỘT (Matching) */}
        {!isEditing && question.type === 'matching' && (
          <div
            className={
              'p-3 bg-white dark:bg-[var(--ui-surface-variant)] border border-slate-200 ' +
              'dark:border-[var(--ui-border)] rounded-xl space-y-2 text-xs'
            }
          >
            <span className="font-bold text-[var(--ui-text-primary)] dark:text-[var(--ui-text-primary)] block">
              Ghép nối tương ứng:
            </span>
            <div className="text-[var(--ui-text-primary)] dark:text-[var(--ui-text-primary)] font-mono font-bold">
              {question.matchingPairs?.map((pair) => `${pair.left} → ${pair.right}`).join('; ') ||
                question.correct_answer ||
                'Chưa thiết lập'}
            </div>
          </div>
        )}

        {/* Lời giải chi tiết (Toggle xem / sửa) */}
        <div className="pt-2 border-t border-slate-100 dark:border-neutral-800">
          <button
            type="button"
            onClick={() => setShowSolution(!showSolution)}
            className={
              'flex items-center gap-1.5 text-xs font-semibold text-[var(--ui-text-primary)] dark:text-[var(--ui-text-primary)] ' +
              'hover:text-slate-800 dark:hover:text-[#f1f3f4] cursor-pointer'
            }
          >
            {showSolution ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span>{showSolution ? 'Thu gọn lời giải' : 'Lời giải chi tiết'}</span>
            {!showSolution && solutionDraft && (
              <span className="text-[10px] text-slate-400 font-normal truncate max-w-xs">
                — {solutionDraft.slice(0, 36)}...
              </span>
            )}
          </button>

          {showSolution && (
            <div className="mt-2.5 p-3.5 bg-slate-50/70 dark:bg-[#242424] rounded-xl border border-slate-200/80 dark:border-[var(--ui-border)] space-y-2">
              <div className="font-bold text-[var(--ui-text-primary)] dark:text-[var(--ui-text-primary)] text-xs">
                Hướng dẫn giải từng bước:
              </div>
              <button type="button" data-editor-field="Lời giải" className="min-w-0 grow text-left rounded px-2 py-1 hover:bg-[var(--ui-surface-variant)]" onClick={() => setIsEditing(true)}><MathRenderer content={solutionDraft || "Chưa có lời giải — chọn để soạn"} /></button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
