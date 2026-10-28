import { writeQaReport } from './helpers/qa-report';
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { requireTestDatabase } from './helpers/test-database';

const db = new PrismaClient({ datasources: { db: { url: requireTestDatabase() } }, log: [] });
const origin = process.env.EXAMCRAFT_TEST_ORIGIN ?? 'http://127.0.0.1:3117';
async function request(path: string, method = 'GET', body?: unknown, cookie = '') {
  const response = await fetch(origin + path, { method, headers: { Origin: origin, ...(cookie ? { Cookie: cookie } : {}), ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: response.status, data: await response.json().catch(() => ({})) as Record<string, any>, cookie: response.headers.getSetCookie().map(value => value.split(';')[0]).join('; ') }; // eslint-disable-line @typescript-eslint/no-explicit-any -- loose JSON in a test helper
}

test('an administrator hands a key to chosen teachers: they can use it but never see, change or delete it, and the admin can take it back', { timeout: 120000 }, async t => {
  assert.equal((await request('/api/health')).data.isolatedTest, true, 'Refusing writes without proof of isolated server.');
  const run = randomUUID(), checks: string[] = [], secret = 'granted-secret-' + run;
  const ids = { admin: 'grant_admin_' + run, a: 'grant_a_' + run, b: 'grant_b_' + run, c: 'grant_c_' + run };
  t.after(async () => {
    try {
      const all = Object.values(ids);
      await db.userApiKey.deleteMany({ where: { userId: { in: all } } });
      await db.auditLog.deleteMany({ where: { actorId: { in: all } } });
      await db.user.deleteMany({ where: { id: { in: all } } });
      const directory = process.env.HTTP_REPORT_DIR ?? `qa/rebuild-${new Date().toISOString().slice(0, 10)}`;
      fs.mkdirSync(directory, { recursive: true });
      writeQaReport(`${directory}/http_admin_keys.json`, JSON.stringify({ checkedAt: new Date().toISOString(), checks, cleanupComplete: true, status: checks.length === 4 ? 'PASS' : 'INCOMPLETE', environment: 'isolated ' + origin, realAiCalls: false }, null, 2));
    } finally { await db.$disconnect(); }
  });
  const password = 'fixture-' + run, hash = await bcrypt.hash(password, 10), cookies: Record<string, string> = {};
  for (const [name, role] of [['admin', Role.SUPER_ADMIN], ['a', Role.TEACHER], ['b', Role.TEACHER], ['c', Role.TEACHER]] as const) {
    await db.user.create({ data: { id: ids[name], email: ids[name] + '@example.invalid', name: 'Grant ' + name, passwordHash: hash, role, mustChangePassword: false, aiDailyLimit: 5 } });
    const login = await request('/api/auth/login', 'POST', { email: ids[name] + '@example.invalid', password }); assert.equal(login.status, 200); cookies[name] = login.cookie;
  }
  const grant = (body: Record<string, unknown>, who = 'admin') => request('/api/admin/keys', 'POST', body, cookies[who]);

  await t.test('only an administrator can see or change grants', async () => {
    assert.equal((await grant({ label: 'x', apiKey: secret, userIds: [ids.a] }, 'a')).status, 403, 'a teacher cannot grant');
    assert.equal((await request('/api/admin/keys', 'GET', undefined, cookies.a)).status, 403, 'a teacher cannot list grants');
    assert.equal((await request('/api/admin/keys', 'DELETE', undefined, cookies.a)).status, 403);
    assert.equal((await request('/api/admin/keys')).status, 401, 'nobody signed in cannot either');
    assert.equal((await grant({ label: 'x', apiKey: 'short', userIds: [ids.a] })).status, 400, 'a key that is too short is refused');
    assert.equal((await grant({ label: 'x', apiKey: secret, userIds: [] })).status, 400, 'at least one recipient');
    assert.equal((await grant({ label: 'x', apiKey: secret, userIds: ['no-such-user'] })).status, 404, 'unknown recipients are refused whole');
    assert.equal(await db.userApiKey.count({ where: { grantId: { not: null }, userId: { in: Object.values(ids) } } }), 0, 'refusals create nothing');
    checks.push('admin-only');
  });

  let grantId = '';
  await t.test('a grant gives each chosen teacher their own encrypted copy and never returns the key', async () => {
    const made = await grant({ label: 'Khóa chung tổ Toán', apiKey: secret, userIds: [ids.a, ids.b] });
    assert.equal(made.status, 200, String(made.data.error)); assert.equal(made.data.added, 2); grantId = made.data.grantId;
    assert.ok(!JSON.stringify(made.data).includes(secret), 'the response never holds the key');
    const rows = await db.userApiKey.findMany({ where: { grantId } });
    assert.equal(rows.length, 2); assert.ok(rows.every(row => row.grantedById === ids.admin && row.isActive && !JSON.stringify(row).includes(secret)), 'only encrypted material is stored');
    assert.equal((await grant({ grantId, userIds: [ids.a] })).data.added, 0, 'giving it again to someone who has it adds nothing');
    const listed = await request('/api/admin/keys', 'GET', undefined, cookies.admin);
    assert.equal(listed.status, 200); assert.ok(!JSON.stringify(listed.data).includes(secret));
    assert.deepEqual(listed.data.grants[0].recipients.map((r: { userId: string }) => r.userId).sort(), [ids.a, ids.b].sort());
    const added = await grant({ grantId, userIds: [ids.c] });
    assert.equal(added.data.added, 1, 'a teacher can be added later without typing the key again');
    assert.equal(await db.userApiKey.count({ where: { grantId } }), 3);
    assert.ok(await db.auditLog.count({ where: { actorId: ids.admin, action: 'admin.key.grant' } }) >= 2, 'granting is recorded without the key');
    checks.push('grant-and-list');
  });

  await t.test('the recipient sees the key as granted and cannot read, switch off, delete or rename it, yet can add their own', async () => {
    const mine = await request('/api/user/keys', 'GET', undefined, cookies.a);
    assert.equal(mine.status, 200); const row = mine.data.keys.find((key: { granted: boolean }) => key.granted);
    assert.ok(row, 'the granted key is listed'); assert.equal(row.keyMasked, '', 'no part of the key is shown'); assert.ok(!JSON.stringify(mine.data).includes(secret));
    assert.equal((await request('/api/user/keys?id=' + row.id, 'DELETE', undefined, cookies.a)).status, 403, 'cannot delete');
    assert.equal((await request('/api/user/keys', 'PATCH', { id: row.id, isActive: false }, cookies.a)).status, 403, 'cannot switch off');
    assert.equal((await request('/api/user/keys', 'PATCH', { id: row.id, label: 'đổi tên' }, cookies.a)).status, 403, 'cannot rename');
    assert.equal(await db.userApiKey.count({ where: { id: row.id, isActive: true } }), 1, 'nothing changed');
    const own = await request('/api/user/keys', 'POST', { apiKey: 'own-key-0123456789abcdef', label: 'Khóa của tôi' }, cookies.a);
    assert.equal(own.status, 200, 'a teacher can still add a key of their own');
    assert.equal((await request('/api/user/keys?id=' + own.data.key.id, 'DELETE', undefined, cookies.a)).status, 200, 'and delete it');
    const stranger = await request('/api/user/keys', 'GET', undefined, cookies.admin);
    assert.ok(!stranger.data.keys.some((key: { granted: boolean }) => key.granted), 'the admin own list does not include other people grants');
    checks.push('recipient-view');
  });

  await t.test('the administrator can switch a grant off and on, and take it back from one teacher or from everyone', async () => {
    assert.equal((await request('/api/admin/keys', 'PATCH', { grantId, userId: ids.b, isActive: false }, cookies.admin)).status, 200);
    assert.equal((await db.userApiKey.findFirstOrThrow({ where: { grantId, userId: ids.b } })).isActive, false);
    assert.equal((await db.userApiKey.findFirstOrThrow({ where: { grantId, userId: ids.a } })).isActive, true, 'only the chosen teacher is switched off');
    assert.equal((await request('/api/admin/keys', 'PATCH', { grantId, isActive: true }, cookies.admin)).status, 200);
    assert.equal(await db.userApiKey.count({ where: { grantId, isActive: true } }), 3, 'switching on for everyone');
    assert.equal((await request(`/api/admin/keys?grantId=${grantId}&userId=${ids.c}`, 'DELETE', undefined, cookies.admin)).status, 200);
    assert.equal(await db.userApiKey.count({ where: { grantId } }), 2, 'taken back from one teacher');
    assert.equal((await request(`/api/admin/keys?grantId=${grantId}`, 'DELETE', undefined, cookies.admin)).status, 200);
    assert.equal(await db.userApiKey.count({ where: { grantId } }), 0, 'taken back from everyone: the rows are deleted');
    assert.equal((await request(`/api/admin/keys?grantId=${grantId}`, 'DELETE', undefined, cookies.admin)).status, 404, 'nothing left to take back');
    assert.equal((await request('/api/user/keys', 'GET', undefined, cookies.a)).data.keys.length, 0, 'the teacher no longer has it');
    checks.push('switch-and-revoke');
  });
});
