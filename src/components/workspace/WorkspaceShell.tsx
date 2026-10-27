'use client';
import type { ReactNode } from 'react';
import { WorkspaceProvider, useWorkspace, type WorkspaceUser } from './WorkspaceContext';
import { WorkspaceMenu, WorkspaceTabs, useWorkspaceVariant } from './WorkspaceMenu';
import { WorkspaceTopBar } from './WorkspaceTopBar';
import { AiRail } from './AiRail';

function Frame({ children }: { children: ReactNode }) {
  const variant = useWorkspaceVariant(), { setTopbarSlot } = useWorkspace();
  const editor = variant === 'editor';
  return <div className="workspace-root app-page h-dvh flex flex-col overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
    <div ref={setTopbarSlot} className="no-print shrink-0">{!editor && <WorkspaceTopBar variant={variant} />}</div>
    <div className="workspace-body flex flex-1 min-h-0">
      <WorkspaceMenu variant={variant} />
      <div className="workspace-column flex-1 min-w-0 min-h-0 flex flex-col">
        <WorkspaceTabs variant={variant} />
        <div className={`workspace-content flex-1 min-h-0 ${editor ? 'flex flex-col overflow-hidden' : 'overflow-y-auto'}`}>{children}</div>
      </div>
      {(variant === 'library' || variant === 'page') && <AiRail />}
    </div>
  </div>;
}

/** One frame for every signed-in page: top bar, one menu, one assistant rail. Pages supply only their content. */
export function WorkspaceShell({ user, children }: { user: WorkspaceUser; children: ReactNode }) {
  return <WorkspaceProvider user={user}><Frame>{children}</Frame></WorkspaceProvider>;
}
