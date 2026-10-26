'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

interface Teacher { id: string; name: string; email: string; role: 'SUPER_ADMIN' | 'TEACHER'; isActive: boolean; aiDailyLimit: number }
interface Recipient { userId: string; name: string; email: string; accountActive: boolean; isActive: boolean; errorCount: number; lastUsedAt: string | null }
interface Grant { grantId: string; label: string; keyMasked: string; createdAt: string; recipients: Recipient[] }

const field = 'w-full rounded-xl border border-[#dadce0] dark:border-[#3c4043] bg-white dark:bg-[#242424] px-3 py-2 text-sm';
const pill = 'px-3 py-1.5 rounded-full border border-[#dadce0] dark:border-[#3c4043] text-xs font-semibold disabled:opacity-50';

export default function AdminKeyGrantsPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [grants, setGrants] = useState<Grant[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [label, setLabel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [addTo, setAddTo] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    try {
      const [usersResponse, grantsResponse] = await Promise.all([fetch('/api/admin/users', { cache: 'no-store' }), fetch('/api/admin/keys', { cache: 'no-store' })]);
      const users = await usersResponse.json(), granted = await grantsResponse.json();
      if (!usersResponse.ok || !grantsResponse.ok) { setMessage(users.error || granted.error || 'Chưa tải được dữ liệu.'); return; }
      setTeachers(users.users); setGrants(granted.grants);
    } catch { setMessage('Không thể kết nối đến máy chủ'); }
  }, []);
  // Loaded from a timer so that state is never set synchronously inside the effect.
  useEffect(() => { const timer = setTimeout(() => void load(), 0); return () => clearTimeout(timer); }, [load]);

  const call = async (method: string, url: string, body?: unknown) => {
    setBusy(true); setMessage('');
    try {
      const response = await fetch(url, { method, headers: body === undefined ? undefined : { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) { setMessage(data.error || 'Chưa thực hiện được.'); return null; }
      await load(); return data;
    } catch { setMessage('Không thể kết nối đến máy chủ'); return null; } finally { setBusy(false); }
  };

  const visible = useMemo(() => teachers.filter(t => t.isActive && `${t.name} ${t.email}`.toLowerCase().includes(search.trim().toLowerCase())), [teachers, search]);
  const toggle = (id: string) => setChosen(previous => { const next = new Set(previous); if (next.has(id)) next.delete(id); else next.add(id); return next; });

  const grant = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!chosen.size) { setMessage('Hãy chọn ít nhất một giáo viên nhận khóa.'); return; }
    const data = await call('POST', '/api/admin/keys', { label: label.trim(), apiKey: apiKey.trim(), userIds: [...chosen] });
    if (data) { setApiKey(''); setLabel(''); setChosen(new Set()); setMessage(`Đã cấp khóa cho ${data.added} giáo viên. Khóa không hiện lại ở bất kỳ đâu.`); }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#17181a] text-[#202124] dark:text-[#e3e3e3] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#dadce0] dark:border-[#3c4043]">
          <div>
            <h1 className="text-2xl font-bold">Cấp khóa AI cho giáo viên</h1>
            <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6]">Bạn nhập một khóa và chọn giáo viên nhận. Họ dùng được khóa nhưng không thấy, không xuất, không xóa được. Mỗi người vẫn bị giới hạn lệnh AI mỗi ngày riêng (đặt ở trang quản lý giáo viên).</p>
          </div>
          <div className="flex gap-2 text-xs">
            <Link className={pill} href="/admin/users">Quản lý giáo viên</Link>
            <Link className={pill} href="/admin/ai">Giám sát AI Keys</Link>
            <Link className={pill} href="/">Trang soạn đề</Link>
          </div>
        </div>

        {message && <p role="status" className="app-feedback rounded-xl border p-3 text-sm">{message}</p>}

        <form onSubmit={grant} className="rounded-xl border border-[#dadce0] dark:border-[#3c4043] bg-white dark:bg-[#202124] p-5 space-y-4" aria-label="Cấp khóa mới">
          <h2 className="font-semibold">Cấp một khóa mới</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">Tên khóa (để nhớ)<input required maxLength={120} value={label} onChange={e => setLabel(e.target.value)} className={field} placeholder="Ví dụ: Khóa chung tổ Toán" /></label>
            <label className="block text-sm">Khóa API Gemini<input required type="password" autoComplete="off" value={apiKey} onChange={e => setApiKey(e.target.value)} className={field} placeholder="Dán khóa; sẽ không hiện lại" /></label>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <input aria-label="Tìm giáo viên để cấp" value={search} onChange={e => setSearch(e.target.value)} className={field + ' sm:max-w-xs'} placeholder="Tìm theo tên hoặc email..." />
              <button type="button" className={pill} onClick={() => setChosen(new Set(visible.map(t => t.id)))}>Chọn tất cả đang hiện</button>
              <button type="button" className={pill} onClick={() => setChosen(new Set())}>Bỏ chọn hết</button>
              <span className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">Đã chọn {chosen.size} giáo viên</span>
            </div>
            <ul className="max-h-56 overflow-y-auto divide-y divide-[#dadce0] dark:divide-[#3c4043] rounded-xl border border-[#dadce0] dark:border-[#3c4043]">
              {visible.map(t => (
                <li key={t.id}><label className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={chosen.has(t.id)} onChange={() => toggle(t.id)} aria-label={`Cấp cho ${t.name}`} />
                  <span className="font-medium">{t.name}</span><span className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">{t.email} · {t.aiDailyLimit} lệnh/ngày</span>
                </label></li>
              ))}
              {!visible.length && <li className="px-3 py-4 text-sm text-[#5f6368] dark:text-[#9aa0a6]">Không có giáo viên phù hợp.</li>}
            </ul>
          </div>
          <button type="submit" disabled={busy} className="px-5 py-2 rounded-lg app-button-primary text-white text-sm font-semibold disabled:opacity-50">Cấp khóa cho người đã chọn</button>
        </form>

        <section className="space-y-3" aria-label="Các khóa đã cấp">
          <h2 className="font-semibold">Các khóa đã cấp ({grants.length})</h2>
          {!grants.length && <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6]">Chưa cấp khóa nào.</p>}
          {grants.map(g => {
            const missing = teachers.filter(t => t.isActive && !g.recipients.some(r => r.userId === t.id));
            return (
              <div key={g.grantId} className="rounded-xl border border-[#dadce0] dark:border-[#3c4043] bg-white dark:bg-[#202124] p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div><p className="font-semibold">{g.label}</p><p className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">Khóa {g.keyMasked} · cấp {new Date(g.createdAt).toLocaleString('vi-VN')} · {g.recipients.length} người nhận</p></div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" disabled={busy} className={pill} onClick={() => void call('PATCH', '/api/admin/keys', { grantId: g.grantId, isActive: false })}>Tắt cho tất cả</button>
                    <button type="button" disabled={busy} className={pill} onClick={() => void call('PATCH', '/api/admin/keys', { grantId: g.grantId, isActive: true })}>Bật cho tất cả</button>
                    <button type="button" disabled={busy} className={pill + ' text-red-700'} onClick={() => { if (confirm(`Thu hồi khóa "${g.label}" của tất cả ${g.recipients.length} người? Khóa bị xóa khỏi hệ thống.`)) void call('DELETE', `/api/admin/keys?grantId=${encodeURIComponent(g.grantId)}`); }}>Thu hồi của tất cả</button>
                  </div>
                </div>
                <ul className="divide-y divide-[#dadce0] dark:divide-[#3c4043] text-sm">
                  {g.recipients.map(r => (
                    <li key={r.userId} className="flex flex-wrap items-center justify-between gap-2 py-2">
                      <span><span className="font-medium">{r.name}</span> <span className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">{r.email}{!r.accountActive ? ' · tài khoản đã khóa' : ''}</span></span>
                      <span className="flex items-center gap-2">
                        <span className="text-xs text-[var(--ui-text-secondary)]">{r.isActive ? 'Đang bật' : 'Đang tắt'}{r.errorCount ? ` · lỗi ${r.errorCount}` : ''}{r.lastUsedAt ? ` · dùng ${new Date(r.lastUsedAt).toLocaleDateString('vi-VN')}` : ' · chưa dùng'}</span>
                        <button type="button" disabled={busy} className={pill} onClick={() => void call('PATCH', '/api/admin/keys', { grantId: g.grantId, userId: r.userId, isActive: !r.isActive })} aria-label={`${r.isActive ? 'Tắt' : 'Bật'} khóa của ${r.name}`}>{r.isActive ? 'Tắt' : 'Bật'}</button>
                        <button type="button" disabled={busy} className={pill + ' text-red-700'} onClick={() => { if (confirm(`Thu hồi khóa này của ${r.name}?`)) void call('DELETE', `/api/admin/keys?grantId=${encodeURIComponent(g.grantId)}&userId=${encodeURIComponent(r.userId)}`); }} aria-label={`Thu hồi khóa của ${r.name}`}>Thu hồi</button>
                      </span>
                    </li>
                  ))}
                </ul>
                {missing.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <select aria-label={`Thêm người nhận khóa ${g.label}`} value={addTo[g.grantId] ?? ''} onChange={e => setAddTo(previous => ({ ...previous, [g.grantId]: e.target.value }))} className={field + ' sm:max-w-xs'}>
                      <option value="">-- Thêm người nhận --</option>
                      {missing.map(t => <option key={t.id} value={t.id}>{t.name} ({t.email})</option>)}
                    </select>
                    <button type="button" disabled={busy || !addTo[g.grantId]} className={pill} onClick={async () => { const data = await call('POST', '/api/admin/keys', { grantId: g.grantId, userIds: [addTo[g.grantId]] }); if (data) setAddTo(previous => ({ ...previous, [g.grantId]: '' })); }}>Thêm</button>
                  </div>
                )}
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
}
