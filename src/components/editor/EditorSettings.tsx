'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import type { Exam } from '@/types/exam';
import { HeaderForm } from '@/components/HeaderSettingsModal';
import { KnowledgeScopeEditor } from '@/components/KnowledgeScopeEditor';
import { ExamPlanEditor } from '@/components/ExamPlanEditor';
import { applyHeaderSubmission, type HeaderSubmission } from '@/lib/header-layout';

type Props = {
  ownerId: string;
  exam: Exam;
  canEdit: boolean;
  hasActiveKey: boolean;
  onChange: React.Dispatch<React.SetStateAction<Exam>>;
  isOpen: boolean;
  onClose?: () => void;
  onPreview: (submission: HeaderSubmission | null) => void;
  preview?: ReactNode;
};
const tabs = [
  ['general', 'Thông tin chung'],
  ['scope', 'Phạm vi kiến thức'],
  ['matrix', 'Ma trận đề'],
] as const;

/** Hidden tabs keep local drafts and their existing guarded apply action. */
export function EditorSettings(p: Props) {
  const [visited, setVisited] = useState(false);
  const [tab, setTab] = useState<(typeof tabs)[number][0]>('general');
  const heading = useRef<HTMLHeadingElement>(null);
  if (p.isOpen && !visited) setVisited(true);
  useEffect(() => {
    if (!p.isOpen) return;
    const trigger = document.activeElement;
    heading.current?.focus();
    return () => {
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus();
    };
  }, [p.isOpen]);
  return (
    <aside
      aria-label="Thông tin đề"
      className={p.isOpen ? 'no-print min-w-0 space-y-4 pt-1' : 'hidden'}
    >
      <div className="flex items-center justify-between text-xs py-1">
        <h2 ref={heading} tabIndex={-1} className="font-semibold text-[var(--ui-text-primary)] outline-none">
          Cấu hình đề thi
        </h2>
        {p.onClose && (
          <button
            type="button"
            aria-label="Đóng thông tin đề"
            onClick={p.onClose}
            className="flex items-center gap-1 text-xs text-[var(--ui-text-secondary)] hover:text-[var(--ui-text-primary)] hover:underline cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Đóng</span>
          </button>
        )}
      </div>

      <div
        role="tablist"
        aria-label="Mục thông tin đề"
        className="flex items-center gap-4 border-b border-[var(--ui-border)] text-xs pb-1"
      >
        {tabs.map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            id={'info-tab-' + key}
            aria-selected={tab === key}
            aria-controls={'info-panel-' + key}
            onClick={() => setTab(key)}
            className={`pb-2 -mb-1 border-b-2 text-xs font-medium transition-all cursor-pointer ${
              tab === key
                ? 'border-[var(--ui-primary)] text-[var(--ui-text-primary)] font-semibold'
                : 'border-transparent text-[var(--ui-text-secondary)] hover:text-[var(--ui-text-primary)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {visited && (
        <fieldset disabled={!p.canEdit} className="min-w-0 pt-2">
          <section
            role="tabpanel"
            id="info-panel-general"
            aria-labelledby="info-tab-general"
            hidden={tab !== 'general'}
          >
            <HeaderForm
              embedded
              showFramework
              onPreview={p.isOpen ? p.onPreview : undefined}
              isOpen
              metadata={p.exam.metadata}
              documentId={p.exam.id}
              ownerId={p.ownerId}
              onClose={p.onClose ?? (() => {})}
              onSaveMetadata={(submission) =>
                p.onChange((previous) => applyHeaderSubmission(previous, submission))
              }
            />
          </section>
          <section
            role="tabpanel"
            id="info-panel-scope"
            aria-labelledby="info-tab-scope"
            hidden={tab !== 'scope'}
          >
            <KnowledgeScopeEditor
              embedded
              exam={p.exam}
              ownerId={p.ownerId}
              hasActiveKey={p.hasActiveKey}
              onChange={p.onChange}
            />
          </section>
          <section
            role="tabpanel"
            id="info-panel-matrix"
            aria-labelledby="info-tab-matrix"
            hidden={tab !== 'matrix'}
          >
            <ExamPlanEditor embedded exam={p.exam} onChange={p.onChange} />
          </section>
        </fieldset>
      )}
      {p.preview && (
        <details className="border-t min-w-0 p-3 @min-[900px]:hidden" open>
          <summary className="cursor-pointer text-sm">Xem thử thay đổi</summary>
          {p.isOpen && p.preview}
        </details>
      )}
    </aside>
  );
}
