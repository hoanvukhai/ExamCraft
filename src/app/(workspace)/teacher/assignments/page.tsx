'use client';

import { PageHeader } from '@/components/workspace/ui';
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
  Search,
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
    <div className="app-page px-4 sm:px-6 lg:px-8 py-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Đầu trang */}
        <PageHeader title="Bài đã giao" description="Theo dõi trực tiếp quá trình làm bài của học sinh và phân tích kết quả từng đợt thi." actions={<Link href="/?choose=assign" className="app-button-primary inline-flex items-center justify-center gap-2 min-h-10 px-5 text-sm font-semibold"><Plus className="w-4 h-4" /> Chọn đề để giao</Link>} />

        {/* Search */}
        {(examId || groupId) && <p className="text-sm">Đang xem bài giao của {examId ? 'đề đã chọn' : 'lớp đã chọn'}. <Link className="underline" href="/teacher/assignments">Xem tất cả bài đã giao</Link></p>}
        {loadError && <div role="alert" className="border border-red-400 rounded-lg p-3"><p>{loadError}</p><button type="button" className="underline min-h-10" onClick={() => fetchAssignments()}>Thử lại</button></div>}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-0 flex-1 basis-56 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5f6368] dark:text-[#9aa0a6]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm theo tiêu đề hoặc tên lớp..."
              className="w-full bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-full pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#202124] dark:text-[#e3e3e3] placeholder-[#5f6368] dark:placeholder-[#9aa0a6] focus:border-[#3c4043] dark:focus:border-[#e3e3e3] outline-hidden"
            />
          </div>
          <span className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">
            Tổng cộng: <strong className="text-[#202124] dark:text-[#e3e3e3]">{filtered.length}</strong> bài đã giao
          </span>
        </div>

        {/* Danh sách bài giao */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-[#5f6368] dark:text-[#9aa0a6]">
            <div className="w-8 h-8 border-4 border-[#3c4043] dark:border-[#e3e3e3] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs">Đang tải danh sách bài đã giao...</p>
          </div>
        ) : loadError ? null : filtered.length === 0 ? (
          <div className="bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl p-12 text-center">
            <BookOpen className="w-12 h-12 text-[#5f6368] dark:text-[#9aa0a6] mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#202124] dark:text-[#e3e3e3]">{search ? 'Không có bài phù hợp tìm kiếm' : 'Chưa có bài nào được giao trong mục này'}</h3>
            <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] mt-1 mb-5">
              Hãy bấm &quot;Chia sẻ &amp; Thi Online&quot; trong màn hình soạn đề để tạo phòng thi đầu tiên.
            </p>
            <Link
              href="/"
              className="px-5 py-2.5 app-button-primary dark:bg-[#e3e3e3] dark:text-[#17181a] text-white text-xs font-semibold rounded-lg shadow-xs"
            >
              Về kho đề
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filtered.map((asg) => (
              <div
                key={asg.id}
                className="bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] hover:border-[#3c4043] dark:hover:border-[#e3e3e3] rounded-xl p-5 shadow-xs hover:shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                        asg.status === 'OPEN'
                          ? 'bg-[#e6f4ea] dark:bg-[#0f291e] text-[#137333] dark:text-[#5bb98c] border-[#ceead6] dark:border-[#1e4a34]'
                          : 'bg-[#fce8e6] dark:bg-[#371918] text-[#c5221f] dark:text-[#f28b82] border-[#fad2cf] dark:border-[#5c2725]'
                      }`}
                    >
                      {assignmentStatusLabel(asg.status)}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#f1f3f4] dark:bg-[#292a2d] text-[#3c4043] dark:text-[#e3e3e3] border border-[#dadce0] dark:border-[#3c4043] uppercase tracking-wider">
                      {assignmentModeLabel(asg.mode)}
                    </span>
                    {asg.group && (
                      <span className="text-xs text-[#5f6368] dark:text-[#9aa0a6] font-semibold">
                        Lớp: <span className="text-[#202124] dark:text-[#e3e3e3]">{asg.group.name}</span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-[#202124] dark:text-[#e3e3e3]">{asg.title}</h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#5f6368] dark:text-[#9aa0a6]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {asg.durationMinutes ? `${asg.durationMinutes} phút` : 'Tự do'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {asg._count.attempts} lượt đã nộp
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Giao ngày: {new Date(asg.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                  <a
                    href={`/a/${asg.publicId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 bg-[#f1f3f4] hover:bg-[#e8eaed] dark:bg-[#292a2d] dark:hover:bg-[#303134] text-[#5f6368] hover:text-[#202124] dark:text-[#9aa0a6] dark:hover:text-[#e3e3e3] rounded-lg border border-[#dadce0] dark:border-[#3c4043] transition-all"
                    title="Mở phòng thi học sinh"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  <Link
                    href={`/teacher/assignments/${asg.id}`}
                    className="px-5 py-2.5 app-button-primary dark:bg-[#e3e3e3] dark:text-[#17181a] text-white font-semibold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition-all"
                  >
                    <Users className="w-4 h-4" /> Giám sát & Bảng điểm
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
