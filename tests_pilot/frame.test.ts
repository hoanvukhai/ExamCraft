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
  const toggleChat = () => page.getByRole('button', { name: 'Hỏi đáp với Trợ lý AI', exact: true }).filter({ visible: true });
  const edit = () => page.getByRole('toolbar', { name: 'Công cụ soạn đề', exact: true }).getByRole('button', { name: 'Sửa đề bằng Trợ lý AI', exact: true });
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

    await t.test('left menu keeps its state across library/editor and pushes the content', async () => {
      await page.goto(origin + '/'); await page.getByRole('heading', { name: 'Thư mục và đề thi', exact: true }).waitFor();
      await page.goto(origin + '/editor/' + examId); await edit().waitFor();
      await page.getByRole('button', { name: 'Thu gọn menu', exact: true }).waitFor();
      const wide = await page.locator('.workspace-column').boundingBox(); assert.ok(wide && wide.x >= 250);
      await page.getByRole('button', { name: 'Thu gọn menu', exact: true }).click();
      await page.waitForFunction(() => document.querySelector('.workspace-column')!.getBoundingClientRect().x < 65);
      await page.getByRole('navigation', { name: 'Không gian giáo viên' }).getByRole('link', { name: 'Kho đề', exact: true }).click();
      await page.getByRole('button', { name: 'Mở rộng menu', exact: true }).waitFor();
      await page.goto(origin + '/editor/' + examId); await edit().waitFor();
      await page.getByRole('button', { name: 'Mở rộng menu', exact: true }).click();
      await page.waitForFunction(() => document.querySelector('.workspace-column')!.getBoundingClientRect().x >= 250);
      const box = await menu().boundingBox(), content = await page.locator('.workspace-column').boundingBox();
      assert.ok(box && content && box.x + box.width <= content.x + 1);
      assert.equal(await page.getByRole('complementary', { name: 'Tài khoản và trợ lý' }).getByRole('button', { name: 'Sửa đề bằng Trợ lý AI' }).count(), 0);
    });
    await t.test('one key/notes entry, chat docks, panels are exclusive and keep typed input', async () => {
      await page.getByRole('button', { name: 'Mở menu tài khoản', exact: true }).filter({ visible: true }).click();
      const account = page.getByRole('region', { name: 'Tài khoản', exact: true }); await account.waitFor();
      assert.equal(await account.getByRole('button', { name: /Khóa|Ghi chú/ }).count(), 0);
      await account.getByRole('button', { name: 'Đăng xuất', exact: true }).waitFor();
      await page.locator('div.fixed.inset-0.z-40').click({ position: { x: 400, y: 400 } });
      const before = await page.locator('.workspace-column').boundingBox();
      await toggleChat().click(); await assistant().waitFor();
      const center = await page.locator('.workspace-column').boundingBox(), dock = await assistant().boundingBox();
      assert.ok(before && center && dock && before.width - center.width >= 380 && center.x + center.width <= dock.x + 1);
      assert.equal(await assistant().getByRole('button', { name: /Xem hồ sơ|^Xem$|Ghi chú|Khóa/ }).count(), 0);
      assert.equal(await assistant().getByText('Đang áp dụng Hồ sơ phong cách riêng của Thầy/Cô', { exact: true }).count(), 0);
      await assistant().getByPlaceholder(/^Hỏi Thư ký AI/).fill('Nháp hỏi đáp vẫn được giữ');
      await edit().click(); await page.locator('#right-copilot-input').waitFor(); assert.equal(await assistant().count(), 0);
      await page.locator('#right-copilot-input').fill('Nháp lệnh sửa đề vẫn được giữ');
      await toggleChat().click(); await assistant().waitFor(); assert.equal(await page.locator('#right-copilot-input').isVisible(), false);
      assert.equal(await assistant().getByPlaceholder(/^Hỏi Thư ký AI/).inputValue(), 'Nháp hỏi đáp vẫn được giữ');
      await page.screenshot({ path: report + '/editor-chat-1440.png' });
      await edit().click(); await page.locator('#right-copilot-input').waitFor();
      assert.equal(await page.locator('#right-copilot-input').inputValue(), 'Nháp lệnh sửa đề vẫn được giữ');
      await fitting(); await page.screenshot({ path: report + '/editor-copilot-1440.png' });
      await page.getByRole('button', { name: 'Đóng trợ lý sửa đề', exact: true }).click();
    });
    await t.test('phone panels close by keyboard, fit themes and preserve the exam', async () => {
      for (const [width, height] of [[1024, 800], [375, 812], [320, 740], [568, 320]]) {
        await page.setViewportSize({ width, height });
        for (const dark of [false, true]) {
          if (await page.evaluate(() => document.documentElement.classList.contains('dark')) !== dark) await page.getByRole('button', { name: /Chuyển sang giao diện/ }).filter({ visible: true }).click();
          const avatar = page.getByRole('button', { name: 'Mở menu tài khoản', exact: true }).filter({ visible: true });
          await avatar.click();
          const account = page.getByRole('region', { name: 'Tài khoản', exact: true }); await account.waitFor();
          const accountBox = await account.boundingBox(); assert.ok(accountBox && accountBox.x >= 0 && accountBox.x + accountBox.width <= width);
          await avatar.press('Escape'); await account.waitFor({ state: 'hidden' });
          await toggleChat().click();
          const panel = page.getByRole(width >= 1024 ? 'complementary' : 'dialog', { name: 'Hỏi đáp với Trợ lý AI', exact: true }); await panel.waitFor();
          if (width < 1024) {
            assert.equal(await panel.getAttribute('aria-modal'), 'true');
            await panel.getByRole('button', { name: 'Đóng hỏi đáp AI', exact: true }).press('Shift+Tab');
            assert.equal(await panel.evaluate(el => el.contains(document.activeElement)), true);
          }
          await fitting(); await page.screenshot({ path: `${report}/chat-${width}-${dark ? 'dark' : 'light'}.png` });
          await panel.getByRole('button', { name: 'Đóng hỏi đáp AI', exact: true }).press('Escape');
          await panel.waitFor({ state: 'hidden' });
          await edit().scrollIntoViewIfNeeded(); await edit().click();
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
