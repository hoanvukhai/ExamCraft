'use client';

import React, { useState, useEffect, use } from 'react';
import { Exam } from '@/types/exam';
import { A4Preview } from '@/components/A4Preview';
import { exportExamToDocx } from '@/lib/docx-export';
import { usePinnedAccount } from '@/hooks/usePinnedAccount';
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
  const [allowCopy, setAllowCopy] = useState(false);
  const [copyMessage, setCopyMessage] = useState('');
  const account = usePinnedAccount();

  useEffect(() => {
    async function loadSharedExam() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/public/share/${examId}`);
        const data = await res.json();
        if (data.success && data.exam) {
          setExam(data.exam);
          setAllowCopy(Boolean(data.permissions?.allowCopy));
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
    if (!exam || !allowCopy) return;
    setCopyMessage('');
    try {
      const response = await account.request(`/api/public/share/${encodeURIComponent(examId)}/copy`, { method: 'POST' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.id) { setCopyMessage(data.error || 'Chưa sao chép được đề. Vui lòng thử lại.'); return; }
      setCopiedToLocal(true);
      setTimeout(() => { window.location.href = `/editor/${data.id}`; }, 1200);
    } catch (error) {
      setCopyMessage(error instanceof Error ? error.message : 'Chưa sao chép được đề. Vui lòng thử lại.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#181818] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-[#1a73e8] dark:border-[#8ab4f8] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6]">Đang tải đề thi chia sẻ...</p>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#181818] flex flex-col items-center justify-center p-4">
        <div className="bg-white dark:bg-[#1e1e1e] rounded-3xl p-8 max-w-md w-full text-center border border-[#dadce0] dark:border-[#3c4043] shadow-xl">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-[#202124] dark:text-[#e3e3e3] mb-2">Liên kết không hợp lệ</h2>
          <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] mb-6">{error}</p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1a73e8] hover:bg-[#1557b0] dark:bg-[#8ab4f8] dark:text-[#181818] text-white text-xs font-semibold"
          >
            Về trang chủ ExamCraft
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#181818] font-sans pb-16 text-[#202124] dark:text-[#e3e3e3]">
      {/* Top Banner Thanh thao tác chia sẻ */}
      <header className="no-print sticky top-0 z-40 bg-white/95 dark:bg-[#181818]/95 backdrop-blur-md border-b border-[#dadce0] dark:border-[#3c4043] px-4 sm:px-6 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#e8f0fe] dark:bg-[#1e2a38] text-[#1a73e8] dark:text-[#8ab4f8] flex items-center justify-center shadow-xs">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#202124] dark:text-[#e3e3e3] text-sm">{exam.metadata.title}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#fef7e0] dark:bg-[#33250b] text-[#b06000] dark:text-[#fdd663] border border-[#feefc3] dark:border-[#533f16]">
                  Chế độ Chỉ Xem & Tải về
                </span>
              </div>
              <p className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6]">
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
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-white bg-[#1a73e8] hover:bg-[#1557b0] dark:bg-[#8ab4f8] dark:text-[#181818] transition-all shadow-xs cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Làm bài Online</span>
            </a>

            {/* Nút Tải file Word */}
            <button
              onClick={() => exportExamToDocx(exam)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium text-[#3c4043] dark:text-[#e3e3e3] bg-white dark:bg-[#282828] hover:bg-[#f8f9fa] dark:hover:bg-[#303134] border border-[#dadce0] dark:border-[#3c4043] transition-all cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-[#1a73e8] dark:text-[#8ab4f8]" />
              <span>Tải file Word (.docx)</span>
            </button>

            {/* Nút In A4 / Xuất PDF */}
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium text-[#3c4043] dark:text-[#e3e3e3] bg-white dark:bg-[#282828] hover:bg-[#f8f9fa] dark:hover:bg-[#303134] border border-[#dadce0] dark:border-[#3c4043] transition-all cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 text-[#5f6368] dark:text-[#9aa0a6]" />
              <span>In A4</span>
            </button>

            {/* Sao chép đề vào kho đề trên máy chủ của tài khoản đang đăng nhập */}
            {allowCopy && <button
              onClick={handleCloneToLocal}
              disabled={copiedToLocal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-[#137333] dark:text-[#5bb98c] bg-[#e6f4ea] dark:bg-[#0f291e] hover:bg-[#ceead6] dark:hover:bg-[#1e4a34] border border-[#ceead6] dark:border-[#1e4a34] transition-all cursor-pointer"
            >
              {copiedToLocal ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Đã lưu vào kho đề! Đang mở...</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tạo bản sao để sửa</span>
                </>
              )}
            </button>

            }
            {copyMessage && <span role="alert" className="text-xs text-red-600 dark:text-red-400">{copyMessage}</span>}

            {/* Sao chép liên kết */}
            <button
              onClick={handleCopyLink}
              className="p-2 rounded-full text-[#5f6368] hover:text-[#202124] dark:text-[#9aa0a6] dark:hover:text-[#e3e3e3] hover:bg-[#f1f3f4] dark:hover:bg-[#282828] border border-[#dadce0] dark:border-[#3c4043] transition-all cursor-pointer"
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
        <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#181818] flex items-center justify-center p-4">
          <div className="w-10 h-10 border-4 border-[#1a73e8] dark:border-[#8ab4f8] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ShareExamContent {...props} />
    </React.Suspense>
  );
}
