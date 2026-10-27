import test from 'node:test';
import assert from 'node:assert/strict';
import { persistExam, SaveExamError, isExamAccessError } from '../src/lib/exam-client';
import type { Exam } from '../src/types/exam';

test('unavailable folder can be recovered without treating it as lost account access', () => {
  assert.equal(isExamAccessError(new SaveExamError('folder', 403, 'FOLDER_UNAVAILABLE')), false);
  for (const status of [401, 403, 404]) assert.equal(isExamAccessError(new SaveExamError('access', status)), true);
  assert.equal(isExamAccessError(new SaveExamError('changed account', 403, 'ACCOUNT_CHANGED')), true);
});

test('creation location travels with a new draft, never retargets a saved document', async () => {
  const original = globalThis.fetch;
  const calls: { method?: string; body: Record<string, unknown> }[] = [];
  globalThis.fetch = async (_input, init) => {
    const body = JSON.parse(String(init?.body)); calls.push({ method: init?.method, body });
    return new Response(JSON.stringify({ document: { ...body.document, id: 'saved-location', version: calls.length } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  const draft: Exam = { id: 'draft-location', creationFolderId: 'folder-owned', metadata: { title: 'Đề thử vị trí', schoolName: '', departmentName: '', subject: 'toan', grade: 6, durationMinutes: 15 }, questions: [], createdAt: '2026-10-28T00:00:00Z', updatedAt: '2026-10-28T00:00:00Z' };
  try {
    const saved = await persistExam(JSON.parse(JSON.stringify(draft)), 'teacher-location');
    assert.equal(calls[0].method, 'POST'); assert.equal(calls[0].body.folderId, 'folder-owned');
    assert.equal('creationFolderId' in (calls[0].body.document as object), false);
    assert.equal(saved.creationFolderId, undefined);
    await persistExam({ ...saved, creationFolderId: 'other-folder' }, 'teacher-location');
    assert.equal(calls[1].method, 'PATCH'); assert.equal('folderId' in calls[1].body, false);
    assert.equal('creationFolderId' in (calls[1].body.document as object), false);
  } finally { globalThis.fetch = original; }
});
