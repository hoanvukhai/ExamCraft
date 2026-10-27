import { Suspense } from 'react';
import { redirect } from 'next/navigation';
type Query = Record<string, string | string[] | undefined>;
async function LegacyFolders({ searchParams }: { searchParams: Promise<Query> }) {
  const query = await searchParams, target = new URLSearchParams();
  for (const key of ['folder', 'view', 'search', 'subject', 'grade', 'page']) if (typeof query[key] === 'string') target.set(key, query[key]);
  return redirect('/' + (target.size ? '?' + target : ''));
}
export default function Page({ searchParams }: { searchParams: Promise<Query> }) { return <Suspense fallback={<p className="p-4">Đang mở kho đề...</p>}><LegacyFolders searchParams={searchParams} /></Suspense>; }
