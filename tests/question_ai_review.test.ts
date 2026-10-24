import test from 'node:test';
import assert from 'node:assert/strict';
import type { Exam, Question } from '../src/types/exam';
import { captureQuestionAiBase, prepareQuestionAiSubmission, questionAiBaseMatches } from '../src/lib/question-ai-review';
import { applyQuestionManualSubmission, questionDraftSourceStamp } from '../src/lib/question-draft';

function fixture(): Exam {
  return { id: 'doc', createdAt: '', updatedAt: '', metadata: { title: 'Title', schoolName: '', departmentName: '', subject: 'toan', grade: 6, durationMinutes: 15 }, questions: [{ id: 'q', type: 'multiple_choice', subject: 'toan', grade: 6, content: 'Base prompt', difficulty: 'thong_hieu', choices: [{ key: 'A', text: 'One' }], correct_answer: 'A', points: 0, step_by_step_solution: 'Base solution', version: 7, status: 'verified', verifiedBy: 'human', figures: [{ id: 'f', kind: 'image', data: { url: '/fixture.png' } }], rubric: [{ criterion: 'Teacher rubric needs review', maxPoints: 0 }], sectionId: 'section', passageId: 'passage', knowledgeIds: ['knowledge'], outcomeIds: ['outcome'], knowledgeReference: { packageId: 'package', packageRevision: 'r1' } }] };
}
const candidate = (type: Question['type'] = 'essay'): Question => ({ id: 'provider-id', type, difficulty: 'van_dung', content: 'Proposed prompt', step_by_step_solution: 'Proposed solution' });

test('captured full base is independent from later caller mutation and canonical key order is immaterial', () => {
  const exam = fixture(), source = questionDraftSourceStamp(exam), base = captureQuestionAiBase('owner', exam.id, source, exam.questions[0]);
  const reordered = Object.fromEntries(Object.entries(exam.questions[0]).reverse()) as unknown as Question;
  assert.equal(questionAiBaseMatches(base, 'owner', exam.id, source, reordered), true);
  exam.questions[0].choices![0].text = 'Mutated later';
  exam.questions[0].figures![0].data = { url: '/later.png' };
  assert.equal(base.question.choices![0].text, 'One');
  assert.deepEqual(base.question.figures![0].data, { url: '/fixture.png' });
  assert.equal(questionAiBaseMatches(base, 'owner', exam.id, source, exam.questions[0]), false);
});

test('acceptance rejects every changed identity/context/full-question tuple, including answer and figure-only edits', () => {
  const exam = fixture(), question = exam.questions[0], source = questionDraftSourceStamp(exam), base = captureQuestionAiBase('owner', exam.id, source, question);
  for (const args of [
    ['other', exam.id, source, question], ['owner', 'other-doc', source, question], ['owner', exam.id, 'same-package-id-but-new-content', question],
    ['owner', exam.id, source, { ...question, correct_answer: 'B' }], ['owner', exam.id, source, { ...question, step_by_step_solution: 'Newer answer' }],
    ['owner', exam.id, source, { ...question, version: 8 }], ['owner', exam.id, source, { ...question, figures: [] }],
    ['owner', exam.id, source, { ...question, points: 1 }], ['owner', exam.id, source, { ...question, content: 'Newer prompt' }],
  ] as [string, string, string, Question][]) {
    assert.equal(questionAiBaseMatches(base, ...args), false);
    assert.equal(prepareQuestionAiSubmission(base, candidate(), ...args), null);
  }
});

test('accepted candidate pins IDs, subject/grade, links and zero points; resets review/version and keeps omitted figures/rubric/unknown', () => {
  const exam = fixture(), question = { ...exam.questions[0], customTeacherData: { sourcePage: 0 } }, source = questionDraftSourceStamp(exam);
  const base = captureQuestionAiBase('owner', exam.id, source, question);
  const proposed = { ...candidate(), subject: 'ngu_van' as const, grade: 12, points: 99, sectionId: 'foreign', passageId: 'foreign', knowledgeIds: ['foreign'], outcomeIds: ['foreign'], knowledgeReference: { packageId: 'foreign', packageRevision: 'r99' }, version: 200, status: 'verified' as const, verifiedBy: 'human' as const, aiGenerated: false };
  const submission = prepareQuestionAiSubmission(base, proposed, 'owner', exam.id, source, question)!;
  assert.ok(submission); assert.equal(submission.value.id, 'q'); assert.equal(submission.value.subject, 'toan'); assert.equal(submission.value.grade, 6); assert.equal(submission.value.points, 0);
  for (const key of ['sectionId', 'passageId', 'knowledgeIds', 'outcomeIds', 'knowledgeReference'] as const) assert.deepEqual(submission.value[key], question[key]);
  assert.equal(submission.value.version, 8); assert.equal(submission.value.status, 'draft'); assert.equal(submission.value.verifiedBy, 'none');
  assert.equal(submission.value.aiGenerated, true, 'Accepting an AI candidate records AI provenance without granting verification.');
  assert.equal(base.question.aiGenerated, undefined, 'The original teacher base is not relabeled.');
  assert.deepEqual(submission.value.figures, question.figures); assert.notEqual(submission.value.figures, question.figures);
  assert.deepEqual(submission.value.rubric, question.rubric);
  assert.deepEqual((submission.value as unknown as Record<string, unknown>).customTeacherData, { sourcePage: 0 });
  assert.equal(question.correct_answer, 'A'); assert.equal(proposed.version, 200);
  const repeated = prepareQuestionAiSubmission(base, proposed, 'owner', exam.id, source, question)!;
  assert.notEqual(submission.token, repeated.token);
});

test('new candidate body never inherits old MC/short answers, pairs or ordering even through legacy aliases', () => {
  const exam = fixture(), source = questionDraftSourceStamp(exam);
  for (const type of ['multiple_choice', 'short_answer'] as const) {
    const question = { ...exam.questions[0], type, correctAnswer: 'LEGACY', accepted_answers: ['Old'], sub_questions: [{ key: 'a', content: 'Old', isCorrect: false }], matchingPairs: [{ id: 'pair', left: 'Old', right: 'Old' }], correctOrder: ['Old'] };
    const base = captureQuestionAiBase('owner', exam.id, source, question);
    const submission = prepareQuestionAiSubmission(base, candidate(), 'owner', exam.id, source, question)!;
    assert.ok(submission);
    for (const key of ['choices', 'correct_answer', 'accepted_answers', 'sub_questions', 'matchingPairs', 'correctOrder', 'correctAnswer']) assert.equal((submission.value as unknown as Record<string, unknown>)[key], undefined, key);
  }
  const question = exam.questions[0], base = captureQuestionAiBase('owner', exam.id, source, question);
  const proposed = { ...candidate('short_answer'), correct_answer: '0', accepted_answers: ['0', 'zero'], figures: [] };
  const submission = prepareQuestionAiSubmission(base, proposed, 'owner', exam.id, source, question)!;
  assert.equal(submission.value.correct_answer, '0'); assert.deepEqual(submission.value.accepted_answers, ['0', 'zero']); assert.deepEqual(submission.value.figures, []);
});

test('invalid provider body is rejected rather than repaired by retaining the base question body', () => {
  const exam = fixture(), source = questionDraftSourceStamp(exam), question = exam.questions[0], base = captureQuestionAiBase('owner', exam.id, source, question);
  for (const invalid of [{}, { ...candidate(), type: 'unsupported' }, { ...candidate(), content: undefined }, { ...candidate(), choices: [{ key: 'A', text: 1 }] }]) {
    assert.equal(prepareQuestionAiSubmission(base, invalid as Question, 'owner', exam.id, source, question), null);
  }
});

test('parent updater rechecks newer edits, source/account and permissions after the accept handler', () => {
  const exam = fixture(), source = questionDraftSourceStamp(exam), question = exam.questions[0], base = captureQuestionAiBase('owner', exam.id, source, question);
  const submission = prepareQuestionAiSubmission(base, candidate(), 'owner', exam.id, source, question)!;
  const applied = applyQuestionManualSubmission(exam, submission, 'owner');
  assert.equal(applied.questions[0].content, 'Proposed prompt');
  assert.equal(applyQuestionManualSubmission(exam, submission, 'other-owner'), exam);
  for (const newer of [
    { ...exam, id: 'other-doc' },
    { ...exam, metadata: { ...exam.metadata, grade: 7 } },
    { ...exam, questions: [{ ...question, step_by_step_solution: 'Arrived after click' }] },
    { ...exam, access: { role: 'viewer', canRead: true, canEdit: false, canComment: true, canManage: false, canPublish: false } },
  ]) assert.equal(applyQuestionManualSubmission(newer, submission, 'owner'), newer);
});
