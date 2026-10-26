import test from 'node:test';
import assert from 'node:assert/strict';
import { countHint, importInBatches, planImportBatches, type ParsedImport } from '../src/lib/import-batching';
import type { Question } from '../src/types/exam';
import { DocumentValidationError } from '../src/lib/exam-document';

const source = (count: number, preamble = '') => preamble + Array.from({ length: count }, (_, i) => `Câu ${i + 1}: Nội dung số ${i + 1}\nA. a\nB. b\n`).join('');
const question = (content: string, passageId?: string) => ({ id: content, type: 'multiple_choice', difficulty: 'thong_hieu', content, passageId, step_by_step_solution: '' }) as unknown as Question;
/** A stand-in for the model: returns one question per "Câu N" it was given, optionally dropping the tail. */
const fakeModel = (keep: (given: number) => number = n => n) => async (text: string): Promise<ParsedImport> => {
  const given = [...text.matchAll(/Câu (\d+):/g)].map(match => match[1]);
  return { questions: given.slice(0, keep(given.length)).map(n => question(`Câu ${n}`)), passages: [], warnings: [] };
};

test('a short document is read in one piece and a long one is cut at question numbers in order', () => {
  assert.equal(planImportBatches(source(10)).batches.length, 1);
  const plan = planImportBatches(source(60));
  assert.ok(plan.batches.length >= 3 && plan.expected === 60);
  assert.deepEqual(plan.batches.map(b => b.expected).reduce((a, b) => a + b, 0), 60);
  assert.equal(plan.batches[0].first, 1); assert.equal(plan.batches.at(-1)!.last, 60);
  for (const [i, batch] of plan.batches.entries()) if (i) assert.equal(batch.first, plan.batches[i - 1].last + 1, 'no question is skipped or read twice');
});

test('the preamble (a shared passage) travels with every batch', () => {
  const plan = planImportBatches(source(60, 'Đọc đoạn văn sau: ĐOẠN_CHUNG\n\n'));
  assert.ok(plan.batches.every(batch => batch.text.includes('ĐOẠN_CHUNG')));
});

test('every question comes back in order across batches and a complete read raises no shortage warning', async () => {
  const result = await importInBatches(source(60), fakeModel());
  assert.deepEqual(result.questions.map(q => q.content), Array.from({ length: 60 }, (_, i) => `Câu ${i + 1}`));
  assert.ok(result.warnings.some(w => /đọc thành \d+ phần/.test(w)));
  assert.ok(!result.warnings.some(w => /Chỉ nhận được/.test(w)));
});

test('a model that stops early is reported with the missing part, and nothing is invented', async () => {
  const result = await importInBatches(source(60), fakeModel(given => Math.max(1, given - 5)));
  assert.equal(result.questions.length < 60, true);
  assert.match(result.warnings[0], /Chỉ nhận được \d+\/60 câu/); assert.match(result.warnings[0], /phần \d+ \(câu \d+–\d+\) chỉ nhận/);
});

test('a batch that comes back short is asked again, up to twice, and the better answer is kept', async () => {
  let calls = 0;
  const result = await importInBatches(source(30), async text => { calls++; return fakeModel(given => calls === 1 ? 2 : given)(text); });
  assert.equal(result.questions.length, 30); assert.ok(calls >= 3, 'the short first batch was retried');
});

test('a shared passage that appears in two batches is kept once and questions point to it', async () => {
  let call = 0;
  const result = await importInBatches(source(60, 'Đoạn: X\n\n'), async text => {
    const base = await fakeModel()(text); const id = 'p' + call++;
    return { ...base, passages: [{ id, content: 'Đoạn: X' }], questions: base.questions.map(q => ({ ...q, passageId: id })) };
  });
  assert.equal(result.passages.length, 1);
  assert.ok(result.questions.every(q => q.passageId === result.passages[0].id));
});

test('identical question texts are flagged but never deleted', async () => {
  const result = await importInBatches('Câu 1: Giống\nCâu 2: Giống\n', async () => ({ questions: [question('Giống'), question('Giống')], passages: [], warnings: [] }));
  assert.equal(result.questions.length, 2); assert.ok(result.warnings.some(w => /trùng nguyên văn/.test(w)));
});

test('one part returned in an unusable shape is reported while the other parts are kept; if every part fails the error is raised', async () => {
  let call = 0;
  const partial = await importInBatches(source(60), async text => { call++; if (call <= 3) throw new DocumentValidationError('Câu 1: thiếu ngữ liệu liên kết'); return fakeModel()(text); });
  assert.ok(partial.questions.length > 0 && partial.questions.length < 60);
  assert.ok(partial.warnings.some(w => /AI trả về chưa dùng được/.test(w)) && partial.warnings.some(w => /Chỉ nhận được/.test(w)));
  await assert.rejects(() => importInBatches(source(60), async () => { throw new DocumentValidationError('hỏng'); }), /hỏng/);
  await assert.rejects(() => importInBatches(source(5), async () => { throw new DocumentValidationError('một phần duy nhất'); }), /một phần duy nhất/);
});

test('each part is sent with the number of questions the source says it holds, so the model is told not to stop early', async () => {
  const seenHints: string[] = [];
  await importInBatches(source(40), async (text, info) => { seenHints.push(`${info.expected}:${info.first}-${info.last}`); return fakeModel()(text); });
  assert.deepEqual(seenHints, ['15:1-15', '15:16-30', '10:31-40']);
  const hint = countHint({ expected: 15, first: 16, last: 30 }); assert.ok(hint.includes('đúng 15 câu') && hint.includes('từ Câu 16 đến Câu 30') && hint.includes('đủ 15 phần tử'));
  assert.equal(countHint({ expected: 0, first: 0, last: 0 }), '', 'no hint when the numbering cannot be read');
});
