import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import { loginBucket } from '../src/lib/auth-security';
import { requireTestDatabase } from './helpers/test-database';

const db = new PrismaClient({ datasources: { db: { url: requireTestDatabase() } }, log: [] });
const origin = 'http://127.0.0.1:3117';
async function request(path: string, method = 'GET', body?: unknown, cookie = '', extra: Record<string, string> = {}) {
  const response = await fetch(origin + path, { method, headers: { Origin: origin, ...extra, ...(cookie ? { Cookie: cookie } : {}), ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: response.status, data: await response.json(), cookie: response.headers.getSetCookie().map(value => value.split(';')[0]).join('; ') };
}

test('assignment options (times, attempts, entry code, PIN) are decided on the server', { timeout: 120000 }, async t => {
  assert.equal((await request('/api/health')).data.isolatedTest, true, 'Refusing writes without proof of isolated server.');
  const uid = 'assignopt_' + randomUUID(), checks: string[] = [];
  t.after(async () => {
    try {
      await db.assignment.deleteMany({ where: { ownerId: uid } });
      await db.group.deleteMany({ where: { ownerId: uid } });
      await db.exam.deleteMany({ where: { ownerId: uid } });
      await db.question.deleteMany({ where: { ownerId: uid } });
      await db.auditLog.deleteMany({ where: { OR: [{ actorId: uid }, { targetType: 'LoginBucket', targetId: loginBucket(uid + '@example.invalid') }] } });
      await db.user.deleteMany({ where: { id: uid } });
      const directory = `qa/rebuild-${new Date().toISOString().slice(0, 10)}`;
      fs.mkdirSync(directory, { recursive: true });
      fs.writeFileSync(`${directory}/http_assignment_options.json`, JSON.stringify({ checkedAt: new Date().toISOString(), checks, cleanupComplete: true, status: checks.length === 4 ? 'PASS' : 'INCOMPLETE', environment: 'isolated localhost:3117', realAiCalls: false }, null, 2));
    } finally { await db.$disconnect(); }
  });
  const password = 'fixture-' + randomUUID(), email = uid + '@example.invalid';
  await db.user.create({ data: { id: uid, email, name: 'Assignment options fixture', passwordHash: await bcrypt.hash(password, 10), mustChangePassword: false, aiDailyLimit: 0 } });
  const login = await request('/api/auth/login', 'POST', { email, password });
  assert.equal(login.status, 200); const owner = login.cookie;
  const created = await request('/api/exams', 'POST', { document: { id: 'draft_' + uid, metadata: { title: 'Assignment options fixture', subject: 'toan', grade: 6, durationMinutes: 15, schoolName: '', departmentName: '' },
    questions: [{ id: 'mc', type: 'multiple_choice', difficulty: 'thong_hieu', content: 'MC', choices: [{ key: 'A', text: '1' }, { key: 'B', text: '2' }], correct_answer: 'A', points: 1, step_by_step_solution: 'x' }],
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } }, owner);
  assert.equal(created.status, 200, created.data.error);
  const examId = created.data.document.id as string;
  const assign = (body: Record<string, unknown>) => request('/api/assignments', 'POST', { examId, title: 'Options fixture', identityMode: 'FREE_NAME', ...body }, owner);
  const hours = (n: number) => new Date(Date.now() + n * 3600_000).toISOString();

  await t.test('times: close must be in the future and after open, and valid times are stored as sent', async () => {
    assert.equal((await assign({ closesAt: hours(-1) })).status, 400);
    assert.equal((await assign({ opensAt: hours(3), closesAt: hours(2) })).status, 400);
    const sameInstant = hours(2); // one value: two hours(2) calls differ by a few milliseconds and would make close later than open
    assert.equal((await assign({ opensAt: sameInstant, closesAt: sameInstant })).status, 400);
    const opens = hours(1), closes = hours(5);
    const ok = await assign({ opensAt: opens, closesAt: closes });
    assert.equal(ok.status, 200, ok.data.error);
    const stored = await db.assignment.findUniqueOrThrow({ where: { id: ok.data.assignment.id } });
    assert.equal(stored.opensAt?.toISOString(), opens); assert.equal(stored.closesAt?.toISOString(), closes);
    const early = await request(`/api/public/assignments/${ok.data.assignment.publicId}/start`, 'POST', { freeName: 'Học sinh thử' });
    assert.equal(early.status, 403, 'before the open time nobody can start');
    checks.push('times');
  });
  await t.test('attempts: whole numbers 1-10 only; the old default is unchanged when omitted', async () => {
    for (const bad of [0, 11, 2.5, -1]) assert.equal((await assign({ maxAttempts: bad })).status, 400, String(bad));
    const ok = await assign({ maxAttempts: 4 }); assert.equal(ok.status, 200); assert.equal(ok.data.assignment.maxAttempts, 4);
    const dflt = await assign({}); assert.equal(dflt.status, 200); assert.equal(dflt.data.assignment.maxAttempts, 1);
    checks.push('attempts');
  });
  await t.test('entry code: normalized when saved, refused when unsafe, case-insensitive for students', async () => {
    for (const bad of ['abc', 'has space', 'ÁBCD1', 'TOOLONGCODE123']) assert.equal((await assign({ joinCode: bad })).status, 400, bad);
    const ok = await assign({ joinCode: ' ma01x ' }); assert.equal(ok.status, 200);
    assert.equal(ok.data.assignment.joinCode, 'MA01X');
    const publicId = ok.data.assignment.publicId as string;
    assert.equal((await request(`/api/public/assignments/${publicId}`)).data.assignment.requireJoinCode, true);
    assert.equal((await request(`/api/public/assignments/${publicId}/start`, 'POST', { freeName: 'Học sinh A' })).status, 403, 'no code');
    assert.equal((await request(`/api/public/assignments/${publicId}/start`, 'POST', { freeName: 'Học sinh A', joinCode: 'WRONG1' })).status, 403, 'wrong code');
    const started = await request(`/api/public/assignments/${publicId}/start`, 'POST', { freeName: 'Học sinh A', joinCode: 'ma01x' });
    assert.equal(started.status, 200, started.data.error);
    checks.push('entry-code');
  });
  await t.test('PIN needs a class and a non-free identity; the rest of the old flow still works', async () => {
    assert.equal((await assign({ requirePin: true })).status, 400, 'free name, no class');
    const group = await request('/api/groups', 'POST', { name: 'Lớp thử ' + uid.slice(-6) }, owner);
    assert.equal(group.status, 200, group.data.error);
    const groupId = group.data.group.id as string;
    assert.equal((await assign({ requirePin: true, groupId, identityMode: 'FREE_NAME' })).status, 400, 'class but free name');
    const ok = await assign({ requirePin: true, groupId, identityMode: 'PICK_FROM_LIST' }); assert.equal(ok.status, 200, ok.data.error);
    assert.equal(ok.data.assignment.requirePin, true);
    const wrongAccount = await request('/api/assignments', 'POST', { examId, title: 'x', identityMode: 'FREE_NAME', maxAttempts: 2 }, owner, { 'x-examcraft-user': 'someone-else' });
    assert.equal(wrongAccount.status, 409, 'account pin still applies');
    checks.push('pin');
  });
});
