'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSidePanel } from '@/hooks/useSidePanel';
import { useChatSession } from '@/hooks/useChatSession';
import { Exam } from '@/types/exam';
import { CopilotProposalReview } from './CopilotProposalReview';
import { captureCopilotBase, type CopilotSubmission } from '@/lib/copilot-submission';
import { createAiProposal } from '@/lib/ai-proposal-journal';
import { useAiProposal } from '@/hooks/useAiProposal';
import { accountFetch } from '@/lib/account-fetch';
import { normalizeQuestion } from '@/lib/exam-document';
import { 
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

interface RightCompanionRailProps {
  isExpanded: boolean;
  onClose: () => void;
  exam: Exam;
  ownerId: string;
  onSubmitCopilot: (submission: CopilotSubmission) => void;
  selectedQuestionIds: string[];
  externalCommand?: string;
  keyState?: 'loading' | 'unknown' | 'missing' | 'present';
  onKeys?: () => void;
  onReloadKeys?: () => Promise<void>;
  onGenerate?: () => void;
  onUseTemplate?: () => void;
  onImportDocument?: () => void;
}

export const RightCompanionRail: React.FC<RightCompanionRailProps> = ({
  isExpanded,
  onClose,
  exam,
  ownerId,
  onSubmitCopilot,
  selectedQuestionIds,
  externalCommand,
  keyState, onKeys, onReloadKeys,
  onGenerate,
  onUseTemplate,
  onImportDocument,
}) => {
  const {session, setSession, notice: chatNotice} = useChatSession(ownerId, exam.id);
  const [restoredComposer, setRestoredComposer] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const requestSequence = useRef(0);
  const [errorCode, setErrorCode] = useState('');
  const [freeAnswer, setFreeAnswer] = useState('');
  const [touchKeyboard, setTouchKeyboard] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setTouchKeyboard(matchMedia('(pointer: coarse)').matches); }, []);
  useEffect(() => () => { requestSequence.current++; controller.current?.abort(); }, []);
  const { panelRef, modal } = useSidePanel(isExpanded, onClose);
  const [composer, setComposer] = useState({ text: externalCommand ?? '', revision: 0 });
  const command = composer.text;
  const setCommand = (text: string) => setComposer(previous => ({ text, revision: previous.revision + 1 }));

  useEffect(() => { if (restoredComposer) setSession(previous => previous && previous.draft !== command ? {...previous, draft:command} : previous); }, [command, restoredComposer, setSession]);
  const [receivedCommand, setReceivedCommand] = useState(externalCommand);
  if (externalCommand !== receivedCommand) { setReceivedCommand(externalCommand); if (externalCommand) setCommand(externalCommand); }
  const proposalJournal = useAiProposal(ownerId, exam.id, 'copilot');
  const proposal = proposalJournal.entry?.record?.kind === 'copilot' ? proposalJournal.entry.record : null;
  const [isLoading, setIsLoading] = useState(false);
  const inFlight = useRef(false);
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const [clarification, setClarification] = useState<{
    message: string;
    quickOptions: string[];
    questionId: string;
  } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  if (session && !restoredComposer) { setRestoredComposer(true); setCommand(session.draft); setClarification(session.clarification ?? null); }
  const [retryText, setRetryText] = useState<string | null>(null);

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
    const textToSend = cmdText ?? command;
    if (!textToSend.trim()) return;
    if (proposal || inFlight.current) return;

    if (!session) return;
    setRetryText(textToSend);
    if (keyState === 'loading') { setErrorCode('KEY_LOADING'); setErrorMessage('Đang tải danh sách khóa. Yêu cầu đang gõ vẫn được giữ.'); return; }
    if (keyState === 'missing') { setErrorCode('NO_API_KEY'); setErrorMessage('Chưa có khóa AI đang bật. Thêm hoặc bật khóa rồi bấm Tiếp tục yêu cầu này.'); return; }
    if (session.turns.length >= 40) { setErrorCode('CHAT_LIMIT'); setErrorMessage('Hội thoại đã dài. Hãy tải lại nội dung để dự phòng và mở một yêu cầu mới; chưa gọi AI.'); return; }
    const submittedRevision = composer.revision;
    const requestId = crypto.randomUUID();
    const sequence = ++requestSequence.current;
    const abort = new AbortController(); controller.current = abort;
    const timeout = setTimeout(() => abort.abort(), 240000);
    const sentTurns = [...session.turns, {id:requestId,role:'user' as const,text:textToSend}];
    setSession(previous => previous ? {...previous,turns:sentTurns,pending:true,clarification:null} : previous);
    const base = captureCopilotBase(ownerId, exam);
    inFlight.current = true;
    setIsLoading(true);
    setHasStartedChat(true);
    setClarification(null);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await accountFetch(ownerId, '/api/exam-copilot', {
        method: 'POST',
        signal: abort.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recentTurns: session.turns,
          conversationId: session.conversationId, requestId,
          ...(clarification ? {replyTo:clarification.questionId} : {}),
          exam,
          command: textToSend,
          targetQuestionId: selectedQuestionIds.length === 1 ? selectedQuestionIds[0] : undefined,
        }),
      });

      if (sequence !== requestSequence.current || abort.signal.aborted) return;
      const data = await res.json().catch(() => ({success:false, code:'GATEWAY_ERROR', error:'Chưa đọc được phản hồi máy chủ. Yêu cầu vẫn được giữ; hãy thử lại sau.'}));
      if (sequence !== requestSequence.current || abort.signal.aborted) return;
      if (!data.success || !data.result) {
        setErrorCode(data.code || 'AI_ERROR');
        setErrorMessage(data.error || 'AI chưa xử lý được yêu cầu này. Thầy/Cô vui lòng thử lại.');
        return;
      }

      const result = data.result;
      setSession(previous => previous ? {...previous, turns:[...previous.turns, {id:crypto.randomUUID(),role:'assistant',text:result.message || result.explanation || 'Có đề xuất để bạn xem và nhận.'}]} : previous);

      // Trường hợp 1: AI cần làm rõ thêm thông tin
      if (result.type === 'clarification') {
        const question = {
          questionId: requestId,
          message: result.message || 'AI cần thêm thông tin để làm chính xác yêu cầu của Thầy/Cô:',
          quickOptions: result.quickOptions || [],
        };
        setClarification(question);
        setSession(previous => previous ? {...previous,clarification:question} : previous);
        return;
      }

      // Trường hợp 2: AI thực hiện hành động
      if (result.type === 'action') {
        if (result.modifiedQuestion) normalizeQuestion(result.modifiedQuestion);
        createAiProposal({ kind: 'copilot', result, base });
        // Clear only the submitted composer revision. Chips never consume a separate typed draft.
        setComposer(current => cmdText === undefined && current.revision === submittedRevision
          ? { text: '', revision: current.revision + 1 }
          : current);
      }
    } catch (err: unknown) {
      if (sequence !== requestSequence.current) return;
      setErrorCode(abort.signal.aborted ? 'TIMEOUT' : 'NETWORK_ERROR');
      setErrorMessage(abort.signal.aborted ? 'Chưa nhận được kết quả trong thời gian chờ. Yêu cầu còn trong lịch sử; chưa tự gọi lại.' : 'Chưa kết nối được máy chủ. Yêu cầu vẫn được giữ; hãy thử lại sau.');
      void err;
    } finally {
      clearTimeout(timeout);
      if (sequence === requestSequence.current) {
        setSession(previous => previous ? {...previous,pending:false} : previous);
        inFlight.current = false;
        setIsLoading(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading && !touchKeyboard && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSendCommand();
    }
  };

  return (
    <aside ref={panelRef} role={modal && isExpanded ? 'dialog' : undefined} aria-modal={modal && isExpanded || undefined}
      aria-label="Trợ lý và công cụ nhanh"
      className={`no-print select-text flex-col justify-between bg-[var(--ui-surface)] h-full w-full overflow-hidden ${
        isExpanded ? 'flex' : 'hidden'
      }`}
    >
      {proposalJournal.notice && <p role="status" className={isExpanded ? 'p-3 text-sm' : 'hidden'}>{proposalJournal.notice}</p>}
      {proposal && <div className={isExpanded ? 'max-h-[60%] shrink-0 min-h-0 overflow-y-auto' : 'hidden'}><CopilotProposalReview key={proposalJournal.entry!.key} base={proposal.base} result={proposal.result} ownerId={ownerId} exam={exam} onSubmit={onSubmitCopilot} onApplied={() => { proposalJournal.archive(); setSuccessMessage('Đã áp dụng vào bản soạn. Bản đối chiếu được giữ; hãy lưu đề và kiểm tra nội dung trước khi chốt.'); }} onDiscard={() => { proposalJournal.archive(); }} /></div>}
      {isExpanded && (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Vùng nội dung cuộn bên trong Panel */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatNotice && <p role="status" className="text-xs">{chatNotice}</p>}
            {session && session.turns.length > 0 && <div aria-label="Lịch sử trò chuyện" className="space-y-3 text-sm">{session.turns.map(turn => <div key={turn.id} className="whitespace-pre-wrap break-words rounded-xl border p-3"><b>{turn.role === 'user' ? 'Bạn' : 'AI'}</b><p>{turn.text}</p></div>)}</div>}
            {session && <button type="button" className="text-xs underline" onClick={() => { const url=URL.createObjectURL(new Blob([JSON.stringify(session,null,2)],{type:'application/json'})); const anchor=document.createElement('a');anchor.href=url;anchor.download='examcraft-hoi-thoai.json';anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000); }}>Tải hội thoại</button>}
            {/* Gợi ý một chạm (Quick Action Chips Google Pill style) */}
            {!hasStartedChat && !session?.turns.length && !proposal && <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5f6368] dark:text-[#9aa0a6] flex items-center gap-1">
                <Compass className="w-3 h-3" />
                Gợi ý lệnh nhanh:
              </span>

              {exam.questions.length === 0 ? (
                <div className="space-y-2 text-xs">
                  <p>Đề chưa có câu hỏi. Bắt đầu bằng cách sinh câu, dùng mẫu hoặc nhập tài liệu.</p>
                  {[
                    { label: 'Sinh câu từ mô tả', action: onGenerate },
                    { label: 'Dùng mẫu', action: onUseTemplate },
                    { label: 'Nhập tài liệu', action: onImportDocument },
                  ].filter(item => item.action).map(item => (
                    <button key={item.label} type="button" onClick={item.action}
                      className="app-button-secondary flex min-h-11 w-full items-center justify-between rounded-xl px-3 text-left">
                      {item.label}<ChevronRight className="h-4 w-4" />
                    </button>
                  ))}
                </div>
              ) : <div className="grid grid-cols-1 gap-1.5">
                <button
                  onClick={() => handleSendCommand(activeQuestionNumber ? `Đổi số liệu và tính toán lại đáp án cho câu ${activeQuestionNumber}` : 'Đổi số liệu toàn bộ các câu hỏi trong đề thi')}
                  disabled={isLoading || !!proposal}
                  className="w-full text-left text-xs px-3 py-2 rounded-xl bg-[#f8f9fa] dark:bg-[#242424] hover:bg-[#f1f3f4] dark:hover:bg-[#2d2f31] border border-[#dadce0] dark:border-[#3c4043] text-[#202124] dark:text-[#e3e3e3] transition-colors flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <Binary className="w-3.5 h-3.5 text-[#3c4043] dark:text-[#e3e3e3]" />
                    <span>{activeQuestionNumber ? `Đổi số liệu câu ${activeQuestionNumber}` : 'Đổi số liệu các câu'}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#5f6368] dark:text-[#9aa0a6] group-hover:translate-x-0.5 transition-transform" />
                </button>

                <button
                  onClick={() => handleSendCommand(activeQuestionNumber ? `Tăng độ khó câu ${activeQuestionNumber}, giữ đúng môn và nội dung đang học` : 'Tăng độ khó các câu hỏi trong đề thi')}
                  disabled={isLoading || !!proposal}
                  className="w-full text-left text-xs px-3 py-2 rounded-xl bg-[#f8f9fa] dark:bg-[#242424] hover:bg-[#f1f3f4] dark:hover:bg-[#2d2f31] border border-[#dadce0] dark:border-[#3c4043] text-[#202124] dark:text-[#e3e3e3] transition-colors flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <Flame className="w-3.5 h-3.5 text-[var(--ui-text-secondary)]" />
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
                    <ArrowDownCircle className="w-3.5 h-3.5 text-[var(--ui-accent)]" />
                    <span>{activeQuestionNumber ? `Giảm độ khó câu ${activeQuestionNumber}` : 'Giảm độ khó'}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#5f6368] dark:text-[#9aa0a6] group-hover:translate-x-0.5 transition-transform" />
                </button>

                <button
                  onClick={() => handleSendCommand(activeQuestionNumber ? `Thêm bối cảnh thực tế cho câu ${activeQuestionNumber}, giữ đúng môn học` : 'Thêm bối cảnh thực tế cho đề thi')}
                  disabled={isLoading || !!proposal}
                  className="w-full text-left text-xs px-3 py-2 rounded-xl bg-[#f8f9fa] dark:bg-[#242424] hover:bg-[#f1f3f4] dark:hover:bg-[#2d2f31] border border-[#dadce0] dark:border-[#3c4043] text-[#202124] dark:text-[#e3e3e3] transition-colors flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <Wand2 className="w-3.5 h-3.5 text-[var(--ui-text-secondary)]" />
                    <span>Thêm bối cảnh thực tế</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#5f6368] dark:text-[#9aa0a6] group-hover:translate-x-0.5 transition-transform" />
                </button>

                <button
                  onClick={() => handleSendCommand(activeQuestionNumber ? `Tạo thêm 1 câu hỏi tương tự câu ${activeQuestionNumber}` : 'Tạo thêm 1 câu hỏi tương đương')}
                  disabled={isLoading || !!proposal}
                  className="w-full text-left text-xs px-3 py-2 rounded-xl bg-[#f8f9fa] dark:bg-[#242424] hover:bg-[#f1f3f4] dark:hover:bg-[#2d2f31] border border-[#dadce0] dark:border-[#3c4043] text-[#202124] dark:text-[#e3e3e3] transition-colors flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 text-[#3c4043] dark:text-[#e3e3e3]" />
                    <span>Tạo câu hỏi tương đương</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#5f6368] dark:text-[#9aa0a6] group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>}
            </div>}

            {/* Hộp AI hỏi lại để làm rõ (Clarification Dialog) */}
            {clarification && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs space-y-2">
                <div className="flex items-start gap-2">
                  <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <p className="font-semibold text-amber-900 dark:text-amber-200 leading-snug">
                    {clarification.message}
                  </p>
                </div>

                <form onSubmit={event => {event.preventDefault(); if(freeAnswer.trim()) {void handleSendCommand(freeAnswer);setFreeAnswer('');}}} className="flex flex-col gap-2">
                  <label>Tự nhập câu trả lời<input aria-label="Tự nhập câu trả lời" value={freeAnswer} onChange={event=>setFreeAnswer(event.target.value)} className="w-full rounded-lg border p-2 bg-[var(--ui-surface)]" maxLength={12000} /></label>
                  <button type="submit" disabled={isLoading || !!proposal || !freeAnswer.trim()} className="app-button-secondary min-h-11">Gửi câu trả lời</button>
                </form>
                {clarification.quickOptions.length > 0 && (
                  <div className="flex flex-col gap-1.5 pt-1">
                    {clarification.quickOptions.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendCommand(opt)}
                        disabled={isLoading || !!proposal}
                        className="text-left text-xs px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#202124] border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
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
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Thông báo lỗi */}
            {errorMessage && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-900 dark:text-rose-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div role="alert" className="space-y-2"><p>{errorMessage}</p>
                  {['NO_API_KEY','INVALID_KEY','EXPIRED_KEY','REVOKED_KEY','KEY_DISABLED'].includes(errorCode) && <button type="button" className="underline min-h-11" onClick={onKeys}>Quản lý khóa AI</button>}
                  {errorCode === 'KEY_LOADING' && <button type="button" className="underline min-h-11" onClick={()=>void onReloadKeys?.()}>Tải lại danh sách khóa</button>}
                  {!['CHAT_LIMIT','KEY_LOADING'].includes(errorCode) && <button type="button" disabled={isLoading || !!proposal} className="underline min-h-11" onClick={()=>void handleSendCommand(retryText ?? undefined)}>Tiếp tục yêu cầu này</button>}
                </div>
              </div>
            )}
          </div>

          {/* Ô nhập lệnh phía dưới chuẩn Google Material Box */}
          <div className="p-3 border-t border-[#dadce0] dark:border-[#3c4043] bg-white dark:bg-[#17181a] space-y-2 shrink-0">
            <div className="relative">
              <textarea
                id="right-copilot-input"
                rows={2}
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={handleKeyDown}
                aria-label="Yêu cầu cho AI"
                placeholder={exam.questions.length ? 'Nhập yêu cầu, ví dụ: sửa câu 2, giải thích đáp án…' : 'Mô tả câu hỏi bạn muốn thêm…'}
                className="w-full text-xs p-2.5 bg-[#f8f9fa] dark:bg-[#242424] text-[#202124] dark:text-[#e3e3e3] border border-[#dadce0] dark:border-[#3c4043] rounded-xl focus:border-[#3c4043] dark:focus:border-[#e3e3e3] focus:ring-1 focus:ring-[#3c4043] dark:focus:ring-[#e3e3e3] outline-hidden resize-none transition-all placeholder:text-[#5f6368] dark:placeholder:text-[#9aa0a6] disabled:opacity-50"
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-[#5f6368] dark:text-[#9aa0a6]">
                {touchKeyboard ? 'Enter xuống dòng · Dùng nút để gửi' : <>Nhấn <kbd className="px-1.5 py-0.5 rounded bg-[#f1f3f4] dark:bg-[#292a2d] border border-[#dadce0] dark:border-[#3c4043] font-mono">Enter ↵</kbd> để gửi</>}
              </span>

              {isLoading && <button type="button" className="app-button-secondary min-h-11 px-3" onClick={() => {requestSequence.current++;controller.current?.abort();inFlight.current=false;setIsLoading(false);setSession(previous=>previous ? {...previous,pending:false}:previous);setErrorCode('AI_CANCELLED');setErrorMessage('Đã dừng chờ kết quả. Nội dung đã gửi và chữ đang gõ vẫn được giữ.');}}>Dừng</button>}
              <button
                onClick={() => handleSendCommand()}
                  disabled={isLoading || !!proposal || !command.trim()}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-all shadow-xs cursor-pointer disabled:cursor-not-allowed app-button-primary text-white dark:bg-[#e3e3e3] dark:hover:bg-[#f1f3f4] dark:text-[#202124] disabled:opacity-40"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang xử lý yêu cầu trước…</span>
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
