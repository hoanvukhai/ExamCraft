'use client';
import { PageHeader } from '@/components/workspace/ui';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { accountFetch } from '@/lib/account-fetch';
import type { Question, Passage } from '@/types/exam';
import { bankPassage, deleteBankQuestion, type BankQuestion } from '@/lib/question-client';
import { normalizeQuestion } from '@/lib/exam-document';
import { getCatalogSubjects } from '@/lib/education-catalog';
import { matchingDisplay, orderingDisplay } from '@/lib/structured-question';
import { questionTypeLabels, subjectLabel, teacherErrorMessage } from '@/lib/teacher-ui';
import { useConfirmAction } from './ConfirmAction';
import { useBankField } from '@/hooks/useBankField';
import { MathRenderer } from './MathRenderer';
import { FigureView } from './FigureView';

interface Props { ownerId: string; isOpen: boolean; onClose: () => void; onInsertQuestion: (q: Question, passage?: Passage) => void; allowInsert?: boolean; pageMode?: boolean }
type Item = BankQuestion & { author?: { id: string; name: string }; shareable?: boolean };
const field = 'teacher-field w-full min-h-10 rounded-lg border bg-[var(--ui-surface)] px-3 py-2 text-sm';
const levels: Record<string, string> = { nhan_biet: 'Nhận biết', thong_hieu: 'Thông hiểu', van_dung: 'Vận dụng', van_dung_cao: 'Vận dụng cao' };
export function QuestionBankPage({ ownerId }: { ownerId: string }) { return <QuestionBankContent key={ownerId} ownerId={ownerId} isOpen pageMode allowInsert={false} onClose={() => {}} onInsertQuestion={() => {}} />; }
export function QuestionBankModal(props: Props) { return props.isOpen ? <QuestionBankContent key={props.ownerId} {...props} /> : null; }
function QuestionBankContent({ ownerId, onClose, onInsertQuestion, allowInsert = true, pageMode = false }: Props) {
  const [tab, setTab] = useBankField<'personal' | 'shared'>('tab', 'personal', pageMode);
  const [search, setSearch] = useBankField<string>('search', '', pageMode), [subject, setSubject] = useBankField<string>('subject', 'all', pageMode), [grade, setGrade] = useBankField<string>('grade', 'all', pageMode);
  const [type, setType] = useBankField<string>('type', 'all', pageMode), [difficulty, setDifficulty] = useBankField<string>('difficulty', 'all', pageMode), [page, setPage] = useBankField<number>('page', 1, pageMode);
  const [items, setItems] = useState<Item[]>([]), [total, setTotal] = useState(0), [pages, setPages] = useState(1);
  const [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(''), [refresh, setRefresh] = useState(0);
  const queryKey = JSON.stringify([ownerId, tab, page, search, subject, grade, type, difficulty, refresh]);
  const [loadedQuery, setLoadedQuery] = useState('');
  const [dataQuery, setDataQuery] = useState('');
  const loading = loadedQuery !== queryKey;
  const sequence = useRef(0), mutation = useRef(false);
  const panel = useRef<HTMLElement>(null);
  const { confirmAction, confirmation } = useConfirmAction();
  const reload = () => setRefresh(value => value + 1);
  useEffect(() => {
    const request = ++sequence.current, controller = new AbortController();
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (search.trim()) params.set('search', search.trim());
    if (subject !== 'all') params.set('subject', subject);
    if (grade !== 'all') params.set('grade', grade);
    if (type !== 'all') params.set('type', type.toUpperCase());
    if (difficulty !== 'all') params.set('difficulty', difficulty.toUpperCase());
    void accountFetch(ownerId, `/api/questions${tab === 'shared' ? '/shared' : ''}?${params}`, { cache: 'no-store', signal: controller.signal }).then(async response => {
      const data = await response.json();
      if (controller.signal.aborted || sequence.current !== request) return;
      if (!response.ok) throw Error(data.error || 'Chưa tải được ngân hàng câu hỏi.');
      setError('');
      const last = Math.max(1, data.pagination.totalPages);
      if (page > last) { setPage(last); return; }
      setItems(data.questions.map((q: Record<string, unknown>) => ({ ...normalizeQuestion(q), id: String(q.id), passage: bankPassage(q.passage), passageUnavailable: q.passageUnavailable === true, shareable: q.shareable !== false, importedFromFile: q.sourceKind === 'IMPORTED_FILE', author: q.author })));
      setTotal(data.pagination.totalCount); setPages(last);
      setDataQuery(queryKey);
    }).catch(cause => { if (!controller.signal.aborted && sequence.current === request) setError(teacherErrorMessage(cause, 'Chưa kết nối được để tải ngân hàng. Hãy thử lại.')); })
      .finally(() => { if (!controller.signal.aborted && sequence.current === request) setLoadedQuery(queryKey); });
    return () => controller.abort();
  }, [ownerId, tab, page, search, subject, grade, type, difficulty, refresh, setPage, queryKey]);
  useEffect(() => {
    if (pageMode) return;
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.querySelector<HTMLElement>('button')?.focus();
    const escape = (event: KeyboardEvent) => {
      if (document.querySelector('dialog[open]')) return;
      if (event.key === 'Escape' && !mutation.current) onClose();
      if (event.key === 'Tab') {
        const elements = [...(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input, select, summary') ?? [])].filter(el => el.getClientRects().length);
        const target = event.shiftKey && document.activeElement === elements[0] ? elements.at(-1) : !event.shiftKey && document.activeElement === elements.at(-1) ? elements[0] : null;
        if (target) { event.preventDefault(); target.focus(); }
      }
    };
    window.addEventListener('keydown', escape); return () => { window.removeEventListener('keydown', escape); if (previous?.isConnected) previous.focus(); };
  }, [onClose, pageMode]);
  const act = async (q: Item, action: 'delete' | 'fork' | 'replication') => {
    if (mutation.current) return;
    mutation.current = true; setBusy(q.id); setNotice(''); setError('');
    try {
      if (action === 'delete') {
        if (!await confirmAction('Xóa câu này khỏi ngân hàng cá nhân? Nội dung đã có trong đề hoặc bài giao được giữ lại.')) return;
        await deleteBankQuestion(q.id, ownerId); setNotice('Đã xóa câu khỏi ngân hàng.');
      } else {
        const response = await accountFetch(ownerId, `/api/questions/${encodeURIComponent(q.id)}${action === 'fork' ? '/fork' : ''}`, { method: action === 'fork' ? 'POST' : 'PATCH', ...(action === 'replication' ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ baseVersion: q.version, shareable: q.shareable === false, revisionNote: 'Giáo viên đổi quyền nhân bản nguồn' }) } : {}) });
        const result = await response.json(); if (!response.ok) throw Error(result.error || 'Thao tác chưa được lưu.');
        setNotice(action === 'fork' ? 'Đã nhân bản vào ngân hàng cá nhân.' : 'Đã cập nhật quyền nhân bản.');
      }
      reload();
    } catch (cause) { setError(teacherErrorMessage(cause, 'Chưa kết nối được. Hãy thử lại.')); }
    finally { mutation.current = false; setBusy(''); }
  };
  const choose = (q: Item) => {
    const passage = bankPassage(q.passage);
    if (q.passageUnavailable || q.passageId && !passage) { setError('Câu này chưa có ngữ liệu được phép dùng. Hãy bổ sung trước khi chèn.'); return; }
    onInsertQuestion(q, passage); setNotice('Đã thêm câu vào đề đang soạn.');
  };
  const filters = search || subject !== 'all' || grade !== 'all' || type !== 'all' || difficulty !== 'all';
  return <div className={pageMode ? '' : 'fixed inset-0 z-50 bg-black/60 p-3 sm:p-4 flex items-center justify-center'}>
    {pageMode && <PageHeader title="Ngân hàng câu hỏi" description="Quản lý câu hỏi cá nhân và tìm câu hỏi được chia sẻ nội bộ." />}
    <section ref={panel} role={pageMode ? undefined : 'dialog'} aria-modal={pageMode ? undefined : true} aria-label={pageMode ? undefined : 'Chọn câu từ ngân hàng'} className={`w-full bg-[var(--ui-surface)] text-[var(--foreground)] border rounded-xl ${pageMode ? 'mt-6' : 'max-w-5xl max-h-[92dvh] flex flex-col overflow-hidden'}`}>
      {!pageMode && <header className="p-4 sm:p-6 border-b flex flex-wrap items-start justify-between gap-3"><div>{pageMode ? <h1 className="text-2xl font-semibold">Ngân hàng câu hỏi</h1> : <h2 className="text-lg font-semibold">Chọn câu từ ngân hàng</h2>}<p className="text-sm text-[var(--ui-text-secondary)] mt-1">{pageMode ? 'Quản lý câu hỏi cá nhân và tìm câu hỏi được chia sẻ nội bộ.' : 'Tìm câu hỏi, xem đáp án và thêm vào đề đang soạn.'}</p></div>
        {!pageMode && <div className="flex gap-3 items-center text-sm"><Link href="/teacher/questions" target="_blank" rel="noreferrer" className="underline">Mở trang quản lý</Link><button type="button" aria-label="Đóng ngân hàng câu hỏi" onClick={onClose} className="app-button-secondary min-h-10 px-3">Đóng</button></div>}
      </header>}
      <div className="p-4 sm:p-6 space-y-4 overflow-auto min-h-0">
        {confirmation}{notice && <p role="status" className="border rounded-lg p-3 text-sm">{notice}</p>}
        <div className="flex flex-wrap gap-2" role="group" aria-label="Kho câu hỏi">{(['personal', 'shared'] as const).map(value => <button key={value} type="button" aria-pressed={tab === value} className={`${tab === value ? 'app-button-tonal' : 'app-button-secondary'} min-h-10 px-3 text-sm`} onClick={() => { setTab(value); setPage(1); setNotice(''); }}>{value === 'personal' ? 'Cá nhân' : 'Dùng chung nội bộ'}</button>)}</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <label className="text-sm">Tìm nội dung<input className={field} value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Tìm trong nội dung câu hỏi..." /></label>
          <label className="text-sm">Lớp<select aria-label="Lớp" className={field} value={grade} onChange={e => { setGrade(e.target.value); setSubject('all'); setPage(1); }}><option value="all">Tất cả lớp</option>{Array.from({ length: 12 }, (_, i) => i + 1).map(g => <option key={g} value={g}>Lớp {g}</option>)}</select></label>
          <label className="text-sm">Môn<select aria-label="Môn" className={field} value={subject} onChange={e => { setSubject(e.target.value); setPage(1); }}><option value="all">Tất cả môn</option>{getCatalogSubjects(grade === 'all' ? undefined : Number(grade)).map(s => <option key={s.key} value={s.key}>{s.label}</option>)}</select></label>
          <label className="text-sm">Dạng câu<select aria-label="Dạng câu" className={field} value={type} onChange={e => { setType(e.target.value); setPage(1); }}><option value="all">Tất cả dạng câu</option>{Object.entries(questionTypeLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
          <label className="text-sm">Độ khó đã lưu<select aria-label="Độ khó đã lưu" className={field} value={difficulty} onChange={e => { setDifficulty(e.target.value); setPage(1); }}><option value="all">Tất cả mức độ</option>{Object.entries(levels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        </div>
        {!loading && error && <div role="alert" className="border border-red-400 rounded-lg p-3 text-sm"><p>{error}</p><button type="button" onClick={reload} className="underline min-h-10">Thử lại</button></div>}
        {loading ? <p role="status">Đang tải câu hỏi...</p> : !error && <p className="text-sm text-[var(--ui-text-secondary)]">{total} câu phù hợp · Trang {page} / {pages}</p>}
        {!loading && !error && items.length === 0 && <p className="border border-dashed rounded-xl p-8 text-center">{filters ? 'Không có câu hỏi phù hợp bộ lọc.' : 'Chưa có câu hỏi trong kho này.'}</p>}
        {!loading && dataQuery === queryKey && items.map(q => {
          const matching = matchingDisplay(q), ordering = orderingDisplay(q);
          return <article key={q.id} data-bank-question={q.id} className="border rounded-xl p-4 space-y-3 [overflow-wrap:anywhere]">
            <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--ui-text-secondary)]"><span>{subjectLabel(q.subject || '')} · Lớp {q.grade}</span><span>· {questionTypeLabels[q.type] ?? q.type}</span>{q.author && tab === 'shared' && <span>· {q.author.name}</span>}</div>
            <MathRenderer content={q.content} />{q.figures?.map(figure => <FigureView key={figure.id} figure={figure} />)}
            {q.choices?.map(choice => <p key={choice.key}><b>{choice.key}.</b> <MathRenderer content={choice.text} inline /></p>)}
            {q.sub_questions?.map(sub => <p key={sub.key}><b>{sub.key}.</b> <MathRenderer content={sub.content} inline /></p>)}
            {matching && <div className="grid grid-cols-2 gap-3"><div>{matching.left.map(item => <p key={item.key}>{item.text}</p>)}</div><div>{matching.right.map(item => <p key={item.key}>{item.text}</p>)}</div></div>}
            {ordering && <div>{ordering.items.map((item, i) => <p key={item.key}>{i + 1}. {item.text}</p>)}</div>}
            {q.passage && <details><summary className="cursor-pointer">Ngữ liệu: {q.passage.title || 'Xem ngữ liệu'}</summary><MathRenderer content={q.passage.content} />{q.passage.figures?.map(figure => <FigureView key={figure.id} figure={figure} />)}</details>}
            <details><summary className="cursor-pointer">Đáp án và hướng dẫn</summary><div className="space-y-2 py-2">{q.correct_answer && <MathRenderer content={q.correct_answer} />}{q.accepted_answers?.map((answer, i) => <MathRenderer key={i} content={answer} />)}{q.sub_questions?.map(sub => <p key={sub.key}>{sub.key}: {sub.isCorrect === undefined ? 'Chưa có đáp án' : sub.isCorrect ? 'Đúng' : 'Sai'}</p>)}{q.matchingPairs?.map(pair => <p key={pair.id}>{pair.left} → {pair.right}</p>)}{q.correctOrder?.map((item, i) => <p key={i}>{i + 1}. {item}</p>)}{q.step_by_step_solution && <MathRenderer content={q.step_by_step_solution} />}{q.rubric?.map((criterion, i) => <p key={i}>{criterion.criterion}: {criterion.maxPoints} điểm</p>)}</div></details>
            <div className="flex flex-wrap gap-2 text-sm">{allowInsert && <button type="button" disabled={!!busy} className="app-button-primary min-h-10 px-3" onClick={() => choose(q)}>Thêm vào đề</button>}
              {tab === 'shared' ? <button type="button" disabled={!!busy} className="app-button-secondary min-h-10 px-3" onClick={() => void act(q, 'fork')}>Nhân bản về cá nhân</button> : <>{q.importedFromFile && <button type="button" disabled={!!busy} className="app-button-secondary min-h-10 px-3" onClick={() => void act(q, 'replication')}>{q.shareable === false ? 'Cho phép nhân bản' : 'Ngừng cho nhân bản'}</button>}<button type="button" disabled={!!busy} className="app-button-secondary min-h-10 px-3 text-red-700 dark:text-red-300" onClick={() => void act(q, 'delete')}>Xóa khỏi ngân hàng</button></>}
              {busy === q.id && <span role="status">Đang xử lý...</span>}
            </div>
          </article>;
        })}
        {!error && <nav aria-label="Trang ngân hàng" className="flex flex-wrap gap-3 items-center justify-center"><button type="button" disabled={loading || page <= 1} className="app-button-secondary min-h-10 px-3 disabled:opacity-40" onClick={() => setPage(p => p - 1)}>Trang trước</button><span>{page} / {pages}</span><button type="button" disabled={loading || page >= pages} className="app-button-secondary min-h-10 px-3 disabled:opacity-40" onClick={() => setPage(p => p + 1)}>Trang sau</button></nav>}
      </div>
    </section>
  </div>;
}
