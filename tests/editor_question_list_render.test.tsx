import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { A4Preview } from '../src/components/A4Preview';
import { EditorOutline } from '../src/components/editor/EditorOutline';
import type { Exam } from '../src/types/exam';

const noop = () => {};
const outline = (exam: Exam, canEdit = true) =>
  renderToStaticMarkup(
    <EditorOutline
      exam={exam}
      selectedCode="exam"
      ticked={[]}
      canEdit={canEdit}
      issueCounts={{}}
      commentCounts={{}}
      onSelect={noop}
      onTick={noop}
      onMove={noop}
    />,
  );

test('shared passage stays once on the sheet, keeps attribution and does not alter question order', () => {
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
  const html = renderToStaticMarkup(<A4Preview exam={exam} />);
  assert.equal(html.split('SHARED_PASSAGE').length - 1, 1);
  assert.equal(html.split('ATTRIBUTION_PRESERVED').length - 1, 1);
  assert.ok(html.indexOf('FIRST_QUESTION') < html.indexOf('SECOND_QUESTION'));
  assert.equal(JSON.stringify(exam), before);
  const list = outline(exam);
  assert.ok(
    list.indexOf('FIRST_QUESTION') < list.indexOf('SECOND_QUESTION'),
    'the outline keeps the question order',
  );
  assert.equal(list.split('SHARED_PASSAGE').length - 1, 0, 'the outline shows names, not the passage text');
  assert.equal(JSON.stringify(exam), before);
});

test('the sheet is read-only without a selection handler, selectable with one, and shows every object by code', () => {
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
        type: 'multiple_choice',
        content: 'QUESTION_PRESERVED',
        difficulty: 'thong_hieu',
        choices: [
          { key: 'A', text: 'one' },
          { key: 'B', text: 'two' },
        ],
        step_by_step_solution: '',
        sectionId: 's',
        passageId: 'p',
        points: 0,
      },
    ],
  };
  const before = structuredClone(exam);
  const read = renderToStaticMarkup(<A4Preview exam={exam} />);
  assert.ok(read.includes('SECTION_PRESERVED'));
  assert.ok(read.indexOf('SECTION_PRESERVED') < read.indexOf('QUESTION_PRESERVED'));
  assert.ok(read.indexOf('PASSAGE_PRESERVED') < read.indexOf('QUESTION_PRESERVED'));
  assert.ok(!read.includes('data-selectable'), 'no selection without a handler');
  const editable = renderToStaticMarkup(
    <A4Preview exam={exam} selectedCode="question:q" onSelectCode={noop} insertItems={() => []} />,
  );
  assert.ok(editable.includes('data-selectable="true"'));
  for (const code of ['question:q', 'choice:q:A', 'choice:q:B'])
    assert.ok(editable.includes(`data-object="${code}"`), code);
  assert.ok(/data-object="part:[^"]+"/.test(editable) && /data-object="group:[^"]+"/.test(editable));
  assert.ok(editable.includes('data-insert-point="insert:'), 'a + point follows the question');
  assert.ok(editable.includes('SOURCE_PRESERVED'));
  assert.ok(outline(exam).includes('SECTION_PRESERVED'));
  assert.deepEqual(exam, before);
});
