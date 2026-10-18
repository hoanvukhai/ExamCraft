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

  // Polling tự động mỗi 4 giây (theo đặc tả v3.1, tối ưu MON-BUG-001: tạm dừng khi tab bị ẩn)
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
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-medium text-sm">Đang tải màn hình giám sát thi trực tuyến...</p>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Không tìm thấy bài giao</h2>
          <p className="text-slate-400 text-sm mb-6">{error}</p>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1.5 text-xs text-slate-400">
              <Link href="/" className="hover:text-slate-200 flex items-center gap-1 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Soạn đề thi
              </Link>
              <span>/</span>
              <Link href="/teacher/groups" className="hover:text-slate-200 transition-colors">
                Lớp học
              </Link>
              <span>/</span>
              <span className="text-indigo-400 font-semibold">Giám sát bài thi</span>
            </div>

            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-black text-white">{assignment.title}</h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                  assignment.status === 'OPEN'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    assignment.status === 'OPEN' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                  }`}
                />
                {assignment.status === 'OPEN' ? 'Đang Mở' : 'Đã Đóng'}
              </span>
            </div>

            <p className="text-xs text-slate-400 mt-1">
              Lớp: <strong className="text-slate-200">{assignment.group?.name || 'Tự do'}</strong> • Thời lượng:{' '}
              {assignment.durationMinutes ? `${assignment.durationMinutes} phút` : 'Tự do'} • Mã phòng:{' '}
              <span className="font-mono text-indigo-300 font-bold">{assignment.publicId}</span>
            </p>
          </div>

          {/* Nhóm nút hành động nhanh */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Nút bật/tắt tự động làm mới */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              title="Tự động cập nhật bài nộp mỗi 4 giây"
              className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                autoRefresh
                  ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-spin' : ''}`} />
              <span>{autoRefresh ? `Cập nhật lúc ${lastRefreshed}` : 'Tắt tự động cập nhật'}</span>
            </button>

            {/* Nút Chép Link Học Sinh */}
            <button
              onClick={copyExamLink}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Đã chép link
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
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                assignment.status === 'OPEN'
                  ? 'bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
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
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Xuất Excel (CSV)
            </a>
          </div>
        </div>

        {/* Khối Thống Kê Tổng Quan & Phổ Điểm */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
              <span className="text-[11px] text-slate-400 block mb-1">Tổng học sinh</span>
              <span className="text-2xl font-black text-white">{stats.totalStudents}</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
              <span className="text-[11px] text-slate-400 block mb-1">Đã nộp bài</span>
              <span className="text-2xl font-black text-emerald-400">{stats.totalSubmitted}</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
              <span className="text-[11px] text-slate-400 block mb-1">Đang làm bài</span>
              <span className="text-2xl font-black text-amber-400">{stats.totalInProgress}</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
              <span className="text-[11px] text-slate-400 block mb-1">Điểm trung bình</span>
              <span className="text-2xl font-black text-indigo-400">{stats.avgScore}</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
              <span className="text-[11px] text-slate-400 block mb-1">Điểm cao nhất</span>
              <span className="text-2xl font-black text-emerald-400">{stats.maxScore}</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
              <span className="text-[11px] text-slate-400 block mb-1">Điểm giỏi (≥ 8.0)</span>
              <span className="text-2xl font-black text-violet-400">{stats.distribution.from8to10}</span>
            </div>
          </div>
        )}

        {/* Tab Switcher: Bảng Điểm Học Sinh vs Phân Tích Câu Hỏi (Item Analysis) */}
        <div className="flex border-b border-slate-800 gap-4 text-sm font-bold">
          <button
            onClick={() => setActiveTab('students')}
            className={`pb-3 px-1 border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'students'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" /> Bảng điểm & Bài nộp ({attempts.length})
          </button>
          <button
            onClick={() => setActiveTab('analysis')}
            className={`pb-3 px-1 border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'analysis'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" /> Phân tích tỷ lệ đúng theo từng câu (Item Analysis)
          </button>
        </div>

        {/* TAB 1: BẢNG ĐIỂM & DANH SÁCH BÀI LÀM */}
        {activeTab === 'students' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm theo tên học sinh..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <span className="text-xs text-slate-400">
                Hiển thị: <strong className="text-slate-200">{filteredAttempts.length}</strong> học sinh
              </span>
            </div>

            {filteredAttempts.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-400 text-xs">
                Chưa có học sinh nào nộp bài hoặc bắt đầu làm bài.
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-800/80 text-[11px] uppercase font-bold text-slate-400 border-b border-slate-800">
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
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredAttempts.map((att) => {
                        const isSubmitted = att.status === 'SUBMITTED';

                        return (
                          <tr key={att.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-3.5 px-4 font-semibold text-white">
                              {att.studentName}
                            </td>
                            <td className="py-3.5 px-4 text-slate-400">Lần {att.attemptNo}</td>
                            <td className="py-3.5 px-4">
                              {isSubmitted ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  <CheckCircle2 className="w-3 h-3" /> Đã nộp
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
                                  <Clock className="w-3 h-3" /> Đang làm
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              {att.score !== null ? (
                                <span
                                  className={`text-sm font-black px-2.5 py-1 rounded-xl ${
                                    att.score >= 8.0
                                      ? 'bg-emerald-500/20 text-emerald-400'
                                      : att.score >= 5.0
                                      ? 'bg-indigo-500/20 text-indigo-300'
                                      : 'bg-rose-500/20 text-rose-400'
                                  }`}
                                >
                                  {att.score}
                                  <span className="text-[10px] font-normal text-slate-400 ml-0.5">
                                    /{att.maxScore}
                                  </span>
                                </span>
                              ) : (
                                <span className="text-slate-500 italic">--</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-slate-400">
                              {new Date(att.startedAt).toLocaleTimeString('vi-VN')}
                            </td>
                            <td className="py-3.5 px-4 text-slate-400">
                              {att.submittedAt
                                ? new Date(att.submittedAt).toLocaleTimeString('vi-VN')
                                : '--'}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleOpenAttemptDetail(att.id)}
                                  className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" /> Xem bài
                                </button>
                                <button
                                  onClick={() => handleDeleteAttempt(att.id, att.studentName)}
                                  title="Xóa lượt làm này để học sinh làm lại"
                                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
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
            <div className="p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl text-xs text-indigo-300 leading-relaxed">
              <strong>Mẹo sư phạm:</strong> Hệ thống tự động đo lường tỷ lệ trả lời đúng của từng câu hỏi.
              Những câu có tỷ lệ đúng <span className="font-bold text-rose-400">&lt; 50%</span> là những điểm học sinh hay nhầm lẫn, giáo viên nên dành thời gian chữa chi tiết trên lớp.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {itemAnalysis.map((item) => (
                <div
                  key={item.questionId}
                  className={`bg-slate-900 border rounded-2xl p-5 shadow-lg space-y-3 transition-all ${
                    item.correctRate < 50
                      ? 'border-rose-500/40 hover:border-rose-500'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-xl bg-slate-800 text-indigo-400 font-bold text-xs flex items-center justify-center border border-slate-700">
                        {item.questionIndex}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        {item.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                          item.correctRate >= 75
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : item.correctRate >= 50
                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                            : 'bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse'
                        }`}
                      >
                        {item.correctRate}% Đúng
                      </span>
                    </div>
                  </div>

                  {/* Thanh biểu đồ tỷ lệ đúng */}
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.correctRate >= 75
                          ? 'bg-emerald-500'
                          : item.correctRate >= 50
                          ? 'bg-indigo-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${item.correctRate}%` }}
                    />
                  </div>

                  <div className="text-xs text-slate-400 flex justify-between">
                    <span>Số học sinh làm đúng: <strong className="text-white">{item.correctCount}</strong> / {item.totalAnswered} bạn</span>
                    <span>Thang điểm: {item.points}đ</span>
                  </div>

                  <div className="text-xs text-slate-200 line-clamp-2 pt-2 border-t border-slate-800">
                    <MathRenderer content={item.content} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Xem Chi Tiết Bài Làm & Chấm Điểm Thủ Công */}
        {selectedAttemptId && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-3xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white">
                    Bài làm của: {attemptDetail?.attempt.studentName || 'Đang tải...'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Điểm hiện tại: <strong className="text-emerald-400">{attemptDetail?.attempt.score}</strong> /{' '}
                    {attemptDetail?.attempt.maxScore}đ
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedAttemptId(null);
                    setAttemptDetail(null);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {loadingDetail ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                  <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-xs">Đang tải chi tiết từng câu trả lời...</p>
                </div>
              ) : attemptDetail ? (
                <div className="space-y-6 my-4">
                  {attemptDetail.questions.map((q) => (
                    <div
                      key={q.questionId}
                      className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-2xl space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-400">
                          Câu {q.index} ({q.points}đ)
                        </span>
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                            q.isCorrect
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                          }`}
                        >
                          {q.isCorrect ? 'Đúng' : 'Sai'} ({q.earned}đ)
                        </span>
                      </div>

                      <div className="text-sm text-slate-100">
                        <MathRenderer content={q.content} />
                      </div>

                      <div className="text-xs space-y-1.5 p-3 bg-slate-900 rounded-xl border border-slate-800">
                        <div>
                          <span className="text-slate-400">Học sinh chọn: </span>
                          <span className="font-semibold text-white">
                            {typeof q.studentResponse === 'object'
                              ? JSON.stringify(q.studentResponse)
                              : String(q.studentResponse || 'Chưa làm')}
                          </span>
                        </div>
                        {q.payload?.correct && (
                          <div>
                            <span className="text-emerald-400">Đáp án chuẩn: </span>
                            <span className="font-bold text-emerald-400">{q.payload.correct}</span>
                          </div>
                        )}
                        {q.solution && (
                          <div className="mt-2 text-slate-300">
                            <span className="text-indigo-400 font-semibold block mb-1">Hướng dẫn giải:</span>
                            <MathRenderer content={q.solution} />
                          </div>
                        )}
                      </div>

                      {/* Ô Chấm Điểm & Nhận Xét của Giáo Viên */}
                      <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2">
                          <label className="text-slate-400 font-semibold">Điều chỉnh điểm:</label>
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
                            className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white text-center font-bold"
                          />
                          <span className="text-slate-500">/ {q.points}đ</span>
                        </div>

                        <div className="text-[11px] text-slate-400">
                          {savingGrade ? 'Đang lưu điểm...' : 'Điểm tự động cập nhật khi đổi'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => {
                    setSelectedAttemptId(null);
                    setAttemptDetail(null);
                  }}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl"
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
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-400 font-medium text-sm">Đang tải màn hình giám sát...</p>
        </div>
      }
    >
      <TeacherMonitorContent {...props} />
    </React.Suspense>
  );
}
