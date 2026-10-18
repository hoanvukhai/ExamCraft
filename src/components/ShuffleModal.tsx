'use client';

import React, { useState } from 'react';
import { Exam, ShuffledExamVariant } from '@/types/exam';
import { generateShuffledExams, buildAnswerMatrix } from '@/lib/shuffler';
import { exportExamToDocx } from '@/lib/docx-export';
import { X, Shuffle, Download, Check, Copy } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1e1e1e] rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-[#dadce0] dark:border-[#3c4043] relative max-h-[90vh] flex flex-col text-[#202124] dark:text-[#e3e3e3] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#dadce0] dark:border-[#3c4043]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#e8f0fe] dark:bg-[#1e2a38] text-[#1a73e8] dark:text-[#8ab4f8] flex items-center justify-center border border-transparent dark:border-[#3c4043]">
              <Shuffle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-[#202124] dark:text-[#e3e3e3]">Trộn Đề Thi & Tạo Ma Trận Đáp Án</h3>
              <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">Hoán vị thứ tự câu hỏi và phương án A, B, C, D</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#5f6368] hover:text-[#202124] dark:text-[#9aa0a6] dark:hover:text-[#e3e3e3] rounded-full hover:bg-[#f1f3f4] dark:hover:bg-[#282828] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cấu hình trộn */}
        <div className="py-3.5 flex flex-wrap items-center justify-between gap-3 bg-[#f8f9fa] dark:bg-[#282828]/60 px-4 rounded-2xl my-4 border border-[#dadce0] dark:border-[#3c4043]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#3c4043] dark:text-[#e3e3e3]">Số lượng mã đề cần tạo:</span>
            <select
              value={numVariants}
              onChange={(e) => setNumVariants(Number(e.target.value))}
              className="text-xs font-semibold bg-white dark:bg-[#1e1e1e] border border-[#dadce0] dark:border-[#3c4043] text-[#202124] dark:text-[#e3e3e3] rounded-full px-3 py-1.5 focus:ring-2 focus:ring-[#1a73e8] dark:focus:ring-[#8ab4f8] outline-hidden cursor-pointer"
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
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#1a73e8] dark:text-[#8ab4f8] bg-[#e8f0fe] dark:bg-[#1e2a38] hover:bg-[#d2e3fc] dark:hover:bg-[#28384a] border border-blue-200 dark:border-[#3c4043] transition-colors cursor-pointer"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Trộn ngẫu nhiên lại</span>
            </button>

            <button
              onClick={handleCopyMatrix}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#3c4043] dark:text-[#e3e3e3] bg-white dark:bg-[#282828] border border-[#dadce0] dark:border-[#3c4043] hover:bg-[#f8f9fa] dark:hover:bg-[#303134] transition-colors cursor-pointer shadow-2xs"
            >
              {copiedMatrix ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedMatrix ? 'Đã sao chép!' : 'Sao chép ma trận đáp án'}</span>
            </button>
          </div>
        </div>

        {/* Danh sách các mã đề và bảng ma trận */}
        <div className="grow overflow-y-auto space-y-6 pr-1">
          {/* Danh sách mã đề có nút xem/tải */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#5f6368] dark:text-[#9aa0a6] mb-3">
              Danh Sách Các Mã Đề Đã Sinh ({variants.length} bản)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {variants.map((v) => (
                <div
                  key={v.examCode}
                  className="p-3.5 rounded-2xl border border-[#dadce0] dark:border-[#3c4043] bg-white dark:bg-[#282828]/50 hover:border-[#1a73e8] dark:hover:border-[#8ab4f8] shadow-xs flex flex-col justify-between gap-3 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-base text-[#1a73e8] dark:text-[#8ab4f8]">
                      MÃ ĐỀ: {v.examCode}
                    </span>
                    <span className="text-[11px] font-medium text-[#5f6368] dark:text-[#9aa0a6]">
                      {v.exam.questions.length} câu
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 pt-2 border-t border-[#dadce0] dark:border-[#3c4043]">
                    <button
                      onClick={() => {
                        onSelectVariant(v.exam);
                        onClose();
                      }}
                      className="grow px-3 py-1.5 text-xs font-medium text-[#3c4043] dark:text-[#e3e3e3] bg-[#f1f3f4] dark:bg-[#303134] hover:bg-[#e8eaed] dark:hover:bg-[#383a3d] rounded-full transition-colors text-center cursor-pointer"
                    >
                      Mở mã này
                    </button>
                    <button
                      onClick={() => handleDownloadVariant(v)}
                      title="Tải file Word của mã này"
                      className="p-1.5 text-[#1a73e8] dark:text-[#8ab4f8] bg-[#e8f0fe] dark:bg-[#1e2a38] hover:bg-[#d2e3fc] dark:hover:bg-[#28384a] rounded-full transition-colors cursor-pointer"
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
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#5f6368] dark:text-[#9aa0a6] mb-3">
              Bảng Ma Trận Đáp Án Tổng Hợp (Dùng Để Chấm Nhanh)
            </h4>
            <div className="border border-[#dadce0] dark:border-[#3c4043] rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-center text-xs">
                <thead>
                  <tr className="bg-[#f8f9fa] dark:bg-[#282828] border-b border-[#dadce0] dark:border-[#3c4043] font-bold text-[#3c4043] dark:text-[#e3e3e3]">
                    <th className="p-2.5 border-r border-[#dadce0] dark:border-[#3c4043] w-16">Câu</th>
                    {variants.map((v) => (
                      <th key={v.examCode} className="p-2.5 border-r border-[#dadce0] dark:border-[#3c4043] last:border-r-0">
                        Mã đề {v.examCode}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dadce0] dark:divide-[#3c4043]">
                  {matrix.map((row) => (
                    <tr key={row.questionNumber} className="hover:bg-[#f8f9fa] dark:hover:bg-[#282828]/50 transition-colors">
                      <td className="p-2 border-r border-[#dadce0] dark:border-[#3c4043] font-bold text-[#202124] dark:text-[#e3e3e3] bg-[#f8f9fa]/50 dark:bg-[#282828]/30">
                        Câu {row.questionNumber}
                      </td>
                      {variants.map((v) => (
                        <td
                          key={v.examCode}
                          className="p-2 border-r border-[#dadce0] dark:border-[#3c4043] last:border-r-0 font-extrabold text-[#1a73e8] dark:text-[#8ab4f8] text-sm"
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
        <div className="pt-4 border-t border-[#dadce0] dark:border-[#3c4043] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#3c4043] dark:text-[#e3e3e3] bg-[#f1f3f4] dark:bg-[#282828] hover:bg-[#e8eaed] dark:hover:bg-[#303134] border border-[#dadce0] dark:border-[#3c4043] rounded-full transition-colors cursor-pointer"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
};
