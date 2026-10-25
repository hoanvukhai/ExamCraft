import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import coverage from '../src/config/education/coverage.json';
import { getCatalogSubjects } from '../src/lib/education-catalog';

const doc = 'docs/chuong-trinh-2018/DANH_MUC_GOI_THEO_MON.md';

test('every catalog subject of every grade is offered by the app and none is marked approved', () => {
  for (const row of coverage.rows) {
    assert.ok(getCatalogSubjects(row.grade).some(item => item.key === row.subject), `${row.subject} lớp ${row.grade} must stay selectable`);
    assert.notEqual(row.readiness, 'approved', `${row.subject} lớp ${row.grade} has no reviewer and cannot be approved`);
  }
  const outsideMath = new Set(coverage.rows.filter(row => row.subject !== 'toan').map(row => row.subject));
  assert.ok(outsideMath.size > 20, 'subjects other than Math must remain in the catalog');
});

test('the subject–grade table document is generated from the current catalog and lists every subject', () => {
  const before = fs.readFileSync(doc, 'utf8');
  execFileSync(process.execPath, ['scripts/catalog-table.cjs']);
  const after = fs.readFileSync(doc, 'utf8');
  assert.equal(after, before, 'run node scripts/catalog-table.cjs and commit the result');
  for (const row of coverage.rows) assert.ok(after.includes(`| ${row.label}`), `${row.label} missing from ${doc}`);
  assert.ok(!/đã duyệt/i.test(after.replace(/"đã duyệt"/g, '')), 'the table must never claim an approved package');
});
