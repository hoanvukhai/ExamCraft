// Creates one explicitly named disposable QA document; never uses the main DB.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { randomUUID, createHash } = require('node:crypto');
const { PrismaClient } = require('@prisma/client');
const { requireTestDatabase } = require('../tests/helpers/test-database.ts');
const { fromDatabaseExam } = require('../src/lib/exam-document.ts');
process.loadEnvFile('.env');
const target = new URL(process.env.DATABASE_URL); target.pathname = '/examcraft_test_20261022';
const url = requireTestDatabase({ ...process.env, TEST_DATABASE_URL: target.href, EXAMCRAFT_ALLOW_TEST_DB: '1' });
const db = new PrismaClient({ datasources: { db: { url } }, log: [] });
const origin = 'http://127.0.0.1:3117', title = 'QA lệnh câu và hoàn tác 20261024';
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
async function main() {
  try {
    assert.equal(process.argv[2], '--create-fixture');
    const health = await fetch(`${origin}/api/health`).then(response => response.json()); assert.equal(health.isolatedTest, true);
    const source = await db.exam.findUniqueOrThrow({ where: { id: 'ex_dfc36d842dd0da700caad3fb0ef0db42fc89bc12' }, include: { owner: { select: { email: true } } } });
    assert.equal(source.owner.email, 'qa_browser_2@example.invalid');
    assert.equal(await db.exam.count({ where: { ownerId: source.ownerId, title } }), 0, 'Named QA fixture already exists; preserve it.');
    const login = await fetch(`${origin}/api/auth/login`, { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'qa_browser_2@example.invalid', password: 'ExamCraft-local-fixture-2026' }) });
    assert.equal(login.status, 200);
    const cookie = login.headers.getSetCookie().map(value => value.split(';')[0]).join('; ');
    const exam = fromDatabaseExam(source), ids = [randomUUID(), randomUUID()];
    const document = { ...exam, id: `draft_${randomUUID()}`, serverId: undefined, version: undefined, access: undefined, metadata: { ...exam.metadata, title }, questions: ids.map((id, index) => ({ ...structuredClone(exam.questions[0]), id, content: `QA LỆNH CÂU ${index ? 'B' : 'A'}`, step_by_step_solution: 'QA lời giải nền lệnh câu', version: 1, status: 'draft', verifiedBy: 'none' })) };
    const response = await fetch(`${origin}/api/exams`, { method: 'POST', headers: { Origin: origin, Cookie: cookie, 'Content-Type': 'application/json', 'x-examcraft-user': source.ownerId }, body: JSON.stringify({ document }) });
    assert.equal(response.status, 200);
    const data = await response.json(); assert.equal(data.document.questions.length, 2);
    assert.equal(hash((await db.exam.findUniqueOrThrow({ where: { id: source.id } })).metadata), hash(source.metadata));
    fs.writeFileSync('qa/rebuild-2026-10-23/question-command-fixture.json', JSON.stringify({ checkedAt: new Date().toISOString(), status: 'PASS', database: 'examcraft_test_20261022', sourceUnchanged: true, sourceMetadataSha256: hash(source.metadata), examId: data.document.id, questionIds: data.document.questions.map(question => question.id), title, realAiCalls: false }, null, 2));
    console.log(`PASS: named TEST DB fixture ${data.document.id}, original unchanged.`);
  } finally { await db.$disconnect(); }
}
main().catch(() => { console.error('QA command fixture creation refused or failed; no secrets printed.'); process.exitCode = 1; });
