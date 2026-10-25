import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { ExamReviewPanel } from '../src/components/ExamReviewPanel';
import { ExamPresentation } from '../src/components/ExamPresentation';
import type { Exam } from '../src/types/exam';

const exam: Exam = { id: 'e', metadata: { title: 'Đề thử', schoolName: '', departmentName: '', subject: 'toan', grade: 6, durationMinutes: 45 }, createdAt: '', updatedAt: '', questions: [{ id: 'q', type: 'short_answer', difficulty: 'thong_hieu', content: 'Tính kết quả', correct_answer: 'PRIVATE_ANSWER', step_by_step_solution: 'PRIVATE_SOLUTION', points: 0 }] };

test('review stays collapsed and does not print answers or claim content certification', () => {
  const html = renderToStaticMarkup(<ExamReviewPanel exam={exam} />);
  assert.ok(html.includes('Tổng điểm: 0,00'));
  assert.ok(html.includes('Chưa kiểm đúng sai kiến thức'));
  assert.ok(!html.includes('PRIVATE_ANSWER') && !html.includes('PRIVATE_SOLUTION'));
  assert.ok(!/<details[^>]*\bopen/.test(html));
});

test('presentation initially hides solutions and includes question and text-size controls', () => {
  const html = renderToStaticMarkup(<ExamPresentation exam={exam} onClose={() => {}} />);
  assert.ok(!html.includes('PRIVATE_ANSWER') && !html.includes('PRIVATE_SOLUTION'));
  assert.ok(html.includes('Chọn câu trình chiếu'));
  assert.ok(html.includes('Chữ lớn hơn') && html.includes('Chữ nhỏ hơn'));
  assert.ok(html.includes('font-size:24px'));
});
