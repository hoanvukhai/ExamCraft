'use client';

import { useRef, useState } from 'react';
import type { Exam } from '@/types/exam';
import { reviewQuestionKnowledge } from '@/lib/question-knowledge';
import { accountFetch } from '@/lib/account-fetch';
import { acceptScopeChat, scopeChatStamp, validateScopeChatResult, type ScopeChatResult } from '@/lib/scope-chat';
import { assertKnowledgeRevision, bookEntryTargets, emptyKnowledgeScope, parseKnowledgePackage, proposeKnowledgeScope, resolveKnowledgeScope, type KnowledgePackage, type KnowledgeScope } from '@/lib/knowledge-package';

const field = 'w-full border rounded p-2 bg-transparent text-sm';
const message = (error: unknown) => error instanceof Error && error.name !== 'ZodError' ? error.message : 'Tệp chưa đúng mẫu gói kiến thức. Hãy kiểm tra định dạng, mã và các liên kết.';

type ScopeEditorProps = { exam: Exam; ownerId: string; hasActiveKey?: boolean; onChange: (update: (previous: Exam) => Exam) => void };
export function KnowledgeScopeEditor(props: ScopeEditorProps) {
  return <KnowledgeScopeEditorContent key={`${props.ownerId}:${props.exam.id}`} {...props} />;
}

function KnowledgeScopeEditorContent({ exam, ownerId, hasActiveKey = false, onChange }: ScopeEditorProps) {
  const [imported, setImported] = useState<KnowledgePackage | null>(null), [draft, setDraft] = useState<KnowledgeScope | null>(null), [error, setError] = useState('');
  const [methodText, setMethodText] = useState<string | null>(null);
  const [chatText, setChatText] = useState(''), [bookId, setBookId] = useState<string | null>(null), [chatBusy, setChatBusy] = useState(false);
  const [proposal, setProposal] = useState<{ result: ScopeChatResult; stamp: string } | null>(null);
  const chatPending = useRef(false);
  const request = useRef(0), pkg = imported ?? exam.metadata.knowledgePackage;
  const current = pkg ? draft ?? (imported ? emptyKnowledgeScope(pkg) : exam.metadata.knowledgeScope ?? emptyKnowledgeScope(pkg)) : null;
  const savedStamp = scopeChatStamp({ package: exam.metadata.knowledgePackage, scope: exam.metadata.knowledgeScope });
  const chatStamp = scopeChatStamp({ ownerId, examId: exam.id, subject: exam.metadata.subject, grade: exam.metadata.grade, package: pkg, current, savedStamp, bookId, chatText });
  const proposalIsCurrent = proposal?.stamp === chatStamp;
  let summary: ReturnType<typeof resolveKnowledgeScope> | undefined;
  try { if (pkg && current) summary = resolveKnowledgeScope(pkg, current); } catch { /* A stale revision remains visible for explicit replacement. */ }
  const select = (kind: 'Knowledge' | 'Outcome', id: string, value: string) => {
    if (!current) return;
    const include = `include${kind}Ids` as const, exclude = `exclude${kind}Ids` as const;
    setDraft({ ...current, [include]: [...current[include].filter(item => item !== id), ...(value === 'include' ? [id] : [])], [exclude]: [...current[exclude].filter(item => item !== id), ...(value === 'exclude' ? [id] : [])] });
  };
  const state = (kind: 'Knowledge' | 'Outcome', id: string) => current?.[`exclude${kind}Ids`].includes(id) ? 'exclude' : current?.[`include${kind}Ids`].includes(id) ? 'include' : '';
  const apply = () => {
    if (!pkg || !current) return;
    try {
      // Validate in the event handler: React may execute an updater outside this catch.
      const checked = parseKnowledgePackage(pkg, exam.metadata), scope = resolveKnowledgeScope(checked, current).scope;
      assertKnowledgeRevision(exam.metadata.knowledgePackage, checked);
      onChange(previous => {
        if (previous.metadata.subject !== checked.subject || previous.metadata.grade !== checked.grade) return previous;
        if (previous.id !== exam.id || scopeChatStamp({ package: previous.metadata.knowledgePackage, scope: previous.metadata.knowledgeScope }) !== savedStamp) return previous;
        const changedPackage = previous.metadata.knowledgePackage?.id !== checked.id || previous.metadata.knowledgePackage?.revision !== checked.revision;
        return { ...previous, metadata: { ...previous.metadata, knowledgePackage: checked, knowledgeScope: scope, sourcePackageId: checked.id }, questions: changedPackage ? previous.questions.map(q => ({ ...q, status: 'draft', verifiedBy: 'none' })) : previous.questions };
      });
      // Keep the local table until the teacher discards it explicitly. A newer
      // parent update can reject the updater; clearing here would lose that draft.
      setError('');
      setProposal(null);
    } catch (cause) { setError(message(cause)); }
  };
  const askScope = async () => {
    if (!pkg || !current || !hasActiveKey || exam.access?.canEdit === false || chatPending.current) return;
    chatPending.current = true; setChatBusy(true); setError(''); setProposal(null);
    const stamp = chatStamp;
    try {
      const checked = parseKnowledgePackage(pkg, exam.metadata);
      resolveKnowledgeScope(checked, current);
      const response = await accountFetch(ownerId, '/api/knowledge-scope/propose', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ params: { subject: exam.metadata.subject, grade: exam.metadata.grade, knowledgePackage: checked, scope: current, message: chatText, bookId } }) });
      const data = await response.json();
      if (!response.ok || data.success !== true) throw Error(typeof data.error === 'string' ? data.error : 'Chưa nhận được đề nghị phạm vi.');
      const result = validateScopeChatResult(data.result, checked, current, bookId);
      setProposal({ result, stamp });
    } catch (cause) { setError(message(cause)); }
    finally { chatPending.current = false; setChatBusy(false); }
  };
  const download = () => {
    if (!pkg) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(pkg, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = 'ExamCraft-goi-kien-thuc.json'; a.click(); URL.revokeObjectURL(url);
  };
  let diff: ReturnType<typeof proposeKnowledgeScope> | undefined;
  try { if (pkg && current) diff = proposeKnowledgeScope(pkg, exam.metadata.knowledgeScope?.packageId === pkg.id && exam.metadata.knowledgeScope.packageRevision === pkg.revision ? exam.metadata.knowledgeScope : emptyKnowledgeScope(pkg), current); } catch { /* Selection errors are shown when applying. */ }
  return <details className="border rounded-xl p-3 bg-white dark:bg-[#1e1e1e]"><summary className="cursor-pointer font-semibold text-sm">Kiến thức và phạm vi ra đề {pkg ? `· ${pkg.title}` : '(tùy chọn)'}</summary>
    <p className="text-xs my-2">Chọn kiến thức theo chương trình hoặc mục lục đã liên kết. Chưa có gói thì vẫn tự soạn và mô tả phạm vi bằng chữ. Gói nhập luôn chờ duyệt; hệ thống không tự xác nhận tài liệu chính thức.</p>
    <label className="text-sm block">Nhập gói kiến thức (.json)<input type="file" accept=".json,application/json" onChange={async event => {
      const file = event.target.files?.[0], generation = ++request.current; event.target.value = ''; if (!file) return;
      try { if (file.size > 2 * 1024 * 1024) throw Error('Gói vượt 2 MB.'); const parsed = parseKnowledgePackage(JSON.parse(await file.text()), exam.metadata); if (generation !== request.current) return; setImported(parsed); setDraft(emptyKnowledgeScope(parsed)); setMethodText(null); setError(''); }
      catch (cause) { if (generation === request.current) setError(message(cause)); }
    }} /></label>
    {error && <p role="alert" className="text-sm text-red-600 my-2">{error}</p>}
    {pkg && current && <>
      <div className="text-xs my-3"><strong>{pkg.title}</strong> · Lớp {pkg.grade} · Phiên bản {pkg.revision} · Chờ duyệt nguồn<button type="button" onClick={download} className="underline ml-3">Tải gói</button></div>
      {(pkg.grade !== exam.metadata.grade || pkg.subject !== exam.metadata.subject) && <p role="alert" className="text-red-600 text-sm">Gói đang khác môn/lớp của đề. Hãy đổi lại môn/lớp hoặc nhập gói phù hợp.</p>}
      <div className="max-h-72 overflow-auto space-y-2 border rounded p-2">{pkg.knowledge.map(node => <label key={node.id} className="flex gap-2 items-center text-sm"><span className="grow">{node.parentId ? '↳ ' : ''}{node.title}</span><select className="border rounded p-1 bg-transparent" aria-label={`Phạm vi ${node.title}`} value={state('Knowledge', node.id)} onChange={e => select('Knowledge', node.id, e.target.value)}><option value="">Chưa chọn</option><option value="include">Bao gồm</option><option value="exclude">Loại trừ</option></select></label>)}</div>
      <p className="text-xs my-2">Chọn một mục bao gồm các mục con. Loại trừ luôn được ưu tiên, kể cả khi chọn trực tiếp yêu cầu cần đạt.</p>
      <details className="my-3"><summary className="text-sm cursor-pointer">Yêu cầu cần đạt ({pkg.outcomes.length})</summary><div className="max-h-64 overflow-auto space-y-2 mt-2">{pkg.outcomes.map(item => <label key={item.id} className="flex gap-2 items-center text-sm"><span className="grow">{item.text}</span><select className="border rounded bg-transparent p-1" value={state('Outcome', item.id)} onChange={e => select('Outcome', item.id, e.target.value)}><option value="">Theo kiến thức</option><option value="include">Bao gồm</option><option value="exclude">Loại trừ</option></select></label>)}</div></details>
      {pkg.books.length > 0 && <details className="my-3 text-sm"><summary className="cursor-pointer">Chọn qua mục lục sách</summary>{pkg.books.map(book => <div key={book.id} className="border rounded p-2 my-2"><b>{book.series} · {book.title} · {book.edition}</b>{book.entries.map(entry => { const targets = bookEntryTargets(pkg, book.id, entry.id), mapped = targets.knowledgeIds.length + targets.outcomeIds.length > 0; return <div key={entry.id} className="flex justify-between gap-2 my-2"><span>{entry.title}</span><button type="button" disabled={!mapped} className="underline" onClick={() => setDraft({ ...current, includeKnowledgeIds: [...new Set([...current.includeKnowledgeIds, ...targets.knowledgeIds])], includeOutcomeIds: [...new Set([...current.includeOutcomeIds, ...targets.outcomeIds])] })}>{mapped ? 'Đưa vào phạm vi' : 'Chưa có liên kết'}</button></div>; })}</div>)}</details>}
      <label className="block text-sm">Giới hạn phương pháp / điều chưa học (mỗi dòng một yêu cầu)<textarea className={field} rows={3} value={methodText ?? current.methodConstraints.join('\n')} onChange={e => { setMethodText(e.target.value); setDraft({ ...current, methodConstraints: e.target.value.split('\n').map(line => line.trim()).filter(Boolean) }); }} /></label>
      <details className="border rounded p-3 my-3 text-sm"><summary className="cursor-pointer font-medium">Nhờ AI đề nghị phạm vi qua chat</summary>
        <p className="text-xs my-2">Mô tả phần bao gồm, loại trừ và phương pháp chưa học. AI chỉ đề nghị để duyệt, dùng khóa và hạn mức AI của tài khoản. Nếu nhắc tới bài trong sách, hãy chọn đúng ấn bản; thiếu bài hoặc liên kết cần làm rõ.</p>
        <label className="block my-2">Ấn bản sách cho yêu cầu này<select className={field} value={bookId ?? ''} onChange={e => setBookId(e.target.value || null)}><option value="">Chưa chọn sách · dùng cây kiến thức</option>{pkg.books.map(book => <option key={book.id} value={book.id}>{book.series} · {book.title} · {book.edition}</option>)}</select></label>
        <label className="block">Yêu cầu phạm vi<textarea className={field} rows={3} maxLength={6000} value={chatText} onChange={e => setChatText(e.target.value)} placeholder="Ví dụ: Bao gồm phép cộng, loại trừ phép trừ; chỉ dùng cách đã học." /></label>
        {!hasActiveKey && <p className="text-xs my-2">Thêm hoặc bật khóa trong mục Khóa AI trước khi gửi.</p>}
        <button type="button" className="underline my-2 disabled:opacity-50" disabled={chatBusy || !hasActiveKey || !summary || !chatText.trim() || pkg.subject !== exam.metadata.subject || pkg.grade !== exam.metadata.grade || exam.access?.canEdit === false} onClick={() => void askScope()}>{chatBusy ? 'Đang xin đề nghị…' : 'Gửi yêu cầu đề nghị phạm vi'}</button>
        {proposal && <div className="border rounded p-2" aria-live="polite">
          {!proposalIsCurrent && <p role="alert">Gói, phạm vi hoặc yêu cầu đã thay đổi. Đề nghị cũ không thể nhận; hãy gửi lại.</p>}
          {proposal.result.kind === 'clarification' ? <><p>Cần làm rõ trước khi chọn phạm vi:</p><ul className="list-disc pl-5">{proposal.result.questions.map((question, index) => <li key={index}>{question}</li>)}</ul><p className="text-xs">Bổ sung yêu cầu hoặc chọn ấn bản rồi gửi lại. Phạm vi được giữ nguyên.</p></> : <>
            <p>{proposal.result.explanation}</p>
            <p className="text-xs my-2">So sánh lựa chọn hiện tại → đề nghị. Bao gồm mục cha sẽ bao gồm mục con; loại trừ được ưu tiên.</p>
            <div className="overflow-x-auto"><table className="w-full text-xs border"><thead><tr><th className="p-1 text-left">Mục</th><th className="p-1 text-left">Hiện tại</th><th className="p-1 text-left">Đề nghị</th></tr></thead><tbody>{([
              ['includeKnowledgeIds', 'Bao gồm kiến thức'], ['excludeKnowledgeIds', 'Loại trừ kiến thức'], ['includeOutcomeIds', 'Bao gồm yêu cầu'], ['excludeOutcomeIds', 'Loại trừ yêu cầu'], ['methodConstraints', 'Giới hạn phương pháp'],
            ] as const).map(([key, title]) => { const label = (values: string[]) => values.map(id => key === 'methodConstraints' ? id : pkg.knowledge.find(n => n.id === id)?.title ?? pkg.outcomes.find(o => o.id === id)?.text ?? id).join('; ') || 'Không có'; return <tr key={key} className="border-t"><th className="p-1 text-left">{title}</th><td className="p-1">{label(current[key])}</td><td className="p-1">{label(proposal.result.kind === 'proposal' ? proposal.result.scope[key] : [])}</td></tr>; })}</tbody></table></div>
            <button type="button" className="bg-blue-600 text-white rounded px-3 py-2 my-2 disabled:opacity-50" disabled={!proposalIsCurrent || exam.access?.canEdit === false} onClick={() => { try { const scope = acceptScopeChat(proposal.result, proposal.stamp, chatStamp, pkg, current, bookId); setDraft(scope); setMethodText(null); setProposal(null); setError(''); } catch (cause) { setError(message(cause)); } }}>Nhận đề nghị vào bảng phạm vi</button>
            <p className="text-xs">Sau khi nhận, kiểm bảng rồi bấm Áp dụng phạm vi vào đề để lưu vào bản soạn.</p>
          </>}
          <button type="button" className="underline ml-2" onClick={() => setProposal(null)}>Hủy đề nghị</button>
        </div>}
      </details>
      <details className="my-3 text-xs"><summary className="cursor-pointer">Nguồn và quyền dùng ({pkg.sources.length})</summary>{pkg.sources.map(source => <p key={source.id}>{source.title} · {source.publisher} · {source.rights === 'unknown' ? 'Chưa rõ quyền dùng' : source.rights}{source.url && <a className="underline ml-2" href={source.url} target="_blank" rel="noreferrer">Mở nguồn</a>}</p>)}</details>
      <p className="text-sm my-2">Phạm vi dự kiến: {summary?.knowledge.length ?? 0} mục kiến thức, {summary?.outcomes.length ?? 0} yêu cầu cần đạt. {diff && `Thêm ${diff.addedKnowledge.length}, bỏ ${diff.removedKnowledge.length} mục so với phạm vi đang lưu.`}</p>
      {exam.metadata.knowledgePackage && <p className="text-xs my-2">Theo phạm vi đã áp dụng: {exam.questions.filter(q => reviewQuestionKnowledge(q, exam.metadata.knowledgePackage, exam.metadata.knowledgeScope).state === 'linked').length}/{exam.questions.length} câu có mã liên kết trong phạm vi. Mở sửa từng câu → Tiêu chí chấm và kiến thức để gắn hoặc kiểm lại. Đây là kiểm mã, chưa phải duyệt nội dung.</p>}
      <div className="flex gap-3 text-sm"><button type="button" className="bg-blue-600 text-white rounded px-3 py-2" onClick={apply}>Áp dụng phạm vi vào đề</button><button type="button" onClick={() => { setImported(null); setDraft(null); setMethodText(null); setError(''); }}>Bỏ thay đổi đang chọn</button></div>
      {exam.metadata.knowledgePackage && <div className="text-xs mt-3"><p>Có thể tải gói trước khi gỡ. Bản đã lưu còn trong lịch sử đề; các câu hỏi được giữ nguyên.</p><button type="button" className="underline mt-1" onClick={() => { onChange(previous => ({ ...previous, metadata: { ...previous.metadata, knowledgePackage: undefined, knowledgeScope: undefined, sourcePackageId: undefined } })); setImported(null); setDraft(null); setMethodText(null); }}>Gỡ gói khỏi đề, dùng phạm vi tự do</button></div>}
    </>}
  </details>;
}
