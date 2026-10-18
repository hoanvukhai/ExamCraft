'use client';

import React, { useState, useEffect } from 'react';
import { Exam } from '@/types/exam';
import Link from 'next/link';
import { 
  Users, 
  Download, 
  RefreshCw, 
  X, 
  Award, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Search,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

export interface StudentSubmission {
  id: string;
  examId: string;
  studentName: string;
  studentClass: string;
  schoolName?: string;
  submittedAt: string;
  durationSeconds: number;
  totalScore: number;
  maxScore: number;
  answers: Record<string, any>;
  part1Score?: number;
  part2Score?: number;
  part3Score?: number;
  part4Score?: number;
}

interface StudentResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam: Exam;
  onOpenShareModal: () => void;
}

export const StudentResultsModal: React.FC<StudentResultsModalProps> = ({
  isOpen,
  onClose,
  exam,
  onOpenShareModal,
}) => {
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchResults = async () => {
    // Trong ExamCraft v3.1, toàn bộ điểm thi được lưu trữ an toàn trong PostgreSQL
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchResults();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Tính toán thống kê
  const totalCount = submissions.length;
  const avgScore =
    totalCount > 0
      ? (submissions.reduce((sum, s) => sum + s.totalScore, 0) / totalCount).toFixed(2)
      : '0.00';
  const highestScore =
    totalCount > 0
      ? Math.max(...submissions.map((s) => s.totalScore)).toFixed(2)
      : '0.00';
  const excellentCount = submissions.filter((s) => s.totalScore >= 8.0).length;

  const filtered = submissions.filter(
    (s) =>
      s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentClass.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Xuất file CSV (tương thích Excel tiếng Việt UTF-8 BOM)
  const handleExportCsv = () => {
    if (submissions.length === 0) {
      alert('Chưa có học sinh nào nộp bài để xuất bảng điểm.');
      return;
    }

    const headers = [
      'STT',
      'Họ và tên',
      'Lớp',
      'Trường',
      'Thời gian nộp',
      'Thời gian làm (giây)',
      'Điểm Phần I',
      'Điểm Phần II',
      'Điểm Phần III',
      'Tổng điểm',
      'Thang điểm',
    ];

    // Chống CSV Formula Injection: nếu chuỗi bắt đầu bằng =, +, -, @, \t, \r thì chèn dấu nháy đơn '
    const sanitizeCsvCell = (val: string): string => {
      if (!val) return '""';
      const trimmed = val.trim();
      const triggerChars = ['=', '+', '-', '@', '\t', '\r'];
      const safeVal = triggerChars.some((char) => trimmed.startsWith(char))
        ? `'${val}`
        : val;
      return `"${safeVal.replace(/"/g, '""')}"`;
    };

    const rows = submissions.map((s, idx) => [
      idx + 1,
      sanitizeCsvCell(s.studentName),
      sanitizeCsvCell(s.studentClass),
      sanitizeCsvCell(s.schoolName || ''),
      `"${new Date(s.submittedAt).toLocaleString('vi-VN')}"`,
      s.durationSeconds,
      s.part1Score,
      s.part2Score,
      s.part3Score,
      s.totalScore,
      s.maxScore,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bang_Diem_${exam.metadata.title.replace(/\s+/g, '_')}_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}p ${s}s`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                  Bảng Điểm Làm Bài Trực Tuyến
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {totalCount} bài nộp
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Đề: {exam.metadata.title} ({exam.metadata.subject.toUpperCase()} - Khối {exam.metadata.grade})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchResults}
              disabled={isLoading}
              title="Làm mới bảng điểm"
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Thông báo phân hệ Giám sát Phòng thi v3.1 an toàn */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3 my-3 text-xs text-indigo-900 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
            <span>
              Trong kiến trúc ExamCraft v3.1, kết quả làm bài của học sinh được bảo mật tuyệt đối và quản lý tập trung tại phân hệ <strong>Giám sát Phòng thi</strong>.
            </span>
          </div>
          <Link
            href="/teacher/assignments"
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shrink-0 transition-colors flex items-center gap-1 text-[11px]"
          >
            <span>Mở Phòng thi</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 4 Thẻ thống kê số liệu */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-2 shrink-0">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              <span>Tổng lượt nộp</span>
            </div>
            <div className="text-xl font-black text-slate-900 mt-1">{totalCount}</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-200">
            <div className="text-[11px] text-indigo-700 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
              <span>Điểm trung bình</span>
            </div>
            <div className="text-xl font-black text-indigo-700 mt-1">{avgScore} / 10</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200">
            <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-emerald-600" />
              <span>Điểm cao nhất</span>
            </div>
            <div className="text-xl font-black text-emerald-700 mt-1">{highestScore}</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200">
            <div className="text-[11px] text-amber-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
              <span>Học sinh giỏi (≥8đ)</span>
            </div>
            <div className="text-xl font-black text-amber-700 mt-1">{excellentCount} em</div>
          </div>
        </div>

        {/* Thanh tìm kiếm & Xuất Excel */}
        <div className="flex items-center justify-between gap-3 mb-3 shrink-0">
          <div className="relative grow max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên học sinh, lớp..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-600"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenShareModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-all cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Lấy link thi</span>
            </button>

            <button
              onClick={handleExportCsv}
              disabled={submissions.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất file Excel (CSV)</span>
            </button>
          </div>
        </div>

        {/* Bảng kết quả */}
        <div className="grow overflow-y-auto rounded-2xl border border-slate-200">
          {submissions.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold">Chưa có học sinh nào nộp bài thi này.</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Thầy/Cô hãy gửi link làm bài trực tuyến cho học sinh để bắt đầu nhận bài làm!
              </p>
              <button
                onClick={onOpenShareModal}
                className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-all cursor-pointer"
              >
                Lấy link gửi học sinh
              </button>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-bold sticky top-0 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 text-center w-12">STT</th>
                  <th className="py-2.5 px-3">Họ và Tên</th>
                  <th className="py-2.5 px-3">Lớp</th>
                  <th className="py-2.5 px-3">Thời gian nộp</th>
                  <th className="py-2.5 px-3 text-center">Làm bài</th>
                  <th className="py-2.5 px-3 text-center">Phần I</th>
                  <th className="py-2.5 px-3 text-center">Phần II</th>
                  <th className="py-2.5 px-3 text-center">Phần III</th>
                  <th className="py-2.5 px-3 text-center font-black text-indigo-900">Tổng điểm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s, idx) => {
                  const scoreColor =
                    s.totalScore >= 8.0
                      ? 'text-emerald-700 bg-emerald-50'
                      : s.totalScore >= 5.0
                      ? 'text-indigo-700 bg-indigo-50'
                      : 'text-rose-700 bg-rose-50';

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2 px-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                      <td className="py-2 px-3 font-bold text-slate-900">{s.studentName}</td>
                      <td className="py-2 px-3 text-slate-600 font-medium">{s.studentClass}</td>
                      <td className="py-2 px-3 text-slate-500 text-[11px]">
                        {new Date(s.submittedAt).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        {new Date(s.submittedAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="py-2 px-3 text-center text-slate-500 font-mono text-[11px]">
                        {formatDuration(s.durationSeconds)}
                      </td>
                      <td className="py-2 px-3 text-center text-slate-600 font-medium">
                        {(s.part1Score ?? 0).toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-center text-slate-600 font-medium">
                        {(s.part2Score ?? 0).toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-center text-slate-600 font-medium">
                        {(s.part3Score ?? 0).toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md font-black text-xs ${scoreColor}`}
                        >
                          {s.totalScore.toFixed(2).replace('.', ',')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500">
            Hệ thống chấm điểm tự động theo tiêu chuẩn Thông tư 17/2025/TT-BGDĐT
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
