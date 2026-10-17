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
} from 'lucide-react';

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
  const [keyStates, setKeyStates] = useState<KeyState[]>([]);
  const [stats, setStats] = useState({ totalToday: 0, successToday: 0, errorToday: 0, successRate: 100 });
  const [logs, setLogs] = useState<UsageLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const fetchAiData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/ai');
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      if (res.status === 403) {
        alert('Bạn không có quyền quản trị viên!');
        router.push('/');
        return;
      }
      const data = await res.json();
      setKeyStates(data.keyStates || []);
      setStats(data.stats || { totalToday: 0, successToday: 0, errorToday: 0, successRate: 100 });
      setLogs(data.recentLogs || []);
    } catch {
      console.error('Lỗi khi tải dữ liệu AI');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAiData();
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-top-3 duration-200 text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white">ExamCraft AI Hub</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold uppercase tracking-wider border border-amber-500/30">
                7 Keys Rotation Pool
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Điều phối & Giám sát tải Google Gemini</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/users"
            className="text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900 transition-colors"
          >
            Quản lý Giáo viên
          </Link>

          <Link
            href="/"
            className="text-xs text-indigo-400 hover:text-indigo-300 px-3 py-1.5 rounded-lg border border-indigo-950 bg-indigo-950/40 transition-colors flex items-center gap-1"
          >
            <span>Trang Soạn Đề</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Tổng lệnh AI hôm nay</span>
              <Activity className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white">{stats.totalToday}</div>
            <div className="text-[11px] text-slate-400 mt-1">Từ 00:00 hôm nay</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Tỷ lệ thành công</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400">{stats.successRate}%</div>
            <div className="text-[11px] text-emerald-400/80 mt-1">{stats.successToday} lệnh thành công</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Lệnh bị lỗi / nghẽn</span>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-bold text-rose-400">{stats.errorToday}</div>
            <div className="text-[11px] text-slate-400 mt-1">Đã tự động xoay key dự phòng</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Cơ chế bảo vệ</span>
              <ShieldCheck className="w-4 h-4 text-blue-400" />
            </div>
            <button
              onClick={handleResetAll}
              className="mt-2 w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
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
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Trạng thái 7 Google Gemini API Keys</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-normal">
                  Auto Round-Robin & Cooldown
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Các key nằm hoàn toàn trong biến môi trường, bảo mật tuyệt đối không lộ giá trị
              </p>
            </div>

            <button
              onClick={fetchAiData}
              title="Làm mới"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
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
                  className={`bg-slate-900/80 border rounded-2xl p-4.5 backdrop-blur-sm flex flex-col justify-between transition-all ${
                    isActive
                      ? 'border-slate-800 hover:border-emerald-500/40 shadow-emerald-500/5'
                      : isCooldown
                      ? 'border-amber-500/40 bg-amber-500/5 shadow-amber-500/5'
                      : 'border-rose-500/40 bg-rose-500/5'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Key className="w-4 h-4 text-indigo-400" />
                        {key.alias}
                      </span>

                      {isActive && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          ACTIVE
                        </span>
                      )}

                      {isCooldown && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          <Clock className="w-3 h-3 text-amber-400" />
                          COOLDOWN
                        </span>
                      )}

                      {isDead && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                          <XCircle className="w-3 h-3 text-rose-400" />
                          DEAD
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Đã gọi hôm nay:</span>
                        <span className="font-bold text-white">{key.dailyCount} lượt</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-500">Dùng gần nhất:</span>
                        <span className="text-slate-400">
                          {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleTimeString('vi-VN') : 'Chưa dùng'}
                        </span>
                      </div>

                      {key.lastError && (
                        <div className="mt-2 p-2 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] text-rose-400/90 truncate" title={key.lastError}>
                          {key.lastError}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">Quản trị viên</span>
                    <button
                      onClick={() => handleResetKey(key.alias)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer font-medium"
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
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Nhật ký gọi AI gần nhất (AiUsageLog)</span>
            </h3>
            <span className="text-xs text-slate-500">30 yêu cầu gần nhất</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3">Thời điểm</th>
                  <th className="px-4 py-3">Chức năng (Endpoint)</th>
                  <th className="px-4 py-3">Key sử dụng</th>
                  <th className="px-4 py-3">Giáo viên</th>
                  <th className="px-4 py-3">Độ trễ</th>
                  <th className="px-5 py-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                      Chưa có nhật ký gọi AI nào được ghi nhận.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3 text-slate-400">
                        {new Date(log.createdAt).toLocaleTimeString('vi-VN')}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-200">{log.endpoint}</td>
                      <td className="px-4 py-3 font-mono text-indigo-400 font-semibold">{log.keyAlias || 'BYOK'}</td>
                      <td className="px-4 py-3 text-slate-300">{log.user?.name || 'Khách/Ẩn danh'}</td>
                      <td className="px-4 py-3 text-slate-400">{log.latencyMs ? `${log.latencyMs} ms` : '-'}</td>
                      <td className="px-5 py-3">
                        {log.httpStatus === 200 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            200 OK
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
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
