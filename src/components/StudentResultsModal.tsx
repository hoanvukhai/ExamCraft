'use client';

import Link from 'next/link';
import type { Exam } from '@/types/exam';

export function StudentResultsModal({ isOpen, onClose, exam, onOpenShareModal }: {
  isOpen: boolean; onClose: () => void; exam: Exam; onOpenShareModal: () => void;
}) {
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
    <section role="dialog" aria-modal="true" aria-label="Kết quả học sinh" className="app-dialog w-full max-w-lg rounded-xl bg-white dark:bg-[#202124] text-[#202124] dark:text-[#e3e3e3] p-6 space-y-4">
      <div className="app-dialog-header flex justify-between gap-4"><h2 className="text-lg font-semibold">Bài đã giao và kết quả học sinh</h2><button type="button" onClick={onClose}>Đóng</button></div>
      <p className="text-sm">{exam.metadata.title}</p>
      <p className="text-sm">Mỗi lần giao bài có bản đề riêng và bảng điểm riêng. Mở bài đã giao để xem lượt làm, chấm tự luận, điều chỉnh điểm hoặc xuất CSV.</p>
      <Link href={exam.serverId ? `/teacher/assignments?examId=${encodeURIComponent(exam.serverId)}` : '/teacher/assignments'} className="inline-block rounded app-button-primary text-white px-4 py-2">Mở bài đã giao và bảng điểm</Link>
      <button type="button" onClick={onOpenShareModal} className="block underline">Giao đề này cho học sinh</button>
    </section>
  </div>;
}
