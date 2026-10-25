import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { MathRenderer } from '../src/components/MathRenderer';

test('a pipe table in question text is shown as a real table with formulas, and plain text is unchanged', () => {
  const html = renderToStaticMarkup(<MathRenderer content={'Bảng chân trị:\n\n| $A$ | $B$ |\n|:---:|---:|\n| True | False |\n\nHãy xác định.'} />);
  assert.match(html, /<table/); assert.equal((html.match(/<th[ >]/g) ?? []).length, 2); assert.equal((html.match(/<td[ >]/g) ?? []).length, 2);
  assert.match(html, /text-align:center/); assert.match(html, /text-align:right/);
  assert.ok(html.includes('katex'), 'formulas in header cells are rendered');
  assert.ok(html.includes('Bảng chân trị:') && html.includes('Hãy xác định.'));
  assert.ok(!html.includes('|:---:|') && !html.includes('| True'), 'no raw markup is left');
  const plain = renderToStaticMarkup(<MathRenderer content={'Không có bảng, $x|y$ và a | b'} />);
  assert.ok(!plain.includes('<table'));
});
