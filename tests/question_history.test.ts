import assert from 'node:assert/strict';
import test from 'node:test';
import type { Prisma } from '@prisma/client';
import { forkPayload, forkQuestion, rollbackQuestion } from '../src/lib/question-history';
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- This in-memory Prisma test double accepts dynamic model rows and select/include arguments; production boundaries remain typed.
type Row = Record<string, any>;
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const status = (value: number) => (e: unknown) => !!e && typeof e === 'object' && 'status' in e && e.status === value;
function fake() {
  const questions = new Map<string, Row>(), passages = new Map<string, Row>(), revisions = new Map<string, Row>();
  const match = (row: Row, where: Row) => Object.entries(where).every(([key, value]) => row[key] === value);
  const withRelations = (row: Row, include?: Row) => row ? clone({ ...row, ...(include?.passage ? { passage: passages.get(row.passageId) ?? null } : {}), ...(include?.author ? { author: { id: row.authorId, name: 'Tác giả' } } : {}) }) : null;
  const tx = {
    $queryRaw: async () => [],
    passage: {
      findFirst: async ({ where }: Row) => clone([...passages.values()].find(row => match(row, where)) ?? null),
      create: async ({ data }: Row) => { const row = { id: `passage-${passages.size + 1}`, ...clone(data) }; passages.set(row.id, row); return row; },
    },
    question: {
      findFirst: async ({ where, include }: Row) => withRelations([...questions.values()].find(row => match(row, where))!, include),
      findUniqueOrThrow: async ({ where, include }: Row) => { const row = questions.get(where.id); if (!row) throw new Error('NOT_FOUND'); return withRelations(row, include); },
      create: async ({ data, include }: Row) => { const row = { deletedAt: null, ...clone(data) }; questions.set(row.id, row); return withRelations(row, include); },
      updateMany: async ({ where, data }: Row) => { const row = [...questions.values()].find(row => match(row, where)); if (!row) return { count: 0 }; questions.set(row.id, { ...row, ...clone(data), version: row.version + data.version.increment }); return { count: 1 }; },
    },
    questionRevision: {
      findUnique: async ({ where }: Row) => { const key = where.questionId_version; return clone(revisions.get(`${key.questionId}:${key.version}`) ?? null); },
      create: async ({ data }: Row) => { const key = `${data.questionId}:${data.version}`; assert.equal(revisions.has(key), false); revisions.set(key, clone(data)); return clone(data); },
    },
  } as unknown as Prisma.TransactionClient;
  const original = { id: 'source', ownerId: 'owner', authorId: 'author', passageId: 'reading', subject: 'ngu_van', grade: 7,
    type: 'SHORT_ANSWER', difficulty: 'THONG_HIEU', content: 'Câu hỏi', solution: 'Lời giải', points: 0, figures: null,
    topics: ['Đọc hiểu'], tags: ['__workspace_only', 'reading'], visibility: 'SHARED', sourceKind: 'TEACHER_WRITTEN', sourceUrl: 'https://example.test/license', shareable: true, aiGenerated: false,
    licenseNote: 'Được phép sử dụng', status: 'VERIFIED', verifiedBy: 'HUMAN', version: 1, deletedAt: null,
    payload: { accepted_answers: ['0'], workspaceExamId: 'private-exam', editorData: { id: 'logical-original', type: 'short_answer', difficulty: 'thong_hieu', content: 'Câu hỏi', passageId: 'reading', points: 0 } },
  };
  questions.set('source', clone(original));
  passages.set('reading', { id: 'reading', ownerId: 'owner', title: 'Bài đọc', content: 'Toàn bộ ngữ liệu', source: 'Nguồn dùng chung', figures: null });
  revisions.set('source:1', { questionId: 'source', version: 1, snapshot: clone(original) });
  return { tx, questions, passages, revisions, original };
}
test('fork copies licensed reading passage into own storage, gives a distinct logical ID and removes workspace marker', async () => {
  const db = fake();
  const first = await forkQuestion(db.tx, 'reader', 'source');
  const second = await forkQuestion(db.tx, 'reader', 'source');
  assert.notEqual(first.id, second.id);
  assert.equal(first.ownerId, 'reader'); assert.equal(first.authorId, 'author'); assert.equal(first.originId, 'source');
  assert.equal(first.passage!.ownerId, 'reader'); assert.equal(first.passage!.content, 'Toàn bộ ngữ liệu');
  assert.notEqual(first.passageId, 'reading');
  const payload = first.payload as Row;
  assert.equal(payload.editorData.id, first.id); assert.equal(payload.editorData.passageId, first.passageId);
  assert.equal(payload.workspaceExamId, undefined); assert.equal(payload.editorData.status, 'draft');
  assert.equal(first.licenseNote, 'Được phép sử dụng'); assert.equal(first.points, 0);
  assert.equal(first.visibility, 'PRIVATE'); assert.equal(first.verifiedBy, 'NONE'); assert.deepEqual(first.tags, ['reading']);
  assert.equal('email' in first.author, false);
  assert.equal(db.questions.get('source')!.payload.editorData.id, 'logical-original');
});
test('fork rejects unavailable, private, unlicensed and foreign private passages', async () => {
  const db = fake();
  await assert.rejects(forkQuestion(db.tx, 'reader', 'missing'), status(404));
  db.questions.get('source')!.visibility = 'PRIVATE';
  await assert.rejects(forkQuestion(db.tx, 'reader', 'source'), status(403));
  db.questions.get('source')!.visibility = 'SHARED'; db.questions.get('source')!.shareable = false;
  await assert.rejects(forkQuestion(db.tx, 'reader', 'source'), status(403));
  db.questions.get('source')!.shareable = true; db.passages.get('reading')!.ownerId = 'foreign';
  await assert.rejects(forkQuestion(db.tx, 'reader', 'source'), status(403));
  assert.equal(db.passages.size, 1); assert.equal(db.questions.size, 1);
});
test('question rollback uses owner and CAS, resets review, clears null figures and preserves zero points', async () => {
  const db = fake(), current = db.questions.get('source')!;
  current.tags = ['reading'];
  current.version = 2; current.content = 'Nội dung mới'; current.figures = [{ kind: 'image', id: 'new', data: {} }]; current.points = 3;
  const before = clone(db.revisions.get('source:1'));
  await assert.rejects(rollbackQuestion(db.tx, 'reader', 'source', 1, 2), status(404));
  await assert.rejects(rollbackQuestion(db.tx, 'owner', 'source', 1, 1), status(409));
  const result = await Promise.allSettled([rollbackQuestion(db.tx, 'owner', 'source', 1, 2), rollbackQuestion(db.tx, 'owner', 'source', 1, 2)]);
  assert.equal(result.filter(r => r.status === 'fulfilled').length, 1);
  const updated = db.questions.get('source')!;
  assert.equal(updated.version, 3); assert.equal(updated.content, 'Câu hỏi'); assert.equal(updated.points, 0);
  assert.equal(updated.status, 'DRAFT'); assert.equal(updated.verifiedBy, 'NONE');
  // JSON-null sentinel is sent explicitly, never undefined (which leaves the previous figure intact).
  assert.notEqual(updated.figures, undefined);
  assert.deepEqual(db.revisions.get('source:1'), before);
});
test('rollback cannot revive a deleted question or restore a passage owned by somebody else', async () => {
  const db = fake();
  db.questions.get('source')!.tags = ['reading'];
  db.questions.get('source')!.deletedAt = '2026-10-22';
  await assert.rejects(rollbackQuestion(db.tx, 'owner', 'source', 1, 1), status(404));
  db.questions.get('source')!.deletedAt = null; db.passages.get('reading')!.ownerId = 'foreign';
  await assert.rejects(rollbackQuestion(db.tx, 'owner', 'source', 1, 1), status(403));
  assert.equal(db.questions.get('source')!.version, 1);
});
test('fork payload does not retain source logical IDs, source passage IDs or arbitrary DB owner fields', () => {
  const payload = forkPayload({ workspaceExamId: 'x', editorData: { id: 'old', ownerId: 'private', type: 'essay', difficulty: 'thong_hieu', content: 'Đề cũ', passageId: 'old-passage' } }, 'new', null) as Row;
  assert.equal(payload.editorData.id, 'new'); assert.equal(payload.editorData.ownerId, undefined); assert.equal(payload.editorData.passageId, undefined); assert.equal(payload.workspaceExamId, undefined);
});

test('question rollback cannot mutate a workspace question behind its full-document cache', async () => {
  const db = fake();
  await assert.rejects(rollbackQuestion(db.tx, 'owner', 'source', 1, 1), status(409));
  assert.equal(db.questions.get('source')!.version, 1);
});

test('bank client keeps optional passage by value and strips owner data from its portable result', async () => {
  const { bankPassage, saveBankQuestion } = await import('../src/lib/question-client');
  assert.deepEqual(bankPassage({ id: 'p', content: 'Ngữ liệu', ownerId: 'private-owner', source: 'Nguồn' }), { id: 'p', content: 'Ngữ liệu', source: 'Nguồn' });
  const oldFetch = globalThis.fetch; let request: Row | undefined;
  globalThis.fetch = async (_input, init) => {
    assert.equal(new Headers(init?.headers).get('x-examcraft-user'), 'owner');
    request = JSON.parse(String(init?.body));
    return Response.json({ question: { id: 'stored-q', type: 'SHORT_ANSWER', difficulty: 'THONG_HIEU', content: 'Câu đọc hiểu', subject: 'ngu_van', grade: 7,
      points: 0, passageId: 'stored-p', passage: { id: 'stored-p', content: 'Ngữ liệu', ownerId: 'private-owner' }, payload: { editorData: { id: 'stored-q' } } } });
  };
  try {
    const saved = await saveBankQuestion({ id: 'local-q', type: 'short_answer', difficulty: 'thong_hieu', content: 'Câu đọc hiểu', step_by_step_solution: '', subject: 'ngu_van', grade: 7, points: 0, passageId: 'local-p' }, 'owner', { id: 'local-p', content: 'Ngữ liệu' });
    assert.deepEqual(request!.passage, { content: 'Ngữ liệu' }); assert.equal(request!.passageId, undefined);
    assert.equal(saved.passageId, 'stored-p'); assert.equal(saved.passage!.id, 'stored-p'); assert.equal((saved.passage as Row).ownerId, undefined);
  } finally { globalThis.fetch = oldFetch; }
});

test('canonical null clears old editor figures and points while absent fields retain portable fallback and zero stays zero', async () => {
  const { normalizeQuestion } = await import('../src/lib/exam-document');
  const editorData = { id: 'q', type: 'essay', difficulty: 'thong_hieu', content: 'Nội dung', figures: [{ id: 'old-image', kind: 'image', data: 'data:image/png;base64,a' }], points: 3 };
  const canonical = { id: 'q', type: 'ESSAY', difficulty: 'THONG_HIEU', content: 'Nội dung', payload: { editorData } };
  const cleared = normalizeQuestion({ ...canonical, figures: null, points: null });
  assert.equal(cleared.figures, undefined); assert.equal(cleared.points, undefined);
  const fallback = normalizeQuestion(canonical);
  assert.deepEqual(fallback.figures, editorData.figures); assert.equal(fallback.points, 3);
  assert.equal(normalizeQuestion({ ...canonical, points: 0 }).points, 0);
});

test('document validates section identity, finite scoring and legacy passage figure maps', async () => {
  const { normalizeExamDocument } = await import('../src/lib/exam-document');
  const document = { id: 'doc', metadata: { title: 'Đề', subject: 'ngu_van', grade: 7 }, questions: [], createdAt: '2026-10-22', updatedAt: '2026-10-22' };
  for (const sections of [null, {}, [{ id: '' }], [{ id: 'x' }, { id: 'x' }], [{ id: 'x', title: 3 }], [{ id: 'x', pointsPerQuestion: -1 }], [{ id: 'x', progressiveScoring: [0, Infinity] }], [{ id: 'x', progressiveScoring: [-1] }]]) assert.throws(() => normalizeExamDocument({ ...document, sections }));
  const restored = normalizeExamDocument({ ...document, sections: [{ id: 'reading', title: 'Đọc hiểu', pointsPerQuestion: 0, progressiveScoring: [0, 0] }], passages: [{ id: 'p', content: 'Đọc', figures: { figureKey: { kind: 'image', data: 'data:image/png;base64,a' } } }] });
  assert.equal(restored.sections![0].pointsPerQuestion, 0);
  assert.deepEqual(restored.passages![0].figures, [{ id: 'figureKey', kind: 'image', data: 'data:image/png;base64,a' }]);
});
