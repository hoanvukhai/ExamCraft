import test from 'node:test';
import assert from 'node:assert/strict';
import type { Exam, Question } from '../src/types/exam';
import { applyCopilotSubmission, captureCopilotBase, prepareCopilotSubmission } from '../src/lib/copilot-submission';
import { appendCopilotHistory, confirmCopilotTravel, emptyCopilotHistory, prepareCopilotTravel } from '../src/lib/copilot-history';

const fixture = (): Exam => ({ id: 'doc', createdAt: '', updatedAt: '', metadata: { title: 'Title', subject: 'toan', grade: 6, durationMinutes: 15, schoolName: '', departmentName: '' }, questions: [{ id: 'a', type: 'essay', difficulty: 'thong_hieu', content: 'Original', step_by_step_solution: 'Original solution', points: 0, version: 3, status: 'verified', verifiedBy: 'human', figures: [{ id: 'f', kind: 'image', data: { url: '/qa.png' } }] }] });
const candidate: Question = { id: 'provider', type: 'essay', difficulty: 'van_dung', content: 'AI prompt', step_by_step_solution: 'AI solution' };

test('undo/redo edit preserves figures/zero and creates higher question versions, never restores verified status', () => {
  const original = fixture(), accepted = prepareCopilotSubmission(captureCopilotBase('owner', original), { action: 'modify_single_question', targetQuestionId: 'a', modifiedQuestion: candidate }, 'owner', original)!;
  let exam = applyCopilotSubmission(original, accepted, 'owner'), history = appendCopilotHistory(emptyCopilotHistory(), accepted);
  const undo = prepareCopilotTravel(history.undo[0], 'undo', 'owner', exam)!;
  assert.equal(history.undo.length, 1, 'Sending a travel must not consume history.');
  exam = applyCopilotSubmission(exam, undo, 'owner'); history = confirmCopilotTravel(history, accepted.token, 'undo', undo);
  assert.equal(exam.questions[0].content, 'Original'); assert.equal(exam.questions[0].version, 5); assert.equal(exam.questions[0].verifiedBy, 'none');
  assert.equal(exam.questions[0].points, 0); assert.deepEqual(exam.questions[0].figures, original.questions[0].figures);
  assert.equal(history.undo.length, 0); assert.equal(history.redo.length, 1);
  const redo = prepareCopilotTravel(history.redo[0], 'redo', 'owner', exam)!;
  exam = applyCopilotSubmission(exam, redo, 'owner'); history = confirmCopilotTravel(history, accepted.token, 'redo', redo);
  assert.equal(exam.questions[0].content, 'AI prompt'); assert.equal(exam.questions[0].version, 6); assert.equal(history.redo.length, 0);
  assert.ok(prepareCopilotTravel(history.undo[0], 'undo', 'owner', exam));
});

test('two accepts, two undos and two redos update chain stamps; add/remove never duplicate question IDs', () => {
  let exam = fixture(), history = emptyCopilotHistory();
  for (const action of ['modify_single_question', 'add_question']) {
    const accepted = prepareCopilotSubmission(captureCopilotBase('owner', exam), { action, targetQuestionId: 'a', modifiedQuestion: candidate }, 'owner', exam)!;
    history = appendCopilotHistory(history, accepted); exam = applyCopilotSubmission(exam, accepted, 'owner');
  }
  const addedId = exam.questions[1].id;
  for (let index = 0; index < 2; index++) { const entry = history.undo.at(-1)!, submission = prepareCopilotTravel(entry, 'undo', 'owner', exam)!; assert.ok(submission); exam = applyCopilotSubmission(exam, submission, 'owner'); history = confirmCopilotTravel(history, entry.id, 'undo', submission); }
  assert.equal(exam.questions.length, 1); assert.equal(exam.questions[0].content, 'Original');
  for (let index = 0; index < 2; index++) { const entry = history.redo.at(-1)!, submission = prepareCopilotTravel(entry, 'redo', 'owner', exam)!; assert.ok(submission); exam = applyCopilotSubmission(exam, submission, 'owner'); history = confirmCopilotTravel(history, entry.id, 'redo', submission); }
  assert.equal(exam.questions.length, 2); assert.equal(exam.questions[1].id, addedId); assert.ok(exam.questions[1].version! > 1); assert.equal(history.undo.length, 2);
});

test('undo delete restores the exact ID/body at a new version and redo removes only that row', () => {
  const original = fixture(), accepted = prepareCopilotSubmission(captureCopilotBase('owner', original), { action: 'delete_question', targetQuestionId: 'a' }, 'owner', original)!;
  let exam = applyCopilotSubmission(original, accepted, 'owner'), history = appendCopilotHistory(emptyCopilotHistory(), accepted);
  const undo = prepareCopilotTravel(history.undo[0], 'undo', 'owner', exam)!;
  exam = applyCopilotSubmission(exam, undo, 'owner'); history = confirmCopilotTravel(history, accepted.token, 'undo', undo);
  assert.equal(exam.questions[0].id, 'a'); assert.equal(exam.questions[0].content, 'Original'); assert.equal(exam.questions[0].version, 4);
  const redo = prepareCopilotTravel(history.redo[0], 'redo', 'owner', exam)!;
  assert.equal(applyCopilotSubmission(exam, redo, 'owner').questions.length, 0);
});

test('newer edits, context, permission, account and updater races refuse travel; duplicate confirmation is harmless', () => {
  const original = fixture(), accepted = prepareCopilotSubmission(captureCopilotBase('owner', original), { action: 'modify_single_question', targetQuestionId: 'a', modifiedQuestion: candidate }, 'owner', original)!;
  const exam = applyCopilotSubmission(original, accepted, 'owner'), history = appendCopilotHistory(emptyCopilotHistory(), accepted), entry = history.undo[0];
  assert.equal(appendCopilotHistory(history, accepted), history);
  for (const newer of [{ ...exam, id: 'other' }, { ...exam, access: { canEdit: false } } as Exam, { ...exam, metadata: { ...exam.metadata, grade: 7 } }, { ...exam, questions: exam.questions.map(q => ({ ...q, step_by_step_solution: 'B newer answer' })) }]) assert.equal(prepareCopilotTravel(entry, 'undo', 'owner', newer), null);
  assert.equal(prepareCopilotTravel(entry, 'undo', 'other', exam), null);
  const submission = prepareCopilotTravel(entry, 'undo', 'owner', exam)!, raced = { ...exam, questions: exam.questions.map(q => ({ ...q, content: 'Race new content' })) };
  assert.equal(applyCopilotSubmission(raced, submission, 'owner'), raced);
  const confirmed = confirmCopilotTravel(history, entry.id, 'undo', submission);
  assert.equal(confirmCopilotTravel(confirmed, entry.id, 'undo', submission), confirmed);
  assert.equal(appendCopilotHistory(confirmed, { ...accepted, token: 'new-operation' }).redo.length, 0);
});
