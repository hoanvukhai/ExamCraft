/* eslint-disable @typescript-eslint/no-require-imports -- standalone guarded local load runner */
const fs = require('node:fs');
const { randomUUID, createHash } = require('node:crypto');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { requireTestDatabase } = require('../tests/helpers/test-database.ts');

async function main() {
  if (fs.existsSync('.env')) process.loadEnvFile('.env');
  const target = new URL(process.env.DATABASE_URL); target.pathname = '/examcraft_test_20261022';
  const database = requireTestDatabase({ ...process.env, TEST_DATABASE_URL: target.href, EXAMCRAFT_ALLOW_TEST_DB: '1' });
  assert.equal(new URL(database).pathname, '/examcraft_test_20261022');
  const origin = 'http://127.0.0.1:3117';
  const health = await fetch(origin + '/api/health', { signal: AbortSignal.timeout(10000) });
  assert.equal((await health.json()).isolatedTest, true, 'No writes without isolatedTest');
  const db = new PrismaClient({ datasources: { db: { url: database } } });
  const uid = 'load_' + randomUUID(), email = uid + '@example.invalid';
  const samples = [], report = { run: uid, checkedAt: new Date().toISOString(), environment: 'localhost3117 / examcraft_test_20261022', students: 40, clientRetries: 0, realAiCalls: false, cleanupComplete: false, status: 'INCOMPLETE' };
  async function request(path, method, body, cookie = '', phase) {
    const begin = performance.now();
    try {
      const response = await fetch(origin + path, { method, headers: { Origin: origin, 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(body), signal: AbortSignal.timeout(60000) });
      const header = response.headers.get('x-examcraft-test-transaction-tries');
      if (phase) samples.push({ phase, status: response.status, ms: Math.round(performance.now() - begin), transactionTries: header === null ? null : Number(header) });
      return { status: response.status, data: await response.json(), cookie: response.headers.getSetCookie().map(c => c.split(';')[0]).join('; ') };
    } catch (error) {
      if (phase) samples.push({ phase, status: 0, ms: Math.round(performance.now() - begin), transactionTries: null });
      throw error;
    }
  }
  async function cohort(requests) {
    // Wait for every request even when one fails, before cleanup touches fixtures.
    const replies = await Promise.allSettled(requests);
    assert.ok(replies.every(reply => reply.status === 'fulfilled'), 'A cohort request failed; see phase metrics');
    return replies.map(reply => reply.value);
  }
  try {
    const password = 'Load-fixture-' + randomUUID();
    await db.user.create({ data: { id: uid, email, name: 'Load fixture', passwordHash: await bcrypt.hash(password, 10), mustChangePassword: false, aiDailyLimit: 0 } });
    const login = await request('/api/auth/login', 'POST', { email, password }); assert.equal(login.status, 200);
    const owner = login.cookie, now = new Date().toISOString();
    const created = await request('/api/exams', 'POST', { document: { id: 'draft_' + uid, metadata: { title: 'Load 40 fixture', subject: 'toan', grade: 6, durationMinutes: 30, schoolName: '', departmentName: '' }, questions: [{ id: 'mc', type: 'multiple_choice', difficulty: 'thong_hieu', content: 'Chọn một', choices: [{ key: 'A', text: 'Một' }, { key: 'B', text: 'Hai' }], correct_answer: 'A', points: 1, step_by_step_solution: 'PRIVATE_LOAD_SOLUTION' }], createdAt: now, updatedAt: now } }, owner);
    assert.equal(created.status, 200);
    const assigned = await request('/api/assignments', 'POST', { examId: created.data.document.id, title: 'Load 40 fixture', identityMode: 'FREE_NAME', maxAttempts: 1, showResult: 'NEVER', showSolution: 'NEVER' }, owner);
    assert.equal(assigned.status, 200); const assignment = assigned.data.assignment;
    const starts = await cohort(Array.from({ length: 40 }, (_, i) => request(`/api/public/assignments/${assignment.publicId}/start`, 'POST', { freeName: `Học sinh thử ${i + 1}` }, '', 'start')));
    assert.ok(starts.every(r => r.status === 200), 'Some starts failed; see phase metrics');
    for (let round = 1; round <= 3; round++) {
      const drafts = await cohort(starts.map(r => request(`/api/public/attempts/${r.data.attempt.id}/draft`, 'PATCH', { baseDraftRevision: r.data.attempt.draftRevision, draft: { mc: round === 2 ? 'B' : 'A' } }, r.cookie, 'draft' + round)));
      assert.ok(drafts.every(r => r.status === 200), 'Some drafts failed; see phase metrics');
      drafts.forEach((r, i) => { starts[i].data.attempt.draftRevision = r.data.draftRevision; });
    }
    const submitted = await cohort(starts.map(r => request(`/api/public/attempts/${r.data.attempt.id}/submit`, 'POST', { answers: { mc: 'A' }, baseDraftRevision: r.data.attempt.draftRevision }, r.cookie, 'submit')));
    assert.ok(submitted.every(r => r.status === 200), 'Some submissions failed; see phase metrics');
    const repeated = await cohort(starts.map(r => request(`/api/public/attempts/${r.data.attempt.id}/submit`, 'POST', { answers: { mc: 'B' }, baseDraftRevision: r.data.attempt.draftRevision }, r.cookie, 'submitReplay')));
    assert.ok(repeated.every(r => r.status === 200 && r.data.idempotent === true), 'A repeated submit changed the result');
    const attempts = await db.attempt.findMany({ where: { assignmentId: assignment.id }, include: { answers: true } });
    assert.equal(attempts.length, 40);
    assert.equal(new Set(attempts.map(a => a.studentId)).size, 40);
    assert.ok(attempts.every(a => a.status === 'SUBMITTED' && Number(a.score) === 1 && a.answers.length === 1));
    assert.equal(await db.aiUsageLog.count({ where: { userId: uid } }), 0);
    report.status = 'PASS';
  } catch (error) { report.status = 'FAIL'; report.error = error instanceof assert.AssertionError ? error.message : 'Load setup/request failed; inspect server locally without exporting credentials'; process.exitCode = 1; }
  finally {
    try {
      await db.assignment.deleteMany({ where: { ownerId: uid } });
      await db.group.deleteMany({ where: { ownerId: uid } });
      await db.exam.deleteMany({ where: { ownerId: uid } });
      await db.question.deleteMany({ where: { ownerId: uid } });
      await db.passage.deleteMany({ where: { ownerId: uid } });
      await db.auditLog.deleteMany({ where: { OR: [{ actorId: uid }, { targetType: 'LoginBucket', targetId: createHash('sha256').update(email).digest('hex') }] } });
      await db.user.deleteMany({ where: { id: uid } });
      assert.equal(await db.user.count({ where: { id: uid } }), 0);
      report.cleanupComplete = true;
    } catch { report.cleanupComplete = false; report.status = 'FAIL'; process.exitCode = 1; }
    await db.$disconnect();
    report.phases = [...new Set(samples.map(s => s.phase))].map(phase => {
      const rows = samples.filter(s => s.phase === phase), times = rows.map(s => s.ms).sort((a,b) => a-b);
      return { phase, requests: rows.length, errors5xx: rows.filter(s => s.status >= 500).length, non200: rows.filter(s => s.status !== 200).length, p95Ms: times[Math.ceil(times.length * .95) - 1], maxMs: times.at(-1), serverRetriesObserved: rows.every(s => s.transactionTries !== null) ? rows.reduce((sum,s) => sum + Math.max(0, s.transactionTries - 1),0) : null };
    });
    report.samples = samples;
    report.buildId = fs.readFileSync('.next/BUILD_ID','utf8').trim();
    const dir = 'qa/rebuild-2026-10-25'; fs.mkdirSync(dir,{recursive:true});
    fs.writeFileSync(`${dir}/load-class-${uid}.json`, JSON.stringify(report,null,2));
    console.log(JSON.stringify({status:report.status,cleanupComplete:report.cleanupComplete,phases:report.phases},null,2));
  }
}
main().catch(() => { console.error('BLOCKED: isolated server/database preflight failed.'); process.exitCode = 1; });
