import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeQuestion } from '../src/lib/exam-document';

const base = { id: 'q1', type: 'essay', difficulty: 'thong_hieu', content: 'Hình bên', step_by_step_solution: '' };
const plot = { kind: 'function_plot', data: { expression: 'x^2' }, caption: 'Đồ thị' };

test('figures stored as an array or as an object keyed by id normalize to the same list', () => {
  const fromArray = normalizeQuestion({ ...base, figures: [{ id: 'f1', ...plot }] });
  const fromObject = normalizeQuestion({ ...base, figures: { f1: plot } });
  assert.deepEqual(fromObject.figures, fromArray.figures);
  assert.equal(fromObject.figures?.[0].id, 'f1');
});

test('an object-form figure keeps its own id over the key, and an empty or missing field stays empty', () => {
  assert.equal(normalizeQuestion({ ...base, figures: { key: { id: 'own', ...plot } } }).figures?.[0].id, 'own');
  assert.deepEqual(normalizeQuestion({ ...base, figures: [] }).figures, []);
  assert.equal(normalizeQuestion(base).figures, undefined);
});

test('an unsupported figure kind is refused instead of silently dropped', () => {
  assert.throws(() => normalizeQuestion({ ...base, figures: { f1: { kind: 'hologram' } } }), /chưa được hỗ trợ/);
  assert.throws(() => normalizeQuestion({ ...base, figures: [{ kind: 'hologram' }] }), /chưa được hỗ trợ/);
});
