import test from 'node:test';
import assert from 'node:assert/strict';
import { fromDatabaseExam, normalizeExamDocument, normalizeQuestion, questionToDatabase } from '../src/lib/exam-document';
import type { Question } from '../src/types/exam';

const json = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const base = { id: 'q', type: 'multiple_choice', content: 'Legacy prompt', difficulty: 'thong_hieu' };
const choices = [{ key: 'A', text: 'One' }, { key: 'B', text: 'Two' }];
function databaseRoundtrip(question: Question) {
  const stored = json(questionToDatabase(question, { ownerId: 'teacher', subject: 'toan', grade: 6, examId: 'doc', questionId: 'physical-id' }));
  return fromDatabaseExam({ id: 'doc', title: 'Title', subject: 'toan', grade: 6, durationMinutes: 15, metadata: {}, items: [{ question: stored, sectionId: 'workspace' }] }).questions[0];
}

test('legacy MC aliases are consumed once; clearing the answer survives JSON and database adapters', () => {
  const legacy = { ...base, correctAnswer: 'A', solution: 'Old solution', choices, payload: { correct: 'B', customSource: { page: 7 }, editorData: { correct_answer: 'B', choices } } };
  const imported = normalizeQuestion(legacy);
  assert.equal(imported.correct_answer, 'A');
  assert.equal(imported.step_by_step_solution, 'Old solution');
  assert.equal('correctAnswer' in imported, false); assert.equal('solution' in imported, false);
  for (const clear of [undefined, null]) {
    const cleared = normalizeQuestion({ ...imported, correct_answer: clear, step_by_step_solution: undefined });
    const serialized = normalizeQuestion(json(cleared));
    assert.equal(serialized.correct_answer, clear);
    assert.equal(serialized.step_by_step_solution, '');
    const restored = databaseRoundtrip(serialized);
    assert.equal(restored.correct_answer, clear);
    assert.equal(restored.step_by_step_solution, '');
    assert.deepEqual((restored as unknown as { payload: unknown }).payload, { customSource: { page: 7 } });
  }
  assert.equal(legacy.correctAnswer, 'A'); assert.equal(legacy.payload.correct, 'B', 'Normalization never mutates the source.');
});

test('short-answer clear removes primary and accepted answers without reviving stale payload copies', () => {
  const imported = normalizeQuestion({ ...base, type: 'short_answer', correctAnswer: '0', payload: { correct: 'old', accepted_answers: ['0', 'zero'], editorData: { accepted_answers: ['stale'] } } });
  assert.deepEqual(imported.accepted_answers, ['0', 'zero']);
  for (const accepted of [undefined, null, []]) {
    const cleared = normalizeQuestion({ ...imported, correct_answer: undefined, accepted_answers: accepted });
    const restored = databaseRoundtrip(normalizeQuestion(json(cleared)));
    assert.equal(restored.correct_answer, undefined);
    assert.deepEqual(restored.accepted_answers, accepted);
  }
});

test('explicit canonical null and undefined override stale legacy copies for every editable optional body', () => {
  const stale = { choices, sub_questions: [{ key: 'a', content: 'Old', isCorrect: false }], correct_answer: 'A', accepted_answers: ['A'], rubric: [{ criterion: 'Old', maxPoints: 1 }], step_by_step_solution: 'Old', figures: [{ id: 'f', kind: 'image', data: { url: 'old.png' } }], matchingPairs: [{ left: 'L', right: 'R' }], correctOrder: ['Old'], points: 2 };
  assert.equal(normalizeQuestion({ ...base, content: '', payload: { editorData: { content: 'Old prompt' } } }).content, '');
  assert.throws(() => normalizeQuestion({ ...base, content: null, payload: { editorData: { content: 'Old prompt' } } }), /thiếu nội dung/);
  for (const clear of [null, undefined]) {
    const input = { ...base, correctAnswer: 'B', solution: 'Old', payload: { ...stale, correct: 'B', pairs: stale.matchingPairs, correct_order: stale.correctOrder, editorData: stale }, ...Object.fromEntries(Object.keys(stale).map(key => [key, clear])) };
    const result = normalizeQuestion(input);
    const restored = normalizeQuestion(json(result));
    for (const key of Object.keys(stale)) {
      const actual = (restored as unknown as Record<string, unknown>)[key];
      assert.deepEqual(actual, key === 'step_by_step_solution' ? '' : ['points', 'figures'].includes(key) ? undefined : clear, key);
    }
    assert.equal('correctAnswer' in restored, false); assert.equal('solution' in restored, false);
  }
});

test('legacy absent fields still load while database null, zero and false remain authoritative', () => {
  const editor = { ...base, points: 9, figures: [{ id: 'f', kind: 'image', data: {} }], rubric: [{ criterion: 'Old', maxPoints: 9 }] };
  const legacy = { ...base, type: 'TRUE_FALSE_GROUP', difficulty: 'THONG_HIEU', payload: { correct: '0', sub_questions: [{ key: 'a', content: 'False', isCorrect: false }], editorData: editor } };
  const fallback = normalizeQuestion(legacy);
  assert.equal(fallback.points, 9); assert.equal(fallback.figures?.length, 1); assert.equal(fallback.rubric?.[0].maxPoints, 9);
  assert.equal(fallback.sub_questions?.[0].isCorrect, false); assert.equal(fallback.correct_answer, '0');
  const cleared = normalizeQuestion({ ...legacy, points: null, figures: null, rubric: null, correct_answer: null });
  assert.equal(cleared.points, undefined); assert.equal(cleared.figures, undefined); assert.equal(cleared.rubric, null); assert.equal(cleared.correct_answer, null);
  const zero = databaseRoundtrip(normalizeQuestion({ ...legacy, points: 0, rubric: [{ criterion: 'Zero', maxPoints: 0 }] }));
  assert.equal(zero.points, 0); assert.equal(zero.rubric?.[0].maxPoints, 0); assert.equal(zero.sub_questions?.[0].isCorrect, false);
});

test('unknown source/editor payload stays opaque across repeated normalization and database roundtrip', () => {
  const imported = normalizeQuestion({ ...base, customQuestionSource: { edition: 'X' }, payload: { customOuter: { answerKeyOnPage: 18 }, editorData: { customEditor: { reviewed: false }, payload: { customInner: ['keep', 0] }, rubric: [] } } });
  const restored = databaseRoundtrip(normalizeQuestion(json(normalizeQuestion(imported))));
  const unknown = restored as unknown as Record<string, unknown>;
  assert.deepEqual(unknown.payload, { customInner: ['keep', 0], customOuter: { answerKeyOnPage: 18 } });
  assert.deepEqual(unknown.customQuestionSource, { edition: 'X' }); assert.deepEqual(unknown.customEditor, { reviewed: false });
  assert.equal(unknown.ownerId, undefined); assert.equal(unknown.authorId, undefined);
});

test('whole-document normalize/serialize cycles preserve a deliberate answer removal', () => {
  const imported = normalizeQuestion({ ...base, correctAnswer: 'A', payload: { correct: 'A', choices } });
  const document = { id: 'doc', metadata: { title: 'Title', subject: 'toan', grade: 6, schoolName: '', departmentName: '', durationMinutes: 15 }, questions: [{ ...imported, correct_answer: undefined }], createdAt: '', updatedAt: '' };
  const result = normalizeExamDocument(json(normalizeExamDocument(document)));
  assert.equal(result.questions[0].correct_answer, undefined);
  assert.deepEqual(result.questions[0].choices, choices);
});
