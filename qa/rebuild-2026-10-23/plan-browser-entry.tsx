import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ExamPlanEditor } from '../../src/components/ExamPlanEditor';
import type { Exam } from '../../src/types/exam';
if (location.origin !== 'http://127.0.0.1:3122') throw Error('QA origin required');
const initial: Exam = { id: 'qa-plan-component', metadata: { title: 'QA kế hoạch — dữ liệu giả', subject: 'toan', grade: 6, durationMinutes: 15, schoolName: '', departmentName: '' }, questions: [{ id: 'essay-zero', type: 'essay', difficulty: 'thong_hieu', content: 'Câu tự luận giả có 0 điểm', points: 0, step_by_step_solution: 'Lời giải giả' }], createdAt: '2026-10-23', updatedAt: '2026-10-23' };
function Harness() {
  const [exam, setExam] = useState(initial);
  return <><h1>Kiểm kế hoạch bằng component production</h1><p>Chỉ state React và dữ liệu giả; không server lưu, DB hoặc AI. Một câu tự luận, 0 điểm, không gắn mức.</p><button onClick={() => setExam(previous => ({ ...previous, metadata: { ...previous.metadata, grade: 7 } }))}>Giả lập nền đổi sang lớp 7</button><p>Lớp bản soạn hiện tại: {exam.metadata.grade}</p><ExamPlanEditor exam={exam} onChange={setExam} /><h2>Kế hoạch đã áp dụng vào state</h2><pre id="applied">{JSON.stringify(exam.metadata.examPlan ?? null, null, 2)}</pre></>;
}
createRoot(document.querySelector('#root')!).render(<Harness />);
