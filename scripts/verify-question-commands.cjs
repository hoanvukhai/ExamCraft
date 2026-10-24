const assert = require('node:assert/strict');
const fs = require('node:fs');
const { createHash } = require('node:crypto');
const { PrismaClient } = require('@prisma/client');
const { requireTestDatabase } = require('../tests/helpers/test-database.ts');
const { fromDatabaseExam } = require('../src/lib/exam-document.ts');
process.loadEnvFile('.env');
const target = new URL(process.env.DATABASE_URL); target.pathname = '/examcraft_test_20261022';
const url = requireTestDatabase({ ...process.env, TEST_DATABASE_URL: target.href, EXAMCRAFT_ALLOW_TEST_DB: '1' });
const db = new PrismaClient({ datasources: { db: { url } }, log: [] });
const output = 'qa/rebuild-2026-10-23', hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
async function main() {
  try {
    const phase = process.argv[2]; assert.ok(['after-undo', 'after-b', 'after-stale', 'after-order', 'after-offline'].includes(phase));
    const fixture = JSON.parse(fs.readFileSync(`${output}/question-command-fixture.json`, 'utf8')); assert.equal(fixture.database, 'examcraft_test_20261022');
    const row = await db.exam.findUniqueOrThrow({ where: { id: fixture.examId }, include: { owner: { select: { email: true } } } });
    assert.equal(row.owner.email, 'qa_browser_2@example.invalid'); assert.equal(row.title, fixture.title);
    const source = await db.exam.findUniqueOrThrow({ where: { id: 'ex_dfc36d842dd0da700caad3fb0ef0db42fc89bc12' } });
    assert.equal(hash(source.metadata), fixture.sourceMetadataSha256);
    const exam = fromDatabaseExam(row), first = exam.questions[0];
    assert.equal(first.id, fixture.questionIds[0]);
    for (const q of exam.questions) { assert.equal(q.points, 0); assert.ok(q.figures.length); }
    if (phase === 'after-undo') {
      assert.equal(exam.questions.length, 2); assert.equal(first.content, 'QA LỆNH CÂU A'); assert.equal(first.step_by_step_solution, 'QA lời giải nền lệnh câu'); assert.ok(first.version >= 5);
    } else {
      assert.equal(first.content, phase === 'after-offline' ? 'QA A ÁP DỤNG KHI MẤT KẾT NỐI' : 'QA A SỬA 3');
      assert.equal(first.step_by_step_solution, 'QA B SỬA SAU A');
      assert.equal(exam.questions.length, ['after-order', 'after-offline'].includes(phase) ? 3 : 2);
    }
    if (phase === 'after-stale') {
      const before = JSON.parse(fs.readFileSync(`${output}/question-commands-after-b-db.json`, 'utf8'));
      assert.equal(exam.version, before.version); assert.equal(hash(exam.questions), before.questionsSha256);
    }
    if (['after-order', 'after-offline'].includes(phase)) {
      assert.equal(exam.questions[1].id, fixture.questionIds[1]); const copy = exam.questions[2];
      assert.ok(!fixture.questionIds.includes(copy.id)); assert.equal(copy.content, 'QA A SỬA 3'); assert.equal(copy.step_by_step_solution, 'QA B SỬA SAU A');
      assert.equal(copy.verifiedBy, 'none'); assert.equal(copy.status, 'draft'); assert.equal(copy.version, 1);
      assert.equal(hash(copy.figures), hash(first.figures));
    }
    fs.writeFileSync(`${output}/question-commands-${phase}-db.json`, JSON.stringify({ checkedAt: new Date().toISOString(), status: 'PASS', phase, readOnly: true, database: fixture.database, examId: exam.id, version: exam.version, questionCount: exam.questions.length, firstQuestionVersion: first.version, questionsSha256: hash(exam.questions), sourceUnchanged: true, zeroPointsAndFiguresKept: true, realAiCalls: false }, null, 2));
    console.log(`PASS: command ${phase}, TEST DB read only, original source unchanged.`);
  } finally { await db.$disconnect(); }
}
main().catch(error => { console.error('Question command verification failed.', String(error?.stack || '').split('\n').find(line => line.includes('at main')) || error?.name); process.exitCode = 1; });
