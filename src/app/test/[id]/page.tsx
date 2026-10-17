'use client';

import React, { useState, useEffect, use } from 'react';
import { Exam, Question } from '@/types/exam';
import { MathRenderer } from '@/components/MathRenderer';
import { FunctionPlot } from '@/components/FunctionPlot';
import { VariationTable } from '@/components/VariationTable';
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  GraduationCap, 
  HelpCircle, 
  Award, 
  ChevronRight,
  RotateCcw,
  BookOpen,
  ArrowRight
} from 'lucide-react';

interface StudentTestPageProps {
  params: Promise<{ id: string }>;
}

function StudentTestContent({ params }: StudentTestPageProps) {
  const resolvedParams = use(params);
  const examId = resolvedParams.id;

  const [exam, setExam] = useState<Exam | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Thông tin học sinh
  const [studentName, setStudentName] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [isStarted, setIsStarted] = useState(false);

  // Thời gian làm bài
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(45 * 60);
  const [startTime, setStartTime] = useState<string>('');

  // Câu trả lời của học sinh
  // multiple_choice: { [qId]: 'A' | 'B' | 'C' | 'D' }
  // true_false_group: { [qId]: { a: true, b: false, ... } }
  // short_answer: { [qId]: string }
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Kết quả sau khi nộp
  const [submissionResult, setSubmissionResult] = useState<any | null>(null);

  // Tải đề thi từ server
  useEffect(() => {
    async function fetchExam() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/cloud/exams/${examId}`);
        const data = await res.json();
        if (data.success && data.exam) {
          setExam(data.exam);
          const duration = data.exam.metadata?.durationMinutes || 45;
          setTimeLeftSeconds(duration * 60);
        } else {
          setFetchError(data.error || 'Không tìm thấy đề thi trực tuyến này.');
        }
      } catch (err: any) {
        setFetchError('Lỗi kết nối máy chủ. Vui lòng tải lại trang.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchExam();
  }, [examId]);

  // Bộ đếm ngược thời gian làm bài
  useEffect(() => {
    if (!isStarted || submissionResult) return;

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Hết giờ -> tự động nộp bài
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isStarted, submissionResult]);

  const handleStartExam = () => {
    if (!studentName.trim()) {
      alert('Vui lòng nhập Họ và Tên của em để vào thi.');
      return;
    }
    setIsStarted(true);
    setStartTime(new Date().toISOString());
  };

  const handleSelectChoice = (questionId: string, choiceKey: string) => {
    if (submissionResult) return;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: choiceKey,
    }));
  };

  const handleToggleSubQuestion = (questionId: string, subKey: string, value: boolean) => {
    if (submissionResult) return;
    setAnswers((prev) => {
      const current = prev[questionId] || {};
      return {
        ...prev,
        [questionId]: {
          ...current,
          [subKey]: value,
        },
      };
    });
  };

  const handleShortAnswerChange = (questionId: string, value: string) => {
    if (submissionResult) return;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  // Nộp bài thi
  const handleSubmitExam = async () => {
    if (!exam || isSubmitting) return;

    setIsSubmitting(true);
    setShowConfirmModal(false);

    try {
      const durationSeconds = exam.metadata.durationMinutes * 60 - timeLeftSeconds;
      const res = await fetch(`/api/cloud/exams/${examId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName,
          studentClass,
          schoolName,
          startedAt: startTime,
          durationSeconds: Math.max(1, durationSeconds),
          answers,
        }),
      });

      const data = await res.json();
      if (data.success && data.grading) {
        setSubmissionResult(data.grading);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        alert(data.error || 'Có lỗi xảy ra khi nộp bài. Vui lòng bấm thử lại.');
      }
    } catch {
      alert('Không thể kết nối máy chủ để nộp bài.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Định dạng thời gian MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Đếm số câu đã trả lời
  const answeredCount = exam
    ? exam.questions.filter((q) => {
        const a = answers[q.id];
        if (!a) return false;
        if (q.type === 'multiple_choice') return typeof a === 'string';
        if (q.type === 'true_false_group') return typeof a === 'object' && Object.keys(a).length > 0;
        if (q.type === 'short_answer') return typeof a === 'string' && a.trim() !== '';
        return true;
      }).length
    : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-700">Đang chuẩn bị đề thi trực tuyến...</p>
      </div>
    );
  }

  if (fetchError || !exam) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-slate-200">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900 mb-2">Không thể mở phòng thi</h2>
          <p className="text-xs text-slate-600 mb-6">{fetchError}</p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700"
          >
            Quay về trang chủ
          </a>
        </div>
      </div>
    );
  }

  // 1. MÀN HÌNH ĐĂNG NHẬP / VÀO THI
  if (!isStarted) {
    return (
      <div className="min-h-screen bg-linear-to-br from-indigo-900 via-slate-900 to-indigo-950 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-lg w-full border border-indigo-100">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <GraduationCap className="w-8 h-8" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-100 text-indigo-800">
              Phòng Thi Trực Tuyến GDPT 2018
            </span>
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-3 leading-snug">
              {exam.metadata.title}
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Môn: {exam.metadata.subject.toUpperCase()} • Khối: {exam.metadata.grade} • Thời gian: {exam.metadata.durationMinutes} phút
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Họ và Tên học sinh <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Ví dụ: Nguyễn Văn An"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Lớp</label>
                <input
                  type="text"
                  value={studentClass}
                  onChange={(e) => setStudentClass(e.target.value)}
                  placeholder="Ví dụ: 12A1"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Trường</label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder={exam.metadata.schoolName || 'Tên trường'}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-600"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 mb-6 text-xs text-slate-600 space-y-2">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>Quy chế & Lưu ý phòng thi:</span>
            </div>
            <p>• Đề thi gồm <strong>{exam.questions.length} câu hỏi</strong> trắc nghiệm và trả lời ngắn.</p>
            <p>• Đồng hồ đếm ngược sẽ bắt đầu chạy ngay khi bấm vào thi.</p>
            <p>• Hệ thống tự động chấm điểm và thông báo kết quả ngay sau khi nộp bài.</p>
          </div>

          <button
            onClick={handleStartExam}
            disabled={!studentName.trim()}
            className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            <span>BẮT ĐẦU LÀM BÀI THI</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // 2. MÀN HÌNH KẾT QUẢ SAU KHI NỘP BÀI (RESULT DASHBOARD)
  if (submissionResult) {
    const percent = Math.round((submissionResult.totalScore / (submissionResult.maxScore || 10)) * 100);
    const isPass = percent >= 50;

    return (
      <div className="min-h-screen bg-slate-50 py-8 px-4 font-sans">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Card Tổng kết điểm số */}
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-8 text-center relative overflow-hidden">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Award className="w-9 h-9" />
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-1">
              CHÚC MỪNG EM ĐÃ HOÀN THÀNH BÀI THI!
            </h2>
            <p className="text-xs text-slate-500 font-medium mb-6">
              Học sinh: <strong className="text-slate-800">{studentName}</strong> • Lớp: <strong className="text-slate-800">{studentClass || 'Tự do'}</strong>
            </p>

            <div className="inline-flex items-baseline gap-2 bg-linear-to-br from-indigo-50 to-emerald-50 border border-indigo-200/60 rounded-3xl px-8 py-4 mb-6 shadow-xs">
              <span className="text-4xl sm:text-5xl font-black text-indigo-700">
                {submissionResult.totalScore.toFixed(2).replace('.', ',')}
              </span>
              <span className="text-lg font-bold text-slate-500">
                / {submissionResult.maxScore.toFixed(2).replace('.', ',')} điểm
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto text-center text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-slate-500 font-medium">Phần I (Nhiều LC)</div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">
                  {submissionResult.part1Score.toFixed(2).replace('.', ',')} đ
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-slate-500 font-medium">Phần II (Đúng/Sai)</div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">
                  {submissionResult.part2Score.toFixed(2).replace('.', ',')} đ
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-slate-500 font-medium">Phần III (Điền số)</div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">
                  {submissionResult.part3Score.toFixed(2).replace('.', ',')} đ
                </div>
              </div>
            </div>
          </div>

          {/* Chi tiết từng câu hỏi & Lời giải */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Xem lại đáp án & Hướng dẫn giải chi tiết:</span>
            </h3>

            {submissionResult.details.map((detail: any, i: number) => {
              const q = exam.questions.find((item) => item.id === detail.questionId);
              if (!q) return null;

              return (
                <div
                  key={q.id}
                  className={`bg-white rounded-2xl p-5 border shadow-xs transition-all ${
                    detail.isCorrect
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-bold text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                      Câu {i + 1}
                    </span>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        detail.isCorrect
                          ? 'bg-emerald-100 text-emerald-800'
                          : detail.scoreEarned > 0
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      +{detail.scoreEarned.toFixed(2).replace('.', ',')} / {detail.maxScore.toFixed(2).replace('.', ',')} đ
                    </span>
                  </div>

                  {/* Nội dung câu hỏi */}
                  <div className="text-xs sm:text-sm text-slate-900 font-serif leading-relaxed mb-3">
                    <MathRenderer content={q.content} />
                  </div>

                  {/* Đồ thị / hình ảnh nếu có */}
                  {q.figures && q.figures.length > 0 && (
                    <div className="my-2 space-y-1">
                      {q.figures.map((fig) => {
                        if (fig.kind === 'function_plot') return <FunctionPlot key={fig.id} data={fig.data as any} />;
                        if (fig.kind === 'variation_table') return <VariationTable key={fig.id} data={fig.data as any} />;
                        return null;
                      })}
                    </div>
                  )}

                  {/* Phần giải thích chi tiết */}
                  {detail.explanation && (
                    <div className="mt-3 p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-950 font-serif">
                      <div className="font-bold text-indigo-900 mb-1">Hướng dẫn giải:</div>
                      <MathRenderer content={detail.explanation} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // 3. MÀN HÌNH LÀM BÀI TRỰC TUYẾN CHÍNH (TEST RUNNER)
  return (
    <div className="min-h-screen bg-slate-100 font-sans pb-24">
      {/* Header cố định trên cùng: Tên học sinh, Đồng hồ đếm ngược, Nộp bài */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-2.5 shadow-xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
              {exam.metadata.grade}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 line-clamp-1">{exam.metadata.title}</div>
              <div className="text-[11px] text-slate-500 font-medium">
                Thí sinh: <strong className="text-slate-800">{studentName}</strong> • {studentClass || 'Tự do'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Đồng hồ đếm ngược */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                timeLeftSeconds < 5 * 60
                  ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>{formatTime(timeLeftSeconds)}</span>
            </div>

            {/* Nút Nộp bài */}
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Nộp bài ({answeredCount}/{exam.questions.length})</span>
            </button>
          </div>
        </div>
      </header>

      {/* Thân bài thi */}
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {exam.questions.map((q, idx) => {
          const currentAns = answers[q.id];

          return (
            <div
              key={q.id}
              id={`q_${q.id}`}
              className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4"
            >
              {/* Tiêu đề câu hỏi */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {q.type === 'multiple_choice' && 'Trắc nghiệm 4 lựa chọn (0,25đ)'}
                    {q.type === 'true_false_group' && 'Trắc nghiệm Đúng / Sai 4 ý (1,0đ)'}
                    {q.type === 'short_answer' && 'Trả lời ngắn / Điền số (0,5đ)'}
                  </span>
                </div>
              </div>

              {/* Nội dung câu hỏi */}
              <div className="text-xs sm:text-sm text-slate-900 font-serif leading-relaxed">
                <MathRenderer content={q.content} />
              </div>

              {/* Đồ thị / Bảng biến thiên / Hình ảnh nếu có */}
              {q.figures && q.figures.length > 0 && (
                <div className="my-2 space-y-2">
                  {q.figures.map((fig) => {
                    if (fig.kind === 'function_plot') return <FunctionPlot key={fig.id} data={fig.data as any} />;
                    if (fig.kind === 'variation_table') return <VariationTable key={fig.id} data={fig.data as any} />;
                    if (fig.kind === 'image') {
                      const src = (fig.data as any)?.url || fig.renderedBase64 || (typeof fig.data === 'string' ? fig.data : '');
                      if (src) {
                        return (
                          <div key={fig.id} className="py-2 text-center">
                            <img src={src} alt="Hình vẽ" className="max-h-56 max-w-full rounded-xl mx-auto border" />
                          </div>
                        );
                      }
                    }
                    return null;
                  })}
                </div>
              )}

              {/* Giao diện trả lời cho từng dạng bài */}

              {/* DẠNG 1: TRẮC NGHIỆM 4 LỰA CHỌN */}
              {q.type === 'multiple_choice' && q.choices && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  {q.choices.map((c) => {
                    const isSelected = currentAns === c.key;
                    return (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => handleSelectChoice(q.id, c.key)}
                        className={`p-3 rounded-xl border text-left flex items-baseline gap-2.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-950 font-medium ring-2 ring-indigo-200'
                            : 'bg-slate-50/60 border-slate-200 text-slate-800 hover:bg-slate-100'
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-md font-bold text-xs flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {c.key}
                        </span>
                        <div className="grow text-xs font-serif">
                          <MathRenderer content={c.text} inline />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* DẠNG 2: ĐÚNG / SAI 4 Ý (a, b, c, d) */}
              {q.type === 'true_false_group' && q.sub_questions && (
                <div className="space-y-2 pt-2">
                  {q.sub_questions.map((sub) => {
                    const val = currentAns?.[sub.key];
                    return (
                      <div
                        key={sub.key}
                        className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
                      >
                        <div className="text-xs font-serif text-slate-900 flex items-baseline gap-2">
                          <span className="font-bold text-indigo-700">{sub.key})</span>
                          <MathRenderer content={sub.content} inline />
                        </div>

                        <div className="flex items-center gap-2 shrink-0 ml-auto">
                          <button
                            type="button"
                            onClick={() => handleToggleSubQuestion(q.id, sub.key, true)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              val === true
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            ĐÚNG
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleSubQuestion(q.id, sub.key, false)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              val === false
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            SAI
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* DẠNG 3: TRẢ LỜI NGẮN / ĐIỀN SỐ */}
              {q.type === 'short_answer' && (
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Điền kết quả (số hoặc phân số):
                  </label>
                  <input
                    type="text"
                    value={currentAns || ''}
                    onChange={(e) => handleShortAnswerChange(q.id, e.target.value)}
                    placeholder="Ví dụ: 3 hoặc 1.5 hoặc 3/4"
                    className="w-full sm:w-64 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              )}
            </div>
          );
        })}
      </main>

      {/* Modal Xác nhận nộp bài */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center border border-slate-200 shadow-2xl animate-in zoom-in-95">
            <HelpCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 mb-1">Xác nhận nộp bài thi?</h3>
            <p className="text-xs text-slate-600 mb-4">
              Em đã hoàn thành <strong>{answeredCount}/{exam.questions.length}</strong> câu hỏi.
              {answeredCount < exam.questions.length && (
                <span className="text-rose-600 block mt-1 font-semibold">
                  (Còn {exam.questions.length - answeredCount} câu chưa làm!)
                </span>
              )}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Làm tiếp
              </button>
              <button
                onClick={handleSubmitExam}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Đang nộp...' : 'Nộp ngay'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudentTestPage(props: StudentTestPageProps) {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <StudentTestContent {...props} />
    </React.Suspense>
  );
}
