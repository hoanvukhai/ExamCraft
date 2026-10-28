'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Exam, Figure } from '@/types/exam';
import { MathRenderer } from './MathRenderer';
import { FigureView } from './FigureView';

import { parallelAnswer, parallelRows } from '@/lib/parallel-view';

import { formatPointsString, calculateExamTotalPoints } from '@/lib/scoring';
import { getSubjectConfig } from '@/lib/subject-config';
import { requiresNumericScore } from '@/lib/education-catalog';
import { matchingDisplay, orderingDisplay } from '@/lib/structured-question';
import { computeExamMatrix, computeExamSpecification } from '@/lib/matrix-spec-generator';
import { examPlanOutput } from '@/lib/exam-plan-output';
import { resolveHeaderLines } from '@/lib/header-layout';


const renderPreviewFigure = (figure: Figure) => <FigureView key={figure.id} figure={figure} forceLight />;

function renderStructuredPrompt(question: Exam['questions'][number]) {
  const matching = matchingDisplay(question);
  if (matching) return <div className="grid grid-cols-2 gap-4 border border-black p-3 my-2 text-[11pt]"><div><strong>Cột A</strong>{matching.left.map((item, i) => <p key={item.key}>{i + 1}. <MathRenderer content={item.text} inline /></p>)}</div><div><strong>Cột B</strong>{matching.right.map((item, i) => <p key={item.key}>{i + 1}. <MathRenderer content={item.text} inline /></p>)}</div></div>;
  const ordering = orderingDisplay(question);
  if (ordering) return <div className="border border-black p-3 my-2 text-[11pt]">{ordering.items.map((item, i) => <p key={item.key}>{i + 1}. <MathRenderer content={item.text} inline /></p>)}<p className="mt-2">Thứ tự em chọn: ........................................</p></div>;
  return null;
}

interface A4PreviewProps {
  exam: Exam;
}

export const A4Preview: React.FC<A4PreviewProps> = ({ exam }) => {
  const [viewMode, setViewMode] = useState<'exam' | 'parallel' | 'answers' | 'solutions' | 'matrix'>('exam');
  // null follows the available width; explicit percentages are actual paper zoom.
  const [zoom, setZoom] = useState<number | null>(null);
  const scrollArea = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(1);
  const effectiveZoom = zoom ?? Math.round(fitScale * 100);
  useEffect(() => {
    const area = scrollArea.current;
    if (!area) return;
    const observer = new ResizeObserver(entries => {
      const width = entries[0]?.contentRect.width ?? 794;
      setFitScale(Math.min(1, Math.max(0.2, (width - 8) / 794)));
    });
    observer.observe(area); return () => observer.disconnect();
  }, []);

  const { metadata, questions, passages } = exam;
  const subjectConfig = getSubjectConfig(metadata.subject, metadata.grade);

  const matrixData = computeExamMatrix(exam);
  const specData = computeExamSpecification(exam);
  const planOutput = examPlanOutput(exam);
  const headerLines = resolveHeaderLines(exam);
  const headerAreas = (['left', 'right'] as const).filter(area => headerLines.some(line => line.area === area));

  const totalPoints = calculateExamTotalPoints(exam);
  const numericScore = requiresNumericScore(metadata.assessmentMode);


  return (
    <div className="a4-preview-container flex flex-col h-full min-h-[32rem] bg-[var(--ui-surface-variant)] rounded-2xl border border-[var(--ui-border)] overflow-hidden shadow-xs">
      <div className="no-print shrink-0 border-b p-2 space-y-2 bg-[var(--ui-surface)]">
        <nav aria-label="Các bản xem trước" className="flex flex-nowrap overflow-x-auto gap-1">{([{ key: 'exam', name: 'Đề' }, { key: 'answers', name: 'Đáp án' }, { key: 'solutions', name: 'Lời giải' }, { key: 'matrix', name: 'Ma trận' }] as const).map(tab => <button type="button" key={tab.key} aria-label={tab.name} aria-pressed={viewMode === tab.key || tab.key === 'exam' && viewMode === 'parallel'} onClick={() => setViewMode(tab.key)} className={(viewMode === tab.key || tab.key === 'exam' && viewMode === 'parallel' ? 'app-button-tonal' : 'app-button-secondary') + ' shrink-0 min-h-9 px-3 text-xs'}>{tab.name}</button>)}</nav>
        <div className="flex items-center gap-2 text-xs flex-wrap">{(viewMode === 'exam' || viewMode === 'parallel') && <label className="inline-flex gap-1 items-center"><input type="checkbox" aria-label="Bố cục song song" checked={viewMode === 'parallel'} onChange={e => setViewMode(e.target.checked ? 'parallel' : 'exam')} />Song song</label>}<div className="ml-auto flex items-center gap-1"><button type="button" aria-label="Thu nhỏ" title="Thu nhỏ" className="app-button-secondary min-w-9 min-h-9" disabled={effectiveZoom <= 25} onClick={() => setZoom(Math.max(25, effectiveZoom - 10))}>−</button><span className="min-w-10 text-center" aria-live="polite">{effectiveZoom}%</span><button type="button" aria-label="Phóng to" title="Phóng to" className="app-button-secondary min-w-9 min-h-9" disabled={effectiveZoom >= 200} onClick={() => setZoom(Math.min(200, effectiveZoom + 10))}>+</button><select className="teacher-field max-w-28 text-xs" aria-label="Kiểu thu phóng" value={zoom === null ? 'fit' : zoom === 100 ? '100' : 'custom'} onChange={e => { if (e.target.value !== 'custom') setZoom(e.target.value === 'fit' ? null : 100); }}><option value="fit">Vừa khung</option><option value="100">100%</option>{zoom !== null && zoom !== 100 && <option value="custom">{zoom}%</option>}</select></div></div>
      </div>
      {/* Vùng cuộn hiển thị trang A4 */}
      <div ref={scrollArea} className="a4-scroll-area grow min-h-0 overflow-auto p-4 sm:p-8">
        <div
          style={{ zoom: effectiveZoom / 100 }}
          className="a4-paper mx-auto w-[210mm] min-h-[297mm] bg-white text-black p-[18mm] shadow-xs border border-[#dadce0] font-serif leading-normal"
        >
          {/* VIEW: ĐỀ THI */}
          {viewMode === 'exam' && (
            <div className="space-y-4 text-[13pt]">
              {headerAreas.length > 0 && <div className={`grid ${headerAreas.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-4 pb-3 border-b border-black`}>{headerAreas.map(area => <div key={area}>{headerLines.filter(line => line.area === area).map(line => <div key={line.id} data-header-line={line.id} className={`text-[12pt] whitespace-pre-wrap break-words ${line.bold ? 'font-bold' : ''} ${line.italic ? 'italic' : ''}`} style={{ textAlign: line.align, minHeight: '1.2em' }}>{line.text}</div>)}</div>)}</div>}

              {/* Thông tin học sinh */}
              <div className="text-[12pt] italic py-1 flex justify-between">
                <span>Họ và tên thí sinh: ........................................................................</span>
                <span>Lớp: ......... SBD: ..........</span>
              </div>

              {/* Ngữ liệu đọc hiểu chung nếu có */}
              {passages && passages.length > 0 && (
                <div className="space-y-3 pb-2">
                  {passages.map((p) => (
                    <div key={p.id} className="p-3 bg-[#f8f9fa] border border-[#dadce0] rounded-lg text-[11pt]">
                      <div className="font-bold text-black mb-1">{p.title || 'NGỮ LIỆU ĐỌC HIỂU:'}</div>
                      <div className="italic text-[#202124] leading-relaxed whitespace-pre-line">{p.content}</div>
                      {p.figures?.map(renderPreviewFigure)}
                      {p.source && <div className="text-right text-[10pt] text-[#5f6368] mt-1">({p.source})</div>}
                    </div>
                  ))}
                </div>
              )}

              {/* Nội dung đề thi */}
              {questions.length === 0 ? (
                <div className="py-24 text-center text-[#5f6368] italic text-[11pt]">
                  (Đề thi hiện chưa có câu hỏi nào. Hãy bấm &quot;Thêm câu hỏi&quot; hoặc &quot;Sinh đề AI Mới&quot; ở bảng bên trái để bắt đầu soạn đề.)
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {questions.map((q, index) => <div key={q.id} className="question-item text-[12pt]">
                      {q.sectionId && questions[index - 1]?.sectionId !== q.sectionId && <h3 className="font-bold my-3">{exam.sections?.find(s => s.id === q.sectionId)?.title ?? exam.sections?.find(s => s.id === q.sectionId)?.label ?? exam.sections?.find(s => s.id === q.sectionId)?.name}</h3>}
                      <p className="leading-relaxed"><b>Câu {index + 1}:</b> {numericScore && q.points !== undefined && <span className="italic">({formatPointsString(q.points)}) </span>}<MathRenderer content={q.content} inline /></p>
                      {q.passageId && <p className="italic text-[10pt]">Theo ngữ liệu: {passages?.find(p => p.id === q.passageId)?.title ?? q.passageId}</p>}
                      {q.choices && q.type === 'multiple_choice' && <div className="grid grid-cols-2 gap-3 pl-4 py-2">{q.choices.map(choice => <p key={choice.key}><b>{choice.key}.</b> <MathRenderer content={choice.text} inline /></p>)}</div>}
                      {q.sub_questions && q.type === 'true_false_group' && <div className="pl-4 space-y-1">{q.sub_questions.map(sub => <p key={sub.key}><b>{sub.key})</b> <MathRenderer content={sub.content} inline /> <span className="whitespace-nowrap">□ Đúng □ Sai</span></p>)}</div>}
                      {renderStructuredPrompt(q)}
                      {q.figures?.map(renderPreviewFigure)}
                      {['short_answer', 'fill_blank'].includes(q.type) && <p className="mt-2">Trả lời: ................................................................................</p>}
                    </div>)}
                  </div>

                  {headerLines.filter(line => line.area === 'footer').map(line => <div key={line.id} data-header-line={line.id} className={`text-[11pt] whitespace-pre-wrap break-words ${line.bold ? 'font-bold' : ''} ${line.italic ? 'italic' : ''}`} style={{ textAlign: line.align, minHeight: '1.2em' }}>{line.text}</div>)}
                  {/* Chân trang đề thi */}
                  <div className="text-center text-[12pt] font-bold pt-8 border-t border-black mt-8">
                    ---------- HẾT ----------
                  </div>
                </>
              )}
            </div>
          )}

          {viewMode === 'exam' && questions.length === 0 && headerLines.filter(line => line.area === 'footer').map(line => <div key={line.id} data-header-line={line.id} className={`text-[11pt] whitespace-pre-wrap break-words ${line.bold ? 'font-bold' : ''} ${line.italic ? 'italic' : ''}`} style={{ textAlign: line.align, minHeight: '1.2em' }}>{line.text}</div>)}
          {/* VIEW: SONG SONG — đề bên trái, đáp án và lời giải bên phải; chỉ để xem/in, không đổi dữ liệu */}
          {viewMode === 'parallel' && (
            <div className="space-y-4 text-[12pt]">
              <h2 className="font-bold text-center text-[14pt]">ĐỀ VÀ ĐÁP ÁN SONG SONG</h2>
              <p className="text-center">{metadata.title}{metadata.examCode ? ' — Mã đề: ' + metadata.examCode : ''}</p>
              <p className="text-center italic text-[10pt]">Bản này chứa đáp án: chỉ dùng cho giáo viên, không phát cho học sinh.</p>
              {questions.length === 0 ? (
                <div className="py-16 text-center text-[#5f6368] italic text-[11pt]">(Chưa có câu hỏi nào.)</div>
              ) : metadata.assessmentMode === 'survey' ? (
                <div className="py-8 text-center italic text-[11pt]">Phiếu khảo sát không có đáp án đúng; hãy xem ở chế độ Đề thi in ấn.</div>
              ) : (
                <div className="border border-black">
                  <div className="grid grid-cols-2 border-b border-black font-bold text-center text-[11pt]"><div className="p-2 border-r border-black">ĐỀ</div><div className="p-2">ĐÁP ÁN VÀ HƯỚNG DẪN</div></div>
                  {parallelRows(questions, passages).map(row => {
                    if (row.kind === 'passage') return <div key={'passage-' + row.passage.id} data-parallel-passage={row.passage.id} className="parallel-passage border-b border-black p-2 text-[11pt] break-inside-avoid">
                      <div className="font-bold mb-1">{row.passage.title || 'NGỮ LIỆU ĐỌC HIỂU:'}</div>
                      <div className="italic leading-relaxed whitespace-pre-line">{row.passage.content}</div>
                      {row.passage.figures?.map(renderPreviewFigure)}
                      {row.passage.source && <div className="text-right text-[10pt] mt-1">({row.passage.source})</div>}
                    </div>;
                    const { question: q, index } = row;
                    const answer = parallelAnswer(q);
                    return <div key={q.id} className="question-item grid grid-cols-2 border-b border-black last:border-b-0 break-inside-avoid">
                      <div className="p-2 border-r border-black text-[11pt]">
                        <p className="leading-relaxed"><b>Câu {index + 1}:</b> {numericScore && q.points !== undefined && <span className="italic">({formatPointsString(q.points)}) </span>}<MathRenderer content={q.content} /></p>
                        {q.choices && q.type === 'multiple_choice' && <div className="pl-3 py-1">{q.choices.map(choice => <p key={choice.key}><b>{choice.key}.</b> <MathRenderer content={choice.text} inline /></p>)}</div>}
                        {q.sub_questions && q.type === 'true_false_group' && <div className="pl-3 space-y-1">{q.sub_questions.map(sub => <p key={sub.key}><b>{sub.key})</b> <MathRenderer content={sub.content} inline /></p>)}</div>}
                        {renderStructuredPrompt(q)}
                        {q.figures?.map(renderPreviewFigure)}
                      </div>
                      <div className="p-2 text-[11pt]">
                        <p className="font-bold text-emerald-800">{answer.headline}</p>
                        {answer.details.map((line, i) => <p key={i} className="text-[10pt]">{line}</p>)}
                        {answer.solution && <div className="mt-1 text-[10.5pt] leading-relaxed"><MathRenderer content={answer.solution} /></div>}
                      </div>
                    </div>;
                  })}
                </div>
              )}
            </div>
          )}

          {viewMode === 'answers' && <div className="space-y-5 text-[12pt]">
            <h2 className="font-bold text-center text-[14pt]">{metadata.assessmentMode === 'survey' ? 'PHIẾU KHẢO SÁT — KHÔNG CHẤM ĐÚNG SAI' : 'ĐÁP ÁN VÀ TIÊU CHÍ ĐÁNH GIÁ'}</h2>
            <p className="text-center">{metadata.title}{metadata.examCode ? ' — Mã đề: ' + metadata.examCode : ''}</p>
            <p>{numericScore ? 'Tổng điểm đã cấu hình: ' + totalPoints : 'Không tính điểm'}</p>
            {metadata.assessmentMode !== 'survey' && questions.map((q, index) => <section key={q.id} className="question-item border-b pb-3">
              <p><b>Câu {index + 1}:</b> {q.type === 'true_false_group' ? q.sub_questions?.map(sub => sub.key + ') ' + (sub.isCorrect === undefined ? 'Chưa có đáp án' : sub.isCorrect ? 'Đúng' : 'Sai')).join('; ') : q.type === 'matching' ? q.matchingPairs?.map(pair => pair.left + ' → ' + pair.right).join('; ') || q.correct_answer || 'Chưa thiết lập cặp đúng' : q.type === 'ordering' ? q.correctOrder?.join(' → ') || q.correct_answer || 'Chưa thiết lập thứ tự đúng' : q.correct_answer || (q.type === 'essay' ? 'Giáo viên đánh giá theo tiêu chí' : 'Chưa đặt đáp án')}</p>
              {q.accepted_answers?.filter(Boolean).length ? <p>Chấp nhận: {q.accepted_answers.filter(Boolean).join('; ')}</p> : null}
              {q.rubric?.map((row, i) => <p key={i}>• {row.criterion}{numericScore ? ': ' + row.maxPoints + ' điểm' : ''}</p>)}
            </section>)}
          </div>}

          {/* VIEW: HƯỚNG DẪN GIẢI CHI TIẾT */}
          {viewMode === 'solutions' && (
            <div className="space-y-6 text-[12pt]">
              <div className="page-break text-center border-b border-black pb-3">
                <h2 className="text-[14pt] font-bold uppercase">HƯỚNG DẪN GIẢI CHI TIẾT TỪNG BƯỚC</h2>
                <p className="italic text-[11pt]">Đề kiểm tra: {metadata.title} - Mã đề: {metadata.examCode || ''}</p>
              </div>

              {questions.length === 0 ? (
                <div className="py-16 text-center text-[#5f6368] italic text-[11pt]">
                  (Chưa có câu hỏi nào để hiển thị lời giải chi tiết.)
                </div>
              ) : (
                <div className="space-y-6">
                  {questions.map((q, idx) => (
                    <div key={q.id} className="question-item pb-4 border-b border-[#dadce0] last:border-b-0">
                      <div className="font-bold text-[12pt] text-[#202124]">
                        Câu {idx + 1}: {' '}
                        {q.type === 'multiple_choice' && (
                          <span className="text-emerald-700">Đáp án đúng là {q.correct_answer ?? 'Chưa có đáp án'}</span>
                        )}
                        {q.type === 'true_false_group' && (
                          <span className="text-emerald-700">
                            Đáp án: {q.sub_questions?.map(sq => `${sq.key}) ${typeof sq.isCorrect === 'boolean' ? (sq.isCorrect ? 'Đúng' : 'Sai') : 'Chưa có đáp án'}`).join('   ') || q.correct_answer}
                          </span>
                        )}
                        {q.type === 'short_answer' && (
                          <span className="text-emerald-700">Đáp số: {q.correct_answer}</span>
                        )}
                      </div>
                      {q.type === 'true_false_group' && q.sub_questions && (
                        <div className="pl-4 space-y-1 my-2 text-[11pt]">
                          {q.sub_questions.map(sq => (
                            <div key={sq.key} className="text-[#202124]">
                              <strong>Ý {sq.key}) ({typeof sq.isCorrect === 'boolean' ? (sq.isCorrect ? 'Đúng' : 'Sai') : 'Chưa có đáp án'}):</strong>{' '}
                              <MathRenderer content={sq.explanation || sq.content} inline />
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="text-[12pt] text-[#202124] leading-relaxed pl-4">
                        <MathRenderer content={q.step_by_step_solution || 'Chưa có lời giải'} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VIEW: MA TRẬN & BẢN ĐẶC TẢ THEO CV 7991 */}
          {viewMode === 'matrix' && (
            <div className="space-y-6 text-[10pt]">
              {planOutput && <section className="space-y-2">
                <h2 className="text-center font-bold text-[12pt]">{planOutput.title}</h2>
                <p>{planOutput.disclaimer}</p><p className="font-bold">{planOutput.status}</p>
                {planOutput.summaries.map(summary => <p key={summary}>{summary}</p>)}
                {planOutput.headers.length > 0 && <table className="w-full table-fixed border-collapse border border-black text-[9pt]"><thead><tr>{planOutput.headers.map(header => <th key={header} className="border border-black p-1 break-words">{header}</th>)}</tr></thead><tbody>{planOutput.rows.map((row, index) => <tr key={index}>{row.map((cell, column) => <td key={column} className="border border-black p-1 align-top break-words">{cell}</td>)}</tr>)}</tbody></table>}
                {planOutput.warnings.length > 0 && <div className="border border-black p-2"><strong>Cần rà soát</strong>{planOutput.warnings.map((warning, index) => <p key={index}>{warning}</p>)}</div>}
              </section>}
              <h2 className="text-center font-bold text-[13pt]">MA TRẬN TỪ NỘI DUNG ĐANG SOẠN</h2>
              <p>Môn: {subjectConfig.name} · Lớp {metadata.grade}</p>
              <div className="border rounded-xl p-3 text-[10pt] space-y-1">{matrixData.warnings.map(warning => <p key={warning}>{warning}</p>)}</div>
              <table className="w-full border-collapse border border-black text-center">
                <thead><tr>{['Chủ đề', ...matrixData.cognitiveLabels.map(level => level.label), 'Chưa gắn mức', 'Tổng câu', numericScore ? 'Điểm' : 'Đánh giá'].map(label => <th key={label} className="border border-black p-2">{label}</th>)}</tr></thead>
                <tbody>{matrixData.rows.map(row => <tr key={row.index}>
                  <td className="border border-black p-2 text-left">{row.topicName}</td>
                  {matrixData.cognitiveLabels.map(level => <td key={level.id} className="border border-black p-2">{Object.values(row.cognitiveCounts[level.id]).reduce((sum, count) => sum + count, 0)}</td>)}
                  <td className="border border-black p-2">{row.unmappedCount}</td><td className="border border-black p-2">{row.totalQuestions}</td><td className="border border-black p-2">{numericScore ? row.totalPoints : 'Nhận xét'}</td>
                </tr>)}</tbody>
                <tfoot><tr><th className="border border-black p-2">Tổng</th>{matrixData.cognitiveTotals.map(level => <td key={level.id} className="border border-black p-2">{level.count}</td>)}<td className="border border-black p-2">{matrixData.unmappedCognitiveCount}</td><td className="border border-black p-2">{matrixData.totalQuestions}</td><td className="border border-black p-2">{numericScore ? matrixData.totalExamPoints : 'Không tính điểm'}</td></tr></tfoot>
              </table>
              <h3 className="font-bold text-center text-[12pt]">BẢN ĐẶC TẢ ĐANG SOẠN</h3>
              <table className="w-full border-collapse border border-black">
                <thead><tr><th className="border border-black p-2">Chủ đề</th><th className="border border-black p-2">Yêu cầu cần đạt</th>{matrixData.cognitiveLabels.map(level => <th key={level.id} className="border border-black p-2">{level.label}</th>)}<th className="border border-black p-2">Chưa gắn mức</th></tr></thead>
                <tbody>{specData.map(spec => <tr key={spec.index}><td className="border border-black p-2">{spec.topicName}</td><td className="border border-black p-2">{spec.requirement}</td>{matrixData.cognitiveLabels.map(level => <td key={level.id} className="border border-black p-2">{spec.cognitiveQuestions[level.id]?.map(number => 'C' + number).join(', ') || '—'}</td>)}<td className="border border-black p-2">{spec.unmappedQuestions.map(number => 'C' + number).join(', ') || '—'}</td></tr>)}</tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
