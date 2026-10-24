// Explicit synthetic fixture only; never seed/reset or modify a pre-existing exam.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { randomUUID, createHash } = require('node:crypto');
const { PrismaClient } = require('@prisma/client');
const { requireTestDatabase } = require('../tests/helpers/test-database.ts');
process.loadEnvFile('.env');
const target = new URL(process.env.DATABASE_URL); target.pathname = '/examcraft_test_20261022';
const url = requireTestDatabase({ ...process.env, TEST_DATABASE_URL: target.href, EXAMCRAFT_ALLOW_TEST_DB: '1' });
const db = new PrismaClient({ datasources: { db: { url } }, log: [] });
const origin = 'http://127.0.0.1:3117', title = 'QA giao làm chấm đủ7dạng 20261024';
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
async function main() {
  try {
    assert.equal(process.argv[2], '--create-fixture');
    assert.equal((await fetch(origin + '/api/health').then(response => response.json())).isolatedTest, true);
    const owner = await db.user.findUniqueOrThrow({ where: { email: 'qa_browser_2@example.invalid' } });
    assert.equal(await db.exam.count({ where: { ownerId: owner.id, title } }), 0, 'QA fixture already exists; preserve it.');
    const source = await db.exam.findUniqueOrThrow({ where: { id: 'ex_e8740536be2a92ce61bdeae0b3e53469f2dc3a62' } });
    assert.equal(source.ownerId, owner.id); const sourceHash = hash(source.metadata);
    const login = await fetch(origin + '/api/auth/login', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: owner.email, password: 'ExamCraft-local-fixture-2026' }) });
    assert.equal(login.status, 200); const cookie = login.headers.getSetCookie().map(value => value.split(';')[0]).join('; ');
    const base = { difficulty: 'thong_hieu', version: 1, status: 'draft', verifiedBy: 'none' };
    const questions = [
      { id: 'qa-mc', type: 'multiple_choice', content: 'QA lựa chọn: chọn số không.', choices: [{ key: 'A', text: '0' }, { key: 'B', text: '1' }], correct_answer: 'A', points: 2, step_by_step_solution: 'QA đáp án riêng: A.' },
      { id: 'qa-tf', type: 'true_false_group', content: 'QA đúng/sai: đánh giá từng ý.', sub_questions: [{ key: 'a', content: '0 = 0', isCorrect: true }, { key: 'b', content: '0 = 1', isCorrect: false }, { key: 'c', content: '1 = 1', isCorrect: true }, { key: 'd', content: '1 = 0', isCorrect: false }], points: 1, step_by_step_solution: 'QA lời giải riêng TF.' },
      { id: 'qa-short', type: 'short_answer', content: 'QA trả lời ngắn: 1 - 1 = ?', correct_answer: '0', accepted_answers: ['0'], points: 1, step_by_step_solution: 'QA lời giải riêng ngắn.' },
      { id: 'qa-blank', type: 'fill_blank', content: 'QA điền khuyết: điền số không vào chỗ trống ___.', correct_answer: '0', accepted_answers: ['0'], points: 1, step_by_step_solution: 'QA lời giải riêng điền.' },
      { id: 'qa-match', type: 'matching', content: 'QA ghép đúng số với tên số.', matchingPairs: [{ id: 'p1', left: '1', right: 'Một' }, { id: 'p2', left: '2', right: 'Hai' }], points: 1, step_by_step_solution: 'QA lời giải riêng ghép.' },
      { id: 'qa-order', type: 'ordering', content: 'QA sắp xếp tăng dần.', choices: [{ key: 'two', text: '2' }, { key: 'one', text: '1' }], correctOrder: ['one', 'two'], points: 1, step_by_step_solution: 'QA lời giải riêng sắp xếp.' },
      { id: 'qa-essay', type: 'essay', content: 'QA tự luận: giải thích vì sao 1 - 1 = 0.', rubric: [{ criterion: 'Nêu giải thích đúng', maxPoints: 3 }], points: 3, step_by_step_solution: 'QA rubric/lời giải riêng, không lộ trước hạn.' },
    ].map(question => ({ ...base, ...question }));
    const now = new Date().toISOString();
    const document = { id: 'draft_' + randomUUID(), createdAt: now, updatedAt: now, metadata: { title, subject: 'toan', grade: 6, schoolName: '', departmentName: '', durationMinutes: 30, assessmentMode: 'scored' }, questions };
    const response = await fetch(origin + '/api/exams', { method: 'POST', headers: { Origin: origin, Cookie: cookie, 'x-examcraft-user': owner.id, 'Content-Type': 'application/json' }, body: JSON.stringify({ document }) });
    const result = await response.json(); assert.equal(response.status, 200); assert.equal(result.document.questions.length, 7);
    assert.equal(hash((await db.exam.findUniqueOrThrow({ where: { id: source.id } })).metadata), sourceHash);
    fs.writeFileSync('qa/rebuild-2026-10-23/learning-fixture.json', JSON.stringify({ createdAt: now, database: 'examcraft_test_20261022', ownerEmail: owner.email, examId: result.document.id, title, questionIds: questions.map(question => question.id), sourceExamId: source.id, sourceSha256: sourceHash, maxScore: 10, expectedObjectiveScore: 7, realAiCalls: false }, null, 2));
    console.log('PASS: synthetic seven-type QA exam created only in guarded TEST DB; original source unchanged.');
  } finally { await db.$disconnect(); }
}
main().catch(() => { console.error('QA learning fixture failed; no secret details printed.'); process.exitCode = 1; });
