import test from 'node:test';
import assert from 'node:assert/strict';
import type { Exam, Question } from '../src/types/exam';
import { normalizeExamDocument } from '../src/lib/exam-document';
import { outlineNodes, syncOutline } from '../src/lib/exam-outline';
import { shuffleOutline } from '../src/lib/outline-operations';
import { createPRNG, generateShuffledExams } from '../src/lib/shuffler';
import { createAttemptLayout, examForAttempt } from '../src/lib/attempt-layout';
import {
  captureTemplateSnapshot,
  applyPersonalTemplate,
  templateDocumentStamp,
  makeTemplateApplyAttempt,
  templateApplyAcknowledgement,
  type PersonalTemplate,
} from '../src/lib/exam-template';
import { reviewExam } from '../src/lib/exam-review';
import { questionDraftSourceStamp } from '../src/lib/question-draft';
import { gradeSnapshot } from '../src/lib/attempt-grading';

const q = (id: string): Question => ({
  id,
  type: 'essay',
  difficulty: 'thong_hieu',
  content: 'PROMPT_SECRET_' + id,
  step_by_step_solution: 'ANSWER_SECRET_' + id,
  points: 0,
});
function fixture(): Exam {
  return normalizeExamDocument({
    id: 'outline-ops',
    metadata: {
      title: 'Test',
      subject: 'toan',
      grade: 6,
      schoolName: '',
      departmentName: '',
      durationMinutes: 20,
    },
    createdAt: '',
    updatedAt: '',
    questions: ['a', 'b', 'c', 'd', 'e', 'f'].map(q),
    passages: [{ id: 'source-secret', content: 'PASSAGE_SECRET' }],
    outline: [
      {
        id: 'p1',
        kind: 'part',
        title: 'Part 1',
        children: [
          {
            id: 'g1',
            kind: 'group',
            title: 'Group 1',
            passageId: 'source-secret',
            children: [
              { id: 'a-node', kind: 'question', questionId: 'a' },
              { id: 'b-node', kind: 'question', questionId: 'b' },
            ],
          },
          {
            id: 'g2',
            kind: 'group',
            children: [
              { id: 'c-node', kind: 'question', questionId: 'c' },
              { id: 'd-node', kind: 'question', questionId: 'd' },
            ],
          },
        ],
      },
      {
        id: 'p2',
        kind: 'part',
        title: 'Part 2',
        children: [
          { id: 'e-node', kind: 'question', questionId: 'e' },
          { id: 'f-node', kind: 'question', questionId: 'f' },
        ],
      },
    ],
  });
}
test('seeded shuffling keeps parts fixed, group children together/in order, and source unchanged', () => {
  const exam = fixture(),
    before = JSON.stringify(exam);
  for (let seed = 0; seed < 20; seed++) {
    const next = shuffleOutline(exam, createPRNG(seed));
    assert.deepEqual(
      next.outline!.map((node) => node.id),
      ['p1', 'p2'],
    );
    assert.deepEqual(
      new Set(next.questions.slice(0, 4).map((question) => question.id)),
      new Set(['a', 'b', 'c', 'd']),
    );
    for (const ids of [
      ['a', 'b'],
      ['c', 'd'],
    ]) {
      const first = next.questions.findIndex((question) => question.id === ids[0]);
      assert.equal(next.questions[first + 1].id, ids[1]);
    }
    const fixed = shuffleOutline(exam, createPRNG(seed), false);
    assert.deepEqual(
      fixed.outline![0].children!.map((node) => node.id),
      ['g1', 'g2'],
    );
  }
  const variants = generateShuffledExams(exam, 4, 101, 10);
  assert.equal(variants.length, 4);
  assert.deepEqual(
    variants.map((variant) => syncOutline(variant.exam).questions),
    variants.map((variant) => variant.exam.questions),
  );
  assert.equal(JSON.stringify(exam), before);
});
test('student attempt layout carries its outline; old stored order and old grades remain unchanged', () => {
  const exam = fixture(),
    layout = createAttemptLayout(exam, 123, true, false);
  const shown = examForAttempt(exam, layout);
  assert.deepEqual(
    syncOutline(shown as unknown as Exam).questions.map((question) => question.id),
    layout.questionOrder,
  );
  assert.deepEqual(gradeSnapshot(exam, {}), gradeSnapshot({ ...exam, questions: shown.questions }, {}));
  const oldOrder = ['f', 'e', 'd', 'c', 'b', 'a'];
  const legacy = { ...exam, outline: undefined };
  const oldShown = examForAttempt(legacy, { questionOrder: oldOrder, choiceOrder: {} });
  assert.deepEqual(
    oldShown.questions.map((question) => (question as Record<string, unknown>).id),
    oldOrder,
  );
  assert.deepEqual(
    syncOutline(oldShown as unknown as Exam).questions.map((question) => question.id),
    oldOrder,
  );
});
test('template captures only the empty outline skeleton; copy gets fresh part IDs and deterministic acknowledgement', () => {
  const source = fixture(),
    snapshot = captureTemplateSnapshot(source),
    text = JSON.stringify(snapshot);
  assert.ok(
    !text.includes('PROMPT_SECRET') && !text.includes('ANSWER_SECRET') && !text.includes('PASSAGE_SECRET'),
  );
  assert.ok(!text.includes('source-secret'));
  assert.ok(snapshot.outline!.some((node) => node.kind === 'part'));
  assert.ok(outlineNodes(snapshot.outline!).every((node) => node.kind !== 'question' && !node.passageId));
  const target = normalizeExamDocument({
    ...source,
    id: 'target',
    outline: [],
    sections: [],
    questions: [],
    passages: [],
  });
  const template: PersonalTemplate = {
    id: 'template',
    name: 'Layout',
    subject: 'toan',
    gradeFrom: 6,
    gradeTo: 6,
    createdAt: '',
    revision: 'r1',
    category: 'personal',
    status: 'needs_review',
    legacy: false,
    sources: [],
    origin: null,
    snapshot,
  };
  const options = { header: false, context: false, plan: false, sections: true };
  const applied = applyPersonalTemplate(
    target,
    template,
    options,
    templateDocumentStamp(target),
    ['new1', 'new2'],
    '2026-10-28T10:00:00Z',
  );
  assert.equal(applied.questions.length, 0);
  assert.deepEqual(
    applied.sections!.map((section) => section.id),
    ['new1', 'new2'],
  );
  assert.ok(applied.outline!.every((node) => node.kind === 'part'));
  assert.ok(applied.outline!.every((node) => !source.outline!.some((old) => old.id === node.id)));
  const attempt = makeTemplateApplyAttempt(target, applied);
  assert.equal(templateApplyAcknowledgement(applied, attempt), 'applied');
});
test('unchanged legacy outline keeps old journal stamps; actual structure changes invalidate them', () => {
  const legacy: Exam = { ...fixture(), outline: undefined };
  const upgraded = syncOutline(legacy);
  assert.equal(questionDraftSourceStamp(upgraded), questionDraftSourceStamp(legacy));
  const changed = structuredClone(upgraded);
  changed.outline![0].instructions = 'A new instruction';
  assert.notEqual(questionDraftSourceStamp(changed), questionDraftSourceStamp(legacy));
});
test('review identifies empty containers and incomplete/mismatched sub-items', () => {
  const exam = fixture();
  exam.outline!.push({
    id: 'empty',
    kind: 'part',
    title: 'Empty',
    children: [{ id: 'empty-group', kind: 'group', passageId: 'source-secret', children: [] }],
  });
  exam.questions[0].parts = [
    { id: 'part-a', content: '', points: 2 },
    { id: 'part-b', content: 'B' },
  ];
  const codes = new Set(reviewExam(exam).issues.map((issue) => issue.code));
  for (const code of ['empty-part', 'empty-group', 'part-content', 'part-points', 'part-answer'])
    assert.ok(codes.has(code), code);
  exam.questions[0].parts[1].points = 1;
  assert.ok(reviewExam(exam).issues.some((issue) => issue.code === 'part-total'));
});
