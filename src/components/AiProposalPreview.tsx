'use client';

import type { Question } from '@/types/exam';
import { MathRenderer } from './MathRenderer';
import { FigureView } from './FigureView';

export function AiProposalPreview({ question, before }: { question: Question; before?: Question }) {
  const render = (q: Question) => (
    <div className="space-y-2">
      <MathRenderer content={q.content} />
      {q.figures?.map((figure) => (
        <FigureView key={figure.id} figure={figure} />
      ))}
      {q.choices?.map((choice) => (
        <div key={choice.key}>
          <b>{choice.key}.</b> <MathRenderer content={choice.text} inline />
          {choice.figures?.map((figure) => (
            <FigureView key={figure.id} figure={figure} />
          ))}
        </div>
      ))}
      {q.sub_questions?.map((sub) => (
        <div key={sub.key}>
          <b>{sub.key}.</b> <MathRenderer content={sub.content} inline />{' '}
          <span>
            ({sub.isCorrect === undefined ? 'Chưa có đáp án' : sub.isCorrect ? 'Đúng' : 'Sai'})
          </span>
        </div>
      ))}
      {q.parts?.map((part) => (
        <div key={part.id} className="border-l pl-3">
          <b>{part.label}</b>
          <MathRenderer content={part.content} />
          {part.answer && (
            <div>
              Đáp án: <MathRenderer content={part.answer} />
            </div>
          )}
          {part.solution && <MathRenderer content={part.solution} />}
          {part.rubric?.map((row, i) => (
            <p key={i}>
              {row.criterion}: {row.maxPoints} điểm
            </p>
          ))}
          {part.points !== undefined && <p>{part.points} điểm</p>}
        </div>
      ))}
      {q.accepted_answers?.length ? <p>Đáp án chấp nhận: {q.accepted_answers.join('; ')}</p> : null}
      {q.correct_answer && (
        <p>
          <b>Đáp án:</b> {q.correct_answer}
        </p>
      )}
      {q.matchingPairs?.map((pair, index) => (
        <p key={index}>
          {pair.left} → {pair.right}
        </p>
      ))}
      {q.correctOrder?.length ? <p>Thứ tự: {q.correctOrder.join(' → ')}</p> : null}
      {q.step_by_step_solution && (
        <div>
          <b>Lời giải:</b>
          <MathRenderer content={q.step_by_step_solution} />
        </div>
      )}
      {q.rubric?.map((row, index) => (
        <p key={index}>
          {row.criterion}: {row.maxPoints} điểm
        </p>
      ))}
      {q.points !== undefined && <p>Điểm câu: {q.points}</p>}
    </div>
  );
  return (
    <div className="my-2 space-y-3 max-h-96 overflow-auto text-sm">
      {before && (
        <details>
          <summary className="cursor-pointer font-medium">Xem bản hiện tại</summary>
          {render(before)}
        </details>
      )}
      <div className="p-2 rounded border bg-[var(--ui-surface)] text-[var(--ui-text-primary)]">
        <p className="font-semibold mb-2">Bản đề xuất</p>
        {render(question)}
      </div>
    </div>
  );
}
