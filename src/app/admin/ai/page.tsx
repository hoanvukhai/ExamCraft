'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  Bot,
  Key,
  ShieldCheck,
  RefreshCw,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Activity,
  ArrowRight,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

interface KeyState {
  alias: string;
  status: 'ACTIVE' | 'COOLDOWN' | 'DEAD';
  cooldownUntil: string | null;
  dailyCount: number;
  lastUsedAt: string | null;
  lastError: string | null;
}

interface UsageLog {
  id: string;
  endpoint: string;
  keyAlias: string | null;
  httpStatus: number | null;
  latencyMs: number | null;
  createdAt: string;
  user: { name: string; email: string } | null;
}

export default function AdminAiPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [keyStates, setKeyStates] = useState<KeyState[]>([]);
  const [stats, setStats] = useState({ totalToday: 0, successToday: 0, errorToday: 0, successRate: 100 });
  const [logs, setLogs] = useState<UsageLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const loadAiData = () => fetch('/api/admin/ai').then(async res => {
    if (res.status === 401) { router.push('/login'); return; }
    if (res.status === 403) { alert('Bạn không có quyền quản trị viên!'); router.push('/'); return; }
    const data = await res.json();
    setKeyStates(data.keyStates || []);
    setStats(data.stats || { totalToday: 0, successToday: 0, errorToday: 0, successRate: 100 });
    setLogs(data.recentLogs || []);
  }).catch(() => { console.error('Lỗi khi tải dữ liệu AI'); }).finally(() => setIsLoading(false));
  const fetchAiData = () => { setIsLoading(true); return loadAiData(); };

  useEffect(() => {
    void loadAiData();
    const interval = setInterval(fetchAiData, 10000); // Polling mỗi 10 giây
    return () => clearInterval(interval);
  }, []);

  const handleResetKey = async (alias: string) => {
    try {
      const res = await fetch('/api/admin/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_key', alias }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchAiData();
      }
    } catch {
      alert('Không thể kết nối đến máy chủ');
    }
  };

  const handleResetAll = async () => {
    if (!confirm('Bạn có chắc muốn đặt lại trạng thái ACTIVE cho tất cả 7 keys?')) return;
    try {
      const res = await fetch('/api/admin/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_all' }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchAiData();
      }
    } catch {
      alert('Không thể kết nối đến máy chủ');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#181818] text-[#202124] dark:text-[#e3e3e3] flex flex-col transition-colors duration-200">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-[#137333] text-white px-4 py-3 rounded-full shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-top-3 duration-200 text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="border-b border-[#dadce0] dark:border-[#3c4043] bg-white/80 dark:bg-[#1e1e1e]/80 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-[#1a73e8] dark:bg-[#8ab4f8] text-white dark:text-[#181818] flex items-center justify-center shadow-md">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-[#202124] dark:text-[#e3e3e3]">ExamCraft AI Hub</span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-[#33250b] text-amber-700 dark:text-[#fdd663] font-semibold uppercase tracking-wider border border-amber-200 dark:border-[#4d380e]">
                7 Keys Rotation Pool
              </span>
            </div>
            <p className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6]">Điều phối & Giám sát tải Google Gemini</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/users"
            className="text-xs text-[#3c4043] dark:text-[#e3e3e3] hover:text-black dark:hover:text-white px-3.5 py-1.5 rounded-full border border-[#dadce0] dark:border-[#3c4043] hover:border-[#bdc1c6] dark:hover:border-[#5f6368] bg-white dark:bg-[#242424] transition-colors"
          >
            Quản lý Giáo viên
          </Link>

          <Link
            href="/"
            className="text-xs text-[#1a73e8] hover:text-[#1557b0] dark:text-[#8ab4f8] dark:hover:text-[#aecbfa] px-3.5 py-1.5 rounded-full border border-[#1a73e8]/30 dark:border-[#8ab4f8]/30 bg-[#e8f0fe] dark:bg-[#1e2a38] transition-colors flex items-center gap-1"
          >
            <span>Trang Soạn Đề</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
            className="p-2 rounded-full border border-[#dadce0] dark:border-[#3c4043] bg-white dark:bg-[#242424] text-[#5f6368] hover:text-[#202124] dark:text-[#9aa0a6] dark:hover:text-[#e3e3e3] hover:bg-[#f1f3f4] dark:hover:bg-[#282828] transition-colors cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#5f6368]" />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#1e1e1e] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-[#5f6368] dark:text-[#9aa0a6] mb-2">
              <span className="text-xs font-medium">Tổng lệnh AI hôm nay</span>
              <Activity className="w-4 h-4 text-[#1a73e8] dark:text-[#8ab4f8]" />
            </div>
            <div className="text-2xl font-bold text-[#202124] dark:text-[#e3e3e3]">{stats.totalToday}</div>
            <div className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] mt-1">Từ 00:00 hôm nay</div>
          </div>

          <div className="bg-white dark:bg-[#1e1e1e] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-[#5f6368] dark:text-[#9aa0a6] mb-2">
              <span className="text-xs font-medium">Tỷ lệ thành công</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-[#5bb98c]" />
            </div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-[#5bb98c]">{stats.successRate}%</div>
            <div className="text-[11px] text-emerald-700 dark:text-[#5bb98c]/80 mt-1">{stats.successToday} lệnh thành công</div>
          </div>

          <div className="bg-white dark:bg-[#1e1e1e] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-[#5f6368] dark:text-[#9aa0a6] mb-2">
              <span className="text-xs font-medium">Lệnh bị lỗi / nghẽn</span>
              <AlertTriangle className="w-4 h-4 text-rose-500 dark:text-[#f28b82]" />
            </div>
            <div className="text-2xl font-bold text-rose-600 dark:text-[#f28b82]">{stats.errorToday}</div>
            <div className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] mt-1">Đã tự động xoay key dự phòng</div>
          </div>

          <div className="bg-white dark:bg-[#1e1e1e] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#5f6368] dark:text-[#9aa0a6]">
              <span className="text-xs font-medium">Cơ chế bảo vệ</span>
              <ShieldCheck className="w-4 h-4 text-[#1a73e8] dark:text-[#8ab4f8]" />
            </div>
            <button
              onClick={handleResetAll}
              className="mt-2 w-full py-2 px-3 rounded-full bg-[#1a73e8] hover:bg-[#1557b0] text-white dark:bg-[#8ab4f8] dark:hover:bg-[#aecbfa] dark:text-[#181818] text-xs font-semibold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Kích hoạt lại 7 Keys</span>
            </button>
          </div>
        </div>

        {/* 7 Keys Status Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-[#202124] dark:text-[#e3e3e3] flex items-center gap-2">
                <span>Trạng thái 7 Google Gemini API Keys</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-[#0f291e] text-emerald-700 dark:text-[#5bb98c] border border-emerald-200 dark:border-[#1e4d38] font-normal">
                  Auto Round-Robin & Cooldown
                </span>
              </h2>
              <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] mt-0.5">
                Các key nằm hoàn toàn trong biến môi trường, bảo mật tuyệt đối không lộ giá trị
              </p>
            </div>

            <button
              onClick={fetchAiData}
              title="Làm mới"
              className="p-2.5 rounded-full bg-white dark:bg-[#242424] border border-[#dadce0] dark:border-[#3c4043] text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124] dark:hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {keyStates.map((key) => {
              const isActive = key.status === 'ACTIVE';
              const isCooldown = key.status === 'COOLDOWN';
              const isDead = key.status === 'DEAD';

              return (
                <div
                  key={key.alias}
                  className={`border rounded-2xl p-4.5 flex flex-col justify-between transition-all ${
                    isActive
                      ? 'bg-white dark:bg-[#1e1e1e] border-[#dadce0] dark:border-[#3c4043] hover:border-emerald-500/40'
                      : isCooldown
                      ? 'bg-amber-50/50 dark:bg-[#33250b]/20 border-amber-200 dark:border-[#4d380e]'
                      : 'bg-rose-50/50 dark:bg-[#371918]/20 border-rose-200 dark:border-[#5c2523]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-sm font-bold text-[#202124] dark:text-[#e3e3e3] uppercase tracking-wider flex items-center gap-1.5">
                        <Key className="w-4 h-4 text-[#1a73e8] dark:text-[#8ab4f8]" />
                        {key.alias}
                      </span>

                      {isActive && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-[#0f291e] text-emerald-700 dark:text-[#5bb98c] border border-emerald-200 dark:border-[#1e4d38]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-[#5bb98c] animate-pulse" />
                          ACTIVE
                        </span>
                      )}

                      {isCooldown && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-[#33250b] text-amber-700 dark:text-[#fdd663] border border-amber-200 dark:border-[#4d380e]">
                          <Clock className="w-3 h-3 text-amber-600 dark:text-[#fdd663]" />
                          COOLDOWN
                        </span>
                      )}

                      {isDead && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 dark:bg-[#371918] text-rose-700 dark:text-[#f28b82] border border-rose-200 dark:border-[#5c2523]">
                          <XCircle className="w-3 h-3 text-rose-600 dark:text-[#f28b82]" />
                          DEAD
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 text-xs text-[#202124] dark:text-[#e3e3e3]">
                      <div className="flex justify-between">
                        <span className="text-[#5f6368] dark:text-[#9aa0a6]">Đã gọi hôm nay:</span>
                        <span className="font-bold text-[#202124] dark:text-white">{key.dailyCount} lượt</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-[#5f6368] dark:text-[#9aa0a6]">Dùng gần nhất:</span>
                        <span className="text-[#5f6368] dark:text-[#9aa0a6]">
                          {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleTimeString('vi-VN') : 'Chưa dùng'}
                        </span>
                      </div>

                      {key.lastError && (
                        <div className="mt-2 p-2 rounded-xl bg-[#f8f9fa] dark:bg-[#242424] border border-[#dadce0] dark:border-[#3c4043] text-[11px] text-rose-600 dark:text-[#f28b82] truncate" title={key.lastError}>
                          {key.lastError}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#dadce0] dark:border-[#3c4043] flex items-center justify-between">
                    <span className="text-[10px] text-[#5f6368] dark:text-[#9aa0a6]">Quản trị viên</span>
                    <button
                      onClick={() => handleResetKey(key.alias)}
                      className="text-xs text-[#1a73e8] hover:text-[#1557b0] dark:text-[#8ab4f8] dark:hover:text-[#aecbfa] flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Kích hoạt lại</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent AI Activity Log */}
        <div className="bg-white dark:bg-[#1e1e1e] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl overflow-hidden shadow-xs">
          <div className="px-5 py-4 border-b border-[#dadce0] dark:border-[#3c4043] flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#202124] dark:text-[#e3e3e3] flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500 dark:text-[#fdd663]" />
              <span>Nhật ký gọi AI gần nhất (AiUsageLog)</span>
            </h3>
            <span className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">30 yêu cầu gần nhất</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f8f9fa] dark:bg-[#242424] text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider text-[11px] border-b border-[#dadce0] dark:border-[#3c4043]">
                <tr>
                  <th className="px-5 py-3">Thời điểm</th>
                  <th className="px-4 py-3">Chức năng (Endpoint)</th>
                  <th className="px-4 py-3">Key sử dụng</th>
                  <th className="px-4 py-3">Giáo viên</th>
                  <th className="px-4 py-3">Độ trễ</th>
                  <th className="px-5 py-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dadce0] dark:divide-[#3c4043]">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-[#5f6368] dark:text-[#9aa0a6]">
                      Chưa có nhật ký gọi AI nào được ghi nhận.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#f8f9fa] dark:hover:bg-[#282828] transition-colors">
                      <td className="px-5 py-3 text-[#5f6368] dark:text-[#9aa0a6]">
                        {new Date(log.createdAt).toLocaleTimeString('vi-VN')}
                      </td>
                      <td className="px-4 py-3 font-mono text-[#202124] dark:text-[#e3e3e3]">{log.endpoint}</td>
                      <td className="px-4 py-3 font-mono text-[#1a73e8] dark:text-[#8ab4f8] font-semibold">{log.keyAlias || 'BYOK'}</td>
                      <td className="px-4 py-3 text-[#202124] dark:text-[#e3e3e3]">{log.user?.name || 'Khách/Ẩn danh'}</td>
                      <td className="px-4 py-3 text-[#5f6368] dark:text-[#9aa0a6]">{log.latencyMs ? `${log.latencyMs} ms` : '-'}</td>
                      <td className="px-5 py-3">
                        {log.httpStatus === 200 ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-[#0f291e] text-emerald-700 dark:text-[#5bb98c] border border-emerald-200 dark:border-[#1e4d38]">
                            200 OK
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 dark:bg-[#371918] text-rose-700 dark:text-[#f28b82] border border-rose-200 dark:border-[#5c2523]">
                            {log.httpStatus || 500} ERROR
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
