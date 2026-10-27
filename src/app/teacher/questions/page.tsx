import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { QuestionBankPage } from '@/components/QuestionBankModal';
async function Bank() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?redirect=/teacher/questions');
  return <main className="app-page max-w-6xl mx-auto p-4 sm:p-6"><QuestionBankPage ownerId={user.id} /></main>;
}
export default function Page() { return <Suspense fallback={<p className="p-6">Đang tải ngân hàng...</p>}><Bank /></Suspense>; }
