'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { X, Key, Trash2, RefreshCw, Eye, EyeOff } from 'lucide-react';
import type { AiModelOption } from '@/lib/gemini-keys';
import { accountFetch } from '@/lib/account-fetch';
interface UserKey { id: string; label: string; keyMasked: string; isActive: boolean; usedToday: number; errorCount: number; }
interface AppQuota { limit: number; usedToday: number; remaining: number; resetsAt?: string; }
interface Log { id: string; endpointLabel: string; model: string | null; httpStatus: number | null; createdAt: string; }
interface Props { ownerId: string; isOpen: boolean; onClose: () => void; onKeyUpdated?: () => void; }
const field = 'block w-full border rounded-xl p-2.5 bg-transparent mt-1';
export const ApiKeyModal: React.FC<Props> = ({ ownerId, isOpen, onClose, onKeyUpdated }) => {
  const [keys, setKeys] = useState<UserKey[]>([]);
  const [quota, setQuota] = useState<AppQuota | null>(null);
  const [models, setModels] = useState<AiModelOption[]>([]);
  const [model, setModel] = useState('');
  const [newKey, setNewKey] = useState('');
  const [label, setLabel] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [testResults, setTestResults] = useState<Record<string, string>>({});
  const [logs, setLogs] = useState<Log[] | null>(null);
  const load = useCallback(async () => {
    const response = await accountFetch(ownerId, '/api/user/keys'); const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Chưa tải được khóa');
    setKeys(data.keys); setQuota(data.poolQuota); setModel(data.selectedAiModel); setModels(data.availableModels || []);
  }, [ownerId]);
  useEffect(() => { if (isOpen) { setMessage(''); load().catch(error => setMessage(error.message)); } }, [isOpen, load]);
  if (!isOpen) return null;
  const request = async (path: string, method: string, body?: unknown) => {
    const response = await accountFetch(ownerId, path, { method, headers: { 'Content-Type': 'application/json' }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
    const data = await response.json(); if (!response.ok) throw new Error(data.error || data.message || 'Chưa xử lý được yêu cầu'); return data;
  };
  const mutation = async (action: () => Promise<void>) => { setBusy(true); setMessage(''); try { await action(); onKeyUpdated?.(); } catch (error) { setMessage(error instanceof Error ? error.message : 'Lỗi kết nối'); } finally { setBusy(false); } };
  const add = (event: React.FormEvent) => { event.preventDefault(); void mutation(async () => { await request('/api/user/keys', 'POST', { apiKey: newKey, ...(label.trim() ? { label: label.trim() } : {}) }); setNewKey(''); setLabel(''); await load(); setMessage('Đã lưu khóa được mã hóa.'); }); };
  const test = (id: string) => mutation(async () => {
    const data = await request('/api/user/keys/test', 'POST', { keyId: id, testModel: model });
    setTestResults(current => ({ ...current, [id]: data.message || data.error || 'Chưa có kết quả' }));
    if (data.availableModels) setModels(data.availableModels);
  });
  return <div className="fixed inset-0 z-50 bg-black/60 p-4 flex items-center justify-center"><section role="dialog" aria-modal="true" aria-label="Khóa AI của bạn" className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#1e1e1e] text-[#202124] dark:text-[#e3e3e3] rounded-3xl p-6 space-y-4">
    <header className="flex justify-between items-center"><h2 className="font-bold text-lg flex gap-2 items-center"><Key size={20} />Khóa AI của bạn</h2><button onClick={onClose} aria-label="Đóng"><X /></button></header>
    <p className="text-sm">Bạn dùng khóa Gemini của chính mình. Khóa thuộc project miễn phí hay bật thanh toán đều dùng cùng chức năng; quyền model, giá và hạn mức do Google quyết định.</p>
    {quota && <div className="border rounded-xl p-3 text-sm"><strong>Giới hạn trong ứng dụng hôm nay (UTC): {quota.usedToday} / {quota.limit} thao tác</strong><p>Đây là giới hạn nội bộ do quản trị viên đặt. Không phải quota hoặc số tiền còn lại ở Google.</p></div>}
    <p className="text-sm">Quota Google chưa xác định. Nhiều khóa cùng project không làm tăng hạn mức. <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-blue-600 underline">Xem project, quota và billing tại AI Studio</a>.</p>
    <label className="block text-sm">Model dùng cho yêu cầu tiếp theo<input className={field} value={model} onChange={event => setModel(event.target.value)} list="gemini-model-options" placeholder="Nhập mã model hoặc chọn từ danh mục" /><datalist id="gemini-model-options">{models.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}</datalist></label>
    <p className="text-xs">Danh sách ban đầu là gợi ý. Bấm “Đọc danh mục” ở một khóa để xem model hiện được liệt kê cho project đó. Ứng dụng không tự đổi model khi lỗi.</p>
    <button disabled={busy || !model.trim()} onClick={() => mutation(async () => { const data = await request('/api/user/keys', 'PATCH', { action: 'set_model', model }); setModel(data.selectedAiModel); setMessage('Đã lưu model. Quyền gọi và quota cần được kiểm tra với nhà cung cấp.'); })} className="rounded-full bg-blue-600 text-white px-4 py-2 disabled:opacity-50">Lưu model</button>
    <div className="space-y-3">{keys.map(key => <article key={key.id} className="border rounded-2xl p-4 space-y-2"><div className="flex justify-between gap-3"><div><strong>{key.label}</strong><p className="font-mono text-xs">{key.keyMasked}</p></div><span className="text-sm">{key.isActive ? 'Đang bật' : 'Đang tắt'}</span></div><p className="text-xs">Thao tác thành công được ghi nhận bằng khóa này hôm nay: {key.usedToday}. Không suy ra quota còn lại.</p><div className="flex flex-wrap gap-3 text-sm"><button disabled={busy} onClick={() => test(key.id)} className="text-blue-600">Đọc danh mục</button><button disabled={busy} onClick={() => mutation(async () => { await request('/api/user/keys', 'PATCH', { id: key.id, isActive: !key.isActive }); await load(); })}>{key.isActive ? 'Tắt khóa' : 'Bật khóa'}</button><button disabled={busy} onClick={() => { if (confirm('Xóa khóa đã lưu này? Bạn cần nhập lại nếu muốn dùng sau.')) void mutation(async () => { await request('/api/user/keys?id=' + encodeURIComponent(key.id), 'DELETE'); await load(); }); }} className="flex items-center gap-1 text-red-600"><Trash2 size={14} />Xóa</button></div>{testResults[key.id] && <p className="text-xs" role="status">{testResults[key.id]}</p>}</article>)}</div>
    <form onSubmit={add} className="border rounded-2xl p-4 space-y-3"><h3 className="font-semibold">Thêm khóa</h3><label className="block text-sm">Tên dễ nhớ<input className={field} maxLength={120} value={label} onChange={e => setLabel(e.target.value)} /></label><label className="block text-sm">Khóa API<input className={field} type={showKey ? 'text' : 'password'} autoComplete="off" minLength={10} maxLength={500} required value={newKey} onChange={e => setNewKey(e.target.value)} /></label><div className="flex justify-between"><button type="button" onClick={() => setShowKey(!showKey)} aria-label={showKey ? 'Ẩn khóa' : 'Hiện khóa'}>{showKey ? <EyeOff size={18} /> : <Eye size={18} />}</button><button disabled={busy} type="submit" className="rounded-full bg-blue-600 text-white px-4 py-2 disabled:opacity-50">Lưu khóa</button></div></form>
    <details onToggle={event => { if (event.currentTarget.open && logs === null) accountFetch(ownerId, '/api/user/ai-usage').then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error); setLogs(data.logs || []); }).catch(error => setMessage(error.message)); }}><summary className="text-sm cursor-pointer">Nhật ký thao tác gần đây</summary><div className="space-y-2 mt-2">{logs?.map(log => <p key={log.id} className="text-xs">{new Date(log.createdAt).toLocaleString('vi-VN')} · {log.endpointLabel} · {log.model} · {log.httpStatus === 200 ? 'Thành công' : log.httpStatus === 102 ? 'Đang xử lý' : 'Lỗi ' + log.httpStatus}</p>)}</div></details>
    {message && <p role="status" className="text-sm">{message}</p>}
    <button disabled={busy} className="flex items-center gap-2 text-sm" onClick={() => mutation(load)}><RefreshCw size={14} />Làm mới</button>
  </section></div>;
};
