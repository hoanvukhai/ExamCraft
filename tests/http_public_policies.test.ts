import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { PrismaClient, type Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import { requireTestDatabase } from './helpers/test-database';

const db = new PrismaClient({ datasources: { db: { url: requireTestDatabase() } }, log: [] });
const origin = 'http://127.0.0.1:3117';
async function request(path: string, method = 'GET', body?: unknown, cookie = '') {
  const response = await fetch(origin + path, { method, headers: { Origin: origin, ...(cookie ? { Cookie: cookie } : {}), ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(30000) });
  return { status: response.status, data: await response.json(), cookie: response.headers.getSetCookie().map(value => value.split(';')[0]).join('; '), headers: response.headers };
}

test('public deadlines, reveal policies and nonnumeric results on isolated PostgreSQL', { timeout: 120000 }, async t => {
  assert.equal((await request('/api/health')).data.isolatedTest, true, 'Refusing writes without proof of isolated server.');
  const uid = 'policy_' + randomUUID(), checks: string[] = [];
  t.after(async () => {
    try {
      await db.assignment.deleteMany({ where: { ownerId: uid } });
      await db.group.deleteMany({ where: { ownerId: uid } });
      await db.exam.deleteMany({ where: { ownerId: uid } });
      await db.question.deleteMany({ where: { ownerId: uid } });
      await db.passage.deleteMany({ where: { ownerId: uid } });
      await db.auditLog.deleteMany({ where: { actorId: uid } });
      await db.user.deleteMany({ where: { id: uid } });
      const directory = `qa/rebuild-${new Date().toISOString().slice(0, 10)}`;
      fs.mkdirSync(directory, { recursive: true });
      fs.writeFileSync(`${directory}/http_public_policies.json`, JSON.stringify({ checkedAt: new Date().toISOString(), checks, cleanupComplete: true, status: checks.length === 5 ? 'PASS' : 'INCOMPLETE', realAiCalls: false, environment: 'isolated localhost:3117' }, null, 2));
    } finally { await db.$disconnect(); }
  });
  const password = 'fixture-' + randomUUID(), email = uid + '@example.invalid';
  await db.user.create({ data: { id: uid, email, name: 'Policy fixture', passwordHash: await bcrypt.hash(password, 10), mustChangePassword: false, aiDailyLimit: 0 } });
  const login = await request('/api/auth/login', 'POST', { email, password });
  assert.equal(login.status, 200); const owner = login.cookie;
  const created = await request('/api/exams', 'POST', { document: { id: 'draft_' + uid, metadata: { title: 'Policy fixture', subject: 'toan', grade: 6, durationMinutes: 15, schoolName: '', departmentName: '' }, questions: [{ id: 'q', type: 'multiple_choice', difficulty: 'nhan_biet', content: 'Policy question', choices: [{ key: 'A', text: 'One' }, { key: 'B', text: 'Two' }], correct_answer: 'A', step_by_step_solution: 'POLICY_PRIVATE_SOLUTION', points: 1 }] } }, owner);
  assert.equal(created.status, 200, created.data.error);
  const document = created.data.document;
  const makeAssignment = (overrides: Partial<Prisma.AssignmentUncheckedCreateInput> = {}) => db.assignment.create({ data: { ownerId: uid, examId: document.id, title: 'Policy fixture assignment', publicId: randomUUID(), mode: 'HOMEWORK', status: 'OPEN', identityMode: 'FREE_NAME', maxAttempts: 1, snapshot: document, showResult: 'NEVER', showSolution: 'NEVER', ...overrides } });
  const start = (publicId: string, name: string = randomUUID()) => request(`/api/public/assignments/${publicId}/start`, 'POST', { freeName: name });
  const submit = (id: string, cookie: string, revision: string, answer = 'A') => request(`/api/public/attempts/${id}/submit`, 'POST', { answers: { q: answer }, baseDraftRevision: revision }, cookie);

  await t.test('concurrent starts respect maximum attempts and capabilities cannot cross attempts', async () => {
    const assignment = await makeAssignment();
    const starts = await Promise.all([start(assignment.publicId, 'Same synthetic student'), start(assignment.publicId, 'Same synthetic student')]);
    assert.deepEqual(starts.map(result => result.status).sort(), [200, 403]);
    const own = starts.find(result => result.status === 200)!;
    assert.equal(await db.attempt.count({ where: { assignmentId: assignment.id } }), 1);
    const another = await start(assignment.publicId, 'Other synthetic student'); assert.equal(another.status, 200);
    const path = `/api/public/attempts/${own.data.attempt.id}/submit`;
    assert.equal((await request(path, 'GET', undefined, another.cookie)).status, 403);
    assert.equal((await request(path, 'GET', undefined, own.cookie)).status, 409);
    assert.equal((await request(path, 'GET', undefined, own.cookie.replace(/=.+$/, '=invalid'))).status, 403);
    const view = await request(`/api/public/assignments/${assignment.publicId}`);
    assert.equal(view.status, 200); assert.ok(!JSON.stringify(view.data).includes('POLICY_PRIVATE_SOLUTION'));
    assert.ok(!JSON.stringify(view.data).includes('correct_answer'));
    checks.push('start-race-max-attempts-and-capability-isolation');
  });

  await t.test('GET and idempotent submit use current reveal policies and hide rankings when scores are hidden', async () => {
    const assignment = await makeAssignment({ leaderboard: 'TOP_AND_ME', leaderboardReveal: 'IMMEDIATE', leaderboardAnonymous: true });
    const opened = await start(assignment.publicId, 'POLICY_PRIVATE_STUDENT'); assert.equal(opened.status, 200);
    const id = opened.data.attempt.id, path = `/api/public/attempts/${id}/submit`;
    const sent = await submit(id, opened.cookie, opened.data.attempt.draftRevision); assert.equal(sent.status, 200);
    const original = await db.attempt.findUniqueOrThrow({ where: { id }, include: { answers: true } });
    const hidden = (data: { score: unknown; maxScore: unknown; solutions: unknown; leaderboard: unknown }) => {
      assert.equal(data.score, null); assert.equal(data.maxScore, null); assert.equal(data.solutions, null); assert.equal(data.leaderboard, null);
      assert.ok(!JSON.stringify(data).includes('POLICY_PRIVATE_SOLUTION'));
    };
    hidden(sent.data);
    for (const status of ['OPEN', 'CLOSED', 'ARCHIVED'] as const) {
      await db.assignment.update({ where: { id: assignment.id }, data: { status, showResult: 'NEVER', showSolution: 'NEVER' } });
      const read = await request(path, 'GET', undefined, opened.cookie); assert.equal(read.status, 200); hidden(read.data);
      const repeat = await submit(id, opened.cookie, '0'.repeat(64), 'B'); assert.equal(repeat.status, 200); assert.equal(repeat.data.idempotent, true); hidden(repeat.data);
    }
    await db.assignment.update({ where: { id: assignment.id }, data: { status: 'OPEN', showResult: 'AFTER_CLOSE', showSolution: 'AFTER_CLOSE' } });
    hidden((await request(path, 'GET', undefined, opened.cookie)).data);
    for (const data of [{ status: 'CLOSED' as const }, { status: 'ARCHIVED' as const }, { status: 'OPEN' as const, closesAt: new Date(Date.now() - 60000) }]) {
      await db.assignment.update({ where: { id: assignment.id }, data });
      const read = await request(path, 'GET', undefined, opened.cookie); assert.equal(read.status, 200);
      assert.equal(Number(read.data.score), 1); assert.ok(JSON.stringify(read.data.solutions).includes('POLICY_PRIVATE_SOLUTION'));
      assert.equal(read.data.leaderboard.top[0].name, 'Học sinh 1');
      const review = await request(`/api/public/assignments/${assignment.publicId}`, 'GET', undefined, opened.cookie);
      assert.equal(review.status, 200); assert.ok(!JSON.stringify(review.data).includes('POLICY_PRIVATE_SOLUTION'));
      assert.equal((await request(`/api/public/assignments/${assignment.publicId}`)).status, 403);
    }
    await db.assignment.update({ where: { id: assignment.id }, data: { status: 'OPEN', closesAt: null, showResult: 'IMMEDIATE', showSolution: 'IMMEDIATE', leaderboardReveal: 'NEVER' } });
    const immediate = await request(path, 'GET', undefined, opened.cookie); assert.equal(Number(immediate.data.score), 1); assert.equal(immediate.data.leaderboard, null);
    assert.deepEqual(await db.attempt.findUniqueOrThrow({ where: { id }, include: { answers: true } }), original);
    assert.equal((await request(path)).status, 403);
    assert.equal((await start(assignment.publicId, 'POLICY_PRIVATE_STUDENT')).status, 403);
    checks.push('reveal-never-after-close-immediate-and-idempotent-redaction');
  });

  await t.test('late submission finalizes only the acknowledged draft and future or closed assignments refuse starts', async () => {
    const assignment = await makeAssignment({ showResult: 'IMMEDIATE' });
    const opened = await start(assignment.publicId); assert.equal(opened.status, 200);
    const id = opened.data.attempt.id;
    const saved = await request(`/api/public/attempts/${id}/draft`, 'PATCH', { draft: { q: 'A' }, baseDraftRevision: opened.data.attempt.draftRevision }, opened.cookie);
    assert.equal(saved.status, 200);
    await db.attempt.update({ where: { id }, data: { deadlineAt: new Date(Date.now() - 60000) } });
    await db.assignment.update({ where: { id: assignment.id }, data: { closesAt: new Date(Date.now() - 60000) } });
    assert.equal((await request(`/api/public/attempts/${id}/draft`, 'PATCH', { draft: { q: 'B' }, baseDraftRevision: saved.data.draftRevision }, opened.cookie)).status, 409);
    const sent = await submit(id, opened.cookie, saved.data.draftRevision, 'B'); assert.equal(sent.status, 200); assert.equal(sent.data.responses.q, 'A'); assert.equal(Number(sent.data.score), 1);
    assert.equal((await start(assignment.publicId)).status, 403);
    const future = await makeAssignment({ opensAt: new Date(Date.now() + 3600000) });
    assert.equal((await request(`/api/public/assignments/${future.publicId}`)).status, 403); assert.equal((await start(future.publicId)).status, 403);
    assert.equal(await db.attempt.count({ where: { assignmentId: future.id } }), 0);
    checks.push('strict-draft-deadline-and-late-saved-only-finalization');
  });

  await t.test('archived students or groups cannot reuse existing capabilities to write or read results', async () => {
    const assignment = await makeAssignment({ showResult: 'IMMEDIATE', showSolution: 'IMMEDIATE' });
    const opened = await start(assignment.publicId, 'Archived synthetic student'); assert.equal(opened.status, 200);
    const id = opened.data.attempt.id, row = await db.attempt.findUniqueOrThrow({ where: { id } });
    const student = await db.student.findUniqueOrThrow({ where: { id: row.studentId } });
    const before = await db.attempt.findUniqueOrThrow({ where: { id } });
    await db.student.update({ where: { id: student.id }, data: { archivedAt: new Date() } });
    assert.equal((await request(`/api/public/attempts/${id}/draft`, 'PATCH', { draft: { q: 'B' }, baseDraftRevision: opened.data.attempt.draftRevision }, opened.cookie)).status, 403);
    assert.equal((await submit(id, opened.cookie, opened.data.attempt.draftRevision)).status, 403);
    assert.equal((await request(`/api/public/attempts/${id}/submit`, 'GET', undefined, opened.cookie)).status, 403);
    assert.deepEqual(await db.attempt.findUniqueOrThrow({ where: { id } }), before);
    assert.equal((await start(assignment.publicId, 'Archived synthetic student')).status, 403);
    await db.student.update({ where: { id: student.id }, data: { archivedAt: null } });
    const sent = await submit(id, opened.cookie, opened.data.attempt.draftRevision); assert.equal(sent.status, 200);
    await db.group.update({ where: { id: student.groupId }, data: { archivedAt: new Date() } });
    assert.equal((await request(`/api/public/assignments/${assignment.publicId}`, 'GET', undefined, opened.cookie)).status, 404);
    assert.equal((await request(`/api/public/attempts/${id}/submit`, 'GET', undefined, opened.cookie)).status, 403);
    assert.equal((await submit(id, opened.cookie, '0'.repeat(64))).status, 403);
    assert.equal((await request(`/api/teacher/attempts/${id}`, 'GET', undefined, owner)).status, 200, 'The owner can still review preserved data.');
    checks.push('archive-revokes-public-capability-without-deleting-data');
  });
  await t.test('survey, comment-only and rubric store no artificial totals and do not enter numeric statistics or CSV', async () => {
    for (const mode of ['survey', 'comment_only', 'rubric']) {
      const assignment = await makeAssignment({ showResult: 'IMMEDIATE', showSolution: 'IMMEDIATE', leaderboard: 'TOP_AND_ME', snapshot: { ...document, metadata: { ...document.metadata, assessmentMode: mode } } });
      const opened = await start(assignment.publicId); assert.equal(opened.status, 200);
      const sent = await submit(opened.data.attempt.id, opened.cookie, opened.data.attempt.draftRevision); assert.equal(sent.status, 200);
      assert.equal(sent.data.score, null); assert.equal(sent.data.maxScore, null); assert.equal(sent.data.leaderboard, null);
      if (mode === 'survey') assert.equal(sent.data.solutions, null);
      const row = await db.attempt.findUniqueOrThrow({ where: { id: opened.data.attempt.id } });
      assert.equal(row.score, null, 'Nonnumeric work must not store a fabricated zero.'); assert.equal(row.maxScore, null);
      // Old rows may still contain historical artificial zeros; reading them must not require rewriting user data.
      await db.attempt.update({ where: { id: row.id }, data: { score: 0, maxScore: 0 } });
      const monitor = await request(`/api/teacher/assignments/${assignment.id}`, 'GET', undefined, owner);
      assert.equal(monitor.status, 200); assert.equal(monitor.data.stats.avgScore, null); assert.equal(monitor.data.stats.maxScore, null);
      assert.equal(monitor.data.stats.totalSubmitted, 1); assert.equal(monitor.data.stats.totalGraded, mode === 'survey' ? 1 : 0);
      assert.deepEqual(monitor.data.itemAnalysis, []); assert.equal(monitor.data.attempts[0].score, null); assert.equal(monitor.data.attempts[0].maxScore, null);
      const teacherDetail = await request(`/api/teacher/attempts/${row.id}`, 'GET', undefined, owner);
      assert.equal(teacherDetail.data.attempt.score, null); assert.equal(teacherDetail.data.attempt.maxScore, null);
      const csv = await fetch(origin + `/api/teacher/assignments/${assignment.id}/export-csv`, { headers: { Cookie: owner } });
      assert.equal(csv.status, 200); assert.equal(csv.headers.get('cache-control'), 'no-store');
      const csvText = await csv.text(); assert.ok(!csvText.includes('0 /')); assert.ok(!csvText.includes('Đúng (') && !csvText.includes('Sai ('));
      if (mode === 'survey') assert.ok(!csvText.includes('Chờ chấm'));
      const legacy = await db.attempt.findUniqueOrThrow({ where: { id: row.id } });
      assert.equal(Number(legacy.score), 0, 'Read paths must not rewrite legacy rows.');
    }
    const zeroAssignment = await makeAssignment({ showResult: 'IMMEDIATE', snapshot: { ...document, questions: document.questions.map((question: Record<string, unknown>) => ({ ...question, points: 0 })) } });
    const zeroStarted = await start(zeroAssignment.publicId); assert.equal(zeroStarted.status, 200);
    const zero = await submit(zeroStarted.data.attempt.id, zeroStarted.cookie, zeroStarted.data.attempt.draftRevision);
    assert.equal(zero.status, 200); assert.equal(Number(zero.data.score), 0); assert.equal(Number(zero.data.maxScore), 0);
    const zeroRow = await db.attempt.findUniqueOrThrow({ where: { id: zeroStarted.data.attempt.id } });
    assert.notEqual(zeroRow.score, null); assert.notEqual(zeroRow.maxScore, null);
    await db.attemptAnswer.updateMany({where:{attemptId:zeroRow.id},data:{comment:'@SUM(1,2)\r\n"Nhận xét"'}});
    const csvPath=origin + `/api/teacher/assignments/${zeroAssignment.id}/export-csv`;
    const zeroCsv = await fetch(csvPath, { headers: { Cookie: owner } });
    assert.equal(zeroCsv.status, 200);
    const scoredCsv=await zeroCsv.text(); assert.ok(scoredCsv.includes('0 / 0'));
    assert.ok(scoredCsv.includes('Nhận xét câu 1')); assert.ok(scoredCsv.includes("\"'@SUM(1,2)\r\n\"\"Nhận xét\"\"\""));
    assert.equal((await fetch(csvPath,{headers:{Cookie:zeroStarted.cookie}})).status,401,'Student capability must not export teacher comments.');
    checks.push('nonnumeric-null-storage-monitor-and-csv');
  });
});
