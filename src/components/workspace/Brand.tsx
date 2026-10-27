import Link from 'next/link';
import { GraduationCap } from 'lucide-react';

export function Brand({ admin = false, compact = false }: { admin?: boolean; compact?: boolean }) {
  return <Link href={admin ? '/admin/users' : '/'} title="ExamCraft" className="flex items-center gap-2.5 shrink-0 min-h-10">
    <span className="w-9 h-9 rounded-xl bg-[var(--ui-accent)] text-[var(--ui-on-primary)] flex items-center justify-center shrink-0"><GraduationCap className="w-5 h-5" /></span>
    {!compact && <span className="font-semibold text-base tracking-tight">ExamCraft<span className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[var(--ui-surface-variant)] text-[var(--ui-text-secondary)] align-middle">{admin ? 'Quản trị' : 'Giáo viên'}</span></span>}
  </Link>;
}
