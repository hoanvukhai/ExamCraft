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

  const loadGroupData = (studentId?: string) => fetch(`/api/public/groups/${groupCode}${studentId ? `?studentId=${studentId}` : ''}`).then(async res => {
    const data = await res.json();
    if (!res.ok) { setError(data.error || 'Không thể tìm thấy lớp học'); return; }
    setGroup(data.group);
  }).catch(err => { console.error(err); setError('Lỗi kết nối máy chủ, vui lòng thử lại.'); }).finally(() => setLoading(false));
  const fetchGroupData = (studentId?: string) => { setLoading(true); setError(null); return loadGroupData(studentId); };

  useEffect(() => {
    void loadGroupData();
  }, [groupCode]);

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudentId(studentId);
    if (studentId) {
      fetchGroupData(studentId);
    }
  };

  if (loading && !group) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#17181a] flex flex-col items-center justify-center text-[#202124] dark:text-[#e3e3e3] p-4">
        <div className="w-10 h-10 border-3 border-[#3c4043] dark:border-[#e3e3e3] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-[#5f6368] dark:text-[#9aa0a6] font-medium text-sm">Đang tải thông tin lớp học...</p>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#17181a] flex flex-col items-center justify-center text-[#202124] dark:text-[#e3e3e3] p-4">
        <div className="max-w-md w-full bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl p-8 text-center shadow-xs">
          <AlertCircle className="w-12 h-12 text-[#c5221f] dark:text-[#f28b82] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#202124] dark:text-[#e3e3e3] mb-2">Không tìm thấy lớp học</h2>
          <p className="text-[#5f6368] dark:text-[#9aa0a6] text-sm mb-6">{error}</p>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-5 py-2.5 app-button-primary dark:bg-[#e3e3e3] hover:bg-[#303134] dark:hover:bg-[#f1f3f4] text-white dark:text-[#202124] text-sm font-semibold rounded-lg transition-all shadow-xs"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#17181a] text-[#202124] dark:text-[#e3e3e3] py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Banner Lớp học */}
        <div className="bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl p-6 md:p-8 shadow-xs relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2 text-[#3c4043] dark:text-[#e3e3e3] text-xs font-bold uppercase tracking-wider mb-2">
                <GraduationCap className="w-4 h-4" /> Lớp học trực tuyến
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#202124] dark:text-[#e3e3e3]">{group.name}</h1>
              <p className="text-[#5f6368] dark:text-[#9aa0a6] text-xs md:text-sm mt-1">
                Mã lớp: <span className="font-mono font-bold text-[#3c4043] dark:text-[#e3e3e3]">{group.publicCode}</span> •{' '}
                {group.students.length} học sinh
              </p>
            </div>

            {/* Chọn tên học sinh */}
            <div className="bg-[#f8f9fa] dark:bg-[#242424] border border-[#dadce0] dark:border-[#3c4043] p-4 rounded-xl min-w-[280px]">
              <label className="block text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider mb-2">
                Chọn tên em để xem điểm:
              </label>
              <select
                value={selectedStudentId}
                onChange={(e) => handleSelectStudent(e.target.value)}
                className="w-full bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-full px-3 py-2 text-sm text-[#202124] dark:text-[#e3e3e3] focus:outline-none focus:border-[#3c4043] dark:focus:border-[#e3e3e3]"
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
            <h2 className="text-lg font-bold text-[#202124] dark:text-[#e3e3e3] flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#3c4043] dark:text-[#e3e3e3]" /> Danh sách bài thi & bài tập
            </h2>
            <span className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">
              Tổng số: <span className="font-bold text-[#202124] dark:text-[#e3e3e3]">{group.assignments.length}</span> bài
            </span>
          </div>

          {group.assignments.length === 0 ? (
            <div className="bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-xl p-10 text-center">
              <BookOpen className="w-12 h-12 text-[#5f6368] dark:text-[#9aa0a6] mx-auto mb-3" />
              <p className="text-[#5f6368] dark:text-[#9aa0a6] text-sm">Hiện chưa có bài tập nào được giao cho lớp này.</p>
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
                    className="bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] hover:border-[#bdc1c6] dark:hover:border-[#5f6368] rounded-xl p-5 transition-all shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-[#f1f3f4] dark:bg-[#292a2d] text-[#3c4043] dark:text-[#e3e3e3] border border-[#3c4043]/30 dark:border-[#e3e3e3]/30">
                          {asg.mode === 'EXAM' ? 'Bài Thi' : asg.mode === 'PRACTICE' ? 'Luyện tập' : 'Bài về nhà'}
                        </span>
                        {isSubmitted ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#e6f4ea] dark:bg-[#0f291e] text-[#137333] dark:text-[#5bb98c] border border-[#ceead6] dark:border-[#1e4d38] flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Đã nộp bài
                          </span>
                        ) : isInProgress ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#fef7e0] dark:bg-[#33250b] text-[#b06000] dark:text-[#fdd663] border border-[#feefc3] dark:border-[#4d380e] flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Đang làm dở
                          </span>
                        ) : null}
                      </div>

                      <h3 className="text-base font-bold text-[#202124] dark:text-[#e3e3e3]">{asg.title}</h3>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-[#5f6368] dark:text-[#9aa0a6]">
                        {asg.durationMinutes && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> {asg.durationMinutes} phút
                          </span>
                        )}
                        {asg.closesAt && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" /> Hạn nộp:{' '}
                            {new Date(asg.closesAt).toLocaleDateString('vi-VN')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Khối điểm số / nút hành động */}
                    <div className="flex items-center gap-4 self-end md:self-auto shrink-0">
                      {isSubmitted && latest?.score !== null && latest?.score !== undefined ? (
                        <div className="text-right">
                          <span className="text-xs text-[#5f6368] dark:text-[#9aa0a6] block">Điểm số</span>
                          <span className="text-xl font-bold text-[#137333] dark:text-[#5bb98c]">
                            {latest.score}
                            <span className="text-xs text-[#5f6368] dark:text-[#9aa0a6] font-normal ml-1">/ {latest.maxScore || 10}</span>
                          </span>
                        </div>
                      ) : null}

                      <Link
                        href={`/a/${asg.publicId}`}
                        className={`px-5 py-2.5 rounded-lg font-semibold text-xs md:text-sm flex items-center gap-1.5 transition-all cursor-pointer ${
                          isSubmitted
                            ? 'bg-[#f1f3f4] hover:bg-[#e8eaed] dark:bg-[#292a2d] dark:hover:bg-[#333538] text-[#202124] dark:text-[#e3e3e3] border border-[#dadce0] dark:border-[#3c4043]'
                            : isInProgress
                            ? 'bg-[#b06000] hover:bg-[#924f00] text-white shadow-xs'
                            : 'app-button-secondary dark:bg-[#e3e3e3] dark:hover:bg-[#f1f3f4] text-white dark:text-[#202124] shadow-xs'
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
        <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#17181a] flex flex-col items-center justify-center text-[#202124] dark:text-[#e3e3e3] p-4">
          <div className="w-10 h-10 border-3 border-[#3c4043] dark:border-[#e3e3e3] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-[#5f6368] dark:text-[#9aa0a6] font-medium text-sm">Đang tải thông tin lớp học...</p>
        </div>
      }
    >
      <ClassPortalContent {...props} />
    </React.Suspense>
  );
}
