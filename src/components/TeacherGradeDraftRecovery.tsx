'use client';

import { canApplyGradeDraft, exportGradeDraft, gradeDraftsForOpen, parseScoreText, type GradeDraftEntry, type GradeDraftRecord, type GradeDraftWrite } from '@/lib/teacher-grade-draft';

interface Props {
  /** The account and attempt this panel is open for. The parent should also key the panel by both. */
  teacherId: string;
  attemptId: string;
  /** From readGradeDrafts(...); entries outside this teacher's and attempt's key namespace (readable or not) are dropped here as a second line of defence. */
  entries: GradeDraftEntry[];
  /** True when the browser blocked reading storage, so no backup exists to show. */
  unavailable?: boolean;
  /** Result of the latest writeGradeDraft of this page; anything but 'saved' means the typing is not backed up. */
  writeStatus?: GradeDraftWrite | null;
  /** questionKey -> current manual-grade revision of every answer on the open attempt. */
  currentRevisions: Readonly<Record<string, string>>;
  /** Shown instead of the raw question key (for example "Câu 3"). */
  questionLabel?: (questionKey: string) => string;
  /** This page's own writer id, to tell its draft from other pages'. */
  writerId?: string;
  disabled?: boolean;
  numeric?: boolean;
  /**
   * The teacher chose to put a record into the editor. For a draft based on an older grade the parent must keep
   * record.baseRevision (not the current one), so the editor's stale-base check blocks saving until the teacher decides.
   * The panel never calls this on its own and never changes any grade.
   */
  onApply: (record: GradeDraftRecord, mode: 'same_base' | 'stale_base') => void;
}

const scoreText = (raw: string) => { const score = parseScoreText(raw); return score.kind === 'blank' ? 'chưa nhập điểm (vẫn là chờ chấm)' : score.kind === 'number' ? `${raw.trim()} điểm` : `“${raw}” (không phải số hợp lệ)`; };

/** Backup panel for typed-but-unsaved grades. Small on purpose: read, compare, choose, download. */
export function TeacherGradeDraftRecovery({ teacherId, attemptId, entries, unavailable, writeStatus, currentRevisions, questionLabel, writerId, disabled, numeric = true, onApply }: Props) {
  const mine = gradeDraftsForOpen(entries, teacherId, attemptId);
  const blocked = unavailable || (writeStatus !== undefined && writeStatus !== null && writeStatus !== 'saved');
  if (!mine.length && !blocked) return null;
  return <details className="border rounded-xl p-3 my-3 text-xs" open={blocked || undefined}>
    <summary className="cursor-pointer font-semibold">Bản nháp {numeric ? 'chấm điểm' : 'nhận xét'} còn giữ trên máy này ({mine.length})</summary>
    <p className="my-2">Đây là bản dự phòng nằm trong trình duyệt của máy này, không được mã hóa và có thể bị người dùng chung máy xem. Nó không tự lưu điểm, không tự đưa vào ô nhập và không thay điểm trên máy chủ. Bản được xóa khi điểm đã lưu đúng như nội dung đó hoặc khi bạn bỏ nháp.</p>
    {unavailable && <p role="alert" className="text-amber-900">Trình duyệt đang chặn bộ nhớ nên chưa đọc được bản dự phòng.</p>}
    {writeStatus && writeStatus !== 'saved' && <p role="alert" className="text-amber-900">{writeStatus === 'blocked' ? 'Có một bản cũ không đọc được ở đúng vị trí của trang này, nên chưa ghi đè. Hãy tải bản đó về rồi lưu điểm ngay.' : writeStatus === 'too_large' ? 'Nội dung quá lớn để giữ dự phòng.' : writeStatus === 'invalid' ? 'Chưa đủ thông tin để giữ dự phòng.' : 'Trình duyệt chưa lưu được bản dự phòng (bị chặn hoặc đầy). Điểm và nhận xét đang nhập chỉ còn trên trang này; hãy lưu ngay hoặc chép nhận xét ra nơi khác.'}</p>}
    {mine.map((entry, index) => {
      const record = entry.value, open = record ? canApplyGradeDraft({ teacherId, attemptId }, currentRevisions, record) : null;
      return <details key={entry.key} className="border rounded-lg p-2 my-2">
        <summary className="cursor-pointer">{record ? `${questionLabel?.(record.questionKey) ?? record.questionKey} · ${record.savedAt}${record.writerId === writerId ? ' · của trang này' : ' · từ trang hoặc tab khác'}` : 'Bản chưa đọc được nội dung (vẫn được giữ nguyên)'}</summary>
        {record && <div className="space-y-1 my-2">
          {numeric && <p>Điểm đã gõ: {scoreText(record.score)}</p>}
          <p>Nhận xét đã gõ: {record.comment ? record.comment : '(để trống)'}</p>
          {open?.allowed && open.mode === 'stale_base' && <p role="status" className="text-amber-900">Bản này dựa trên điểm cũ; điểm hoặc nhận xét của câu đã đổi từ lúc đó. Chỉ dùng để đối chiếu: đưa vào ô nhập sẽ không lưu được cho đến khi bạn chọn dùng giá trị hiện tại hoặc gõ lại.</p>}
          {open && !open.allowed && <p role="status">{open.reason === 'question_missing' ? 'Câu này không còn trong bài hoặc chưa tải xong nên chưa đưa vào ô nhập được.' : 'Bản này thuộc tài khoản hoặc lượt làm khác nên không dùng ở đây.'}</p>}
          {open?.allowed && <button type="button" disabled={disabled} className="border rounded-lg px-3 py-1 disabled:opacity-50" onClick={() => onApply(record!, open.mode)}>{open.mode === 'same_base' ? 'Đưa vào ô nhập của câu này (chưa lưu)' : 'Đưa vào ô nhập để đối chiếu (chưa lưu)'}</button>}
        </div>}
        <textarea aria-label={`Nội dung gốc của bản nháp ${index + 1}`} readOnly rows={4} className="block w-full border p-2 my-2 bg-transparent" value={entry.raw} />
        <button type="button" className="border rounded-lg px-3 py-1" onClick={() => {
          const file = exportGradeDraft(entry, index), url = URL.createObjectURL(new Blob([file.raw], { type: 'application/json' })), link = document.createElement('a');
          link.href = url; link.download = file.fileName; link.click(); setTimeout(() => URL.revokeObjectURL(url), 30_000);
        }}>Tải nguyên bản nháp này</button>
      </details>;
    })}
  </details>;
}
