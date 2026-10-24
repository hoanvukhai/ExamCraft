'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowRight, Home } from 'lucide-react';

export default function LegacyTestRedirectPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#181818] text-[#202124] dark:text-[#e3e3e3] flex items-center justify-center p-4 transition-colors">
      <div className="max-w-md w-full bg-white dark:bg-[#1e1e1e] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl p-6 text-center space-y-4 shadow-xl">
        <div className="w-16 h-16 mx-auto bg-amber-50 dark:bg-[#33250b] text-amber-600 dark:text-[#fdd663] rounded-2xl flex items-center justify-center border border-amber-200 dark:border-[#533f16]">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-[#202124] dark:text-[#e3e3e3]">Chuyển Tiếp Phòng Thi Chuẩn v3.1</h1>
        <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed">
          Đường dẫn thi cũ không còn được hỗ trợ để đảm bảo an toàn đề thi và chống gian lận. Thí sinh vui lòng sử dụng <strong>Mã Phòng Thi</strong> do Giáo viên cung cấp để tham gia làm bài tại phòng thi trực tuyến bảo mật.
        </p>
        <div className="pt-2 flex flex-col gap-2.5">
          <Link
            href="/room"
            className="w-full py-3 bg-[#1a73e8] hover:bg-[#1557b0] text-white dark:bg-[#8ab4f8] dark:hover:bg-[#a8c7fa] dark:text-[#181818] font-bold text-xs rounded-full flex items-center justify-center gap-2 transition-colors shadow-xs"
          >
            <span>Đến Phòng Thi Trực Tuyến</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/"
            className="w-full py-2.5 bg-white hover:bg-[#f1f3f4] text-[#3c4043] dark:bg-[#282828] dark:hover:bg-[#303134] dark:text-[#e3e3e3] border border-[#dadce0] dark:border-[#3c4043] font-semibold text-xs rounded-full flex items-center justify-center gap-2 transition-colors"
          >
            <Home className="w-4 h-4 text-[#5f6368] dark:text-[#9aa0a6]" />
            <span>Về Trang Chủ</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
