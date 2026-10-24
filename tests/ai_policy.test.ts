import assert from 'node:assert/strict';
import test from 'node:test';
import prisma from '../src/lib/prisma';
import { applicationQuota, applicationDayStart, classifyProviderFailure, normalizeModelId, requestApiKey } from '../src/lib/ai-policy';
import { executeWithKeyRotation, AiRequestError, checkUserAiQuota } from '../src/lib/gemini-keys';
import { encryptApiKey, decryptApiKey } from '../src/lib/crypto';

test('provider status never implies a free/paid tier or permanently disables a permission-denied key', () => {
  for (const status of [400, 403, 404, 429, 503]) {
    const failure = classifyProviderFailure({ status, message: 'Fixture error' });
    assert.equal(failure.disableKey, false);
    assert.equal(failure.status, status);
  }
  assert.equal(classifyProviderFailure(new Error('API_KEY_INVALID')).disableKey, true);
  assert.equal(classifyProviderFailure({ status: 429 }).code, 'RATE_LIMITED');
  assert.equal(classifyProviderFailure({ status: 404 }).retryAnotherKey, false);
});

test('temporary key aliases agree or reject conflict and model ids permit new provider models without URL injection', () => {
  assert.equal(requestApiKey({ customApiKey: ' fixture-key ', userApiKey: 'fixture-key' }), 'fixture-key');
  assert.equal(requestApiKey({}), undefined);
  assert.throws(() => requestApiKey({ customApiKey: 'a', apiKey: 'b' }), /CONFLICT/);
  assert.throws(() => requestApiKey({ userApiKey: 123 }), /INVALID/);
  assert.equal(normalizeModelId('models/gemini-fixture-2030'), 'gemini-fixture-2030');
  assert.equal(normalizeModelId('https://example.com/model?key=secret'), null);
  assert.equal(normalizeModelId('../secret'), null);
});

test('application quota is configured independently from the number of provider keys', () => {
  assert.deepEqual(applicationQuota(2, 2), { allowed: false, limit: 2, used: 2, remaining: 0, percentageUsed: 100 });
  assert.equal(applicationQuota(0, 0).allowed, false);
  assert.equal(applicationDayStart(new Date('2026-10-22T23:01:00Z')).toISOString(), '2026-10-22T00:00:00.000Z');
});

test('AI operation rejects missing user context before any provider callback', async () => {
  let called = false;
  await assert.rejects(executeWithKeyRotation('fixture-key', async () => { called = true; return 'unexpected'; }), (error: unknown) => error instanceof AiRequestError && error.status === 401);
  assert.equal(called, false);
});

test('successful generation is not repeated when usage logging fails; temporary key and chosen model are preserved', async () => {
  const transaction = prisma.$transaction;
  const update = prisma.aiUsageLog.update;
  let calls = 0;
  prisma.$transaction = (async (callback: (tx: unknown) => Promise<unknown>) => callback({
    user: { findUnique: async () => ({ isActive: true, mustChangePassword: false, aiDailyLimit: 2, selectedAiModel: 'gemini-fixture-model' }) },
    aiUsageLog: { count: async () => 0, create: async () => ({ id: 'fixture-reservation' }) },
  })) as unknown as typeof prisma.$transaction;
  prisma.aiUsageLog.update = (async () => { throw new Error('fixture logging unavailable'); }) as unknown as typeof prisma.aiUsageLog.update;
  try {
    const result = await executeWithKeyRotation('temporary-fixture-key', async (key, model) => {
      calls++; assert.equal(key, 'temporary-fixture-key'); assert.equal(model, 'gemini-fixture-model'); return 'generated-once';
    }, { userId: 'fixture-user', endpoint: 'test.only' });
    assert.equal(result, 'generated-once');
    assert.equal(calls, 1);
  } finally { prisma.$transaction = transaction; prisma.aiUsageLog.update = update; }
});

test('local quota reports the application cap and unknown provider capacity', async () => {
  const user = prisma.user.findUnique, count = prisma.aiUsageLog.count, keys = prisma.userApiKey.count;
  prisma.user.findUnique = (async () => ({ aiDailyLimit: 7 })) as unknown as typeof prisma.user.findUnique;
  prisma.aiUsageLog.count = (async () => 2) as unknown as typeof prisma.aiUsageLog.count;
  prisma.userApiKey.count = (async () => 100) as unknown as typeof prisma.userApiKey.count;
  try {
    const quota = await checkUserAiQuota('fixture-user');
    assert.equal(quota.limit, 7); assert.equal(quota.remaining, 5); assert.equal(quota.providerQuota, null); assert.equal(quota.activeKeyCount, 100);
  } finally { prisma.user.findUnique = user; prisma.aiUsageLog.count = count; prisma.userApiKey.count = keys; }
});

test('saved-key retry stays within the owner and preserves the requested model', async () => {
  const transaction = prisma.$transaction, findKeys = prisma.userApiKey.findMany, updateKey = prisma.userApiKey.updateMany, updateLog = prisma.aiUsageLog.update;
  const previousSecret = process.env.SESSION_SECRET;
  process.env.SESSION_SECRET = 'fixture-encryption-secret-retry-only';
  const savedKeys = ['one', 'two'].map(id => ({ id, ...encryptApiKey('fixture-key-' + id) }));
  let calls = 0;
  const logged: unknown[] = [];
  prisma.$transaction = (async (callback: (tx: unknown) => Promise<unknown>) => callback({ user: { findUnique: async () => ({ isActive: true, mustChangePassword: false, aiDailyLimit: 2, selectedAiModel: 'gemini-selected-model' }) }, aiUsageLog: { count: async () => 0, create: async () => ({ id: 'fixture-operation' }) } })) as unknown as typeof prisma.$transaction;
  prisma.userApiKey.findMany = (async (query: { where: { userId: string } }) => { assert.equal(query.where.userId, 'owner-only'); return savedKeys; }) as unknown as typeof prisma.userApiKey.findMany;
  prisma.userApiKey.updateMany = (async (query: { where: { userId: string }; data: unknown }) => { assert.equal(query.where.userId, 'owner-only'); return { count: 1 }; }) as unknown as typeof prisma.userApiKey.updateMany;
  prisma.aiUsageLog.update = (async (query: { data: unknown }) => { logged.push(query.data); return {}; }) as unknown as typeof prisma.aiUsageLog.update;
  try {
    assert.equal(await executeWithKeyRotation(undefined, async (key, model) => { calls++; assert.equal(model, 'gemini-selected-model'); if (key.endsWith('one')) throw Object.assign(new Error('fixture quota'), { status: 429 }); return 'result-two'; }, { userId: 'owner-only' }), 'result-two');
    assert.equal(calls, 2);
    assert.deepEqual((logged[0] as { keyAlias: string }).keyAlias, 'user_key:two');
  } finally {
    prisma.$transaction = transaction; prisma.userApiKey.findMany = findKeys; prisma.userApiKey.updateMany = updateKey; prisma.aiUsageLog.update = updateLog;
    if (previousSecret === undefined) delete process.env.SESSION_SECRET; else process.env.SESSION_SECRET = previousSecret;
  }
});

test('key encryption preserves existing derivation and refuses an absent secret', () => {
  const previous = process.env.SESSION_SECRET;
  process.env.SESSION_SECRET = 'fixture-encryption-secret-not-real-data';
  try {
    const encrypted = encryptApiKey('fixture-api-key-value');
    assert.equal(decryptApiKey(encrypted.keyEncrypted, encrypted.keyIv, encrypted.keyTag), 'fixture-api-key-value');
    delete process.env.SESSION_SECRET;
    assert.throws(() => encryptApiKey('fixture-api-key-value'), /SESSION_SECRET_REQUIRED/);
  } finally { if (previous === undefined) delete process.env.SESSION_SECRET; else process.env.SESSION_SECRET = previous; }
});
