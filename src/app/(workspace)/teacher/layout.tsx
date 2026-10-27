import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login?redirect=/teacher/assignments');
  if (user.mustChangePassword) redirect('/login?change=required');
  return <>{children}</>;
}
export default function Layout({ children }: { children: React.ReactNode }) { return <Suspense fallback={<p className="p-6 text-sm">Đang tải không gian giáo viên...</p>}><TeacherLayout>{children}</TeacherLayout></Suspense>; }
