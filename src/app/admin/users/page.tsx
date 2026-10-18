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
    <div className="min-h-screen bg-[#181818] text-[#e3e3e3] flex flex-col">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#137333] text-white px-4 py-3 rounded-full shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-top-3 duration-200 text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="border-b border-[#3c4043] bg-[#1e1e1e]/80 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-[#8ab4f8] text-[#181818] flex items-center justify-center shadow-md">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-[#e3e3e3]">ExamCraft</span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#1e2a38] text-[#8ab4f8] font-semibold uppercase tracking-wider border border-[#8ab4f8]/30">
                Admin Panel
              </span>
            </div>
            <p className="text-[11px] text-[#9aa0a6]">Quản trị người dùng & hệ thống v3.1</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="text-xs text-[#e3e3e3] hover:text-white px-3.5 py-1.5 rounded-full border border-[#3c4043] hover:border-[#5f6368] bg-[#242424] transition-colors cursor-pointer"
          >
            ← Về trang Soạn Đề
          </button>

          {currentUser && (
            <div className="hidden sm:flex items-center gap-2 bg-[#242424] border border-[#3c4043] px-3.5 py-1.5 rounded-full text-xs">
              <ShieldCheck className="w-4 h-4 text-[#8ab4f8]" />
              <span className="text-[#e3e3e3] font-medium">{currentUser.email}</span>
            </div>
          )}

          <button
            onClick={handleLogout}
            title="Đăng xuất"
            className="p-2 rounded-full text-[#9aa0a6] hover:text-[#f28b82] hover:bg-[#371918] transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#1e1e1e] border border-[#3c4043] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-[#9aa0a6] mb-2">
              <span className="text-xs font-medium">Tổng giáo viên</span>
              <Users className="w-4 h-4 text-[#8ab4f8]" />
            </div>
            <div className="text-2xl font-bold text-[#e3e3e3]">{totalTeachers}</div>
            <div className="text-[11px] text-[#5bb98c] mt-1 flex items-center gap-1">
              <span>{activeTeachers} đang hoạt động</span>
            </div>
          </div>

          <div className="bg-[#1e1e1e] border border-[#3c4043] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-[#9aa0a6] mb-2">
              <span className="text-xs font-medium">Đề thi trên hệ thống</span>
              <FileText className="w-4 h-4 text-[#8ab4f8]" />
            </div>
            <div className="text-2xl font-bold text-[#e3e3e3]">{totalExams}</div>
            <div className="text-[11px] text-[#9aa0a6] mt-1">Lưu trữ trên PostgreSQL server</div>
          </div>

          <div className="bg-[#1e1e1e] border border-[#3c4043] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-[#9aa0a6] mb-2">
              <span className="text-xs font-medium">Hạ tầng AI</span>
              <Bot className="w-4 h-4 text-[#fdd663]" />
            </div>
            <div className="text-2xl font-bold text-[#e3e3e3]">7 Gemini Keys</div>
            <div className="text-[11px] text-[#5bb98c] mt-1">Hệ thống xoay tua chống nghẽn 429</div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#9aa0a6] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên hoặc email giáo viên..."
              className="w-full bg-[#242424] border border-[#3c4043] rounded-full pl-10 pr-4 py-2.5 text-xs text-[#e3e3e3] placeholder-[#5f6368] focus:outline-none focus:border-[#8ab4f8]"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchUsers}
              title="Tải lại"
              className="p-2.5 rounded-full bg-[#242424] border border-[#3c4043] text-[#9aa0a6] hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => {
                setCreatePassword(generateRandomPassword());
                setShowCreateModal(true);
              }}
              className="px-4 py-2.5 rounded-full bg-[#8ab4f8] hover:bg-[#aecbfa] text-[#181818] text-xs font-semibold shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Cấp tài khoản giáo viên mới</span>
            </button>
          </div>
        </div>

        {/* Teachers Table Card */}
        <div className="bg-[#1e1e1e] border border-[#3c4043] rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#242424] border-b border-[#3c4043] text-[#9aa0a6] uppercase tracking-wider text-[11px]">
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
              <tbody className="divide-y divide-[#3c4043]">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-[#9aa0a6]">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-[#8ab4f8]/30 border-t-[#8ab4f8] rounded-full animate-spin" />
                        <span>Đang tải danh sách tài khoản...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-[#9aa0a6]">
                      Không tìm thấy giáo viên nào phù hợp với từ khóa.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-[#282828] transition-colors">
                      {/* Teacher Column */}
                      <td className="px-5 py-4">
                        <div className="font-medium text-[#e3e3e3]">{u.name}</div>
                        <div className="text-[11px] text-[#9aa0a6]">{u.email}</div>
                        {u.mustChangePassword && (
                          <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-[#33250b] text-[#fdd663] border border-[#4d380e]">
                            Chờ đổi mật khẩu lần đầu
                          </span>
                        )}
                      </td>

                      {/* Role Column */}
                      <td className="px-4 py-4">
                        {u.role === 'SUPER_ADMIN' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#1e2a38] text-[#8ab4f8] border border-[#8ab4f8]/30">
                            SUPER ADMIN
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#0f291e] text-[#5bb98c] border border-[#1e4d38]">
                            GIÁO VIÊN
                          </span>
                        )}
                      </td>

                      {/* Status Column */}
                      <td className="px-4 py-4">
                        {u.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#0f291e] text-[#5bb98c] border border-[#1e4d38]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#5bb98c] animate-pulse" />
                            Đang hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#371918] text-[#f28b82] border border-[#5c2523]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#f28b82]" />
                            Đã khóa
                          </span>
                        )}
                      </td>

                      {/* Stats Column */}
                      <td className="px-4 py-4 text-[#e3e3e3]">
                        <div>{u._count.exams} đề thi</div>
                        <div className="text-[11px] text-[#9aa0a6]">{u._count.questions} câu hỏi</div>
                      </td>

                      {/* AI Quota Column */}
                      <td className="px-4 py-4">
                        <span className="font-mono text-[#e3e3e3]">{u.aiDailyLimit}</span>
                        <span className="text-[11px] text-[#9aa0a6]"> lệnh/ngày</span>
                      </td>

                      {/* Last Login Column */}
                      <td className="px-4 py-4 text-[#9aa0a6] text-[11px]">
                        {u.lastLoginAt ? (
                          new Date(u.lastLoginAt).toLocaleString('vi-VN', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })
                        ) : (
                          <span className="text-[#5f6368]">Chưa đăng nhập</span>
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
                              className={`p-2 rounded-full transition-colors cursor-pointer ${
                                u.isActive
                                  ? 'text-[#9aa0a6] hover:text-[#f28b82] hover:bg-[#371918]'
                                  : 'text-[#5bb98c] hover:bg-[#0f291e]'
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
                            className="p-2 rounded-full text-[#9aa0a6] hover:text-[#fdd663] hover:bg-[#33250b] transition-colors cursor-pointer"
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
                            className="p-2 rounded-full text-[#9aa0a6] hover:text-[#8ab4f8] hover:bg-[#1e2a38] transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#1e1e1e] border border-[#3c4043] rounded-3xl shadow-2xl p-6 sm:p-7 relative">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute right-4 top-4 text-[#9aa0a6] hover:text-white p-1 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 rounded-2xl bg-[#1e2a38] text-[#8ab4f8] border border-[#8ab4f8]/30">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#e3e3e3]">Cấp tài khoản giáo viên</h3>
                <p className="text-xs text-[#9aa0a6]">Giáo viên sẽ bắt buộc đổi mật khẩu khi đăng nhập lần đầu</p>
              </div>
            </div>

            {createError && (
              <div className="mb-4 p-3 rounded-2xl bg-[#371918] border border-[#5c2523] text-[#f28b82] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateTeacher} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#9aa0a6] mb-1 uppercase tracking-wider">
                  Họ và tên giáo viên
                </label>
                <input
                  type="text"
                  required
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="Ví dụ: Thầy Nguyễn Văn An"
                  className="w-full bg-[#242424] border border-[#3c4043] rounded-full px-4 py-2 text-xs text-[#e3e3e3] placeholder-[#5f6368] focus:outline-none focus:border-[#8ab4f8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#9aa0a6] mb-1 uppercase tracking-wider">
                  Email đăng nhập
                </label>
                <input
                  type="email"
                  required
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  placeholder="giaovien@school.edu.vn"
                  className="w-full bg-[#242424] border border-[#3c4043] rounded-full px-4 py-2 text-xs text-[#e3e3e3] placeholder-[#5f6368] focus:outline-none focus:border-[#8ab4f8]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[#9aa0a6] uppercase tracking-wider">Mật khẩu tạm</label>
                  <button
                    type="button"
                    onClick={() => setCreatePassword(generateRandomPassword())}
                    className="text-[11px] text-[#8ab4f8] hover:text-[#aecbfa] flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Sinh ngẫu nhiên
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  className="w-full bg-[#242424] border border-[#3c4043] rounded-full px-4 py-2 text-xs font-mono text-[#5bb98c] placeholder-[#5f6368] focus:outline-none focus:border-[#8ab4f8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#9aa0a6] mb-1 uppercase tracking-wider">
                  Hạn mức gọi AI tối đa (lệnh / ngày)
                </label>
                <input
                  type="number"
                  min={10}
                  max={1000}
                  value={createAiLimit}
                  onChange={(e) => setCreateAiLimit(parseInt(e.target.value) || 100)}
                  className="w-full bg-[#242424] border border-[#3c4043] rounded-full px-4 py-2 text-xs text-[#e3e3e3] placeholder-[#5f6368] focus:outline-none focus:border-[#8ab4f8]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-full bg-[#8ab4f8] hover:bg-[#aecbfa] text-[#181818] text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#1e1e1e] border border-[#3c4043] rounded-3xl shadow-2xl p-6 relative">
            <button
              onClick={() => setShowResetModal(null)}
              className="absolute right-4 top-4 text-[#9aa0a6] hover:text-white p-1 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-2xl bg-[#33250b] text-[#fdd663] border border-[#4d380e]">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#e3e3e3]">Cấp lại mật khẩu tạm</h3>
                <p className="text-xs text-[#9aa0a6]">Giáo viên: {showResetModal.name}</p>
              </div>
            </div>

            {resetError && (
              <div className="mb-4 p-3 rounded-2xl bg-[#371918] border border-[#5c2523] text-[#f28b82] text-xs">
                {resetError}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[#9aa0a6] uppercase tracking-wider">Mật khẩu tạm mới</label>
                  <button
                    type="button"
                    onClick={() => setResetPasswordVal(generateRandomPassword())}
                    className="text-[11px] text-[#8ab4f8] hover:text-[#aecbfa] flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Sinh ngẫu nhiên
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={resetPasswordVal}
                  onChange={(e) => setResetPasswordVal(e.target.value)}
                  className="w-full bg-[#242424] border border-[#3c4043] rounded-full px-4 py-2 text-xs font-mono text-[#fdd663] focus:outline-none focus:border-[#fdd663]"
                />
                <p className="text-[11px] text-[#9aa0a6] mt-1.5">
                  Tất cả các phiên đăng nhập hiện tại của giáo viên sẽ bị hủy và bắt buộc đổi mật khẩu ở lần đăng nhập tiếp theo.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(null)}
                  className="px-4 py-2 rounded-full text-xs text-[#e3e3e3] hover:bg-[#282828] border border-[#3c4043] cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-full bg-[#8ab4f8] hover:bg-[#aecbfa] text-[#181818] text-xs font-semibold cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#1e1e1e] border border-[#3c4043] rounded-3xl shadow-2xl p-6 relative">
            <button
              onClick={() => setShowEditModal(null)}
              className="absolute right-4 top-4 text-[#9aa0a6] hover:text-white p-1 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-2xl bg-[#1e2a38] text-[#8ab4f8] border border-[#8ab4f8]/30">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#e3e3e3]">Chỉnh sửa thông tin</h3>
                <p className="text-xs text-[#9aa0a6]">{showEditModal.email}</p>
              </div>
            </div>

            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#9aa0a6] mb-1 uppercase tracking-wider">
                  Họ và tên
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-[#242424] border border-[#3c4043] rounded-full px-4 py-2 text-xs text-[#e3e3e3] focus:outline-none focus:border-[#8ab4f8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#9aa0a6] mb-1 uppercase tracking-wider">
                  Hạn mức AI mỗi ngày
                </label>
                <input
                  type="number"
                  min={10}
                  max={2000}
                  value={editAiLimit}
                  onChange={(e) => setEditAiLimit(parseInt(e.target.value) || 100)}
                  className="w-full bg-[#242424] border border-[#3c4043] rounded-full px-4 py-2 text-xs text-[#e3e3e3] focus:outline-none focus:border-[#8ab4f8]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(null)}
                  className="px-4 py-2 rounded-full text-xs text-[#e3e3e3] hover:bg-[#282828] border border-[#3c4043] cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-full bg-[#8ab4f8] hover:bg-[#aecbfa] text-[#181818] text-xs font-semibold cursor-pointer"
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
