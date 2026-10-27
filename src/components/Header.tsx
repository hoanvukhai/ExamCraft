'use client';

import React, { useState } from 'react';
import { CloudUpload, Edit3, Share2 } from 'lucide-react';

interface HeaderProps {
  canEdit?: boolean;
  examTitle: string;
  onUpdateTitle: (newTitle: string) => void;
  isCloudSaving?: boolean;
  isCloudSaved?: boolean;
  onShare?: () => void;
}

/** The document bar of the editor: the exam name, the save state and the share button. Account, assistant and theme live in the frame's right rail. */
export const Header: React.FC<HeaderProps> = ({ canEdit = true, examTitle, onUpdateTitle, isCloudSaving = false, isCloudSaved = true, onShare }) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState({ source: examTitle, value: examTitle });
  const tempTitle = titleDraft.source === examTitle ? titleDraft.value : examTitle;
  const setTempTitle = (value: string) => setTitleDraft({ source: examTitle, value });

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (tempTitle.trim() && tempTitle.trim() !== examTitle) onUpdateTitle(tempTitle.trim());
    else setTempTitle(examTitle);
  };

  return (
    <header className="app-bar no-print h-12 bg-[var(--ui-surface)] border-b shrink-0 z-30 px-3 sm:px-5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0 flex-1 max-w-xl">
        {isEditingTitle ? (
          <input
            type="text"
            autoFocus
            value={tempTitle}
            onChange={(e) => setTempTitle(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTitleSubmit();
              if (e.key === 'Escape') { setTempTitle(examTitle); setIsEditingTitle(false); }
            }}
            aria-label="Tên đề thi"
            className="teacher-field text-sm font-semibold w-full"
          />
        ) : (
          <button
            disabled={!canEdit}
            onClick={() => { setTempTitle(examTitle); setIsEditingTitle(true); }}
            title="Nhấn để đổi tên đề thi"
            className="group flex items-center gap-1.5 text-sm font-semibold hover:bg-[var(--ui-surface-variant)] px-2 py-1 rounded-md transition-colors truncate text-left cursor-pointer"
          >
            <span className="truncate">{examTitle || 'Đề kiểm tra không tên'}</span>
            <Edit3 className="w-3.5 h-3.5 text-[var(--ui-text-secondary)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </button>
        )}
        <div className="hidden md:flex items-center gap-1 text-[11px] text-[var(--ui-text-secondary)] shrink-0">
          {isCloudSaving ? (
            <span className="flex items-center gap-1"><CloudUpload className="w-3.5 h-3.5 animate-bounce" /><span>Đang lưu...</span></span>
          ) : isCloudSaved ? (
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /><span>Đã lưu trên máy chủ</span></span>
          ) : (
            <span className="flex items-center gap-1 text-amber-500"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /><span>Chưa lưu</span></span>
          )}
        </div>
      </div>
      {canEdit && onShare && <button type="button" onClick={onShare} title="Tạo link cho học sinh làm bài hoặc chia sẻ đề cho đồng nghiệp" className="app-button-primary flex items-center gap-1.5 min-h-9 px-3 rounded-lg text-xs font-semibold cursor-pointer shrink-0"><Share2 className="w-3.5 h-3.5" /><span className="hidden md:inline">Chia sẻ &amp; Thi Online</span><span className="md:hidden">Chia sẻ</span></button>}
    </header>
  );
};
