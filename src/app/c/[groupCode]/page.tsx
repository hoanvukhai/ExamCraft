'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  Users,
  BookOpen,
  Clock,
  CheckCircle2,
  PlayCircle,
  Calendar,
  AlertCircle,
  ChevronRight,
  GraduationCap,
} from 'lucide-react';

interface Student {
  id: string;
  displayName: string;
}

interface AssignmentItem {
  id: string;
  title: string;
  publicId: string;
  mode: string;
  durationMinutes?: number;
  opensAt?: string;
  closesAt?: string;
  attemptsCount: number;
  latestAttempt?: {
    id: string;
    status: 'IN_PROGRESS' | 'SUBMITTED' | 'TERMINATED';
    score: number | null;
    maxScore: number | null;
    submittedAt?: string;
  } | null;
}

interface GroupData {
  id: string;
  name: string;
  publicCode: string;
  students: Student[];
  assignments: AssignmentItem[];
}

function ClassPortalContent({
  params,
}: {
  params: Promise<{ groupCode: string }>;
}) {
  const { groupCode } = use(params);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [group, setGroup] = useState<GroupData | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  const fetchGroupData = async (studentId?: string) => {
    try {
      setLoading(true);
      setError(null);
      const url = `/api/public/groups/${groupCode}${studentId ? `?studentId=${studentId}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Không thể tìm thấy lớp học');
        return;
      }

      setGroup(data.group);
    } catch (err) {
      console.error(err);
      setError('Lỗi kết nối máy chủ, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupData();
  }, [groupCode]);

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudentId(studentId);
    if (studentId) {
      fetchGroupData(studentId);
    }
  };

  if (loading && !group) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-medium text-sm">Đang tải thông tin lớp học...</p>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Không tìm thấy lớp học</h2>
          <p className="text-slate-400 text-sm mb-6">{error}</p>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl transition-all"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  const selectedStudent = group.students.find((s) => s.id === selectedStudentId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Banner Lớp học */}
        <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
                <GraduationCap className="w-4 h-4" /> Lớp học trực tuyến
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white">{group.name}</h1>
              <p className="text-slate-400 text-xs md:text-sm mt-1">
                Mã lớp: <span className="font-mono font-bold text-indigo-300">{group.publicCode}</span> •{' '}
                {group.students.length} học sinh
              </p>
            </div>

            {/* Chọn tên học sinh */}
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl min-w-[280px]">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Chọn tên em để xem điểm:
              </label>
              <select
                value={selectedStudentId}
                onChange={(e) => handleSelectStudent(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">-- Chọn học sinh --</option>
                {group.students.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.displayName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Danh sách bài tập / bài thi của lớp */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-400" /> Danh sách bài thi & bài tập
            </h2>
            <span className="text-xs text-slate-400">
              Tổng số: <span className="font-bold text-slate-200">{group.assignments.length}</span> bài
            </span>
          </div>

          {group.assignments.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center">
              <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Hiện chưa có bài tập nào được giao cho lớp này.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {group.assignments.map((asg) => {
                const latest = asg.latestAttempt;
                const isSubmitted = latest?.status === 'SUBMITTED';
                const isInProgress = latest?.status === 'IN_PROGRESS';

                return (
                  <div
                    key={asg.id}
                    className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition-all shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                          {asg.mode === 'EXAM' ? 'Bài Thi' : asg.mode === 'PRACTICE' ? 'Luyện tập' : 'Bài về nhà'}
                        </span>
                        {isSubmitted ? (
                          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Đã nộp bài
                          </span>
                        ) : isInProgress ? (
                          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Đang làm dở
                          </span>
                        ) : null}
                      </div>

                      <h3 className="text-base font-bold text-white">{asg.title}</h3>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                        {asg.durationMinutes && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-500" /> {asg.durationMinutes} phút
                          </span>
                        )}
                        {asg.closesAt && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" /> Hạn nộp:{' '}
                            {new Date(asg.closesAt).toLocaleDateString('vi-VN')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Khối điểm số / nút hành động */}
                    <div className="flex items-center gap-4 self-end md:self-auto shrink-0">
                      {isSubmitted && latest?.score !== null && latest?.score !== undefined ? (
                        <div className="text-right">
                          <span className="text-xs text-slate-400 block">Điểm số</span>
                          <span className="text-xl font-black text-emerald-400">
                            {latest.score}
                            <span className="text-xs text-slate-400 font-normal ml-1">/ {latest.maxScore || 10}</span>
                          </span>
                        </div>
                      ) : null}

                      <Link
                        href={`/a/${asg.publicId}`}
                        className={`px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm flex items-center gap-1.5 transition-all ${
                          isSubmitted
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                            : isInProgress
                            ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-600/30'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30'
                        }`}
                      >
                        {isSubmitted ? (
                          <>
                            Xem lại <ChevronRight className="w-4 h-4" />
                          </>
                        ) : isInProgress ? (
                          <>
                            <PlayCircle className="w-4 h-4" /> Tiếp tục làm
                          </>
                        ) : (
                          <>
                            <PlayCircle className="w-4 h-4" /> Vào làm bài
                          </>
                        )}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ClassPortalPage(props: { params: Promise<{ groupCode: string }> }) {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-400 font-medium text-sm">Đang tải thông tin lớp học...</p>
        </div>
      }
    >
      <ClassPortalContent {...props} />
    </React.Suspense>
  );
}
