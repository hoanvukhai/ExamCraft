import assert from 'node:assert/strict';
import test from 'node:test';
import { Prisma } from '@prisma/client';
import type { Exam, Question, QuestionType } from '../src/types/exam';
import { normalizeExamDocument, normalizeQuestion, fromDatabaseExam, questionToDatabase, DocumentValidationError } from '../src/lib/exam-document';
import { assertExamReferences, createExam, updateExam } from '../src/lib/exam-persistence';
import { legacyOutline } from '../src/lib/exam-outline';
import { persistExam, loadExam, SaveExamError, isExamAccessError } from '../src/lib/exam-client';

test('only access failures freeze editing; validation, version conflicts and outages keep recovery available', () => {
  for (const status of [401, 403, 404]) assert.equal(isExamAccessError(new SaveExamError('Denied', status)), true);
  assert.equal(isExamAccessError(new SaveExamError('Changed', 409, 'ACCOUNT_CHANGED')), true);
  for (const status of [0, 400, 409, 428, 500]) assert.equal(isExamAccessError(new SaveExamError('Retry', status)), false);
  assert.equal(isExamAccessError(new Error('Network')), false);
});
import { assertRequestAccount } from '../src/lib/request-account';
import { collaborationPermissions, assertCollaborationEdit, examAccess, setExamCollaborator, revokeExamCollaborator } from '../src/lib/exam-collaboration';

type Row = Record<string, unknown>;
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const stamp = '2026-10-22T00:00:00.000Z';
const types: QuestionType[] = ['multiple_choice', 'true_false_group', 'short_answer', 'essay', 'fill_blank', 'matching', 'ordering'];
function fixture(): Exam {
  return {
    id: 'local-draft-fixture', metadata: { title: 'Tự soạn — đủ kiểu câu', schoolName: 'Trường mẫu', departmentName: 'Tổ mẫu', subject: 'toan', grade: 5, durationMinutes: 0, academicYear: '2026–2027', examCode: 'A01' },
    passages: [{ id: 'passage-1', content: 'Ngữ liệu tự soạn', title: 'Bài đọc', source: 'Fixture' }],
    questions: types.map((type, index) => ({
      id: `editor-q-${index}`, type, difficulty: 'thong_hieu', content: `Nội dung ${index}`, points: index === 0 ? 0 : index,
      passageId: 'passage-1', choices: [{ key: 'A', text: 'Một', pinned: true }, { key: 'B', text: 'Hai' }], correct_answer: 'A', accepted_answers: ['1.5', '3/2'],
      sub_questions: [{ key: 'a', content: 'Ý a', isCorrect: false, explanation: 'Giải thích' }], rubric: [{ criterion: 'Lập luận', maxPoints: 1 }],
      figures: [{ id: 'figure-1', kind: 'function_plot', data: { expression: 'x^2', xRange: [-2, 2] }, renderedBase64: 'data:image/png;base64,fixture' }],
      topics: ['Chủ đề'], tags: ['fixture'], subBranch: 'integrated', curriculumTrack: 'advanced_topic', step_by_step_solution: 'Lời giải tự soạn',
      source: 'Tự soạn', licenseNote: 'Fixture nội bộ', aiGenerated: true, status: 'draft', verifiedBy: 'none',
    })), createdAt: stamp, updatedAt: stamp,
  };
}

// This fake executes service code and its query predicates; it never imports the Prisma singleton.
function database() {
  const exams = new Map<string, Row>();
  const questions = new Map<string, Row>();
  const collaborators = new Map<string, Row>();
  const examRevisions = new Map<string, Row>();
  let items: Row[] = [];
  const revisions: Row[] = [];
  const folders = [{ id: 'folder-a', ownerId: 'teacher-a' }, { id: 'folder-b', ownerId: 'teacher-b' }];
  const templates = [{ id: 'template-a', ownerId: 'teacher-a', isSystem: false }, { id: 'template-b', ownerId: 'teacher-b', isSystem: false }, { id: 'template-system', ownerId: null, isSystem: true }];
  function matches(row: Row, where: Row): boolean {
    return Object.entries(where).every(([key, expected]) => {
      if (key === 'OR') return (expected as Row[]).some(condition => matches(row, condition));
      if (expected && typeof expected === 'object' && 'in' in expected) return (expected.in as unknown[]).includes(row[key]);
      return row[key] === expected;
    });
  }
  function examWithItems(id: string) {
    const exam = exams.get(id);
    return exam ? copy({ ...exam, items: items.filter(i => i.examId === id).map(i => ({ ...i, question: questions.get(String(i.questionId)) })) }) : null;
  }
  const tx = {
    $queryRaw: async () => [],
    user: { findFirst: async ({ where }: { where: Row }) => {
      const email = String((where.email as Row).equals).toLowerCase();
      const id = email === 'a@example.test' ? 'teacher-a' : email === 'b@example.test' ? 'teacher-b' : email === 'c@example.test' ? 'teacher-c' : null;
      return id ? { id } : null;
    } },
    examCollaborator: {
      findUnique: async ({ where }: { where: Row }) => { const w = where.examId_userId as Row; return copy(collaborators.get(`${w.examId}:${w.userId}`) ?? null); },
      upsert: async ({ where, create, update }: { where: Row; create: Row; update: Row }) => {
        const w = where.examId_userId as Row, key = `${w.examId}:${w.userId}`, previous = collaborators.get(key);
        const saved = previous ? { ...previous, ...copy(update) } : { id: key, revokedAt: null, ...copy(create) };
        collaborators.set(key, saved); return copy(saved);
      },
      updateMany: async ({ where, data }: { where: Row; data: Row }) => { let count = 0; for (const [key, row] of collaborators) if (matches(row, where)) { collaborators.set(key, { ...row, ...copy(data) }); count++; } return { count }; },
    },
    examRevision: { createMany: async ({ data, skipDuplicates }: { data: Row[]; skipDuplicates: boolean }) => {
      let count = 0; for (const row of data) { const key = `${row.examId}:${row.version}`;
        if (examRevisions.has(key)) { if (!skipDuplicates) throw new Error('DUPLICATE_REVISION'); continue; }
        examRevisions.set(key, copy(row)); count++;
      } return { count };
    } },
    folder: { findFirst: async ({ where }: { where: Row }) => folders.find(row => matches(row, where)) ?? null },
    examTemplate: { findFirst: async ({ where }: { where: Row }) => templates.find(row => matches(row, where)) ?? null },
    exam: {
      findUnique: async ({ where }: { where: Row }) => examWithItems(String(where.id)),
      findUniqueOrThrow: async ({ where }: { where: Row }) => { const value = examWithItems(String(where.id)); if (!value) throw new Error('NOT_FOUND'); return value; },
      findFirst: async ({ where }: { where: Row }) => copy([...exams.values()].find(row => matches(row, where)) ?? null),
      create: async ({ data }: { data: Row }) => { if (exams.has(String(data.id))) throw new Error('DUPLICATE'); const saved = { version: 1, deletedAt: null, createdAt: stamp, updatedAt: stamp, ...copy(data) }; exams.set(String(data.id), saved); return copy(saved); },
      updateMany: async ({ where, data }: { where: Row; data: Row }) => {
        const current = [...exams.values()].find(row => matches(row, where));
        if (!current) return { count: 0 };
        const cleaned = Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
        exams.set(String(current.id), { ...current, ...copy(cleaned), version: Number(current.version) + Number((data.version as Row).increment) });
        return { count: 1 };
      },
    },
    question: {
      findMany: async ({ where }: { where: Row }) => copy([...questions.values()].filter(row => matches(row, where))),
      count: async ({ where }: { where: Row }) => [...questions.values()].filter(row => matches(row, where)).length,
      findUnique: async ({ where }: { where: Row }) => copy(questions.get(String(where.id)) ?? null),
      create: async ({ data }: { data: Row }) => { const saved = { deletedAt: null, ...copy(data) }; questions.set(String(data.id), saved); return copy(saved); },
      update: async ({ where, data }: { where: Row; data: Row }) => { const saved = { ...questions.get(String(where.id)), ...copy(data) }; questions.set(String(where.id), saved); return copy(saved); },
    },
    questionRevision: { createMany: async ({ data }: { data: Row[] }) => { revisions.push(...copy(data)); return { count: data.length }; } },
    examQuestion: {
      deleteMany: async ({ where }: { where: Row }) => { items = items.filter(row => !matches(row, where)); },
      create: async ({ data }: { data: Row }) => { items.push(copy(data)); return copy(data); },
      createMany: async ({ data }: { data: Row[] }) => { items.push(...copy(data)); return { count: data.length }; },
    },
  } as unknown as Prisma.TransactionClient;
  return { tx, exams, questions, revisions, collaborators, examRevisions, getItems: () => copy(items) };
}
const status = (expected: number) => (error: unknown) => Boolean(error && typeof error === 'object' && 'status' in error && error.status === expected);

test('adapter roundtrip retains seven question types, zero points, passages, figures and authoring fields', () => {
  const original = fixture();
  const normalized = normalizeExamDocument(original);
  assert.deepEqual(normalized, { ...original, outline: legacyOutline(original) });
  assert.equal(Object.hasOwn(original, 'outline'), false, 'Reading never writes the legacy document');
  for (const q of normalized.questions) {
    const stored = questionToDatabase(q, { ownerId: 'teacher-a', subject: 'toan', grade: 5, examId: 'exam-a', questionId: `db-${q.id}` });
    const restored = normalizeQuestion(stored);
    for (const field of ['id', 'type', 'difficulty', 'content', 'choices', 'correct_answer', 'accepted_answers', 'sub_questions', 'rubric', 'figures', 'points', 'passageId', 'subBranch', 'curriculumTrack', 'source', 'licenseNote', 'aiGenerated'] as const) assert.deepEqual(restored[field], q[field], `${q.type}.${field}`);
    assert.equal(stored.status, 'DRAFT');
    assert.equal(stored.verifiedBy, 'NONE');
  }
  const restored = fromDatabaseExam({ id: 'server-a', version: 2, title: original.metadata.title, subject: 'toan', grade: 5, durationMinutes: 0, metadata: { workspaceDocument: original }, createdAt: stamp, updatedAt: stamp });
  assert.deepEqual(restored.questions, original.questions);
  assert.deepEqual(restored.passages, original.passages);
  assert.equal(restored.id, 'server-a');
  assert.equal(restored.version, 2);
});
test('document validator rejects duplicates, unsupported types and invalid grades without defaulting to Math', () => {
  const original = fixture();
  assert.throws(() => normalizeExamDocument({ ...original, questions: [original.questions[0], original.questions[0]] }), DocumentValidationError);
  assert.throws(() => normalizeExamDocument({ ...original, metadata: { ...original.metadata, subject: '' } }), DocumentValidationError);
  assert.throws(() => normalizeExamDocument({ ...original, metadata: { ...original.metadata, grade: 13 } }), DocumentValidationError);
  assert.throws(() => normalizeQuestion({ ...original.questions[0], type: 'UNKNOWN' }), DocumentValidationError);
});
test('legacy database Decimal values retain zero and overridden points', () => {
  const q: Question = fixture().questions[0];
  const databaseQuestion = questionToDatabase(q, { ownerId: 'teacher-a', subject: 'toan', grade: 5, examId: 'exam-a', questionId: 'legacy-q' });
  const restored = fromDatabaseExam({ id: 'legacy-exam', version: 1, title: 'Đề cũ', subject: 'toan', grade: 5, durationMinutes: 15, metadata: {}, items: [{ position: 0, pointsOverride: new Prisma.Decimal('0'), question: { ...databaseQuestion, points: new Prisma.Decimal('2.5') } }], createdAt: stamp, updatedAt: stamp });
  assert.equal(restored.questions[0].points, 0);
});
test('service rejects foreign folders/templates/questions and permits system templates', async () => {
  const db = database();
  await assert.rejects(assertExamReferences(db.tx, 'teacher-a', { folderId: 'folder-b' }), status(403));
  await assert.rejects(assertExamReferences(db.tx, 'teacher-a', { templateId: 'template-b' }), status(403));
  await assert.doesNotReject(assertExamReferences(db.tx, 'teacher-a', { templateId: 'template-system' }));
  db.questions.set('foreign', { id: 'foreign', ownerId: 'teacher-b', deletedAt: null });
  await assert.rejects(assertExamReferences(db.tx, 'teacher-a', { questionItems: [{ questionId: 'foreign', sectionId: 's', position: 0 }] }), status(403));
  db.questions.set('own', { id: 'own', ownerId: 'teacher-a', deletedAt: null });
  await assert.doesNotReject(assertExamReferences(db.tx, 'teacher-a', { questionItems: [{ questionId: 'own', sectionId: 's', position: 0 }] }));
  await assert.rejects(assertExamReferences(db.tx, 'teacher-a', { questionItems: [{ questionId: 'own', sectionId: 's', position: 0 }, { questionId: 'own', sectionId: 's', position: 0 }] }), status(400));
});
test('create is idempotent for an unchanged document and keeps teacher identities separate', async () => {
  const db = database();
  const original = fixture();
  const first = await createExam(db.tx, 'teacher-a', { document: original, clientId: original.id });
  const again = await createExam(db.tx, 'teacher-a', { document: original, clientId: original.id });
  assert.equal(first.id, again.id);
  assert.equal(db.exams.size, 1);
  assert.equal(db.questions.size, original.questions.length);
  assert.equal(db.revisions.length, original.questions.length);
  const other = await createExam(db.tx, 'teacher-b', { document: original, clientId: original.id });
  assert.notEqual(first.id, other.id);
  await assert.rejects(createExam(db.tx, 'teacher-a', { document: { ...original, metadata: { ...original.metadata, title: 'Changed' } }, clientId: original.id }), status(409));
});
test('updates require owner and base version; competing writers cannot both save', async () => {
  const db = database();
  const saved = await createExam(db.tx, 'teacher-a', { document: fixture() });
  const document = fromDatabaseExam(saved);
  await assert.rejects(updateExam(db.tx, 'teacher-b', saved.id, { baseVersion: 1, document }), status(404));
  await assert.rejects(updateExam(db.tx, 'teacher-a', saved.id, { document }), status(428));
  const result = await Promise.allSettled([
    updateExam(db.tx, 'teacher-a', saved.id, { baseVersion: 1, document: { ...document, metadata: { ...document.metadata, title: 'Writer A' } } }),
    updateExam(db.tx, 'teacher-a', saved.id, { baseVersion: 1, document: { ...document, metadata: { ...document.metadata, title: 'Writer B' } } }),
  ]);
  assert.equal(result.filter(r => r.status === 'fulfilled').length, 1);
  const rejected = result.find(r => r.status === 'rejected');
  assert.ok(rejected && rejected.status === 'rejected' && status(409)(rejected.reason));
  assert.equal(db.exams.get(saved.id)?.version, 2);
});
test('denied reference updates preserve the exam version and linked questions', async () => {
  const db = database();
  const saved = await createExam(db.tx, 'teacher-a', { document: fixture() });
  const before = db.getItems();
  await assert.rejects(updateExam(db.tx, 'teacher-a', saved.id, { baseVersion: 1, folderId: 'folder-b' }), status(403));
  assert.equal(db.exams.get(saved.id)?.version, 1);
  assert.deepEqual(db.getItems(), before);
});
test('legacy question-item updates never return a stale cached workspace document', async () => {
  const db = database();
  const saved = await createExam(db.tx, 'teacher-a', { document: fixture() });
  db.questions.set('replacement', { ...questionToDatabase({ ...fixture().questions[0], id: 'replacement-question' }, { ownerId: 'teacher-a', subject: 'toan', grade: 5, examId: 'old-bank', questionId: 'replacement' }), deletedAt: null });
  let updated;
  try {
    updated = await updateExam(db.tx, 'teacher-a', saved.id, { baseVersion: 1, questionItems: [{ questionId: 'replacement', sectionId: 'workspace', position: 0 }] });
  } catch (error) {
    assert.ok(status(400)(error) || status(409)(error));
    assert.equal(db.exams.get(saved.id)?.version, 1);
    return;
  }
  const opened = fromDatabaseExam(updated);
  assert.equal(opened.questions.length, 1);
  assert.equal(opened.questions[0].id, 'replacement-question');
});
test('client creates legacy local drafts even when they already have a browser version', async () => {
  const oldFetch = globalThis.fetch;
  const local = { ...fixture(), version: 7 };
  let method: string | undefined;
  let url = '';
  globalThis.fetch = async (input, init) => {
    method = init?.method; url = String(input);
    return Response.json({ document: { ...local, id: 'ex_server-fixture', version: 1 } });
  };
  try {
    const saved = await persistExam(local);
    assert.equal(method, 'POST');
    assert.equal(url, '/api/exams');
    assert.equal(saved.version, 1);
    assert.equal(local.version, 7);
  } finally { globalThis.fetch = oldFetch; }
});
test('client keeps the caller document on conflict and does not turn errors into success', async () => {
  const oldFetch = globalThis.fetch;
  const original = fixture();
  const before = copy(original);
  globalThis.fetch = async () => Response.json({ error: 'Conflicting version', code: 'VERSION_CONFLICT' }, { status: 409 });
  try {
    await assert.rejects(persistExam(original), error => error instanceof SaveExamError && error.status === 409 && error.code === 'VERSION_CONFLICT');
    await assert.rejects(loadExam('server-id', 'teacher-a'), error => error instanceof SaveExamError && error.status === 409);
    assert.deepEqual(original, before);
  } finally { globalThis.fetch = oldFetch; }
});

test('collaboration roles separate viewing, commenting, editing and owner management', () => {
  for (const role of ['OWNER', 'VIEWER', 'COMMENTER', 'EDITOR'] as const) {
    const permission = collaborationPermissions(role);
    assert.equal(permission.canRead, true);
    assert.equal(permission.canComment, role !== 'VIEWER');
    assert.equal(permission.canPublish, role === 'OWNER');
    assert.equal(permission.canManage, role === 'OWNER');
    if (role === 'VIEWER' || role === 'COMMENTER') assert.throws(() => assertCollaborationEdit(permission, { document: fixture() }), status(403));
    else assert.doesNotThrow(() => assertCollaborationEdit(permission, { document: fixture() }));
  }
  for (const field of ['folderId', 'templateId', 'isStarred', 'restore', 'questionItems', 'variantCount']) assert.throws(() => assertCollaborationEdit(collaborationPermissions('EDITOR'), { document: fixture(), [field]: false }), status(403));
});
test('private invitations require owner and an existing active account; revoked access is checked every save', async () => {
  const db = database(), saved = await createExam(db.tx, 'teacher-a', { document: fixture() });
  const document = fromDatabaseExam(saved);
  await assert.rejects(examAccess(db.tx, saved, 'teacher-b'), status(404));
  await assert.rejects(setExamCollaborator(db.tx, saved.id, 'teacher-b', 'c@example.test', 'EDITOR'), status(404));
  await assert.rejects(setExamCollaborator(db.tx, saved.id, 'teacher-a', 'missing@example.test', 'EDITOR'), status(404));
  await assert.rejects(setExamCollaborator(db.tx, saved.id, 'teacher-a', 'a@example.test', 'EDITOR'), status(400));
  await setExamCollaborator(db.tx, saved.id, 'teacher-a', 'B@example.test', 'EDITOR');
  assert.equal((await examAccess(db.tx, saved, 'teacher-b')).role, 'EDITOR');
  const edited = await updateExam(db.tx, 'teacher-b', saved.id, { baseVersion: 1, document: { ...document, metadata: { ...document.metadata, title: 'Cộng tác sửa' } } });
  assert.equal(edited.ownerId, 'teacher-a');
  assert.ok([...db.questions.values()].every(q => q.ownerId === 'teacher-a'));
  await assert.rejects(setExamCollaborator(db.tx, saved.id, 'teacher-b', 'c@example.test', 'EDITOR'), status(403));
  await revokeExamCollaborator(db.tx, saved.id, 'teacher-a', 'teacher-b');
  await assert.rejects(examAccess(db.tx, edited, 'teacher-b'), status(404));
  await assert.rejects(updateExam(db.tx, 'teacher-b', saved.id, { baseVersion: 2, document: fromDatabaseExam(edited) }), status(404));
  assert.equal(db.exams.get(saved.id)?.version, 2);
  await setExamCollaborator(db.tx, saved.id, 'teacher-a', 'b@example.test', 'VIEWER');
  assert.equal((await examAccess(db.tx, edited, 'teacher-b')).role, 'VIEWER');
  await assert.rejects(updateExam(db.tx, 'teacher-b', saved.id, { baseVersion: 2, document: fromDatabaseExam(edited) }), status(403));
});
test('two invited editors use CAS; revisions preserve the original and record the real actor', async () => {
  const db = database(), saved = await createExam(db.tx, 'teacher-a', { document: fixture() });
  const original = copy(db.examRevisions.get(`${saved.id}:1`));
  await setExamCollaborator(db.tx, saved.id, 'teacher-a', 'b@example.test', 'EDITOR');
  await setExamCollaborator(db.tx, saved.id, 'teacher-a', 'c@example.test', 'EDITOR');
  const document = fromDatabaseExam(saved);
  const result = await Promise.allSettled(['teacher-b', 'teacher-c'].map(actor => updateExam(db.tx, actor, saved.id, { baseVersion: 1, document: { ...document, metadata: { ...document.metadata, title: actor } } })));
  assert.equal(result.filter(r => r.status === 'fulfilled').length, 1);
  const rejected = result.find(r => r.status === 'rejected');
  assert.ok(rejected && rejected.status === 'rejected' && status(409)(rejected.reason));
  assert.deepEqual(db.examRevisions.get(`${saved.id}:1`), original);
  const second = db.examRevisions.get(`${saved.id}:2`)!;
  assert.ok(['teacher-b', 'teacher-c'].includes(String(second.actorId)));
  assert.equal((second.snapshot as Exam).metadata.title, second.actorId);
  const current = fromDatabaseExam(await db.tx.exam.findUniqueOrThrow({ where: { id: saved.id } }));
  await updateExam(db.tx, 'teacher-a', saved.id, { baseVersion: current.version, document: (original!.snapshot as Exam) });
  assert.equal(db.exams.get(saved.id)?.version, 3);
  assert.deepEqual(db.examRevisions.get(`${saved.id}:1`), original);
  assert.equal((db.examRevisions.get(`${saved.id}:3`)!.snapshot as Exam).metadata.title, fixture().metadata.title);
});
test('old documents acquire a baseline without overwriting history; trash is inaccessible to collaborators', async () => {
  const db = database(), saved = await createExam(db.tx, 'teacher-a', { document: fixture() });
  db.examRevisions.clear();
  await setExamCollaborator(db.tx, saved.id, 'teacher-a', 'b@example.test', 'EDITOR');
  await updateExam(db.tx, 'teacher-b', saved.id, { baseVersion: 1, document: fromDatabaseExam(saved) });
  assert.equal(db.examRevisions.get(`${saved.id}:1`)!.actorId, null);
  assert.equal(db.examRevisions.get(`${saved.id}:2`)!.actorId, 'teacher-b');
  const deleted = { ...saved, deletedAt: new Date() };
  await assert.rejects(examAccess(db.tx, deleted, 'teacher-b', true), status(404));
  assert.equal((await examAccess(db.tx, deleted, 'teacher-a', true)).role, 'OWNER');
});

test('account pin rejects stale-tab writes and the client forwards the expected account without changing its draft', async () => {
 assert.doesNotThrow(() => assertRequestAccount(new Headers(), 'teacher-a'));
 assert.doesNotThrow(() => assertRequestAccount(new Headers({ 'x-examcraft-user': 'teacher-a' }), 'teacher-a'));
 assert.throws(() => assertRequestAccount(new Headers({ 'x-examcraft-user': 'teacher-a' }), 'teacher-b'), (error: unknown) => Boolean(error && typeof error === 'object' && 'code' in error && error.code === 'ACCOUNT_CHANGED'));
 const originalFetch = globalThis.fetch, source = fixture(), before = JSON.stringify(source);
 globalThis.fetch = async (_input, init) => {
   assert.equal(new Headers(init?.headers).get('x-examcraft-user'), 'teacher-a');
   return Response.json({ error: 'Account changed', code: 'ACCOUNT_CHANGED' }, { status: 409 });
 };
 try {
   await assert.rejects(persistExam(source, 'teacher-a'), error => error instanceof SaveExamError && error.code === 'ACCOUNT_CHANGED');
   await assert.rejects(loadExam('server-id', 'teacher-a'), error => error instanceof SaveExamError && error.code === 'ACCOUNT_CHANGED');
   assert.equal(JSON.stringify(source), before);
 } finally { globalThis.fetch = originalFetch; }
});
