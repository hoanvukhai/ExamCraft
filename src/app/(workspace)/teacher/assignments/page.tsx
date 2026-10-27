'use client';

import { PageHeader, FilterBar, SearchField, EmptyState, LoadingBlock, Panel, Tag } from '@/components/workspace/ui';
import React, { useState, useEffect, useCallback } from 'react';
import { usePinnedAccount } from '@/hooks/usePinnedAccount';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { assignmentStatusLabel, teacherErrorMessage } from '@/lib/teacher-ui';
import { assignmentModeLabel } from '@/lib/admin-overview';
import {
  BookOpen,
  Users,
  Clock,
  ExternalLink,
  Plus,
  Calendar,
} from 'lucide-react';

interface AssignmentItem {
  id: string;
  title: string;
  publicId: string;
  mode: string;
  status: 'OPEN' | 'CLOSED' | 'ARCHIVED';
  durationMinutes?: number;
  createdAt: string;
  closesAt?: string;
  group?: {
    id: string;
    name: string;
    publicCode: string;
  } | null;
  _count: {
    attempts: number;
  };
}

export default function TeacherAssignmentsListPage() {
  const { ownerId: accountOwnerId, error: accountError, request: accountRequest } = usePinnedAccount();
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [loadError, setLoadError] = useState('');
  const context = useSearchParams();
  const examId = context.get('examId'), groupId = context.get('groupId');

  const fetchAssignments = useCallback(() => {
    if (!accountOwnerId) return;
    let live = true;
    setLoading(true); setLoadError(''); setAssignments([]);
    const params = new URLSearchParams();
    if (examId) params.set('examId', examId);
    if (groupId) params.set('groupId', groupId);
    void accountRequest('/api/assignments?' + params, { cache: 'no-store' }).then(async res => {
      const data = await res.json(); if (!res.ok) throw Error(data.error || 'Chưa tải được bài đã giao.');
      if (live) setAssignments(data.assignments || []);
    }).catch(cause => { if (live) setLoadError(teacherErrorMessage(cause, 'Chưa kết nối được máy chủ. Hãy thử lại.')); }).finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [accountOwnerId, accountRequest, examId, groupId]);

  useEffect(() => {
    // Changing exam/class must clear the old snapshot before the request resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    return fetchAssignments();
  }, [fetchAssignments]);

  if (accountError) return <div role="alert" className="p-6"><p>{accountError}</p><Link href="/">Về kho đề</Link></div>;

  const filtered = assignments.filter((asg) =>
    asg.title.toLowerCase().includes(search.toLowerCase()) ||
    (asg.group?.name && asg.group.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="app-page w-full px-4 sm:px-6 py-5">
      <div className="space-y-5">
        {/* Đầu trang */}
        <PageHeader title="Bài đã giao" description="Theo dõi trực tiếp quá trình làm bài của học sinh và phân tích kết quả từng đợt thi." actions={<Link href="/?choose=assign" className="app-button-primary inline-flex items-center justify-center gap-2 min-h-10 px-5 text-sm font-semibold"><Plus className="w-4 h-4" /> Chọn đề để giao</Link>} />

        {/* Search */}
        {(examId || groupId) && <p className="text-sm">Đang xem bài giao của {examId ? 'đề đã chọn' : 'lớp đã chọn'}. <Link className="underline" href="/teacher/assignments">Xem tất cả bài đã giao</Link></p>}
        {loadError && <div role="alert" className="border border-red-400 rounded-lg p-3"><p>{loadError}</p><button type="button" className="underline min-h-10" onClick={() => fetchAssignments()}>Thử lại</button></div>}
        <FilterBar>
          <SearchField label="Tìm bài đã giao" value={search} onChange={setSearch} placeholder="Tìm kiếm theo tiêu đề hoặc tên lớp..." />
          <span className="text-sm text-[var(--ui-text-secondary)]">Tổng cộng: <strong className="text-[var(--ui-text-primary)]">{filtered.length}</strong> bài đã giao</span>
        </FilterBar>

        {/* Danh sách bài giao */}
        {loading ? (
          <LoadingBlock text="Đang tải danh sách bài đã giao..." />
        ) : loadError ? null : filtered.length === 0 ? (
          <EmptyState Icon={BookOpen} title={search ? 'Không có bài phù hợp tìm kiếm' : 'Chưa có bài nào được giao trong mục này'} text={'Hãy bấm "Chia sẻ & Thi Online" trong màn hình soạn đề để tạo phòng thi đầu tiên.'}
            action={<Link href="/" className="app-button-primary min-h-10 px-5 inline-flex items-center text-sm font-semibold">Về kho đề</Link>} />
        ) : (
          <Panel className="divide-y overflow-hidden">
            {filtered.map((asg) => (
              <article key={asg.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[var(--ui-surface-variant)] transition-colors">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Tag active={asg.status === 'OPEN'}>{assignmentStatusLabel(asg.status)}</Tag>
                    <Tag>{assignmentModeLabel(asg.mode)}</Tag>
                    {asg.group && <span className="text-xs text-[var(--ui-text-secondary)]">Lớp: <span className="font-semibold text-[var(--ui-text-primary)]">{asg.group.name}</span></span>}
                  </div>
                  <h2 className="text-base font-semibold [overflow-wrap:anywhere]">{asg.title}</h2>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-[var(--ui-text-secondary)]">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{asg.durationMinutes ? `${asg.durationMinutes} phút` : 'Tự do'}</span>
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{asg._count.attempts} lượt đã nộp</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />Giao ngày: {new Date(asg.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a href={`/a/${asg.publicId}`} target="_blank" rel="noreferrer" title="Mở phòng thi học sinh" aria-label="Mở phòng thi học sinh" className="app-button-secondary min-h-10 w-10 flex items-center justify-center"><ExternalLink className="w-4 h-4" /></a>
                  <Link href={`/teacher/assignments/${asg.id}`} className="app-button-primary min-h-10 px-4 text-sm font-semibold inline-flex items-center gap-1.5"><Users className="w-4 h-4" /> Giám sát & Bảng điểm</Link>
                </div>
              </article>
            ))}
          </Panel>
        )}
      </div>
    </div>
  );
}
