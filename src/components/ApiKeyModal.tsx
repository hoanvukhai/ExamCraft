'use client';

import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Check, 
  ExternalLink, 
  X, 
  ShieldCheck, 
  Sparkles, 
  Trash2, 
  RefreshCw, 
  Plus, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Activity,
  Eye,
  EyeOff
} from 'lucide-react';

interface UserKeyItem {
  id: string;
  label: string;
  keyMasked: string;
  isActive: boolean;
  createdAt: string;
  lastUsedAt: string | null;
  errorCount: number;
}

interface QuotaInfo {
  dailyLimit: number;
  usedToday: number;
  remaining: number;
}

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyUpdated?: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onKeyUpdated,
}) => {
  const [keys, setKeys] = useState<UserKeyItem[]>([]);
  const [quota, setQuota] = useState<QuotaInfo>({ dailyLimit: 100, usedToday: 0, remaining: 100 });
  const [isLoading, setIsLoading] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [testingKeyId, setTestingKeyId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { status: string; message: string; latencyMs?: number }>>({});
  const [showNewKey, setShowNewKey] = useState(false);

  // Load danh sách key và hạn mức từ server
  const fetchKeys = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/user/keys');
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys || []);
        if (data.quota) setQuota(data.quota);
      }
    } catch (err) {
      console.error('Không thể tải danh sách API Key:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchKeys();
      setSaveMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Thêm API Key mới
  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveMessage(null);

    const trimmed = newKey.trim();
    if (!trimmed) {
      setSaveMessage({ type: 'error', text: 'Vui lòng nhập Google Gemini API Key.' });
      return;
    }

    if (!trimmed.startsWith('AIza') && trimmed.length < 20) {
      setSaveMessage({ type: 'error', text: 'Định dạng API Key chưa chuẩn (Key Google thường bắt đầu bằng AIza...)' });
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/user/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: trimmed,
          label: newLabel.trim() || `Gemini Key ${keys.length + 1}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSaveMessage({ type: 'error', text: data.error || 'Lỗi khi lưu API Key' });
      } else {
        setSaveMessage({ type: 'success', text: 'Đã mã hóa AES-256-GCM và lưu khóa thành công vào hệ thống!' });
        setNewKey('');
        setNewLabel('');
        fetchKeys();
        if (onKeyUpdated) onKeyUpdated();
      }
    } catch {
      setSaveMessage({ type: 'error', text: 'Lỗi mạng khi kết nối máy chủ.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Kiểm tra thực tế trạng thái key (ping tới Google Gemini)
  const handleTestKey = async (keyId: string) => {
    setTestingKeyId(keyId);
    try {
      const res = await fetch('/api/user/keys/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyId }),
      });
      const data = await res.json();
      setTestResults((prev) => ({
        ...prev,
        [keyId]: {
          status: data.status,
          message: data.message,
          latencyMs: data.latencyMs,
        },
      }));
      // Tải lại để cập nhật lastUsedAt hoặc errorCount
      fetchKeys();
    } catch {
      setTestResults((prev) => ({
        ...prev,
        [keyId]: {
          status: 'NETWORK_ERROR',
          message: 'Không thể kết nối đến máy chủ.',
        },
      }));
    } finally {
      setTestingKeyId(null);
    }
  };

  // Xóa API Key
  const handleDeleteKey = async (id: string) => {
    if (!window.confirm('Thầy/Cô có chắc chắn muốn xóa API Key này khỏi hệ thống?')) return;

    try {
      const res = await fetch(`/api/user/keys?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setKeys((prev) => prev.filter((k) => k.id !== id));
        if (onKeyUpdated) onKeyUpdated();
      }
    } catch (err) {
      console.error('Lỗi khi xóa key:', err);
    }
  };

  // Bật/tắt trạng thái hoạt động của key
  const handleToggleKey = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch('/api/user/keys', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !currentActive }),
      });
      if (res.ok) {
        setKeys((prev) =>
          prev.map((k) => (k.id === id ? { ...k, isActive: !currentActive } : k))
        );
        if (onKeyUpdated) onKeyUpdated();
      }
    } catch (err) {
      console.error('Lỗi khi cập nhật trạng thái:', err);
    }
  };

  const usagePercent = quota.dailyLimit > 0 
    ? Math.min(100, Math.round((quota.usedToday / quota.dailyLimit) * 100))
    : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-[#1e1e1e] rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-[#dadce0] dark:border-[#3c4043] relative max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-[#5f6368] hover:text-[#202124] dark:text-[#9aa0a6] dark:hover:text-[#e3e3e3] rounded-full hover:bg-[#f1f3f4] dark:hover:bg-[#282828] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header của Modal */}
        <div className="flex items-center gap-3 mb-4 shrink-0">
          <div className="w-10 h-10 rounded-full bg-[#e8f0fe] dark:bg-[#1e2a38] text-[#1a73e8] dark:text-[#8ab4f8] flex items-center justify-center border border-[#d2e3fc] dark:border-[#2a3f58] shadow-2xs">
            <Key className="w-5 h-5 text-[#1a73e8] dark:text-[#8ab4f8]" />
          </div>
          <div>
            <h3 className="font-bold text-[#202124] dark:text-[#e3e3e3] text-base sm:text-lg">
              Quản Lý Kho Khóa AI (Google Gemini Vault)
            </h3>
            <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">
              Mã hóa 2 chiều AES-256-GCM an toàn • Tự động xoay tua đa key • Kiểm tra dung lượng
            </p>
          </div>
        </div>

        {/* NỘI DUNG CHÍNH CUỘN ĐƯỢC */}
        <div className="overflow-y-auto space-y-4 flex-1 pr-1">
          {/* PHẦN 1: BẢNG DUNG LƯỢNG / HẠN MỨC TRONG NGÀY */}
          <div className="bg-[#f8f9fa] dark:bg-[#282828] p-4 rounded-2xl border border-[#dadce0] dark:border-[#3c4043] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#202124] dark:text-[#e3e3e3] flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#1a73e8] dark:text-[#8ab4f8]" />
                Hạn mức sinh đề & Trợ lý AI hôm nay:
              </span>
              <span className="font-bold text-[#202124] dark:text-[#e3e3e3]">
                {quota.usedToday} / {quota.dailyLimit} lượt ({usagePercent}%)
              </span>
            </div>

            {/* Thanh tiến trình */}
            <div className="w-full bg-[#e8eaed] dark:bg-[#3c4043] h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 rounded-full ${
                  usagePercent > 90 ? 'bg-rose-500' : usagePercent > 70 ? 'bg-amber-500' : 'bg-[#1a73e8] dark:bg-[#8ab4f8]'
                }`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#5f6368] dark:text-[#9aa0a6] pt-0.5">
              <span>Còn lại: <strong className="text-emerald-600 dark:text-emerald-400">{quota.remaining} lượt</strong></span>
              <span className="italic">Tự động đặt lại sau 00:00 đêm mỗi ngày</span>
            </div>
          </div>

          {/* PHẦN 2: DANH SÁCH CÁC API KEY CÁ NHÂN ĐÃ LƯU TRONG DATABASE */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#202124] dark:text-[#e3e3e3] uppercase tracking-wider">
                Khóa AI Cá Nhân Đã Lưu ({keys.length})
              </h4>
              <button
                onClick={fetchKeys}
                disabled={isLoading}
                title="Làm mới danh sách"
                className="text-xs text-[#1a73e8] dark:text-[#8ab4f8] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Làm mới</span>
              </button>
            </div>

            {keys.length === 0 ? (
              <div className="text-center py-6 px-4 bg-[#f8f9fa] dark:bg-[#242424] rounded-2xl border border-dashed border-[#dadce0] dark:border-[#3c4043] space-y-1.5">
                <AlertCircle className="w-6 h-6 text-amber-500 mx-auto" />
                <p className="text-xs font-semibold text-[#202124] dark:text-[#e3e3e3]">
                  Thầy/Cô chưa lưu Google Gemini API Key nào vào tài khoản!
                </p>
                <p className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] max-w-sm mx-auto">
                  Hãy thêm API Key bên dưới để mở khóa toàn bộ quyền năng AI sinh đề, đổi số liệu và sửa câu hỏi tự động.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {keys.map((k) => {
                  const testRes = testResults[k.id];
                  return (
                    <div
                      key={k.id}
                      className={`p-3 rounded-2xl border transition-all ${
                        k.isActive
                          ? 'bg-white dark:bg-[#282828] border-[#dadce0] dark:border-[#3c4043] shadow-xs'
                          : 'bg-[#f8f9fa] dark:bg-[#202020] border-[#dadce0] dark:border-[#3c4043] opacity-60'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-[#202124] dark:text-[#e3e3e3]">
                              {k.label}
                            </span>
                            {/* Trạng thái hoạt động */}
                            {k.isActive ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#e6f4ea] dark:bg-[#0f291e] text-[#137333] dark:text-[#5bb98c] border border-[#ceead6] dark:border-[#1e4a34]">
                                Sẵn sàng
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f1f3f4] dark:bg-[#303134] text-[#5f6368] dark:text-[#9aa0a6]">
                                Đã tạm tắt
                              </span>
                            )}
                            {k.errorCount > 0 && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#fef7e0] dark:bg-[#33250b] text-[#b06000] dark:text-[#fdd663] border border-[#feefc3] dark:border-[#533f16]" title="Key gặp lỗi hoặc chạm trần rate limit">
                                Chờ hồi phục (429)
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-[#5f6368] dark:text-[#9aa0a6] font-mono">
                            <span className="bg-[#f1f3f4] dark:bg-[#181818] border border-[#dadce0] dark:border-[#3c4043] px-2 py-0.5 rounded-md font-semibold text-[#202124] dark:text-[#e3e3e3]">
                              {k.keyMasked}
                            </span>
                            {k.lastUsedAt && (
                              <span className="flex items-center gap-1 font-sans">
                                <Clock className="w-3 h-3" />
                                Dùng lần cuối: {new Date(k.lastUsedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Các nút thao tác */}
                        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                          {/* Nút kiểm tra sống/chết (Ping Test) */}
                          <button
                            onClick={() => handleTestKey(k.id)}
                            disabled={testingKeyId === k.id}
                            className="px-3 py-1 rounded-full text-[11px] font-medium bg-[#f1f3f4] hover:bg-[#e8eaed] dark:bg-[#303134] dark:hover:bg-[#3c4043] text-[#202124] dark:text-[#e3e3e3] border border-[#dadce0] dark:border-[#3c4043] transition-colors flex items-center gap-1 cursor-pointer"
                            title="Kiểm tra xem key này còn sống, hết hạn hay hết lượt gọi"
                          >
                            <RefreshCw className={`w-3 h-3 ${testingKeyId === k.id ? 'animate-spin text-[#1a73e8] dark:text-[#8ab4f8]' : ''}`} />
                            <span>{testingKeyId === k.id ? 'Đang test...' : 'Kiểm tra key'}</span>
                          </button>

                          {/* Bật / Tắt */}
                          <button
                            onClick={() => handleToggleKey(k.id, k.isActive)}
                            className="px-2.5 py-1 rounded-full text-[11px] font-medium text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#f1f3f4] dark:hover:bg-[#303134] transition-colors cursor-pointer"
                          >
                            {k.isActive ? 'Tạm tắt' : 'Bật lại'}
                          </button>

                          {/* Xóa */}
                          <button
                            onClick={() => handleDeleteKey(k.id)}
                            className="p-1.5 rounded-full text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Xóa khóa này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Hiển thị kết quả Test trực tiếp nếu có */}
                      {testRes && (
                        <div className={`mt-2 pt-2 border-t border-[#dadce0] dark:border-[#3c4043] text-[11px] flex items-center gap-1.5 ${
                          testRes.status === 'ACTIVE'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : testRes.status === 'QUOTA_EXCEEDED'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}>
                          {testRes.status === 'ACTIVE' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          ) : (
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          )}
                          <span className="font-semibold">{testRes.message}</span>
                          {testRes.latencyMs && (
                            <span className="text-[#5f6368] dark:text-[#9aa0a6]">({testRes.latencyMs}ms)</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* PHẦN 3: FORM THÊM API KEY MỚI VÀO CƠ SỞ DỮ LIỆU */}
          <div className="bg-[#f8f9fa] dark:bg-[#282828] p-4 rounded-2xl border border-[#dadce0] dark:border-[#3c4043] space-y-3">
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#1a73e8] dark:text-[#8ab4f8]" />
              <h4 className="text-xs font-bold text-[#202124] dark:text-[#e3e3e3]">
                Thêm Google Gemini API Key Mới
              </h4>
            </div>

            <form onSubmit={handleAddKey} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-1">
                  <label className="text-[11px] font-semibold text-[#202124] dark:text-[#e3e3e3] block mb-1">
                    Tên gợi nhớ:
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Key chính 1"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white dark:bg-[#1e1e1e] border border-[#dadce0] dark:border-[#3c4043] rounded-xl focus:border-[#1a73e8] dark:focus:border-[#8ab4f8] outline-hidden text-[#202124] dark:text-[#e3e3e3]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-semibold text-[#202124] dark:text-[#e3e3e3] block mb-1">
                    Giá trị API Key (Bắt đầu bằng AIza...):
                  </label>
                  <div className="relative">
                    <input
                      type={showNewKey ? 'text' : 'password'}
                      placeholder="AIzaSy..."
                      value={newKey}
                      onChange={(e) => setNewKey(e.target.value)}
                      className="w-full text-xs px-3 py-2 pr-9 bg-white dark:bg-[#1e1e1e] border border-[#dadce0] dark:border-[#3c4043] rounded-xl focus:border-[#1a73e8] dark:focus:border-[#8ab4f8] outline-hidden font-mono text-[#202124] dark:text-[#e3e3e3]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewKey(!showNewKey)}
                      className="absolute right-2.5 top-2 text-[#5f6368] hover:text-[#202124] dark:text-[#9aa0a6] dark:hover:text-[#e3e3e3] cursor-pointer"
                    >
                      {showNewKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {saveMessage && (
                <div
                  className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                    saveMessage.type === 'success'
                      ? 'bg-[#e6f4ea] dark:bg-[#0f291e] text-[#137333] dark:text-[#5bb98c] border border-[#ceead6] dark:border-[#1e4a34]'
                      : 'bg-[#fce8e6] dark:bg-[#371918] text-[#c5221f] dark:text-[#f28b82] border border-[#fad2cf] dark:border-[#5c2725]'
                  }`}
                >
                  {saveMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{saveMessage.text}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Mã hóa AES-256-GCM tự động trước khi lưu
                </span>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-full text-xs font-semibold text-white bg-[#1a73e8] hover:bg-[#1557b0] dark:bg-[#8ab4f8] dark:text-[#181818] dark:hover:bg-[#a8c7fa] shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>{isSaving ? 'Đang mã hóa & lưu...' : 'Lưu Key Vào Hệ Thống'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* PHẦN 4: HƯỚNG DẪN LẤY KEY MIỄN PHÍ TỪ GOOGLE AI STUDIO */}
          <div className="p-3 bg-[#f8f9fa] dark:bg-[#282828] rounded-2xl border border-[#dadce0] dark:border-[#3c4043] flex items-start gap-2.5 text-xs text-[#5f6368] dark:text-[#9aa0a6]">
            <Sparkles className="w-4 h-4 text-[#1a73e8] dark:text-[#8ab4f8] shrink-0 mt-0.5" />
            <div>
              <span>Chưa có Google Gemini API Key? Lấy miễn phí 100% tại </span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[#1a73e8] dark:text-[#8ab4f8] font-bold hover:underline inline-flex items-center gap-0.5"
              >
                Google AI Studio <ExternalLink className="w-3 h-3" />
              </a>
              <p className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] mt-0.5">
                Mỗi tài khoản Google được cấp miễn phí gọi mô hình Gemini 2.5 Flash hàng nghìn câu/ngày. Thầy/Cô có thể thêm nhiều key để hệ thống tự động xoay tua.
              </p>
            </div>
          </div>
        </div>

        {/* Nút đóng chân modal */}
        <div className="pt-3 border-t border-[#dadce0] dark:border-[#3c4043] flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-[#3c4043] dark:text-[#e3e3e3] hover:bg-[#f1f3f4] dark:hover:bg-[#282828] rounded-full border border-[#dadce0] dark:border-[#3c4043] transition-colors cursor-pointer"
          >
            Đóng bảng
          </button>
        </div>
      </div>
    </div>
  );
};
