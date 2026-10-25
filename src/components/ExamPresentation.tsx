'use client';

import { useEffect, useState } from 'react';
import type { Exam } from '@/types/exam';
import { MathRenderer } from './MathRenderer';
import { FigureView } from './FigureView';
import { matchingDisplay, orderingDisplay } from '@/lib/structured-question';

export function ExamPresentation({ exam, onClose }: { exam: Exam; onClose: () => void }) {
  const [position, setPosition] = useState(0), [revealed, setRevealed] = useState('');
  const [fontSize, setFontSize] = useState(24);
  const index = Math.max(0, Math.min(position, exam.questions.length - 1));
  const question = exam.questions[index], signature = question ? JSON.stringify(question) : '';
  const showAnswer = Boolean(signature && revealed === signature);
  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return;
      if (event.key === 'ArrowRight') { event.preventDefault(); setPosition(p => Math.min(exam.questions.length - 1, p + 1)); setRevealed(''); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); setPosition(p => Math.max(0, p - 1)); setRevealed(''); }
    };
    window.addEventListener('keydown', handle); return () => window.removeEventListener('keydown', handle);
  }, [exam.questions.length, onClose]);
  if (!question) return null;
  const passage = exam.passages?.find(p => p.id === question.passageId), matching = matchingDisplay(question), ordering = orderingDisplay(question);
  return <div role="dialog" aria-modal="true" aria-label="Trình chiếu đề" className="exam-presentation fixed inset-0 z-60 bg-white text-slate-900 flex flex-col">
    <div className="p-4 border-b flex gap-4 items-center flex-wrap"><strong className="grow">{exam.metadata.title} · Câu {index + 1}/{exam.questions.length}</strong><button type="button" onClick={onClose}>Đóng trình chiếu (Esc)</button></div>
    <div className="p-3 border-b flex flex-wrap items-center justify-center gap-3">
      <label>Câu <select aria-label="Chọn câu trình chiếu" value={index} onChange={event => { setPosition(Number(event.target.value)); setRevealed(''); }} className="border rounded p-1">{exam.questions.map((q, i) => <option key={`${q.id}-${i}`} value={i}>{i + 1}</option>)}</select></label>
      <button type="button" disabled={fontSize <= 18} onClick={() => setFontSize(value => Math.max(18, value - 2))}>Chữ nhỏ hơn</button>
      <span aria-live="polite">{fontSize}px</span>
      <button type="button" disabled={fontSize >= 40} onClick={() => setFontSize(value => Math.min(40, value + 2))}>Chữ lớn hơn</button>
    </div>
    <div key={question.id} style={{ fontSize }} className="overflow-auto grow p-6 sm:p-10 leading-relaxed max-w-5xl w-full mx-auto">
      {passage && <details className="text-lg border rounded p-4 mb-6"><summary className="cursor-pointer">{passage.title || 'Ngữ liệu dùng chung'}</summary><MathRenderer content={passage.content} />{passage.figures?.map(f => <FigureView key={f.id} figure={f} forceLight />)}{passage.source && <p className="text-sm italic">{passage.source}</p>}</details>}
      <MathRenderer content={question.content} />
      {question.figures?.map(f => <FigureView key={f.id} figure={f} forceLight />)}
      {question.type === 'multiple_choice' && <div className="grid sm:grid-cols-2 gap-4 my-6">{question.choices?.map(c => <div key={c.key} className={`border rounded p-4 ${showAnswer && c.key === question.correct_answer ? 'bg-emerald-100 border-emerald-600' : ''}`}><b>{c.key}.</b> <MathRenderer content={c.text} inline /></div>)}</div>}
      {question.type === 'true_false_group' && <div className="my-6 space-y-3">{question.sub_questions?.map(s => <p key={s.key}><b>{s.key})</b> <MathRenderer content={s.content} inline />{showAnswer && <b className="ml-3">{s.isCorrect === undefined ? 'Chưa có đáp án' : s.isCorrect ? 'Đúng' : 'Sai'}</b>}</p>)}</div>}
      {matching && <div className="grid grid-cols-2 gap-4 my-6"><div><b>Cột A</b>{matching.left.map((s, i) => <p key={s.key}>{i + 1}. <MathRenderer content={s.text} inline /></p>)}</div><div><b>Cột B</b>{matching.right.map((s, i) => <p key={s.key}>{i + 1}. <MathRenderer content={s.text} inline /></p>)}</div></div>}
      {ordering && <div className="my-6">{ordering.items.map((s, i) => <p key={s.key}>{i + 1}. <MathRenderer content={s.text} inline /></p>)}</div>}
      {showAnswer && <section className="mt-8 p-5 border border-emerald-500 rounded bg-emerald-50"><h2 className="font-semibold">Đáp án / hướng dẫn</h2>
        {question.correct_answer && <MathRenderer content={question.correct_answer} />}
        {!question.correct_answer && Boolean(question.accepted_answers?.length) && <MathRenderer content={question.accepted_answers!.join(' / ')} />}
        {question.matchingPairs?.map((pair, i) => <p key={pair.id ?? i}><MathRenderer content={`${pair.left} ↔ ${pair.right}`} inline /></p>)}
        {Boolean(question.correctOrder?.length) && <MathRenderer content={question.correctOrder!.join(' → ')} />}
        <MathRenderer content={question.step_by_step_solution || 'Chưa có lời giải trong đề này.'} />
        {question.rubric?.map((r, i) => <p key={i}>{r.criterion} ({r.maxPoints} điểm)</p>)}
      </section>}
    </div>
    <div className="border-t p-4 flex gap-4 justify-center items-center flex-wrap"><button type="button" disabled={index === 0} onClick={() => { setPosition(index - 1); setRevealed(''); }}>← Câu trước</button><button type="button" className="border rounded px-4 py-2" onClick={() => setRevealed(showAnswer ? '' : signature)}>{showAnswer ? 'Ẩn đáp án' : 'Hiện đáp án / lời giải'}</button><button type="button" disabled={index === exam.questions.length - 1} onClick={() => { setPosition(index + 1); setRevealed(''); }}>Câu sau →</button></div>
  </div>;
}
