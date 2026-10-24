import test from 'node:test';
import assert from 'node:assert/strict';
import type { Prisma } from '@prisma/client';
import type { Exam } from '../src/types/exam';
import { ApiError } from '../src/lib/api-error';
import { applyPersonalTemplate, captureTemplateSnapshot, legacyTemplateSnapshot, makeTemplateApplyAttempt, saveTemplateSchema, templateApplicationSchema, templateApplyAcknowledgement, templateApplyWarnings, templateDeviations, templateDocumentStamp, templateSectionPreview, templateSourceDateLabel, type PersonalTemplate } from '../src/lib/exam-template';
import { getPersonalTemplate, listPersonalTemplates, readTemplateRequest, readTemplateRow, savePersonalTemplate, templateListParameters } from '../src/lib/exam-template-service';
import { normalizeExamDocument } from '../src/lib/exam-document';
import { freezeExamScoring } from '../src/lib/snapshot-scoring';
import { createExamPlan, compareExamPlan } from '../src/lib/exam-plan';

type Row = { id: string; ownerId: string | null; name: string; subject: string; gradeFrom: number; gradeTo: number; sections: unknown; isSystem: boolean; createdAt: Date };
const legacy = (): Row => ({ id: 'system-old', ownerId: null, name: 'Tên mẫu cũ chưa chứng minh nguồn', subject: 'toan', gradeFrom: 6, gradeTo: 12, isSystem: true, createdAt: new Date('2026-10-01T00:00:00Z'), sections: [{ id: 'old-section', name: 'Phần cũ', type: 'ESSAY', questionCount: 0, pointsPerQuestion: 0, progressiveScoring: [0, 0.1, 0.25], totalPoints: 0 }] });
function fixture(): Exam {
  return { id: 'template-exam', metadata: { title: 'Tự soạn mẫu riêng', subject: 'toan', grade: 6, durationMinutes: 15, schoolName: '', departmentName: '', academicYear: 'fixture' }, sections: [{ id: 'existing', name: 'Phần hiện tại', type: 'essay', pointsPerQuestion: 0.25 }], questions: [{ id: 'q', type: 'essay', content: 'PRIVATE_CONTENT', difficulty: 'thong_hieu', step_by_step_solution: 'PRIVATE_SOLUTION', correct_answer: 'PRIVATE_ANSWER' }], createdAt: '', updatedAt: '' };
}
function body(clientRequestId = '10000000-0000-4000-8000-000000000001') {
  return { clientRequestId, name: 'Mẫu riêng', subject: 'toan', gradeFrom: 6, gradeTo: 6, sources: [{ title: 'Tự soạn', rights: 'unknown' as const }], snapshot: captureTemplateSnapshot(fixture()) };
}
function database() {
  const rows = new Map<string, Row>([[legacy().id, legacy()]]), calls: string[] = [];
  const matches = (row: Row, where: Record<string, unknown>): boolean => Object.entries(where).every(([key, value]) => {
    if (key === 'OR') return (value as Record<string, unknown>[]).some(item => matches(row, item));
    const actual = row[key as keyof Row];
    if (value && typeof value === 'object') { const range = value as { lte?: number; gte?: number }; return (range.lte === undefined || Number(actual) <= range.lte) && (range.gte === undefined || Number(actual) >= range.gte); }
    return actual === value;
  });
  const tx = { $queryRaw: async (_strings: TemplateStringsArray, ...values: unknown[]) => { calls.push('lock:' + values[0]); return []; }, examTemplate: {
    findUnique: async ({ where }: { where: { id: string } }) => { calls.push('find:' + where.id); return rows.get(where.id) ?? null; },
    findFirst: async ({ where }: { where: Record<string, unknown> }) => [...rows.values()].find(row => matches(row, where)) ?? null,
    findMany: async ({ where, skip, take }: { where: Record<string, unknown>; skip: number; take: number }) => [...rows.values()].filter(row => matches(row, where)).slice(skip, skip + take),
    count: async ({ where }: { where: Record<string, unknown> }) => [...rows.values()].filter(row => matches(row, where)).length,
    create: async ({ data }: { data: Omit<Row, 'createdAt'> }) => { assert.ok(!rows.has(data.id)); const row = { ...data, createdAt: new Date('2026-10-23T00:00:00Z') }; rows.set(row.id, row); calls.push('create:' + row.id); return row; },
  } } as unknown as Prisma.TransactionClient;
  return { tx, rows, calls };
}

test('two-teacher service scopes list/read/source access and forces immutable personal owner/status', async () => {
  const { tx, rows } = database();
  const first = await savePersonalTemplate(tx, 'teacher-a', body());
  const second = await savePersonalTemplate(tx, 'teacher-b', body());
  assert.notEqual(first.template.id, second.template.id); assert.equal(rows.get(first.template.id)!.ownerId, 'teacher-a'); assert.equal(rows.get(first.template.id)!.isSystem, false);
  assert.equal(first.template.category, 'personal'); assert.equal(first.template.status, 'needs_review');
  const listing = await listPersonalTemplates(tx, 'teacher-a', templateListParameters(new URLSearchParams('limit=50')));
  assert.deepEqual(listing.templates.map(item => item.id).sort(), ['system-old', first.template.id].sort());
  assert.ok(listing.templates.every(item => !('snapshot' in item) && !('sources' in item)));
  await assert.rejects(getPersonalTemplate(tx, 'teacher-b', first.template.id), (error: unknown) => error instanceof ApiError && error.status === 404);
  await assert.rejects(savePersonalTemplate(tx, 'teacher-b', { ...body('10000000-0000-4000-8000-000000000002'), source: { id: first.template.id, revision: first.template.revision } }), (error: unknown) => error instanceof ApiError && error.status === 404);
  const before = JSON.stringify(rows.get('system-old'));
  const source = await getPersonalTemplate(tx, 'teacher-a', 'system-old');
  const clone = await savePersonalTemplate(tx, 'teacher-a', { ...body('10000000-0000-4000-8000-000000000003'), source: { id: source.id, revision: source.revision } });
  assert.deepEqual(clone.template.origin, { templateId: source.id, revision: source.revision }); assert.equal(JSON.stringify(rows.get('system-old')), before);
});

test('same request ID locks before lookup, replays same immutable row, and rejects changed content without overwrite', async () => {
  const { tx, rows, calls } = database(), request = body();
  const first = await savePersonalTemplate(tx, 'teacher-a', request), afterFirst = rows.size;
  const replay = await savePersonalTemplate(tx, 'teacher-a', structuredClone(request));
  assert.equal(replay.replayed, true); assert.equal(replay.template.id, first.template.id); assert.equal(rows.size, afterFirst);
  assert.ok(calls[0].startsWith('lock:')); assert.ok(calls[1].startsWith('find:')); assert.equal(calls.filter(item => item.startsWith('create:')).length, 1);
  await assert.rejects(savePersonalTemplate(tx, 'teacher-a', { ...request, name: 'Khác' }), (error: unknown) => error instanceof ApiError && error.status === 409);
  assert.equal(rows.get(first.template.id)!.name, request.name);
});

test('legacy raw-array revision is stable by key order and changes with raw source; stale origin409', async () => {
  const { tx, rows } = database(); const source = await getPersonalTemplate(tx, 'teacher-a', 'system-old');
  assert.equal(source.status, 'needs_review'); assert.equal(source.category, 'system_unreviewed'); assert.equal(source.snapshot.assessmentContext.grade, undefined);
  assert.equal(source.snapshot.sections[0].type, 'essay'); assert.equal(source.snapshot.sections[0].questionCount, 0); assert.equal(source.snapshot.sections[0].pointsPerQuestion, 0); assert.deepEqual(source.snapshot.sections[0].progressiveScoring, [0, 0.1, 0.25]);
  const raw = rows.get('system-old')!;
  assert.equal(readTemplateRow({ ...raw, sections: [{ totalPoints: 0, progressiveScoring: [0, 0.1, 0.25], pointsPerQuestion: 0, questionCount: 0, type: 'ESSAY', name: 'Phần cũ', id: 'old-section' }] }).revision, source.revision);
  raw.name = 'Nguồn đổi tên';
  assert.notEqual(readTemplateRow(raw).revision, source.revision);
  await assert.rejects(savePersonalTemplate(tx, 'teacher-a', { ...body(), source: { id: source.id, revision: source.revision } }), (error: unknown) => error instanceof ApiError && error.status === 409);
  assert.throws(() => legacyTemplateSnapshot('toan', [{ id: 'unsupported', name: 'Giữ dữ liệu', type: 'UNKNOWN' }]));
});

test('authority fields, question data, non-http sources, excessive plans and invalid grade bounds reject before create', async () => {
  const { tx, rows } = database();
  for (const change of [{ ownerId: 'victim' }, { isSystem: true }, { status: 'reviewed' }, { origin: { templateId: 'foreign' } }, { gradeFrom: 12, gradeTo: 6 }, { sources: [{ title: 'bad', url: 'javascript:alert(1)', rights: 'open' }] }, { sources: [{ title: 'bad', url: 'file:///secret', rights: 'permission' }] }, { snapshot: { ...body().snapshot, questions: fixture().questions } }, { sources: [{ title: 'bad', verification: 'reviewed' }] }]) {
    await assert.rejects(savePersonalTemplate(tx, 'teacher-a', { ...body(), ...change }), (error: unknown) => error instanceof ApiError && error.status === 400);
  }
  const plan = createExamPlan(fixture());
  assert.equal(saveTemplateSchema.safeParse({ ...body(), snapshot: { ...body().snapshot, examPlan: { ...plan, slots: Array.from({ length: 101 }, (_, i) => ({ id: String(i), type: 'essay', cognitiveLevel: String(i), count: 0, targetPointsHundredths: 0 })) } } }).success, false);
  assert.equal(rows.size, 1);
});

test('bounded paging, source URLs and body stream limit cannot be bypassed by absent/incorrect length header', async () => {
  assert.deepEqual(templateListParameters(new URLSearchParams('page=999999&limit=10000&grade=13')), { page: 10000, limit: 50 });
  assert.deepEqual(templateListParameters(new URLSearchParams('page=-2&limit=-1')), { page: 1, limit: 20 });
  assert.deepEqual(await readTemplateRequest(new Request('http://fixture/templates', { method: 'POST', body: '{"ok":true}' })), { ok: true });
  await assert.rejects(readTemplateRequest(new Request('http://fixture/templates', { method: 'POST', headers: { 'Content-Length': '1' }, body: 'x'.repeat(2 * 1024 * 1024 + 1) })), (error: unknown) => error instanceof ApiError && error.status === 413);
  await assert.rejects(readTemplateRequest(new Request('http://fixture/templates', { method: 'POST', headers: { 'Content-Length': String(2 * 1024 * 1024 + 1) }, body: '{}' })), (error: unknown) => error instanceof ApiError && error.status === 413);
});

test('applying into nonempty exam never changes questions, their links/points, or section fallback', () => {
  const exam = fixture(), snapshot = captureTemplateSnapshot(exam);
  snapshot.sections = [{ id: 'source-section', name: 'Điểm mẫu khác', type: 'essay', pointsPerQuestion: 9 }]; snapshot.headerFields.schoolName = 'Trường tự soạn';
  const template: PersonalTemplate = { ...legacy(), createdAt: '2026-10-23T00:00:00Z', revision: 'source-r1', category: 'personal', status: 'needs_review', legacy: false, origin: null, sources: [], snapshot };
  const beforePoints = freezeExamScoring(exam).questions[0].points;
  const result = applyPersonalTemplate(exam, template, { header: true, context: false, plan: false, sections: true }, templateDocumentStamp(exam), ['fresh'], '2026-10-23T00:00:00Z');
  assert.equal(result.questions, exam.questions); assert.equal(result.sections, exam.sections); assert.equal(freezeExamScoring(result).questions[0].points, beforePoints);
  assert.equal(result.metadata.schoolName, 'Trường tự soạn'); assert.equal(result.metadata.templateApplication!.appliedOptions.sections, false);
  assert.ok(!JSON.stringify(captureTemplateSnapshot(exam)).includes('PRIVATE'));
});

test('empty exam copies sections with fresh IDs; stale plan refs remain readable, deviations report changes', () => {
  const exam = fixture(); exam.questions = [];
  const snapshot = captureTemplateSnapshot(exam), plan = createExamPlan(exam);
  snapshot.examPlan = { ...plan, frameworkId: 'old-framework', packageReference: { packageId: 'old-package', packageRevision: 'r0' }, slots: [] };
  const template: PersonalTemplate = { ...legacy(), createdAt: '2026-10-23T00:00:00Z', revision: 'source-r1', category: 'personal', status: 'needs_review', legacy: false, origin: null, sources: [], snapshot };
  const stamp = templateDocumentStamp(exam), options = { header: true, context: true, plan: true, sections: true }, now = '2026-10-23T00:00:00Z';
  assert.throws(() => applyPersonalTemplate(exam, template, options, stamp, ['existing'], now), /mã mới/);
  const result = applyPersonalTemplate(exam, template, options, stamp, ['fresh-section'], now);
  assert.equal(result.sections![0].id, 'fresh-section'); assert.deepEqual(result.metadata.examPlan, snapshot.examPlan); assert.equal(compareExamPlan(result).stale, true);
  assert.deepEqual(normalizeExamDocument(result).metadata.templateApplication, result.metadata.templateApplication);
  assert.equal(templateDeviations(result).length, 0);
  const changed = { ...result, metadata: { ...result.metadata, title: 'Tự tùy chỉnh' } };
  assert.match(templateDeviations(changed).join(' '), /Tiêu đề/);
  assert.equal(applyPersonalTemplate(changed, template, options, stamp, ['other'], now), changed);
  assert.equal(templateApplicationSchema.safeParse({ ...result.metadata.templateApplication, approved: true }).success, false);
});

test('explicit null layout/framework clears only selected options; legacy absent fields and absent plan preserve current choices', () => {
  const source = fixture(), snapshot = captureTemplateSnapshot(source);
  assert.equal(snapshot.headerFields.headerLayout, null); assert.equal(snapshot.assessmentContext.cognitiveFrameworkId, null);
  const template: PersonalTemplate = { ...legacy(), createdAt: '2026-10-23T00:00:00Z', revision: 'null-r1', category: 'personal', status: 'needs_review', legacy: false, origin: null, sources: [], snapshot };
  const target = fixture(); target.metadata.headerLayout = { formatVersion: 1, lines: [{ id: 'custom', area: 'right', align: 'left', hidden: false, text: 'Custom line' }] }; target.metadata.cognitiveFrameworkId = 'legacy_4'; target.metadata.examPlan = createExamPlan(target);
  const now = '2026-10-23T00:00:00Z', stamp = templateDocumentStamp(target);
  const noClear = applyPersonalTemplate(target, template, { header: false, context: false, plan: true, sections: false }, stamp, [], now);
  assert.equal(noClear.metadata.headerLayout, target.metadata.headerLayout); assert.equal(noClear.metadata.cognitiveFrameworkId, 'legacy_4'); assert.equal(noClear.metadata.examPlan, target.metadata.examPlan); assert.equal(noClear.metadata.templateApplication!.appliedOptions.plan, false);
  const clear = applyPersonalTemplate(target, template, { header: true, context: true, plan: false, sections: false }, stamp, [], now);
  assert.equal(clear.metadata.headerLayout, undefined); assert.equal(clear.metadata.cognitiveFrameworkId, undefined); assert.deepEqual(templateDeviations(clear), []);
  const legacySnapshot = legacyTemplateSnapshot('toan', legacy().sections);
  const preserved = applyPersonalTemplate(target, { ...template, snapshot: legacySnapshot }, { header: true, context: true, plan: true, sections: false }, stamp, [], now);
  assert.equal(preserved.metadata.headerLayout, target.metadata.headerLayout); assert.equal(preserved.metadata.cognitiveFrameworkId, 'legacy_4'); assert.equal(preserved.metadata.examPlan, target.metadata.examPlan);
});

test('apply acknowledgement distinguishes own result, pending/no-op, rejected race and subsequent edits without false success', () => {
  const exam = fixture(), template: PersonalTemplate = { ...legacy(), createdAt: '2026-10-23T00:00:00Z', revision: 'ack-r1', category: 'personal', status: 'needs_review', legacy: false, origin: null, sources: [], snapshot: captureTemplateSnapshot(exam) };
  const options = { header: true, context: false, plan: false, sections: false }, stamp = templateDocumentStamp(exam);
  const next = applyPersonalTemplate(exam, template, options, stamp, [], '2026-10-23T00:00:00Z');
  const attempt = makeTemplateApplyAttempt(exam, next);
  assert.equal(templateApplyAcknowledgement(exam, attempt), 'pending');
  assert.equal(templateApplyAcknowledgement(next, attempt), 'applied');
  assert.notEqual(templateDocumentStamp(next), stamp); // Own accepted update must not become a stale rejection.
  assert.equal(templateApplyAcknowledgement({ ...next, version: 2, updatedAt: 'server-save-ack' }, attempt), 'applied');
  const racing = { ...exam, metadata: { ...exam.metadata, title: 'Newer title while apply was queued' } };
  assert.equal(applyPersonalTemplate(racing, template, options, stamp, [], '2026-10-23T00:00:00Z'), racing);
  assert.equal(templateApplyAcknowledgement(racing, attempt), 'rejected');
  const later = { ...next, metadata: { ...next.metadata, title: 'Edit after accepted apply' } };
  assert.equal(templateApplyAcknowledgement(later, attempt), 'applied_changed');
  const revoked = { ...exam, access: { role: 'viewer', canRead: true, canEdit: false, canManage: false, canPublish: false, canComment: false } };
  assert.equal(templateApplyAcknowledgement(revoked, attempt), 'rejected');
  assert.equal(templateApplyAcknowledgement({ ...exam, id: 'other-document' }, attempt), 'rejected');
  assert.throws(() => makeTemplateApplyAttempt(exam, exam), /Chưa áp dụng/);
});

test('source date preview includes declared bounds and outside-window warnings never certify legal applicability', () => {
  const exam = fixture(), source = { title: 'Nguồn tự khai', rights: 'unknown' as const, effectiveFrom: '2026-10-23', effectiveTo: '2026-10-24' };
  const template: PersonalTemplate = { ...legacy(), createdAt: '2026-10-23T00:00:00Z', revision: 'date-r1', category: 'personal', status: 'needs_review', legacy: false, origin: null, sources: [source], snapshot: captureTemplateSnapshot(exam) };
  const options = { header: true, context: false, plan: false, sections: false };
  assert.equal(templateSourceDateLabel(source), 'Khoảng ngày tự khai: từ 2026-10-23 đến 2026-10-24.');
  assert.match(templateSourceDateLabel({ title: 'Chưa có mốc', rights: 'unknown' }), /từ chưa ghi đến chưa ghi/);
  for (const date of ['2026-10-23', '2026-10-24']) assert.equal(templateApplyWarnings(exam, template, options, date).some(warning => warning.includes('nằm ngoài')), false);
  for (const date of ['2026-10-22', '2026-10-25']) assert.match(templateApplyWarnings(exam, template, options, date).join(' '), /nằm ngoài.*không xác nhận hiệu lực pháp lý/);
  assert.match(templateApplyWarnings(exam, { ...template, gradeFrom: 10, gradeTo: 12 }, options, '2026-10-23').join(' '), /khác môn hoặc phạm vi lớp/);
});

test('section copy preview exposes zero and missing count/points/total/progression without rounding or altering source', () => {
  const sections = [{ id: 'zero', name: 'Phần điểm0', type: 'ESSAY', questionCount: 0, pointsPerQuestion: 0, progressiveScoring: [0, 0.1, 0.333], totalPoints: 0, instruction: 'Chỉ là cấu hình tự khai' }, { id: 'missing', name: 'Chưa đặt cấu hình' }];
  const original = JSON.stringify(sections), rows = templateSectionPreview(sections);
  assert.deepEqual(rows[0], { name: 'Phần điểm0', type: 'essay', count: '0', points: '0', total: '0', progression: '0 → 0,1 → 0,333', instruction: 'Chỉ là cấu hình tự khai' });
  assert.equal(rows[1].count, 'Chưa đặt'); assert.equal(rows[1].points, 'Chưa đặt'); assert.equal(rows[1].progression, 'Chưa đặt'); assert.equal(rows[1].total, 'Chưa đặt');
  assert.equal(JSON.stringify(sections), original);
});
