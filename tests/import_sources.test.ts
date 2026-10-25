import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRawVietnameseText, parseExTestLatex } from '../src/lib/exam-parser';
import { parseImportedDocument } from '../src/lib/import-document';
import { normalizeQuestion, questionToDatabase } from '../src/lib/exam-document';
import { saveBankQuestion } from '../src/lib/question-client';

const text = 'Câu 1: Tính 11 + 2.\nĐáp án: 13\nCâu 2: Tính 12 + 2.\nĐáp án: 14';

test('plain-text near variants retain both contents, answers and separate IDs', () => {
  const questions = parseRawVietnameseText(text);
  assert.equal(questions.length, 2);
  assert.equal(new Set(questions.map(q => q.id)).size, 2);
  assert.deepEqual(questions.map(q => q.content), ['Tính 11 + 2.', 'Tính 12 + 2.']);
  assert.deepEqual(questions.map(q => q.correct_answer), ['13', '14']);
});

test('EX_Test near variants are not deduplicated by a changed number', () => {
  const questions = parseExTestLatex(String.raw`\begin{ex}Tính $11+2$.\shortans{13}\end{ex}
\begin{ex}Tính $12+2$.\shortans{14}\end{ex}`);
  assert.equal(questions.length, 2);
  assert.notEqual(questions[0].id, questions[1].id);
  assert.notEqual(questions[0].content, questions[1].content);
});

test('explicit numeric answer lines are kept out of student content, including zero and fractions', () => {
  for (const answer of ['0', '-2.5', '1,5', '3/4']) {
    const [question] = parseRawVietnameseText('Câu 1: Viết kết quả.\nĐáp án: ' + answer);
    assert.equal(question.content, 'Viết kết quả.');
    assert.equal(question.correct_answer, answer);
  }
});

test('Word and text import adapters label their source and retain near variants without promoting verification', () => {
  for (const source of ['Word (.docx)', 'Văn bản nhập']) {
    const imported = parseImportedDocument({ questions: parseRawVietnameseText(text) }, source);
    assert.equal(imported.questions.length, 2);
    for (const question of imported.questions) {
      assert.equal(question.source, source);
      assert.equal(question.status, 'draft');
      assert.equal(question.verifiedBy, 'none');
    }
  }
});

test('explicit provenance survives normalization and private persistence even with untrusted sharing fields', () => {
  const question = normalizeQuestion({ ...parseRawVietnameseText(text)[0], source: 'Tệp đề thử, trang 3, câu 7', licenseNote: 'Chưa xác minh quyền chia sẻ', visibility: 'SHARED', shareable: true });
  const row = questionToDatabase(question, { ownerId: 'fixture-owner', examId: 'fixture-exam', questionId: 'fixture-question', subject: 'toan', grade: 6 });
  assert.equal(row.source, question.source);
  assert.equal(row.licenseNote, question.licenseNote);
  assert.equal(row.visibility, 'PRIVATE');
  assert.equal(row.ownerId, 'fixture-owner');
});

test('bank client sends provenance but does not copy document sharing instructions into the bank request', async () => {
  const previous = globalThis.fetch;
  const question = normalizeQuestion({ ...parseRawVietnameseText(text)[0], subject: 'toan', grade: 6, source: 'Nguồn riêng của fixture', visibility: 'SHARED', shareable: true });
  let calls = 0;
  globalThis.fetch = async (input, init) => {
    calls++;
    assert.equal(String(input), '/api/questions');
    assert.equal(new Headers(init?.headers).get('x-examcraft-user'), 'fixture-owner');
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    assert.equal(body.source, question.source);
    assert.equal(Object.hasOwn(body, 'visibility'), false);
    assert.equal(Object.hasOwn(body, 'shareable'), false);
    return Response.json({ success: true, question: { ...question, id: 'bank-fixture' } });
  };
  try { await saveBankQuestion(question, 'fixture-owner'); assert.equal(calls, 1); }
  finally { globalThis.fetch = previous; }
});
