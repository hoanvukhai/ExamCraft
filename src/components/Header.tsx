'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  GraduationCap, 
  Menu, 
  CloudCheck, 
  CloudUpload, 
  Sun, 
  Moon, 
  Key, 
  LogOut, 
  ShieldCheck, 
  ChevronDown,
  Edit3,
  User as UserIcon,
  Activity,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { useTheme } from './ThemeProvider';

interface HeaderProps {
  examTitle: string;
  onUpdateTitle: (newTitle: string) => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onOpenApiKeyModal: () => void;
  hasActiveKey: boolean;
  keyCount?: number;
  keyErrorCount?: number;
  quota?: {
    dailyLimit: number;
    usedToday: number;
    remaining: number;
  };
  isCloudSaving?: boolean;
  isCloudSaved?: boolean;
  currentUser?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  onToggleCopilot?: () => void;
  isCopilotOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  examTitle,
  onUpdateTitle,
  isSidebarCollapsed,
  onToggleSidebar,
  onOpenApiKeyModal,
  hasActiveKey,
  keyCount = 0,
  keyErrorCount = 0,
  quota = { dailyLimit: 100, usedToday: 0, remaining: 100 },
  isCloudSaving = false,
  isCloudSaved = true,
  currentUser = null,
  onToggleCopilot,
  isCopilotOpen = false,
}) => {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(examTitle);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Cập nhật tempTitle khi examTitle từ props đổi
  useEffect(() => {
    setTempTitle(examTitle);
  }, [examTitle]);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (tempTitle.trim() && tempTitle.trim() !== examTitle) {
      onUpdateTitle(tempTitle.trim());
    } else {
      setTempTitle(examTitle);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    router.push('/login');
    router.refresh();
  };

  const usagePercent = quota.dailyLimit > 0 
    ? Math.min(100, Math.round((quota.usedToday / quota.dailyLimit) * 100))
    : 0;

  return (
    <header className="no-print h-14 bg-white dark:bg-[#181818] border-b border-[#dadce0] dark:border-[#3c4043] shrink-0 z-30 px-3 sm:px-5 flex items-center justify-between gap-3 shadow-xs transition-colors duration-200">
      {/* KHU VỰC TRÁI: Toggle menu, Logo ExamCraft, Tiêu đề đề thi & Trạng thái lưu Google Docs style */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
        {/* Nút toggle Sidebar */}
        <button
          onClick={onToggleSidebar}
          title={isSidebarCollapsed ? 'Mở rộng bảng công cụ' : 'Thu gọn bảng công cụ'}
          className="p-2 rounded-full text-[#5f6368] hover:text-[#202124] dark:text-[#9aa0a6] dark:hover:text-[#e3e3e3] hover:bg-[#f1f3f4] dark:hover:bg-[#282828] transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Logo ExamCraft Google Style */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-8 h-8 rounded-full bg-[#202124] dark:bg-[#282828] text-white dark:text-[#8ab4f8] border border-transparent dark:border-[#3c4043] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <GraduationCap className="w-4 h-4" />
          </div>
          <span className="font-bold text-[#202124] dark:text-[#e3e3e3] text-base sm:text-lg tracking-tight hidden sm:inline">
            ExamCraft
          </span>
        </Link>

        {/* Ngăn cách thanh mảnh */}
        <div className="h-5 w-[1px] bg-[#dadce0] dark:bg-[#3c4043] hidden sm:block shrink-0" />

        {/* Tên đề thi (Sửa trực tiếp phong cách Google Docs) */}
        <div className="flex items-center gap-2 min-w-0 flex-1 max-w-xl">
          {isEditingTitle ? (
            <input
              type="text"
              autoFocus
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleSubmit();
                if (e.key === 'Escape') {
                  setTempTitle(examTitle);
                  setIsEditingTitle(false);
                }
              }}
              className="text-sm font-semibold text-[#202124] dark:text-[#e3e3e3] bg-white dark:bg-[#282828] border border-[#1a73e8] dark:border-[#8ab4f8] rounded-md px-2 py-0.5 outline-hidden w-full shadow-xs"
            />
          ) : (
            <button
              onClick={() => {
                setTempTitle(examTitle);
                setIsEditingTitle(true);
              }}
              title="Nhấn để đổi tên đề thi (như Google Docs)"
              className="group flex items-center gap-1.5 text-sm font-semibold text-[#202124] dark:text-[#e3e3e3] hover:bg-[#f1f3f4] dark:hover:bg-[#282828] px-2 py-1 rounded-md transition-colors truncate text-left cursor-pointer"
            >
              <span className="truncate">{examTitle || 'Đề kiểm tra không tên'}</span>
              <Edit3 className="w-3.5 h-3.5 text-[#5f6368] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </button>
          )}

          {/* Trạng thái Auto-save giống Google Docs ("Đã lưu vào Drive") */}
          <div className="hidden md:flex items-center gap-1 text-[11px] text-[#5f6368] dark:text-[#9aa0a6] shrink-0">
            {isCloudSaving ? (
              <span className="flex items-center gap-1 text-[#1a73e8] dark:text-[#8ab4f8]">
                <CloudUpload className="w-3.5 h-3.5 animate-bounce" />
                <span>Đang lưu...</span>
              </span>
            ) : isCloudSaved ? (
              <span className="flex items-center gap-1 text-[#5f6368] dark:text-[#9aa0a6]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Đã lưu đám mây</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-500">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>Chưa lưu</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* KHU VỰC PHẢI: Dark Mode, Nút Khóa AI, Gemini Toggle, Avatar User & Menu Giám sát */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Nút bật/tắt Bảng Trợ lý AI Gemini (Right Companion Rail) */}
        {onToggleCopilot && (
          <button
            onClick={onToggleCopilot}
            title={isCopilotOpen ? "Đóng thanh trợ lý AI Gemini (Cột phải)" : "Mở thanh trợ lý AI Gemini (Cột phải)"}
            className={`p-2 rounded-full transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium ${
              isCopilotOpen
                ? 'bg-[#e8f0fe] dark:bg-[#1e2a38] text-[#1a73e8] dark:text-[#8ab4f8] border border-blue-200 dark:border-[#3c4043]'
                : 'text-[#5f6368] hover:text-[#202124] dark:text-[#9aa0a6] dark:hover:text-[#e3e3e3] hover:bg-[#f1f3f4] dark:hover:bg-[#282828]'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="hidden md:inline">Gemini AI</span>
          </button>
        )}

        {/* Nút bật/tắt Dark Mode */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Chuyển sang chế độ Sáng (Màu trắng Google)' : 'Chuyển sang chế độ Tối (Dark Mode)'}
          className="p-2 rounded-full text-[#5f6368] hover:text-[#202124] dark:text-[#9aa0a6] dark:hover:text-[#e3e3e3] hover:bg-[#f1f3f4] dark:hover:bg-[#282828] transition-colors cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#5f6368]" />}
        </button>

        {/* Nút Trạng thái Khóa AI cá nhân (Badge Google Minimalist) */}
        <button
          onClick={onOpenApiKeyModal}
          title={
            !hasActiveKey
              ? 'Tài khoản chưa có API Key: Nhấn để thêm khóa cá nhân'
              : keyErrorCount > 0
              ? `Có ${keyErrorCount} khóa bị lỗi hoặc hết lượt (429)!`
              : `Khóa AI Google Gemini: ${keyCount} khóa đang hoạt động tốt`
          }
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border cursor-pointer shadow-2xs ${
            !hasActiveKey
              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100'
              : keyErrorCount > 0
              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800 hover:bg-rose-100'
              : 'bg-white dark:bg-[#282828] text-[#3c4043] dark:text-[#e3e3e3] border-[#dadce0] dark:border-[#3c4043] hover:bg-[#f8f9fa] dark:hover:bg-[#303134]'
          }`}
        >
          <Key className="w-3.5 h-3.5 text-[#5f6368] dark:text-[#9aa0a6]" />
          <span className="hidden sm:inline">Khóa AI</span>
          {keyCount > 0 && <span className="font-mono text-[11px] font-semibold">({keyCount})</span>}
          <span
            className={`w-2 h-2 rounded-full ${
              !hasActiveKey
                ? 'bg-amber-500 animate-pulse'
                : keyErrorCount > 0
                ? 'bg-rose-500 animate-pulse'
                : 'bg-emerald-500'
            }`}
          />
        </button>

        {/* Avatar & Dropdown Menu với Bảng Theo Dõi Khóa AI Trực Quan */}
        {currentUser ? (
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 py-1 px-1.5 sm:px-2 rounded-full hover:bg-[#f1f3f4] dark:hover:bg-[#282828] transition-colors cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-[#202124] dark:bg-[#282828] text-white dark:text-[#8ab4f8] border border-transparent dark:border-[#3c4043] flex items-center justify-center text-xs font-bold shadow-xs">
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#5f6368] dark:text-[#9aa0a6] hidden sm:block" />
            </button>

            {isUserMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsUserMenuOpen(false)} 
                />
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#1e1e1e] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl shadow-2xl z-50 p-2.5 text-xs divide-y divide-[#f1f3f4] dark:divide-[#3c4043] animate-in fade-in zoom-in-95 duration-100">
                  {/* THÔNG TIN NGƯỜI DÙNG */}
                  <div className="p-2">
                    <p className="font-bold text-[#202124] dark:text-[#e3e3e3] text-sm truncate">{currentUser.name}</p>
                    <p className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] truncate">{currentUser.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#e8f0fe] dark:bg-[#1e2a38] text-[#1a73e8] dark:text-[#8ab4f8]">
                      {currentUser.role === 'SUPER_ADMIN' ? 'Quản trị viên' : 'Giáo viên'}
                    </span>
                  </div>

                  {/* KHỐI THEO DÕI TRẠNG THÁI KHÓA AI & HẠN MỨC */}
                  <div className="py-2.5">
                    <div className="p-3 bg-[#f8f9fa] dark:bg-[#282828]/60 rounded-2xl border border-[#dadce0] dark:border-[#3c4043] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#3c4043] dark:text-[#e3e3e3] flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-[#1a73e8] dark:text-[#8ab4f8]" />
                          <span>Kho Khóa AI Của Bạn</span>
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          !hasActiveKey
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : keyErrorCount > 0
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        }`}>
                          {!hasActiveKey 
                            ? 'Chưa có key' 
                            : keyErrorCount > 0 
                            ? `${keyErrorCount} key lỗi/429` 
                            : `${keyCount} key sẵn sàng`}
                        </span>
                      </div>

                      {/* Thanh tiến trình hạn mức hôm nay */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-[#5f6368] dark:text-[#9aa0a6]">
                          <span>Đã dùng hôm nay:</span>
                          <span className="font-bold text-[#202124] dark:text-[#e3e3e3]">{quota.usedToday} / {quota.dailyLimit} lượt</span>
                        </div>
                        <div className="w-full bg-[#dadce0] dark:bg-[#3c4043] h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${
                              usagePercent > 80 ? 'bg-rose-500' : 'bg-[#1a73e8] dark:bg-[#8ab4f8]'
                            }`}
                            style={{ width: `${usagePercent}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                          <span>Còn lại: {quota.remaining} lượt</span>
                          <span className="text-[#5f6368] dark:text-[#9aa0a6] font-sans">({usagePercent}%)</span>
                        </div>
                      </div>

                      {/* Cảnh báo trạng thái */}
                      {!hasActiveKey ? (
                        <p className="text-[11px] text-amber-700 dark:text-amber-300 flex items-center gap-1.5 pt-0.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                          <span>Chưa thêm khóa AI cá nhân!</span>
                        </p>
                      ) : keyErrorCount > 0 ? (
                        <p className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1.5 pt-0.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                          <span>Có khóa đang chạm hạn mức 429!</span>
                        </p>
                      ) : (
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 pt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                          <span>Tự động xoay tua đa khóa sẵn sàng</span>
                        </p>
                      )}

                      {/* Nút bấm mở nhanh Modal Quản lý API Key */}
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenApiKeyModal();
                        }}
                        className="w-full mt-1 py-2 px-3 bg-[#202124] hover:bg-[#303134] text-white dark:bg-[#282828] dark:text-[#e3e3e3] dark:hover:bg-[#303134] dark:border dark:border-[#3c4043] rounded-full font-medium text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      >
                        <Key className="w-3.5 h-3.5" />
                        <span>Quản lý & Kiểm tra Khóa AI</span>
                      </button>
                    </div>
                  </div>

                  {currentUser.role === 'SUPER_ADMIN' && (
                    <div className="py-1">
                      <Link
                        href="/admin/users"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-full text-[#3c4043] dark:text-[#e3e3e3] hover:bg-[#f1f3f4] dark:hover:bg-[#282828] transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4 text-[#1a73e8] dark:text-[#8ab4f8]" />
                        <span>Quản trị người dùng</span>
                      </Link>
                    </div>
                  )}

                  <div className="pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-full text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Đăng xuất tài khoản</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors"
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Đăng nhập</span>
          </Link>
        )}
      </div>
    </header>
  );
};
