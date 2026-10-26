'use client';

import { useState } from 'react';
import { listUnsavedDrafts, writeDraft, recoveryDraftAsNew } from '@/lib/exam-draft';
import type { Exam } from '@/types/exam';

export function LocalDraftsPanel({ ownerId }: { ownerId: string }) {
  const [items, setItems] = useState<{ storageId: string; exam: Exam; savedAt: string }[]>([]);
  const [unreadable, setUnreadable] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const download = (content: string, filename: string) => {
    const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <details className="no-print app-recovery-panel border rounded-2xl p-4 text-sm" onToggle={e => {
    if (!e.currentTarget.open) return;
    try { const result = listUnsavedDrafts(localStorage, ownerId); setItems(result.drafts); setUnreadable(result.unreadable); }
    catch { setMessage('Bộ nhớ trình duyệt đang bị chặn. Các tệp đã tải xuống vẫn dùng được.'); }
  }}>
    <summary className="cursor-pointer font-medium">Bản nháp chưa lưu trên máy này</summary>
    <p className="my-2 text-xs text-gray-500">Chỉ hiện nháp của tài khoản này. Có thể tải về trước khi mở lại; dữ liệu máy chủ không bị ghi đè khi mở nháp.</p>
    {message && <p role="status">{message}</p>}
    {!items.length && !unreadable.length && <p>Không tìm thấy bản nháp chưa lưu.</p>}
    {items.map(item => <div key={item.storageId} className="border-t py-2 flex flex-wrap items-center justify-between gap-3">
      <span>{item.exam.metadata.title} · {item.exam.questions.length} câu<br /><span className="text-xs text-gray-500">{item.savedAt ? new Date(item.savedAt).toLocaleString('vi-VN') : ''}</span></span>
      <span className="flex gap-3"><button type="button" onClick={() => download(JSON.stringify(item.exam, null, 2), 'ExamCraft-ban-nhap.json')}>Tải bản sao</button><button type="button" onClick={() => {
        try { writeDraft(localStorage, ownerId, 'new', item.storageId.startsWith('recovery:') ? recoveryDraftAsNew(item.exam) : item.exam); window.location.assign('/editor/new'); }
        catch { setMessage('Chưa mở được nháp vì bộ nhớ đang đầy. Hãy tải bản sao trước.'); }
      }}>Mở nháp</button></span>
    </div>)}
    {unreadable.map(key => <p key={key} className="border-t py-2">Có bản nháp chưa đọc được. <button type="button" className="underline" onClick={() => download(localStorage.getItem(key) ?? '', 'ExamCraft-ban-nhap-can-phuc-hoi.json')}>Tải dữ liệu gốc để phục hồi</button></p>)}
  </details>;
}
