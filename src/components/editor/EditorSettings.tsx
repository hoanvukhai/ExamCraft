'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
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
  onClose: () => void;
  onPreview: (submission: HeaderSubmission | null) => void;
  preview: ReactNode;
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
      className={
        p.isOpen ? 'no-print min-w-0 h-full overflow-auto border rounded-xl bg-[var(--ui-surface)]' : 'hidden'
      }
    >
      <header className="sticky top-0 z-10 bg-[var(--ui-surface)] flex items-center justify-between p-3 border-b">
        <h2 ref={heading} tabIndex={-1} className="font-semibold outline-none">
          Thông tin đề
        </h2>
        <button type="button" aria-label="Đóng thông tin đề" onClick={p.onClose}>
          Đóng
        </button>
      </header>
      <div role="tablist" aria-label="Mục thông tin đề" className="flex flex-wrap gap-1 p-2 border-b text-xs">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            id={'info-tab-' + key}
            aria-selected={tab === key}
            aria-controls={'info-panel-' + key}
            onClick={() => setTab(key)}
            className={
              (tab === key ? 'app-button-primary' : 'app-button-secondary') + ' rounded-lg px-2 py-2'
            }
          >
            {label}
          </button>
        ))}
      </div>
      {visited && (
        <fieldset disabled={!p.canEdit} className="min-w-0 p-3">
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
              onClose={p.onClose}
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
      <details className="border-t min-w-0 p-3" open>
        <summary className="cursor-pointer text-sm">Xem thử thay đổi</summary>
        {p.isOpen && p.preview}
      </details>
    </aside>
  );
}
