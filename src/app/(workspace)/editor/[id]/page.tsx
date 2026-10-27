import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import ExamWorkspace from '@/components/ExamWorkspace';

export const metadata = {
  title: 'ExamCraft - Bàn Biên Soạn Đề Thi',
  description: 'Không gian biên soạn, thẩm định câu hỏi và xuất bản đề thi chuẩn GDPT 2018.',
};

async function AuthenticatedEditor({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login?redirect=/editor/new');
  }
  if (user.mustChangePassword) redirect('/login?change=required');

  const { id } = await params;

  return <ExamWorkspace currentUser={user} examId={id} />;
}

export default function EditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <p role="status" className="p-6 text-sm text-[var(--ui-text-secondary)]">Đang tải không gian biên soạn đề thi...</p>
      }
    >
      <AuthenticatedEditor params={params} />
    </Suspense>
  );
}
