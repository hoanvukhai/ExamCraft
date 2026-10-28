'use client';
import { useState, type ReactNode } from 'react';
import { Plus, MoreHorizontal } from 'lucide-react';
import type { Exam, OutlineNode, Question } from '@/types/exam';
import { ToolMenu, type MenuItem } from '@/components/EditorToolbar';
import { PassageFields } from '@/components/ExamStructureEditor';
import { MathRenderer } from '@/components/MathRenderer';
import { FigureView } from '@/components/FigureView';
import { EditorDialog } from './EditorDialog';
import { outlineEntries, outlineNodes, insertOutlineNodes, moveOutlineNode,
  outlineStamp, removeOutlineNode, legacyOutline, findOutlineList, type InsertPoint } from '@/lib/exam-outline';
import { nudgeOutlineNode, outlineLocation, patchOutlineNode } from '@/lib/outline-editing';
import { freezeExamScoring } from '@/lib/snapshot-scoring';
import { requiresNumericScore } from '@/lib/education-catalog';

export type QuestionSource = 'manual' | 'bank' | 'import' | 'generate';
export interface QuestionPositionControls { first: boolean; last: boolean; moveItems: MenuItem[] }
interface Props {
  exam: Exam;
  canEdit: boolean;
  onChange: React.Dispatch<React.SetStateAction<Exam>>;
  onSource: (point: InsertPoint, source: QuestionSource) => void;
  onPoint: (point: InsertPoint) => void;
  renderQuestion: (question: Question, index: number, number: number, controls: QuestionPositionControls) => ReactNode;
  composerPoint?: InsertPoint;
  composer?: ReactNode;
}
const button = 'app-button-secondary rounded px-3 min-h-10 text-sm';
const field = 'w-full min-w-0 border rounded p-2 bg-transparent text-sm';
const samePoint = (a?: InsertPoint, b?: InsertPoint) => !!a && !!b &&
  a.parentId === b.parentId && (a.afterId ?? null) === (b.afterId ?? null);

function ContainerFields({ exam, node, onChange }: Pick<Props, 'exam' | 'onChange'> & { node: OutlineNode }) {
  const patch = (value: Parameters<typeof patchOutlineNode>[2]) => onChange(previous => patchOutlineNode(previous, node.id, value));
  const passage = exam.passages?.find(item => item.id === node.passageId);
  return <div className="space-y-3 my-3" aria-label={'Sửa ' + (node.kind === 'part' ? 'phần' : 'nhóm')}>
    <label className="block text-sm">Tiêu đề
      <input className={field} aria-label={'Tiêu đề ' + node.id} value={node.title ?? ''}
        onChange={event => patch({ title: event.target.value })} />
    </label>
    <label className="block text-sm">Lời dặn / lời dẫn
      <textarea className={field} rows={3} aria-label={'Lời dẫn ' + node.id} value={node.instructions ?? ''}
        onChange={event => patch({ instructions: event.target.value })} />
    </label>
    <label className="block text-sm">Đánh số
      <select className={field} aria-label={'Đánh số ' + node.id} value={node.numbering ?? 'none'}
        onChange={event => patch({ numbering: event.target.value as OutlineNode['numbering'] })}>
        <option value="none">Không thêm số</option><option value="decimal">1, 2, 3</option>
        {node.kind === 'part' && <><option value="roman">I, II, III</option><option value="letters">A, B, C</option></>}
      </select>
    </label>
    {node.kind === 'part' && <label className="block text-sm">Đánh số câu trong phần
      <select className={field} aria-label={'Đánh số câu ' + node.id} value={node.questionNumbering ?? 'continuous'}
        onChange={event => patch({ questionNumbering: event.target.value as OutlineNode['questionNumbering'] })}>
        <option value="continuous">Tiếp nối phần trước</option><option value="restart">Bắt đầu lại từ câu 1</option>
      </select>
    </label>}
    {node.kind === 'group' && (passage
      ? <PassageFields exam={exam} passage={passage} index={exam.passages!.indexOf(passage)} onChange={onChange} />
      : <button type="button" className={button} onClick={() => {
        const passageId = node.passageId ?? crypto.randomUUID();
        onChange(previous => previous.access?.canEdit === false ? previous : patchOutlineNode({ ...previous, passages: [
          ...(previous.passages ?? []), { id: passageId, title: '', content: '' },
        ] }, node.id, { passageId }));
      }}>Thêm đoạn văn / hình / dữ liệu</button>)}
  </div>;
}

export function OutlineEditor(p: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<{ id: string; stamp: string; keep: boolean } | null>(null);
  const [reuse, setReuse] = useState<InsertPoint | null>(null), [passageId, setPassageId] = useState('');
  const [message, setMessage] = useState('');
  const outline = p.exam.outline ?? legacyOutline(p.exam);
  const entries = outlineEntries(p.exam), entriesById = new Map(entries.map(entry => [entry.node.id, entry]));
  const points = new Map(freezeExamScoring(p.exam).questions.map(question => [question.id, question.points]));
  const parts = outlineNodes(outline).filter(node => node.kind === 'part');
  const apply = (update: (exam: Exam) => Exam) => {
    if (!p.canEdit) return;
    try { p.onChange(update); setMessage(''); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Chưa thực hiện được. Nội dung vẫn được giữ.'); }
  };
  const addContainer = (point: InsertPoint, kind: 'part' | 'group', existingPassage?: string) => {
    const id = crypto.randomUUID(), sourceId = kind === 'group' ? existingPassage ?? crypto.randomUUID() : undefined;
    const node: OutlineNode = { id, kind, title: kind === 'part' ? 'Phần mới' : '', children: [],
      ...(sourceId ? { passageId: sourceId } : {}) };
    apply(previous => previous.access?.canEdit === false ? previous : insertOutlineNodes({ ...previous,
      ...(sourceId && !existingPassage ? { passages: [
        ...(previous.passages ?? []), { id: sourceId, title: '', content: '' },
      ] } : {}),
    }, point, [node]));
    setEditing(id); p.onPoint({ parentId: id, afterId: null });
  };
  const source = (point: InsertPoint, type: QuestionSource) => { p.onPoint(point); p.onSource(point, type); };
  const insertion = (point: InsertPoint, label: string) => {
    const parent = point.parentId && outlineNodes(outline).find(node => node.id === point.parentId);
    const items: MenuItem[] = [
      { label: 'Câu tự soạn', onClick: () => source(point, 'manual') },
      { label: 'Từ ngân hàng', onClick: () => source(point, 'bank') },
      { label: 'Nhập Word/Ảnh', onClick: () => source(point, 'import') },
      { label: 'Sinh bằng AI', onClick: () => source(point, 'generate') },
      ...(parent && parent.kind === 'group' ? [] : [
        { label: 'Ngữ liệu (nhóm mới)', onClick: () => addContainer(point, 'group') },
        ...(p.exam.passages?.length ? [{ label: 'Dùng nội dung chung đã có', onClick: () => {
          setReuse(point); setPassageId('');
        } }] : []),
      ]),
      ...(point.parentId === null ? [{ label: 'Phần mới', onClick: () => addContainer(point, 'part') }] : []),
    ];
    return <div key={String(point.parentId) + ':' + String(point.afterId)} className="py-2 min-w-0"
      data-insert-parent={point.parentId ?? 'root'} data-insert-after={point.afterId ?? 'start'}>
      <ToolMenu label={label} Icon={Plus} items={items} />
      {samePoint(point, p.composerPoint) && p.composer}
    </div>;
  };
  const renderList = (nodes: OutlineNode[], parentId: string | null, title: string): ReactNode => <>
    {nodes.map((node, index) => {
      const entry = entriesById.get(node.id)!;
      const location = outlineLocation(outline, node.id)!;
      const before = { parentId, afterId: nodes[index - 1]?.id ?? null };
      const between = (index > 0 && node.kind === 'question' && nodes[index - 1].kind === 'question') ||
        samePoint(before, p.composerPoint);
      if (node.kind === 'question') {
        const question = p.exam.questions.find(item => item.id === node.questionId);
        if (!question) return null;
        const global = p.exam.questions.indexOf(question);
        const moveItems: MenuItem[] = [
          { label: 'Chuyển ra gốc đề', onClick: () => apply(previous => moveOutlineNode(previous, node.id, {
            parentId: null, afterId: previous.outline?.at(-1)?.id ?? null,
          })) },
          ...parts.map(part => ({ label: 'Chuyển sang ' + (part.title || 'Phần chưa đặt tên'), onClick: () =>
            apply(previous => moveOutlineNode(previous, node.id, {
              parentId: part.id,
              afterId: outlineNodes(previous.outline ?? []).find(item => item.id === part.id)?.children?.at(-1)?.id ?? null,
            })),
          })),
        ];
        return <div key={node.id} id={'editor-question-' + question.id} tabIndex={-1} className="scroll-mt-16 min-w-0">
          {between && insertion(before, 'Thêm giữa hai câu')}
          {p.renderQuestion(question, global, entry.number ?? global + 1, {
            first: location.index === 0, last: location.index === location.siblings.length - 1, moveItems,
          })}
        </div>;
      }
      const passage = p.exam.passages?.find(item => item.id === node.passageId);
      const members = outlineNodes(node.children ?? []).filter(item => item.kind === 'question');
      const known = members.every(item => points.get(item.questionId!) !== undefined);
      const total = members.reduce((sum, item) => sum + (points.get(item.questionId!) ?? 0), 0);
      const label = [entry.label, node.title].filter(Boolean).join('. ') || (node.kind === 'part' ? 'Phần mới' : 'Nhóm câu');
      const isEditing = editing === node.id;
      const menu: MenuItem[] = [
        { label: 'Sửa tiêu đề và lời dẫn', onClick: () => setEditing(node.id) },
        { label: 'Di chuyển lên', disabled: location.index === 0, onClick: () => apply(exam => nudgeOutlineNode(exam, node.id, 'up')) },
        { label: 'Di chuyển xuống', disabled: location.index === location.siblings.length - 1,
          onClick: () => apply(exam => nudgeOutlineNode(exam, node.id, 'down')) },
        { label: node.kind === 'part' ? 'Xóa phần' : 'Xóa nhóm', onClick: () => setDeleting({
          id: node.id, stamp: outlineStamp(p.exam), keep: true,
        }) },
      ];
      return <div key={node.id} className="min-w-0">{samePoint(before, p.composerPoint) && insertion(before, 'Thêm tại đây')}
      <section data-outline-node={node.id} className="border rounded-xl p-3 min-w-0 space-y-3">
        <header className="flex flex-wrap gap-2 items-center justify-between">
          <button type="button" className="text-left font-semibold break-words min-h-10" onClick={() => {
            setEditing(isEditing ? null : node.id);
            p.onPoint({ parentId: node.id, afterId: node.children?.at(-1)?.id ?? null });
          }}>{label}</button>
          <span className="text-xs text-[var(--ui-text-secondary)]">{members.length} câu
            {members.length > 0 && known && requiresNumericScore(p.exam.metadata.assessmentMode) &&
              ' · ' + Math.round(total * 100) / 100 + ' điểm'}
          </span>
          <ToolMenu label={'Thao tác ' + label} compact Icon={MoreHorizontal} items={menu} />
        </header>
        {isEditing ? <>
          <ContainerFields exam={p.exam} node={node} onChange={p.onChange} />
          <button type="button" className={button} onClick={() => setEditing(null)}>Xong</button>
        </> : <>
          {node.instructions && <MathRenderer content={node.instructions} />}
          {passage && <div className="border rounded p-3 text-sm space-y-2">
            {passage.title && <h4 className="font-medium">{passage.title}</h4>}
            <MathRenderer content={passage.content} />
            {passage.figures?.map(figure => <FigureView key={figure.id} figure={figure} />)}
            {passage.source && <p className="text-xs italic">{passage.source}</p>}
            <button type="button" className="underline" onClick={() => setEditing(node.id)}>Sửa nội dung chung</button>
          </div>}
        </>}
        <div className={node.kind === 'group' ? 'pl-2 border-l min-w-0 space-y-3' : 'space-y-3 min-w-0'}>
          {renderList(node.children ?? [], node.id, label)}
        </div>
      </section></div>;
    })}
    {(parentId !== null || nodes.length > 0 || p.composer) &&
      insertion({ parentId, afterId: nodes.at(-1)?.id ?? null }, parentId ? 'Thêm vào ' + title : 'Thêm vào cuối đề')}
  </>;
  const composerList = p.composerPoint && findOutlineList(outline, p.composerPoint.parentId);
  const composerExists = composerList && (p.composerPoint?.afterId == null ||
    composerList.some(node => node.id === p.composerPoint!.afterId));
  return <section aria-label="Dàn ý đề" className="min-w-0 space-y-3">
    {message && <p role="alert" className="text-sm">{message}</p>}
    {p.composer && !composerExists && <div><p>Vị trí cũ đã thay đổi. Câu đang soạn vẫn được giữ.</p>{p.composer}</div>}
    <fieldset disabled={!p.canEdit} className="min-w-0 space-y-3">
    {renderList(outline, null, 'đề')}
    <button type="button" className={button} onClick={() => addContainer({
      parentId: null, afterId: outline.at(-1)?.id ?? null,
    }, 'part')}>+ Thêm phần</button>
    </fieldset>
    {deleting && <EditorDialog title="Xóa mục trong đề" onClose={() => setDeleting(null)}>
      <label className="flex gap-2 text-sm my-4"><input type="checkbox" checked={deleting.keep}
        onChange={event => setDeleting({ ...deleting, keep: event.target.checked })} />Giữ các câu hỏi và đưa ra ngoài mục này</label>
      <button type="button" className={button} disabled={!p.canEdit} onClick={() => {
        if (outlineStamp(p.exam) !== deleting.stamp) { setMessage('Dàn ý vừa thay đổi. Hãy kiểm lại trước khi xóa.'); return; }
        apply(exam => outlineStamp(exam) === deleting.stamp ? removeOutlineNode(exam, deleting.id, deleting.keep) : exam);
        setDeleting(null);
      }}>{deleting.keep ? 'Bỏ mục, giữ câu' : 'Xóa mục và các câu bên trong'}</button>
    </EditorDialog>}
    {reuse && <EditorDialog title="Dùng lại nội dung chung" onClose={() => setReuse(null)}>
      <label className="block text-sm">Chọn nội dung<select className={field} value={passageId}
        onChange={event => setPassageId(event.target.value)}><option value="">Chọn một nội dung</option>
        {p.exam.passages?.map((item, index) => <option key={item.id} value={item.id}>{item.title || 'Ngữ liệu ' + (index + 1)}</option>)}
      </select></label>
      <button type="button" className={button + ' mt-3'} disabled={!p.canEdit || !passageId} onClick={() => {
        if (!p.exam.passages?.some(item => item.id === passageId)) return;
        addContainer(reuse, 'group', passageId); setReuse(null);
      }}>Thêm nhóm dùng nội dung này</button>
    </EditorDialog>}
  </section>;
}
