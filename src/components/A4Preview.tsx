'use client';

import { MatrixCards } from '@/components/editor/MatrixCards';
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Exam, Figure } from '@/types/exam';
import { MathRenderer } from './MathRenderer';
import { outlineView } from '@/lib/outline-view';
import { StructureBlocks, QuestionParts } from '@/components/editor/StructureBlocks';
import { ToolMenu, type MenuItem } from '@/components/EditorToolbar';
import { insertDotsAfterQuestions } from '@/lib/canvas-objects';
import { Plus } from 'lucide-react';
import { FigureView } from './FigureView';

import { parallelAnswer } from '@/lib/parallel-view';

import { formatPointsString, calculateExamTotalPoints } from '@/lib/scoring';
import { getSubjectConfig } from '@/lib/subject-config';
import { requiresNumericScore } from '@/lib/education-catalog';
import { matchingDisplay, orderingDisplay } from '@/lib/structured-question';
import { computeExamMatrix, computeExamSpecification } from '@/lib/matrix-spec-generator';
import { examPlanOutput } from '@/lib/exam-plan-output';
import { resolveHeaderLines } from '@/lib/header-layout';
import { resolvePrintLayout, segmentsToText, choiceColumnCount, type ResolvedBlock } from '@/lib/print-layout';

const renderPreviewFigure = (figure: Figure, questionId?: string) => (
  <div key={figure.id} data-object={questionId ? `figure:${questionId}:${figure.id}` : undefined}>
    <FigureView figure={figure} forceLight />
  </div>
);

function renderStructuredPrompt(question: Exam['questions'][number]) {
  const matching = matchingDisplay(question);
  if (matching)
    return (
      <div className="grid grid-cols-2 gap-4 border border-black p-3 my-2 text-[11pt]">
        <div>
          <strong>Cột A</strong>
          {matching.left.map((item, i) => (
            <p key={item.key}>
              {i + 1}. <MathRenderer content={item.text} inline />
            </p>
          ))}
        </div>
        <div>
          <strong>Cột B</strong>
          {matching.right.map((item, i) => (
            <p key={item.key}>
              {i + 1}. <MathRenderer content={item.text} inline />
            </p>
          ))}
        </div>
      </div>
    );
  const ordering = orderingDisplay(question);
  if (ordering)
    return (
      <div className="border border-black p-3 my-2 text-[11pt]">
        {ordering.items.map((item, i) => (
          <p key={item.key}>
            {i + 1}. <MathRenderer content={item.text} inline />
          </p>
        ))}
        <p className="mt-2">Thứ tự em chọn: ........................................</p>
      </div>
    );
  return null;
}

interface A4PreviewProps {
  exam: Exam;
  /** Extra controls for the bar under the sheet (for example the slideshow button). */
  barExtra?: React.ReactNode;
  /** The selected object (a code from canvas-objects) and what to do when something on the sheet is clicked. Without this the sheet is read-only. */
  selectedCode?: string;
  onSelectCode?: (code: string) => void;
  /** The "Thêm" menu for a "+" point on the sheet. */
  insertItems?: (code: string) => MenuItem[];
  /** Questions with review findings (left margin mark) and with open comments (right margin bubble). */
  issueCounts?: Record<string, number>;
  commentCounts?: Record<string, number>;
  onIssues?: (id: string) => void;
  onComments?: (id: string) => void;
}

const A4_HEIGHT_PX = 1123;

function PrintBlocks({
  blocks,
  page,
  pages,
  size = '12pt',
}: {
  blocks: ResolvedBlock[];
  page?: number;
  pages?: number;
  size?: string;
}) {
  return (
    <>
      {blocks.map((block) => (
        <div
          key={block.id}
          data-print-block={block.id}
          className={`whitespace-pre-wrap break-words ${block.bold ? 'font-bold' : ''} ${block.italic ? 'italic' : ''}`}
          style={{ textAlign: block.align, fontSize: size, minHeight: '1.2em' }}
        >
          {segmentsToText(block.segments, page, pages)}
        </div>
      ))}
    </>
  );
}

export const A4Preview: React.FC<A4PreviewProps> = ({
  exam,
  barExtra,
  selectedCode,
  onSelectCode,
  insertItems,
  issueCounts,
  commentCounts,
  onIssues,
  onComments,
}) => {
  const [viewMode, setViewMode] = useState<'exam' | 'parallel' | 'answers' | 'solutions' | 'matrix'>('exam');
  // null follows the available width; explicit percentages are actual paper zoom.
  const [zoom, setZoom] = useState<number | null>(null);
  const scrollArea = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(1);
  const paper = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState(1);
  const effectiveZoom = zoom ?? Math.round(fitScale * 100);
  useEffect(() => {
    const area = scrollArea.current;
    if (!area) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 794;
      setFitScale(Math.min(1, Math.max(0.2, (width - 8) / 794)));
    });
    observer.observe(area);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const node = paper.current;
    if (!node) return;
    const measure = () => {
      // A part or group set to start on a new page is pushed down to the next page line.
      const breaks = [...node.querySelectorAll<HTMLElement>('[data-page-break="true"]')];
      breaks.forEach((block) => (block.style.marginTop = ''));
      for (const block of breaks) {
        const into = block.offsetTop % A4_HEIGHT_PX;
        if (block.offsetTop > 0 && into > 2) block.style.marginTop = `calc(0.75rem + ${A4_HEIGHT_PX - into}px)`;
      }
      setPageCount(Math.max(1, Math.ceil((node.offsetHeight - 2) / A4_HEIGHT_PX)));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [exam, viewMode]);

  const print = resolvePrintLayout(exam);
  const insertDots = useMemo(() => (insertItems ? insertDotsAfterQuestions(exam) : new Map<string, string[]>()), [exam, insertItems]);
  const { metadata } = exam;
  const structure = outlineView(exam);
  const questions = structure.questions;
  const subjectConfig = getSubjectConfig(metadata.subject, metadata.grade);

  const matrixData = computeExamMatrix(exam);
  const specData = computeExamSpecification(exam);
  const planOutput = examPlanOutput(exam);
  const headerLines = resolveHeaderLines(exam);
  const headerAreas = (['left', 'right'] as const).filter((area) =>
    headerLines.some((line) => line.area === area),
  );

  const totalPoints = calculateExamTotalPoints(exam);
  const numericScore = requiresNumericScore(metadata.assessmentMode);

  return (
    <div
      className={
        'a4-preview-container flex flex-col h-full min-h-0 bg-[var(--ui-surface-variant)] overflow-hidden'
      }
    >
      <div className="no-print order-last shrink-0 border-t px-2 py-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 bg-[var(--ui-surface)]">
        <nav aria-label="Các bản xem trước" className="flex flex-nowrap overflow-x-auto gap-1">
          {(
            [
              { key: 'exam', name: 'Đề' },
              { key: 'answers', name: 'Đáp án' },
              { key: 'solutions', name: 'Lời giải' },
              { key: 'matrix', name: 'Ma trận' },
            ] as const
          ).map((tab) => (
            <button
              type="button"
              key={tab.key}
              aria-label={tab.name}
              aria-pressed={viewMode === tab.key || (tab.key === 'exam' && viewMode === 'parallel')}
              onClick={() => setViewMode(tab.key)}
              className={
                (viewMode === tab.key || (tab.key === 'exam' && viewMode === 'parallel')
                  ? 'app-button-tonal'
                  : 'app-button-secondary') + ' shrink-0 min-h-9 px-3 text-xs'
              }
            >
              {tab.name}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-2 text-xs flex-wrap ml-auto">
          {(viewMode === 'exam' || viewMode === 'parallel') && (
            <label className="inline-flex gap-1 items-center">
              <input
                type="checkbox"
                aria-label="Bố cục song song"
                checked={viewMode === 'parallel'}
                onChange={(e) => setViewMode(e.target.checked ? 'parallel' : 'exam')}
              />
              Song song
            </label>
          )}
          {viewMode === 'exam' && (
            <nav aria-label="Các trang (ước lượng)" className="flex items-center gap-1">
              <span className="text-[var(--ui-text-secondary)]">{pageCount} trang</span>
              {pageCount > 1 &&
                Array.from({ length: Math.min(pageCount, 12) }, (_, index) => (
                  <button
                    key={index}
                    type="button"
                    aria-label={`Đến trang ${index + 1}`}
                    className="app-button-secondary min-w-9 min-h-9 text-xs"
                    onClick={() => {
                      const area = scrollArea.current;
                      const sheet = paper.current;
                      if (!area || !sheet) return;
                      const top =
                        sheet.getBoundingClientRect().top -
                        area.getBoundingClientRect().top +
                        area.scrollTop +
                        index * A4_HEIGHT_PX * (effectiveZoom / 100);
                      area.scrollTo({ top: Math.max(0, top - 8), behavior: 'smooth' });
                    }}
                  >
                    {index + 1}
                  </button>
                ))}
            </nav>
          )}
          {barExtra}
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Thu nhỏ"
              title="Thu nhỏ"
              className="app-button-secondary min-w-9 min-h-9"
              disabled={effectiveZoom <= 25}
              onClick={() => setZoom(Math.max(25, effectiveZoom - 10))}
            >
              −
            </button>
            <span className="min-w-10 text-center" aria-live="polite">
              {effectiveZoom}%
            </span>
            <button
              type="button"
              aria-label="Phóng to"
              title="Phóng to"
              className="app-button-secondary min-w-9 min-h-9"
              disabled={effectiveZoom >= 200}
              onClick={() => setZoom(Math.min(200, effectiveZoom + 10))}
            >
              +
            </button>
            <select
              className="teacher-field max-w-28 text-xs"
              aria-label="Kiểu thu phóng"
              value={zoom === null ? 'fit' : zoom === 100 ? '100' : 'custom'}
              onChange={(e) => {
                if (e.target.value !== 'custom') setZoom(e.target.value === 'fit' ? null : 100);
              }}
            >
              <option value="fit">Vừa khung</option>
              <option value="100">100%</option>
              {zoom !== null && zoom !== 100 && <option value="custom">{zoom}%</option>}
            </select>
          </div>
        </div>
      </div>
      {viewMode === 'matrix' && (
        <div className="no-print sm:hidden overflow-auto grow min-h-0 p-3 space-y-4">
          {planOutput && (
            <>
              <h2 className="font-semibold">{planOutput.title}</h2>
              <p className="text-xs">{planOutput.status}</p>
              <MatrixCards title="Mục tiêu ma trận" headers={planOutput.headers} rows={planOutput.rows} />
              {planOutput.warnings.map((warning, index) => (
                <p key={index} className="text-xs">
                  {warning}
                </p>
              ))}
            </>
          )}
          {matrixData.warnings.map((warning, index) => (
            <p key={index} className="text-xs">
              {warning}
            </p>
          ))}
          <MatrixCards
            title="Ma trận từ nội dung đề"
            headers={[
              'Chủ đề',
              ...matrixData.cognitiveLabels.map((level) => level.label),
              'Chưa gắn mức',
              'Tổng câu',
              numericScore ? 'Điểm' : 'Đánh giá',
            ]}
            rows={matrixData.rows.map((row) => [
              row.topicName,
              ...matrixData.cognitiveLabels.map((level) =>
                Object.values(row.cognitiveCounts[level.id]).reduce((sum, count) => sum + count, 0),
              ),
              row.unmappedCount,
              row.totalQuestions,
              numericScore ? row.totalPoints : 'Nhận xét',
            ])}
          />
          <p className="text-sm">
            Tổng: {matrixData.totalQuestions} câu ·{' '}
            {numericScore ? matrixData.totalExamPoints + ' điểm' : 'Không tính điểm'}
          </p>
          <MatrixCards
            title="Bản đặc tả"
            headers={[
              'Chủ đề',
              'Yêu cầu cần đạt',
              ...matrixData.cognitiveLabels.map((level) => level.label),
              'Chưa gắn mức',
            ]}
            rows={specData.map((spec) => [
              spec.topicName,
              spec.requirement,
              ...matrixData.cognitiveLabels.map(
                (level) => spec.cognitiveQuestions[level.id]?.map((number) => 'C' + number).join(', ') || '—',
              ),
              spec.unmappedQuestions.map((number) => 'C' + number).join(', ') || '—',
            ])}
          />
        </div>
      )}
      {/* Vùng cuộn hiển thị trang A4 */}
      <div
        ref={scrollArea}
        tabIndex={onSelectCode ? 0 : undefined}
        aria-label={onSelectCode ? 'Vùng trang' : undefined}
        data-selectable={onSelectCode && viewMode === 'exam' ? 'true' : undefined}
        onClick={
          onSelectCode && viewMode === 'exam'
            ? (event) => {
                // Dragging over words to copy them is not a click on an object.
                if (window.getSelection()?.toString()) return;
                const hit = (event.target as HTMLElement).closest<HTMLElement>('[data-object]');
                onSelectCode(hit?.dataset.object ?? 'exam');
              }
            : undefined
        }
        className={
          'a4-scroll-area grow min-h-0 overflow-auto p-4 sm:p-8 outline-none ' +
          (viewMode === 'matrix' ? 'hidden sm:block print:!block' : '')
        }
      >
        {onSelectCode && selectedCode && selectedCode !== 'exam' && viewMode === 'exam' && (
          <style>{`.a4-paper [data-object="${selectedCode.replace(/["\\]/g, '\\$&')}"]{outline:2px solid var(--ui-primary);outline-offset:3px;border-radius:2px}`}</style>
        )}
        <div
          ref={paper}
          style={{ zoom: effectiveZoom / 100 }}
          className={`a4-paper relative mx-auto w-[210mm] min-h-[297mm] bg-white text-black p-[18mm] shadow-xs border border-[#dadce0] font-serif leading-normal ${print?.hasFooter && viewMode === 'exam' ? 'flex flex-col' : ''}`}
        >
          {viewMode === 'exam' && pageCount > 1 && (
            <div aria-hidden="true" className="no-print pointer-events-none absolute inset-0 overflow-hidden">
              {Array.from({ length: pageCount - 1 }, (_, index) => (
                <div
                  key={index}
                  data-page-line={index + 1}
                  className="absolute left-0 right-0 border-t border-dashed border-black/40"
                  style={{ top: (index + 1) * A4_HEIGHT_PX }}
                >
                  <span className="absolute right-3 -top-5 text-[9pt] text-black/50">Hết trang {index + 1}</span>
                </div>
              ))}
            </div>
          )}
          {/* VIEW: ĐỀ THI */}
          {viewMode === 'exam' && (
            <div className="space-y-4 text-[13pt]">
              {headerAreas.length > 0 && (
                <div
                  className={`grid ${headerAreas.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-4 pb-3 border-b border-black`}
                >
                  {headerAreas.map((area) => (
                    <div key={area}>
                      {headerLines
                        .filter((line) => line.area === area)
                        .map((line) => (
                          <div
                            key={line.id}
                            data-header-line={line.id}
                            data-object={`print:header:${line.id}`}
                            className={`text-[12pt] whitespace-pre-wrap break-words ${line.bold ? 'font-bold' : ''} ${line.italic ? 'italic' : ''}`}
                            style={{ textAlign: line.align, minHeight: '1.2em' }}
                          >
                            {line.text}
                          </div>
                        ))}
                    </div>
                  ))}
                </div>
              )}

              {/* Thông tin học sinh */}
              {!print && (
                <div data-object="print:student" className="text-[12pt] italic py-1 flex justify-between">
                  <span>
                    Họ và tên thí sinh:
                    ........................................................................
                  </span>
                  <span>Lớp: ......... SBD: ..........</span>
                </div>
              )}
              {print && print.studentLine.kind !== 'none' && (
                <div data-print-zone="studentLine" data-object="print:student">
                  {print.studentLine.labels.length > 0 && (
                    <div className="text-[12pt] italic py-1 flex flex-wrap justify-between gap-x-6">
                      {print.studentLine.labels.map((label, index) => (
                        <span key={label} className={index === 0 ? 'grow' : ''}>
                          {label}: {'.'.repeat(index === 0 ? 60 : 14)}
                        </span>
                      ))}
                    </div>
                  )}
                  {print.studentLine.kind === 'scoreBox' && (
                    <div className="grid grid-cols-[7rem_1fr] border border-black text-[12pt] min-h-20">
                      <div className="border-r border-black p-2 font-bold">Điểm</div>
                      <div className="p-2 font-bold">Lời nhận xét của giáo viên</div>
                    </div>
                  )}
                </div>
              )}
              {print && print.intro.length > 0 && (
                <div data-print-zone="intro" data-object="print:intro">
                  <PrintBlocks blocks={print.intro} />
                </div>
              )}

              {/* Nội dung đề thi */}
              {questions.length === 0 && <StructureBlocks blocks={structure.trailing} light />}
              {questions.length === 0 ? (
                <div className="py-24 text-center text-[#5f6368] italic text-[11pt]">
                  Đề chưa có câu hỏi. Dùng menu &quot;Thêm&quot; hoặc dấu ＋ trong vùng soạn để bắt đầu.
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {questions.map((q, index) => (
                      <React.Fragment key={q.id}>
                      <div
                        data-question-id={q.id}
                        data-object={`question:${q.id}`}
                        className="question-item relative text-[12pt]"
                      >
                        <StructureBlocks blocks={structure.before.get(q.id)} light />
                        {issueCounts?.[q.id] ? (
                          <button
                            type="button"
                            data-issue-mark={q.id}
                            aria-label={`Câu ${structure.numbers.get(q.id) ?? index + 1} có ${issueCounts[q.id]} mục cần rà soát`}
                            title="Có mục cần rà soát"
                            onClick={(event) => {
                              event.stopPropagation();
                              onIssues?.(q.id);
                            }}
                            className="no-print absolute -left-[13mm] top-0 flex h-5 min-w-5 items-center justify-center rounded-full border border-black/50 bg-white px-1 text-[9pt] font-bold text-black"
                          >
                            !
                          </button>
                        ) : null}
                        {commentCounts?.[q.id] ? (
                          <button
                            type="button"
                            data-comment-bubble={q.id}
                            aria-label={`Câu ${structure.numbers.get(q.id) ?? index + 1} có ${commentCounts[q.id]} góp ý chưa giải quyết`}
                            title="Có góp ý chưa giải quyết"
                            onClick={(event) => {
                              event.stopPropagation();
                              onComments?.(q.id);
                            }}
                            className="no-print absolute -right-[13mm] top-0 flex h-5 min-w-5 items-center justify-center rounded-full border border-black/50 bg-white px-1 text-[9pt] text-black"
                          >
                            {commentCounts[q.id]}
                          </button>
                        ) : null}
                        <p className="leading-relaxed">
                          <b>Câu {structure.numbers.get(q.id) ?? index + 1}:</b>{' '}
                          {numericScore && q.points !== undefined && (
                            <span className="italic">({formatPointsString(q.points)}) </span>
                          )}
                          <MathRenderer content={q.content} inline />
                        </p>
                        {q.choices && q.type === 'multiple_choice' && (
                          <div
                            className="grid gap-3 pl-4 py-2"
                            style={{
                              gridTemplateColumns: `repeat(${metadata.choiceColumns === undefined ? 2 : choiceColumnCount(q.choices, metadata.choiceColumns)}, minmax(0, 1fr))`,
                            }}
                          >
                            {q.choices.map((choice) => (
                              <div key={choice.key} data-object={`choice:${q.id}:${choice.key}`}>
                                <b>{choice.key}.</b> <MathRenderer content={choice.text} inline />
                                {choice.figures?.map((figure) => renderPreviewFigure(figure, q.id))}
                              </div>
                            ))}
                          </div>
                        )}
                        {q.sub_questions && q.type === 'true_false_group' && (
                          <div className="pl-4 space-y-1">
                            {q.sub_questions.map((sub) => (
                              <p key={sub.key} data-object={`statement:${q.id}:${sub.key}`}>
                                <b>{sub.key})</b> <MathRenderer content={sub.content} inline />{' '}
                                <span className="whitespace-nowrap">□ Đúng □ Sai</span>
                              </p>
                            ))}
                          </div>
                        )}
                        <QuestionParts question={q} number={structure.numbers.get(q.id)} />
                        {renderStructuredPrompt(q)}
                        {q.figures?.map((figure) => renderPreviewFigure(figure, q.id))}
                        {['short_answer', 'fill_blank'].includes(q.type) && (
                          <p className="mt-2">
                            Trả lời:
                            ................................................................................
                          </p>
                        )}
                      </div>
                      {insertItems &&
                        insertDots.get(q.id)?.map((code) => (
                          <div
                            key={code}
                            data-object={code}
                            data-insert-point={code}
                            className="no-print group/dot -my-1 flex h-5 items-center gap-2"
                          >
                            <span className="h-px grow border-t border-dashed border-black/20" />
                            <ToolMenu
                              label="Thêm tại đây"
                              compact
                              Icon={Plus}
                              items={insertItems(code)}
                              className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full border border-black/30 bg-white p-0 text-black/60 hover:text-black"
                            />
                            <span className="h-px grow border-t border-dashed border-black/20" />
                          </div>
                        ))}
                      </React.Fragment>
                    ))}
                  </div>

                  <StructureBlocks blocks={structure.trailing} light />
                  {headerLines
                    .filter((line) => line.area === 'footer')
                    .map((line) => (
                      <div
                        key={line.id}
                        data-header-line={line.id}
                        data-object={`print:header:${line.id}`}
                        className={`text-[11pt] whitespace-pre-wrap break-words ${line.bold ? 'font-bold' : ''} ${line.italic ? 'italic' : ''}`}
                        style={{ textAlign: line.align, minHeight: '1.2em' }}
                      >
                        {line.text}
                      </div>
                    ))}
                  {/* Chân trang đề thi */}
                  {!print && (
                    <div
                      data-object="print:end"
                      className="text-center text-[12pt] font-bold pt-8 border-t border-black mt-8"
                    >
                      ---------- HẾT ----------
                    </div>
                  )}
                  {print && print.end.length > 0 && (
                    <div data-print-zone="end" data-object="print:end" className="pt-8 border-t border-black mt-8">
                      <PrintBlocks blocks={print.end} />
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {viewMode === 'exam' &&
            questions.length === 0 &&
            headerLines
              .filter((line) => line.area === 'footer')
              .map((line) => (
                <div
                  key={line.id}
                  data-header-line={line.id}
                  className={`text-[11pt] whitespace-pre-wrap break-words ${line.bold ? 'font-bold' : ''} ${line.italic ? 'italic' : ''}`}
                  style={{ textAlign: line.align, minHeight: '1.2em' }}
                >
                  {line.text}
                </div>
              ))}
          {/* VIEW: SONG SONG — đề bên trái, đáp án và lời giải bên phải; chỉ để xem/in, không đổi dữ liệu */}
          {viewMode === 'parallel' && (
            <div className="space-y-4 text-[12pt]">
              <h2 className="font-bold text-center text-[14pt]">ĐỀ VÀ ĐÁP ÁN SONG SONG</h2>
              <p className="text-center">
                {metadata.title}
                {metadata.examCode ? ' — Mã đề: ' + metadata.examCode : ''}
              </p>
              <p className="text-center italic text-[10pt]">
                Bản này chứa đáp án: chỉ dùng cho giáo viên, không phát cho học sinh.
              </p>
              {questions.length === 0 ? (
                <div className="py-16 text-center text-[#5f6368] italic text-[11pt]">
                  (Chưa có câu hỏi nào.)
                </div>
              ) : metadata.assessmentMode === 'survey' ? (
                <div className="py-8 text-center italic text-[11pt]">
                  Phiếu khảo sát không có đáp án đúng; hãy xem ở chế độ Đề thi in ấn.
                </div>
              ) : (
                <div className="border border-black">
                  <div className="grid grid-cols-2 border-b border-black font-bold text-center text-[11pt]">
                    <div className="p-2 border-r border-black">ĐỀ</div>
                    <div className="p-2">ĐÁP ÁN VÀ HƯỚNG DẪN</div>
                  </div>
                  {questions.map((q, index) => {
                    const answer = parallelAnswer(q);
                    return (
                      <React.Fragment key={q.id}>
                        <StructureBlocks blocks={structure.before.get(q.id)} light />
                        <div className="question-item grid grid-cols-2 border-b border-black last:border-b-0 break-inside-avoid">
                          <div className="p-2 border-r border-black text-[11pt]">
                            <p className="leading-relaxed">
                              <b>Câu {structure.numbers.get(q.id) ?? index + 1}:</b>{' '}
                              {numericScore && q.points !== undefined && (
                                <span className="italic">({formatPointsString(q.points)}) </span>
                              )}
                              <MathRenderer content={q.content} />
                            </p>
                            {q.choices && q.type === 'multiple_choice' && (
                              <div className="pl-3 py-1">
                                {q.choices.map((choice) => (
                                  <div key={choice.key}>
                                    <b>{choice.key}.</b> <MathRenderer content={choice.text} inline />
                                    {choice.figures?.map((figure) => renderPreviewFigure(figure))}
                                  </div>
                                ))}
                              </div>
                            )}
                            {q.sub_questions && q.type === 'true_false_group' && (
                              <div className="pl-3 space-y-1">
                                {q.sub_questions.map((sub) => (
                                  <p key={sub.key}>
                                    <b>{sub.key})</b> <MathRenderer content={sub.content} inline />
                                  </p>
                                ))}
                              </div>
                            )}
                            {renderStructuredPrompt(q)}
                            {q.figures?.map((figure) => renderPreviewFigure(figure))}
                          </div>
                          <div className="p-2 text-[11pt]">
                            <p className="font-bold text-emerald-800">{answer.headline}</p>
                            {answer.details.map((line, i) => (
                              <p key={i} className="text-[10pt]">
                                {line}
                              </p>
                            ))}
                            <QuestionParts
                              question={q}
                              number={structure.numbers.get(q.id)}
                              reveal="solutions"
                            />
                            {answer.solution && (
                              <div className="mt-1 text-[10.5pt] leading-relaxed">
                                <MathRenderer content={answer.solution} />
                              </div>
                            )}
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {viewMode === 'answers' && (
            <div className="space-y-5 text-[12pt]">
              <h2 className="font-bold text-center text-[14pt]">
                {metadata.assessmentMode === 'survey'
                  ? 'PHIẾU KHẢO SÁT — KHÔNG CHẤM ĐÚNG SAI'
                  : 'ĐÁP ÁN VÀ TIÊU CHÍ ĐÁNH GIÁ'}
              </h2>
              <p className="text-center">
                {metadata.title}
                {metadata.examCode ? ' — Mã đề: ' + metadata.examCode : ''}
              </p>
              <p>{numericScore ? 'Tổng điểm đã cấu hình: ' + totalPoints : 'Không tính điểm'}</p>
              {metadata.assessmentMode !== 'survey' &&
                questions.map((q, index) => (
                  <section key={q.id} className="question-item border-b pb-3">
                    <StructureBlocks blocks={structure.before.get(q.id)} light />
                    <p>
                      <b>Câu {structure.numbers.get(q.id) ?? index + 1}:</b>{' '}
                      {q.type === 'true_false_group'
                        ? q.sub_questions
                            ?.map(
                              (sub) =>
                                sub.key +
                                ') ' +
                                (sub.isCorrect === undefined
                                  ? 'Chưa có đáp án'
                                  : sub.isCorrect
                                    ? 'Đúng'
                                    : 'Sai'),
                            )
                            .join('; ')
                        : q.type === 'matching'
                          ? q.matchingPairs?.map((pair) => pair.left + ' → ' + pair.right).join('; ') ||
                            q.correct_answer ||
                            'Chưa thiết lập cặp đúng'
                          : q.type === 'ordering'
                            ? q.correctOrder?.join(' → ') || q.correct_answer || 'Chưa thiết lập thứ tự đúng'
                            : q.correct_answer ||
                              (q.type === 'essay' ? 'Giáo viên đánh giá theo tiêu chí' : 'Chưa đặt đáp án')}
                    </p>
                    {q.accepted_answers?.filter(Boolean).length ? (
                      <p>Chấp nhận: {q.accepted_answers.filter(Boolean).join('; ')}</p>
                    ) : null}
                    <QuestionParts question={q} number={structure.numbers.get(q.id)} reveal="answers" />
                    {q.rubric?.map((row, i) => (
                      <p key={i}>
                        • {row.criterion}
                        {numericScore ? ': ' + row.maxPoints + ' điểm' : ''}
                      </p>
                    ))}
                  </section>
                ))}
            </div>
          )}

          {/* VIEW: HƯỚNG DẪN GIẢI CHI TIẾT */}
          {viewMode === 'solutions' && (
            <div className="space-y-6 text-[12pt]">
              <div className="page-break text-center border-b border-black pb-3">
                <h2 className="text-[14pt] font-bold uppercase">HƯỚNG DẪN GIẢI CHI TIẾT TỪNG BƯỚC</h2>
                <p className="italic text-[11pt]">
                  Đề kiểm tra: {metadata.title} - Mã đề: {metadata.examCode || ''}
                </p>
              </div>

              {questions.length === 0 ? (
                <div className="py-16 text-center text-[#5f6368] italic text-[11pt]">
                  (Chưa có câu hỏi nào để hiển thị lời giải chi tiết.)
                </div>
              ) : (
                <div className="space-y-6">
                  {questions.map((q, idx) => (
                    <div key={q.id} className="question-item pb-4 border-b border-[#dadce0] last:border-b-0">
                      <StructureBlocks blocks={structure.before.get(q.id)} light />
                      <div className="font-bold text-[12pt] text-[#202124]">
                        Câu {structure.numbers.get(q.id) ?? idx + 1}:{' '}
                        {q.type === 'multiple_choice' && (
                          <span className="text-emerald-700">
                            Đáp án đúng là {q.correct_answer ?? 'Chưa có đáp án'}
                          </span>
                        )}
                        {q.type === 'true_false_group' && (
                          <span className="text-emerald-700">
                            Đáp án:{' '}
                            {q.sub_questions
                              ?.map(
                                (sq) =>
                                  `${sq.key}) ${typeof sq.isCorrect === 'boolean' ? (sq.isCorrect ? 'Đúng' : 'Sai') : 'Chưa có đáp án'}`,
                              )
                              .join('   ') || q.correct_answer}
                          </span>
                        )}
                        {q.type === 'short_answer' && (
                          <span className="text-emerald-700">Đáp số: {q.correct_answer}</span>
                        )}
                      </div>
                      {q.type === 'true_false_group' && q.sub_questions && (
                        <div className="pl-4 space-y-1 my-2 text-[11pt]">
                          {q.sub_questions.map((sq) => (
                            <div key={sq.key} className="text-[#202124]">
                              <strong>
                                Ý {sq.key}) (
                                {typeof sq.isCorrect === 'boolean'
                                  ? sq.isCorrect
                                    ? 'Đúng'
                                    : 'Sai'
                                  : 'Chưa có đáp án'}
                                ):
                              </strong>{' '}
                              <MathRenderer content={sq.explanation || sq.content} inline />
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="text-[12pt] text-[#202124] leading-relaxed pl-4">
                        <QuestionParts question={q} number={structure.numbers.get(q.id)} reveal="solutions" />
                        <MathRenderer content={q.step_by_step_solution || 'Chưa có lời giải'} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {(viewMode === 'answers' || viewMode === 'solutions' || viewMode === 'parallel') && (
            <StructureBlocks blocks={structure.trailing} light />
          )}
          {/* VIEW: MA TRẬN & BẢN ĐẶC TẢ THEO CV 7991 */}
          {viewMode === 'matrix' && (
            <div className="space-y-6 text-[10pt]">
              {planOutput && (
                <section className="space-y-2">
                  <h2 className="text-center font-bold text-[12pt]">{planOutput.title}</h2>
                  <p>{planOutput.disclaimer}</p>
                  <p className="font-bold">{planOutput.status}</p>
                  {planOutput.summaries.map((summary) => (
                    <p key={summary}>{summary}</p>
                  ))}
                  {planOutput.headers.length > 0 && (
                    <table className="w-full table-fixed border-collapse border border-black text-[9pt]">
                      <thead>
                        <tr>
                          {planOutput.headers.map((header) => (
                            <th key={header} className="border border-black p-1 break-words">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {planOutput.rows.map((row, index) => (
                          <tr key={index}>
                            {row.map((cell, column) => (
                              <td key={column} className="border border-black p-1 align-top break-words">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  {planOutput.warnings.length > 0 && (
                    <div className="border border-black p-2">
                      <strong>Cần rà soát</strong>
                      {planOutput.warnings.map((warning, index) => (
                        <p key={index}>{warning}</p>
                      ))}
                    </div>
                  )}
                </section>
              )}
              <h2 className="text-center font-bold text-[13pt]">MA TRẬN TỪ NỘI DUNG ĐANG SOẠN</h2>
              <p>
                Môn: {subjectConfig.name} · Lớp {metadata.grade}
              </p>
              <div className="border rounded-xl p-3 text-[10pt] space-y-1">
                {matrixData.warnings.map((warning) => (
                  <p key={warning}>{warning}</p>
                ))}
              </div>
              <table className="w-full border-collapse border border-black text-center">
                <thead>
                  <tr>
                    {[
                      'Chủ đề',
                      ...matrixData.cognitiveLabels.map((level) => level.label),
                      'Chưa gắn mức',
                      'Tổng câu',
                      numericScore ? 'Điểm' : 'Đánh giá',
                    ].map((label) => (
                      <th key={label} className="border border-black p-2">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrixData.rows.map((row) => (
                    <tr key={row.index}>
                      <td className="border border-black p-2 text-left">{row.topicName}</td>
                      {matrixData.cognitiveLabels.map((level) => (
                        <td key={level.id} className="border border-black p-2">
                          {Object.values(row.cognitiveCounts[level.id]).reduce(
                            (sum, count) => sum + count,
                            0,
                          )}
                        </td>
                      ))}
                      <td className="border border-black p-2">{row.unmappedCount}</td>
                      <td className="border border-black p-2">{row.totalQuestions}</td>
                      <td className="border border-black p-2">
                        {numericScore ? row.totalPoints : 'Nhận xét'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th className="border border-black p-2">Tổng</th>
                    {matrixData.cognitiveTotals.map((level) => (
                      <td key={level.id} className="border border-black p-2">
                        {level.count}
                      </td>
                    ))}
                    <td className="border border-black p-2">{matrixData.unmappedCognitiveCount}</td>
                    <td className="border border-black p-2">{matrixData.totalQuestions}</td>
                    <td className="border border-black p-2">
                      {numericScore ? matrixData.totalExamPoints : 'Không tính điểm'}
                    </td>
                  </tr>
                </tfoot>
              </table>
              <h3 className="font-bold text-center text-[12pt]">BẢN ĐẶC TẢ ĐANG SOẠN</h3>
              <table className="w-full border-collapse border border-black">
                <thead>
                  <tr>
                    <th className="border border-black p-2">Chủ đề</th>
                    <th className="border border-black p-2">Yêu cầu cần đạt</th>
                    {matrixData.cognitiveLabels.map((level) => (
                      <th key={level.id} className="border border-black p-2">
                        {level.label}
                      </th>
                    ))}
                    <th className="border border-black p-2">Chưa gắn mức</th>
                  </tr>
                </thead>
                <tbody>
                  {specData.map((spec) => (
                    <tr key={spec.index}>
                      <td className="border border-black p-2">{spec.topicName}</td>
                      <td className="border border-black p-2">{spec.requirement}</td>
                      {matrixData.cognitiveLabels.map((level) => (
                        <td key={level.id} className="border border-black p-2">
                          {spec.cognitiveQuestions[level.id]?.map((number) => 'C' + number).join(', ') || '—'}
                        </td>
                      ))}
                      <td className="border border-black p-2">
                        {spec.unmappedQuestions.map((number) => 'C' + number).join(', ') || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {viewMode === 'exam' && print?.hasFooter && (
            <div data-print-zone="footer" data-object="print:footer" className="mt-auto pt-6">
              <div className="grid grid-cols-3 gap-3 border-t border-black pt-2 text-[10.5pt]">
                <div>
                  <PrintBlocks blocks={print.footer.left} page={1} pages={pageCount} size="10.5pt" />
                </div>
                <div>
                  <PrintBlocks blocks={print.footer.center} page={1} pages={pageCount} size="10.5pt" />
                </div>
                <div>
                  <PrintBlocks blocks={print.footer.right} page={1} pages={pageCount} size="10.5pt" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
