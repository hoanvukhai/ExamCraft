import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { chromium } from 'playwright-core';
import { requireTestDatabase } from '../tests/helpers/test-database';
import { loginBucket } from '../src/lib/auth-security';

const origin = process.env.EXAMCRAFT_TEST_ORIGIN || 'http://127.0.0.1:3130';

test(
  'two teachers on one exam: who is here, a soft lock, and edits to different places are merged',
  { timeout: 240000 },
  async () => {
    const url = requireTestDatabase();
    assert.equal(new URL(url).pathname, '/examcraft_test_20261022');
    const db = new PrismaClient({ datasources: { db: { url } }, log: [] });
    const run = randomUUID();
    const ids = [0, 1].map((i) => `collab_${run}_${i}`);
    const emails = ids.map((id) => id + '@example.invalid');
    const names = ['Cô Lan', 'Thầy Bình'];
    const password = randomUUID();
    const browser = await chromium.launch({ executablePath: process.env.PILOT_BROWSER_PATH, headless: true });
    const open = async (email: string) => {
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
      const login = await context.request.post(origin + '/api/auth/login', {
        headers: { Origin: origin },
        data: { email, password },
      });
      assert.ok(login.ok());
      return { context, page: await context.newPage() };
    };
    try {
      for (const [i, id] of ids.entries())
        await db.user.create({
          data: {
            id,
            email: emails[i],
            name: names[i],
            role: 'TEACHER',
            passwordHash: await bcrypt.hash(password, 10),
            isActive: true,
            mustChangePassword: false,
          },
        });
      const [a, b] = [await open(emails[0]), await open(emails[1])];
      const now = new Date().toISOString();
      const question = (n: number) => ({
        id: 'q' + n,
        type: 'short_answer',
        difficulty: 'thong_hieu',
        content: 'Nội dung câu ' + n,
        correct_answer: '1',
        accepted_answers: ['1'],
        step_by_step_solution: '',
        points: 1,
      });
      const created = await a.context.request.post(origin + '/api/exams', {
        headers: { Origin: origin },
        data: {
          document: {
            id: randomUUID(),
            createdAt: now,
            updatedAt: now,
            metadata: {
              title: 'Đề cùng soạn',
              schoolName: '',
              departmentName: '',
              subject: 'toan',
              grade: 6,
            },
            questions: [question(1), question(2)],
          },
        },
      });
      assert.ok(created.ok(), await created.text());
      const examId = (await created.json()).exam.id as string;
      await db.examCollaborator.create({ data: { examId, userId: ids[1], role: 'EDITOR' } });

      await a.page.goto(origin + '/editor/' + examId);
      await b.page.goto(origin + '/editor/' + examId);
      await a.page.locator('[data-object="question:q2"]').first().waitFor();

      // B is really typing in Câu 2 (their save cannot reach the server, so they stay 'editing').
      await b.page.route('**/api/exams/' + examId, (route) =>
        route.request().method() === 'PATCH' ? route.abort() : route.continue(),
      );
      await b.page.locator('[data-object="question:q2"]').first().click();
      await b.page.getByLabel('Nội dung câu hỏi', { exact: true }).fill('Câu 2 B đang gõ dở');
      const people = a.page.getByRole('list', { name: 'Người đang mở đề', exact: true });
      await people.waitFor({ timeout: 25000 });
      assert.ok((await people.locator('li').first().getAttribute('title'))?.includes('Thầy Bình'));
      await a.page
        .locator('.a4-paper [data-others="Thầy Bình"]')
        .first()
        .waitFor({ state: 'attached', timeout: 25000 });

      // A goes to the same question: the detail is read-only until they choose to edit anyway.
      await a.page.locator('[data-object="question:q2"]').first().click();
      const lock = a.page.locator('[data-presence-lock]');
      await lock.waitFor({ timeout: 25000 });
      assert.ok((await lock.textContent())?.includes('Thầy Bình'));
      assert.equal(await a.page.getByLabel('Nội dung câu hỏi', { exact: true }).isEditable(), false);
      await lock.getByRole('button', { name: 'Vẫn sửa', exact: true }).click();
      await a.page
        .getByLabel('Nội dung câu hỏi', { exact: true })
        .and(a.page.locator(':not([readonly])'))
        .waitFor();
      assert.equal(await lock.count(), 0);

      // A edits Câu 2 while their save cannot reach the server; B saves a change to Câu 1 meanwhile.
      await a.page.route('**/api/exams/' + examId, (route) =>
        route.request().method() === 'PATCH' ? route.abort() : route.continue(),
      );
      await a.page.getByLabel('Nội dung câu hỏi', { exact: true }).fill('Câu 2 do Cô Lan sửa');
      await a.page.waitForTimeout(2500);
      const got = await (await b.context.request.get(origin + '/api/exams/' + examId)).json();
      const document = got.document;
      document.questions = document.questions.map((q: { id: string }) =>
        q.id === 'q1' ? { ...q, content: 'Câu 1 do Thầy Bình sửa' } : q,
      );
      const patched = await b.context.request.patch(origin + '/api/exams/' + examId, {
        headers: { Origin: origin },
        data: { document, baseVersion: document.version },
      });
      assert.ok(patched.ok(), await patched.text());
      await a.page.unroute('**/api/exams/' + examId);

      // A's tab picks up the other save, merges it with their own unsaved edit, and saves both.
      await a.page.getByText('vừa sửa Câu 1', { exact: false }).first().waitFor({ timeout: 30000 });
      const end = Date.now() + 20000;
      let merged: { content: string; id: string }[] = [];
      while (Date.now() < end) {
        const latest = await (await a.context.request.get(origin + '/api/exams/' + examId)).json();
        merged = latest.document.questions;
        if (merged.find((q) => q.id === 'q2')?.content === 'Câu 2 do Cô Lan sửa') break;
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      assert.equal(merged.find((q) => q.id === 'q1')?.content, 'Câu 1 do Thầy Bình sửa');
      assert.equal(merged.find((q) => q.id === 'q2')?.content, 'Câu 2 do Cô Lan sửa');

      // Both change the same field of Câu 1: the teacher is asked, and the chosen side is what gets saved.
      await a.page.route('**/api/exams/' + examId, (route) =>
        route.request().method() === 'PATCH' ? route.abort() : route.continue(),
      );
      await a.page.locator('[data-object="question:q1"]').first().click();
      await a.page.getByLabel('Nội dung câu hỏi', { exact: true }).fill('Câu 1 bản của A');
      await a.page.waitForTimeout(2500);
      const again = (await (await b.context.request.get(origin + '/api/exams/' + examId)).json()).document;
      again.questions = again.questions.map((q: { id: string }) =>
        q.id === 'q1' ? { ...q, content: 'Câu 1 bản của B' } : q,
      );
      assert.ok(
        (
          await b.context.request.patch(origin + '/api/exams/' + examId, {
            headers: { Origin: origin },
            data: { document: again, baseVersion: again.version },
          })
        ).ok(),
      );
      await a.page.unroute('**/api/exams/' + examId);
      const state = a.page.getByLabel('Trạng thái lưu', { exact: true });
      const choices = a.page.locator('[data-merge-conflicts]');
      const stop = Date.now() + 30000;
      while (Date.now() < stop && !(await choices.count())) {
        if ((await state.getAttribute('aria-expanded')) !== 'true') await state.click();
        await a.page.waitForTimeout(1500);
      }
      await choices.waitFor({ timeout: 5000 });
      await choices
        .getByLabel(/Của người kia/)
        .first()
        .check();
      await choices.getByRole('button', { name: 'Ghép theo lựa chọn', exact: true }).click();
      const until = Date.now() + 20000;
      let content = '';
      while (Date.now() < until && content !== 'Câu 1 bản của B') {
        const latest = await (await a.context.request.get(origin + '/api/exams/' + examId)).json();
        content = latest.document.questions.find((q: { id: string }) => q.id === 'q1')?.content;
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      assert.equal(content, 'Câu 1 bản của B');
    } finally {
      await browser.close();
      await db.exam.deleteMany({ where: { ownerId: { in: ids } } });
      await db.question.deleteMany({ where: { ownerId: { in: ids } } });
      await db.auditLog.deleteMany({
        where: {
          OR: [
            { actorId: { in: ids } },
            { targetType: 'LoginBucket', targetId: { in: emails.map(loginBucket) } },
          ],
        },
      });
      await db.user.deleteMany({ where: { id: { in: ids } } });
      assert.equal(await db.user.count({ where: { id: { in: ids } } }), 0);
      await db.$disconnect();
    }
  },
);
