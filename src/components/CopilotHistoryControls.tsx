'use client';
import { useEffect, useRef, useState } from 'react';
import type { Exam } from '@/types/exam';
import { copilotQuestionsStamp, type CopilotSubmission } from '@/lib/copilot-submission';
import { prepareCopilotTravel, type CopilotHistory } from '@/lib/copilot-history';
import { questionDraftSourceStamp } from '@/lib/question-draft';

export function CopilotHistoryControls({ history, ownerId, exam, disabled, onSubmit, onConfirmed }: {
  history: CopilotHistory; ownerId: string; exam: Exam; disabled: boolean; onSubmit: (submission: CopilotSubmission) => void;
  onConfirmed: (entryId: string, direction: 'undo' | 'redo', submission: CopilotSubmission) => void;
}) {
  const [attempt, setAttempt] = useState<{ entryId: string; direction: 'undo' | 'redo'; submission: CopilotSubmission } | null>(null), [message, setMessage] = useState('');
  const acknowledgedToken = useRef<string | null>(null);
  const acknowledged = !!attempt && attempt.submission.base.ownerId === ownerId && attempt.submission.base.documentId === exam.id && attempt.submission.base.sourceStamp === questionDraftSourceStamp(exam) && copilotQuestionsStamp(attempt.submission.questions) === copilotQuestionsStamp(exam.questions);
  useEffect(() => {
    if (acknowledged && attempt && acknowledgedToken.current !== attempt.submission.token) { acknowledgedToken.current = attempt.submission.token; onConfirmed(attempt.entryId, attempt.direction, attempt.submission); }
  }, [acknowledged, attempt, onConfirmed]);
  const travel = (direction: 'undo' | 'redo') => {
    const entry = (direction === 'undo' ? history.undo : history.redo).at(-1); if (!entry) return;
    const submission = prepareCopilotTravel(entry, direction, ownerId, exam);
    if (!submission) { setMessage('Đề hoặc phạm vi đã đổi sau thao tác này. Chưa hoàn tác/làm lại để giữ bản mới; hãy đối chiếu lịch sử.'); return; }
    setAttempt({ entryId: entry.id, direction, submission }); setMessage('Đang chờ bản soạn xác nhận thay đổi; chưa đổi mốc lịch sử.'); onSubmit(submission);
  };
  return <div className="p-3 border-b text-sm"><div className="flex flex-wrap gap-3"><button type="button" disabled={disabled || acknowledged || !history.undo.length} onClick={() => travel('undo')}>Hoàn tác Copilot ({history.undo.length})</button><button type="button" disabled={disabled || acknowledged || !history.redo.length} onClick={() => travel('redo')}>Làm lại Copilot ({history.redo.length})</button></div>{message && <p role="status">{message}</p>}<p className="text-xs">Lịch sử thao tác này giữ trong phiên soạn hiện tại. Lưu đề để có mốc trên máy chủ.</p></div>;
}
