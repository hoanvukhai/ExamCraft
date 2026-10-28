'use client';
import type { Question } from '@/types/exam';
const field = 'w-full min-w-0 rounded border p-2 text-sm bg-transparent';
export function QuestionPartsEditor({
  question,
  onChange,
}: {
  question: Question;
  onChange: (change: Partial<Question>) => void;
}) {
  const parts = question.parts ?? [];
  const patch = (id: string, value: Partial<NonNullable<Question['parts']>[number]>) =>
    onChange({ parts: parts.map((part) => (part.id === id ? { ...part, ...value } : part)) });
  const supported = ['essay', 'short_answer'].includes(question.type);
  if (!supported && !parts.length) return null;
  return (
    <details className="border rounded p-3 space-y-3">
      <summary className="cursor-pointer text-sm font-medium">Các ý của câu ({parts.length})</summary>
      {!supported && (
        <p role="alert" className="text-xs">
          Các ý vẫn được giữ. Chọn Tự luận/Trả lời ngắn hoặc bỏ các ý trước khi đổi dạng.
        </p>
      )}
      <label className="block text-sm">
        Đánh số ý
        <select
          aria-label="Đánh số ý"
          className={field}
          value={question.partsNumbering ?? 'letters'}
          onChange={(event) => onChange({ partsNumbering: event.target.value as Question['partsNumbering'] })}
        >
          <option value="letters">a, b, c</option>
          <option value="decimal">1.1, 1.2</option>
          <option value="roman">i, ii, iii</option>
        </select>
      </label>
      {parts.map((part, index) => (
        <fieldset key={part.id} className="min-w-0 border rounded p-3 space-y-2">
          <legend>Ý {index + 1}</legend>
          <label className="block text-sm">
            Nhãn riêng (tùy chọn)
            <input
              aria-label={'Nhãn ý ' + (index + 1)}
              className={field}
              value={part.label ?? ''}
              onChange={(event) => patch(part.id, { label: event.target.value || undefined })}
            />
          </label>
          <label className="block text-sm">
            Nội dung
            <textarea
              aria-label={'Nội dung ý nhỏ ' + (index + 1)}
              className={field}
              rows={3}
              value={part.content}
              onChange={(event) => patch(part.id, { content: event.target.value })}
            />
          </label>
          <label className="block text-sm">
            Điểm
            <input
              aria-label={'Điểm ý ' + (index + 1)}
              className={field}
              type="number"
              min={0}
              step="0.01"
              value={part.points ?? ''}
              onChange={(event) =>
                patch(part.id, {
                  points: event.target.value === '' ? undefined : event.target.valueAsNumber,
                })
              }
            />
          </label>
          <label className="block text-sm">
            Đáp án
            <textarea
              aria-label={'Đáp án ý ' + (index + 1)}
              className={field}
              value={part.answer ?? ''}
              onChange={(event) => patch(part.id, { answer: event.target.value })}
            />
          </label>
          <label className="block text-sm">
            Lời giải
            <textarea
              aria-label={'Lời giải ý ' + (index + 1)}
              className={field}
              value={part.solution ?? ''}
              onChange={(event) => patch(part.id, { solution: event.target.value })}
            />
          </label>
          {part.rubric?.map((row, i) => (
            <div key={i} className="flex flex-wrap gap-2">
              <input
                aria-label={'Tiêu chí ' + (i + 1) + ' của ý ' + (index + 1)}
                className={field}
                value={row.criterion}
                onChange={(event) =>
                  patch(part.id, {
                    rubric: part.rubric!.map((item, j) =>
                      j === i
                        ? {
                            ...item,
                            criterion: event.target.value,
                          }
                        : item,
                    ),
                  })
                }
              />
              <input
                aria-label={'Điểm tiêu chí ' + (i + 1) + ' của ý ' + (index + 1)}
                className={field}
                type="number"
                min={0}
                step="0.01"
                value={row.maxPoints}
                onChange={(event) =>
                  patch(part.id, {
                    rubric: part.rubric!.map((item, j) =>
                      j === i
                        ? {
                            ...item,
                            maxPoints: event.target.valueAsNumber,
                          }
                        : item,
                    ),
                  })
                }
              />
              <button
                type="button"
                onClick={() => patch(part.id, { rubric: part.rubric!.filter((_, j) => j !== i) })}
              >
                Bỏ tiêu chí
              </button>
            </div>
          ))}
          <button
            type="button"
            className="underline text-sm"
            onClick={() =>
              patch(part.id, {
                rubric: [...(part.rubric ?? []), { criterion: '', maxPoints: 0 }],
              })
            }
          >
            Thêm tiêu chí chấm
          </button>
          <button
            type="button"
            className="underline text-sm ml-3"
            onClick={() =>
              onChange({
                parts: parts.filter((item) => item.id !== part.id),
              })
            }
          >
            Bỏ ý {index + 1}
          </button>
        </fieldset>
      ))}
      <button
        type="button"
        className="app-button-secondary px-3 min-h-10"
        disabled={!supported || parts.length >= 100}
        onClick={() => onChange({ parts: [...parts, { id: crypto.randomUUID(), content: '' }] })}
      >
        + Thêm ý
      </button>
    </details>
  );
}
