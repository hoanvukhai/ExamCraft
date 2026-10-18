'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, KeyRound, Sparkles, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

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
      if (data.user.role === 'SUPER_ADMIN') {
        router.push('/admin/users');
      } else {
        router.push('/');
      }
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

      // Đổi mật khẩu thành công -> Chuyển trang
      if (loggedInUser?.role === 'SUPER_ADMIN') {
        router.push('/admin/users');
      } else {
        router.push('/');
      }
    } catch {
      setChangeError('Lỗi kết nối máy chủ khi cập nhật mật khẩu.');
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#181818] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden text-[#e3e3e3]">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[#1a73e8]/10 rounded-full blur-[130px] pointer-events-none" />

      {/* Main Card */}
      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#1a73e8] dark:bg-[#8ab4f8] shadow-lg mb-4">
            <Sparkles className="w-7 h-7 text-white dark:text-[#181818]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#e3e3e3] flex items-center justify-center gap-2">
            ExamCraft <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#1e2a38] text-[#8ab4f8] border border-[#8ab4f8]/30 font-semibold">v3.1</span>
          </h1>
          <p className="text-sm text-[#9aa0a6] mt-1.5">
            Trợ lý Soạn Đề AI & Quản Lý Thi Chuẩn GDPT 2018
          </p>
        </div>

        {/* Card Box */}
        <div className="bg-[#1e1e1e] border border-[#3c4043] rounded-3xl shadow-2xl p-7 sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-[#e3e3e3]">Đăng nhập tài khoản</h2>
            <p className="text-xs text-[#9aa0a6] mt-1">
              Dành cho Giáo viên và Quản trị viên hệ thống
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-[#371918] border border-[#5c2523] text-[#f28b82] text-xs flex items-start gap-2.5 leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#f28b82]" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#9aa0a6] mb-1.5 uppercase tracking-wider">
                Email giáo viên / Quản trị
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#9aa0a6] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@school.edu.vn"
                  className="w-full bg-[#242424] border border-[#3c4043] rounded-full pl-10 pr-4 py-2.5 text-sm text-[#e3e3e3] placeholder-[#5f6368] focus:outline-none focus:border-[#8ab4f8] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#9aa0a6] mb-1.5 uppercase tracking-wider">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#9aa0a6] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#242424] border border-[#3c4043] rounded-full pl-10 pr-10 py-2.5 text-sm text-[#e3e3e3] placeholder-[#5f6368] focus:outline-none focus:border-[#8ab4f8] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9aa0a6] hover:text-[#e3e3e3] p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-3 py-3 px-4 rounded-full bg-[#8ab4f8] hover:bg-[#aecbfa] text-[#181818] text-sm font-semibold shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#181818]/30 border-t-[#181818] rounded-full animate-spin" />
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

          <div className="mt-6 pt-5 border-t border-[#3c4043] text-center">
            <p className="text-[11px] text-[#9aa0a6] leading-relaxed">
              Tài khoản giáo viên do Quản trị viên trường cấp. Học sinh vào làm bài theo link đề thi mà không cần đăng nhập tài khoản.
            </p>
          </div>
        </div>

        {/* Footer Notice */}
        <div className="mt-6 text-center text-xs text-[#9aa0a6] flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#5bb98c]" />
          <span>Bảo mật dữ liệu trên máy chủ PostgreSQL & mã hóa phiên an toàn</span>
        </div>
      </div>

      {/* Mandatory Change Password Modal */}
      {showChangeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#1e1e1e] border border-[#3c4043] rounded-3xl shadow-2xl p-6 sm:p-7">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-2xl bg-[#33250b] text-[#fdd663] border border-[#4d380e]">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#e3e3e3]">Đổi mật khẩu khởi tạo</h3>
                <p className="text-xs text-[#9aa0a6]">Bạn cần đặt mật khẩu riêng cho lần đầu đăng nhập</p>
              </div>
            </div>

            {changeError && (
              <div className="mb-4 p-3 rounded-2xl bg-[#371918] border border-[#5c2523] text-[#f28b82] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{changeError}</span>
              </div>
            )}

            <form onSubmit={handleForcedPasswordChange} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#9aa0a6] mb-1 uppercase tracking-wider">
                  Mật khẩu mới (tối thiểu 8 ký tự)
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới"
                  className="w-full bg-[#242424] border border-[#3c4043] rounded-full px-4 py-2.5 text-sm text-[#e3e3e3] placeholder-[#5f6368] focus:outline-none focus:border-[#8ab4f8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#9aa0a6] mb-1 uppercase tracking-wider">
                  Xác nhận lại mật khẩu mới
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  className="w-full bg-[#242424] border border-[#3c4043] rounded-full px-4 py-2.5 text-sm text-[#e3e3e3] placeholder-[#5f6368] focus:outline-none focus:border-[#8ab4f8]"
                />
              </div>

              <button
                type="submit"
                disabled={isChangingPassword}
                className="w-full mt-2 py-3 px-4 rounded-full bg-[#8ab4f8] hover:bg-[#aecbfa] text-[#181818] text-sm font-semibold shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
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
