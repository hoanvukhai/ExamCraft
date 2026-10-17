'use client';

import React from 'react';
import { 
  Sparkles, 
  Key, 
  Shuffle, 
  GraduationCap, 
  Upload, 
  BookMarked,
  Database,
  Share2,
  Users,
  CloudUpload,
  CheckCircle2
} from 'lucide-react';

interface HeaderProps {
  apiKey: string;
  onOpenApiKeyModal: () => void;
  onOpenNewExamModal: () => void;
  onShuffleExam: () => void;
  onOpenImportModal: () => void;
  onOpenLibraryModal: () => void;
  onOpenQuestionBankModal: () => void;
  onOpenShareModal: () => void;
  onOpenResultsModal: () => void;
  onSaveCloud: () => void;
  isCloudSaving?: boolean;
  isCloudSaved?: boolean;
  submissionCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  apiKey,
  onOpenApiKeyModal,
  onOpenNewExamModal,
  onShuffleExam,
  onOpenImportModal,
  onOpenLibraryModal,
  onOpenQuestionBankModal,
  onOpenShareModal,
  onOpenResultsModal,
  onSaveCloud,
  isCloudSaving = false,
  isCloudSaved = false,
  submissionCount = 0,
}) => {
  return (
    <header className="no-print bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 px-3 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand Logo & Trạng thái Cloud */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-linear-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
            <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight">ExamCraft</span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                GDPT 2018
              </span>
              <span 
                title="Đề thi được tự động đồng bộ lên Đám mây và sao lưu offline IndexedDB an toàn."
                className="hidden xl:flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-help"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Cloud & Offline Sync</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden md:block">
              Trợ lý AI Soạn đề • Thi trực tuyến • In ấn chuẩn Bộ GD&ĐT
            </p>
          </div>
        </div>

        {/* Thanh công cụ chính: Phân nhóm rõ ràng */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-1">
          {/* 1. KHU VỰC KHẢO THÍ & CHIA SẺ TRỰC TUYẾN */}
          <div className="flex items-center gap-1 bg-indigo-50/80 p-1 rounded-xl border border-indigo-100">
            {/* Nút Chia sẻ & Tạo link thi */}
            <button
              onClick={onOpenShareModal}
              title="Tạo link cho học sinh làm bài hoặc link chia sẻ chỉ xem"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-xs cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Chia sẻ & Thi Online</span>
            </button>

            {/* Nút Bảng điểm học sinh */}
            <button
              onClick={onOpenResultsModal}
              title="Xem danh sách điểm thi học sinh đã nộp"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-indigo-900 hover:bg-indigo-100 transition-colors cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden lg:inline">Bảng điểm</span>
              {submissionCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-indigo-600 text-white">
                  {submissionCount}
                </span>
              )}
            </button>
          </div>

          {/* 2. KHU VỰC QUẢN LÝ DỮ LIỆU & SOẠN ĐỀ */}
          <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200">
            {/* Nút Lưu lên Đám mây */}
            <button
              onClick={onSaveCloud}
              disabled={isCloudSaving}
              title="Lưu trữ đề thi lên cơ sở dữ liệu Đám mây để mở từ mọi máy tính"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-white transition-all cursor-pointer"
            >
              {isCloudSaving ? (
                <>
                  <CloudUpload className="w-3.5 h-3.5 text-indigo-600 animate-bounce" />
                  <span className="hidden xl:inline text-indigo-600 font-bold">Đang lưu...</span>
                </>
              ) : isCloudSaved ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden xl:inline text-emerald-700 font-bold">Đã lên Cloud</span>
                </>
              ) : (
                <>
                  <CloudUpload className="w-3.5 h-3.5 text-slate-600" />
                  <span className="hidden xl:inline">Lưu Cloud</span>
                </>
              )}
            </button>

            {/* Nút Trộn đề */}
            <button
              onClick={onShuffleExam}
              title="Trộn đề thành 4 mã đề kèm ma trận đáp án"
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-white transition-all cursor-pointer"
            >
              <Shuffle className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden md:inline">Trộn 4 mã đề</span>
            </button>

            {/* Nút Ngân hàng câu hỏi */}
            <button
              onClick={onOpenQuestionBankModal}
              title="Ngân hàng câu hỏi phân loại theo ma trận"
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-white transition-all cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden lg:inline">Ngân hàng câu hỏi</span>
            </button>

            {/* Nút Nhập đề thông minh */}
            <button
              onClick={onOpenImportModal}
              title="Nhập đề từ file Word, Ảnh chụp hoặc Văn bản thô"
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-white transition-all cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden lg:inline">Nhập đề (Word/Ảnh)</span>
            </button>

            {/* Nút Kho đề cá nhân */}
            <button
              onClick={onOpenLibraryModal}
              title="Xem kho đề thi đã lưu trên máy"
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-white transition-all cursor-pointer"
            >
              <BookMarked className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden xl:inline">Kho đề</span>
            </button>
          </div>

          {/* 3. KHU VỰC AI & CẤU HÌNH */}
          <div className="flex items-center gap-1">
            {/* Nút Cấu hình AI / Quản trị 7 Keys */}
            <button
              onClick={onOpenApiKeyModal}
              title="Quản trị 7 Google Gemini API Keys & Hạn mức"
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                apiKey
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span className="hidden md:inline">
                {apiKey ? 'Quản trị AI (7 Keys)' : 'Cấu hình AI'}
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  apiKey ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
            </button>

            {/* Nút Sinh đề bằng AI */}
            <button
              onClick={onOpenNewExamModal}
              className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-sm transition-all cursor-pointer shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sinh đề AI</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
