import test from 'node:test';
import assert from 'node:assert/strict';
import { paginate } from '../src/lib/pagination';

const geometry = { page: 1000, padTop: 100, padBottom: 100 }; // 800 usable
const stack = (heights: number[], gap = 20, start = 100) => {
  let top = start;
  return heights.map((height) => {
    const unit = { top, height };
    top += height + gap;
    return unit;
  });
};

test('blocks that fit stay put; a block that would cross the page line moves whole to the next page', () => {
  const units = stack([300, 300, 300]); // third would end at 1060 > 900
  const result = paginate(units, geometry);
  assert.deepEqual(result.push, [0, 0, 1100 - 740]);
  assert.deepEqual(result.pageOf, [0, 0, 1]);
  assert.equal(result.pages, 2);
});

test('pushing one block shifts everything after it, and later blocks keep filling the new page', () => {
  const units = stack([500, 500, 200, 200]);
  const result = paginate(units, geometry);
  assert.deepEqual(result.pageOf, [0, 1, 1, 2]);
  assert.equal(result.push[1], 1100 - 620);
  assert.equal(result.push[2], 0);
});

test('a block taller than a whole page is not pushed; a forced break always opens a page', () => {
  const tall = paginate(stack([300, 900]), geometry);
  assert.deepEqual(tall.push, [0, 0]);
  const forced = paginate(
    [
      { top: 100, height: 100 },
      { top: 220, height: 100, force: true },
      { top: 340, height: 100 },
    ],
    geometry,
  );
  assert.deepEqual(forced.pageOf, [0, 1, 1]);
  const already = paginate(
    [
      { top: 100, height: 100 },
      { top: 1100, height: 100, force: true },
    ],
    geometry,
  );
  assert.deepEqual(already.push, [0, 0], 'a block already at the top of a page is not pushed again');
});

test('the page count follows the last block, an empty exam is one page', () => {
  assert.equal(paginate([], geometry).pages, 1);
  assert.equal(paginate(stack([700]), geometry).pages, 1);
  assert.equal(paginate(stack([700, 700, 700]), geometry).pages, 3);
});
