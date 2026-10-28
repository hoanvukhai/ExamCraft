import type { ReactNode } from 'react';
import type { Exam } from '@/types/exam';
export function EditorQuestionHeading({
  exam,
  points,
  children,
}: {
  exam: Exam;
  points: number;
  children: ReactNode;
}) {
  return (
    <header className="flex flex-wrap gap-3 items-center justify-between py-2">
      <div>
        <h2 className="font-semibold">
          Nội dung đề{exam.questions.length > 0 ? ` · ${exam.questions.length} câu` : ''}
        </h2>
        {exam.questions.length > 0 && (
          <p className="text-xs text-[var(--ui-text-secondary)]">
            {['comment_only', 'survey'].includes(exam.metadata.assessmentMode ?? '')
              ? 'Không chấm điểm số'
              : `Tổng điểm: ${points}`}
          </p>
        )}
      </div>
      {children}
    </header>
  );
}
