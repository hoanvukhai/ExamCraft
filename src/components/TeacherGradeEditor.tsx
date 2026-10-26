'use client';

import { buildGradeSubmission, initialCommentText, initialScoreText, isGradeDraftDirty, isPendingGrade, type EditableQuestion, type GradeDraft } from '@/lib/grade-history-restore';

interface Props {
  question: EditableQuestion & { questionId: string; gradeRevision: string };
  numeric: boolean;
  /** Draft lives in the page so it survives detail refreshes and history paging, not a full browser reload. */
  draft: GradeDraft | undefined;
  busy: boolean;
  onChange: (patch: Partial<Pick<GradeDraft, 'score' | 'comment'>>) => void;
  onSave: () => void;
  onDiscard: () => void;
}

const field = 'bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-lg px-2.5 py-1 text-[#202124] dark:text-[#e3e3e3]';

/** Score and teacher comment for one answer. Nothing is sent on blur, close or switch; only the Save button writes. */
export function TeacherGradeEditor({ question, numeric, draft, busy, onChange, onSave, onDiscard }: Props) {
  const score = draft?.score ?? initialScoreText(question, numeric), comment = draft?.comment ?? initialCommentText(question);
  const dirty = isGradeDraftDirty(question, draft, numeric);
  const stale = dirty && draft!.base !== question.gradeRevision;
  const built = dirty ? buildGradeSubmission(question, { score, comment }, numeric) : null;
  const pending = isPendingGrade(question, numeric);
  const id = `grade-${question.questionId}`;
  return (
    <div className="pt-2 space-y-2 text-xs" data-testid={`grade-editor-${question.questionId}`}>
      {numeric && (
        <div className="flex items-center gap-2">
          <label htmlFor={`${id}-score`} className="text-[#5f6368] dark:text-[#9aa0a6] font-semibold">Điểm câu này:</label>
          <input id={`${id}-score`} type="text" inputMode="decimal" disabled={busy} value={score} placeholder={pending ? 'Chưa chấm' : ''}
            onChange={event => onChange({ score: event.target.value })} className={`w-24 text-center font-bold ${field}`} />
          <span className="text-[#5f6368] dark:text-[#9aa0a6]">/ {question.points}đ</span>
          {pending && !dirty && <span className="text-[#b06000]">Đang chờ chấm; chưa có điểm nào được ghi.</span>}
        </div>
      )}
      <div>
        <label htmlFor={`${id}-comment`} className="block text-[#5f6368] dark:text-[#9aa0a6] font-semibold mb-1">{numeric ? 'Nhận xét của giáo viên (không bắt buộc):' : 'Nhận xét của giáo viên:'}</label>
        <textarea id={`${id}-comment`} rows={2} maxLength={5000} disabled={busy} value={comment} onChange={event => onChange({ comment: event.target.value })} className={`w-full ${field}`} />
      </div>
      {stale && <p role="status" className="p-2 rounded-lg bg-amber-50 text-amber-900 border border-amber-300">Điểm hoặc nhận xét của câu này đã đổi (lưu ở nơi khác hoặc khôi phục) sau khi bạn bắt đầu sửa. Bản bạn đang nhập vẫn được giữ, nhưng chưa thể lưu đè. Hãy bỏ bản nhập để dùng giá trị hiện tại rồi sửa lại nếu cần.</p>}
      {dirty && built && !built.ok && !stale && <p role="status" className="text-[#b06000]">{built.message}</p>}
      <div className="flex items-center gap-2">
        <button type="button" onClick={onSave} disabled={busy || !dirty || stale || !built?.ok} className="px-3 py-1 rounded-lg app-button-primary text-white font-semibold disabled:opacity-40 cursor-pointer">{busy ? 'Đang lưu...' : numeric ? 'Lưu điểm và nhận xét' : 'Lưu nhận xét'}</button>
        {dirty && <button type="button" onClick={onDiscard} disabled={busy} className="px-3 py-1 rounded-lg border cursor-pointer disabled:opacity-40">{stale ? 'Bỏ bản nhập, dùng giá trị hiện tại' : 'Bỏ thay đổi'}</button>}
        <span className="text-[#5f6368] dark:text-[#9aa0a6]">{dirty ? 'Có thay đổi chưa lưu.' : 'Chưa có thay đổi.'}</span>
      </div>
    </div>
  );
}
