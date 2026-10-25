import { writeQaReport } from './helpers/qa-report';
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { requireTestDatabase } from './helpers/test-database';

test('imported bank saves are private, nonshareable and idempotent after a lost receipt', { timeout: 60000 }, async t => {
  const origin = 'http://127.0.0.1:3117';
  assert.equal((await (await fetch(origin + '/api/health')).json()).isolatedTest, true);
  const db = new PrismaClient({ datasources: { db: { url: requireTestDatabase() } } });
  const ownerId = 'bank_receipt_' + randomUUID(), password = 'fixture-' + randomUUID();
  t.after(async () => { await db.question.deleteMany({ where: { ownerId } }); await db.passage.deleteMany({ where: { ownerId } }); await db.auditLog.deleteMany({ where: { actorId: ownerId } }); await db.user.deleteMany({ where: { id: ownerId } }); await db.$disconnect(); });
  await db.user.create({ data: { id: ownerId, name: 'Bank receipt fixture', email: ownerId + '@example.invalid', passwordHash: await bcrypt.hash(password, 10), mustChangePassword: false } });
  const login = await fetch(origin + '/api/auth/login', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: ownerId + '@example.invalid', password }) });
  assert.equal(login.status, 200);
  const cookie = login.headers.getSetCookie().map(item => item.split(';')[0]).join('; ');
  const body = { requestId: randomUUID(), subject: 'toan', grade: 6, type: 'SHORT_ANSWER', difficulty: 'THONG_HIEU', content: 'Imported private fixture', source: 'Word (.docx) · sample.docx · câu 1', sourceKind: 'IMPORTED_FILE', shareable: true, visibility: 'SHARED', payload: { correct: '12' }, passage: { content: 'Private passage fixture' } };
  const post = (value: unknown) => fetch(origin + '/api/questions', { method: 'POST', headers: { Origin: origin, Cookie: cookie, 'Content-Type': 'application/json' }, body: JSON.stringify(value) });
  const first = await post(body); assert.equal(first.status, 200); const id = (await first.json()).question.id as string;
  // Discard the first receipt, retry the same operation concurrently as a network retry would.
  const retries = await Promise.all([post(body), post(body)]);
  for (const retry of retries) { assert.equal(retry.status, 200); assert.equal((await retry.json()).question.id, id); }
  const row = await db.question.findUniqueOrThrow({ where: { id } });
  assert.equal(row.visibility, 'PRIVATE'); assert.equal(row.shareable, false); assert.equal(row.source, body.source);
  assert.equal(await db.question.count({ where: { ownerId } }), 1); assert.equal(await db.passage.count({ where: { ownerId } }), 1);
  assert.equal(await db.questionRevision.count({ where: { questionId: id } }), 1);
  assert.equal((await post({ ...body, content: 'Different body, same receipt' })).status, 409);
  const shared = await fetch(origin + '/api/questions/shared', { headers: { Cookie: cookie } });
  assert.equal(shared.status, 200); assert.ok(!(await shared.json()).questions.some((q: { id: string }) => q.id === id));
  const enabled = await fetch(origin + '/api/questions/' + id, { method: 'PATCH', headers: { Origin: origin, Cookie: cookie, 'Content-Type': 'application/json' }, body: JSON.stringify({ baseVersion: row.version, shareable: true }) });
  assert.equal(enabled.status, 200); const optedIn = (await enabled.json()).question;
  assert.equal(optedIn.shareable, true); assert.equal(optedIn.visibility, 'PRIVATE');
  writeQaReport('qa/rebuild-2026-10-25/s2-s4-http-bank.json', JSON.stringify({ status: 'PASS', private: true, shareable: false, retryCount: 2, questions: 1, passages: 1, revisions: 1, changedBodyStatus: 409, realAiCalls: false }, null, 2));
});
