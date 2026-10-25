import test from 'node:test';
import assert from 'node:assert/strict';
import mammoth from 'mammoth';
import { exportExamToDocx } from '../src/lib/docx-export';
import { docxWithEquationsAsText, ommlToLatex, replaceEquationsWithLatex } from '../src/lib/docx-math';
import { normalizeExamDocument } from '../src/lib/exam-document';

const formulas = ['\\frac{a+b}{2}', '\\sqrt{x^2+1}', 'x_1+x_2=-\\frac{b}{a}', '\\sqrt[3]{8}=2', '2^{10}', '\\sum_{i=1}^{n} i', '\\lim_{x\\to 0}\\frac{\\sin x}{x}', '(a+b)^2', '\\alpha+\\beta=\\pi'];

test('equations written by our own Word export are read back as LaTeX instead of disappearing', async () => {
  const exam = normalizeExamDocument({ id: 'x', metadata: { title: 't', subject: 'toan', grade: 9, durationMinutes: 1, schoolName: '', departmentName: '' }, createdAt: '2026', updatedAt: '2026',
    questions: formulas.map((formula, i) => ({ id: 'q' + i, type: 'short_answer', difficulty: 'thong_hieu', content: `F${i}: $${formula}$ KẾT`, correct_answer: '1', accepted_answers: ['1'], points: 1, step_by_step_solution: '' })) });
  const exported = Buffer.from(await (await exportExamToDocx(exam, false, false)).arrayBuffer());
  const plain = (await mammoth.extractRawText({ buffer: exported })).value;
  assert.ok(!plain.includes('frac') && /F0: +KẾT/.test(plain), 'plain extraction alone loses the formulas');
  const { buffer, equations } = await docxWithEquationsAsText(exported);
  assert.equal(equations, formulas.length);
  const text = (await mammoth.extractRawText({ buffer })).value;
  for (const expected of ['$\\frac{a+b}{2}$', '$\\sqrt{x^{2}+1}$', '$x_{1}+x_{2}=-\\frac{b}{a}$', '$\\sqrt[3]{8}=2$', '$2^{10}$', '$\\sum_{i=1}^{n} i$', '$\\lim_{x\\to 0}\\frac{\\sin x}{x}$', '$(a+b)^{2}$', '$\\alpha +\\beta =\\pi$']) assert.ok(text.includes(expected), `${expected} must come back`);
});

test('Word-native equation shapes become LaTeX: brackets, integrals, functions, cases and display equations', () => {
  const run = (value: string) => `<m:r><m:t>${value}</m:t></m:r>`;
  assert.equal(ommlToLatex(`<m:d><m:dPr><m:begChr m:val="["/><m:endChr m:val="]"/></m:dPr><m:e>${run('a')}</m:e></m:d>`), '\\left[ a \\right]');
  assert.equal(ommlToLatex(`<m:nary><m:naryPr><m:chr m:val="∫"/></m:naryPr><m:sub>${run('0')}</m:sub><m:sup>${run('1')}</m:sup><m:e>${run('x')}</m:e></m:nary>`), '\\int_{0}^{1} x');
  assert.equal(ommlToLatex(`<m:func><m:fName>${run('sin')}</m:fName><m:e>${run('x')}</m:e></m:func>`), '\\sin x');
  assert.equal(ommlToLatex(`<m:eqArr><m:e>${run('x=1')}</m:e><m:e>${run('y=2')}</m:e></m:eqArr>`), '\\begin{cases} x=1 \\\\ y=2 \\end{cases}');
  const { xml, count } = replaceEquationsWithLatex(`<w:p><w:r><w:t>Tính </w:t></w:r><m:oMath>${run('a&lt;b')}</m:oMath><m:oMathPara><m:oMath>${run('x')}</m:oMath></m:oMathPara></w:p>`);
  assert.equal(count, 2); assert.ok(xml.includes('$a&lt;b$') && xml.includes('$$x$$') && !xml.includes('<m:'), 'inline and display equations become text runs and special characters stay escaped');
});

test('a Word file without equations is returned untouched', async () => {
  const exam = normalizeExamDocument({ id: 'x', metadata: { title: 't', subject: 'toan', grade: 6, durationMinutes: 1, schoolName: '', departmentName: '' }, createdAt: '2026', updatedAt: '2026', questions: [{ id: 'q', type: 'short_answer', difficulty: 'thong_hieu', content: 'Chỉ có chữ', correct_answer: '1', accepted_answers: ['1'], points: 1, step_by_step_solution: '' }] });
  const exported = Buffer.from(await (await exportExamToDocx(exam, false, false)).arrayBuffer());
  const result = await docxWithEquationsAsText(exported);
  assert.equal(result.equations, 0); assert.equal(result.buffer, exported);
});
