'use client';

import React, { useState, useEffect } from 'react';
import { Exam } from '@/types/exam';
import { CopilotProposalReview } from './CopilotProposalReview';
import { captureCopilotBase, type CopilotSubmission } from '@/lib/copilot-submission';
import { createAiProposal } from '@/lib/ai-proposal-journal';
import { useAiProposal } from '@/hooks/useAiProposal';
import { appendCopilotHistory, confirmCopilotTravel, emptyCopilotHistory } from '@/lib/copilot-history';
import { CopilotHistoryControls } from './CopilotHistoryControls';
import { accountFetch } from '@/lib/account-fetch';
import { normalizeQuestion } from '@/lib/exam-document';
import { 
  Sparkles, 
  Send, 
  RefreshCw, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  ChevronLeft,
  Wand2, 
  Flame, 
  ArrowDownCircle, 
  Binary,
  Compass,
  X,
  TableProperties,
  Shuffle,
  Building2,
  ShieldCheck,
  Bot
} from 'lucide-react';

interface RightCompanionRailProps {
  isExpanded: boolean;
  onToggleExpand: () => void;
  exam: Exam;
  ownerId: string;
  onSubmitCopilot: (submission: CopilotSubmission) => void;
  selectedQuestionIds: string[];
  externalCommand?: string;
  onOpenMatrixModal?: () => void;
  onOpenShuffleModal?: () => void;
  onOpenHeaderSettingsModal?: () => void;
}

export const RightCompanionRail: React.FC<RightCompanionRailProps> = ({
  isExpanded,
  onToggleExpand,
  exam,
  ownerId,
  onSubmitCopilot,
  selectedQuestionIds,
  externalCommand,
  onOpenMatrixModal,
  onOpenShuffleModal,
  onOpenHeaderSettingsModal,
}) => {
  const [command, setCommand] = useState(externalCommand ?? '');
  const [receivedCommand, setReceivedCommand] = useState(externalCommand);
  if (externalCommand !== receivedCommand) { setReceivedCommand(externalCommand); if (externalCommand) setCommand(externalCommand); }
  const proposalJournal = useAiProposal(ownerId, exam.id, 'copilot');
  const proposal = proposalJournal.entry?.record?.kind === 'copilot' ? proposalJournal.entry.record : null;
  const [history, setHistory] = useState(emptyCopilotHistory);
  const [isLoading, setIsLoading] = useState(false);
  const [clarification, setClarification] = useState<{
    message: string;
    quickOptions: string[];
  } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Tìm câu hỏi đang được chọn
  const activeQuestionIndex = selectedQuestionIds.length === 1 
    ? exam.questions.findIndex(q => q.id === selectedQuestionIds[0])
    : -1;
  const activeQuestionNumber = activeQuestionIndex !== -1 ? activeQuestionIndex + 1 : null;

  useEffect(() => {
    if (externalCommand && isExpanded) {
      const timer = setTimeout(() => {
        const inputEl = document.getElementById('right-copilot-input');
        inputEl?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [externalCommand, isExpanded]);

  const handleSendCommand = async (cmdText?: string) => {
    const textToSend = cmdText || command;
    if (!textToSend.trim()) return;
    if (proposal || isLoading) return;

    const base = captureCopilotBase(ownerId, exam);
    setIsLoading(true);
    setClarification(null);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await accountFetch(ownerId, '/api/exam-copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exam,
          command: textToSend,
          targetQuestionId: selectedQuestionIds.length === 1 ? selectedQuestionIds[0] : undefined,
        }),
      });

      const data = await res.json();
      if (!data.success || !data.result) {
        setErrorMessage(data.error || 'AI chưa xử lý được yêu cầu này. Thầy/Cô vui lòng thử lại.');
        return;
      }

      const result = data.result;

      // Trường hợp 1: AI cần làm rõ thêm thông tin
      if (result.type === 'clarification') {
        setClarification({
          message: result.message || 'AI cần thêm thông tin để làm chính xác yêu cầu của Thầy/Cô:',
          quickOptions: result.quickOptions || [],
        });
        return;
      }

      // Trường hợp 2: AI thực hiện hành động
      if (result.type === 'action') {
        if (result.modifiedQuestion) normalizeQuestion(result.modifiedQuestion);
        createAiProposal({ kind: 'copilot', result, base });
        setCommand('');
      }
    } catch (err: unknown) {
      console.error('Lỗi gọi Copilot:', err);
      setErrorMessage('Không thể kết nối đến máy chủ AI. Vui lòng kiểm tra lại mạng hoặc API Key.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault();
      handleSendCommand();
    }
  };

  return (
    <aside
      aria-label="Trợ lý và công cụ nhanh"
      className={`no-print select-none shrink-0 transition-all duration-300 ease-in-out flex-col justify-between border-l border-[#dadce0] dark:border-[#3c4043] bg-white dark:bg-[#181818] z-20 h-full overflow-hidden ${
        isExpanded ? 'absolute inset-y-0 right-0 flex w-full sm:w-96 lg:relative shadow-xl' : 'hidden lg:flex lg:w-13'
      }`}
    >
      {proposalJournal.notice && <p role="status" className={isExpanded ? 'p-3 text-sm' : 'hidden'}>{proposalJournal.notice}</p>}
      {proposal && <div className={isExpanded ? 'max-h-[60%] shrink-0 min-h-0 overflow-y-auto' : 'hidden'}><CopilotProposalReview key={proposalJournal.entry!.key} base={proposal.base} result={proposal.result} ownerId={ownerId} exam={exam} onSubmit={onSubmitCopilot} onApplied={submission => { setHistory(value => appendCopilotHistory(value, submission)); proposalJournal.archive(); setSuccessMessage('Đã áp dụng vào bản soạn. Bản đối chiếu được giữ; hãy lưu đề và kiểm tra nội dung trước khi chốt.'); }} onDiscard={() => { proposalJournal.archive(); }} /></div>}
      {(history.undo.length > 0 || history.redo.length > 0) && <div className={isExpanded ? 'shrink-0' : 'hidden'}><CopilotHistoryControls key={`${history.undo.at(-1)?.id}:${history.redo.at(-1)?.id}`} history={history} ownerId={ownerId} exam={exam} disabled={!!proposal} onSubmit={onSubmitCopilot} onConfirmed={(entryId, direction, submission) => setHistory(value => confirmCopilotTravel(value, entryId, direction, submission))} /></div>}
      {/* TRƯỜNG HỢP 1: THU GỌN THÀNH COMPANION RAIL SIÊU MỎNG (52px) */}
      {!isExpanded ? (
        <div className="flex flex-col items-center justify-between h-full py-3.5">
          {/* Nhóm icon trên: Gemini AI & Quick Tools */}
          <div className="flex flex-col items-center gap-3 w-full">
            {/* Nút kích hoạt Gemini Side Panel */}
            <button
              onClick={onToggleExpand}
              title="Mở Trợ lý Gemini AI Copilot (Bên phải)"
              className="relative p-2.5 rounded-2xl bg-[#e8f0fe] dark:bg-[#003258] text-[#1a73e8] dark:text-[#8ab4f8] hover:scale-105 transition-all shadow-xs cursor-pointer group"
            >
              <Sparkles className="w-5 h-5 animate-pulse" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#1a73e8] dark:bg-[#8ab4f8]" />
            </button>

            <div className="w-6 h-[1px] bg-[#dadce0] dark:bg-[#3c4043]" />

            {/* Quick Action: Ma trận */}
            {onOpenMatrixModal && (
              <button
                onClick={onOpenMatrixModal}
                title="Ma trận và đặc tả của đề"
                className="p-2.5 rounded-xl text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124] dark:hover:text-[#e3e3e3] hover:bg-[#f1f3f4] dark:hover:bg-[#282828] transition-colors cursor-pointer"
              >
                <TableProperties className="w-4 h-4" />
              </button>
            )}

            {/* Quick Action: Trộn đề */}
            {onOpenShuffleModal && (
              <button
                onClick={onOpenShuffleModal}
                title="Trộn 4 mã đề thi hoán vị"
                className="p-2.5 rounded-xl text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124] dark:hover:text-[#e3e3e3] hover:bg-[#f1f3f4] dark:hover:bg-[#282828] transition-colors cursor-pointer"
              >
                <Shuffle className="w-4 h-4" />
              </button>
            )}

            {/* Quick Action: Tiêu đề trường thi */}
            {onOpenHeaderSettingsModal && (
              <button
                onClick={onOpenHeaderSettingsModal}
                title="Cài đặt Tiêu đề Sở/Trường & Thông tin đề thi"
                className="p-2.5 rounded-xl text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124] dark:hover:text-[#e3e3e3] hover:bg-[#f1f3f4] dark:hover:bg-[#282828] transition-colors cursor-pointer"
              >
                <Building2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Nút mở rộng panel ở chân */}
          <button
            onClick={onToggleExpand}
            title="Mở rộng bảng Trợ lý AI"
            className="p-2 rounded-xl text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124] dark:hover:text-[#e3e3e3] hover:bg-[#f1f3f4] dark:hover:bg-[#282828] transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* TRƯỜNG HỢP 2: MỞ RỘNG THÀNH SIDE PANEL GOOGLE GEMINI CHUYÊN NGHIỆP */
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Header của Side Panel chuẩn Google */}
          <div className="px-4 py-3 border-b border-[#dadce0] dark:border-[#3c4043] flex items-center justify-between shrink-0 bg-[#f8f9fa] dark:bg-[#1f1f1f]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-[#e8f0fe] dark:bg-[#003258] text-[#1a73e8] dark:text-[#8ab4f8] flex items-center justify-center shadow-2xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#202124] dark:text-[#e3e3e3] flex items-center gap-1.5">
                  <span>Gemini Copilot</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full font-semibold bg-[#e8f0fe] dark:bg-[#003258] text-[#1a73e8] dark:text-[#8ab4f8] border border-[#d2e3fc] dark:border-[#0842a0]">
                    2.0
                  </span>
                </h3>
                <p className="text-[10px] text-[#5f6368] dark:text-[#9aa0a6]">Trợ lý biên tập đề thi chuyên nghiệp</p>
              </div>
            </div>

            <button
              onClick={onToggleExpand}
              title="Thu gọn dải công cụ"
              className="p-1.5 rounded-lg text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124] dark:hover:text-[#e3e3e3] hover:bg-[#f1f3f4] dark:hover:bg-[#282828] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Vùng nội dung cuộn bên trong Panel */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Thẻ hiển thị Context mục tiêu */}
            <div className="p-2.5 rounded-2xl bg-[#f1f3f4] dark:bg-[#282828] border border-[#dadce0] dark:border-[#3c4043] flex items-center justify-between text-xs">
              <span className="text-[11px] font-medium text-[#5f6368] dark:text-[#9aa0a6]">Đang nhắm tới:</span>
              {activeQuestionNumber !== null ? (
                <span className="font-semibold text-xs px-2.5 py-0.5 rounded-full bg-[#e8f0fe] dark:bg-[#003258] text-[#1a73e8] dark:text-[#8ab4f8] border border-[#d2e3fc] dark:border-[#0842a0]">
                  Câu số {activeQuestionNumber}
                </span>
              ) : selectedQuestionIds.length > 1 ? (
                <span className="font-semibold text-xs px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  {selectedQuestionIds.length} câu đã chọn
                </span>
              ) : (
                <span className="font-medium text-[11px] text-[#5f6368] dark:text-[#9aa0a6] italic">
                  Toàn bộ đề ({exam.questions.length} câu)
                </span>
              )}
            </div>

            {/* Gợi ý một chạm (Quick Action Chips Google Pill style) */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5f6368] dark:text-[#9aa0a6] flex items-center gap-1">
                <Compass className="w-3 h-3" />
                Gợi ý lệnh nhanh:
              </span>

              <div className="grid grid-cols-1 gap-1.5">
                <button
                  onClick={() => handleSendCommand(activeQuestionNumber ? `Đổi số liệu và tính toán lại đáp án cho câu ${activeQuestionNumber}` : 'Đổi số liệu toàn bộ các câu hỏi trong đề thi')}
                  disabled={isLoading || !!proposal}
                  className="w-full text-left text-xs px-3 py-2 rounded-xl bg-[#f8f9fa] dark:bg-[#242424] hover:bg-[#f1f3f4] dark:hover:bg-[#2d2f31] border border-[#dadce0] dark:border-[#3c4043] text-[#202124] dark:text-[#e3e3e3] transition-colors flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <Binary className="w-3.5 h-3.5 text-[#1a73e8] dark:text-[#8ab4f8]" />
                    <span>{activeQuestionNumber ? `Đổi số liệu câu ${activeQuestionNumber}` : 'Đổi số liệu các câu'}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#5f6368] dark:text-[#9aa0a6] group-hover:translate-x-0.5 transition-transform" />
                </button>

                <button
                  onClick={() => handleSendCommand(activeQuestionNumber ? `Nâng cấp câu ${activeQuestionNumber} lên mức vận dụng có bẫy toán học` : 'Tăng độ khó các câu hỏi trong đề thi')}
                  disabled={isLoading || !!proposal}
                  className="w-full text-left text-xs px-3 py-2 rounded-xl bg-[#f8f9fa] dark:bg-[#242424] hover:bg-[#f1f3f4] dark:hover:bg-[#2d2f31] border border-[#dadce0] dark:border-[#3c4043] text-[#202124] dark:text-[#e3e3e3] transition-colors flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                    <span>{activeQuestionNumber ? `Tăng độ khó câu ${activeQuestionNumber}` : 'Tăng độ khó'}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#5f6368] dark:text-[#9aa0a6] group-hover:translate-x-0.5 transition-transform" />
                </button>

                <button
                  onClick={() => handleSendCommand(activeQuestionNumber ? `Đơn giản hóa câu ${activeQuestionNumber} về mức độ nhận biết cơ bản` : 'Đơn giản hóa đề thi về mức nhận biết')}
                  disabled={isLoading || !!proposal}
                  className="w-full text-left text-xs px-3 py-2 rounded-xl bg-[#f8f9fa] dark:bg-[#242424] hover:bg-[#f1f3f4] dark:hover:bg-[#2d2f31] border border-[#dadce0] dark:border-[#3c4043] text-[#202124] dark:text-[#e3e3e3] transition-colors flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <ArrowDownCircle className="w-3.5 h-3.5 text-blue-500" />
                    <span>{activeQuestionNumber ? `Giảm độ khó câu ${activeQuestionNumber}` : 'Giảm độ khó'}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#5f6368] dark:text-[#9aa0a6] group-hover:translate-x-0.5 transition-transform" />
                </button>

                <button
                  onClick={() => handleSendCommand(activeQuestionNumber ? `Chuyển câu ${activeQuestionNumber} thành bài toán ứng dụng thực tế` : 'Thêm bối cảnh thực tế cho đề thi')}
                  disabled={isLoading || !!proposal}
                  className="w-full text-left text-xs px-3 py-2 rounded-xl bg-[#f8f9fa] dark:bg-[#242424] hover:bg-[#f1f3f4] dark:hover:bg-[#2d2f31] border border-[#dadce0] dark:border-[#3c4043] text-[#202124] dark:text-[#e3e3e3] transition-colors flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <Wand2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Biến thành toán thực tế</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#5f6368] dark:text-[#9aa0a6] group-hover:translate-x-0.5 transition-transform" />
                </button>

                <button
                  onClick={() => handleSendCommand(activeQuestionNumber ? `Tạo thêm 1 câu hỏi tương tự câu ${activeQuestionNumber}` : 'Tạo thêm 1 câu hỏi tương đương')}
                  disabled={isLoading || !!proposal}
                  className="w-full text-left text-xs px-3 py-2 rounded-xl bg-[#f8f9fa] dark:bg-[#242424] hover:bg-[#f1f3f4] dark:hover:bg-[#2d2f31] border border-[#dadce0] dark:border-[#3c4043] text-[#202124] dark:text-[#e3e3e3] transition-colors flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 text-[#1a73e8] dark:text-[#8ab4f8]" />
                    <span>Tạo câu hỏi tương đương</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#5f6368] dark:text-[#9aa0a6] group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>

            {/* Hộp AI hỏi lại để làm rõ (Clarification Dialog) */}
            {clarification && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl text-xs space-y-2">
                <div className="flex items-start gap-2">
                  <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <p className="font-semibold text-amber-900 dark:text-amber-200 leading-snug">
                    {clarification.message}
                  </p>
                </div>

                {clarification.quickOptions.length > 0 && (
                  <div className="flex flex-col gap-1.5 pt-1">
                    {clarification.quickOptions.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendCommand(opt)}
                        disabled={isLoading || !!proposal}
                        className="text-left text-xs px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#1e1e1e] border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
                      >
                        <ChevronRight className="w-3 h-3 text-amber-500 shrink-0" />
                        <span>{opt}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Thông báo thành công */}
            {successMessage && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Thông báo lỗi */}
            {errorMessage && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs text-rose-900 dark:text-rose-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Ô nhập lệnh phía dưới chuẩn Google Material Box */}
          <div className="p-3 border-t border-[#dadce0] dark:border-[#3c4043] bg-white dark:bg-[#181818] space-y-2 shrink-0">
            <div className="relative">
              <textarea
                id="right-copilot-input"
                rows={2}
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập yêu cầu cho Gemini (vd: đổi số liệu câu 2, thêm bẫy câu 3...)"
                disabled={isLoading || !!proposal}
                className="w-full text-xs p-2.5 bg-[#f8f9fa] dark:bg-[#242424] text-[#202124] dark:text-[#e3e3e3] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl focus:border-[#1a73e8] dark:focus:border-[#8ab4f8] focus:ring-1 focus:ring-[#1a73e8] dark:focus:ring-[#8ab4f8] outline-hidden resize-none transition-all placeholder:text-[#5f6368] dark:placeholder:text-[#9aa0a6] disabled:opacity-50"
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-[#5f6368] dark:text-[#9aa0a6]">
                Nhấn <kbd className="px-1.5 py-0.5 rounded bg-[#f1f3f4] dark:bg-[#282828] border border-[#dadce0] dark:border-[#3c4043] font-mono">Enter ↵</kbd> để gửi
              </span>

              <button
                onClick={() => handleSendCommand()}
                  disabled={isLoading || !!proposal || !command.trim()}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all shadow-xs cursor-pointer disabled:cursor-not-allowed bg-[#1a73e8] hover:bg-[#1557b0] text-white dark:bg-[#8ab4f8] dark:hover:bg-[#a8c7fa] dark:text-[#041e49] disabled:opacity-40"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Gửi lệnh</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
