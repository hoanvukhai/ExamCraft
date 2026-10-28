import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import JSZip from 'jszip';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Exam } from '../src/types/exam';
import { normalizeExamDocument } from '../src/lib/exam-document';
import { outlineView } from '../src/lib/outline-view';
import { StructureBlocks, QuestionParts } from '../src/components/editor/StructureBlocks';
import { A4Preview } from '../src/components/A4Preview';
import { exportExamToDocx } from '../src/lib/docx-export';
import { sanitizeSnapshotForStudent, snapshotQuestions, validateResponses } from '../src/lib/public-exam';
import { gradeSnapshot } from '../src/lib/attempt-grading';
import { freezeExamScoring } from '../src/lib/snapshot-scoring';
import { regradableQuestions, applyAnswerCorrection } from '../src/lib/answer-correction';
import { studentResponseText } from '../src/lib/student-response-text';

function fixture(): Exam {
  return normalizeExamDocument({
    id: 'structure-output', metadata: { title: 'Outline', subject: 'toan', grade: 6,
      schoolName: '', departmentName: '', durationMinutes: 30 }, createdAt: '', updatedAt: '',
    questions: [{ id: 'essay', type: 'essay', content: 'QUESTION_BODY', difficulty: 'thong_hieu',
      step_by_step_solution: 'PRIVATE_PARENT_SOLUTION', partsNumbering: 'decimal', parts: [
        { id: 'a', content: 'PROMPT_A', points: 0, answer: 'PRIVATE_ANSWER_A', solution: 'PRIVATE_SOLUTION_A' },
        { id: 'b', content: 'PROMPT_B', points: 2, answer: 'PRIVATE_ANSWER_B',
          rubric: [{ criterion: 'PRIVATE_RUBRIC', maxPoints: 2 }] },
      ] }],
    passages: [{ id: 'p', content: 'PASSAGE_BODY', source: 'PASSAGE_ATTRIBUTION' }],
    outline: [{ id: 'part', kind: 'part', title: 'PART_VISIBLE', numbering: 'roman',
      instructions: 'PART_INSTRUCTION', children: [{ id: 'group', kind: 'group', title: 'GROUP_VISIBLE',
        passageId: 'p', children: [{ id: 'question', kind: 'question', questionId: 'essay' }] }] },
      { id: 'empty', kind: 'part', title: 'EMPTY_PART_VISIBLE', children: [] }],
  });
}
const xml = async (exam: Exam, view: 'exam' | 'answers' | 'solutions' | 'parallel') => {
  const blob = await exportExamToDocx(exam, true, false, view);
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  return zip.file('word/document.xml')!.async('string');
};

test('outline view emits empty parts and group materials at their exact position with no duplicate source', () => {
  const exam = fixture(), before = JSON.stringify(exam), view = outlineView(exam);
  assert.equal(view.before.get('essay')!.length, 2);
  assert.equal(view.trailing[0].title, 'EMPTY_PART_VISIBLE');
  const html = renderToStaticMarkup(<><StructureBlocks blocks={view.before.get('essay')} />
    <QuestionParts question={exam.questions[0]} number={1} />
    <StructureBlocks blocks={view.trailing} /></>);
  for (const text of ['PART_VISIBLE', 'PART_INSTRUCTION', 'GROUP_VISIBLE', 'PROMPT_A', 'PROMPT_B', 'EMPTY_PART_VISIBLE']) {
    assert.ok(html.includes(text), text);
  }
  assert.equal(html.split('PASSAGE_ATTRIBUTION').length - 1, 1);
  assert.ok(html.indexOf('PART_VISIBLE') < html.indexOf('PASSAGE_BODY'));
  assert.ok(!html.includes('PRIVATE_'));
  assert.equal(JSON.stringify(exam), before);
  const preview = renderToStaticMarkup(<A4Preview exam={exam} />);
  assert.ok(preview.includes('EMPTY_PART_VISIBLE'));
  assert.ok(!preview.includes('PRIVATE_'));
});

test('Word exam/parallel place groups and empty parts once, and exam never contains private part answers', async () => {
  const exam = fixture();
  for (const view of ['exam', 'parallel'] as const) {
    const text = await xml(exam, view);
    assert.equal(text.split('PASSAGE_BODY').length - 1, 1);
    assert.equal(text.split('EMPTY_PART_VISIBLE').length - 1, 1);
    assert.ok(text.includes('PROMPT_A') && text.includes('PROMPT_B'));
    assert.ok(text.indexOf('PART_VISIBLE') < text.indexOf('PASSAGE_BODY'));
    assert.ok(text.indexOf('PASSAGE_BODY') < text.indexOf('QUESTION_BODY'));
    assert.ok(text.includes('1.1)'));
    if (view === 'exam') assert.ok(!text.includes('PRIVATE_'));
    else assert.ok(text.includes('PRIVATE_ANSWER_A') && text.includes('PRIVATE_SOLUTION_A'));
  }
  const answers = await xml(exam, 'answers'), solutions = await xml(exam, 'solutions');
  assert.ok(answers.includes('PRIVATE_ANSWER_A') && answers.includes('PRIVATE_RUBRIC'));
  assert.ok(!answers.includes('PRIVATE_SOLUTION_A'));
  assert.ok(solutions.includes('PRIVATE_SOLUTION_A'));
});

test('student payload preserves outline and prompts but strips all private fields including arbitrary node extras', () => {
  const exam = fixture();
  (exam.outline![0] as unknown as Record<string, unknown>).answer = 'PRIVATE_NODE_ANSWER';
  const publicExam = sanitizeSnapshotForStudent(exam);
  const text = JSON.stringify(publicExam);
  assert.ok(!text.includes('PRIVATE_'));
  assert.equal(publicExam.outline[0].children![0].passageId, 'p');
  assert.ok(text.includes('PROMPT_A') && text.includes('PROMPT_B'));
  assert.ok(validateResponses({ essay: { a: 'Response A', b: 'Response B' } }, exam));
  assert.ok(!validateResponses({ essay: { unknown: 'Response' } }, exam));
  assert.equal(studentResponseText(exam.questions[0], { a: 'Response A' }), 'a) Response A; b) Chưa trả lời');
});

test('existing grading is unchanged; new structured parts require teacher grading and freeze their explicit total', () => {
  const old: Exam = { ...fixture(), outline: undefined, questions: [{ id: 'old', type: 'multiple_choice',
    content: 'Legacy', difficulty: 'thong_hieu', points: 0, correct_answer: 'A',
    choices: [{ key: 'A', text: 'A' }, { key: 'B', text: 'B' }], step_by_step_solution: '' }] };
  const original = gradeSnapshot(old, { old: 'A' });
  assert.deepEqual(gradeSnapshot(normalizeExamDocument(old), { old: 'A' }), original);
  const exam = fixture(), frozen = freezeExamScoring(exam);
  assert.equal(frozen.questions[0].points, 2);
  assert.equal(exam.questions[0].points, undefined);
  const grade = gradeSnapshot({ ...exam, questions: frozen.questions }, { essay: { a: 'A', b: 'B' } });
  assert.equal(grade.maxScore, 2);
  assert.equal(grade.needsGrading, true);
  const short = { ...exam.questions[0], type: 'short_answer', correct_answer: 'A' };
  const snapshot = { questions: [short] };
  assert.deepEqual(regradableQuestions(snapshot), []);
  assert.throws(() => applyAnswerCorrection(snapshot, 'essay', { correctAnswer: 'B' }, { at: '', by: '', reason: 'test' }));
  assert.equal(gradeSnapshot(snapshot, { essay: { a: 'A' } }).gradedAnswers[0].isCorrect, null);
  assert.deepEqual(snapshotQuestions(exam).map(q => q.id), ['essay']);
});
