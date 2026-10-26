'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, KeyRound, Sparkles, AlertCircle, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

export default function LoginPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Forced password change state
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [changeError, setChangeError] = useState('');
  const [loggedInUser, setLoggedInUser] = useState<{ id: string; role: string } | null>(null);
  useEffect(() => {
    let active = true;
    void fetch('/api/auth/me', { cache: 'no-store' }).then(response => response.json()).then(data => {
      if (active && data.user?.mustChangePassword) { setLoggedInUser(data.user); setShowChangeModal(true); }
    }).catch(() => { /* The login form remains usable when session lookup fails. */ });
    return () => { active = false; };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Đăng nhập không thành công');
        setIsLoading(false);
        return;
      }

      // Nếu tài khoản mới phải đổi mật khẩu lần đầu
      if (data.user.mustChangePassword) {
        setLoggedInUser(data.user);
        setShowChangeModal(true);
        setIsLoading(false);
        return;
      }

      // Điều hướng theo vai trò
      const dest = data.user.role === 'SUPER_ADMIN' ? '/admin/users' : '/';
      window.location.href = dest;
    } catch {
      setErrorMessage('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng.');
      setIsLoading(false);
    }
  };

  const handleForcedPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangeError('');

    if (newPassword.length < 8) {
      setChangeError('Mật khẩu mới phải có ít nhất 8 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setChangeError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setIsChangingPassword(true);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setChangeError(data.error || 'Đổi mật khẩu thất bại.');
        setIsChangingPassword(false);
        return;
      }

      // Đổi mật khẩu thành công -> Chuyển trang tức thì
      const dest = loggedInUser?.role === 'SUPER_ADMIN' ? '/admin/users' : '/';
      window.location.href = dest;
    } catch {
      setChangeError('Lỗi kết nối máy chủ khi cập nhật mật khẩu.');
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#17181a] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden text-[#202124] dark:text-[#e3e3e3] transition-colors duration-200">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[#3c4043]/10 dark:bg-[#e3e3e3]/10 rounded-full blur-[130px] pointer-events-none" />

      {/* Theme Toggle Button at top-right */}
      <div className="absolute top-5 right-5 z-20">
        <button
          type="button"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
          className="p-2.5 rounded-lg border border-[#dadce0] dark:border-[#3c4043] bg-white dark:bg-[#242424] text-[#5f6368] hover:text-[#202124] dark:text-[#9aa0a6] dark:hover:text-[#e3e3e3] hover:bg-[#f1f3f4] dark:hover:bg-[#292a2d] shadow-xs transition-colors cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#5f6368]" />}
        </button>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-[#3c4043] dark:bg-[#e3e3e3] shadow-xs mb-4">
            <Sparkles className="w-7 h-7 text-white dark:text-[#17181a]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#202124] dark:text-[#e3e3e3] flex items-center justify-center gap-2">
            ExamCraft <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#f1f3f4] dark:bg-[#292a2d] text-[#3c4043] dark:text-[#e3e3e3] border border-[#3c4043]/20 dark:border-[#e3e3e3]/30 font-semibold">v3.1</span>
          </h1>
          <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6] mt-1.5">
            Trợ lý Soạn Đề AI & Quản Lý Thi Chuẩn GDPT 2018
          </p>
        </div>

        {/* Card Box */}
        <div className="bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl shadow-xs p-7 sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-[#202124] dark:text-[#e3e3e3]">Đăng nhập tài khoản</h2>
            <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] mt-1">
              Dành cho Giáo viên và Quản trị viên hệ thống
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-[#fce8e6] dark:bg-[#371918] border border-[#f5c2c7] dark:border-[#5c2523] text-[#c5221f] dark:text-[#f28b82] text-xs flex items-start gap-2.5 leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#c5221f] dark:text-[#f28b82]" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] mb-1.5 uppercase tracking-wider">
                Email giáo viên / Quản trị
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#5f6368] dark:text-[#9aa0a6] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@school.edu.vn"
                  className="w-full bg-[#f8f9fa] dark:bg-[#242424] border border-[#dadce0] dark:border-[#3c4043] rounded-full pl-10 pr-4 py-2.5 text-sm text-[#202124] dark:text-[#e3e3e3] placeholder-[#9aa0a6] dark:placeholder-[#5f6368] focus:outline-none focus:border-[#3c4043] dark:focus:border-[#e3e3e3] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] mb-1.5 uppercase tracking-wider">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#5f6368] dark:text-[#9aa0a6] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#f8f9fa] dark:bg-[#242424] border border-[#dadce0] dark:border-[#3c4043] rounded-full pl-10 pr-10 py-2.5 text-sm text-[#202124] dark:text-[#e3e3e3] placeholder-[#9aa0a6] dark:placeholder-[#5f6368] focus:outline-none focus:border-[#3c4043] dark:focus:border-[#e3e3e3] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  aria-pressed={showPassword}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5f6368] hover:text-[#202124] dark:text-[#9aa0a6] dark:hover:text-[#e3e3e3] p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-3 py-3 px-4 rounded-lg app-button-primary text-white dark:bg-[#e3e3e3] dark:hover:bg-[#f1f3f4] dark:text-[#17181a] text-sm font-semibold shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Đang xác thực...</span>
                </>
              ) : (
                <>
                  <span>Đăng nhập hệ thống</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#dadce0] dark:border-[#3c4043] text-center">
            <p className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed">
              Tài khoản giáo viên do Quản trị viên trường cấp. Học sinh vào làm bài theo link đề thi mà không cần đăng nhập tài khoản.
            </p>
          </div>
        </div>

        {/* Footer Notice */}
        <div className="mt-6 text-center text-xs text-[#5f6368] dark:text-[#9aa0a6] flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-[#5bb98c]" />
          <span>Bảo mật dữ liệu trên máy chủ PostgreSQL & mã hóa phiên an toàn</span>
        </div>
      </div>

      {/* Mandatory Change Password Modal */}
      {showChangeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="app-dialog w-full max-w-md bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl shadow-xs p-6 sm:p-7">
            <div className="app-dialog-header flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-[#33250b] text-amber-700 dark:text-[#fdd663] border border-amber-200 dark:border-[#4d380e]">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#202124] dark:text-[#e3e3e3]">Đổi mật khẩu khởi tạo</h3>
                <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">Bạn cần đặt mật khẩu riêng cho lần đầu đăng nhập</p>
              </div>
            </div>

            {changeError && (
              <div className="mb-4 p-3 rounded-xl bg-[#fce8e6] dark:bg-[#371918] border border-[#f5c2c7] dark:border-[#5c2523] text-[#c5221f] dark:text-[#f28b82] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{changeError}</span>
              </div>
            )}

            <form onSubmit={handleForcedPasswordChange} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] mb-1 uppercase tracking-wider">
                  Mật khẩu mới (tối thiểu 8 ký tự)
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới"
                  className="w-full bg-[#f8f9fa] dark:bg-[#242424] border border-[#dadce0] dark:border-[#3c4043] rounded-full px-4 py-2.5 text-sm text-[#202124] dark:text-[#e3e3e3] placeholder-[#9aa0a6] dark:placeholder-[#5f6368] focus:outline-none focus:border-[#3c4043] dark:focus:border-[#e3e3e3]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] mb-1 uppercase tracking-wider">
                  Xác nhận lại mật khẩu mới
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  className="w-full bg-[#f8f9fa] dark:bg-[#242424] border border-[#dadce0] dark:border-[#3c4043] rounded-full px-4 py-2.5 text-sm text-[#202124] dark:text-[#e3e3e3] placeholder-[#9aa0a6] dark:placeholder-[#5f6368] focus:outline-none focus:border-[#3c4043] dark:focus:border-[#e3e3e3]"
                />
              </div>

              <button
                type="submit"
                disabled={isChangingPassword}
                className="w-full mt-2 py-3 px-4 rounded-lg app-button-primary text-white dark:bg-[#e3e3e3] dark:hover:bg-[#f1f3f4] dark:text-[#17181a] text-sm font-semibold shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isChangingPassword ? 'Đang cập nhật...' : 'Lưu mật khẩu và tiếp tục'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
