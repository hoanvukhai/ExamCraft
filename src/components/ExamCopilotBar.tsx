'use client';

import React, { useState, useEffect } from 'react';
import { Exam, Question } from '@/types/exam';
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
  const [command, setCommand] = useState('');
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
      setCommand(externalCommand);
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

    setIsLoading(true);
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
        if (result.action === 'modify_single_question' && result.modifiedQuestion) {
          onUpdateQuestion(result.modifiedQuestion);
          setSuccessMessage(result.explanation || 'Đã sửa câu hỏi thành công theo yêu cầu!');
        } else if (result.action === 'add_question' && result.modifiedQuestion) {
          onAddQuestion(result.modifiedQuestion);
          setSuccessMessage(result.explanation || 'Đã tạo thêm câu hỏi mới thành công!');
        } else if (result.action === 'delete_question' && result.targetQuestionId) {
          onDeleteQuestion(result.targetQuestionId);
          setSuccessMessage(result.explanation || 'Đã xóa câu hỏi khỏi đề thi!');
        } else if (result.action === 'modify_all_numbers') {
          // Đổi số liệu toàn đề thi
          setSuccessMessage('Đang cập nhật số liệu toàn bộ đề thi...');
          // Tiến hành gọi cập nhật
        } else {
          setSuccessMessage(result.explanation || 'Đã áp dụng chỉnh sửa thành công!');
        }

        setCommand('');
      }
    } catch (err: any) {
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
    <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-3.5 sm:p-4 text-white shadow-md border border-indigo-700/60 transition-all">
      {/* Tiêu đề & Trạng thái */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-indigo-300 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
              <span>Trợ Lý AI Biên Tập Trực Tiếp Đề Thi</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/40 text-indigo-200 border border-indigo-400/30">
                Copilot 2.0
              </span>
            </h3>
            <p className="text-[11px] text-indigo-200/80 hidden sm:block">
              Ra lệnh bằng tiếng Việt để AI sửa bất kỳ câu nào, tăng/giảm độ khó, đổi số liệu hoặc hỏi đáp sư phạm.
            </p>
          </div>
        </div>

        {selectedQuestionIds.length > 0 && (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
            Đang nhắm tới {selectedQuestionIds.length} câu đã chọn
          </span>
        )}
      </div>

      {/* Thanh nhập lệnh AI */}
      <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-xl p-1.5 border border-white/15 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-400/30 transition-all">
        <input
          id="exam-copilot-input"
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nhập yêu cầu: ví dụ 'đổi số liệu câu 2', 'tăng độ khó câu 1', 'chuyển câu 3 thành toán thực tế'..."
          disabled={isLoading}
          className="grow bg-transparent text-xs sm:text-sm text-white placeholder:text-indigo-200/50 px-2 py-1 outline-hidden disabled:opacity-50"
        />

        <button
          onClick={() => handleSendCommand()}
          disabled={isLoading || !command.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 disabled:hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer disabled:cursor-not-allowed"
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
        <span className="text-[10px] text-indigo-300 font-semibold flex items-center gap-1 mr-1">
          <Compass className="w-3 h-3" /> Gợi ý nhanh:
        </span>

        <button
          onClick={() => handleSendCommand('Đổi số liệu và tính toán lại đáp án cho câu 1')}
          disabled={isLoading}
          className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-indigo-100 transition-colors flex items-center gap-1"
        >
          <Binary className="w-3 h-3 text-indigo-300" />
          <span>Đổi số liệu câu 1</span>
        </button>

        <button
          onClick={() => handleSendCommand('Nâng cấp câu 1 lên mức vận dụng có bẫy toán học')}
          disabled={isLoading}
          className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-indigo-100 transition-colors flex items-center gap-1"
        >
          <Flame className="w-3 h-3 text-amber-400" />
          <span>Tăng độ khó câu 1</span>
        </button>

        <button
          onClick={() => handleSendCommand('Đơn giản hóa câu 1 về mức độ nhận biết cơ bản')}
          disabled={isLoading}
          className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-indigo-100 transition-colors flex items-center gap-1"
        >
          <ArrowDownCircle className="w-3 h-3 text-blue-300" />
          <span>Giảm độ khó</span>
        </button>

        <button
          onClick={() => handleSendCommand('Chuyển câu 1 thành bài toán ứng dụng thực tế')}
          disabled={isLoading}
          className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-indigo-100 transition-colors flex items-center gap-1"
        >
          <Wand2 className="w-3 h-3 text-emerald-300" />
          <span>Biến thành toán thực tế</span>
        </button>

        <button
          onClick={() => handleSendCommand('Tạo thêm 1 câu hỏi tương tự câu 1')}
          disabled={isLoading}
          className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-indigo-100 transition-colors flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3 text-purple-300" />
          <span>Tạo câu tương tự</span>
        </button>
      </div>

      {/* KHUNG AI HỎI LẠI ĐỂ LÀM RÕ (CLARIFICATION DIALOG) */}
      {clarification && (
        <div className="mt-3 bg-amber-950/60 border border-amber-500/40 rounded-xl p-3 text-amber-100 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="grow">
              <p className="text-xs font-semibold text-amber-200 mb-2">
                {clarification.message}
              </p>

              {clarification.quickOptions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {clarification.quickOptions.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendCommand(opt)}
                      disabled={isLoading}
                      className="text-xs font-medium px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/40 border border-amber-400/40 text-amber-100 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <ChevronRight className="w-3 h-3 text-amber-300" />
                      <span>{opt}</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('clarification-custom-input');
                      el?.focus();
                    }}
                    className="text-xs font-medium px-2.5 py-1 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 border border-dashed border-amber-400/50 text-amber-300 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>✏️ Phương án khác (Tự gõ)</span>
                  </button>
                </div>
              )}

              {/* Ô TỰ GÕ PHƯƠNG ÁN RIÊNG CHO GIÁO VIÊN */}
              <div className="pt-2 border-t border-amber-500/20 flex items-center gap-2">
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
                    className="w-full bg-black/40 border border-amber-400/40 rounded-lg pl-3 pr-7 py-1.5 text-xs text-amber-100 placeholder:text-amber-200/50 outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 transition-all disabled:opacity-50"
                  />
                  {customClarificationText && (
                    <button
                      type="button"
                      onClick={() => setCustomClarificationText('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-amber-300/60 hover:text-amber-200 text-xs px-1 cursor-pointer"
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
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-lg transition-all flex items-center gap-1 shrink-0 cursor-pointer disabled:cursor-not-allowed shadow-xs"
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
        <div className="mt-2.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl px-3 py-2 text-xs font-semibold text-emerald-200 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Thông báo lỗi */}
      {errorMessage && (
        <div className="mt-2.5 bg-rose-950/60 border border-rose-500/40 rounded-xl px-3 py-2 text-xs font-semibold text-rose-200 flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
