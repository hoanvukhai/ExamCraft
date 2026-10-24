import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { KnowledgeScopeEditor } from '../../src/components/KnowledgeScopeEditor';
import { emptyKnowledgeScope, parseKnowledgePackage } from '../../src/lib/knowledge-package';
import fixture from '../../tests/fixtures/knowledge-package.json';
import type { Exam } from '../../src/types/exam';

if (location.origin !== 'http://127.0.0.1:3122') throw Error('QA origin required');
const pkg = parseKnowledgePackage(fixture), scope = emptyKnowledgeScope(pkg);
let calls = 0;
// This isolated component harness cannot reach a provider or DB (CSP connect-src none).
window.fetch = async (input, init) => {
  if (input !== '/api/knowledge-scope/propose' || new Headers(init?.headers).get('x-examcraft-user') !== 'qa-scope-component') throw Error('Unexpected QA request');
  const request = JSON.parse(String(init?.body)); calls++;
  document.querySelector('#calls')!.textContent = String(calls);
  const result = request.params.message.includes('bài chưa rõ')
    ? { kind: 'clarification', questions: ['Bạn muốn bài nào và ấn bản nào?'] }
    : { kind: 'proposal', bookId: request.params.bookId, scope: { ...scope, includeKnowledgeIds: ['group'], excludeKnowledgeIds: ['subtraction'], methodConstraints: ['Không dùng máy tính'] }, explanation: 'KẾT QUẢ GIẢ ĐỂ KIỂM GIAO DIỆN: bao gồm nhóm phép tính, loại trừ phép trừ.', unresolved: [] };
  return new Response(JSON.stringify({ success: true, result }), { status: 200, headers: { 'Content-Type': 'application/json' } });
};
const initial: Exam = { id: 'qa-scope-component', metadata: { title: 'QA phạm vi — dữ liệu giả', subject: 'toan', grade: 6, durationMinutes: 15, schoolName: '', departmentName: '', knowledgePackage: pkg, knowledgeScope: scope }, questions: [], createdAt: '2026-10-23', updatedAt: '2026-10-23' };
function Harness() {
  const [exam, setExam] = useState(initial);
  return <><h1>Kiểm giao diện phạm vi bằng kết quả AI giả</h1><p>Component production; API được thay bằng kết quả giả chỉ trong trang QA này. Không DB, không AI thật.</p><p>Số yêu cầu giả: <span id="calls">0</span></p><KnowledgeScopeEditor exam={exam} ownerId="qa-scope-component" hasActiveKey onChange={setExam} /><h2>Phạm vi đã áp dụng vào state bản soạn</h2><pre id="applied">{JSON.stringify(exam.metadata.knowledgeScope, null, 2)}</pre></>;
}
createRoot(document.querySelector('#root')!).render(<Harness />);
