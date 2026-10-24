import test from 'node:test';
import assert from 'node:assert/strict';
import type { Exam, Question } from '../src/types/exam';
import { applyCopilotSubmission, captureCopilotBase, copilotBaseMatches, prepareCopilotSubmission } from '../src/lib/copilot-submission';

const fixture = (): Exam => ({ id: 'doc', createdAt: '', updatedAt: '', metadata: { title: 'Title', subject: 'toan', grade: 6, schoolName: '', departmentName: '', durationMinutes: 15 }, questions: [
  { id: 'a', type: 'multiple_choice', difficulty: 'thong_hieu', content: 'Original', step_by_step_solution: 'Original solution', choices: [{ key: 'A', text: 'One' }], correct_answer: 'A', points: 0, version: 3, status: 'verified', verifiedBy: 'human', sectionId: 's', passageId: 'p', figures: [{ id: 'f', kind: 'image', data: { url: '/qa.png' } }] },
  { id: 'b', type: 'essay', difficulty: 'thong_hieu', content: 'Other', step_by_step_solution: '', points: 0 },
] });
const proposed: Question = { id: 'provider', type: 'essay', difficulty: 'van_dung', content: 'AI candidate', step_by_step_solution: 'AI solution', points: 99, sectionId: 'foreign', passageId: 'foreign' };
const modify = { action: 'modify_single_question', targetQuestionId: 'a', modifiedQuestion: proposed };

test('copilot base captures full question order and context without sharing mutable source', () => {
  const exam = fixture(), base = captureCopilotBase('owner', exam);
  assert.ok(copilotBaseMatches(base, 'owner', exam));
  exam.questions[0].figures![0].data = { url: '/changed.png' };
  assert.equal(copilotBaseMatches(base, 'owner', exam), false);
  assert.deepEqual(base.questions[0].figures![0].data, { url: '/qa.png' });
});

test('modify pins points and links, clears old answer body, resets verification and preserves other question', () => {
  const exam = fixture(), base = captureCopilotBase('owner', exam);
  const submission = prepareCopilotSubmission(base, modify, 'owner', exam)!;
  assert.ok(submission);
  const next = applyCopilotSubmission(exam, submission, 'owner'), value = next.questions[0];
  assert.equal(value.content, proposed.content); assert.equal(value.id, 'a'); assert.equal(value.points, 0);
  assert.equal(value.sectionId, 's'); assert.equal(value.passageId, 'p'); assert.equal(value.correct_answer, undefined); assert.equal(value.choices, undefined);
  assert.equal(value.version, 4); assert.equal(value.status, 'draft'); assert.equal(value.verifiedBy, 'none'); assert.equal(value.aiGenerated, true);
  assert.deepEqual(value.figures, exam.questions[0].figures); assert.deepEqual(next.questions[1], exam.questions[1]);
  assert.equal(exam.questions[0].content, 'Original');
});

test('handler and parent updater both refuse account/doc/context/order or any newer question edits', () => {
  const exam = fixture(), base = captureCopilotBase('owner', exam), submission = prepareCopilotSubmission(base, modify, 'owner', exam)!;
  assert.equal(prepareCopilotSubmission(base, modify, 'other', exam), null);
  assert.equal(applyCopilotSubmission(exam, submission, 'other'), exam);
  for (const changed of [
    { ...exam, id: 'other-doc' }, { ...exam, access: { canEdit: false } } as Exam,
    { ...exam, metadata: { ...exam.metadata, grade: 7 } },
    { ...exam, metadata: { ...exam.metadata, assessmentMode: 'survey' as const } },
    { ...exam, questions: [...exam.questions].reverse() },
    { ...exam, questions: exam.questions.map(q => q.id === 'b' ? { ...q, step_by_step_solution: 'New answer from B' } : q) },
    { ...exam, questions: exam.questions.map(q => q.id === 'a' ? { ...q, version: 4 } : q) },
  ]) {
    assert.equal(prepareCopilotSubmission(base, modify, 'owner', changed), null);
    assert.equal(applyCopilotSubmission(changed, submission, 'owner'), changed);
  }
  const headerChanged = { ...exam, metadata: { ...exam.metadata, title: 'New teacher title' } };
  assert.equal(applyCopilotSubmission(headerChanged, submission, 'owner').metadata.title, 'New teacher title');
});

test('add uses a fresh ID and document subject/grade, has no automatic points or foreign links', () => {
  const exam = fixture(), base = captureCopilotBase('owner', exam), action = { action: 'add_question', modifiedQuestion: proposed };
  const first = prepareCopilotSubmission(base, action, 'owner', exam)!, second = prepareCopilotSubmission(base, action, 'owner', exam)!;
  const added = first.questions[2];
  assert.notEqual(added.id, proposed.id); assert.notEqual(added.id, second.questions[2].id);
  assert.equal(added.subject, 'toan'); assert.equal(added.grade, 6); assert.equal(added.points, undefined);
  assert.equal(added.sectionId, undefined); assert.equal(added.passageId, undefined); assert.equal(added.knowledgeReference, undefined);
  assert.equal(added.version, 1); assert.equal(added.aiGenerated, true); assert.equal(added.verifiedBy, 'none');
  assert.equal(applyCopilotSubmission(exam, first, 'owner').questions.length, 3);
});

test('delete requires explicit target; unsupported/incomplete actions and malformed candidates stay unapplied', () => {
  const exam = fixture(), base = captureCopilotBase('owner', exam);
  const deleted = prepareCopilotSubmission(base, { action: 'delete_question', targetQuestionId: 'a' }, 'owner', exam)!;
  assert.deepEqual(deleted.questions.map(q => q.id), ['b']);
  for (const result of [{ action: 'delete_question' }, { action: 'delete_question', targetQuestionId: 'missing' }, { ...modify, targetQuestionId: undefined }, { ...modify, modifiedQuestion: undefined }, { ...modify, modifiedQuestion: {} as Question }, { action: 'modify_all_numbers' }, { action: 'unknown' }]) {
    assert.equal(prepareCopilotSubmission(base, result, 'owner', exam), null);
  }
  assert.equal(applyCopilotSubmission(exam, { ...deleted, questions: [exam.questions[0], exam.questions[0]] }, 'owner'), exam);
  assert.equal(applyCopilotSubmission(exam, { ...deleted, questions: Array(1001).fill(exam.questions[0]) }, 'owner'), exam);
});
