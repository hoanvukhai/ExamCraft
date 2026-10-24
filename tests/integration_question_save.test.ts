import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import { PrismaClient, type Prisma } from '@prisma/client';
import { requireTestDatabase } from './helpers/test-database';
import { createExam, updateExam } from '../src/lib/exam-persistence';
import { fromDatabaseExam } from '../src/lib/exam-document';
import type { Exam } from '../src/types/exam';

test('incremental question saves preserve history, clear optional fields, restore deleted rows and roll back atomically', async t => {
  const url = requireTestDatabase();
  let queries = 0;
  const db = new PrismaClient({ datasources: { db: { url } }, log: [{ emit: 'event', level: 'query' }] });
  db.$on('query', () => { queries++; });
  const owner = 'save_' + randomUUID(), other = 'save_' + randomUUID();
  const measurements: object[] = [];
  t.after(async () => {
    try {
      await db.exam.deleteMany({ where: { ownerId: { in: [owner, other] } } });
      await db.question.deleteMany({ where: { ownerId: { in: [owner, other] } } });
      await db.user.deleteMany({ where: { id: { in: [owner, other] } } });
    } finally { await db.$disconnect(); }
  });
  assert.equal((await db.$queryRaw<{ current_database: string }[]>`SELECT current_database()`)[0].current_database, 'examcraft_test_20261022');
  for (const id of [owner, other]) await db.user.create({ data: { id, email: id + '@example.invalid', name: 'Save fixture', passwordHash: 'no-login', role: 'TEACHER' } });
  const document: Exam = { id: randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), metadata: { title: 'Forty questions', schoolName: 'Fixture', departmentName: 'Fixture', subject: 'toan', grade: 6, durationMinutes: 45 },
    questions: Array.from({ length: 40 }, (_, i) => ({ id: 'q' + i, type: 'short_answer', difficulty: 'thong_hieu', content: 'Question ' + i, points: i === 0 ? 0 : 1, step_by_step_solution: 'Solution', correct_answer: '2', accepted_answers: ['2'], source: 'Fixture', licenseNote: 'Test', figures: [{ id: 'image', kind: 'image', data: { url: 'data:image/png;base64,AA==' } }] })) };
  let saved = await db.$transaction(tx => createExam(tx, owner, { document }), { timeout: 30000 });
  const id = saved.id;
  const rows = () => db.question.findMany({ where: { ownerId: owner }, orderBy: { id: 'asc' } });
  const history = () => db.questionRevision.count({ where: { question: { ownerId: owner } } });
  const initial = await rows();
  assert.equal(initial.length, 40); assert.equal(await history(), 40);
  async function save(doc: Exam, label: string) {
    queries = 0; const start = performance.now();
    const result = await db.$transaction(tx => updateExam(tx, owner, id, { baseVersion: saved.version, document: doc }), { timeout: 30000 });
    measurements.push({ label, queries, durationMs: Math.round(performance.now() - start) });
    saved = result; return result;
  }
  for (let repeat = 0; repeat < 2; repeat++) await save(fromDatabaseExam(saved), 'unchanged-' + repeat);
  assert.deepEqual((await rows()).map(q => q.version), initial.map(q => q.version));
  assert.equal(await history(), 40);
  assert.equal(await db.examRevision.count({ where: { examId: id } }), 3);
  let doc = fromDatabaseExam(saved); doc.questions.reverse(); await save(doc, 'reorder');
  assert.equal(await history(), 40); assert.deepEqual(fromDatabaseExam(saved).questions.map(q => q.id), doc.questions.map(q => q.id));
  doc = fromDatabaseExam(saved); doc.questions[0].step_by_step_solution = 'Changed solution'; await save(doc, 'one-edit');
  assert.equal(await history(), 41); assert.equal((await rows()).filter(q => q.version === 2).length, 1);
  doc = fromDatabaseExam(saved); const q = doc.questions[0]; delete q.figures; delete q.source; delete q.licenseNote; delete q.points;
  await save(doc, 'clear');
  const cleared = (await rows()).find(q => q.version === 3)!;
  assert.equal(cleared.figures, null); assert.equal(cleared.points, null); assert.equal(cleared.source, null); assert.equal(cleared.licenseNote, null);
  await save(fromDatabaseExam(saved), 'after-clear'); assert.equal(await history(), 42);
  await db.question.update({ where: { id: cleared.id }, data: { deletedAt: new Date() } });
  await save(fromDatabaseExam(saved), 'restore-deleted'); assert.equal(await history(), 43); assert.equal((await rows()).find(q => q.id === cleared.id)!.deletedAt, null);
  const beforeRows = await rows(), beforeCount = await history(), beforeVersion = saved.version;
  doc = fromDatabaseExam(saved); doc.questions[1].content = 'Must roll back';
  await assert.rejects(db.$transaction(async tx => { await updateExam(tx, owner, id, { baseVersion: saved.version, document: doc }); throw Error('rollback-fixture'); }), /rollback-fixture/);
  assert.deepEqual(await rows(), beforeRows); assert.equal(await history(), beforeCount); assert.equal((await db.exam.findUniqueOrThrow({ where: { id } })).version, beforeVersion);
  const denied = (status: number) => (e: unknown) => !!e && typeof e === 'object' && 'status' in e && e.status === status;
  await assert.rejects(db.$transaction(tx => updateExam(tx, other, id, { baseVersion: saved.version, document: doc })), denied(404));
  await assert.rejects(db.$transaction(tx => updateExam(tx, owner, id, { baseVersion: 1, document: doc })), denied(409));
  assert.deepEqual(await rows(), beforeRows); assert.equal(await history(), beforeCount);
  // Detach and reattach uses the same owned row, keeping its history intact.
  doc = fromDatabaseExam(saved); const detached = doc.questions.pop()!;
  await save(doc,'remove-link'); assert.equal(await history(),beforeCount);
  doc = fromDatabaseExam(saved); doc.questions.unshift(detached);
  await save(doc,'reattach'); assert.equal(await history(),beforeCount);
  doc = fromDatabaseExam(saved); doc.questions.push({...detached,id:'new-question',content:'New question'});
  await save(doc,'insert'); assert.equal(await history(),beforeCount+1); assert.equal((await rows()).length,41);
  doc = fromDatabaseExam(saved); doc.questions[0].points=1.235;
  await save(doc,'fractional-points'); const fractionalCount=await history();
  await save(fromDatabaseExam(saved),'after-fractional-points'); assert.equal(await history(),fractionalCount);
  const racingDoc=fromDatabaseExam(saved); racingDoc.questions[0].content='Stale incoming edit';
  const racingId=saved.items[0].questionId, racingVersion=saved.version;
  await assert.rejects(db.$transaction(async tx=>{
    // Simulate an independent bank/history writer after the batch read.
    const wrapped = new Proxy(tx,{get(target,key){
      if(key!=='question') return Reflect.get(target,key);
      return new Proxy(target.question,{get(delegate,method){
        if(method!=='findMany') return Reflect.get(delegate,method);
        return async (args: Parameters<typeof delegate.findMany>[0])=>{
          const found=await delegate.findMany(args);
          await db.question.update({where:{id:racingId},data:{content:'Newer independent edit',version:{increment:1}}});
          return found;
        };
      }});
    }}) as Prisma.TransactionClient;
    await updateExam(wrapped,owner,id,{baseVersion:racingVersion,document:racingDoc});
  },{timeout:30000}),denied(409));
  assert.equal((await db.question.findUniqueOrThrow({where:{id:racingId}})).content,'Newer independent edit');
  assert.equal((await db.exam.findUniqueOrThrow({where:{id}})).version,racingVersion);
  assert.equal(await history(),fractionalCount);
  // Historical rows must still be ownership-checked even when no longer linked.
  doc = fromDatabaseExam(saved); doc.questions = [];
  await save(doc,'empty'); assert.equal(saved.items.length,0); assert.equal(await history(),fractionalCount);
  await db.question.update({where:{id:initial[0].id},data:{ownerId:other}});
  const rejectedDoc = {...doc,questions:document.questions};
  await assert.rejects(db.$transaction(tx=>updateExam(tx,owner,id,{baseVersion:saved.version,document:rejectedDoc})),denied(403));
  assert.equal((await db.exam.findUniqueOrThrow({where:{id}})).version,saved.version);
  assert.equal(await db.examQuestion.count({where:{examId:id}}),0);
  fs.mkdirSync('qa/rebuild-2026-10-25', { recursive: true });
  fs.writeFileSync('qa/rebuild-2026-10-25/question-save.json', JSON.stringify({ status: 'PASS', database: new URL(url).pathname.slice(1), measurements, historyPreserved: true, limitations: 'Local service/DB measurements; no WAN latency, no previous-code timing benchmark.' }, null, 2));
});
