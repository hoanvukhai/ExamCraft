'use client';

import React, { useState, type ReactNode } from 'react';
import { Edit3, Share2 } from 'lucide-react';

interface HeaderProps {
  /** Menu button at the far left. */
  leading?: ReactNode;
  /** Save state, next to the title. */
  children?: ReactNode;
  /** Tools on the right, before the main button. */
  actions?: ReactNode;
  /** Account menu at the far right. */
  trailing?: ReactNode;
  canEdit?: boolean;
  examTitle: string;
  onUpdateTitle: (newTitle: string) => void;
  onShare?: () => void;
  /** Next to "Giao bài": results of assignments already given, shared links. */
  shareMenu?: ReactNode;
}

/** The top bar of the editor: always one row. Title and save state on the left, the exam's actions on the right. */
export const Header: React.FC<HeaderProps> = ({
  leading,
  children,
  actions,
  trailing,
  canEdit = true,
  examTitle,
  onUpdateTitle,
  onShare,
  shareMenu,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState({
    source: examTitle,
    value: examTitle,
  });
  const tempTitle = titleDraft.source === examTitle ? titleDraft.value : examTitle;
  const setTempTitle = (value: string) => setTitleDraft({ source: examTitle, value });

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (tempTitle.trim() && tempTitle.trim() !== examTitle) onUpdateTitle(tempTitle.trim());
    else setTempTitle(examTitle);
  };

  return (
    <header className="app-bar no-print h-12 bg-[var(--ui-surface)] border-b border-[var(--ui-border)]/60 shrink-0 z-30 px-2 sm:px-3 flex items-center gap-2">
      {leading}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {isEditingTitle ? (
          <input
            type="text"
            autoFocus
            value={tempTitle}
            onChange={(e) => setTempTitle(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTitleSubmit();
              if (e.key === 'Escape') {
                setTempTitle(examTitle);
                setIsEditingTitle(false);
              }
            }}
            aria-label="Tên đề thi"
            className="teacher-field text-sm font-semibold w-full max-w-md"
          />
        ) : (
          <button
            disabled={!canEdit}
            onClick={() => {
              setTempTitle(examTitle);
              setIsEditingTitle(true);
            }}
            title="Nhấn để đổi tên đề thi"
            className="group flex items-center gap-1.5 text-sm font-semibold hover:bg-[var(--ui-surface-variant)] px-2 py-1 rounded-md transition-colors min-w-0 text-left cursor-pointer"
          >
            <span className="truncate">{examTitle || 'Đề kiểm tra không tên'}</span>
            <Edit3 className="w-3.5 h-3.5 text-[var(--ui-text-secondary)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </button>
        )}
        {children}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {actions}
        {canEdit && onShare && (
          <button
            type="button"
            onClick={onShare}
            title="Tạo link cho học sinh làm bài hoặc chia sẻ đề cho đồng nghiệp"
            aria-label="Giao bài"
            className="app-button-primary flex items-center gap-1.5 min-h-9 px-3 rounded-lg text-xs font-semibold cursor-pointer shrink-0"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="max-sm:hidden">Giao bài</span>
          </button>
        )}
        {canEdit && onShare && shareMenu}
        {trailing}
      </div>
    </header>
  );
};
