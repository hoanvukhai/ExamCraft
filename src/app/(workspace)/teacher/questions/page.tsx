import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { PageBody } from '@/components/workspace/ui';
import { QuestionBankPage } from '@/components/QuestionBankModal';
async function Bank() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?redirect=/teacher/questions');
  return <PageBody><QuestionBankPage ownerId={user.id} /></PageBody>;
}
export default function Page() { return <Suspense fallback={<p className="p-6">Đang tải ngân hàng...</p>}><Bank /></Suspense>; }
