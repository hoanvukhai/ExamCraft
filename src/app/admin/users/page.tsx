'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  UserPlus,
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  Lock,
  Unlock,
  RefreshCw,
  LogOut,
  Sparkles,
  Bot,
  FileText,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Sliders,
} from 'lucide-react';

interface TeacherUser {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'TEACHER';
  isActive: boolean;
  mustChangePassword: boolean;
  aiDailyLimit: number;
  createdAt: string;
  lastLoginAt: string | null;
  _count: {
    questions: number;
    exams: number;
    assignments: number;
  };
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<TeacherUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; name: string } | null>(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState<TeacherUser | null>(null);
  const [showEditModal, setShowEditModal] = useState<TeacherUser | null>(null);

  // Form states
  const [createEmail, setCreateEmail] = useState('');
  const [createName, setCreateName] = useState('');
  const [createPassword, setCreatePassword] = useState('GiaoVien2026@');
  const [createAiLimit, setCreateAiLimit] = useState(100);
  const [createError, setCreateError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset modal state
  const [resetPasswordVal, setResetPasswordVal] = useState('MatKhauMoi2026@');
  const [resetError, setResetError] = useState('');

  // Edit modal state
  const [editName, setEditName] = useState('');
  const [editAiLimit, setEditAiLimit] = useState(100);

  // Feedback notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      if (res.status === 403) {
        alert('Bạn không có quyền truy cập trang quản trị!');
        router.push('/');
        return;
      }
      const data = await res.json();
      setUsers(data.users || []);
    } catch {
      console.error('Không tải được danh sách giáo viên');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user) {
        setCurrentUser(data.user);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchCurrentUser();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#%';
    let pwd = '';
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pwd;
  };

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: createEmail,
          name: createName,
          password: createPassword,
          aiDailyLimit: createAiLimit,
          role: 'TEACHER',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setCreateError(data.error || 'Không thể tạo tài khoản');
        setIsSubmitting(false);
        return;
      }

      showToast(`Đã cấp tài khoản thành công cho giáo viên ${createName}!`);
      setShowCreateModal(false);
      setCreateEmail('');
      setCreateName('');
      setCreatePassword(generateRandomPassword());
      fetchUsers();
    } catch {
      setCreateError('Lỗi kết nối khi tạo tài khoản');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (user: TeacherUser) => {
    const newStatus = !user.isActive;
    const confirmMsg = newStatus
      ? `Bạn có chắc muốn MỞ KHÓA tài khoản cho ${user.name}?`
      : `Bạn có chắc muốn KHÓA tài khoản của ${user.name}? Giáo viên này sẽ không thể đăng nhập.`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Cập nhật trạng thái thất bại');
        return;
      }

      showToast(`Đã ${newStatus ? 'mở khóa' : 'khóa'} tài khoản ${user.name}`);
      fetchUsers();
    } catch {
      alert('Lỗi kết nối đến máy chủ');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showResetModal) return;
    setResetError('');
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/admin/users/${showResetModal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetPassword: resetPasswordVal }),
      });

      if (!res.ok) {
        const data = await res.json();
        setResetError(data.error || 'Đặt lại mật khẩu thất bại');
        setIsSubmitting(false);
        return;
      }

      showToast(`Đã cấp mật khẩu tạm mới cho ${showResetModal.name}`);
      setShowResetModal(null);
      fetchUsers();
    } catch {
      setResetError('Lỗi kết nối máy chủ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditModal) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/admin/users/${showEditModal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          aiDailyLimit: editAiLimit,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Cập nhật thất bại');
        setIsSubmitting(false);
        return;
      }

      showToast(`Đã cập nhật thông tin cho ${editName}`);
      setShowEditModal(null);
      fetchUsers();
    } catch {
      alert('Lỗi kết nối máy chủ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalTeachers = users.filter((u) => u.role === 'TEACHER').length;
  const activeTeachers = users.filter((u) => u.role === 'TEACHER' && u.isActive).length;
  const totalExams = users.reduce((acc, u) => acc + (u._count?.exams || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-top-3 duration-200 text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white">ExamCraft</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold uppercase tracking-wider border border-indigo-500/30">
                Admin Panel
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Quản trị người dùng & hệ thống v3.1</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900 transition-colors"
          >
            ← Về trang Soạn Đề
          </button>

          {currentUser && (
            <div className="hidden sm:flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span className="text-slate-300 font-medium">{currentUser.email}</span>
            </div>
          )}

          <button
            onClick={handleLogout}
            title="Đăng xuất"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Tổng giáo viên</span>
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white">{totalTeachers}</div>
            <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
              <span>{activeTeachers} đang hoạt động</span>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Đề thi trên hệ thống</span>
              <FileText className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white">{totalExams}</div>
            <div className="text-[11px] text-slate-400 mt-1">Lưu trữ trên PostgreSQL server</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Hạ tầng AI</span>
              <Bot className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white">7 Gemini Keys</div>
            <div className="text-[11px] text-emerald-400 mt-1">Hệ thống xoay tua chống nghẽn 429</div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên hoặc email giáo viên..."
              className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchUsers}
              title="Tải lại"
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => {
                setCreatePassword(generateRandomPassword());
                setShowCreateModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-medium shadow-lg shadow-indigo-600/25 flex items-center gap-2 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Cấp tài khoản giáo viên mới</span>
            </button>
          </div>
        </div>

        {/* Teachers Table Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5 font-medium">Giáo viên</th>
                  <th className="px-4 py-3.5 font-medium">Vai trò</th>
                  <th className="px-4 py-3.5 font-medium">Trạng thái</th>
                  <th className="px-4 py-3.5 font-medium">Đề & Câu hỏi</th>
                  <th className="px-4 py-3.5 font-medium">Hạn mức AI/ngày</th>
                  <th className="px-4 py-3.5 font-medium">Đăng nhập cuối</th>
                  <th className="px-5 py-3.5 font-medium text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                        <span>Đang tải danh sách tài khoản...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                      Không tìm thấy giáo viên nào phù hợp với từ khóa.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                      {/* Teacher Column */}
                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-100">{u.name}</div>
                        <div className="text-[11px] text-slate-400">{u.email}</div>
                        {u.mustChangePassword && (
                          <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Chờ đổi mật khẩu lần đầu
                          </span>
                        )}
                      </td>

                      {/* Role Column */}
                      <td className="px-4 py-4">
                        {u.role === 'SUPER_ADMIN' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                            SUPER ADMIN
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                            GIÁO VIÊN
                          </span>
                        )}
                      </td>

                      {/* Status Column */}
                      <td className="px-4 py-4">
                        {u.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Đang hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                            Đã khóa
                          </span>
                        )}
                      </td>

                      {/* Stats Column */}
                      <td className="px-4 py-4 text-slate-300">
                        <div>{u._count.exams} đề thi</div>
                        <div className="text-[11px] text-slate-500">{u._count.questions} câu hỏi</div>
                      </td>

                      {/* AI Quota Column */}
                      <td className="px-4 py-4">
                        <span className="font-mono text-slate-200">{u.aiDailyLimit}</span>
                        <span className="text-[11px] text-slate-500"> lệnh/ngày</span>
                      </td>

                      {/* Last Login Column */}
                      <td className="px-4 py-4 text-slate-400 text-[11px]">
                        {u.lastLoginAt ? (
                          new Date(u.lastLoginAt).toLocaleString('vi-VN', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })
                        ) : (
                          <span className="text-slate-600">Chưa đăng nhập</span>
                        )}
                      </td>

                      {/* Actions Column */}
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Toggle Active Button */}
                          {u.role !== 'SUPER_ADMIN' && (
                            <button
                              onClick={() => handleToggleActive(u)}
                              title={u.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                              className={`p-2 rounded-lg transition-colors ${
                                u.isActive
                                  ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10'
                                  : 'text-emerald-400 hover:bg-emerald-500/10'
                              }`}
                            >
                              {u.isActive ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                            </button>
                          )}

                          {/* Reset Password Button */}
                          <button
                            onClick={() => {
                              setResetPasswordVal(generateRandomPassword());
                              setShowResetModal(u);
                            }}
                            title="Cấp lại mật khẩu tạm"
                            className="p-2 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          {/* Edit Details Button */}
                          <button
                            onClick={() => {
                              setEditName(u.name);
                              setEditAiLimit(u.aiDailyLimit);
                              setShowEditModal(u);
                            }}
                            title="Chỉnh sửa thông tin & hạn mức"
                            className="p-2 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                          >
                            <Sliders className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal: Tạo tài khoản giáo viên mới */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-7 relative">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute right-4 top-4 text-slate-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Cấp tài khoản giáo viên</h3>
                <p className="text-xs text-slate-400">Giáo viên sẽ bắt buộc đổi mật khẩu khi đăng nhập lần đầu</p>
              </div>
            </div>

            {createError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateTeacher} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Họ và tên giáo viên
                </label>
                <input
                  type="text"
                  required
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="Ví dụ: Thầy Nguyễn Văn An"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Email đăng nhập
                </label>
                <input
                  type="email"
                  required
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  placeholder="giaovien@school.edu.vn"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-300">Mật khẩu tạm</label>
                  <button
                    type="button"
                    onClick={() => setCreatePassword(generateRandomPassword())}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Sinh ngẫu nhiên
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-emerald-400 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Hạn mức gọi AI tối đa (lệnh / ngày)
                </label>
                <input
                  type="number"
                  min={10}
                  max={1000}
                  value={createAiLimit}
                  onChange={(e) => setCreateAiLimit(parseInt(e.target.value) || 100)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Đang tạo...' : 'Tạo tài khoản và cấp quyền'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Đặt lại mật khẩu tạm */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative">
            <button
              onClick={() => setShowResetModal(null)}
              className="absolute right-4 top-4 text-slate-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Cấp lại mật khẩu tạm</h3>
                <p className="text-xs text-slate-400">Giáo viên: {showResetModal.name}</p>
              </div>
            </div>

            {resetError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {resetError}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-300">Mật khẩu tạm mới</label>
                  <button
                    type="button"
                    onClick={() => setResetPasswordVal(generateRandomPassword())}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Sinh ngẫu nhiên
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={resetPasswordVal}
                  onChange={(e) => setResetPasswordVal(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-amber-400 focus:outline-none focus:border-amber-500"
                />
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Tất cả các phiên đăng nhập hiện tại của giáo viên sẽ bị hủy và bắt buộc đổi mật khẩu ở lần đăng nhập tiếp theo.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(null)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white border border-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium"
                >
                  {isSubmitting ? 'Đang lưu...' : 'Xác nhận cấp lại'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Chỉnh sửa thông tin & Hạn mức */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative">
            <button
              onClick={() => setShowEditModal(null)}
              className="absolute right-4 top-4 text-slate-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Chỉnh sửa thông tin</h3>
                <p className="text-xs text-slate-400">{showEditModal.email}</p>
              </div>
            </div>

            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Họ và tên
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Hạn mức AI mỗi ngày
                </label>
                <input
                  type="number"
                  min={10}
                  max={2000}
                  value={editAiLimit}
                  onChange={(e) => setEditAiLimit(parseInt(e.target.value) || 100)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(null)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white border border-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium"
                >
                  {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
