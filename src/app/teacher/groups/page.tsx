'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { accountFetch } from '@/lib/account-fetch';
import { pinsToCsv } from '@/lib/pin-csv';
import {
  Users,
  Plus,
  Copy,
  CheckCircle2,
  ExternalLink,
  BookOpen,
  Trash2,
  X,
  GraduationCap,
  Sparkles,
  ArrowLeft,
  Search,
} from 'lucide-react';

interface Student {
  id: string;
  displayName: string;
  createdAt: string;
  hasPin?: boolean;
}

interface Group {
  id: string;
  name: string;
  note?: string;
  publicCode: string;
  createdAt: string;
  _count: {
    students: number;
    assignments: number;
  };
}

export default function TeacherGroupsPage() {
  const [ownerId, setOwnerId] = useState('');
  const [accountMessage, setAccountMessage] = useState('');
  const scopedFetch = (input: RequestInfo | URL, init?: RequestInit) => accountFetch(ownerId, input, init);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal tạo lớp mới
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [studentNamesText, setStudentNamesText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Modal xem chi tiết danh sách học sinh
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupStudents, setGroupStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [issuedPins, setIssuedPins] = useState<{ id: string; displayName: string; pin: string }[] | null>(null);
  const [pinBusy, setPinBusy] = useState(false);

  // Trạng thái copy
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchGroups = async (expectedOwner = ownerId) => {
    try {
      setLoading(true);
      const res = await accountFetch(expectedOwner, '/api/groups');
      const data = await res.json();
      if (res.ok) {
        setGroups(data.groups || []);
      } else setAccountMessage(data.error || 'Chưa tải được lớp học.');
    } catch (err) {
      console.error('Lỗi tải danh sách lớp:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch('/api/auth/me', { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok || !data.user?.id) throw Error('Vui lòng đăng nhập lại để quản lý lớp.');
        if (cancelled) return;
        setOwnerId(data.user.id); await fetchGroups(data.user.id);
      } catch { if (!cancelled) { setAccountMessage('Chưa kiểm tra được tài khoản. Hãy tải lại hoặc đăng nhập lại trước khi quản lý lớp.'); setLoading(false); } }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSubmitting(true);
      const namesList = studentNamesText
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const res = await scopedFetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          note: note.trim() || undefined,
          studentNames: namesList,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Lỗi khi tạo lớp học');
        return;
      }

      setShowCreateModal(false);
      setName('');
      setNote('');
      setStudentNamesText('');
      fetchGroups();
    } catch (err) {
      console.error(err);
      alert('Không thể kết nối đến máy chủ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenGroupDetails = async (group: Group) => {
    setSelectedGroup(group);
    try {
      setLoadingStudents(true);
      const res = await scopedFetch(`/api/groups/${group.id}`);
      const data = await res.json();
      if (res.ok) {
        setGroupStudents(data.group?.students || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup || !newStudentName.trim()) return;

    try {
      const res = await scopedFetch(`/api/groups/${selectedGroup.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newStudentNames: [newStudentName.trim()] }),
      });
      if (res.ok) {
        setNewStudentName('');
        handleOpenGroupDetails(selectedGroup);
        fetchGroups();
      } else { const data = await res.json(); setAccountMessage(data.error || 'Chưa thêm được học sinh.'); }
    } catch (err) {
      console.error(err);
    }
  };

  const issuePins = async (studentIds?: string[]) => {
    if (!selectedGroup || pinBusy) return;
    const message = studentIds ? 'Cấp PIN mới cho học sinh này? PIN cũ sẽ không dùng được nữa.' : 'Cấp PIN mới cho cả lớp? PIN cũ của mọi học sinh sẽ không dùng được nữa.';
    if (!confirm(message)) return;
    setPinBusy(true); setAccountMessage('');
    try {
      const res = await scopedFetch(`/api/groups/${selectedGroup.id}/pins`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(studentIds ? { studentIds } : {}) });
      const data = await res.json();
      if (!res.ok) { setAccountMessage(data.error || 'Chưa cấp được PIN.'); return; }
      setIssuedPins(previous => { const merged = new Map((previous ?? []).map(item => [item.id, item])); for (const item of data.pins) merged.set(item.id, item); return [...merged.values()].sort((a, b) => a.displayName.localeCompare(b.displayName, 'vi')); });
      await handleOpenGroupDetails(selectedGroup);
    } catch { setAccountMessage('Không thể kết nối đến máy chủ'); } finally { setPinBusy(false); }
  };
  const downloadPins = () => {
    if (!issuedPins || !selectedGroup) return;
    const url = URL.createObjectURL(new Blob([pinsToCsv(issuedPins)], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `pin-${selectedGroup.publicCode}.csv`; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const copyClassLink = (code: string) => {
    const url = `${window.location.origin}/c/${code}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.publicCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#181818] text-[#202124] dark:text-[#e3e3e3] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {accountMessage && <p role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">{accountMessage}</p>}
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#dadce0] dark:border-[#3c4043]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                href="/"
                className="text-xs text-[#5f6368] hover:text-[#202124] dark:text-[#9aa0a6] dark:hover:text-[#e3e3e3] flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Soạn đề thi
              </Link>
              <span className="text-[#dadce0] dark:text-[#3c4043]">/</span>
              <span className="text-xs text-[#1a73e8] dark:text-[#8ab4f8] font-semibold">Quản lý lớp học</span>
            </div>
            <h1 className="text-2xl font-bold text-[#202124] dark:text-[#e3e3e3] flex items-center gap-2.5">
              <GraduationCap className="w-7 h-7 text-[#1a73e8] dark:text-[#8ab4f8]" />
              Lớp Học & Danh Sách Học Sinh
            </h1>
            <p className="text-xs sm:text-sm text-[#5f6368] dark:text-[#9aa0a6] mt-1">
              Quản lý lớp dạy thêm, danh sách học sinh và gửi link thi trực tuyến theo từng lớp.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 app-button-primary dark:bg-[#8ab4f8] dark:text-[#181818] dark:hover:bg-[#a8c7fa] text-white text-sm font-semibold rounded-full shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Tạo Lớp Mới
          </button>
        </div>

        {/* Thanh tìm kiếm */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5f6368] dark:text-[#9aa0a6]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm theo tên lớp hoặc mã lớp..."
              className="w-full bg-white dark:bg-[#1e1e1e] border border-[#dadce0] dark:border-[#3c4043] rounded-full pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#202124] dark:text-[#e3e3e3] placeholder-[#5f6368] dark:placeholder-[#9aa0a6] focus:border-[#1a73e8] dark:focus:border-[#8ab4f8] outline-hidden"
            />
          </div>
          <span className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">
            Tổng cộng: <strong className="text-[#202124] dark:text-[#e3e3e3]">{filteredGroups.length}</strong> lớp
          </span>
        </div>

        {/* Danh sách các Lớp */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-[#5f6368] dark:text-[#9aa0a6]">
            <div className="w-8 h-8 border-4 border-[#1a73e8] dark:border-[#8ab4f8] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs">Đang tải danh sách lớp học...</p>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="bg-white dark:bg-[#1e1e1e] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl p-12 text-center">
            <Users className="w-12 h-12 text-[#5f6368] dark:text-[#9aa0a6] mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#202124] dark:text-[#e3e3e3]">Chưa có lớp học nào</h3>
            <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] mt-1 mb-5 max-w-md mx-auto">
              Hãy tạo lớp học mới, dán danh sách tên học sinh để dễ dàng giao bài và theo dõi bảng điểm.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 app-button-primary dark:bg-[#8ab4f8] dark:text-[#181818] text-white text-xs font-semibold rounded-full shadow-xs transition-all cursor-pointer"
            >
              Tạo Lớp Đầu Tiên
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredGroups.map((group) => (
              <div
                key={group.id}
                className="bg-white dark:bg-[#1e1e1e] border border-[#dadce0] dark:border-[#3c4043] hover:border-[#1a73e8] dark:hover:border-[#8ab4f8] rounded-2xl p-5 shadow-xs hover:shadow-md flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-[#e8f0fe] dark:bg-[#1e2a38] text-[#1a73e8] dark:text-[#8ab4f8] border border-[#d2e3fc] dark:border-[#2a3f58]">
                      MÃ: {group.publicCode}
                    </span>
                    <button
                      onClick={() => copyClassLink(group.publicCode)}
                      title="Sao chép link lớp học"
                      className="text-xs text-[#5f6368] hover:text-[#1a73e8] dark:text-[#9aa0a6] dark:hover:text-[#8ab4f8] flex items-center gap-1 p-1 rounded-full hover:bg-[#f1f3f4] dark:hover:bg-[#282828] transition-colors cursor-pointer"
                    >
                      {copiedCode === group.publicCode ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400 text-[11px]">Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span className="text-[11px]">Chép link</span>
                        </>
                      )}
                    </button>
                  </div>

                  <h3 className="text-base font-bold text-[#202124] dark:text-[#e3e3e3] mb-1">{group.name}</h3>
                  {group.note && <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] mb-4 line-clamp-2">{group.note}</p>}

                  <div className="grid grid-cols-2 gap-2 my-4">
                    <div className="bg-[#f8f9fa] dark:bg-[#282828] p-2.5 rounded-xl border border-[#dadce0] dark:border-[#3c4043] text-center">
                      <span className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] block">Học sinh</span>
                      <span className="text-lg font-black text-[#1a73e8] dark:text-[#8ab4f8]">{group._count.students}</span>
                    </div>
                    <div className="bg-[#f8f9fa] dark:bg-[#282828] p-2.5 rounded-xl border border-[#dadce0] dark:border-[#3c4043] text-center">
                      <span className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] block">Bài đã giao</span>
                      <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{group._count.assignments}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#dadce0] dark:border-[#3c4043] flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleOpenGroupDetails(group)}
                    className="flex-1 py-2 bg-[#f1f3f4] hover:bg-[#e8eaed] dark:bg-[#282828] dark:hover:bg-[#303134] text-[#202124] dark:text-[#e3e3e3] text-xs font-semibold rounded-full border border-[#dadce0] dark:border-[#3c4043] transition-all cursor-pointer"
                  >
                    Xem Danh Sách
                  </button>
                  <a
                    href={`/c/${group.publicCode}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-[#f1f3f4] hover:bg-[#e8eaed] dark:bg-[#282828] dark:hover:bg-[#303134] text-[#5f6368] hover:text-[#202124] dark:text-[#9aa0a6] dark:hover:text-[#e3e3e3] rounded-full border border-[#dadce0] dark:border-[#3c4043] transition-all"
                    title="Mở cổng lớp học"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Tạo Lớp Học Mới */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="max-w-lg w-full bg-white dark:bg-[#1e1e1e] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl p-6 shadow-2xl relative">
              <div className="flex items-center justify-between pb-4 border-b border-[#dadce0] dark:border-[#3c4043]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#e8f0fe] dark:bg-[#1e2a38] text-[#1a73e8] dark:text-[#8ab4f8] flex items-center justify-center font-bold">
                    <Plus className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-[#202124] dark:text-[#e3e3e3]">Tạo Lớp Học Mới</h3>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 rounded-full text-[#5f6368] hover:text-[#202124] dark:text-[#9aa0a6] dark:hover:text-[#e3e3e3] hover:bg-[#f1f3f4] dark:hover:bg-[#282828] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateGroup} className="space-y-4 mt-4">
                <div>
                  <label className="block text-xs font-semibold text-[#202124] dark:text-[#e3e3e3] uppercase tracking-wider mb-1.5">
                    Tên lớp học *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ví dụ: 12A1 Toán - Luyện Thi ĐGNL"
                    className="w-full bg-white dark:bg-[#242424] border border-[#dadce0] dark:border-[#3c4043] rounded-xl px-3.5 py-2.5 text-sm text-[#202124] dark:text-[#e3e3e3] placeholder-[#5f6368] dark:placeholder-[#9aa0a6] focus:border-[#1a73e8] dark:focus:border-[#8ab4f8] outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#202124] dark:text-[#e3e3e3] uppercase tracking-wider mb-1.5">
                    Ghi chú lớp
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Ví dụ: Lịch học tối T3, T5 hàng tuần..."
                    className="w-full bg-white dark:bg-[#242424] border border-[#dadce0] dark:border-[#3c4043] rounded-xl px-3.5 py-2.5 text-sm text-[#202124] dark:text-[#e3e3e3] placeholder-[#5f6368] dark:placeholder-[#9aa0a6] focus:border-[#1a73e8] dark:focus:border-[#8ab4f8] outline-hidden"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-[#202124] dark:text-[#e3e3e3] uppercase tracking-wider">
                      Danh sách tên học sinh (Dán nhiều dòng)
                    </label>
                    <span className="text-[11px] text-[#1a73e8] dark:text-[#8ab4f8] font-medium">Hỗ trợ dán từ Excel</span>
                  </div>
                  <textarea
                    rows={6}
                    value={studentNamesText}
                    onChange={(e) => setStudentNamesText(e.target.value)}
                    placeholder="Nguyễn Văn An&#10;Trần Thị Bình&#10;Lê Hoàng Cúc..."
                    className="w-full bg-white dark:bg-[#242424] border border-[#dadce0] dark:border-[#3c4043] rounded-xl p-3 text-xs sm:text-sm text-[#202124] dark:text-[#e3e3e3] placeholder-[#5f6368] dark:placeholder-[#9aa0a6] font-mono focus:border-[#1a73e8] dark:focus:border-[#8ab4f8] outline-hidden"
                  />
                  <p className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] mt-1">
                    Mỗi học sinh 1 dòng. Hệ thống tự động lọc trùng lặp và loại bỏ dòng trống.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-[#dadce0] dark:border-[#3c4043]">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-5 py-2 bg-[#f1f3f4] hover:bg-[#e8eaed] dark:bg-[#282828] dark:hover:bg-[#303134] text-[#3c4043] dark:text-[#e3e3e3] border border-[#dadce0] dark:border-[#3c4043] text-xs font-semibold rounded-full cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 app-button-primary dark:bg-[#8ab4f8] dark:text-[#181818] disabled:opacity-50 text-white text-xs font-semibold rounded-full shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    {submitting ? 'Đang tạo...' : 'Xác Nhận Tạo Lớp'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Chi Tiết Danh Sách Học Sinh */}
        {selectedGroup && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="max-w-xl w-full bg-white dark:bg-[#1e1e1e] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-[#dadce0] dark:border-[#3c4043]">
                <div>
                  <h3 className="text-base font-bold text-[#202124] dark:text-[#e3e3e3]">{selectedGroup.name}</h3>
                  <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">
                    Mã lớp: <span className="font-mono text-[#1a73e8] dark:text-[#8ab4f8] font-bold">{selectedGroup.publicCode}</span> •{' '}
                    {groupStudents.length} học sinh
                  </p>
                </div>
                <button
                  onClick={() => { setSelectedGroup(null); setIssuedPins(null); }}
                  className="p-1.5 rounded-full text-[#5f6368] hover:text-[#202124] dark:text-[#9aa0a6] dark:hover:text-[#e3e3e3] hover:bg-[#f1f3f4] dark:hover:bg-[#282828] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form thêm nhanh 1 học sinh */}
              <form onSubmit={handleAddStudent} className="flex gap-2 my-4">
                <input
                  type="text"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="Thêm tên học sinh mới..."
                  className="flex-1 bg-white dark:bg-[#242424] border border-[#dadce0] dark:border-[#3c4043] rounded-full px-4 py-2 text-xs sm:text-sm text-[#202124] dark:text-[#e3e3e3] placeholder-[#5f6368] dark:placeholder-[#9aa0a6] focus:border-[#1a73e8] dark:focus:border-[#8ab4f8] outline-hidden"
                />
                <button
                  type="submit"
                  className="px-5 py-2 app-button-primary dark:bg-[#8ab4f8] dark:text-[#181818] text-white text-xs font-semibold rounded-full shrink-0 shadow-xs cursor-pointer"
                >
                  Thêm
                </button>
              </form>

              <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
                <button type="button" disabled={pinBusy || groupStudents.length === 0} onClick={() => void issuePins()} className="px-4 py-2 rounded-full border border-[#dadce0] dark:border-[#3c4043] font-semibold disabled:opacity-50">Cấp PIN cho cả lớp</button>
                <span className="text-[#5f6368] dark:text-[#9aa0a6]">Dùng khi giao bài có bật yêu cầu PIN. PIN chỉ hiện một lần ngay sau khi cấp.</span>
              </div>
              {issuedPins && issuedPins.length > 0 && (
                <div role="status" aria-label="PIN vừa cấp" className="mb-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
                  <p className="font-semibold">PIN vừa cấp (chỉ hiện một lần, hãy ghi lại hoặc tải về ngay)</p>
                  <ul className="mt-2 max-h-32 overflow-y-auto space-y-1 font-mono">{issuedPins.map(item => <li key={item.id}>{item.displayName}: <strong>{item.pin}</strong></li>)}</ul>
                  <div className="mt-2 flex gap-2">
                    <button type="button" onClick={() => void navigator.clipboard.writeText(issuedPins.map(item => `${item.displayName}: ${item.pin}`).join(String.fromCharCode(10)))} className="px-3 py-1.5 rounded-full border border-amber-400 font-semibold">Chép danh sách PIN</button>
                    <button type="button" onClick={downloadPins} className="px-3 py-1.5 rounded-full border border-amber-400 font-semibold">Tải PIN (CSV)</button>
                    <button type="button" onClick={() => setIssuedPins(null)} className="px-3 py-1.5 rounded-full border border-amber-400 font-semibold">Đã ghi lại, ẩn PIN</button>
                  </div>
                </div>
              )}

              {/* Danh sách học sinh */}
              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {loadingStudents ? (
                  <div className="py-8 text-center text-xs text-[#5f6368] dark:text-[#9aa0a6]">Đang tải học sinh...</div>
                ) : groupStudents.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#5f6368] dark:text-[#9aa0a6]">Lớp chưa có học sinh nào.</div>
                ) : (
                  groupStudents.map((st, idx) => (
                    <div
                      key={st.id}
                      className="flex items-center justify-between px-3.5 py-2 bg-[#f8f9fa] dark:bg-[#242424] rounded-xl border border-[#dadce0] dark:border-[#3c4043] text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-md bg-[#e8eaed] dark:bg-[#303134] text-[#3c4043] dark:text-[#e3e3e3] flex items-center justify-center font-bold text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="font-medium text-[#202124] dark:text-[#e3e3e3]">{st.displayName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6]">{st.hasPin ? 'Đã có PIN' : 'Chưa có PIN'}</span>
                        <button type="button" disabled={pinBusy} onClick={() => void issuePins([st.id])} className="text-[11px] text-[#1a73e8] dark:text-[#8ab4f8] font-semibold disabled:opacity-50">{st.hasPin ? 'Cấp lại PIN' : 'Cấp PIN'}</button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-[#dadce0] dark:border-[#3c4043] flex justify-end">
                <button
                  onClick={() => { setSelectedGroup(null); setIssuedPins(null); }}
                  className="px-5 py-2 bg-[#f1f3f4] hover:bg-[#e8eaed] dark:bg-[#282828] dark:hover:bg-[#303134] text-[#3c4043] dark:text-[#e3e3e3] border border-[#dadce0] dark:border-[#3c4043] text-xs font-semibold rounded-full cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
