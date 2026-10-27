import { writeQaReport } from './helpers/qa-report';
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { PrismaClient, type Prisma } from '@prisma/client';
import fs from 'node:fs';
import { requireTestDatabase } from './helpers/test-database';
import type { Exam } from '../src/types/exam';
import { encodeGradeHistoryCursor } from '../src/lib/grade-history-pagination';
import knowledgeFixture from './fixtures/knowledge-package.json';
import { parseKnowledgePackage, emptyKnowledgeScope } from '../src/lib/knowledge-package';
import { parseBackupText, splitBackupFiles } from '../src/lib/backup-files';
import { createExamPlan, compareExamPlan } from '../src/lib/exam-plan';
import { captureTemplateSnapshot, applyPersonalTemplate, templateDocumentStamp, parseTemplateList, parseOpenedTemplate, parseSavedTemplate } from '../src/lib/exam-template';

const database = requireTestDatabase();
const origin = 'http://127.0.0.1:3117';
const prisma = new PrismaClient({ datasources: { db: { url: database } }, log: [] });
const cookies = (response: Response) => response.headers.getSetCookie().map(cookie => cookie.split(';')[0]).join('; ');
async function request(path: string, method = 'GET', body?: unknown, cookie = '', requestOrigin = origin) {
  const response = await fetch(origin + path, { method, headers: { Origin: requestOrigin, ...(cookie ? { Cookie: cookie } : {}), ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(30000) });
  return { status: response.status, data: await response.json(), cookie: cookies(response) };
}

test('HTTP workflows on the isolated local server', { timeout: 120000 }, async t => {
  const health = await request('/api/health');
  assert.equal(health.data.isolatedTest, true, 'Refusing writes: server has not proved isolated-test mode.');
  const suffix = randomUUID();
  const emails = [0, 1].map(i => `http_${i}_${suffix}@example.invalid`), ids = [0, 1].map(i => `http_${i}_${suffix}`);
  const password = `fixture-${suffix}`, checks: string[] = [];
  const legacyTemplateId = `http_legacy_template_${suffix}`;
  t.after(async () => {
    try {
      await prisma.assignment.deleteMany({ where: { ownerId: { in: ids } } });
      await prisma.group.deleteMany({ where: { ownerId: { in: ids } } });
      await prisma.exam.deleteMany({ where: { ownerId: { in: ids } } });
      await prisma.examTemplate.deleteMany({ where: { OR: [{ ownerId: { in: ids } }, { id: legacyTemplateId }] } });
      await prisma.question.deleteMany({ where: { ownerId: { in: ids } } });
      await prisma.passage.deleteMany({ where: { ownerId: { in: ids } } });
      await prisma.teacherAiMemory.deleteMany({ where: { userId: { in: ids } } });
      await prisma.auditLog.deleteMany({ where: { actorId: { in: ids } } });
      await prisma.aiUsageLog.deleteMany({ where: { userId: { in: ids } } });
      await prisma.user.deleteMany({ where: { id: { in: ids } } });
      const reportDirectory = `qa/rebuild-${new Date().toISOString().slice(0, 10)}`;
      fs.mkdirSync(reportDirectory, { recursive: true });
      writeQaReport(`${reportDirectory}/http_workflows.json`, JSON.stringify({ checkedAt: new Date().toISOString(), checks, cleanupComplete: true, status: checks.length === 16 ? 'PASS' : 'INCOMPLETE', environment: 'isolated localhost:3117', realAiCalls: false }, null, 2));
    } finally { await prisma.$disconnect(); }
  });
  const passwordHash = await bcrypt.hash(password, 10);
  for (const [index, id] of ids.entries()) await prisma.user.create({ data: { id, email: emails[index], name: 'HTTP fixture teacher', passwordHash, mustChangePassword: false, aiDailyLimit: 0 } });
  const logins = await Promise.all(emails.map(email => request('/api/auth/login', 'POST', { email, password })));
  logins.forEach(login => assert.equal(login.status, 200));
  const [owner, other] = logins.map(login => login.cookie);
  const exam: Exam = { id: `draft_${suffix}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), metadata: { title: 'HTTP fixture exam', subject: 'toan', grade: 6, schoolName: '', departmentName: '', durationMinutes: 15 }, questions: [
    { id: 'mc', type: 'multiple_choice', difficulty: 'thong_hieu', content: 'Fixture MC', choices: [{ key: 'A', text: 'One' }, { key: 'B', text: 'Two' }], correct_answer: 'A', points: 1, step_by_step_solution: 'PRIVATE_SOLUTION' },
    { id: 'essay', type: 'essay', difficulty: 'thong_hieu', content: 'Fixture essay', points: 1, step_by_step_solution: 'PRIVATE_RUBRIC' },
  ] };
  const created = await request('/api/exams', 'POST', { document: exam }, owner);
  assert.equal(created.status, 200, created.data.error);
  const id = created.data.document.id as string;
  let current = created.data.document as Exam;
  let assignmentId = '', publicId = '', attemptId = '', attemptCookie = '';

  await t.test('anonymous, foreign owner and cross-origin writes are rejected', async () => {
    assert.equal((await request(`/api/exams/${id}`)).status, 401);
    assert.equal((await request(`/api/exams/${id}`, 'GET', undefined, other)).status, 404);
    assert.equal((await request(`/api/exams/${id}`, 'PATCH', { document: current, baseVersion: 1 }, owner, 'https://foreign.example')).status, 403);
    const staleTab = await fetch(origin + '/api/exams', { method: 'POST', headers: { Origin: origin, Cookie: other, 'Content-Type': 'application/json', 'x-examcraft-user': ids[0] }, body: JSON.stringify({ document: { ...exam, id: 'stale-tab-' + suffix } }) });
    assert.equal(staleTab.status, 409); assert.equal((await staleTab.json()).code, 'ACCOUNT_CHANGED');
    assert.equal(await prisma.exam.count({ where: { ownerId: ids[1] } }), 0, 'An old tab must not write its draft into the new account.');
    const staleGeneration = await fetch(origin + '/api/generate-exam', { method: 'POST', headers: { Origin: origin, Cookie: other, 'Content-Type': 'application/json', 'x-examcraft-user': ids[0] }, body: '{}' });
    assert.equal(staleGeneration.status, 409); assert.equal((await staleGeneration.json()).code, 'ACCOUNT_CHANGED');
    for (const endpoint of ['/api/tweak-question', '/api/verify-question', '/api/exam-copilot', '/api/parse-docx', '/api/parse-exam-text', '/api/ocr-exam-image', '/api/teacher/ai-memory', '/api/teacher/ai-memory/archive', '/api/teacher/ai-memory/analyze']) {
      const usageBeforeAccountChecks = await prisma.aiUsageLog.count({ where: { userId: { in: ids } } });
      const staleQuestionAi = await fetch(origin + endpoint, { method: 'POST', headers: { Origin: origin, Cookie: other, 'Content-Type': 'application/json', 'x-examcraft-user': ids[0] }, body: '{' });
      assert.equal(staleQuestionAi.status, 409, `${endpoint} must reject an old account pin before parsing the invalid question or looking up a provider key.`);
      assert.equal((await staleQuestionAi.json()).code, 'ACCOUNT_CHANGED');
      assert.equal((await request(endpoint, 'POST', {})).status, 401, `${endpoint} requires authentication`);
      assert.equal((await request(endpoint, 'POST', {}, owner, 'https://foreign.example')).status, 403, `${endpoint} rejects foreign origins`);
      const correctAccountInvalidBody = await fetch(origin + endpoint, { method: 'POST', headers: { Origin: origin, Cookie: other, 'Content-Type': 'application/json', 'x-examcraft-user': ids[1] }, body: '{}' });
      assert.equal(correctAccountInvalidBody.status, 400, `${endpoint} must accept the matching account pin and proceed to body validation`);
      assert.equal(await prisma.aiUsageLog.count({ where: { userId: { in: ids } } }), usageBeforeAccountChecks, 'Account/body rejection must not reserve provider usage.');
    }
    const excessiveGeneration = await request('/api/generate-exam', 'POST', { params: { subject: 'toan', grade: 6, topic: 'Fixture', durationMinutes: 15, numMultipleChoice: 100, numMatching: 1 } }, owner);
    assert.equal(excessiveGeneration.status, 400); assert.match(excessiveGeneration.data.error, /Tổng số câu/);
    const folder = await request('/api/folders', 'POST', { name: `Private folder ${suffix}` }, owner);
    assert.equal(folder.status, 201);
    const folderId = folder.data.folder.id;
    const group = await request('/api/groups', 'POST', { name: `Private class ${suffix}`, studentNames: ['QA học sinh 1'] }, owner);
    assert.equal(group.status, 200);
    const groupId = group.data.group.id;
    assert.equal((await request(`/api/groups/${groupId}`, 'PATCH', { newStudentNames: ['QA học sinh 2'] }, owner)).status, 200);
    assert.equal(await prisma.student.count({ where: { groupId } }), 2);
    assert.equal((await request(`/api/groups/${groupId}`, 'GET', undefined, other)).status, 404);
    assert.equal((await request(`/api/groups/${groupId}`, 'PATCH', { name: 'Must not change' }, other)).status, 404);
    assert.equal((await request(`/api/folders/${folderId}`, 'PATCH', { name: 'Must not change' }, other)).status, 404);
    assert.equal((await request(`/api/folders/${folderId}`, 'DELETE', undefined, other)).status, 404);
    for (const endpoint of ['/api/folders', '/api/groups']) assert.equal((await request(endpoint, 'POST', { name: 'Cross-origin rejected' }, owner, 'https://foreign.example')).status, 403);
    for (const [endpoint, method] of [
      ['/api/folders', 'GET'], ['/api/folders', 'POST'], [`/api/folders/${folderId}`, 'PATCH'], [`/api/folders/${folderId}`, 'DELETE'],
      ['/api/groups', 'GET'], ['/api/groups', 'POST'], [`/api/groups/${groupId}`, 'GET'], [`/api/groups/${groupId}`, 'PATCH'], [`/api/groups/${groupId}`, 'DELETE'],
      ['/api/questions', 'GET'], ['/api/questions', 'POST'], ['/api/questions/shared', 'GET'],
      ['/api/knowledge-scope/propose', 'POST'],
      ['/api/assignments', 'GET'], ['/api/assignments', 'POST'],
      [`/api/exams/${id}/share`, 'GET'], [`/api/exams/${id}/share`, 'POST'], [`/api/exams/${id}/share`, 'DELETE'],
      ['/api/teacher/assignments/qa-missing', 'GET'], ['/api/teacher/assignments/qa-missing', 'PATCH'], ['/api/teacher/assignments/qa-missing/export-csv', 'GET'],
      ['/api/teacher/attempts/qa-missing', 'GET'], ['/api/teacher/attempts/qa-missing', 'POST'], ['/api/teacher/attempts/qa-missing', 'DELETE'],
      ['/api/user/keys', 'GET'], ['/api/user/keys', 'POST'], ['/api/user/keys', 'PATCH'], ['/api/user/keys', 'DELETE'], ['/api/user/keys/test', 'POST'], ['/api/user/ai-usage', 'GET'],
    ] as const) {
      const stale = await fetch(origin + endpoint, { method, headers: { Origin: origin, Cookie: other, 'x-examcraft-user': ids[0], 'Content-Type': 'application/json' }, body: method === 'GET' || method === 'DELETE' ? undefined : '{}' });
      assert.equal(stale.status, 409, `${method} ${endpoint} must reject stale account`); assert.equal((await stale.json()).code, 'ACCOUNT_CHANGED');
    }
    for (const [endpoint, body] of [
      ['/api/assignments', { examId: id, title: 'Must not publish from stale account', identityMode: 'FREE_NAME' }],
      [`/api/exams/${id}/share`, { showAnswers: false, allowCopy: false }],
    ] as const) {
      const beforeAssignments = await prisma.assignment.count({ where: { ownerId: ids[0] } });
      const beforeLinks = await prisma.shareLink.count({ where: { examId: id } });
      const rejected = await fetch(origin + endpoint, { method: 'POST', headers: { Origin: origin, Cookie: owner, 'Content-Type': 'application/json', 'x-examcraft-user': ids[1] }, body: JSON.stringify(body) });
      assert.equal(rejected.status, 409); assert.equal((await rejected.json()).code, 'ACCOUNT_CHANGED');
      assert.equal(await prisma.assignment.count({ where: { ownerId: ids[0] } }), beforeAssignments);
      assert.equal(await prisma.shareLink.count({ where: { examId: id } }), beforeLinks);
    }
    assert.equal((await request('/api/assignments', 'POST', { examId: id, title: 'Cross-origin denied', identityMode: 'FREE_NAME' }, owner, 'https://foreign.example')).status, 403);
    assert.equal((await request('/api/knowledge-scope/propose', 'POST', {}, owner, 'https://foreign.example')).status, 403);
    assert.equal((await request('/api/knowledge-scope/propose', 'POST', {})).status, 401);
    const scopePackage = parseKnowledgePackage(knowledgeFixture);
    const scopeRequest = { params: { subject: scopePackage.subject, grade: scopePackage.grade, message: 'Chọn phép cộng', bookId: null, knowledgePackage: scopePackage, scope: emptyKnowledgeScope(scopePackage) } };
    const usageBefore = await prisma.aiUsageLog.count({ where: { userId: ids[0] } });
    assert.equal((await request('/api/knowledge-scope/propose', 'POST', { params: { ...scopeRequest.params, bookId: 'unknown-book' } }, owner)).status, 400);
    const missingKey = await request('/api/knowledge-scope/propose', 'POST', scopeRequest, owner);
    assert.equal(missingKey.status, 400); assert.equal(missingKey.data.code, 'NO_API_KEY');
    assert.equal(await prisma.aiUsageLog.count({ where: { userId: ids[0] } }), usageBefore + 1, 'An old zero daily cap does not block the request; the missing-key failure is logged without a provider call.');
    const ownInFolder = await request('/api/exams', 'POST', { document: { ...exam, id: `folder-${suffix}` }, folderId }, owner);
    assert.equal(ownInFolder.status, 200);
    assert.equal((await request('/api/exams', 'POST', { document: { ...exam, id: `foreign-folder-${suffix}` }, folderId }, other)).status, 403);
    // Simulate legacy bad references using direct writes on the already validated TEST DB only.
    const foreignExam = await request('/api/exams', 'POST', { document: { ...exam, id: `foreign-legacy-${suffix}` } }, other);
    await prisma.exam.update({ where: { id: foreignExam.data.document.id }, data: { folderId } });
    const foreignChild = await prisma.folder.create({ data: { name: 'Foreign hidden child', ownerId: ids[1], parentId: folderId } });
    const folderList = await request('/api/folders', 'GET', undefined, owner);
    assert.ok(!JSON.stringify(folderList.data).includes(foreignChild.name));
    assert.equal((await request(`/api/folders/${folderId}`, 'DELETE', undefined, owner)).status, 409);
    assert.equal((await prisma.exam.findUniqueOrThrow({ where: { id: foreignExam.data.document.id } })).folderId, folderId);
    await prisma.exam.update({ where: { id: foreignExam.data.document.id }, data: { folderId: null } });
    await prisma.folder.update({ where: { id: foreignChild.id }, data: { parentId: null } });
    assert.equal((await request(`/api/folders/${folderId}`, 'DELETE', undefined, owner)).status, 200);
    assert.equal((await prisma.exam.findUniqueOrThrow({ where: { id: ownInFolder.data.document.id } })).folderId, null);
    assert.equal((await prisma.exam.findUniqueOrThrow({ where: { id: foreignExam.data.document.id } })).folderId, null);
    checks.push('http-private-access-and-origin');
  });
  await t.test('key creation retries are private, masked and idempotent without contacting a provider', async () => {
    const path = '/api/user/keys', clientRequestId = randomUUID();
    const fakeKey = `synthetic-not-a-provider-key-${suffix}`;
    const body = { apiKey: fakeKey, label: 'HTTP fake key', clientRequestId };
    const usageBefore = await prisma.aiUsageLog.count({ where: { userId: { in: ids } } });
    const beforeKeys = await prisma.userApiKey.count({ where: { userId: { in: ids } } });
    const stale = await fetch(origin + path, { method: 'POST', headers: { Origin: origin, Cookie: owner, 'x-examcraft-user': ids[1], 'Content-Type': 'application/json' }, body: '{' });
    assert.equal(stale.status, 409); assert.equal((await stale.json()).code, 'ACCOUNT_CHANGED');
    assert.equal((await request(path, 'POST', body)).status, 401);
    assert.equal((await request(path, 'POST', body, owner, 'https://foreign.example')).status, 403);
    assert.equal((await request(path, 'POST', { ...body, clientRequestId: 'bad-id' }, owner)).status, 400);
    assert.equal(await prisma.userApiKey.count({ where: { userId: { in: ids } } }), beforeKeys);
    const replies = await Promise.all([request(path, 'POST', body, owner), request(path, 'POST', body, owner)]);
    for (const reply of replies) {
      assert.equal(reply.status, 200, reply.data.error);
      assert.ok(!JSON.stringify(reply.data).includes(fakeKey));
      assert.deepEqual(Object.keys(reply.data.key).sort(), ['id', 'label', 'keyMasked', 'isActive', 'createdAt', 'lastUsedAt', 'errorCount'].sort());
    }
    const keyId = replies[0].data.key.id;
    assert.equal(replies[1].data.key.id, keyId);
    assert.equal(await prisma.userApiKey.count({ where: { userId: ids[0] } }), 1);
    assert.equal((await request(path, 'POST', { ...body, apiKey: ` ${fakeKey} `, label: ' HTTP fake key ' }, owner)).data.replayed, true);
    assert.equal((await request(path, 'PATCH', { id: keyId, isActive: false }, owner)).status, 200);
    const protectedKey = await prisma.userApiKey.findUniqueOrThrow({ where: { id: keyId } });
    const disabledReplay = await request(path, 'POST', body, owner);
    assert.equal(disabledReplay.status, 200); assert.equal(disabledReplay.data.key.isActive, false, 'Retry must not re-enable a key.');
    for (const changed of [{ ...body, label: 'Changed label' }, { ...body, apiKey: fakeKey + '-changed' }]) {
      const rejected = await request(path, 'POST', changed, owner);
      assert.equal(rejected.status, 409); assert.equal(rejected.data.code, 'KEY_REQUEST_CONFLICT');
    }
    assert.deepEqual(await prisma.userApiKey.findUniqueOrThrow({ where: { id: keyId } }), protectedKey);
    assert.equal((await request(path, 'PATCH', { id: keyId, isActive: true }, other)).status, 404);
    const foreignCopy = await request(path, 'POST', body, other);
    assert.equal(foreignCopy.status, 200); assert.notEqual(foreignCopy.data.key.id, keyId);
    const legacy1 = await request(path, 'POST', { apiKey: fakeKey }, owner);
    const legacy2 = await request(path, 'POST', { apiKey: fakeKey }, owner);
    assert.equal(legacy1.status, 200); assert.equal(legacy2.status, 200);
    assert.notEqual(legacy1.data.key.id, legacy2.data.key.id, 'Old callers still create a fresh entry without a request ID.');
    const listed = await request(path, 'GET', undefined, owner);
    assert.equal(listed.status, 200); assert.equal(listed.data.keys.length, 3);
    assert.ok(!JSON.stringify(listed.data).includes(fakeKey));
    assert.equal(await prisma.aiUsageLog.count({ where: { userId: { in: ids } } }), usageBefore);
    for (const ownId of [keyId, legacy1.data.key.id, legacy2.data.key.id]) assert.equal((await request(`${path}?id=${ownId}`, 'DELETE', undefined, owner)).status, 200);
    assert.equal((await request(`${path}?id=${foreignCopy.data.key.id}`, 'DELETE', undefined, other)).status, 200);
    checks.push('http-key-create-private-idempotency');
  });
  await t.test('collaboration honors view, edit, CAS, history and revocation', async () => {
    assert.equal((await request(`/api/exams/${id}/collaborators`, 'POST', { email: emails[1], role: 'VIEWER' }, owner)).status, 200);
    const viewed = await request(`/api/exams/${id}`, 'GET', undefined, other);
    assert.equal(viewed.data.permissions.canEdit, false);
    assert.equal(viewed.data.exam, undefined);
    assert.equal((await request(`/api/exams/${id}`, 'PATCH', { document: current, baseVersion: 1 }, other)).status, 403);
    assert.equal((await request(`/api/exams/${id}/collaborators`, 'POST', { email: emails[1], role: 'EDITOR' }, owner)).status, 200);
    const switchedAccountRead = await fetch(origin + `/api/exams/${id}`, { headers: { Cookie: other, 'x-examcraft-user': ids[0] } });
    assert.equal(switchedAccountRead.status, 409, 'Polling an exam shared with both accounts must still reject the old account pin.');
    const refusedRead = await switchedAccountRead.json(); assert.equal(refusedRead.code, 'ACCOUNT_CHANGED'); assert.equal(refusedRead.document, undefined);
    for (const [path, method, body] of [
      ['collaborators', 'GET', undefined], ['comments', 'GET', undefined], ['history', 'GET', undefined],
      ['collaborators', 'POST', { email: emails[1], role: 'VIEWER' }],
      ['collaborators', 'DELETE', { userId: ids[1] }],
      ['comments', 'POST', { body: 'Must never be posted as another account' }],
      ['history', 'POST', { version: 1, baseVersion: current.version }],
    ] as const) {
      const rejected = await fetch(origin + `/api/exams/${id}/${path}`, { method, headers: { Origin: origin, Cookie: owner, 'Content-Type': 'application/json', 'x-examcraft-user': ids[1] }, body: body === undefined ? undefined : JSON.stringify(body) });
      assert.equal(rejected.status, 409, `${method} ${path} must reject the old tab before acting`);
      assert.equal((await rejected.json()).code, 'ACCOUNT_CHANGED');
    }
    assert.equal(await prisma.examComment.count({ where: { examId: id } }), 0);
    const memberAfterRefusal = await prisma.examCollaborator.findFirstOrThrow({ where: { examId: id, userId: ids[1], revokedAt: null } });
    assert.equal(memberAfterRefusal.role, 'EDITOR');
    const validComment = await fetch(origin + `/api/exams/${id}/comments`, { method: 'POST', headers: { Origin: origin, Cookie: other, 'Content-Type': 'application/json', 'x-examcraft-user': ids[1] }, body: JSON.stringify({ body: 'Fixture comment under the correct account' }) });
    assert.equal(validComment.status, 200);
    assert.equal((await prisma.examComment.findFirstOrThrow({ where: { examId: id } })).authorId, ids[1]);
    const changed = { ...current, metadata: { ...current.metadata, title: 'Editor accepted' } };
    const results = await Promise.all([owner, other].map(cookie => request(`/api/exams/${id}`, 'PATCH', { document: changed, baseVersion: 1 }, cookie)));
    assert.deepEqual(results.map(result => result.status).sort(), [200, 409]);
    current = results.find(result => result.status === 200)!.data.document;
    const history = await request(`/api/exams/${id}/history`, 'GET', undefined, owner);
    assert.equal(history.status, 200); assert.ok(history.data.revisions.length >= 2);
    assert.equal((await request(`/api/exams/${id}/collaborators`, 'DELETE', { userId: ids[1] }, owner)).status, 200);
    assert.equal((await request(`/api/exams/${id}`, 'GET', undefined, other)).status, 404);
    checks.push('http-collaboration-cas-history-revoke');
  });
  await t.test('structural edits conflict without partial merges and revoked writers cannot retry', async () => {
    const created = await request('/api/exams', 'POST', { document: { ...exam, id: 'structure-' + suffix } }, owner);
    assert.equal(created.status, 200);
    const document = created.data.document as Exam, path = `/api/exams/${document.id}`;
    assert.equal((await request(`${path}/collaborators`, 'POST', { email: emails[1], role: 'EDITOR' }, owner)).status, 200);
    const reordered = { ...document, questions: [...document.questions].reverse() };
    const removed = { ...document, questions: [{ ...document.questions[0], content: 'Editor changed content', step_by_step_solution: 'Editor private solution' }] };
    const results = await Promise.all([request(path, 'PATCH', { document: reordered, baseVersion: document.version }, owner), request(path, 'PATCH', { document: removed, baseVersion: document.version }, other)]);
    assert.deepEqual(results.map(r => r.status).sort(), [200, 409]);
    const winner = results.findIndex(r => r.status === 200), saved = results[winner].data.document as Exam;
    const reloaded = await request(path, 'GET', undefined, owner);
    assert.deepEqual(reloaded.data.document.questions, saved.questions, 'No partial merge or reordered answer mismatch.');
    assert.deepEqual(saved.questions.map(q => [q.id, q.content, q.step_by_step_solution]), [reordered, removed][winner].questions.map(q => [q.id, q.content, q.step_by_step_solution]));
    const historyBefore = await prisma.examRevision.count({ where: { examId: document.id } });
    assert.equal((await request(`${path}/collaborators`, 'DELETE', { userId: ids[1] }, owner)).status, 200);
    const rejected = await request(path, 'PATCH', { document: { ...saved, questions: removed.questions }, baseVersion: saved.version }, other);
    assert.equal(rejected.status, 404);
    assert.equal((await request(path, 'GET', undefined, other)).status, 404);
    assert.deepEqual((await request(path, 'GET', undefined, owner)).data.document, reloaded.data.document);
    assert.equal(await prisma.examRevision.count({ where: { examId: document.id } }), historyBefore);
    checks.push('http-structural-cas-revoked-retry');
  });
  await t.test('legacy preview is read-only, import resumes per item and retries never overwrite teacher edits', async () => {
    const path = '/api/migration/import-legacy';
    const legacy = { ...exam, id: 'old-' + suffix, passages: [{ id: 'p', content: 'Legacy shared passage', source: 'Fixture source' }], questions: exam.questions.map(q => ({ ...q, points: 0, passageId: 'p', status: 'verified', verifiedBy: 'human', figures: [{ id: 'figure', kind: 'image', data: '/fixture.png' }] })) };
    const broken = { ...legacy, id: 'broken-' + suffix, questions: [{ id: 'broken', type: 'unsupported', content: 'Needs manual correction' }] };
    const bank = { ...exam.questions[0], id: 'bank-' + suffix, subject: 'toan', grade: 6, status: 'verified', verifiedBy: 'human' };
    const missingGrade = { ...bank, id: 'missing-grade-' + suffix, grade: undefined };
    const batch = { exams: [legacy, broken], questions: [bank, missingGrade] }, source = JSON.stringify(batch);
    const before = { exams: await prisma.exam.count({ where: { ownerId: ids[0] } }), questions: await prisma.question.count({ where: { ownerId: ids[0] } }) };
    const variants = { exams: [legacy, { ...legacy, metadata: { ...legacy.metadata, title: 'Different content under same source ID' } }], questions: [bank, { ...bank, content: 'Different bank content under same source ID' }] };
    const variantSource = JSON.stringify(variants);
    for (const dryRun of [true, false]) {
      const rejectedVariants = await request(path, 'POST', { ...variants, dryRun }, owner);
      assert.equal(rejectedVariants.status, 200); assert.equal(rejectedVariants.data.errorCount, 4);
      assert.equal(rejectedVariants.data.importedExamsCount, 0); assert.equal(rejectedVariants.data.importedQuestionsCount, 0);
      assert.ok(rejectedVariants.data.results.every((r: { status: string; error: string }) => r.status === 'error' && /cùng mã nhưng khác nội dung/.test(r.error)));
    }
    assert.equal(JSON.stringify(variants), variantSource);
    assert.equal(await prisma.exam.count({ where: { ownerId: ids[0] } }), before.exams);
    assert.equal(await prisma.question.count({ where: { ownerId: ids[0] } }), before.questions);
    const largeArchive = { app: 'ExamCraft', formatVersion: 2, exportedAt: new Date().toISOString(), embeddedImages: 0, exams: Array.from({ length: 101 }, (_, i) => ({ ...exam, id: `split-${suffix}-${i}` })), questions: [] };
    assert.equal((await request(path, 'POST', { exams: largeArchive.exams, dryRun: true }, owner)).status, 400);
    for (const part of splitBackupFiles(largeArchive)) {
      const checked = await request(path, 'POST', { ...parseBackupText(part.text), dryRun: true }, owner);
      assert.equal(checked.status, 200); assert.equal(checked.data.errorCount, 0);
      assert.equal(checked.data.results.filter((r: { status: string }) => r.status === 'ready').length, part.examCount);
    }
    assert.equal(await prisma.exam.count({ where: { ownerId: ids[0] } }), before.exams);
    const preview = await request(path, 'POST', batch, owner);
    assert.equal(preview.status, 200); assert.equal(preview.data.dryRun, true); assert.equal(preview.data.errorCount, 2); assert.equal(preview.data.results.filter((r: { status: string }) => r.status === 'ready').length, 2);
    assert.equal(await prisma.exam.count({ where: { ownerId: ids[0] } }), before.exams); assert.equal(await prisma.question.count({ where: { ownerId: ids[0] } }), before.questions);
    const switched = await fetch(origin + path, { method: 'POST', headers: { Origin: origin, Cookie: other, 'Content-Type': 'application/json', 'x-examcraft-user': ids[0] }, body: JSON.stringify({ ...batch, dryRun: false }) });
    assert.equal(switched.status, 409); assert.equal((await switched.json()).code, 'ACCOUNT_CHANGED');
    assert.equal((await request(path, 'POST', { ...batch, dryRun: false }, owner, 'https://foreign.example')).status, 403);
    const imported = await request(path, 'POST', { ...batch, dryRun: false }, owner);
    assert.equal(imported.status, 200); assert.equal(imported.data.errorCount, 2); assert.equal(imported.data.importedExamsCount, 1); assert.equal(imported.data.importedQuestionsCount, 1);
    const importedId = imported.data.results.find((r: { kind: string; status: string }) => r.kind === 'exam' && r.status === 'imported').id;
    const loaded = (await request(`/api/exams/${importedId}`, 'GET', undefined, owner)).data.document as Exam;
    assert.equal(loaded.questions[0].points, 0); assert.equal(loaded.questions[0].step_by_step_solution, 'PRIVATE_SOLUTION'); assert.equal(loaded.questions[0].status, 'draft'); assert.equal(loaded.questions[0].verifiedBy, 'none'); assert.equal(loaded.passages?.[0].content, 'Legacy shared passage'); assert.equal(loaded.questions[0].figures?.[0].data, '/fixture.png');
    const edited = await request(`/api/exams/${importedId}`, 'PATCH', { document: { ...loaded, metadata: { ...loaded.metadata, title: 'Teacher edited after import' } }, baseVersion: loaded.version }, owner);
    assert.equal(edited.status, 200);
    const revisionCount = await prisma.examRevision.count({ where: { examId: importedId } });
    const changedSource = { ...legacy, questions: legacy.questions.map((q, i) => i ? q : { ...q, step_by_step_solution: 'Different source answer on a later file' }) };
    const changedBank = { ...bank, content: 'Different bank source in later import' };
    const conflictBatch = { exams: [changedSource], questions: [changedBank] };
    for (const dryRun of [true, false]) {
      const conflict = await request(path, 'POST', { ...conflictBatch, dryRun }, owner);
      assert.equal(conflict.data.errorCount, 2); assert.ok(conflict.data.results.every((r: { canImportCopy: boolean }) => r.canImportCopy));
      assert.equal(conflict.data.importedExamsCount, 0); assert.equal(conflict.data.importedQuestionsCount, 0);
    }
    const copyPreview = await request(path, 'POST', { ...conflictBatch, copyConflicts: true }, owner);
    assert.equal(copyPreview.data.errorCount, 0); assert.ok(copyPreview.data.results.every((r: { status: string; copy: boolean }) => r.status === 'ready' && r.copy));
    const copyImport = await request(path, 'POST', { ...conflictBatch, dryRun: false, copyConflicts: true }, owner);
    assert.equal(copyImport.data.importedExamsCount, 1); assert.equal(copyImport.data.importedQuestionsCount, 1);
    const copyId = copyImport.data.results[0].id;
    assert.notEqual(copyId, importedId);
    const copyLoaded = (await request(`/api/exams/${copyId}`, 'GET', undefined, owner)).data.document;
    assert.match(copyLoaded.metadata.title, /Bản nhập riêng/); assert.equal(copyLoaded.questions[0].step_by_step_solution, changedSource.questions[0].step_by_step_solution);
    const retriedCopy = await request(path, 'POST', { ...conflictBatch, dryRun: false }, owner);
    assert.equal(retriedCopy.data.importedExamsCount, 0); assert.ok(retriedCopy.data.results.every((r: { status: string }) => r.status === 'already_imported'));
    // Removing the receipt simulates imports made before this release. Do not guess equality or overwrite them.
    const firstRevision = await prisma.examRevision.findUniqueOrThrow({ where: { examId_version: { examId: copyId, version: 1 } } });
    const oldSnapshot = { ...firstRevision.snapshot as Record<string, unknown> }; delete oldSnapshot._legacyImport;
    await prisma.examRevision.update({ where: { id: firstRevision.id }, data: { snapshot: JSON.parse(JSON.stringify(oldSnapshot)) } });
    const unknownCopy = await request(path, 'POST', { exams: [changedSource] }, owner);
    assert.equal(unknownCopy.data.errorCount, 1);
    await prisma.examRevision.update({ where: { id: firstRevision.id }, data: { snapshot: firstRevision.snapshot! } });
    const originalRevision = await prisma.examRevision.findUniqueOrThrow({ where: { examId_version: { examId: importedId, version: 1 } } });
    const withoutReceipt = { ...originalRevision.snapshot as Record<string, unknown> }; delete withoutReceipt._legacyImport;
    await prisma.examRevision.update({ where: { id: originalRevision.id }, data: { snapshot: JSON.parse(JSON.stringify(withoutReceipt)) } });
    const oldImport = await request(path, 'POST', { exams: [legacy] }, owner);
    assert.equal(oldImport.data.errorCount, 1); assert.equal(oldImport.data.results[0].canImportCopy, true);
    const oldCopy = await request(path, 'POST', { exams: [legacy], copyConflicts: true, dryRun: false }, owner);
    assert.equal(oldCopy.data.importedExamsCount, 1); assert.notEqual(oldCopy.data.results[0].id, importedId);
    await prisma.examRevision.update({ where: { id: originalRevision.id }, data: { snapshot: originalRevision.snapshot! } });
    const raceSources = [0, 1].map(i => ({ ...legacy, id: `race-${suffix}`, metadata: { ...legacy.metadata, title: `Racing source ${i}` } }));
    const race = await Promise.all(raceSources.map(source => request(path, 'POST', { exams: [source], dryRun: false }, owner)));
    assert.deepEqual(race.map(r => r.data.importedExamsCount).sort(), [0, 1]);
    const loser = race.findIndex(r => r.data.errorCount === 1);
    assert.ok(loser >= 0); assert.equal(race[loser].data.results[0].canImportCopy, true);
    const raceCopy = await request(path, 'POST', { exams: [raceSources[loser]], copyConflicts: true, dryRun: false }, owner);
    assert.equal(raceCopy.data.importedExamsCount, 1);
    const repeated = await request(path, 'POST', { ...batch, dryRun: false }, owner);
    assert.equal(repeated.data.importedExamsCount, 0); assert.equal(repeated.data.importedQuestionsCount, 0); assert.equal(repeated.data.results.filter((r: { status: string }) => r.status === 'already_imported').length, 2);
    assert.deepEqual((await request(`/api/exams/${importedId}`, 'GET', undefined, owner)).data.document, edited.data.document); assert.equal(await prisma.examRevision.count({ where: { examId: importedId } }), revisionCount);
    const resumed = await request(path, 'POST', { exams: [legacy, { ...broken, questions: [{ ...exam.questions[1], id: 'fixed' }] }], questions: [bank, { ...missingGrade, grade: 6 }], dryRun: false }, owner);
    assert.equal(resumed.data.errorCount, 0); assert.equal(resumed.data.importedExamsCount, 1); assert.equal(resumed.data.importedQuestionsCount, 1);
    const separate = await request(path, 'POST', { exams: [legacy], dryRun: false }, other);
    assert.equal(separate.data.importedExamsCount, 1); assert.notEqual(separate.data.results[0].id, importedId);
    assert.equal((await request(`/api/exams/${importedId}`, 'GET', undefined, other)).status, 404);
    const withPassage = { ...bank, id: 'linked-bank-' + suffix, passageId: 'old-passage', passage: { id: 'old-passage', content: 'Must not silently lose this passage' } };
    const refusedPassage = await request(path, 'POST', { questions: [withPassage], dryRun: false }, owner);
    assert.equal(refusedPassage.data.errorCount, 1); assert.equal(refusedPassage.data.importedQuestionsCount, 0); assert.match(refusedPassage.data.results[0].error, /ngữ liệu/);
    assert.equal(JSON.stringify(batch), source, 'All original input remains untouched.');

    // Exercise legacy aliases through HTTP, not just a client-side normalizer.
    // This fixture uses the suite's existing guarded DB, accounts and cleanup.
    const clearSource = { ...exam, id: `clear-legacy-${suffix}`, questions: [
      { id: 'legacy-mc', type: 'multiple_choice', difficulty: 'thong_hieu', content: 'Legacy MC to clear', points: 0, correctAnswer: 'A', choices: exam.questions[0].choices, payload: { correct: 'B', sourceArchive: { page: 7 } } },
      { id: 'legacy-short', type: 'short_answer', difficulty: 'thong_hieu', content: 'Legacy short answer to clear', points: 0, payload: { correct: '0', accepted_answers: ['0', 'zero'], sourceArchive: { page: 8 } } },
    ] };
    const originalClearSource = JSON.stringify(clearSource);
    const importedClear = await request(path, 'POST', { exams: [clearSource], dryRun: false }, owner);
    assert.equal(importedClear.status, 200); assert.equal(importedClear.data.errorCount, 0); assert.equal(importedClear.data.importedExamsCount, 1);
    const clearId = importedClear.data.results[0].id as string, clearPath = `/api/exams/${clearId}`;
    const clearLoaded = await request(clearPath, 'GET', undefined, owner);
    assert.equal(clearLoaded.status, 200);
    const clearDocument = clearLoaded.data.document as Exam;
    assert.equal(clearDocument.questions[0].correct_answer, 'A');
    assert.equal(clearDocument.questions[1].correct_answer, '0');
    assert.deepEqual(clearDocument.questions[1].accepted_answers, ['0', 'zero']);
    assert.equal('correctAnswer' in clearDocument.questions[0], false, 'Known legacy aliases must be consumed before a teacher starts editing.');
    const noAnswers = { ...clearDocument, questions: clearDocument.questions.map(question => ({ ...question, correct_answer: undefined, accepted_answers: undefined })) };
    // request() really JSON-omits undefined, matching the browser transport.
    const clearSaved = await request(clearPath, 'PATCH', { document: noAnswers, baseVersion: clearDocument.version }, owner);
    assert.equal(clearSaved.status, 200, clearSaved.data.error);
    const clearReloaded = await request(clearPath, 'GET', undefined, owner);
    assert.equal(clearReloaded.status, 200);
    for (const question of clearReloaded.data.document.questions) {
      assert.equal(question.correct_answer, undefined); assert.equal(question.accepted_answers, undefined); assert.equal(question.points, 0);
    }
    const clearedRows = await prisma.examQuestion.findMany({ where: { examId: clearId }, orderBy: { position: 'asc' }, include: { question: true } });
    assert.equal(clearedRows.length, 2);
    for (const [position, row] of clearedRows.entries()) {
      const payload = row.question.payload as Record<string, unknown>, editor = payload.editorData as Record<string, unknown>;
      assert.equal(payload.correct, undefined, 'Actual relational question payload must not retain the old answer.');
      assert.equal(payload.accepted_answers, undefined);
      assert.equal(editor.correct_answer, undefined); assert.equal(editor.correctAnswer, undefined); assert.equal(editor.accepted_answers, undefined);
      assert.deepEqual(editor.payload, { sourceArchive: { page: 7 + position } }, 'Unknown source data survives as opaque editor payload.');
      assert.equal(Number(row.question.points), 0);
    }
    const storedClearExam = await prisma.exam.findUniqueOrThrow({ where: { id: clearId } });
    const storedWorkspace = (storedClearExam.metadata as Record<string, unknown>).workspaceDocument as { questions: Record<string, unknown>[] };
    assert.ok(storedWorkspace.questions.every(question => question.correct_answer === undefined && question.accepted_answers === undefined));

    // Explicit canonical null must also beat stale fallback data supplied by an old file.
    const nullDocument = { ...clearReloaded.data.document, questions: clearReloaded.data.document.questions.map((question: Exam['questions'][number], index: number) => ({ ...question, correct_answer: null, accepted_answers: index ? null : [], payload: { sourceArchive: { page: 7 + index }, correct: 'STALE_KEY', accepted_answers: ['STALE_ACCEPTED'] } })) };
    const nullSaved = await request(clearPath, 'PATCH', { document: nullDocument, baseVersion: clearReloaded.data.document.version }, owner);
    assert.equal(nullSaved.status, 200, nullSaved.data.error);
    const nullReloaded = await request(clearPath, 'GET', undefined, owner);
    assert.equal(nullReloaded.status, 200);
    const nullRows = await prisma.examQuestion.findMany({ where: { examId: clearId }, orderBy: { position: 'asc' }, include: { question: true } });
    assert.equal(nullRows.length, 2);
    for (const [position, row] of nullRows.entries()) {
      const payload = row.question.payload as Record<string, unknown>, editor = payload.editorData as Record<string, unknown>;
      assert.equal(nullReloaded.data.document.questions[position].correct_answer, null); assert.equal(payload.correct, null);
      assert.deepEqual(nullReloaded.data.document.questions[position].accepted_answers, position ? null : []);
      assert.deepEqual(payload.accepted_answers, position ? null : []);
      assert.deepEqual(editor.payload, { sourceArchive: { page: 7 + position } });
      assert.ok(!JSON.stringify(payload).includes('STALE_'));
    }
    const clearVersion = nullReloaded.data.document.version;
    const clearRetry = await request(path, 'POST', { exams: [clearSource], dryRun: false }, owner);
    assert.equal(clearRetry.data.importedExamsCount, 0); assert.equal(clearRetry.data.errorCount, 0); assert.equal(clearRetry.data.results[0].status, 'already_imported');
    const afterClearRetry = await request(clearPath, 'GET', undefined, owner);
    assert.equal(afterClearRetry.data.document.version, clearVersion);
    assert.deepEqual(afterClearRetry.data.document.questions, nullReloaded.data.document.questions, 'Import retry must never restore the removed answers.');
    assert.equal(JSON.stringify(clearSource), originalClearSource);
    checks.push('http-legacy-preview-resume-idempotence-account');
  });
  await t.test('public share and assignment hide keys and assignment freezes the source', async () => {
    const shared = await request(`/api/exams/${id}/share`, 'POST', { showAnswers: false, allowCopy: false }, owner);
    assert.equal(shared.status, 200);
    const token = shared.data.publicLink.split('/').pop();
    const publicShare = await request('/api/public/share/' + token);
    assert.equal(publicShare.status, 200); assert.ok(!JSON.stringify(publicShare.data).includes('PRIVATE_SOLUTION'));
    assert.ok(!JSON.stringify(publicShare.data).includes('correct_answer'));
    const assigned = await request('/api/assignments', 'POST', { examId: id, title: 'HTTP assignment', identityMode: 'FREE_NAME', showResult: 'IMMEDIATE', showSolution: 'AFTER_CLOSE' }, owner);
    assert.equal(assigned.status, 200, assigned.data.error);
    assignmentId = assigned.data.assignment.id; publicId = assigned.data.assignment.publicId;
    const snapshotBefore = (await prisma.assignment.findUniqueOrThrow({ where: { id: assignmentId } })).snapshot;
    const saved = await request(`/api/exams/${id}`, 'PATCH', { document: { ...current, questions: [] }, baseVersion: current.version }, owner);
    assert.equal(saved.status, 200); current = saved.data.document;
    assert.deepEqual((await prisma.assignment.findUniqueOrThrow({ where: { id: assignmentId } })).snapshot, snapshotBefore);
    const publicAssignment = await request('/api/public/assignments/' + publicId);
    assert.equal(publicAssignment.status, 200); assert.ok(!JSON.stringify(publicAssignment.data).includes('PRIVATE_SOLUTION'));
    checks.push('http-public-redaction-immutable-snapshot');
  });
  await t.test('a signed-in teacher copies a shared exam into their own server library without answers the link hides', async () => {
    const copySource = await request('/api/exams', 'POST', { document: { ...exam, id: `draft_copy_${suffix}`, metadata: { ...exam.metadata, title: 'HTTP copy source' } } }, owner);
    assert.equal(copySource.status, 200, copySource.data.error);
    const sourceId = copySource.data.document.id as string, sourceBefore = JSON.stringify((await prisma.exam.findUniqueOrThrow({ where: { id: sourceId } })).metadata);
    const closed = await request(`/api/exams/${sourceId}/share`, 'POST', { showAnswers: false, allowCopy: false }, owner);
    const closedToken = closed.data.publicLink.split('/').pop();
    assert.equal((await request(`/api/public/share/${closedToken}/copy`, 'POST', undefined, other)).data.code, 'COPY_NOT_ALLOWED');
    const shared = await request(`/api/exams/${sourceId}/share`, 'POST', { showAnswers: false, allowCopy: true }, owner);
    const token = shared.data.publicLink.split('/').pop(), copyPath = `/api/public/share/${token}/copy`;
    assert.equal((await request(copyPath, 'POST')).status, 401);
    assert.equal((await request(copyPath, 'POST', undefined, other, 'http://evil.example')).status, 403);
    const wrongAccount = await fetch(origin + copyPath, { method: 'POST', headers: { Origin: origin, Cookie: other, 'x-examcraft-user': ids[0] } });
    assert.equal(wrongAccount.status, 409); assert.equal((await wrongAccount.json()).code, 'ACCOUNT_CHANGED');
    assert.equal(await prisma.exam.count({ where: { ownerId: ids[1], title: { startsWith: '[Bản sao] HTTP copy source' } } }), 0, 'Refused requests must not create a copy.');
    const copied = await request(copyPath, 'POST', undefined, other);
    assert.equal(copied.status, 200, copied.data.error);
    const copyId = copied.data.id as string;
    const stored = await prisma.exam.findUniqueOrThrow({ where: { id: copyId } });
    assert.equal(stored.ownerId, ids[1]); assert.equal(stored.title, '[Bản sao] HTTP copy source');
    const loaded = await request(`/api/exams/${copyId}`, 'GET', undefined, other);
    assert.equal(loaded.status, 200); assert.equal(loaded.data.permissions.role, 'OWNER');
    const loadedText = JSON.stringify(loaded.data.document);
    assert.ok(!loadedText.includes('PRIVATE_SOLUTION') && !loadedText.includes('PRIVATE_RUBRIC'), 'Copy must not carry solutions the link hides.');
    assert.equal(loaded.data.document.questions.length, 2); assert.equal(loaded.data.document.questions[0].points, 1);
    assert.equal(loaded.data.document.questions[0].choices.length, 2);
    const retry = await request(copyPath, 'POST', undefined, other);
    assert.equal(retry.status, 200); assert.equal(retry.data.id, copyId);
    assert.equal(await prisma.exam.count({ where: { ownerId: ids[1], title: '[Bản sao] HTTP copy source' } }), 1, 'Retry must not create a second copy.');
    assert.equal(JSON.stringify((await prisma.exam.findUniqueOrThrow({ where: { id: sourceId } })).metadata), sourceBefore, 'Copying must not change the shared exam.');
    assert.equal((await request(`/api/exams/${copyId}`, 'GET', undefined, owner)).status, 404, 'The original owner gets no access to the copy.');
    const publicSource = await request(`/api/public/share/${token}`);
    assert.equal(publicSource.data.sourceVersion, copySource.data.document.version);
    const versionBody = { sourceVersion: publicSource.data.sourceVersion };
    assert.equal((await request(copyPath, 'POST', { sourceVersion: 0 }, other)).status, 400);
    const concurrentCopies = await Promise.all([request(copyPath, 'POST', versionBody, other), request(copyPath, 'POST', versionBody, other)]);
    for (const receipt of concurrentCopies) assert.equal(receipt.status, 200, receipt.data.error);
    const versionCopy = concurrentCopies[0];
    assert.equal(concurrentCopies[1].data.id, versionCopy.data.id, 'Concurrent copy requests converge on one private copy.');
    assert.equal((await request(copyPath, 'POST', versionBody, other)).data.id, versionCopy.data.id);
    const privateCopy = (await request(`/api/exams/${versionCopy.data.id}`, 'GET', undefined, other)).data.document;
    const editedCopy = await request(`/api/exams/${privateCopy.id}`, 'PATCH', { baseVersion: privateCopy.version, document: { ...privateCopy, metadata: { ...privateCopy.metadata, title: 'My private edits' } } }, other);
    assert.equal(editedCopy.status, 200, editedCopy.data.error);
    const protectedCopy = await prisma.exam.findUniqueOrThrow({ where: { id: privateCopy.id } });
    assert.equal((await request(copyPath, 'POST', versionBody, other)).status, 409, 'Retry never overwrites edits in a private copy.');
    const nextSource = await request(`/api/exams/${sourceId}`, 'PATCH', { baseVersion: copySource.data.document.version, document: { ...copySource.data.document, metadata: { ...copySource.data.document.metadata, title: 'HTTP copy source updated' } } }, owner);
    assert.equal(nextSource.status, 200, nextSource.data.error);
    // The link is pinned to the version it was made from: later edits never reach it, and its copy stays the protected private copy.
    const stillOld = await request(`/api/public/share/${token}`);
    assert.equal(stillOld.data.sourceVersion, copySource.data.document.version); assert.equal(stillOld.data.pinned, true);
    assert.equal(stillOld.data.exam.metadata.title, 'HTTP copy source', 'an older link keeps showing the shared version');
    const staleCopy = await request(copyPath, 'POST', versionBody, other);
    assert.equal(staleCopy.status, 409); assert.equal(staleCopy.data.code, 'ALREADY_COPIED');
    const wrongVersion = await request(copyPath, 'POST', { sourceVersion: nextSource.data.document.version }, other);
    assert.equal(wrongVersion.status, 409); assert.equal(wrongVersion.data.code, 'SOURCE_CHANGED', 'a viewer who saw another version is told to reload');
    // A link made after the edit carries the new version and gets its own copy.
    const sharedAgain = await request(`/api/exams/${sourceId}/share`, 'POST', { showAnswers: false, allowCopy: true }, owner);
    const newToken = sharedAgain.data.publicLink.split('/').pop(), newCopyPath = `/api/public/share/${newToken}/copy`;
    const newView = await request(`/api/public/share/${newToken}`);
    const nextVersion = newView.data.sourceVersion;
    assert.equal(nextVersion, nextSource.data.document.version); assert.equal(newView.data.exam.metadata.title, 'HTTP copy source updated');
    const newCopy = await request(newCopyPath, 'POST', { sourceVersion: nextVersion }, other);
    assert.equal(newCopy.status, 200, newCopy.data.error); assert.notEqual(newCopy.data.id, privateCopy.id);
    assert.equal((await request(newCopyPath, 'POST', { sourceVersion: nextVersion }, other)).data.id, newCopy.data.id);
    assert.deepEqual(await prisma.exam.findUniqueOrThrow({ where: { id: privateCopy.id } }), protectedCopy, 'Copying a new source version leaves private edits intact.');
    assert.equal((await request(`/api/exams/${copyId}`, 'GET', undefined, other)).data.document.metadata.title, '[Bản sao] HTTP copy source', 'The legacy copy is retained.');
    assert.ok(!JSON.stringify((await request(`/api/exams/${newCopy.data.id}`, 'GET', undefined, other)).data.document).includes('PRIVATE_SOLUTION'));
    const linkedQuestionId = (await prisma.examQuestion.findFirstOrThrow({ where: { examId: sourceId }, orderBy: { position: 'asc' } })).questionId;
    const originalPassageId = (await prisma.question.findUniqueOrThrow({ where: { id: linkedQuestionId }, select: { passageId: true } })).passageId;
    const foreignPassage = await prisma.passage.create({ data: { ownerId: ids[1], content: 'PRIVATE_OTHER_ACCOUNT_PASSAGE' } });
    try {
      // Simulate an invalid legacy cross-owner reference only on the validated test database.
      await prisma.question.update({ where: { id: linkedQuestionId }, data: { passageId: foreignPassage.id } });
      const hiddenSource = await request(`/api/public/share/${token}`);
      assert.equal(hiddenSource.status, 404); assert.ok(!JSON.stringify(hiddenSource.data).includes('PRIVATE_OTHER_ACCOUNT_PASSAGE'));
      assert.equal((await request(copyPath, 'POST', { sourceVersion: nextVersion }, other)).status, 404);
      assert.equal((await request(`/api/exams/${sourceId}/share`, 'POST', { allowCopy: true }, owner)).status, 403);
    } finally {
      await prisma.question.update({ where: { id: linkedQuestionId }, data: { passageId: originalPassageId } });
      await prisma.passage.delete({ where: { id: foreignPassage.id } });
    }
    // Hold a TEST-DB row, prove the HTTP request is blocked behind that exact backend PID,
    // then commit a change. No timing-only sleep is used as evidence that the request arrived.
    let linkedId = sharedAgain.data.link.id as string, racePath = newCopyPath;
    const countBeforeRaces = await prisma.exam.count({ where: { ownerId: ids[1] } });
    const queuedCopy = async (row: 'exam' | 'link' | 'question', change: (tx: Prisma.TransactionClient) => Promise<unknown>, version: number) => {
      let pending: ReturnType<typeof request> | undefined;
      try {
        await prisma.$transaction(async tx => {
          if (row === 'exam') await tx.$queryRaw`SELECT "id" FROM "Exam" WHERE "id" = ${sourceId} FOR UPDATE`;
          else if (row === 'link') await tx.$queryRaw`SELECT "id" FROM "ShareLink" WHERE "id" = ${linkedId} FOR UPDATE`;
          else await tx.$queryRaw`SELECT "id" FROM "Question" WHERE "id" = ${linkedQuestionId} FOR UPDATE`;
          const [{ pid }] = await tx.$queryRaw<{ pid: number }[]>`SELECT pg_backend_pid() AS pid`;
          let settled = false;
          pending = request(racePath, 'POST', { sourceVersion: version }, other).finally(() => { settled = true; });
          const until = Date.now() + 5000;
          let observed = false;
          while (!settled && Date.now() < until) {
            const [{ waiting }] = await tx.$queryRaw<{ waiting: boolean }[]>`SELECT EXISTS (SELECT 1 FROM pg_stat_activity activity WHERE ${pid} = ANY(pg_blocking_pids(activity.pid))) AS waiting`;
            if (waiting) { observed = true; break; }
            await new Promise(resolve => setTimeout(resolve, 20));
          }
          assert.equal(observed, true, `Copy must wait for the ${row} edit before validating its snapshot.`);
          await change(tx);
        }, { timeout: 15000 });
        return await pending!;
      } finally { await pending?.catch(() => undefined); }
    };
    // The link is pinned: a source edit that lands while the copy waits for the exam lock cannot change what it copies.
    const sourceEditRace = await queuedCopy('exam', tx => tx.exam.update({ where: { id: sourceId }, data: { version: { increment: 1 } } }), nextVersion);
    assert.equal(sourceEditRace.status, 200, sourceEditRace.data.error); assert.equal(sourceEditRace.data.id, newCopy.data.id, 'the pinned copy is the same private copy');
    // A link made after that edit is pinned to the new version; the remaining races run against it.
    const raceShare = await request(`/api/exams/${sourceId}/share`, 'POST', { showAnswers: false, allowCopy: true }, owner);
    assert.equal(raceShare.status, 200, raceShare.data.error);
    linkedId = raceShare.data.link.id as string; racePath = `/api/public/share/${String(raceShare.data.publicLink).split('/').pop()}/copy`;
    const racedVersion = nextVersion + 1;
    const questionRightsRace = await queuedCopy('question', tx => tx.question.update({ where: { id: linkedQuestionId }, data: { shareable: false } }), racedVersion);
    assert.equal(questionRightsRace.status, 404);
    await prisma.question.update({ where: { id: linkedQuestionId }, data: { shareable: true } });
    const copyDisabledRace = await queuedCopy('link', tx => tx.shareLink.update({ where: { id: linkedId }, data: { allowCopy: false } }), racedVersion);
    assert.equal(copyDisabledRace.status, 403); assert.equal(copyDisabledRace.data.code, 'COPY_NOT_ALLOWED');
    await prisma.shareLink.update({ where: { id: linkedId }, data: { allowCopy: true } });
    const expiryRace = await queuedCopy('link', tx => tx.shareLink.update({ where: { id: linkedId }, data: { expiresAt: new Date(Date.now() - 1000) } }), racedVersion);
    assert.equal(expiryRace.status, 404);
    await prisma.shareLink.update({ where: { id: linkedId }, data: { expiresAt: null } });
    const revokedRace = await queuedCopy('link', tx => tx.shareLink.update({ where: { id: linkedId }, data: { revokedAt: new Date() } }), racedVersion);
    assert.equal(revokedRace.status, 404);
    assert.equal((await request(racePath, 'POST', { sourceVersion: nextVersion }, other)).status, 404, 'Revoked link wins over source version checks.');
    assert.equal(await prisma.exam.count({ where: { ownerId: ids[1] } }), countBeforeRaces, 'Refused queued requests create no private copies.');
    assert.deepEqual(await prisma.exam.findUniqueOrThrow({ where: { id: privateCopy.id } }), protectedCopy);
    // Reverse order: hold only the recipient FK so copy reaches INSERT while keeping its source locks.
    // Revocation must then wait for that copy's backend, and must not delete its valid private result.
    await prisma.shareLink.update({ where: { id: linkedId }, data: { revokedAt: null } });
    let copyFirst: ReturnType<typeof request> | undefined, revokeSecond: ReturnType<typeof request> | undefined;
    try {
      await prisma.$transaction(async tx => {
        await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${ids[1]} FOR UPDATE`;
        const [{ pid: blockerPid }] = await tx.$queryRaw<{ pid: number }[]>`SELECT pg_backend_pid() AS pid`;
        const waitForBackend = async (pid: number) => {
          const until = Date.now() + 5000;
          while (Date.now() < until) {
            const waiting = await tx.$queryRaw<{ pid: number }[]>`SELECT activity.pid FROM pg_stat_activity activity WHERE ${pid} = ANY(pg_blocking_pids(activity.pid)) LIMIT 1`;
            if (waiting[0]) return waiting[0].pid;
            await new Promise(resolve => setTimeout(resolve, 20));
          }
          throw Error('Expected a backend to wait for the proven copy/revoke ordering.');
        };
        copyFirst = request(racePath, 'POST', { sourceVersion: racedVersion }, other);
        const copyPid = await waitForBackend(blockerPid);
        revokeSecond = request(`/api/exams/${sourceId}/share`, 'DELETE', { linkId: linkedId }, owner);
        await waitForBackend(copyPid);
      }, { timeout: 15000 });
      const copiedBeforeRevoke = await copyFirst!;
      assert.equal(copiedBeforeRevoke.status, 200, copiedBeforeRevoke.data.error);
      assert.equal((await revokeSecond!).status, 200);
      const retained = await request(`/api/exams/${copiedBeforeRevoke.data.id}`, 'GET', undefined, other);
      assert.equal(retained.status, 200); assert.equal(retained.data.permissions.role, 'OWNER');
      assert.equal((await request(racePath, 'POST', { sourceVersion: racedVersion }, other)).status, 404);
      assert.equal(await prisma.exam.count({ where: { ownerId: ids[1] } }), countBeforeRaces + 1);
    } finally { await Promise.allSettled([copyFirst, revokeSecond].filter(Boolean)); }
    checks.push('http-share-copy-to-server-library');
  });
  await t.test('attempt cookie is required; submit is idempotent and essay remains pending', async () => {
    const started = await request(`/api/public/assignments/${publicId}/start`, 'POST', { freeName: 'HTTP student fixture' });
    assert.equal(started.status, 200, started.data.error); attemptId = started.data.attempt.id; attemptCookie = started.cookie;
    assert.ok(attemptCookie.startsWith('exam_attempt_'));
    assert.equal((await request(`/api/public/attempts/${attemptId}/draft`, 'PATCH', { draft: { mc: 'A' } })).status, 403);
    const draftPath = `/api/public/attempts/${attemptId}/draft`;
    const baseDraftRevision = started.data.attempt.draftRevision;
    assert.match(baseDraftRevision, /^[a-f0-9]{64}$/);
    assert.equal((await request(draftPath, 'PATCH', { draft: { mc: 'B' } }, attemptCookie)).status, 400);
    const competingDrafts = await Promise.all([
      request(draftPath, 'PATCH', { draft: { mc: 'A', essay: 'Fixture response' }, baseDraftRevision }, attemptCookie),
      request(draftPath, 'PATCH', { draft: { mc: 'B', essay: 'Other tab response' }, baseDraftRevision }, attemptCookie),
    ]);
    assert.deepEqual(competingDrafts.map(r => r.status).sort(), [200, 409], 'Only one concurrent draft on the same base may win.');
    const winner = competingDrafts.find(r => r.status === 200)!;
    const staleDraft = await request(draftPath, 'PATCH', { draft: { mc: 'B', essay: 'Late overwrite' }, baseDraftRevision }, attemptCookie);
    assert.equal(staleDraft.status, 409); assert.equal(staleDraft.data.code, 'DRAFT_CONFLICT');
    const afterRace = await prisma.attempt.findUniqueOrThrow({ where: { id: attemptId } });
    const resumed = await request(`/api/public/assignments/${publicId}/start`, 'POST', { freeName: 'HTTP student fixture' }, attemptCookie);
    assert.equal(resumed.status, 200); assert.equal(resumed.data.resumed, true);
    assert.deepEqual(resumed.data.attempt.draft, afterRace.draft);
    assert.equal(resumed.data.attempt.draftRevision, winner.data.draftRevision);
    const finalizedDraft = await request(draftPath, 'PATCH', { draft: { mc: 'A', essay: 'Fixture response' }, baseDraftRevision: winner.data.draftRevision }, attemptCookie);
    assert.equal(finalizedDraft.status, 200);
    const retryReceipt = await request(draftPath, 'PATCH', { draft: { essay: 'Fixture response', mc: 'A' }, baseDraftRevision }, attemptCookie);
    assert.equal(retryReceipt.status, 200, 'Retrying identical content after a lost receipt must be safe.');
    assert.equal(retryReceipt.data.draftRevision, finalizedDraft.data.draftRevision);
    const staleSubmit = await request(`/api/public/attempts/${attemptId}/submit`, 'POST', { answers: { mc: 'B' }, baseDraftRevision }, attemptCookie);
    assert.equal(staleSubmit.status, 409); assert.equal(staleSubmit.data.code, 'DRAFT_CONFLICT');
    assert.equal(await prisma.attemptAnswer.count({ where: { attemptId } }), 0);
    assert.equal((await prisma.attempt.findUniqueOrThrow({ where: { id: attemptId } })).status, 'IN_PROGRESS');
    const submitted = await request(`/api/public/attempts/${attemptId}/submit`, 'POST', { answers: { mc: 'A', essay: 'Fixture response' }, baseDraftRevision: finalizedDraft.data.draftRevision }, attemptCookie);
    assert.equal(submitted.status, 200, submitted.data.error); assert.equal(submitted.data.needsGrading, true); assert.equal(Number(submitted.data.score), 1); assert.equal(submitted.data.solutions, null);
    assert.equal((await request(`/api/public/attempts/${attemptId}/submit`, 'POST', { answers: { mc: 'B' } }, attemptCookie)).data.idempotent, true);
    assert.equal(await prisma.attemptAnswer.count({ where: { attemptId } }), 2);
    const pendingMonitor = await request(`/api/teacher/assignments/${assignmentId}`, 'GET', undefined, owner);
    assert.equal(pendingMonitor.status, 200);
    assert.equal(pendingMonitor.data.stats.totalSubmitted, 1);
    assert.equal(pendingMonitor.data.stats.totalPendingGrading, 1);
    assert.equal(pendingMonitor.data.stats.totalGraded, 0);
    const initialGradeDetail = await request(`/api/teacher/attempts/${attemptId}`, 'GET', undefined, owner);
    const baseGradeRevision = initialGradeDetail.data.questions.find((q: { questionId: string }) => q.questionId === 'essay').gradeRevision;
    assert.match(baseGradeRevision, /^[a-f0-9]{64}$/);
    assert.equal((await request(`/api/teacher/attempts/${attemptId}`, 'POST', { questionKey: 'essay', earned: 0.1 }, owner)).status, 400);
    assert.equal((await request(`/api/teacher/attempts/${attemptId}`, 'POST', { questionKey: 'not-in-snapshot', earned: 1, baseGradeRevision }, owner)).status, 400);
    assert.equal((await request(`/api/teacher/attempts/${attemptId}`, 'POST', { questionKey: 'essay', earned: 2, baseGradeRevision }, owner)).status, 400);
    const attemptBeforeStaleGrade = await prisma.attempt.findUniqueOrThrow({ where: { id: attemptId }, include: { answers: true } });
    const staleGrade = await fetch(origin + `/api/teacher/attempts/${attemptId}`, { method: 'POST', headers: { Origin: origin, Cookie: owner, 'Content-Type': 'application/json', 'x-examcraft-user': ids[1] }, body: JSON.stringify({ questionKey: 'essay', earned: 0.5, teacherComment: 'Must not be written', baseGradeRevision }) });
    assert.equal(staleGrade.status, 409); assert.equal((await staleGrade.json()).code, 'ACCOUNT_CHANGED');
    assert.deepEqual(await prisma.attempt.findUniqueOrThrow({ where: { id: attemptId }, include: { answers: true } }), attemptBeforeStaleGrade, 'A stale account must not change the attempt, answers or teacher comments.');
    assert.equal(await prisma.auditLog.count({ where: { action: 'attempt.grade', targetId: attemptId } }), 0);
    const competingGrades = await Promise.all([0.1, 0.2].map(earned => request(`/api/teacher/attempts/${attemptId}`, 'POST', { questionKey: 'essay', earned, baseGradeRevision }, owner)));
    assert.deepEqual(competingGrades.map(r => r.status).sort(), [200, 409]);
    assert.equal(await prisma.auditLog.count({ where: { action: 'attempt.grade', targetId: attemptId } }), 1);
    const currentGradeDetail = await request(`/api/teacher/attempts/${attemptId}`, 'GET', undefined, owner);
    const currentGradeRevision = currentGradeDetail.data.questions.find((q: { questionId: string }) => q.questionId === 'essay').gradeRevision;
    const beforeOldGradeRetry = await prisma.attempt.findUniqueOrThrow({ where: { id: attemptId }, include: { answers: true } });
    const oldGradeRetry = await request(`/api/teacher/attempts/${attemptId}`, 'POST', { questionKey: 'essay', earned: 0.9, teacherComment: 'Old page must not overwrite', baseGradeRevision }, owner);
    assert.equal(oldGradeRetry.status, 409); assert.equal(oldGradeRetry.data.code, 'GRADE_CONFLICT');
    assert.deepEqual(await prisma.attempt.findUniqueOrThrow({ where: { id: attemptId }, include: { answers: true } }), beforeOldGradeRetry);
    const graded = await request(`/api/teacher/attempts/${attemptId}`, 'POST', { questionKey: 'essay', earned: 0.29, teacherComment: 'Fixture feedback', baseGradeRevision: currentGradeRevision }, owner);
    assert.equal(graded.status, 200, graded.data.error); assert.equal(Number(graded.data.newScore), 1.29); assert.equal(graded.data.needsGrading, false);
    const gradeReceiptRetry = await request(`/api/teacher/attempts/${attemptId}`, 'POST', { questionKey: 'essay', earned: 0.29, teacherComment: 'Fixture feedback', baseGradeRevision: currentGradeRevision }, owner);
    assert.equal(gradeReceiptRetry.status, 200);
    assert.equal(await prisma.auditLog.count({ where: { action: 'attempt.grade', targetId: attemptId } }), 2, 'Lost-receipt retries must not add duplicate grade history.');
    const finalGradeDetail = await request(`/api/teacher/attempts/${attemptId}`, 'GET', undefined, owner);
    assert.equal(finalGradeDetail.data.gradingHistory.length, 2);
    assert.equal(finalGradeDetail.data.gradingHistory[0].meta.after.earned, 0.29);
    assert.equal(finalGradeDetail.data.gradingHistory[0].meta.after.comment, 'Fixture feedback');
    assert.equal((await request(`/api/teacher/attempts/${attemptId}`, 'GET', undefined, other)).status, 404);
    const gradedMonitor = await request(`/api/teacher/assignments/${assignmentId}`, 'GET', undefined, owner);
    assert.equal(gradedMonitor.data.stats.totalSubmitted, 1);
    assert.equal(gradedMonitor.data.stats.totalPendingGrading, 0);
    assert.equal(gradedMonitor.data.stats.totalGraded, 1);
    // Synthetic audit rows only: compare actual PostgreSQL seek order, including a timestamp tie.
    const tieTime = new Date('2025-01-01T00:00:00.000Z');
    await prisma.auditLog.createMany({ data: Array.from({ length: 105 }, (_, i) => ({
      id: `paging_${suffix}_${String(i).padStart(3, '0')}`, actorId: ids[0], action: 'attempt.grade', targetType: 'Attempt', targetId: attemptId, createdAt: tieTime,
      meta: { questionKey: 'essay', before: { earned: 0, comment: null }, after: { earned: 0.29, comment: null } },
    })) });
    const expectedHistory = await prisma.auditLog.findMany({ where: { action: 'attempt.grade', targetId: attemptId }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], select: { id: true } });
    const firstPage = await request(`/api/teacher/attempts/${attemptId}`, 'GET', undefined, owner);
    assert.equal(firstPage.data.gradingHistory.length, 50); assert.equal(firstPage.data.historyHasMore, true);
    assert.ok(Array.isArray(firstPage.data.questions), 'GET without a cursor preserves the detail response.');
    const firstCursor = firstPage.data.historyNextCursor;
    assert.equal((await request(`/api/teacher/attempts/${attemptId}?historyCursor=bad`, 'GET', undefined, owner)).status, 400);
    assert.equal((await request(`/api/teacher/attempts/${attemptId}?historyCursor=bad`, 'GET', undefined, other)).status, 404);
    const foreignCursor = encodeGradeHistoryCursor('another-attempt', { id: 'row', createdAt: tieTime });
    assert.equal((await request(`/api/teacher/attempts/${attemptId}?historyCursor=${foreignCursor}`, 'GET', undefined, owner)).status, 400);
    assert.equal((await request(`/api/teacher/attempts/${attemptId}?historyCursor=${firstCursor}`)).status, 401);
    await prisma.auditLog.create({ data: { id: `paging_new_${suffix}`, actorId: ids[0], action: 'attempt.grade', targetType: 'Attempt', targetId: attemptId, createdAt: new Date(Date.now() + 60000), meta: { fixture: true } } });
    const seenHistory: string[] = firstPage.data.gradingHistory.map((entry: { id: string }) => entry.id);
    let cursor = firstCursor;
    for (let page = 0; cursor && page < 5; page++) {
      const older = await request(`/api/teacher/attempts/${attemptId}?historyCursor=${encodeURIComponent(cursor)}`, 'GET', undefined, owner);
      assert.equal(older.status, 200);
      assert.deepEqual(Object.keys(older.data).sort(), ['gradingHistory', 'historyHasMore', 'historyNextCursor']);
      seenHistory.push(...older.data.gradingHistory.map((entry: { id: string }) => entry.id));
      cursor = older.data.historyNextCursor;
    }
    assert.equal(cursor, null);
    assert.deepEqual(seenHistory, expectedHistory.map(entry => entry.id));
    assert.equal(new Set(seenHistory).size, expectedHistory.length, 'Timestamp ties and a newly inserted grade must not duplicate or skip the older pages.');
    checks.push('http-grade-history-owner-cursor-ties-and-new-events');
    checks.push('http-attempt-capability-submit-and-manual-grade');
  });
  await t.test('saved-only submission preserves the server draft when another page has unsubmitted conflicting answers', async () => {
    const started = await request(`/api/public/assignments/${publicId}/start`, 'POST', { freeName: 'HTTP saved-only fixture' });
    assert.equal(started.status, 200);
    const attempt = started.data.attempt, cookie = started.cookie;
    const saved = await request(`/api/public/attempts/${attempt.id}/draft`, 'PATCH', { draft: { mc: 'A', essay: 'Server acknowledged essay' }, baseDraftRevision: attempt.draftRevision }, cookie);
    assert.equal(saved.status, 200);
    const stale = await request(`/api/public/attempts/${attempt.id}/submit`, 'POST', { answers: { mc: 'B', essay: 'Unsent other-page essay' }, baseDraftRevision: attempt.draftRevision }, cookie);
    assert.equal(stale.status, 409);
    assert.equal((await request(`/api/public/attempts/${attempt.id}/submit`, 'POST', { answers: {}, useSavedDraftOnly: true })).status, 403);
    const badMode = await request(`/api/public/attempts/${attempt.id}/submit`, 'POST', { answers: {}, useSavedDraftOnly: 'true' }, cookie);
    assert.equal(badMode.status, 400);
    const submitted = await request(`/api/public/attempts/${attempt.id}/submit`, 'POST', { answers: { mc: 'B', essay: 'Must never replace server' }, useSavedDraftOnly: true }, cookie);
    assert.equal(submitted.status, 200, submitted.data.error);
    assert.equal(Number(submitted.data.score), 1);
    assert.equal(submitted.data.responses.mc, 'A');
    assert.equal(submitted.data.responses.essay, 'Server acknowledged essay');
    const row = await prisma.attempt.findUniqueOrThrow({ where: { id: attempt.id }, include: { answers: true } });
    assert.deepEqual(row.draft, { mc: 'A', essay: 'Server acknowledged essay' });
    assert.equal(row.answers.find(answer => answer.questionKey === 'essay')?.response, 'Server acknowledged essay');
    assert.equal(row.answers.length, 2);
    checks.push('http-saved-only-submit-keeps-acknowledged-draft');
  });
  await t.test('history restore keeps student answers, restores pending distinctly from zero, isolates owners and serializes concurrent changes', async () => {
    const path = `/api/teacher/attempts/${attemptId}`;
    const initial = await prisma.attempt.findUniqueOrThrow({ where: { id: attemptId }, include: { answers: true, assignment: true } });
    const events = await prisma.auditLog.findMany({ where: { action: 'attempt.grade', targetId: attemptId }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] });
    const first = events.find(event => {
      const meta = JSON.parse(JSON.stringify(event.meta));
      return meta?.questionKey === 'essay' && meta.before?.manualScore === null && typeof meta.after?.manualScore === 'number';
    });
    const last = events.find(event => {
      const meta = JSON.parse(JSON.stringify(event.meta)); return meta?.after?.manualScore === 0.29;
    });
    assert.ok(first); assert.ok(last);
    const base = async () => (await request(path, 'GET', undefined, owner)).data.questions.find((q: { questionId: string }) => q.questionId === 'essay').gradeRevision;
    const initialBase = await base();
    const body = { action: 'restore', eventId: first.id, side: 'before', baseGradeRevision: initialBase };
    const staleAccount = await fetch(origin + path, { method: 'POST', headers: { Origin: origin, Cookie: owner, 'x-examcraft-user': ids[1], 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    assert.equal(staleAccount.status, 409); assert.equal((await staleAccount.json()).code, 'ACCOUNT_CHANGED');
    assert.deepEqual(await prisma.attempt.findUniqueOrThrow({ where: { id: attemptId }, include: { answers: true, assignment: true } }), initial);
    const unfinished = await request(`/api/public/assignments/${publicId}/start`, 'POST', { freeName: 'HTTP unsubmitted restore fixture' });
    assert.equal(unfinished.status, 200);
    const unfinishedBefore = await prisma.attempt.findUniqueOrThrow({ where: { id: unfinished.data.attempt.id } });
    assert.equal((await request(`/api/teacher/attempts/${unfinished.data.attempt.id}`, 'POST', body, owner)).status, 409);
    assert.deepEqual(await prisma.attempt.findUniqueOrThrow({ where: { id: unfinished.data.attempt.id } }), unfinishedBefore);
    assert.equal((await request(path, 'POST', body, other)).status, 404);
    assert.equal((await request(path, 'POST', body, owner, 'https://wrong-origin.invalid')).status, 403);
    assert.equal((await request(path, 'POST', { ...body, earned: 0.9 }, owner)).status, 400, 'The client cannot supply a historical grade.');
    assert.equal((await request(path, 'POST', { ...body, eventId: 'missing-event' }, owner)).status, 404);
    const badEvent = await prisma.auditLog.create({ data: { actorId: ids[0], action: 'attempt.grade', targetType: 'Attempt', targetId: attemptId, meta: { questionKey: 'essay', before: { earned: 0 } } } });
    assert.equal((await request(path, 'POST', { ...body, eventId: badEvent.id }, owner)).status, 422);
    const foreignEvent = await prisma.auditLog.create({ data: { actorId: ids[0], action: 'attempt.grade', targetType: 'Attempt', targetId: 'another-attempt', meta: first.meta! } });
    assert.equal((await request(path, 'POST', { ...body, eventId: foreignEvent.id }, owner)).status, 404);
    const count = () => prisma.auditLog.count({ where: { action: 'attempt.grade', targetId: attemptId } });
    const beforeCount = await count();
    const restored = await request(path, 'POST', body, owner);
    assert.equal(restored.status, 200, restored.data.error); assert.equal(restored.data.restored, true); assert.equal(restored.data.needsGrading, true);
    let row = await prisma.attempt.findUniqueOrThrow({ where: { id: attemptId }, include: { answers: true, assignment: true } });
    const essay = row.answers.find(answer => answer.questionKey === 'essay')!;
    assert.equal(essay.manualScore, null); assert.equal(essay.isCorrect, null); assert.equal(essay.comment, null); assert.equal(Number(essay.earned), 0);
    assert.equal(Number(row.score), 1);
    assert.deepEqual(row.answers.map(a => [a.questionKey, a.response]).sort(), initial.answers.map(a => [a.questionKey, a.response]).sort());
    assert.deepEqual(row.assignment.snapshot, initial.assignment.snapshot);
    assert.deepEqual(await prisma.auditLog.findUnique({ where: { id: first.id } }), first, 'Restoration never edits the original event.');
    const restorationEvent = await prisma.auditLog.findFirstOrThrow({ where: { action: 'attempt.grade', targetId: attemptId, meta: { path: ['restoredFrom', 'eventId'], equals: first.id } } });
    assert.deepEqual(JSON.parse(JSON.stringify(restorationEvent.meta)).restoredFrom, { eventId: first.id, side: 'before' });
    assert.equal(await count(), beforeCount + 1);
    const retry = await request(path, 'POST', body, owner);
    assert.equal(retry.status, 200); assert.equal(retry.data.restored, false); assert.equal(await count(), beforeCount + 1);
    const stale = await request(path, 'POST', { ...body, eventId: last.id, side: 'after' }, owner);
    assert.equal(stale.status, 409); assert.equal(stale.data.code, 'GRADE_CONFLICT');
    assert.deepEqual(await prisma.attempt.findUniqueOrThrow({ where: { id: attemptId }, include: { answers: true, assignment: true } }), row);
    // A graded zero differs from pending, so both concurrent restoration targets differ from this base.
    assert.equal((await request(path, 'POST', { questionKey: 'essay', earned: 0, teacherComment: '', baseGradeRevision: await base() }, owner)).status, 200);
    const zeroBase = await base();
    const competing = await Promise.all([
      request(path, 'POST', { ...body, baseGradeRevision: zeroBase }, owner),
      request(path, 'POST', { ...body, eventId: last.id, side: 'after', baseGradeRevision: zeroBase }, owner),
    ]);
    assert.deepEqual(competing.map(result => result.status).sort(), [200, 409]);
    const final = await request(path, 'POST', { ...body, eventId: last.id, side: 'after', baseGradeRevision: await base() }, owner);
    assert.equal(final.status, 200); assert.equal(final.data.needsGrading, false); assert.equal(Number(final.data.newScore), 1.29);
    row = await prisma.attempt.findUniqueOrThrow({ where: { id: attemptId }, include: { answers: true, assignment: true } });
    assert.deepEqual(row.answers.map(a => [a.questionKey, a.response]).sort(), initial.answers.map(a => [a.questionKey, a.response]).sort());
    assert.deepEqual(row.assignment.snapshot, initial.assignment.snapshot);
    checks.push('http-history-restore-cas-pending-zero-owner-idempotence');
  });
  await t.test('comment-only work saves and restores feedback without creating numeric scores', async () => {
    const created = await request('/api/exams', 'POST', { document: { ...exam, id: `comment_only_${suffix}`, metadata: { ...exam.metadata, assessmentMode: 'comment_only', title: 'HTTP feedback-only fixture' } } }, owner);
    assert.equal(created.status, 200, created.data.error);
    const assigned = await request('/api/assignments', 'POST', { examId: created.data.document.id, title: 'HTTP feedback-only assignment', identityMode: 'FREE_NAME' }, owner);
    assert.equal(assigned.status, 200, assigned.data.error);
    const started = await request(`/api/public/assignments/${assigned.data.assignment.publicId}/start`, 'POST', { freeName: 'HTTP feedback-only student' });
    assert.equal(started.status, 200);
    const ownId = started.data.attempt.id;
    const submitted = await request(`/api/public/attempts/${ownId}/submit`, 'POST', { answers: { essay: 'Student feedback-only response' }, baseDraftRevision: started.data.attempt.draftRevision }, started.cookie);
    assert.equal(submitted.status, 200); assert.equal(submitted.data.score, null);
    const path = `/api/teacher/attempts/${ownId}`;
    const detail = () => request(path, 'GET', undefined, owner);
    const revision = async () => (await detail()).data.questions.find((q: { questionId: string }) => q.questionId === 'essay').gradeRevision;
    assert.equal((await detail()).data.attempt.assessmentMode, 'comment_only');
    assert.equal((await request(path, 'POST', { questionKey: 'essay', earned: 1, teacherComment: 'Must not assign a score', baseGradeRevision: await revision() }, owner)).status, 400);
    assert.equal((await request(path, 'POST', { questionKey: 'essay', earned: null, teacherComment: 'Nhận xét đầu', baseGradeRevision: await revision() }, owner)).status, 200);
    const originalEvent = (await detail()).data.gradingHistory[0];
    assert.equal((await request(path, 'POST', { questionKey: 'essay', earned: null, teacherComment: 'Nhận xét sau', baseGradeRevision: await revision() }, owner)).status, 200);
    const before = await prisma.attempt.findUniqueOrThrow({ where: { id: ownId }, include: { answers: true, assignment: true } });
    const restored = await request(path, 'POST', { action: 'restore', eventId: originalEvent.id, side: 'after', baseGradeRevision: await revision() }, owner);
    assert.equal(restored.status, 200, restored.data.error); assert.equal(restored.data.newScore, null);
    const after = await prisma.attempt.findUniqueOrThrow({ where: { id: ownId }, include: { answers: true, assignment: true } });
    assert.equal(after.score, null); assert.equal(after.maxScore, null);
    const essay = after.answers.find(answer => answer.questionKey === 'essay')!;
    assert.equal(essay.comment, 'Nhận xét đầu'); assert.equal(essay.isCorrect, null); assert.equal(Number(essay.manualScore), 0);
    assert.deepEqual(after.answers.map(answer => [answer.questionKey, answer.response]).sort(), before.answers.map(answer => [answer.questionKey, answer.response]).sort());
    assert.deepEqual(after.assignment.snapshot, before.assignment.snapshot);
    checks.push('http-comment-only-feedback-restoration-without-numeric-score');
  });
  await t.test('knowledge snapshot and scope survive HTTP saves, reject a changed revision and stay out of public shares', async () => {
    const pkg = parseKnowledgePackage({ ...knowledgeFixture, sources: [{ id: 'teacher-note', title: 'PRIVATE_SOURCE_TITLE', rights: 'unknown' }] });
    const scope = { ...emptyKnowledgeScope(pkg), includeKnowledgeIds: ['addition'], methodConstraints: ['Fixture method limit'] };
    const input = { ...exam, id: 'knowledge-' + suffix, metadata: { ...exam.metadata, knowledgePackage: pkg, knowledgeScope: scope }, questions: exam.questions.map(q => ({ ...q, knowledgeIds: ['addition'], outcomeIds: ['outcome-add'], knowledgeReference: { packageId: pkg.id, packageRevision: pkg.revision } })) };
    const plan = { ...createExamPlan(input), slots: input.questions.map(q => ({ id: q.id, type: q.type, cognitiveLevel: null, outcomeId: 'outcome-add', count: 1, targetPointsHundredths: 100 })) };
    const headerLayout = { formatVersion: 1, lines: [{ id: 'private-line', area: 'left', align: 'right', hidden: false, text: 'HEADER_LAYOUT_PRIVATE_TEXT' }, { id: 'blank-title', area: 'right', align: 'center', hidden: false, binding: 'title', override: '' }] };
    const created = await request('/api/exams', 'POST', { document: { ...input, metadata: { ...input.metadata, examPlan: plan, headerLayout } } }, owner);
    assert.equal(created.status, 200, created.data.error);
    const document = created.data.document, path = `/api/exams/${document.id}`;
    assert.deepEqual(document.metadata.knowledgeScope, scope); assert.equal(document.metadata.knowledgePackage.status, 'needs_review');
      const reloaded = await request(path, 'GET', undefined, owner);
      assert.deepEqual(reloaded.data.document.questions[0].knowledgeReference, { packageId: pkg.id, packageRevision: pkg.revision });
      assert.deepEqual(reloaded.data.document.questions[0].knowledgeIds, ['addition']);
    assert.deepEqual(reloaded.data.document.metadata.examPlan, plan);
    assert.deepEqual(reloaded.data.document.metadata.headerLayout, headerLayout);
    assert.equal(compareExamPlan(reloaded.data.document).matches, true);
    const invalidPlan = await request(path, 'PATCH', { document: { ...document, metadata: { ...document.metadata, examPlan: { ...plan, slots: [{ ...plan.slots[0], count: -1 }] } } }, baseVersion: 1 }, owner);
    assert.equal(invalidPlan.status, 400);
    assert.deepEqual((await request(path, 'GET', undefined, owner)).data.document.metadata.examPlan, plan);
    const invalidLayout = await request(path, 'PATCH', { document: { ...document, metadata: { ...document.metadata, headerLayout: { ...headerLayout, lines: [headerLayout.lines[0], headerLayout.lines[0]] } } }, baseVersion: 1 }, owner);
    assert.equal(invalidLayout.status, 400);
    assert.deepEqual((await request(path, 'GET', undefined, owner)).data.document.metadata.headerLayout, headerLayout);
    const changed = structuredClone(pkg); changed.knowledge[0].title = 'Changed under old revision';
    const rejected = await request(path, 'PATCH', { document: { ...document, metadata: { ...document.metadata, knowledgePackage: changed } }, baseVersion: 1 }, owner);
    assert.equal(rejected.status, 409); assert.equal(rejected.data.code, 'KNOWLEDGE_REVISION_CONFLICT');
    assert.equal((await request(path, 'GET', undefined, owner)).data.document.version, 1);
    const wrongScope = await request(path, 'PATCH', { document: { ...document, metadata: { ...document.metadata, knowledgePackage: { ...changed, revision: 'r2' } } }, baseVersion: 1 }, owner);
    assert.equal(wrongScope.status, 400);
    const accepted = await request(path, 'PATCH', { document: { ...document, metadata: { ...document.metadata, knowledgePackage: { ...changed, revision: 'r2' }, knowledgeScope: { ...scope, packageRevision: 'r2' } } }, baseVersion: 1 }, owner);
    assert.equal(accepted.status, 200, accepted.data.error);
    assert.deepEqual(accepted.data.document.metadata.examPlan, plan, 'Historical plan must survive a package revision change for review.');
    assert.equal(compareExamPlan(accepted.data.document).stale, true);
    const shared = await request(`${path}/share`, 'POST', { showAnswers: false, allowCopy: false }, owner);
    assert.equal(shared.status, 200);
    const publicView = await request('/api/public/share/' + shared.data.publicLink.split('/').pop());
    assert.equal(publicView.status, 200); assert.ok(!JSON.stringify(publicView.data).includes('PRIVATE_SOURCE_TITLE')); assert.ok(!JSON.stringify(publicView.data).includes('knowledgePackage'));
    assert.ok(!JSON.stringify(publicView.data).includes('examPlan'));
    assert.ok(!JSON.stringify(publicView.data).includes('HEADER_LAYOUT_PRIVATE_TEXT')); assert.ok(!JSON.stringify(publicView.data).includes('headerLayout'));
    checks.push('http-knowledge-package-scope-revision-private-source');
  });
  await t.test('personal templates are private immutable copies with source checks, retry safety and portable applied snapshots', async () => {
    const snapshot = captureTemplateSnapshot(exam);
    const body = { clientRequestId: randomUUID(), name: 'QA private template', subject: 'toan', gradeFrom: 6, gradeTo: 6, sources: [{ title: 'QA self-declared source', rights: 'unknown' }], snapshot };
    const made = await Promise.all([request('/api/templates', 'POST', body, owner), request('/api/templates', 'POST', body, owner)]);
    assert.deepEqual(made.map(r => r.status).sort(), [200, 201]);
    const template = made[0].data.template;
      assert.equal(parseSavedTemplate(made[0].data).id, template.id, 'Client parser must accept the real save/replay contract.');
      assert.equal(parseOpenedTemplate((await request(`/api/templates/${template.id}`, 'GET', undefined, owner)).data, template.id).revision, template.revision);
    assert.equal(made[1].data.template.id, template.id);
    assert.equal(template.category, 'personal'); assert.equal(template.status, 'needs_review');
    assert.equal(await prisma.examTemplate.count({ where: { ownerId: ids[0] } }), 1);
    const sourceRow = await prisma.examTemplate.findUniqueOrThrow({ where: { id: template.id } });
    assert.equal(sourceRow.ownerId, ids[0]); assert.equal(sourceRow.isSystem, false);
    assert.equal((await request(`/api/templates/${template.id}`, 'GET', undefined, other)).status, 404);
    const ownerList = await request('/api/templates?limit=50', 'GET', undefined, owner);
      assert.ok(parseTemplateList(ownerList.data, 1).templates.some(item => item.id === template.id));
    assert.ok(ownerList.data.templates.some((item: { id: string }) => item.id === template.id));
    const otherList = await request('/api/templates?limit=50', 'GET', undefined, other);
    assert.ok(!otherList.data.templates.some((item: { id: string }) => item.id === template.id));
    assert.equal((await request('/api/templates', 'POST', { ...body, name: 'Different retry payload' }, owner)).status, 409);
    assert.equal((await request('/api/templates', 'POST', { ...body, clientRequestId: randomUUID(), ownerId: ids[1], isSystem: true }, owner)).status, 400);
    assert.equal((await request('/api/templates', 'POST', { ...body, clientRequestId: randomUUID(), source: { id: template.id, revision: template.revision } }, other)).status, 404);
    assert.equal((await request('/api/templates', 'POST', { ...body, clientRequestId: randomUUID(), source: { id: template.id, revision: 'stale' } }, owner)).status, 409);
    const copyBody = { ...body, clientRequestId: randomUUID(), name: 'QA derivative', source: { id: template.id, revision: template.revision } };
    const copied = await request('/api/templates', 'POST', copyBody, owner);
    assert.equal(copied.status, 201); assert.deepEqual(copied.data.template.origin, { templateId: template.id, revision: template.revision });
    assert.deepEqual((await prisma.examTemplate.findUniqueOrThrow({ where: { id: template.id } })).sections, sourceRow.sections);
    // Test fixture only: simulate a legacy/admin ownership change after the copy was committed.
    await prisma.examTemplate.update({ where: { id: template.id }, data: { ownerId: ids[1] } });
    try {
      const replay = await request('/api/templates', 'POST', copyBody, owner);
      assert.equal(replay.status, 200); assert.equal(replay.data.template.id, copied.data.template.id);
      assert.equal((await request('/api/templates', 'POST', { ...copyBody, clientRequestId: randomUUID() }, owner)).status, 404);
    } finally {
      await prisma.examTemplate.update({ where: { id: template.id }, data: { ownerId: ids[0] } });
    }
    for (const method of ['PATCH', 'DELETE']) assert.equal((await fetch(origin + `/api/templates/${template.id}`, { method, headers: { Origin: origin, Cookie: owner } })).status, 405);
    for (const [endpoint, method] of [['/api/templates', 'GET'], ['/api/templates', 'POST'], [`/api/templates/${template.id}`, 'GET']] as const) {
      const response = await fetch(origin + endpoint, { method, headers: { Origin: origin, Cookie: other, 'x-examcraft-user': ids[0], 'Content-Type': 'application/json' }, body: method === 'POST' ? '{}' : undefined });
      assert.equal(response.status, 409); assert.equal((await response.json()).code, 'ACCOUNT_CHANGED');
    }
    assert.equal((await request('/api/templates', 'POST', body, owner, 'https://foreign.example')).status, 403);
    assert.equal((await request('/api/templates', 'POST', body)).status, 401);
    const oversized = await fetch(origin + '/api/templates', { method: 'POST', headers: { Origin: origin, Cookie: owner, 'Content-Type': 'application/json' }, body: ' '.repeat(2 * 1024 * 1024 + 1) });
    assert.equal(oversized.status, 413);
    await prisma.examTemplate.create({ data: { id: legacyTemplateId, ownerId: null, name: 'QA legacy system — not official', subject: 'toan', gradeFrom: 1, gradeTo: 12, isSystem: true, sections: [{ id: 'legacy-zero', name: 'Legacy zero', type: 'TRUE_FALSE_GROUP', questionCount: 0, pointsPerQuestion: 0, progressiveScoring: [0, 0.1, 0.25] }] } });
    const legacy = await request(`/api/templates/${legacyTemplateId}`, 'GET', undefined, other);
    assert.equal(legacy.status, 200); assert.equal(legacy.data.template.category, 'system_unreviewed'); assert.equal(legacy.data.template.status, 'needs_review');
    assert.equal(legacy.data.template.snapshot.sections[0].type, 'true_false_group'); assert.equal(legacy.data.template.snapshot.sections[0].pointsPerQuestion, 0);
    const applied = applyPersonalTemplate(exam, template, { header: true, context: false, plan: false, sections: true }, templateDocumentStamp(exam), [], new Date().toISOString());
    assert.deepEqual(applied.questions, exam.questions); assert.deepEqual(applied.sections, exam.sections);
    const saved = await request('/api/exams', 'POST', { document: { ...applied, id: `template-exam-${suffix}` } }, owner);
    assert.equal(saved.status, 200); assert.equal(saved.data.document.metadata.templateApplication.source.id, template.id);
    const reloaded = await request(`/api/exams/${saved.data.document.id}`, 'GET', undefined, owner);
    assert.deepEqual(reloaded.data.document.metadata.templateApplication, saved.data.document.metadata.templateApplication);
    const share = await request(`/api/exams/${saved.data.document.id}/share`, 'POST', { showAnswers: false, allowCopy: false }, owner);
    assert.equal(share.status, 200);
    const publicView = await request('/api/public/share/' + share.data.publicLink.split('/').pop());
    assert.ok(!JSON.stringify(publicView.data).includes('templateApplication'));
    checks.push('http-private-immutable-template-retry-source-snapshot');
  });
  await t.test('bank saves passages, forks privately and protects edit, history and soft delete with versions', async () => {
    const created = await request('/api/questions', 'POST', { subject: 'ngu_van', grade: 6, type: 'ESSAY', difficulty: 'THONG_HIEU', content: 'Bank fixture original', payload: {}, points: 0, visibility: 'SHARED', passage: { title: 'Passage fixture', content: 'Original passage text', source: 'Fixture source' } }, owner);
    assert.equal(created.status, 200, created.data.error);
    const question = created.data.question, path = `/api/questions/${question.id}`;
    const listing = await request('/api/questions', 'GET', undefined, owner);
    const bank = listing.data.questions.find((q: { id: string }) => q.id === question.id);
    assert.equal(bank.passage.content, 'Original passage text'); assert.equal(bank.passage.ownerId, undefined); assert.equal(bank.author.email, undefined);
    const forked = await request(`${path}/fork`, 'POST', {}, other);
    assert.equal(forked.status, 200, forked.data.error);
    assert.equal(forked.data.question.visibility, 'PRIVATE');
    assert.notEqual(forked.data.question.passageId, question.passageId);
    const clonedPassage = await prisma.passage.findUniqueOrThrow({ where: { id: forked.data.question.passageId } });
    assert.equal(clonedPassage.ownerId, ids[1]); assert.equal(clonedPassage.content, 'Original passage text');
    assert.equal((await request(path, 'PATCH', { content: 'Denied', baseVersion: 1 }, other)).status, 404);
    assert.equal((await request(path, 'PATCH', { content: 'Missing version' }, owner)).status, 428);
    const results = await Promise.all(['Changed A', 'Changed B'].map(content => request(path, 'PATCH', { content, baseVersion: 1 }, owner)));
    assert.deepEqual(results.map(r => r.status).sort(), [200, 409]);
    const current = results.find(r => r.status === 200)!.data.question;
    const restored = await request(`${path}/revisions`, 'POST', { targetVersion: 1, baseVersion: current.version }, owner);
    assert.equal(restored.status, 200, restored.data.error); assert.equal(restored.data.question.content, 'Bank fixture original');
    assert.equal((await request(path, 'DELETE', undefined, owner)).status, 200);
    assert.equal((await request(path, 'PATCH', { content: 'Cannot resurrect', baseVersion: restored.data.question.version }, owner)).status, 404);
    checks.push('http-bank-passage-fork-cas-history-delete');
  });
  await t.test('private memory import is previewed, owner-isolated and inactive by default', async () => {
    const archive = { format: 'examcraft-private-memory', version: 1, memories: [{ subject: 'toan', category: 'STYLE', title: 'Fixture style', insight: 'Fixture insight', confidence: 0, isActive: true }] };
    const path = '/api/teacher/ai-memory/archive';
    assert.equal((await request(path, 'POST', { archive }, owner)).data.dryRun, true);
    const imported = await request(path, 'POST', { archive, dryRun: false, confirmPrivateOwnership: true }, owner);
    assert.equal(imported.status, 200); assert.equal(imported.data.imported, 1);
    assert.equal((await request(path, 'POST', { archive, dryRun: false, confirmPrivateOwnership: true }, owner)).data.imported, 0);
    const notes = await request('/api/teacher/ai-memory', 'GET', undefined, owner);
    assert.equal(notes.data.memories[0].isActive, false);
    assert.equal((await request('/api/teacher/ai-memory', 'GET', undefined, other)).data.memories.length, 0);
    const memoryPath = '/api/teacher/ai-memory';
    for (const [endpoint, method] of [[memoryPath, 'GET'], [path, 'GET'], [memoryPath + '?id=not-owned', 'DELETE']] as const) {
      const rejected = await fetch(origin + endpoint, { method, headers: { Origin: origin, Cookie: other, 'x-examcraft-user': ids[0] } });
      assert.equal(rejected.status, 409); assert.equal((await rejected.json()).code, 'ACCOUNT_CHANGED');
      assert.equal((await request(endpoint, method)).status, 401);
    }
    const noteBody = { title: 'HTTP private rule', insight: 'Keep sources private', subject: 'all', clientRequestId: randomUUID(), sampleQuestion: { content: 'sample', type: 'essay' } };
    const replies = await Promise.all([request(memoryPath, 'POST', noteBody, owner), request(memoryPath, 'POST', noteBody, owner)]);
    for (const reply of replies) assert.equal(reply.status, 200, reply.data.error);
    const noteId = replies[0].data.memory.id;
    assert.equal(replies[1].data.memory.id, noteId);
    assert.equal(await prisma.teacherAiMemory.count({ where: { id: noteId, userId: ids[0] } }), 1);
    assert.equal(replies[0].data.memory.category, 'PEDAGOGICAL_STYLE', 'Older callers may omit category.');
    const orderOnlyReplay = await request(memoryPath, 'POST', { ...noteBody, sampleQuestion: { type: 'essay', content: 'sample' } }, owner);
    assert.equal(orderOnlyReplay.status, 200); assert.equal(orderOnlyReplay.data.replayed, true);
    assert.equal((await request(memoryPath, 'POST', { ...noteBody, insight: 'changed' }, owner)).status, 409);
    assert.equal((await request(memoryPath, 'POST', { ...noteBody, sampleQuestion: { content: 'different', type: 'essay' } }, owner)).status, 409);
    const originalNote = await prisma.teacherAiMemory.findUniqueOrThrow({ where: { id: noteId } });
    assert.equal((await request(memoryPath, 'POST', { id: noteId, isActive: false }, other)).status, 404);
    assert.equal((await request(memoryPath + '?id=' + noteId, 'DELETE', undefined, other)).data.deleted, 0);
    assert.deepEqual(await prisma.teacherAiMemory.findUniqueOrThrow({ where: { id: noteId } }), originalNote);
    assert.equal((await request(memoryPath, 'POST', { title: 1, insight: 'wrong type' }, owner)).status, 400);
    const toggled = await request(memoryPath, 'POST', { id: noteId, isActive: false }, owner);
    assert.equal(toggled.status, 200); assert.equal(toggled.data.memory.isActive, false);
    const exportOwn = await request(path, 'GET', undefined, owner);
    assert.equal(exportOwn.status, 200); assert.equal(exportOwn.data.memories.length, 2);
    assert.equal((await request(path, 'GET', undefined, other)).data.memories.length, 0);
    assert.equal((await request(memoryPath + '?id=' + noteId, 'DELETE', undefined, owner)).data.deleted, 1);
    assert.equal((await request(memoryPath, 'POST', { id: noteId, isActive: true }, owner)).status, 404);
    checks.push('http-private-memory-portability');
  });
});
