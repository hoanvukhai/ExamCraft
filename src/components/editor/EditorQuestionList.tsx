'use client';
import type { ReactNode } from 'react';
import type { Exam, Question } from '@/types/exam';
import { MathRenderer } from '@/components/MathRenderer';
import { FigureView } from '@/components/FigureView';
export function EditorQuestionList({ exam, renderQuestion }: { exam: Exam; renderQuestion: (question: Question, index: number) => ReactNode }) {
  return <>{exam.questions.map((question, index) => { const passage = question.passageId !== exam.questions[index - 1]?.passageId && exam.passages?.find(item => item.id === question.passageId); return <div key={question.id} id={`editor-question-${question.id}`} tabIndex={-1} className="space-y-3 scroll-mt-4">{passage && <section className="border rounded-xl p-4 bg-[var(--ui-surface)]" aria-label={passage.title || 'Ngữ liệu dùng chung'}><h3 className="font-semibold text-sm mb-2">{passage.title || 'Ngữ liệu dùng chung'}</h3><MathRenderer content={passage.content} />{passage.figures?.map(figure => <FigureView key={figure.id} figure={figure} />)}</section>}{renderQuestion(question, index)}</div>; })}</>;
}
export function EditorQuestionHeading({ exam, points, children }: { exam: Exam; points: number; children: ReactNode }) {
  return <header className="flex flex-wrap gap-3 items-center justify-between border rounded-xl p-4 bg-[var(--ui-surface)]"><div><h2 className="font-semibold">Câu hỏi ({exam.questions.length})</h2><p className="text-xs text-[var(--ui-text-secondary)]">{['comment_only','survey'].includes(exam.metadata.assessmentMode ?? '') ? 'Không chấm điểm số' : `${points} điểm đã gán`}</p></div>{children}</header>;
}
