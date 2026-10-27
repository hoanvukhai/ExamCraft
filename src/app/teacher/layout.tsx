import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { TeacherNavigation, TeacherSidebar } from '@/components/TeacherNavigation';
async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login?redirect=/teacher/assignments');
  if (user.mustChangePassword) redirect('/login?change=required');
  return <div className="min-h-dvh bg-[var(--background)] text-[var(--foreground)]">
    <TeacherNavigation header name={user.name} />
    <div className="lg:flex">
      <div className="hidden lg:block sticky top-0 self-start h-dvh shrink-0"><TeacherSidebar isAdmin={user.role === 'SUPER_ADMIN'} /></div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  </div>;
}
export default function Layout({ children }: { children: React.ReactNode }) { return <Suspense fallback={<p className="p-6">Đang tải không gian giáo viên...</p>}><TeacherLayout>{children}</TeacherLayout></Suspense>; }
