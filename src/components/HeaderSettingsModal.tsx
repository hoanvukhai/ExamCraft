'use client';

import { useEffect, useState } from 'react';
import type { ExamMetadata } from '@/types/exam';
import { getCatalogSubjects, COGNITIVE_FRAMEWORKS } from '@/lib/education-catalog';
import {
  defaultHeaderLayout,
  headerEditableSnapshot,
  headerPatch,
  headerSubmissionApplied,
  headerSubmissionConflict,
  sameHeaderValue,
  validateHeaderSubmission,
  type HeaderSnapshot,
  type HeaderSubmission,
  type HeaderLayout,
} from '@/lib/header-layout';

export interface HeaderSettingsModalProps {
  embedded?: boolean;
  showFramework?: boolean;
  onPreview?: (submission: HeaderSubmission | null) => void;
  isOpen: boolean;
  onClose: () => void;
  metadata: ExamMetadata;
  documentId: string;
  ownerId: string;
  onSaveMetadata: (submission: HeaderSubmission) => void;
}
const field =
  'min-w-0 w-full border border-[var(--ui-border)] rounded-lg p-2.5 bg-[var(--ui-surface)] text-[var(--ui-text-primary)] text-xs focus:outline-none focus:ring-2 focus:ring-[var(--ui-primary)]/20 focus:border-[var(--ui-primary)] transition-all';
const labels = {
  schoolName: 'Đơn vị chủ quản',
  departmentName: 'Trường / tổ chuyên môn',
  title: 'Tên đề',
  examCode: 'Mã đề',
  academicYear: 'Năm học',
  semester: 'Học kỳ',
  notes: 'Ghi chú cuối đề',
  subjectGrade: 'Môn và lớp',
  durationScore: 'Thời gian và tổng điểm',
};

export function HeaderSettingsModal(props: HeaderSettingsModalProps) {
  return props.isOpen ? <HeaderForm key={`${props.ownerId}:${props.documentId}`} {...props} /> : null;
}
export function HeaderForm({
  metadata,
  documentId,
  onClose,
  onSaveMetadata,
  embedded,
  showFramework,
  onPreview,
}: HeaderSettingsModalProps) {
  const [base, setBase] = useState(() => headerEditableSnapshot(metadata));
  const [form, setForm] = useState(() => headerEditableSnapshot(metadata));
  const [submitted, setSubmitted] = useState<HeaderSubmission | null>(null),
    [error, setError] = useState('');
  const applied =
    submitted !== null &&
    headerSubmissionApplied(metadata, submitted) &&
    sameHeaderValue(form, { ...submitted.base, ...submitted.patch });
  const displayForm = applied ? headerEditableSnapshot(metadata) : form;
  const submission: HeaderSubmission = { documentId, base, patch: headerPatch(base, form) };
  const conflict =
    Object.keys(submission.patch).length > 0 && headerSubmissionConflict(metadata, submission) && !applied;
  const previewKey = JSON.stringify(submission);
  useEffect(() => {
    if (!onPreview) return;
    try {
      validateHeaderSubmission(submission);
      onPreview(conflict || applied ? null : submission);
    } catch {
      onPreview(null);
    }
    // The serialized value tracks the complete editable draft, without a callback loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewKey, conflict, applied, onPreview]);
  useEffect(() => () => onPreview?.(null), [onPreview]);
  const subjects = getCatalogSubjects(displayForm.grade),
    frameworks = COGNITIVE_FRAMEWORKS.filter((item) => item.grades.includes(displayForm.grade));
  const validSubject = subjects.some((item) => item.key === displayForm.subject),
    validFramework =
      !displayForm.cognitiveFrameworkId ||
      frameworks.some((item) => item.id === displayForm.cognitiveFrameworkId);
  const change = (patch: Partial<HeaderSnapshot>) => {
    if (applied) {
      const latest = headerEditableSnapshot(metadata);
      setBase(latest);
      setForm({ ...latest, ...patch });
      setSubmitted(null);
    } else setForm((previous) => ({ ...previous, ...patch }));
    setError('');
  };
  const layout = (applied ? metadata.headerLayout : form.headerLayout) ?? defaultHeaderLayout();
  const changeLine = (id: string, patch: Partial<HeaderLayout['lines'][number]>) =>
    change({
      headerLayout: {
        ...layout,
        lines: layout.lines.map((line) => (line.id === id ? { ...line, ...patch } : line)),
      },
    });
  const submit = () => {
    try {
      validateHeaderSubmission(submission);
      if (conflict)
        throw Error(
          'Một trường bạn sửa đã có giá trị mới. Nháp vẫn được giữ; hãy đối chiếu hoặc mở lại từ bản hiện tại.',
        );
      setSubmitted(submission);
      onSaveMetadata(submission);
      setError('');
    } catch (cause) {
      setError(
        cause instanceof Error && cause.name !== 'ZodError'
          ? cause.message
          : 'Kiểm tra tên đề, số phút và bố cục tối đa 30 dòng.',
      );
    }
  };
  return (
    <div
      className={
        embedded ? 'contents' : 'fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4'
      }
    >
      <div
        role={embedded ? undefined : 'dialog'}
        aria-modal={embedded ? undefined : true}
        aria-label="Tùy chỉnh tiêu đề"
        className={
          'bg-[var(--ui-surface)] rounded-xl w-full min-w-0 space-y-3 ' +
          (embedded ? 'p-1' : 'app-dialog max-w-2xl max-h-[90vh] overflow-auto p-5')
        }
      >
        {!embedded && (
          <div className="app-dialog-header flex justify-between gap-3">
            <h2 className="font-semibold">Tiêu đề và bố cục in</h2>
            <button type="button" onClick={onClose}>
              Đóng
            </button>
          </div>
        )}
        {onPreview && !embedded && (
          <p role="note" className="text-xs">
            Bản xem trước phản ánh thay đổi hợp lệ đang nhập. Bấm Áp dụng để lưu vào đề; Đóng vẫn giữ bản đang
            nhập trong phiên này.
          </p>
        )}
        {!embedded && (
          <p className="text-xs">
            Chỉ áp dụng các trường bạn sửa. Thay đổi phạm vi hoặc kế hoạch mới hơn được giữ. Đổi môn/lớp không
            tự đổi bộ kiến thức, kế hoạch hay khung mức.
          </p>
        )}
        {/* Cơ bản: bốn trường bắt buộc đứng đầu */}
        <div className="space-y-3 pt-1">
          <div className="pb-1 border-b border-[var(--ui-border)]/60">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--ui-text-secondary)]">
              Thông tin cơ bản
            </span>
          </div>
          <div className="space-y-3">
            <label className="text-xs font-medium text-[var(--ui-text-secondary)] space-y-1 block">
              <span>
                {labels.title} <b aria-hidden="true">*</b>
              </span>
              <input
                className={field}
                aria-label={labels.title}
                placeholder="VD: ĐỀ KIỂM TRA HỌC KỲ I..."
                value={displayForm.title ?? ''}
                onChange={(event) => change({ title: event.target.value })}
              />
            </label>

            <div className="grid grid-cols-1 @min-[400px]:grid-cols-2 gap-3">
              <label className="text-xs font-medium text-[var(--ui-text-secondary)] space-y-1 block">
                <span>
                  Lớp <b aria-hidden="true">*</b>
                </span>
                <select
                  className={field}
                  aria-label="Lớp của đề"
                  value={displayForm.grade}
                  onChange={(event) => change({ grade: Number(event.target.value) })}
                >
                  {Array.from({ length: 12 }, (_, index) => (
                    <option key={index + 1} value={index + 1}>
                      Lớp {index + 1}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs font-medium text-[var(--ui-text-secondary)] space-y-1 block">
                <span>
                  Môn <b aria-hidden="true">*</b>
                </span>
                <select
                  className={field}
                  aria-label="Môn của đề"
                  value={displayForm.subject}
                  onChange={(event) => change({ subject: event.target.value as ExamMetadata['subject'] })}
                >
                  {!validSubject && (
                    <option value={displayForm.subject}>Môn cũ cần chọn lại: {displayForm.subject}</option>
                  )}
                  {subjects.map((item) => (
                    <option key={item.key} value={item.key}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid grid-cols-1 @min-[400px]:grid-cols-2 gap-3">
              <label className="text-xs font-medium text-[var(--ui-text-secondary)] space-y-1 block">
                <span>
                  Cách đánh giá <b aria-hidden="true">*</b>
                </span>
                <select
                  className={field}
                  aria-label="Cách đánh giá"
                  value={displayForm.assessmentMode ?? 'scored'}
                  onChange={(event) =>
                    change({ assessmentMode: event.target.value as ExamMetadata['assessmentMode'] })
                  }
                >
                  <option value="scored">Có điểm</option>
                  <option value="comment_only">Nhận xét</option>
                  <option value="rubric">Theo tiêu chí</option>
                  <option value="survey">Khảo sát không chấm điểm</option>
                </select>
              </label>

              <label className="text-xs font-medium text-[var(--ui-text-secondary)] space-y-1 block">
                <span>Thời lượng (phút)</span>
                <input
                  className={field}
                  aria-label="Thời lượng"
                  type="number"
                  min={0}
                  max={1440}
                  placeholder="VD: 45, 60, 90..."
                  value={Number.isNaN(displayForm.durationMinutes) ? '' : displayForm.durationMinutes}
                  onChange={(event) =>
                    change({
                      durationMinutes: event.target.value === '' ? Number.NaN : Number(event.target.value),
                    })
                  }
                />
              </label>
            </div>
          </div>
        </div>

        {/* Cảnh báo ngữ cảnh nếu có */}
        {(!validSubject || !validFramework) && (
          <p
            role="alert"
            className="text-xs text-amber-700 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-2.5 rounded-lg"
          >
            Môn hoặc khung cũ không phù hợp lớp đang chọn. Hãy chọn lại rõ ràng; gói và kế hoạch được giữ để
            rà soát.
          </p>
        )}
        {(metadata.knowledgePackage || metadata.examPlan) &&
          (displayForm.grade !== base.grade ||
            displayForm.subject !== base.subject ||
            displayForm.assessmentMode !== base.assessmentMode ||
            displayForm.cognitiveFrameworkId !== base.cognitiveFrameworkId) && (
            <p className="text-xs text-amber-700 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-2.5 rounded-lg">
              Ngữ cảnh đánh giá đã đổi; kiểm cảnh báo ở gói kiến thức và kế hoạch sau khi áp dụng.
            </p>
          )}

        {/* Thông tin chỉ để in */}
        <div className="space-y-3 pt-2">
          <div className="pb-1 border-b border-[var(--ui-border)]/60">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--ui-text-secondary)]">
              Thông tin in
            </span>
          </div>
          <div className="grid grid-cols-1 @min-[400px]:grid-cols-2 gap-3">
            <label className="text-xs font-medium text-[var(--ui-text-secondary)] space-y-1 block">
              <span>{labels.schoolName}</span>
              <input
                className={field}
                aria-label={labels.schoolName}
                placeholder="VD: Sở Giáo dục và Đào tạo..."
                value={displayForm.schoolName ?? ''}
                onChange={(event) => change({ schoolName: event.target.value })}
              />
            </label>
            <label className="text-xs font-medium text-[var(--ui-text-secondary)] space-y-1 block">
              <span>{labels.departmentName}</span>
              <input
                className={field}
                aria-label={labels.departmentName}
                placeholder="VD: Trường THPT Chu Văn An / Tổ Toán..."
                value={displayForm.departmentName ?? ''}
                onChange={(event) => change({ departmentName: event.target.value })}
              />
            </label>
          </div>
          <div className="grid grid-cols-1 @min-[400px]:grid-cols-3 gap-3">
            <label className="text-xs font-medium text-[var(--ui-text-secondary)] space-y-1 block">
              <span>{labels.examCode}</span>
              <input
                className={field}
                aria-label={labels.examCode}
                placeholder="VD: 101, 102..."
                value={displayForm.examCode ?? ''}
                onChange={(event) => change({ examCode: event.target.value })}
              />
            </label>
            <label className="text-xs font-medium text-[var(--ui-text-secondary)] space-y-1 block">
              <span>{labels.academicYear}</span>
              <input
                className={field}
                aria-label={labels.academicYear}
                placeholder="VD: 2026 - 2027"
                value={displayForm.academicYear ?? ''}
                onChange={(event) => change({ academicYear: event.target.value })}
              />
            </label>
            <label className="text-xs font-medium text-[var(--ui-text-secondary)] space-y-1 block">
              <span>{labels.semester}</span>
              <input
                className={field}
                aria-label={labels.semester}
                placeholder="VD: Học kỳ I"
                value={displayForm.semester ?? ''}
                onChange={(event) => change({ semester: event.target.value })}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <label className="text-xs font-medium text-[var(--ui-text-secondary)] space-y-1 block @min-[400px]:col-span-2">
              <span>{labels.notes}</span>
              <input
                className={field}
                aria-label={labels.notes}
                placeholder="VD: Cán bộ coi thi không giải thích gì thêm..."
                value={displayForm.notes ?? ''}
                onChange={(event) => change({ notes: event.target.value })}
              />
            </label>
          </div>
        </div>

        {/* Yêu cầu ra đề */}
        <div className="space-y-3 pt-2">
          <div className="pb-1 border-b border-[var(--ui-border)]/60">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--ui-text-secondary)]">
              Yêu cầu ra đề
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {(!embedded || showFramework) && (
              <label className="text-xs font-medium text-[var(--ui-text-secondary)] space-y-1 block @min-[400px]:col-span-2">
                <span>Khung mức nhận thức</span>
                <select
                  className={field}
                  aria-label="Khung mức nhận thức"
                  value={displayForm.cognitiveFrameworkId ?? ''}
                  onChange={(event) => change({ cognitiveFrameworkId: event.target.value || undefined })}
                >
                  <option value="">Chưa chọn khung</option>
                  {!validFramework && (
                    <option value={displayForm.cognitiveFrameworkId}>
                      Khung cũ cần chọn lại: {displayForm.cognitiveFrameworkId}
                    </option>
                  )}
                  {frameworks.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </div>
        <details className="border-t border-[var(--ui-border)]/60 pt-3">
          <summary className="cursor-pointer font-medium text-xs text-[var(--ui-text-secondary)] hover:text-[var(--ui-text-primary)]">
            Dòng in, vị trí và căn chỉnh nâng cao
          </summary>
          <p className="text-xs my-2">
            Ẩn dòng sẽ bỏ dòng khi in; ghi đè bằng chuỗi rỗng vẫn chừa một dòng trống. Bỏ ghi đè để dùng dữ
            liệu đề. Tên đề để quản lý luôn cần có, kể cả khi ẩn tên trên bản in.
          </p>
          {layout.lines.map((line, index) => (
            <fieldset key={line.id} className="border rounded p-2 my-2 text-xs">
              <legend>
                {index + 1}. {line.binding ? labels[line.binding] : 'Dòng riêng'}
              </legend>
              <div className="flex flex-wrap gap-3 items-center">
                <label>
                  <input
                    type="checkbox"
                    checked={!line.hidden}
                    onChange={(event) => changeLine(line.id, { hidden: !event.target.checked })}
                  />{' '}
                  Hiện khi in
                </label>
                <label>
                  Vị trí
                  <select
                    className="border rounded p-1 bg-transparent"
                    value={line.area}
                    onChange={(event) =>
                      changeLine(line.id, {
                        area: event.target.value as HeaderLayout['lines'][number]['area'],
                      })
                    }
                  >
                    <option value="left">Trái</option>
                    <option value="right">Phải</option>
                    <option value="footer">Cuối đề</option>
                  </select>
                </label>
                <label>
                  Căn
                  <select
                    className="border rounded p-1 bg-transparent"
                    value={line.align}
                    onChange={(event) =>
                      changeLine(line.id, {
                        align: event.target.value as HeaderLayout['lines'][number]['align'],
                      })
                    }
                  >
                    <option value="left">Trái</option>
                    <option value="center">Giữa</option>
                    <option value="right">Phải</option>
                  </select>
                </label>
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => {
                    const lines = [...layout.lines];
                    [lines[index - 1], lines[index]] = [lines[index], lines[index - 1]];
                    change({ headerLayout: { ...layout, lines } });
                  }}
                >
                  Lên
                </button>
                <button
                  type="button"
                  disabled={index === layout.lines.length - 1}
                  onClick={() => {
                    const lines = [...layout.lines];
                    [lines[index + 1], lines[index]] = [lines[index], lines[index + 1]];
                    change({ headerLayout: { ...layout, lines } });
                  }}
                >
                  Xuống
                </button>
              </div>
              {line.binding ? (
                <>
                  <label className="block my-2">
                    <input
                      type="checkbox"
                      checked={line.override !== undefined}
                      onChange={(event) =>
                        changeLine(line.id, { override: event.target.checked ? '' : undefined })
                      }
                    />{' '}
                    Ghi đè dòng này (có thể để trống)
                  </label>
                  {line.override !== undefined && (
                    <input
                      className={field}
                      aria-label={`Ghi đè dòng ${index + 1}`}
                      maxLength={2000}
                      value={line.override}
                      onChange={(event) => changeLine(line.id, { override: event.target.value })}
                    />
                  )}
                </>
              ) : (
                <input
                  className={field}
                  aria-label={`Nội dung dòng ${index + 1}`}
                  maxLength={2000}
                  value={line.text ?? ''}
                  onChange={(event) => changeLine(line.id, { text: event.target.value })}
                />
              )}
              <button
                type="button"
                className="underline my-1"
                onClick={() =>
                  change({
                    headerLayout: { ...layout, lines: layout.lines.filter((item) => item.id !== line.id) },
                  })
                }
              >
                Bỏ dòng
              </button>
            </fieldset>
          ))}
          <button
            type="button"
            disabled={layout.lines.length >= 30}
            onClick={() =>
              change({
                headerLayout: {
                  ...layout,
                  lines: [
                    ...layout.lines,
                    { id: crypto.randomUUID(), area: 'right', align: 'center', hidden: false, text: '' },
                  ],
                },
              })
            }
          >
            Thêm dòng riêng
          </button>
        </details>
        {conflict && (
          <p role="alert" className="text-sm text-amber-700">
            Trường đang sửa đã đổi ở bản mới. Nháp của bạn vẫn giữ trong hộp này; chưa ghi đè.
          </p>
        )}
        {applied && (
          <p role="status" className="text-sm text-emerald-700">
            Đã áp dụng các trường vào bản soạn. Đề sẽ tự lưu trên máy chủ; xem trạng thái cạnh tên đề.
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            className="app-button-primary text-white rounded-lg px-4 py-2 text-xs font-semibold shadow-xs hover:shadow-sm disabled:opacity-40 transition-all cursor-pointer"
            disabled={applied || !Object.keys(submission.patch).length}
            onClick={submit}
          >
            Áp dụng
          </button>
          {!embedded && (
            <button
              type="button"
              className="text-xs text-[var(--ui-text-secondary)] hover:text-[var(--ui-text-primary)] hover:underline"
              onClick={onClose}
            >
              Đóng, giữ bản soạn hiện tại
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
