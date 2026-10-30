'use client';
import type { Dispatch, SetStateAction } from 'react';
import type { Exam, OutlineNode, Question } from '@/types/exam';
import type { HeaderSubmission } from '@/lib/header-layout';
import type { QuestionManualSubmission } from '@/lib/question-draft';
import type { MenuItem } from '@/components/EditorToolbar';
import { QuestionEditor } from '@/components/QuestionEditor';
import { EditorSettings } from './EditorSettings';
import { EditorPrint } from './EditorPrint';
import { PassageFields } from './PassageFields';
import { displayOutline, fieldFor, locateNode, nodeOfQuestion, parseCode } from '@/lib/canvas-objects';
import { outlineEntries, outlineNodes, viewSyncedOutline } from '@/lib/exam-outline';
import { patchOutlineNode } from '@/lib/outline-editing';
import { freezeExamScoring } from '@/lib/snapshot-scoring';
import { requiresNumericScore } from '@/lib/education-catalog';
import { describeInsertion } from '@/lib/insertion-label';
import { insertionFor } from '@/lib/canvas-objects';

const field = 'min-w-0 w-full border rounded-lg p-2 bg-transparent text-sm';

type Props = {
  exam: Exam;
  /** The selection (a canvas-objects code). The panel shows the details of exactly that. */
  code: string;
  canEdit: boolean;
  ownerId: string;
  sessionScope: string;
  hasActiveKey: boolean;
  sourceStamp: string;
  onChange: Dispatch<SetStateAction<Exam>>;
  /** Structure edits (parts, groups, order) go through here so implicit parts and error messages are handled once. */
  onStructure: (update: (exam: Exam) => Exam) => void;
  onPreview: (submission: HeaderSubmission | null) => void;
  onManualSave: (submission: QuestionManualSubmission) => void;
  addItems: (code: string) => MenuItem[];
  /** Put the cursor in the field that belongs to the selection (a click on the sheet), not for the arrow keys. */
  focus?: boolean;
  message?: string;
};

function Heading({ children, note }: { children: React.ReactNode; note?: string }) {
  return (
    <header className="space-y-0.5">
      <h2 className="text-sm font-semibold">{children}</h2>
      {note && <p className="text-xs text-[var(--ui-text-secondary)]">{note}</p>}
    </header>
  );
}

function PartForm({
  exam,
  node,
  canEdit,
  onStructure,
}: { exam: Exam; node: OutlineNode; canEdit: boolean } & Pick<Props, 'onStructure'>) {
  const patch = (value: Parameters<typeof patchOutlineNode>[2]) =>
    onStructure((previous) => patchOutlineNode(previous, node.id, value));
  const view = viewSyncedOutline(exam);
  const scores = new Map(freezeExamScoring(view).questions.map((q) => [q.id, q.points]));
  const members = outlineNodes(node.children ?? []).filter((item) => item.kind === 'question');
  const points = members.reduce((sum, item) => sum + (scores.get(item.questionId!) ?? 0), 0);
  const entry = outlineEntries(view).find((item) => item.node.id === node.id);
  return (
    <fieldset disabled={!canEdit} className="space-y-3 min-w-0">
      <Heading
        note={`${members.length} câu${requiresNumericScore(exam.metadata.assessmentMode) ? ' · ' + Math.round(points * 100) / 100 + ' điểm' : ''}`}
      >
        Phần {entry?.label}
      </Heading>
      <label className="block text-sm">
        Tên phần
        <input
          aria-label="Tên phần"
          className={field}
          placeholder="Có thể để trống"
          value={node.title ?? ''}
          onChange={(event) => patch({ title: event.target.value })}
        />
      </label>
      <label className="block text-sm">
        Lời dẫn của phần
        <textarea
          aria-label="Lời dẫn của phần"
          className={field}
          rows={3}
          value={node.instructions ?? ''}
          onChange={(event) => patch({ instructions: event.target.value })}
        />
      </label>
      <label className="block text-sm">
        Đánh số phần
        <select
          aria-label="Đánh số phần"
          className={field}
          value={node.numbering ?? 'none'}
          onChange={(event) => patch({ numbering: event.target.value as OutlineNode['numbering'] })}
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
          aria-label="Đánh số câu"
          className={field}
          value={node.questionNumbering ?? 'continuous'}
          onChange={(event) =>
            patch({ questionNumbering: event.target.value as OutlineNode['questionNumbering'] })
          }
        >
          <option value="continuous">Tiếp nối phần trước</option>
          <option value="restart">Bắt đầu lại từ câu 1</option>
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          aria-label="Bắt đầu ở trang mới"
          checked={!!node.startOnNewPage}
          onChange={(event) => patch({ startOnNewPage: event.target.checked || undefined })}
        />
        Bắt đầu ở trang mới
      </label>
    </fieldset>
  );
}

function GroupForm({
  exam,
  node,
  canEdit,
  onChange,
  onStructure,
}: { exam: Exam; node: OutlineNode; canEdit: boolean } & Pick<Props, 'onChange' | 'onStructure'>) {
  const material = exam.passages?.find((item) => item.id === node.passageId);
  const members = outlineNodes(node.children ?? []).filter((item) => item.kind === 'question');
  const usedBy = outlineNodes(displayOutline(exam)).filter(
    (item) => item.kind === 'group' && item.passageId === node.passageId,
  ).length;
  return (
    <fieldset disabled={!canEdit} className="space-y-3 min-w-0">
      <Heading
        note={`${members.length} câu dùng chung nội dung này${usedBy > 1 ? ` · đang dùng cho ${usedBy} nhóm` : ''}`}
      >
        Ngữ liệu
      </Heading>
      {material ? (
        <PassageFields
          exam={exam}
          passage={material}
          index={exam.passages!.indexOf(material)}
          onChange={(update) => onChange((previous) => update(previous))}
        />
      ) : (
        <button
          type="button"
          className="app-button-secondary rounded-lg px-3 min-h-9 text-sm"
          onClick={() =>
            onStructure((previous) => {
              const id = node.passageId || crypto.randomUUID();
              return patchOutlineNode(
                { ...previous, passages: [...(previous.passages ?? []), { id, title: '', content: '' }] },
                node.id,
                { passageId: id },
              );
            })
          }
        >
          Thêm nội dung dẫn
        </button>
      )}
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          aria-label="Bắt đầu ở trang mới"
          checked={!!node.startOnNewPage}
          onChange={(event) =>
            onStructure((previous) =>
              patchOutlineNode(previous, node.id, { startOnNewPage: event.target.checked || undefined }),
            )
          }
        />
        Bắt đầu ở trang mới
      </label>
    </fieldset>
  );
}

/** What is selected on the sheet, as a form: the one place to change it. */
export function EditorDetail(p: Props) {
  const object = parseCode(p.code);
  const outline = displayOutline(p.exam);
  switch (object.kind) {
    case 'part':
    case 'group': {
      const located = locateNode(outline, object.id);
      if (!located) return <p className="text-sm">Mục này không còn trong đề.</p>;
      return object.kind === 'part' ? (
        <PartForm exam={p.exam} node={located.node} canEdit={p.canEdit} onStructure={p.onStructure} />
      ) : (
        <GroupForm
          exam={p.exam}
          node={located.node}
          canEdit={p.canEdit}
          onChange={p.onChange}
          onStructure={p.onStructure}
        />
      );
    }
    case 'insert': {
      const point = insertionFor(p.exam, p.code);
      return (
        <div className="space-y-3">
          <Heading note={`Chèn vào: ${describeInsertion(p.exam, point)}`}>Điểm chèn</Heading>
          <ul className="space-y-1.5">
            {p.addItems(p.code).map((item) => (
              <li key={item.label}>
                <button
                  type="button"
                  disabled={!p.canEdit || item.disabled}
                  className="app-button-secondary w-full text-left rounded-lg px-3 min-h-10 text-sm"
                  onClick={item.onClick}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      );
    }
    case 'print': {
      const focus = object.zone === 'header' ? undefined : object.zone;
      // Header lines come from the exam details, which the workspace keeps mounted.
      return (
        <div className="space-y-4">
          <Heading
            note={
              object.zone === 'header'
                ? 'Các dòng đầu trang lấy từ Thông tin đề; sửa ở các ô bên dưới.'
                : 'Dòng in dưới tiêu đề và cuối đề.'
            }
          >
            {
              {
                header: 'Đầu trang',
                student: 'Dòng thí sinh',
                intro: 'Lời dặn đầu đề',
                end: 'Cuối đề',
                footer: 'Chân trang',
              }[object.zone]
            }
          </Heading>
          {object.zone === 'header' ? (
            <EditorSettings
              key={p.sessionScope}
              ownerId={p.ownerId}
              exam={p.exam}
              canEdit={p.canEdit}
              hasActiveKey={p.hasActiveKey}
              onChange={p.onChange}
              isOpen
              onPreview={p.onPreview}
              preview={null}
            />
          ) : (
            <EditorPrint exam={p.exam} canEdit={p.canEdit} onChange={p.onChange} focus={focus} />
          )}
        </div>
      );
    }
    case 'exam':
      return (
        <div className="space-y-4">
          <details open className="space-y-2">
            <summary className="cursor-pointer text-sm font-semibold">Thông tin đề</summary>
            <EditorSettings
              key={p.sessionScope}
              ownerId={p.ownerId}
              exam={p.exam}
              canEdit={p.canEdit}
              hasActiveKey={p.hasActiveKey}
              onChange={p.onChange}
              isOpen
              onPreview={p.onPreview}
              preview={null}
            />
          </details>
          <details className="space-y-2">
            <summary className="cursor-pointer text-sm font-semibold">Trang và in</summary>
            <EditorPrint exam={p.exam} canEdit={p.canEdit} onChange={p.onChange} />
          </details>
        </div>
      );
    default: {
      const questionId = 'question' in object ? object.question : object.id;
      const question = p.exam.questions.find((item) => item.id === questionId);
      if (!question) return <p className="text-sm">Câu này không còn trong đề.</p>;
      const located = nodeOfQuestion(p.exam, question.id);
      const number =
        located &&
        outlineEntries(viewSyncedOutline(p.exam)).find((entry) => entry.node.id === located.node.id)?.number;
      const display: Question = {
        ...question,
        subject: question.subject ?? p.exam.metadata.subject,
        grade: question.grade ?? p.exam.metadata.grade,
      };
      return (
        <div className="space-y-3 min-w-0">
          <Heading>{number ? `Câu ${number}` : 'Câu'}</Heading>
          {p.message && (
            <p role="alert" className="text-sm text-amber-700">
              {p.message}
            </p>
          )}
          <QuestionEditor
            key={`${p.ownerId}:${p.sessionScope}:${question.id}`}
            autoApply
            readOnly={!p.canEdit || !!question.locked}
            focusField={p.focus ? fieldFor(p.code) : undefined}
            ownerId={p.ownerId}
            documentId={p.exam.id}
            sourceStamp={p.sourceStamp}
            question={display}
            frameworkId={p.exam.metadata.cognitiveFrameworkId}
            knowledgePackage={p.exam.metadata.knowledgePackage}
            knowledgeScope={p.exam.metadata.knowledgeScope}
            onSave={p.onManualSave}
            onApplied={() => {}}
          />
        </div>
      );
    }
  }
}
