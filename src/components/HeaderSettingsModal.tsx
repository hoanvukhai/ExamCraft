'use client';

import React, { useState, useEffect } from 'react';
import { ExamMetadata } from '@/types/exam';
import { X, Building2, Check, Save } from 'lucide-react';

interface HeaderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  metadata: ExamMetadata;
  onSaveMetadata: (newMetadata: ExamMetadata) => void;
}

export const HeaderSettingsModal: React.FC<HeaderSettingsModalProps> = ({
  isOpen,
  onClose,
  metadata,
  onSaveMetadata,
}) => {
  const [formData, setFormData] = useState<ExamMetadata>(metadata);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setFormData(metadata);
  }, [metadata]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveMetadata(formData);

    // Lưu làm template mặc định cho các đề sau
    try {
      localStorage.setItem('examcraft_default_header', JSON.stringify({
        schoolName: formData.schoolName,
        departmentName: formData.departmentName,
        academicYear: formData.academicYear,
        notes: formData.notes,
      }));
    } catch (err) {
      console.error(err);
    }

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1e1e1e] rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-[#dadce0] dark:border-[#3c4043] relative animate-in fade-in zoom-in-95 duration-150 text-[#202124] dark:text-[#e3e3e3]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#5f6368] hover:text-[#202124] dark:text-[#9aa0a6] dark:hover:text-[#e3e3e3] rounded-full hover:bg-[#f1f3f4] dark:hover:bg-[#282828] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-[#e8f0fe] dark:bg-[#1e2a38] text-[#1a73e8] dark:text-[#8ab4f8] flex items-center justify-center border border-transparent dark:border-[#3c4043]">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-[#202124] dark:text-[#e3e3e3] text-base sm:text-lg">Tùy Biến Tiêu Đề Đề Thi & Trường Học</h3>
            <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">Căn chỉnh thông tin in ấn theo đúng chuẩn trường của bạn</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#3c4043] dark:text-[#e3e3e3] block mb-1">
                Sở GD&ĐT / Đơn vị chủ quản:
              </label>
              <input
                type="text"
                value={formData.schoolName}
                onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                placeholder="Ví dụ: SỞ GIÁO DỤC VÀ ĐÀO TẠO..."
                className="w-full text-xs p-2.5 bg-[#f8f9fa] dark:bg-[#282828] border border-[#dadce0] dark:border-[#3c4043] text-[#202124] dark:text-[#e3e3e3] rounded-xl focus:ring-2 focus:ring-[#1a73e8] dark:focus:ring-[#8ab4f8] font-semibold outline-hidden"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#3c4043] dark:text-[#e3e3e3] block mb-1">
                Tên trường / Tổ chuyên môn:
              </label>
              <input
                type="text"
                value={formData.departmentName}
                onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
                placeholder="Ví dụ: TRƯỜNG THPT CHUYÊN..."
                className="w-full text-xs p-2.5 bg-[#f8f9fa] dark:bg-[#282828] border border-[#dadce0] dark:border-[#3c4043] text-[#202124] dark:text-[#e3e3e3] rounded-xl focus:ring-2 focus:ring-[#1a73e8] dark:focus:ring-[#8ab4f8] font-semibold outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#3c4043] dark:text-[#e3e3e3] block mb-1">
              Tên kỳ thi / Đợt kiểm tra:
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ví dụ: ĐỀ KIỂM TRA ĐỊNH KỲ GIỮA HỌC KỲ 2"
              className="w-full text-xs p-2.5 bg-[#f8f9fa] dark:bg-[#282828] border border-[#dadce0] dark:border-[#3c4043] text-[#202124] dark:text-[#e3e3e3] rounded-xl focus:ring-2 focus:ring-[#1a73e8] dark:focus:ring-[#8ab4f8] font-bold uppercase outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#3c4043] dark:text-[#e3e3e3] block mb-1">Mã đề thi:</label>
              <input
                type="text"
                value={formData.examCode || '101'}
                onChange={(e) => setFormData({ ...formData, examCode: e.target.value })}
                className="w-full text-xs p-2.5 bg-[#f8f9fa] dark:bg-[#282828] border border-[#dadce0] dark:border-[#3c4043] text-[#1a73e8] dark:text-[#8ab4f8] rounded-xl focus:ring-2 focus:ring-[#1a73e8] dark:focus:ring-[#8ab4f8] text-center font-bold outline-hidden"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#3c4043] dark:text-[#e3e3e3] block mb-1">Năm học:</label>
              <input
                type="text"
                value={formData.academicYear || '2025 - 2026'}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                className="w-full text-xs p-2.5 bg-[#f8f9fa] dark:bg-[#282828] border border-[#dadce0] dark:border-[#3c4043] text-[#202124] dark:text-[#e3e3e3] rounded-xl focus:ring-2 focus:ring-[#1a73e8] dark:focus:ring-[#8ab4f8] text-center outline-hidden"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#3c4043] dark:text-[#e3e3e3] block mb-1">Thời gian làm bài:</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={formData.durationMinutes}
                  onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                  className="w-full text-xs p-2.5 bg-[#f8f9fa] dark:bg-[#282828] border border-[#dadce0] dark:border-[#3c4043] text-[#202124] dark:text-[#e3e3e3] rounded-xl focus:ring-2 focus:ring-[#1a73e8] dark:focus:ring-[#8ab4f8] text-center font-bold outline-hidden"
                />
                <span className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">phút</span>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#3c4043] dark:text-[#e3e3e3] block mb-1">
              Ghi chú coi thi (cuối đề):
            </label>
            <input
              type="text"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Ví dụ: Học sinh không được sử dụng tài liệu. Cán bộ coi thi không giải thích gì thêm."
              className="w-full text-xs p-2.5 bg-[#f8f9fa] dark:bg-[#282828] border border-[#dadce0] dark:border-[#3c4043] text-[#202124] dark:text-[#e3e3e3] rounded-xl focus:ring-2 focus:ring-[#1a73e8] dark:focus:ring-[#8ab4f8] italic outline-hidden"
            />
          </div>

          <div className="pt-3 border-t border-[#dadce0] dark:border-[#3c4043] flex items-center justify-between">
            <span className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6]">
              *Tự động lưu làm mẫu chuẩn cho mọi đề thi mới
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-[#5f6368] hover:text-[#202124] dark:text-[#9aa0a6] dark:hover:text-[#e3e3e3] hover:bg-[#f1f3f4] dark:hover:bg-[#282828] rounded-full transition-colors cursor-pointer"
              >
                Hủy
              </button>

              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[#1a73e8] hover:bg-[#1557b0] dark:bg-[#8ab4f8] dark:text-[#17202a] dark:hover:bg-[#a8c7fa] rounded-full shadow-xs transition-all cursor-pointer"
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300 dark:text-emerald-950" />
                    <span>Đã áp dụng!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Áp dụng vào đề thi</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
