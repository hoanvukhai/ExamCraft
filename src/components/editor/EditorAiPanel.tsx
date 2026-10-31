'use client';
import type { ReactNode } from 'react';

export type AiTab = 'chat' | 'generate' | 'verify' | 'help';

/**
 * The one AI panel of the editor. It always says what it is talking about (the selection) and holds every AI job:
 * chat and edits to the exam, generating new questions, and checking the answer of one question.
 */
export function EditorAiPanel({
  tab,
  onTab,
  target,
  hasKey,
  onKeys,
  chat,
  generate,
  verify,
  help,
}: {
  tab: AiTab;
  onTab: (tab: AiTab) => void;
  /** "Câu 3", "3 câu", "Toàn đề". */
  target: string;
  hasKey: boolean;
  onKeys: () => void;
  chat: ReactNode;
  generate: ReactNode;
  /** Only for a single selected question. */
  verify: ReactNode | null;
  /** How-to answers; needs no key. */
  help: ReactNode;
}) {
  const tabs: [AiTab, string][] = [
    ['chat', 'Trò chuyện'],
    ['generate', 'Sinh câu'],
    ...(verify ? ([['verify', 'Thẩm định']] as [AiTab, string][]) : []),
    ['help', 'Hướng dẫn'],
  ];
  const active = tabs.some(([key]) => key === tab) ? tab : 'chat';
  return (
    <div className="flex min-h-0 flex-1 flex-col" aria-label="Bảng AI" role="region">
      <div className="shrink-0 space-y-2 border-b p-2">
        <p className="text-xs text-[var(--ui-text-secondary)]">
          Đang nói về: <b className="text-[var(--ui-text-primary)]">{target}</b>
        </p>
        {!hasKey && (
          <p role="status" className="rounded-lg bg-[var(--ui-surface-variant)] p-2 text-xs">
            Cần khóa AI cá nhân để dùng AI. Bạn vẫn soạn và xuất đề thủ công được.{' '}
            <button type="button" className="underline" onClick={onKeys}>
              Thêm khóa AI
            </button>
          </p>
        )}
        <div role="tablist" aria-label="Việc AI" className="flex gap-1">
          {tabs.map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active === key}
              onClick={() => onTab(key)}
              className={
                (active === key ? 'app-button-tonal' : 'app-button-secondary') +
                ' min-h-8 rounded-lg px-3 text-xs font-semibold'
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className={active === 'chat' ? 'flex min-h-0 flex-1 flex-col' : 'hidden'}>{chat}</div>
      <div className={active === 'generate' ? 'min-h-0 flex-1 overflow-auto' : 'hidden'}>{generate}</div>
      <div className={active === 'help' ? 'min-h-0 flex-1 overflow-auto' : 'hidden'}>{help}</div>
      {verify && (
        <div className={active === 'verify' ? 'min-h-0 flex-1 overflow-auto p-3' : 'hidden'}>{verify}</div>
      )}
    </div>
  );
}
