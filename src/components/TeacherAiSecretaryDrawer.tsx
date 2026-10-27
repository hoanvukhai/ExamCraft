'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  X,
  Bot,
  Brain,
  RefreshCw,
  HelpCircle,
  Lightbulb,
  FileText,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface TeacherAiSecretaryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: {
    name: string;
    email: string;
    role: string;
  };
  onOpenAiLearningModal: () => void;
}

export const TeacherAiSecretaryDrawer: React.FC<TeacherAiSecretaryDrawerProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenAiLearningModal,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'msg_welcome',
      role: 'assistant',
      content: `Kính chào Thầy/Cô ${currentUser.name}! Em là Thư ký số & Trợ lý sư phạm riêng của Thầy/Cô.\n\nEm đã được đồng bộ với kho đề thi và hồ sơ phong cách giảng dạy của Thầy/Cô. Thầy/Cô cần em hỗ trợ thống kê, tìm kiếm đề thi, hay tư vấn cấu trúc ra đề hôm nay ạ?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const quickPrompts = [
    '📊 Thống kê tình hình kho đề thi của tôi?',
    '💡 Tư vấn cấu trúc đề Tốt nghiệp THPT 2025 môn Toán?',
    '🎯 Gợi ý 3 bài toán thực tế Vận dụng cao?',
    '🔍 Có lưu ý pháp lý nào mới theo TT 17/2025 không?',
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user_${crypto.randomUUID()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const historyPayload = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/teacher/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: historyPayload,
        }),
      });

      const data = await res.json();
      if (data.success && data.reply) {
        const aiMsg: ChatMessage = {
          id: `ai_${crypto.randomUUID()}`,
          role: 'assistant',
          content: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        const errorMsg: ChatMessage = {
          id: `ai_err_${crypto.randomUUID()}`,
          role: 'assistant',
          content: data.error || 'Dạ thưa Thầy/Cô, hiện tại em chưa kết nối được máy chủ AI. Thầy/Cô vui lòng kiểm tra lại Khóa AI cá nhân ạ.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch (err) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: `ai_err_${crypto.randomUUID()}`,
        role: 'assistant',
        content: 'Dạ, có lỗi kết nối mạng. Thầy/Cô vui lòng thử lại sau giây lát ạ.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-white dark:bg-[#202124] border-l border-[#dadce0] dark:border-[#3c4043] shadow-xs flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="h-16 px-4 border-b border-[#dadce0] dark:border-[#3c4043] flex items-center justify-between shrink-0 bg-white dark:bg-[#202124]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl app-neutral-icon text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5 text-[var(--ui-text-primary)]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-xs sm:text-sm text-[#202124] dark:text-white">
                Thư Ký Số & Trợ Lý Giáo Viên
              </h3>
              <span className="w-2 h-2 rounded-full bg-[var(--ui-text-secondary)] " />
            </div>
            <p className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6]">
              Trợ lý sư phạm cá nhân hóa
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onOpenAiLearningModal}
            title="Xem hồ sơ phong cách mà em đã học từ Thầy/Cô"
            className="p-1.5 rounded-lg text-[var(--ui-accent)] hover:bg-neutral-50 dark:hover:bg-neutral-900/40 transition-colors cursor-pointer"
          >
            <Brain className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#5f6368] hover:text-[#202124] dark:text-[#9aa0a6] dark:hover:text-white hover:bg-black/5 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Profile Banner */}
      <div className="px-4 py-2 bg-neutral-50/70 dark:bg-neutral-900/30 border-b border-[var(--ui-border)] dark:border-[var(--ui-border)]/40 flex items-center justify-between text-[11px] text-[var(--ui-accent)] dark:text-[var(--ui-accent)] shrink-0">
        <div className="flex items-center gap-1.5 truncate">
          <Brain className="w-3.5 h-3.5 text-[var(--ui-accent)] shrink-0" />
          <span className="truncate">Đang áp dụng Hồ sơ phong cách riêng của Thầy/Cô</span>
        </div>
        <button
          onClick={onOpenAiLearningModal}
          className="text-[10px] font-bold text-[var(--ui-accent)] dark:text-[var(--ui-accent)] hover:underline shrink-0 flex items-center"
        >
          <span>Xem</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 min-h-0 bg-[#f8f9fa]/50 dark:bg-[#17181a]/50">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${
              m.role === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed shadow-2xs whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-[#3c4043] text-white rounded-br-xs'
                  : 'bg-white dark:bg-[#252525] border border-[#dadce0] dark:border-[#3c4043] text-[#202124] dark:text-[#e3e3e3] rounded-bl-xs'
              }`}
            >
              {m.content}
            </div>
            <span className="text-[9px] text-[#5f6368] dark:text-[#9aa0a6] px-1 mt-1">
              {m.timestamp}
            </span>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-[#5f6368] dark:text-[#9aa0a6] p-2 bg-white dark:bg-[#252525] rounded-xl border border-[#dadce0] dark:border-[#3c4043] w-fit shadow-2xs">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-[var(--ui-accent)]" />
            <span>Thư ký AI đang soạn câu trả lời...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Suggestions */}
      <div className="p-2 border-t border-[#dadce0] dark:border-[#3c4043] bg-white dark:bg-[#202124] shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {quickPrompts.map((q, idx) => (
            <button
              key={idx}
              disabled={isLoading}
              onClick={() => handleSendMessage(q.replace(/^[^\w\s]+\s*/, ''))}
              className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-lg bg-[#f1f3f4] dark:bg-[#292a2d] hover:bg-[#f1f3f4] dark:hover:bg-[#292a2d] text-[#3c4043] dark:text-[#e3e3e3] hover:text-[#3c4043] transition-colors cursor-pointer shrink-0 border border-transparent hover:border-[var(--ui-border)]"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-[#dadce0] dark:border-[#3c4043] bg-white dark:bg-[#202124] shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2 bg-[#f1f3f4] dark:bg-[#292a2d] rounded-xl px-3 py-1.5 border border-transparent focus-within:border-[#3c4043] focus-within:bg-white dark:focus-within:bg-[#202124] transition-colors"
        >
          <input
            type="text"
            placeholder="Hỏi Thư ký AI (thống kê kho đề, tư vấn cấu trúc, gợi ý câu hỏi)..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            className="flex-1 bg-transparent text-xs text-[#202124] dark:text-white outline-hidden placeholder:text-[#5f6368] dark:placeholder:text-[#9aa0a6]"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="w-7 h-7 rounded-lg app-button-primary text-white flex items-center justify-center disabled:opacity-40 transition-all cursor-pointer shadow-2xs shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
