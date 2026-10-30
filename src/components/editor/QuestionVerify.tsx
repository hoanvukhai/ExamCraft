'use client';
import { useState } from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import type { Question } from '@/types/exam';
import { accountFetch } from '@/lib/account-fetch';
import { MathRenderer } from '@/components/MathRenderer';
import { captureQuestionAiBase, questionAiBaseMatches, type QuestionAiBase } from '@/lib/question-ai-review';

type Result = {
  isMatch: boolean;
  confidence: number;
  solvedAnswer: string;
  solutionSteps: string;
  discrepancies: string[];
  recommendation: string;
};

/** "Thẩm định đáp án" for the selected question: the AI solves it on its own and the result is compared with the answer in the exam. */
export function QuestionVerify({
  question,
  ownerId,
  documentId,
  sourceStamp,
  withAi,
}: {
  question: Question;
  ownerId: string;
  documentId: string;
  sourceStamp: string;
  withAi: (action: () => void) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [verification, setVerification] = useState<{ base: QuestionAiBase; result: Result } | null>(null);
  const current = verification && questionAiBaseMatches(verification.base, ownerId, documentId, sourceStamp, question);
  const result = verification && current ? verification.result : null;
  const run = async () => {
    const base = captureQuestionAiBase(ownerId, documentId, sourceStamp, question);
    setBusy(true);
    setError('');
    try {
      const response = await accountFetch(ownerId, '/api/verify-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: base.question, customApiKey: '' }),
      });
      const data = await response.json();
      if (data.success)
        setVerification({
          base,
          result: {
            isMatch: data.isMatch,
            confidence: data.confidence,
            solvedAnswer: data.solvedAnswer,
            solutionSteps: data.solutionSteps,
            discrepancies: data.discrepancies || [],
            recommendation: data.recommendation,
          },
        });
      else setError(data.error || 'Chưa thẩm định được câu này.');
    } catch {
      setError('Chưa kết nối được máy chủ AI. Đề của bạn vẫn được giữ nguyên.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <section aria-label="Thẩm định đáp án" className="space-y-3 text-sm">
      <p className="text-xs text-[var(--ui-text-secondary)]">
        AI giải độc lập rồi so với đáp án đang có trong đề. Kết quả chỉ để tham khảo, giáo viên quyết định.
      </p>
      <button
        type="button"
        disabled={busy}
        className="app-button-secondary rounded-lg px-3 min-h-9 text-xs disabled:opacity-50"
        onClick={() => withAi(() => void run())}
      >
        {busy ? 'Đang thẩm định…' : 'Thẩm định đáp án'}
      </button>
      {error && (
        <p role="alert" className="text-xs text-amber-700">
          {error}
        </p>
      )}
      {verification && !current && (
        <p role="alert" className="text-xs text-amber-700">
          Câu hoặc phạm vi đã đổi từ khi thẩm định. Kết quả cũ không dùng cho bản hiện tại; hãy thẩm định lại khi cần.
        </p>
      )}
      {result && (
        <div className="space-y-2 rounded-xl border p-3 text-xs">
          <p className="flex items-center gap-1.5 font-semibold">
            {result.isMatch ? <ShieldCheck className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            {result.isMatch ? 'AI đề xuất đáp án khớp — cần giáo viên duyệt' : 'Phát hiện sai lệch đáp án'}
          </p>
          <p>
            Đáp án trong đề: <b>{question.correct_answer || 'Chưa thiết lập'}</b>
          </p>
          <p>
            AI giải ra: <b>{result.solvedAnswer}</b>
          </p>
          {result.discrepancies.length > 0 && (
            <ul className="list-disc pl-4">
              {result.discrepancies.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          )}
          <div className="font-serif">
            <MathRenderer content={result.solutionSteps} />
          </div>
        </div>
      )}
    </section>
  );
}
