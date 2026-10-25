import test from 'node:test';
import assert from 'node:assert/strict';
import { splitContentBlocks, splitTableRow, hasTable } from '../src/lib/markdown-table';

const sample = 'Bảng chân trị:\n\n| $A$ | $B$ | NOT $A$ |\n|:---:|:---:|---:|\n| True | True | False |\n| False | True | True |\n\nHãy xác định.';

test('a pipe table inside question text becomes a table block between two text blocks', () => {
  const blocks = splitContentBlocks(sample);
  assert.deepEqual(blocks.map(block => block.kind), ['text', 'table', 'text']);
  const table = blocks[1] as Extract<typeof blocks[number], { kind: 'table' }>;
  assert.deepEqual(table.header, ['$A$', '$B$', 'NOT $A$']); assert.deepEqual(table.align, ['center', 'center', 'right']);
  assert.deepEqual(table.rows, [['True', 'True', 'False'], ['False', 'True', 'True']]);
  assert.equal((blocks[0] as { text: string }).text, 'Bảng chân trị:'); assert.equal((blocks[2] as { text: string }).text, 'Hãy xác định.');
});

test('text without a table, or with pipes that are not a table, is returned untouched', () => {
  for (const text of ['Không có bảng', 'a | b | c', '| chỉ một dòng |', '|a|b|\n|c|d|', 'Giá trị $|x| = 3$ và $|y|$']) {
    assert.deepEqual(splitContentBlocks(text), [{ kind: 'text', text }], text);
    assert.equal(hasTable(text), false);
  }
});

test('pipes inside a formula or escaped with a backslash stay in their cell, and short rows are padded', () => {
  assert.deepEqual(splitTableRow('| $|x|$ | a \\| b | c |'), ['$|x|$', 'a | b', 'c']);
  const table = splitContentBlocks('| x | y |\n|---|---|\n| 1 |')[0] as { rows: string[][] };
  assert.deepEqual(table.rows, [['1', '']]);
});

test('a table at the very start or end of the text leaves no empty text block', () => {
  assert.deepEqual(splitContentBlocks('| a | b |\n|---|---|\n| 1 | 2 |').map(block => block.kind), ['table']);
  assert.deepEqual(splitContentBlocks('Trước\n| a |\n|---|\n| 1 |').map(block => block.kind), ['text', 'table']);
});

test('a header whose separator has a different number of columns is plain text', () => {
  const text = '| a | b |\n|---|\n| 1 | 2 |';
  assert.deepEqual(splitContentBlocks(text), [{ kind: 'text', text }]);
});
