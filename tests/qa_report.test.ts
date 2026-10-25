import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { writeQaReport } from './helpers/qa-report';

test('QA publication replaces the whole JSON and cannot target source or a parent directory', () => {
  const file = 'qa/rebuild-2026-10-25/qa-report-check-' + randomUUID() + '.json';
  try {
    writeQaReport(file, JSON.stringify({ old: true }));
    writeQaReport(file, JSON.stringify({ status: 'PASS', nested: [1, 2] }));
    assert.deepEqual(JSON.parse(fs.readFileSync(file, 'utf8')), { status: 'PASS', nested: [1, 2] });
    assert.throws(() => writeQaReport('package.json', '{}'), /QA report path/);
    assert.throws(() => writeQaReport('qa/rebuild-2026-10-25/../../package.json', '{}'), /QA report path/);
  } finally { if (fs.existsSync(file)) fs.unlinkSync(file); }
});
