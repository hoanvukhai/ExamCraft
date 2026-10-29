'use client';
import { useState, type ReactNode } from 'react';
import { Plus, MoreHorizontal, ChevronDown } from 'lucide-react';
import type { Exam, OutlineNode, Question } from '@/types/exam';
import { ToolMenu, type MenuItem } from '@/components/EditorToolbar';
import { PassageFields } from './PassageFields';
import { MathRenderer } from '@/components/MathRenderer';
import { FigureView } from '@/components/FigureView';
import { EditorDialog } from './EditorDialog';
import { withEditorParts } from '@/lib/editor-parts';
import {
  outlineEntries,
  outlineNodes,
  insertOutlineNodes,
  moveOutlineNode,
  outlineStamp,
  removeOutlineNode,
  findOutlineList,
  viewSyncedOutline,
  type InsertPoint,
} from '@/lib/exam-outline';
import { nudgeOutlineNode, outlineLocation, patchOutlineNode } from '@/lib/outline-editing';
import { freezeExamScoring } from '@/lib/snapshot-scoring';
import { requiresNumericScore } from '@/lib/education-catalog';

export type QuestionSource = 'manual' | 'bank' | 'import' | 'generate';
export interface QuestionPositionControls {
  first: boolean;
  last: boolean;
  moveItems: MenuItem[];
}
interface Props {
  exam: Exam;
  canEdit: boolean;
  onChange: React.Dispatch<React.SetStateAction<Exam>>;
  onSource: (point: InsertPoint, source: QuestionSource) => void;
  onPoint: (point: InsertPoint) => void;
  renderQuestion: (
    question: Question,
    index: number,
    number: number,
    controls: QuestionPositionControls,
  ) => ReactNode;
  composerPoint?: InsertPoint;
  composer?: ReactNode;
}
const button = 'app-button-secondary rounded-lg px-3 min-h-9 text-sm';
const field = 'w-full min-w-0 border rounded-lg p-2 bg-transparent text-sm';
const samePoint = (a?: InsertPoint, b?: InsertPoint) =>
  !!a && !!b && a.parentId === b.parentId && (a.afterId ?? null) === (b.afterId ?? null);

export function OutlineEditor(p: Props) {
  const display = withEditorParts(viewSyncedOutline(p.exam));
  const outline = display.outline!;
  const entries = new Map(outlineEntries(display).map((entry) => [entry.node.id, entry]));
  const parts = outline.filter((node) => node.kind === 'part');
  const [editing, setEditing] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [options, setOptions] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<{ id: string; stamp: string; keep: boolean } | null>(null);
  const [reuse, setReuse] = useState<InsertPoint | null>(null),
    [passageId, setPassageId] = useState('');
  const [message, setMessage] = useState('');
  const scores = new Map(freezeExamScoring(display).questions.map((q) => [q.id, q.points]));
  const labelFor = (node: OutlineNode) =>
    node.title?.trim() ||
    (node.kind === 'part'
      ? 'phần không tên ' + (parts.findIndex((part) => part.id === node.id) + 1)
      : display.passages?.find((passage) => passage.id === node.passageId)?.title || 'nội dung dùng chung');
  const apply = (update: (exam: Exam) => Exam) => {
    if (!p.canEdit) return;
    try {
      p.onChange((previous) => update(withEditorParts(previous)));
      setMessage('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Chưa áp dụng được. Nội dung vẫn được giữ.');
    }
  };
  const patch = (id: string, value: Parameters<typeof patchOutlineNode>[2]) =>
    apply((previous) => patchOutlineNode(previous, id, value));
  const toggle = (id: string) =>
    setCollapsed((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const add = (point: InsertPoint, kind: 'part' | 'group', existing?: string) => {
    const id = crypto.randomUUID(),
      materialId = kind === 'group' ? (existing ?? crypto.randomUUID()) : undefined;
    const node: OutlineNode = {
      id,
      kind,
      title: '',
      children: [],
      ...(materialId ? { passageId: materialId } : {}),
    };
    apply((previous) =>
      insertOutlineNodes(
        {
          ...previous,
          ...(materialId && !existing
            ? {
                passages: [...(previous.passages ?? []), { id: materialId, title: '', content: '' }],
              }
            : {}),
        },
        point,
        [node],
      ),
    );
    if (kind === 'group') setEditing(id);
    p.onPoint({ parentId: id, afterId: null });
  };
  const insert = (point: InsertPoint, label: string, compact = false) => {
    const parent = outlineNodes(outline).find((node) => node.id === point.parentId);
    const items: MenuItem[] = [
      {
        label: 'Câu tự soạn',
        onClick: () => {
          p.onPoint(point);
          p.onSource(point, 'manual');
        },
      },
      {
        label: 'Từ ngân hàng',
        onClick: () => {
          p.onPoint(point);
          p.onSource(point, 'bank');
        },
      },
      {
        label: 'Nhập Word/Ảnh',
        onClick: () => {
          p.onPoint(point);
          p.onSource(point, 'import');
        },
      },
      {
        label: 'Sinh bằng AI',
        onClick: () => {
          p.onPoint(point);
          p.onSource(point, 'generate');
        },
      },
      ...(parent?.kind === 'group'
        ? []
        : [
            { label: 'Nội dung dùng chung', onClick: () => add(point, 'group') },
            ...(display.passages?.length
              ? [
                  {
                    label: 'Dùng nội dung chung đã có',
                    onClick: () => {
                      setReuse(point);
                      setPassageId('');
                    },
                  },
                ]
              : []),
          ]),
    ];
    return (
      <div
        key={point.parentId + ':' + point.afterId}
        className="py-1 min-w-0"
        data-insert-parent={point.parentId ?? 'root'}
        data-insert-after={point.afterId ?? 'start'}
      >
        <ToolMenu label={label} compact={compact} Icon={Plus} items={items} />
        {samePoint(point, p.composerPoint) && p.composer}
      </div>
    );
  };
  const render = (nodes: OutlineNode[], parentId: string | null): ReactNode => (
    <>
      {nodes.map((node, index) => {
        const entry = entries.get(node.id)!;
        const before = { parentId, afterId: nodes[index - 1]?.id ?? null };
        const leading = parentId ? insert(before, 'Thêm tại đây', true) : null;
        if (node.kind === 'question') {
          const q = display.questions.find((question) => question.id === node.questionId);
          if (!q) return null;
          const position = display.questions.indexOf(q);
          const moveItems: MenuItem[] = parts.map((part) => ({
            label: 'Chuyển sang ' + labelFor(part),
            onClick: () =>
              apply((previous) => {
                const destination = outlineNodes(previous.outline!).find((item) => item.id === part.id);
                return moveOutlineNode(previous, node.id, {
                  parentId: part.id,
                  afterId: destination?.children?.at(-1)?.id ?? null,
                });
              }),
          }));
          for (const group of outlineNodes(outline).filter(
            (item) => item.kind === 'group' && item.id !== parentId,
          )) {
            const material = display.passages?.find((item) => item.id === group.passageId);
            const name = material?.title || group.title || material?.content.slice(0, 32) || 'nội dung chung';
            moveItems.push({
              label: 'Đưa vào ' + name,
              onClick: () =>
                apply((previous) => {
                  const destination = outlineNodes(previous.outline!).find((item) => item.id === group.id);
                  return moveOutlineNode(previous, node.id, {
                    parentId: group.id,
                    afterId: destination?.children?.at(-1)?.id ?? null,
                  });
                }),
            });
          }
          return (
            <div key={node.id} id={'editor-question-' + q.id} tabIndex={-1} className="scroll-mt-16 min-w-0">
              {leading}
              {p.renderQuestion(q, position, entry.number ?? position + 1, {
                first: index === 0,
                last: index === nodes.length - 1,
                moveItems,
              })}
            </div>
          );
        }
        const label = labelFor(node),
          hidden = collapsed.has(node.id),
          location = outlineLocation(outline, node.id)!;
        const material = display.passages?.find((item) => item.id === node.passageId);
        const members = outlineNodes(node.children ?? []).filter((item) => item.kind === 'question');
        const points = members.reduce((sum, item) => sum + (scores.get(item.questionId!) ?? 0), 0);
        const items: MenuItem[] = [
          ...(node.kind === 'part'
            ? [{ label: 'Lời dẫn và đánh số', onClick: () => setOptions(node.id) }]
            : [{ label: 'Sửa nội dung chung', onClick: () => setEditing(node.id) }]),
          {
            label: 'Di chuyển lên',
            disabled: location.index === 0,
            onClick: () => apply((previous) => nudgeOutlineNode(previous, node.id, 'up')),
          },
          {
            label: 'Di chuyển xuống',
            disabled: location.index === location.siblings.length - 1,
            onClick: () => apply((previous) => nudgeOutlineNode(previous, node.id, 'down')),
          },
          {
            label: node.kind === 'part' ? 'Xóa phần' : 'Xóa nội dung chung',
            onClick: () =>
              setDeleting({ id: node.id, stamp: outlineStamp(withEditorParts(p.exam)), keep: true }),
          },
        ];
        return (
          <div key={node.id} className="min-w-0">
            {leading}
            <section
              data-outline-node={node.id}
              data-outline-kind={node.kind}
              className={
                node.kind === 'part' ? 'min-w-0 py-3 space-y-2' : 'min-w-0 border-l-2 pl-3 py-2 space-y-2'
              }
            >
              <header className="flex items-center gap-2 min-w-0">
                <button
                  type="button"
                  aria-expanded={!hidden}
                  aria-label={(hidden ? 'Mở ' : 'Thu gọn ') + label}
                  className="shrink-0 min-h-9 px-1"
                  onClick={() => toggle(node.id)}
                >
                  <ChevronDown aria-hidden className={'w-4 h-4 ' + (hidden ? '-rotate-90' : '')} />
                </button>
                {node.kind === 'part' ? (
                  <input
                    aria-label={'Tên phần ' + (parts.indexOf(node) + 1)}
                    placeholder="Tên phần — có thể để trống"
                    value={node.title ?? ''}
                    disabled={!p.canEdit}
                    className="min-w-0 flex-1 bg-transparent rounded px-1 py-2 font-semibold placeholder:font-normal placeholder:text-[var(--ui-text-secondary)]"
                    onFocus={() =>
                      p.onPoint({ parentId: node.id, afterId: node.children?.at(-1)?.id ?? null })
                    }
                    onChange={(event) => patch(node.id, { title: event.target.value })}
                  />
                ) : (
                  <span className="min-w-0 flex-1 text-sm font-medium truncate">
                    {material?.title || node.title || 'Nội dung dùng chung'}
                  </span>
                )}
                {members.length > 0 && (
                  <span className="text-xs text-[var(--ui-text-secondary)] shrink-0">
                    {members.length} câu
                    {requiresNumericScore(display.metadata.assessmentMode) &&
                    members.every((item) => scores.get(item.questionId!) !== undefined)
                      ? ' · ' + Math.round(points * 100) / 100 + 'đ'
                      : ''}
                  </span>
                )}
                <ToolMenu label={'Thao tác ' + label} compact Icon={MoreHorizontal} items={items} />
              </header>
              <div hidden={hidden} className="min-w-0 space-y-2">
                {node.instructions && <MathRenderer content={node.instructions} />}
                {node.kind === 'group' &&
                  (editing === node.id ? (
                    <div className="space-y-2">
                      {!material && (
                        <button
                          type="button"
                          className={button}
                          onClick={() =>
                            apply((previous) => {
                              const id = node.passageId || crypto.randomUUID();
                              return patchOutlineNode(
                                {
                                  ...previous,
                                  passages: [...(previous.passages ?? []), { id, title: '', content: '' }],
                                },
                                node.id,
                                { passageId: id },
                              );
                            })
                          }
                        >
                          Thêm nội dung dẫn
                        </button>
                      )}
                      {material && (
                        <PassageFields
                          exam={display}
                          passage={material}
                          index={display.passages!.indexOf(material)}
                          onChange={(update) =>
                            apply((previous) => (typeof update === 'function' ? update(previous) : update))
                          }
                        />
                      )}
                      <button type="button" className={button} onClick={() => setEditing(null)}>
                        Xong
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 text-sm">
                      {material ? (
                        <>
                          <MathRenderer content={material.content} />
                          {material.figures?.map((figure) => (
                            <FigureView key={figure.id} figure={figure} />
                          ))}
                          {material.source && <p className="text-xs italic">{material.source}</p>}
                        </>
                      ) : (
                        <p>Chưa có nội dung dẫn.</p>
                      )}
                      <button type="button" className="text-xs underline" onClick={() => setEditing(node.id)}>
                        Sửa nội dung chung
                      </button>
                    </div>
                  ))}
                {render(node.children ?? [], node.id)}
              </div>
            </section>
          </div>
        );
      })}
      {parentId &&
        insert(
          { parentId, afterId: nodes.at(-1)?.id ?? null },
          nodes.length
            ? 'Thêm vào ' + labelFor(outlineNodes(outline).find((node) => node.id === parentId)!)
            : 'Thêm nội dung',
        )}
    </>
  );
  const selectedList = p.composerPoint && findOutlineList(outline, p.composerPoint.parentId);
  const composerExists =
    selectedList &&
    (p.composerPoint?.afterId == null || selectedList.some((n) => n.id === p.composerPoint?.afterId));
  const selectedOptions = outlineNodes(outline).find((node) => node.id === options);
  return (
    <section aria-label="Dàn ý đề" className="min-w-0 divide-y">
      {message && (
        <p role="alert" className="text-sm">
          {message}
        </p>
      )}
      {p.composer && !composerExists && (
        <div>
          <p>Vị trí cũ đã thay đổi. Câu đang soạn vẫn được giữ.</p>
          {p.composer}
        </div>
      )}
      {render(outline, null)}
      <button
        type="button"
        className="min-h-10 px-2 text-xs text-[var(--ui-text-secondary)]"
        disabled={!p.canEdit}
        onClick={() => add({ parentId: null, afterId: outline.at(-1)?.id ?? null }, 'part')}
      >
        + Thêm phần
      </button>
      {selectedOptions && (
        <EditorDialog title="Lời dẫn và đánh số" onClose={() => setOptions(null)}>
          <fieldset disabled={!p.canEdit} className="space-y-3">
            <label className="block text-sm">
              Lời dẫn của phần
              <textarea
                className={field}
                rows={3}
                value={selectedOptions.instructions ?? ''}
                onChange={(event) => patch(selectedOptions.id, { instructions: event.target.value })}
              />
            </label>
            <label className="block text-sm">
              Đánh số phần
              <select
                className={field}
                value={selectedOptions.numbering ?? 'none'}
                onChange={(event) =>
                  patch(selectedOptions.id, { numbering: event.target.value as OutlineNode['numbering'] })
                }
              >
                <option value="none">Không thêm số</option>
                <option value="roman">I, II, III</option>
                <option value="letters">A, B, C</option>
                <option value="decimal">1, 2, 3</option>
              </select>
            </label>
            <label className="block text-sm">
              Đánh số câu
              <select
                className={field}
                value={selectedOptions.questionNumbering ?? 'continuous'}
                onChange={(event) =>
                  patch(selectedOptions.id, {
                    questionNumbering: event.target.value as OutlineNode['questionNumbering'],
                  })
                }
              >
                <option value="continuous">Tiếp nối phần trước</option>
                <option value="restart">Bắt đầu lại từ câu 1</option>
              </select>
            </label>
          </fieldset>
        </EditorDialog>
      )}
      {deleting && (
        <EditorDialog title="Xóa mục trong đề" onClose={() => setDeleting(null)}>
          <label className="flex gap-2 text-sm my-4">
            <input
              type="checkbox"
              checked={deleting.keep}
              onChange={(event) => setDeleting({ ...deleting, keep: event.target.checked })}
            />
            Giữ các câu hỏi và đưa ra ngoài mục này
          </label>
          <button
            type="button"
            className={button}
            disabled={!p.canEdit}
            onClick={() => {
              if (outlineStamp(withEditorParts(p.exam)) !== deleting.stamp) {
                setMessage('Dàn ý vừa thay đổi. Hãy kiểm lại trước khi xóa.');
                return;
              }
              apply((previous) => {
                if (outlineStamp(previous) !== deleting.stamp) return previous;
                // Dissolving a part must not discard implicit scoring configured on that part.
                const frozen = new Map(freezeExamScoring(previous).questions.map((q) => [q.id, q.points]));
                const target = outlineNodes(previous.outline!).find((node) => node.id === deleting.id);
                const affected = new Set(outlineNodes(target ? [target] : []).map((node) => node.questionId));
                const prepared = deleting.keep
                  ? {
                      ...previous,
                      questions: previous.questions.map((q) =>
                        affected.has(q.id) && q.points === undefined && frozen.get(q.id) !== undefined
                          ? { ...q, points: frozen.get(q.id) }
                          : q,
                      ),
                    }
                  : previous;
                return withEditorParts(removeOutlineNode(prepared, deleting.id, deleting.keep), deleting.id);
              });
              setDeleting(null);
            }}
          >
            {deleting.keep ? 'Bỏ mục, giữ câu' : 'Xóa mục và các câu bên trong'}
          </button>
        </EditorDialog>
      )}
      {reuse && (
        <EditorDialog title="Dùng lại nội dung chung" onClose={() => setReuse(null)}>
          <label className="block text-sm">
            Chọn nội dung
            <select
              className={field}
              value={passageId}
              onChange={(event) => setPassageId(event.target.value)}
            >
              <option value="">Chọn một nội dung</option>
              {display.passages?.map((item, index) => (
                <option key={item.id} value={item.id}>
                  {item.title || 'Nội dung ' + (index + 1)}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className={button + ' mt-3'}
            disabled={!p.canEdit || !passageId}
            onClick={() => {
              if (!display.passages?.some((item) => item.id === passageId)) return;
              add(reuse, 'group', passageId);
              setReuse(null);
            }}
          >
            Thêm nhóm dùng nội dung này
          </button>
        </EditorDialog>
      )}
    </section>
  );
}
