import { writeQaReport } from './helpers/qa-report';
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import { requireTestDatabase } from './helpers/test-database';

const db = new PrismaClient({ datasources: { db: { url: requireTestDatabase() } }, log: [] });
const origin = 'http://127.0.0.1:3117';
async function request(path: string, method = 'GET', body?: unknown, cookie = '') {
  const response = await fetch(origin + path, { method, headers: { Origin: origin, ...(cookie ? { Cookie: cookie } : {}), ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: response.status, data: await response.json().catch(() => ({})), cookie: response.headers.getSetCookie().map(value => value.split(';')[0]).join('; ') };
}
type Doc = { version: number; questions: { id: string; content: string }[]; metadata: Record<string, unknown> };

test('two people editing different questions never lose work, and history can restore any version', { timeout: 120000 }, async t => {
  assert.equal((await request('/api/health')).data.isolatedTest, true, 'Refusing writes without proof of isolated server.');
  const run = randomUUID(), ownerId = 'restore_owner_' + run, editorId = 'restore_editor_' + run, checks: string[] = [];
  t.after(async () => {
    try {
      await db.exam.deleteMany({ where: { ownerId } });
      await db.question.deleteMany({ where: { ownerId } });
      await db.auditLog.deleteMany({ where: { actorId: { in: [ownerId, editorId] } } });
      await db.user.deleteMany({ where: { id: { in: [ownerId, editorId] } } });
      const directory = `qa/rebuild-${new Date().toISOString().slice(0, 10)}`;
      fs.mkdirSync(directory, { recursive: true });
      writeQaReport(`${directory}/http_collab_restore.json`, JSON.stringify({ checkedAt: new Date().toISOString(), checks, cleanupComplete: true, status: checks.length === 3 ? 'PASS' : 'INCOMPLETE', environment: 'isolated localhost:3117', realAiCalls: false }, null, 2));
    } finally { await db.$disconnect(); }
  });
  const password = 'fixture-' + randomUUID(), hash = await bcrypt.hash(password, 10);
  const cookies: Record<string, string> = {};
  for (const [name, id] of [['owner', ownerId], ['editor', editorId]] as const) {
    await db.user.create({ data: { id, email: id + '@example.invalid', name: 'Restore ' + name, passwordHash: hash, mustChangePassword: false, aiDailyLimit: 0 } });
    const login = await request('/api/auth/login', 'POST', { email: id + '@example.invalid', password }); assert.equal(login.status, 200); cookies[name] = login.cookie;
  }
  const question = (id: string, content: string) => ({ id, type: 'short_answer', difficulty: 'thong_hieu', content, correct_answer: '1', accepted_answers: ['1'], points: 1, step_by_step_solution: 'x' });
  const created = await request('/api/exams', 'POST', { document: { id: 'draft_' + run, metadata: { title: 'Restore fixture', subject: 'toan', grade: 6, durationMinutes: 15, schoolName: '', departmentName: '' }, questions: [question('q1', 'Câu 1 gốc'), question('q2', 'Câu 2 gốc')], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } }, cookies.owner);
  assert.equal(created.status, 200, created.data.error);
  const id = created.data.document.id as string;
  assert.equal((await request(`/api/exams/${id}/collaborators`, 'POST', { email: editorId + '@example.invalid', role: 'EDITOR' }, cookies.owner)).status, 200);
  const read = async (who: string) => (await request(`/api/exams/${id}`, 'GET', undefined, cookies[who])).data.document as Doc;
  const change = (doc: Doc, questionId: string, content: string): Doc => ({ ...doc, questions: doc.questions.map(q => q.id === questionId ? { ...q, content } : q) });
  const save = (who: string, doc: Doc) => request(`/api/exams/${id}`, 'PATCH', { baseVersion: doc.version, document: doc }, cookies[who]);
  const base = await read('owner'), baseVersion = base.version;

  await t.test('different questions from the same base: one wins, the other is refused whole and nothing is half applied', async () => {
    const [editor, owner] = [await save('editor', change(base, 'q1', 'Câu 1 do người cùng sửa')), await save('owner', change(base, 'q2', 'Câu 2 do chủ đề sửa'))];
    assert.deepEqual([editor.status, owner.status], [200, 409]);
    const stored = await read('owner');
    assert.equal(stored.questions.find(q => q.id === 'q1')!.content, 'Câu 1 do người cùng sửa');
    assert.equal(stored.questions.find(q => q.id === 'q2')!.content, 'Câu 2 gốc', 'the refused edit left no trace');
    const redo = await save('owner', change(stored, 'q2', 'Câu 2 do chủ đề sửa'));
    assert.equal(redo.status, 200, 'after reloading, the owner re-applies the edit on the new version');
    const both = await read('owner');
    assert.deepEqual(both.questions.map(q => q.content), ['Câu 1 do người cùng sửa', 'Câu 2 do chủ đề sửa'], 'both people work is present');
    checks.push('different-blocks-no-loss');
  });

  await t.test('the owner restores an older version as a new version and no history is lost', async () => {
    const before = await read('owner');
    const restored = await request(`/api/exams/${id}/history`, 'POST', { version: baseVersion, baseVersion: before.version }, cookies.owner);
    assert.equal(restored.status, 200, restored.data.error);
    assert.deepEqual(restored.data.document.questions.map((q: { content: string }) => q.content), ['Câu 1 gốc', 'Câu 2 gốc']);
    assert.equal(restored.data.document.version, before.version + 1, 'a restore is a new version, not a rewind');
    const revisions = await db.examRevision.findMany({ where: { examId: id }, orderBy: { version: 'asc' } });
    assert.ok(revisions.length >= 4);
    const text = (version: number) => JSON.stringify(revisions.find(r => r.version === version)?.snapshot);
    assert.ok(text(before.version).includes('Câu 1 do người cùng sửa') && text(before.version).includes('Câu 2 do chủ đề sửa'), 'the version before the restore is still readable');
    assert.equal((await request(`/api/exams/${id}/history`, 'POST', { version: baseVersion, baseVersion: before.version }, cookies.owner)).status, 409, 'a restore from a stale version never applies');
    checks.push('restore-keeps-history');
  });

  await t.test('after a restore a stale editor is refused and a refreshed editor continues; editors cannot restore', async () => {
    const stale = change({ ...(await read('editor')), version: baseVersion }, 'q1', 'Bản cũ của người cùng sửa');
    assert.equal((await save('editor', stale)).status, 409, 'an editor holding an old version cannot overwrite the restore');
    assert.equal((await request(`/api/exams/${id}/history`, 'POST', { version: baseVersion, baseVersion: (await read('editor')).version }, cookies.editor)).status, 403);
    const fresh = await read('editor');
    assert.equal((await save('editor', change(fresh, 'q1', 'Câu 1 sau khôi phục'))).status, 200);
    assert.equal((await read('owner')).questions[0].content, 'Câu 1 sau khôi phục');
    checks.push('stale-editor-refused');
  });
});
