import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import type { Exam, QuestionType } from '../src/types/exam';
import { requireTestDatabase } from './helpers/test-database';
import { createExam, updateExam, assertExamReferences } from '../src/lib/exam-persistence';
import { fromDatabaseExam } from '../src/lib/exam-document';
import { parseKnowledgePackage, emptyKnowledgeScope } from '../src/lib/knowledge-package';
import knowledgeFixture from './fixtures/knowledge-package.json';

const target = requireTestDatabase();
const prisma = new PrismaClient({ datasources: { db: { url: target } }, log: [] });
const expectedStatus = (status: number) => (error: unknown) => Boolean(error && typeof error === 'object' && 'status' in error && error.status === status);

test('S1 real PostgreSQL transactions in an isolated test database', async t => {
  const runId = randomUUID();
  const users = [`qa_a_${runId}`, `qa_b_${runId}`];
  const systemTemplateId = `qa_system_${runId}`;
  const checks: string[] = [];
  t.after(async () => {
    try {
      await prisma.$transaction(async tx => {
        await tx.exam.deleteMany({ where: { ownerId: { in: users } } });
        await tx.question.deleteMany({ where: { ownerId: { in: users } } });
        await tx.examTemplate.deleteMany({ where: { OR: [{ ownerId: { in: users } }, { id: systemTemplateId }] } });
        await tx.folder.deleteMany({ where: { ownerId: { in: users } } });
        await tx.passage.deleteMany({ where: { ownerId: { in: users } } });
        await tx.user.deleteMany({ where: { id: { in: users } } });
      });
      const evidence = { runId, database: new URL(target).pathname.slice(1), checks, cleanupComplete: true, status: checks.length === 6 ? 'PASS' : 'INCOMPLETE', checkedAt: new Date().toISOString(), limitations: 'Direct services and real database transactions; HTTP and browser UX are separate checks.' };
      const directory = path.resolve('qa/rebuild-2026-10-25');
      fs.mkdirSync(directory, { recursive: true });
      fs.writeFileSync(path.join(directory, 'integration_s1.json'), JSON.stringify(evidence, null, 2));
    } finally { await prisma.$disconnect(); }
  });
  for (const [index, id] of users.entries()) await prisma.user.create({ data: { id, email: `qa_${index}_${runId}@example.invalid`, name: `Fixture teacher ${index}`, passwordHash: 'fixture-only-no-login', role: 'TEACHER', mustChangePassword: false } });
  const [owner, other] = users;
  const folder = await prisma.folder.create({ data: { ownerId: other, name: `Foreign folder ${runId}` } });
  const template = await prisma.examTemplate.create({ data: { ownerId: other, name: `Foreign template ${runId}`, subject: 'toan', gradeFrom: 1, gradeTo: 12, sections: [] } });
  await prisma.examTemplate.create({ data: { id: systemTemplateId, isSystem: true, name: `System fixture ${runId}`, subject: 'toan', gradeFrom: 1, gradeTo: 12, sections: [] } });
  const foreignQuestion = await prisma.question.create({ data: { ownerId: other, authorId: other, subject: 'toan', grade: 5, type: 'MULTIPLE_CHOICE', difficulty: 'THONG_HIEU', content: 'Private foreign fixture', payload: { correct: 'A' }, solution: 'Fixture', topics: [], tags: [] } });
  const types: QuestionType[] = ['multiple_choice', 'true_false_group', 'short_answer', 'essay', 'fill_blank', 'matching', 'ordering'];
  const original: Exam = {
    id: `draft-${runId}`, metadata: { title: 'Integration fixture', schoolName: 'Fixture', departmentName: 'Fixture', subject: 'toan', grade: 5, durationMinutes: 15 },
    passages: [{ id: 'p1', content: 'Ngữ liệu fixture', source: 'Tự soạn' }],
    questions: types.map((type, i) => ({ id: `q${i}`, type, difficulty: 'thong_hieu', content: `Question ${i}`, passageId: 'p1', points: i === 0 ? 0 : 1, choices: [{ key: 'A', text: 'Một', pinned: true }], correct_answer: 'A', accepted_answers: ['1.5', '3/2'], sub_questions: [{ key: 'a', content: 'Một ý', isCorrect: false, explanation: 'Fixture explanation' }], rubric: [{ criterion: 'Giải thích', maxPoints: 1 }], figures: [{ id: 'f1', kind: 'image', data: '/fixture.png' }], step_by_step_solution: 'Fixture solution', status: 'draft', verifiedBy: 'none', source: 'Fixture', licenseNote: 'Nội bộ' })),
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
  const pkg = parseKnowledgePackage({ ...knowledgeFixture, grade: 5 });
  original.metadata.knowledgePackage = pkg;
  original.metadata.knowledgeScope = { ...emptyKnowledgeScope(pkg), includeKnowledgeIds: ['addition'] };
  const saved = await prisma.$transaction(tx => createExam(tx, owner, { document: original, clientId: original.id }));
  await t.test('roundtrip seven types through PostgreSQL retains solutions, zero points and passages', async () => {
    const opened = fromDatabaseExam(saved);
    assert.deepEqual(opened.questions, original.questions);
    assert.deepEqual(opened.passages, original.passages);
    assert.deepEqual(opened.metadata.knowledgePackage, pkg);
    assert.deepEqual(opened.metadata.knowledgeScope, original.metadata.knowledgeScope);
    assert.equal(opened.serverId, saved.id);
    assert.equal(Number(saved.items[0].question.points), 0);
    assert.equal(saved.items.length, 7);
    checks.push('roundtrip-seven-types');
  });
  await t.test('repeat create does not duplicate questions or revisions', async () => {
    const again = await prisma.$transaction(tx => createExam(tx, owner, { document: original, clientId: original.id }));
    assert.equal(again.id, saved.id);
    assert.equal(await prisma.exam.count({ where: { ownerId: owner } }), 1);
    assert.equal(await prisma.question.count({ where: { ownerId: owner } }), 7);
    assert.equal(await prisma.questionRevision.count({ where: { question: { ownerId: owner } } }), 7);
    checks.push('idempotent-create');
  });
  await t.test('two teachers cannot link private question, folder or template', async () => {
    for (const input of [{ folderId: folder.id }, { templateId: template.id }, { questionItems: [{ questionId: foreignQuestion.id, sectionId: 's', position: 0 }] }]) await assert.rejects(prisma.$transaction(tx => assertExamReferences(tx, owner, input)), expectedStatus(403));
    await prisma.$transaction(tx => assertExamReferences(tx, owner, { templateId: systemTemplateId }));
    await assert.rejects(prisma.$transaction(tx => updateExam(tx, other, saved.id, { baseVersion: 1, title: 'Foreign write' })), expectedStatus(404));
    const document = fromDatabaseExam(saved), changed = structuredClone(pkg); changed.knowledge[0].title = 'Changed without revision';
    await assert.rejects(prisma.$transaction(tx => updateExam(tx, owner, saved.id, { baseVersion: 1, document: { ...document, metadata: { ...document.metadata, knowledgePackage: changed } } })), expectedStatus(409));
    assert.equal((await prisma.exam.findUniqueOrThrow({ where: { id: saved.id } })).version, 1);
    checks.push('reference-and-owner-permissions');
  });
  await t.test('competing transactions based on one version produce exactly one accepted save', async () => {
    const opened = fromDatabaseExam(saved);
    const results = await Promise.allSettled(['Writer A', 'Writer B'].map(title => prisma.$transaction(tx => updateExam(tx, owner, saved.id, { baseVersion: 1, document: { ...opened, metadata: { ...opened.metadata, title } } }), { maxWait: 10000, timeout: 20000 })));
    assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
    const rejected = results.find(result => result.status === 'rejected');
    assert.ok(rejected && rejected.status === 'rejected' && expectedStatus(409)(rejected.reason));
    assert.equal((await prisma.exam.findUniqueOrThrow({ where: { id: saved.id } })).version, 2);
    checks.push('concurrent-version-cas');
  });
  await t.test('a forced error rolls back document, linked questions and revisions together', async () => {
    const before = await prisma.exam.findUniqueOrThrow({ where: { id: saved.id }, include: { items: { include: { question: true }, orderBy: { position: 'asc' } } } });
    const revisionCount = await prisma.questionRevision.count({ where: { question: { ownerId: owner } } });
    await assert.rejects(prisma.$transaction(async tx => {
      const document = fromDatabaseExam(before);
      await updateExam(tx, owner, saved.id, { baseVersion: before.version, document: { ...document, metadata: { ...document.metadata, title: 'MUST ROLL BACK' }, questions: [] } });
      throw new Error('FORCED_FIXTURE_ROLLBACK');
    }), /FORCED_FIXTURE_ROLLBACK/);
    const after = await prisma.exam.findUniqueOrThrow({ where: { id: saved.id }, include: { items: { include: { question: true }, orderBy: { position: 'asc' } } } });
    assert.deepEqual(after, before);
    assert.equal(await prisma.questionRevision.count({ where: { question: { ownerId: owner } } }), revisionCount);
    checks.push('transaction-rollback');
  });
  await t.test('rejected foreign reference cannot increment version or detach existing items', async () => {
    const before = await prisma.exam.findUniqueOrThrow({ where: { id: saved.id }, include: { items: true } });
    await assert.rejects(prisma.$transaction(tx => updateExam(tx, owner, saved.id, { baseVersion: before.version, folderId: folder.id })), expectedStatus(403));
    const after = await prisma.exam.findUniqueOrThrow({ where: { id: saved.id }, include: { items: true } });
    assert.deepEqual(after, before);
    checks.push('denied-update-no-mutation');
  });
});
