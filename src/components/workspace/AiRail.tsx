'use client';
import { Bot, Brain } from 'lucide-react';
import { useWorkspace } from './WorkspaceContext';

/** The right-hand rail outside the editor: the assistant and the notes that teach it. The editor adds its own "edit this exam" button above these two. */
export function AiRailButtons() {
  const { toggleAssistant, openAiNotes, assistantOpen } = useWorkspace();
  return <>
    <button type="button" onClick={toggleAssistant} aria-pressed={assistantOpen} title="Trợ lý Thư ký AI Cá Nhân (Bấm để xem)" aria-label="Hỏi đáp với Trợ lý AI" className="w-10 h-10 rounded-xl app-button-tonal flex items-center justify-center cursor-pointer"><Bot className="w-5 h-5" /></button>
    <button type="button" onClick={openAiNotes} title="Bộ não AI Sư Phạm: Xem và dạy các phong cách ra đề cho AI" aria-label="Ghi chú riêng cho AI" className="w-10 h-10 rounded-xl hover:bg-[var(--ui-surface-variant)] text-[var(--ui-text-secondary)] flex items-center justify-center cursor-pointer"><Brain className="w-4 h-4" /></button>
  </>;
}

export function AiRail() {
  return <aside aria-label="Trợ lý AI" className="no-print hidden lg:flex flex-col items-center gap-3 w-14 shrink-0 border-l bg-[var(--ui-surface)] py-4"><AiRailButtons /></aside>;
}
