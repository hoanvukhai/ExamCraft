import { writeQaReport } from './helpers/qa-report';
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import { requireTestDatabase } from './helpers/test-database';

// AI routes talk to a local imitation of the provider (the isolated test server is started with GOOGLE_GEMINI_BASE_URL pointing here).
// Nothing in this file reaches the real service.
const db = new PrismaClient({ datasources: { db: { url: requireTestDatabase() } }, log: [] });
const origin = 'http://127.0.0.1:3117';
type Seen = { method: string; path: string; key: string };
const seen: Seen[] = [];
let behave: (key: string) => { status: number; body: unknown; delayMs?: number } = () => ({ status: 200, body: {} });
const imported = { questions: [{ type: 'multiple_choice', difficulty: 'thong_hieu', content: 'AI MOCK Q', choices: ['A', 'B', 'C', 'D'].map(key => ({ key, text: key })), correct_answer: 'A', points: 1 }], passages: [], warnings: [] };
const reply = (text: string) => ({ candidates: [{ content: { role: 'model', parts: [{ text }] }, finishReason: 'STOP' }], usageMetadata: { promptTokenCount: 5, candidatesTokenCount: 5, totalTokenCount: 10 } });
const ok = () => ({ status: 200, body: reply(JSON.stringify(imported)) });
const provider = http.createServer((req, res) => {
  req.on('data', () => {}); req.on('end', () => {
    const key = String(req.headers['x-goog-api-key'] ?? ''); seen.push({ method: req.method ?? '', path: req.url ?? '', key });
    const result = req.url?.startsWith('/v1beta/models?') ? { status: 200, body: { models: [{ name: 'models/gemini-3.5-flash', displayName: 'Gemini 3.5 Flash', supportedGenerationMethods: ['generateContent'] }] } } : behave(key);
    const send = () => { res.statusCode = result.status; res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(result.body)); };
    const timer = setTimeout(send, 'delayMs' in result ? result.delayMs ?? 0 : 0); res.on('close', () => clearTimeout(timer));
  });
});

async function request(path: string, method = 'GET', body?: unknown, cookie = '') {
  const response = await fetch(origin + path, { method, headers: { Origin: origin, ...(cookie ? { Cookie: cookie } : {}), ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) }, body: body === undefined ? undefined : JSON.stringify(body) });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- loose JSON response in a test helper
  return { status: response.status, data: await response.json().catch(() => ({})) as Record<string, any>, cookie: response.headers.getSetCookie().map(value => value.split(';')[0]).join('; ') };
}

test('AI routes use only the caller key, count usage per key id, fail honestly and never leak or invent', { timeout: 120000 }, async t => {
  assert.equal((await request('/api/health')).data.isolatedTest, true, 'Refusing writes without proof of isolated server.');
  await new Promise<void>((resolve, reject) => { provider.once('error', reject); provider.listen(3118, '127.0.0.1', resolve); });
  const run = randomUUID(), password = 'fixture-' + run, hash = await bcrypt.hash(password, 10), checks: string[] = [];
  const ids = { a: 'aimock_a_' + run, b: 'aimock_b_' + run, q: 'aimock_q_' + run };
  t.after(async () => {
    try {
      provider.close();
      const all = Object.values(ids);
      await db.aiUsageLog.deleteMany({ where: { userId: { in: all } } });
      await db.userApiKey.deleteMany({ where: { userId: { in: all } } });
      await db.auditLog.deleteMany({ where: { actorId: { in: all } } });
      await db.user.deleteMany({ where: { id: { in: all } } });
      const directory = `qa/rebuild-${new Date().toISOString().slice(0, 10)}`;
      fs.mkdirSync(directory, { recursive: true });
      writeQaReport(`${directory}/http_ai_mock.json`, JSON.stringify({ checkedAt: new Date().toISOString(), checks, cleanupComplete: true, status: checks.length === 11 ? 'PASS' : 'INCOMPLETE', environment: 'isolated localhost:3117 with a local provider imitation on 3118', realAiCalls: false }, null, 2));
    } finally { await db.$disconnect(); }
  });
  const cookies: Record<string, string> = {};
  for (const [name, id, limit] of [['a', ids.a, 20], ['b', ids.b, 20], ['q', ids.q, 2]] as const) {
    await db.user.create({ data: { id, email: id + '@example.invalid', name: 'AI mock ' + name, passwordHash: hash, mustChangePassword: false, aiDailyLimit: limit } });
    const login = await request('/api/auth/login', 'POST', { email: id + '@example.invalid', password }); assert.equal(login.status, 200); cookies[name] = login.cookie;
  }
  const parse = (who: string, extra: Record<string, unknown> = {}) => request('/api/parse-exam-text', 'POST', { rawText: 'Câu 1: Một cộng một?\nA. 1\nB. 2\nC. 3\nD. 4', ...extra }, cookies[who]);
  const addKey = async (who: string, apiKey: string, label = 'Khóa thử') => { const r = await request('/api/user/keys', 'POST', { apiKey, label }, cookies[who]); assert.equal(r.status, 200, String(r.data.error)); return r.data.key.id as string; };
  const reset = (next: typeof behave = ok) => { seen.length = 0; behave = next; };


  await t.test('aborting a slow provider request records cancellation without saving or retrying keys', async () => {
    reset(() => ({ ...ok(), delayMs: 15000 }));
    const controller = new AbortController();
    const pending = fetch(origin + '/api/parse-exam-text', { method: 'POST', signal: controller.signal, headers: { Origin: origin, Cookie: cookies.a, 'Content-Type': 'application/json' }, body: JSON.stringify({ rawText: 'Câu 1: Tính hai cộng hai.', customApiKey: 'cancel-fixture-key-0123456789' }) });
    const rejected = assert.rejects(pending, { name: 'AbortError' });
    const deadline = Date.now() + 10000;
    while (seen.length < 1 && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 50));
    assert.equal(seen.length, 1); controller.abort(); await rejected;
    let log;
    while (Date.now() < deadline) { log = await db.aiUsageLog.findFirst({ where: { userId: ids.a, httpStatus: 499 } }); if (log) break; await new Promise(resolve => setTimeout(resolve, 100)); }
    assert.ok(log, 'cancellation is finalized as 499, not success or a pending reservation');
    assert.equal(await db.question.count({ where: { ownerId: ids.a } }), 0);
    assert.equal(seen.length, 1, 'no automatic retry after cancellation'); checks.push('cancelled-no-save-no-retry'); reset();
  });
  await t.test('no key means no provider call and a clear message', async () => {
    reset(); const r = await parse('a');
    assert.equal(r.status, 401); assert.match(String(r.data.error), /API Key|khóa/i); assert.equal(seen.length, 0, 'nothing reached the provider');
    checks.push('no-key-no-call');
  });

  await t.test('a temporary key is used for that request only and is never stored or echoed', async () => {
    reset(); const temp = 'temp-key-0123456789abcdef';
    const r = await parse('a', { customApiKey: temp });
    assert.equal(r.status, 200, String(r.data.error)); assert.equal(r.data.questions.length, 1); assert.equal(r.data.questions[0].content, 'AI MOCK Q');
    assert.equal(r.data.questions[0].verifiedBy, 'none', 'an AI answer is never marked as verified'); assert.equal(r.data.questions[0].status, 'draft');
    assert.deepEqual(seen.map(s => s.key), [temp]); assert.ok(!JSON.stringify(r.data).includes(temp), 'the key is not echoed');
    assert.equal(await db.userApiKey.count({ where: { userId: ids.a } }), 0, 'a temporary key is not saved');
    checks.push('temporary-key');
  });

  await t.test('a stored key is used, listed without its secret, counted by id, and the usage list hides it too', async () => {
    reset(); const secret = 'stored-key-0123456789abcdef'; const keyId = await addKey('a', secret);
    const r = await parse('a'); assert.equal(r.status, 200, String(r.data.error)); assert.deepEqual(seen.map(s => s.key), [secret]);
    const list = await request('/api/user/keys', 'GET', undefined, cookies.a);
    assert.ok(!JSON.stringify(list.data).includes(secret), 'the key list never carries the secret');
    assert.equal(list.data.keys.find((key: { id: string }) => key.id === keyId).usedToday, 1, 'usage is counted by key id');
    const usage = await request('/api/user/ai-usage', 'GET', undefined, cookies.a);
    assert.ok(!JSON.stringify(usage.data).includes(secret)); assert.ok(usage.data.logs.some((log: { keyAlias: string; endpoint: string; httpStatus: number }) => log.keyAlias === 'user_key:' + keyId && log.endpoint === 'exam.parse' && log.httpStatus === 200));
    assert.equal(list.data.poolQuota.source, 'application', 'the application limit is not presented as the provider quota'); assert.equal(list.data.providerQuota, null);
    checks.push('stored-key-and-usage');
  });

  await t.test('a key the provider rejects is switched off, the caller gets an honest error, and no fake result appears', async () => {
    reset(() => ({ status: 400, body: { error: { code: 400, message: 'API key not valid. Please pass a valid API key.', status: 'INVALID_ARGUMENT' } } }));
    const badId = await addKey('b', 'bad-key-0123456789abcdef'); const r = await parse('b');
    assert.ok(r.status >= 400 && r.status < 600); assert.notEqual(r.data.success, true); assert.equal(r.data.questions, undefined, 'no questions are invented when the provider fails');
    assert.equal((await db.userApiKey.findUniqueOrThrow({ where: { id: badId } })).isActive, false, 'an invalid key is disabled');
    const after = await parse('b'); assert.equal(after.status, 401, 'with its only key off the caller is told to add one'); assert.equal(seen.length, 1, 'the disabled key is not tried again');
    checks.push('invalid-key-disabled');
  });

  await t.test('a rate-limited key falls back to the next of the same user, and other users keys are never used', async () => {
    reset(key => key.startsWith('limited') ? { status: 429, body: { error: { code: 429, message: 'RESOURCE_EXHAUSTED quota', status: 'RESOURCE_EXHAUSTED' } } } : ok());
    await db.userApiKey.deleteMany({ where: { userId: ids.a } });
    await addKey('a', 'limited-key-0123456789ab', 'Hết hạn mức'); await addKey('a', 'good-key-0123456789abcdef', 'Còn hạn mức');
    const r = await parse('a'); assert.equal(r.status, 200, String(r.data.error));
    assert.ok(seen.every(s => s.key !== 'stored-key-0123456789abcdef' && s.key !== 'bad-key-0123456789abcdef'), 'only this user keys were tried');
    assert.ok(seen.map(s => s.key).includes('good-key-0123456789abcdef'), 'the working key answered');
    assert.equal(await db.userApiKey.count({ where: { userId: ids.a, isActive: true } }), 2, 'a rate limit does not switch a key off');
    reset(); await db.userApiKey.deleteMany({ where: { userId: ids.b } }); assert.equal((await parse('b')).status, 401, 'user B has no key and cannot borrow the keys of A'); assert.equal(seen.length, 0);
    checks.push('rate-limit-fallback-and-isolation');
  });

  await t.test('the application daily limit stops calls before the provider and is not described as the provider limit', async () => {
    reset(); await addKey('q', 'quota-key-0123456789abcdef');
    assert.equal((await parse('q')).status, 200); assert.equal((await parse('q')).status, 200);
    const third = await parse('q'); assert.ok([403, 429].includes(third.status), `third call refused (${third.status})`); assert.match(String(third.data.error), /ứng dụng/);
    assert.equal(seen.length, 2, 'the refused call never reached the provider');
    checks.push('daily-limit');
  });

  await t.test('keys can be switched off and on, the model choice reaches the provider, and more keys never raise the application limit', async () => {
    reset(); await db.userApiKey.deleteMany({ where: { userId: ids.b } });
    const first = await addKey('b', 'first-key-0123456789abcdef', 'Khóa một'), second = await addKey('b', 'second-key-0123456789abcdef', 'Khóa hai');
    const list = await request('/api/user/keys', 'GET', undefined, cookies.b);
    assert.equal(list.data.poolQuota.limit, 20, 'two keys are still one application limit'); assert.equal(list.data.poolQuota.activeKeyCount, 2);
    assert.equal((await request('/api/user/keys', 'PATCH', { id: first, isActive: false }, cookies.b)).status, 200);
    assert.equal((await parse('b')).status, 200); assert.deepEqual([...new Set(seen.map(s => s.key))], ['second-key-0123456789abcdef'], 'a switched-off key is not used');
    assert.equal((await request('/api/user/keys', 'PATCH', { id: first, label: 'Đổi tên' }, cookies.b)).status, 200);
    assert.equal((await db.userApiKey.findUniqueOrThrow({ where: { id: first } })).label, 'Đổi tên');
    assert.equal((await request('/api/user/keys', 'PATCH', { id: first, isActive: false }, cookies.a)).status, 404, 'another user cannot change it');
    reset(); assert.equal((await request('/api/user/keys', 'PATCH', { action: 'set_model', model: 'gemini-3.6-flash' }, cookies.b)).status, 200);
    assert.equal((await parse('b')).status, 200); assert.ok(seen[0].path.includes('models/gemini-3.6-flash:generateContent'), 'the chosen model is the one asked for');
    assert.equal((await request('/api/user/keys', 'PATCH', { action: 'set_model', model: '../evil model' }, cookies.b)).status, 400);
    await db.userApiKey.deleteMany({ where: { id: { in: [first, second] } } });
    checks.push('choose-and-model');
  });

  await t.test('text that is not JSON from the provider is reported as the provider fault, not the request, and nothing is saved', async () => {
    reset(() => ({ status: 200, body: reply('Xin lỗi, tôi không thể trả lời bằng JSON.') }));
    const r = await parse('a', { customApiKey: 'garbage-key-0123456789abcdef' });
    assert.equal(r.status, 502); assert.equal(r.data.code, 'AI_BAD_OUTPUT'); assert.match(String(r.data.error), /AI trả về/); assert.equal(r.data.questions, undefined);
    assert.equal(seen.length, 1, 'no retry loop');
    checks.push('bad-output');
  });

  await t.test('generated exams must match the plan exactly; extra, missing or unanswered questions are refused and nothing is applied', async () => {
    const params = { subject: 'toan', grade: 6, topic: 'Cộng phân số', durationMinutes: 15, numMultipleChoice: 1, numTrueFalse: 0, numShortAnswer: 0, numEssay: 0 };
    const mcq = (n: number, extra: Record<string, unknown> = {}) => ({ type: 'multiple_choice', difficulty: 'thong_hieu', content: `AI Q${n}`, choices: [{ key: 'A', text: '1' }, { key: 'B', text: '2' }], correct_answer: 'A', step_by_step_solution: 'x', ...extra });
    const tf = { type: 'true_false_group', difficulty: 'thong_hieu', content: 'AI TF', sub_questions: [{ key: 'a', content: 'Một', isCorrect: true }, { key: 'b', content: 'Hai', isCorrect: false }], step_by_step_solution: 'x' };
    const generate = (questions: unknown[], plan: Record<string, unknown> = params) => { reset(() => ({ status: 200, body: reply(JSON.stringify({ title: 'Đề nháp AI', questions })) })); return request('/api/generate-exam', 'POST', { params: plan, customApiKey: 'gen-key-0123456789abcdef' }, cookies.a); };
    const good = await generate([mcq(1)]);
    assert.equal(good.status, 200, String(good.data.error)); assert.equal(good.data.exam.questions.length, 1); assert.equal(good.data.isFallback, false);
    assert.match(String(good.data.warnings[0]), /cần kiểm/); assert.notEqual(good.data.exam.questions[0].verifiedBy, 'human', 'AI output is never marked as checked by a person');
    for (const [name, questions, plan, message] of [
      ['an extra type the plan set to zero', [mcq(1), tf], params, /true_false_group/],
      ['fewer questions than the plan', [mcq(1)], { ...params, numMultipleChoice: 2 }, /multiple_choice/],
      ['a choice question without a valid answer', [mcq(1, { correct_answer: undefined })], params, /đáp án/],
      ['duplicate choice keys', [mcq(1, { choices: [{ key: 'A', text: '1' }, { key: 'A', text: '2' }] })], params, /trùng/],
    ] as const) {
      const r = await generate([...questions], { ...plan });
      assert.equal(r.status, 422, `${name} is refused`); assert.notEqual(r.data.success, true); assert.equal(r.data.exam, undefined, `${name}: nothing is applied`); assert.match(String(r.data.error), message); assert.equal(seen.length, 1, `${name}: no retry`);
    }
    checks.push('generation-matches-plan');
  });

  await t.test('provider errors are reported without retry storms; testing a key reads only the model list; keys of others cannot be tested', async () => {
    reset(() => ({ status: 503, body: { error: { code: 503, message: 'unavailable', status: 'UNAVAILABLE' } } }));
    await db.userApiKey.deleteMany({ where: { userId: ids.a } }); const flakyId = await addKey('a', 'flaky-key-0123456789abcdef');
    const r = await parse('a'); assert.equal(r.status, 503); assert.equal(seen.length, 1, 'one provider failure is one request, not a loop');
    assert.equal((await db.userApiKey.findUniqueOrThrow({ where: { id: flakyId } })).isActive, true, 'an outage does not switch the key off');
    reset(); const test = await request('/api/user/keys/test', 'POST', { keyId: flakyId }, cookies.a);
    assert.equal(test.data.success, true); assert.deepEqual(seen.map(s => `${s.method} ${s.path.split('?')[0]}`), ['GET /v1beta/models'], 'a key test only lists models; it generates nothing');
    assert.equal((await request('/api/user/keys/test', 'POST', { keyId: flakyId }, cookies.b)).status, 404, 'user B cannot test the key of A');
    assert.equal((await request('/api/user/keys?id=' + flakyId, 'DELETE', undefined, cookies.b)).status, 404, 'nor delete it');
    assert.equal((await request('/api/user/keys?id=' + flakyId, 'DELETE', undefined, cookies.a)).status, 200);
    checks.push('outage-test-delete');
  });
});
