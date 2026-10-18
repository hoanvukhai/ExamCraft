'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowRight, Home } from 'lucide-react';

export default function LegacyTestRedirectPage() {
  return (
    <div className="min-h-screen bg-[#181818] text-[#e3e3e3] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#1e1e1e] border border-[#3c4043] rounded-3xl p-6 text-center space-y-4 shadow-2xl">
        <div className="w-16 h-16 mx-auto bg-[#fef7e0] dark:bg-[#33250b] text-amber-500 rounded-2xl flex items-center justify-center border border-[#feefc3] dark:border-[#533f16]">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-[#e3e3e3]">Chuyển Tiếp Phòng Thi Chuẩn v3.1</h1>
        <p className="text-xs text-[#9aa0a6] leading-relaxed">
          Đường dẫn thi cũ không còn được hỗ trợ để đảm bảo an toàn đề thi và chống gian lận. Thí sinh vui lòng sử dụng <strong>Mã Phòng Thi</strong> do Giáo viên cung cấp để tham gia làm bài tại phòng thi trực tuyến bảo mật.
        </p>
        <div className="pt-2 flex flex-col gap-2.5">
          <Link
            href="/room"
            className="w-full py-3 bg-[#8ab4f8] hover:bg-[#a8c7fa] text-[#181818] font-bold text-xs rounded-full flex items-center justify-center gap-2 transition-colors shadow-xs"
          >
            <span>Đến Phòng Thi Trực Tuyến</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/"
            className="w-full py-2.5 bg-[#282828] hover:bg-[#303134] text-[#e3e3e3] border border-[#3c4043] font-semibold text-xs rounded-full flex items-center justify-center gap-2 transition-colors"
          >
            <Home className="w-4 h-4 text-[#9aa0a6]" />
            <span>Về Trang Chủ</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
