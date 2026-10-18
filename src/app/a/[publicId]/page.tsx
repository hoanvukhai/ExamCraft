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
      <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#181818] flex flex-col items-center justify-center text-[#202124] dark:text-[#e3e3e3] p-4">
        <div className="w-10 h-10 border-3 border-[#1a73e8] dark:border-[#8ab4f8] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-[#5f6368] dark:text-[#9aa0a6] font-medium text-sm">Đang tải phòng thi trực tuyến...</p>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#181818] flex flex-col items-center justify-center text-[#202124] dark:text-[#e3e3e3] p-4">
        <div className="max-w-md w-full bg-white dark:bg-[#1e1e1e] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl p-8 text-center shadow-xl">
          <ShieldAlert className="w-14 h-14 text-[#c5221f] dark:text-[#f28b82] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#202124] dark:text-[#e3e3e3] mb-2">Không thể truy cập bài thi</h2>
          <p className="text-[#5f6368] dark:text-[#9aa0a6] text-sm mb-6 leading-relaxed">{error}</p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1a73e8] dark:bg-[#8ab4f8] hover:bg-[#1557b0] dark:hover:bg-[#aecbfa] text-white dark:text-[#202124] text-sm font-semibold rounded-full transition-all shadow-xs"
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
      <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#181818] text-[#202124] dark:text-[#e3e3e3] py-10 px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Card điểm số chính */}
          <div className="bg-white dark:bg-[#1e1e1e] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl p-8 text-center relative overflow-hidden shadow-xl">
            <div className="w-16 h-16 bg-[#e6f4ea] dark:bg-[#0f291e] text-[#137333] dark:text-[#5bb98c] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#ceead6] dark:border-[#1e4d38]">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h1 className="text-2xl font-bold text-[#202124] dark:text-[#e3e3e3] mb-2">{assignment.title}</h1>
            <p className="text-[#5f6368] dark:text-[#9aa0a6] text-sm mb-6">
              Học sinh: <span className="font-semibold text-[#137333] dark:text-[#5bb98c]">{submitResult.studentName}</span>
            </p>

            {submitResult.score !== null ? (
              <div className="inline-block bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl px-8 py-5 my-2 shadow-xs">
                <span className="text-xs uppercase tracking-wider text-[#5f6368] dark:text-[#9aa0a6] font-semibold block mb-1">
                  Điểm số đạt được
                </span>
                <div className="text-5xl font-black text-[#137333] dark:text-[#5bb98c] tracking-tight">
                  {submitResult.score}
                  <span className="text-2xl text-[#5f6368] dark:text-[#9aa0a6] font-normal ml-1">/ {submitResult.maxScore || 10}</span>
                </div>
              </div>
            ) : (
              <div className="bg-[#f8f9fa] dark:bg-[#242424] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl p-4 text-sm text-[#5f6368] dark:text-[#9aa0a6]">
                Bài làm của em đã được nộp an toàn. Điểm số sẽ được giáo viên công bố sau khi kết thúc đợt thi.
              </div>
            )}

            <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] mt-4">
              Nộp lúc: {new Date(submitResult.submittedAt).toLocaleTimeString('vi-VN')} ngày{' '}
              {new Date(submitResult.submittedAt).toLocaleDateString('vi-VN')}
            </p>
          </div>

          {/* Bảng xếp hạng Top & Me */}
          {submitResult.leaderboard && (
            <div className="bg-white dark:bg-[#1e1e1e] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl p-6 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-[#b06000] dark:text-[#fdd663]" />
                <h3 className="text-base font-bold text-[#202124] dark:text-[#e3e3e3]">Bảng xếp hạng lớp</h3>
              </div>

              <div className="space-y-2 mb-4">
                {submitResult.leaderboard.top.map((item) => (
                  <div
                    key={item.rank}
                    className="flex items-center justify-between px-4 py-3 bg-[#f8f9fa] dark:bg-[#242424] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                          item.rank === 1
                            ? 'bg-[#fef7e0] text-[#b06000] border border-[#feefc3]'
                            : item.rank === 2
                            ? 'bg-[#f1f3f4] text-[#5f6368] border border-[#dadce0]'
                            : item.rank === 3
                            ? 'bg-[#fce8e6] text-[#c5221f] border border-[#fad2cf]'
                            : 'bg-[#f1f3f4] dark:bg-[#333538] text-[#5f6368] dark:text-[#9aa0a6]'
                        }`}
                      >
                        {item.rank}
                      </span>
                      <span className="text-sm font-medium text-[#202124] dark:text-[#e3e3e3]">{item.name}</span>
                    </div>
                    <span className="text-sm font-bold text-[#137333] dark:text-[#5bb98c]">{item.score} đ</span>
                  </div>
                ))}
              </div>

              {/* Dòng vị trí riêng của chính học sinh */}
              <div className="flex items-center justify-between px-4 py-3 bg-[#e8f0fe] dark:bg-[#1e2a38] border border-[#1a73e8]/30 dark:border-[#8ab4f8]/30 rounded-2xl">
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-[#1a73e8] dark:text-[#8ab4f8]" />
                  <div>
                    <span className="text-xs text-[#1a73e8] dark:text-[#8ab4f8] font-semibold block">Vị trí của em</span>
                    <span className="text-sm font-bold text-[#202124] dark:text-[#e3e3e3]">
                      Hạng #{submitResult.leaderboard.me.rank} / {submitResult.leaderboard.me.total} bạn
                    </span>
                  </div>
                </div>
                <span className="text-base font-bold text-[#1a73e8] dark:text-[#8ab4f8]">
                  {submitResult.leaderboard.me.score} đ
                </span>
              </div>
            </div>
          )}

          {/* Chi tiết lời giải và đáp án */}
          {submitResult.solutions && (
            <div className="bg-white dark:bg-[#1e1e1e] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl p-6 shadow-xs space-y-6">
              <h3 className="text-base font-bold text-[#202124] dark:text-[#e3e3e3] flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#1a73e8] dark:text-[#8ab4f8]" /> Đáp án & Lời giải chi tiết
              </h3>

              <div className="space-y-6">
                {questions.map((q, idx) => {
                  const sol = submitResult.solutions?.find((s) => s.id === q.id);
                  const studentAns = answers[q.id];

                  return (
                    <div key={q.id} className="p-4 bg-[#f8f9fa] dark:bg-[#242424] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold px-2.5 py-1 bg-[#e8f0fe] dark:bg-[#1e2a38] text-[#1a73e8] dark:text-[#8ab4f8] rounded-full">
                          Câu {idx + 1}
                        </span>
                        <span className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">{q.points || 0.25} điểm</span>
                      </div>

                      <div className="text-sm text-[#202124] dark:text-[#e3e3e3]">
                        <MathRenderer content={q.content} />
                      </div>

                      <div className="text-xs space-y-1.5 pt-3 border-t border-[#dadce0] dark:border-[#3c4043]">
                        <div>
                          <span className="text-[#5f6368] dark:text-[#9aa0a6]">Đáp án em chọn: </span>
                          <span className="font-semibold text-[#202124] dark:text-[#e3e3e3]">
                            {typeof studentAns === 'object' ? JSON.stringify(studentAns) : String(studentAns || 'Chưa trả lời')}
                          </span>
                        </div>
                        {sol?.correct && (
                          <div>
                            <span className="text-[#137333] dark:text-[#5bb98c]">Đáp án đúng: </span>
                            <span className="font-bold text-[#137333] dark:text-[#5bb98c]">{sol.correct}</span>
                          </div>
                        )}
                        {sol?.solution && (
                          <div className="p-3 bg-white dark:bg-[#1e1e1e] rounded-xl border border-[#dadce0] dark:border-[#3c4043] text-[#202124] dark:text-[#e3e3e3] mt-2">
                            <span className="text-[#1a73e8] dark:text-[#8ab4f8] font-semibold block mb-1">Hướng dẫn giải:</span>
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

  // MÀN HÌNH 2: FORM ĐIỀN TÊN TRƯỚC KHI BẮT ĐẦU
  if (!attempt) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#181818] flex flex-col items-center justify-center text-[#202124] dark:text-[#e3e3e3] p-4">
        <div className="max-w-md w-full bg-white dark:bg-[#1e1e1e] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl p-8 shadow-xl">
          <div className="w-12 h-12 bg-[#e8f0fe] dark:bg-[#1e2a38] text-[#1a73e8] dark:text-[#8ab4f8] rounded-2xl flex items-center justify-center mb-5 border border-[#1a73e8]/30 dark:border-[#8ab4f8]/30">
            <User className="w-6 h-6" />
          </div>

          <span className="text-xs font-semibold uppercase tracking-wider text-[#1a73e8] dark:text-[#8ab4f8]">
            {assignment.group?.name || 'Phòng thi trực tuyến'}
          </span>
          <h1 className="text-2xl font-bold text-[#202124] dark:text-[#e3e3e3] mt-1 mb-2 leading-tight">{assignment.title}</h1>

          <div className="flex items-center gap-4 text-xs text-[#5f6368] dark:text-[#9aa0a6] mb-6 pb-6 border-b border-[#dadce0] dark:border-[#3c4043]">
            {assignment.durationMinutes && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#5f6368] dark:text-[#9aa0a6]" /> {assignment.durationMinutes} phút
              </span>
            )}
            <span>Số câu: {questions.length} câu</span>
            <span>Tối đa: {assignment.maxAttempts} lượt làm</span>
          </div>

          <form onSubmit={handleStartExam} className="space-y-5">
            {assignment.identityMode === 'PICK_FROM_LIST' && assignment.group?.students ? (
              <div>
                <label className="block text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider mb-2">
                  Chọn tên của em trong danh sách lớp:
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-full px-4 py-2.5 text-sm text-[#202124] dark:text-[#e3e3e3] focus:outline-none focus:border-[#1a73e8] dark:focus:border-[#8ab4f8]"
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
                <label className="block text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider mb-2">
                  Nhập họ và tên của em:
                </label>
                <input
                  type="text"
                  value={freeName}
                  onChange={(e) => setFreeName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  className="w-full bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-full px-4 py-2.5 text-sm text-[#202124] dark:text-[#e3e3e3] placeholder-[#5f6368] dark:placeholder-[#9aa0a6] focus:outline-none focus:border-[#1a73e8] dark:focus:border-[#8ab4f8]"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={starting}
              className="w-full py-3 bg-[#1a73e8] hover:bg-[#1557b0] dark:bg-[#8ab4f8] dark:hover:bg-[#aecbfa] disabled:opacity-50 text-white dark:text-[#202124] font-semibold text-sm rounded-full shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {starting ? (
                <div className="w-5 h-5 border-2 border-white dark:border-[#202124] border-t-transparent rounded-full animate-spin" />
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
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#181818] text-[#202124] dark:text-[#e3e3e3] flex flex-col">
      {/* Top Bar Cố Định */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#1e1e1e]/95 backdrop-blur-md border-b border-[#dadce0] dark:border-[#3c4043] px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-sm md:text-base font-bold text-[#202124] dark:text-[#e3e3e3] truncate max-w-xs md:max-w-md">
              {assignment.title}
            </h1>
            <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">
              Học sinh: <span className="text-[#1a73e8] dark:text-[#8ab4f8] font-semibold">{attempt.studentName}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Đồng hồ đếm ngược */}
            {timeLeft !== null && (
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-sm font-bold border ${
                  timeLeft <= 300
                    ? 'bg-[#fce8e6] dark:bg-[#371918] text-[#c5221f] dark:text-[#f28b82] border-[#fad2cf] dark:border-[#5c2523] animate-pulse'
                    : 'bg-[#f1f3f4] dark:bg-[#282828] text-[#1a73e8] dark:text-[#8ab4f8] border-[#dadce0] dark:border-[#3c4043]'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>{formatTimer(timeLeft)}</span>
              </div>
            )}

            {/* Trạng thái lưu nháp */}
            <div className="hidden md:flex items-center gap-1.5 text-xs text-[#5f6368] dark:text-[#9aa0a6]">
              {isSaving ? (
                <>
                  <Save className="w-3.5 h-3.5 animate-spin text-[#b06000] dark:text-[#fdd663]" /> Đang lưu...
                </>
              ) : lastSaved ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#137333] dark:text-[#5bb98c]" /> Lưu nháp {lastSaved}
                </>
              ) : null}
            </div>

            {/* Nút nộp bài */}
            <button
              onClick={() => setShowSubmitModal(true)}
              disabled={submitting}
              className="px-4 py-2 bg-[#137333] hover:bg-[#0f5c29] text-white font-semibold text-xs md:text-sm rounded-full shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
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
                className="bg-white dark:bg-[#1e1e1e] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl p-5 md:p-6 shadow-xs transition-all hover:border-[#bdc1c6] dark:hover:border-[#5f6368]"
              >
                {/* Header câu hỏi */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-[#e8f0fe] dark:bg-[#1e2a38] border border-[#1a73e8]/30 dark:border-[#8ab4f8]/30 text-[#1a73e8] dark:text-[#8ab4f8] flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </span>
                    <span className="text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider">
                      {q.type === 'MULTIPLE_CHOICE'
                        ? 'Trắc nghiệm 4 lựa chọn'
                        : q.type === 'TRUE_FALSE_GROUP'
                        ? 'Đúng / Sai'
                        : q.type === 'SHORT_ANSWER'
                        ? 'Trả lời ngắn'
                        : 'Câu hỏi'}
                    </span>
                  </div>
                  {q.points && <span className="text-xs text-[#5f6368] dark:text-[#9aa0a6] font-medium">{q.points} điểm</span>}
                </div>

                {/* Nội dung câu hỏi KaTeX */}
                <div className="text-sm md:text-base text-[#202124] dark:text-[#e3e3e3] leading-relaxed mb-4">
                  <MathRenderer content={q.content} />
                </div>

                {/* Hình ảnh minh họa (nếu có) */}
                {q.figures && q.figures.length > 0 && (
                  <div className="my-4 flex flex-wrap gap-4">
                    {q.figures.map((fig, fIdx) => (
                      <div key={fIdx} className="bg-[#f8f9fa] dark:bg-[#202124] p-2 rounded-2xl border border-[#dadce0] dark:border-[#3c4043]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={fig.url} alt={fig.caption || `Hình ${fIdx + 1}`} className="max-h-60 rounded-xl" />
                        {fig.caption && <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] text-center mt-1">{fig.caption}</p>}
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
                          className={`flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#e8f0fe] dark:bg-[#1e2a38] border-[#1a73e8] dark:border-[#8ab4f8] text-[#1a73e8] dark:text-[#8ab4f8] ring-1 ring-[#1a73e8] dark:ring-[#8ab4f8]'
                              : 'bg-[#f8f9fa] dark:bg-[#242424] border-[#dadce0] dark:border-[#3c4043] text-[#202124] dark:text-[#e3e3e3] hover:bg-[#f1f3f4] dark:hover:bg-[#2c2c2c]'
                          }`}
                        >
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                              isSelected ? 'bg-[#1a73e8] dark:bg-[#8ab4f8] text-white dark:text-[#202124]' : 'bg-[#e8eaed] dark:bg-[#333538] text-[#5f6368] dark:text-[#9aa0a6]'
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
                          className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 bg-[#f8f9fa] dark:bg-[#242424] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl"
                        >
                          <div className="flex items-start gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-[#e8eaed] dark:bg-[#333538] text-[#5f6368] dark:text-[#9aa0a6] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                              {sub.key}
                            </span>
                            <div className="text-sm text-[#202124] dark:text-[#e3e3e3]">
                              <MathRenderer content={sub.content} inline />
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                            <button
                              type="button"
                              onClick={() => handleSelectTrueFalse(q.id, sub.key, true)}
                              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                                userVal === true
                                  ? 'bg-[#137333] dark:bg-[#5bb98c] text-white dark:text-[#0f291e] shadow-xs'
                                  : 'bg-white dark:bg-[#1e1e1e] border border-[#dadce0] dark:border-[#3c4043] text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#f1f3f4] dark:hover:bg-[#282828]'
                              }`}
                            >
                              ĐÚNG
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSelectTrueFalse(q.id, sub.key, false)}
                              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                                userVal === false
                                  ? 'bg-[#c5221f] dark:text-[#371918] text-white dark:bg-[#f28b82] shadow-xs'
                                  : 'bg-white dark:bg-[#1e1e1e] border border-[#dadce0] dark:border-[#3c4043] text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#f1f3f4] dark:hover:bg-[#282828]'
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
                    <label className="block text-xs text-[#5f6368] dark:text-[#9aa0a6] mb-2">Điền câu trả lời hoặc số:</label>
                    <input
                      type="text"
                      value={typeof currentAns === 'string' ? currentAns : ''}
                      onChange={(e) => handleShortAnswerChange(q.id, e.target.value)}
                      placeholder="Ví dụ: 3.14 hoặc 1/2..."
                      className="w-full md:w-80 bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-full px-4 py-2 text-sm text-[#202124] dark:text-[#e3e3e3] font-mono focus:outline-none focus:border-[#1a73e8] dark:focus:border-[#8ab4f8]"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Thanh Navigator Cố Định bên Phải */}
        <aside className="w-full md:w-72 shrink-0 space-y-4">
          <div className="bg-white dark:bg-[#1e1e1e] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl p-5 sticky top-20 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#5f6368] dark:text-[#9aa0a6]">Bảng câu hỏi</h3>
              <span className="text-xs font-semibold text-[#137333] dark:text-[#5bb98c]">
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
                        ? 'bg-[#1a73e8] dark:bg-[#8ab4f8] text-white dark:text-[#202124] shadow-xs'
                        : 'bg-[#f1f3f4] dark:bg-[#282828] text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#e8eaed] dark:hover:bg-[#333538]'
                    }`}
                  >
                    {idx + 1}
                  </a>
                );
              })}
            </div>

            <div className="mt-5 pt-4 border-t border-[#dadce0] dark:border-[#3c4043]">
              <button
                type="button"
                onClick={() => setShowSubmitModal(true)}
                className="w-full py-3 bg-[#137333] hover:bg-[#0f5c29] text-white font-semibold text-sm rounded-full shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" /> Nộp bài thi
              </button>
            </div>
          </div>
        </aside>
      </main>

      {/* Modal Xác Nhận Nộp Bài */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-[#1e1e1e] border border-[#dadce0] dark:border-[#3c4043] rounded-3xl p-6 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-[#fef7e0] dark:bg-[#33250b] text-[#b06000] dark:text-[#fdd663] flex items-center justify-center mb-4 border border-[#feefc3] dark:border-[#4d380e]">
              <AlertCircle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-[#202124] dark:text-[#e3e3e3] mb-2">Xác nhận nộp bài thi?</h3>
            <p className="text-[#5f6368] dark:text-[#9aa0a6] text-sm mb-4 leading-relaxed">
              Em đã hoàn thành <span className="font-bold text-[#202124] dark:text-[#e3e3e3]">{answeredCount}</span> trên tổng số{' '}
              <span className="font-bold text-[#202124] dark:text-[#e3e3e3]">{questions.length}</span> câu hỏi.
              {answeredCount < questions.length && (
                <span className="text-[#b06000] dark:text-[#fdd663] block mt-1">
                  Vẫn còn {questions.length - answeredCount} câu chưa làm xong!
                </span>
              )}
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-2.5 bg-[#f1f3f4] hover:bg-[#e8eaed] dark:bg-[#282828] dark:hover:bg-[#333538] text-[#202124] dark:text-[#e3e3e3] text-sm font-semibold rounded-full transition-all cursor-pointer"
              >
                Làm tiếp
              </button>
              <button
                type="button"
                onClick={() => handleFinalSubmit(false)}
                disabled={submitting}
                className="flex-1 py-2.5 bg-[#137333] hover:bg-[#0f5c29] disabled:opacity-50 text-white text-sm font-semibold rounded-full shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
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
        <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#181818] flex flex-col items-center justify-center text-[#202124] dark:text-[#e3e3e3] p-4">
          <div className="w-10 h-10 border-3 border-[#1a73e8] dark:border-[#8ab4f8] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-[#5f6368] dark:text-[#9aa0a6] font-medium text-sm">Đang tải phòng thi trực tuyến...</p>
        </div>
      }
    >
      <StudentExamContent {...props} />
    </React.Suspense>
  );
}
