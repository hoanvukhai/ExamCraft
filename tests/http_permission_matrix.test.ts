import { writeQaReport } from './helpers/qa-report';
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import { requireTestDatabase } from './helpers/test-database';

const db = new PrismaClient({ datasources: { db: { url: requireTestDatabase() } }, log: [] });
const origin = process.env.EXAMCRAFT_TEST_ORIGIN ?? 'http://127.0.0.1:3117';
async function request(path: string, method = 'GET', body?: unknown, cookie = '') {
  const response = await fetch(origin + path, { method, headers: { Origin: origin, ...(cookie ? { Cookie: cookie } : {}), ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: response.status, data: await response.json().catch(() => ({})), cookie: response.headers.getSetCookie().map(value => value.split(';')[0]).join('; ') };
}

test('share permission matrix is decided by the server for every operation', { timeout: 150000 }, async t => {
  assert.equal((await request('/api/health')).data.isolatedTest, true, 'Refusing writes without proof of isolated server.');
  const run = randomUUID(), names = ['owner', 'viewer', 'commenter', 'editor', 'stranger'] as const, checks: string[] = [];
  const ids = Object.fromEntries(names.map(name => [name, `matrix_${name}_${run}`])) as Record<typeof names[number], string>;
  const emails = Object.fromEntries(names.map(name => [name, `${ids[name]}@example.invalid`])) as Record<typeof names[number], string>;
  t.after(async () => {
    try {
      const all = Object.values(ids);
      await db.assignment.deleteMany({ where: { ownerId: { in: all } } });
      await db.exam.deleteMany({ where: { ownerId: { in: all } } });
      await db.question.deleteMany({ where: { ownerId: { in: all } } });
      await db.auditLog.deleteMany({ where: { actorId: { in: all } } });
      await db.user.deleteMany({ where: { id: { in: all } } });
      const directory = process.env.HTTP_REPORT_DIR ?? `qa/rebuild-${new Date().toISOString().slice(0, 10)}`;
      fs.mkdirSync(directory, { recursive: true });
      writeQaReport(`${directory}/http_permission_matrix.json`, JSON.stringify({ checkedAt: new Date().toISOString(), checks, cleanupComplete: true, status: checks.length === 6 ? 'PASS' : 'INCOMPLETE', environment: 'isolated ' + origin, realAiCalls: false }, null, 2));
    } finally { await db.$disconnect(); }
  });
  const password = 'fixture-' + randomUUID(), hash = await bcrypt.hash(password, 10), cookies = {} as Record<typeof names[number], string>;
  for (const name of names) {
    await db.user.create({ data: { id: ids[name], email: emails[name], name: 'Matrix ' + name, passwordHash: hash, mustChangePassword: false, aiDailyLimit: 0 } });
    const login = await request('/api/auth/login', 'POST', { email: emails[name], password }); assert.equal(login.status, 200); cookies[name] = login.cookie;
  }
  const created = await request('/api/exams', 'POST', { document: { id: 'draft_' + run, metadata: { title: 'Matrix fixture', subject: 'toan', grade: 6, durationMinutes: 15, schoolName: '', departmentName: '' },
    questions: [{ id: 'q1', type: 'multiple_choice', difficulty: 'thong_hieu', content: 'MATRIX Q', choices: [{ key: 'A', text: '1' }, { key: 'B', text: '2' }], correct_answer: 'A', points: 1, step_by_step_solution: 'MATRIX_PRIVATE_SOLUTION' }],
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } }, cookies.owner);
  assert.equal(created.status, 200, created.data.error);
  const id = created.data.document.id as string;
  const grant = async (name: 'viewer' | 'commenter' | 'editor', role: string) => assert.equal((await request(`/api/exams/${id}/collaborators`, 'POST', { email: emails[name], role }, cookies.owner)).status, 200);
  const current = async () => (await request(`/api/exams/${id}`, 'GET', undefined, cookies.owner)).data.document;
  const edit = async (name: typeof names[number], extra: Record<string, unknown> = {}) => { const document = await current(); return request(`/api/exams/${id}`, 'PATCH', { baseVersion: document.version, document: { ...document, metadata: { ...document.metadata, title: 'Edited by ' + name } }, ...extra }, cookies[name]); };

  await t.test('private by default: a stranger sees nothing and an anonymous caller cannot act', async () => {
    assert.equal((await request(`/api/exams/${id}`, 'GET', undefined, cookies.stranger)).status, 404);
    assert.equal((await request(`/api/exams/${id}/comments`, 'GET', undefined, cookies.stranger)).status, 404);
    assert.equal((await request(`/api/exams/${id}/history`, 'GET', undefined, cookies.stranger)).status, 404);
    const library = await request('/api/exams', 'GET', undefined, cookies.stranger);
    assert.ok(!JSON.stringify(library.data).includes(id), 'the stranger library does not list the exam');
    assert.equal((await request(`/api/exams/${id}`, 'GET')).status, 401);
    assert.equal((await edit('stranger')).status, 404);
    assert.equal((await request(`/api/exams/${id}`, 'PATCH', { baseVersion: 1, document: {} })).status, 401);
    checks.push('private-by-default');
  });

  await t.test('view: read-only collaborators read but never write, comment, manage or publish', async () => {
    await grant('viewer', 'VIEWER');
    const read = await request(`/api/exams/${id}`, 'GET', undefined, cookies.viewer);
    assert.equal(read.status, 200); assert.deepEqual([read.data.permissions.canEdit, read.data.permissions.canComment, read.data.permissions.canManage, read.data.permissions.canPublish], [false, false, false, false]);
    assert.equal(read.data.exam, undefined, 'the raw database row is for the owner only');
    assert.equal((await request(`/api/exams/${id}/comments`, 'GET', undefined, cookies.viewer)).status, 200);
    assert.equal((await edit('viewer')).status, 403);
    assert.equal((await request(`/api/exams/${id}/comments`, 'POST', { body: 'viewer note' }, cookies.viewer)).status, 403);
    checks.push('view');
  });

  await t.test('comment: a commenter writes comments only; an editor edits content but not structure owned by the owner', async () => {
    await grant('commenter', 'COMMENTER');
    assert.equal((await request(`/api/exams/${id}/comments`, 'POST', { body: 'commenter note' }, cookies.commenter)).status, 200);
    assert.equal((await edit('commenter')).status, 403, 'a commenter cannot change the exam');
    await grant('editor', 'EDITOR');
    assert.equal((await request(`/api/exams/${id}/comments`, 'POST', { body: 'editor note' }, cookies.editor)).status, 200);
    assert.equal((await edit('editor')).status, 200, 'an editor changes content');
    assert.equal((await edit('editor', { folderId: 'any-folder' })).status, 403, 'an editor cannot move or configure the exam');
    assert.equal((await edit('owner')).status, 200);
    const authors = (await db.examComment.findMany({ where: { examId: id }, select: { authorId: true } })).map(c => c.authorId).sort();
    assert.deepEqual(authors, [ids.commenter, ids.editor].sort(), 'comments carry the real author and the refused viewer wrote none');
    checks.push('comment-and-edit');
  });

  await t.test('comments record question and version, and only editors or the writer can resolve them', async () => {
    const post = (name: typeof names[number], body: string, questionId?: string) => request(`/api/exams/${id}/comments`, 'POST', { body, ...(questionId ? { questionId } : {}) }, cookies[name]);
    assert.equal((await post('commenter', 'về câu 1', 'q1')).status, 200);
    assert.equal((await post('commenter', 'câu không có', 'nope')).status, 400, 'a comment on a question not in the exam is refused');
    const list = async (name: typeof names[number] = 'owner') => (await request(`/api/exams/${id}/comments`, 'GET', undefined, cookies[name])).data.comments as { id: string; body: string; questionId: string | null; version: number; resolvedAt: string | null; resolvedByName: string | null; mine: boolean }[];
    const mineComment = (await list()).find(c => c.body === 'về câu 1')!;
    assert.equal(mineComment.questionId, 'q1'); assert.equal(mineComment.version, (await current()).version, 'the comment remembers the version it was written on');
    const resolve = (name: typeof names[number], commentId: string, resolved = true) => request(`/api/exams/${id}/comments`, 'PATCH', { commentId, resolved }, cookies[name]);
    const editorNote = (await list()).find(c => c.body === 'editor note')!;
    assert.equal((await resolve('commenter', editorNote.id)).status, 403, 'a commenter cannot close another person comment');
    assert.equal((await resolve('viewer', mineComment.id)).status, 403, 'a viewer cannot resolve');
    assert.equal((await resolve('stranger', mineComment.id)).status, 404, 'a stranger does not even see the exam');
    assert.equal((await resolve('editor', mineComment.id)).status, 200);
    const closed = (await list('commenter')).find(c => c.id === mineComment.id)!;
    assert.ok(closed.resolvedAt); assert.equal(closed.resolvedByName, 'Matrix editor'); assert.equal(closed.mine, true);
    assert.equal((await resolve('commenter', mineComment.id, false)).status, 200, 'the writer can reopen their own comment');
    assert.equal((await list()).find(c => c.id === mineComment.id)!.resolvedAt, null);
    assert.equal((await resolve('owner', 'missing')).status, 404);
    assert.equal((await request(`/api/exams/${id}/comments`, 'PATCH', { commentId: mineComment.id, resolved: true, extra: 1 }, cookies.owner)).status, 400);
    const history = (await request(`/api/exams/${id}/history`, 'GET', undefined, cookies.owner)).data.revisions as { actor: { name: string } | null }[];
    assert.ok(history.some(r => r.actor?.name === 'Matrix editor'), 'history shows who made each saved change');
    checks.push('comment-resolution');
  });

  await t.test('manage and publish: only the owner changes members, restores history, shares, assigns or deletes', async () => {
    for (const name of ['viewer', 'commenter', 'editor'] as const) {
      const members = await request(`/api/exams/${id}/collaborators`, 'GET', undefined, cookies[name]);
      assert.equal(members.status, 200); assert.deepEqual(members.data.members ?? [], [], `${name} does not see the member list`); assert.equal(members.data.ownerId, undefined);
      assert.equal((await request(`/api/exams/${id}/collaborators`, 'POST', { email: emails.stranger, role: 'EDITOR' }, cookies[name])).status, 403, `${name} cannot add members`);
      assert.equal((await request(`/api/exams/${id}/collaborators`, 'DELETE', { userId: ids.viewer }, cookies[name])).status, 403, `${name} cannot remove members`);
      assert.equal((await request(`/api/exams/${id}/history`, 'POST', { version: 1, baseVersion: (await current()).version }, cookies[name])).status, 403, `${name} cannot restore history`);
      assert.equal((await request(`/api/exams/${id}/share`, 'POST', { showAnswers: true, allowCopy: true }, cookies[name])).status, 404, `${name} cannot publish a link`);
      assert.equal((await request('/api/assignments', 'POST', { examId: id, title: 'x', identityMode: 'FREE_NAME', maxAttempts: 1 }, cookies[name])).status === 200, false, `${name} cannot assign the exam`);
      assert.equal((await request(`/api/exams/${id}`, 'DELETE', undefined, cookies[name])).status === 200, false, `${name} cannot delete the exam`);
    }
    assert.equal((await request(`/api/exams/${id}/collaborators`, 'GET', undefined, cookies.owner)).data.members.length, 3);
    assert.equal(await db.assignment.count({ where: { examId: id } }), 0); assert.equal((await db.exam.findUniqueOrThrow({ where: { id } })).deletedAt, null);
    assert.equal((await request(`/api/exams/${id}/share`, 'POST', { showAnswers: false, allowCopy: false }, cookies.owner)).status, 200, 'the owner publishes');
    checks.push('manage-and-publish');
  });

  await t.test('a public link grants neither edit nor keys, and copying needs both the owner permission and a signed-in teacher', async () => {
    const link = await request(`/api/exams/${id}/share`, 'POST', { showAnswers: false, allowCopy: false }, cookies.owner);
    const token = String(link.data.publicLink).split('/').pop()!;
    const shown = JSON.stringify((await request('/api/public/share/' + token)).data);
    assert.ok(!shown.includes('MATRIX_PRIVATE_SOLUTION') && !shown.includes('correct_answer'), 'a link without answers carries no key or solution');
    assert.equal((await request(`/api/exams/${token}`, 'PATCH', { baseVersion: 1, document: {} })).status, 401, 'a link token never authorizes editing');
    assert.equal((await request(`/api/exams/${token}`, 'GET')).status, 401);
    assert.equal((await request(`/api/public/share/${token}/copy`, 'POST')).status, 401, 'copying needs a signed-in teacher');
    assert.equal((await request(`/api/public/share/${token}/copy`, 'POST', undefined, cookies.stranger)).status, 403, 'copying needs the owner to allow it');
    const revoke = await request(`/api/exams/${id}/share`, 'DELETE', { linkId: link.data.link.id }, cookies.editor);
    assert.equal(revoke.status, 404, 'an editor cannot revoke the owner links');
    assert.equal((await request('/api/public/share/' + token)).status, 200, 'and the link is still alive');
    checks.push('public-link-limits');
  });
});
