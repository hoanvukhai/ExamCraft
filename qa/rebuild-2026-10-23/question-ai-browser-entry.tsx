import React, { useState, useSyncExternalStore } from 'react';
import { createRoot } from 'react-dom/client';
import { QuestionCard } from '../../src/components/QuestionCard';
import { applyQuestionManualSubmission, questionDraftSourceStamp, type QuestionManualSubmission } from '../../src/lib/question-draft';
import type { Exam, Question } from '../../src/types/exam';
import { archiveAiProposal, listAiProposals } from '../../src/lib/ai-proposal-journal';
import { AiProposalJournalPanel } from '../../src/components/AiProposalJournalPanel';

if (location.origin !== 'http://127.0.0.1:3122') throw Error('QA origin required');
const ownerId = 'qa-ai-component', documentId = 'qa-ai';
const fixture = (): Exam => ({ id: documentId, createdAt: '2026-10-24', updatedAt: '2026-10-24', metadata: { title: 'QA AI giả, component thật', subject: 'toan', grade: 6, schoolName: '', departmentName: '', durationMinutes: 15, assessmentMode: 'scored' }, sections: [{ id: 'section', name: 'Phần QA', pointsPerQuestion: 0 }], passages: [{ id: 'passage', content: 'Ngữ liệu QA cần giữ' }], questions: [{ id: 'q', subject: 'toan', grade: 6, type: 'multiple_choice', difficulty: 'thong_hieu', content: 'QA câu gốc', choices: [{ key: 'A', text: 'Một' }, { key: 'B', text: 'Hai' }], correct_answer: 'A', step_by_step_solution: 'QA lời giải gốc', points: 0, version: 4, status: 'draft', verifiedBy: 'none', sectionId: 'section', passageId: 'passage', figures: [{ id: 'figure', kind: 'image', caption: 'QA dữ liệu hình cần giữ', data: { note: 'Fixture không có URL, không tải ảnh hoặc dùng mạng' } }], rubric: [{ criterion: 'Tiêu chí giáo viên cần rà sau AI', maxPoints: 0 }] }] });
type Operation = { path: string; owner: string; question: Question; resolve: (response: Response) => void };
const queue: Operation[] = [], calls: { path: string; owner: string; content: string }[] = [];
let revision = 0, unexpectedRequests = 0;
const listeners = new Set<() => void>();
const notify = () => { revision++; for (const listener of listeners) listener(); };
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
const getSnapshot = () => revision;
const json = (value: unknown) => new Response(JSON.stringify(value), { status: 200, headers: { 'Content-Type': 'application/json' } });
// No native fetch fallback: even an unexpected request cannot reach a server.
window.fetch = async (input, init) => {
  const path = String(input), owner = new Headers(init?.headers).get('x-examcraft-user');
  if (!['/api/tweak-question', '/api/verify-question'].includes(path) || init?.method !== 'POST' || owner !== ownerId) {
    unexpectedRequests++; notify(); throw Error('Unexpected QA request or missing captured-account pin');
  }
  const body = JSON.parse(String(init.body)) as { question: Question };
  calls.push({ path, owner, content: body.question.content });
  return new Promise<Response>(resolve => { queue.push({ path, owner, question: structuredClone(body.question), resolve }); notify(); });
};
function release() {
  const operation = queue.shift(); if (!operation) return;
  notify();
  operation.resolve(json(operation.path === '/api/tweak-question'
    ? { success: true, question: { id: 'provider-cannot-reassign', type: 'essay', difficulty: 'van_dung', content: 'QA AI đề xuất đã chờ phản hồi', step_by_step_solution: 'QA AI lời giải giả', subject: 'ngu_van', grade: 12, points: 99, sectionId: 'foreign', passageId: 'foreign', status: 'verified', verifiedBy: 'human' } }
    : { success: true, isMatch: true, confidence: 1, solvedAnswer: 'QA_VERIFY_STALE_MARKER', solutionSteps: 'QA_VERIFY_STALE_SOLUTION', discrepancies: [], recommendation: 'QA giả — không xác nhận chuyên môn' }));
}
function Harness() {
  const [exam, setExam] = useState(fixture), [generation, setGeneration] = useState(1);
  const [reject, setReject] = useState(false), [refusals, setRefusals] = useState(0);
  const [lastSubmission, setLastSubmission] = useState<QuestionManualSubmission | null>(null);
  const queueRevision = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const submit = (submission: QuestionManualSubmission) => {
    setLastSubmission(submission);
    if (reject) { setRefusals(value => value + 1); return; }
    setExam(previous => applyQuestionManualSubmission(previous, submission, ownerId));
  };
  const reset = () => { for (const entry of [...listAiProposals(ownerId), ...listAiProposals(ownerId, undefined, undefined, true)]) archiveAiProposal(entry); setExam(fixture()); setGeneration(value => value + 1); setReject(false); setRefusals(0); setLastSubmission(null); };
  const sourceStamp = questionDraftSourceStamp(exam);
  return <><h1>QA đề xuất AI: component thật, phản hồi giả có điều khiển</h1>
    <p>Không DB/provider hoặc native fetch. CSP connect-src none. Dùng nút AI thật trong thẻ, rồi điều khiển phản hồi ở đây.</p>
    <ol><li>Đổi số liệu → Đổi ngữ cảnh → Trả phản hồi: đề xuất vẫn giữ và nút chấp nhận bị chặn.</li><li>Reset → Đổi số liệu → Trả phản hồi → bật từ chối → Chấp nhận: đề xuất không đóng, chưa có history. Tắt từ chối, thử chấp nhận lại: đóng sau ack, history 1; kiểm điểm 0/hình/ngữ liệu/phần giữ.</li><li>Reset → Thẩm định độc lập → Đổi ngữ cảnh → Trả phản hồi: marker thẩm định cũ không được hiển thị trong thẻ.</li></ol>
    <div><button type="button" disabled={queue.length > 0} onClick={reset}>Reset ca QA</button><button type="button" onClick={() => setExam(previous => ({ ...previous, metadata: { ...previous.metadata, assessmentMode: previous.metadata.assessmentMode === 'scored' ? 'survey' : 'scored' } }))}>Đổi ngữ cảnh khi đang chờ</button><button type="button" disabled={!queue.length} onClick={release}>Trả một phản hồi AI giả đang chờ</button><label><input type="checkbox" checked={reject} onChange={event => setReject(event.target.checked)} />Parent cố ý từ chối Apply</label></div>
    <AiProposalJournalPanel ownerId={ownerId} documentId={documentId} questionIds={exam.questions.map(q => q.id)} onOpenCopilot={() => {}} />
    <QuestionCard key={generation} ownerId={ownerId} documentId={documentId} sourceStamp={sourceStamp} question={exam.questions[0]} index={0} displayPoints={exam.questions[0].points} onManualSave={submit} onDelete={() => { throw Error('Delete is outside this QA scenario'); }} passage={exam.passages?.[0]} />
    <h2>Bằng chứng state và account pin</h2><pre id="result">{JSON.stringify({ queueRevision, ownerId, documentId, generation, reject, refusals, calls, unexpectedRequests, pending: queue.map(operation => ({ path: operation.path, owner: operation.owner, content: operation.question.content })), assessmentMode: exam.metadata.assessmentMode, question: exam.questions[0], lastSubmission: lastSubmission ? { ownerId: lastSubmission.ownerId, documentId: lastSubmission.documentId, questionId: lastSubmission.questionId, token: lastSubmission.token } : null }, null, 2)}</pre>
  </>;
}
createRoot(document.querySelector('#root')!).render(<Harness />);
