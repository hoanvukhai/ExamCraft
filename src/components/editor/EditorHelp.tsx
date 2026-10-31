'use client';
import { useState } from 'react';
import { HELP, formatHelp, searchHelp, suggestForSelection, type HelpEntry } from '@/lib/help-guide';

/**
 * How-to answers for the editor, from the usage guide. No AI and no key: it works as typed,
 * and the first suggestions follow what is selected on the sheet.
 */
export function EditorHelp({ kind }: { kind: string }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const found = query.trim() ? searchHelp(query) : null;
  const byId = (id: string) => HELP.find((entry) => entry.id === id);
  const suggested = suggestForSelection(kind)
    .map(byId)
    .filter((entry): entry is HelpEntry => Boolean(entry));
  const list: HelpEntry[] = found ? (found.best ? [found.best, ...found.others] : []) : suggested;
  const shown = open ? byId(open) : null;
  return (
    <div className="space-y-3 p-3 text-sm" data-editor-help>
      <label className="block text-xs">
        <span className="mb-1 block text-[var(--ui-text-secondary)]">Hỏi cách dùng trang soạn</span>
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(null);
          }}
          placeholder="Ví dụ: thêm câu, xuất Word, chia trang…"
          className="teacher-field w-full text-xs"
        />
      </label>
      {shown ? (
        <div className="space-y-2" role="region" aria-label={shown.title}>
          <button type="button" className="text-xs underline" onClick={() => setOpen(null)}>
            ← Quay lại danh sách
          </button>
          <div className="whitespace-pre-wrap text-xs leading-relaxed">{formatHelp(shown)}</div>
          {shown.needsKey && (
            <p className="rounded-lg bg-[var(--ui-surface-variant)] p-2 text-xs">
              Mục này cần khóa AI cá nhân.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-1.5">
          <p className="text-xs text-[var(--ui-text-secondary)]">
            {found
              ? found.best
                ? 'Mục phù hợp nhất:'
                : 'Chưa có hướng dẫn khớp. Thử từ khác, hoặc hỏi trợ lý ở trang Kho đề.'
              : 'Gợi ý theo mục đang chọn:'}
          </p>
          {list.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => setOpen(entry.id)}
              className="app-button-secondary flex min-h-9 w-full items-center justify-between rounded-lg px-3 text-left text-xs"
            >
              <span>{entry.title}</span>
              <span aria-hidden>›</span>
            </button>
          ))}
          {!found && (
            <details className="pt-1 text-xs">
              <summary className="cursor-pointer">Tất cả hướng dẫn ({HELP.length})</summary>
              <div className="mt-1.5 space-y-1.5">
                {HELP.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => setOpen(entry.id)}
                    className="app-button-secondary flex min-h-8 w-full items-center rounded-lg px-3 text-left text-xs"
                  >
                    {entry.title}
                  </button>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
