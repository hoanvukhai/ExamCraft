'use client';

import type { Exam } from '@/types/exam';
import { reviewExam } from '@/lib/exam-review';
import { formatHundredths } from '@/lib/exam-plan';

export function ExamReviewPanel({ exam }: { exam: Exam }) {
  const result = reviewExam(exam);
  return <details className="no-print border-b bg-white dark:bg-[#202124] px-4 py-3 text-sm">
    <summary className="cursor-pointer font-medium">Rà soát đề · {result.issues.length ? `${result.issues.length} mục cần xem` : 'Chưa thấy lỗi cấu trúc'}</summary>
    <p className="my-2">{result.questionCount} câu. {result.numeric ? `${result.pointsComplete ? 'Tổng điểm' : 'Điểm đã biết (chưa đủ)'}: ${formatHundredths(result.knownPointsHundredths)}.` : 'Bài không chấm điểm: không yêu cầu đáp án đúng hoặc tổng điểm.'}</p>
    <p className="mb-2">Kiểm trên bản đang mở, không dùng AI. Chưa kiểm đúng sai kiến thức hoặc khả năng tải ảnh. Bạn vẫn có thể lưu nháp để sửa tiếp.</p>
    {result.issues.length > 0 && <ul className="space-y-2 max-h-80 overflow-auto" aria-label="Các mục cần rà soát">{result.issues.map((issue, i) => <li key={`${issue.code}-${i}`}><strong>{issue.location} · {issue.severity === 'error' ? 'Cần sửa' : 'Cần xem'}:</strong> {issue.message}</li>)}</ul>}
  </details>;
}
