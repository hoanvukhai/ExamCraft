import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { exportExamToDocx } from '../src/lib/docx-export';
import { normalizeExamDocument } from '../src/lib/exam-document';
import { captureTemplateSnapshot, parseTemplateSnapshot } from '../src/lib/exam-template';
import { applyPageSetupToWordXml, parsePageSetup } from '../src/lib/page-setup';
import { PRINT_PRESETS } from '../src/lib/print-layout';
import type { Exam } from '../src/types/exam';

const base = (extra: Record<string, unknown> = {}): Exam =>
  ({
    id: 'x',
    createdAt: '2026',
    updatedAt: '2026',
    metadata: { title: 'Đề', subject: 'toan', grade: 9, durationMinutes: 45, schoolName: '', departmentName: '', ...extra },
    questions: [
      { id: 'q', type: 'short_answer', difficulty: 'thong_hieu', content: 'Một', points: 1, correct_answer: '1', accepted_answers: ['1'], step_by_step_solution: '' },
    ],
  }) as unknown as Exam;
const xml = async (exam: Exam, part = 'word/document.xml') =>
  (await JSZip.loadAsync(await (await exportExamToDocx(exam, false, false)).arrayBuffer())).file(part)!.async('string');

test('without a page setup Word keeps its sizes, font and margins exactly', async () => {
  const body = await xml(base());
  assert.ok(body.includes('w:val="22"') && body.includes('Times New Roman'));
  assert.ok(body.includes('w:top="1000"') && body.includes('w:left="1200"'));
});

test('a page setup changes font, size and margins in Word and nothing else', async () => {
  const exam = base({ pageSetup: { fontFamily: 'Arial', fontSize: 14, margins: 'wide' } });
  const body = await xml(exam);
  assert.ok(body.includes('Arial') && !body.includes('Times New Roman'));
  assert.ok(!body.includes('w:val="22"') || body.includes('w:val="28"'), 'text sizes scaled from 11 to 14');
  assert.ok(body.includes('w:top="1440"') && body.includes('w:left="1440"'));
  assert.ok(body.includes('Một'));
});

test('the size pass scales half-points and leaves other numbers alone', () => {
  const out = applyPageSetupToWordXml('<w:sz w:val="22"/><w:szCs w:val="22"/><w:b w:val="22"/>Times New Roman', {
    fontFamily: 'Cambria',
    fontSize: 12,
    margins: 'normal',
  });
  assert.equal(out, '<w:sz w:val="24"/><w:szCs w:val="24"/><w:b w:val="22"/>Cambria');
});

test('a bad page setup is dropped when the exam is opened', () => {
  assert.equal(parsePageSetup({ fontFamily: 'Comic Sans', fontSize: 11, margins: 'normal' }), undefined);
  const raw = base({ pageSetup: { fontFamily: 'Arial', fontSize: 99, margins: 'wide' } }) as unknown as Record<string, unknown>;
  const document = normalizeExamDocument({ ...raw, version: 1 }) as Exam;
  assert.equal(document.metadata.pageSetup, undefined);
});

test('a template keeps the print layout, page setup and option columns, and older templates are unchanged', () => {
  const plain = captureTemplateSnapshot(base());
  assert.ok(!('printLayout' in plain.headerFields) && !('pageSetup' in plain.headerFields) && !('choiceColumns' in plain.headerFields));
  const rich = base({
    printLayout: PRINT_PRESETS[0].make(),
    pageSetup: { fontFamily: 'Cambria', fontSize: 12, margins: 'narrow' },
    choiceColumns: 'auto',
  });
  const snapshot = parseTemplateSnapshot(captureTemplateSnapshot(rich));
  assert.equal(snapshot.headerFields.pageSetup?.fontFamily, 'Cambria');
  assert.equal(snapshot.headerFields.choiceColumns, 'auto');
  assert.equal(snapshot.headerFields.printLayout?.formatVersion, 2);
});
