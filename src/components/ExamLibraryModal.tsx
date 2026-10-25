'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { Exam } from '@/types/exam';
import { loadExam, persistExam } from '@/lib/exam-client';
import { dbExportDatabaseToJson } from '@/lib/db';
import { portableExamBackup } from '@/lib/portable-backup';
import { BACKUP_FILE_MAX_BYTES, parseBackupText, splitBackupFiles } from '@/lib/backup-files';

interface Props { isOpen: boolean; onClose: () => void; onLoadExam: (exam: Exam) => void; currentExam: Exam; ownerId: string }
interface Summary { permissions?: Exam['access']; id: string; title: string; subject: string; grade: number; version: number }
interface ImportReport { dryRun: boolean; errorCount: number; results: { kind: string; index: number; status: string; error?: string; canImportCopy?: boolean; copy?: boolean }[]; message: string }
type Backup = { exams: unknown[]; questions: unknown[] };

export function ExamLibraryModal({ isOpen, onClose, onLoadExam, ownerId }: Props) {
  const [exams, setExams] = useState<Summary[]>([]), [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const [pending, setPending] = useState<Backup | null>(null), [report, setReport] = useState<ImportReport | null>(null);
  const [confirmImport, setConfirmImport] = useState(false);
  const [copyConflicts, setCopyConflicts] = useState(false);
  const [preparedDownloads, setPreparedDownloads] = useState<{ url: string; name: string; examCount: number }[]>([]);
  useEffect(() => () => { for (const file of preparedDownloads) URL.revokeObjectURL(file.url); }, [preparedDownloads]);
  const upload = useRef<HTMLInputElement>(null);
  async function readList() {
    const all: Summary[] = [];
    for (let page = 1; ; page++) {
      const response = await fetch(`/api/exams?limit=100&page=${page}`, { cache: 'no-store', headers: { 'x-examcraft-user': ownerId } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Không tải được kho đề');
      all.push(...data.exams);
      if (page >= data.pagination.totalPages) break;
    }
    return all;
  }
  function list() { return readList().then(all => { setExams(all); return all; }); }
  const [previousOpen, setPreviousOpen] = useState(isOpen);
  if (previousOpen !== isOpen) { setPreviousOpen(isOpen); if (isOpen) setMessage(''); }
  useEffect(() => { if (isOpen) void list().catch(e => setMessage(e.message)); }, [isOpen]);
  if (!isOpen) return null;
  async function action(fn: () => Promise<void>) {
    setBusy(true); setMessage('');
    try { await fn(); } catch (error) { setMessage(error instanceof Error ? error.message : 'Chưa hoàn tất thao tác'); } finally { setBusy(false); }
  }
  function prepareDownloads(archive: Awaited<ReturnType<typeof portableExamBackup>>) {
    const files = splitBackupFiles(archive), links: typeof preparedDownloads = [];
    try { for (const file of files) links.push({ url: URL.createObjectURL(new Blob([file.text], { type: 'application/json' })), name: file.name, examCount: file.examCount }); }
    catch (error) { for (const link of links) URL.revokeObjectURL(link.url); throw error; }
    setPreparedDownloads(links);
    return files.length;
  }
  async function inspect(data: Backup, asCopies = false) {
    setConfirmImport(false);
    setCopyConflicts(false); setPending(null); setReport(null);
    const response = await fetch('/api/migration/import-legacy', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-examcraft-user': ownerId }, body: JSON.stringify({ ...data, dryRun: true, copyConflicts: asCopies }) });
    const result = await response.json(); if (!response.ok) throw new Error(result.error);
    setCopyConflicts(asCopies); setPending(data); setReport(result); setMessage('Đã xem trước. Chỉ nhập các tài liệu thuộc quyền của bạn. Nguồn cũ được giữ nguyên.');
  }
  return <div role="dialog" aria-modal="true" aria-label="Kho đề và chuyển dữ liệu cũ" className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
    <div className="bg-white dark:bg-[#202124] rounded-2xl p-5 max-w-4xl w-full max-h-[90vh] overflow-auto space-y-4">
      <div className="flex justify-between"><h2 className="text-lg font-bold">Kho đề trên máy chủ</h2><button onClick={onClose} aria-label="Đóng kho đề">Đóng</button></div>
      <p className="text-sm">Kho này thuộc tài khoản đang đăng nhập. Bản nháp trên máy được giữ riêng cho từng tài khoản.</p>
      <div className="flex gap-3 flex-wrap text-sm">
        <button disabled={busy} onClick={() => void action(async () => { setPreparedDownloads([]); const all = await list(); const documents = []; for (const item of all) documents.push(await loadExam(item.id, ownerId)); const backup = await portableExamBackup(documents); const parts = prepareDownloads(backup); setMessage(`Đã chuẩn bị ${parts} tệp chứa ${documents.length} đề và ${backup.embeddedImages} ảnh. Tải đủ các phần bên dưới; khi khôi phục, nhập lần lượt từng tệp. Đây không thay bản sao lưu vận hành DB và tệp.`); })}>Chuẩn bị sao lưu kèm ảnh</button>
        <button disabled={busy} onClick={() => upload.current?.click()}>Nhập tệp sao lưu</button>
        <button disabled={busy} onClick={() => void action(async () => { const old = JSON.parse(await dbExportDatabaseToJson()); const current = localStorage.getItem('examcraft_current_exam'); if (current) { const doc = JSON.parse(current); if (!old.exams.some((e: Exam) => e.id === doc.id)) old.exams.push(doc); } await inspect({ exams: old.exams ?? [], questions: old.questions ?? [] }); })}>Xem dữ liệu cũ trên trình duyệt</button>
        <input ref={upload} aria-label="Chọn tệp sao lưu JSON" type="file" accept=".json,application/json" className="hidden" onChange={event => { const file = event.target.files?.[0]; if (file) { setPending(null); setReport(null); setConfirmImport(false); void action(async () => { if (file.size > BACKUP_FILE_MAX_BYTES) throw Error('Tệp vượt 30 MB. Hãy chọn từng phần sao lưu để nhập.'); await inspect(parseBackupText(await file.text())); }); } event.target.value = ''; }} />
      </div>
      {message && <p role="status" className="text-sm bg-blue-50 dark:bg-slate-800 p-3 rounded">{message}</p>}
      {preparedDownloads.map((file, index) => <a key={file.url} href={file.url} download={file.name} className="mr-2 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">{preparedDownloads.length === 1 ? 'Tải tệp sao lưu đã chuẩn bị' : `Tải phần ${index + 1}/${preparedDownloads.length} (${file.examCount} đề)`}</a>)}
      {report && <section className="border rounded p-3 text-sm space-y-2">
        <h3 className="font-semibold">{report.dryRun ? 'Xem trước bản nhập' : 'Kết quả nhập'}</h3>
        <p>{report.results.filter(r => r.status === (report.dryRun ? 'ready' : 'imported')).length} {report.dryRun ? 'mục sẵn sàng' : 'mục vừa nhập'}; {report.results.filter(r => r.status === 'already_imported').length} mục đã chuyển trước đó; {report.errorCount} mục cần xử lý.</p>
        {report.results.filter(r => r.error).map(r => <p key={`${r.kind}-${r.index}`}>{r.kind === 'exam' ? 'Đề' : 'Câu'} {r.index + 1}: {r.error}</p>)}
        {report.dryRun && pending && report.results.some(r => r.canImportCopy) && <div><p>Có bản khác nội dung hoặc chưa đủ dấu đối chiếu. Thầy cô có thể giữ chúng thành bản sao riêng; bản đang lưu không bị thay đổi.</p><button disabled={busy} onClick={() => void action(() => inspect(pending, true))} className="font-semibold underline">Xem trước các bản sao riêng</button></div>}
        {report.results.some(r => r.copy) && <p>{report.results.filter(r => r.copy && r.status === (report.dryRun ? 'ready' : 'imported')).length} bản sao riêng {report.dryRun ? 'sẽ được tạo khi xác nhận nhập' : 'vừa được tạo'}. Các bản đang lưu được giữ nguyên.</p>}
        {pending && report.dryRun && <div className="space-y-2"><label className="flex items-start gap-2"><input type="checkbox" checked={confirmImport} onChange={e => setConfirmImport(e.target.checked)} />Tôi có quyền sử dụng các tài liệu này và muốn nhập vào tài khoản hiện tại.</label><button disabled={busy || !confirmImport} onClick={() => void action(async () => { const response = await fetch('/api/migration/import-legacy', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-examcraft-user': ownerId }, body: JSON.stringify({ ...pending, dryRun: false, copyConflicts }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setReport(data); setMessage(data.message); await list(); })} className="font-semibold underline disabled:opacity-50">Nhập các mục hợp lệ</button></div>}
      </section>}
      <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Tìm tên đề" aria-label="Tìm tên đề" className="border rounded p-2 w-full" />
      <ul className="space-y-2">{exams.filter(e => e.title.toLowerCase().includes(query.toLowerCase())).map(item => <li key={item.id} className="border rounded p-3 flex items-center justify-between gap-3">
        <div><strong>{item.title}</strong><p className="text-sm">{item.subject} · Lớp {item.grade}</p></div>
        <div className="flex gap-3 text-sm">
          <button disabled={busy} onClick={() => void action(async () => { onLoadExam(await loadExam(item.id, ownerId)); onClose(); })}>Mở</button>
          <button disabled={busy} onClick={() => void action(async () => { const source = await loadExam(item.id, ownerId); await persistExam({ ...source, id: `draft_${crypto.randomUUID()}`, serverId: undefined, version: undefined, metadata: { ...source.metadata, title: `${source.metadata.title} (Bản sao)` } }, ownerId); await list(); })}>Nhân bản</button>
          <button disabled={busy || item.permissions?.canManage === false} onClick={() => void action(async () => { if (!confirm('Chuyển đề vào thùng rác? Có thể khôi phục tại trang quản lý.')) return; const response = await fetch(`/api/exams/${item.id}`, { method: 'DELETE', headers: { 'If-Match': String(item.version), 'x-examcraft-user': ownerId } }); const data = await response.json(); if (!response.ok) throw new Error(data.error); await list(); })}>Thùng rác</button>
        </div>
      </li>)}</ul>
      {!exams.length && <p>Chưa có đề đã lưu trên máy chủ.</p>}
    </div>
  </div>;
}
