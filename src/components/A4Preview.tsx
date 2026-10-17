'use client';

import React, { useState } from 'react';
import { Exam, Figure } from '@/types/exam';
import { MathRenderer } from './MathRenderer';
import { VariationTable } from './VariationTable';
import { FunctionPlot } from './FunctionPlot';
import { exportExamToDocx } from '@/lib/docx-export';
import { 
  getDefaultPointsForQuestion, 
  formatPointsString, 
  calculateExamTotalPoints, 
  getExamScoreBreakdown 
} from '@/lib/scoring';
import { getSubjectConfig } from '@/lib/subject-config';
import { computeExamMatrix, computeExamSpecification } from '@/lib/matrix-spec-generator';
import { 
  Printer, 
  Download, 
  Eye, 
  FileText, 
  CheckSquare, 
  BookOpen, 
  ZoomIn, 
  ZoomOut,
  Maximize2,
  TableProperties
} from 'lucide-react';

const renderPreviewFigure = (fig: Figure) => {
  if (fig.kind === 'variation_table') {
    return <VariationTable key={fig.id} data={fig.data as any} />;
  }
  if (fig.kind === 'function_plot') {
    return <FunctionPlot key={fig.id} data={fig.data as any} />;
  }
  if (fig.kind === 'image') {
    const src = (fig.data as any)?.url || fig.renderedBase64 || (typeof fig.data === 'string' ? fig.data : '');
    if (src) {
      return (
        <div key={fig.id} className="my-1.5 text-center">
          <img
            src={src}
            alt={fig.caption || 'Hình vẽ đính kèm'}
            className="max-h-48 max-w-full rounded border border-slate-200 object-contain mx-auto"
          />
          {fig.caption && <div className="text-[9pt] text-slate-500 italic text-center mt-0.5">{fig.caption}</div>}
        </div>
      );
    }
  }
  return null;
};

interface A4PreviewProps {
  exam: Exam;
}

export const A4Preview: React.FC<A4PreviewProps> = ({ exam }) => {
  const [viewMode, setViewMode] = useState<'exam' | 'answers' | 'solutions' | 'matrix'>('exam');
  const [zoom, setZoom] = useState<number>(100);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const { metadata, questions, passages } = exam;
  const subjectConfig = getSubjectConfig(metadata.subject, metadata.grade);

  // Lọc câu hỏi theo từng phần
  const part1 = questions.filter(q => q.type === 'multiple_choice');
  const part2 = questions.filter(q => q.type === 'true_false_group');
  const part3 = questions.filter(q => q.type === 'short_answer');
  const part4 = questions.filter(q => !['multiple_choice', 'true_false_group', 'short_answer'].includes(q.type));

  // Xử lý xuất file Word
  const handleExportDocx = async () => {
    try {
      setIsExporting(true);
      const blob = await exportExamToDocx(exam, true);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${metadata.title.replace(/\s+/g, '_')}_${metadata.examCode || 'DeThi'}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Lỗi khi xuất Word:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const matrixData = computeExamMatrix(exam);
  const specData = computeExamSpecification(exam);

  const handlePrint = () => {
    window.print();
  };

  const totalPoints = calculateExamTotalPoints(exam);
  const scoreBreakdown = getExamScoreBreakdown(exam);

  return (
    <div className="a4-preview-container flex flex-col h-full bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Top Preview Toolbar */}
      <div className="no-print bg-white px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        {/* Chế độ xem */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('exam')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'exam'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Đề thi in ấn</span>
          </button>

          <button
            onClick={() => setViewMode('answers')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'answers'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Bảng đáp án & Barem</span>
          </button>

          <button
            onClick={() => setViewMode('solutions')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'solutions'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Hướng dẫn giải</span>
          </button>

          <button
            onClick={() => setViewMode('matrix')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'matrix'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TableProperties className="w-3.5 h-3.5" />
            <span>Ma trận & Đặc tả (CV 7991)</span>
          </button>
        </div>

        {/* Nút hành động */}
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="hidden sm:flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-1 rounded-lg text-xs">
            <button
              onClick={() => setZoom(Math.max(60, zoom - 10))}
              title="Thu nhỏ"
              className="p-1 hover:text-slate-900"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="w-10 text-center font-mono">{zoom}%</span>
            <button
              onClick={() => setZoom(Math.min(140, zoom + 10))}
              title="Phóng to"
              className="p-1 hover:text-slate-900"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(100)}
              title="Khôi phục chuẩn 100%"
              className="p-1 hover:text-slate-900"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>In / PDF</span>
          </button>

          <button
            onClick={handleExportDocx}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs hover:shadow transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Đang tạo .docx...' : 'Tải file Word (.docx)'}</span>
          </button>
        </div>
      </div>

      {/* Vùng cuộn hiển thị trang A4 */}
      <div className="a4-scroll-area grow overflow-auto p-4 sm:p-8 flex justify-center items-start">
        <div
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
          className="a4-paper w-[210mm] min-h-[297mm] bg-white text-black p-[18mm] shadow-xl border border-slate-300 font-serif leading-normal transition-transform duration-200"
        >
          {/* VIEW: ĐỀ THI */}
          {viewMode === 'exam' && (
            <div className="space-y-4 text-[13pt]">
              {/* Tiêu đề 2 cột chuẩn thi cử Việt Nam */}
              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-black">
                <div className="text-center font-bold">
                  <div className="uppercase text-[12pt]">{metadata.schoolName || 'SỞ GIÁO DỤC VÀ ĐÀO TẠO'}</div>
                  <div className="uppercase text-[12pt]">{metadata.departmentName || 'TRƯỜNG THPT CHUYÊN'}</div>
                  <div className="text-indigo-900 font-extrabold text-[13pt] mt-1">
                    MÃ ĐỀ THI: {metadata.examCode || '101'}
                  </div>
                </div>

                <div className="text-center">
                  <div className="uppercase font-bold text-[13pt]">{metadata.title || 'ĐỀ KIỂM TRA ĐỊNH KỲ'}</div>
                  <div className="font-semibold text-[12pt]">
                    MÔN: {subjectConfig.name.toUpperCase()} - KHỐI {metadata.grade}
                  </div>
                  <div className="italic text-[11pt]">
                    Thời gian làm bài: {metadata.durationMinutes} phút - <strong className="not-italic text-indigo-950 font-bold">Tổng {totalPoints} điểm</strong>
                  </div>
                </div>
              </div>

              {/* Thông tin học sinh */}
              <div className="text-[12pt] italic py-1 flex justify-between">
                <span>Họ và tên thí sinh: ........................................................................</span>
                <span>Lớp: ......... SBD: ..........</span>
              </div>

              {/* Ngữ liệu đọc hiểu chung nếu có */}
              {passages && passages.length > 0 && (
                <div className="space-y-3 pb-2">
                  {passages.map((p) => (
                    <div key={p.id} className="p-3 bg-slate-50 border border-slate-300 rounded-lg text-[11pt]">
                      <div className="font-bold text-slate-900 mb-1">{p.title || 'NGỮ LIỆU ĐỌC HIỂU:'}</div>
                      <div className="italic text-slate-800 leading-relaxed whitespace-pre-line">{p.content}</div>
                      {p.source && <div className="text-right text-[10pt] text-slate-500 mt-1">({p.source})</div>}
                    </div>
                  ))}
                </div>
              )}

              {/* Nội dung đề thi */}
              {/* PHẦN I */}
              {part1.length > 0 && (
                <div className="pt-2">
                  <div className="font-bold text-[12pt] pb-2">
                    PHẦN I. Thí sinh trả lời từ câu 1 đến câu {part1.length}. Mỗi câu hỏi thí sinh chỉ chọn một phương án.
                  </div>
                  <div className="space-y-3">
                    {part1.map((q, idx) => (
                      <div key={q.id} className="question-item text-[12pt]">
                        <div className="leading-relaxed">
                          <span className="font-bold">Câu {idx + 1} </span>
                          <span className="italic text-[11pt]">({formatPointsString(getDefaultPointsForQuestion(q, exam))}): </span>
                          <MathRenderer content={q.content} inline />
                        </div>

                        {/* Render Figure nếu có */}
                        {q.figures && q.figures.length > 0 && (
                          <div className="my-1.5 space-y-1">
                            {q.figures.map(renderPreviewFigure)}
                          </div>
                        )}

                        {q.choices && (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 pl-4">
                            {q.choices.map((c) => (
                              <div key={c.key} className="flex items-baseline gap-1">
                                <span className="font-bold">{c.key}.</span>
                                <MathRenderer content={c.text} inline />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PHẦN II */}
              {part2.length > 0 && (
                <div className="pt-3">
                  <div className="font-bold text-[12pt] pb-2">
                    PHẦN II. Câu hỏi trắc nghiệm Đúng/Sai. Thí sinh trả lời từ câu {part1.length + 1} đến câu {part1.length + part2.length}. (Đúng 1 ý được 0,1đ; đúng 2 ý được 0,25đ; đúng 3 ý được 0,5đ; đúng 4 ý được 1,0đ)
                  </div>
                  <div className="space-y-3">
                    {part2.map((q, idx) => (
                      <div key={q.id} className="question-item text-[12pt]">
                        <div className="leading-relaxed">
                          <span className="font-bold">Câu {part1.length + idx + 1} </span>
                          <span className="italic text-[11pt]">({formatPointsString(getDefaultPointsForQuestion(q, exam))}): </span>
                          <MathRenderer content={q.content} inline />
                        </div>

                        {/* Render Figure nếu có */}
                        {q.figures && q.figures.length > 0 && (
                          <div className="my-1.5 space-y-1">
                            {q.figures.map(renderPreviewFigure)}
                          </div>
                        )}

                        {q.sub_questions && (
                          <div className="pl-6 space-y-1 pt-1">
                            {q.sub_questions.map((sub) => (
                              <div key={sub.key} className="flex items-baseline gap-2">
                                <span className="font-bold">{sub.key})</span>
                                <MathRenderer content={sub.content} inline />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PHẦN III */}
              {part3.length > 0 && (
                <div className="pt-3">
                  <div className="font-bold text-[12pt] pb-2">
                    PHẦN III. Câu trắc nghiệm trả lời ngắn. Thí sinh trả lời từ câu {part1.length + part2.length + 1} đến câu {part1.length + part2.length + part3.length}.
                  </div>
                  <div className="space-y-3">
                    {part3.map((q, idx) => (
                      <div key={q.id} className="question-item text-[12pt]">
                        <div className="leading-relaxed">
                          <span className="font-bold">Câu {part1.length + part2.length + idx + 1} </span>
                          <span className="italic text-[11pt]">({formatPointsString(getDefaultPointsForQuestion(q, exam))}): </span>
                          <MathRenderer content={q.content} inline />
                        </div>

                        {/* Render Figure nếu có */}
                        {q.figures && q.figures.length > 0 && (
                          <div className="my-1.5 space-y-1">
                            {q.figures.map(renderPreviewFigure)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PHẦN IV: TỰ LUẬN / PHẦN MỞ RỘNG */}
              {part4.length > 0 && (
                <div className="pt-3">
                  <div className="font-bold text-[12pt] pb-2">
                    PHẦN IV. TỰ LUẬN / PHẦN MỞ RỘNG (Trình bày chi tiết lời giải)
                  </div>
                  <div className="space-y-3">
                    {part4.map((q, idx) => (
                      <div key={q.id} className="question-item text-[12pt]">
                        <div className="leading-relaxed">
                          <span className="font-bold">Câu {part1.length + part2.length + part3.length + idx + 1}: </span>
                          <MathRenderer content={q.content} inline />
                        </div>

                        {/* Render Figure nếu có */}
                        {q.figures && q.figures.length > 0 && (
                          <div className="my-1.5 space-y-1">
                            {q.figures.map(renderPreviewFigure)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Chân trang đề thi */}
              <div className="text-center text-[12pt] font-bold pt-8 border-t border-black mt-8">
                ---------- HẾT ----------
              </div>
            </div>
          )}

          {/* VIEW: BẢNG ĐÁP ÁN & BAREM */}
          {viewMode === 'answers' && (
            <div className="space-y-6 text-[12pt]">
              <div className="text-center border-b border-black pb-3">
                <h2 className="text-[14pt] font-bold uppercase">BẢNG ĐÁP ÁN VÀ THANG ĐIỂM CHUẨN</h2>
                <p className="italic text-[11pt]">Đề kiểm tra: {metadata.title} - Mã đề: {metadata.examCode || '101'}</p>
                <p className="font-semibold text-indigo-900 mt-1">Tổng điểm toàn bài: {totalPoints} điểm</p>
              </div>

              {/* Ma trận thống kê điểm */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 mb-2">Cơ cấu phân bổ điểm số:</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">Phần I (Nhiều lựa chọn):</span>
                    <strong className="text-sm text-indigo-600">{scoreBreakdown.part1Count} câu ({scoreBreakdown.part1Points}đ)</strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">Phần II (Đúng/Sai):</span>
                    <strong className="text-sm text-indigo-600">{scoreBreakdown.part2Count} câu ({scoreBreakdown.part2Points}đ)</strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">Phần III (Trả lời ngắn):</span>
                    <strong className="text-sm text-indigo-600">{scoreBreakdown.part3Count} câu ({scoreBreakdown.part3Points}đ)</strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block">Tự luận / Khác:</span>
                    <strong className="text-sm text-indigo-600">{scoreBreakdown.part4Count} câu ({scoreBreakdown.part4Points}đ)</strong>
                  </div>
                </div>
              </div>

              {/* Bảng đáp án Phần I */}
              {part1.length > 0 && (
                <div>
                  <h3 className="font-bold text-[12pt] mb-2 text-indigo-900">PHẦN I: ĐÁP ÁN TRẮC NGHIỆM 4 LỰA CHỌN</h3>
                  <table className="w-full border-collapse border border-black text-center text-[11pt]">
                    <thead>
                      <tr className="bg-slate-100 font-bold">
                        <th className="border border-black p-1">Câu</th>
                        {part1.map((_, i) => (
                          <th key={i} className="border border-black p-1">{i + 1}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-black p-1 font-bold bg-slate-50">Chọn</td>
                        {part1.map((q, i) => (
                          <td key={i} className="border border-black p-1 font-bold text-indigo-700">
                            {q.correct_answer || 'A'}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Bảng đáp án Phần II */}
              {part2.length > 0 && (
                <div>
                  <h3 className="font-bold text-[12pt] mb-2 text-indigo-900">PHẦN II: ĐÁP ÁN ĐÚNG / SAI</h3>
                  <table className="w-full border-collapse border border-black text-center text-[11pt]">
                    <thead>
                      <tr className="bg-slate-100 font-bold">
                        <th className="border border-black p-1">Câu</th>
                        <th className="border border-black p-1">Lệnh hỏi a)</th>
                        <th className="border border-black p-1">Lệnh hỏi b)</th>
                        <th className="border border-black p-1">Lệnh hỏi c)</th>
                        <th className="border border-black p-1">Lệnh hỏi d)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {part2.map((q, i) => (
                        <tr key={q.id}>
                          <td className="border border-black p-1 font-bold bg-slate-50">Câu {part1.length + i + 1}</td>
                          {['a', 'b', 'c', 'd'].map(key => {
                            const sub = q.sub_questions?.find(s => s.key === key);
                            return (
                              <td key={key} className="border border-black p-1 font-semibold">
                                {sub ? (sub.isCorrect ? <span className="text-emerald-700 font-bold">Đ</span> : <span className="text-red-700 font-bold">S</span>) : '-'}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Bảng đáp án Phần III */}
              {part3.length > 0 && (
                <div>
                  <h3 className="font-bold text-[12pt] mb-2 text-indigo-900">PHẦN III: ĐÁP SỐ TRẢ LỜI NGẮN</h3>
                  <table className="w-full border-collapse border border-black text-center text-[11pt]">
                    <thead>
                      <tr className="bg-slate-100 font-bold">
                        <th className="border border-black p-1">Câu</th>
                        {part3.map((_, i) => (
                          <th key={i} className="border border-black p-1">{part1.length + part2.length + i + 1}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-black p-1 font-bold bg-slate-50">Đáp số</td>
                        {part3.map((q, i) => (
                          <td key={i} className="border border-black p-1 font-bold text-indigo-700">
                            {q.correct_answer || '-'}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Bảng đáp án & Barem Phần IV (Tự luận / Câu hỏi mở) */}
              {part4.length > 0 && (
                <div>
                  <h3 className="font-bold text-[12pt] mb-2 text-indigo-900">PHẦN IV: BAREM CHẤM ĐIỂM TỰ LUẬN / PHẦN KHÁC</h3>
                  <div className="space-y-4">
                    {part4.map((q, idx) => (
                      <div key={q.id} className="border border-black p-3 rounded-lg bg-slate-50/50">
                        <div className="font-bold text-[11pt] mb-1">
                          Câu {part1.length + part2.length + part3.length + idx + 1} ({formatPointsString(getDefaultPointsForQuestion(q, exam))}):
                        </div>
                        {q.rubric && q.rubric.length > 0 ? (
                          <table className="w-full border-collapse border border-black text-left text-[10pt] bg-white mt-1">
                            <thead>
                              <tr className="bg-slate-100 font-bold">
                                <th className="border border-black p-1.5">Tiêu chí chấm điểm / Yêu cầu cần đạt</th>
                                <th className="border border-black p-1.5 text-center w-24">Điểm tối đa</th>
                              </tr>
                            </thead>
                            <tbody>
                              {q.rubric.map((r, rIdx) => (
                                <tr key={rIdx}>
                                  <td className="border border-black p-1.5">{r.criterion}</td>
                                  <td className="border border-black p-1.5 text-center font-bold">{r.maxPoints}đ</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div className="text-[11pt] text-slate-800">
                            {q.correct_answer ? <span>Đáp án: <strong>{q.correct_answer}</strong></span> : <span>Chấm theo nội dung yêu cầu bài làm.</span>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW: HƯỚNG DẪN GIẢI CHI TIẾT */}
          {viewMode === 'solutions' && (
            <div className="space-y-6 text-[12pt]">
              <div className="page-break text-center border-b border-black pb-3">
                <h2 className="text-[14pt] font-bold uppercase">HƯỚNG DẪN GIẢI CHI TIẾT TỪNG BƯỚC</h2>
                <p className="italic text-[11pt]">Đề kiểm tra: {metadata.title} - Mã đề: {metadata.examCode || '101'}</p>
              </div>

              <div className="space-y-6">
                {questions.map((q, idx) => (
                  <div key={q.id} className="question-item pb-4 border-b border-slate-200 last:border-b-0">
                    <div className="font-bold text-[12pt] text-slate-900">
                      Câu {idx + 1}: {' '}
                      {q.type === 'multiple_choice' && (
                        <span className="text-emerald-700">Đáp án đúng là {q.correct_answer || 'A'}</span>
                      )}
                      {q.type === 'true_false_group' && (
                        <span className="text-emerald-700">
                          Đáp án: {q.sub_questions?.map(sq => `${sq.key}) ${sq.isCorrect ? 'Đúng' : 'Sai'}`).join('   ') || q.correct_answer}
                        </span>
                      )}
                      {q.type === 'short_answer' && (
                        <span className="text-emerald-700">Đáp số: {q.correct_answer}</span>
                      )}
                    </div>
                    {q.type === 'true_false_group' && q.sub_questions && (
                      <div className="pl-4 space-y-1 my-2 text-[11pt]">
                        {q.sub_questions.map(sq => (
                          <div key={sq.key} className="text-slate-700">
                            <strong>Ý {sq.key}) ({sq.isCorrect ? 'Đúng' : 'Sai'}):</strong>{' '}
                            <MathRenderer content={sq.explanation || sq.content} inline />
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="text-[12pt] text-slate-800 leading-relaxed pl-4">
                      <MathRenderer content={q.step_by_step_solution} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW: MA TRẬN & BẢN ĐẶC TẢ THEO CV 7991 */}
          {viewMode === 'matrix' && (
            <div className="space-y-8 text-[11pt]">
              {/* Tiêu đề Ma trận */}
              <div className="text-center border-b border-black pb-3">
                <h2 className="text-[13pt] font-bold uppercase">
                  KHUNG MA TRẬN ĐỀ KIỂM TRA ĐỊNH KỲ (THEO CÔNG VĂN 7991/BGDĐT)
                </h2>
                <p className="italic text-[10pt]">
                  Môn: {subjectConfig.name} - Khối: {metadata.grade} - Thời gian: {metadata.durationMinutes} phút
                </p>
              </div>

              {/* Bảng Ma trận */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-black text-center text-[10pt]">
                  <thead>
                    <tr className="bg-slate-100 font-bold">
                      <th rowSpan={2} className="border border-black p-2 w-10">TT</th>
                      <th rowSpan={2} className="border border-black p-2 text-left">Chủ đề / Mạch kiến thức</th>
                      <th colSpan={4} className="border border-black p-1">Mức độ nhận thức (Số câu)</th>
                      <th rowSpan={2} className="border border-black p-2 w-16">Tổng câu</th>
                      <th rowSpan={2} className="border border-black p-2 w-16">Điểm số</th>
                      <th rowSpan={2} className="border border-black p-2 w-16">Tỉ lệ %</th>
                    </tr>
                    <tr className="bg-slate-50 font-semibold text-[9pt]">
                      <th className="border border-black p-1">Nhận biết</th>
                      <th className="border border-black p-1">Thông hiểu</th>
                      <th className="border border-black p-1">Vận dụng</th>
                      <th className="border border-black p-1">Vận dụng cao</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matrixData.rows.map((row) => (
                      <tr key={row.index} className="hover:bg-slate-50/50">
                        <td className="border border-black p-1.5 font-bold">{row.index}</td>
                        <td className="border border-black p-1.5 text-left font-medium">{row.topicName}</td>
                        <td className="border border-black p-1.5">
                          {row.nbCount.part1 + row.nbCount.part2 + row.nbCount.part3 > 0
                            ? `${row.nbCount.part1 + row.nbCount.part2 + row.nbCount.part3} câu`
                            : '-'}
                        </td>
                        <td className="border border-black p-1.5">
                          {row.thCount.part1 + row.thCount.part2 + row.thCount.part3 > 0
                            ? `${row.thCount.part1 + row.thCount.part2 + row.thCount.part3} câu`
                            : '-'}
                        </td>
                        <td className="border border-black p-1.5">
                          {row.vdCount.part1 + row.vdCount.part2 + row.vdCount.part3 > 0
                            ? `${row.vdCount.part1 + row.vdCount.part2 + row.vdCount.part3} câu`
                            : '-'}
                        </td>
                        <td className="border border-black p-1.5">
                          {row.vdcCount.part1 + row.vdcCount.part2 + row.vdcCount.part3 > 0
                            ? `${row.vdcCount.part1 + row.vdcCount.part2 + row.vdcCount.part3} câu`
                            : '-'}
                        </td>
                        <td className="border border-black p-1.5 font-bold">{row.totalQuestions}</td>
                        <td className="border border-black p-1.5 font-bold text-indigo-700">{row.totalPoints.toFixed(1)}</td>
                        <td className="border border-black p-1.5 font-bold">{row.percentage}%</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100 font-bold border-t-2 border-black">
                      <td colSpan={2} className="border border-black p-2 text-center">TỔNG CỘNG</td>
                      <td className="border border-black p-2">{matrixData.totalNbPoints}đ</td>
                      <td className="border border-black p-2">{matrixData.totalThPoints}đ</td>
                      <td className="border border-black p-2">{matrixData.totalVdPoints}đ</td>
                      <td className="border border-black p-2">{matrixData.totalVdcPoints}đ</td>
                      <td className="border border-black p-2 text-indigo-900">{matrixData.totalQuestions}</td>
                      <td className="border border-black p-2 text-indigo-700">{matrixData.totalExamPoints.toFixed(1)}đ</td>
                      <td className="border border-black p-2">100%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Bản đặc tả chi tiết */}
              <div className="pt-4 border-t border-black">
                <div className="text-center pb-3">
                  <h3 className="text-[12pt] font-bold uppercase">
                    BẢN ĐẶC TẢ ĐỀ KIỂM TRA ĐỊNH KỲ
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-black text-[10pt]">
                    <thead>
                      <tr className="bg-slate-100 font-bold text-center">
                        <th className="border border-black p-2 w-10">TT</th>
                        <th className="border border-black p-2 text-left w-36">Chủ đề</th>
                        <th className="border border-black p-2 text-left">Yêu cầu cần đạt</th>
                        <th className="border border-black p-1 w-20">Nhận biết</th>
                        <th className="border border-black p-1 w-20">Thông hiểu</th>
                        <th className="border border-black p-1 w-20">Vận dụng</th>
                        <th className="border border-black p-1 w-20">Vận dụng cao</th>
                      </tr>
                    </thead>
                    <tbody>
                      {specData.map((spec) => (
                        <tr key={spec.index} className="align-top">
                          <td className="border border-black p-1.5 text-center font-bold">{spec.index}</td>
                          <td className="border border-black p-1.5 font-bold text-slate-900">{spec.topicName}</td>
                          <td className="border border-black p-1.5 text-slate-700 text-[9.5pt] leading-relaxed">
                            {spec.requirement}
                          </td>
                          <td className="border border-black p-1.5 text-center font-mono font-bold text-emerald-700">
                            {spec.nbQuestions.length > 0 ? spec.nbQuestions.map(n => `C${n}`).join(', ') : '-'}
                          </td>
                          <td className="border border-black p-1.5 text-center font-mono font-bold text-blue-700">
                            {spec.thQuestions.length > 0 ? spec.thQuestions.map(n => `C${n}`).join(', ') : '-'}
                          </td>
                          <td className="border border-black p-1.5 text-center font-mono font-bold text-amber-700">
                            {spec.vdQuestions.length > 0 ? spec.vdQuestions.map(n => `C${n}`).join(', ') : '-'}
                          </td>
                          <td className="border border-black p-1.5 text-center font-mono font-bold text-purple-700">
                            {spec.vdcQuestions.length > 0 ? spec.vdcQuestions.map(n => `C${n}`).join(', ') : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
