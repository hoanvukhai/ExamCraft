import { toggleTheme, openAccount, openCopilot } from './editor-ui';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { chromium } from 'playwright-core';
import { requireTestDatabase } from '../tests/helpers/test-database';
import { loginBucket } from '../src/lib/auth-security';

const origin = process.env.EXAMCRAFT_TEST_ORIGIN || 'http://127.0.0.1:3117';
const report = process.env.FRAME_REPORT_DIR || 'qa/rebuild-2026-10-28/frame-panels';

test('frame: persistent menu, document toolbar and non-overlapping assistant panels', { timeout: 180000 }, async t => {
  const url = requireTestDatabase();
  assert.equal(new URL(url).pathname, '/examcraft_test_20261022');
  assert.equal((await (await fetch(origin + '/api/health')).json()).isolatedTest, true);
  const db = new PrismaClient({ datasources: { db: { url } }, log: [] });
  assert.equal((await db.$queryRawUnsafe<{ current_database: string }[]>('SELECT current_database()'))[0].current_database, 'examcraft_test_20261022');
  const id = 'frame_' + randomUUID(), email = id + '@example.invalid', password = randomUUID();
  const browser = await chromium.launch({ executablePath: process.env.PILOT_BROWSER_PATH, headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } }), page = await context.newPage();
  const assistant = () => page.getByRole('complementary', { name: 'Hỏi đáp với Trợ lý AI', exact: true });
  const menu = () => page.getByRole('complementary', { name: 'Menu', exact: true });
  const edit = () => ({ click: () => openCopilot(page), waitFor: () => page.getByRole('toolbar', { name: 'Công cụ soạn đề', exact: true }).waitFor() });
  const fitting = async () => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
  fs.mkdirSync(report, { recursive: true });
  let examId = '';
  try {
    await db.user.create({ data: { id, email, name: 'Giáo viên thử thanh bên', role: 'TEACHER', passwordHash: await bcrypt.hash(password, 10), isActive: true, mustChangePassword: false } });
    const login = await context.request.post(origin + '/api/auth/login', { headers: { Origin: origin }, data: { email, password } }); assert.ok(login.ok());
    const keyAdded = await context.request.post(origin + '/api/user/keys', { headers: { Origin: origin }, data: { apiKey: 'frame-fake-gemini-key-01234567890123456789', label: 'Local fixture' } }); assert.ok(keyAdded.ok());
    const now = new Date().toISOString();
    const created = await context.request.post(origin + '/api/exams', { headers: { Origin: origin }, data: { document: { id: randomUUID(), metadata: { title: 'Đề kiểm thanh bên', schoolName: '', departmentName: '', subject: 'toan', grade: 6 }, questions: [], createdAt: now, updatedAt: now } } });
    assert.ok(created.ok()); examId = (await created.json()).exam.id;
    const baseline = await db.exam.findUniqueOrThrow({ where: { id: examId } });

    await t.test('page menu keeps its state across pages; the editor hides it and brings its own menus', async () => {
      await page.goto(origin + '/'); await page.getByRole('heading', { name: 'Thư mục và đề thi', exact: true }).waitFor();
      await page.getByRole('button', { name: 'Thu gọn menu', exact: true }).click();
      await page.waitForFunction(() => document.querySelector('.workspace-column')!.getBoundingClientRect().x < 65);
      await page.getByRole('navigation', { name: 'Không gian giáo viên' }).getByRole('link', { name: 'Ngân hàng câu hỏi', exact: true }).click();
      await page.getByRole('button', { name: 'Mở rộng menu', exact: true }).waitFor();
      await page.getByRole('button', { name: 'Mở rộng menu', exact: true }).click();
      await page.waitForFunction(() => document.querySelector('.workspace-column')!.getBoundingClientRect().x >= 250);
      await page.goto(origin + '/editor/' + examId); await edit().waitFor();
      assert.equal(await menu().count(), 0);
      assert.equal(await page.getByRole('complementary', { name: 'Tài khoản và trợ lý' }).count(), 0);
      await page.getByRole('button', { name: 'Menu ứng dụng', exact: true }).click();
      await page.getByRole('menuitem', { name: 'Về Kho đề', exact: true }).click();
      await page.getByRole('heading', { name: 'Thư mục và đề thi', exact: true }).waitFor();
      await page.goto(origin + '/editor/' + examId); await edit().waitFor();
    });
    await t.test('one key/notes entry in the account menu, chat docks, panels are exclusive and keep typed input', async () => {
      await openAccount(page);
      const account = page.getByRole('region', { name: 'Tài khoản', exact: true }); await account.waitFor();
      assert.equal(await account.getByRole('button', { name: 'Quản lý khóa AI', exact: true }).count(), 1);
      assert.equal(await account.getByRole('button', { name: 'Ghi chú riêng cho AI', exact: true }).count(), 1);
      await account.getByRole('button', { name: 'Đăng xuất', exact: true }).waitFor();
      await page.locator('div.fixed.inset-0.z-40').click({ position: { x: 400, y: 400 } });
      const before = await page.locator('.workspace-column').boundingBox();
      // The old chat drawer is gone from the editor: the AI button opens the one AI panel beside the sheet.
      assert.equal(await assistant().count(), 0);
      await edit().click(); await page.locator('#right-copilot-input').waitFor();
      const aiPanel = page.getByRole('complementary', { name: 'Bảng bên phải', exact: true }), dock = await aiPanel.boundingBox();
      assert.ok(before && dock && dock.width >= 300 && dock.x + dock.width <= before.x + before.width + 1);
      assert.equal(await page.getByRole('region', { name: 'Bảng AI', exact: true }).getByText('Đang nói về:').count(), 1);
      assert.equal(await assistant().count(), 0);
      await page.locator('#right-copilot-input').fill('Nháp lệnh sửa đề vẫn được giữ');
      await page.getByRole('button', { name: 'Đóng AI', exact: true }).click(); await aiPanel.waitFor({ state: 'hidden' });
      await edit().click(); await page.locator('#right-copilot-input').waitFor();
      assert.equal(await page.locator('#right-copilot-input').inputValue(), 'Nháp lệnh sửa đề vẫn được giữ');
      await page.screenshot({ path: report + '/editor-chat-1440.png' });
      await fitting(); await page.screenshot({ path: report + '/editor-copilot-1440.png' });
      await page.getByRole('button', { name: 'Đóng AI', exact: true }).click();
    });
    await t.test('phone panels close by keyboard, fit themes and preserve the exam', async () => {
      for (const [width, height] of [[1024, 800], [375, 812], [320, 740], [568, 320]]) {
        await page.setViewportSize({ width, height });
        for (const dark of [false, true]) {
          if (await page.evaluate(() => document.documentElement.classList.contains('dark')) !== dark) await toggleTheme(page);
          await openAccount(page);
          const account = page.getByRole('region', { name: 'Tài khoản', exact: true }); await account.waitFor();
          const accountBox = await account.boundingBox(); assert.ok(accountBox && accountBox.x >= 0 && accountBox.x + accountBox.width <= width);
          await page.keyboard.press('Escape'); await account.waitFor({ state: 'hidden' });
          await openCopilot(page);
          const copilot = page.getByRole(width >= 1024 ? 'complementary' : 'dialog', { name: 'Trợ lý và công cụ nhanh', exact: true }); await copilot.waitFor();
          await fitting(); await page.screenshot({ path: `${report}/copilot-${width}-${dark ? 'dark' : 'light'}.png` });
          await copilot.getByRole('button', { name: 'Đóng trợ lý sửa đề', exact: true }).press('Escape');
          await copilot.waitFor({ state: 'hidden' });
        }
      }
      const after = await db.exam.findUniqueOrThrow({ where: { id: examId } });
      assert.equal(after.version, baseline.version); assert.deepEqual(after.metadata, baseline.metadata);
    });
  } finally {
    await browser.close();
    await db.exam.deleteMany({ where: { ownerId: id } }); await db.question.deleteMany({ where: { ownerId: id } });
    await db.auditLog.deleteMany({ where: { OR: [{ actorId: id }, { targetType: 'LoginBucket', targetId: loginBucket(email) }] } });
    await db.userApiKey.deleteMany({ where: { userId: id } });
    await db.user.deleteMany({ where: { id } }); assert.equal(await db.user.count({ where: { id } }), 0);
    fs.writeFileSync(report + '/cleanup.json', JSON.stringify({ removedFixtureUser: true, unchangedExamBeforeCleanup: true, buildId: fs.readFileSync('.next/BUILD_ID', 'utf8').trim() }, null, 2));
    await db.$disconnect();
  }
});
