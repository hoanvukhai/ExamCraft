'use client';

import { useEffect, useRef, useState } from 'react';
import type { Question } from '@/types/exam';
import { MathRenderer } from './MathRenderer';
import { prepareQuestionAiSubmission, questionAiBaseMatches, type QuestionAiBase } from '@/lib/question-ai-review';
import { sameQuestionSourceStamp, questionValueStamp, type QuestionManualSubmission } from '@/lib/question-draft';

export function QuestionAiReview({ base, candidate, ownerId, documentId, sourceStamp, question, onSubmit, onApplied, onDiscard }: {
  base: QuestionAiBase; candidate: Question; ownerId: string; documentId: string; sourceStamp: string; question: Question;
  onSubmit: (submission: QuestionManualSubmission) => void; onApplied: (before: Question, after: Question) => void; onDiscard: () => void;
}) {
  const [attempt, setAttempt] = useState<QuestionManualSubmission | null>(null);
  const [message, setMessage] = useState('');
  const appliedToken = useRef<string | null>(null);
  const acknowledged = !!attempt && ownerId === base.ownerId && documentId === base.documentId && sameQuestionSourceStamp(sourceStamp, base.sourceStamp) && questionValueStamp(question) === questionValueStamp(attempt.value);
  const stale = !acknowledged && !questionAiBaseMatches(base, ownerId, documentId, sourceStamp, question);
  useEffect(() => {
    if (acknowledged && attempt && appliedToken.current !== attempt.token) {
      appliedToken.current = attempt.token;
      onApplied(base.question, attempt.value);
    }
  }, [acknowledged, attempt, base.question, onApplied]);
  const apply = () => {
    try {
      const submission = prepareQuestionAiSubmission(base, candidate, ownerId, documentId, sourceStamp, question);
      if (!submission) { setMessage('Câu hoặc phạm vi đã đổi. Đề xuất vẫn giữ để đối chiếu; hãy gửi yêu cầu mới nếu muốn sửa bản hiện tại.'); return; }
      setAttempt(submission);
      setMessage('Đã gửi thay đổi vào bản soạn. Đề xuất chỉ đóng khi bản soạn xác nhận nhận đúng nội dung; nếu bị từ chối, đề xuất vẫn ở đây.');
      onSubmit(submission);
    } catch { setMessage('Đề xuất chưa hợp lệ, chưa áp dụng. Có thể tải lại để đối chiếu hoặc giữ câu hiện tại.'); }
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ base, candidate }, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'examcraft-de-xuat-cau.json'; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <section aria-label="Đề xuất sửa câu của AI" className="m-3 p-3.5 rounded-xl border border-amber-400 space-y-3 text-sm">
    <h3 className="font-semibold">Đề xuất của AI — giáo viên xem trước rồi chọn áp dụng</h3>
    {stale && <p role="alert">Câu hoặc phạm vi đã thay đổi từ khi gửi AI. Chưa áp dụng để giữ bản mới; đề xuất vẫn ở đây để đối chiếu hoặc tải về.</p>}
    {message && <p role="status">{message}</p>}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <QuestionReviewBody label="Câu hiện tại" question={question} />
      <QuestionReviewBody label="Câu AI đề xuất" question={candidate} />
    </div>
    <div className="flex flex-wrap gap-3"><button type="button" disabled={stale || acknowledged} onClick={apply} className="px-4 py-2 rounded app-button-primary disabled:opacity-50">Chấp nhận thay đổi</button><button type="button" onClick={download}>Tải đề xuất</button><button type="button" onClick={onDiscard}>Giữ câu hiện tại, cất đề xuất</button></div>
    <p className="text-xs">Bản đối chiếu có trong mục Đề xuất AI trên máy, kể cả sau khi cất hoặc áp dụng. Có thể tải về để dự phòng; việc áp dụng vào bản soạn chưa phải xác nhận lưu máy chủ.</p>
    <p className="text-xs">Giữ điểm, vị trí và liên kết kiến thức của câu. Nội dung, hình và tiêu chí chấm vẫn cần giáo viên kiểm tra lại sau khi áp dụng.</p>
  </section>;
}

function QuestionReviewBody({ label, question }: { label: string; question: Question }) {
  return <div className="min-w-0 space-y-2"><p className="font-semibold">{label}</p><MathRenderer content={question.content} />
    {question.choices?.map(choice => <p key={choice.key}>{choice.key}. <MathRenderer content={choice.text} inline /></p>)}
    {question.sub_questions?.map(item => <p key={item.key}>{item.key}. <MathRenderer content={item.content} inline /> — {item.isCorrect === undefined ? 'Chưa có đáp án' : item.isCorrect ? 'Đúng' : 'Sai'}</p>)}
    <p>Đáp án: {question.correct_answer ?? 'Chưa có'}</p>
    {!!question.accepted_answers?.length && <p>Chấp nhận: {question.accepted_answers.join('; ')}</p>}
    <p className="font-semibold">Lời giải / hướng dẫn</p><MathRenderer content={question.step_by_step_solution ?? ''} />
  </div>;
}
