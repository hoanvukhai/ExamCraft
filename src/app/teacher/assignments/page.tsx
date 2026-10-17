'use client';

import React, { useState, useEffect } from 'react';
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
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/assignments');
      const data = await res.json();
      if (res.ok) {
        setAssignments(data.assignments || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const filtered = assignments.filter((asg) =>
    asg.title.toLowerCase().includes(search.toLowerCase()) ||
    (asg.group?.name && asg.group.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1 text-xs text-slate-400">
              <Link href="/" className="hover:text-slate-200 flex items-center gap-1 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Soạn đề thi
              </Link>
              <span>/</span>
              <span className="text-indigo-400 font-semibold">Danh sách bài đã giao</span>
            </div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
              <BookOpen className="w-7 h-7 text-indigo-400" />
              Quản Lý Bài Giao & Bảng Điểm
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Theo dõi trực tiếp quá trình làm bài của học sinh và phân tích kết quả từng đợt thi.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-4 h-4" /> Giao Bài Mới
          </Link>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm theo tiêu đề hoặc tên lớp..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <span className="text-xs text-slate-400">
            Tổng cộng: <strong className="text-slate-200">{filtered.length}</strong> bài đã giao
          </span>
        </div>

        {/* Danh sách bài giao */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs">Đang tải danh sách bài đã giao...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-300">Chưa có bài nào được giao</h3>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              Hãy bấm &quot;Chia sẻ &amp; Thi Online&quot; trong màn hình soạn đề để tạo phòng thi đầu tiên.
            </p>
            <Link
              href="/"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl"
            >
              Về Trang Soạn Đề
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filtered.map((asg) => (
              <div
                key={asg.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider border ${
                        asg.status === 'OPEN'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                      }`}
                    >
                      {asg.status === 'OPEN' ? 'Đang mở' : 'Đã đóng'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                      {asg.mode}
                    </span>
                    {asg.group && (
                      <span className="text-xs text-slate-400 font-semibold">
                        Lớp: <span className="text-slate-200">{asg.group.name}</span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-white">{asg.title}</h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {asg.durationMinutes ? `${asg.durationMinutes} phút` : 'Tự do'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      {asg._count.attempts} lượt đã nộp
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      Giao ngày: {new Date(asg.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                  <a
                    href={`/a/${asg.publicId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all"
                    title="Mở phòng thi học sinh"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  <Link
                    href={`/teacher/assignments/${asg.id}`}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all"
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
