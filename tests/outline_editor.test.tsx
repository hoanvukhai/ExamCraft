import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Exam } from '../src/types/exam';
import { normalizeExamDocument } from '../src/lib/exam-document';
import { reconcileQuestionOutline, removeOutlineNode } from '../src/lib/exam-outline';
import { patchOutlineNode, nudgeOutlineNode } from '../src/lib/outline-editing';
import { applyQuestionOrderCommand } from '../src/lib/question-commands';
import { EditorOutline } from '../src/components/editor/EditorOutline';
import { QuestionPartsEditor } from '../src/components/editor/QuestionPartsEditor';
function fixture(): Exam {
  return normalizeExamDocument({
    id: 'editor-tree',
    metadata: {
      title: 'Test',
      subject: 'toan',
      grade: 6,
      durationMinutes: 15,
      schoolName: '',
      departmentName: '',
    },
    createdAt: '',
    updatedAt: '',
    questions: ['a', 'b'].map((id) => ({
      id,
      type: 'essay',
      content: 'QUESTION_' + id,
      difficulty: 'thong_hieu',
      points: 0,
      step_by_step_solution: '',
    })),
    outline: [
      {
        id: 'p',
        kind: 'part',
        title: 'PART_LABEL',
        children: [
          { id: 'a-node', kind: 'question', questionId: 'a' },
          { id: 'b-node', kind: 'question', questionId: 'b' },
        ],
      },
      { id: 'empty', kind: 'part', title: 'EMPTY_PART', children: [] },
    ],
  });
}
test('the outline lists the empty part and keeps the question order, without writes', () => {
  const exam = fixture(),
    before = JSON.stringify(exam);
  const html = renderToStaticMarkup(
    <EditorOutline
      exam={exam}
      selectedCode="question:a"
      ticked={['b']}
      canEdit
      issueCounts={{}}
      commentCounts={{}}
      onSelect={() => {
        throw Error('No render writes');
      }}
      onTick={() => {}}
      onMove={() => {
        throw Error('No render writes');
      }}
    />,
  );
  assert.ok(html.includes('EMPTY_PART'));
  assert.ok(html.includes('PART_LABEL'));
  assert.ok(html.indexOf('QUESTION_a') < html.indexOf('QUESTION_b'));
  assert.ok(html.indexOf('PART_LABEL') < html.indexOf('EMPTY_PART'));
  assert.equal(JSON.stringify(exam), before);
});
test('node editing and question commands keep hierarchy; dissolving a part retains questions', () => {
  const exam = fixture();
  const renamed = patchOutlineNode(exam, 'empty', { title: 'RENAMED', instructions: 'INSTRUCTION' });
  assert.equal(renamed.outline![1].title, 'RENAMED');
  assert.equal(exam.outline![1].title, 'EMPTY_PART');
  const moved = nudgeOutlineNode(exam, 'b-node', 'up');
  assert.deepEqual(
    moved.questions.map((q) => q.id),
    ['b', 'a'],
  );
  assert.equal(nudgeOutlineNode(exam, 'a-node', 'up'), exam);
  const duplicated = applyQuestionOrderCommand(exam, {
    documentId: exam.id,
    baseOrder: exam.questions.map((q) => q.id),
    questionId: 'a',
    action: 'duplicate',
    newId: 'copy',
  });
  assert.deepEqual(
    duplicated.questions.map((q) => q.id),
    ['a', 'copy', 'b'],
  );
  assert.equal(duplicated.questions[1].sectionId, 'p');
  const dissolved = removeOutlineNode(duplicated, 'p', true);
  assert.deepEqual(
    dissolved.questions.map((q) => q.id),
    ['a', 'copy', 'b'],
  );
  assert.ok(dissolved.questions.every((q) => q.sectionId === undefined));
});
test('compatibility adapter removes deleted leaves and places a merged question where the first removed leaf was', () => {
  const exam = fixture(),
    merged = { ...exam.questions[0], id: 'merged', content: 'MERGED' };
  const next = reconcileQuestionOutline(exam, { ...exam, questions: [merged] });
  assert.equal(next.questions[0].id, 'merged');
  assert.equal(next.questions[0].sectionId, 'p');
  assert.equal(next.outline![0].children![0].questionId, 'merged');
  assert.ok(next.outline!.some((node) => node.id === 'empty'));
});
test('question parts editor preserves explicit zero and answer/solution inputs; no save is run on render', () => {
  const question = {
    ...fixture().questions[0],
    parts: [
      {
        id: 'part',
        content: 'CONTENT',
        points: 0,
        answer: 'ANSWER',
        solution: 'SOLUTION',
        rubric: [{ criterion: 'CRITERION', maxPoints: 0 }],
      },
    ],
  };
  const before = JSON.stringify(question);
  const html = renderToStaticMarkup(
    <QuestionPartsEditor
      question={question}
      onChange={() => {
        throw Error('No render write');
      }}
    />,
  );
  for (const label of ['Điểm ý 1', 'Đáp án ý 1', 'Lời giải ý 1', 'Thêm ý']) assert.ok(html.includes(label));
  assert.ok(html.includes('value="0"'));
  assert.equal(JSON.stringify(question), before);
});
