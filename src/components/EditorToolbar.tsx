'use client';
import { useEffect, useRef, useState, type ComponentType } from 'react';
import { BarChart3, ChevronDown, Database, FileDown, Settings2, Sparkles, Upload, Users } from 'lucide-react';
import type { Exam } from '@/types/exam';

type Icon = ComponentType<{ className?: string }>;
interface MenuItem { label: string; title?: string; onClick: () => void; disabled?: boolean }

const button = 'app-button-secondary shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 min-h-9 px-3 rounded-lg text-xs font-medium cursor-pointer disabled:opacity-40 disabled:cursor-default';

function ToolMenu({ label, Icon, items }: { label: string; Icon: Icon; items: MenuItem[] }) {
  const [open, setOpen] = useState(false), [where, setWhere] = useState({ top: 0, left: 0 }), box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (event: MouseEvent) => { if (!box.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', away); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', escape); };
  }, [open]);
  return <div ref={box} className="relative">
    <button type="button" aria-haspopup="menu" aria-expanded={open} onClick={event => { const rect = event.currentTarget.getBoundingClientRect(); setWhere({ top: rect.bottom + 4, left: Math.max(8, Math.min(rect.left, window.innerWidth - 248)) }); setOpen(value => !value); }} className={button}><Icon className="w-3.5 h-3.5 text-[var(--ui-text-secondary)]" /><span>{label}</span><ChevronDown className="w-3 h-3 text-[var(--ui-text-secondary)]" /></button>
    {open && <div role="menu" aria-label={label} style={{ top: where.top, left: where.left }} className="app-menu fixed w-60 rounded-xl border bg-[var(--ui-surface)] p-1.5 shadow-lg z-40">
      {items.map(item => <button key={item.label} type="button" role="menuitem" title={item.title} disabled={item.disabled} onClick={() => { setOpen(false); item.onClick(); }} className="w-full text-left min-h-10 px-3 rounded-lg text-sm hover:bg-[var(--ui-surface-variant)] disabled:opacity-40 disabled:cursor-default cursor-pointer">{item.label}</button>)}
    </div>}
  </div>;
}

interface Props {
  canEdit: boolean; ready: boolean; hasQuestions: boolean; hasServerExam: boolean;
  access?: Exam['access']; submissionCount: number;
  copilotOpen: boolean; onCopilot: () => void;
  onGenerate: () => void; onImport: () => void; onBank: () => void;
  onHeaderSettings: () => void; onShuffle: () => void; onLibrary: () => void;
  onExportWord: () => void; onPrint: () => void; onPresent: () => void;
  onCollaborate: () => void; onResults: () => void;
}

/** The editor's tools, as one row under the top bar. What was a vertical rail (and a second copy on the right) lives here once. */
export function EditorToolbar(p: Props) {
  const badge = p.access ? (p.access.canManage ? 'Đề của bạn' : p.access.canEdit ? 'Được mời cùng sửa' : p.access.canComment ? 'Quyền xem và góp ý' : 'Quyền chỉ xem') : null;
  return <div role="toolbar" aria-label="Công cụ soạn đề" className="no-print shrink-0 border-b bg-[var(--ui-surface)] px-3 sm:px-4 py-2 flex flex-nowrap sm:flex-wrap items-center gap-2 overflow-x-auto sm:overflow-visible">
    {p.canEdit && <>
      <button type="button" onClick={p.onCopilot} aria-label="Sửa đề bằng Trợ lý AI" aria-pressed={p.copilotOpen} title={p.copilotOpen ? 'Đóng bảng Trợ lý AI' : 'Mở rộng bảng Trợ lý AI'} className={button}><Sparkles className="w-3.5 h-3.5" /><span>Sửa đề bằng AI</span></button>
      <button type="button" onClick={p.onBank} title="Chọn câu hỏi từ Ngân hàng chèn vào đề" className={button}><Database className="w-3.5 h-3.5 text-[var(--ui-text-secondary)]" /><span>Ngân hàng câu hỏi</span></button>
      <button type="button" onClick={p.onImport} title="Bóc tách câu hỏi từ file Word / Ảnh chụp đưa thêm vào đề" className={button}><Upload className="w-3.5 h-3.5 text-[var(--ui-text-secondary)]" /><span>Nhập đề (Word/Ảnh)</span></button>
      <button type="button" onClick={p.onGenerate} title="Tạo bản nháp đề để giáo viên kiểm tra và chỉnh sửa" className={button}><Sparkles className="w-3.5 h-3.5 text-[var(--ui-text-secondary)]" /><span>Sinh đề AI Mới</span></button>
      <span aria-hidden className="h-5 w-px bg-[var(--ui-border)] mx-1" />
      <ToolMenu label="Đề thi" Icon={Settings2} items={[
        { label: 'Tiêu đề trường thi', title: 'Cài đặt Sở GD&ĐT, Trường THPT, thời gian, mã đề', onClick: p.onHeaderSettings },
        { label: 'Trộn 4 mã đề', title: 'Trộn đề thành 4 mã đề kèm ma trận đáp án', onClick: p.onShuffle },
        { label: 'Sao lưu · Nhập kho cũ', title: 'Sao lưu đề kèm ảnh và nhập kho cũ', onClick: p.onLibrary },
      ]} />
    </>}
    <ToolMenu label="Xuất" Icon={FileDown} items={[
      { label: 'Tải file Word (.docx)', title: 'Tải file Word (.docx) chuẩn công thức OMML', onClick: p.onExportWord },
      { label: 'In / PDF', title: 'In đề thi hoặc xuất ra PDF', onClick: p.onPrint },
      { label: 'Trình chiếu', onClick: p.onPresent, disabled: !p.ready || !p.hasQuestions },
    ]} />
    {p.canEdit && <button type="button" onClick={p.onResults} title="Xem danh sách bài nộp và phổ điểm học sinh" className={button}><BarChart3 className="w-3.5 h-3.5 text-[var(--ui-text-secondary)]" /><span>Bảng điểm thi</span>{p.submissionCount > 0 && <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[var(--ui-surface-variant)]">{p.submissionCount}</span>}</button>}
    {p.hasServerExam && <button type="button" onClick={p.onCollaborate} className={button}><Users className="w-3.5 h-3.5 text-[var(--ui-text-secondary)]" /><span>Cùng soạn · Góp ý · Lịch sử</span></button>}
    {badge && <span className="ml-auto shrink-0 whitespace-nowrap text-xs px-2.5 py-1 rounded-full bg-[var(--ui-surface-variant)] text-[var(--ui-text-secondary)]">{badge}</span>}
  </div>;
}
