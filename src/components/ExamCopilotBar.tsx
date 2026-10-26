'use client';

import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Exam, Question } from '@/types/exam';
import { AiProposalPreview } from './AiProposalPreview';
import { 
  Sparkles, 
  Send, 
  RefreshCw, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  Wand2, 
  Flame, 
  ArrowDownCircle, 
  Binary,
  Compass
} from 'lucide-react';

interface ExamCopilotBarProps {
  exam: Exam;
  apiKey?: string;
  selectedQuestionIds: string[];
  externalCommand?: string;
  onUpdateQuestion: (updatedQuestion: Question) => void;
  onAddQuestion: (newQuestion: Question) => void;
  onDeleteQuestion: (id: string) => void;
  onBatchUpdateQuestions: (updatedQuestions: Question[]) => void;
}

export const ExamCopilotBar: React.FC<ExamCopilotBarProps> = ({
  exam,
  apiKey,
  selectedQuestionIds,
  externalCommand,
  onUpdateQuestion,
  onAddQuestion,
  onDeleteQuestion,
  onBatchUpdateQuestions,
}) => {
  const [commandDraft, setCommandDraft] = useState({ external: externalCommand, value: '' });
  const command = externalCommand && commandDraft.external !== externalCommand ? externalCommand : commandDraft.value;
  const setCommand = (value: string) => setCommandDraft({ external: externalCommand, value });
  const liveExam = useRef(exam);
  useLayoutEffect(() => { liveExam.current = exam; }, [exam]);
  const [proposal, setProposal] = useState<{ result: { action: string; modifiedQuestion?: Question; targetQuestionId?: string; explanation?: string }; base: string } | null>(null);
  const acceptProposal = () => {
    if (!proposal) return;
    if (JSON.stringify(liveExam.current.questions) !== proposal.base) { setErrorMessage('Đề đã thay đổi. Hãy gửi lại yêu cầu để giữ các sửa đổi mới.'); setProposal(null); return; }
    const result = proposal.result;
    if (result.action === 'modify_single_question' && result.modifiedQuestion) onUpdateQuestion(result.modifiedQuestion);
    else if (result.action === 'add_question' && result.modifiedQuestion) onAddQuestion(result.modifiedQuestion);
    else if (result.action === 'delete_question' && result.targetQuestionId) onDeleteQuestion(result.targetQuestionId);
    else { setErrorMessage('Đề xuất chưa đủ thông tin để áp dụng.'); return; }
    setProposal(null); setSuccessMessage('Đã áp dụng đề xuất. Thầy/cô kiểm tra lại trước khi chốt.');
  };
  const [isLoading, setIsLoading] = useState(false);
  const [clarification, setClarification] = useState<{
    message: string;
    quickOptions: string[];
  } | null>(null);
  const [customClarificationText, setCustomClarificationText] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (externalCommand) {
      const inputEl = document.getElementById('exam-copilot-input');
      if (inputEl) {
        inputEl.focus();
        inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [externalCommand]);

  const handleSendCommand = async (cmdText?: string) => {
    const textToSend = cmdText || command;
    if (!textToSend.trim()) return;

    const base = JSON.stringify(exam.questions);
    setIsLoading(true);
    setProposal(null);
    setClarification(null);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/exam-copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exam,
          command: textToSend,
          targetQuestionId: selectedQuestionIds.length === 1 ? selectedQuestionIds[0] : undefined,
          customApiKey: apiKey,
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
        if (JSON.stringify(liveExam.current.questions) !== base) { setErrorMessage('Đề đã được sửa trong lúc AI xử lý. Hãy gửi lại yêu cầu.'); return; }
        setProposal({ result, base });
        setCommand('');
      }
    } catch (err: unknown) {
      console.error('Lỗi gọi Copilot:', err);
      setErrorMessage('Không thể kết nối đến máy chủ AI. Vui lòng kiểm tra lại mạng hoặc API Key.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSendCommand();
    }
  };

  return (
    <div className="bg-white dark:bg-[#1e1e1e] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl p-4 sm:p-5 text-[#202124] dark:text-[#e3e3e3] shadow-xs transition-all">
      {proposal && <div className="m-3 p-3 border rounded-xl bg-amber-50 text-slate-900 text-sm" role="region" aria-label="Đề xuất AI chưa áp dụng"><p>{proposal.result.explanation || 'Đề xuất sửa đề'}</p>{proposal.result.modifiedQuestion && <AiProposalPreview question={proposal.result.modifiedQuestion} before={exam.questions.find(q => q.id === proposal.result.targetQuestionId)} />}<button type="button" onClick={acceptProposal} className="px-3 py-2 font-semibold">Áp dụng</button><button type="button" onClick={() => setProposal(null)} className="px-3 py-2">Bỏ đề xuất</button></div>}
      {/* Tiêu đề & Trạng thái */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#e8f0fe] dark:bg-[#1e2a38] border border-[#1a73e8]/30 dark:border-[#8ab4f8]/30 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[#1a73e8] dark:text-[#8ab4f8] animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-[#202124] dark:text-[#e3e3e3] flex items-center gap-1.5">
              <span>Trợ Lý AI Biên Tập Trực Tiếp Đề Thi</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#e8f0fe] dark:bg-[#1e2a38] text-[#1a73e8] dark:text-[#8ab4f8] border border-[#1a73e8]/30 dark:border-[#8ab4f8]/30">
                Copilot 2.0
              </span>
            </h3>
            <p className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] hidden sm:block">
              Ra lệnh bằng tiếng Việt để AI sửa bất kỳ câu nào, tăng/giảm độ khó, đổi số liệu hoặc hỏi đáp sư phạm.
            </p>
          </div>
        </div>

        {selectedQuestionIds.length > 0 && (
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#fef7e0] dark:bg-[#33250b] text-[#b06000] dark:text-[#fdd663] border border-[#feefc3] dark:border-[#4d380e] shrink-0">
            Đang nhắm tới {selectedQuestionIds.length} câu đã chọn
          </span>
        )}
      </div>

      {/* Thanh nhập lệnh AI */}
      <div className="flex items-center gap-2 bg-[#f8f9fa] dark:bg-[#242424] rounded-full p-1.5 border border-[#dadce0] dark:border-[#3c4043] focus-within:border-[#1a73e8] dark:focus-within:border-[#8ab4f8] transition-all">
        <input
          id="exam-copilot-input"
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nhập yêu cầu: ví dụ 'đổi số liệu câu 2', 'tăng độ khó câu 1', 'chuyển câu 3 thành toán thực tế'..."
          disabled={isLoading}
          className="grow bg-transparent text-xs sm:text-sm text-[#202124] dark:text-[#e3e3e3] placeholder-[#5f6368] dark:placeholder-[#9aa0a6] px-3 py-1 outline-none disabled:opacity-50"
        />

        <button
          onClick={() => handleSendCommand()}
          disabled={isLoading || !command.trim()}
          className="flex items-center gap-1.5 px-4 py-1.5 app-button-primary dark:bg-[#8ab4f8] dark:hover:bg-[#aecbfa] disabled:opacity-40 text-white dark:text-[#202124] rounded-full text-xs font-semibold transition-all shadow-xs shrink-0 cursor-pointer disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span className="hidden sm:inline">Đang sửa...</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Gửi lệnh</span>
            </>
          )}
        </button>
      </div>

      {/* Gợi ý mẫu một chạm (Quick Chips) */}
      <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
        <span className="text-[10px] text-[#5f6368] dark:text-[#9aa0a6] font-semibold flex items-center gap-1 mr-1">
          <Compass className="w-3 h-3" /> Gợi ý nhanh:
        </span>

        <button
          onClick={() => handleSendCommand('Đổi số liệu và tính toán lại đáp án cho câu 1')}
          disabled={isLoading}
          className="text-[11px] px-3 py-1 rounded-full bg-[#f1f3f4] dark:bg-[#282828] hover:bg-[#e8eaed] dark:hover:bg-[#333538] border border-[#dadce0] dark:border-[#3c4043] text-[#202124] dark:text-[#e3e3e3] transition-colors flex items-center gap-1 cursor-pointer"
        >
          <Binary className="w-3 h-3 text-[#1a73e8] dark:text-[#8ab4f8]" />
          <span>Đổi số liệu câu 1</span>
        </button>

        <button
          onClick={() => handleSendCommand('Nâng cấp câu 1 lên mức vận dụng có bẫy toán học')}
          disabled={isLoading}
          className="text-[11px] px-3 py-1 rounded-full bg-[#f1f3f4] dark:bg-[#282828] hover:bg-[#e8eaed] dark:hover:bg-[#333538] border border-[#dadce0] dark:border-[#3c4043] text-[#202124] dark:text-[#e3e3e3] transition-colors flex items-center gap-1 cursor-pointer"
        >
          <Flame className="w-3 h-3 text-[#b06000] dark:text-[#fdd663]" />
          <span>Tăng độ khó câu 1</span>
        </button>

        <button
          onClick={() => handleSendCommand('Đơn giản hóa câu 1 về mức độ nhận biết cơ bản')}
          disabled={isLoading}
          className="text-[11px] px-3 py-1 rounded-full bg-[#f1f3f4] dark:bg-[#282828] hover:bg-[#e8eaed] dark:hover:bg-[#333538] border border-[#dadce0] dark:border-[#3c4043] text-[#202124] dark:text-[#e3e3e3] transition-colors flex items-center gap-1 cursor-pointer"
        >
          <ArrowDownCircle className="w-3 h-3 text-[#1a73e8] dark:text-[#8ab4f8]" />
          <span>Giảm độ khó</span>
        </button>

        <button
          onClick={() => handleSendCommand('Chuyển câu 1 thành bài toán ứng dụng thực tế')}
          disabled={isLoading}
          className="text-[11px] px-3 py-1 rounded-full bg-[#f1f3f4] dark:bg-[#282828] hover:bg-[#e8eaed] dark:hover:bg-[#333538] border border-[#dadce0] dark:border-[#3c4043] text-[#202124] dark:text-[#e3e3e3] transition-colors flex items-center gap-1 cursor-pointer"
        >
          <Wand2 className="w-3 h-3 text-[#137333] dark:text-[#5bb98c]" />
          <span>Biến thành toán thực tế</span>
        </button>

        <button
          onClick={() => handleSendCommand('Tạo thêm 1 câu hỏi tương tự câu 1')}
          disabled={isLoading}
          className="text-[11px] px-3 py-1 rounded-full bg-[#f1f3f4] dark:bg-[#282828] hover:bg-[#e8eaed] dark:hover:bg-[#333538] border border-[#dadce0] dark:border-[#3c4043] text-[#202124] dark:text-[#e3e3e3] transition-colors flex items-center gap-1 cursor-pointer"
        >
          <RefreshCw className="w-3 h-3 text-[#1a73e8] dark:text-[#8ab4f8]" />
          <span>Tạo câu tương tự</span>
        </button>
      </div>

      {/* KHUNG AI HỎI LẠI ĐỂ LÀM RÕ (CLARIFICATION DIALOG) */}
      {clarification && (
        <div className="mt-3 bg-[#fef7e0] dark:bg-[#33250b] border border-[#feefc3] dark:border-[#4d380e] rounded-2xl p-3.5 text-[#b06000] dark:text-[#fdd663] animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-[#b06000] dark:text-[#fdd663] shrink-0 mt-0.5" />
            <div className="grow">
              <p className="text-xs font-semibold mb-2">
                {clarification.message}
              </p>

              {clarification.quickOptions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {clarification.quickOptions.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendCommand(opt)}
                      disabled={isLoading}
                      className="text-xs font-medium px-3 py-1 rounded-full bg-white dark:bg-[#202124] hover:bg-[#f1f3f4] dark:hover:bg-[#282828] border border-[#feefc3] dark:border-[#4d380e] text-[#b06000] dark:text-[#fdd663] transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <ChevronRight className="w-3 h-3" />
                      <span>{opt}</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('clarification-custom-input');
                      el?.focus();
                    }}
                    className="text-xs font-medium px-3 py-1 rounded-full bg-white/50 dark:bg-[#202124]/50 border border-dashed border-[#b06000]/40 dark:border-[#fdd663]/40 text-[#b06000] dark:text-[#fdd663] transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>✏️ Phương án khác (Tự gõ)</span>
                  </button>
                </div>
              )}

              {/* Ô TỰ GÕ PHƯƠNG ÁN RIÊNG CHO GIÁO VIÊN */}
              <div className="pt-2 border-t border-[#b06000]/20 dark:border-[#fdd663]/20 flex items-center gap-2">
                <div className="relative grow">
                  <input
                    id="clarification-custom-input"
                    type="text"
                    value={customClarificationText}
                    onChange={(e) => setCustomClarificationText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && customClarificationText.trim() && !isLoading) {
                        handleSendCommand(customClarificationText);
                        setCustomClarificationText('');
                      }
                    }}
                    placeholder="Hoặc tự gõ phương án / yêu cầu cụ thể của Thầy/Cô vào đây..."
                    disabled={isLoading}
                    className="w-full bg-white dark:bg-[#1e1e1e] border border-[#feefc3] dark:border-[#4d380e] rounded-full pl-3 pr-7 py-1.5 text-xs text-[#202124] dark:text-[#e3e3e3] placeholder-[#5f6368] dark:placeholder-[#9aa0a6] outline-none transition-all disabled:opacity-50"
                  />
                  {customClarificationText && (
                    <button
                      type="button"
                      onClick={() => setCustomClarificationText('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124] dark:hover:text-[#e3e3e3] text-xs px-1 cursor-pointer"
                    >
                      ×
                    </button>
                  )}
                </div>
                <button
                  onClick={() => {
                    if (customClarificationText.trim()) {
                      handleSendCommand(customClarificationText);
                      setCustomClarificationText('');
                    }
                  }}
                  disabled={isLoading || !customClarificationText.trim()}
                  className="px-4 py-1.5 bg-[#b06000] hover:bg-[#924f00] text-white font-semibold text-xs rounded-full transition-all flex items-center gap-1 shrink-0 cursor-pointer disabled:cursor-not-allowed shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Gửi</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Thông báo thành công */}
      {successMessage && (
        <div className="mt-2.5 bg-[#e6f4ea] dark:bg-[#0f291e] border border-[#ceead6] dark:border-[#1e4d38] rounded-2xl px-3 py-2 text-xs font-semibold text-[#137333] dark:text-[#5bb98c] flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#137333] dark:text-[#5bb98c] shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Thông báo lỗi */}
      {errorMessage && (
        <div className="mt-2.5 bg-[#fce8e6] dark:bg-[#371918] border border-[#fad2cf] dark:border-[#5c2523] rounded-2xl px-3 py-2 text-xs font-semibold text-[#c5221f] dark:text-[#f28b82] flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-[#c5221f] dark:text-[#f28b82] shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
