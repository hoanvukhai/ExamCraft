import assert from 'node:assert/strict';
import test from 'node:test';
import type { Prisma } from '@prisma/client';
import { loginBucket, reserveLoginAttempt, LOGIN_ATTEMPT_LIMIT, isSessionUsable, requestAuditIp } from '../src/lib/auth-security';
import prisma from '../src/lib/prisma';
import { createSession, deleteSession } from '../src/lib/auth';
import { logoutSession } from '../src/lib/auth-client';
import { accountFetch } from '../src/lib/account-fetch';

test('account fetch pins the UI owner, keeps other headers and refuses an uninitialized account before fetching', async () => {
  const original = globalThis.fetch; let calls = 0;
  globalThis.fetch = async (_input, init) => {
    calls++; const headers = new Headers(init?.headers);
    assert.equal(headers.get('x-examcraft-user'), 'old-ui-owner'); assert.equal(headers.get('Content-Type'), 'application/json');
    return Response.json({ ok: true });
  };
  try {
    assert.throws(() => accountFetch('', '/api/questions'), /tài khoản/); assert.equal(calls, 0);
    await accountFetch('old-ui-owner', '/api/questions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-examcraft-user': 'wrong-owner' }, body: '{}' });
    assert.equal(calls, 1);
  } finally { globalThis.fetch = original; }
});

test('client logout rejects server errors, incomplete acknowledgements and network failures', async () => {
  const original = globalThis.fetch;
  try {
    for (const response of [Response.json({ error: 'Không thể đăng xuất' }, { status: 500 }), Response.json({ success: false }), new Response('unreadable')]) {
      globalThis.fetch = async () => response;
      await assert.rejects(logoutSession('teacher-a'));
    }
    globalThis.fetch = async () => { throw Error('network'); };
    await assert.rejects(logoutSession('teacher-a'), /Chưa kết nối/);
  } finally { globalThis.fetch = original; }
});

test('client logout forwards the expected account and accepts only an acknowledged logout', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async (url, options) => { assert.equal(url, '/api/auth/logout'); assert.equal(options?.method, 'POST'); assert.equal(new Headers(options?.headers).get('x-examcraft-user'), 'teacher-a'); return Response.json({ success: true }); };
  try { await assert.doesNotReject(logoutSession('teacher-a')); } finally { globalThis.fetch = original; }
});

test('login rate buckets are normalized per account and reservations enforce a persistent limit regardless of IP changes', async () => {
  const rows: { action: string; targetId: string; createdAt: Date }[] = [];
  const tx = { $queryRaw: async () => [], auditLog: {
    count: async ({ where }: any) => rows.filter(row => row.action === where.action && row.targetId === where.targetId && row.createdAt >= where.createdAt.gte).length,
    create: async ({ data }: any) => { rows.push(data); return data; },
  } } as unknown as Prisma.TransactionClient;
  assert.equal(loginBucket(' A@EXAMPLE.test '), loginBucket('a@example.test'));
  assert.notEqual(loginBucket('a@example.test'), loginBucket('b@example.test'));
  const now = new Date('2026-10-22T01:00:00Z');
  for (let i = 0; i < LOGIN_ATTEMPT_LIMIT; i++) assert.equal((await reserveLoginAttempt(tx, 'a@example.test', `spoofed-${i}`, now)).allowed, true);
  assert.equal((await reserveLoginAttempt(tx, 'a@example.test', 'new-ip', now)).allowed, false);
  assert.equal((await reserveLoginAttempt(tx, 'b@example.test', 'same-ip', now)).allowed, true);
  assert.equal((await reserveLoginAttempt(tx, 'a@example.test', 'same-ip', new Date(now.getTime() + 15 * 60000 + 1))).allowed, true);
  const failedBucket = loginBucket('failed@example.test');
  for (let i = 0; i < 5; i++) rows.push({ action: 'user.login_failed', targetId: failedBucket, createdAt: now });
  assert.equal((await reserveLoginAttempt(tx, 'failed@example.test', 'any-ip', now)).allowed, false);
});
test('failed durable rate-limit storage fails closed rather than bypassing limits', async () => {
  const tx = { $queryRaw: async () => { throw new Error('DB offline'); } } as unknown as Prisma.TransactionClient;
  await assert.rejects(reserveLoginAttempt(tx, 'a@example.test', 'local'), /DB offline/);
});
test('proxy headers are not trusted by default and invalid IPs are not persisted as trusted addresses', () => {
  const previous = process.env.TRUST_PROXY_HEADERS;
  try {
    delete process.env.TRUST_PROXY_HEADERS;
    assert.equal(requestAuditIp(new Headers({ 'x-forwarded-for': '1.2.3.4' })), 'local');
    process.env.TRUST_PROXY_HEADERS = 'true';
    assert.equal(requestAuditIp(new Headers({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' })), '1.2.3.4');
    assert.equal(requestAuditIp(new Headers({ 'x-forwarded-for': 'fake-address' })), 'unknown');
  } finally { if (previous === undefined) delete process.env.TRUST_PROXY_HEADERS; else process.env.TRUST_PROXY_HEADERS = previous; }
});
test('session usability rejects the exact expiry boundary and disabled accounts', () => {
  const now = new Date('2026-10-22T01:00:00Z');
  assert.equal(isSessionUsable(null, now), false);
  assert.equal(isSessionUsable({ expiresAt: now, user: { isActive: true } }, now), false);
  assert.equal(isSessionUsable({ expiresAt: new Date(now.getTime() + 1), user: { isActive: false } }, now), false);
  assert.equal(isSessionUsable({ expiresAt: new Date(now.getTime() + 1), user: { isActive: true } }, now), true);
});
test('session issuance checks the current active account and password hash under the user lock', async () => {
  const previous = prisma.$transaction;
  let active = true, hash = 'current-hash', created = 0, locked = false;
  (prisma as any).$transaction = async (operation: any) => operation({
    $queryRaw: async () => { locked = true; return []; },
    user: { findUnique: async () => { assert.equal(locked, true); return { isActive: active, passwordHash: hash }; } },
    session: { create: async () => { created++; } },
  });
  try {
    await createSession('user', 'current-hash'); assert.equal(created, 1);
    hash = 'reset-hash'; await assert.rejects(createSession('user', 'current-hash'), /UNAUTHORIZED/);
    active = false; await assert.rejects(createSession('user', 'reset-hash'), /UNAUTHORIZED/);
    assert.equal(created, 1);
  } finally { prisma.$transaction = previous; }
});
test('logout server revocation is idempotent and propagates DB failures', async () => {
  const previous = prisma.session.deleteMany;
  let supplied: unknown;
  (prisma.session as any).deleteMany = async (input: unknown) => { supplied = input; return { count: 0 }; };
  try {
    await deleteSession('revoked-token'); assert.deepEqual(supplied, { where: { token: 'revoked-token' } });
    (prisma.session as any).deleteMany = async () => { throw new Error('DB unavailable'); };
    await assert.rejects(deleteSession('current-token'), /DB unavailable/);
  } finally { prisma.session.deleteMany = previous; }
});
