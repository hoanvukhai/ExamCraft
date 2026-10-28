'use client';

import { MatrixCards } from '@/components/editor/MatrixCards';
import { useState } from 'react';
import type { Exam, QuestionType } from '@/types/exam';
import { getCognitiveFramework } from '@/lib/education-catalog';
import {
  applyExamPlan,
  compareExamPlan,
  createExamPlan,
  examPlanContextStamp,
  formatHundredths,
  parseExamPlan,
  PLAN_TYPES,
  pointsToHundredths,
  type ExamPlan,
  type ExamPlanSlot,
} from '@/lib/exam-plan';

type Props = { embedded?: boolean; exam: Exam; onChange: (update: (previous: Exam) => Exam) => void };
type FormRow = Omit<ExamPlanSlot, 'count' | 'targetPointsHundredths'> & {
  countText: string;
  pointsText: string;
};
type Form = { header: Omit<ExamPlan, 'slots'>; rows: FormRow[]; baseStamp: string };
const names: Record<QuestionType, string> = {
  multiple_choice: 'Lựa chọn',
  true_false_group: 'Đúng / sai',
  short_answer: 'Trả lời ngắn',
  essay: 'Tự luận',
  fill_blank: 'Điền khuyết',
  matching: 'Ghép nối',
  ordering: 'Sắp xếp',
};
const field = 'min-w-0 w-full border rounded p-2 bg-transparent text-sm';
function toForm(plan: ExamPlan, exam: Exam): Form {
  const { slots, ...header } = plan;
  return {
    header,
    baseStamp: examPlanContextStamp(exam),
    rows: slots.map(({ count, targetPointsHundredths, ...slot }) => ({
      ...slot,
      countText: String(count),
      pointsText: targetPointsHundredths === null ? '' : formatHundredths(targetPointsHundredths),
    })),
  };
}
function fromForm(form: Form): ExamPlan {
  return parseExamPlan({
    ...form.header,
    slots: form.rows.map(({ countText, pointsText, ...slot }) => {
      if (!/^\d+$/.test(countText.trim()))
        throw Error('Số câu phải là số nguyên không âm; nhập 0 nếu không dùng dạng đó.');
      return {
        ...slot,
        count: Number(countText),
        targetPointsHundredths: pointsText.trim() === '' ? null : pointsToHundredths(pointsText),
      };
    }),
  });
}

export function ExamPlanEditor(props: Props) {
  return <PlanEditorContent key={props.exam.id} {...props} />;
}
function PlanEditorContent({ exam, onChange, embedded = false }: Props) {
  const [draft, setDraft] = useState<Form | null>(null),
    [error, setError] = useState('');
  const form = draft ?? toForm(exam.metadata.examPlan ?? createExamPlan(exam), exam);
  const framework = getCognitiveFramework(exam.metadata.cognitiveFrameworkId);
  const levels = framework?.grades.includes(exam.metadata.grade) ? framework.levels : [];
  const numeric = (exam.metadata.assessmentMode ?? 'scored') === 'scored';
  const canEdit = exam.access?.canEdit !== false;
  let comparison: ReturnType<typeof compareExamPlan> | null = null,
    formError = '';
  try {
    comparison = compareExamPlan(exam, fromForm(form));
  } catch (cause) {
    formError =
      cause instanceof Error && cause.name !== 'ZodError'
        ? cause.message
        : 'Kiểm tra các ô: tối đa 100 ô/1.000 câu, không trùng dạng–mức–yêu cầu; ô 0 câu không có điểm dương.';
  }
  const update = (id: string, change: Partial<FormRow>) => {
    setDraft({ ...form, rows: form.rows.map((row) => (row.id === id ? { ...row, ...change } : row)) });
    setError('');
  };
  return (
    <details open={embedded || undefined} className="border rounded-xl p-3 bg-[var(--ui-surface)]">
      <summary className={embedded ? 'hidden' : 'cursor-pointer text-sm font-semibold'}>Ma trận đề</summary>
      <p className="text-xs my-2">
        Tự đặt số câu và tổng điểm từng ô. Kế hoạch chỉ đối chiếu các nhãn đã gắn, không tự chia điểm hoặc
        chuyển câu vào ô. Để trống yêu cầu nghĩa là không ràng buộc yêu cầu; ô này có thể chồng với ô có yêu
        cầu cụ thể.
      </p>
      <p className="text-xs my-2">Điểm tối đa hai chữ số thập phân; chưa đặt điểm khác điểm 0.</p>
      {!numeric && (
        <p className="text-xs my-2">
          Bài nhận xét/rubric/khảo sát không đối chiếu điểm. Giữ các ô số câu; mục tiêu điểm cũ (nếu có) được
          báo để bạn chủ động rà soát.
        </p>
      )}
      <div className="space-y-3">
        {form.rows.map((row, index) => (
          <fieldset key={row.id} disabled={!canEdit} className="border rounded p-2">
            <legend className="text-xs">Ô {index + 1}</legend>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs">
                Dạng câu
                <select
                  className={field}
                  value={row.type}
                  onChange={(e) => update(row.id, { type: e.target.value as QuestionType })}
                >
                  {PLAN_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {names[type]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs">
                Mức nhận thức
                <select
                  className={field}
                  value={row.cognitiveLevel ?? ''}
                  onChange={(e) => update(row.id, { cognitiveLevel: e.target.value || null })}
                >
                  <option value="">Không gắn mức</option>
                  {row.cognitiveLevel && !levels.some((level) => level.id === row.cognitiveLevel) && (
                    <option value={row.cognitiveLevel}>Mã cũ cần rà soát: {row.cognitiveLevel}</option>
                  )}
                  {levels.map((level) => (
                    <option key={level.id} value={level.id}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs col-span-2">
                Yêu cầu cần đạt
                <select
                  className={field}
                  value={row.outcomeId ?? ''}
                  onChange={(e) => update(row.id, { outcomeId: e.target.value || undefined })}
                >
                  <option value="">Không ràng buộc yêu cầu</option>
                  {row.outcomeId &&
                    !exam.metadata.knowledgePackage?.outcomes.some((item) => item.id === row.outcomeId) && (
                      <option value={row.outcomeId}>Mã cũ cần rà soát: {row.outcomeId}</option>
                    )}
                  {exam.metadata.knowledgePackage?.outcomes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.text}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs">
                Số câu mục tiêu (có thể 0)
                <input
                  className={field}
                  inputMode="numeric"
                  value={row.countText}
                  onChange={(e) => update(row.id, { countText: e.target.value })}
                />
              </label>
              <label className="text-xs">
                Tổng điểm mục tiêu của ô
                <input
                  className={field}
                  inputMode="decimal"
                  placeholder={numeric ? 'Chưa đặt điểm' : 'Để trống: không chấm điểm'}
                  value={row.pointsText}
                  onChange={(e) => update(row.id, { pointsText: e.target.value })}
                />
              </label>
            </div>
            <button
              type="button"
              className="underline text-xs mt-2"
              onClick={() => setDraft({ ...form, rows: form.rows.filter((item) => item.id !== row.id) })}
            >
              Bỏ ô này
            </button>
          </fieldset>
        ))}
      </div>
      <button
        type="button"
        className="underline text-sm my-2 disabled:opacity-50"
        disabled={!canEdit || form.rows.length >= 100}
        onClick={() =>
          setDraft({
            ...form,
            rows: [
              ...form.rows,
              {
                id: crypto.randomUUID(),
                type: 'multiple_choice',
                cognitiveLevel: null,
                countText: '0',
                pointsText: numeric ? '0' : '',
              },
            ],
          })
        }
      >
        Thêm ô mục tiêu
      </button>
      {formError && (
        <p role="alert" className="text-sm text-red-600">
          {formError}
        </p>
      )}
      {draft && form.baseStamp !== examPlanContextStamp(exam) && (
        <p role="alert" className="text-sm text-amber-700">
          Kế hoạch hoặc ngữ cảnh trên đề đã đổi. Các ô nháp của bạn được giữ; đối chiếu bản mới và xác nhận rà
          soát ngữ cảnh trước khi áp dụng.
        </p>
      )}
      {comparison && (
        <div className="text-sm my-2" aria-live="polite">
          <p>
            {comparison.matches
              ? 'Số câu và điểm của từng ô khớp các nhãn hiện tại; vẫn cần duyệt nội dung.'
              : 'Kế hoạch cần đối chiếu; chưa thể xác nhận khớp.'}
          </p>
          {comparison.warnings.map((warning) => (
            <p key={warning} className="text-amber-700">
              {warning}
            </p>
          ))}
          <p className="my-2">
            Tổng câu: mục tiêu {comparison.targetCount}, thực tế {comparison.actualCount}.
            {numeric &&
              ` Tổng điểm mục tiêu ${comparison.targetPointsHundredths === null ? 'chưa đủ' : formatHundredths(comparison.targetPointsHundredths)}, điểm thực tế đã biết ${formatHundredths(comparison.actualKnownPointsHundredths)}.`}
          </p>
          <div className="sm:hidden">
            <MatrixCards
              title="Mục tiêu và thực tế"
              headers={[
                'Ô / yêu cầu',
                'Mục tiêu câu',
                'Khớp ô',
                'Lệch câu',
                ...(numeric ? ['Điểm mục tiêu', 'Điểm đã biết', 'Lệch điểm'] : []),
              ]}
              rows={comparison.rows.map((row, index) => [
                index +
                  1 +
                  '. ' +
                  names[row.slot.type] +
                  ' · ' +
                  (row.outcomeText ?? 'Không ràng buộc yêu cầu'),
                row.slot.count,
                row.actualCount,
                row.countDelta,
                ...(numeric
                  ? [
                      row.slot.targetPointsHundredths === null
                        ? 'Chưa đặt'
                        : formatHundredths(row.slot.targetPointsHundredths),
                      formatHundredths(row.knownPointsHundredths),
                      row.pointsDeltaHundredths === null
                        ? 'Chưa rõ'
                        : formatHundredths(row.pointsDeltaHundredths),
                    ]
                  : []),
              ])}
            />
          </div>
          <div className="hidden sm:block overflow-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left">Ô / đặc tả theo yêu cầu</th>
                  <th>Mục tiêu câu</th>
                  <th>Khớp ô</th>
                  <th>Lệch câu</th>
                  {numeric && (
                    <>
                      <th>Điểm mục tiêu</th>
                      <th>Điểm đã biết</th>
                      <th>Lệch điểm</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {comparison.rows.map((row, index) => (
                  <tr key={row.slot.id} className="border-t">
                    <td className="p-2">
                      {index + 1}. {names[row.slot.type]} ·{' '}
                      {row.outcomeText ??
                        (row.slot.outcomeId
                          ? `Chưa tìm thấy yêu cầu ${row.slot.outcomeId}`
                          : 'Không ràng buộc yêu cầu')}
                      {row.issues.map((issue) => (
                        <p key={issue} className="text-amber-700">
                          {issue}
                        </p>
                      ))}
                    </td>
                    <td>{row.slot.count}</td>
                    <td>{row.actualCount}</td>
                    <td>{row.countDelta}</td>
                    {numeric && (
                      <>
                        <td>
                          {row.slot.targetPointsHundredths === null
                            ? 'Chưa đặt'
                            : formatHundredths(row.slot.targetPointsHundredths)}
                        </td>
                        <td>
                          {formatHundredths(row.knownPointsHundredths)}
                          {(row.unknownPointIds.length > 0 || row.precisionPointIds.length > 0) &&
                            ' · chưa đủ'}
                        </td>
                        <td>
                          {row.pointsDeltaHundredths === null
                            ? 'Chưa rõ'
                            : formatHundredths(row.pointsDeltaHundredths)}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {comparison.unmatched.length > 0 && (
            <p className="my-2">
              Chưa khớp ô:{' '}
              {comparison.unmatched.map((item) => `Câu ${item.number}: ${item.reason}`).join('; ')}
            </p>
          )}
          {comparison.ambiguous.length > 0 && (
            <p className="my-2">
              Khớp nhiều ô, chưa phân vào ô nào:{' '}
              {comparison.ambiguous
                .map(
                  (item) =>
                    `Câu ${item.number} → ô ${item.slotIds.map((id) => form.rows.findIndex((row) => row.id === id) + 1).join(', ')}`,
                )
                .join('; ')}
            </p>
          )}
          {comparison.unknownPointIds.length > 0 && (
            <p>Chưa cấu hình điểm: {comparison.unknownPointIds.join(', ')}.</p>
          )}
          {comparison.precisionPointIds.length > 0 && (
            <p>
              Điểm vượt độ chính xác hai chữ số hoặc giới hạn: {comparison.precisionPointIds.join(', ')}. Chưa
              làm tròn hoặc đổi điểm.
            </p>
          )}
        </div>
      )}
      <p className="text-xs my-2">
        Mở Ma trận &amp; Đặc tả ở bản xem trước hoặc xuất Word chế độ ma trận để xem kế hoạch mục tiêu cùng
        bảng mô tả đề thực tế.
      </p>
      <div className="flex flex-wrap gap-3 text-sm">
        <button
          type="button"
          className="app-button-primary text-white rounded px-3 py-2 disabled:opacity-50"
          disabled={!canEdit || !!formError}
          onClick={() => {
            try {
              const plan = fromForm(form);
              const applied = applyExamPlan(exam, plan, form.baseStamp);
              onChange((previous) =>
                examPlanContextStamp(previous) === form.baseStamp && previous.access?.canEdit !== false
                  ? applyExamPlan(previous, plan, form.baseStamp)
                  : previous,
              );
              setDraft(toForm(plan, applied));
              setError('');
            } catch (cause) {
              setError(cause instanceof Error ? cause.message : 'Chưa áp dụng kế hoạch.');
            }
          }}
        >
          Áp dụng
        </button>
        <button
          type="button"
          disabled={!canEdit}
          onClick={() => {
            const { slots: _slots, ...header } = createExamPlan(exam);
            void _slots;
            setDraft({ ...form, header, baseStamp: examPlanContextStamp(exam) });
          }}
        >
          Xác nhận rà soát theo ngữ cảnh hiện tại, giữ các ô
        </button>
        <button
          type="button"
          onClick={() => {
            setDraft(null);
            setError('');
          }}
        >
          Bỏ thay đổi đang nhập
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600 my-2">
          {error}
        </p>
      )}
    </details>
  );
}
