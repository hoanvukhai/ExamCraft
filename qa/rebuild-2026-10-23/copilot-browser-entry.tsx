import React, { useState, useSyncExternalStore } from 'react';
import { createRoot } from 'react-dom/client';
import { RightCompanionRail } from '../../src/components/RightCompanionRail';
import { applyCopilotSubmission, type CopilotSubmission } from '../../src/lib/copilot-submission';
import type { Exam } from '../../src/types/exam';
import { archiveAiProposal, listAiProposals } from '../../src/lib/ai-proposal-journal';
import { AiProposalJournalPanel } from '../../src/components/AiProposalJournalPanel';

if (location.origin !== 'http://127.0.0.1:3122') throw Error('QA origin required');
const ownerId = 'qa-copilot-component';
const fixture = (): Exam => ({ id: 'qa-copilot', createdAt: '', updatedAt: '', metadata: { title: 'Copilot QA', subject: 'toan', grade: 6, durationMinutes: 15, schoolName: '', departmentName: '', assessmentMode: 'scored' }, questions: [
  { id: 'a', type: 'essay', content: 'QA câu A gốc', difficulty: 'thong_hieu', points: 0, version: 3, step_by_step_solution: 'QA lời giải A', figures: [{ id: 'f', kind: 'image', data: { note: 'no URL' } }] },
  { id: 'b', type: 'essay', content: 'QA câu B phải giữ', difficulty: 'thong_hieu', step_by_step_solution: '', points: 0, version: 2 },
] });
let revision = 0, unexpected = 0;
const listeners = new Set<() => void>();
const notify = () => { revision++; listeners.forEach(listener => listener()); };
const queue: { resolve: (response: Response) => void; exam: Exam; owner: string }[] = [];
const calls: { owner: string; command: string }[] = [];
window.fetch = async (input, init) => {
  const owner = new Headers(init?.headers).get('x-examcraft-user');
  if (input !== '/api/exam-copilot' || owner !== ownerId || init?.method !== 'POST') { unexpected++; notify(); throw Error('No native fetch fallback'); }
  const body = JSON.parse(String(init.body)); calls.push({ owner, command: body.command });
  return new Promise<Response>(resolve => { queue.push({ resolve, exam: body.exam, owner }); notify(); });
};
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
function Harness() {
  const [exam, setExam] = useState(fixture), [generation, setGeneration] = useState(1), [expanded, setExpanded] = useState(true);
  const [reject, setReject] = useState(false), [race, setRace] = useState(false), [action, setAction] = useState('modify_single_question');
  const [submissions, setSubmissions] = useState(0);
  useSyncExternalStore(subscribe, () => revision, () => revision);
  const submit = (submission: CopilotSubmission) => {
    setSubmissions(count => count + 1);
    if (reject) return;
    setExam(previous => {
      const current = race ? { ...previous, questions: previous.questions.map(q => q.id === 'b' ? { ...q, content: 'QA B mới trong updater', version: (q.version ?? 1) + 1 } : q) } : previous;
      return applyCopilotSubmission(current, submission, ownerId);
    });
  };
  const release = () => {
    const operation = queue.shift(); if (!operation) return; notify();
    const modifiedQuestion = { ...operation.exam.questions[0], id: 'provider-id', content: 'QA Copilot đề xuất', step_by_step_solution: 'QA lời giải AI giả', points: 99 };
    operation.resolve(new Response(JSON.stringify({ success: true, result: { type: 'action', action, targetQuestionId: action === 'add_question' ? undefined : 'a', modifiedQuestion: action === 'delete_question' ? undefined : modifiedQuestion, explanation: 'KẾT QUẢ GIẢ: giáo viên duyệt thay đổi.' } }), { headers: { 'Content-Type': 'application/json' } }));
  };
  return <><h1>QA Copilot thật — API giả, không DB/provider</h1><p>CSP chặn mạng; fake fetch không có fallback.</p>
    <button disabled={queue.length > 0} onClick={() => { for (const entry of [...listAiProposals(ownerId), ...listAiProposals(ownerId, undefined, undefined, true)]) archiveAiProposal(entry); setExam(fixture()); setGeneration(n => n + 1); setExpanded(true); setReject(false); setRace(false); setSubmissions(0); }}>Reset Copilot QA</button>
    <button onClick={() => setExam(prev => ({ ...prev, metadata: { ...prev.metadata, assessmentMode: prev.metadata.assessmentMode === 'scored' ? 'survey' : 'scored' } }))}>Đổi phạm vi QA</button>
    <button disabled={!queue.length} onClick={release}>Trả phản hồi Copilot giả</button>
    <label><input type="checkbox" checked={reject} onChange={event => setReject(event.target.checked)} />Parent từ chối Copilot</label>
    <label><input type="checkbox" checked={race} onChange={event => setRace(event.target.checked)} />B đổi ngay trong updater</label>
    <label>Hành động giả<select aria-label="Hành động giả" value={action} onChange={event => setAction(event.target.value)}><option value="modify_single_question">Sửa câu A</option><option value="add_question">Thêm câu</option><option value="delete_question">Bỏ câu A</option></select></label>
    <AiProposalJournalPanel ownerId={ownerId} documentId={exam.id} questionIds={exam.questions.map(q => q.id)} onOpenCopilot={() => setExpanded(true)} />
    <div style={{ position: 'relative', height: 850, width: 700 }}><RightCompanionRail key={generation} ownerId={ownerId} exam={exam} selectedQuestionIds={['a']} isExpanded={expanded} onToggleExpand={() => setExpanded(value => !value)} onSubmitCopilot={submit} /></div>
    <h2>Bằng chứng state</h2><pre id="result">{JSON.stringify({ ownerId, generation, reject, race, submissions, calls, unexpected, pending: queue.length, exam }, null, 2)}</pre>
  </>;
}
createRoot(document.querySelector('#root')!).render(<Harness />);
