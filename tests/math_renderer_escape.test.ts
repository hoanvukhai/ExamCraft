import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MathRenderer } from '../src/components/MathRenderer';

const render = (content: string, inline = false) => renderToStaticMarkup(React.createElement(MathRenderer, { content, inline }));

test('markup typed into a question is shown as text, never as live HTML', () => {
  for (const content of ['<script>alert(1)</script>', 'Tính <img src=x onerror=alert(1)> rồi $x^2$', '<b onclick="alert(1)">đậm</b>']) {
    const html = render(content);
    assert.ok(!/<(script|img|b)\b/i.test(html), html);
    assert.ok(html.includes('&lt;'), `the typed markup must still be visible as text: ${html}`);
  }
});

test('markup inside a formula or a table cell is also escaped', () => {
  const inFormula = render('$\\text{<script>alert(1)</script>}$');
  assert.ok(!/<script/i.test(inFormula), inFormula);
  const inTable = render('| A | B |\n|---|---|\n| <script>alert(1)</script> | 2 |');
  assert.ok(!/<script/i.test(inTable), inTable);
});
