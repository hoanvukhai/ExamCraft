'use client';

import React, { useState, useEffect, use } from 'react';
import { Exam } from '@/types/exam';
import { A4Preview } from '@/components/A4Preview';
import { exportExamToDocx } from '@/lib/docx-export';
import { dbSaveExam } from '@/lib/db';
import { 
  Download, 
  Printer, 
  GraduationCap, 
  Share2, 
  Copy, 
  ExternalLink, 
  FileText, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

interface SharePageProps {
  params: Promise<{ id: string }>;
}

function ShareExamContent({ params }: SharePageProps) {
  const resolvedParams = use(params);
  const examId = resolvedParams.id;

  const [exam, setExam] = useState<Exam | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedToLocal, setCopiedToLocal] = useState(false);

  useEffect(() => {
    async function loadSharedExam() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/cloud/exams/${examId}`);
        const data = await res.json();
        if (data.success && data.exam) {
          setExam(data.exam);
        } else {
          setError(data.error || 'Đề thi không tồn tại hoặc đã bị xóa khỏi hệ thống chia sẻ.');
        }
      } catch {
        setError('Không thể kết nối đến máy chủ.');
      } finally {
        setIsLoading(false);
      }
    }
    loadSharedExam();
  }, [examId]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCloneToLocal = async () => {
    if (!exam) return;
    try {
      const cloned: Exam = {
        ...exam,
        id: `exam_clone_${Date.now()}`,
        metadata: {
          ...exam.metadata,
          title: `[Bản sao] ${exam.metadata.title}`,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await dbSaveExam(cloned);
      localStorage.setItem('examcraft_current_exam', JSON.stringify(cloned));
      setCopiedToLocal(true);
      setTimeout(() => {
        window.location.href = '/';
      }, 1200);
    } catch {
      alert('Không thể lưu bản sao.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-700">Đang tải đề thi chia sẻ...</p>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center border border-slate-200 shadow-xl">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900 mb-2">Liên kết không hợp lệ</h2>
          <p className="text-xs text-slate-600 mb-6">{error}</p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700"
          >
            Về trang chủ ExamCraft
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans pb-16">
      {/* Top Banner Thanh thao tác chia sẻ */}
      <header className="no-print sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-sm">{exam.metadata.title}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  Chế độ Chỉ Xem & Tải về
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Môn: {exam.metadata.subject.toUpperCase()} • Khối: {exam.metadata.grade} • {exam.questions.length} câu
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Nút làm bài thi trực tuyến */}
            <a
              href={`/test/${examId}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-xs cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Làm bài Online</span>
            </a>

            {/* Nút Tải file Word */}
            <button
              onClick={() => exportExamToDocx(exam)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>Tải file Word (.docx)</span>
            </button>

            {/* Nút In A4 / Xuất PDF */}
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-600" />
              <span>In A4</span>
            </button>

            {/* Nút Sao chép đề về máy để sửa */}
            <button
              onClick={handleCloneToLocal}
              disabled={copiedToLocal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all cursor-pointer"
            >
              {copiedToLocal ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Đã nạp vào máy! Đang chuyển...</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tạo bản sao để sửa</span>
                </>
              )}
            </button>

            {/* Sao chép liên kết */}
            <button
              onClick={handleCopyLink}
              className="p-1.5 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 transition-all"
              title="Sao chép link chia sẻ này"
            >
              {copiedLink ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Hiển thị đề thi định dạng trang A4 tiêu chuẩn */}
      <main className="max-w-5xl mx-auto py-6 px-2 sm:px-4">
        <A4Preview exam={exam} />
      </main>
    </div>
  );
}

export default function ShareExamPage(props: SharePageProps) {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ShareExamContent {...props} />
    </React.Suspense>
  );
}
