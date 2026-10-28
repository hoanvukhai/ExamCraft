import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { EditorQuestionList } from '../src/components/editor/EditorQuestionList';
import type { Exam } from '../src/types/exam';
test('shared passage stays once per group, keeps attribution and does not alter question order', () => {
  const exam: Exam = { id: 'grouped', metadata: { title: 'Test', schoolName: '', departmentName: '', subject: 'ngu_van', grade: 6, durationMinutes: 45 }, createdAt: '', updatedAt: '', passages: [{ id: 'p', title: 'Bài đọc', content: 'SHARED_PASSAGE', source: 'ATTRIBUTION_PRESERVED' }], questions: [{ id: 'a', type: 'essay', difficulty: 'thong_hieu', content: 'FIRST_QUESTION', step_by_step_solution: '', passageId: 'p', points: 0 }, { id: 'b', type: 'essay', difficulty: 'thong_hieu', content: 'SECOND_QUESTION', step_by_step_solution: '', passageId: 'p', points: 1 }] };
  const before = JSON.stringify(exam);
  const html = renderToStaticMarkup(<EditorQuestionList exam={exam} renderQuestion={question => <div>{question.content}</div>} />);
  assert.equal(html.split('SHARED_PASSAGE').length - 1, 1);
  assert.equal(html.split('ATTRIBUTION_PRESERVED').length - 1, 1);
  assert.ok(html.indexOf('FIRST_QUESTION') < html.indexOf('SECOND_QUESTION'));
  assert.equal(JSON.stringify(exam), before);
});
