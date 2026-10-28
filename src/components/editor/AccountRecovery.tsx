'use client';
import { LocalDraftsPanel } from '@/components/LocalDraftsPanel';
import { QuestionDraftPanel } from '@/components/QuestionDraftPanel';
import { AiProposalJournalPanel } from '@/components/AiProposalJournalPanel';
/** Keep account-wide active, archived and unreadable records discoverable on the library. */
export function AccountRecovery({ ownerId }: { ownerId: string }) {
  return <section aria-label="Khôi phục nháp" className="empty:hidden space-y-2"><LocalDraftsPanel ownerId={ownerId} /><QuestionDraftPanel ownerId={ownerId} documentId="account" questionIds={[]} /><AiProposalJournalPanel ownerId={ownerId} documentId="account" questionIds={[]} onOpenCopilot={() => {}} /></section>;
}
