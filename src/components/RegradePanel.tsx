'use client';

import React, { useCallback, useEffect, useState } from 'react';

type Correction = { at: string; reason: string; before: { correct: string | null; accepted: string[] }; after: { correct: string | null; accepted: string[] } };
type Item = { number: number; id: string; type: string; content: string; key: { correct: string | null; accepted: string[] }; choiceKeys: string[]; revision: string; corrections: Correction[] };
type Effect = { preview: boolean; submitted: number; keptManual: number; unchanged: number; changed: { attemptId: string; student: string; scoreBefore: number | null; scoreAfter: number | null }[] };

/** Fixes a wrong answer key of an auto-graded question and re-applies it to submitted attempts; hand grades are kept. */
export default function RegradePanel({ assignmentId, request, onChanged }: { assignmentId: string; request: (url: string, init?: RequestInit) => Promise<Response>; onChanged: () => void }) {
  const [items, setItems] = useState<Item[]>([]);
  const [selected, setSelected] = useState('');
  const [correct, setCorrect] = useState('');
  const [accepted, setAccepted] = useState('');
  const [reason, setReason] = useState('');
  const [effect, setEffect] = useState<Effect | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const url = `/api/teacher/assignments/${assignmentId}/regrade`;
  const item = items.find(entry => entry.id === selected);

  const load = useCallback(async () => {
    try {
      const response = await request(url, { cache: 'no-store' });
      if (response.ok) setItems((await response.json()).questions as Item[]);
    } catch { /* The panel stays empty; grading itself is unaffected. */ }
  }, [request, url]);
  useEffect(() => { void load(); }, [load]);

  const choose = (id: string) => {
    const next = items.find(entry => entry.id === id);
    setSelected(id); setEffect(null); setMessage('');
    setCorrect(next?.key.correct ?? ''); setAccepted(next?.key.accepted.join('\n') ?? '');
  };
  const send = async (preview: boolean) => {
    if (!item) return;
    setBusy(true); setMessage('');
    try {
      const body = { questionKey: item.id, reason, baseCorrectionRevision: item.revision, preview, ...(item.type === 'MULTIPLE_CHOICE' ? { correctAnswer: correct } : { acceptedAnswers: accepted.split('\n').map(line => line.trim()).filter(Boolean) }) };
      const response = await request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await response.json();
      if (!response.ok) { setMessage(data.error || 'Chưa sửa được đáp án'); if (response.status === 409) void load(); return; }
      setEffect(data as Effect);
      if (!preview) { setMessage(data.message); setReason(''); await load(); onChanged(); }
    } catch { setMessage('Mất kết nối; chưa ghi gì. Thử lại khi có mạng.'); } finally { setBusy(false); }
  };

  if (!items.length) return null;
  return (
    <details data-testid="regrade-panel" className="border border-[#dadce0] dark:border-[#3c4043] rounded-2xl p-4 bg-white dark:bg-[#1e1e1e]">
      <summary className="cursor-pointer text-sm font-medium">Sửa đáp án và chấm lại</summary>
      <div className="mt-3 space-y-3 text-xs">
        <p className="text-[#5f6368] dark:text-[#9aa0a6]">Chỉ áp dụng cho câu trắc nghiệm một đáp án, trả lời ngắn và điền khuyết. Câu bạn đã tự chấm tay được giữ nguyên; mỗi bài đổi điểm có ghi vào lịch sử chấm.</p>
        <label className="block">Câu cần sửa
          <select aria-label="Câu cần sửa" value={selected} onChange={event => choose(event.target.value)} className="mt-1 w-full border rounded-lg p-2 bg-transparent">
            <option value="">Chọn câu…</option>
            {items.map(entry => <option key={entry.id} value={entry.id}>Câu {entry.number}: {entry.content.slice(0, 60)}</option>)}
          </select>
        </label>
        {item && <>
          {item.type === 'MULTIPLE_CHOICE' ? (
            <label className="block">Đáp án đúng mới
              <select aria-label="Đáp án đúng mới" value={correct} onChange={event => { setCorrect(event.target.value); setEffect(null); }} className="mt-1 w-full border rounded-lg p-2 bg-transparent">
                {item.choiceKeys.map(key => <option key={key} value={key}>{key}</option>)}
              </select>
            </label>
          ) : (
            <label className="block">Các đáp án được chấp nhận (mỗi dòng một đáp án)
              <textarea aria-label="Các đáp án được chấp nhận" value={accepted} onChange={event => { setAccepted(event.target.value); setEffect(null); }} rows={3} className="mt-1 w-full border rounded-lg p-2 bg-transparent" />
            </label>
          )}
          <label className="block">Lý do (bắt buộc, lưu vào lịch sử)
            <input aria-label="Lý do sửa đáp án" value={reason} onChange={event => setReason(event.target.value)} maxLength={500} className="mt-1 w-full border rounded-lg p-2 bg-transparent" />
          </label>
          <div className="flex gap-2">
            <button type="button" disabled={busy || reason.trim().length < 3} onClick={() => void send(true)} className="px-3 py-1.5 rounded-full border disabled:opacity-50">Xem trước ảnh hưởng</button>
            <button type="button" disabled={busy || reason.trim().length < 3 || !effect?.preview} onClick={() => void send(false)} className="px-3 py-1.5 rounded-full bg-[#1a73e8] text-white disabled:opacity-50">Sửa đáp án và chấm lại</button>
          </div>
          {effect && <div data-testid="regrade-effect" className="rounded-lg bg-[#f1f3f4] dark:bg-[#282828] p-2">
            {effect.preview ? 'Xem trước: ' : 'Đã ghi: '}{effect.changed.length} bài đổi điểm, {effect.keptManual} bài đã chấm tay được giữ nguyên, {effect.unchanged} bài không đổi (tổng {effect.submitted} bài đã nộp).
            {effect.changed.length > 0 && <ul className="mt-1 list-disc pl-4">{effect.changed.map(change => <li key={change.attemptId}>{change.student}: {change.scoreBefore ?? '—'} → {change.scoreAfter ?? '—'}</li>)}</ul>}
          </div>}
          {item.corrections.length > 0 && <div><strong>Lịch sử sửa đáp án</strong><ul className="list-disc pl-4">{item.corrections.map(entry => <li key={entry.at}>{new Date(entry.at).toLocaleString('vi-VN')}: {entry.before.correct ?? '—'} → {entry.after.correct ?? '—'} — {entry.reason}</li>)}</ul></div>}
        </>}
        {message && <p role="status" data-testid="regrade-message">{message}</p>}
      </div>
    </details>
  );
}
