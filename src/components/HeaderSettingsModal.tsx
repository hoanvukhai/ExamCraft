'use client';

import React, { useState, useEffect } from 'react';
import { ExamMetadata } from '@/types/exam';
import { X, Building2, Check, Sliders, Save, Sparkles } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Tùy Biến Tiêu Đề Đề Thi & Trường Học</h3>
            <p className="text-xs text-slate-500">Căn chỉnh thông tin in ấn theo đúng chuẩn trường của bạn</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Sở GD&ĐT / Đơn vị chủ quản:
              </label>
              <input
                type="text"
                value={formData.schoolName}
                onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                placeholder="Ví dụ: SỞ GIÁO DỤC VÀ ĐÀO TẠO..."
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Tên trường / Tổ chuyên môn:
              </label>
              <input
                type="text"
                value={formData.departmentName}
                onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
                placeholder="Ví dụ: TRƯỜNG THPT CHUYÊN..."
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Tên kỳ thi / Đợt kiểm tra:
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ví dụ: ĐỀ KIỂM TRA ĐỊNH KỲ GIỮA HỌC KỲ 2"
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold uppercase"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Mã đề thi:</label>
              <input
                type="text"
                value={formData.examCode || '101'}
                onChange={(e) => setFormData({ ...formData, examCode: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-center font-bold text-indigo-700"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Năm học:</label>
              <input
                type="text"
                value={formData.academicYear || '2025 - 2026'}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-center"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Thời gian làm bài:</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={formData.durationMinutes}
                  onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-center font-bold"
                />
                <span className="text-xs text-slate-500">phút</span>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Ghi chú coi thi (cuối đề):
            </label>
            <input
              type="text"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Ví dụ: Học sinh không được sử dụng tài liệu. Cán bộ coi thi không giải thích gì thêm."
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 italic"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              *Tự động lưu làm mẫu chuẩn cho mọi đề thi mới
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Hủy
              </button>

              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all"
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
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
