'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { MathRenderer } from '@/components/MathRenderer';
import {
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  RefreshCw,
  Search,
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  Copy,
  Trash2,
  Eye,
  Award,
  BarChart3,
  Calendar,
  Sparkles,
  Lock,
  Unlock,
  PlusCircle,
  Edit3,
  X,
} from 'lucide-react';

interface AssignmentStats {
  totalStudents: number;
  totalSubmitted: number;
  totalInProgress: number;
  avgScore: number;
  maxScore: number;
  minScore: number;
  distribution: {
    under5: number;
    from5to65: number;
    from65to8: number;
    from8to10: number;
  };
}

interface ItemAnalysis {
  questionId: string;
  questionIndex: number;
  type: string;
  points: number;
  content: string;
  totalAnswered: number;
  correctCount: number;
  correctRate: number;
}

interface StudentAttemptItem {
  id: string;
  studentId: string;
  studentName: string;
  attemptNo: number;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'TERMINATED';
  score: number | null;
  maxScore: number;
  startedAt: string;
  submittedAt?: string;
  deadlineAt?: string;
  answersCount: number;
}

interface AttemptDetailQuestion {
  questionId: string;
  index: number;
  type: string;
  difficulty?: string;
  content: string;
  payload?: any;
  solution?: string;
  points: number;
  studentResponse: any;
  isCorrect: boolean;
  earned: number;
  teacherComment?: string | null;
}

function TeacherMonitorContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  const [assignment, setAssignment] = useState<any>(null);
  const [stats, setStats] = useState<AssignmentStats | null>(null);
  const [itemAnalysis, setItemAnalysis] = useState<ItemAnalysis[]>([]);
  const [attempts, setAttempts] = useState<StudentAttemptItem[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'students' | 'analysis'>('students');
  const [copiedLink, setCopiedLink] = useState(false);

  // Modal xem chi tiết bài làm & chấm tay
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);
  const [attemptDetail, setAttemptDetail] = useState<{
    attempt: any;
    questions: AttemptDetailQuestion[];
  } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [savingGrade, setSavingGrade] = useState(false);

  // Tải dữ liệu bài thi
  const fetchAssignmentData = useCallback(async () => {
    try {
      const res = await fetch(`/api/teacher/assignments/${id}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Không thể tải thông tin bài giao');
        return;
      }

      setAssignment(data.assignment);
      setStats(data.stats);
      setItemAnalysis(data.itemAnalysis || []);
      setAttempts(data.attempts || []);

      const now = new Date();
      setLastRefreshed(
        `${now.getHours().toString().padStart(2, '0')}:${now
          .getMinutes()
          .toString()
          .padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAssignmentData();
  }, [fetchAssignmentData]);

  // Polling tự động mỗi 4 giây (theo đặc tả v3.1, tạm dừng khi tab bị ẩn)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      fetchAssignmentData();
    }, 4000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchAssignmentData]);

  // Đóng / Mở lại bài thi
  const handleToggleStatus = async () => {
    if (!assignment) return;
    const newStatus = assignment.status === 'OPEN' ? 'CLOSED' : 'OPEN';
    try {
      const res = await fetch(`/api/teacher/assignments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchAssignmentData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Mở modal xem chi tiết bài làm
  const handleOpenAttemptDetail = async (attemptId: string) => {
    setSelectedAttemptId(attemptId);
    try {
      setLoadingDetail(true);
      const res = await fetch(`/api/teacher/attempts/${attemptId}`);
      const data = await res.json();
      if (res.ok) {
        setAttemptDetail(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Chấm tay hoặc điều chỉnh điểm
  const handleSaveGrade = async (questionKey: string, earned: number, comment?: string) => {
    if (!selectedAttemptId) return;
    try {
      setSavingGrade(true);
      const res = await fetch(`/api/teacher/attempts/${selectedAttemptId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionKey,
          earned,
          teacherComment: comment,
        }),
      });
      if (res.ok) {
        handleOpenAttemptDetail(selectedAttemptId);
        fetchAssignmentData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingGrade(false);
    }
  };

  // Xóa lượt làm bài (cho học sinh làm lại)
  const handleDeleteAttempt = async (attemptId: string, studentName: string) => {
    if (!confirm(`Xác nhận xóa lượt làm bài của học sinh ${studentName}? Học sinh sẽ được làm lại từ đầu.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/teacher/attempts/${attemptId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchAssignmentData();
        if (selectedAttemptId === attemptId) {
          setSelectedAttemptId(null);
          setAttemptDetail(null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const copyExamLink = () => {
    if (!assignment?.publicId) return;
    const url = `${window.location.origin}/a/${assignment.publicId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const filteredAttempts = attempts.filter((att) =>
    att.studentName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && !assignment) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#181818] flex flex-col items-center justify-center text-[#202124] dark:text-[#e3e3e3] p-4">
        <div className="w-10 h-10 border-3 border-[#1a73e8] dark:border-[#8ab4f8] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-[#5f6368] dark:text-[#9aa0a6] font-medium text-sm">Đang tải màn hình giám sát thi trực tuyến...</p>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#181818] flex flex-col items-center justify-center text-[#202124] dark:text-[#e3e3e3] p-4">
        <div className="max-w-md w-full bg-white dark:bg-[#1e1e1e] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl p-8 text-center shadow-xl">
          <AlertCircle className="w-12 h-12 text-[#c5221f] dark:text-[#f28b82] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#202124] dark:text-[#e3e3e3] mb-2">Không tìm thấy bài giao</h2>
          <p className="text-[#5f6368] dark:text-[#9aa0a6] text-sm mb-6">{error}</p>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-[#1a73e8] dark:bg-[#8ab4f8] hover:bg-[#1557b0] dark:hover:bg-[#aecbfa] text-white dark:text-[#202124] text-sm font-semibold rounded-full transition-all shadow-xs"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#181818] text-[#202124] dark:text-[#e3e3e3] py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#dadce0] dark:border-[#3c4043]">
          <div>
            <div className="flex items-center gap-2 mb-1.5 text-xs text-[#5f6368] dark:text-[#9aa0a6]">
              <Link href="/" className="hover:text-[#202124] dark:hover:text-[#e3e3e3] flex items-center gap-1 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Soạn đề thi
              </Link>
              <span>/</span>
              <Link href="/teacher/groups" className="hover:text-[#202124] dark:hover:text-[#e3e3e3] transition-colors">
                Lớp học
              </Link>
              <span>/</span>
              <span className="text-[#1a73e8] dark:text-[#8ab4f8] font-semibold">Giám sát bài thi</span>
            </div>

            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-bold text-[#202124] dark:text-[#e3e3e3]">{assignment.title}</h1>
              <span
                className={`px-3 py-0.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${
                  assignment.status === 'OPEN'
                    ? 'bg-[#e6f4ea] dark:bg-[#0f291e] text-[#137333] dark:text-[#5bb98c] border-[#ceead6] dark:border-[#1e4d38]'
                    : 'bg-[#fce8e6] dark:bg-[#371918] text-[#c5221f] dark:text-[#f28b82] border-[#fad2cf] dark:border-[#5c2523]'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    assignment.status === 'OPEN' ? 'bg-[#137333] dark:bg-[#5bb98c] animate-pulse' : 'bg-[#c5221f] dark:bg-[#f28b82]'
                  }`}
                />
                {assignment.status === 'OPEN' ? 'Đang Mở' : 'Đã Đóng'}
              </span>
            </div>

            <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] mt-1">
              Lớp: <strong className="text-[#202124] dark:text-[#e3e3e3]">{assignment.group?.name || 'Tự do'}</strong> • Thời lượng:{' '}
              {assignment.durationMinutes ? `${assignment.durationMinutes} phút` : 'Tự do'} • Mã phòng:{' '}
              <span className="font-mono text-[#1a73e8] dark:text-[#8ab4f8] font-bold">{assignment.publicId}</span>
            </p>
          </div>

          {/* Nhóm nút hành động nhanh */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Nút bật/tắt tự động làm mới */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              title="Tự động cập nhật bài nộp mỗi 4 giây"
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1.5 transition-all cursor-pointer ${
                autoRefresh
                  ? 'bg-[#e8f0fe] dark:bg-[#1e2a38] border-[#1a73e8]/30 dark:border-[#8ab4f8]/30 text-[#1a73e8] dark:text-[#8ab4f8]'
                  : 'bg-[#f1f3f4] dark:bg-[#282828] border-[#dadce0] dark:border-[#3c4043] text-[#5f6368] dark:text-[#9aa0a6]'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-spin' : ''}`} />
              <span>{autoRefresh ? `Cập nhật lúc ${lastRefreshed}` : 'Tắt tự động cập nhật'}</span>
            </button>

            {/* Nút Chép Link Học Sinh */}
            <button
              onClick={copyExamLink}
              className="px-3.5 py-1.5 bg-white dark:bg-[#202124] hover:bg-[#f1f3f4] dark:hover:bg-[#282828] border border-[#dadce0] dark:border-[#3c4043] text-[#202124] dark:text-[#e3e3e3] rounded-full text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              {copiedLink ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#137333] dark:text-[#5bb98c]" /> Đã chép link
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Chép link thi
                </>
              )}
            </button>

            {/* Nút Đóng / Mở bài thi */}
            <button
              onClick={handleToggleStatus}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                assignment.status === 'OPEN'
                  ? 'bg-[#fce8e6] hover:bg-[#fad2cf] dark:bg-[#371918] dark:hover:bg-[#4a2221] text-[#c5221f] dark:text-[#f28b82] border border-[#fad2cf] dark:border-[#5c2523]'
                  : 'bg-[#e6f4ea] hover:bg-[#ceead6] dark:bg-[#0f291e] dark:hover:bg-[#1a4030] text-[#137333] dark:text-[#5bb98c] border border-[#ceead6] dark:border-[#1e4d38]'
              }`}
            >
              {assignment.status === 'OPEN' ? (
                <>
                  <Lock className="w-3.5 h-3.5" /> Khóa bài thi
                </>
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5" /> Mở lại bài thi
                </>
              )}
            </button>

            {/* Nút Xuất Bảng Điểm CSV */}
            <a
              href={`/api/teacher/assignments/${id}/export-csv`}
              download
              className="px-4 py-1.5 bg-[#137333] hover:bg-[#0f5c29] text-white rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Xuất Excel (CSV)
            </a>
          </div>
        </div>

        {/* Khối Thống Kê Tổng Quan & Phổ Điểm */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl p-4 text-center shadow-xs">
              <span className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] block mb-1">Tổng học sinh</span>
              <span className="text-2xl font-bold text-[#202124] dark:text-[#e3e3e3]">{stats.totalStudents}</span>
            </div>
            <div className="bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl p-4 text-center shadow-xs">
              <span className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] block mb-1">Đã nộp bài</span>
              <span className="text-2xl font-bold text-[#137333] dark:text-[#5bb98c]">{stats.totalSubmitted}</span>
            </div>
            <div className="bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl p-4 text-center shadow-xs">
              <span className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] block mb-1">Đang làm bài</span>
              <span className="text-2xl font-bold text-[#b06000] dark:text-[#fdd663]">{stats.totalInProgress}</span>
            </div>
            <div className="bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl p-4 text-center shadow-xs">
              <span className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] block mb-1">Điểm trung bình</span>
              <span className="text-2xl font-bold text-[#1a73e8] dark:text-[#8ab4f8]">{stats.avgScore}</span>
            </div>
            <div className="bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl p-4 text-center shadow-xs">
              <span className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] block mb-1">Điểm cao nhất</span>
              <span className="text-2xl font-bold text-[#137333] dark:text-[#5bb98c]">{stats.maxScore}</span>
            </div>
            <div className="bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl p-4 text-center shadow-xs">
              <span className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] block mb-1">Điểm giỏi (≥ 8.0)</span>
              <span className="text-2xl font-bold text-[#1a73e8] dark:text-[#8ab4f8]">{stats.distribution.from8to10}</span>
            </div>
          </div>
        )}

        {/* Tab Switcher: Bảng Điểm Học Sinh vs Phân Tích Câu Hỏi (Item Analysis) */}
        <div className="flex border-b border-[#dadce0] dark:border-[#3c4043] gap-6 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('students')}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'students'
                ? 'border-[#1a73e8] dark:border-[#8ab4f8] text-[#1a73e8] dark:text-[#8ab4f8]'
                : 'border-transparent text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124] dark:hover:text-[#e3e3e3]'
            }`}
          >
            <Users className="w-4 h-4" /> Bảng điểm & Bài nộp ({attempts.length})
          </button>
          <button
            onClick={() => setActiveTab('analysis')}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'analysis'
                ? 'border-[#1a73e8] dark:border-[#8ab4f8] text-[#1a73e8] dark:text-[#8ab4f8]'
                : 'border-transparent text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124] dark:hover:text-[#e3e3e3]'
            }`}
          >
            <BarChart3 className="w-4 h-4" /> Phân tích câu hỏi ({itemAnalysis.length})
          </button>
        </div>

        {/* TAB 1: BẢNG ĐIỂM & DANH SÁCH BÀI LÀM */}
        {activeTab === 'students' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5f6368] dark:text-[#9aa0a6]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm theo tên học sinh..."
                  className="w-full bg-white dark:bg-[#1e1e1e] border border-[#dadce0] dark:border-[#3c4043] rounded-full pl-10 pr-4 py-2 text-xs text-[#202124] dark:text-[#e3e3e3] placeholder-[#5f6368] dark:placeholder-[#9aa0a6] focus:outline-none focus:border-[#1a73e8] dark:focus:border-[#8ab4f8]"
                />
              </div>
              <span className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">
                Hiển thị: <strong className="text-[#202124] dark:text-[#e3e3e3]">{filteredAttempts.length}</strong> học sinh
              </span>
            </div>

            {filteredAttempts.length === 0 ? (
              <div className="bg-white dark:bg-[#1e1e1e] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl p-10 text-center text-[#5f6368] dark:text-[#9aa0a6] text-xs">
                Chưa có học sinh nào nộp bài hoặc bắt đầu làm bài.
              </div>
            ) : (
              <div className="bg-white dark:bg-[#1e1e1e] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-[#202124] dark:text-[#e3e3e3]">
                    <thead className="bg-[#f8f9fa] dark:bg-[#242424] text-[11px] uppercase font-bold text-[#5f6368] dark:text-[#9aa0a6] border-b border-[#dadce0] dark:border-[#3c4043]">
                      <tr>
                        <th className="py-3 px-4">Họ và tên học sinh</th>
                        <th className="py-3 px-4">Lượt làm</th>
                        <th className="py-3 px-4">Trạng thái</th>
                        <th className="py-3 px-4 text-center">Điểm số</th>
                        <th className="py-3 px-4">Bắt đầu lúc</th>
                        <th className="py-3 px-4">Nộp bài lúc</th>
                        <th className="py-3 px-4 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#dadce0] dark:divide-[#3c4043]">
                      {filteredAttempts.map((att) => {
                        const isSubmitted = att.status === 'SUBMITTED';

                        return (
                          <tr key={att.id} className="hover:bg-[#f1f3f4] dark:hover:bg-[#282828] transition-colors">
                            <td className="py-3.5 px-4 font-semibold text-[#202124] dark:text-[#e3e3e3]">
                              {att.studentName}
                            </td>
                            <td className="py-3.5 px-4 text-[#5f6368] dark:text-[#9aa0a6]">Lần {att.attemptNo}</td>
                            <td className="py-3.5 px-4">
                              {isSubmitted ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#e6f4ea] dark:bg-[#0f291e] text-[#137333] dark:text-[#5bb98c] border border-[#ceead6] dark:border-[#1e4d38]">
                                  <CheckCircle2 className="w-3 h-3" /> Đã nộp
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#fef7e0] dark:bg-[#33250b] text-[#b06000] dark:text-[#fdd663] border border-[#feefc3] dark:border-[#4d380e] animate-pulse">
                                  <Clock className="w-3 h-3" /> Đang làm
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              {att.score !== null ? (
                                <span
                                  className={`text-sm font-bold px-2.5 py-1 rounded-full ${
                                    att.score >= 8.0
                                      ? 'bg-[#e6f4ea] dark:bg-[#0f291e] text-[#137333] dark:text-[#5bb98c]'
                                      : att.score >= 5.0
                                      ? 'bg-[#e8f0fe] dark:bg-[#1e2a38] text-[#1a73e8] dark:text-[#8ab4f8]'
                                      : 'bg-[#fce8e6] dark:bg-[#371918] text-[#c5221f] dark:text-[#f28b82]'
                                  }`}
                                >
                                  {att.score}
                                  <span className="text-[10px] font-normal opacity-70 ml-0.5">
                                    /{att.maxScore}
                                  </span>
                                </span>
                              ) : (
                                <span className="text-[#5f6368] dark:text-[#9aa0a6] italic">--</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-[#5f6368] dark:text-[#9aa0a6]">
                              {new Date(att.startedAt).toLocaleTimeString('vi-VN')}
                            </td>
                            <td className="py-3.5 px-4 text-[#5f6368] dark:text-[#9aa0a6]">
                              {att.submittedAt
                                ? new Date(att.submittedAt).toLocaleTimeString('vi-VN')
                                : '--'}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleOpenAttemptDetail(att.id)}
                                  className="px-3 py-1.5 bg-[#e8f0fe] dark:bg-[#1e2a38] hover:bg-[#d2e3fc] dark:hover:bg-[#2b3a4a] text-[#1a73e8] dark:text-[#8ab4f8] border border-[#1a73e8]/30 dark:border-[#8ab4f8]/30 rounded-full text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" /> Xem bài
                                </button>
                                <button
                                  onClick={() => handleDeleteAttempt(att.id, att.studentName)}
                                  title="Xóa lượt làm này để học sinh làm lại"
                                  className="p-1.5 text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#c5221f] dark:hover:text-[#f28b82] hover:bg-[#fce8e6] dark:hover:bg-[#371918] rounded-full transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ITEM ANALYSIS - PHÂN TÍCH THEO CÂU HỎI */}
        {activeTab === 'analysis' && (
          <div className="space-y-4">
            <div className="p-4 bg-[#e8f0fe] dark:bg-[#1e2a38] border border-[#1a73e8]/20 dark:border-[#8ab4f8]/20 rounded-2xl text-xs text-[#1a73e8] dark:text-[#8ab4f8] leading-relaxed">
              <strong>Mẹo sư phạm:</strong> Hệ thống tự động đo lường tỷ lệ trả lời đúng của từng câu hỏi.
              Những câu có tỷ lệ đúng <span className="font-bold text-[#c5221f] dark:text-[#f28b82]">&lt; 50%</span> là những điểm học sinh hay nhầm lẫn, giáo viên nên dành thời gian chữa chi tiết trên lớp.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {itemAnalysis.map((item) => (
                <div
                  key={item.questionId}
                  className={`bg-white dark:bg-[#1e1e1e] border rounded-2xl p-5 shadow-xs space-y-3 transition-all ${
                    item.correctRate < 50
                      ? 'border-[#f28b82]/50 hover:border-[#f28b82]'
                      : 'border-[#dadce0] dark:border-[#3c4043] hover:border-[#bdc1c6] dark:hover:border-[#5f6368]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-[#f1f3f4] dark:bg-[#282828] text-[#1a73e8] dark:text-[#8ab4f8] font-bold text-xs flex items-center justify-center border border-[#dadce0] dark:border-[#3c4043]">
                        {item.questionIndex}
                      </span>
                      <span className="text-[11px] font-bold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider">
                        {item.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          item.correctRate >= 75
                            ? 'bg-[#e6f4ea] dark:bg-[#0f291e] text-[#137333] dark:text-[#5bb98c] border-[#ceead6] dark:border-[#1e4d38]'
                            : item.correctRate >= 50
                            ? 'bg-[#e8f0fe] dark:bg-[#1e2a38] text-[#1a73e8] dark:text-[#8ab4f8] border-[#1a73e8]/30 dark:border-[#8ab4f8]/30'
                            : 'bg-[#fce8e6] dark:bg-[#371918] text-[#c5221f] dark:text-[#f28b82] border-[#fad2cf] dark:border-[#5c2523] animate-pulse'
                        }`}
                      >
                        {item.correctRate}% Đúng
                      </span>
                    </div>
                  </div>

                  {/* Thanh biểu đồ tỷ lệ đúng */}
                  <div className="w-full bg-[#f1f3f4] dark:bg-[#282828] rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.correctRate >= 75
                          ? 'bg-[#137333] dark:bg-[#5bb98c]'
                          : item.correctRate >= 50
                          ? 'bg-[#1a73e8] dark:bg-[#8ab4f8]'
                          : 'bg-[#c5221f] dark:bg-[#f28b82]'
                      }`}
                      style={{ width: `${item.correctRate}%` }}
                    />
                  </div>

                  <div className="text-xs text-[#5f6368] dark:text-[#9aa0a6] flex justify-between">
                    <span>Số học sinh làm đúng: <strong className="text-[#202124] dark:text-[#e3e3e3]">{item.correctCount}</strong> / {item.totalAnswered} bạn</span>
                    <span>Thang điểm: {item.points}đ</span>
                  </div>

                  <div className="text-xs text-[#202124] dark:text-[#e3e3e3] line-clamp-2 pt-2 border-t border-[#dadce0] dark:border-[#3c4043]">
                    <MathRenderer content={item.content} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Xem Chi Tiết Bài Làm & Chấm Điểm Thủ Công */}
        {selectedAttemptId && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="max-w-3xl w-full bg-white dark:bg-[#1e1e1e] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-[#dadce0] dark:border-[#3c4043]">
                <div>
                  <h3 className="text-base font-bold text-[#202124] dark:text-[#e3e3e3]">
                    Bài làm của: {attemptDetail?.attempt.studentName || 'Đang tải...'}
                  </h3>
                  <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">
                    Điểm hiện tại: <strong className="text-[#137333] dark:text-[#5bb98c]">{attemptDetail?.attempt.score}</strong> /{' '}
                    {attemptDetail?.attempt.maxScore}đ
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedAttemptId(null);
                    setAttemptDetail(null);
                  }}
                  className="p-1.5 rounded-full text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#f1f3f4] dark:hover:bg-[#282828] hover:text-[#202124] dark:hover:text-[#e3e3e3] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {loadingDetail ? (
                <div className="py-20 flex flex-col items-center justify-center text-[#5f6368] dark:text-[#9aa0a6]">
                  <div className="w-8 h-8 border-3 border-[#1a73e8] dark:border-[#8ab4f8] border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-xs">Đang tải chi tiết từng câu trả lời...</p>
                </div>
              ) : attemptDetail ? (
                <div className="space-y-6 my-4">
                  {attemptDetail.questions.map((q) => (
                    <div
                      key={q.questionId}
                      className="p-4 bg-[#f8f9fa] dark:bg-[#242424] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#1a73e8] dark:text-[#8ab4f8]">
                          Câu {q.index} ({q.points}đ)
                        </span>
                        <span
                          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                            q.isCorrect
                              ? 'bg-[#e6f4ea] dark:bg-[#0f291e] text-[#137333] dark:text-[#5bb98c] border-[#ceead6] dark:border-[#1e4d38]'
                              : 'bg-[#fce8e6] dark:bg-[#371918] text-[#c5221f] dark:text-[#f28b82] border-[#fad2cf] dark:border-[#5c2523]'
                          }`}
                        >
                          {q.isCorrect ? 'Đúng' : 'Sai'} ({q.earned}đ)
                        </span>
                      </div>

                      <div className="text-sm text-[#202124] dark:text-[#e3e3e3]">
                        <MathRenderer content={q.content} />
                      </div>

                      <div className="text-xs space-y-1.5 p-3 bg-white dark:bg-[#1e1e1e] rounded-xl border border-[#dadce0] dark:border-[#3c4043]">
                        <div>
                          <span className="text-[#5f6368] dark:text-[#9aa0a6]">Học sinh chọn: </span>
                          <span className="font-semibold text-[#202124] dark:text-[#e3e3e3]">
                            {typeof q.studentResponse === 'object'
                              ? JSON.stringify(q.studentResponse)
                              : String(q.studentResponse || 'Chưa làm')}
                          </span>
                        </div>
                        {q.payload?.correct && (
                          <div>
                            <span className="text-[#137333] dark:text-[#5bb98c]">Đáp án chuẩn: </span>
                            <span className="font-bold text-[#137333] dark:text-[#5bb98c]">{q.payload.correct}</span>
                          </div>
                        )}
                        {q.solution && (
                          <div className="mt-2 text-[#5f6368] dark:text-[#9aa0a6]">
                            <span className="text-[#1a73e8] dark:text-[#8ab4f8] font-semibold block mb-1">Hướng dẫn giải:</span>
                            <MathRenderer content={q.solution} />
                          </div>
                        )}
                      </div>

                      {/* Ô Chấm Điểm & Nhận Xét của Giáo Viên */}
                      <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2">
                          <label className="text-[#5f6368] dark:text-[#9aa0a6] font-semibold">Điều chỉnh điểm:</label>
                          <input
                            type="number"
                            step="0.05"
                            defaultValue={q.earned}
                            onBlur={(e) => {
                              const val = parseFloat(e.target.value);
                              if (!isNaN(val) && val !== q.earned) {
                                handleSaveGrade(q.questionId, val, q.teacherComment || undefined);
                              }
                            }}
                            className="w-20 bg-white dark:bg-[#1e1e1e] border border-[#dadce0] dark:border-[#3c4043] rounded-lg px-2.5 py-1 text-[#202124] dark:text-[#e3e3e3] text-center font-bold"
                          />
                          <span className="text-[#5f6368] dark:text-[#9aa0a6]">/ {q.points}đ</span>
                        </div>

                        <div className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6]">
                          {savingGrade ? 'Đang lưu điểm...' : 'Điểm tự động cập nhật khi đổi'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="pt-4 border-t border-[#dadce0] dark:border-[#3c4043] flex justify-end">
                <button
                  onClick={() => {
                    setSelectedAttemptId(null);
                    setAttemptDetail(null);
                  }}
                  className="px-5 py-2 bg-[#f1f3f4] hover:bg-[#e8eaed] dark:bg-[#282828] dark:hover:bg-[#333538] text-[#202124] dark:text-[#e3e3e3] text-xs font-semibold rounded-full cursor-pointer transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TeacherMonitorPage(props: { params: Promise<{ id: string }> }) {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#181818] flex flex-col items-center justify-center text-[#202124] dark:text-[#e3e3e3] p-4">
          <div className="w-10 h-10 border-3 border-[#1a73e8] dark:border-[#8ab4f8] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-[#5f6368] dark:text-[#9aa0a6] font-medium text-sm">Đang tải màn hình giám sát...</p>
        </div>
      }
    >
      <TeacherMonitorContent {...props} />
    </React.Suspense>
  );
}
