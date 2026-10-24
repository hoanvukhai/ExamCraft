'use client';

import { useEffect, useRef, useState } from 'react';
import type { Exam } from '@/types/exam';
import { AiProposalPreview } from './AiProposalPreview';
import { copilotBaseMatches, copilotQuestionsStamp, prepareCopilotSubmission, type CopilotActionResult, type CopilotBase, type CopilotSubmission } from '@/lib/copilot-submission';
import { questionDraftSourceStamp } from '@/lib/question-draft';

export function CopilotProposalReview({ base, result, ownerId, exam, onSubmit, onApplied, onDiscard }: {
  base: CopilotBase; result: CopilotActionResult; ownerId: string; exam: Exam;
  onSubmit: (submission: CopilotSubmission) => void; onApplied: (submission: CopilotSubmission) => void; onDiscard: () => void;
}) {
  const [attempt, setAttempt] = useState<CopilotSubmission | null>(null);
  const [message, setMessage] = useState('');
  const applied = useRef<string | null>(null);
  const acknowledged = !!attempt && ownerId === base.ownerId && exam.id === base.documentId && questionDraftSourceStamp(exam) === base.sourceStamp && copilotQuestionsStamp(exam.questions) === copilotQuestionsStamp(attempt.questions);
  const stale = !acknowledged && !copilotBaseMatches(base, ownerId, exam);
  const preview = result.modifiedQuestion ? { ...result.modifiedQuestion, points: result.action === 'modify_single_question' ? base.questions.find(question => question.id === result.targetQuestionId)?.points : undefined } : undefined;
  useEffect(() => {
    if (acknowledged && attempt && applied.current !== attempt.token) { applied.current = attempt.token; onApplied(attempt); }
  }, [acknowledged, attempt, onApplied]);
  const apply = () => {
    const submission = prepareCopilotSubmission(base, result, ownerId, exam);
    if (!submission) { setMessage('Đề xuất chưa hợp lệ hoặc bản nền đã đổi. Chưa áp dụng; đề xuất vẫn được giữ để đối chiếu.'); return; }
    setAttempt(submission); setMessage('Đã gửi thay đổi. Chỉ đóng đề xuất khi bản soạn xác nhận nhận đúng nội dung.'); onSubmit(submission);
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ base, result }, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'examcraft-de-xuat-bien-tap.json'; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <section className="m-3 p-3 border rounded-xl text-sm space-y-3 overflow-auto" aria-label="Đề xuất AI chưa áp dụng">
    <p>{result.explanation || 'Đề xuất biên tập đề — giáo viên duyệt trước khi áp dụng'}</p>
    {stale && <p role="alert">Câu, thứ tự hoặc phạm vi đã đổi từ khi gửi AI. Chưa áp dụng để giữ bản mới; đề xuất vẫn ở đây.</p>}
    {message && <p role="status">{message}</p>}
    {result.action === 'delete_question' && <p>Đề xuất bỏ câu: {base.questions.find(question => question.id === result.targetQuestionId)?.content ?? 'Chưa xác định câu'}. Chỉ bỏ khỏi bản soạn khi bấm Áp dụng.</p>}
    {preview && <AiProposalPreview question={preview} before={exam.questions.find(question => question.id === result.targetQuestionId)} />}
    <div className="flex flex-wrap gap-3"><button type="button" disabled={stale || acknowledged} onClick={apply}>Áp dụng</button><button type="button" onClick={download}>Tải đề xuất</button><button type="button" onClick={onDiscard}>Cất đề xuất</button></div>
    <p className="text-xs">Bản đối chiếu có trong mục Đề xuất AI trên máy, kể cả sau khi cất hoặc áp dụng. Tải về để dự phòng; áp dụng vào bản soạn chưa phải xác nhận lưu máy chủ.</p>
    <p className="text-xs">Sửa câu giữ điểm và liên kết hiện có. Câu thêm mới chưa đặt điểm hoặc gắn phần/ngữ liệu; giáo viên cấu hình sau khi kiểm tra.</p>
  </section>;
}
