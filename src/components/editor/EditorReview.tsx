'use client';
import { createPortal } from 'react-dom';
import { useSidePanel } from '@/hooks/useSidePanel';
import type { Exam } from '@/types/exam';
import { reviewExam } from '@/lib/exam-review';
import { formatHundredths } from '@/lib/exam-plan';
export function EditorReview({ exam, onClose, onContinue, onQuestion }: { exam: Exam; onClose: () => void; onContinue?: () => void; onQuestion: (id: string) => void }) {
  const { panelRef } = useSidePanel(true, onClose);
  const result = reviewExam(exam);
  return createPortal(<div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><section ref={panelRef} role="dialog" aria-modal="true" aria-label="Rà soát đề" className="app-dialog bg-[var(--ui-surface)] border rounded-xl p-5 max-w-2xl w-full max-h-[85dvh] overflow-auto space-y-4"><div className="flex justify-between"><h2>Rà soát đề · {result.issues.length} mục cần xem</h2><button type="button" onClick={onClose}>Đóng</button></div><p className="text-sm">Kiểm cấu trúc trên bản đang mở, không dùng AI; chưa xác nhận đúng sai kiến thức. Bạn có thể tiếp tục sau khi xem các lưu ý.</p><p className="text-sm">{result.questionCount} câu · Tổng điểm: {formatHundredths(result.knownPointsHundredths)}</p><ul aria-label="Các mục cần rà soát" className="space-y-3">{result.issues.map((issue, i) => { const index = /^Câu (\d+)/.exec(issue.location); const question = index && exam.questions[Number(index[1]) - 1]; return <li key={i} className="border rounded-lg p-3 text-sm"><strong>{issue.location} · {issue.severity === 'error' ? 'Cần sửa' : 'Cần xem'}:</strong> {issue.message}{question && <button type="button" className="underline ml-2" onClick={() => onQuestion(question.id)}>Đến câu {index![1]}</button>}</li>; })}</ul>{onContinue && <button type="button" className="app-button-primary p-3" onClick={onContinue}>Đã xem, tiếp tục</button>}</section></div>, document.body);
}
