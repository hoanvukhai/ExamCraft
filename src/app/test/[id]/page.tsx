'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowRight, Home } from 'lucide-react';

export default function LegacyTestRedirectPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
        <div className="w-16 h-16 mx-auto bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center border border-amber-500/30">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold">Chuyển Tiếp Phòng Thi Chuẩn v3.1</h1>
        <p className="text-xs text-slate-400 leading-relaxed">
          Đường dẫn thi cũ không còn được hỗ trợ để đảm bảo an toàn đề thi và chống gian lận. Thí sinh vui lòng sử dụng <strong>Mã Phòng Thi</strong> do Giáo viên cung cấp để tham gia làm bài tại phòng thi trực tuyến bảo mật.
        </p>
        <div className="pt-2 flex flex-col gap-2">
          <Link
            href="/room"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-600/30"
          >
            <span>Đến Phòng Thi Trực Tuyến</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/"
            className="w-full py-2.5 bg-slate-700/60 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Về Trang Chủ</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
