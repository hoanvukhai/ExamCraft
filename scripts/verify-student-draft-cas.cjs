// Read-only checks after actual browser actions, restricted to the synthetic TEST assignment.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { createHash } = require('node:crypto');
const { PrismaClient } = require('@prisma/client');
const { requireTestDatabase } = require('../tests/helpers/test-database.ts');
process.loadEnvFile('.env');
const target = new URL(process.env.DATABASE_URL); target.pathname = '/examcraft_test_20261022';
const url = requireTestDatabase({ ...process.env, TEST_DATABASE_URL: target.href, EXAMCRAFT_ALLOW_TEST_DB: '1' });
const db = new PrismaClient({ datasources: { db: { url } }, log: [] });
async function main() {
  try {
    const phase = process.argv[2]; assert.ok(['before-submit', 'after-submit'].includes(phase));
    assert.equal((await fetch('http://127.0.0.1:3117/api/health').then(r => r.json())).isolatedTest, true);
    const fixture = JSON.parse(fs.readFileSync('qa/rebuild-2026-10-23/learning-fixture.json', 'utf8'));
    const owner = await db.user.findUniqueOrThrow({ where: { email: fixture.ownerEmail } });
    const assignment = await db.assignment.findUniqueOrThrow({ where: { publicId: '6a42d7ac936460660c5be82512e3e3d5' }, include: { attempts: { include: { answers: true } } } });
    assert.equal(assignment.ownerId, owner.id); assert.equal(assignment.attempts.length, 1); assert.equal(assignment.leaderboard, 'OFF');
    const attempt = assignment.attempts[0];
    assert.equal(attempt.draft['qa-essay'], 'QA bản mới đã lưu từ trang A'); assert.equal(attempt.draft['qa-short'], '0');
    assert.ok(!JSON.stringify(attempt.draft).includes('QA B cần giữ'));
    if (phase === 'before-submit') { assert.equal(attempt.status, 'IN_PROGRESS'); assert.equal(attempt.answers.length, 0); }
    else {
      assert.equal(attempt.status, 'SUBMITTED'); assert.equal(Number(attempt.score), 1); assert.equal(attempt.needsGrading, true);
      assert.equal(attempt.answers.find(a => a.questionKey === 'qa-essay').response, 'QA bản mới đã lưu từ trang A');
    }
    const source = await db.exam.findUniqueOrThrow({ where: { id: fixture.sourceExamId } });
    assert.equal(createHash('sha256').update(JSON.stringify(source.metadata)).digest('hex'), fixture.sourceSha256);
    fs.writeFileSync(`qa/rebuild-2026-10-23/student-cas-${phase}.json`, JSON.stringify({ checkedAt: new Date().toISOString(), database: 'examcraft_test_20261022', assignmentId: assignment.id, attemptId: attempt.id, phase, status: attempt.status, answerRows: attempt.answers.length, sourceHashUnchanged: true, oldTabDidNotOverwrite: true, leaderboard: assignment.leaderboard, realAiCalls: false }, null, 2));
    console.log('PASS: synthetic student CAS ' + phase + ', server keeps A and source hash unchanged.');
  } finally { await db.$disconnect(); }
}
main().catch(() => { console.error('Student CAS fixture verification failed.'); process.exitCode = 1; });
