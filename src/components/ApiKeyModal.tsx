'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, Key, Trash2, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { accountFetch } from '@/lib/account-fetch';
import { createRequestIdentity, isAccountFailure } from '@/lib/template-request-context';
import { KeyContext, applyKeyTestResult, canActOnKey, classifyAddFailure, nextModelDraft, parseKeyList, parseSavedKey, pruneKeyTestResults, shouldClearKeyDraft, type KeyDraft, type KeyToken, type ModelOptionRow, type AppQuotaRow, type UserKeyRow } from '@/lib/key-modal-request-context';

interface Log { id: string; endpointLabel: string; model: string | null; httpStatus: number | null; createdAt: string; }
interface Props { ownerId: string; isOpen: boolean; onClose: () => void; onKeyUpdated?: () => void; }
type Busy = { kind: 'load' | 'add' | 'row' | 'model'; id?: string } | null;
const field = 'block w-full border rounded-xl p-2.5 bg-transparent mt-1';
const jsonHeaders = { 'Content-Type': 'application/json' };
const emptyDraft: KeyDraft = { label: '', apiKey: '' };
const messageOf = (data: unknown, fallback: string) => {
  const body = data && typeof data === 'object' ? data as { error?: unknown; message?: unknown } : {};
  return typeof body.error === 'string' ? body.error : typeof body.message === 'string' ? body.message : fallback;
};
const lockedMessage = 'Phiên hoặc tài khoản đã thay đổi. Chưa gửi thêm gì từ cửa sổ này; nội dung đang nhập vẫn còn trên màn hình này. Hãy tải lại trang bằng đúng tài khoản rồi thử lại.';
const unknownAddMessage = 'Chưa chắc khóa đã được lưu. Nội dung bạn nhập vẫn được giữ. Bấm “Lưu khóa” lại với đúng nội dung này sẽ dùng cùng mã yêu cầu nên không lưu trùng; nếu bạn định sửa nội dung, hãy bấm “Làm mới” xem danh sách trước.';

/** The dialog is re-created for every open and every account, so no list, reply or request outlives its context. */
export const ApiKeyModal: React.FC<Props> = ({ ownerId, isOpen, onClose, onKeyUpdated }) => {
  if (!isOpen) return null;
  return <ApiKeyDialog key={ownerId} ownerId={ownerId} onClose={onClose} onKeyUpdated={onKeyUpdated} />;
};

function ApiKeyDialog({ ownerId, onClose, onKeyUpdated }: Omit<Props, 'isOpen'>) {
  // Both lanes (actions and usage log) live in one context: losing the account on either ends every request of both.
  const ctxRef = useRef<KeyContext | null>(null);
  const [keyRequestId] = useState(() => createRequestIdentity(() => crypto.randomUUID()));
  const live = (token: KeyToken) => !!ctxRef.current?.isLive(token);
  const [list, setList] = useState<{ ownerId: string; items: UserKeyRow[] }>({ ownerId: '', items: [] });
  const listRef = useRef(list);
  const [skipped, setSkipped] = useState(0);
  const [quota, setQuota] = useState<AppQuotaRow | null>(null);
  const [models, setModels] = useState<ModelOptionRow[]>([]);
  const modelRef = useRef(''), modelBaseline = useRef('');
  const [model, setModel] = useState('');
  // The key lives only in this state and ref: never logged, stored, exported or put into a message.
  const draftRef = useRef<KeyDraft>(emptyDraft);
  const [draft, setDraft] = useState<KeyDraft>(emptyDraft);
  const [showKey, setShowKey] = useState(false);
  const [busy, setBusy] = useState<Busy>(null);
  const [locked, setLocked] = useState(false);
  const [message, setMessage] = useState(''), [problem, setProblem] = useState('');
  const [testResults, setTestResults] = useState<Record<string, string>>({});
  const [logs, setLogs] = useState<Log[] | null>(null);
  const ready = !!ownerId && !locked, idle = ready && busy === null;
  const keys = list.ownerId === ownerId ? list.items : [];

  const editDraft = (patch: Partial<KeyDraft>) => { draftRef.current = { ...draftRef.current, ...patch }; setDraft(draftRef.current); };
  const editModel = (value: string) => { modelRef.current = value; setModel(value); };
  const adoptModel = (replaceWhen: string, incoming: string) => {
    if (!incoming) return;
    const next = nextModelDraft(modelRef.current, replaceWhen, incoming);
    modelRef.current = next.draft; modelBaseline.current = next.baseline; setModel(next.draft);
  };

  const begin = (kind: NonNullable<Busy>['kind'], id?: string) => {
    const token = ownerId ? ctxRef.current?.begin('main') ?? null : null;
    if (token) { setBusy({ kind, id }); setProblem(''); setMessage(''); }
    return token;
  };
  // A stale token's release() is false, so an old request can never clear the busy flag of a newer one.
  const finish = (token: KeyToken) => { if (token.release()) setBusy(null); };
  const fail = (token: KeyToken, cause: unknown, fallback: string) => { if (live(token)) setProblem(cause instanceof Error ? cause.message : fallback); };
  const send = async (token: KeyToken, path: string, method = 'GET', body?: unknown) => {
    const response = await accountFetch(ownerId, path, { method, signal: token.signal, ...(body !== undefined ? { headers: jsonHeaders, body: JSON.stringify(body) } : {}) });
    const data: unknown = await response.json().catch(() => null);
    if (isAccountFailure(response.status, data) && ctxRef.current?.loseAccount('main', token)) { setLocked(true); setBusy(null); }
    return { response, data };
  };
  const commitList = (parsed: ReturnType<typeof parseKeyList>) => {
    const next = { ownerId, items: parsed.keys };
    listRef.current = next; setList(next); setSkipped(parsed.skipped); setQuota(parsed.quota); setModels(parsed.models);
    setTestResults(previous => pruneKeyTestResults(previous, parsed.keys));
    adoptModel(modelBaseline.current, parsed.selectedModel);
  };
  const fetchList = async (token: KeyToken) => {
    const { response, data } = await send(token, '/api/user/keys');
    if (!live(token)) return null;
    if (!response.ok) throw Error(messageOf(data, 'Chưa tải được khóa'));
    return parseKeyList(data);
  };
  const refreshAfterChange = async (token: KeyToken) => {
    try { const parsed = await fetchList(token); if (parsed) commitList(parsed); }
    catch { if (live(token)) setProblem('Đã thực hiện nhưng chưa tải lại danh sách. Bấm “Làm mới”.'); }
  };

  const load = async () => {
    const token = begin('load'); if (!token) return;
    try { const parsed = await fetchList(token); if (parsed) commitList(parsed); }
    catch (cause) { fail(token, cause, 'Chưa tải được khóa. Danh sách đang xem được giữ nguyên.'); }
    finally { finish(token); }
  };
  useEffect(() => {
    const context = new KeyContext(); ctxRef.current = context;
    return () => { context.dispose(); if (ctxRef.current === context) ctxRef.current = null; };
  }, []);
  useEffect(() => {
    if (!ownerId) return;
    // Deferred so a strict-mode re-run cancels the first load instead of sending it.
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerId]);

  const add = async (event: React.FormEvent) => {
    event.preventDefault();
    const sent = { ...draftRef.current }, apiKey = sent.apiKey.trim(), label = sent.label.trim();
    if (apiKey.length < 10) return;
    const token = begin('add'); if (!token) return;
    let status: number | null = null;
    try {
      // The same label and key keep one request ID, held in memory only (never stored or logged), so a retry cannot save the key twice; any edit gets a new ID.
      const clientRequestId = keyRequestId(JSON.stringify([label, apiKey]));
      const { response, data } = await send(token, '/api/user/keys', 'POST', { apiKey, ...(label ? { label } : {}), clientRequestId });
      status = response.status;
      if (!live(token)) return;
      if (!response.ok) throw Error(messageOf(data, 'Chưa lưu được khóa'));
      // A 200 only counts when the reply names the saved key; a broken body keeps the form and claims nothing.
      if (!parseSavedKey(data)) throw Error(unknownAddMessage);
      // Only what was sent is cleared; a different key typed since pressing Save stays.
      if (shouldClearKeyDraft(sent, draftRef.current)) editDraft(emptyDraft);
      setMessage('Đã lưu khóa được mã hóa.');
      onKeyUpdated?.();
      await refreshAfterChange(token);
    } catch (cause) {
      if (!live(token)) return;
      setProblem(classifyAddFailure(status) === 'unknown_outcome' ? unknownAddMessage : cause instanceof Error ? cause.message : 'Chưa lưu được khóa');
    } finally { finish(token); }
  };

  const toggle = async (key: UserKeyRow) => {
    if (!canActOnKey(list, ownerId, key.id)) { setProblem('Khóa này không còn trong danh sách hiện tại. Bấm “Làm mới”.'); return; }
    const token = begin('row', key.id); if (!token) return;
    try {
      const { response, data } = await send(token, '/api/user/keys', 'PATCH', { id: key.id, isActive: !key.isActive });
      if (!live(token)) return;
      if (!response.ok) throw Error(messageOf(data, 'Chưa cập nhật được khóa'));
      onKeyUpdated?.();
      await refreshAfterChange(token);
    } catch (cause) { fail(token, cause, 'Chưa cập nhật được khóa'); }
    finally { finish(token); }
  };
  const remove = async (key: UserKeyRow) => {
    if (!canActOnKey(list, ownerId, key.id)) { setProblem('Khóa này không còn trong danh sách hiện tại. Bấm “Làm mới”.'); return; }
    if (!confirm('Xóa khóa đã lưu này? Bạn cần nhập lại nếu muốn dùng sau.')) return;
    const token = begin('row', key.id); if (!token) return;
    try {
      const { response, data } = await send(token, '/api/user/keys?id=' + encodeURIComponent(key.id), 'DELETE');
      if (!live(token)) return;
      if (!response.ok) throw Error(messageOf(data, 'Chưa xóa được khóa'));
      onKeyUpdated?.();
      await refreshAfterChange(token);
    } catch (cause) { fail(token, cause, 'Chưa xóa được khóa'); }
    finally { finish(token); }
  };
  // Sent only when the teacher presses the button on that key; never probed automatically.
  const testKey = async (key: UserKeyRow) => {
    if (!canActOnKey(list, ownerId, key.id)) { setProblem('Khóa này không còn trong danh sách hiện tại. Bấm “Làm mới”.'); return; }
    const token = begin('row', key.id); if (!token) return;
    try {
      const { response, data } = await send(token, '/api/user/keys/test', 'POST', { keyId: key.id, testModel: modelRef.current });
      if (!live(token)) return;
      if (!response.ok) throw Error(messageOf(data, 'Chưa đọc được danh mục model'));
      const reply = data as { message?: unknown; error?: unknown; availableModels?: unknown };
      const text = typeof reply.message === 'string' ? reply.message : typeof reply.error === 'string' ? reply.error : 'Chưa có kết quả';
      setTestResults(previous => applyKeyTestResult(previous, listRef.current.items, key.id, text));
      const offered = parseKeyList({ keys: [], availableModels: reply.availableModels }).models;
      if (offered.length) setModels(offered);
    } catch (cause) { fail(token, cause, 'Chưa đọc được danh mục model'); }
    finally { finish(token); }
  };
  const saveModel = async () => {
    const sent = modelRef.current.trim();
    if (!sent) return;
    const token = begin('model'); if (!token) return;
    try {
      const { response, data } = await send(token, '/api/user/keys', 'PATCH', { action: 'set_model', model: sent });
      if (!live(token)) return;
      if (!response.ok) throw Error(messageOf(data, 'Chưa lưu được model'));
      const saved = data && typeof data === 'object' ? (data as { selectedAiModel?: unknown }).selectedAiModel : undefined;
      // The reply replaces the box only if it still holds what was sent; newer typing is kept.
      adoptModel(modelRef.current.trim() === sent ? modelRef.current : sent, typeof saved === 'string' && saved ? saved : sent);
      setMessage('Đã lưu model. Quyền gọi và quota cần được kiểm tra với nhà cung cấp.');
      onKeyUpdated?.();
    } catch (cause) { fail(token, cause, 'Chưa lưu được model'); }
    finally { finish(token); }
  };
  const loadLogs = async () => {
    const token = ownerId ? ctxRef.current?.begin('logs') : null; if (!token) return;
    try {
      const response = await accountFetch(ownerId, '/api/user/ai-usage', { signal: token.signal });
      const data: unknown = await response.json().catch(() => null);
      if (isAccountFailure(response.status, data) && ctxRef.current?.loseAccount('logs', token)) { setLocked(true); setBusy(null); }
      if (!live(token)) return;
      if (!response.ok || !data || !Array.isArray((data as { logs?: unknown }).logs)) throw Error(messageOf(data, 'Chưa tải được nhật ký'));
      setLogs((data as { logs: Log[] }).logs.filter(log => log && typeof log.id === 'string'));
    } catch (cause) { if (live(token)) setProblem(cause instanceof Error ? cause.message : 'Chưa tải được nhật ký'); }
    finally { token.release(); }
  };
  const requestClose = () => {
    if ((draft.apiKey || draft.label.trim()) && !confirm('Khóa đang nhập chưa được lưu và sẽ mất nếu đóng. Đóng cửa sổ này?')) return;
    ctxRef.current?.dispose(); // end every request of both lanes now, not when the effect cleanup runs
    onClose();
  };

  return <div className="fixed inset-0 z-50 bg-black/60 p-4 flex items-center justify-center"><section role="dialog" aria-modal="true" aria-label="Khóa AI của bạn" className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#202124] text-[#202124] dark:text-[#e3e3e3] rounded-2xl p-6 space-y-4">
    <header className="flex justify-between items-center"><h2 className="font-bold text-lg flex gap-2 items-center"><Key size={20} />Khóa AI của bạn</h2><button onClick={requestClose} aria-label="Đóng"><X /></button></header>
    <p className="text-sm">Bạn dùng khóa Gemini của chính mình. Khóa thuộc project miễn phí hay bật thanh toán đều dùng cùng chức năng; quyền model, giá và hạn mức do Google quyết định.</p>
    {locked && <p role="alert" className="p-3 rounded-xl bg-amber-50 text-amber-900 border border-amber-300 text-sm">{lockedMessage}</p>}
    {quota && <div className="border rounded-xl p-3 text-sm"><strong>Giới hạn trong ứng dụng hôm nay (UTC): {quota.usedToday} / {quota.limit} thao tác</strong><p>Đây là giới hạn nội bộ do quản trị viên đặt. Không phải quota hoặc số tiền còn lại ở Google.</p></div>}
    <p className="text-sm">Quota Google chưa xác định. Nhiều khóa cùng project không làm tăng hạn mức. <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-[var(--ui-accent)] underline">Xem project, quota và billing tại AI Studio</a>.</p>
    <label className="block text-sm">Model dùng cho yêu cầu tiếp theo<input className={field} value={model} onChange={event => editModel(event.target.value)} list="gemini-model-options" placeholder="Nhập mã model hoặc chọn từ danh mục" /><datalist id="gemini-model-options">{models.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}</datalist></label>
    <p className="text-xs">Danh sách ban đầu là gợi ý. Bấm “Đọc danh mục” ở một khóa để xem model hiện được liệt kê cho project đó. Ứng dụng không tự đổi model khi lỗi.</p>
    <button disabled={!idle || !model.trim()} onClick={() => void saveModel()} className="rounded-lg app-button-primary text-white px-4 py-2 disabled:opacity-50">Lưu model</button>
    {skipped > 0 && <p className="text-xs">Có {skipped} khóa chưa đọc được nên chưa hiển thị; dữ liệu gốc không bị đổi.</p>}
    <div className="space-y-3">{keys.map(key => <article key={key.id} className="border rounded-xl p-4 space-y-2"><div className="flex justify-between gap-3"><div><strong>{key.label}</strong>{key.granted ? <p className="text-xs text-[var(--ui-accent)]">Do quản trị cấp · bạn không xem hay xóa được</p> : <p className="font-mono text-xs">{key.keyMasked}</p>}</div><span className="text-sm">{key.isActive ? 'Đang bật' : 'Đang tắt'}</span></div><p className="text-xs">Thao tác thành công được ghi nhận bằng khóa này hôm nay: {key.usedToday}. Không suy ra quota còn lại.</p><div className="flex flex-wrap gap-3 text-sm"><button disabled={!idle} onClick={() => void testKey(key)} className="text-[var(--ui-accent)]">Đọc danh mục</button>{!key.granted && <button disabled={!idle} onClick={() => void toggle(key)}>{key.isActive ? 'Tắt khóa' : 'Bật khóa'}</button>}{!key.granted && <button disabled={!idle} onClick={() => void remove(key)} className="flex items-center gap-1 text-red-600"><Trash2 size={14} />Xóa</button>}</div>{testResults[key.id] && <p className="text-xs" role="status">{testResults[key.id]}</p>}</article>)}</div>
    <form onSubmit={e => void add(e)} className="border rounded-xl p-4 space-y-3"><h3 className="font-semibold">Thêm khóa</h3><label className="block text-sm">Tên dễ nhớ<input className={field} maxLength={120} value={draft.label} onChange={e => editDraft({ label: e.target.value })} /></label><label className="block text-sm">Khóa API<input className={field} type={showKey ? 'text' : 'password'} autoComplete="off" minLength={10} maxLength={500} required value={draft.apiKey} onChange={e => editDraft({ apiKey: e.target.value })} /></label><div className="flex justify-between"><button type="button" onClick={() => setShowKey(!showKey)} aria-label={showKey ? 'Ẩn khóa' : 'Hiện khóa'}>{showKey ? <EyeOff size={18} /> : <Eye size={18} />}</button><button disabled={!idle} type="submit" className="rounded-lg app-button-primary text-white px-4 py-2 disabled:opacity-50">Lưu khóa</button></div></form>
    <details onToggle={event => { if (event.currentTarget.open && logs === null && ready && !ctxRef.current?.accountLost) void loadLogs(); }}><summary className="text-sm cursor-pointer">Nhật ký thao tác gần đây</summary><div className="space-y-2 mt-2">{logs?.map(log => <p key={log.id} className="text-xs">{new Date(log.createdAt).toLocaleString('vi-VN')} · {log.endpointLabel} · {log.model} · {log.httpStatus === 200 ? 'Thành công' : log.httpStatus === 102 ? 'Đang xử lý' : 'Lỗi ' + log.httpStatus}</p>)}</div></details>
    {problem && <p role="alert" className="text-sm text-red-700">{problem}</p>}
    {message && <p role="status" className="text-sm">{message}</p>}
    <button disabled={!idle} className="flex items-center gap-2 text-sm" onClick={() => void load()}><RefreshCw size={14} />Làm mới</button>
  </section></div>;
}
