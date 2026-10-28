'use client';
import type { Exam, Passage } from '@/types/exam';
import { FigureEditor } from '@/components/FigureEditor';
export type ContentChange = (update: (previous: Exam) => Exam) => void;
const field = 'min-w-0 w-full border rounded p-2 bg-[var(--ui-surface)] text-sm';
export function PassageFields({
  passage,
  index,
  onChange,
}: {
  exam: Exam;
  passage: Passage;
  index: number;
  onChange: ContentChange;
}) {
  const update = (patch: Partial<Passage>) =>
    onChange((previous) =>
      previous.access?.canEdit === false
        ? previous
        : {
            ...previous,
            passages: previous.passages?.map((item) =>
              item.id === passage.id ? { ...item, ...patch } : item,
            ),
            questions: previous.questions.map((question) =>
              question.passageId === passage.id
                ? { ...question, status: 'draft', verifiedBy: 'none', version: (question.version ?? 1) + 1 }
                : question,
            ),
          },
    );
  return (
    <div className="space-y-2 min-w-0">
      <label className="block text-sm">
        Tên nội dung dùng chung
        <input
          className={field}
          aria-label={`Tên ngữ liệu ${index + 1}`}
          value={passage.title ?? ''}
          onChange={(event) => update({ title: event.target.value })}
        />
      </label>
      <label className="block text-sm">
        Đoạn văn / dữ liệu
        <textarea
          className={field}
          aria-label={`Nội dung ngữ liệu ${index + 1}`}
          rows={5}
          value={passage.content}
          onChange={(event) => update({ content: event.target.value })}
        />
      </label>
      <label className="block text-sm">
        Nguồn trích dẫn
        <input
          className={field}
          value={passage.source ?? ''}
          onChange={(event) => update({ source: event.target.value })}
        />
      </label>
      <FigureEditor figures={passage.figures ?? []} onChange={(figures) => update({ figures })} />
    </div>
  );
}
