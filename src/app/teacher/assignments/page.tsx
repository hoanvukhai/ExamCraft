'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePinnedAccount } from '@/hooks/usePinnedAccount';
import Link from 'next/link';
import {
  BookOpen,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  ExternalLink,
  Plus,
  ArrowLeft,
  Calendar,
  Lock,
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

  const fetchAssignments = useCallback(async () => {
    if (!accountOwnerId) return;
    try {
      setLoading(true);
      const res = await accountRequest('/api/assignments', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) {
        setAssignments(data.assignments || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [accountOwnerId, accountRequest]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  if (accountError) return <div role="alert" className="p-6"><p>{accountError}</p><Link href="/">Về kho đề</Link></div>;

  const filtered = assignments.filter((asg) =>
    asg.title.toLowerCase().includes(search.toLowerCase()) ||
    (asg.group?.name && asg.group.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#181818] text-[#202124] dark:text-[#e3e3e3] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#dadce0] dark:border-[#3c4043]">
          <div>
            <div className="flex items-center gap-2 mb-1 text-xs text-[#5f6368] dark:text-[#9aa0a6]">
              <Link href="/" className="hover:text-[#202124] dark:hover:text-[#e3e3e3] flex items-center gap-1 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Soạn đề thi
              </Link>
              <span>/</span>
              <span className="text-[#1a73e8] dark:text-[#8ab4f8] font-semibold">Danh sách bài đã giao</span>
            </div>
            <h1 className="text-2xl font-bold text-[#202124] dark:text-[#e3e3e3] flex items-center gap-2.5">
              <BookOpen className="w-7 h-7 text-[#1a73e8] dark:text-[#8ab4f8]" />
              Quản Lý Bài Giao & Bảng Điểm
            </h1>
            <p className="text-xs sm:text-sm text-[#5f6368] dark:text-[#9aa0a6] mt-1">
              Theo dõi trực tiếp quá trình làm bài của học sinh và phân tích kết quả từng đợt thi.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1a73e8] hover:bg-[#1557b0] dark:bg-[#8ab4f8] dark:text-[#181818] text-white text-sm font-semibold rounded-full shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" /> Giao Bài Mới
          </Link>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5f6368] dark:text-[#9aa0a6]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm theo tiêu đề hoặc tên lớp..."
              className="w-full bg-white dark:bg-[#1e1e1e] border border-[#dadce0] dark:border-[#3c4043] rounded-full pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#202124] dark:text-[#e3e3e3] placeholder-[#5f6368] dark:placeholder-[#9aa0a6] focus:border-[#1a73e8] dark:focus:border-[#8ab4f8] outline-hidden"
            />
          </div>
          <span className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">
            Tổng cộng: <strong className="text-[#202124] dark:text-[#e3e3e3]">{filtered.length}</strong> bài đã giao
          </span>
        </div>

        {/* Danh sách bài giao */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-[#5f6368] dark:text-[#9aa0a6]">
            <div className="w-8 h-8 border-4 border-[#1a73e8] dark:border-[#8ab4f8] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs">Đang tải danh sách bài đã giao...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-[#1e1e1e] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl p-12 text-center">
            <BookOpen className="w-12 h-12 text-[#5f6368] dark:text-[#9aa0a6] mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#202124] dark:text-[#e3e3e3]">Chưa có bài nào được giao</h3>
            <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] mt-1 mb-5">
              Hãy bấm &quot;Chia sẻ &amp; Thi Online&quot; trong màn hình soạn đề để tạo phòng thi đầu tiên.
            </p>
            <Link
              href="/"
              className="px-5 py-2.5 bg-[#1a73e8] hover:bg-[#1557b0] dark:bg-[#8ab4f8] dark:text-[#181818] text-white text-xs font-semibold rounded-full shadow-xs"
            >
              Về Trang Soạn Đề
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filtered.map((asg) => (
              <div
                key={asg.id}
                className="bg-white dark:bg-[#1e1e1e] border border-[#dadce0] dark:border-[#3c4043] hover:border-[#1a73e8] dark:hover:border-[#8ab4f8] rounded-2xl p-5 shadow-xs hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                        asg.status === 'OPEN'
                          ? 'bg-[#e6f4ea] dark:bg-[#0f291e] text-[#137333] dark:text-[#5bb98c] border-[#ceead6] dark:border-[#1e4a34]'
                          : 'bg-[#fce8e6] dark:bg-[#371918] text-[#c5221f] dark:text-[#f28b82] border-[#fad2cf] dark:border-[#5c2725]'
                      }`}
                    >
                      {asg.status === 'OPEN' ? 'Đang mở' : 'Đã đóng'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#e8f0fe] dark:bg-[#1e2a38] text-[#1a73e8] dark:text-[#8ab4f8] border border-[#d2e3fc] dark:border-[#2a3f58] uppercase tracking-wider">
                      {asg.mode}
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
                    className="p-2.5 bg-[#f1f3f4] hover:bg-[#e8eaed] dark:bg-[#282828] dark:hover:bg-[#303134] text-[#5f6368] hover:text-[#202124] dark:text-[#9aa0a6] dark:hover:text-[#e3e3e3] rounded-full border border-[#dadce0] dark:border-[#3c4043] transition-all"
                    title="Mở phòng thi học sinh"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  <Link
                    href={`/teacher/assignments/${asg.id}`}
                    className="px-5 py-2.5 bg-[#1a73e8] hover:bg-[#1557b0] dark:bg-[#8ab4f8] dark:text-[#181818] text-white font-semibold text-xs rounded-full shadow-xs flex items-center gap-1.5 transition-all"
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
