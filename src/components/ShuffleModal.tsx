'use client';

import React, { useState } from 'react';
import { Exam, ShuffledExamVariant } from '@/types/exam';
import { generateShuffledExams, buildAnswerMatrix } from '@/lib/shuffler';
import { exportExamToDocx } from '@/lib/docx-export';
import { X, Shuffle, Download, FileText, Check, Copy } from 'lucide-react';

interface ShuffleModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseExam: Exam;
  onSelectVariant: (variantExam: Exam) => void;
}

export const ShuffleModal: React.FC<ShuffleModalProps> = ({
  isOpen,
  onClose,
  baseExam,
  onSelectVariant,
}) => {
  const [numVariants, setNumVariants] = useState<number>(4);
  const [variants, setVariants] = useState<ShuffledExamVariant[]>([]);
  const [copiedMatrix, setCopiedMatrix] = useState(false);

  // Chỉ sinh các mã đề xáo trộn ngẫu nhiên khi modal được mở ra
  React.useEffect(() => {
    if (isOpen) {
      setVariants(generateShuffledExams(baseExam, numVariants, 101));
    }
  }, [isOpen, baseExam, numVariants]);

  if (!isOpen) return null;


  const handleReshuffle = () => {
    setVariants(generateShuffledExams(baseExam, numVariants, 101));
  };

  const matrix = buildAnswerMatrix(variants);

  // Copy bảng ma trận dạng text
  const handleCopyMatrix = () => {
    let text = `MA TRẬN ĐÁP ÁN ĐỀ THI: ${baseExam.metadata.title}\n`;
    text += `Câu\t` + variants.map(v => `Mã ${v.examCode}`).join('\t') + '\n';
    matrix.forEach(row => {
      text += `${row.questionNumber}\t` + variants.map(v => row.codes[v.examCode] || '-').join('\t') + '\n';
    });
    navigator.clipboard.writeText(text);
    setCopiedMatrix(true);
    setTimeout(() => setCopiedMatrix(false), 1500);
  };

  // Tải file Word của 1 mã đề
  const handleDownloadVariant = async (variant: ShuffledExamVariant) => {
    const blob = await exportExamToDocx(variant.exam, true);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${baseExam.metadata.title}_MaDe_${variant.examCode}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Shuffle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Trộn Đề Thi & Tạo Ma Trận Đáp Án</h3>
              <p className="text-xs text-slate-500">Hoán vị thứ tự câu hỏi và phương án A, B, C, D</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cấu hình trộn */}
        <div className="py-4 flex flex-wrap items-center justify-between gap-3 bg-slate-50 px-4 rounded-xl my-4 border border-slate-200/80">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">Số lượng mã đề cần tạo:</span>
            <select
              value={numVariants}
              onChange={(e) => setNumVariants(Number(e.target.value))}
              className="text-xs font-semibold bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-indigo-500"
            >
              <option value={2}>2 mã đề (101, 102)</option>
              <option value={4}>4 mã đề (101, 102, 103, 104)</option>
              <option value={6}>6 mã đề (101 - 106)</option>
              <option value={8}>8 mã đề (101 - 108)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReshuffle}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-100/70 hover:bg-indigo-100 transition-colors"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Trộn ngẫu nhiên lại</span>
            </button>

            <button
              onClick={handleCopyMatrix}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors"
            >
              {copiedMatrix ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedMatrix ? 'Đã sao chép!' : 'Sao chép ma trận đáp án'}</span>
            </button>
          </div>
        </div>

        {/* Danh sách các mã đề và bảng ma trận */}
        <div className="grow overflow-y-auto space-y-6 pr-1">
          {/* Danh sách mã đề có nút xem/tải */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Danh Sách Các Mã Đề Đã Sinh ({variants.length} bản)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {variants.map((v) => (
                <div
                  key={v.examCode}
                  className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 shadow-xs flex flex-col justify-between gap-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-base text-indigo-900">
                      MÃ ĐỀ: {v.examCode}
                    </span>
                    <span className="text-[11px] font-medium text-slate-500">
                      {v.exam.questions.length} câu
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        onSelectVariant(v.exam);
                        onClose();
                      }}
                      className="grow px-2 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-center"
                    >
                      Mở mã này
                    </button>
                    <button
                      onClick={() => handleDownloadVariant(v)}
                      title="Tải file Word của mã này"
                      className="p-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bảng Ma Trận Đáp Án Tổng Hợp */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Bảng Ma Trận Đáp Án Tổng Hợp (Dùng Để Chấm Nhanh)
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-center text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700">
                    <th className="p-2.5 border-r border-slate-200 w-16">Câu</th>
                    {variants.map((v) => (
                      <th key={v.examCode} className="p-2.5 border-r border-slate-200 last:border-r-0">
                        Mã đề {v.examCode}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {matrix.map((row) => (
                    <tr key={row.questionNumber} className="hover:bg-slate-50">
                      <td className="p-2 border-r border-slate-200 font-bold text-slate-900 bg-slate-50/50">
                        Câu {row.questionNumber}
                      </td>
                      {variants.map((v) => (
                        <td
                          key={v.examCode}
                          className="p-2 border-r border-slate-200 last:border-r-0 font-extrabold text-indigo-700 text-sm"
                        >
                          {row.codes[v.examCode] || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
};
