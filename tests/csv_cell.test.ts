import assert from 'node:assert/strict';
import test from 'node:test';
import { csvCell } from '../src/lib/csv-cell';

test('CSV comments preserve punctuation and line breaks within one quoted cell', () => {
  assert.equal(csvCell('Có tiến bộ, cần thêm "đơn vị"\r\nDòng hai'), '"Có tiến bộ, cần thêm ""đơn vị""\r\nDòng hai"');
  assert.equal(csvCell('một\rhai'), '"một\rhai"');
  assert.equal(csvCell(0),'0'); assert.equal(csvCell(null),'');
});
test('CSV comments and names cannot start spreadsheet formulas after whitespace', () => {
  for(const prefix of ['=','+','-','@']) for(const whitespace of ['',' ','\t','\r','\n']) {
    assert.ok(csvCell(whitespace+prefix+'value').startsWith("'"));
  }
});
