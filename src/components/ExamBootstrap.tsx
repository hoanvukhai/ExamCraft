'use client';
import { clarifyCard, clarificationReply } from '@/lib/copilot-clarification';
import Link from 'next/link';
import { ChatRecoveryTools } from './ChatRecoveryTools';
import { AiProposalPreview } from './AiProposalPreview';
import { MathRenderer } from './MathRenderer';
import { FigureView } from './FigureView';
import { localCopilotHelp } from '@/lib/copilot-help';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import type { Exam, Subject } from '@/types/exam';
import { readDraft, writeDraft } from '@/lib/exam-draft';
import { getCatalogSubjects } from '@/lib/education-catalog';
import { normalizeExamDocument } from '@/lib/exam-document';
import {
  bootstrapFactsSchema,
  PRACTICE_LABEL,
  trackFactOrigins,
  type FactOrigins,
  type BootstrapFacts,
} from '@/lib/exam-request';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { useChatSession } from '@/hooks/useChatSession';
import { useAiProposal } from '@/hooks/useAiProposal';
import { createAiProposal } from '@/lib/ai-proposal-journal';
import { copyChatSessionsAfterCreate } from '@/lib/chat-session';
import { accountFetch } from '@/lib/account-fetch';
const subscribeTouch = (notify: () => void) => {
  const media = matchMedia('(pointer: coarse)');
  media.addEventListener('change', notify);
  return () => media.removeEventListener('change', notify);
};
const touchSnapshot = () => matchMedia('(pointer: coarse)').matches;
export type InitialEditorTool = 'detail' | 'template' | 'import';
export function ExamBootstrapGate({
  ownerId,
  renderEditor,
}: {
  ownerId: string;
  renderEditor: (initial?: Exam, tool?: InitialEditorTool) => ReactNode;
}) {
  const [entry, setEntry] = useState<{
    mode: 'loading' | 'bootstrap' | 'editor' | 'error';
    id: string;
    initial?: Exam;
    tool?: InitialEditorTool;
  }>({ mode: 'loading', id: '' });
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        if (readDraft(localStorage, ownerId, 'new')) {
          setEntry({ mode: 'editor', id: '' });
          return;
        }
        const key = 'examcraft:bootstrap-id:' + encodeURIComponent(ownerId);
        let id = 'bootstrap_' + crypto.randomUUID();
        try {
          id = sessionStorage.getItem(key) || id;
          sessionStorage.setItem(key, id);
        } catch {
          /* RAM mode; the chat warns about unavailable storage. */
        }
        setEntry({ mode: 'bootstrap', id });
      } catch {
        setEntry({ mode: 'error', id: '' });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [ownerId]);
  if (entry.mode === 'loading')
    return (
      <p className="p-4" role="status">
        Đang mở bản soạn…
      </p>
    );
  if (entry.mode === 'editor') return renderEditor(entry.initial, entry.tool);
  if (entry.mode === 'error')
    return (
      <div className="p-4 space-y-3">
        <p role="alert">
          Chưa đọc được bản nháp trên máy. Bản gốc vẫn được giữ; chưa mở đề trắng ghi đè.
        </p>
        <button
          className="app-button-secondary min-h-11 px-3"
          onClick={() => {
            const raw =
              localStorage.getItem('examcraft:draft:' + encodeURIComponent(ownerId) + ':new') ?? '';
            const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' }));
            const a = document.createElement('a');
            a.href = url;
            a.download = 'examcraft-nhap-goc.json';
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          }}
        >
          Tải bản nháp gốc
        </button>
        <button
          className="app-button-secondary min-h-11 px-3"
          onClick={() => setEntry({ mode: 'bootstrap', id: 'bootstrap_' + crypto.randomUUID() })}
        >
          Tạo bản mới, giữ nháp gốc
        </button>
      </div>
    );
  return (
    <BootstrapComposer
      key={ownerId + entry.id}
      ownerId={ownerId}
      documentId={entry.id}
      onAccept={(initial, tool) => setEntry({ ...entry, mode: 'editor', initial, tool })}
    />
  );
}
function BootstrapComposer({
  ownerId,
  documentId,
  onAccept,
}: {
  ownerId: string;
  documentId: string;
  onAccept: (document: Exam, tool?: InitialEditorTool) => void;
}) {
  const { session, setSession, notice, startNew, recovery, restore } = useChatSession(
    ownerId,
    documentId,
  );
  const { keyState, openKeys, reloadKeys } = useWorkspace();
  const journal = useAiProposal(ownerId, documentId, 'copilot');
  const proposal = journal.entry?.record?.kind === 'copilot' ? journal.entry.record : null;
  const candidate = proposal?.result.candidate;
  const [origins, setOrigins] = useState<FactOrigins>({});
  const [facts, setFacts] = useState<BootstrapFacts>({
    subject: null,
    grade: null,
    durationMinutes: null,
  });
  const [text, setText] = useState(''),
    [answer, setAnswer] = useState(''),
    [restored, setRestored] = useState(false),
    [error, setError] = useState(''),
    [code, setCode] = useState(''),
    [busy, setBusy] = useState(false),
    [retry, setRetry] = useState<{ text: string; reply: boolean; fromInput: boolean } | null>(null);
  const sequence = useRef(0),
    controller = useRef<AbortController | null>(null),
    pending = useRef(false),
    accepted = useRef(false),
    revision = useRef(0),
    answerRevision = useRef(0),
    factsRevision = useRef(0);
  const [manual, setManual] = useState<InitialEditorTool | null>(null);
  if (session && !restored) {
    setRestored(true);
    setText(session.draft);
    setAnswer(session.freeAnswer ?? '');
    setFacts(session.bootstrapFacts ?? { subject: null, grade: null, durationMinutes: null });
    setOrigins(session.factOrigins ?? {});
  }
  const touch = useSyncExternalStore(subscribeTouch, touchSnapshot, () => false);
  const invalidate = useCallback(() => {
    sequence.current++;
    controller.current?.abort();
  }, []);
  useEffect(() => () => invalidate(), [invalidate]);
  useEffect(() => {
    if (!restored) return;
    setSession((old) =>
      old
        ? { ...old, draft: text, freeAnswer: answer, bootstrapFacts: facts, factOrigins: origins }
        : old,
    );
  }, [text, answer, facts, origins, restored, setSession]);
  const stamp = JSON.stringify(facts),
    stale = !!proposal && proposal.base.sourceStamp !== stamp;
  const send = async (value = text, reply = false, fromInput = false, optionId?: string) => {
    if (!session || pending.current || proposal || !value.trim()) return;
    const help = localCopilotHelp(value);
    if (help) {
      setSession((old) =>
        old
          ? {
              ...old,
              turns: [
                ...old.turns,
                { id: crypto.randomUUID(), role: 'user', text: value },
                { id: crypto.randomUUID(), role: 'assistant', text: help },
              ],
            }
          : old,
      );
      if (!reply) setText('');
      return;
    }
    if (keyState === 'loading') {
      setCode('KEY_LOADING');
      setError('Đang tải danh sách khóa. Yêu cầu vẫn được giữ.');
      return;
    }
    if (keyState === 'missing') {
      setCode('NO_API_KEY');
      setError(
        'Cần thêm hoặc bật khóa AI để thực hiện. Bạn vẫn có thể tự soạn hoặc nhập tài liệu.',
      );
      return;
    }
    if (session.turns.length >= 40) {
      setCode('CHAT_LIMIT');
      setError('Hội thoại đã dài. Hãy tải về rồi mở yêu cầu mới; chưa gọi AI.');
      return;
    }
    const requestId = crypto.randomUUID(),
      seq = ++sequence.current,
      abort = new AbortController(),
      sentRevision = revision.current,
      sentAnswerRevision = answerRevision.current,
      sentFactsRevision = factsRevision.current;
    setRetry({ text: value, reply, fromInput });
    controller.current = abort;
    pending.current = true;
    setBusy(true);
    setError('');
    setCode('');
    const timeout = setTimeout(() => abort.abort(), 240000);
    const turns = [...session.turns, { id: requestId, role: 'user' as const, text: value }];
    setSession((old) => (old ? { ...old, turns, pending: true } : old));
    try {
      const response = await accountFetch(ownerId, '/api/exam-copilot', {
        method: 'POST',
        signal: abort.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bootstrapContext: facts,
          command: value,
          recentTurns: session.turns,
          requestId,
          conversationId: session.conversationId,
          ...(reply && session.clarification
            ? {
                replyTo: session.clarification.questionId,
                clarificationReply: clarificationReply(session.clarification, value, optionId),
              }
            : {}),
        }),
      });
      const data = await response.json().catch(() => ({
        error: 'Chưa đọc được phản hồi máy chủ. Yêu cầu vẫn được giữ.',
        code: 'GATEWAY_ERROR',
      }));
      if (seq !== sequence.current || abort.signal.aborted) return;
      if (!data.success || !data.result) {
        setCode(data.code ?? 'AI_ERROR');
        setError(data.error ?? 'AI chưa hoàn tất yêu cầu.');
        return;
      }
      const result = data.result;
      if (result.type === 'clarification') {
        if (factsRevision.current !== sentFactsRevision) {
          setSession((old) =>
            old
              ? {
                  ...old,
                  turns: [
                    ...old.turns,
                    { id: crypto.randomUUID(), role: 'assistant', text: result.message },
                  ],
                }
              : old,
          );
          setError(
            'Yêu cầu đã đổi trong lúc AI trả lời. Thông tin bạn vừa chọn vẫn được giữ; hãy gửi yêu cầu hiện tại.',
          );
          return;
        }
        const nextFacts = bootstrapFactsSchema.parse({
          ...facts,
          ...Object.fromEntries(
            Object.entries(result.facts ?? {}).filter(
              ([, value]) => value !== null && value !== undefined,
            ),
          ),
        });
        setFacts(nextFacts);
        setOrigins((old) => trackFactOrigins(facts, nextFacts, old, 'inferred'));
        setSession((old) =>
          old
            ? {
                ...old,
                bootstrapFacts: nextFacts,
                factOrigins: trackFactOrigins(facts, nextFacts, origins, 'inferred'),
                turns: [
                  ...old.turns,
                  { id: crypto.randomUUID(), role: 'assistant', text: result.message },
                ],
                clarification: clarifyCard(requestId, result.message, result.quickOptions ?? []),
              }
            : old,
        );
        if (fromInput && answerRevision.current === sentAnswerRevision) setAnswer('');
        return;
      }
      if (result.action !== 'create_exam' || !result.candidate) throw Error('bad-output');
      const document = normalizeExamDocument(result.candidate);
      if (document.serverId || document.version || document.access) throw Error('bad-output');
      createAiProposal({
        kind: 'copilot',
        base: { ownerId, documentId, sourceStamp: stamp, questions: [] },
        result: { action: 'create_exam', candidate: document, explanation: PRACTICE_LABEL },
      });
      setSession((old) =>
        old
          ? {
              ...old,
              turns: [
                ...old.turns,
                {
                  id: crypto.randomUUID(),
                  role: 'assistant',
                  text: 'Có đề xuất trọn đề để xem và nhận.',
                },
              ],
              clarification: null,
            }
          : old,
      );
      if (revision.current === sentRevision && !reply) setText('');
      if (fromInput && answerRevision.current === sentAnswerRevision) setAnswer('');
    } catch {
      if (seq === sequence.current) {
        setCode(abort.signal.aborted ? 'TIMEOUT' : 'AI_BAD_OUTPUT');
        setError(
          abort.signal.aborted
            ? 'Chưa nhận được kết quả trong thời gian chờ; yêu cầu vẫn được giữ.'
            : 'Chưa nhận được đề xuất hợp lệ. Yêu cầu vẫn được giữ; bạn có thể thử lại.',
        );
      }
    } finally {
      clearTimeout(timeout);
      if (seq === sequence.current) {
        pending.current = false;
        setBusy(false);
        setSession((old) => (old ? { ...old, pending: false } : old));
      }
    }
  };
  const accept = (document: Exam, tool?: InitialEditorTool) => {
    if (accepted.current || busy) return;
    const normalized = normalizeExamDocument({
      ...document,
      serverId: undefined,
      version: undefined,
      access: undefined,
    });
    let kept = false;
    try {
      writeDraft(localStorage, ownerId, 'new', normalized, true);
      kept = true;
    } catch {
      /* The editor keeps the accepted document in RAM and reports draft storage failures. */
    }
    try {
      copyChatSessionsAfterCreate(ownerId, documentId, normalized.id, localStorage);
    } catch {
      /* RAM source remains available for download. */
    }
    if (kept) {
      try {
        if (
          sessionStorage.getItem('examcraft:bootstrap-id:' + encodeURIComponent(ownerId)) ===
          documentId
        )
          sessionStorage.setItem(
            'examcraft:bootstrap-id:' + encodeURIComponent(ownerId),
            'bootstrap_' + crypto.randomUUID(),
          );
      } catch {
        /* Keep old pointer, never delete source. */
      }
      if (proposal) journal.archive();
    }
    accepted.current = true;
    onAccept(normalized, tool);
  };
  const manualStart = () => {
    const subjects = getCatalogSubjects(facts.grade ?? undefined);
    if (!facts.subject || !facts.grade || !subjects.some((s) => s.key === facts.subject)) {
      setError('Chọn môn và lớp trước khi mở bàn soạn.');
      return;
    }
    const now = new Date().toISOString();
    accept(
      {
        id: 'draft_' + crypto.randomUUID(),
        metadata: {
          title: facts.title || 'Đề chưa đặt tên',
          subject: facts.subject as Subject,
          grade: facts.grade,
          schoolName: '',
          departmentName: '',
          ...(facts.durationMinutes ? { durationMinutes: facts.durationMinutes } : {}),
          ...(facts.academicYear ? { academicYear: facts.academicYear } : {}),
          ...(facts.targetExam ? { targetExam: facts.targetExam } : {}),
        },
        questions: [],
        createdAt: now,
        updatedAt: now,
      },
      manual ?? 'detail',
    );
  };
  const download = () => {
    const raw = JSON.stringify({ session, proposal: journal.entry?.raw }, null, 2),
      url = URL.createObjectURL(new Blob([raw], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'examcraft-yeu-cau-va-de-xuat.json';
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <main
      className="h-full min-h-0 overflow-auto bg-[var(--background)] p-3 sm:p-6"
      aria-label="Bắt đầu đề mới"
    >
      <section className="mx-auto flex min-h-[min(44rem,90dvh)] max-w-3xl flex-col rounded-xl border bg-[var(--ui-surface)] p-4 sm:p-6 gap-4">
        <header>
          <Link href="/" className="inline-flex min-h-11 items-center text-sm underline">
            Về kho đề
          </Link>
          <h1 className="font-semibold text-lg">Bạn muốn soạn đề gì?</h1>
          <p className="text-sm text-[var(--ui-text-secondary)]">
            Mô tả yêu cầu cho AI, hoặc chọn cách bắt đầu bên dưới. Chưa tạo đề trong kho.
          </p>
        </header>
        {journal.notice && (
          <p role="status" className="text-sm">
            {journal.notice}
          </p>
        )}
        <ChatRecoveryTools
          disabled={busy || !!candidate}
          recovery={recovery}
          restore={restore}
          onRestore={(next) => {
            setText(next.draft);
            setAnswer(next.freeAnswer ?? '');
            setFacts(next.bootstrapFacts ?? { subject: null, grade: null, durationMinutes: null });
            setOrigins(next.factOrigins ?? {});
            setError('');
          }}
        />
        {notice && (
          <p role="status" className="text-sm">
            {notice}
          </p>
        )}
        {session?.turns.length ? (
          <div aria-label="Lịch sử trò chuyện" className="space-y-2">
            {session.turns.map((turn) => (
              <div
                key={turn.id}
                className="rounded-lg border p-3 text-sm whitespace-pre-wrap break-words"
              >
                <b>{turn.role === 'user' ? 'Bạn' : 'AI'}</b>
                <p>{turn.text}</p>
              </div>
            ))}
          </div>
        ) : null}
        {(facts.subject || facts.grade || facts.targetExam) && (
          <p role="status" className="text-sm">
            Đang soạn yêu cầu:{' '}
            {getCatalogSubjects().find((s) => s.key === facts.subject)?.label ?? 'Chưa chọn môn'} ·{' '}
            {facts.grade ? 'Lớp ' + facts.grade : 'Chưa chọn lớp'}
            {facts.durationMinutes ? ' · ' + facts.durationMinutes + ' phút' : ''}
            {facts.targetExam?.year ? ' · Năm ' + facts.targetExam.year : ''}
          </p>
        )}
        {session?.clarification && !candidate && (
          <section aria-label="Cần thêm thông tin" className="space-y-2 rounded-xl border p-3">
            <p className="font-medium text-sm">{session.clarification.message}</p>
            <div className="flex flex-wrap gap-2">
              {session.clarification.quickOptions.map((option, i) => (
                <button
                  key={i}
                  disabled={busy}
                  className="app-button-secondary min-h-11 px-3 text-sm"
                  onClick={() =>
                    void send(
                      option,
                      true,
                      false,
                      (session.clarification!.options ??
                        clarifyCard(
                          session.clarification!.questionId,
                          session.clarification!.message,
                          session.clarification!.quickOptions,
                        ).options)![i].id,
                    )
                  }
                >
                  {option}
                </button>
              ))}
            </div>
            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                void send(answer, true, true);
              }}
            >
              <input
                aria-label="Tự nhập câu trả lời"
                value={answer}
                onChange={(event) => {
                  answerRevision.current++;
                  setAnswer(event.target.value);
                }}
                maxLength={12000}
                className="min-w-0 flex-1 rounded-lg border bg-[var(--ui-surface)] p-2"
              />
              <button
                disabled={busy || !answer.trim()}
                className="app-button-secondary min-h-11 px-3"
              >
                Trả lời
              </button>
            </form>
          </section>
        )}
        {candidate && (
          <section aria-label="Đề xuất trọn đề" className="space-y-3 rounded-xl border p-3">
            <h2 className="font-semibold">
              Đề xuất · {candidate.questions.length} câu · {candidate.metadata.durationMinutes} phút
            </h2>
            <p className="text-sm">
              {candidate.metadata.title} ·{' '}
              {getCatalogSubjects(candidate.metadata.grade).find(
                (subject) => subject.key === candidate.metadata.subject,
              )?.label ?? candidate.metadata.subject}{' '}
              · Lớp {candidate.metadata.grade}
              {candidate.metadata.academicYear
                ? ' · Năm học ' + candidate.metadata.academicYear
                : ''}
              {candidate.metadata.targetExam?.year
                ? ' · Năm thi ' + candidate.metadata.targetExam.year
                : ''}
              {candidate.metadata.targetExam?.locality
                ? ' · ' + candidate.metadata.targetExam.locality
                : ''}
            </p>
            <p className="text-sm">{PRACTICE_LABEL}</p>
            {stale && (
              <p role="alert">
                Yêu cầu đã thay đổi. Đề xuất cũ vẫn giữ; hãy cất rồi tạo lại từ yêu cầu hiện tại.
              </p>
            )}
            <details>
              <summary className="cursor-pointer min-h-11">Xem đề, đáp án và lời giải</summary>
              {candidate.passages?.map((passage) => (
                <div key={passage.id} className="my-2 text-sm">
                  <MathRenderer content={passage.content} />
                  {passage.figures?.map((figure) => (
                    <FigureView key={figure.id} figure={figure} />
                  ))}
                </div>
              ))}
              {candidate.questions.map((question, i) => (
                <div key={question.id} className="border-t py-2">
                  <b>Câu {i + 1}</b>
                  <AiProposalPreview question={question} />
                </div>
              ))}
            </details>
            <div className="flex flex-wrap gap-2">
              <button
                disabled={stale || busy}
                className="app-button-primary min-h-11 px-4"
                onClick={() => accept(candidate)}
              >
                Nhận đề
              </button>
              <button
                className="app-button-secondary min-h-11 px-3"
                onClick={() => journal.archive()}
              >
                Cất đề xuất
              </button>
              <button className="app-button-secondary min-h-11 px-3" onClick={download}>
                Tải đề xuất
              </button>
            </div>
          </section>
        )}
        {error && (
          <div role="alert" className="rounded-lg border p-3 text-sm">
            <p>{error}</p>
            {['NO_API_KEY', 'INVALID_KEY', 'EXPIRED_KEY', 'REVOKED_KEY', 'KEY_DISABLED'].includes(
              code,
            ) && (
              <button className="underline min-h-11" onClick={openKeys}>
                Quản lý khóa AI
              </button>
            )}
            {code === 'KEY_LOADING' && (
              <button className="underline min-h-11" onClick={() => void reloadKeys()}>
                Tải lại danh sách khóa
              </button>
            )}
            {retry && code !== 'KEY_LOADING' && (
              <button
                disabled={busy || !!candidate}
                className="underline min-h-11 ml-3"
                onClick={() => void send(retry.text, retry.reply, retry.fromInput)}
              >
                Tiếp tục yêu cầu này
              </button>
            )}
          </div>
        )}
        <form
          className="mt-auto space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            void send();
          }}
        >
          <label className="block text-sm font-medium" htmlFor="bootstrap-command">
            Yêu cầu của bạn
          </label>
          <textarea
            id="bootstrap-command"
            aria-label="Yêu cầu tạo đề"
            value={text}
            maxLength={12000}
            rows={3}
            onChange={(event) => {
              revision.current++;
              setText(event.target.value);
            }}
            onKeyDown={(event) => {
              if (
                event.key === 'Enter' &&
                !event.shiftKey &&
                !touch &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();
                if (!busy) void send();
              }
            }}
            placeholder="Ví dụ: Tạo đề luyện thi vào 10 Hà Nội môn Toán…"
            className="w-full rounded-xl border bg-[var(--ui-surface)] text-[var(--ui-text-primary)] p-3 text-sm"
          />
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-auto text-xs">
              {touch ? 'Enter xuống dòng · gửi bằng nút' : 'Enter gửi · Shift+Enter xuống dòng'}
            </span>
            {busy && (
              <button
                type="button"
                className="app-button-secondary min-h-11 px-3"
                onClick={() => {
                  sequence.current++;
                  controller.current?.abort();
                  pending.current = false;
                  setBusy(false);
                  setSession((old) => (old ? { ...old, pending: false } : old));
                  setError('Đã dừng. Yêu cầu và chữ đang gõ vẫn được giữ.');
                }}
              >
                Dừng
              </button>
            )}
            <button
              disabled={busy || !!candidate || !text.trim() || !session}
              className="app-button-primary min-h-11 px-4"
            >
              {busy ? 'Đang soạn…' : 'Gửi yêu cầu'}
            </button>
          </div>
        </form>
        <div className="flex flex-wrap gap-2 border-t pt-3">
          {(
            [
              ['detail', 'Tự soạn'],
              ['template', 'Dùng mẫu'],
              ['import', 'Nhập tài liệu'],
            ] as const
          ).map(([tool, label]) => (
            <button
              key={tool}
              disabled={busy}
              className="app-button-secondary min-h-11 px-3 text-sm"
              onClick={() => setManual(tool)}
            >
              {label}
            </button>
          ))}
          <button className="text-xs underline min-h-11" onClick={download}>
            Tải yêu cầu
          </button>
          <button
            disabled={busy || !!candidate}
            className="text-xs underline min-h-11"
            onClick={() => {
              if (startNew()) {
                setFacts({ subject: null, grade: null, durationMinutes: null });
                setOrigins({});
                setText('');
                setAnswer('');
                setError('');
              }
            }}
          >
            Yêu cầu mới
          </button>
        </div>
        {manual && (
          <fieldset className="space-y-3 rounded-xl border p-3">
            <legend>Chọn môn và lớp</legend>
            <label className="block text-sm">
              Lớp
              <select
                aria-label="Lớp bắt đầu"
                value={facts.grade ?? ''}
                onChange={(event) => {
                  factsRevision.current++;
                  const next = {
                    ...facts,
                    grade: event.target.value ? Number(event.target.value) : null,
                  };
                  setOrigins((old) => trackFactOrigins(facts, next, old, 'manual'));
                  setFacts(next);
                }}
                className="w-full min-h-11 rounded-lg border bg-[var(--ui-surface)] p-2"
              >
                <option value="">Chưa chọn lớp</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i + 1}>
                    Lớp {i + 1}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Môn
              <select
                aria-label="Môn bắt đầu"
                value={facts.subject ?? ''}
                onChange={(event) => {
                  factsRevision.current++;
                  const next = { ...facts, subject: event.target.value || null };
                  setOrigins((old) => trackFactOrigins(facts, next, old, 'manual'));
                  setFacts(next);
                }}
                className="w-full min-h-11 rounded-lg border bg-[var(--ui-surface)] p-2"
              >
                <option value="">Chưa chọn môn</option>
                {getCatalogSubjects(facts.grade ?? undefined).map((subject) => (
                  <option key={subject.key} value={subject.key}>
                    {subject.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="app-button-primary min-h-11 px-4"
              onClick={manualStart}
            >
              Mở bàn soạn
            </button>
          </fieldset>
        )}
      </section>
    </main>
  );
}
