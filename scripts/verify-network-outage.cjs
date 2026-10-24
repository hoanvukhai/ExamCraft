const assert = require('node:assert/strict');
const fs = require('node:fs');
const { PrismaClient } = require('@prisma/client');
const { requireTestDatabase } = require('../tests/helpers/test-database.ts');
const { fromDatabaseExam } = require('../src/lib/exam-document.ts');
process.loadEnvFile('.env');
const target = new URL(process.env.DATABASE_URL); target.pathname = '/examcraft_test_20261022';
const url = requireTestDatabase({ ...process.env, TEST_DATABASE_URL: target.href, EXAMCRAFT_ALLOW_TEST_DB: '1' });
const db = new PrismaClient({ datasources: { db: { url } }, log: [] });
async function main() {
  try {
    const row = await db.exam.findUniqueOrThrow({ where: { id: 'ex_dfc36d842dd0da700caad3fb0ef0db42fc89bc12' }, include: { owner: { select: { email: true } } } });
    assert.equal(row.owner.email, 'qa_browser_2@example.invalid');
    const exam = fromDatabaseExam(row);
    assert.equal(exam.metadata.title, 'QA nhập và khôi phục ảnh');
    assert.equal(exam.metadata.examPlan.slots[0].count, 2);
    assert.equal(exam.metadata.examPlan.slots[0].targetPointsHundredths, 0);
    assert.equal(exam.questions.length, 1); assert.equal(exam.questions[0].points, 0);
    assert.equal(exam.questions[0].content, 'QA ảnh xanh phải còn sau khôi phục');
    assert.ok(exam.questions[0].figures.length > 0);
    assert.ok(exam.questions[0].step_by_step_solution.length > 0);
    const result = { checkedAt: new Date().toISOString(), status: 'PASS', database: 'examcraft_test_20261022', readOnly: true, examId: exam.id, version: exam.version, recoveredPlanCount: 2, targetPointsHundredths: 0, questionCount: 1, questionPoints: 0, figureKept: true, solutionKept: true, realAiCalls: false };
    fs.writeFileSync('qa/rebuild-2026-10-23/network-reconnect-db.json', JSON.stringify(result, null, 2));
    console.log('PASS: restored network draft reached TEST DB; points0, question/figure/solution kept.');
  } finally { await db.$disconnect(); }
}
main().catch(() => { console.error('Network draft read-only verification failed'); process.exitCode = 1; });
