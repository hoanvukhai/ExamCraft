import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseKnowledgePackage, emptyKnowledgeScope, resolveKnowledgeScope, proposeKnowledgeScope } from '../src/lib/knowledge-package';
import { acceptScopeChat, parseScopeChatRequest, requestScopeChat, scopeChatStamp, validateScopeChatResult } from '../src/lib/scope-chat';

const fixture = () => {
  const pkg = parseKnowledgePackage(JSON.parse(readFileSync(new URL('./fixtures/knowledge-package.json', import.meta.url), 'utf8')));
  const scope = emptyKnowledgeScope(pkg);
  return { pkg, scope, params: { subject: pkg.subject, grade: pkg.grade, message: 'Bao gồm nhóm phép tính, loại trừ phép trừ; không dùng máy tính.', bookId: null, knowledgePackage: pkg, scope } };
};
const proposal = () => {
  const { scope } = fixture();
  return { kind: 'proposal' as const, bookId: null, scope: { ...scope, includeKnowledgeIds: ['group'], excludeKnowledgeIds: ['subtraction'], methodConstraints: ['Không dùng máy tính'] }, explanation: 'Chọn nhóm phép tính nhưng loại trừ phép trừ.', unresolved: [] as string[] };
};

test('mocked scope chat previews validated include/exclude/method differences without changing the current scope', async () => {
  const { pkg, scope, params } = fixture();
  const before = JSON.stringify(scope);
  let calls = 0;
  const result = await requestScopeChat(params, async request => { calls++; assert.equal(request.knowledgePackage.revision, 'r1'); return JSON.stringify(proposal()); });
  assert.equal(calls, 1);
  assert.equal(JSON.stringify(scope), before);
  assert.equal(result.kind, 'proposal');
  if (result.kind !== 'proposal') return;
  const diff = proposeKnowledgeScope(pkg, scope, result.scope);
  assert.deepEqual(diff.addedKnowledge.map(n => n.id), ['group', 'addition']);
  assert.equal(diff.methodConstraintsChanged, true);
  assert.deepEqual(resolveKnowledgeScope(pkg, result.scope).outcomes.map(n => n.id), ['outcome-add']);
});

test('invalid request package, scope revision, book or subject is rejected before the provider callback', async () => {
  const { params } = fixture(); let calls = 0;
  for (const change of [{ bookId: 'invented' }, { subject: 'ngu_van' }, { grade: 7 }, { scope: { ...params.scope, packageRevision: 'r0' } }, { scope: { ...params.scope, includeKnowledgeIds: ['absent'] } }]) {
    await assert.rejects(requestScopeChat({ ...params, ...change }, async () => { calls++; return '{}'; }));
  }
  assert.equal(calls, 0);
});

test('provider cannot invent IDs, revisions, implicit books or incomplete scope fields', () => {
  const { pkg, scope } = fixture();
  for (const change of [{ bookId: 'personal-outline' }, { scope: { ...proposal().scope, includeKnowledgeIds: ['unknown'] } }, { scope: { ...proposal().scope, packageRevision: 'r2' } }, { scope: { ...proposal().scope, packageId: 'another' } }, { scope: { packageId: pkg.id, packageRevision: pkg.revision } }]) {
    assert.throws(() => validateScopeChatResult({ ...proposal(), ...change }, pkg, scope, null));
  }
  assert.throws(() => validateScopeChatResult(proposal(), pkg, scope, 'personal-outline'), /ấn bản/);
  assert.throws(() => validateScopeChatResult({ ...proposal(), bookId: 'personal-outline' }, pkg, scope, 'personal-outline'), /liên kết/);
  assert.equal(validateScopeChatResult({ ...proposal(), bookId: 'personal-outline', scope: { ...scope, includeKnowledgeIds: ['addition'] } }, pkg, scope, 'personal-outline').kind, 'proposal');
});

test('missing book/topic clarification has no applicable scope and unresolved proposals become questions', async () => {
  const { pkg, scope, params } = fixture();
  const result = await requestScopeChat({ ...params, message: 'Chọn bài 2 của sách đang học' }, async () => JSON.stringify({ kind: 'clarification', questions: ['Bạn đang dùng bộ sách và ấn bản nào?'] }));
  assert.equal(result.kind, 'clarification'); assert.equal('scope' in result, false);
  assert.throws(() => acceptScopeChat(result, 'base', 'base', pkg, scope, null), /làm rõ/);
  const unresolved = validateScopeChatResult({ ...proposal(), unresolved: ['Chưa xác định được bài cần chọn'] }, pkg, scope, null);
  assert.deepEqual(unresolved, { kind: 'clarification', questions: ['Chưa xác định được bài cần chọn'] });
});

test('accepting requires an unchanged account, exam, package, revision, local and saved scope, book and request', () => {
  const { pkg, scope, params } = fixture();
  const context = { ownerId: 'owner', examId: 'exam', pkg, scope, savedScope: scope, message: params.message, bookId: null };
  const stamp = scopeChatStamp(context);
  assert.deepEqual(acceptScopeChat(proposal(), stamp, scopeChatStamp(structuredClone(context)), pkg, scope, null), proposal().scope);
  for (const change of [{ ownerId: 'other' }, { examId: 'another' }, { pkg: { ...pkg, revision: 'r2' } }, { pkg: { ...pkg, title: 'new content same revision' } }, { scope: { ...scope, excludeKnowledgeIds: ['addition'] } }, { savedScope: { ...scope, methodConstraints: ['Newer saved edit'] } }, { message: 'New request' }, { bookId: 'personal-outline' }]) {
    assert.throws(() => acceptScopeChat(proposal(), stamp, scopeChatStamp({ ...context, ...change }), pkg, scope, null), /thay đổi/);
  }
});

test('provider malformed JSON, extra authority fields and empty clarification are not usable proposals', async () => {
  const { pkg, scope, params } = fixture();
  await assert.rejects(requestScopeChat(params, async () => 'not json'));
  assert.throws(() => validateScopeChatResult({ ...proposal(), approved: true }, pkg, scope, null));
  assert.throws(() => validateScopeChatResult({ kind: 'clarification', questions: [] }, pkg, scope, null));
  assert.throws(() => parseScopeChatRequest({ ...params, message: ' ' }));
});

test('valid outcome-only scope changes and exclusion/method removals remain visible and require acceptance', () => {
  const { pkg, scope } = fixture();
  const current = { ...scope, excludeKnowledgeIds: ['addition'], methodConstraints: ['Không dùng máy tính'] };
  const result = validateScopeChatResult({ ...proposal(), scope: { ...scope, includeOutcomeIds: ['outcome-sub'] } }, pkg, current, null);
  assert.equal(result.kind, 'proposal');
  if (result.kind !== 'proposal') return;
  const diff = proposeKnowledgeScope(pkg, current, result.scope);
  assert.equal(diff.outcomesBefore, 0); assert.equal(diff.outcomesAfter, 1);
  assert.equal(diff.methodConstraintsChanged, true);
  assert.deepEqual(current.excludeKnowledgeIds, ['addition']);
});
