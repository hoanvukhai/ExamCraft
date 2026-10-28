import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { exportExamToDocx } from '../src/lib/docx-export';
import type { Exam, QuestionType } from '../src/types/exam';

const png =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
const types: QuestionType[] = [
  'multiple_choice',
  'true_false_group',
  'short_answer',
  'essay',
  'fill_blank',
  'matching',
  'ordering',
];
const formulas = [
  '$\\frac{a+b}{2}$',
  '$\\sqrt{x^2+1}$',
  '$\\sum_{i=1}^{n} i^2$',
  '$x_1 + x_2 = -\\frac{b}{a}$',
  '$\\begin{cases} x+y=3 \\\\ x-y=1 \\end{cases}$',
];
const COUNT = 120,
  PASSAGES = 8;

function longExam(): Exam {
  return {
    id: 'long-exam',
    createdAt: '2026-10-25',
    updatedAt: '2026-10-25',
    metadata: {
      title: 'Đề dài 120 câu',
      subject: 'toan',
      grade: 9,
      durationMinutes: 90,
      schoolName: '',
      departmentName: '',
      academicYear: '',
    },
    passages: Array.from({ length: PASSAGES }, (_, i) => ({
      id: 'p' + i,
      title: `TITLE_P${i}`,
      content: `PASSAGE_BODY_${i} ` + 'Lời văn tiếng Việt có dấu tổ hợp. '.repeat(30),
    })),
    questions: Array.from({ length: COUNT }, (_, i) => {
      const type = types[i % types.length];
      return {
        id: 'q' + i,
        type,
        difficulty: 'thong_hieu',
        content: `SENT_${String(i).padStart(3, '0')} ${formulas[i % formulas.length]} và chữ Việt: Hà Nội, Đà Nẵng, Thừa Thiên Huế`,
        points: 1,
        step_by_step_solution: `SOLUTION_${String(i).padStart(3, '0')} ${formulas[(i + 1) % formulas.length]}`,
        correct_answer: type === 'multiple_choice' ? 'A' : type === 'short_answer' ? '1' : undefined,
        accepted_answers: type === 'short_answer' || type === 'fill_blank' ? ['1'] : undefined,
        choices:
          type === 'multiple_choice'
            ? [
                { key: 'A', text: 'OPT_A ' + formulas[i % formulas.length] },
                { key: 'B', text: 'OPT_B' },
                { key: 'C', text: 'OPT_C' },
                { key: 'D', text: 'OPT_D' },
              ]
            : undefined,
        sub_questions:
          type === 'true_false_group'
            ? ['a', 'b', 'c', 'd'].map((key) => ({ key, content: `SUB_${i}_${key}`, isCorrect: key === 'a' }))
            : undefined,
        matchingPairs:
          type === 'matching'
            ? [
                { id: 'm1', left: `LEFT_${i}`, right: `RIGHT_${i}` },
                { id: 'm2', left: `LEFT2_${i}`, right: `RIGHT2_${i}` },
              ]
            : undefined,
        correctOrder: type === 'ordering' ? [`ORDER_${i}_1`, `ORDER_${i}_2`, `ORDER_${i}_3`] : undefined,
        rubric: type === 'essay' ? [{ criterion: 'Lập luận', maxPoints: 1 }] : undefined,
        passageId: i % 5 === 0 ? 'p' + ((i / 5) % PASSAGES) : undefined,
        figures:
          i % 10 === 0
            ? [
                {
                  id: 'fig' + i,
                  kind: 'image' as const,
                  data: { url: png },
                  renderedBase64: png,
                  caption: `CAPTION_${i}`,
                },
              ]
            : undefined,
      };
    }),
  } as unknown as Exam;
}

async function open(blob: Blob) {
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  return { zip, document: await zip.file('word/document.xml')!.async('string') };
}
const visibleText = (xml: string) =>
  [...xml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((match) => match[1]).join(' ');
const mathText = (xml: string) =>
  [...xml.matchAll(/<m:t[^>]*>([^<]*)<\/m:t>/g)].map((match) => match[1]).join(' ');

test('a 120-question exam exports to Word in order, with passages once per separated group, images present and formulas converted', async () => {
  const started = Date.now();
  const exam = longExam();
  const blob = await exportExamToDocx(exam, false, false);
  const { zip, document } = await open(blob);
  assert.ok(Date.now() - started < 30000, 'export finishes in a reasonable time');
  assert.ok(blob.size < 8_000_000, 'the file is not absurdly large');
  assert.ok(document.startsWith('<?xml'));
  let previous = -1;
  for (let i = 0; i < COUNT; i++) {
    const marker = `SENT_${String(i).padStart(3, '0')}`;
    assert.equal(document.split(marker).length - 1, 1, `${marker} appears exactly once`);
    const at = document.indexOf(marker);
    assert.ok(at > previous, `${marker} is in editor order`);
    previous = at;
  }
  for (let i = 0; i < PASSAGES; i++)
    assert.equal(
      document.split(`PASSAGE_BODY_${i}`).length - 1,
      exam.questions.filter((q) => q.passageId === 'p' + i).length,
      `passage ${i} printed once per separated legacy group`,
    );
  assert.ok(!document.includes('SOLUTION_'), 'the question-only export carries no solution');
  const images = Object.keys(zip.files).filter((name) => name.startsWith('word/media/'));
  assert.ok(images.length >= 1, 'figures are embedded');
  assert.equal(document.split('<w:drawing').length - 1, COUNT / 10, 'one drawing for each of the figures');
  const text = visibleText(document);
  assert.ok(
    !/\\frac|\\sqrt|\\sum|\\begin|\$\\|\$[a-z]/.test(text),
    'no raw LaTeX remains in the visible text',
  );
  assert.ok(document.includes('<m:oMath'), 'formulas are real Word equations');
  assert.ok(document.split('<m:oMath>').length - 1 >= COUNT, 'every question carries at least one equation');
  assert.ok(
    !/\\(frac|sqrt|sum|begin|cases)/.test(mathText(document)),
    'equation text carries no raw LaTeX commands',
  );
  assert.ok(!/undefined|\[object Object\]|NaN/.test(text), 'no leaked placeholder text');
  assert.ok(text.includes('Thừa Thiên Huế') && text.includes('Đà Nẵng'), 'Vietnamese text survives');
});

test('solution and parallel exports keep every answer next to its own question', async () => {
  const exam = longExam();
  const solutions = (await open(await exportExamToDocx(exam, true, false))).document;
  for (let i = 0; i < COUNT; i++)
    assert.equal(
      solutions.split(`SOLUTION_${String(i).padStart(3, '0')}`).length - 1,
      1,
      `solution ${i} once`,
    );
  const parallel = (await open(await exportExamToDocx(exam, true, false, 'parallel'))).document;
  assert.ok(parallel.includes('<w:tblHeader'), 'the table header repeats on every page');
  for (let i = 0; i < COUNT; i++) {
    const start = parallel.indexOf(`SENT_${String(i).padStart(3, '0')}`);
    const next = i + 1 < COUNT ? parallel.indexOf(`SENT_${String(i + 1).padStart(3, '0')}`) : parallel.length;
    const answer = parallel.indexOf(`SOLUTION_${String(i).padStart(3, '0')}`, start);
    assert.ok(start >= 0 && answer > start && answer < next, `question ${i} and its answer share a row`);
  }
  for (let i = 0; i < PASSAGES; i++)
    assert.equal(
      parallel.split(`PASSAGE_BODY_${i}`).length - 1,
      exam.questions.filter((q) => q.passageId === 'p' + i).length,
      `parallel passage ${i} once per separated legacy group`,
    );
});
