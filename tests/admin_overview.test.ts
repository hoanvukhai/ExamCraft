import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { summarizeAiUsage, summarizeAccountKeys, assignmentModeLabel } from '../src/lib/admin-overview';

test('an empty or unfinished AI day is not represented as 100 percent success', () => {
  assert.equal(summarizeAiUsage([]).successRate, null);
  const pending = summarizeAiUsage([{ httpStatus: null, _count: { _all: 4 } }]);
  assert.equal(pending.totalToday, 4); assert.equal(pending.completedToday, 0); assert.equal(pending.successRate, null);
  const mixed = summarizeAiUsage([{ httpStatus: 200, _count: { _all: 3 } }, { httpStatus: 429, _count: { _all: 1 } }, { httpStatus: null, _count: { _all: 2 } }]);
  assert.equal(mixed.successRate, 75); assert.equal(mixed.totalToday, 6); assert.equal(mixed.pendingToday, 2);
});

test('shared grants count per recipient, without inventing provider quota', () => {
  assert.deepEqual(summarizeAccountKeys([{ isActive: true, grantId: 'same-grant', _count: { _all: 3 } }, { isActive: false, grantId: null, _count: { _all: 1 } }]), { total: 4, active: 3, personal: 1, granted: 3 });
});

test('current classwork is distinct from homework and unsupported modes have a neutral fallback', () => {
  assert.equal(assignmentModeLabel('CLASSWORK'), 'Làm trên lớp');
  assert.equal(assignmentModeLabel('HOMEWORK'), 'Bài về nhà');
  assert.equal(assignmentModeLabel('UNKNOWN'), 'Bài giao');
});

test('the technical pilot example keeps readable Vietnamese rather than mojibake', () => {
  const fixture = JSON.parse(fs.readFileSync('tests/fixtures/pilot/toan6-bay-dang.json', 'utf8'));
  assert.ok(fixture.metadata.title.startsWith('Đề Kiểm Tra'));
  assert.equal(/[ÃÄÆ]|á[º»]/.test(JSON.stringify(fixture)), false);
});
