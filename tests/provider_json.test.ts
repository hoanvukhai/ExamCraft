import test from 'node:test';
import assert from 'node:assert/strict';
import { readProviderJson, parseProviderJson } from '../src/lib/gemini-keys';

test('valid provider JSON is returned exactly as written, including doubled backslashes', () => {
  const text = '{"content":"Tính $\\\\frac{1}{2}$ và $\\\\omega$","n":1}';
  assert.deepEqual(readProviderJson(text), { content: 'Tính $\\frac{1}{2}$ và $\\omega$', n: 1 });
});

test('a single backslash before a letter that is not a JSON escape is repaired instead of failing', () => {
  const text = '{"content":"Tần số góc $\\omega = 2\\pi f$ và $\\Delta t$","solution":"$\\alpha + \\sqrt{2}$"}';
  assert.deepEqual(readProviderJson(text), { content: 'Tần số góc $\\omega = 2\\pi f$ và $\\Delta t$', solution: '$\\alpha + \\sqrt{2}$' });
});

test('repair never touches an escape that was already valid, and broken JSON beyond backslashes still fails as bad output', () => {
  assert.deepEqual(readProviderJson('{"a":"x\\ny","b":"q\\"r","c":"\\u00e9"}'), { a: 'x\ny', b: 'q"r', c: 'é' });
  assert.throws(() => readProviderJson('{"a": '), SyntaxError);
  assert.throws(() => parseProviderJson('không phải JSON \\omega'), /không đọc được/);
});
