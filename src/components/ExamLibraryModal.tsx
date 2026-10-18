'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Exam } from '@/types/exam';
import { exportExamToDocx } from '@/lib/docx-export';
import { 
  dbGetAllExams, 
  dbSaveExam, 
  dbDeleteExam, 
  dbExportDatabaseToJson, 
  dbImportDatabaseFromJson 
} from '@/lib/db';
import { 
  X, 
  BookMarked, 
  Search, 
  FolderOpen, 
  Copy, 
  Trash2, 
  Download, 
  Upload,
  CloudUpload,
  Clock, 
  Calendar,
  Layers,
  Database,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface ExamLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadExam: (exam: Exam) => void;
  currentExam: Exam;
}

export const ExamLibraryModal: React.FC<ExamLibraryModalProps> = ({
  isOpen,
  onClose,
  onLoadExam,
  currentExam,
}) => {
  const [savedExams, setSavedExams] = useState<Exam[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tải danh sách đề từ IndexedDB
  const loadSavedExams = async () => {
    try {
      const exams = await dbGetAllExams();
      if (exams.length > 0) {
        setSavedExams(exams);
      } else {
        // Tự động lưu đề hiện tại làm mẫu đầu tiên nếu thư viện rỗng
        await dbSaveExam(currentExam);
        setSavedExams([currentExam]);
      }
    } catch (e) {
      console.error('Lỗi khi nạp thư viện đề từ IndexedDB:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadSavedExams();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Xóa đề
  const handleDelete = async (id: string) => {
    try {
      await dbDeleteExam(id);
      const updated = savedExams.filter(e => e.id !== id);
      setSavedExams(updated);
      setNotification({ type: 'success', message: 'Đã xóa đề thi khỏi cơ sở dữ liệu máy.' });
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  // Nhân bản đề (Clone)
  const handleClone = async (exam: Exam) => {
    try {
      const cloned: Exam = {
        ...exam,
        id: `exam_cloned_${Date.now()}`,
        metadata: {
          ...exam.metadata,
          title: `${exam.metadata.title} (Bản sao)`,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await dbSaveExam(cloned);
      setSavedExams([cloned, ...savedExams]);
      setNotification({ type: 'success', message: 'Đã tạo bản sao đề thi thành công.' });
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  // Xuất bản sao lưu JSON toàn bộ kho đề
  const handleExportBackup = async () => {
    try {
      const jsonString = await dbExportDatabaseToJson();
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ExamCraft_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setNotification({ type: 'success', message: 'Đã tải về file sao lưu JSON an toàn.' });
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      console.error('Lỗi khi sao lưu JSON:', err);
    }
  };

  // Phục hồi kho đề từ file sao lưu JSON
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const res = await dbImportDatabaseFromJson(text);
      await loadSavedExams();
      setNotification({
        type: 'success',
        message: `Phục hồi thành công ${res.examsCount} đề thi và ${res.questionsCount} câu hỏi!`,
      });
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error('Lỗi khi phục hồi JSON:', err);
      setNotification({ type: 'error', message: 'File sao lưu không hợp lệ hoặc bị lỗi định dạng.' });
      setTimeout(() => setNotification(null), 4000);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Tải file Word trực tiếp từ thư viện
  const handleExportDocx = async (exam: Exam) => {
    try {
      const blob = await exportExamToDocx(exam, true);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${exam.metadata.title.replace(/\s+/g, '_')}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    }
  };

  const [isMigrating, setIsMigrating] = useState(false);

  // Chuyển toàn bộ dữ liệu từ IndexedDB bản cũ sang PostgreSQL server
  const handleMigrateToServer = async () => {
    try {
      setIsMigrating(true);
      const jsonString = await dbExportDatabaseToJson();
      const backupData = JSON.parse(jsonString);

      const res = await fetch('/api/migration/import-legacy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backupData),
      });

      const data = await res.json();
      if (!res.ok) {
        setNotification({
          type: 'error',
          message: data.error || 'Vui lòng đăng nhập tài khoản giáo viên trước khi đồng bộ lên máy chủ!',
        });
        setTimeout(() => setNotification(null), 4000);
        return;
      }

      setNotification({
        type: 'success',
        message: data.message || 'Đã đồng bộ thành công kho đề cũ lên cơ sở dữ liệu PostgreSQL!',
      });
      setTimeout(() => setNotification(null), 5000);
    } catch (err) {
      console.error('Lỗi khi đồng bộ dữ liệu cũ lên server:', err);
      setNotification({ type: 'error', message: 'Lỗi kết nối khi đồng bộ lên máy chủ.' });
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setIsMigrating(false);
    }
  };

  const filteredExams = savedExams.filter(e =>
    e.metadata.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.metadata.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `lop ${e.metadata.grade}`.includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1e1e1e] rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-[#dadce0] dark:border-[#3c4043] relative max-h-[90vh] flex flex-col text-[#202124] dark:text-[#e3e3e3] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#dadce0] dark:border-[#3c4043]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#e8f0fe] dark:bg-[#1e2a38] text-[#1a73e8] dark:text-[#8ab4f8] border border-[#d2e3fc] dark:border-[#29425e] flex items-center justify-center shadow-xs">
              <BookMarked className="w-5 h-5 text-[#1a73e8] dark:text-[#8ab4f8]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-[#202124] dark:text-[#e3e3e3] text-lg">Kho Đề Thi Cá Nhân (IndexedDB)</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#e6f4ea] dark:bg-[#0f291e] text-[#137333] dark:text-[#5bb98c] border border-[#ceead6] dark:border-[#1d4834] flex items-center gap-1">
                  <Database className="w-3 h-3" />
                  <span>Offline Storage</span>
                </span>
              </div>
              <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">Lưu trữ không giới hạn dung lượng trên máy tính của bạn</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#5f6368] hover:text-[#202124] dark:text-[#9aa0a6] dark:hover:text-[#e3e3e3] rounded-full hover:bg-[#f1f3f4] dark:hover:bg-[#282828] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thông báo Toast */}
        {notification && (
          <div
            className={`mt-3 p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 transition-all ${
              notification.type === 'success'
                ? 'bg-[#e6f4ea] dark:bg-[#0f291e] text-[#137333] dark:text-[#5bb98c] border border-[#ceead6] dark:border-[#1d4834]'
                : 'bg-[#fce8e6] dark:bg-[#371918] text-[#c5221f] dark:text-[#f28b82] border border-[#fad2cf] dark:border-[#5c2523]'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Thanh tìm kiếm & Nút Sao lưu / Phục hồi */}
        <div className="pt-4 pb-2 flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative grow w-full">
            <Search className="w-4 h-4 text-[#5f6368] dark:text-[#9aa0a6] absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên đề thi, môn học, khối lớp..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-10 pr-4 py-2.5 bg-white dark:bg-[#282828] border border-[#dadce0] dark:border-[#3c4043] text-[#202124] dark:text-[#e3e3e3] rounded-full focus:border-[#1a73e8] dark:focus:border-[#8ab4f8] focus:ring-1 focus:ring-[#1a73e8] dark:focus:ring-[#8ab4f8] outline-hidden transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
            <button
              onClick={handleMigrateToServer}
              disabled={isMigrating}
              title="Chuyển dữ liệu đề thi trên máy này vào tài khoản PostgreSQL trên máy chủ"
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-[#1a73e8] hover:bg-[#1557b0] dark:bg-[#8ab4f8] dark:hover:bg-[#a8c7fa] dark:text-[#202124] rounded-full transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <CloudUpload className={`w-3.5 h-3.5 ${isMigrating ? 'animate-bounce' : ''}`} />
              <span>{isMigrating ? 'Đang đồng bộ...' : 'Đồng bộ lên Server'}</span>
            </button>

            <button
              onClick={handleExportBackup}
              title="Xuất file sao lưu JSON toàn bộ kho đề"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#3c4043] dark:text-[#e3e3e3] bg-white dark:bg-[#282828] hover:bg-[#f8f9fa] dark:hover:bg-[#303134] rounded-full border border-[#dadce0] dark:border-[#3c4043] transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Sao lưu JSON</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              title="Phục hồi kho đề từ file JSON"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#3c4043] dark:text-[#e3e3e3] bg-white dark:bg-[#282828] hover:bg-[#f8f9fa] dark:hover:bg-[#303134] rounded-full border border-[#dadce0] dark:border-[#3c4043] transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Phục hồi JSON</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Danh sách đề thi */}
        <div className="grow overflow-y-auto py-3 space-y-3 pr-1">
          {filteredExams.map((ex) => (
            <div
              key={ex.id}
              className="p-4 rounded-2xl border border-[#dadce0] dark:border-[#3c4043] bg-white dark:bg-[#282828]/50 hover:border-[#1a73e8] dark:hover:border-[#8ab4f8] transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[#202124] dark:text-[#e3e3e3]">{ex.metadata.title}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#e8f0fe] dark:bg-[#1e2a38] text-[#1a73e8] dark:text-[#8ab4f8] border border-[#d2e3fc] dark:border-[#29425e]">
                    {ex.metadata.subject} {ex.metadata.grade}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-[#5f6368] dark:text-[#9aa0a6]">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-[#5f6368] dark:text-[#9aa0a6]" />
                    <span>{ex.questions.length} câu hỏi</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#5f6368] dark:text-[#9aa0a6]" />
                    <span>{ex.metadata.durationMinutes} phút</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#5f6368] dark:text-[#9aa0a6]" />
                    <span>{new Date(ex.updatedAt || ex.createdAt).toLocaleDateString('vi-VN')}</span>
                  </span>
                </div>
              </div>

              {/* Nút hành động */}
              <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-[#dadce0] dark:border-[#3c4043]/60">
                <button
                  onClick={() => {
                    onLoadExam(ex);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-[#1a73e8] hover:bg-[#1557b0] dark:bg-[#8ab4f8] dark:hover:bg-[#a8c7fa] dark:text-[#202124] rounded-full shadow-xs transition-all cursor-pointer"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Mở biên tập</span>
                </button>

                <button
                  onClick={() => handleExportDocx(ex)}
                  title="Xuất file Word"
                  className="p-1.5 text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124] dark:hover:text-[#e3e3e3] bg-white dark:bg-[#282828] hover:bg-[#f1f3f4] dark:hover:bg-[#303134] border border-[#dadce0] dark:border-[#3c4043] rounded-full transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleClone(ex)}
                  title="Tạo bản sao đề này"
                  className="p-1.5 text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124] dark:hover:text-[#e3e3e3] bg-white dark:bg-[#282828] hover:bg-[#f1f3f4] dark:hover:bg-[#303134] border border-[#dadce0] dark:border-[#3c4043] rounded-full transition-colors cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDelete(ex.id)}
                  title="Xóa đề này"
                  className="p-1.5 text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#c5221f] dark:hover:text-[#f28b82] hover:bg-[#fce8e6] dark:hover:bg-[#371918] rounded-full transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {filteredExams.length === 0 && (
            <div className="p-12 text-center text-[#5f6368] dark:text-[#9aa0a6]">
              <BookMarked className="w-10 h-10 text-[#5f6368] dark:text-[#9aa0a6] mx-auto mb-2 opacity-50" />
              <p className="text-xs">Không tìm thấy đề thi nào phù hợp.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[#dadce0] dark:border-[#3c4043] flex justify-between items-center text-xs text-[#5f6368] dark:text-[#9aa0a6]">
          <span>Tổng số đề lưu trong IndexedDB: {savedExams.length}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 font-medium text-[#3c4043] dark:text-[#e3e3e3] hover:bg-[#f1f3f4] dark:hover:bg-[#282828] rounded-full transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
