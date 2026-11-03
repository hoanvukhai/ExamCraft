import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { chromium } from 'playwright-core';
import { requireTestDatabase } from '../tests/helpers/test-database';
import { loginBucket } from '../src/lib/auth-security';
import { openCopilot, openInfoPanel } from './editor-ui';

const origin = process.env.EXAMCRAFT_TEST_ORIGIN ?? 'http://127.0.0.1:3123';
const report = process.env.CHAT_D1_REPORT_DIR ?? 'qa/rebuild-2026-11-03/ai-chat-d1';
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
async function until(check: () => Promise<boolean>, label: string) {
  const end = Date.now() + 15000;
  while (Date.now() < end) {
    if (await check()) return;
    await delay(100);
  }
  assert.fail(label);
}

test(
  'Chat AI D1: key preflight, durable clarification and cancellation',
  { timeout: 240000 },
  async (t) => {
    const target = requireTestDatabase();
    assert.equal(new URL(target).pathname, '/examcraft_test_20261022');
    assert.equal(new URL(target).port, '5436');
    assert.equal((await (await fetch(origin + '/api/health')).json()).isolatedTest, true);
    const db = new PrismaClient({ datasources: { db: { url: target } }, log: [] });
    assert.equal(
      (await db.$queryRawUnsafe<{ current_database: string }[]>('SELECT current_database()'))[0]
        .current_database,
      'examcraft_test_20261022',
    );
    const browser = await chromium.launch({
      executablePath: process.env.PILOT_BROWSER_PATH,
      headless: true,
    });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    // No browser traffic may leave this isolated origin. AI responses below are synthetic.
    await context.route('**/*', (route) =>
      new URL(route.request().url()).origin === origin ? route.continue() : route.abort(),
    );
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    const id = 'chat_d0_' + randomUUID(),
      email = id + '@example.invalid',
      password = randomUUID();
    const checks: string[] = [];
    const api = async (path: string) => {
      const response = await context.request.get(origin + path);
      assert.equal(response.ok(), true, path);
      return response.json();
    };
    const info = async () => {
      await openInfoPanel(page);
      if (await page.getByRole('button', { name: 'Bảng chi tiết', exact: true }).isVisible())
        await page.getByRole('button', { name: 'Bảng chi tiết', exact: true }).click();
    };
    let examId = '';
    fs.mkdirSync(report, { recursive: true });
    try {
      await db.user.create({
        data: {
          id,
          email,
          name: 'Giáo viên thử Đ0',
          role: 'TEACHER',
          passwordHash: await bcrypt.hash(password, 10),
          isActive: true,
          mustChangePassword: false,
        },
      });
      assert.equal(
        (
          await context.request.post(origin + '/api/auth/login', {
            headers: { Origin: origin },
            data: { email, password },
          })
        ).ok(),
        true,
      );
      const now = new Date().toISOString();
      const fixture = {
        id: randomUUID(),
        metadata: {
          title: 'Vật lí 9 — kiểm thử Đ0',
          schoolName: 'Đơn vị giả',
          departmentName: '',
          subject: 'vat_ly',
          grade: 9,
          durationMinutes: 60,
          academicYear: '2026 - 2027',
        },
        passages: [
          { id: 'p1', title: 'Tình huống', content: 'NGU_LIEU_D0', source: 'Fixture nội bộ' },
        ],
        questions: [
          {
            id: 'q1',
            type: 'short_answer',
            difficulty: 'thong_hieu',
            content: 'Một vật đi 12 m trong 3 s. Tốc độ bằng bao nhiêu?',
            correct_answer: '4',
            accepted_answers: ['4'],
            points: 0,
            passageId: 'p1',
            figures: [
              {
                id: 'f1',
                kind: 'image',
                data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jVJkAAAAASUVORK5CYII=',
              },
            ],
            step_by_step_solution: '12 / 3 = 4 m/s',
          },
        ],
        createdAt: now,
        updatedAt: now,
      };
      const created = await context.request.post(origin + '/api/exams', {
        headers: { Origin: origin },
        data: { document: fixture },
      });
      assert.equal(created.ok(), true);
      examId = (await created.json()).exam.id;

      await t.test('missing key preserves input without calling Copilot', async () => {
        let called = 0;
        await page.route('**/api/exam-copilot', (route) => {
          called++;
          return route.abort();
        });
        await page.goto(origin + '/editor/' + examId);
        await info();
        await openCopilot(page);
        const input = page.getByLabel('Yêu cầu cho AI', { exact: true });
        await input.fill('Tạo đề vào 10 Hà Nội môn Toán');
        await page.getByRole('button', { name: 'Gửi lệnh', exact: true }).click();
        await page.getByText('Chưa có khóa AI đang bật.', { exact: false }).waitFor();
        assert.equal(called, 0);
        assert.equal(await input.inputValue(), 'Tạo đề vào 10 Hà Nội môn Toán');
        await page.unroute('**/api/exam-copilot');
        checks.push('missing key: no provider call; command retained');
      });
      await context.route('**/api/user/keys', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            keys: [{ isActive: true, errorCount: 0 }],
            poolQuota: { usedToday: 0 },
          }),
        }),
      );
      await t.test(
        'conversation and free answer survive reload and keep the first request',
        async () => {
          const requests: {
            command: string;
            recentTurns: { text: string }[];
            replyTo?: string;
            conversationId: string;
          }[] = [];
          await page.route('**/api/exam-copilot', (route) => {
            const body = route.request().postDataJSON();
            requests.push(body);
            return route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({
                success: true,
                result:
                  requests.length === 1
                    ? {
                        type: 'clarification',
                        message: 'Bạn muốn dùng năm nào?',
                        quickOptions: ['2026', '2027'],
                      }
                    : {
                        type: 'action',
                        action: 'delete_question',
                        targetQuestionId: 'q1',
                        explanation: 'Đề xuất giả để kiểm lưu hội thoại',
                      },
              }),
            });
          });
          await page.reload();
          await info();
          await openCopilot(page);
          const input = page.getByLabel('Yêu cầu cho AI', { exact: true });
          await input.fill('Tạo đề vào 10 Hà Nội môn Toán không chuyên');
          await page.getByRole('button', { name: 'Gửi lệnh', exact: true }).click();
          await page.getByLabel('Tự nhập câu trả lời', { exact: true }).waitFor();
          await input.fill('B đang soạn riêng');
          await delay(250);
          await page.reload();
          await info();
          await openCopilot(page);
          assert.equal(await input.inputValue(), 'B đang soạn riêng');
          await page.getByLabel('Tự nhập câu trả lời', { exact: true }).fill('Năm 2026');
          await page.getByRole('button', { name: 'Gửi câu trả lời', exact: true }).click();
          await page
            .getByRole('region', { name: 'Đề xuất AI chưa áp dụng', exact: true })
            .waitFor();
          assert.equal(requests.length, 2);
          assert.ok(requests[1].replyTo);
          assert.equal(requests[1].conversationId, requests[0].conversationId);
          assert.equal(requests[1].command, 'Năm 2026');
          assert.ok(
            requests[1].recentTurns.some(
              (turn) => turn.text.includes('Hà Nội') && turn.text.includes('không chuyên'),
            ),
          );
          assert.equal(await input.inputValue(), 'B đang soạn riêng');
          assert.equal((await api('/api/exams/' + examId)).document.questions.length, 1);
          await page.getByRole('button', { name: 'Cất đề xuất', exact: true }).click();
          await page.unroute('**/api/exam-copilot');
          checks.push(
            'reload: transcript, original intent, clarification identity and separate composer retained',
          );
        },
      );
      await t.test('stop prevents late proposal; typing remains; no automatic retry', async () => {
        let release!: () => void;
        const gate = new Promise<void>((resolve) => {
          release = resolve;
        });
        let calls = 0;
        await page.route('**/api/exam-copilot', async (route) => {
          calls++;
          await gate;
          try {
            await route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({
                success: true,
                result: { type: 'action', action: 'delete_question', targetQuestionId: 'q1' },
              }),
            });
          } catch {
            /* Client cancellation closes the route. */
          }
        });
        const input = page.getByLabel('Yêu cầu cho AI', { exact: true });
        await input.fill('Lệnh đang chờ');
        await page.getByRole('button', { name: 'Gửi lệnh', exact: true }).click();
        await until(async () => calls === 1, 'request started');
        await input.fill('B mới phải còn');
        await page.getByRole('button', { name: 'Dừng', exact: true }).click();
        release();
        await delay(500);
        assert.equal(await input.inputValue(), 'B mới phải còn');
        assert.equal(
          await page.getByRole('region', { name: 'Đề xuất AI chưa áp dụng', exact: true }).count(),
          0,
        );
        assert.equal(calls, 1);
        await page.unroute('**/api/exam-copilot');
        checks.push('stop: no late proposal, no retry, new draft retained');
      });
      assert.deepEqual(pageErrors, [], 'no browser runtime errors');
    } finally {
      await browser.close();
      await db.exam.deleteMany({ where: { ownerId: id } });
      await db.question.deleteMany({ where: { ownerId: id } });
      await db.passage.deleteMany({ where: { ownerId: id } });
      await db.examTemplate.deleteMany({ where: { ownerId: id } });
      await db.auditLog.deleteMany({
        where: {
          OR: [{ actorId: id }, { targetType: 'LoginBucket', targetId: loginBucket(email) }],
        },
      });
      await db.user.deleteMany({ where: { id } });
      const cleanup =
        (await db.user.count({ where: { id } })) === 0 &&
        (await db.exam.count({ where: { ownerId: id } })) === 0;
      await db.$disconnect();
      fs.writeFileSync(
        report + '/browser-results.json',
        JSON.stringify(
          {
            checks,
            cleanup,
            pageErrors,
            database: 'examcraft_test_20261022',
            origin,
            provider: 'browser-intercepted synthetic responses; no real AI',
            buildId: fs.readFileSync('.next/BUILD_ID', 'utf8').trim(),
            checkedAt: new Date().toISOString(),
            limitations: 'Chrome viewport checks; not a physical phone or production/Vercel check.',
          },
          null,
          2,
        ),
      );
      assert.equal(cleanup, true);
    }
  },
);
