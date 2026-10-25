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
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-white dark:bg-[#1e1e1e] border-l border-[#dadce0] dark:border-[#3c4043] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="h-16 px-4 border-b border-[#dadce0] dark:border-[#3c4043] flex items-center justify-between shrink-0 bg-white dark:bg-[#1e1e1e]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-xs sm:text-sm text-[#202124] dark:text-white">
                Thư Ký Số & Trợ Lý Giáo Viên
              </h3>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
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
            className="p-1.5 rounded-full text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors cursor-pointer"
          >
            <Brain className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#5f6368] hover:text-[#202124] dark:text-[#9aa0a6] dark:hover:text-white hover:bg-black/5 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Profile Banner */}
      <div className="px-4 py-2 bg-purple-50/70 dark:bg-purple-950/30 border-b border-purple-100 dark:border-purple-900/40 flex items-center justify-between text-[11px] text-purple-900 dark:text-purple-200 shrink-0">
        <div className="flex items-center gap-1.5 truncate">
          <Brain className="w-3.5 h-3.5 text-purple-600 shrink-0" />
          <span className="truncate">Đang áp dụng Hồ sơ phong cách riêng của Thầy/Cô</span>
        </div>
        <button
          onClick={onOpenAiLearningModal}
          className="text-[10px] font-bold text-purple-700 dark:text-purple-300 hover:underline shrink-0 flex items-center"
        >
          <span>Xem</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 min-h-0 bg-[#f8f9fa]/50 dark:bg-[#181818]/50">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${
              m.role === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-2xs whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-[#1a73e8] text-white rounded-br-xs'
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
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-600" />
            <span>Thư ký AI đang soạn câu trả lời...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Suggestions */}
      <div className="p-2 border-t border-[#dadce0] dark:border-[#3c4043] bg-white dark:bg-[#1e1e1e] shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {quickPrompts.map((q, idx) => (
            <button
              key={idx}
              disabled={isLoading}
              onClick={() => handleSendMessage(q.replace(/^[^\w\s]+\s*/, ''))}
              className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full bg-[#f1f3f4] dark:bg-[#282828] hover:bg-[#e8f0fe] dark:hover:bg-[#1e2a38] text-[#3c4043] dark:text-[#e3e3e3] hover:text-[#1a73e8] transition-colors cursor-pointer shrink-0 border border-transparent hover:border-blue-200"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-[#dadce0] dark:border-[#3c4043] bg-white dark:bg-[#1e1e1e] shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2 bg-[#f1f3f4] dark:bg-[#282828] rounded-2xl px-3 py-1.5 border border-transparent focus-within:border-[#1a73e8] focus-within:bg-white dark:focus-within:bg-[#1e1e1e] transition-colors"
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
            className="w-7 h-7 rounded-full bg-[#1a73e8] hover:bg-[#1557b0] text-white flex items-center justify-center disabled:opacity-40 transition-all cursor-pointer shadow-2xs shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
