import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { chromium } from 'playwright-core';
import { requireTestDatabase } from '../tests/helpers/test-database';

const origin = process.env.EXAMCRAFT_TEST_ORIGIN || 'http://127.0.0.1:3130';
const out = process.env.SHOT_DIR || '../shots';

async function main() {
  const url = requireTestDatabase();
  const db = new PrismaClient({ datasources: { db: { url } }, log: [] });
  const id = 'shot_' + randomUUID(), email = id + '@example.invalid', password = randomUUID();
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.PILOT_BROWSER_PATH, headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  page.on('console', (m) => { if (m.type() === 'error') console.log('console error:', m.text().slice(0, 200)); });
  page.on('pageerror', (e) => console.log('page error:', e.message.slice(0, 300)));
  try {
    await db.user.create({ data: { id, email, name: 'Giáo viên thử', role: 'TEACHER', passwordHash: await bcrypt.hash(password, 10), isActive: true, mustChangePassword: false } });
    const login = await context.request.post(origin + '/api/auth/login', { headers: { Origin: origin }, data: { email, password } });
    assert.ok(login.ok());
    const now = new Date().toISOString();
    const q = (id: string, extra: Record<string, unknown> = {}) => ({ id, type: 'multiple_choice', difficulty: 'thong_hieu', content: `Nội dung ${id} với $x^2$`, choices: [{ key: 'A', text: 'Đúng' }, { key: 'B', text: 'Sai' }, { key: 'C', text: 'Không biết' }, { key: 'D', text: 'Cả ba' }], correct_answer: 'A', points: 1, step_by_step_solution: 'Lời giải', ...extra });
    const document = {
      id: randomUUID(), createdAt: now, updatedAt: now,
      metadata: { title: 'Kiểm tra giữa kì', schoolName: 'SỞ GD&ĐT', departmentName: 'THCS Thử', subject: 'toan', grade: 9, durationMinutes: 45 },
      passages: [{ id: 'p1', title: 'Văn bản 1', content: 'Đoạn văn dùng chung cho câu 1 và 2.', source: 'SGK' }],
      questions: [q('q1'), q('q2'), q('q3', { type: 'true_false_group', choices: undefined, sub_questions: [{ key: 'a', content: 'Mệnh đề a', isCorrect: true }, { key: 'b', content: 'Mệnh đề b', isCorrect: false }] }), q('q4', { type: 'essay', choices: undefined, correct_answer: undefined, parts: [{ id: 'pa', content: 'Ý a', points: 0.5 }, { id: 'pb', content: 'Ý b', points: 0.5 }] })],
      outline: [
        { id: 'part1', kind: 'part', title: 'TRẮC NGHIỆM', numbering: 'roman', children: [
          { id: 'g1', kind: 'group', passageId: 'p1', children: [{ id: 'n1', kind: 'question', questionId: 'q1' }, { id: 'n2', kind: 'question', questionId: 'q2' }] },
          { id: 'n3', kind: 'question', questionId: 'q3' } ] },
        { id: 'part2', kind: 'part', title: 'TỰ LUẬN', numbering: 'roman', children: [{ id: 'n4', kind: 'question', questionId: 'q4' }] },
      ],
    };
    const created = await context.request.post(origin + '/api/exams', { headers: { Origin: origin }, data: { document } });
    assert.ok(created.ok(), await created.text());
    const examId = (await created.json()).exam.id;
    await page.goto(origin + '/editor/' + examId);
    await page.locator('[data-object="question:q1"]').first().waitFor();
    await page.screenshot({ path: out + '/1-exam.png' });
    await page.locator('[data-object="question:q1"]').first().click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: out + '/2-question.png' });
    console.log(JSON.stringify(await page.evaluate(() => ({ styles: [...document.querySelectorAll('style')].map((el) => el.textContent?.slice(0, 160)).filter((t) => t?.includes('data-object')), outline: getComputedStyle(document.querySelector('[data-object="group:g1"]')!).outline, sel: (document.querySelector('[aria-label="Vùng trang"]') as HTMLElement)?.dataset.selectable }))));
    await page.locator('[data-object="choice:q1:B"]').first().click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: out + '/3-choice.png' });
    await page.locator('[data-object="part:part1"]').first().click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: out + '/4-part.png' });
    await page.locator('[data-object="group:g1"]').first().click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: out + '/5-group.png' });
    await page.getByRole('button', { name: 'Thêm', exact: true }).click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: out + '/6-add-menu.png' });
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Dàn ý', exact: true }).click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: out + '/7-outline.png' });
    await db.exam.deleteMany({ where: { ownerId: id } });
  } finally {
    await browser.close();
    await db.exam.deleteMany({ where: { ownerId: id } });
    await db.question.deleteMany({ where: { ownerId: id } });
    await db.auditLog.deleteMany({ where: { actorId: id } });
    await db.user.deleteMany({ where: { id } });
    await db.$disconnect();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
