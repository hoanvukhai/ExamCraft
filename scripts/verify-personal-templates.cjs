// Read-only assertions for the named browser fixture, never the main database.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
const { PrismaClient } = require('@prisma/client');
const { requireTestDatabase } = require('../tests/helpers/test-database.ts');
const { fromDatabaseExam } = require('../src/lib/exam-document.ts');
process.loadEnvFile('.env');
const target = new URL(process.env.DATABASE_URL); target.pathname = '/examcraft_test_20261022';
const url = requireTestDatabase({ ...process.env, TEST_DATABASE_URL: target.href, EXAMCRAFT_ALLOW_TEST_DB: '1' });
const db = new PrismaClient({ datasources: { db: { url } }, log: [] });
const output = 'qa/rebuild-2026-10-23';
const names = ['QA mẫu gốc 20261023', 'QA mẫu tùy chỉnh 20261023'];
const digest = value => crypto.createHash('sha256').update(JSON.stringify({ value })).digest('hex');
async function main() {
  try {
    const phase = process.argv[2]; assert.ok(['baseline', 'source', 'final'].includes(phase));
    const row = await db.exam.findUniqueOrThrow({ where: { id: 'ex_dfc36d842dd0da700caad3fb0ef0db42fc89bc12' }, include: { owner: { select: { email: true } } } });
    assert.equal(row.owner.email, 'qa_browser_2@example.invalid');
    const exam = fromDatabaseExam(row);
    assert.equal(exam.questions.length, 1); assert.equal(exam.questions[0].points, 0);
    assert.equal(exam.questions[0].content, 'QA ảnh xanh phải còn sau khôi phục');
    assert.ok(exam.questions[0].figures.length && exam.questions[0].step_by_step_solution.length);
    const preserved = { questionsSha256: digest(exam.questions), sectionsSha256: digest(exam.sections), planSha256: digest(exam.metadata.examPlan) };
    if (phase !== 'baseline') {
      const baseline = JSON.parse(fs.readFileSync(`${output}/templates-baseline-db.json`, 'utf8'));
      assert.deepEqual(preserved, baseline.preserved);
    }
    const templates = await db.examTemplate.findMany({ where: { ownerId: row.ownerId, name: { in: names } } });
    assert.equal(templates.length, phase === 'baseline' ? 0 : phase === 'source' ? 1 : 2);
    const source = templates.find(item => item.name === names[0]);
    if (source) {
      assert.equal(source.isSystem, false); assert.equal(source.sections.status, 'needs_review');
      assert.equal(source.sections.snapshot.headerFields.academicYear, '2028–2029 QA MỚI');
      // The first saved fixture deliberately has unspecified dates; preview must say so.
      assert.equal(source.sections.sources[0].effectiveFrom, undefined);
      assert.equal(source.sections.sources[0].effectiveTo, undefined);
      assert.equal(source.sections.snapshot.questions, undefined);
    }
    if (phase === 'final') {
      const recorded = JSON.parse(fs.readFileSync(`${output}/templates-source-db.json`, 'utf8'));
      assert.equal(digest(source.sections), recorded.sourceSha256);
      const copy = templates.find(item => item.name === names[1]);
      assert.equal(copy.isSystem, false); assert.notEqual(copy.id, source.id);
      assert.deepEqual(copy.sections.origin, { templateId: source.id, revision: source.sections.revision });
      assert.equal(copy.sections.snapshot.headerFields.academicYear, '2029–2030 QA TÙY CHỈNH');
      assert.equal(copy.sections.sources[0].effectiveFrom, '2027-01-01');
      assert.equal(copy.sections.sources[0].effectiveTo, '2027-12-31');
      assert.equal(exam.metadata.academicYear, '2029–2030 QA TÙY CHỈNH');
      assert.equal(exam.metadata.templateApplication.source.id, source.id);
    }
    const result = { checkedAt: new Date().toISOString(), status: 'PASS', phase, readOnly: true, database: 'examcraft_test_20261022', examId: exam.id, version: exam.version, preserved, templateCount: templates.length, sourceId: source?.id, sourceSha256: source && digest(source.sections), realAiCalls: false };
    fs.writeFileSync(`${output}/templates-${phase}-db.json`, JSON.stringify(result, null, 2));
    console.log(`PASS: templates ${phase}; only named TEST DB fixtures read.`);
  } finally { await db.$disconnect(); }
}
main().catch(error => { console.error('Personal template read-only verification failed; fixture state differs.', String(error?.stack || '').split('\n').find(line => line.includes('at main')) || error?.name); process.exitCode = 1; });
