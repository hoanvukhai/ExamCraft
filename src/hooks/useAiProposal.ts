'use client';
import { useState, useSyncExternalStore } from 'react';
import { aiProposalRevision, aiProposalServerRevision, archiveAiProposal, currentAiProposal, subscribeAiProposals } from '@/lib/ai-proposal-journal';

export function useAiProposal(ownerId: string, documentId: string, kind: 'question' | 'copilot', questionId?: string) {
  const revision = useSyncExternalStore(subscribeAiProposals, aiProposalRevision, aiProposalServerRevision);
  const [notice, setNotice] = useState('');
  const entry = revision === 0 ? undefined : currentAiProposal(ownerId, documentId, kind, questionId);
  const archive = () => {
    if (!entry) return true;
    const result = archiveAiProposal(entry);
    setNotice(result ? '' : 'Chưa cất được bản đối chiếu. Đề xuất vẫn được giữ; hãy tải về nếu bộ nhớ máy đầy.');
    return result;
  };
  return { entry, archive, notice: notice || (entry?.memoryOnly ? 'Đề xuất hiện chỉ giữ trong tab này. Hãy tải về trước khi đóng hoặc tải lại trang.' : '') };
}
