'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { Subject, GenerationParams, Exam } from '@/types/exam';
import { getSubjectConfig, getSubjectsForGrade } from '@/lib/subject-config';
import {
  COGNITIVE_FRAMEWORKS,
  getCognitiveFramework,
  getEducationReadiness,
  LANGUAGE_PACKAGES,
  type AssessmentMode,
} from '@/lib/education-catalog';
import { X, Sparkles } from 'lucide-react';
import { knowledgeScopeContext } from '@/lib/knowledge-package';
import { MathRenderer } from './MathRenderer';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onExamGenerated: (exam: Exam, baseStamp: string) => void | boolean | Promise<void | boolean>;
  apiKey: string;
  context?: Exam['metadata'];
  documentStamp: string;
  expectedUserId: string;
  replacesDocument?: boolean;
  appendQuestions?: boolean;
  planningHint?: string;
}
const inputClass =
  'block w-full rounded-xl border border-[#dadce0] dark:border-[#3c4043] bg-white dark:bg-[#292a2d] p-2.5 text-sm mt-1';

export const GenerateModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onExamGenerated,
  apiKey,
  context,
  documentStamp,
  expectedUserId,
  replacesDocument = false,
  appendQuestions = false,
  planningHint,
}) => {
  const [subject, setSubject] = useState<Subject>(context?.subject ?? 'toan');
  const [grade, setGrade] = useState(context?.grade ?? 6);
  const [duration, setDuration] = useState(45);
  const [topic, setTopic] = useState('');
  const [counts, setCounts] = useState({
    multiple_choice: 4,
    true_false_group: 0,
    short_answer: 0,
    essay: 1,
    fill_blank: 0,
    matching: 0,
    ordering: 0,
  });
  const [assessmentMode, setAssessmentMode] = useState<AssessmentMode>(context?.assessmentMode ?? 'scored');
  const [frameworkId, setFrameworkId] = useState(context?.cognitiveFrameworkId ?? '');
  const [usePackage, setUsePackage] = useState(Boolean(context?.knowledgePackage));
  const previousContext = useRef({ subject, grade });
  const [purpose, setPurpose] = useState('practice');
  const [usingExample, setUsingExample] = useState(false);
  const [language, setLanguage] = useState('');
  const [languageRole, setLanguageRole] = useState<'NN1' | 'NN2' | 'ETHNIC'>('NN1');
  const [locality, setLocality] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [proposal, setProposal] = useState<{ exam: Exam; baseStamp: string } | null>(null);
  const controller = useRef<AbortController | null>(null),
    requestId = useRef(0);
  useEffect(
    () => () => {
      controller.current?.abort();
    },
    [isOpen],
  );
  const close = () => {
    requestId.current += 1;
    controller.current?.abort();
    setIsLoading(false);
    setProposal(null);
    onClose();
  };
  const cancel = () => {
    requestId.current += 1;
    controller.current?.abort();
    setIsLoading(false);
    setError('Đã hủy yêu cầu. Chưa áp dụng bản nháp nào.');
  };
  const config = getSubjectConfig(subject, grade);
  const readiness = getEducationReadiness(subject, grade);
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  const isLanguage = subject === 'ngoai_ngu_khac' || subject === 'tieng_dan_toc';
  useEffect(() => {
    if (previousContext.current.subject === subject && previousContext.current.grade === grade) return;
    previousContext.current = { subject, grade };
    setAssessmentMode(getSubjectConfig(subject, grade).assessmentMode ?? 'scored');
    setFrameworkId('');
    setUsingExample(false);
    setLanguage('');
    setLanguageRole(subject === 'tieng_dan_toc' ? 'ETHNIC' : 'NN1');
  }, [subject, grade]);
  if (!isOpen) return null;

  const applyExample = () => {
    setUsingExample(true);
    setDuration(config.defaultDurationMinutes);
    const count = (type: keyof typeof counts) =>
      config.sections.filter((s) => s.type === type).reduce((n, s) => n + s.questionCount, 0);
    setCounts({
      multiple_choice: count('multiple_choice'),
      true_false_group: count('true_false_group'),
      short_answer: count('short_answer'),
      essay: count('essay'),
      fill_blank: count('fill_blank'),
      matching: count('matching'),
      ordering: count('ordering'),
    });
  };
  const generate = async () => {
    if (isLoading) return;
    setError('');
    let scope;
    if (usePackage && context?.knowledgePackage) {
      if (subject !== context.knowledgePackage.subject || grade !== context.knowledgePackage.grade) {
        setError('Phạm vi đang thuộc môn/lớp khác. Hãy chọn đúng môn/lớp hoặc bỏ dùng gói cho lần soạn này.');
        return;
      }
      try {
        scope = knowledgeScopeContext(context.knowledgePackage, context.knowledgeScope);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Hãy chọn phạm vi trong gói trước khi soạn.');
        return;
      }
    }
    const effectiveTopic =
      topic.trim() ||
      scope?.knowledge
        .map((item) => item.title)
        .join('; ')
        .slice(0, 12000) ||
      '';
    if (
      !effectiveTopic ||
      !Number.isInteger(duration) ||
      duration < 1 ||
      duration > 1440 ||
      total < 1 ||
      total > 100 ||
      Object.values(counts).some((n) => !Number.isInteger(n) || n < 0)
    ) {
      setError('Hãy chọn hoặc nhập phạm vi nội dung, thời lượng 1–1440 phút và tổng 1–100 câu.');
      return;
    }
    if (isLanguage && !language.trim()) {
      setError('Hãy chọn ngôn ngữ và chương trình phù hợp.');
      return;
    }
    if (subject === 'giao_duc_dia_phuong' && !locality.trim()) {
      setError('Hãy nhập địa phương và năm tài liệu.');
      return;
    }
    setIsLoading(true);
    setProposal(null);
    const request = ++requestId.current,
      baseStamp = documentStamp;
    controller.current = new AbortController();
    const framework = getCognitiveFramework(frameworkId);
    const education = {
      assessmentMode,
      cognitiveFrameworkId: frameworkId || undefined,
      sourcePackageId: scope?.packageId ?? 'baseline-' + subject + '-' + grade,
      language: isLanguage ? language : undefined,
      languageRole: isLanguage ? languageRole : undefined,
      locality: subject === 'giao_duc_dia_phuong' ? locality : undefined,
      knowledgePackage: scope ? context?.knowledgePackage : undefined,
      knowledgeScope: scope ? context?.knowledgeScope : undefined,
    };
    const params: GenerationParams & typeof education = {
      subject,
      grade,
      topic: effectiveTopic,
      durationMinutes: duration,
      numMultipleChoice: counts.multiple_choice,
      numTrueFalse: counts.true_false_group,
      numShortAnswer: counts.short_answer,
      numEssay: counts.essay,
      numFillBlank: counts.fill_blank,
      numMatching: counts.matching,
      numOrdering: counts.ordering,
      // Compatibility difficulty labels are separate from the selected cognitive framework.
      difficultyRatio: { nhan_biet: 25, thong_hieu: 25, van_dung: 25, van_dung_cao: 25 },
      ...education,
      customInstructions: [
        customInstructions,
        planningHint?.slice(0, 4000),
        'Mục đích: ' + purpose,
        'Chế độ đánh giá: ' + assessmentMode,
        framework
          ? 'Khung nhận thức được chọn: ' +
            framework.label +
            '; cognitiveLevel chỉ dùng: ' +
            framework.levels.map((l) => l.id).join(', ')
          : 'Chưa chọn khung nhận thức; không tự suy từ difficulty.',
        'Nguồn hiện mới là đầu mối, chưa có nội dung được duyệt. Không tự nhận đề chuẩn hay trích sách chưa đọc. Tạo bản nháp để giáo viên kiểm tra.',
        isLanguage ? 'Ngôn ngữ: ' + language + '; vai trò: ' + languageRole : '',
        locality ? 'Địa phương/tài liệu: ' + locality : '',
      ]
        .filter(Boolean)
        .join('\n'),
    };
    try {
      const response = await fetch('/api/generate-exam', {
        method: 'POST',
        signal: controller.current.signal,
        headers: { 'Content-Type': 'application/json', 'x-examcraft-user': expectedUserId },
        body: JSON.stringify({ params, ...(apiKey.trim() ? { customApiKey: apiKey } : {}) }),
      });
      const data = await response.json();
      if (!response.ok || !data.success || !data.exam)
        throw new Error(data.error || 'Chưa tạo được bản nháp');
      const generated = {
        ...data.exam,
        ...(usingExample ? { sections: config.sections } : {}),
        metadata: { ...data.exam.metadata, ...education },
      };
      if (request === requestId.current) setProposal({ exam: generated, baseStamp });
    } catch (cause) {
      if (request === requestId.current && !controller.current?.signal.aborted)
        setError(cause instanceof Error ? cause.message : 'Chưa kết nối được dịch vụ AI');
    } finally {
      if (request === requestId.current) setIsLoading(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/60 p-4 flex items-center justify-center">
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Soạn bản nháp với AI"
        className="app-dialog w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 bg-white dark:bg-[#202124] text-[#202124] dark:text-[#e3e3e3] space-y-4"
      >
        {isLoading && (
          <button type="button" onClick={cancel}>
            Hủy yêu cầu AI
          </button>
        )}
        <header className="app-dialog-header flex items-center justify-between">
          <h2 className="font-bold text-lg">Soạn bản nháp với AI</h2>
          <button onClick={close} aria-label="Đóng">
            <X />
          </button>
        </header>
        <div className="grid grid-cols-2 gap-3">
          <label>
            Lớp
            <select
              className={inputClass}
              value={grade}
              onChange={(e) => {
                const value = Number(e.target.value);
                setGrade(value);
                if (!getSubjectsForGrade(value).some((s) => s.key === subject))
                  setSubject(getSubjectsForGrade(value)[0].key);
              }}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                <option key={g} value={g}>
                  Lớp {g}
                </option>
              ))}
            </select>
          </label>
          <label>
            Môn / hoạt động
            <select
              className={inputClass}
              value={subject}
              onChange={(e) => setSubject(e.target.value as Subject)}
            >
              {getSubjectsForGrade(grade).map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="block">
          Phạm vi bài / chương / yêu cầu cần đạt
          <textarea
            className={inputClass}
            rows={3}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Nhập phần kiến thức muốn soạn; có thể dán yêu cầu cần đạt đã kiểm tra."
          />
        </label>
        {context?.knowledgePackage && (
          <label className="block text-sm border rounded p-3">
            <input type="checkbox" checked={usePackage} onChange={(e) => setUsePackage(e.target.checked)} />{' '}
            Dùng phạm vi đã chọn trong đề · {context.knowledgePackage.title}
            <span className="block text-xs mt-1">
              Gói chờ duyệt. Phạm vi và giới hạn phương pháp được kiểm lại tại máy chủ; AI không được tự thêm
              mã ngoài tập đã chọn.
            </span>
          </label>
        )}
        <div className="grid grid-cols-2 gap-3">
          <label>
            Mục đích
            <select className={inputClass} value={purpose} onChange={(e) => setPurpose(e.target.value)}>
              <option value="practice">Luyện tập / bài tập</option>
              <option value="periodic">Kiểm tra định kỳ</option>
              <option value="survey">Khảo sát</option>
              <option value="advanced">Bồi dưỡng / học sinh giỏi</option>
              <option value="free">Tự do</option>
            </select>
          </label>
          <label>
            Đánh giá
            <select
              className={inputClass}
              value={assessmentMode}
              onChange={(e) => setAssessmentMode(e.target.value as AssessmentMode)}
            >
              <option value="scored">Có điểm</option>
              <option value="comment_only">Nhận xét</option>
              <option value="rubric">Theo tiêu chí / rubric</option>
              <option value="survey">Khảo sát không chấm</option>
            </select>
          </label>
        </div>
        {isLanguage && (
          <div className="grid grid-cols-2 gap-3">
            <label>
              Chương trình
              <select
                className={inputClass}
                value={languageRole}
                onChange={(e) => {
                  setLanguageRole(e.target.value as typeof languageRole);
                  setLanguage('');
                }}
              >
                {subject === 'tieng_dan_toc' ? (
                  <option value="ETHNIC">Tiếng dân tộc</option>
                ) : (
                  <>
                    <option value="NN1">Ngoại ngữ 1</option>
                    <option value="NN2">Ngoại ngữ 2</option>
                  </>
                )}
              </select>
            </label>
            <label>
              Ngôn ngữ
              <select className={inputClass} value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="">Chọn ngôn ngữ</option>
                {LANGUAGE_PACKAGES.find((p) => p.role === languageRole)?.languages.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </label>
            <p className="col-span-2 text-xs">
              Cần ghi thêm trình độ và tài liệu áp dụng trong phạm vi nội dung; không tự lấy số quyển làm lớp.
            </p>
          </div>
        )}
        {subject === 'giao_duc_dia_phuong' && (
          <label className="block">
            Địa phương và năm / phiên bản tài liệu
            <input className={inputClass} value={locality} onChange={(e) => setLocality(e.target.value)} />
          </label>
        )}
        <details className="rounded-xl border p-3 text-sm">
          <summary>Khung nhận thức và nguồn tham khảo</summary>
          <label className="block mt-2">
            Khung nhận thức
            <select
              className={inputClass}
              value={frameworkId}
              onChange={(e) => setFrameworkId(e.target.value)}
            >
              <option value="">Chưa gắn khung — sẽ phân loại sau</option>
              {COGNITIVE_FRAMEWORKS.filter((f) => f.grades.includes(grade)).map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
          <p className="mt-2">{readiness.label}</p>
          <ul className="list-disc pl-5">
            {readiness.sources.map((source) => (
              <li key={source.id}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[var(--ui-accent)] underline"
                >
                  {source.title}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs">
            Khung nhận thức và nhãn độ khó được lưu riêng. Chưa có gói nội dung được giáo viên duyệt đầy đủ.
          </p>
        </details>
        <div className="flex items-center justify-between">
          <label>
            Thời lượng (phút)
            <input
              type="number"
              min={1}
              max={1440}
              className={inputClass}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            />
          </label>
          {config.templateStatus === 'example' && (
            <button onClick={applyExample} className="text-sm text-[var(--ui-accent)]">
              Dùng cấu trúc tham khảo
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(
            [
              { key: 'multiple_choice', label: 'Trắc nghiệm' },
              { key: 'true_false_group', label: 'Đúng / sai' },
              { key: 'short_answer', label: 'Trả lời ngắn' },
              { key: 'essay', label: 'Tự luận / mở' },
            ] as const
          ).map(({ key, label }) => (
            <label key={key} className="text-sm">
              {label}
              <input
                className={inputClass}
                type="number"
                min={0}
                max={100}
                value={counts[key]}
                onChange={(e) => setCounts((current) => ({ ...current, [key]: Number(e.target.value) }))}
              />
            </label>
          ))}
        </div>
        <details className="border rounded-xl p-3 text-sm">
          <summary className="cursor-pointer">Thêm dạng câu: điền khuyết, ghép nối, sắp xếp</summary>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
            {(
              [
                { key: 'fill_blank', label: 'Điền khuyết' },
                { key: 'matching', label: 'Ghép nối' },
                { key: 'ordering', label: 'Sắp xếp' },
              ] as const
            ).map(({ key, label }) => (
              <label key={key}>
                {label}
                <input
                  className={inputClass}
                  type="number"
                  min={0}
                  max={100}
                  value={counts[key]}
                  onChange={(e) => setCounts((current) => ({ ...current, [key]: Number(e.target.value) }))}
                />
              </label>
            ))}
          </div>
          <p className="text-xs mt-2">
            Điền khuyết hiện dùng một ô trả lời mỗi câu; ghép nối có ít nhất hai cặp, sắp xếp có ít nhất hai
            mục. Để 0 nếu không dùng dạng đó.
          </p>
        </details>
        <label className="block text-sm">
          Yêu cầu thêm (nếu có)
          <textarea
            className={inputClass}
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
          />
        </label>
        <p className="text-xs">
          AI có thể sai. Giáo viên kiểm tra câu hỏi, đáp án và nguồn trước khi sử dụng.
        </p>
        {isLoading && (
          <p className="text-xs">
            Có thể đóng để ngừng chờ. Yêu cầu đã gửi có thể vẫn được nhà cung cấp xử lý và tính lượt.
          </p>
        )}
        {error && (
          <p role="alert" className="text-red-600 text-sm">
            {error}
          </p>
        )}
        {proposal && (
          <section className="border rounded-xl p-3 space-y-3 text-sm" aria-label="Đề xuất bản nháp AI">
            <p>
              Đã nhận {proposal.exam.questions.length} câu.{' '}
              {appendQuestions
                ? 'Các câu hiện tại được giữ nguyên; câu mới được thêm vào vị trí đã chọn.'
                : replacesDocument
                  ? 'Chưa thay đề hiện tại. Khi áp dụng, câu hỏi, ngữ liệu và cấu trúc phần được thay bằng bản mới; tên đề, trường, năm học và ghi chú của bạn được giữ.'
                  : 'Xem trước rồi tạo đề mới; các đề đã có trong kho được giữ nguyên.'}
            </p>
            <div className="max-h-64 overflow-auto space-y-2">
              {proposal.exam.questions.map((q, index) => (
                <details key={q.id}>
                  <summary>
                    {index + 1}. {q.content.slice(0, 120)}
                  </summary>
                  <div className="space-y-2 p-2">
                    <MathRenderer content={q.content} />
                    {q.choices?.map((choice) => (
                      <p key={choice.key}>
                        {choice.key}. {choice.text}
                      </p>
                    ))}
                    {q.sub_questions?.map((item) => (
                      <p key={item.key}>
                        {item.key}. {item.content}
                        {item.isCorrect === undefined ? '' : item.isCorrect ? ' — Đúng' : ' — Sai'}
                      </p>
                    ))}
                    {q.correct_answer && <p>Đáp án: {q.correct_answer}</p>}
                    {q.accepted_answers?.length ? <p>Chấp nhận: {q.accepted_answers.join('; ')}</p> : null}
                    {q.matchingPairs?.map((pair) => (
                      <p key={pair.id}>
                        {pair.left} → {pair.right}
                      </p>
                    ))}
                    {q.correctOrder?.map((item, order) => (
                      <p key={order}>
                        {order + 1}. {item}
                      </p>
                    ))}
                    {q.step_by_step_solution && <MathRenderer content={q.step_by_step_solution} />}
                    {q.rubric?.map((criterion, criterionIndex) => (
                      <p key={criterionIndex}>
                        {criterion.criterion}: {criterion.maxPoints} điểm
                      </p>
                    ))}
                  </div>
                </details>
              ))}
            </div>
            {documentStamp !== proposal.baseStamp && (
              <p role="alert">Đề đã đổi trong khi AI soạn; hãy tải bản đề xuất để giữ lại hoặc soạn lại.</p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                className="app-button-primary text-white rounded p-2 disabled:opacity-50"
                disabled={documentStamp !== proposal.baseStamp}
                onClick={async () => {
                  try {
                    const applied = await onExamGenerated(proposal.exam, proposal.baseStamp);
                    if (applied === false)
                      throw Error('Chưa thêm được câu. Đề xuất vẫn được giữ để bạn tải về hoặc thử lại.');
                    close();
                  } catch (cause) {
                    setError(cause instanceof Error ? cause.message : 'Chưa áp dụng được bản nháp');
                  }
                }}
              >
                {appendQuestions
                  ? 'Thêm vào đề'
                  : replacesDocument
                    ? 'Áp dụng thay câu trong đề'
                    : 'Tạo đề mới từ đề xuất'}
              </button>
              <button
                type="button"
                className="underline"
                onClick={() => {
                  const url = URL.createObjectURL(
                    new Blob([JSON.stringify(proposal.exam, null, 2)], { type: 'application/json' }),
                  );
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'ExamCraft-de-xuat-AI.json';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Tải bản đề xuất JSON
              </button>
              <button type="button" onClick={() => setProposal(null)}>
                Bỏ đề xuất
              </button>
            </div>
          </section>
        )}
        <footer className="flex justify-between items-center">
          <span>{total} câu</span>
          <button
            disabled={isLoading || total < 1}
            onClick={generate}
            className="flex items-center gap-2 rounded-lg px-5 py-3 app-button-primary text-white disabled:opacity-50"
          >
            <Sparkles size={16} />
            {isLoading ? 'Đang soạn…' : 'Tạo bản nháp'}
          </button>
        </footer>
      </section>
    </div>
  );
};
