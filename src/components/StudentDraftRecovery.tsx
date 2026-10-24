'use client';
import { useState } from 'react';
import type { StudentJournalEntry } from '@/lib/student-draft-journal';

export function StudentDraftRecovery({ entries, onChoose, onServer, onImport }: {
  entries: StudentJournalEntry[];
  onChoose?: (entry: StudentJournalEntry) => void;
  onServer?: () => void;
  onImport?: (raw: string) => string | null;
}) {
  const [importError, setImportError] = useState<string | null>(null);
  if (!entries.length && !onImport) return null;
  return <details className="max-w-6xl mx-auto w-full p-4 my-3 border rounded-xl bg-white dark:bg-[#242424]">
    <summary className="cursor-pointer font-semibold">Bản nháp còn giữ trên máy này ({entries.length})</summary>
    <p className="text-sm my-2">Các bản được giữ riêng để đối chiếu; không tự gộp hay thay bài trên máy chủ. Bản không đọc được vẫn có thể tải nguyên tệp.</p>
    {onImport && <label className="block my-2 text-sm">Mở tệp nháp đã tải của lượt này
      <input type="file" accept=".json,application/json" className="block my-2" onChange={async event => {
        const input = event.currentTarget, file = input.files?.[0];
        if (!file) return;
        try {
          setImportError(file.size > 4 * 1024 * 1024 ? 'Tệp lớn hơn 4 MB. Chưa nhập; hãy giữ tệp gốc.' : onImport(await file.text()));
        } catch { setImportError('Chưa đọc được tệp. Hãy giữ tệp gốc và thử lại.'); }
        finally { input.value = ''; }
      }} />
      Chỉ thêm bản để xem và chọn; chưa ghi đè câu trả lời đang nhập.
    </label>}
    {importError && <p role="alert" className="text-red-700">{importError}</p>}
    {onServer && <button type="button" className="border rounded-lg p-2 my-2" onClick={onServer}>Dùng bản máy chủ lúc mở bài</button>}
    {entries.map((entry, index) => <details key={entry.key} className="border rounded-lg p-3 my-2">
      <summary className="cursor-pointer">Bản {index + 1}{entry.value ? ` · ${entry.value.savedAt}` : ' · chưa đọc được nội dung'}</summary>
      <textarea aria-label={`Nội dung bản nháp ${index + 1}`} readOnly rows={5} className="block w-full border p-2 my-2 bg-transparent" value={entry.raw} />
      {onChoose && entry.value && <button type="button" className="border rounded-lg p-2 mr-2" onClick={() => onChoose(entry)}>Xem bản này trong bài</button>}
      <button type="button" className="border rounded-lg p-2" onClick={() => {
        const url = URL.createObjectURL(new Blob([entry.raw], { type: 'application/json' })), link = document.createElement('a');
        link.href = url; link.download = `examcraft-nhap-doi-chieu-${index + 1}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 30_000);
      }}>Tải nguyên bản nháp này</button>
    </details>)}
  </details>;
}
