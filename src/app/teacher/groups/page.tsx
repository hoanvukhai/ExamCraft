'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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

  // Trạng thái copy
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/groups');
      const data = await res.json();
      if (res.ok) {
        setGroups(data.groups || []);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách lớp:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
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

      const res = await fetch('/api/groups', {
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
      const res = await fetch(`/api/groups/${group.id}`);
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
      const res = await fetch(`/api/groups/${selectedGroup.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addStudentName: newStudentName.trim() }),
      });
      if (res.ok) {
        setNewStudentName('');
        handleOpenGroupDetails(selectedGroup);
        fetchGroups();
      }
    } catch (err) {
      console.error(err);
    }
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
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                href="/"
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Soạn đề thi
              </Link>
              <span className="text-slate-600">/</span>
              <span className="text-xs text-indigo-400 font-semibold">Quản lý lớp học</span>
            </div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
              <GraduationCap className="w-7 h-7 text-indigo-400" />
              Lớp Học & Danh Sách Học Sinh
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Quản lý lớp dạy thêm, danh sách học sinh và gửi link thi trực tuyến theo từng lớp.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Tạo Lớp Mới
          </button>
        </div>

        {/* Thanh tìm kiếm */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm theo tên lớp hoặc mã lớp..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <span className="text-xs text-slate-400">
            Tổng cộng: <strong className="text-slate-200">{filteredGroups.length}</strong> lớp
          </span>
        </div>

        {/* Danh sách các Lớp */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs">Đang tải danh sách lớp học...</p>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-300">Chưa có lớp học nào</h3>
            <p className="text-xs text-slate-500 mt-1 mb-5 max-w-md mx-auto">
              Hãy tạo lớp học mới, dán danh sách tên học sinh để dễ dàng giao bài và theo dõi bảng điểm.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all"
            >
              Tạo Lớp Đầu Tiên
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredGroups.map((group) => (
              <div
                key={group.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      MÃ: {group.publicCode}
                    </span>
                    <button
                      onClick={() => copyClassLink(group.publicCode)}
                      title="Sao chép link lớp học"
                      className="text-xs text-slate-400 hover:text-indigo-400 flex items-center gap-1 p-1 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      {copiedCode === group.publicCode ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 text-[11px]">Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span className="text-[11px]">Chép link</span>
                        </>
                      )}
                    </button>
                  </div>

                  <h3 className="text-base font-bold text-white mb-1">{group.name}</h3>
                  {group.note && <p className="text-xs text-slate-400 mb-4 line-clamp-2">{group.note}</p>}

                  <div className="grid grid-cols-2 gap-2 my-4">
                    <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-800 text-center">
                      <span className="text-[11px] text-slate-400 block">Học sinh</span>
                      <span className="text-lg font-black text-indigo-400">{group._count.students}</span>
                    </div>
                    <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-800 text-center">
                      <span className="text-[11px] text-slate-400 block">Bài đã giao</span>
                      <span className="text-lg font-black text-emerald-400">{group._count.assignments}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleOpenGroupDetails(group)}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all"
                  >
                    Xem Danh Sách
                  </button>
                  <a
                    href={`/c/${group.publicCode}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all"
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
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                    <Plus className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-white">Tạo Lớp Học Mới</h3>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateGroup} className="space-y-4 mt-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Tên lớp học *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ví dụ: 12A1 Toán - Luyện Thi ĐGNL"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Ghi chú lớp
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Ví dụ: Lịch học tối T3, T5 hàng tuần..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Danh sách tên học sinh (Dán nhiều dòng)
                    </label>
                    <span className="text-[11px] text-indigo-400 font-medium">Hỗ trợ dán từ Excel</span>
                  </div>
                  <textarea
                    rows={6}
                    value={studentNamesText}
                    onChange={(e) => setStudentNamesText(e.target.value)}
                    placeholder="Nguyễn Văn An&#10;Trần Thị Bình&#10;Lê Hoàng Cúc..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs sm:text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Mỗi học sinh 1 dòng. Hệ thống tự động lọc trùng lặp và loại bỏ dòng trống.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-1.5"
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
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white">{selectedGroup.name}</h3>
                  <p className="text-xs text-slate-400">
                    Mã lớp: <span className="font-mono text-indigo-300 font-bold">{selectedGroup.publicCode}</span> •{' '}
                    {groupStudents.length} học sinh
                  </p>
                </div>
                <button
                  onClick={() => setSelectedGroup(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
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
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shrink-0"
                >
                  Thêm
                </button>
              </form>

              {/* Danh sách học sinh */}
              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {loadingStudents ? (
                  <div className="py-8 text-center text-xs text-slate-500">Đang tải học sinh...</div>
                ) : groupStudents.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500">Lớp chưa có học sinh nào.</div>
                ) : (
                  groupStudents.map((st, idx) => (
                    <div
                      key={st.id}
                      className="flex items-center justify-between px-3.5 py-2 bg-slate-800/60 rounded-xl border border-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-md bg-slate-700 text-slate-400 flex items-center justify-center font-bold text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="font-medium text-slate-200">{st.displayName}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setSelectedGroup(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
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
