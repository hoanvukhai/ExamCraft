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
const hash = value => crypto.createHash('sha256').update(JSON.stringify({ value })).digest('hex');
const output = 'qa/rebuild-2026-10-23';
async function main() {
  try {
    const phase = process.argv[2]; assert.ok(['before', 'after-b', 'after-stale'].includes(phase));
    const row = await db.exam.findUniqueOrThrow({ where: { id: 'ex_dfc36d842dd0da700caad3fb0ef0db42fc89bc12' }, include: { owner: { select: { email: true } } } });
    assert.equal(row.owner.email, 'qa_browser_2@example.invalid');
    const exam = fromDatabaseExam(row), q = exam.questions[0];
    assert.equal(exam.questions.length, 1); assert.equal(q.points, 0);
    assert.equal(q.content, 'QA ảnh xanh phải còn sau khôi phục');
    assert.ok(q.figures.length); assert.equal(exam.metadata.academicYear, '2029–2030 QA TÙY CHỈNH');
    const preserved = { content: hash(q.content), figures: hash(q.figures), plan: hash(exam.metadata.examPlan), sections: hash(exam.sections), points: q.points };
    if (phase !== 'before') {
      assert.deepEqual(preserved, JSON.parse(fs.readFileSync(`${output}/question-drafts-before-db.json`, 'utf8')).preserved);
      assert.equal(q.step_by_step_solution, 'QA lời giải mới từ tab B — kiểm nháp 20261024');
    }
    if (phase === 'after-stale') {
      const baseline = JSON.parse(fs.readFileSync(`${output}/question-drafts-after-b-db.json`, 'utf8'));
      assert.equal(exam.version, baseline.version); assert.equal(hash(q), baseline.questionSha256);
    }
    const result = { checkedAt: new Date().toISOString(), phase, status: 'PASS', readOnly: true, database: 'examcraft_test_20261022', examId: exam.id, version: exam.version, questionSha256: hash(q), preserved, realAiCalls: false };
    fs.writeFileSync(`${output}/question-drafts-${phase}-db.json`, JSON.stringify(result, null, 2));
    console.log(`PASS: question draft ${phase}, TEST DB read only.`);
  } finally { await db.$disconnect(); }
}
main().catch(error => { console.error('Question draft verification failed.', String(error?.stack || '').split('\n').find(line => line.includes('at main')) || error?.name); process.exitCode = 1; });
