import { openAccount } from './editor-ui';
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { chromium, type Page } from 'playwright-core';
import { requireTestDatabase } from '../tests/helpers/test-database';
import { loginBucket } from '../src/lib/auth-security';

const origin = process.env.EXAMCRAFT_TEST_ORIGIN ?? 'http://127.0.0.1:3117';
const report = process.env.ADMIN_REPORT_DIR ?? 'qa/rebuild-2026-10-27/admin-refresh';

test('admin: current data, access, confirmations and phone navigation', { timeout: 240000 }, async t => {
  const url = requireTestDatabase();
  assert.equal(new URL(url).pathname, '/examcraft_test_20261022');
  assert.equal((await (await fetch(origin + '/api/health')).json()).isolatedTest, true);
  const db = new PrismaClient({ datasources: { db: { url } }, log: [] });
  assert.equal((await db.$queryRawUnsafe<{ current_database: string }[]>('SELECT current_database()'))[0].current_database, 'examcraft_test_20261022');
  const run = randomUUID(), ids = [0, 1, 2].map(i => `admin_ui_${run}_${i}`), emails = ids.map(id => id + '@example.invalid');
  fs.mkdirSync(report, { recursive: true });
  const password = 'Fixture-only-' + randomUUID(), hash = await bcrypt.hash(password, 10);
  const browser = await chromium.launch({ executablePath: process.env.PILOT_BROWSER_PATH, headless: true });
  const adminContext = await browser.newContext(), teacherContext = await browser.newContext();
  const page = await adminContext.newPage(), teacherPage = await teacherContext.newPage();
  let cookie = '';
  const api = async (path: string, method = 'GET', body?: unknown) => {
    const res = await fetch(origin + path, { method, headers: { Cookie: cookie, Origin: origin, 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    assert.equal(res.ok, true, `${method} ${path} ${res.status}`); return res.json();
  };
  const login = async (p: Page, email: string) => {
    const ready = p.waitForResponse(r => r.url().endsWith('/api/auth/me'));
    await p.goto(origin + '/login'); await ready;
    await p.getByPlaceholder('name@school.edu.vn').fill(email); await p.getByPlaceholder('••••••••').fill(password);
    await p.getByRole('button', { name: 'Đăng nhập hệ thống', exact: true }).click();
    await p.waitForURL(email === emails[0] ? origin + '/admin/users' : origin + '/');
  };
  try {
    for (const [i, id] of ids.entries()) await db.user.create({ data: { id, email: emails[i], name: `Kiểm admin ${i}`, role: i === 0 ? 'SUPER_ADMIN' : 'TEACHER', passwordHash: hash, isActive: true, mustChangePassword: false, aiDailyLimit: 0 } });
    const auth = await fetch(origin + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: emails[0], password }) });
    assert.equal(auth.status, 200); cookie = auth.headers.getSetCookie().map(x => x.split(';')[0]).join('; ');
    await t.test('only admins read the overview and the server layout blocks teachers', async () => {
      assert.equal((await fetch(origin + '/api/admin/ai')).status, 401);
      await login(teacherPage, emails[1]);
      assert.equal((await teacherContext.request.get(origin + '/api/admin/ai')).status(), 403);
      await teacherPage.goto(origin + '/admin/users'); await teacherPage.waitForURL(origin + '/');
      assert.equal(await teacherPage.getByRole('navigation', { name: 'Quản trị', exact: true }).count(), 0);
    });
    const baseline = await api('/api/admin/ai');
    await db.aiUsageLog.createMany({ data: [200, 429, 102].map(httpStatus => ({ userId: ids[1], endpoint: 'teacher.assistant.chat', httpStatus })) });
    await api('/api/admin/keys', 'POST', { label: 'Khóa thử không gọi provider', apiKey: 'fixture-not-a-provider-key-' + run, userIds: [ids[1], ids[2]] });
    await t.test('overview counts account keys and separates unfinished requests', async () => {
      const actual = await api('/api/admin/ai');
      assert.equal(actual.stats.totalToday, baseline.stats.totalToday + 3);
      assert.equal(actual.stats.successToday, baseline.stats.successToday + 1);
      assert.equal(actual.stats.errorToday, baseline.stats.errorToday + 1);
      assert.equal(actual.stats.pendingToday, baseline.stats.pendingToday + 1);
      assert.equal(actual.keySummary.total, baseline.keySummary.total + 2);
      assert.equal(actual.keySummary.granted, baseline.keySummary.granted + 2);
      assert.equal(JSON.stringify(actual).includes('fixture-not-a-provider-key-'), false);
    });
    await t.test('classwork is labelled correctly and only submitted attempts are counted', async () => {
      const exam = (await api('/api/exams', 'POST', { document: { id: randomUUID(), version: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), metadata: { title: 'Đề thử admin', subject: 'toan', grade: 6, durationMinutes: 15 }, questions: [{ id: 'q1', type: 'short_answer', difficulty: 'thong_hieu', content: 'Một cộng một bằng bao nhiêu?', correct_answer: '2', accepted_answers: ['2'], points: 1 }] } })).exam;
      const group = (await api('/api/groups', 'POST', { name: 'Lớp kiểm nhãn ' + run, studentNames: ['Em đã nộp', 'Em đang làm'] })).group;
      const assignment = (await api('/api/assignments', 'POST', { examId: exam.id, groupId: group.id, title: 'Bài làm trên lớp', mode: 'CLASSWORK', identityMode: 'FREE_NAME', durationMinutes: 15 })).assignment;
      const students = await db.student.findMany({ where: { groupId: group.id } });
      for (const [i, student] of students.entries()) await db.attempt.create({ data: { assignmentId: assignment.id, studentId: student.id, attemptNo: 1, variantSeed: i + 1, layout: {}, status: i === 0 ? 'SUBMITTED' : 'IN_PROGRESS', ...(i === 0 ? { submittedAt: new Date() } : {}) } });
      const listed = (await api('/api/assignments')).assignments.find((item: { id: string }) => item.id === assignment.id);
      assert.equal(listed._count.attempts, 1);
      await page.goto(origin + '/c/' + group.publicCode); await page.getByText('Làm trên lớp', { exact: true }).waitFor();
      assert.equal(await page.getByText('Bài về nhà', { exact: true }).count(), 0);
    });
    await login(page, emails[0]);
    await t.test('phone account cards filter roles and cancel or confirm the right account', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.getByPlaceholder('Tìm theo tên hoặc email...').fill(emails[1]);
      const row = page.locator('tr').filter({ has: page.getByText(emails[1], { exact: true }) });
      await row.waitFor();
      await page.getByLabel('Lọc vai trò').selectOption('SUPER_ADMIN'); await page.getByText('Không tìm thấy tài khoản phù hợp.').waitFor();
      await page.getByLabel('Lọc vai trò').selectOption('ALL');
      const actionSize = await row.getByTitle('Khóa tài khoản', { exact: true }).boundingBox();
      assert.ok(actionSize && actionSize.width >= 40 && actionSize.height >= 40);
      await row.getByTitle('Khóa tài khoản', { exact: true }).click();
      const dialogBounds = await page.getByRole('dialog').boundingBox();
      assert.ok(dialogBounds && dialogBounds.x >= 0 && dialogBounds.x + dialogBounds.width <= 376 && dialogBounds.y >= 0 && dialogBounds.y + dialogBounds.height <= 668);
      await page.screenshot({ path: `${report}/confirmation-375.png`, fullPage: false });
      await page.getByRole('dialog', { name: 'Xác nhận thao tác' }).getByRole('button', { name: 'Hủy', exact: true }).click();
      assert.equal((await db.user.findUniqueOrThrow({ where: { id: ids[1] } })).isActive, true);
      await row.getByTitle('Khóa tài khoản', { exact: true }).click();
      await page.getByRole('dialog').getByRole('button', { name: 'Xác nhận', exact: true }).click();
      await row.getByText('Đã khóa', { exact: true }).waitFor();
      assert.equal((await db.user.findUniqueOrThrow({ where: { id: ids[1] } })).isActive, false);
      await row.getByTitle('Mở khóa tài khoản', { exact: true }).click(); await page.getByRole('dialog').getByRole('button', { name: 'Xác nhận', exact: true }).click();
      await row.getByText('Đang hoạt động', { exact: true }).waitFor();
      const statusColor = await row.getByText('Đang hoạt động', { exact: true }).evaluate(element => getComputedStyle(element).color);
      const [red, green, blue] = statusColor.match(/\d+/g)!.map(Number);
      assert.ok(green > red && green > blue, 'the active status is green in the rendered UI');
      assert.equal(await page.getByRole('columnheader', { name: /Hạn mức|Giới hạn.*ngày/i }).count(), 0);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
      await page.screenshot({ path: `${report}/accounts-375.png`, fullPage: true });
    });
    await t.test('shared admin navigation has real labels and load errors preserve the last snapshot', async () => {
      for (const [path, title] of [['/admin/keys', 'Cấp khóa AI'], ['/admin/ai', 'Hoạt động AI']]) {
        await page.goto(origin + path); await page.getByRole('heading', { name: title, exact: true }).waitFor();
        assert.equal(await page.getByRole('navigation', { name: 'Quản trị' }).getByRole('link', { name: title, exact: true }).getAttribute('aria-current'), 'page');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
      }
      await page.getByRole('heading', { name: 'Hoạt động gần đây', exact: true }).waitFor();
      assert.equal(await page.getByText('7 Gemini Keys', { exact: true }).count(), 0);
      assert.equal(await page.getByRole('button', { name: /Kích hoạt lại/ }).count(), 0);
      await page.route('**/api/admin/ai', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Lỗi thử có kiểm soát' }) }));
      await page.getByRole('button', { name: 'Làm mới', exact: true }).click(); await page.getByRole('alert').filter({ hasText: 'Lỗi thử có kiểm soát' }).waitFor();
      await page.getByRole('heading', { name: 'Hoạt động gần đây', exact: true }).waitFor();
      await page.unroute('**/api/admin/ai'); await page.getByRole('button', { name: 'Làm mới', exact: true }).click(); await page.getByRole('alert').filter({ hasText: 'Lỗi thử có kiểm soát' }).waitFor({ state: 'detached' });
      await page.screenshot({ path: `${report}/activity-375.png`, fullPage: true });
    });
    await t.test('revoking one grant recipient leaves the other recipient untouched', async () => {
      await page.goto(origin + '/admin/keys');
      const recipient = page.getByRole('button', { name: 'Thu hồi khóa của Kiểm admin 1', exact: true });
      await recipient.waitFor(); await recipient.click();
      await page.getByRole('dialog').getByRole('button', { name: 'Hủy', exact: true }).click();
      assert.equal(await db.userApiKey.count({ where: { userId: ids[1] } }), 1);
      await recipient.click(); await page.getByRole('dialog').getByRole('button', { name: 'Xác nhận', exact: true }).click();
      await recipient.waitFor({ state: 'detached' });
      assert.equal(await db.userApiKey.count({ where: { userId: ids[1] } }), 0);
      assert.equal(await db.userApiKey.count({ where: { userId: ids[2] } }), 1);
    });
    await t.test('key dialog and editor menu show usage without a daily cap or fabricated remaining quota', async () => {
      await page.goto(origin + '/'); await page.getByTitle('Quản lý Google Gemini API Key', { exact: true }).filter({ visible: true }).click();
      const keys = page.getByRole('dialog', { name: 'Khóa AI của bạn', exact: true });
      await keys.getByText(/ExamCraft không đặt giới hạn AI theo ngày/).waitFor(); await keys.getByText(/Thành công hôm nay/).waitFor();
      assert.equal(await keys.getByText(/Giới hạn trong ứng dụng hôm nay/).count(), 0);
      await page.screenshot({ path: `${report}/key-usage-375.png`, fullPage: false });
      await keys.getByRole('button', { name: 'Đóng', exact: true }).click();
      const exam = await db.exam.findFirstOrThrow({ where: { ownerId: ids[0] } });
      await page.goto(origin + '/editor/' + exam.id);
      await openAccount(page);
      const menu = page.getByRole('region', { name: 'Tài khoản', exact: true });
      await menu.getByText('Đăng xuất').waitFor();
      assert.equal(/Còn lại:\s*\d|\/\s*100\s*lượt/.test(await menu.innerText()), false);
      await page.screenshot({ path: `${report}/editor-usage-375.png`, fullPage: false });
    });
    await t.test('one secretary drawer replaces the old promotional popup', async () => {
      await page.goto(origin + '/'); await page.getByTitle('Hỏi AI · Hỏi đáp, không sửa đề').filter({ visible: true }).click();
      await page.getByRole('heading', { name: 'Hỏi AI', exact: true }).waitFor();
      assert.equal(await page.getByText('BETA / ĐANG HUẤN LUYỆN', { exact: true }).count(), 0);
      await page.screenshot({ path: `${report}/secretary-375.png`, fullPage: false });
    });
    await t.test('pagination applies after filtering and resets when the search or page size changes', async () => {
      const template = (await api('/api/admin/users')).users.find((u: { id: string }) => u.id === ids[1]);
      const users = Array.from({ length: 23 }, (_, index) => ({ ...template, id: `pagination-${index}`, name: `Phân trang ${index + 1}`, email: `pagination-${index}@example.invalid` }));
      await page.route('**/api/admin/users', route => route.request().method() === 'GET' ? route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ users }) }) : route.continue());
      await page.goto(origin + '/admin/users'); await page.getByText('Phân trang 1', { exact: true }).waitFor();
      assert.equal(await page.locator('tbody tr').count(), 10);
      await page.getByRole('button', { name: 'Trang sau', exact: true }).click(); await page.getByText('Phân trang 11', { exact: true }).waitFor();
      assert.equal(await page.getByText('Phân trang 1', { exact: true }).count(), 0);
      await page.getByRole('button', { name: 'Trang sau', exact: true }).click(); await page.getByText('Phân trang 23', { exact: true }).waitFor();
      assert.equal(await page.locator('tbody tr').count(), 3);
      assert.equal(await page.getByRole('button', { name: 'Trang sau', exact: true }).isDisabled(), true);
      await page.getByLabel('Số tài khoản mỗi trang').selectOption('20'); await page.getByText('Phân trang 1', { exact: true }).waitFor();
      assert.equal(await page.locator('tbody tr').count(), 20);
      await page.getByPlaceholder('Tìm theo tên hoặc email...').fill('Phân trang 23'); await page.getByText('Phân trang 23', { exact: true }).waitFor();
      assert.equal(await page.locator('tbody tr').count(), 1);
      await page.getByLabel('Lọc vai trò').selectOption('SUPER_ADMIN'); await page.getByText('Không tìm thấy tài khoản phù hợp.').waitFor();
      assert.equal(await page.getByRole('button', { name: 'Trang trước', exact: true }).isDisabled(), true);
      await page.unroute('**/api/admin/users');
    });
    await t.test('admin pages fit small, landscape and desktop viewports in both themes', async () => {
      for (const [width, height] of [[320, 568], [568, 320], [1280, 720]]) for (const dark of [false, true]) for (const [path, title] of [['users', 'Tài khoản'], ['keys', 'Cấp khóa AI'], ['ai', 'Hoạt động AI']]) {
        await page.setViewportSize({ width, height }); await page.goto(origin + '/admin/' + path);
        await page.getByRole('heading', { name: title, exact: true }).waitFor();
        if ((await page.evaluate(() => document.documentElement.classList.contains('dark'))) !== dark) await page.getByRole('button', { name: /Chuyển sang giao diện/ }).click();
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, `${path} ${width} ${dark}`);
        await page.screenshot({ path: `${report}/${path}-${width}-${dark ? 'dark' : 'light'}.png`, fullPage: false });
      }
    });
  } finally {
    await browser.close();
    await db.assignment.deleteMany({ where: { ownerId: { in: ids } } });
    await db.group.deleteMany({ where: { ownerId: { in: ids } } });
    await db.exam.deleteMany({ where: { ownerId: { in: ids } } });
    await db.question.deleteMany({ where: { ownerId: { in: ids } } });
    await db.passage.deleteMany({ where: { ownerId: { in: ids } } });
    await db.userApiKey.deleteMany({ where: { userId: { in: ids } } });
    await db.aiUsageLog.deleteMany({ where: { userId: { in: ids } } });
    await db.auditLog.deleteMany({ where: { OR: [{ actorId: { in: ids } }, { targetType: 'LoginBucket', targetId: { in: emails.map(loginBucket) } }] } });
    await db.user.deleteMany({ where: { id: { in: ids } } });
    assert.equal(await db.user.count({ where: { id: { in: ids } } }), 0);
    fs.writeFileSync(`${report}/cleanup.json`, JSON.stringify({ removedTaskUsers: true, ids, buildId: fs.readFileSync('.next/BUILD_ID', 'utf8').trim() }, null, 2));
    await db.$disconnect();
  }
});
