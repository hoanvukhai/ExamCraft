import { Suspense } from 'react';
import { getCurrentUser } from '@/lib/auth';
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell';

async function Frame({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  // Signed-out visitors and accounts that must change their password are redirected by each page; they never see the frame.
  if (!user || user.mustChangePassword) return <>{children}</>;
  return <WorkspaceShell user={{ id: user.id, name: user.name, email: user.email, role: user.role }}>{children}</WorkspaceShell>;
}

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<p role="status" className="p-6 text-sm">Đang tải không gian làm việc...</p>}><Frame>{children}</Frame></Suspense>;
}
