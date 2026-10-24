'use client';

import type { Question } from '@/types/exam';
import { MathRenderer } from './MathRenderer';

export function AiProposalPreview({ question, before }: { question: Question; before?: Question }) {
  const render = (q: Question) => <div className="space-y-2">
    <MathRenderer content={q.content} />
    {q.choices?.map(choice => <div key={choice.key}><b>{choice.key}.</b> <MathRenderer content={choice.text} inline /></div>)}
    {q.sub_questions?.map(sub => <div key={sub.key}><b>{sub.key}.</b> <MathRenderer content={sub.content} inline /> <span>({sub.isCorrect === undefined ? 'Chưa có đáp án' : sub.isCorrect ? 'Đúng' : 'Sai'})</span></div>)}
    {q.correct_answer && <p><b>Đáp án:</b> {q.correct_answer}</p>}
    {q.matchingPairs?.map((pair, index) => <p key={index}>{pair.left} → {pair.right}</p>)}
    {q.correctOrder?.length ? <p>Thứ tự: {q.correctOrder.join(' → ')}</p> : null}
    {q.step_by_step_solution && <div><b>Lời giải:</b><MathRenderer content={q.step_by_step_solution} /></div>}
    {q.rubric?.map((row, index) => <p key={index}>{row.criterion}: {row.maxPoints} điểm</p>)}
    {q.points !== undefined && <p>Điểm câu: {q.points}</p>}
  </div>;
  return <div className="my-2 space-y-3 max-h-96 overflow-auto text-sm">
    {before && <details><summary className="cursor-pointer font-medium">Xem bản hiện tại</summary>{render(before)}</details>}
    <div className="p-2 rounded border bg-white"><p className="font-semibold mb-2">Bản đề xuất</p>{render(question)}</div>
  </div>;
}
