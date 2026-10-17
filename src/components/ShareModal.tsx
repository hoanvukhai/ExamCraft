'use client';

import React, { useState, useEffect } from 'react';
import { Exam } from '@/types/exam';
import { 
  Share2, 
  Copy, 
  CheckCircle2, 
  ExternalLink, 
  Globe, 
  CloudUpload, 
  Users, 
  FileDown, 
  X,
  QrCode
} from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam: Exam;
  onCloudSyncSuccess?: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  exam,
  onCloudSyncSuccess,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const [copiedTestLink, setCopiedTestLink] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  // Tự động đồng bộ đề thi lên Cloud khi mở modal nếu chưa đồng bộ
  useEffect(() => {
    if (isOpen && exam && exam.id) {
      handleSyncToCloud();
    }
  }, [isOpen, exam?.id]);

  const handleSyncToCloud = async () => {
    try {
      setIsSyncing(true);
      const res = await fetch('/api/cloud/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exam),
      });
      const data = await res.json();
      if (data.success) {
        setIsSynced(true);
        if (onCloudSyncSuccess) onCloudSyncSuccess();
      }
    } catch {
      console.error('Lỗi tự động lưu lên Cloud');
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isOpen) return null;

  const testUrl = `${origin}/test/${exam.id}`;
  const shareUrl = `${origin}/share/${exam.id}`;

  const copyToClipboard = (text: string, type: 'test' | 'share') => {
    navigator.clipboard.writeText(text);
    if (type === 'test') {
      setCopiedTestLink(true);
      setTimeout(() => setCopiedTestLink(false), 2000);
    } else {
      setCopiedShareLink(true);
      setTimeout(() => setCopiedShareLink(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900">Chia Sẻ Đề Thi & Phòng Thi Online</h3>
              <p className="text-[11px] text-slate-500 font-medium">Tạo link cho học sinh làm bài hoặc gửi đồng nghiệp</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Trạng thái Cloud Sync */}
        <div className="my-4 p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-600" />
            <span className="font-semibold text-slate-700">Trạng thái lưu trữ Đám mây:</span>
          </div>
          {isSyncing ? (
            <span className="text-amber-600 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              Đang đồng bộ...
            </span>
          ) : isSynced ? (
            <span className="text-emerald-700 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Đã sẵn sàng online
            </span>
          ) : (
            <button
              onClick={handleSyncToCloud}
              className="text-indigo-600 font-bold hover:underline"
            >
              Bấm để đồng bộ ngay
            </button>
          )}
        </div>

        <div className="space-y-4">
          {/* LINK 1: DÀNH CHO HỌC SINH LÀM BÀI TRỰC TUYẾN */}
          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Link Học Sinh Làm Bài Trực Tuyến (Có chấm điểm):</span>
              </span>
              <a
                href={testUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold text-indigo-700 hover:underline flex items-center gap-1"
              >
                <span>Mở thử</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex items-center gap-2 bg-white rounded-xl p-1.5 border border-indigo-200">
              <input
                type="text"
                readOnly
                value={testUrl}
                className="grow bg-transparent text-xs text-slate-700 px-2 outline-hidden font-mono truncate select-all"
              />
              <button
                onClick={() => copyToClipboard(testUrl, 'test')}
                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer"
              >
                {copiedTestLink ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Đã chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao chép</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-indigo-800/80">
              Học sinh mở link, điền họ tên, làm bài và nhận kết quả tức thì. Điểm số tự động gửi về Bảng điểm của Thầy/Cô.
            </p>
          </div>

          {/* LINK 2: DÀNH CHO GIÁO VIÊN KHÁC / CHỈ XEM & TẢI VỀ */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileDown className="w-4 h-4 text-slate-600" />
                <span>Link Chỉ Xem, In A4 & Tải file Word:</span>
              </span>
              <a
                href={shareUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold text-slate-600 hover:underline flex items-center gap-1"
              >
                <span>Xem thử</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex items-center gap-2 bg-white rounded-xl p-1.5 border border-slate-200">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="grow bg-transparent text-xs text-slate-700 px-2 outline-hidden font-mono truncate select-all"
              />
              <button
                onClick={() => copyToClipboard(shareUrl, 'share')}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer"
              >
                {copiedShareLink ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Đã chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao chép</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Người mở link chỉ có thể xem, in hoặc tải file Word `.docx`, hoàn toàn không sửa được bản gốc của Thầy/Cô.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
