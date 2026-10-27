'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { aiActivityLabel } from '@/lib/admin-overview';

type Overview = {
  stats: { totalToday: number; successToday: number; errorToday: number; pendingToday: number; completedToday: number; successRate: number | null };
  keySummary: { total: number; active: number; personal: number; granted: number };
  recentLogs: { id: string; endpoint: string; keyAlias: string | null; httpStatus: number | null; latencyMs: number | null; createdAt: string; user: { name: string; email: string } | null }[];
};

export default function AdminAiPage() {
  const router = useRouter();
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [updated, setUpdated] = useState('');
  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch('/api/admin/ai', { cache: 'no-store', signal });
      if (response.status === 401) { router.push('/login'); return; }
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Chưa tải được hoạt động AI.');
      if (signal?.aborted) return;
      setData(result); setError(''); setUpdated(new Date().toLocaleTimeString('vi-VN'));
    } catch (e) {
      if (!signal?.aborted) setError(e instanceof Error ? e.message : 'Không kết nối được máy chủ.');
    } finally { if (!signal?.aborted) setLoading(false); }
  }, [router]);
  useEffect(() => {
    const controller = new AbortController();
    const initial = setTimeout(() => void load(controller.signal), 0);
    const timer = setInterval(() => void load(controller.signal), 10000);
    return () => { controller.abort(); clearTimeout(initial); clearInterval(timer); };
  }, [load]);
  return <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6">
    <div className="flex flex-wrap justify-between items-start gap-4">
      <div><h1 className="text-2xl font-semibold">Hoạt động AI</h1><p className="text-sm text-[var(--ui-text-secondary)] mt-1">Lượt sử dụng hôm nay và khóa đã lưu của các tài khoản.</p></div>
      <button onClick={() => void load()} className="app-button-secondary inline-flex items-center gap-2 px-3 py-2 text-sm"><RefreshCw size={16} />Làm mới</button>
    </div>
    {error && <p role="alert" className="app-feedback border rounded-xl p-3 text-sm">{error}{data && ' Số liệu bên dưới là lần tải thành công trước.'}</p>}
    {loading && <p role="status" className="text-sm text-[var(--ui-text-secondary)]">Đang tải hoạt động AI...</p>}
    {data && <>
      <section aria-label="Lượt dùng AI hôm nay" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {([['Tổng lượt yêu cầu', data.stats.totalToday], ['Thành công', data.stats.successToday], ['Chưa thành công', data.stats.errorToday], ['Chưa có kết quả', data.stats.pendingToday]] as const).map(([label, value]) => <div key={label} className="bg-[var(--ui-surface)] border rounded-xl p-4 space-y-2"><h2 className="text-sm text-[var(--ui-text-secondary)]">{label}</h2><p className="text-2xl font-semibold">{value}</p></div>)}
      </section>
      <p className="text-sm text-[var(--ui-text-secondary)]">{data.stats.successRate === null ? 'Chưa có lượt kết thúc để tính tỷ lệ thành công.' : `Tỷ lệ thành công: ${data.stats.successRate}% trong ${data.stats.completedToday} lượt đã kết thúc.`} Hôm nay theo giờ máy chủ. {updated && `Cập nhật lúc ${updated}.`}</p>
      <section aria-labelledby="saved-keys-title" className="border bg-[var(--ui-surface)] rounded-xl p-5 space-y-3">
        <div className="flex flex-wrap justify-between gap-3 items-center"><h2 id="saved-keys-title" className="font-semibold">Khóa gắn với tài khoản</h2><Link href="/admin/keys" className="app-button-secondary inline-flex px-3 py-2 text-sm">Cấp và quản lý khóa</Link></div>
        {data.keySummary.total === 0 ? <p className="text-sm text-[var(--ui-text-secondary)]">Chưa có khóa đã lưu.</p> : <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">{([['Đã lưu', data.keySummary.total], ['Đang bật', data.keySummary.active], ['Tự thêm', data.keySummary.personal], ['Được cấp', data.keySummary.granted]] as const).map(([label, value]) => <div key={label}><dt className="text-[var(--ui-text-secondary)]">{label}</dt><dd className="text-xl font-semibold mt-1">{value}</dd></div>)}</dl>}
        <p className="text-sm text-[var(--ui-text-secondary)]">Đếm theo từng tài khoản: một khóa cấp cho nhiều người được tính ở từng người nhận. Trạng thái bật không xác nhận khóa còn hạn mức từ nhà cung cấp.</p>
      </section>
      <section aria-labelledby="recent-ai-title" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2"><h2 id="recent-ai-title" className="font-semibold">Hoạt động gần đây</h2><span className="text-sm text-[var(--ui-text-secondary)]">Tối đa 30 yêu cầu gần nhất</span></div>
        {!data.recentLogs.length ? <p className="border rounded-xl bg-[var(--ui-surface)] p-5 text-sm text-[var(--ui-text-secondary)]">Chưa có hoạt động AI được ghi nhận.</p> : <ol className="border rounded-xl bg-[var(--ui-surface)] divide-y">{data.recentLogs.map(log => <li key={log.id} className="grid gap-3 sm:grid-cols-3 px-4 py-4 text-sm [overflow-wrap:anywhere]">
          <div><p className="font-medium">{aiActivityLabel(log.endpoint)}</p><time className="text-xs text-[var(--ui-text-secondary)]">{new Date(log.createdAt).toLocaleString('vi-VN')}</time></div>
          <div><p>{log.user?.name || 'Tài khoản không còn trong hệ thống'}</p><p className="text-xs text-[var(--ui-text-secondary)]">{log.keyAlias?.startsWith('user_key:') ? 'Khóa của tài khoản' : log.keyAlias === 'byok_temporary' ? 'Khóa dùng cho lượt này' : 'Không có thông tin khóa tài khoản'}</p></div>
          <div><span className={`inline-flex border rounded-full px-2 py-1 text-xs ${log.httpStatus !== null && log.httpStatus !== 200 ? 'text-red-700 dark:text-red-300' : 'app-feedback'}`}>{log.httpStatus === null ? 'Chưa có kết quả' : log.httpStatus === 200 ? 'Thành công' : log.httpStatus === 499 ? 'Đã hủy' : 'Chưa thành công'}</span><details className="mt-2 text-xs text-[var(--ui-text-secondary)]"><summary className="cursor-pointer">Chi tiết kỹ thuật</summary><p className="mt-1">{log.endpoint} · {log.httpStatus ?? 'chưa có kết quả'}{log.latencyMs !== null ? ` · ${log.latencyMs} ms` : ''}</p></details></div>
        </li>)}</ol>}
      </section>
    </>}
  </main>;
}
