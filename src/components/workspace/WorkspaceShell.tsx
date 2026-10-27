'use client';
import type { ReactNode } from 'react';
import { WorkspaceProvider, type WorkspaceUser } from './WorkspaceContext';
import { WorkspaceMenu, WorkspaceTabs, useWorkspaceVariant } from './WorkspaceMenu';
import { WorkspaceRail, PhoneBar } from './WorkspaceRail';
import { Brand } from './Brand';
import { useWorkspace } from './WorkspaceContext';
import { TeacherAiSecretaryDrawer } from '@/components/TeacherAiSecretaryDrawer';

function Frame({ children }: { children: ReactNode }) {
  const variant = useWorkspaceVariant(), editor = variant === 'editor';
  const { user, assistantOpen, closeAssistant } = useWorkspace();
  return <div className="workspace-root app-page h-dvh flex bg-[var(--background)] text-[var(--foreground)] overflow-hidden">
    <WorkspaceMenu variant={variant} />
    <div className="workspace-column flex-1 min-w-0 min-h-0 flex flex-col">
      <PhoneBar variant={variant} brand={<Brand admin={variant === 'admin'} compact />} />
      <WorkspaceTabs variant={variant} />
      <div className={`workspace-content flex-1 min-h-0 ${editor ? 'flex flex-col overflow-hidden' : 'overflow-y-auto'}`}>{children}</div>
    </div>
    <TeacherAiSecretaryDrawer key={user.id} isOpen={assistantOpen} onClose={closeAssistant} currentUser={user} />
    <WorkspaceRail variant={variant} />
  </div>;
}

/** The frame for every signed-in page, in the style of a console: a menu on the left, a rail on the right, nothing across the top. Pages supply only their content. */
export function WorkspaceShell({ user, children }: { user: WorkspaceUser; children: ReactNode }) {
  return <WorkspaceProvider user={user}><Frame>{children}</Frame></WorkspaceProvider>;
}
