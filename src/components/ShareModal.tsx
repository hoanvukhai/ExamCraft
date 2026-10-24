'use client';

import React, { useState, useEffect, useRef } from 'react';
import { accountFetch } from '@/lib/account-fetch';
import { Exam } from '@/types/exam';
import { persistExam } from '@/lib/exam-client';
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
  ownerId: string;
  isOpen: boolean;
  onClose: () => void;
  exam: Exam;
  onEnsureSaved?: () => Promise<Exam | null>;
  onCloudSyncSuccess?: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  ownerId,
  isOpen,
  onClose,
  exam,
  onEnsureSaved,
  onCloudSyncSuccess,
}) => {
  const active = useRef(isOpen);
  useEffect(() => { active.current = isOpen; return () => { active.current = false; }; }, [isOpen]);
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
  const [mode, setMode] = useState<'HOMEWORK' | 'CLASSWORK' | 'EXAM'>('CLASSWORK');
  const [identityMode, setIdentityMode] = useState<'PICK_FROM_LIST' | 'FREE_NAME'>('PICK_FROM_LIST');
  const [durationMinutes, setDurationMinutes] = useState<number>(
    exam?.metadata?.durationMinutes || 45
  );
  const [showResult, setShowResult] = useState<'IMMEDIATE' | 'AFTER_CLOSE' | 'NEVER'>('IMMEDIATE');
  const [showSolution, setShowSolution] = useState<'IMMEDIATE' | 'AFTER_CLOSE' | 'NEVER'>('AFTER_CLOSE');
  const [enableLeaderboard, setEnableLeaderboard] = useState<boolean>(false);

  // Trạng thái giao bài
  const [assigning, setAssigning] = useState(false);
  const [createdPublicLink, setCreatedPublicLink] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const [sharePath, setSharePath] = useState('');
  const [shareLinkId, setShareLinkId] = useState('');
  const [shareExamId, setShareExamId] = useState('');
  const [sharing, setSharing] = useState(false);
  const [shareAnswers, setShareAnswers] = useState(false);
  const [shareCopy, setShareCopy] = useState(false);

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
    const controller = new AbortController();
    if (isOpen) {
      async function loadGroups() {
        try {
          setLoadingGroups(true);
          const res = await accountFetch(ownerId, '/api/groups', { signal: controller.signal, cache: 'no-store' });
          const data = await res.json();
          if (controller.signal.aborted) return;
          if (res.ok && data.groups) {
            setGroups(data.groups);
            if (data.groups.length > 0) {
              setSelectedGroupId(data.groups[0].id);
            }
          }
        } catch (err) {
          console.error(err);
        } finally {
          if (!controller.signal.aborted) setLoadingGroups(false);
        }
      }
      loadGroups();
    }
    return () => controller.abort();
  }, [isOpen, ownerId]);

  if (!isOpen) return null;

  // Xử lý Giao bài lên Server DB (Tạo bản chụp Snapshot bất biến)
  const handleAssignExam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAssigning(true);

      const savedExam = onEnsureSaved ? await onEnsureSaved() : await persistExam(exam, ownerId);
      if (!active.current) return;
      if (!savedExam) throw new Error('Đề chưa được lưu. Hãy xử lý trạng thái lưu trước khi giao bài.');
      const serverExamId = savedExam.id;

      // 2. Tạo Assignment với snapshot bất biến
      const assignRes = await accountFetch(ownerId, '/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId: serverExamId,
          groupId: selectedGroupId || undefined,
          title: assignmentTitle.trim(),
          mode,
          identityMode: selectedGroupId ? identityMode : 'FREE_NAME',
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
      alert(err instanceof Error ? err.message : 'Không thể kết nối đến máy chủ.');
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
  const shareWordUrl = sharePath ? origin + sharePath : '';
  const createShareLink = async () => {
    setSharing(true);
    try {
      const saved = onEnsureSaved ? await onEnsureSaved() : await persistExam(exam, ownerId);
      if (!active.current) return;
      if (!saved) throw new Error('Đề chưa được lưu. Hãy xử lý trạng thái lưu trước khi chia sẻ.');
      const id = saved.id;
      const response = await accountFetch(ownerId, '/api/exams/' + id + '/share', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ showAnswers: shareAnswers, allowCopy: shareCopy, expiresAt: new Date(Date.now() + 7 * 86400000).toISOString() }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Chưa tạo được link');
      setSharePath(data.publicLink); setShareLinkId(data.link.id); setShareExamId(id); onCloudSyncSuccess?.();
    } catch (error) { alert(error instanceof Error ? error.message : 'Chưa tạo được link'); }
    finally { setSharing(false); }
  };
  const revokeShareLink = async () => {
    const response = await accountFetch(ownerId, '/api/exams/' + shareExamId + '/share', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ linkId: shareLinkId }) });
    if (response.ok) { setSharePath(''); setShareLinkId(''); } else alert('Chưa thu hồi được link, hãy thử lại');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1e1e1e] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl max-w-xl w-full p-6 shadow-2xl text-[#202124] dark:text-[#e3e3e3] max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-4 border-b border-[#dadce0] dark:border-[#3c4043]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#e8f0fe] dark:bg-[#1e2a38] text-[#1a73e8] dark:text-[#8ab4f8] flex items-center justify-center border border-[#d2e3fc] dark:border-[#29425e] shadow-xs">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#202124] dark:text-[#e3e3e3]">Chia Sẻ & Giao Bài Thi Trực Tuyến</h3>
              <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">Tạo phòng thi có chấm điểm tự động hoặc link tải Word</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124] dark:hover:text-[#e3e3e3] hover:bg-[#f1f3f4] dark:hover:bg-[#282828] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-[#f1f3f4] dark:bg-[#282828] rounded-full my-4 border border-[#dadce0] dark:border-[#3c4043]">
          <button
            onClick={() => setActiveTab('assign')}
            className={`flex-1 py-2 rounded-full text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'assign'
                ? 'bg-[#1a73e8] text-white dark:bg-[#8ab4f8] dark:text-[#202124] shadow-xs'
                : 'text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124] dark:hover:text-[#e3e3e3]'
            }`}
          >
            <PlayCircle className="w-4 h-4" /> Giao Bài Thi Online (Chấm Tự Động)
          </button>
          <button
            onClick={() => setActiveTab('share')}
            className={`flex-1 py-2 rounded-full text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'share'
                ? 'bg-[#1a73e8] text-white dark:bg-[#8ab4f8] dark:text-[#202124] shadow-xs'
                : 'text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124] dark:hover:text-[#e3e3e3]'
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
              <div className="p-5 rounded-2xl bg-[#e8f0fe]/50 dark:bg-[#1e2a38]/60 border border-[#d2e3fc] dark:border-[#29425e] space-y-4 text-center">
                <div className="w-12 h-12 bg-[#e6f4ea] dark:bg-[#0f291e] text-[#137333] dark:text-[#5bb98c] rounded-full flex items-center justify-center mx-auto border border-[#ceead6] dark:border-[#1d4834]">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-[#202124] dark:text-[#e3e3e3]">Phòng Thi Trực Tuyến Đã Sẵn Sàng!</h4>
                  <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] mt-1">
                    Bản chụp đề thi bất biến đã được tạo. Học sinh không cần tài khoản, chỉ cần bấm link để làm bài.
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-white dark:bg-[#1e1e1e] rounded-2xl p-2 border border-[#dadce0] dark:border-[#3c4043] text-left">
                  <input
                    type="text"
                    readOnly
                    value={fullAssignUrl}
                    className="grow bg-transparent text-xs text-[#1a73e8] dark:text-[#8ab4f8] font-mono px-2 outline-none select-all truncate"
                  />
                  <button
                    onClick={() => copyToClipboard(fullAssignUrl, 'assign')}
                    className="px-3.5 py-1.5 bg-[#1a73e8] hover:bg-[#1557b0] dark:bg-[#8ab4f8] dark:hover:bg-[#a8c7fa] text-white dark:text-[#202124] rounded-full text-xs font-medium flex items-center gap-1 shrink-0 transition-all cursor-pointer shadow-xs"
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
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-[#282828] hover:bg-[#f8f9fa] dark:hover:bg-[#303134] text-[#3c4043] dark:text-[#e3e3e3] border border-[#dadce0] dark:border-[#3c4043] text-xs font-medium rounded-full transition-all"
                  >
                    Vào phòng thi thử <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => setCreatedPublicLink(null)}
                    className="px-4 py-2 bg-white dark:bg-[#282828] hover:bg-[#f8f9fa] dark:hover:bg-[#303134] text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124] dark:hover:text-[#e3e3e3] border border-[#dadce0] dark:border-[#3c4043] text-xs font-medium rounded-full transition-all cursor-pointer"
                  >
                    Tạo đợt thi khác
                  </button>
                </div>
              </div>
            ) : (
              /* FORM CẤU HÌNH GIAO BÀI */
              <form onSubmit={handleAssignExam} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider mb-1.5">
                    Tiêu đề bài giao
                  </label>
                  <input
                    type="text"
                    value={assignmentTitle}
                    onChange={(e) => setAssignmentTitle(e.target.value)}
                    className="w-full bg-white dark:bg-[#282828] border border-[#dadce0] dark:border-[#3c4043] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#202124] dark:text-[#e3e3e3] focus:outline-hidden focus:border-[#1a73e8] dark:focus:border-[#8ab4f8] focus:ring-1 focus:ring-[#1a73e8] dark:focus:ring-[#8ab4f8]"
                    required
                  />
                </div>

                {/* Chọn Lớp Học */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider">
                      Giao cho lớp học
                    </label>
                    <Link
                      href="/teacher/groups"
                      target="_blank"
                      className="text-[11px] text-[#1a73e8] dark:text-[#8ab4f8] hover:underline flex items-center gap-1"
                    >
                      <Users className="w-3 h-3" /> Quản lý danh sách lớp
                    </Link>
                  </div>
                  <select
                    aria-label="Giao cho lớp học"
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                    className="w-full bg-white dark:bg-[#282828] border border-[#dadce0] dark:border-[#3c4043] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#202124] dark:text-[#e3e3e3] focus:outline-hidden focus:border-[#1a73e8] dark:focus:border-[#8ab4f8] focus:ring-1 focus:ring-[#1a73e8] dark:focus:ring-[#8ab4f8] cursor-pointer"
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
                    <label className="flex items-center gap-2 cursor-pointer text-[#3c4043] dark:text-[#e3e3e3]">
                      <input
                        type="radio"
                        checked={identityMode === 'PICK_FROM_LIST'}
                        onChange={() => setIdentityMode('PICK_FROM_LIST')}
                        className="text-[#1a73e8] focus:ring-0"
                      />
                      Chọn tên từ danh sách lớp
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-[#3c4043] dark:text-[#e3e3e3]">
                      <input
                        type="radio"
                        checked={identityMode === 'FREE_NAME'}
                        onChange={() => setIdentityMode('FREE_NAME')}
                        className="text-[#1a73e8] focus:ring-0"
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
                      setMode('CLASSWORK');
                      setDurationMinutes(45);
                      setShowResult('IMMEDIATE');
                      setShowSolution('AFTER_CLOSE');
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      mode === 'CLASSWORK'
                        ? 'bg-[#e8f0fe] dark:bg-[#1e2a38] border-[#1a73e8] dark:border-[#8ab4f8] text-[#1a73e8] dark:text-[#8ab4f8] shadow-xs'
                        : 'bg-[#f8f9fa] dark:bg-[#282828] border-[#dadce0] dark:border-[#3c4043] text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#e8eaed] dark:hover:bg-[#303134]'
                    }`}
                  >
                    <span className="text-xs font-bold block">Bài Trên Lớp</span>
                    <span className="text-[10px] opacity-80">45p, hiện điểm</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode('HOMEWORK');
                      setDurationMinutes(60);
                      setShowResult('IMMEDIATE');
                      setShowSolution('IMMEDIATE');
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      mode === 'HOMEWORK'
                        ? 'bg-[#e8f0fe] dark:bg-[#1e2a38] border-[#1a73e8] dark:border-[#8ab4f8] text-[#1a73e8] dark:text-[#8ab4f8] shadow-xs'
                        : 'bg-[#f8f9fa] dark:bg-[#282828] border-[#dadce0] dark:border-[#3c4043] text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#e8eaed] dark:hover:bg-[#303134]'
                    }`}
                  >
                    <span className="text-xs font-bold block">Về Nhà</span>
                    <span className="text-[10px] opacity-80">Xem giải chi tiết</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode('EXAM');
                      setDurationMinutes(50);
                      setShowResult('AFTER_CLOSE');
                      setShowSolution('NEVER');
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      mode === 'EXAM'
                        ? 'bg-[#e8f0fe] dark:bg-[#1e2a38] border-[#1a73e8] dark:border-[#8ab4f8] text-[#1a73e8] dark:text-[#8ab4f8] shadow-xs'
                        : 'bg-[#f8f9fa] dark:bg-[#282828] border-[#dadce0] dark:border-[#3c4043] text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#e8eaed] dark:hover:bg-[#303134]'
                    }`}
                  >
                    <span className="text-xs font-bold block">Phòng Thi</span>
                    <span className="text-[10px] opacity-80">1 lượt, bảo mật</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[#5f6368] dark:text-[#9aa0a6] mb-1">Thời lượng (phút):</label>
                    <input
                      type="number"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Number(e.target.value))}
                      className="w-full bg-white dark:bg-[#282828] border border-[#dadce0] dark:border-[#3c4043] rounded-xl px-3 py-2 text-[#202124] dark:text-[#e3e3e3] focus:border-[#1a73e8] dark:focus:border-[#8ab4f8] outline-hidden"
                      min={5}
                      max={300}
                    />
                  </div>

                  <div>
                    <label className="block text-[#5f6368] dark:text-[#9aa0a6] mb-1">Bảng xếp hạng:</label>
                    <button
                      type="button"
                      onClick={() => setEnableLeaderboard(!enableLeaderboard)}
                      className={`w-full py-2 px-3 rounded-xl border font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        enableLeaderboard
                          ? 'bg-[#e6f4ea] dark:bg-[#0f291e] border-[#ceead6] dark:border-[#1d4834] text-[#137333] dark:text-[#5bb98c]'
                          : 'bg-[#f8f9fa] dark:bg-[#282828] border-[#dadce0] dark:border-[#3c4043] text-[#5f6368] dark:text-[#9aa0a6]'
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
                  className="w-full py-3 bg-[#1a73e8] hover:bg-[#1557b0] dark:bg-[#8ab4f8] dark:hover:bg-[#a8c7fa] text-white dark:text-[#202124] font-medium text-xs sm:text-sm rounded-full shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {assigning ? (
                    <div className="w-4 h-4 border-2 border-white dark:border-[#202124] border-t-transparent rounded-full animate-spin" />
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
            <p className="text-xs">Link xem có hiệu lực 7 ngày. Ai có link đều xem được nội dung bạn cho phép.</p>
            <label className="block text-sm"><input type="checkbox" checked={shareAnswers} onChange={e => setShareAnswers(e.target.checked)} /> Kèm đáp án và lời giải</label>
            <label className="block text-sm"><input type="checkbox" checked={shareCopy} onChange={e => setShareCopy(e.target.checked)} /> Cho giáo viên đã đăng nhập tạo bản sao</label>
            <button disabled={sharing} onClick={createShareLink} className="px-4 py-2 rounded-full bg-blue-600 text-white disabled:opacity-50">{sharing ? 'Đang tạo…' : 'Tạo link chia sẻ'}</button>
            {sharePath && <button onClick={revokeShareLink} className="ml-3 text-sm text-red-600">Thu hồi link này</button>}
            <div className="p-4 rounded-2xl bg-[#f8f9fa] dark:bg-[#282828]/60 border border-[#dadce0] dark:border-[#3c4043] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#202124] dark:text-[#e3e3e3] flex items-center gap-1.5">
                  <FileDown className="w-4 h-4 text-[#1a73e8] dark:text-[#8ab4f8]" /> Link Xem, In A4 & Tải file Word:
                </span>
                <a
                  href={shareWordUrl || undefined}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-medium text-[#1a73e8] dark:text-[#8ab4f8] hover:underline flex items-center gap-1"
                >
                  <span>Mở xem</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="flex items-center gap-2 bg-white dark:bg-[#1e1e1e] rounded-2xl p-2 border border-[#dadce0] dark:border-[#3c4043]">
                <input
                  type="text"
                  readOnly
                  value={shareWordUrl}
                  className="grow bg-transparent text-xs text-[#5f6368] dark:text-[#9aa0a6] font-mono px-2 outline-none select-all truncate"
                />
                <button
                  disabled={!shareWordUrl} onClick={() => copyToClipboard(shareWordUrl, 'share')}
                  className="px-3.5 py-1.5 bg-[#1a73e8] hover:bg-[#1557b0] dark:bg-[#8ab4f8] dark:hover:bg-[#a8c7fa] text-white dark:text-[#202124] rounded-full text-xs font-medium flex items-center gap-1 shrink-0 transition-all cursor-pointer shadow-xs"
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

              <p className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed">
                Người mở link chỉ có thể xem, in ấn hoặc tải file Word `.docx`, hoàn toàn không sửa được bản gốc của Thầy/Cô.
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-[#f1f3f4] hover:bg-[#e8eaed] dark:bg-[#282828] dark:hover:bg-[#303134] text-[#3c4043] dark:text-[#e3e3e3] text-xs font-medium transition-all cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
