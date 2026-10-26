import test from 'node:test';
import assert from 'node:assert/strict';
import { compareAnswerReview } from '../src/lib/answer-review';
import type { Question } from '../src/types/exam';

const question = (key: string, accepted: string[] = []) => ({ id: 'q', type: 'short_answer', difficulty: 'thong_hieu', content: 'Tìm điều kiện', correct_answer: key, accepted_answers: accepted.length ? accepted : [key], step_by_step_solution: '' }) as unknown as Question;
const solved = (answer: string) => ({ solvedAnswer: answer, confidence: 90, solutionSteps: 'x', discrepancies: [], recommendation: 'match' as const });

test('the same relation or operator written with different symbols is one answer', () => {
  for (const [key, answer] of [['x >= 3', 'x ≥ 3'], ['x ≥ 3', 'x >= 3'], ['x <= 2', 'x \\le 2'], ['x != 0', 'x ≠ 0'], ['2 * 3', '2 × 3'], ['−5', '-5'], ['$x \\ge 3$', 'x >= 3']]) assert.equal(compareAnswerReview(question(key), solved(answer)).isMatch, true, `${key} = ${answer}`);
});

test('different answers are still different', () => {
  for (const [key, answer] of [['x >= 3', 'x > 3'], ['x <= 2', 'x >= 2'], ['x != 0', 'x = 0'], ['5', '-5']]) assert.equal(compareAnswerReview(question(key), solved(answer)).isMatch, false, `${key} vs ${answer}`);
});
