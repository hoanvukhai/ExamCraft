import test from 'node:test';
import assert from 'node:assert/strict';
import { shuffleQuestionUnits } from '../src/lib/question-order';
import { createAttemptLayout } from '../src/lib/attempt-layout';
import { generateShuffledExams } from '../src/lib/shuffler';
import type { Exam, Question } from '../src/types/exam';

function prng(seed: number) { let state = seed >>> 0; return () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; }; }
type Q = { id: string; sectionId?: string; passageId?: string };
const ids = (list: Q[]) => list.map(q => q.id);
const sample = (): Q[] => [
  { id: 's1a', sectionId: 'S1' }, { id: 's1b', sectionId: 'S1' }, { id: 's1c', sectionId: 'S1' }, { id: 's1d', sectionId: 'S1' },
  { id: 'r1', sectionId: 'S2', passageId: 'P1' }, { id: 'r2', sectionId: 'S2', passageId: 'P1' }, { id: 'r3', sectionId: 'S2', passageId: 'P1' },
  { id: 'x1', sectionId: 'S2' }, { id: 'x2', sectionId: 'S2' },
  { id: 't1', sectionId: 'S3', passageId: 'P2' }, { id: 't2', sectionId: 'S3', passageId: 'P2' }, { id: 't3', sectionId: 'S3' },
];

test('the same seed gives the same order and the input is not changed', () => {
  const input = sample(), before = JSON.stringify(input);
  assert.deepEqual(ids(shuffleQuestionUnits(input, prng(5))), ids(shuffleQuestionUnits(input, prng(5))));
  assert.equal(JSON.stringify(input), before);
  assert.ok(Array.from({ length: 20 }, (_, seed) => ids(shuffleQuestionUnits(input, prng(seed + 1))).join()).some(order => order !== ids(input).join()), 'some seed changes the order');
});

test('every question is kept exactly once and never leaves its section', () => {
  for (let seed = 1; seed <= 60; seed++) {
    const out = shuffleQuestionUnits(sample(), prng(seed));
    assert.deepEqual([...ids(out)].sort(), [...ids(sample())].sort());
    assert.deepEqual(out.map(q => q.sectionId), ['S1', 'S1', 'S1', 'S1', 'S2', 'S2', 'S2', 'S2', 'S2', 'S3', 'S3', 'S3'], `seed ${seed}: sections keep their order and size`);
  }
});

test('questions sharing a passage move together as a block and keep their own order', () => {
  const seen = new Set<string>();
  for (let seed = 1; seed <= 80; seed++) {
    const out = ids(shuffleQuestionUnits(sample(), prng(seed)));
    const at = out.indexOf('r1'); assert.deepEqual(out.slice(at, at + 3), ['r1', 'r2', 'r3'], `seed ${seed}: passage P1 is one block`);
    const bt = out.indexOf('t1'); assert.deepEqual(out.slice(bt, bt + 2), ['t1', 't2'], `seed ${seed}: passage P2 is one block`);
    seen.add(String(at));
  }
  assert.ok(seen.size > 1, 'the block really moves between positions');
});

test('questions without a section or passage are all shuffled, and a passage split in the source is joined', () => {
  const plain: Q[] = Array.from({ length: 10 }, (_, i) => ({ id: 'p' + i }));
  assert.ok(Array.from({ length: 10 }, (_, seed) => ids(shuffleQuestionUnits(plain, prng(seed + 1))).join()).some(order => order !== ids(plain).join()));
  const split: Q[] = [{ id: 'a', passageId: 'P' }, { id: 'b' }, { id: 'c', passageId: 'P' }];
  for (let seed = 1; seed <= 20; seed++) { const out = ids(shuffleQuestionUnits(split, prng(seed))); const at = out.indexOf('a'); assert.deepEqual(out.slice(at, at + 2), ['a', 'c']); }
});

const mc = (id: string, extra: Partial<Question> = {}): Question => ({ id, type: 'multiple_choice', difficulty: 'thong_hieu', content: id, points: 1, correct_answer: 'A', step_by_step_solution: '', choices: ['A', 'B', 'C', 'D'].map(key => ({ key, text: key + id })), ...extra } as Question);
const exam = (questions: Question[]): Exam => ({ id: 'e', createdAt: '2026', updatedAt: '2026', metadata: { title: 't', subject: 'toan', grade: 6, durationMinutes: 45, schoolName: '', departmentName: '' }, passages: [{ id: 'P', title: 'NL', content: 'Ngữ liệu' }], questions } as Exam);

test('mã đề of an exam with sections and a passage differ in question order, keep blocks together, and the key matches', () => {
  const base = exam([mc('a', { sectionId: 'S1' }), mc('b', { sectionId: 'S1' }), mc('c', { sectionId: 'S1' }), mc('d', { sectionId: 'S1' }), mc('e', { sectionId: 'S2', passageId: 'P' }), mc('f', { sectionId: 'S2', passageId: 'P' }), mc('g', { sectionId: 'S2' })]);
  const variants = generateShuffledExams(base, 6, 101, 11);
  assert.ok(new Set(variants.map(v => v.exam.questions.map(q => q.id).join())).size > 1, 'the codes do not all share one question order');
  for (const v of variants) {
    const order = v.exam.questions.map(q => q.id);
    assert.deepEqual(order.slice(0, 4).sort(), ['a', 'b', 'c', 'd'], 'section 1 stays first');
    const at = order.indexOf('e'); assert.deepEqual(order.slice(at, at + 2), ['e', 'f'], 'the passage block stays together');
    v.exam.questions.forEach((q, index) => assert.equal(v.answerKey[index + 1], q.correct_answer, 'the answer key follows the new numbering'));
  }
});

test('the per-student layout of an online assignment keeps sections and passage blocks too', () => {
  const snapshot = { metadata: { title: 't', subject: 'toan', grade: 6 }, passages: [{ id: 'P', title: 'NL', content: 'NL' }], sections: [],
    questions: [mc('a', { sectionId: 'S1' }), mc('b', { sectionId: 'S1' }), mc('c', { sectionId: 'S2', passageId: 'P' }), mc('d', { sectionId: 'S2', passageId: 'P' }), mc('e', { sectionId: 'S2' })] };
  const orders = new Set<string>();
  for (let seed = 1; seed <= 40; seed++) {
    const order = createAttemptLayout(snapshot, seed, true, true).questionOrder; orders.add(order.join());
    assert.deepEqual(order.slice(0, 2).sort(), ['a', 'b'], `seed ${seed}: section 1 first`);
    const at = order.indexOf('c'); assert.deepEqual(order.slice(at, at + 2), ['c', 'd'], `seed ${seed}: passage block together`);
  }
  assert.ok(orders.size > 1, 'students really get different orders');
  assert.deepEqual(createAttemptLayout(snapshot, 3, false, false).questionOrder, ['a', 'b', 'c', 'd', 'e'], 'no shuffle keeps the exam order');
});
