'use client';
import { useState, useSyncExternalStore } from 'react';
import { archiveQuestionDraft, listQuestionDrafts, questionDraftMatchesDocument, questionDraftRevision, questionDraftServerRevision, subscribeQuestionDrafts, type QuestionDraftEntry } from '@/lib/question-draft';
import type { Exam } from '@/types/exam';

export function QuestionDraftPanel({ ownerId, documentId, questionIds, exam }: { ownerId: string; documentId: string; questionIds: string[]; exam: Exam }) {
  const storeRevision = useSyncExternalStore(subscribeQuestionDrafts, questionDraftRevision, questionDraftServerRevision);
  const [notice, setNotice] = useState('');
  // The account-wide recovery index also keeps drafts discoverable after a new exam gets its server ID.
  const entries = storeRevision === 0 ? [] : listQuestionDrafts(ownerId, null), archived = storeRevision === 0 ? [] : listQuestionDrafts(ownerId, null, undefined, true);
  const download = (entry: QuestionDraftEntry) => {
    const url = URL.createObjectURL(new Blob([entry.raw], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'ExamCraft-nhap-cau-hoi.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  if (!entries.length && !archived.length) return null;
  return <details className="no-print border rounded p-3 mb-3 text-sm"><summary className="cursor-pointer">Nháp câu hỏi trên máy · {entries.length} chưa xử lý</summary>
    <p className="text-xs my-2">Nháp được giữ đến khi máy chủ xác nhận lưu. Mở Sửa ở đúng câu để tiếp tục; bản đã cất vẫn tải được bên dưới.</p>
    {entries.some(entry => questionDraftMatchesDocument(entry, exam)) && <p role="status" className="text-xs">Có nháp đã vào bản soạn, đang chờ xác nhận lưu trên máy chủ.</p>}
    {entries.map(entry => <div className="border rounded p-2 my-2 break-words" key={entry.key}><p>{entry.value ? entry.value.draft.content.slice(0, 140) : 'Nháp chưa đọc được — dữ liệu gốc được giữ'}</p><p className="text-xs">{entry.value?.updatedAt}{entry.value?.documentId !== documentId ? ' · Nháp của đề khác, không tự chèn vào đề đang mở' : !questionIds.includes(entry.value.questionId) ? ' · Câu không còn trong đề, không tự chèn lại' : ''}{entry.memoryOnly && ' · Chỉ trong tab này, chưa bảo vệ khi tải lại'}</p><div className="flex flex-wrap gap-3 my-1"><button type="button" className="underline" onClick={() => download(entry)}>Tải nháp câu</button><button type="button" className="underline" onClick={() => setNotice(archiveQuestionDraft(entry) ? 'Đã cất bản nháp; vẫn có thể tải ở mục đã cất. Không thay câu trên máy chủ.' : 'Chưa cất được hoặc nháp đã đổi. Dữ liệu vẫn được giữ, hãy tải nháp trước.')}>Cất riêng, không chờ áp dụng</button></div></div>)}
    {archived.length > 0 && <details><summary>Nháp đã cất · {archived.length}</summary>{archived.map(entry => <div key={entry.key} className="p-2 break-words"><p>{entry.value?.draft.content.slice(0, 140) ?? 'Dữ liệu nháp gốc chưa đọc được'}</p><button type="button" className="underline" onClick={() => download(entry)}>Tải bản đã cất</button></div>)}</details>}
    {notice && <p role="status">{notice}</p>}
  </details>;
}
