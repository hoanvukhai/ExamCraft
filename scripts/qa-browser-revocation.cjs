// Fake browser fixture only. Never resets users, passwords or application data.
const fs = require('node:fs');
const path = require('node:path');
const { PrismaClient } = require('@prisma/client');
const { requireTestDatabase } = require('../tests/helpers/test-database.ts');
const { createExam } = require('../src/lib/exam-persistence.ts');
const { setExamCollaborator, revokeExamCollaborator } = require('../src/lib/exam-collaboration.ts');
process.loadEnvFile(path.resolve('.env'));
const target = new URL(process.env.DATABASE_URL); target.pathname = '/examcraft_test_20261022';
const env = { ...process.env, TEST_DATABASE_URL: target.href, EXAMCRAFT_ALLOW_TEST_DB: '1' };
const prisma = new PrismaClient({ datasources: { db: { url: requireTestDatabase(env) } }, log: [] });
const manifestPath = path.resolve('qa/rebuild-2026-10-23/revocation-fixture.json');
(async () => {
  try {
    const action = process.argv[2];
    if (action === 'prepare') {
      const owner = await prisma.user.findUniqueOrThrow({ where: { email: 'qa_browser_1@example.invalid' } });
      const editor = await prisma.user.findUniqueOrThrow({ where: { email: 'qa_browser_2@example.invalid' } });
      const now = new Date().toISOString();
      const document = { id: `qa_revocation_${Date.now()}`, createdAt: now, updatedAt: now, metadata: { title: 'QA thu hồi quyền — dữ liệu giả', subject: 'toan', grade: 6, durationMinutes: 15, schoolName: '', departmentName: '' }, questions: [{ id: 'qa-essay', type: 'essay', difficulty: 'thong_hieu', content: 'QA nội dung máy chủ trước thu hồi', step_by_step_solution: 'QA lời giải gốc', points: 1 }] };
      const saved = await prisma.$transaction(async tx => {
        const exam = await createExam(tx, owner.id, { document });
        await setExamCollaborator(tx, exam.id, owner.id, editor.email, 'EDITOR');
        return exam;
      }, { timeout: 15000 });
      fs.writeFileSync(manifestPath, JSON.stringify({ database: 'examcraft_test_20261022', examId: saved.id, ownerId: owner.id, editorId: editor.id, initialVersion: saved.version, preparedAt: now }, null, 2));
      console.log(`Prepared fake editor fixture: http://127.0.0.1:3117/editor/${saved.id}`);
    } else if (['downgrade', 'revoke', 'verify'].includes(action)) {
      const fixture = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      if (fixture.database !== 'examcraft_test_20261022') throw Error('Wrong fixture database');
      const exam = await prisma.exam.findUniqueOrThrow({ where: { id: fixture.examId } });
      const editor = await prisma.user.findUniqueOrThrow({ where: { id: fixture.editorId } });
      const owner = await prisma.user.findUniqueOrThrow({ where: { id: fixture.ownerId } });
      if (owner.email !== 'qa_browser_1@example.invalid' || editor.email !== 'qa_browser_2@example.invalid' || exam.ownerId !== owner.id) throw Error('Not the designated fake fixture');
      if (action === 'downgrade') await prisma.$transaction(tx => setExamCollaborator(tx, exam.id, owner.id, editor.email, 'VIEWER'));
      if (action === 'revoke') await prisma.$transaction(tx => revokeExamCollaborator(tx, exam.id, owner.id, editor.id));
      if (action === 'verify') {
        const document = exam.metadata.workspaceDocument;
        if (exam.version !== fixture.initialVersion || document.questions[0].content !== 'QA nội dung máy chủ trước thu hồi' || document.questions[0].step_by_step_solution !== 'QA lời giải gốc') throw Error('Server content changed');
        delete fixture.serverUnchangedAfterDeniedSave;
        fixture.serverUnchangedAfterRevocation = true; fixture.verifiedAt = new Date().toISOString();
        fs.writeFileSync(manifestPath, JSON.stringify(fixture, null, 2));
      }
      console.log(`Fake fixture ${action}: complete; main database untouched.`);
    } else throw Error('Use prepare, downgrade, revoke or verify');
  } finally { await prisma.$disconnect(); }
})().catch(() => { console.error('QA fixture failed; no secrets printed.'); process.exitCode = 1; });
