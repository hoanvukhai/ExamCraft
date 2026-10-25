import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { exportExamToDocx } from '../src/lib/docx-export';
import type { Exam } from '../src/types/exam';

/** Exports one formula inside a question and returns the equation part of the Word XML. */
async function equation(formula: string) {
  const exam = { id: 'x', createdAt: '2026', updatedAt: '2026', metadata: { title: 't', subject: 'toan', grade: 9, durationMinutes: 1, schoolName: '', departmentName: '', academicYear: '' },
    questions: [{ id: 'q', type: 'short_answer', difficulty: 'thong_hieu', content: `MARK ${formula} END`, points: 1, correct_answer: '1', accepted_answers: ['1'], step_by_step_solution: 's' }] } as unknown as Exam;
  const zip = await JSZip.loadAsync(await (await exportExamToDocx(exam, false, false)).arrayBuffer());
  const xml = await zip.file('word/document.xml')!.async('string');
  const start = xml.indexOf('<m:oMath>'), end = xml.indexOf('</m:oMath>', start);
  assert.ok(start >= 0 && end > start, 'the formula became a Word equation');
  const part = xml.slice(start, end);
  return { part, text: [...part.matchAll(/<m:t[^>]*>([^<]*)<\/m:t>/g)].map(match => match[1]).join('') };
}

test('fractions, roots and nested fractions are real equation objects', async () => {
  const fraction = await equation('$\\frac{a+b}{2}$');
  assert.ok(fraction.part.includes('<m:f>') && fraction.text === 'a+b2');
  const nested = await equation('$\\frac{1}{1+\\frac{1}{x}}$');
  assert.equal((nested.part.match(/<m:f>/g) ?? []).length, 2, 'both fractions are objects');
  const root = await equation('$\\sqrt{x^2+1}$');
  assert.ok(root.part.includes('<m:rad>') && root.part.includes('<m:sSup>'), 'a power inside a root keeps its structure');
  const cube = await equation('$\\sqrt[3]{8}$');
  assert.ok(cube.part.includes('<m:rad>') && cube.part.includes('<m:deg>') && cube.text.includes('3') && cube.text.includes('8'));
});

test('powers, indices and combined scripts become superscripts and subscripts', async () => {
  assert.ok((await equation('$x^2$')).part.includes('<m:sSup>'));
  assert.ok((await equation('$x_1$')).part.includes('<m:sSub>'));
  assert.ok((await equation('$x_1^2$')).part.includes('<m:sSubSup>'));
  const braces = await equation('$e^{x+1}$');
  assert.ok(braces.part.includes('<m:sSup>') && braces.text === 'ex+1');
  const sumOfSquares = await equation('$a^2 + b^2 = c^2$');
  assert.equal((sumOfSquares.part.match(/<m:sSup>/g) ?? []).length, 3, 'each power is its own superscript');
  assert.ok(sumOfSquares.text.includes('=') && !sumOfSquares.text.includes('^'), 'no caret is left in the text');
  const degree = await equation('$90^\\circ$');
  assert.ok(!degree.part.includes('<m:sSup>') && degree.text === '90°', 'a degree sign is not a raised circle');
});

test('sums, limits, integrals, functions and symbols leave no raw LaTeX', async () => {
  const sum = await equation('$\\sum_{i=1}^{n} i^2$');
  assert.ok(sum.part.includes('<m:sSubSup>') && sum.text.includes('∑') && !sum.text.includes('\\'));
  const limit = await equation('$\\lim_{x\\to 0} \\frac{\\sin x}{x}$');
  assert.ok(limit.part.includes('<m:limLow>') && limit.part.includes('<m:f>') && limit.text.includes('sin') && limit.text.includes('→') && !limit.text.includes('\\'));
  const integral = await equation('$\\int_0^1 x\\,dx$');
  assert.ok(integral.text.includes('∫') && !integral.text.includes('\\'));
  const mixed = await equation('$\\sin^2 x + \\cos^2 x = 1,\\ \\alpha \\leq \\pi,\\ a \\cdot b \\neq \\infty$');
  for (const symbol of ['sin', 'cos', 'α', '≤', 'π', '⋅', '≠', '∞']) assert.ok(mixed.text.includes(symbol), symbol);
  assert.ok(!/\\/.test(mixed.text), 'every macro was converted');
});

test('systems, sets and text keep a readable one-line form, and unknown macros stay visible', async () => {
  const system = await equation('$\\begin{cases} x+y=3 \\\\ x-y=1 \\end{cases}$');
  assert.ok(system.text.includes('x+y=3') && system.text.includes('x-y=1') && system.text.startsWith('{') && system.text.endsWith('}') && !system.text.includes('\\') && !system.text.includes('begin'));
  const sets = await equation('$A \\cup B \\subset \\mathbb{R},\\ x \\in \\mathbb{N}$');
  for (const symbol of ['∪', '⊂', 'ℝ', '∈', 'ℕ']) assert.ok(sets.text.includes(symbol), symbol);
  const text = await equation('$v = 5\\text{ m/s}$');
  assert.ok(text.text.includes('m/s') && !text.text.includes('\\text'));
  const unknown = await equation('$\\weirdmacro{x}$');
  assert.ok(unknown.text.includes('\\weirdmacro'), 'an unknown macro is shown as written, never silently dropped');
});

test('malformed input never breaks the export', async () => {
  for (const formula of ['$\\frac{1}$', '$x^$', '$\\sqrt$', '$\\begin{cases} x$', '$}{$', '$\\left( x$', '$a_{b$']) {
    const result = await equation(formula);
    assert.ok(result.part.length > 0, formula);
  }
});
