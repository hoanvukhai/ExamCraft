import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { exportExamToDocx } from '../src/lib/docx-export';
import type { Exam } from '../src/types/exam';

const exam = (content: string, passage: string): Exam => ({ id: 'x', createdAt: '2026', updatedAt: '2026', metadata: { title: 't', subject: 'ngu_van', grade: 3, durationMinutes: 1, schoolName: '', departmentName: '' },
  passages: [{ id: 'p', title: 'Thơ', content: passage }],
  questions: [{ id: 'q', type: 'short_answer', difficulty: 'thong_hieu', content, passageId: 'p', points: 1, correct_answer: '1', accepted_answers: ['1'], step_by_step_solution: '' }] } as unknown as Exam);
const body = async (value: Exam) => (await JSZip.loadAsync(await (await exportExamToDocx(value, false, false)).arrayBuffer())).file('word/document.xml')!.async('string');
const breaks = (xml: string, from: string, to: string) => (xml.slice(xml.indexOf(from), xml.indexOf(to)).match(/<w:br\/>/g) ?? []).length;

test('lines of a shared passage and of a question stay on separate lines in Word', async () => {
  const xml = await body(exam('Dòng đầu\nDòng hai $x^2$ cuối\n\nSau dòng trống', 'Mùa thu của em\nLà vàng hoa cúc\n\nKhổ hai'));
  assert.equal(breaks(xml, 'Mùa thu của em', 'Khổ hai'), 3, 'three breaks between four poem lines, one of them blank');
  assert.ok(xml.includes('Khổ hai'));
  assert.equal(breaks(xml, 'Dòng đầu', 'Sau dòng trống'), 3, 'a question keeps its lines around a formula');
  assert.ok(!/<w:t[^>]*>[^<]*\n[^<]*<\/w:t>/.test(xml), 'no raw newline is left inside a text run');
});

test('text without line breaks adds none', async () => {
  const xml = await body(exam('Một dòng', 'Một ngữ liệu'));
  assert.equal(breaks(xml, 'Một ngữ liệu', 'Một dòng'), 0);
});

test('a pipe table in a question, a passage or a solution becomes a real Word table with its formulas', async () => {
  const table = '| $A$ | $B$ |\n|:---:|---:|\n| True | False |\n| False | True |';
  const value = exam(`Bảng chân trị:\n\n${table}\n\nHãy xác định.`, `Ngữ liệu có bảng\n${table}`);
  (value.questions[0] as { step_by_step_solution: string }).step_by_step_solution = `Lời giải\n${table}`;
  const xml = await (async () => (await JSZip.loadAsync(await (await exportExamToDocx(value, true, false)).arrayBuffer())).file('word/document.xml')!.async('string'))();
  const tables = xml.match(/<w:tbl>/g) ?? [];
  assert.ok(tables.length >= 3, 'the question, the passage and the solution each get a table (the header block adds its own)');
  assert.ok(!xml.includes('|:---:|') && !/<w:t[^>]*>[^<]*\| True/.test(xml), 'no raw table markup is left as text');
  assert.ok(xml.includes('<w:tblHeader'), 'the header row repeats on a new page');
  assert.ok(xml.includes('Hãy xác định.') && xml.includes('Bảng chân trị:'), 'text around the table is kept');
  assert.ok((xml.match(/<m:oMath>/g) ?? []).length >= 6, 'formulas in cells are Word equations');
});
