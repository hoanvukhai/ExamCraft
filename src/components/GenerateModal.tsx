'use client';

import React, { useState } from 'react';
import { Subject, GenerationParams, Exam } from '@/types/exam';
import { getSubjectsForGrade } from '@/lib/subject-config';
import { Sparkles, X, BookOpen, Clock, Layers, Sliders, AlertCircle, RefreshCw } from 'lucide-react';

interface GenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExamGenerated: (exam: Exam) => void;
  apiKey: string;
}

export const GenerateModal: React.FC<GenerateModalProps> = ({
  isOpen,
  onClose,
  onExamGenerated,
  apiKey,
}) => {
  const [subject, setSubject] = useState<Subject>('toan');
  const [grade, setGrade] = useState<number>(12);
  const [duration, setDuration] = useState<number>(45);
  const [topic, setTopic] = useState<string>('Khảo sát sự biến thiên và đồ thị của hàm số, tiệm cận, cực trị');
  const [numMC, setNumMC] = useState<number>(4);
  const [numTF, setNumTF] = useState<number>(1);
  const [numSA, setNumSA] = useState<number>(1);
  const [customInstructions, setCustomInstructions] = useState<string>('');
  const [integratedSubBranch, setIntegratedSubBranch] = useState<'all' | 'physics' | 'chemistry' | 'biology' | 'history' | 'geography'>('all');
  const [curriculumTrack, setCurriculumTrack] = useState<'core' | 'advanced_topic'>('core');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Preset mẫu phổ biến
  const applyPreset = (type: '15min' | '45min' | 'new_gdpt') => {
    if (type === '15min') {
      setDuration(15);
      setNumMC(6);
      setNumTF(0);
      setNumSA(1);
    } else if (type === '45min') {
      setDuration(45);
      setNumMC(8);
      setNumTF(1);
      setNumSA(2);
    } else if (type === 'new_gdpt') {
      setDuration(90);
      setNumMC(12);
      setNumTF(4);
      setNumSA(6);
    }
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    const params: GenerationParams = {
      subject,
      grade,
      topic,
      durationMinutes: duration,
      numMultipleChoice: numMC,
      numTrueFalse: numTF,
      numShortAnswer: numSA,
      numEssay: 0,
      difficultyRatio: {
        nhan_biet: 40,
        thong_hieu: 30,
        van_dung: 20,
        van_dung_cao: 10,
      },
      customInstructions,
      integratedSubBranch: (grade <= 9 && (subject === 'khtn' || subject === 'lich_su_dia_ly')) ? integratedSubBranch : undefined,
      curriculumTrack: grade >= 10 ? curriculumTrack : undefined,
    };

    try {
      const res = await fetch('/api/generate-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          params,
          customApiKey: apiKey,
        }),
      });

      const data = await res.json();
      if (data.success && data.exam) {
        onExamGenerated(data.exam);
        onClose();
      } else {
        setErrorMessage(data.error || 'Có lỗi xảy ra khi sinh đề');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Không thể kết nối đến máy chủ sinh đề.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Thiết Lập Sinh Đề Thi Bằng AI</h3>
              <p className="text-xs text-slate-500">Soạn đề chuẩn ma trận kiến thức GDPT 2018</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="grow overflow-y-auto py-4 space-y-4 pr-1">
          {/* Mẫu nhanh */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
              Chọn cấu trúc mẫu nhanh:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => applyPreset('15min')}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-400 bg-slate-50/60 hover:bg-indigo-50/40 text-left transition-all"
              >
                <div className="font-bold text-xs text-slate-800">Kiểm tra 15 phút</div>
                <div className="text-[11px] text-slate-500">6 trắc nghiệm + 1 điền số</div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('45min')}
                className="p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/50 text-left transition-all"
              >
                <div className="font-bold text-xs text-indigo-900">Kiểm tra 1 tiết (45p)</div>
                <div className="text-[11px] text-indigo-600">8 trắc nghiệm + 1 Đ/S + 2 điền số</div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('new_gdpt')}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-400 bg-slate-50/60 hover:bg-indigo-50/40 text-left transition-all"
              >
                <div className="font-bold text-xs text-slate-800">Chuẩn thi mới 2025 (90p)</div>
                <div className="text-[11px] text-slate-500">12 TN + 4 Đ/S + 6 điền số</div>
              </button>
            </div>
          </div>

          {/* Chọn Môn & Lớp */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Môn học (chuẩn GDPT 2018):</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value as Subject)}
                className="w-full text-xs font-medium p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              >
                {getSubjectsForGrade(grade).map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label} {s.category ? `[${s.category}]` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Khối lớp:</label>
              <select
                value={grade}
                onChange={(e) => {
                  const newGrade = Number(e.target.value);
                  setGrade(newGrade);
                  const validSubjects = getSubjectsForGrade(newGrade);
                  if (!validSubjects.some(s => s.key === subject)) {
                    setSubject(validSubjects[0].key);
                  }
                }}
                className="w-full text-xs font-medium p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              >
                <optgroup label="Cấp Tiểu học (Lớp 1 - 5)">
                  {[1, 2, 3, 4, 5].map((g) => (
                    <option key={g} value={g}>Lớp {g}</option>
                  ))}
                </optgroup>
                <optgroup label="Cấp THCS (Lớp 6 - 9)">
                  {[6, 7, 8, 9].map((g) => (
                    <option key={g} value={g}>Lớp {g}</option>
                  ))}
                </optgroup>
                <optgroup label="Cấp THPT (Lớp 10 - 12)">
                  {[10, 11, 12].map((g) => (
                    <option key={g} value={g}>Lớp {g}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Thời gian làm bài:</label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full text-xs font-medium p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
              >
                <option value={15}>15 phút</option>
                <option value={45}>45 phút</option>
                <option value={60}>60 phút</option>
                <option value={90}>90 phút</option>
              </select>
            </div>
          </div>

          {/* PHẠM VI PHÂN MÔN THCS (Dành cho KHTN & Lịch sử - Địa lí) */}
          {grade <= 9 && (subject === 'khtn' || subject === 'lich_su_dia_ly') && (
            <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-teal-700" />
                  <span>Phạm vi phân môn (Dành cho GV THCS):</span>
                </label>
                <span className="text-[11px] text-teal-700 italic">Kiểm tra chuyên môn</span>
              </div>
              {subject === 'khtn' ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setIntegratedSubBranch('all')}
                    className={`px-2 py-1.5 rounded-lg font-medium transition-all text-center ${
                      integratedSubBranch === 'all'
                        ? 'bg-teal-700 text-white font-bold shadow-xs'
                        : 'bg-white text-teal-900 border border-teal-200 hover:bg-teal-100/50'
                    }`}
                  >
                    Đề tích hợp cả 3
                  </button>
                  <button
                    type="button"
                    onClick={() => setIntegratedSubBranch('physics')}
                    className={`px-2 py-1.5 rounded-lg font-medium transition-all text-center ${
                      integratedSubBranch === 'physics'
                        ? 'bg-teal-700 text-white font-bold shadow-xs'
                        : 'bg-white text-teal-900 border border-teal-200 hover:bg-teal-100/50'
                    }`}
                  >
                    Phân môn Vật lí
                  </button>
                  <button
                    type="button"
                    onClick={() => setIntegratedSubBranch('chemistry')}
                    className={`px-2 py-1.5 rounded-lg font-medium transition-all text-center ${
                      integratedSubBranch === 'chemistry'
                        ? 'bg-teal-700 text-white font-bold shadow-xs'
                        : 'bg-white text-teal-900 border border-teal-200 hover:bg-teal-100/50'
                    }`}
                  >
                    Phân môn Hóa học
                  </button>
                  <button
                    type="button"
                    onClick={() => setIntegratedSubBranch('biology')}
                    className={`px-2 py-1.5 rounded-lg font-medium transition-all text-center ${
                      integratedSubBranch === 'biology'
                        ? 'bg-teal-700 text-white font-bold shadow-xs'
                        : 'bg-white text-teal-900 border border-teal-200 hover:bg-teal-100/50'
                    }`}
                  >
                    Phân môn Sinh học
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setIntegratedSubBranch('all')}
                    className={`px-2 py-1.5 rounded-lg font-medium transition-all text-center ${
                      integratedSubBranch === 'all'
                        ? 'bg-teal-700 text-white font-bold shadow-xs'
                        : 'bg-white text-teal-900 border border-teal-200 hover:bg-teal-100/50'
                    }`}
                  >
                    Đề tích hợp Sử - Địa
                  </button>
                  <button
                    type="button"
                    onClick={() => setIntegratedSubBranch('history')}
                    className={`px-2 py-1.5 rounded-lg font-medium transition-all text-center ${
                      integratedSubBranch === 'history'
                        ? 'bg-teal-700 text-white font-bold shadow-xs'
                        : 'bg-white text-teal-900 border border-teal-200 hover:bg-teal-100/50'
                    }`}
                  >
                    Phân môn Lịch sử
                  </button>
                  <button
                    type="button"
                    onClick={() => setIntegratedSubBranch('geography')}
                    className={`px-2 py-1.5 rounded-lg font-medium transition-all text-center ${
                      integratedSubBranch === 'geography'
                        ? 'bg-teal-700 text-white font-bold shadow-xs'
                        : 'bg-white text-teal-900 border border-teal-200 hover:bg-teal-100/50'
                    }`}
                  >
                    Phân môn Địa lí
                  </button>
                </div>
              )}
            </div>
          )}

          {/* KHUNG CHƯƠNG TRÌNH THPT (Cốt lõi vs Cụm chuyên đề) */}
          {grade >= 10 && (
            <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-700" />
                  <span>Khung chương trình THPT (GDPT 2018):</span>
                </label>
                <span className="text-[10px] bg-indigo-200/60 text-indigo-800 px-2 py-0.5 rounded-md font-semibold">
                  TT 17/2025 Cập nhật
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setCurriculumTrack('core')}
                  className={`p-2 rounded-xl border text-left transition-all ${
                    curriculumTrack === 'core'
                      ? 'bg-white border-indigo-600 ring-2 ring-indigo-500/20 text-indigo-950 shadow-xs'
                      : 'bg-white/60 border-indigo-200 text-slate-700 hover:bg-white'
                  }`}
                >
                  <div className="font-bold">📘 Chương trình Cốt lõi (70 tiết)</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Kiểm tra định kỳ kiến thức phổ thông</div>
                </button>
                <button
                  type="button"
                  onClick={() => setCurriculumTrack('advanced_topic')}
                  className={`p-2 rounded-xl border text-left transition-all ${
                    curriculumTrack === 'advanced_topic'
                      ? 'bg-white border-indigo-600 ring-2 ring-indigo-500/20 text-indigo-950 shadow-xs'
                      : 'bg-white/60 border-indigo-200 text-slate-700 hover:bg-white'
                  }`}
                >
                  <div className="font-bold text-indigo-900">🚀 Cụm Chuyên đề Học tập (35 tiết)</div>
                  <div className="text-[11px] text-indigo-600 mt-0.5">Kiểm tra 3 chuyên đề nâng cao / thi ĐH</div>
                </button>
              </div>
            </div>
          )}

          {/* Nhập chủ đề / yêu cầu */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">Chủ đề & Nội dung kiến thức:</label>
            </div>
            <textarea
              rows={2}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ví dụ: Khảo sát hàm số, bài toán cực trị, ứng dụng thực tế..."
              className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 leading-relaxed"
            />
          </div>

          {/* Cấu hình số lượng từng loại câu hỏi */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
              Số lượng câu hỏi từng phần:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-xs text-slate-600 block mb-1">Phần I (Trắc nghiệm 4 LC):</span>
                <input
                  type="number"
                  min={1}
                  max={40}
                  value={numMC}
                  onChange={(e) => setNumMC(Number(e.target.value))}
                  className="w-full text-xs font-bold p-2 bg-white border border-slate-300 rounded-lg text-center"
                />
              </div>

              <div>
                <span className="text-xs text-slate-600 block mb-1">Phần II (Đúng / Sai 4 ý):</span>
                <input
                  type="number"
                  min={0}
                  max={8}
                  value={numTF}
                  onChange={(e) => setNumTF(Number(e.target.value))}
                  className="w-full text-xs font-bold p-2 bg-white border border-slate-300 rounded-lg text-center"
                />
              </div>

              <div>
                <span className="text-xs text-slate-600 block mb-1">Phần III (Điền số / kết quả):</span>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={numSA}
                  onChange={(e) => setNumSA(Number(e.target.value))}
                  className="w-full text-xs font-bold p-2 bg-white border border-slate-300 rounded-lg text-center"
                />
              </div>
            </div>
          </div>

          {/* Ghi chú thêm cho AI */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Yêu cầu sư phạm bổ sung (tùy chọn):
            </label>
            <input
              type="text"
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="Ví dụ: Tránh nghiệm vô tỉ phức tạp, thêm 1 câu liên hệ thực tế..."
              className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Thông tin pháp lý GDPT 2018 & QĐ 764/QĐ-BGDĐT */}
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 flex items-start gap-2">
            <span className="text-emerald-600 font-bold shrink-0 mt-0.5">✓</span>
            <div>
              <strong className="text-slate-800">Chuẩn hóa GDPT 2018 & Quyết định 764/QĐ-BGDĐT:</strong> Cấu trúc định dạng đề thi chuẩn Bộ GD&ĐT, tự động cập nhật địa giới hành chính, số liệu thống kê mới và quy định pháp luật hiện hành.
            </div>
          </div>

          {/* Cảnh báo lỗi nếu có */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Tổng cộng: <strong className="text-indigo-600">{numMC + numTF + numSA}</strong> câu hỏi
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Hủy
            </button>
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>AI đang biên soạn đề...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Bắt đầu sinh đề ngay</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
