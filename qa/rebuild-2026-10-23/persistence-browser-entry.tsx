import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useExamPersistence } from '../../src/components/useExamPersistence';
import { listUnsavedDrafts } from '../../src/lib/exam-draft';
import type { Exam } from '../../src/types/exam';
if (location.origin !== 'http://127.0.0.1:3122') throw Error('QA origin required');
const run = crypto.randomUUID();
const owners = [`qa-persistence-a-${run}`, `qa-persistence-b-${run}`];
const fixture = (owner: string): Exam => ({ id: 'qa-delayed-save', serverId: 'qa-delayed-save', version: 1, metadata: { title: `Bản gốc ${owner.includes('-a-') ? 'A' : 'B'}`, subject: 'toan', grade: 6, schoolName: '', departmentName: '', durationMinutes: 15 }, questions: [{ id: 'q', type: 'essay', difficulty: 'thong_hieu', content: 'Nội dung giả', points: 0, step_by_step_solution: 'Lời giải giả' }], createdAt: '2026-10-23', updatedAt: '2026-10-23' });
const saved = new Map(owners.map(owner => [owner, fixture(owner)]));
const permissions = { role: 'OWNER', canRead: true, canEdit: true, canComment: true, canManage: true, canPublish: true };
const queue: { owner: string; document: Exam; baseVersion: number; resolve: (response: Response) => void }[] = [];
let renderQueue = () => {};
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } });
window.fetch = async (input, init) => {
  if (String(input) !== '/api/exams/qa-delayed-save') throw Error('Unexpected QA request');
  const owner = new Headers(init?.headers).get('x-examcraft-user')!;
  if (!saved.has(owner)) throw Error('Unexpected QA owner');
  if (!init?.method || init.method === 'GET') return json({ document: saved.get(owner), permissions });
  if (init.method !== 'PATCH') throw Error('Unexpected QA method');
  const body = JSON.parse(String(init.body));
  return new Promise<Response>(resolve => { queue.push({ owner, ...body, resolve }); renderQueue(); });
};
function Harness() {
  const [owner, setOwner] = useState(owners[0]), [tick, setTick] = useState(0);
  renderQueue = () => setTick(value => value + 1);
  const persistence = useExamPersistence(owner, 'qa-delayed-save');
  const release = () => {
    const operation = queue.shift(); if (!operation) return;
    const current = saved.get(operation.owner)!;
    if (operation.baseVersion !== current.version) operation.resolve(json({ error: 'QA version conflict', code: 'VERSION_CONFLICT' }, 409));
    else { const next = { ...operation.document, version: current.version! + 1 }; saved.set(operation.owner, next); operation.resolve(json({ document: next, permissions })); }
    setTick(value => value + 1);
  };
  const draftTitles = (key: string) => listUnsavedDrafts(localStorage, key).drafts.map(item => item.exam.metadata.title);
  return <><h1>Kiểm hook lưu thật với phản hồi có điều khiển</h1><p>API giả trong trang QA, localStorage thật ở origin riêng. Không DB/AI/kết nối mạng. Mỗi lần tải trang có hai owner ngẫu nhiên riêng.</p><p>Hiện tại: {owner === owners[0] ? 'Tài khoản A' : 'Tài khoản B'}</p><button disabled={!persistence.ready} onClick={() => persistence.setExam(previous => ({ ...previous, metadata: { ...previous.metadata, title: 'Sửa A trước khi phản hồi' } }))}>Sửa lần A</button><button disabled={!persistence.ready} onClick={() => persistence.setExam(previous => ({ ...previous, metadata: { ...previous.metadata, title: 'Sửa B mới hơn' } }))}>Sửa lần B mới hơn</button><button disabled={!persistence.ready} onClick={() => void persistence.save()}>Gửi lưu</button><button onClick={release}>Trả một phản hồi đang chờ</button><button onClick={() => setOwner(owners[1])}>Chuyển sang tài khoản B</button><button onClick={() => setTick(value => value + 1)}>Đọc lại bằng chứng</button><pre id="result">{JSON.stringify({ tick, state: persistence.state, message: persistence.message, owner: owner === owners[0] ? 'A' : 'B', title: persistence.exam.metadata.title, version: persistence.exam.version, points: persistence.exam.questions[0]?.points, solution: persistence.exam.questions[0]?.step_by_step_solution, pending: queue.map(item => ({ owner: item.owner === owners[0] ? 'A' : 'B', title: item.document.metadata.title, baseVersion: item.baseVersion })), serverA: saved.get(owners[0])?.metadata.title, serverB: saved.get(owners[1])?.metadata.title, draftsA: draftTitles(owners[0]), draftsB: draftTitles(owners[1]) }, null, 2)}</pre></>;
}
createRoot(document.querySelector('#root')!).render(<Harness />);
