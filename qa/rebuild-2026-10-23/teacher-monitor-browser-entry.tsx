import React from 'react';
import { createRoot } from 'react-dom/client';
import TeacherMonitorPage from '../../src/app/teacher/assignments/[id]/page';

if (location.origin !== 'http://127.0.0.1:3123') throw Error('Isolated QA origin required');
const owner = 'qa-monitor-owner';
const params = Promise.resolve({ id: 'fixture-monitor' });
const pending: { id: string; resolve: (response: Response) => void }[] = [];
const writes: object[] = [];
let failGrades = true, savedB = 1, unexpected = 0, revision = 0;
const listeners = new Set<() => void>();
const changed = () => { revision++; listeners.forEach(listener => listener()); };
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const attempt = (id: string) => ({ id, studentName: 'QA học sinh ' + id, studentId: id, attemptNo: 1, status: 'SUBMITTED', score: id === 'B' ? savedB : 0, maxScore: 3, needsGrading: false, startedAt: '2026-10-24T02:00:00Z', submittedAt: '2026-10-24T02:10:00Z', answersCount: 1 });
const detail = (id: string) => ({ attempt: attempt(id), questions: [{ questionId: 'question-' + id, index: 1, type: 'ESSAY', content: 'QA nội dung riêng bài ' + id, points: 3, studentResponse: 'QA trả lời riêng ' + id, isCorrect: false, earned: id === 'B' ? savedB : 0, gradeRevision: 'a'.repeat(64) }], gradingHistory: [] });
window.fetch = async (input, init) => {
  const path = String(input), method = init?.method || 'GET';
  if (path === '/api/auth/me') return response({ user: { id: owner } });
  if (new Headers(init?.headers).get('x-examcraft-user') !== owner) { unexpected++; changed(); throw Error('Expected pinned fixture account'); }
  if (path === '/api/teacher/assignments/fixture-monitor' && method === 'GET') return response({ assignment: { id: 'fixture-monitor', title: 'QA phản hồi chấm muộn', publicId: 'fixture-only', status: 'OPEN', durationMinutes: 30, group: null }, stats: { totalStudents: 2, totalSubmitted: 2, totalPendingGrading: 0, totalGraded: 2, totalInProgress: 0, avgScore: savedB / 2, maxScore: savedB, minScore: 0, distribution: { under5: 2, from5to65: 0, from65to8: 0, from8to10: 0 } }, itemAnalysis: [], attempts: [attempt('A'), attempt('B')] });
  const match = /^\/api\/teacher\/attempts\/([AB])$/.exec(path);
  if (match && method === 'GET') return new Promise<Response>(resolve => { pending.push({ id: match[1], resolve }); changed(); });
  if (match && method === 'POST') {
    const body = JSON.parse(String(init?.body)); writes.push({ attemptId: match[1], ...body }); changed();
    if (body.questionKey !== 'question-' + match[1]) { unexpected++; changed(); return response({ error: 'Wrong question target' }, 400); }
    if (failGrades) return response({ error: 'QA mất mạng: chưa lưu điểm, giữ số đang nhập.' }, 503);
    savedB = body.earned; return response({ success: true });
  }
  unexpected++; changed(); throw Error('No native fetch fallback');
};
function Harness() {
  React.useSyncExternalStore(listener => { listeners.add(listener); return () => { listeners.delete(listener); }; }, () => revision, () => 0);
  const deliver = (id: string) => { const i = pending.findIndex(item => item.id === id); if (i < 0) return; pending.splice(i, 1)[0].resolve(response(detail(id))); changed(); };
  return <><section style={{ padding: 12, border: '3px solid blue' }} aria-label="Điều khiển QA phản hồi">
    <strong>QA giả — không DB/provider</strong>
    <button onClick={() => deliver('A')}>Trả phản hồi bài A</button>
    <button onClick={() => deliver('B')}>Trả phản hồi bài B</button>
    <button onClick={() => { failGrades = !failGrades; changed(); }}>Lỗi lưu điểm: {failGrades ? 'BẬT' : 'TẮT'}</button>
    <pre role="status">{JSON.stringify({ pending: pending.map(item => item.id), writes, savedB, unexpected }, null, 2)}</pre>
  </section><TeacherMonitorPage params={params} /></>;
}
createRoot(document.getElementById('root')!).render(<Harness />);
