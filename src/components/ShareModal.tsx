'use client';

import React, { useState, useEffect } from 'react';
import { Exam } from '@/types/exam';
import Link from 'next/link';
import {
  Share2,
  Copy,
  CheckCircle2,
  ExternalLink,
  Users,
  FileDown,
  X,
  PlayCircle,
  Clock,
  Settings,
  Sparkles,
  Trophy,
  Shield,
  HelpCircle,
} from 'lucide-react';

interface GroupItem {
  id: string;
  name: string;
  publicCode: string;
  _count: { students: number };
}

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
  const [activeTab, setActiveTab] = useState<'assign' | 'share'>('assign');
  const [origin, setOrigin] = useState('');

  // Trạng thái Lớp học
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [loadingGroups, setLoadingGroups] = useState(false);

  // Cấu hình giao bài
  const [assignmentTitle, setAssignmentTitle] = useState(
    exam?.metadata?.title || 'Bài kiểm tra trực tuyến'
  );
  const [mode, setMode] = useState<'HOMEWORK' | 'IN_CLASS' | 'EXAM'>('IN_CLASS');
  const [identityMode, setIdentityMode] = useState<'PICK_FROM_LIST' | 'FREE_NAME'>('PICK_FROM_LIST');
  const [durationMinutes, setDurationMinutes] = useState<number>(
    exam?.metadata?.durationMinutes || 45
  );
  const [showResult, setShowResult] = useState<'IMMEDIATE' | 'AFTER_CLOSE' | 'NEVER'>('IMMEDIATE');
  const [showSolution, setShowSolution] = useState<'IMMEDIATE' | 'AFTER_CLOSE' | 'NEVER'>('AFTER_CLOSE');
  const [enableLeaderboard, setEnableLeaderboard] = useState<boolean>(true);

  // Trạng thái giao bài
  const [assigning, setAssigning] = useState(false);
  const [createdPublicLink, setCreatedPublicLink] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  useEffect(() => {
    if (exam?.metadata?.title) {
      setAssignmentTitle(exam.metadata.title);
    }
  }, [exam?.metadata?.title]);

  // Tải danh sách lớp của giáo viên
  useEffect(() => {
    if (isOpen) {
      async function loadGroups() {
        try {
          setLoadingGroups(true);
          const res = await fetch('/api/groups');
          const data = await res.json();
          if (res.ok && data.groups) {
            setGroups(data.groups);
            if (data.groups.length > 0) {
              setSelectedGroupId(data.groups[0].id);
            }
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingGroups(false);
        }
      }
      loadGroups();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Xử lý Giao bài lên Server DB (Tạo bản chụp Snapshot bất biến)
  const handleAssignExam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAssigning(true);

      // 1. Đồng bộ đề thi lên server nếu cần
      let serverExamId = exam.id;
      const syncRes = await fetch('/api/migration/import-legacy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exams: [exam],
          questions: [],
        }),
      });
      const syncData = await syncRes.json();
      if (syncData.examIds && syncData.examIds[0]) {
        serverExamId = syncData.examIds[0];
      }

      // 2. Tạo Assignment với snapshot bất biến
      const assignRes = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId: serverExamId,
          groupId: selectedGroupId || undefined,
          title: assignmentTitle.trim(),
          mode,
          identityMode,
          durationMinutes: Number(durationMinutes) || undefined,
          maxAttempts: mode === 'EXAM' ? 1 : 3,
          showResult,
          showSolution,
          leaderboard: enableLeaderboard ? 'TOP_AND_ME' : 'OFF',
          leaderboardTopN: 3,
        }),
      });

      const assignData = await assignRes.json();
      if (!assignRes.ok) {
        alert(assignData.error || 'Lỗi khi giao bài');
        return;
      }

      setCreatedPublicLink(assignData.publicLink);
      if (onCloudSyncSuccess) onCloudSyncSuccess();
    } catch (err) {
      console.error('Lỗi khi giao bài:', err);
      alert('Không thể kết nối đến máy chủ.');
    } finally {
      setAssigning(false);
    }
  };

  const copyToClipboard = (text: string, type: 'assign' | 'share') => {
    navigator.clipboard.writeText(text);
    if (type === 'assign') {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedShareLink(true);
      setTimeout(() => setCopiedShareLink(false), 2000);
    }
  };

  const fullAssignUrl = createdPublicLink ? `${origin}${createdPublicLink}` : '';
  const shareWordUrl = `${origin}/share/${exam.id}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl text-slate-100 max-h-[92vh] overflow-y-auto">
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Chia Sẻ & Giao Bài Thi Trực Tuyến</h3>
              <p className="text-xs text-slate-400">Tạo phòng thi có chấm điểm tự động hoặc link tải Word</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-slate-800/80 rounded-xl my-4 border border-slate-800">
          <button
            onClick={() => setActiveTab('assign')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'assign'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PlayCircle className="w-4 h-4" /> Giao Bài Thi Online (Chấm Tự Động)
          </button>
          <button
            onClick={() => setActiveTab('share')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'share'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileDown className="w-4 h-4" /> Link Xem / Tải Word (.docx)
          </button>
        </div>

        {/* TAB 1: GIAO BÀI THI TRỰC TUYẾN */}
        {activeTab === 'assign' && (
          <div className="space-y-4">
            {createdPublicLink ? (
              /* MÀN HÌNH SAU KHI GIAO BÀI THÀNH CÔNG */
              <div className="p-5 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 space-y-4 text-center">
                <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">Phòng Thi Trực Tuyến Đã Sẵn Sàng!</h4>
                  <p className="text-xs text-slate-300 mt-1">
                    Bản chụp đề thi bất biến đã được tạo. Học sinh không cần tài khoản, chỉ cần bấm link để làm bài.
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-slate-900 rounded-xl p-2 border border-slate-700 text-left">
                  <input
                    type="text"
                    readOnly
                    value={fullAssignUrl}
                    className="grow bg-transparent text-xs text-indigo-300 font-mono px-2 outline-none select-all truncate"
                  />
                  <button
                    onClick={() => copyToClipboard(fullAssignUrl, 'assign')}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 transition-all cursor-pointer"
                  >
                    {copiedLink ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Đã chép
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Sao chép
                      </>
                    )}
                  </button>
                </div>

                <div className="flex gap-2 justify-center pt-2">
                  <a
                    href={createdPublicLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all"
                  >
                    Vào phòng thi thử <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => setCreatedPublicLink(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-semibold rounded-xl transition-all"
                  >
                    Tạo đợt thi khác
                  </button>
                </div>
              </div>
            ) : (
              /* FORM CẤU HÌNH GIAO BÀI */
              <form onSubmit={handleAssignExam} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Tiêu đề bài giao
                  </label>
                  <input
                    type="text"
                    value={assignmentTitle}
                    onChange={(e) => setAssignmentTitle(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                {/* Chọn Lớp Học */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Giao cho lớp học
                    </label>
                    <Link
                      href="/teacher/groups"
                      target="_blank"
                      className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      <Users className="w-3 h-3" /> Quản lý danh sách lớp
                    </Link>
                  </div>
                  <select
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Làm tự do (Học sinh tự gõ tên) --</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g._count.students} học sinh)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Chế độ nhận diện học sinh */}
                {selectedGroupId && (
                  <div className="flex gap-4 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                      <input
                        type="radio"
                        checked={identityMode === 'PICK_FROM_LIST'}
                        onChange={() => setIdentityMode('PICK_FROM_LIST')}
                        className="text-indigo-600 focus:ring-0"
                      />
                      Chọn tên từ danh sách lớp
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                      <input
                        type="radio"
                        checked={identityMode === 'FREE_NAME'}
                        onChange={() => setIdentityMode('FREE_NAME')}
                        className="text-indigo-600 focus:ring-0"
                      />
                      Tự gõ tên
                    </label>
                  </div>
                )}

                {/* Bộ cấu hình nhanh (Presets) */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('IN_CLASS');
                      setDurationMinutes(45);
                      setShowResult('IMMEDIATE');
                      setShowSolution('AFTER_CLOSE');
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      mode === 'IN_CLASS'
                        ? 'bg-indigo-600/20 border-indigo-500 text-white'
                        : 'bg-slate-800/40 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span className="text-xs font-bold block">Bài Trên Lớp</span>
                    <span className="text-[10px] text-slate-400">45p, hiện điểm</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode('HOMEWORK');
                      setDurationMinutes(60);
                      setShowResult('IMMEDIATE');
                      setShowSolution('IMMEDIATE');
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      mode === 'HOMEWORK'
                        ? 'bg-indigo-600/20 border-indigo-500 text-white'
                        : 'bg-slate-800/40 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span className="text-xs font-bold block">Về Nhà</span>
                    <span className="text-[10px] text-slate-400">Xem giải chi tiết</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode('EXAM');
                      setDurationMinutes(50);
                      setShowResult('AFTER_CLOSE');
                      setShowSolution('NEVER');
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      mode === 'EXAM'
                        ? 'bg-indigo-600/20 border-indigo-500 text-white'
                        : 'bg-slate-800/40 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span className="text-xs font-bold block">Phòng Thi</span>
                    <span className="text-[10px] text-slate-400">1 lượt, bảo mật</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Thời lượng (phút):</label>
                    <input
                      type="number"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                      min={5}
                      max={300}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Bảng xếp hạng:</label>
                    <button
                      type="button"
                      onClick={() => setEnableLeaderboard(!enableLeaderboard)}
                      className={`w-full py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all ${
                        enableLeaderboard
                          ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-400'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      <Trophy className="w-3.5 h-3.5" />
                      {enableLeaderboard ? 'Bật Top & Me' : 'Tắt bảng xếp hạng'}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={assigning}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {assigning ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Giao Bài & Tạo Phòng Thi Ngay
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* TAB 2: LINK XEM & TẢI FILE WORD (.DOCX) */}
        {activeTab === 'share' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <FileDown className="w-4 h-4 text-indigo-400" /> Link Xem, In A4 & Tải file Word:
                </span>
                <a
                  href={shareWordUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-bold text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <span>Mở xem</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="flex items-center gap-2 bg-slate-900 rounded-xl p-2 border border-slate-700">
                <input
                  type="text"
                  readOnly
                  value={shareWordUrl}
                  className="grow bg-transparent text-xs text-slate-300 font-mono px-2 outline-none select-all truncate"
                />
                <button
                  onClick={() => copyToClipboard(shareWordUrl, 'share')}
                  className="px-3.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 transition-all cursor-pointer"
                >
                  {copiedShareLink ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Đã chép
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Sao chép
                    </>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Người mở link chỉ có thể xem, in ấn hoặc tải file Word `.docx`, hoàn toàn không sửa được bản gốc của Thầy/Cô.
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
