'use client';
import { outlineView } from '@/lib/outline-view';
import { StructureBlocks, QuestionParts } from '@/components/editor/StructureBlocks';

import { useEffect, useRef, useState } from 'react';
import type { Exam } from '@/types/exam';
import { MathRenderer } from './MathRenderer';
import { FigureView } from './FigureView';
import { matchingDisplay, orderingDisplay } from '@/lib/structured-question';

/** Going through the exam on a projector: one question at a time, big letters, the answer only when asked. It never changes the exam. */
export function ExamPresentation({
  exam: sourceExam,
  onClose,
  startQuestionId,
}: {
  exam: Exam;
  onClose: () => void;
  /** Start from this question instead of the first. */
  startQuestionId?: string;
}) {
  const structure = outlineView(sourceExam);
  const exam = { ...sourceExam, questions: structure.questions };
  const [position, setPosition] = useState(() =>
    Math.max(0, structure.questions.findIndex((question) => question.id === startQuestionId)),
  );
  const [revealed, setRevealed] = useState('');
  const [fontSize, setFontSize] = useState(24);
  const [showPassage, setShowPassage] = useState(true);
  const root = useRef<HTMLDivElement>(null);
  const index = Math.max(0, Math.min(position, exam.questions.length - 1));
  const question = exam.questions[index],
    signature = question ? JSON.stringify(question) : '';
  const showAnswer = Boolean(signature && revealed === signature);
  // The number printed on the exam, which restarts in a part that restarts its numbering.
  const numberOf = (id: string, at: number) => structure.numbers.get(id) ?? at + 1;
  const go = (to: number) => {
    setPosition(Math.max(0, Math.min(exam.questions.length - 1, to)));
    setRevealed('');
  };
  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
      )
        return;
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        setPosition((p) => Math.min(exam.questions.length - 1, p + 1));
        setRevealed('');
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setPosition((p) => Math.max(0, p - 1));
        setRevealed('');
      }
      if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault();
        setPosition(event.key === 'Home' ? 0 : exam.questions.length - 1);
        setRevealed('');
      }
      if (event.key === ' ' && !(target instanceof HTMLElement && target.tagName === 'BUTTON')) {
        event.preventDefault();
        setRevealed((current) => (current ? '' : signature));
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [exam.questions.length, onClose, signature]);
  if (!question) return null;
  const passage = exam.passages?.find((p) => p.id === question.passageId),
    matching = matchingDisplay(question),
    ordering = orderingDisplay(question);
  const passageBox = passage && showPassage && (
    <section aria-label="Ngữ liệu" className="text-lg border rounded p-4 mb-6 lg:mb-0 lg:max-h-full lg:overflow-auto">
      <h2 className="font-semibold">{passage.title || 'Ngữ liệu dùng chung'}</h2>
      <MathRenderer content={passage.content} />
      {passage.figures?.map((f) => (
        <FigureView key={f.id} figure={f} forceLight />
      ))}
      {passage.source && <p className="text-sm italic">{passage.source}</p>}
    </section>
  );
  return (
    <div
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-label="Trình chiếu đề"
      className="exam-presentation fixed inset-0 z-60 bg-white text-slate-900 flex flex-col"
    >
      <div className="p-4 border-b flex gap-4 items-center flex-wrap">
        <strong className="grow">
          {exam.metadata.title} · Câu {numberOf(question.id, index)}/{exam.questions.length}
        </strong>
        <button
          type="button"
          onClick={() => {
            if (document.fullscreenElement) void document.exitFullscreen();
            else void root.current?.requestFullscreen?.().catch(() => {});
          }}
        >
          Toàn màn hình
        </button>
        <button type="button" onClick={onClose}>
          Đóng trình chiếu (Esc)
        </button>
      </div>
      <div className="p-3 border-b flex flex-wrap items-center justify-center gap-3">
        <label>
          Câu{' '}
          <select
            aria-label="Chọn câu trình chiếu"
            value={index}
            onChange={(event) => go(Number(event.target.value))}
            className="border rounded p-1"
          >
            {exam.questions.map((q, i) => (
              <option key={`${q.id}-${i}`} value={i}>
                {numberOf(q.id, i)}
              </option>
            ))}
          </select>
        </label>
        {passage && (
          <button type="button" aria-pressed={showPassage} onClick={() => setShowPassage((value) => !value)}>
            {showPassage ? 'Ẩn ngữ liệu' : 'Hiện ngữ liệu'}
          </button>
        )}
        <button
          type="button"
          disabled={fontSize <= 18}
          onClick={() => setFontSize((value) => Math.max(18, value - 2))}
        >
          Chữ nhỏ hơn
        </button>
        <span aria-live="polite">{fontSize}px</span>
        <button
          type="button"
          disabled={fontSize >= 40}
          onClick={() => setFontSize((value) => Math.min(40, value + 2))}
        >
          Chữ lớn hơn
        </button>
      </div>
      <div
        key={question.id}
        style={{ fontSize }}
        className={`overflow-auto grow p-6 sm:p-10 leading-relaxed w-full mx-auto ${
          passage && showPassage ? 'max-w-7xl lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-8' : 'max-w-5xl'
        }`}
      >
        {passageBox}
        <div className="min-w-0">
          <StructureBlocks
            blocks={(structure.before.get(question.id) ?? []).filter((block) => !block.passage)}
            light
          />
          <MathRenderer content={question.content} />
          <QuestionParts question={question} number={structure.numbers.get(question.id)} />
          {question.figures?.map((f) => (
            <FigureView key={f.id} figure={f} forceLight />
          ))}
          {question.type === 'multiple_choice' && (
            <div className="grid sm:grid-cols-2 gap-4 my-6">
              {question.choices?.map((c) => (
                <div
                  key={c.key}
                  className={`border rounded p-4 ${showAnswer && c.key === question.correct_answer ? 'bg-emerald-100 border-emerald-600' : ''}`}
                >
                  <b>{c.key}.</b> <MathRenderer content={c.text} inline />
                  {c.figures?.map((figure) => (
                    <FigureView key={figure.id} figure={figure} forceLight />
                  ))}
                </div>
              ))}
            </div>
          )}
          {question.type === 'true_false_group' && (
            <div className="my-6 space-y-3">
              {question.sub_questions?.map((s) => (
                <p key={s.key}>
                  <b>{s.key})</b> <MathRenderer content={s.content} inline />
                  {showAnswer && (
                    <b className="ml-3">
                      {s.isCorrect === undefined ? 'Chưa có đáp án' : s.isCorrect ? 'Đúng' : 'Sai'}
                    </b>
                  )}
                </p>
              ))}
            </div>
          )}
          {matching && (
            <div className="grid grid-cols-2 gap-4 my-6">
              <div>
                <b>Cột A</b>
                {matching.left.map((s, i) => (
                  <p key={s.key}>
                    {i + 1}. <MathRenderer content={s.text} inline />
                  </p>
                ))}
              </div>
              <div>
                <b>Cột B</b>
                {matching.right.map((s, i) => (
                  <p key={s.key}>
                    {i + 1}. <MathRenderer content={s.text} inline />
                  </p>
                ))}
              </div>
            </div>
          )}
          {ordering && (
            <div className="my-6">
              {ordering.items.map((s, i) => (
                <p key={s.key}>
                  {i + 1}. <MathRenderer content={s.text} inline />
                </p>
              ))}
            </div>
          )}
          {showAnswer && (
            <section className="mt-8 p-5 border border-emerald-500 rounded bg-emerald-50">
              <h2 className="font-semibold">Đáp án / hướng dẫn</h2>
              <QuestionParts
                question={question}
                number={structure.numbers.get(question.id)}
                reveal="solutions"
              />
              {question.correct_answer && <MathRenderer content={question.correct_answer} />}
              {!question.correct_answer && Boolean(question.accepted_answers?.length) && (
                <MathRenderer content={question.accepted_answers!.join(' / ')} />
              )}
              {question.matchingPairs?.map((pair, i) => (
                <p key={pair.id ?? i}>
                  <MathRenderer content={`${pair.left} ↔ ${pair.right}`} inline />
                </p>
              ))}
              {Boolean(question.correctOrder?.length) && (
                <MathRenderer content={question.correctOrder!.join(' → ')} />
              )}
              <MathRenderer content={question.step_by_step_solution || 'Chưa có lời giải trong đề này.'} />
              {question.rubric?.map((r, i) => (
                <p key={i}>
                  {r.criterion} ({r.maxPoints} điểm)
                </p>
              ))}
            </section>
          )}
        </div>
      </div>
      <div className="border-t p-4 flex gap-4 justify-center items-center flex-wrap">
        <button type="button" disabled={index === 0} onClick={() => go(index - 1)}>
          ← Câu trước
        </button>
        <button
          type="button"
          className="border rounded px-4 py-2"
          onClick={() => setRevealed(showAnswer ? '' : signature)}
        >
          {showAnswer ? 'Ẩn đáp án' : 'Hiện đáp án / lời giải'}
        </button>
        <button type="button" disabled={index === exam.questions.length - 1} onClick={() => go(index + 1)}>
          Câu sau →
        </button>
      </div>
    </div>
  );
}
