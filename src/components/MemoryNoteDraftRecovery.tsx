'use client';

import { canApplyNoteDraft, exportNoteDraft, isKnownNoteCategory, type NoteDraftEntry, type NoteDraftRecord, type NoteDraftWrite, type NoteFields } from '@/lib/memory-note-draft';

interface Props {
  /** The account this dialog is pinned to. The parent should also key the panel by it. */
  ownerId: string;
  /** From readNoteDrafts(...); records naming another account are ignored here as a second line of defence. */
  entries: NoteDraftEntry[];
  /** True when the browser blocked reading storage, so no backup exists to show. */
  unavailable?: boolean;
  /** Result of the latest writeNoteDraft of this page; anything but 'saved' or 'empty' means the typing is not backed up. */
  writeStatus?: NoteDraftWrite | null;
  /** What the form holds right now, to tell an empty form from one the draft would replace. */
  form: NoteFields;
  writerId?: string;
  disabled?: boolean;
  /**
   * The teacher chose to fill the form from a draft. It only fills the form (a suggestion, not a note on the server);
   * for 'replace_existing' the component has already asked the teacher to confirm. Never called on its own.
   */
  onApply: (record: NoteDraftRecord, mode: 'fill_empty' | 'replace_existing') => void;
  /** The teacher confirmed dropping one readable draft; the parent calls discardNoteDraftEntry and re-reads. */
  onDiscard?: (entry: NoteDraftEntry) => void;
}

/** Backup panel for unsent AI-memory notes. Small on purpose: read, choose, download, drop. */
export function MemoryNoteDraftRecovery({ ownerId, entries, unavailable, writeStatus, form, writerId, disabled, onApply, onDiscard }: Props) {
  const mine = entries.filter(entry => !entry.value || entry.value.ownerId === ownerId);
  const blocked = unavailable || (!!writeStatus && writeStatus !== 'saved' && writeStatus !== 'empty');
  if (!mine.length && !blocked) return null;
  return <details className="border rounded-xl p-3 my-3 text-xs" open={blocked || undefined}>
    <summary className="cursor-pointer font-semibold">Bản nháp ghi chú còn giữ trên máy này ({mine.length})</summary>
    <p className="my-2">Đây là bản dự phòng nằm trong trình duyệt của máy này, không được mã hóa và người dùng chung máy có thể xem. Nó chưa phải ghi chú: không gửi lên máy chủ, không gửi cho AI, không tự bật hay góp chung. Bản được xóa khi ghi chú đã lưu đúng như nội dung đó, hoặc khi bạn bỏ nó.</p>
    {unavailable && <p role="alert" className="text-amber-900">Trình duyệt đang chặn bộ nhớ nên chưa đọc được bản dự phòng.</p>}
    {writeStatus && writeStatus !== 'saved' && writeStatus !== 'empty' && <p role="alert" className="text-amber-900">{writeStatus === 'blocked' ? 'Có một bản cũ không đọc được ở đúng vị trí của trang này, nên chưa ghi đè. Hãy tải bản đó về rồi lưu ghi chú ngay.' : writeStatus === 'too_large' ? 'Nội dung quá dài để giữ dự phòng.' : writeStatus === 'invalid' ? 'Chưa đủ thông tin để giữ dự phòng.' : 'Trình duyệt chưa lưu được bản dự phòng (bị chặn hoặc đầy). Nội dung đang soạn chỉ còn trên trang này; hãy lưu ghi chú ngay hoặc chép ra nơi khác.'}</p>}
    {mine.map((entry, index) => {
      const record = entry.value, open = record ? canApplyNoteDraft(ownerId, record, form) : null;
      return <details key={entry.key} className="border rounded-lg p-2 my-2">
        <summary className="cursor-pointer">{record ? `${record.title.trim() || '(chưa có tiêu đề)'} · ${record.savedAt}${record.writerId === writerId ? ' · của trang này' : ' · từ trang hoặc tab khác'}` : 'Bản chưa đọc được nội dung (vẫn được giữ nguyên)'}</summary>
        {record && <div className="space-y-1 my-2">
          <p>Nhóm: {isKnownNoteCategory(record.category) ? record.category : `${record.category} (nhóm lạ, giữ nguyên như đã lưu)`} · Môn: {record.subject}</p>
          <p className="whitespace-pre-wrap">Nội dung: {record.insight || '(để trống)'}</p>
          {open?.allowed && open.mode === 'replace_existing' && <p role="status" className="text-amber-900">Biểu mẫu đang có chữ. Đưa bản này vào sẽ thay chữ đó, nên sẽ hỏi lại trước.</p>}
          {open?.allowed && <button type="button" disabled={disabled} className="border rounded-lg px-3 py-1 disabled:opacity-50" onClick={() => {
            if (open.mode === 'replace_existing' && !confirm('Thay chữ đang soạn trong biểu mẫu bằng bản nháp này? Chữ đang soạn sẽ mất nếu chưa lưu.')) return;
            onApply(record, open.mode);
          }}>Đưa vào biểu mẫu (chưa lưu thành ghi chú)</button>}
          {onDiscard && <button type="button" disabled={disabled} className="border rounded-lg px-3 py-1 ml-2 disabled:opacity-50" onClick={() => { if (confirm('Bỏ bản nháp này khỏi máy? Không thể hoàn tác.')) onDiscard(entry); }}>Bỏ bản nháp này</button>}
        </div>}
        <textarea aria-label={`Nội dung gốc của bản nháp ${index + 1}`} readOnly rows={4} className="block w-full border p-2 my-2 bg-transparent" value={entry.raw} />
        <button type="button" className="border rounded-lg px-3 py-1" onClick={() => {
          const file = exportNoteDraft(entry, index), url = URL.createObjectURL(new Blob([file.raw], { type: 'application/json' })), link = document.createElement('a');
          link.href = url; link.download = file.fileName; link.click(); setTimeout(() => URL.revokeObjectURL(url), 30_000);
        }}>Tải nguyên bản nháp này</button>
      </details>;
    })}
  </details>;
}
