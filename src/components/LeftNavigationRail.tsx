'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  Shuffle, 
  TableProperties, 
  Download, 
  Printer, 
  Share2, 
  Users, 
  Database, 
  Upload, 
  BookMarked, 
  Building2, 
  Key, 
  ChevronLeft, 
  ChevronRight,
  GraduationCap,
  Bot,
  Brain
} from 'lucide-react';

interface LeftNavigationRailProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenNewExamModal: () => void;
  onToggleCopilot: () => void;
  isCopilotOpen: boolean;
  onShuffleExam: () => void;
  onOpenImportModal: () => void;
  onOpenLibraryModal: () => void;
  onOpenQuestionBankModal: () => void;
  onOpenShareModal: () => void;
  onOpenResultsModal: () => void;
  onOpenHeaderSettingsModal: () => void;
  onOpenApiKeyModal: () => void;
  onExportWord: () => void;
  onPrintPdf: () => void;
  onToggleMatrixTab: () => void;
  isMatrixTabActive: boolean;
  submissionCount?: number;
  hasActiveKey?: boolean;
  onOpenAiLearningModal?: () => void;
}

export const LeftNavigationRail: React.FC<LeftNavigationRailProps> = ({
  isCollapsed,
  onToggleCollapse,
  onOpenNewExamModal,
  onToggleCopilot,
  isCopilotOpen,
  onShuffleExam,
  onOpenImportModal,
  onOpenLibraryModal,
  onOpenQuestionBankModal,
  onOpenShareModal,
  onOpenResultsModal,
  onOpenHeaderSettingsModal,
  onOpenApiKeyModal,
  onExportWord,
  onPrintPdf,
  onToggleMatrixTab,
  isMatrixTabActive,
  submissionCount = 0,
  hasActiveKey = false,
  onOpenAiLearningModal,
}) => {
  return (
    <aside
      aria-label="Bảng công cụ soạn đề"
      className={`no-print select-none shrink-0 transition-all duration-300 ease-in-out flex-col justify-between border-r ${
        isCollapsed ? 'hidden lg:flex lg:w-16' : 'absolute inset-y-0 left-0 flex w-60 lg:relative'
      } bg-white dark:bg-[#181818] border-[#dadce0] dark:border-[#3c4043] z-20 h-full shadow-xs`}
    >
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {/* Nút Tạo đề mới / Sinh đề AI Chuẩn Google Drive FAB Style */}
        <div className="px-1">
          <button
            onClick={onOpenNewExamModal}
            className={`w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-full font-medium text-xs transition-all cursor-pointer ${
              isCollapsed
                ? 'bg-white dark:bg-[#282828] text-[#202124] dark:text-[#e3e3e3] border border-[#dadce0] dark:border-[#3c4043] shadow-xs hover:shadow-md hover:bg-[#f8f9fa] dark:hover:bg-[#303134]'
                : 'bg-white dark:bg-[#282828] text-[#202124] dark:text-[#e3e3e3] border border-[#dadce0] dark:border-[#3c4043] shadow-xs hover:shadow-md hover:bg-[#f8f9fa] dark:hover:bg-[#303134]'
            }`}
            title="Tạo bản nháp đề để giáo viên kiểm tra và chỉnh sửa"
          >
            <Sparkles className="w-4 h-4 shrink-0 text-amber-500 animate-pulse" />
            {!isCollapsed && <span className="truncate font-semibold text-[#202124] dark:text-[#e3e3e3]">Sinh đề AI Mới</span>}
          </button>
        </div>

        {/* NHÓM 1: CÔNG CỤ SOẠN THẢO & TRỢ LÝ */}
        <div className="space-y-1">
          {!isCollapsed && (
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#5f6368] dark:text-[#9aa0a6] mb-1">
              Biên tập & Công cụ
            </p>
          )}

          {/* Trợ lý AI Copilot (Kích hoạt Companion Panel) */}
          <button
            onClick={onToggleCopilot}
            title="Mở thanh trợ lý AI Gemini ở cột bên phải"
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              isCopilotOpen
                ? 'bg-[#e8f0fe] dark:bg-[#1e2a38] text-[#1a73e8] dark:text-[#8ab4f8] font-semibold'
                : 'text-[#3c4043] dark:text-[#e3e3e3] hover:bg-[#f1f3f4] dark:hover:bg-[#282828]'
            }`}
          >
            <Bot className={`w-4 h-4 shrink-0 ${isCopilotOpen ? 'text-[#1a73e8] dark:text-[#8ab4f8]' : 'text-[#5f6368] dark:text-[#9aa0a6]'}`} />
            {!isCollapsed && <span className="truncate">Trợ lý AI Copilot</span>}
          </button>

          {/* Bộ Não AI Sư Phạm (Tự học & Phong cách) */}
          {onOpenAiLearningModal && (
            <button
              onClick={onOpenAiLearningModal}
              title="Xem và chọn ghi chú, cách trình bày riêng cho trợ lý"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-full text-xs font-medium text-[#3c4043] dark:text-[#e3e3e3] hover:bg-[#f1f3f4] dark:hover:bg-[#282828] transition-colors cursor-pointer"
            >
              <Brain className="w-4 h-4 shrink-0 text-purple-600 dark:text-purple-400" />
              {!isCollapsed && <span className="truncate">Ghi chú riêng cho AI</span>}
            </button>
          )}

          {/* Trộn đề 4 mã */}
          <button
            onClick={onShuffleExam}
            title="Trộn đề thành 4 mã đề kèm ma trận đáp án"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-full text-xs font-medium text-[#3c4043] dark:text-[#e3e3e3] hover:bg-[#f1f3f4] dark:hover:bg-[#282828] transition-colors cursor-pointer"
          >
            <Shuffle className="w-4 h-4 shrink-0 text-[#5f6368] dark:text-[#9aa0a6]" />
            {!isCollapsed && <span className="truncate">Trộn 4 mã đề</span>}
          </button>

          {/* Ma trận & Bản đặc tả CV 7991 */}
          <button
            onClick={onToggleMatrixTab}
            title="Xem phân bố câu hỏi và điểm của đề đang soạn"
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              isMatrixTabActive
                ? 'bg-[#e8f0fe] dark:bg-[#1e2a38] text-[#1a73e8] dark:text-[#8ab4f8] font-semibold'
                : 'text-[#3c4043] dark:text-[#e3e3e3] hover:bg-[#f1f3f4] dark:hover:bg-[#282828]'
            }`}
          >
            <TableProperties className={`w-4 h-4 shrink-0 ${isMatrixTabActive ? 'text-[#1a73e8] dark:text-[#8ab4f8]' : 'text-[#5f6368] dark:text-[#9aa0a6]'}`} />
            {!isCollapsed && <span className="truncate">Ma trận của đề</span>}
          </button>

          {/* Tiêu đề trường thi */}
          <button
            onClick={onOpenHeaderSettingsModal}
            title="Cài đặt Sở GD&ĐT, Trường THPT, thời gian, mã đề"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-full text-xs font-medium text-[#3c4043] dark:text-[#e3e3e3] hover:bg-[#f1f3f4] dark:hover:bg-[#282828] transition-colors cursor-pointer"
          >
            <Building2 className="w-4 h-4 shrink-0 text-[#5f6368] dark:text-[#9aa0a6]" />
            {!isCollapsed && <span className="truncate">Tiêu đề trường thi</span>}
          </button>
        </div>

        {/* NHÓM 2: DỮ LIỆU & NHẬP LIỆU VÀO ĐỀ */}
        <div className="space-y-1 pt-2 border-t border-[#f1f3f4] dark:border-[#3c4043]/60">
          {!isCollapsed && (
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#5f6368] dark:text-[#9aa0a6] mb-1">
              Ngân hàng & Nhập liệu
            </p>
          )}

          {/* Ngân hàng câu hỏi */}
          <button
            onClick={onOpenQuestionBankModal}
            title="Chọn câu hỏi từ Ngân hàng chèn vào đề"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-full text-xs font-medium text-[#3c4043] dark:text-[#e3e3e3] hover:bg-[#f1f3f4] dark:hover:bg-[#282828] transition-colors cursor-pointer"
          >
            <Database className="w-4 h-4 shrink-0 text-[#5f6368] dark:text-[#9aa0a6]" />
            {!isCollapsed && <span className="truncate">Ngân hàng câu hỏi</span>}
          </button>

          {/* Nhập đề Word/Ảnh */}
          <button onClick={onOpenLibraryModal} title="Sao lưu đề kèm ảnh và nhập kho cũ" className="w-full flex items-center gap-3 px-3 py-2 rounded-full text-xs font-medium hover:bg-[#f1f3f4] dark:hover:bg-[#282828]">
            <Download className="w-4 h-4 shrink-0" />{!isCollapsed && <span>Sao lưu · Nhập kho cũ</span>}
          </button>
          <button
            onClick={onOpenImportModal}
            title="Bóc tách câu hỏi từ file Word / Ảnh chụp đưa thêm vào đề"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-full text-xs font-medium text-[#3c4043] dark:text-[#e3e3e3] hover:bg-[#f1f3f4] dark:hover:bg-[#282828] transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4 shrink-0 text-[#5f6368] dark:text-[#9aa0a6]" />
            {!isCollapsed && <span className="truncate">Nhập đề (Word/Ảnh)</span>}
          </button>
        </div>

        {/* NHÓM 3: KHẢO THÍ & BẢNG ĐIỂM */}
        <div className="space-y-1 pt-2 border-t border-[#f1f3f4] dark:border-[#3c4043]/60">
          {!isCollapsed && (
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#5f6368] dark:text-[#9aa0a6] mb-1">
              Khảo thí Online
            </p>
          )}

          {/* Chia sẻ & Thi Online */}
          <button
            onClick={onOpenShareModal}
            title="Tạo link cho học sinh làm bài hoặc chia sẻ đề cho đồng nghiệp"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-full text-xs font-medium text-[#3c4043] dark:text-[#e3e3e3] hover:bg-[#f1f3f4] dark:hover:bg-[#282828] transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4 shrink-0 text-[#1a73e8] dark:text-[#8ab4f8]" />
            {!isCollapsed && <span className="truncate">Chia sẻ & Thi Online</span>}
          </button>

          {/* Bảng điểm học sinh */}
          <button
            onClick={onOpenResultsModal}
            title="Xem danh sách bài nộp và phổ điểm học sinh"
            className="w-full flex items-center justify-between px-3 py-2 rounded-full text-xs font-medium text-[#3c4043] dark:text-[#e3e3e3] hover:bg-[#f1f3f4] dark:hover:bg-[#282828] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3 truncate">
              <Users className="w-4 h-4 shrink-0 text-[#1a73e8] dark:text-[#8ab4f8]" />
              {!isCollapsed && <span className="truncate">Bảng điểm thi</span>}
            </div>
            {!isCollapsed && submissionCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[#e8f0fe] dark:bg-[#1e2a38] text-[#1a73e8] dark:text-[#8ab4f8]">
                {submissionCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* FOOTER CỦA SIDEBAR: CẤU HÌNH API KEY & NÚT THU GỌN */}
      <div className="p-2 border-t border-[#dadce0] dark:border-[#3c4043] space-y-1">
        {/* Quản lý API Key */}
        <button
          onClick={onOpenApiKeyModal}
          title="Quản lý khóa AI cá nhân và lượt dùng trong ứng dụng"
          className={`w-full flex items-center justify-between px-3 py-2 rounded-full text-xs font-medium transition-colors cursor-pointer ${
            hasActiveKey
              ? 'text-[#3c4043] dark:text-[#e3e3e3] hover:bg-[#f1f3f4] dark:hover:bg-[#282828]'
              : 'text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 font-semibold border border-amber-200 dark:border-amber-800'
          }`}
        >
          <div className="flex items-center gap-3 truncate">
            <Key className={`w-4 h-4 shrink-0 ${hasActiveKey ? 'text-emerald-500' : 'text-amber-600 animate-bounce'}`} />
            {!isCollapsed && <span className="truncate">Kho Khóa AI (Keys)</span>}
          </div>
          {!isCollapsed && (
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                hasActiveKey ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
          )}
        </button>

        {/* Nút thu gọn / mở rộng Sidebar */}
        <button
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
          className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-full text-[#5f6368] hover:text-[#202124] dark:text-[#9aa0a6] dark:hover:text-[#e3e3e3] hover:bg-[#f1f3f4] dark:hover:bg-[#282828] transition-colors cursor-pointer text-xs"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : (
            <div className="flex items-center gap-2">
              <ChevronLeft className="w-4 h-4" />
              <span className="text-[11px]">Thu gọn</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};
