import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';
import { requireTestDatabase } from './helpers/test-database';
import { loginBucket } from '../src/lib/auth-security';

const db = new PrismaClient({ datasources: { db: { url: requireTestDatabase() } }, log: [] });
const origin = 'http://127.0.0.1:3117';
async function request(path: string, method = 'GET', body?: unknown, cookie = '', requestOrigin = origin) {
  const response = await fetch(origin + path, { method, headers: { Origin: requestOrigin, ...(cookie ? { Cookie: cookie } : {}), ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(30000) });
  return { status: response.status, data: await response.json(), cookie: response.headers.getSetCookie().map(c => c.split(';')[0]).join('; ') };
}

test('authentication revocation and limits on isolated local HTTP server', { timeout: 180000 }, async t => {
  assert.equal((await request('/api/health')).data.isolatedTest, true, 'Refusing writes outside isolated test server.');
  const suffix = randomUUID(), ids = ['admin', 'teacher', 'rate'].map(role => `auth_${role}_${suffix}`), emails = ids.map(id => `${id}@example.invalid`);
  const passwords = ['fixture-initial-' + suffix, 'fixture-changed-' + suffix, 'fixture-reset-' + suffix];
  const checks: string[] = [];
  t.after(async () => {
    try {
      await db.auditLog.deleteMany({ where: { OR: [{ actorId: { in: ids } }, { targetId: { in: [...ids, ...emails.map(loginBucket)] } }] } });
      await db.user.deleteMany({ where: { id: { in: ids } } });
      fs.writeFileSync('qa/rebuild-2026-10-22/http_auth.json', JSON.stringify({ checkedAt: new Date().toISOString(), checks, status: checks.length === 5 ? 'PASS' : 'INCOMPLETE', cleanupComplete: true, environment: 'isolated localhost:3117', realAiCalls: false }, null, 2));
    } finally { await db.$disconnect(); }
  });
  const passwordHash = await bcrypt.hash(passwords[0], 10);
  for (let i = 0; i < ids.length; i++) await db.user.create({ data: { id: ids[i], email: emails[i], name: 'Auth HTTP fixture', passwordHash, role: i === 0 ? 'SUPER_ADMIN' : 'TEACHER', mustChangePassword: i === 1, aiDailyLimit: 0 } });
  const login = (index: number, password: string) => request('/api/auth/login', 'POST', { email: emails[index], password });
  const admin = await login(0, passwords[0]); assert.equal(admin.status, 200);
  const first = await login(1, passwords[0]), second = await login(1, passwords[0]);
  assert.equal(first.status, 200); assert.equal(second.status, 200);

  await t.test('forced password change is enforced by APIs while account details remain readable', async () => {
    assert.equal((await request('/api/auth/me', 'GET', undefined, first.cookie)).data.user.mustChangePassword, true);
    const blocked = await request('/api/exams', 'GET', undefined, first.cookie);
    assert.equal(blocked.status, 403); assert.equal(blocked.data.code, 'MUST_CHANGE_PASSWORD');
    assert.equal((await request('/api/auth/change-password', 'POST', { newPassword: passwords[1] }, first.cookie, 'https://foreign.example')).status, 403);
    checks.push('http-forced-password-and-origin');
  });
  await t.test('changing password preserves current session and revokes every other session', async () => {
    assert.equal((await request('/api/auth/change-password', 'POST', { newPassword: passwords[1] }, first.cookie)).status, 200);
    assert.equal((await request('/api/exams', 'GET', undefined, first.cookie)).status, 200);
    assert.equal((await request('/api/exams', 'GET', undefined, second.cookie)).status, 401);
    assert.equal(await db.session.count({ where: { userId: ids[1] } }), 1);
    checks.push('http-password-revokes-other-sessions');
  });
  await t.test('logout deletes the server session and old cookie cannot be reused', async () => {
    const wrongAccount = await fetch(origin + '/api/auth/logout', { method: 'POST', headers: { Origin: origin, Cookie: first.cookie, 'x-examcraft-user': ids[0] } });
    assert.equal(wrongAccount.status, 409); assert.equal((await wrongAccount.json()).code, 'ACCOUNT_CHANGED');
    assert.equal((await request('/api/exams', 'GET', undefined, first.cookie)).status, 200, 'A stale tab cannot revoke the current account session.');
    assert.equal((await request('/api/auth/logout', 'POST', undefined, first.cookie)).status, 200);
    assert.equal((await request('/api/exams', 'GET', undefined, first.cookie)).status, 401);
    checks.push('http-logout-revokes-cookie');
  });
  await t.test('admin reset and disable revoke sessions permanently, including after reenable', async () => {
    const logged = await login(1, passwords[1]); assert.equal(logged.status, 200);
    const path = `/api/admin/users/${ids[1]}`;
    assert.equal((await request(path, 'PATCH', { resetPassword: passwords[2] }, admin.cookie)).status, 200);
    assert.equal((await request('/api/exams', 'GET', undefined, logged.cookie)).status, 401);
    const reset = await login(1, passwords[2]); assert.equal(reset.status, 200); assert.equal(reset.data.user.mustChangePassword, true);
    assert.equal((await request(path, 'PATCH', { isActive: false }, admin.cookie)).status, 200);
    assert.equal((await request(path, 'PATCH', { isActive: true }, admin.cookie)).status, 200);
    assert.equal((await request('/api/auth/me', 'GET', undefined, reset.cookie)).data.user, null);
    assert.equal(await db.session.count({ where: { userId: ids[1] } }), 0);
    checks.push('http-admin-reset-disable-revocation');
  });
  await t.test('five failed logins block that account while another account remains usable', async () => {
    for (let i = 0; i < 5; i++) assert.equal((await login(2, 'invalid-fixture-password')).status, 401);
    assert.equal((await login(2, passwords[0])).status, 429);
    assert.equal((await login(0, passwords[0])).status, 200);
    checks.push('http-durable-account-rate-limit');
  });
});
