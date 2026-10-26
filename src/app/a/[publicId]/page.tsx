'use client';

import React, { useState, useEffect, useCallback, useRef, use, useLayoutEffect, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { MathRenderer } from '@/components/MathRenderer';
import { VariationTable, VariationTableData } from '@/components/VariationTable';
import { FunctionPlot, FunctionPlotData } from '@/components/FunctionPlot';
import type { Figure } from '@/types/exam';
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
import { readStudentJournals, writeWriterJournal, retireWriterJournal, reconcileStudentJournals, unsubmittedStudentJournals, importStudentJournal, stableJson, type StudentJournalEntry } from '@/lib/student-draft-journal';
import { StudentDraftRecovery } from '@/components/StudentDraftRecovery';
import { withStudentRequestTimeout } from '@/lib/student-network';

interface Question {
  id: string;
  sectionId?: string;
  passageId?: string;
  position: number;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE_GROUP' | 'SHORT_ANSWER' | 'ESSAY' | 'FILL_BLANK' | 'MATCHING' | 'ORDERING';
  difficulty?: string;
  content: string;
  figures?: Array<Figure & { url?: string }>;
  matching?: { left: { key: string; text: string }[]; right: { key: string; text: string }[] };
  ordering?: { items: { key: string; text: string }[] };
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
  assessmentMode?: 'scored' | 'comment_only' | 'rubric' | 'survey';
  identityMode: 'PICK_FROM_LIST' | 'FREE_NAME' | 'PERSONAL_LINK';
  durationMinutes?: number;
  maxAttempts: number;
  opensAt?: string;
  closesAt?: string;
  requirePin: boolean;
  requireJoinCode?: boolean;
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
  draft: Record<string, unknown>;
  draftRevision: string;
  studentName: string;
}

interface SubmitResult {
  score: number | null;
  maxScore: number | null;
  needsGrading?: boolean;
  submittedAt: string;
  studentName: string;
  leaderboard?: {
    top: Array<{ rank: number; name: string; score: number }>;
    me: { rank: number | null; total: number; score: number | null };
  } | null;
  solutions?: Array<{
    id: string;
    correct?: string;
    sub_questions?: Array<{ key: string; isCorrect: boolean; explanation?: string }>;
    solution?: string;
    matchingPairs?: { id?: string; left: string; right: string }[];
    correctOrder?: string[];
  }> | null;
  message: string;
}

function responseText(question: Question, response: unknown): string {
  if (question.matching && response && typeof response === 'object' && !Array.isArray(response)) return question.matching.left.map(left => left.text + ' → ' + (question.matching!.right.find(right => right.key === (response as Record<string, unknown>)[left.key])?.text || 'Chưa chọn')).join('; ');
  if (question.ordering && Array.isArray(response)) return response.map(key => question.ordering!.items.find(item => item.key === key)?.text || '').filter(Boolean).join(' → ') || 'Chưa sắp xếp';
  if (response && typeof response === 'object') return Object.entries(response).map(([key, value]) => key + ': ' + (typeof value === 'boolean' ? (value ? 'Đúng' : 'Sai') : value)).join('; ');
  return response === null || response === undefined || response === '' ? 'Chưa trả lời' : String(response);
}
function StructuredAnswer({ question, value, onChange }: { question: Question; value: unknown; onChange: (value: unknown) => void }) {
  if (question.matching) return <div className="space-y-3 mt-4"><p className="text-xs">Chọn vế phải cho mỗi nội dung bên trái.</p>{question.matching.left.map(left => <label key={left.key} className="grid md:grid-cols-2 gap-3 items-center border rounded-xl p-3"><MathRenderer content={left.text} /><select aria-label={'Ghép cho ' + left.text} value={value && typeof value === 'object' && !Array.isArray(value) ? String((value as Record<string, unknown>)[left.key] || '') : ''} onChange={event => onChange({ ...(value && typeof value === 'object' && !Array.isArray(value) ? value : {}), [left.key]: event.target.value })} className="border rounded-xl p-2 bg-transparent"><option value="">Chọn nội dung phù hợp</option>{question.matching!.right.map(right => <option key={right.key} value={right.key}>{right.text}</option>)}</select></label>)}</div>;
  if (question.ordering) {
    const selected = Array.isArray(value) ? value.filter(key => typeof key === 'string' && question.ordering!.items.some(item => item.key === key)) as string[] : [];
    const move = (i: number, offset: number) => { const target = i + offset; if (target < 0 || target >= selected.length) return; const next = [...selected]; [next[i], next[target]] = [next[target], next[i]]; onChange(next); };
    return <div className="space-y-3 mt-4"><p className="text-xs">Thêm các mục theo thứ tự mong muốn; dùng nút lên/xuống để sửa.</p><ol className="space-y-2">{selected.map((key, i) => <li key={key} className="border rounded-xl p-3 flex items-center gap-3"><span>{i + 1}.</span><div className="flex-1"><MathRenderer content={question.ordering!.items.find(item => item.key === key)!.text} /></div><button type="button" aria-label={'Đưa mục ' + (i + 1) + ' lên'} disabled={i === 0} onClick={() => move(i, -1)}>↑</button><button type="button" aria-label={'Đưa mục ' + (i + 1) + ' xuống'} disabled={i === selected.length - 1} onClick={() => move(i, 1)}>↓</button><button type="button" onClick={() => onChange(selected.filter(item => item !== key))}>Bỏ</button></li>)}</ol><div className="space-y-2">{question.ordering.items.filter(item => !selected.includes(item.key)).map(item => <button key={item.key} type="button" onClick={() => onChange([...selected, item.key])} className="block text-left w-full border rounded-xl p-3"><span className="text-xs text-[var(--ui-accent)]">Thêm vào thứ tự: </span><MathRenderer content={item.text} inline /></button>)}</div></div>;
  }
  return null;
}

const emptyStudentToken = () => '';
const readStudentToken = () => new URLSearchParams(window.location.search).get('token') || '';
function subscribeStudentLocation(changed: () => void) {
  window.addEventListener('popstate', changed);
  return () => window.removeEventListener('popstate', changed);
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
  const [passages, setPassages] = useState<Array<{ id: string; title?: string; content: string }>>([]);

  // Trạng thái vào thi
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [freeName, setFreeName] = useState('');
  const [starting, setStarting] = useState(false);
  const [pin, setPin] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const urlToken = useSyncExternalStore(subscribeStudentLocation, readStudentToken, emptyStudentToken);
  const tokenSource = publicId + ':' + urlToken;
  const [tokenDraft, setTokenDraft] = useState({ source: '', value: '' });
  const personalToken = tokenDraft.source === tokenSource ? tokenDraft.value : urlToken;
  const setPersonalToken = (value: string) => setTokenDraft({ source: tokenSource, value });
  const [saveError, setSaveError] = useState<string | null>(null);
  const [journalNotice, setJournalNotice] = useState<string | null>(null);

  // Trạng thái đang làm bài
  const [attempt, setAttempt] = useState<AttemptData | null>(null);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitNotice, setSubmitNotice] = useState<string | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Trạng thái kết quả sau khi nộp
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [canStartAnother, setCanStartAnother] = useState(false);

  const answersRef = useRef(answers);
  useLayoutEffect(() => { answersRef.current = answers; }, [answers]);
  const draftRevisionRef = useRef('');
  const activeAttemptRef = useRef<string | null>(null);
  const draftSaveRef = useRef<Promise<void> | null>(null);
  const draftConflictRef = useRef(false);
  const submittingRef = useRef(false);
  const journalWriterRef = useRef('');
  const journalBaseRef = useRef('');
  const draftContextRef = useRef(0);
  const serverDraftRef = useRef<Record<string, unknown>>({});
  const [recoveryEntries, setRecoveryEntries] = useState<StudentJournalEntry[]>([]);

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
        setCanStartAnother(Boolean(data.canStartAnother));
        setQuestions(data.exam?.questions || []);
        setSections(data.exam?.sections || []);
        setPassages(data.exam?.passages || []);
        if (data.myAttempt?.status === 'SUBMITTED') {
          const resultResponse = await fetch('/api/public/attempts/' + data.myAttempt.id + '/submit');
          const result = await resultResponse.json();
          if (resultResponse.ok) {
            setSubmitResult(result); setAnswers(result.responses || {});
            const stored = readStudentJournals(() => localStorage, data.myAttempt.id);
            setRecoveryEntries(unsubmittedStudentJournals(stored.entries, result.responses || {}));
          }
        }
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
      const { res, data } = await withStudentRequestTimeout(async signal => {
      const res = await fetch(`/api/public/assignments/${publicId}/start`, {
        method: 'POST',
        signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: assignment.identityMode === 'PICK_FROM_LIST' ? selectedStudentId : undefined,
          freeName: assignment.identityMode === 'FREE_NAME' ? freeName.trim() : undefined,
          personalToken: assignment.identityMode === 'PERSONAL_LINK' ? personalToken : undefined,
          pin: pin || undefined, joinCode: joinCode || undefined,
        }),
      });

      return { res, data: await res.json() };
      });
      if (!res.ok) {
        alert(data.error || 'Không thể bắt đầu làm bài.');
        return;
      }

      activeAttemptRef.current = data.attempt.id;
      draftContextRef.current++;
      draftRevisionRef.current = data.attempt.draftRevision;
      journalBaseRef.current = data.attempt.draftRevision;
      journalWriterRef.current ||= crypto.randomUUID();
      serverDraftRef.current = data.attempt.draft || {};
      draftSaveRef.current = null;
      draftConflictRef.current = false;
      setSaveError(null); setSubmitError(null); setSubmitNotice(null); setLastSaved(null); setIsSaving(false);
      setAttempt(data.attempt);
      setCanStartAnother(data.attempt.attemptNo < assignment.maxAttempts);
      if (data.exam) { setQuestions(data.exam.questions || []); setSections(data.exam.sections || []); setPassages(data.exam.passages || []); }
      // Answers typed on this browser but never acknowledged by the server (tab closed, power loss) come back here.
      const stored = readStudentJournals(() => localStorage, data.attempt.id);
      const outcome = reconcileStudentJournals(stored.entries, data.attempt.draft || {}, data.attempt.draftRevision);
      setRecoveryEntries(stored.entries.filter(entry => !entry.value || stableJson(entry.value.answers) !== stableJson(serverDraftRef.current)));
      const restored = stored.entries.find(entry => entry.value && stableJson(entry.value.answers) === stableJson(outcome.answers));
      if (outcome.kind === 'conflict' && restored?.value) journalBaseRef.current = restored.value.baseRevision;
      setJournalNotice(stored.unavailable ? 'Trình duyệt không cho lưu nháp trên máy này. Bài vẫn làm và lưu lên máy chủ được; hãy giữ trang mở tới khi có xác nhận.' : outcome.kind === 'restored' ? 'Đã khôi phục các câu em làm dở trên máy này; hệ thống sẽ tự lưu lại.' : null);
      if (outcome.kind === 'conflict' || outcome.kind === 'choose') {
        draftConflictRef.current = true;
        setSaveError(outcome.kind === 'choose' ? 'Có nhiều bản nháp khác nhau trên máy này. Hãy mở mục bản nháp để chọn và đối chiếu; chưa tự gộp hoặc nộp.' : 'Nháp trên máy chủ đã thay đổi ở trang khác sau lần em làm dở trên máy này. Chưa ghi đè hay nộp; hãy tải bản đang nhập về trước khi mở lại.');
      }
      setAnswers(outcome.answers);

      // Tính toán thời gian đếm ngược
      if (data.attempt.deadlineAt) {
        const deadline = new Date(data.attempt.deadlineAt).getTime();
        const now = data.serverNow ? new Date(data.serverNow).getTime() : Date.now();
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
    async (currentAnswers: Record<string, unknown>) => {
      if (!attempt?.id || draftSaveRef.current || draftConflictRef.current || submittingRef.current) return;
      const savingAttemptId = attempt.id;
      const savingContext = draftContextRef.current;
      const operation = (async () => {
      try {
        setIsSaving(true);
        const { response, result } = await withStudentRequestTimeout(async signal => {
        const response = await fetch(`/api/public/attempts/${attempt.id}/draft`, {
          method: 'PATCH',
          signal,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ draft: currentAnswers, baseDraftRevision: draftRevisionRef.current }),
        });
        return { response, result: await response.json() };
        });
        if (activeAttemptRef.current !== savingAttemptId || draftContextRef.current !== savingContext) return;
        if (!response.ok) {
          if (result.code === 'DRAFT_CONFLICT' || result.code === 'DRAFT_REVISION_REQUIRED') draftConflictRef.current = true;
          throw new Error(result.error || 'Chưa lưu được bản nháp');
        }
        if (typeof result.draftRevision !== 'string') throw new Error('Chưa nhận được xác nhận phiên bản nháp. Bản đang nhập vẫn giữ trên trang này.');
        draftRevisionRef.current = result.draftRevision;
        journalBaseRef.current = result.draftRevision;
        serverDraftRef.current = currentAnswers;
        if (!writeWriterJournal(() => localStorage, savingAttemptId, journalWriterRef.current, result.draftRevision, answersRef.current)) setJournalNotice('Đã lưu lên máy chủ, nhưng chưa giữ được bản nháp dự phòng trên máy này.');
        setSaveError(null);
        const now = new Date();
        setLastSaved(
          `${now.getHours().toString().padStart(2, '0')}:${now
            .getMinutes()
            .toString()
            .padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
        );
      } catch (err) {
        if (activeAttemptRef.current !== savingAttemptId || draftContextRef.current !== savingContext) return;
        setSaveError(err instanceof Error ? err.message : 'Chưa lưu được bản nháp');
        console.error('Lỗi tự động lưu nháp:', err);
      } finally {
        if (activeAttemptRef.current === savingAttemptId) setIsSaving(false);
      }
      })();
      draftSaveRef.current = operation;
      await operation;
      if (draftSaveRef.current === operation) draftSaveRef.current = null;
    },
    [attempt]
  );

  // Keep edits even during conflicts, still bound to their original server revision.
  useEffect(() => {
    if (!attempt?.id || submitResult) return;
    if (!writeWriterJournal(() => localStorage, attempt.id, journalWriterRef.current, journalBaseRef.current, answers)) setJournalNotice('Chưa lưu được nháp dự phòng trên máy này. Hệ thống vẫn thử lưu máy chủ; đừng đóng trang trước khi có xác nhận.');
  }, [answers, attempt?.id, submitResult]);

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
    if (timeLeft === null || submitResult) return;
    if (timeLeft <= 0) { handleFinalSubmit(true); return; }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          // The zero-time effect submits once after this pure state update.
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
  async function handleFinalSubmit(isAuto = false) {
    if (!attempt?.id || submittingRef.current) return;
    if (draftConflictRef.current && !isAuto) { setSaveError('Nháp đã thay đổi ở trang khác. Hãy tải bản đang nhập trước khi mở lại; chưa nộp bản cũ.'); setShowSubmitModal(false); return; }

    try {
      submittingRef.current = true;
      setSubmitting(true);
      setSubmitError(null);
      setShowSubmitModal(false);
      await draftSaveRef.current;

      const localAnswers = answersRef.current;
      const send = (savedOnly: boolean) => withStudentRequestTimeout(async signal => {
      const res = await fetch(`/api/public/attempts/${attempt.id}/submit`, {
        method: 'POST',
        signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(savedOnly ? { answers: {}, useSavedDraftOnly: true } : { answers: localAnswers, baseDraftRevision: draftRevisionRef.current }),
      });
      return { res, data: await res.json() };
      });
      let savedOnly = isAuto && draftConflictRef.current;
      let { res, data } = await send(savedOnly);
      if (isAuto && !res.ok && data.code === 'DRAFT_CONFLICT') {
        draftConflictRef.current = true; savedOnly = true;
        ({ res, data } = await send(true));
      }
      if (!res.ok) {
        if (data.code === 'DRAFT_CONFLICT' || data.code === 'DRAFT_REVISION_REQUIRED') { draftConflictRef.current = true; setSaveError(data.error); }
        setSubmitError(data.error || 'Chưa nộp được bài. Câu trả lời vẫn giữ để thử lại.');
        return;
      }

      setSubmitResult(data);
      retireWriterJournal(() => localStorage, attempt.id, journalWriterRef.current, data.responses || {});
      const remaining = readStudentJournals(() => localStorage, attempt.id).entries;
      if (!remaining.some(entry => entry.value && stableJson(entry.value.answers) === stableJson(localAnswers))) {
        const value = { v: 2 as const, attemptId: attempt.id, writerId: journalWriterRef.current, baseRevision: journalBaseRef.current, answers: localAnswers, savedAt: new Date().toISOString() };
        remaining.push({ key: 'memory:' + journalWriterRef.current, raw: JSON.stringify(value, null, 2), value });
      }
      setRecoveryEntries(unsubmittedStudentJournals(remaining, data.responses || {}));
      setAnswers(data.responses || {});
      if (isAuto) {
        setSubmitNotice(savedOnly ? 'Đã hết giờ. Hệ thống chỉ nộp bản máy chủ đã lưu; bản nháp khác được giữ để đối chiếu.' : 'Đã hết giờ làm bài. Bài thi đã được nộp tự động.');
      }
    } catch (err) {
      console.error(err);
      setSubmitError(err instanceof Error && err.message.includes('chưa phản hồi') ? err.message : 'Chưa xác nhận được bài đã nộp. Câu trả lời vẫn giữ trên trang này; kiểm tra mạng rồi thử nộp lại.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  // Tính số câu đã hoàn thành
  const answeredCount = questions.reduce((acc, q) => {
    const ans = answers[q.id];
    if (!ans) return acc;
    if (q.type === 'ORDERING' && Array.isArray(ans) && ans.length) return acc + 1;
    if (q.type === 'MATCHING' && typeof ans === 'object' && !Array.isArray(ans) && Object.values(ans).some(value => typeof value === 'string' && value)) return acc + 1;
    if (q.type === 'MULTIPLE_CHOICE' && typeof ans === 'string' && ans.trim()) return acc + 1;
    if (['SHORT_ANSWER', 'FILL_BLANK', 'ESSAY', 'MATCHING', 'ORDERING'].includes(q.type) && typeof ans === 'string' && ans.trim()) return acc + 1;
    if (q.type === 'TRUE_FALSE_GROUP' && typeof ans === 'object') {
      const keys = Object.keys(ans);
      if (keys.length > 0) return acc + 1;
    }
    return acc;
  }, 0);

  // MÀN HÌNH 1: ĐANG TẢI HOẶC LỖI
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#17181a] flex flex-col items-center justify-center text-[#202124] dark:text-[#e3e3e3] p-4">
        <div className="w-10 h-10 border-3 border-[#3c4043] dark:border-[#e3e3e3] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-[#5f6368] dark:text-[#9aa0a6] font-medium text-sm">Đang tải phòng thi trực tuyến...</p>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#17181a] flex flex-col items-center justify-center text-[#202124] dark:text-[#e3e3e3] p-4">
        <div className="max-w-md w-full bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl p-8 text-center shadow-xs">
          <ShieldAlert className="w-14 h-14 text-[#c5221f] dark:text-[#f28b82] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#202124] dark:text-[#e3e3e3] mb-2">Không thể truy cập bài thi</h2>
          <p className="text-[#5f6368] dark:text-[#9aa0a6] text-sm mb-6 leading-relaxed">{error}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 app-button-primary dark:bg-[#e3e3e3] hover:bg-[#303134] dark:hover:bg-[#f1f3f4] text-white dark:text-[#202124] text-sm font-semibold rounded-lg transition-all shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" /> Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  // MÀN HÌNH 3: KẾT QUẢ SAU KHI NỘP BÀI THÀNH CÔNG
  if (submitResult) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#17181a] text-[#202124] dark:text-[#e3e3e3] py-10 px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          {submitNotice && <p role="status" className="p-4 border rounded-xl bg-neutral-50 text-[var(--ui-accent)]">{submitNotice}</p>}
          <StudentDraftRecovery entries={recoveryEntries} />
          {/* Card điểm số chính */}
          <div className="bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl p-8 text-center relative overflow-hidden shadow-xs">
            <div className="w-16 h-16 bg-[#e6f4ea] dark:bg-[#0f291e] text-[#137333] dark:text-[#5bb98c] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#ceead6] dark:border-[#1e4d38]">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h1 className="text-2xl font-bold text-[#202124] dark:text-[#e3e3e3] mb-2">{assignment.title}</h1>
            <p className="text-[#5f6368] dark:text-[#9aa0a6] text-sm mb-6 [overflow-wrap:anywhere]">
              Học sinh: <span className="font-semibold text-[#137333] dark:text-[#5bb98c]">{submitResult.studentName}</span>
            </p>

            {submitResult.score !== null ? (
              <div className="inline-block bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-xl px-8 py-5 my-2 shadow-xs">
                <span className="text-xs uppercase tracking-wider text-[#5f6368] dark:text-[#9aa0a6] font-semibold block mb-1">
                  {submitResult.needsGrading ? 'Điểm tạm tính — còn câu chờ giáo viên chấm' : 'Điểm số đạt được'}
                </span>
                <div className="text-5xl font-black text-[#137333] dark:text-[#5bb98c] tracking-tight">
                  {submitResult.score}
                  <span className="text-2xl text-[#5f6368] dark:text-[#9aa0a6] font-normal ml-1">/ {submitResult.maxScore ?? 10}</span>
                </div>
              </div>
            ) : (
              <div className="bg-[#f8f9fa] dark:bg-[#242424] border border-[#dadce0] dark:border-[#3c4043] rounded-xl p-4 text-sm text-[#5f6368] dark:text-[#9aa0a6]">
                {submitResult.message || 'Bài làm của em đã được ghi nhận.'}
              </div>
            )}

            <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] mt-4">
              Nộp lúc: {new Date(submitResult.submittedAt).toLocaleTimeString('vi-VN')} ngày{' '}
              {new Date(submitResult.submittedAt).toLocaleDateString('vi-VN')}
            </p>
          </div>

          {canStartAnother && <button onClick={() => { setSubmitResult(null); setAttempt(null); setAnswers({}); setTimeLeft(null); }} className="px-5 py-3 rounded-lg app-button-primary text-white">Làm lượt tiếp theo</button>}

          {/* Bảng xếp hạng Top & Me */}
          {submitResult.leaderboard && (
            <div className="bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl p-6 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-[#b06000] dark:text-[#fdd663]" />
                <h3 className="text-base font-bold text-[#202124] dark:text-[#e3e3e3]">Bảng xếp hạng lớp</h3>
              </div>

              <div className="space-y-2 mb-4">
                {submitResult.leaderboard.top.map((item) => (
                  <div
                    key={item.rank}
                    className="flex items-center justify-between px-4 py-3 bg-[#f8f9fa] dark:bg-[#242424] border border-[#dadce0] dark:border-[#3c4043] rounded-xl"
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
              <div className="flex items-center justify-between px-4 py-3 bg-[#f1f3f4] dark:bg-[#292a2d] border border-[#3c4043]/30 dark:border-[#e3e3e3]/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-[#3c4043] dark:text-[#e3e3e3]" />
                  <div>
                    <span className="text-xs text-[#3c4043] dark:text-[#e3e3e3] font-semibold block">Vị trí của em</span>
                    <span className="text-sm font-bold text-[#202124] dark:text-[#e3e3e3]">
                      {submitResult.leaderboard.me.rank === null ? 'Chưa xếp hạng — chờ điểm chốt' : `Hạng #${submitResult.leaderboard.me.rank} / ${submitResult.leaderboard.me.total} bạn`}
                    </span>
                  </div>
                </div>
                <span className="text-base font-bold text-[#3c4043] dark:text-[#e3e3e3]">
                  {submitResult.leaderboard.me.score === null ? 'Chờ chấm' : `${submitResult.leaderboard.me.score} đ`}
                </span>
              </div>
            </div>
          )}

          {/* Chi tiết lời giải và đáp án */}
          {submitResult.solutions && (
            <div className="bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl p-6 shadow-xs space-y-6">
              <h3 className="text-base font-bold text-[#202124] dark:text-[#e3e3e3] flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#3c4043] dark:text-[#e3e3e3]" /> Đáp án & Lời giải chi tiết
              </h3>

              <div className="space-y-6">
                {questions.map((q, idx) => {
                  const sol = submitResult.solutions?.find((s) => s.id === q.id);
                  const studentAns = answers[q.id];

                  return (
                    <div key={q.id} className="p-4 bg-[#f8f9fa] dark:bg-[#242424] border border-[#dadce0] dark:border-[#3c4043] rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold px-2.5 py-1 bg-[#f1f3f4] dark:bg-[#292a2d] text-[#3c4043] dark:text-[#e3e3e3] rounded-full">
                          Câu {idx + 1}
                        </span>
                        <span className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">{assignment.assessmentMode === undefined || assignment.assessmentMode === 'scored' ? (q.points ?? 0) + ' điểm' : 'Nhận xét / rubric'}</span>
                      </div>

                      <div className="text-sm text-[#202124] dark:text-[#e3e3e3]">
                        <MathRenderer content={q.content} />
                      </div>

                      <div className="text-xs space-y-1.5 pt-3 border-t border-[#dadce0] dark:border-[#3c4043]">
                        <div>
                          <span className="text-[#5f6368] dark:text-[#9aa0a6]">Đáp án em chọn: </span>
                          <span className="font-semibold text-[#202124] dark:text-[#e3e3e3]">
                            {responseText(q, studentAns)}
                          </span>
                        </div>
                        {sol?.correct && (
                          <div>
                            <span className="text-[#137333] dark:text-[#5bb98c]">Đáp án đúng: </span>
                            <span className="font-bold text-[#137333] dark:text-[#5bb98c]">{sol.correct}</span>
                          </div>
                        )}
                        {sol?.matchingPairs?.length ? <p>Ghép đúng: {sol.matchingPairs.map(pair => pair.left + ' → ' + pair.right).join('; ')}</p> : null}
                        {sol?.correctOrder?.length ? <p>Thứ tự đúng: {sol.correctOrder.join(' → ')}</p> : null}
                        {sol?.solution && (
                          <div className="p-3 bg-white dark:bg-[#202124] rounded-xl border border-[#dadce0] dark:border-[#3c4043] text-[#202124] dark:text-[#e3e3e3] mt-2">
                            <span className="text-[#3c4043] dark:text-[#e3e3e3] font-semibold block mb-1">Hướng dẫn giải:</span>
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
      <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#17181a] flex flex-col items-center justify-center text-[#202124] dark:text-[#e3e3e3] p-4">
        <div className="max-w-md w-full bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl p-8 shadow-xs">
          <div className="w-12 h-12 bg-[#f1f3f4] dark:bg-[#292a2d] text-[#3c4043] dark:text-[#e3e3e3] rounded-xl flex items-center justify-center mb-5 border border-[#3c4043]/30 dark:border-[#e3e3e3]/30">
            <User className="w-6 h-6" />
          </div>

          <span className="text-xs font-semibold uppercase tracking-wider text-[#3c4043] dark:text-[#e3e3e3]">
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

          <p className="text-xs mb-4">Hết giờ, hệ thống tự gửi bài. Máy chủ dành tối đa 15 giây để nhận bài khi đường truyền chậm; không nhận bản nháp sửa sau giờ làm.</p>
          <form onSubmit={handleStartExam} className="space-y-5">
            {assignment.requirePin && <label className="block text-sm">PIN do giáo viên cấp<input type="password" required value={pin} onChange={e => setPin(e.target.value)} className="w-full border rounded-xl px-4 py-2 mt-2" /></label>}
            {assignment.requireJoinCode && <label className="block text-sm">Mã vào bài<input required value={joinCode} onChange={e => setJoinCode(e.target.value)} className="w-full border rounded-xl px-4 py-2 mt-2" /></label>}
            {assignment.identityMode === 'PERSONAL_LINK' ? (
              <label className="block text-sm">Mã link cá nhân<input required value={personalToken} onChange={e => setPersonalToken(e.target.value)} className="w-full border rounded-xl px-4 py-2 mt-2" /></label>
            ) : assignment.identityMode === 'PICK_FROM_LIST' && assignment.group?.students ? (
              <div>
                <label htmlFor="student-pick" className="block text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider mb-2">
                  Chọn tên của em trong danh sách lớp:
                </label>
                <select
                  id="student-pick"
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-full px-4 py-2.5 text-sm text-[#202124] dark:text-[#e3e3e3] focus:outline-none focus:border-[#3c4043] dark:focus:border-[#e3e3e3]"
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
                <label htmlFor="student-free-name" className="block text-xs font-semibold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider mb-2">
                  Nhập họ và tên của em:
                </label>
                <input
                  id="student-free-name"
                  type="text"
                  value={freeName}
                  onChange={(e) => setFreeName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  className="w-full bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-full px-4 py-2.5 text-sm text-[#202124] dark:text-[#e3e3e3] placeholder-[#5f6368] dark:placeholder-[#9aa0a6] focus:outline-none focus:border-[#3c4043] dark:focus:border-[#e3e3e3]"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={starting}
              className="w-full py-3 app-button-primary dark:bg-[#e3e3e3] dark:hover:bg-[#f1f3f4] disabled:opacity-50 text-white dark:text-[#202124] font-semibold text-sm rounded-lg shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
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
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#17181a] text-[#202124] dark:text-[#e3e3e3] flex flex-col">
      {/* Top Bar Cố Định */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#202124]/95 backdrop-blur-md border-b border-[#dadce0] dark:border-[#3c4043] px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-sm md:text-base font-bold text-[#202124] dark:text-[#e3e3e3] truncate max-w-xs md:max-w-md">
              {assignment.title}
            </h1>
            <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] [overflow-wrap:anywhere]">
              Học sinh: <span className="text-[#3c4043] dark:text-[#e3e3e3] font-semibold">{attempt.studentName}</span>
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Đồng hồ đếm ngược */}
            {timeLeft !== null && (
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-sm font-bold border ${
                  timeLeft <= 300
                    ? 'bg-[#fce8e6] dark:bg-[#371918] text-[#c5221f] dark:text-[#f28b82] border-[#fad2cf] dark:border-[#5c2523] animate-pulse'
                    : 'bg-[#f1f3f4] dark:bg-[#292a2d] text-[#3c4043] dark:text-[#e3e3e3] border-[#dadce0] dark:border-[#3c4043]'
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
              ) : saveError ? (<span role="alert" className="text-red-600">{saveError}</span>) : lastSaved ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#137333] dark:text-[#5bb98c]" /> Lưu nháp {lastSaved}
                </>
              ) : null}
            </div>

            {/* Nút nộp bài */}
            <button
              onClick={() => setShowSubmitModal(true)}
              disabled={submitting}
              className="px-4 py-2 bg-[#137333] hover:bg-[#0f5c29] text-white font-semibold text-xs md:text-sm rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" /> Nộp bài
            </button>
          </div>
        </div>
      </header>

      <div role="status" aria-live="polite" className="md:hidden px-4 py-2 text-xs border-b">
        {isSaving ? 'Đang gửi nháp lên máy chủ...' : saveError ? 'Chưa lưu được nháp máy chủ. Xem thông báo bên dưới.' : lastSaved ? `Lần lưu máy chủ gần nhất: ${lastSaved}` : 'Chưa có xác nhận lưu nháp từ máy chủ.'}
      </div>
      {submitError && <div role="alert" className="max-w-6xl mx-auto w-full p-4 border rounded-xl bg-amber-50 text-amber-950">
        <p>{submitError}</p>
        {timeLeft === 0 && <p>Đã hết giờ nên không sửa thêm đáp án. Khi kết nối lại, máy chủ xác nhận phần bài được nhận trong thời gian cho phép; các bản khác giữ để đối chiếu.</p>}
        <button type="button" disabled={submitting} onClick={() => handleFinalSubmit(timeLeft === 0)} className="border rounded-lg p-2 mt-2">{submitting ? 'Đang xác nhận...' : 'Thử nộp lại khi có mạng'}</button>
      </div>}
      {journalNotice && !saveError && <div role="status" className="max-w-6xl mx-auto w-full px-4 py-3 text-sm bg-neutral-50 text-[var(--ui-accent)] border border-[var(--ui-border)] rounded-xl">{journalNotice}</div>}
      <StudentDraftRecovery entries={recoveryEntries} onImport={raw => {
        if (!attempt || activeAttemptRef.current !== attempt.id) return 'Lượt làm bài đã thay đổi. Hãy mở lại tệp ở đúng lượt.';
        const imported = importStudentJournal(() => localStorage, attempt.id, crypto.randomUUID(), raw);
        if (imported.error) return imported.error;
        setRecoveryEntries(previous => [...previous, imported.entry!]);
        setJournalNotice('Đã giữ tệp nháp riêng. Mở bản vừa nhập để đối chiếu rồi chọn nếu phù hợp; chưa thay câu trả lời đang nhập.');
        return null;
      }} onChoose={entry => {
        if (!entry.value || !attempt || entry.value.attemptId !== attempt.id || activeAttemptRef.current !== attempt.id) return;
        draftContextRef.current++;
        journalBaseRef.current = entry.value.baseRevision;
        const stale = entry.value.baseRevision !== draftRevisionRef.current;
        draftConflictRef.current = stale; setAnswers(entry.value.answers);
        setSaveError(stale ? 'Bản được chọn dựa trên nháp máy chủ cũ. Chỉ xem/đối chiếu; chưa ghi đè hoặc nộp nội dung này.' : null);
      }} onServer={() => {
        draftContextRef.current++;
        journalBaseRef.current = draftRevisionRef.current; draftConflictRef.current = false;
        setAnswers(serverDraftRef.current); setSaveError(null);
      }} />
      {(saveError || submitError) && <div className="max-w-6xl mx-auto w-full px-4 py-3 text-sm bg-amber-50 text-amber-900 border border-amber-300 rounded-xl">
        {saveError && <p role="alert">{saveError}</p>}
        <p>Bản đang nhập vẫn ở trang này. Tải bản sao trước khi đóng hoặc tải lại trang; tệp này dùng để đối chiếu, chưa thay cho bài đã nộp.</p>
        <button type="button" className="underline font-semibold mt-2" onClick={() => {
          const blob = new Blob([JSON.stringify({ format: 'examcraft-student-answers-v1', assignmentTitle: assignment?.title, attemptId: attempt?.id, baseDraftRevision: journalBaseRef.current, exportedAt: new Date().toISOString(), responses: answersRef.current }, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob), link = document.createElement('a');
          link.href = url; link.download = `examcraft-bai-lam-${attempt?.id}.json`; link.click();
          setTimeout(() => URL.revokeObjectURL(url), 30_000);
        }}>Tải bản câu trả lời đang nhập</button>
      </div>}
      {/* Thân bài thi */}
      <main inert={timeLeft === 0 || submitting} className="max-w-6xl mx-auto w-full p-4 md:p-6 flex-1 flex flex-col md:flex-row gap-6">
        {/* Danh sách câu hỏi */}
        <div className="flex-1 space-y-6">
          {questions.map((q, index) => {
            const currentAns = answers[q.id];

            return (
              <div
                key={q.id}
                id={`q-${index + 1}`}
                className="bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl p-5 md:p-6 shadow-xs transition-all hover:border-[#bdc1c6] dark:hover:border-[#5f6368]"
              >
                {/* Header câu hỏi */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-[#f1f3f4] dark:bg-[#292a2d] border border-[#3c4043]/30 dark:border-[#e3e3e3]/30 text-[#3c4043] dark:text-[#e3e3e3] flex items-center justify-center font-bold text-sm">
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
                  {(assignment.assessmentMode === undefined || assignment.assessmentMode === 'scored') && q.points !== undefined && <span className="text-xs text-[#5f6368] dark:text-[#9aa0a6] font-medium">{q.points} điểm</span>}
                </div>

                {q.passageId && passages.some(p => p.id === q.passageId) && <div className="mb-4 border rounded-xl p-4 bg-neutral-50/30"><h3 className="font-semibold text-sm mb-2">{passages.find(p => p.id === q.passageId)?.title || 'Ngữ liệu dùng chung'}</h3><MathRenderer content={passages.find(p => p.id === q.passageId)?.content || ''} /></div>}
                {/* Nội dung câu hỏi KaTeX */}
                <div className="text-sm md:text-base text-[#202124] dark:text-[#e3e3e3] leading-relaxed mb-4">
                  <MathRenderer content={q.content} />
                </div>

                {/* Hình ảnh minh họa (nếu có) */}
                {q.figures && q.figures.length > 0 && (
                  <div className="my-4 flex flex-wrap gap-4">
                    {q.figures.map((fig, fIdx) => (
                      <div key={fIdx} className="bg-[#f8f9fa] dark:bg-[#202124] p-2 rounded-xl border border-[#dadce0] dark:border-[#3c4043]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <>{fig.kind === 'variation_table' ? <VariationTable data={fig.data as VariationTableData} /> : fig.kind === 'function_plot' ? <FunctionPlot data={fig.data as FunctionPlotData} /> : <img src={fig.url || (typeof fig.data === 'string' ? fig.data : (fig.data as { url?: string })?.url) || fig.renderedBase64} alt={fig.caption || `Hình ${fIdx + 1}`} className="max-h-60 rounded-xl" />}</>
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
                          className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#f1f3f4] dark:bg-[#292a2d] border-[#3c4043] dark:border-[#e3e3e3] text-[#3c4043] dark:text-[#e3e3e3] ring-1 ring-[#3c4043] dark:ring-[#e3e3e3]'
                              : 'bg-[#f8f9fa] dark:bg-[#242424] border-[#dadce0] dark:border-[#3c4043] text-[#202124] dark:text-[#e3e3e3] hover:bg-[#f1f3f4] dark:hover:bg-[#2c2c2c]'
                          }`}
                        >
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                              isSelected ? 'bg-[#3c4043] dark:bg-[#e3e3e3] text-white dark:text-[#202124]' : 'bg-[#e8eaed] dark:bg-[#333538] text-[#5f6368] dark:text-[#9aa0a6]'
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
                      const userVal = (groupVal as Record<string, unknown>)[sub.key];

                      return (
                        <div
                          key={sub.key}
                          className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 bg-[#f8f9fa] dark:bg-[#242424] border border-[#dadce0] dark:border-[#3c4043] rounded-xl"
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
                              className={`min-h-10 min-w-16 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                userVal === true
                                  ? 'bg-[#137333] dark:bg-[#5bb98c] text-white dark:text-[#0f291e] shadow-xs'
                                  : 'bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#f1f3f4] dark:hover:bg-[#292a2d]'
                              }`}
                            >
                              ĐÚNG
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSelectTrueFalse(q.id, sub.key, false)}
                              className={`min-h-10 min-w-16 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                userVal === false
                                  ? 'bg-[#c5221f] dark:text-[#371918] text-white dark:bg-[#f28b82] shadow-xs'
                                  : 'bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#f1f3f4] dark:hover:bg-[#292a2d]'
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

                {(q.matching || q.ordering) && <StructuredAnswer question={q} value={currentAns} onChange={value => setAnswers(current => ({ ...current, [q.id]: value }))} />}
                {(q.type === 'ESSAY' || q.type === 'MATCHING' && !q.matching || q.type === 'ORDERING' && !q.ordering) && <label className="block text-sm mt-4">Trình bày câu trả lời (giáo viên sẽ chấm)<textarea value={typeof currentAns === 'string' ? currentAns : ''} onChange={e => handleShortAnswerChange(q.id, e.target.value)} rows={6} className="block w-full border rounded-xl p-3 mt-2 bg-transparent" /></label>}
                {/* DẠNG 3: TRẢ LỜI NGẮN (SHORT_ANSWER) */}
                {(q.type === 'SHORT_ANSWER' || q.type === 'FILL_BLANK') && (
                  <div className="mt-4">
                    <label className="block text-xs text-[#5f6368] dark:text-[#9aa0a6] mb-2">Điền câu trả lời hoặc số:</label>
                    <input
                      type="text"
                      value={typeof currentAns === 'string' ? currentAns : ''}
                      onChange={(e) => handleShortAnswerChange(q.id, e.target.value)}
                      placeholder="Ví dụ: 3.14 hoặc 1/2..."
                      className="w-full md:w-80 bg-[#f8f9fa] dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-full px-4 py-2 text-sm text-[#202124] dark:text-[#e3e3e3] font-mono focus:outline-none focus:border-[#3c4043] dark:focus:border-[#e3e3e3]"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Thanh Navigator Cố Định bên Phải */}
        <aside className="w-full md:w-72 shrink-0 space-y-4">
          <div className="bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl p-5 sticky top-20 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#5f6368] dark:text-[#9aa0a6]">Bảng câu hỏi</h3>
              <span className="text-xs font-semibold text-[#137333] dark:text-[#5bb98c]">
                {answeredCount} / {questions.length} câu
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2 max-h-80 overflow-y-auto pr-1">
              {questions.map((q, idx) => {
                const ans = answers[q.id];
                let isFilled = q.type === 'ORDERING' && Array.isArray(ans) && ans.length > 0 || q.type === 'MATCHING' && ans && typeof ans === 'object' && !Array.isArray(ans) && Object.values(ans).some(value => typeof value === 'string' && value);
                if (q.type === 'MULTIPLE_CHOICE' && ans) isFilled = true;
                if (['SHORT_ANSWER', 'FILL_BLANK', 'ESSAY', 'MATCHING', 'ORDERING'].includes(q.type) && typeof ans === 'string' && ans.trim()) isFilled = true;
                if (q.type === 'TRUE_FALSE_GROUP' && ans !== null && typeof ans === 'object' && Object.keys(ans).length > 0)
                  isFilled = true;

                return (
                  <a
                    key={q.id}
                    href={`#q-${idx + 1}`}
                    className={`h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                      isFilled
                        ? 'app-button-primary dark:bg-[#e3e3e3] text-white dark:text-[#202124] shadow-xs'
                        : 'bg-[#f1f3f4] dark:bg-[#292a2d] text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#e8eaed] dark:hover:bg-[#333538]'
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
                className="w-full py-3 bg-[#137333] hover:bg-[#0f5c29] text-white font-semibold text-sm rounded-lg shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
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
          <div className="max-w-md w-full bg-white dark:bg-[#202124] border border-[#dadce0] dark:border-[#3c4043] rounded-2xl p-6 shadow-xs">
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
                className="flex-1 py-2.5 bg-[#f1f3f4] hover:bg-[#e8eaed] dark:bg-[#292a2d] dark:hover:bg-[#333538] text-[#202124] dark:text-[#e3e3e3] text-sm font-semibold rounded-lg transition-all cursor-pointer"
              >
                Làm tiếp
              </button>
              <button
                type="button"
                onClick={() => handleFinalSubmit(false)}
                disabled={submitting}
                className="flex-1 py-2.5 bg-[#137333] hover:bg-[#0f5c29] disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
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
        <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#17181a] flex flex-col items-center justify-center text-[#202124] dark:text-[#e3e3e3] p-4">
          <div className="w-10 h-10 border-3 border-[#3c4043] dark:border-[#e3e3e3] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-[#5f6368] dark:text-[#9aa0a6] font-medium text-sm">Đang tải phòng thi trực tuyến...</p>
        </div>
      }
    >
      <StudentExamContent {...props} />
    </React.Suspense>
  );
}
