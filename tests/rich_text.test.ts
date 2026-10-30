import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { splitFormat, stripFormat, toggleFormat } from '../src/lib/rich-text';
import { exportExamToDocx } from '../src/lib/docx-export';
import type { Exam } from '../src/types/exam';

test('only matched, nested tags format; stray tags and comparisons stay literal', () => {
  assert.deepEqual(splitFormat('a <b>đậm</b> b'), [
    { text: 'a ', flags: {} },
    { text: 'đậm', flags: { b: true } },
    { text: ' b', flags: {} },
  ]);
  assert.deepEqual(splitFormat('x < 5 và <b>chưa đóng'), [{ text: 'x < 5 và <b>chưa đóng', flags: {} }]);
  assert.deepEqual(splitFormat('<b><i>cả hai</i></b>'), [{ text: 'cả hai', flags: { b: true, i: true } }]);
  assert.deepEqual(splitFormat('<b>a</i>b</b>'), [{ text: 'a</i>b', flags: { b: true } }]);
  assert.equal(stripFormat('H<sub>2</sub>O và <u>gạch</u>'), 'H2O và gạch');
  assert.equal(stripFormat('<script>x</script>'), '<script>x</script>');
});

test('toggling wraps the selection and removes the tag again', () => {
  const wrapped = toggleFormat('Chọn chữ KHÔNG đúng', 9, 14, 'b');
  assert.equal(wrapped.value, 'Chọn chữ <b>KHÔNG</b> đúng');
  assert.equal(wrapped.value.slice(wrapped.start, wrapped.end), 'KHÔNG');
  assert.equal(toggleFormat(wrapped.value, wrapped.start, wrapped.end, 'b').value, 'Chọn chữ KHÔNG đúng');
  assert.equal(toggleFormat('abc', 1, 1, 'i').value, 'abc');
});

test('Word keeps bold, underline and sub/superscript from the tags and never prints them', async () => {
  const exam = {
    id: 'x',
    createdAt: '2026',
    updatedAt: '2026',
    metadata: {
      title: 't',
      subject: 'toan',
      grade: 9,
      durationMinutes: 45,
      schoolName: '',
      departmentName: '',
    },
    questions: [
      {
        id: 'q',
        type: 'short_answer',
        difficulty: 'thong_hieu',
        content: 'Câu <b>KHÔNG</b> có <u>gạch</u> H<sub>2</sub>O x<sup>2</sup>',
        points: 1,
        correct_answer: '1',
        accepted_answers: ['1'],
        step_by_step_solution: '',
      },
    ],
  } as unknown as Exam;
  const xml = await (
    await JSZip.loadAsync(await (await exportExamToDocx(exam, false, false)).arrayBuffer())
  )
    .file('word/document.xml')!
    .async('string');
  assert.ok(!/&lt;\/?(b|u|sub|sup)&gt;/.test(xml));
  assert.ok(
    /<w:u [^>]*\/>/.test(xml) &&
      /<w:vertAlign w:val="subscript"\/>/.test(xml) &&
      /<w:vertAlign w:val="superscript"\/>/.test(xml),
  );
});
