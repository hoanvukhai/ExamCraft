import test from 'node:test';
import assert from 'node:assert/strict';
import { parseImportedDocument } from '../src/lib/import-document';

test('import preserves seven types and supplied zero points without filling unknown answers', () => {
  const types = ['multiple_choice', 'true_false_group', 'short_answer', 'essay', 'fill_blank', 'matching', 'ordering'];
  const result = parseImportedDocument({ questions: types.map(type => ({ id: type, type, content: type, points: 0, status: 'verified', verifiedBy: 'human', sub_questions: type === 'true_false_group' ? [{ key: 'a', content: 'Ý chưa có đáp án' }] : undefined, matchingPairs: type === 'matching' ? [{ left: 'A', right: 'B' }] : undefined, correctOrder: type === 'ordering' ? ['B', 'A'] : undefined })) }, 'fixture');
  assert.deepEqual(result.questions.map(q => q.type), types);
  assert.equal(new Set(result.questions.map(q => q.id)).size, 7);
  for (const question of result.questions) { assert.equal(question.status, 'draft'); assert.equal(question.verifiedBy, 'none'); assert.equal(question.points, 0); assert.equal(question.correct_answer, undefined); }
  assert.equal(result.questions[1].sub_questions![0].isCorrect, undefined);
});

test('import remaps shared passage IDs and refuses missing or duplicate passage definitions', () => {
  const q = { type: 'essay', content: 'Đọc văn bản', passageId: 'p' };
  const input = { questions: [q, q], passages: [{ id: 'p', content: 'Văn bản', source: 'Nguồn' }], warnings: ['Cần xem lại hình'] };
  const result = parseImportedDocument(input, 'fixture');
  assert.equal(result.passages.length, 1);
  assert.equal(result.questions[0].passageId, result.passages[0].id);
  assert.equal(result.questions[1].passageId, result.passages[0].id);
  assert.notEqual(result.passages[0].id, 'p');
  assert.equal(result.passages[0].source, 'Nguồn');
  assert.deepEqual(result.warnings, input.warnings);
  assert.throws(() => parseImportedDocument({ questions: [q] }, 'fixture'), /thiếu ngữ liệu/);
  const kept = parseImportedDocument({ questions: [q, { type: 'essay', content: 'Câu thứ hai' }] }, 'fixture', undefined, { keepUnlinked: true });
  assert.equal(kept.questions.length, 2); assert.equal(kept.questions[0].passageId, undefined, 'the broken link is dropped, the question is kept');
  assert.ok(kept.warnings.some(w => /Câu 1 thuộc một ngữ liệu mà AI không trả về/.test(w)), 'and the loss is reported');
  assert.throws(() => parseImportedDocument({ ...input, passages: [...input.passages, ...input.passages] }, 'fixture'), /trùng mã/);
});
