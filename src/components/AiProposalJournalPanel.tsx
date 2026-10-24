'use client';
import { useState, useSyncExternalStore } from 'react';
import { aiProposalRevision, aiProposalServerRevision, archiveAiProposal, countArchivedAiProposals, listAiProposals, selectAiProposal, subscribeAiProposals, type AiProposalEntry } from '@/lib/ai-proposal-journal';

export function AiProposalJournalPanel({ ownerId, documentId, questionIds, onOpenCopilot }: { ownerId: string; documentId: string; questionIds: string[]; onOpenCopilot: () => void }) {
  const revision = useSyncExternalStore(subscribeAiProposals, aiProposalRevision, aiProposalServerRevision), [notice, setNotice] = useState('');
  const [open, setOpen] = useState(false), [showArchived, setShowArchived] = useState(false);
  const active = revision === 0 ? [] : listAiProposals(ownerId), archivedCount = revision === 0 ? 0 : countArchivedAiProposals(ownerId);
  const archived = open && showArchived ? listAiProposals(ownerId, undefined, undefined, true) : [];
  if (!active.length && !archivedCount) return null;
  const download = (entry: AiProposalEntry) => { const url = URL.createObjectURL(new Blob([entry.raw], { type: 'application/json' })); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'examcraft-de-xuat-ai.json'; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); };
  const row = (entry: AiProposalEntry) => {
    const value = entry.record;
    const canOpen = value?.base.documentId === documentId && (value.kind === 'copilot' || questionIds.includes(value.base.question.id));
    return <div key={entry.key} className="border rounded p-2 my-2 break-words"><p>{value ? value.kind === 'copilot' ? value.result.explanation || 'Đề xuất Copilot' : value.question.content.slice(0, 140) : 'Đề xuất chưa đọc được — giữ nguyên dữ liệu gốc'}</p>
      <p className="text-xs">{value?.createdAt}{value?.base.documentId !== documentId ? ' · Của đề khác, không tự chèn vào đề này' : ''}{entry.memoryOnly ? ' · Chỉ trong tab này, hãy tải về trước khi rời trang' : ''}</p>
      <div className="flex flex-wrap gap-3"><button type="button" onClick={() => download(entry)}>Tải bản đối chiếu</button>{canOpen && <button type="button" onClick={() => { selectAiProposal(entry); if (value.kind === 'copilot') onOpenCopilot(); setNotice('Đã mở đề xuất để xem lại. Chưa thay nội dung đề; bản nền cũ vẫn bị chặn.'); }}>Xem lại đề xuất</button>}{!entry.archived && <button type="button" onClick={() => setNotice(archiveAiProposal(entry) ? 'Đã cất bản đối chiếu, vẫn có thể xem hoặc tải lại.' : 'Chưa cất được; nguồn vẫn giữ. Hãy tải về nếu bộ nhớ máy đầy.')}>Cất đề xuất</button>}</div></div>;
  };
  return <details className="no-print border rounded p-3 mb-3 text-sm" onToggle={event => setOpen(event.currentTarget.open)}><summary>Đề xuất AI trên máy · {active.length} đang chờ</summary>{open && <><p className="text-xs my-2">Đề xuất giữ riêng theo tài khoản. Bản đã cất vẫn còn để đối chiếu, không có nghĩa đã lưu đề lên máy chủ.</p>{active.map(row)}{archivedCount > 0 && <details onToggle={event => setShowArchived(event.currentTarget.open)}><summary>Đề xuất đã cất · {archivedCount}</summary>{archived.map(row)}</details>}{notice && <p role="status">{notice}</p>}</>}</details>;
}
