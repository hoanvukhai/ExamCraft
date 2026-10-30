import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { exportExamToDocx } from '../src/lib/docx-export';
import {
  choiceColumnCount,
  fillPrintText,
  PRINT_PRESETS,
  resolvePrintLayout,
  parsePrintLayout,
} from '../src/lib/print-layout';
import { normalizeExamDocument } from '../src/lib/exam-document';
import { validateOutline } from '../src/lib/exam-outline';
import type { Exam } from '../src/types/exam';

const base = (extra: Record<string, unknown> = {}): Exam =>
  ({
    id: 'x',
    createdAt: '2026',
    updatedAt: '2026',
    metadata: {
      title: 'Giữa kì',
      subject: 'toan',
      grade: 9,
      durationMinutes: 45,
      schoolName: '',
      departmentName: 'THCS Lê Lợi',
      examCode: '101',
      ...extra,
    },
    questions: [
      {
        id: 'q',
        type: 'short_answer',
        difficulty: 'thong_hieu',
        content: 'Một',
        points: 1,
        correct_answer: '1',
        accepted_answers: ['1'],
        step_by_step_solution: '',
      },
    ],
  }) as unknown as Exam;
const text = (xml: string) => [...xml.matchAll(/<w:t[^>]*>([^<]*)<[/]w:t>/g)].map((m) => m[1]).join('');
const parts = async (exam: Exam) => {
  const zip = await JSZip.loadAsync(await (await exportExamToDocx(exam, false, false)).arrayBuffer());
  return { zip, body: await zip.file('word/document.xml')!.async('string') };
};

test('a line made only of empty fields is dropped, a line with text stays', () => {
  const values = { 'Đơn vị': '', Trường: 'THCS Lê Lợi' };
  assert.equal(fillPrintText('{Đơn vị}', values), null);
  assert.deepEqual(fillPrintText('Trường: {Trường}', values), ['Trường: ', 'THCS Lê Lợi']);
  assert.deepEqual(fillPrintText('Trang {Trang}/{Tổng số trang}', values, true), [
    'Trang ',
    { page: 'current' },
    '/',
    { page: 'total' },
  ]);
  assert.deepEqual(fillPrintText('Hết {Không có}', values), ['Hết ', '{Không có}']);
});

test('an exam without a print layout keeps the original student line and closing line, with no footer', async () => {
  assert.equal(resolvePrintLayout(base()), null);
  const { zip, body } = await parts(base());
  assert.ok(
    body.includes('Họ và tên thí sinh:') &&
      body.includes('Số báo danh:') &&
      body.includes('-------------------------- HẾT'),
  );
  assert.equal(
    Object.keys(zip.files).some((name) => name.startsWith('word/footer')),
    false,
  );
});

test('every preset is valid; the school preset puts real page fields in a Word footer with the exam code', async () => {
  for (const preset of PRINT_PRESETS) parsePrintLayout(preset.make());
  const exam = base({ printLayout: PRINT_PRESETS[0].make() });
  const { zip, body } = await parts(exam);
  assert.ok(!body.includes('Họ và tên thí sinh:') && body.includes('Họ và tên:'));
  const footer = await zip.file('word/footer1.xml')!.async('string');
  assert.ok(/PAGE/.test(footer) && /NUMPAGES/.test(footer), 'Word counts the pages itself');
  assert.ok(text(footer).includes('Mã đề 101'));
});

test('a variant prints its own exam code in the footer', async () => {
  const layout = PRINT_PRESETS[0].make();
  const a = await parts(base({ printLayout: layout, examCode: '102' }));
  assert.ok(text(await a.zip.file('word/footer1.xml')!.async('string')).includes('Mã đề 102'));
});

test('hidden blocks and empty fields are not printed, and the score box adds a table', async () => {
  const layout = PRINT_PRESETS[2].make();
  layout.end.push({ id: 'x', text: 'Ẩn', hidden: true }, { id: 'y', text: '{Năm học}' });
  const exam = base({ printLayout: layout });
  const resolved = resolvePrintLayout(exam)!;
  assert.equal(resolved.end.length, 1);
  assert.equal(resolved.studentLine.kind, 'scoreBox');
  const { body } = await parts(exam);
  assert.ok(body.includes('Lời nhận xét của giáo viên'));
});

test('the document check rejects a bad layout and drops an unknown exam kind', () => {
  const raw = { ...base(), version: 1 } as unknown as Record<string, unknown>;
  const bad = { ...(raw.metadata as object), printLayout: { formatVersion: 2 } };
  assert.throws(() => normalizeExamDocument({ ...raw, metadata: bad }));
  const kind = normalizeExamDocument({
    ...raw,
    metadata: { ...(raw.metadata as object), examKind: 'lạ' },
  }) as Exam;
  assert.equal(kind.metadata.examKind, undefined);
});

test('a part set to start on a new page breaks the page in Word, and only parts and groups may carry the flag', async () => {
  const exam = base();
  exam.outline = [
    {
      id: 'p1',
      kind: 'part',
      title: 'PHẦN MỘT',
      children: [{ id: 'n1', kind: 'question', questionId: 'q' }],
    },
    { id: 'p2', kind: 'part', title: 'PHẦN HAI', startOnNewPage: true, children: [] },
  ];
  const { body } = await parts(exam);
  const first = body.indexOf('PHẦN MỘT'),
    second = body.indexOf('PHẦN HAI');
  assert.ok(first > 0 && second > first);
  assert.ok(
    /<w:pageBreakBefore\/>/.test(body.slice(body.lastIndexOf('<w:p>', second), second)),
    'the second part starts a page',
  );
  assert.ok(!/<w:pageBreakBefore\/>/.test(body.slice(body.lastIndexOf('<w:p>', first), first)));
  const bad = structuredClone(exam);
  bad.outline![0].children![0].startOnNewPage = true;
  assert.throws(() => validateOutline(bad.outline!, bad.questions));
});

test('option columns: auto follows the length of the options, and Word lays them out in a table only when asked', async () => {
  const short = ['1', '2', '3', '4'].map((text) => ({ text }));
  assert.equal(choiceColumnCount(short, 'auto'), 4);
  assert.equal(
    choiceColumnCount(
      ['Một câu vừa phải dài', 'b', 'c', 'd'].map((text) => ({ text })),
      'auto',
    ),
    2,
  );
  assert.equal(choiceColumnCount([{ text: 'x'.repeat(60) }, { text: 'b' }], 'auto'), 1);
  assert.equal(choiceColumnCount([{ text: 'a', figures: [{}] }], 'auto'), 1);
  assert.equal(choiceColumnCount(short, 2), 2);
  const withChoices = (extra: Record<string, unknown>) => {
    const exam = base(extra);
    exam.questions = [
      {
        ...exam.questions[0],
        type: 'multiple_choice',
        choices: ['A', 'B', 'C', 'D'].map((key, i) => ({ key, text: String(i + 1) })),
        correct_answer: 'A',
      },
    ] as Exam['questions'];
    return exam;
  };
  const legacy = (await parts(withChoices({}))).body;
  const columns = (await parts(withChoices({ choiceColumns: 4 }))).body;
  const rows = (xml: string) => (xml.match(/<w:tr>/g) ?? []).length;
  assert.equal(rows(columns), rows(legacy) + 1, 'four options fit one extra table row');
});
