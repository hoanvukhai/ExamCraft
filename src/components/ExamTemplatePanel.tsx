'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Exam, ExamMetadata } from '@/types/exam';
import { accountFetch } from '@/lib/account-fetch';
import { getCognitiveFramework } from '@/lib/education-catalog';
import { createRequestIdentity, isAccountFailure, RequestGate, type RequestToken } from '@/lib/template-request-context';
import { applyPersonalTemplate, captureTemplateSnapshot, makeTemplateApplyAttempt, parseOpenedTemplate, parseSavedTemplate, parseTemplateList, templateApplicationSchema, templateApplyAcknowledgement, templateApplyWarnings, templateDeviations, templateDocumentStamp, templateSectionPreview, templateSourceDateLabel, type PersonalTemplate, type TemplateApplyAttempt, type TemplateSummary, type TemplateApplyOptions, type TemplateEnvelope } from '@/lib/exam-template';

type Props = { ownerId: string; exam: Exam; onChange: (update: (previous: Exam) => Exam) => void };
const field = 'w-full border rounded p-2 bg-transparent text-sm';
const errorMessage = (cause: unknown) => cause instanceof Error && cause.name !== 'ZodError' ? cause.message : 'Mẫu chưa hợp lệ; kiểm tên, nguồn, kế hoạch và các phần trước khi lưu.';
const headerLabels: Record<string, string> = { schoolName: 'Đơn vị chủ quản', departmentName: 'Trường / tổ', title: 'Tên đề', examCode: 'Mã đề', academicYear: 'Năm học', semester: 'Học kỳ', notes: 'Ghi chú', headerLayout: 'Bố cục dòng in', subject: 'Môn', grade: 'Lớp', assessmentMode: 'Cách đánh giá', cognitiveFrameworkId: 'Khung mức', durationMinutes: 'Thời lượng' };
const typeLabels: Record<string, string> = { multiple_choice: 'Lựa chọn', true_false_group: 'Đúng / sai', short_answer: 'Trả lời ngắn', essay: 'Tự luận', fill_blank: 'Điền khuyết', matching: 'Ghép nối', ordering: 'Sắp xếp' };
const positions: Record<string, string> = { left: 'Trái', right: 'Phải', center: 'Giữa', footer: 'Cuối đề' };
const valueLabel = (value: unknown): string => {
  if (value === undefined) return 'Không đặt';
  if (value === null) return 'Mặc định / không chọn';
  if (value && typeof value === 'object' && 'lines' in value && Array.isArray(value.lines)) return value.lines.map((line: { binding?: string; text?: string; override?: string; hidden?: boolean; area?: string; align?: string }, index: number) => `${index + 1}. ${line.hidden ? 'Ẩn' : 'Hiện'} · ${positions[line.area ?? ''] ?? ''}/${positions[line.align ?? ''] ?? ''} · ${line.binding ? headerLabels[line.binding] ?? line.binding : line.text || '(dòng trống)'}${line.override !== undefined ? ` → ${line.override || '(để trống)'}` : ''}`).join('; ') || '(không có dòng)';
  return String(value) || '(để trống)';
};

export function ExamTemplatePanel(props: Props) { return <TemplatePanelContent key={`${props.ownerId}:${props.exam.id}`} {...props} />; }
const defaultOptions: TemplateApplyOptions = { header: true, context: false, plan: false, sections: false };
const messageFrom = (data: unknown, fallback: string) => data && typeof data === 'object' && typeof (data as { error?: unknown }).error === 'string' ? (data as { error: string }).error : fallback;
const accountLostMessage = 'Phiên hoặc tài khoản đã thay đổi. Chưa gửi thêm gì từ trang này; nội dung đang nhập vẫn còn. Hãy tải lại trang bằng đúng tài khoản rồi thử lại.';
function TemplatePanelContent({ ownerId, exam, onChange }: Props) {
  const [items, setItems] = useState<TemplateSummary[]>([]), [page, setPage] = useState(1), [pages, setPages] = useState(0), [skipped, setSkipped] = useState(0);
  const [selected, setSelected] = useState<{ template: PersonalTemplate; stamp: string } | null>(null);
  const [applyAttempt, setApplyAttempt] = useState<TemplateApplyAttempt | null>(null);
  const [options, setOptions] = useState<TemplateApplyOptions>(defaultOptions);
  const [name, setName] = useState(''), [linkSource, setLinkSource] = useState(false), [sources, setSources] = useState<TemplateEnvelope['sources']>([]);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState(''), [accountLocked, setAccountLocked] = useState(false);
  // One gate per mounted panel (the panel is re-keyed per account and exam): one request at a time, and nothing from a closed or account-lost context lands.
  const gateRef = useRef<RequestGate | null>(null), applying = useRef(false);
  const [saveRequestId] = useState(() => createRequestIdentity(() => crypto.randomUUID()));
  useEffect(() => { const gate = new RequestGate(); gateRef.current = gate; return () => gate.dispose(); }, []);
  const canEdit = exam.access?.canEdit !== false;
  const currentStamp = useMemo(() => templateDocumentStamp(exam), [exam]);
  const activeAttempt = selected && applyAttempt?.application.source.id === selected.template.id && applyAttempt.application.source.revision === selected.template.revision ? applyAttempt : null;
  const acknowledgement = useMemo(() => activeAttempt ? templateApplyAcknowledgement(exam, activeAttempt, currentStamp) : null, [exam, activeAttempt, currentStamp]);
  const stale = selected !== null && selected.stamp !== currentStamp && acknowledgement !== 'applied';
  const deviations = useMemo(() => templateDeviations(exam), [exam]);
  const resetAttempt = () => { applying.current = false; setApplyAttempt(null); };
  const begin = () => { const token = gateRef.current?.begin() ?? null; if (token) { setBusy(true); setError(''); } return token; };
  const end = (token: RequestToken) => { token.release(); if (!gateRef.current?.disposed) setBusy(false); };
  const fail = (token: RequestToken, cause: unknown) => { if (token.isLive()) setError(errorMessage(cause)); };
  const send = async (token: RequestToken, input: string, init: RequestInit = {}) => {
    const response = await accountFetch(ownerId, input, { ...init, signal: token.signal }), data: unknown = await response.json().catch(() => null);
    if (isAccountFailure(response.status, data)) { gateRef.current?.lock(); setAccountLocked(true); setError(accountLostMessage); }
    return { response, data };
  };
  const loadList = async (nextPage: number) => {
    const token = begin(); if (!token) return;
    try {
      const { response, data } = await send(token, `/api/templates?page=${nextPage}&limit=20`);
      if (!token.isLive()) return;
      if (!response.ok) throw Error(messageFrom(data, 'Chưa tải được mẫu.'));
      const list = parseTemplateList(data, nextPage);
      setItems(list.templates); setPage(list.page); setPages(list.pages); setSkipped(list.skipped);
    } catch (cause) { fail(token, cause); } finally { end(token); }
  };
  const openTemplate = async (id: string) => {
    const token = begin(); if (!token) return; setNotice('');
    const stamp = currentStamp;
    try {
      const { response, data } = await send(token, `/api/templates/${encodeURIComponent(id)}`);
      if (!token.isLive()) return;
      if (!response.ok) throw Error(messageFrom(data, 'Chưa tải được mẫu.'));
      const template = parseOpenedTemplate(data, id);
      // Validate the received snapshot before allowing it into the preview/apply path.
      const application = templateApplicationSchema.parse({ formatVersion: 1, source: { id: template.id, revision: template.revision, name: template.name, category: template.category }, snapshot: template.snapshot, appliedOptions: defaultOptions, appliedAt: new Date().toISOString() });
      resetAttempt(); setSelected({ template: { ...template, snapshot: application.snapshot }, stamp }); setOptions(defaultOptions); setLinkSource(false);
    } catch (cause) { fail(token, cause); } finally { end(token); }
  };
  const save = async () => {
    if (!canEdit) return;
    const token = begin(); if (!token) return; setNotice('');
    try {
      const snapshot = captureTemplateSnapshot(exam);
      const body = { name, subject: snapshot.assessmentContext.subject, gradeFrom: exam.metadata.grade, gradeTo: exam.metadata.grade, sources, snapshot, ...(linkSource && selected ? { source: { id: selected.template.id, revision: selected.template.revision } } : {}) };
      // Same body keeps the same request ID so a retry cannot create a second copy; any edit gets a new one.
      const clientRequestId = saveRequestId(JSON.stringify(body));
      const { response, data } = await send(token, '/api/templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, clientRequestId }) });
      if (!token.isLive()) return;
      if (!response.ok) throw Error(messageFrom(data, 'Chưa lưu được mẫu. Giữ nội dung để thử lại.'));
      const saved = parseSavedTemplate(data);
      const listed = pages > 0 && page === 1;
      setNotice(`Đã lưu bản mẫu riêng: ${saved.name}. Nguồn tự khai, cần rà soát; bản nguồn được giữ nguyên.${listed ? '' : ' Bấm “Tải danh sách mẫu” để thấy bản mới.'}`);
      if (listed) setItems(previous => [saved, ...previous.filter(item => item.id !== saved.id)].slice(0, 20));
    } catch (cause) { fail(token, cause); } finally { end(token); }
  };
  const apply = () => {
    const gate = gateRef.current;
    if (!selected || !canEdit || !gate || gate.locked || gate.disposed || applying.current) return;
    applying.current = true;
    try {
      if (stale) throw Error('Đề đã đổi sau khi mở mẫu. Nháp lựa chọn được giữ; đối chiếu và xác nhận bản hiện tại trước khi áp dụng.');
      const template = selected.template, baseStamp = selected.stamp, chosen = options;
      const ids = template.snapshot.sections.map(() => crypto.randomUUID()), now = new Date().toISOString();
      const next = applyPersonalTemplate(exam, template, chosen, baseStamp, ids, now);
      setApplyAttempt(makeTemplateApplyAttempt(exam, next)); setNotice('');
      // The parent runs this later against its newest document; it re-checks id, edit right and stamp, and never rebases.
      onChange(previous => gate.locked || gate.disposed ? previous : applyPersonalTemplate(previous, template, chosen, baseStamp, ids, now));
      setError('');
    } catch (cause) { resetAttempt(); setError(errorMessage(cause)); }
  };
  return <details className="border rounded-xl p-3 bg-white dark:bg-[#1e1e1e]"><summary className="cursor-pointer text-sm font-semibold">Mẫu cá nhân và nguồn tham khảo</summary>
    <p className="text-xs my-2">Mỗi lần lưu là bản riêng, không sửa mẫu nguồn. Mẫu cũ/hệ thống và nguồn tự khai đều cần rà soát; tên mẫu không chứng nhận phù hợp chính thức.</p>
    {exam.metadata.templateApplication && <div className="text-xs border rounded p-2 my-2"><p>Đã sao chép từ {exam.metadata.templateApplication.source.name} · phiên bản {exam.metadata.templateApplication.source.revision}. Đây là bản nội dung đã sao chép, không cấp quyền mở mẫu nguồn.</p>{deviations.length ? deviations.map(item => <p key={item}>{item}</p>) : <p>Chưa thấy lệch ở các trường đã áp dụng; vẫn cần kiểm nội dung và nguồn.</p>}</div>}
    <button type="button" className="underline text-sm" disabled={busy || accountLocked} onClick={() => void loadList(1)}>Tải danh sách mẫu trong quyền của tôi</button>
    <div className="max-h-48 overflow-auto space-y-2 my-2">{items.map(item => <div key={item.id} className="border rounded p-2 text-sm"><b>{item.name}</b> · {item.subject} · Lớp {item.gradeFrom}–{item.gradeTo} · {item.category === 'personal' ? 'Bản riêng cần rà soát' : 'Mẫu cũ/hệ thống chưa đối chiếu'} <button type="button" className="underline" disabled={busy || accountLocked || !item.readable} onClick={() => void openTemplate(item.id)}>{item.readable ? 'Mở xem trước' : 'Chưa đọc được cấu trúc'}</button></div>)}</div>
    {skipped > 0 && <p className="text-xs">Có {skipped} mẫu trong trang này chưa đọc được nên chưa hiển thị; dữ liệu gốc không bị đổi.</p>}
    {pages > 1 && <div className="flex gap-3 text-xs"><button type="button" disabled={busy || accountLocked || page <= 1} onClick={() => void loadList(page - 1)}>Trang trước</button><span>{page}/{pages}</span><button type="button" disabled={busy || accountLocked || page >= pages} onClick={() => void loadList(page + 1)}>Trang sau</button></div>}
    {selected && <div className="border rounded p-3 my-3 text-sm space-y-2"><b>Xem trước {selected.template.name}</b>
      <p className="text-xs">Phiên bản {selected.template.revision}; nguồn tự khai/cũ, chờ rà soát.</p>
      <p className="text-xs">Phạm vi mẫu đã khai: môn {selected.template.subject}, lớp {selected.template.gradeFrom}–{selected.template.gradeTo}. Cần giáo viên đối chiếu với đề hiện tại.</p>
      {selected.template.sources.map((source, index) => <div key={index} className="text-xs"><p>{source.title} · {source.version ?? 'Chưa ghi phiên bản'} · quyền {source.rights}{source.url && <a className="underline ml-2" href={source.url} target="_blank" rel="noreferrer">Nguồn</a>}</p><p>{templateSourceDateLabel(source)} Đây là thông tin tự khai, không xác nhận hiệu lực pháp lý.</p></div>)}
      {templateApplyWarnings(exam, selected.template, options).map(warning => <p key={warning} className="text-xs text-amber-700">{warning}</p>)}
      <div className="overflow-auto"><table className="w-full text-xs"><thead><tr><th>Trường</th><th>Đề hiện tại</th><th>Bản mẫu</th></tr></thead><tbody>{[...Object.entries(selected.template.snapshot.headerFields), ...Object.entries(selected.template.snapshot.assessmentContext)].map(([key, value]) => <tr key={key} className="border-t"><td className="p-1">{headerLabels[key] ?? key}</td><td>{valueLabel(exam.metadata[key as keyof ExamMetadata])}</td><td>{valueLabel(value)}</td></tr>)}</tbody></table></div>
      <p className="text-xs">Kế hoạch mẫu: {selected.template.snapshot.examPlan?.slots.length ?? 0} ô; kế hoạch hiện tại: {exam.metadata.examPlan?.slots.length ?? 0} ô. Các mã gói/khung giữ nguyên để rà soát.</p>
      {selected.template.snapshot.examPlan?.slots.map(slot => <p key={slot.id} className="text-xs">{typeLabels[slot.type]} · {slot.cognitiveLevel ? getCognitiveFramework(selected.template.snapshot.examPlan?.frameworkId ?? undefined)?.levels.find(level => level.id === slot.cognitiveLevel)?.label ?? `Mức cần rà soát: ${slot.cognitiveLevel}` : 'Không mức'} · {slot.outcomeId ? `Yêu cầu cần rà soát: ${slot.outcomeId}` : 'Không ràng buộc yêu cầu'} · {slot.count} câu · {slot.targetPointsHundredths === null ? 'Không đặt điểm' : `${slot.targetPointsHundredths / 100} điểm mục tiêu`}</p>)}
      <p className="text-xs">Phần hiện tại: {exam.sections?.map(section => section.title ?? section.name).join('; ') || 'Không có'}. Phần mẫu: {selected.template.snapshot.sections.map(section => section.title ?? section.name).join('; ') || 'Không có'}. Đề đã có câu luôn giữ phần và điểm đang dùng.</p>
      <div className="overflow-auto"><table className="w-full text-xs"><caption className="text-left">Cấu hình phần trước khi sao chép vào đề rỗng. Dãy điểm giữ đúng thứ tự nguồn, không tự suy cách chấm.</caption><thead><tr>{['Bản', 'Phần / dạng', 'Số câu', 'Điểm mỗi câu', 'Dãy điểm đã cấu hình', 'Tổng điểm phần'].map(label => <th key={label} className="p-1">{label}</th>)}</tr></thead><tbody>{([['Hiện tại', exam.sections ?? []], ['Mẫu', selected.template.snapshot.sections]] as const).flatMap(([label, sections]) => templateSectionPreview(sections).map((row, index) => <tr key={`${label}-${index}`} className="border-t"><td>{label}</td><td className="p-1">{row.name} · {typeLabels[row.type] ?? 'Chưa chỉ định dạng'}{row.instruction && <p>{row.instruction}</p>}</td><td>{row.count}</td><td>{row.points}</td><td>{row.progression}</td><td>{row.total}</td></tr>))}</tbody></table></div>
      <div className="flex flex-wrap gap-3 text-xs">{([['header', 'Sao chép tiêu đề/bố cục'], ['context', 'Sao chép ngữ cảnh đánh giá'], ['plan', 'Sao chép kế hoạch'], ['sections', 'Sao chép phần (chỉ đề chưa có câu)']] as const).map(([key, label]) => <label key={key}><input type="checkbox" checked={options[key]} disabled={!canEdit || key === 'sections' && exam.questions.length > 0} onChange={event => { resetAttempt(); setOptions({ ...options, [key]: event.target.checked }); }} /> {label}</label>)}</div>
      {acknowledgement === 'pending' && <p role="status">Chờ bản soạn xác nhận việc áp dụng.</p>}
      {acknowledgement === 'applied' && <p role="status">Đã áp dụng bản sao vào bản soạn. Kiểm tiêu đề/kế hoạch và bấm Lưu đề để lưu trên máy chủ.</p>}
      {acknowledgement === 'applied_changed' && <p role="alert" className="text-amber-700">Bản sao đã áp dụng và đề có chỉnh sửa mới. Đối chiếu lại trước khi áp dụng tiếp.</p>}
      {acknowledgement === 'rejected' && <p role="alert" className="text-amber-700">Chưa áp dụng vì bản soạn hoặc quyền sửa đã đổi. Bản xem trước được giữ; hãy đối chiếu lại.</p>}
      {stale && acknowledgement !== 'rejected' && acknowledgement !== 'applied_changed' && <p role="alert" className="text-amber-700">Đề đã đổi; bản xem trước cũ chưa thể áp dụng.</p>}
      <div className="flex gap-3"><button type="button" className="bg-blue-600 text-white rounded p-2 disabled:opacity-50" disabled={!canEdit || accountLocked || stale || acknowledgement !== null} onClick={apply}>Áp dụng bản sao đã chọn</button><button type="button" disabled={!canEdit || accountLocked} onClick={() => { resetAttempt(); setSelected({ ...selected, stamp: currentStamp }); setError(''); setNotice('Đã chọn ngữ cảnh hiện tại để đối chiếu lại.'); }}>Đối chiếu lại với đề hiện tại</button><button type="button" onClick={() => { resetAttempt(); setSelected(null); }}>Hủy xem trước</button></div>
    </div>}
    <details className="border rounded p-3 my-3"><summary className="text-sm cursor-pointer">Lưu cấu hình đề hiện tại thành mẫu riêng</summary><p className="text-xs my-2">Chỉnh tiêu đề và kế hoạch trong các bảng soạn trước khi lưu. Không lưu câu hỏi/đáp án/hình hoặc toàn bộ gói kiến thức vào mẫu.</p>
      <label className="text-sm block">Tên bản mẫu riêng<input className={field} value={name} maxLength={500} onChange={event => setName(event.target.value)} /></label>
      {selected && <label className="text-xs block my-2"><input type="checkbox" checked={linkSource} onChange={event => setLinkSource(event.target.checked)} /> Ghi nguyên bản từ mẫu đang xem: {selected.template.name}</label>}
      {sources.map((source, index) => <fieldset key={index} className="border rounded p-2 my-2"><legend className="text-xs">Nguồn tự khai {index + 1}</legend><div className="grid grid-cols-2 gap-2">{(['title', 'url', 'version', 'effectiveFrom', 'effectiveTo'] as const).map(key => <label key={key} className="text-xs">{{ title: 'Tên nguồn', url: 'URL http(s)', version: 'Phiên bản', effectiveFrom: 'Áp dụng từ', effectiveTo: 'Áp dụng đến' }[key]}<input className={field} type={key.startsWith('effective') ? 'date' : 'text'} value={source[key] ?? ''} onChange={event => setSources(sources.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: key === 'title' ? event.target.value : event.target.value || undefined } : item))} /></label>)}<label className="text-xs">Quyền dùng<select className={field} value={source.rights} onChange={event => setSources(sources.map((item, itemIndex) => itemIndex === index ? { ...item, rights: event.target.value as typeof source.rights } : item))}><option value="unknown">Chưa rõ</option><option value="link_only">Chỉ liên kết</option><option value="permission">Tự khai có phép</option><option value="open">Tự khai mở</option></select></label></div><button type="button" className="underline text-xs" onClick={() => setSources(sources.filter((_, itemIndex) => itemIndex !== index))}>Bỏ nguồn</button></fieldset>)}
      <div className="flex gap-3 text-sm my-2"><button type="button" disabled={sources.length >= 30} onClick={() => setSources([...sources, { title: '', rights: 'unknown' }])}>Thêm nguồn tự khai</button><button type="button" className="bg-blue-600 text-white rounded p-2 disabled:opacity-50" disabled={busy || accountLocked || !canEdit || !name.trim()} onClick={() => void save()}>Lưu bản mẫu riêng</button></div>
    </details>
    {busy && <p role="status" className="text-xs">Đang tải/lưu mẫu…</p>}{error && <p role="alert" className="text-sm text-red-600">{error}</p>}{notice && <p role="status" className="text-sm">{notice}</p>}
  </details>;
}
