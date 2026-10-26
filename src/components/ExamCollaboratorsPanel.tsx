'use client';
import React, { useCallback, useEffect, useState } from 'react';
import type { ExamPermissions } from '@/lib/exam-collaboration';
import type { Exam } from '@/types/exam';

type Member = { id: string; userId: string; role: 'VIEWER' | 'COMMENTER' | 'EDITOR'; user: { name: string; email: string } };
type Revision = { version: number; note: string | null; createdAt: string; actor: { name: string } | null };
type Comment = { id: string; body: string; questionId: string | null; version: number | null; resolvedAt: string | null; resolvedByName: string | null; mine: boolean; createdAt: string; author: { name: string } | null };
const roles = { VIEWER: 'Chỉ xem', COMMENTER: 'Xem và góp ý', EDITOR: 'Cùng sửa nội dung' };
const inputClass = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm';
export function ExamCollaboratorsPanel({ examId, expectedUserId, questions = [], onRestored, beforeRestore }: { examId: string; expectedUserId: string; questions?: { id: string; label: string }[]; onRestored?: (document: Exam) => void; beforeRestore?: () => boolean | Promise<boolean> }) {
  const [permissions, setPermissions] = useState<ExamPermissions | null>(null);
  const [members, setMembers] = useState<Member[]>([]), [revisions, setRevisions] = useState<Revision[]>([]), [comments, setComments] = useState<Comment[]>([]);
  const [email, setEmail] = useState(''), [role, setRole] = useState<Member['role']>('VIEWER'), [body, setBody] = useState(''), [commentQuestion, setCommentQuestion] = useState('');
  const [error, setError] = useState(''), [busy, setBusy] = useState(false), [version, setVersion] = useState(0), [restoreVersion, setRestoreVersion] = useState<number | null>(null);
  const [preview, setPreview] = useState<Exam | null>(null);
  const request = async (path: string, method = 'GET', data?: unknown) => {
    const response = await fetch(`/api/exams/${encodeURIComponent(examId)}/${path}`, { method, cache: 'no-store', headers: { 'x-examcraft-user': expectedUserId, ...(data !== undefined ? { 'Content-Type': 'application/json' } : {}) }, ...(data !== undefined ? { body: JSON.stringify(data) } : {}) });
    const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Chưa xử lý được yêu cầu'); return result;
  };
  const load = useCallback(async () => {
    const fetchJson = async (path: string) => { const response = await fetch(`/api/exams/${encodeURIComponent(examId)}/${path}`, { cache: 'no-store', headers: { 'x-examcraft-user': expectedUserId } }); const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Không tải được cộng tác'); return result; };
    return Promise.all([fetchJson('collaborators'), fetchJson('history'), fetchJson('comments')]);
  }, [examId, expectedUserId]);
  const apply = useCallback(([access, history, discussion]: Awaited<ReturnType<typeof load>>) => {
    setPermissions(access.permissions); setMembers(access.members); setVersion(access.currentVersion); setRevisions(history.revisions); setComments(discussion.comments);
  }, []);
  const refresh = useCallback(async () => { apply(await load()); }, [load, apply]);
  // The parent keys this panel by exam/account; a different context starts fresh.
  useEffect(() => {
    let active = true;
    void load().then(result => { if (active) apply(result); }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [load, apply]);
  const act = async (action: () => Promise<void>) => { setBusy(true); setError(''); try { await action(); await refresh(); } catch (e) { setError(e instanceof Error ? e.message : 'Chưa xử lý được yêu cầu'); } finally { setBusy(false); } };
  return <section className="space-y-4 text-slate-800" aria-label="Cộng tác và lịch sử đề">
    <div><h3 className="font-semibold">Cùng soạn đề</h3><p className="mt-1 text-sm text-slate-500">Đề riêng tư mặc định. Mời tài khoản giáo viên có sẵn bằng email. Link xem công khai không cho phép sửa.</p></div>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {permissions && <p className="text-sm">Quyền của bạn: <strong>{permissions.role === 'OWNER' ? 'Chủ đề' : roles[permissions.role]}</strong>. Chỉ chủ đề được giao bài, phát hành, đổi quyền và khôi phục lịch sử.</p>}
    {permissions?.canManage && <div className="space-y-3 rounded-xl border p-3">
      <form className="flex flex-wrap gap-2" onSubmit={e => { e.preventDefault(); void act(async () => { await request('collaborators', 'POST', { email, role }); setEmail(''); }); }}>
        <input className={inputClass + ' min-w-0 flex-1'} aria-label="Email giáo viên" type="email" required maxLength={254} placeholder="Email giáo viên" value={email} onChange={e => setEmail(e.target.value)} />
        <select aria-label="Quyền cộng tác" className={inputClass} value={role} onChange={e => setRole(e.target.value as Member['role'])}>{Object.entries(roles).map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select>
        <button disabled={busy} className="rounded-lg app-button-primary px-3 py-2 text-sm text-white disabled:opacity-50">Cấp quyền</button>
      </form>
      <p className="text-xs text-slate-500">Có thể nhập lại cùng email để đổi quyền. Giáo viên được mời thấy đề trong kho sau khi đăng nhập.</p>
      {members.map(member => <div key={member.id} className="flex flex-wrap items-center justify-between gap-2 border-t pt-2 text-sm"><span>{member.user.name} — {member.user.email}<br /><span className="text-slate-500">{roles[member.role]}</span></span><button type="button" disabled={busy} className="text-red-700" onClick={() => void act(async () => { await request('collaborators', 'DELETE', { userId: member.userId }); })}>Thu hồi quyền</button></div>)}
    </div>}
    <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">Mỗi lần lưu là một phiên bản. Nếu hai người sửa cùng lúc, hệ thống yêu cầu đối chiếu khi bản máy chủ đã đổi; hãy giữ bản nháp của mình.</p>
    <details className="rounded-xl border p-3"><summary className="cursor-pointer font-medium">Lịch sử lưu ({revisions.length}{revisions.length === 100 ? '+' : ''})</summary>
      <button type="button" disabled={busy} className="my-2 text-sm text-blue-700" onClick={() => void act(refresh)}>Tải lại lịch sử và góp ý</button>
      {!revisions.length && <p className="text-sm text-slate-500">Đề cũ sẽ có bản nền khi lưu lần tiếp theo.</p>}
      {revisions.map(revision => <div key={revision.version} className="flex flex-wrap items-center justify-between gap-2 border-t py-2 text-sm"><span>Phiên bản {revision.version} · {revision.actor?.name || 'Bản nền'}<br /><span className="text-xs text-slate-500">{new Date(revision.createdAt).toLocaleString('vi-VN')} · {revision.note}</span></span><span className="flex gap-3"><button type="button" disabled={busy} className="text-blue-700" onClick={() => void act(async () => { const result = await request(`history?version=${revision.version}`); setPreview(result.revision.snapshot); })}>Xem bản lưu</button>{permissions?.canManage && revision.version !== version && <button type="button" disabled={busy} className="text-amber-800" onClick={() => setRestoreVersion(revision.version)}>Khôi phục</button>}</span></div>)}
      {preview && <div className="mt-3 max-h-80 overflow-auto rounded-lg bg-slate-50 p-3 text-sm"><button type="button" className="float-right text-slate-500" onClick={() => setPreview(null)}>Đóng bản xem</button><h4 className="font-semibold">{preview.metadata.title}</h4><p>{preview.questions.length} câu · phiên bản {preview.version}</p>{preview.passages?.map(p => <p key={p.id} className="mt-3 whitespace-pre-wrap">{p.title} {p.content}</p>)}{preview.questions.map((q, i) => <div key={q.id} className="mt-3 whitespace-pre-wrap"><strong>Câu {i + 1}.</strong> {q.content}{q.choices?.map(c => <p key={c.key}>{c.key}. {c.text}</p>)}<p className="text-slate-500">{q.step_by_step_solution}</p></div>)}</div>}
      {restoreVersion !== null && <div className="mt-3 space-y-2 rounded-lg bg-amber-50 p-3 text-sm"><p>Khôi phục nội dung phiên bản {restoreVersion} thành bản mới? Lịch sử cũ vẫn giữ. Hãy lưu hoặc sao chép bản nháp đang sửa trước khi tiếp tục.</p><button type="button" disabled={busy} className="mr-4 font-medium text-amber-900" onClick={() => void act(async () => { if (beforeRestore && !await beforeRestore()) return; const result = await request('history', 'POST', { version: restoreVersion, baseVersion: version }); setRestoreVersion(null); onRestored?.(result.document); })}>Xác nhận khôi phục</button><button type="button" onClick={() => setRestoreVersion(null)}>Hủy</button></div>}
    </details>
    <details className="rounded-xl border p-3"><summary className="cursor-pointer font-medium">Góp ý ({comments.length}{comments.length === 100 ? '+' : ''})</summary>
      {permissions?.canComment && <form className="my-3 space-y-2" onSubmit={e => { e.preventDefault(); void act(async () => { await request('comments', 'POST', { body, ...(commentQuestion ? { questionId: commentQuestion } : {}) }); setBody(''); setCommentQuestion(''); }); }}><select aria-label="Câu được góp ý" className={inputClass + ' w-full'} value={commentQuestion} onChange={e => setCommentQuestion(e.target.value)}><option value="">Góp ý chung cho cả đề</option>{questions.map(q => <option key={q.id} value={q.id}>{q.label}</option>)}</select><textarea aria-label="Nội dung góp ý" required maxLength={5000} rows={3} className={inputClass + ' w-full'} value={body} onChange={e => setBody(e.target.value)} placeholder="Góp ý cho đề..." /><button disabled={busy} className="rounded-lg app-button-primary px-3 py-2 text-sm text-white disabled:opacity-50">Gửi góp ý</button></form>}
      {comments.map(comment => <div key={comment.id} className={'border-t py-2 text-sm' + (comment.resolvedAt ? ' opacity-60' : '')}><p className="font-medium">{comment.author?.name || 'Tài khoản đã xóa'} <span className="font-normal text-xs text-slate-500">{new Date(comment.createdAt).toLocaleString('vi-VN')}{comment.version ? ` · phiên bản ${comment.version}` : ''}</span></p><p className="whitespace-pre-wrap break-words">{comment.body}</p>{comment.questionId && <span className="text-xs text-slate-500">{questions.find(q => q.id === comment.questionId)?.label || 'Câu đã bị xóa khỏi đề'}</span>}<div className="text-xs">{comment.resolvedAt ? <span className="text-green-700">Đã giải quyết bởi {comment.resolvedByName}</span> : <span className="text-amber-700">Chưa giải quyết</span>}{(permissions?.canEdit || permissions?.canComment && comment.mine) && <button type="button" disabled={busy} className="ml-3 text-blue-700" onClick={() => void act(async () => { await request('comments', 'PATCH', { commentId: comment.id, resolved: !comment.resolvedAt }); })}>{comment.resolvedAt ? 'Mở lại' : 'Đánh dấu đã giải quyết'}</button>}</div></div>)}
    </details>
  </section>;
}
