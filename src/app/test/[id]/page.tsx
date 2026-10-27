'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, Home } from 'lucide-react';

export default function LegacyTestRedirectPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#17181a] text-[#202124] dark:text-[#e3e3e3] flex items-center justify-center p-4 transition-colors">
      <div className="max-w-md w-full bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl p-6 text-center space-y-4 shadow-xs">
        <div className="w-16 h-16 mx-auto bg-amber-50 dark:bg-[#33250b] text-amber-600 dark:text-[#fdd663] rounded-xl flex items-center justify-center border border-amber-200 dark:border-[#533f16]">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-[#202124] dark:text-[#e3e3e3]">Liên kết bài thi cũ</h1>
        <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed">
          Đường dẫn thi cũ không còn được hỗ trợ để đảm bảo an toàn đề thi và chống gian lận. Em hãy mở lại đúng liên kết bài giao do giáo viên gửi (dạng /a/…) hoặc hỏi giáo viên để được cấp liên kết mới.
        </p>
        <div className="pt-2 flex flex-col gap-2.5">
          <Link
            href="/"
            className="w-full py-2.5 bg-white hover:bg-[#f1f3f4] text-[#3c4043] dark:bg-[#292a2d] dark:hover:bg-[#303134] dark:text-[#e3e3e3] border border-[#dadce0] dark:border-[#3c4043] font-semibold text-xs rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Home className="w-4 h-4 text-[#5f6368] dark:text-[#9aa0a6]" />
            <span>Về Trang Chủ</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
