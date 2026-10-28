'use client';
import { useSyncExternalStore } from 'react';
import type { Exam } from '@/types/exam';
import { listQuestionDrafts, subscribeQuestionDrafts, questionDraftRevision, questionDraftServerRevision } from '@/lib/question-draft';
import { listAiProposals, subscribeAiProposals, aiProposalRevision, aiProposalServerRevision } from '@/lib/ai-proposal-journal';
import { QuestionDraftPanel } from '@/components/QuestionDraftPanel';
import { AiProposalJournalPanel } from '@/components/AiProposalJournalPanel';
export function EditorPending({ ownerId, exam, onCopilot }: { ownerId: string; exam: Exam; onCopilot: () => void }) {
  const questions = useSyncExternalStore(subscribeQuestionDrafts, questionDraftRevision, questionDraftServerRevision);
  const proposals = useSyncExternalStore(subscribeAiProposals, aiProposalRevision, aiProposalServerRevision);
  const count = (questions ? listQuestionDrafts(ownerId, exam.id).length : 0) + (proposals ? listAiProposals(ownerId).filter(item => item.record?.base.documentId === exam.id).length : 0);
  if (!count) return null;
  return <details className="border rounded-xl p-3 text-sm"><summary className="cursor-pointer">Cần xử lý ({count})</summary><QuestionDraftPanel ownerId={ownerId} documentId={exam.id} questionIds={exam.questions.map(q => q.id)} exam={exam} /><AiProposalJournalPanel ownerId={ownerId} documentId={exam.id} questionIds={exam.questions.map(q => q.id)} onOpenCopilot={onCopilot} /></details>;
}
