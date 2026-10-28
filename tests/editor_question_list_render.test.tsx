import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { OutlineEditor } from '../src/components/editor/OutlineEditor';
import type { Exam } from '../src/types/exam';
test('shared passage stays once per group, keeps attribution and does not alter question order', () => {
  const exam: Exam = {
    id: 'grouped',
    metadata: {
      title: 'Test',
      schoolName: '',
      departmentName: '',
      subject: 'ngu_van',
      grade: 6,
      durationMinutes: 45,
    },
    createdAt: '',
    updatedAt: '',
    passages: [{ id: 'p', title: 'Bài đọc', content: 'SHARED_PASSAGE', source: 'ATTRIBUTION_PRESERVED' }],
    questions: [
      {
        id: 'a',
        type: 'essay',
        difficulty: 'thong_hieu',
        content: 'FIRST_QUESTION',
        step_by_step_solution: '',
        passageId: 'p',
        points: 0,
      },
      {
        id: 'b',
        type: 'essay',
        difficulty: 'thong_hieu',
        content: 'SECOND_QUESTION',
        step_by_step_solution: '',
        passageId: 'p',
        points: 1,
      },
    ],
  };
  const before = JSON.stringify(exam);
  const html = renderToStaticMarkup(
    <OutlineEditor
      onPoint={() => {}}
      onSource={() => {}}
      canEdit={false}
      onChange={() => {}}
      exam={exam}
      renderQuestion={(question) => <div>{question.content}</div>}
    />,
  );
  assert.equal(html.split('SHARED_PASSAGE').length - 1, 1);
  assert.equal(html.split('ATTRIBUTION_PRESERVED').length - 1, 1);
  assert.ok(html.indexOf('FIRST_QUESTION') < html.indexOf('SECOND_QUESTION'));
  assert.equal(JSON.stringify(exam), before);
});

test('section labels and tree controls preserve original IDs, attribution and order; read view has no edit forms', () => {
  const exam: Exam = {
    id: 'sections',
    metadata: {
      title: 'Test',
      schoolName: '',
      departmentName: '',
      subject: 'toan',
      grade: 6,
      durationMinutes: 15,
    },
    createdAt: '',
    updatedAt: '',
    sections: [{ id: 's', name: 'SECTION_PRESERVED' }],
    passages: [{ id: 'p', content: 'PASSAGE_PRESERVED', source: 'SOURCE_PRESERVED' }],
    questions: [
      {
        id: 'q',
        type: 'essay',
        content: 'QUESTION_PRESERVED',
        difficulty: 'thong_hieu',
        step_by_step_solution: '',
        sectionId: 's',
        passageId: 'p',
        points: 0,
      },
    ],
  };
  const before = structuredClone(exam);
  const renderQuestion = (question: Exam['questions'][number]) => <div>{question.content}</div>;
  const read = renderToStaticMarkup(
    <OutlineEditor
      onPoint={() => {}}
      onSource={() => {}}
      canEdit={false}
      onChange={() => {}}
      exam={exam}
      renderQuestion={renderQuestion}
    />,
  );
  assert.ok(read.includes('SECTION_PRESERVED'));
  assert.ok(read.indexOf('SECTION_PRESERVED') < read.indexOf('QUESTION_PRESERVED'));
  assert.ok(!read.includes('Sửa nội dung dùng chung'));
  assert.ok(!read.includes('<select'));
  const editable = renderToStaticMarkup(
    <OutlineEditor
      onPoint={() => {}}
      onSource={() => {}}
      canEdit
      exam={exam}
      onChange={() => {
        throw Error('Rendering must not write');
      }}
      renderQuestion={renderQuestion}
    />,
  );
  assert.ok(editable.includes('SOURCE_PRESERVED'));
  assert.ok(editable.includes('Thao tác SECTION_PRESERVED'));
  assert.ok(!editable.includes('Phần của câu 1'));
  assert.ok(!editable.includes('Ngữ liệu của câu 1'));
  assert.ok(editable.indexOf('PASSAGE_PRESERVED') < editable.indexOf('QUESTION_PRESERVED'));
  assert.deepEqual(exam, before);
});
