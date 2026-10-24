// Read-only verification of the explicitly synthetic browser fixture.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { createHash } = require('node:crypto');
const { PrismaClient } = require('@prisma/client');
const { requireTestDatabase } = require('../tests/helpers/test-database.ts');
process.loadEnvFile('.env');
const target = new URL(process.env.DATABASE_URL); target.pathname = '/examcraft_test_20261022';
const url = requireTestDatabase({ ...process.env, TEST_DATABASE_URL: target.href, EXAMCRAFT_ALLOW_TEST_DB: '1' });
const db = new PrismaClient({ datasources: { db: { url } }, log: [] });
const origin = 'http://127.0.0.1:3117';
async function main() {
  try {
    const fixture = JSON.parse(fs.readFileSync('qa/rebuild-2026-10-23/learning-fixture.json', 'utf8'));
    assert.equal((await fetch(origin + '/api/health').then(r => r.json())).isolatedTest, true);
    const owner = await db.user.findUniqueOrThrow({ where: { email: fixture.ownerEmail } });
    const assignment = await db.assignment.findUniqueOrThrow({ where: { publicId: '446b557862363956ea976cc0becca19f' }, include: { attempts: { include: { answers: true } } } });
    assert.equal(assignment.ownerId, owner.id);
    const attempts = assignment.attempts.filter(a => a.status === 'SUBMITTED');
    assert.equal(attempts.length, 2);
    const attempt = attempts.find(a => a.attemptNo === 1);
    assert.ok(attempt);
    assert.equal(attempts.filter(a => a.needsGrading).length, 1);
    assert.equal(Number(attempt.score), 9.5); assert.equal(Number(attempt.maxScore), 10); assert.equal(attempt.needsGrading, false);
    assert.equal(attempt.answers.length, 7);
    const byKey = Object.fromEntries(attempt.answers.map(a => [a.questionKey, a]));
    assert.equal(byKey['qa-short'].response, '0'); assert.equal(byKey['qa-blank'].response, '0');
    assert.deepEqual(byKey['qa-tf'].response, { a: true, b: false, c: true, d: false });
    assert.equal(Number(byKey['qa-essay'].earned), 2.5);
    const source = await db.exam.findUniqueOrThrow({ where: { id: fixture.sourceExamId } });
    assert.equal(createHash('sha256').update(JSON.stringify(source.metadata)).digest('hex'), fixture.sourceSha256);
    const login = await fetch(origin + '/api/auth/login', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: owner.email, password: 'ExamCraft-local-fixture-2026' }) });
    assert.equal(login.status, 200);
    const cookie = login.headers.getSetCookie().map(value => value.split(';')[0]).join('; ');
    const monitor = await fetch(origin + `/api/teacher/assignments/${assignment.id}`, { headers: { Cookie: cookie, 'x-examcraft-user': owner.id } }).then(r => r.json());
    assert.equal(monitor.stats.totalSubmitted, 2); assert.equal(monitor.stats.totalPendingGrading, 1); assert.equal(monitor.stats.totalGraded, 1); assert.equal(monitor.stats.avgScore, 9.5);
    const response = await fetch(origin + `/api/teacher/assignments/${assignment.id}/export-csv`, { headers: { Cookie: cookie, 'x-examcraft-user': owner.id } });
    assert.equal(response.status, 200); assert.match(response.headers.get('content-type'), /text\/csv/);
    const csv = await response.text(); assert.ok(csv.includes('9.5 / 10')); assert.ok(csv.includes('2.5đ')); assert.ok(csv.includes('Chờ giáo viên chấm')); assert.ok(csv.includes('Chờ chấm'));
    fs.writeFileSync('qa/rebuild-2026-10-23/learning-flow-csv.csv', csv);
    fs.writeFileSync('qa/rebuild-2026-10-23/learning-flow-verification.json', JSON.stringify({ checkedAt: new Date().toISOString(), database: 'examcraft_test_20261022', assignmentId: assignment.id, attemptId: attempt.id, submittedAttempts: attempts.length, answers: attempt.answers.length, score: Number(attempt.score), needsGrading: attempt.needsGrading, zeroAndFalsePreserved: true, sourceHashUnchanged: true, csvStatus: response.status, realAiCalls: false }, null, 2));
    console.log('PASS: browser seven-type attempt, manual score 9.5, zero/false, CSV and original source hash verified in TEST DB only.');
  } finally { await db.$disconnect(); }
}
main().catch(() => { console.error('Learning flow verification failed; inspect synthetic TEST fixture.'); process.exitCode = 1; });
