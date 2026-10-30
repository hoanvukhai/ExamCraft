'use client';
import { useState } from 'react';
import type { Exam, OutlineNode } from '@/types/exam';
import { displayOutline } from '@/lib/canvas-objects';
import { outlineEntries, viewSyncedOutline, type InsertPoint } from '@/lib/exam-outline';
import { freezeExamScoring } from '@/lib/snapshot-scoring';
import { requiresNumericScore } from '@/lib/education-catalog';
import { stripFormat } from '@/lib/rich-text';

const typeLabel: Record<string, string> = {
  multiple_choice: 'TN',
  true_false_group: 'Đ/S',
  short_answer: 'Ngắn',
  essay: 'Tự luận',
  fill_blank: 'Điền khuyết',
  matching: 'Ghép nối',
  ordering: 'Sắp xếp',
};

type Filter = 'all' | 'issues' | 'comments';

type Props = {
  exam: Exam;
  selectedCode: string;
  /** Question ids that are ticked for a batch action. */
  ticked: string[];
  canEdit: boolean;
  issueCounts: Record<string, number>;
  commentCounts: Record<string, number>;
  onSelect: (code: string) => void;
  onTick: (questionId: string) => void;
  onMove: (nodeId: string, point: InsertPoint) => void;
};

/** One line per part, group and question: to find things in a long exam and to drag them to another place. It has no edit fields. */
export function EditorOutline(p: Props) {
  const [filter, setFilter] = useState<Filter>('all');
  const [dragging, setDragging] = useState<string | null>(null);
  const view = viewSyncedOutline(p.exam);
  const outline = displayOutline(p.exam);
  const entries = new Map(outlineEntries({ ...view, outline }).map((entry) => [entry.node.id, entry]));
  const scores = new Map(freezeExamScoring(view).questions.map((q) => [q.id, q.points]));
  const numeric = requiresNumericScore(p.exam.metadata.assessmentMode);
  const matches = (node: OutlineNode): boolean => {
    if (filter === 'all') return true;
    if (node.kind === 'question') {
      const id = node.questionId!;
      return filter === 'issues' ? !!p.issueCounts[id] : !!p.commentCounts[id];
    }
    return (node.children ?? []).some(matches);
  };
  const drop = (target: OutlineNode, siblings: OutlineNode[], parentId: string | null, event: React.DragEvent) => {
    event.preventDefault();
    const moving = dragging;
    setDragging(null);
    if (!moving || moving === target.id || !p.canEdit) return;
    const half = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const before = event.clientY < half.top + half.height / 2;
    if (target.kind !== 'question' && (target.children?.length ?? 0) >= 0 && target.kind === 'part' && !before) {
      // Dropped on the lower half of a part title: it becomes the first thing inside that part.
      p.onMove(moving, { parentId: target.id, afterId: null });
      return;
    }
    const index = siblings.findIndex((item) => item.id === target.id);
    p.onMove(moving, { parentId, afterId: before ? (siblings[index - 1]?.id ?? null) : target.id });
  };
  const row = (node: OutlineNode, siblings: OutlineNode[], parentId: string | null, depth: number): React.ReactNode => {
    if (!matches(node)) return null;
    const entry = entries.get(node.id);
    const question = entry?.question;
    const code =
      node.kind === 'question' ? `question:${node.questionId}` : `${node.kind}:${node.id}`;
    const selected = p.selectedCode === code;
    const title = node.title?.trim();
    const material = p.exam.passages?.find((passage) => passage.id === node.passageId);
    const text =
      node.kind === 'part'
        ? ['Phần', entry?.label, title].filter(Boolean).join(' ') || 'Phần'
        : node.kind === 'group'
          ? `Ngữ liệu${material?.title?.trim() || title ? ' · ' + (material?.title?.trim() || title) : ''}`
          : `Câu ${entry?.number ?? ''} · ${typeLabel[question?.type ?? ''] ?? ''}${
              numeric && scores.get(question!.id) !== undefined ? ' · ' + scores.get(question!.id) + 'đ' : ''
            } · ${stripFormat((question?.content ?? '').replace(/\$+/g, '').replace(/\s+/g, ' ')).slice(0, 40)}`;
    return (
      <li key={node.id}>
        <div
          role="button"
          tabIndex={0}
          draggable={p.canEdit}
          data-outline-row={node.id}
          aria-current={selected ? 'true' : undefined}
          onClick={() => p.onSelect(code)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') p.onSelect(code);
          }}
          onDragStart={() => setDragging(node.id)}
          onDragEnd={() => setDragging(null)}
          onDragOver={(event) => dragging && event.preventDefault()}
          onDrop={(event) => drop(node, siblings, parentId, event)}
          style={{ paddingLeft: depth * 14 + 6 }}
          className={
            'flex min-h-9 cursor-pointer items-center gap-2 rounded-lg pr-2 text-sm hover:bg-[var(--ui-surface-variant)] ' +
            (selected ? 'bg-[var(--ui-surface-variant)] font-semibold' : '') +
            (node.kind === 'part' ? ' font-semibold' : '')
          }
        >
          {node.kind === 'question' && (
            <input
              type="checkbox"
              aria-label={`Chọn Câu ${entry?.number ?? ''}`}
              checked={p.ticked.includes(node.questionId!)}
              onClick={(event) => event.stopPropagation()}
              onChange={() => p.onTick(node.questionId!)}
            />
          )}
          <span className="min-w-0 flex-1 truncate">{text}</span>
          {question && p.issueCounts[question.id] ? (
            <span title="Có mục cần rà soát" className="text-xs text-[var(--ui-text-secondary)]">
              !
            </span>
          ) : null}
          {question && p.commentCounts[question.id] ? (
            <span title="Có góp ý chưa giải quyết" className="text-xs text-[var(--ui-text-secondary)]">
              {p.commentCounts[question.id]}
            </span>
          ) : null}
        </div>
        {node.children?.length ? (
          <ul>{node.children.map((child) => row(child, node.children!, node.id, depth + 1))}</ul>
        ) : null}
      </li>
    );
  };
  return (
    <section aria-label="Dàn ý đề" className="space-y-3 min-w-0">
      <header className="flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-semibold">Dàn ý</h2>
        <div role="group" aria-label="Lọc dàn ý" className="ml-auto flex gap-1">
          {(
            [
              ['all', 'Tất cả'],
              ['issues', 'Cần rà soát'],
              ['comments', 'Có góp ý'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={filter === key}
              onClick={() => setFilter(key)}
              className={
                (filter === key ? 'app-button-tonal' : 'app-button-secondary') + ' min-h-8 rounded-lg px-2.5 text-xs'
              }
            >
              {label}
            </button>
          ))}
        </div>
      </header>
      <ul>{outline.map((node) => row(node, outline, null, 0))}</ul>
      {p.canEdit && (
        <p className="text-xs text-[var(--ui-text-secondary)]">Kéo một dòng để đổi chỗ. Bấm một dòng để chọn trên tờ đề.</p>
      )}
    </section>
  );
}
