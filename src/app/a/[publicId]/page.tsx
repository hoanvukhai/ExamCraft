'use client';

import React, { useState, useEffect, useCallback, useRef, use } from 'react';
import { MathRenderer } from '@/components/MathRenderer';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Trophy,
  Send,
  Save,
  User,
  ChevronRight,
  ShieldAlert,
  ArrowLeft,
  Award,
} from 'lucide-react';

interface Question {
  id: string;
  sectionId?: string;
  position: number;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE_GROUP' | 'SHORT_ANSWER' | 'ESSAY';
  difficulty?: string;
  content: string;
  figures?: Array<{ url: string; caption?: string }>;
  payload?: {
    choices?: Array<{ key: string; text: string }>;
    sub_questions?: Array<{ key: string; content: string }>;
  };
  points?: number;
}

interface Section {
  id: string;
  title: string;
  type: string;
  description?: string;
  pointsPerQuestion?: number;
}

interface AssignmentData {
  id: string;
  title: string;
  publicId: string;
  mode: string;
  identityMode: 'PICK_FROM_LIST' | 'FREE_NAME';
  durationMinutes?: number;
  maxAttempts: number;
  opensAt?: string;
  closesAt?: string;
  requirePin: boolean;
  leaderboard: string;
  group?: {
    id: string;
    name: string;
    students: Array<{ id: string; displayName: string }>;
  } | null;
}

interface AttemptData {
  id: string;
  attemptNo: number;
  startedAt: string;
  deadlineAt?: string;
  draft: Record<string, any>;
  studentName: string;
}

interface SubmitResult {
  score: number | null;
  maxScore: number | null;
  submittedAt: string;
  studentName: string;
  leaderboard?: {
    top: Array<{ rank: number; name: string; score: number }>;
    me: { rank: number; total: number; score: number };
  } | null;
  solutions?: Array<{
    id: string;
    correct?: string;
    sub_questions?: Array<{ key: string; isCorrect: boolean; explanation?: string }>;
    solution?: string;
  }> | null;
  message: string;
}

function StudentExamContent({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = use(params);

  // Trạng thái chung
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignment, setAssignment] = useState<AssignmentData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sections, setSections] = useState<Section[]>([]);

  // Trạng thái vào thi
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [freeName, setFreeName] = useState('');
  const [starting, setStarting] = useState(false);

  // Trạng thái đang làm bài
  const [attempt, setAttempt] = useState<AttemptData | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Trạng thái kết quả sau khi nộp
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);

  const answersRef = useRef(answers);
  answersRef.current = answers;

  // 1. Tải thông tin đề bài từ Server
  useEffect(() => {
    async function loadAssignment() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/public/assignments/${publicId}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Không thể tải đề thi.');
          return;
        }

        setAssignment(data.assignment);
        setQuestions(data.exam?.questions || []);
        setSections(data.exam?.sections || []);
      } catch (err) {
        console.error(err);
        setError('Lỗi kết nối máy chủ, vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    }
    loadAssignment();
  }, [publicId]);

  // 2. Bắt đầu hoặc tiếp tục làm bài
  const handleStartExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignment) return;

    if (assignment.identityMode === 'PICK_FROM_LIST' && !selectedStudentId) {
      alert('Vui lòng chọn tên của em trong danh sách!');
      return;
    }
    if (assignment.identityMode === 'FREE_NAME' && !freeName.trim()) {
      alert('Vui lòng nhập họ và tên của em!');
      return;
    }

    try {
      setStarting(true);
      const res = await fetch(`/api/public/assignments/${publicId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: assignment.identityMode === 'PICK_FROM_LIST' ? selectedStudentId : undefined,
          freeName: assignment.identityMode === 'FREE_NAME' ? freeName.trim() : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Không thể bắt đầu làm bài.');
        return;
      }

      setAttempt(data.attempt);
      setAnswers(data.attempt.draft || {});

      // Tính toán thời gian đếm ngược
      if (data.attempt.deadlineAt) {
        const deadline = new Date(data.attempt.deadlineAt).getTime();
        const now = Date.now();
        const seconds = Math.max(0, Math.floor((deadline - now) / 1000));
        setTimeLeft(seconds);
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối, vui lòng thử lại.');
    } finally {
      setStarting(false);
    }
  };

  // 3. Tự động lưu nháp (Auto-Save Draft)
  const saveDraft = useCallback(
    async (currentAnswers: Record<string, any>) => {
      if (!attempt?.id) return;
      try {
        setIsSaving(true);
        await fetch(`/api/public/attempts/${attempt.id}/draft`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ draft: currentAnswers }),
        });
        const now = new Date();
        setLastSaved(
          `${now.getHours().toString().padStart(2, '0')}:${now
            .getMinutes()
            .toString()
            .padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
        );
      } catch (err) {
        console.error('Lỗi tự động lưu nháp:', err);
      } finally {
        setIsSaving(false);
      }
    },
    [attempt?.id]
  );

  // Định kỳ tự lưu nháp mỗi 15 giây
  useEffect(() => {
    if (!attempt || submitResult) return;
    const interval = setInterval(() => {
      saveDraft(answersRef.current);
    }, 15000);
    return () => clearInterval(interval);
  }, [attempt, submitResult, saveDraft]);

  // Cảnh báo khi người dùng định đóng tab hoặc tải lại trang
  useEffect(() => {
    if (!attempt || submitResult) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Bài thi đang diễn ra, em có chắc muốn rời khỏi trang?';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [attempt, submitResult]);

  // 4. Đồng hồ đếm ngược (Countdown Timer)
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || submitResult) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          // Hết giờ -> Tự động nộp bài
          handleFinalSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, submitResult]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 5. Cập nhật câu trả lời của học sinh
  const handleSelectChoice = (questionId: string, choiceKey: string) => {
    setAnswers((prev) => {
      const next = { ...prev, [questionId]: choiceKey };
      return next;
    });
  };

  const handleSelectTrueFalse = (questionId: string, subKey: string, value: boolean) => {
    setAnswers((prev) => {
      const currentGroup = typeof prev[questionId] === 'object' && prev[questionId] !== null ? prev[questionId] : {};
      return {
        ...prev,
        [questionId]: {
          ...currentGroup,
          [subKey]: value,
        },
      };
    });
  };

  const handleShortAnswerChange = (questionId: string, val: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: val,
    }));
  };

  // 6. Nộp bài thi
  const handleFinalSubmit = async (isAuto = false) => {
    if (!attempt?.id || submitting) return;

    try {
      setSubmitting(true);
      setShowSubmitModal(false);

      const res = await fetch(`/api/public/attempts/${attempt.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: answersRef.current }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Lỗi khi nộp bài.');
        return;
      }

      setSubmitResult(data);
      if (isAuto) {
        alert('Đã hết giờ làm bài! Bài thi của em đã được nộp tự động.');
      }
    } catch (err) {
      console.error(err);
      alert('Không thể kết nối đến máy chủ để nộp bài. Vui lòng kiểm tra mạng!');
    } finally {
      setSubmitting(false);
    }
  };

  // Tính số câu đã hoàn thành
  const answeredCount = questions.reduce((acc, q) => {
    const ans = answers[q.id];
    if (!ans) return acc;
    if (q.type === 'MULTIPLE_CHOICE' && typeof ans === 'string' && ans.trim()) return acc + 1;
    if (q.type === 'SHORT_ANSWER' && typeof ans === 'string' && ans.trim()) return acc + 1;
    if (q.type === 'TRUE_FALSE_GROUP' && typeof ans === 'object') {
      const keys = Object.keys(ans);
      if (keys.length > 0) return acc + 1;
    }
    return acc;
  }, 0);

  // MÀN HÌNH 1: ĐANG TẢI HOẶC LỖI
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-300 font-medium">Đang tải phòng thi trực tuyến...</p>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 text-center shadow-2xl">
          <ShieldAlert className="w-14 h-14 text-rose-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-100 mb-2">Không thể truy cập bài thi</h2>
          <p className="text-slate-300 text-sm mb-6 leading-relaxed">{error}</p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-slate-200 text-sm font-medium transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Về trang chủ
          </a>
        </div>
      </div>
    );
  }

  // MÀN HÌNH 3: KẾT QUẢ SAU KHI NỘP BÀI THÀNH CÔNG
  if (submitResult) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Card điểm số chính */}
          <div className="bg-gradient-to-b from-slate-900 to-slate-900/90 border border-emerald-500/30 rounded-3xl p-8 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/40">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h1 className="text-2xl font-black text-white mb-2">{assignment.title}</h1>
            <p className="text-slate-300 text-sm mb-6">
              Học sinh: <span className="font-semibold text-emerald-400">{submitResult.studentName}</span>
            </p>

            {submitResult.score !== null ? (
              <div className="inline-block bg-slate-800/80 border border-emerald-500/40 rounded-2xl px-8 py-5 my-2 shadow-inner">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block mb-1">
                  Điểm số đạt được
                </span>
                <div className="text-5xl font-black text-emerald-400 tracking-tight">
                  {submitResult.score}
                  <span className="text-2xl text-slate-400 font-normal ml-1">/ {submitResult.maxScore || 10}</span>
                </div>
              </div>
            ) : (
              <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 text-sm text-slate-300">
                Bài làm của em đã được nộp an toàn. Điểm số sẽ được giáo viên công bố sau khi kết thúc đợt thi.
              </div>
            )}

            <p className="text-xs text-slate-400 mt-4">
              Nộp lúc: {new Date(submitResult.submittedAt).toLocaleTimeString('vi-VN')} ngày{' '}
              {new Date(submitResult.submittedAt).toLocaleDateString('vi-VN')}
            </p>
          </div>

          {/* Bảng xếp hạng Top & Me */}
          {submitResult.leaderboard && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white">Bảng xếp hạng lớp</h3>
              </div>

              <div className="space-y-2 mb-4">
                {submitResult.leaderboard.top.map((item) => (
                  <div
                    key={item.rank}
                    className="flex items-center justify-between px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                          item.rank === 1
                            ? 'bg-amber-400 text-slate-950'
                            : item.rank === 2
                            ? 'bg-slate-300 text-slate-950'
                            : item.rank === 3
                            ? 'bg-amber-700 text-white'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {item.rank}
                      </span>
                      <span className="text-sm font-medium text-slate-200">{item.name}</span>
                    </div>
                    <span className="text-sm font-bold text-emerald-400">{item.score} đ</span>
                  </div>
                ))}
              </div>

              {/* Dòng vị trí riêng của chính học sinh (bảo mật không lộ cả lớp) */}
              <div className="flex items-center justify-between px-4 py-3 bg-indigo-950/40 border border-indigo-500/40 rounded-xl">
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-indigo-400" />
                  <div>
                    <span className="text-xs text-indigo-300 font-semibold block">Vị trí của em</span>
                    <span className="text-sm font-bold text-white">
                      Hạng #{submitResult.leaderboard.me.rank} / {submitResult.leaderboard.me.total} bạn
                    </span>
                  </div>
                </div>
                <span className="text-base font-black text-indigo-400">
                  {submitResult.leaderboard.me.score} đ
                </span>
              </div>
            </div>
          )}

          {/* Chi tiết lời giải và đáp án (nếu giáo viên cho phép xem ngay) */}
          {submitResult.solutions && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-400" /> Đáp án & Lời giải chi tiết
              </h3>

              <div className="space-y-6">
                {questions.map((q, idx) => {
                  const sol = submitResult.solutions?.find((s) => s.id === q.id);
                  const studentAns = answers[q.id];

                  return (
                    <div key={q.id} className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold px-2 py-1 bg-slate-700 text-indigo-300 rounded">
                          Câu {idx + 1}
                        </span>
                        <span className="text-xs text-slate-400">{q.points || 0.25} điểm</span>
                      </div>

                      <div className="text-sm text-slate-200">
                        <MathRenderer content={q.content} />
                      </div>

                      <div className="text-xs space-y-1.5 pt-2 border-t border-slate-700">
                        <div>
                          <span className="text-slate-400">Đáp án em chọn: </span>
                          <span className="font-semibold text-slate-200">
                            {typeof studentAns === 'object' ? JSON.stringify(studentAns) : String(studentAns || 'Chưa trả lời')}
                          </span>
                        </div>
                        {sol?.correct && (
                          <div>
                            <span className="text-emerald-400">Đáp án đúng: </span>
                            <span className="font-bold text-emerald-400">{sol.correct}</span>
                          </div>
                        )}
                        {sol?.solution && (
                          <div className="p-3 bg-slate-900/80 rounded-lg text-slate-300 mt-2">
                            <span className="text-indigo-400 font-semibold block mb-1">Hướng dẫn giải:</span>
                            <MathRenderer content={sol.solution} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // MÀN HÌNH 2: FORM ĐIỀN TÊN TRƯỚC KHI BẮT ĐẦU (ZERO-ACCOUNT LOGIN)
  if (!attempt) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mb-5 border border-indigo-500/30">
            <User className="w-6 h-6" />
          </div>

          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
            {assignment.group?.name || 'Phòng thi trực tuyến'}
          </span>
          <h1 className="text-2xl font-black text-white mt-1 mb-2 leading-tight">{assignment.title}</h1>

          <div className="flex items-center gap-4 text-xs text-slate-400 mb-6 pb-6 border-b border-slate-800">
            {assignment.durationMinutes && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" /> {assignment.durationMinutes} phút
              </span>
            )}
            <span>Số câu: {questions.length} câu</span>
            <span>Tối đa: {assignment.maxAttempts} lượt làm</span>
          </div>

          <form onSubmit={handleStartExam} className="space-y-5">
            {assignment.identityMode === 'PICK_FROM_LIST' && assignment.group?.students ? (
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Chọn tên của em trong danh sách lớp:
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                  required
                >
                  <option value="">-- Chọn họ và tên --</option>
                  {assignment.group.students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.displayName}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Nhập họ và tên của em:
                </label>
                <input
                  type="text"
                  value={freeName}
                  onChange={(e) => setFreeName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={starting}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all"
            >
              {starting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Bắt đầu làm bài <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // MÀN HÌNH 4: PHÒNG THI ĐANG DIỄN RA (EXAM ROOM)
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Bar Cố Định */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-sm md:text-base font-bold text-white truncate max-w-xs md:max-w-md">
              {assignment.title}
            </h1>
            <p className="text-xs text-slate-400">
              Học sinh: <span className="text-indigo-400 font-semibold">{attempt.studentName}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Đồng hồ đếm ngược */}
            {timeLeft !== null && (
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-sm font-bold border ${
                  timeLeft <= 300
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                    : 'bg-slate-800 text-indigo-400 border-slate-700'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>{formatTimer(timeLeft)}</span>
              </div>
            )}

            {/* Trạng thái lưu nháp */}
            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400">
              {isSaving ? (
                <>
                  <Save className="w-3.5 h-3.5 animate-spin text-amber-400" /> Đang lưu...
                </>
              ) : lastSaved ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Lưu nháp {lastSaved}
                </>
              ) : null}
            </div>

            {/* Nút nộp bài */}
            <button
              onClick={() => setShowSubmitModal(true)}
              disabled={submitting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs md:text-sm rounded-xl shadow-md shadow-emerald-600/30 flex items-center gap-1.5 transition-all"
            >
              <Send className="w-4 h-4" /> Nộp bài
            </button>
          </div>
        </div>
      </header>

      {/* Thân bài thi */}
      <main className="max-w-6xl mx-auto w-full p-4 md:p-6 flex-1 flex flex-col md:flex-row gap-6">
        {/* Danh sách câu hỏi */}
        <div className="flex-1 space-y-6">
          {questions.map((q, index) => {
            const currentAns = answers[q.id];

            return (
              <div
                key={q.id}
                id={`q-${index + 1}`}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-md transition-all hover:border-slate-700"
              >
                {/* Header câu hỏi */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      {q.type === 'MULTIPLE_CHOICE'
                        ? 'Trắc nghiệm 4 lựa chọn'
                        : q.type === 'TRUE_FALSE_GROUP'
                        ? 'Đúng / Sai'
                        : q.type === 'SHORT_ANSWER'
                        ? 'Trả lời ngắn'
                        : 'Câu hỏi'}
                    </span>
                  </div>
                  {q.points && <span className="text-xs text-slate-400 font-medium">{q.points} điểm</span>}
                </div>

                {/* Nội dung câu hỏi KaTeX */}
                <div className="text-sm md:text-base text-slate-100 leading-relaxed mb-4">
                  <MathRenderer content={q.content} />
                </div>

                {/* Hình ảnh minh họa (nếu có) */}
                {q.figures && q.figures.length > 0 && (
                  <div className="my-4 flex flex-wrap gap-4">
                    {q.figures.map((fig, fIdx) => (
                      <div key={fIdx} className="bg-slate-800 p-2 rounded-xl border border-slate-700">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={fig.url} alt={fig.caption || `Hình ${fIdx + 1}`} className="max-h-60 rounded-lg" />
                        {fig.caption && <p className="text-xs text-slate-400 text-center mt-1">{fig.caption}</p>}
                      </div>
                    ))}
                  </div>
                )}

                {/* DẠNG 1: TRẮC NGHIỆM MULTIPLE_CHOICE */}
                {q.type === 'MULTIPLE_CHOICE' && q.payload?.choices && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                    {q.payload.choices.map((c) => {
                      const isSelected = String(currentAns || '').trim().toUpperCase() === c.key.toUpperCase();
                      return (
                        <button
                          key={c.key}
                          type="button"
                          onClick={() => handleSelectChoice(q.id, c.key)}
                          className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'bg-indigo-600/20 border-indigo-500 text-white ring-1 ring-indigo-500'
                              : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                          }`}
                        >
                          <span
                            className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                              isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'
                            }`}
                          >
                            {c.key}
                          </span>
                          <div className="text-sm">
                            <MathRenderer content={c.text} inline />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* DẠNG 2: ĐÚNG / SAI (TRUE_FALSE_GROUP) */}
                {q.type === 'TRUE_FALSE_GROUP' && q.payload?.sub_questions && (
                  <div className="space-y-3 mt-4">
                    {q.payload.sub_questions.map((sub) => {
                      const groupVal = typeof currentAns === 'object' && currentAns !== null ? currentAns : {};
                      const userVal = groupVal[sub.key];

                      return (
                        <div
                          key={sub.key}
                          className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 bg-slate-800/40 border border-slate-700/60 rounded-xl"
                        >
                          <div className="flex items-start gap-2.5">
                            <span className="w-5 h-5 rounded bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                              {sub.key}
                            </span>
                            <div className="text-sm text-slate-200">
                              <MathRenderer content={sub.content} inline />
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                            <button
                              type="button"
                              onClick={() => handleSelectTrueFalse(q.id, sub.key, true)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                userVal === true
                                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                              }`}
                            >
                              ĐÚNG
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSelectTrueFalse(q.id, sub.key, false)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                userVal === false
                                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
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

                {/* DẠNG 3: TRẢ LỜI NGẮN (SHORT_ANSWER) */}
                {q.type === 'SHORT_ANSWER' && (
                  <div className="mt-4">
                    <label className="block text-xs text-slate-400 mb-2">Điền câu trả lời hoặc số:</label>
                    <input
                      type="text"
                      value={typeof currentAns === 'string' ? currentAns : ''}
                      onChange={(e) => handleShortAnswerChange(q.id, e.target.value)}
                      placeholder="Ví dụ: 3.14 hoặc 1/2..."
                      className="w-full md:w-80 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Thanh Navigator Cố Định bên Phải */}
        <aside className="w-full md:w-72 shrink-0 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sticky top-20 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Bảng câu hỏi</h3>
              <span className="text-xs font-semibold text-emerald-400">
                {answeredCount} / {questions.length} câu
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2 max-h-80 overflow-y-auto pr-1">
              {questions.map((q, idx) => {
                const ans = answers[q.id];
                let isFilled = false;
                if (q.type === 'MULTIPLE_CHOICE' && ans) isFilled = true;
                if (q.type === 'SHORT_ANSWER' && ans) isFilled = true;
                if (q.type === 'TRUE_FALSE_GROUP' && typeof ans === 'object' && Object.keys(ans).length > 0)
                  isFilled = true;

                return (
                  <a
                    key={q.id}
                    href={`#q-${idx + 1}`}
                    className={`h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                      isFilled
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {idx + 1}
                  </a>
                );
              })}
            </div>

            <div className="mt-5 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowSubmitModal(true)}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all"
              >
                <Send className="w-4 h-4" /> Nộp bài thi
              </button>
            </div>
          </div>
        </aside>
      </main>

      {/* Modal Xác Nhận Nộp Bài */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4 border border-amber-500/30">
              <AlertCircle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-white mb-2">Xác nhận nộp bài thi?</h3>
            <p className="text-slate-300 text-sm mb-4 leading-relaxed">
              Em đã hoàn thành <span className="font-bold text-white">{answeredCount}</span> trên tổng số{' '}
              <span className="font-bold text-white">{questions.length}</span> câu hỏi.
              {answeredCount < questions.length && (
                <span className="text-amber-400 block mt-1">
                  Vẫn còn {questions.length - answeredCount} câu chưa làm xong!
                </span>
              )}
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition-all"
              >
                Làm tiếp
              </button>
              <button
                type="button"
                onClick={() => handleFinalSubmit(false)}
                disabled={submitting}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-1.5"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Nộp bài ngay'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudentExamPage(props: { params: Promise<{ publicId: string }> }) {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-400 font-medium text-sm">Đang tải phòng thi trực tuyến...</p>
        </div>
      }
    >
      <StudentExamContent {...props} />
    </React.Suspense>
  );
}
