const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
const { PrismaClient } = require('@prisma/client');
const { requireTestDatabase } = require('../tests/helpers/test-database.ts');
const { fromDatabaseExam } = require('../src/lib/exam-document.ts');
process.loadEnvFile('.env');
const target = new URL(process.env.DATABASE_URL); target.pathname = '/examcraft_test_20261022';
const url = requireTestDatabase({ ...process.env, TEST_DATABASE_URL: target.href, EXAMCRAFT_ALLOW_TEST_DB: '1' });
const db = new PrismaClient({ datasources: { db: { url } }, log: [] });
async function main() {
  try {
    const phase = process.argv[2]; assert.ok(['before-conflict', 'after-conflict'].includes(phase));
    const row = await db.exam.findUniqueOrThrow({ where: { id: 'ex_dfc36d842dd0da700caad3fb0ef0db42fc89bc12' }, include: { owner: { select: { email: true } } } });
    assert.equal(row.owner.email, 'qa_browser_2@example.invalid');
    const exam = fromDatabaseExam(row);
    assert.equal(exam.metadata.title, 'QA tiêu đề mới từ tab khác');
    assert.equal(exam.metadata.academicYear, '2028–2029 QA MỚI');
    assert.equal(exam.metadata.examPlan.slots[0].count, 2);
    assert.equal(exam.questions.length, 1); assert.equal(exam.questions[0].points, 0);
    assert.equal(exam.questions[0].content, 'QA ảnh xanh phải còn sau khôi phục');
    assert.ok(exam.questions[0].figures.length && exam.questions[0].step_by_step_solution.length);
    assert.equal(exam.metadata.headerLayout.lines.find(line => line.binding === 'title').hidden, true);
    const custom = exam.metadata.headerLayout.lines.find(line => line.text === 'DÒNG RIÊNG QA — CĂN PHẢI');
    assert.equal(custom.area, 'left'); assert.equal(custom.align, 'right');
    const digest = crypto.createHash('sha256').update(JSON.stringify(row.metadata)).digest('hex');
    if (phase === 'after-conflict') {
      const before = JSON.parse(fs.readFileSync('qa/rebuild-2026-10-23/header-before-conflict-db.json', 'utf8'));
      assert.equal(exam.version, before.version); assert.equal(digest, before.metadataSha256);
    }
    const result = { checkedAt: new Date().toISOString(), status: 'PASS', phase, database: 'examcraft_test_20261022', readOnly: true, examId: exam.id, version: exam.version, metadataSha256: digest, planCount: 2, questionPoints: 0, figureAndSolutionKept: true, hiddenPrintTitle: true, customLeftRightAligned: true, realAiCalls: false };
    fs.writeFileSync(`qa/rebuild-2026-10-23/header-${phase}-db.json`, JSON.stringify(result, null, 2));
    console.log('PASS: header metadata and question data verified in TEST DB; phase ' + phase);
  } finally { await db.$disconnect(); }
}
main().catch(() => { console.error('Header read-only verification failed'); process.exitCode = 1; });
