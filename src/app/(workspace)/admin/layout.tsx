import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { Suspense } from 'react';

async function AuthenticatedAdmin({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.mustChangePassword) redirect('/login?change=required');
  if (user.role !== 'SUPER_ADMIN') redirect('/');
  return <>{children}</>;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div role="status" className="p-6 text-sm">Đang kiểm tra quyền quản trị...</div>}><AuthenticatedAdmin>{children}</AuthenticatedAdmin></Suspense>;
}
