import React from 'react';
import { createRoot } from 'react-dom/client';
import StudentPage from '../../src/app/a/[publicId]/page';
import { journalKey, writerJournalKey } from '../../src/lib/student-draft-journal';

if (location.origin !== 'http://127.0.0.1:3124') throw Error('Isolated QA origin required');
const mode = new URLSearchParams(location.search).get('mode') || 'choice';
const attemptId = 'qa-journal-' + mode, params = Promise.resolve({ publicId: 'fixture' });
const storage = window.localStorage;
// Only synthetic keys on this dedicated QA origin; no application storage is shared.
for (const key of Object.keys(storage)) if (key.startsWith('examcraft:student-journal:')) storage.removeItem(key);
const rawLegacy = '{QA-broken-legacy: preserve exactly';
const seed = (writer: string, baseRevision: string, text: string) => storage.setItem(writerJournalKey(attemptId, writer), JSON.stringify({ v: 2, writerId: writer, attemptId, baseRevision, answers: { q: text }, savedAt: '2026-10-24T08:00:00.000Z' }));
if (mode === 'corrupt') storage.setItem(journalKey(attemptId), rawLegacy);
if (mode === 'choice' || mode === 'late') { seed('old', 'old', 'LOCAL-OLD'); seed('current', 'r0', 'LOCAL-CURRENT'); }
if (mode === 'expired') seed('old', 'old', 'LOCAL-UNSENT');
if (mode === 'denied') Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new DOMException('QA blocked storage', 'SecurityError'); } });
const ticks = new Map<number, () => void>(); let timerId = 500000;
const realInterval = window.setInterval.bind(window), realClear = window.clearInterval.bind(window);
window.setInterval = ((handler: TimerHandler, delay?: number, ...args: unknown[]) => {
  if (delay === 15000 && typeof handler === 'function') { const id = ++timerId; ticks.set(id, () => handler(...args)); return id; }
  return realInterval(handler, delay, ...args);
}) as typeof window.setInterval;
window.clearInterval = id => { if (!ticks.delete(id)) realClear(id); };
let revision = 0, serverRevision = 'r0', serverAnswers = { q: 'SERVER' }, unexpected = 0;
const calls: object[] = [], alerts: string[] = [];
const listeners = new Set<() => void>();
const changed = () => { revision++; listeners.forEach(listener => listener()); };
window.alert = message => { alerts.push(String(message)); changed(); };
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const assignment = { id: 'fixture', publicId: 'fixture', title: 'QA nhật ký học sinh', mode: 'HOMEWORK', identityMode: 'FREE_NAME', maxAttempts: 1, requirePin: false, leaderboard: 'OFF' };
const exam = { questions: [{ id: 'q', position: 1, type: 'SHORT_ANSWER', content: 'QA câu trả lời', points: 1 }], sections: [] };
let pending: { body: { draft: typeof serverAnswers; baseDraftRevision: string }; resolve: (response: Response) => void } | null = null;
let offlineSubmissionFailed = false;
function applyDraft(body: { draft: typeof serverAnswers; baseDraftRevision: string }) {
  if (body.baseDraftRevision !== serverRevision) return response({ code: 'DRAFT_CONFLICT', error: 'QA xung đột; giữ bản cũ.' }, 409);
  serverAnswers = body.draft; serverRevision = 'r1'; changed(); return response({ draftRevision: serverRevision });
}
window.fetch = async (input, init) => {
  const path = String(input), method = init?.method || 'GET';
  if (path === '/api/public/assignments/fixture' && method === 'GET') return response({ assignment, exam });
  if (path === '/api/public/assignments/fixture/start' && method === 'POST') return response({ attempt: { id: attemptId, attemptNo: 1, startedAt: new Date().toISOString(), studentName: 'QA', draft: serverAnswers, draftRevision: serverRevision, ...(['expired', 'offline'].includes(mode) ? { deadlineAt: '2026-10-24T07:00:00Z' } : {}) }, serverNow: '2026-10-24T08:00:00Z', exam });
  if (path === `/api/public/attempts/${attemptId}/draft` && method === 'PATCH') {
    const body = JSON.parse(String(init?.body)); calls.push({ method, body }); changed();
    if (mode === 'late' && serverRevision === 'r0') return new Promise<Response>(resolve => { pending = { body, resolve }; changed(); });
    return applyDraft(body);
  }
  if (path === `/api/public/attempts/${attemptId}/submit` && method === 'POST') {
    const body = JSON.parse(String(init?.body)); calls.push({ method, body }); changed();
    if (mode === 'offline' && !offlineSubmissionFailed) { offlineSubmissionFailed = true; throw new TypeError('QA offline submit'); }
    if (body.useSavedDraftOnly !== true && body.baseDraftRevision !== serverRevision) return response({ code: 'DRAFT_CONFLICT', error: 'QA stale submit' }, 409);
    return response({ responses: body.useSavedDraftOnly ? serverAnswers : body.answers, submittedAt: new Date().toISOString(), studentName: 'QA', score: null, maxScore: 1, message: 'QA submitted' });
  }
  unexpected++; changed(); throw Error('No native fetch fallback: ' + path);
};
function Harness() {
  React.useSyncExternalStore(listener => { listeners.add(listener); return () => { listeners.delete(listener); }; }, () => revision, () => 0);
  const snapshot = Object.fromEntries(Object.keys(storage).filter(key => key.includes(attemptId)).map(key => [key, storage.getItem(key)]));
  return <><section style={{ border: '3px solid blue', padding: 12 }} aria-label="Điều khiển QA nhật ký">
    <strong>QA giả — {mode} — không DB/provider</strong>
    <button onClick={() => { ticks.forEach(tick => tick()); changed(); }}>Chạy chu kỳ lưu nháp</button>
    <button onClick={() => { if (pending) { const saved = pending; pending = null; saved.resolve(applyDraft(saved.body)); } changed(); }}>Trả xác nhận lưu muộn</button>
    <button onClick={changed}>Đọc trạng thái QA</button>
    <pre role="status">{JSON.stringify({ mode, serverRevision, serverAnswers, pending: Boolean(pending), calls, alerts, unexpected, snapshot }, null, 2)}</pre>
  </section><StudentPage params={params} /></>;
}
createRoot(document.getElementById('root')!).render(<Harness />);
