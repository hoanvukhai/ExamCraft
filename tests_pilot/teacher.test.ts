import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { chromium, type Locator } from 'playwright-core';
import { requireTestDatabase } from '../tests/helpers/test-database';
import { loginBucket } from '../src/lib/auth-security';

const origin = process.env.EXAMCRAFT_TEST_ORIGIN ?? 'http://127.0.0.1:3117', report = process.env.TEACHER_REPORT_DIR || 'qa/rebuild-2026-10-27/teacher-ui-fix';
test('teacher management: trash, bank, class context, routes and mobile', { timeout: 240000 }, async t => {
  const url = requireTestDatabase();
  assert.equal(new URL(url).pathname, '/examcraft_test_20261022');
  assert.equal((await (await fetch(origin + '/api/health')).json()).isolatedTest, true);
  const db = new PrismaClient({ datasources: { db: { url } }, log: [] });
  assert.equal((await db.$queryRawUnsafe<{ current_database: string }[]>('SELECT current_database()'))[0].current_database, 'examcraft_test_20261022');
  const run = randomUUID(), ids = [0, 1].map(i => `teacher_ui_${run}_${i}`), emails = ids.map(id => id + '@example.invalid'), password = randomUUID();
  const browser = await chromium.launch({ executablePath: process.env.PILOT_BROWSER_PATH, headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } }), page = await context.newPage();
  const nav = () => page.getByRole('navigation', { name: 'Không gian giáo viên' });
  const api = async (path: string, method = 'GET', data?: unknown) => {
    const response = await context.request.fetch(origin + path, { method, headers: { Origin: origin }, ...(data === undefined ? {} : { data }) });
    assert.ok(response.ok(), `${method} ${path}: ${response.status()} ${await response.text()}`); return response.json();
  };
  const card = (title: string) => page.locator('div.group').filter({ has: page.getByRole('heading', { name: title, exact: true }) }).first();
  const confirm = async (accept: boolean) => { await page.getByRole('dialog', { name: 'Xác nhận thao tác' }).getByRole('button', { name: accept ? 'Xác nhận' : 'Hủy', exact: true }).click(); };
  const waitAbsent = async (target: Locator) => target.waitFor({ state: 'detached' });
  const examIds: string[] = [];
  fs.mkdirSync(report, { recursive: true });
  try {
    for (let i = 0; i < ids.length; i++) await db.user.create({ data: { id: ids[i], email: emails[i], name: `Giáo viên giao diện ${i}`, role: 'TEACHER', passwordHash: await bcrypt.hash(password, 10), isActive: true, mustChangePassword: false } });
    await api('/api/auth/login', 'POST', { email: emails[0], password });
    for (let i = 0; i < 2; i++) {
      const now = new Date().toISOString();
      const created = await api('/api/exams', 'POST', { document: { id: randomUUID(), version: 1, createdAt: now, updatedAt: now, metadata: { title: `Đề giao diện ${i}`, subject: 'toan', grade: 6, durationMinutes: 15 }, questions: [{ id: 'q1', type: 'short_answer', difficulty: 'thong_hieu', content: 'Một cộng một?', correct_answer: '2', accepted_answers: ['2'], points: 1 }] } });
      examIds.push(created.exam.id);
    }
    const before = await db.exam.findUniqueOrThrow({ where: { id: examIds[0] } });
    await page.goto(origin + '/');
    await t.test('cancel, soft-delete, clear restore action, failure and retry without data loss', async () => {
      await card('Đề giao diện 0').getByTitle('Chuyển vào thùng rác', { exact: true }).click(); await confirm(false);
      assert.deepEqual(await db.exam.findUniqueOrThrow({ where: { id: examIds[0] } }), before);
      await card('Đề giao diện 0').getByTitle('Chuyển vào thùng rác', { exact: true }).click(); await confirm(true); await page.getByText('Đã chuyển đề vào thùng rác.', { exact: true }).first().waitFor();
      await waitAbsent(card('Đề giao diện 0')); assert.ok((await db.exam.findUniqueOrThrow({ where: { id: examIds[0] } })).deletedAt);
      await nav().getByRole('link', { name: 'Thùng rác', exact: true }).click();
      await page.getByRole('heading', { name: 'Thùng rác', exact: true }).waitFor();
      await page.getByRole('button', { name: 'Khôi phục', exact: true }).waitFor();
      assert.equal(await page.locator('main').getByText('Soạn đề trống mới', { exact: true }).count(), 0);
      assert.equal(await page.locator('main').getByTitle('Nhân bản đề này', { exact: true }).count(), 0);
      const trashUrl = page.url(); await card('Đề giao diện 0').getByRole('heading').click(); assert.equal(page.url(), trashUrl);
      await page.setViewportSize({ width: 375, height: 812 });
      await page.getByTitle('Chế độ xem danh sách', { exact: true }).click();
      await page.locator('.app-exam-table').waitFor();
      await page.locator('main').screenshot({ path: `${report}/trash-with-record-375.png` });
      let restores = 0;
      await page.route('**/api/exams/' + examIds[0], route => { if (route.request().method() === 'PATCH') { restores++; return route.abort(); } return route.continue(); });
      await page.getByRole('button', { name: 'Khôi phục', exact: true }).evaluate(button => { (button as HTMLButtonElement).click(); (button as HTMLButtonElement).click(); });
      await page.getByRole('alert').filter({ hasText: /thử lại|fetch/i }).waitFor();
      assert.equal(restores, 1, 'double click must not issue two restores');
      assert.ok((await db.exam.findUniqueOrThrow({ where: { id: examIds[0] } })).deletedAt);
      await page.unroute('**/api/exams/' + examIds[0]);
      await page.getByRole('button', { name: 'Khôi phục', exact: true }).click(); await page.getByText('Thùng rác trống', { exact: true }).waitFor();
      const restored = await db.exam.findUniqueOrThrow({ where: { id: examIds[0] } });
      assert.equal(restored.deletedAt, null); assert.deepEqual(restored.metadata, before.metadata); assert.equal(restored.version, before.version + 2);
      await page.reload(); await page.getByRole('heading', { name: 'Thùng rác', exact: true }).waitFor();
      await page.setViewportSize({ width: 1440, height: 1000 });
      const folder = (await api('/api/folders', 'POST', { name: 'Thư mục kiểm lỗi', color: '#3c4043' })).folder;
      await page.goto(origin + '/teacher/folders?folder=' + folder.id); await page.getByRole('heading', { name: 'Thư mục kiểm lỗi', exact: true }).waitFor();
      await page.getByRole('button', { name: 'Xóa thư mục', exact: true }).click(); await confirm(false);
      assert.ok(await db.folder.findUnique({ where: { id: folder.id } }));
      await page.route('**/api/folders/' + folder.id, route => route.fulfill({ status: 503, json: { error: 'Chưa xóa được thư mục kiểm lỗi' } }));
      await page.getByRole('button', { name: 'Xóa thư mục', exact: true }).click(); await confirm(true);
      await page.getByRole('alert').getByText('Chưa xóa được thư mục kiểm lỗi', { exact: true }).waitFor();
      assert.ok(await db.folder.findUnique({ where: { id: folder.id } }));
      await page.unroute('**/api/folders/' + folder.id);
    });
    await t.test('permanent delete: cancel keeps the exam, confirm removes it, an assigned exam is refused with a reason', async () => {
      // Uses two exams of its own so the shared fixtures of the later steps are untouched.
      const own = async (title: string) => { const now = new Date().toISOString(); return (await api('/api/exams', 'POST', { document: { id: randomUUID(), version: 1, createdAt: now, updatedAt: now, metadata: { title, subject: 'toan', grade: 6, durationMinutes: 15 }, questions: [{ id: 'q1', type: 'short_answer', difficulty: 'thong_hieu', content: 'Một cộng hai?', correct_answer: '3', accepted_answers: ['3'], points: 1 }] } })).exam.id as string; };
      const purgeId = await own('Xóa vĩnh viễn thử'), assignedId = await own('Đề đã giao không xóa hẳn');
      await page.goto(origin + '/');
      await card('Xóa vĩnh viễn thử').getByTitle('Chuyển vào thùng rác', { exact: true }).click(); await confirm(true); await page.getByText('Đã chuyển đề vào thùng rác.', { exact: true }).first().waitFor();
      await nav().getByRole('link', { name: 'Thùng rác', exact: true }).click();
      await page.getByRole('heading', { name: 'Thùng rác', exact: true }).waitFor();
      await card('Xóa vĩnh viễn thử').getByRole('button', { name: 'Xóa vĩnh viễn', exact: true }).click(); await confirm(false);
      assert.ok(await db.exam.findUnique({ where: { id: purgeId } }), 'cancel keeps the exam');
      await card('Xóa vĩnh viễn thử').getByRole('button', { name: 'Xóa vĩnh viễn', exact: true }).click(); await confirm(true);
      await waitAbsent(card('Xóa vĩnh viễn thử'));
      assert.equal(await db.exam.findUnique({ where: { id: purgeId } }), null, 'the exam is gone for good');
      await api('/api/assignments', 'POST', { examId: assignedId, title: 'Bài giao kiểm', identityMode: 'FREE_NAME' });
      await nav().getByRole('link', { name: 'Kho đề', exact: true }).filter({ visible: true }).click();
      await card('Đề đã giao không xóa hẳn').getByTitle('Chuyển vào thùng rác', { exact: true }).click(); await confirm(true); await page.getByText('Đã chuyển đề vào thùng rác.', { exact: true }).first().waitFor();
      await nav().getByRole('link', { name: 'Thùng rác', exact: true }).click();
      await card('Đề đã giao không xóa hẳn').getByRole('button', { name: 'Xóa vĩnh viễn', exact: true }).click(); await confirm(true);
      await page.getByRole('alert').getByText(/đã được giao/).waitFor();
      const kept = await db.exam.findUniqueOrThrow({ where: { id: assignedId } });
      assert.ok(kept.deletedAt, 'the assigned exam stays in the trash'); assert.equal(await db.assignment.count({ where: { examId: assignedId } }), 1);
      await db.assignment.deleteMany({ where: { examId: assignedId } });
      await page.reload(); await card('Đề đã giao không xóa hẳn').getByRole('button', { name: 'Xóa vĩnh viễn', exact: true }).click(); await confirm(true);
      await page.getByText('Thùng rác trống', { exact: true }).waitFor();
      assert.equal(await db.exam.findUnique({ where: { id: assignedId } }), null, 'once the assignment is gone the exam can be deleted for good');
      await page.goto(origin + '/');
    });
    const prefix = 'BANK_' + run;
    for (let i = 0; i < 23; i++) await db.question.create({ data: { ownerId: ids[1], authorId: ids[1], subject: 'toan', grade: 6, visibility: 'SHARED', points: 1, type: 'MULTIPLE_CHOICE', difficulty: 'THONG_HIEU', content: `${prefix}_${String(i).padStart(2, '0')} Tính $x^2$.`, solution: 'Lời giải được giữ', topics: [], tags: [], payload: { choices: [{ key: 'A', text: 'Phương án một' }, { key: 'B', text: 'Phương án hai' }], correct: 'A' } } });
    const own = await db.question.create({ data: { ownerId: ids[0], authorId: ids[0], subject: 'toan', grade: 6, type: 'MATCHING', difficulty: 'THONG_HIEU', content: 'Câu riêng ghép đôi', solution: 'Lời giải riêng', topics: [], tags: [], payload: { matchingPairs: [{ id: 'a', left: 'Một', right: '1' }] } } });
    const bankCount = async (expected: number) => { const deadline = Date.now() + 10000; let last = -1; while (Date.now() < deadline) { last = await page.locator('[data-bank-question]').count(); if (last === expected) return; await new Promise(resolve => setTimeout(resolve, 100)); } assert.equal(last, expected); };
    await t.test('bank page uses real pagination, normalizes shared payload and distinguishes errors', async () => {
      await nav().getByRole('link', { name: 'Ngân hàng câu hỏi', exact: true }).click();
      await page.getByRole('heading', { name: 'Ngân hàng câu hỏi', exact: true }).waitFor();
      assert.equal(await page.getByRole('button', { name: 'Thêm vào đề', exact: true }).count(), 0);
      await page.getByRole('button', { name: 'Dùng chung nội bộ', exact: true }).click();
      await page.getByLabel('Tìm nội dung', { exact: true }).fill(prefix);
      await page.getByText('23 câu phù hợp · Trang 1 / 2', { exact: true }).waitFor();
      await bankCount(20);
      await page.getByRole('navigation', { name: 'Trang ngân hàng' }).getByRole('button', { name: 'Trang sau', exact: true }).click();
      await page.getByText('23 câu phù hợp · Trang 2 / 2', { exact: true }).waitFor(); await bankCount(3);
      await page.reload(); await page.getByText('23 câu phù hợp · Trang 2 / 2', { exact: true }).waitFor();
      await page.getByLabel('Dạng câu', { exact: true }).selectOption('multiple_choice');
      await page.getByText('23 câu phù hợp · Trang 1 / 2', { exact: true }).waitFor();
      const question = page.locator('[data-bank-question]').first();
      await question.getByText('Phương án một', { exact: true }).waitFor(); await question.getByText('Trắc nghiệm', { exact: false }).waitFor();
      await question.locator('summary', { hasText: 'Đáp án và hướng dẫn' }).click(); await question.getByText('Lời giải được giữ', { exact: true }).waitFor();
      const sourceId = (await question.getAttribute('data-bank-question'))!;
      assert.equal(await question.getByRole('button', { name: 'Xóa khỏi ngân hàng', exact: true }).count(), 0);
      const forbidden = await context.request.delete(origin + '/api/questions/' + sourceId, { headers: { Origin: origin } });
      assert.ok([403, 404].includes(forbidden.status()));
      assert.equal((await db.question.findUniqueOrThrow({ where: { id: sourceId } })).deletedAt, null);
      await page.setViewportSize({ width: 375, height: 812 });
      await question.screenshot({ path: `${report}/shared-question-375.png` });
      await page.setViewportSize({ width: 1440, height: 1000 });
      assert.equal(await page.getByLabel('Dạng câu', { exact: true }).locator('option').count(), 8);
      await page.route('**/api/questions/shared?**', route => route.fulfill({ status: 503, json: { error: 'Mất kết nối kiểm có chủ đích' } }));
      await page.getByLabel('Tìm nội dung', { exact: true }).fill(prefix + '_00');
      await page.getByRole('alert').getByText('Mất kết nối kiểm có chủ đích').waitFor();
      assert.equal(await page.getByText('Không có câu hỏi phù hợp bộ lọc.', { exact: true }).count(), 0);
      await page.unroute('**/api/questions/shared?**'); await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
      await page.getByText('1 câu phù hợp · Trang 1 / 1', { exact: true }).waitFor();
      await page.getByRole('button', { name: 'Cá nhân', exact: true }).click(); await page.getByLabel('Tìm nội dung', { exact: true }).fill(''); await page.getByLabel('Dạng câu', { exact: true }).selectOption('all');
      await page.locator(`[data-bank-question="${own.id}"]`).waitFor();
      await page.getByRole('button', { name: 'Xóa khỏi ngân hàng', exact: true }).click(); await confirm(false);
      assert.equal((await db.question.findUniqueOrThrow({ where: { id: own.id } })).deletedAt, null);
      await api('/api/auth/login', 'POST', { email: emails[1], password });
      await page.getByRole('button', { name: 'Xóa khỏi ngân hàng', exact: true }).click(); await confirm(true);
      await page.getByRole('alert').getByText(/Tài khoản đăng nhập đã thay đổi/).waitFor();
      assert.equal((await db.question.findUniqueOrThrow({ where: { id: own.id } })).deletedAt, null, 'a stale tab cannot delete after account change');
      await api('/api/auth/login', 'POST', { email: emails[0], password }); await page.reload();
      await page.locator(`[data-bank-question="${own.id}"]`).waitFor();
      await page.getByRole('button', { name: 'Xóa khỏi ngân hàng', exact: true }).click(); await confirm(true);
      await page.getByRole('status').getByText('Đã xóa câu khỏi ngân hàng.', { exact: true }).waitFor();
      assert.ok((await db.question.findUniqueOrThrow({ where: { id: own.id } })).deletedAt);
    });
    await t.test('editor picker inserts complete shared question and saves/reopens it', async () => {
      await page.goto(origin + '/editor/' + examIds[1]); await page.getByTitle('Lưu các thay đổi lên máy chủ').first().waitFor();
      await page.getByTitle('Chọn câu hỏi từ Ngân hàng chèn vào đề', { exact: true }).click();
      const picker = page.getByRole('dialog', { name: 'Chọn câu từ ngân hàng', exact: true });
      await picker.getByRole('button', { name: 'Dùng chung nội bộ', exact: true }).click(); await picker.getByLabel('Tìm nội dung', { exact: true }).fill(prefix + '_00');
      await picker.getByText('1 câu phù hợp · Trang 1 / 1', { exact: true }).waitFor();
      await picker.getByRole('button', { name: 'Thêm vào đề', exact: true }).click(); await picker.getByLabel('Đóng ngân hàng câu hỏi', { exact: true }).click();
      await page.getByTitle('Lưu các thay đổi lên máy chủ').first().click();
      await page.getByText('Đã lưu trên máy chủ', { exact: false }).first().waitFor();
      const data = await api('/api/exams/' + examIds[1]);
      const added = data.document.questions.find((q: { content: string }) => q.content.includes(prefix + '_00'));
      assert.ok(added); assert.equal(added.type, 'multiple_choice'); assert.equal(added.choices.length, 2); assert.equal(added.correct_answer, 'A'); assert.equal(added.step_by_step_solution, 'Lời giải được giữ');
      await page.reload(); await page.getByText('Phương án một', { exact: true }).first().waitFor();
    });
    const groups: { id: string }[] = [];
    for (let i = 0; i < 2; i++) groups.push((await api('/api/groups', 'POST', { name: `Lớp giao diện ${i}`, studentNames: [`Học sinh lớp ${i}`] })).group);
    for (let i = 0; i < 2; i++) await api('/api/assignments', 'POST', { title: `Đề giao diện ${i}`, examId: examIds[i], groupId: groups[i].id, mode: 'HOMEWORK', identityMode: 'FREE_NAME', durationMinutes: 15 });
    await t.test('class detail cannot reuse stale students; exam-scoped assignments and load errors', async () => {
      await page.goto(origin + '/teacher/groups');
      const groupCard = (i: number) => page.locator('article').filter({ has: page.getByRole('heading', { name: `Lớp giao diện ${i}`, exact: true }) }).filter({ has: page.getByRole('button', { name: 'Xem Danh Sách', exact: true }) }).last();
      await groupCard(0).getByRole('button', { name: 'Xem Danh Sách', exact: true }).click(); await page.getByText('Học sinh lớp 0', { exact: true }).waitFor();
      await page.getByRole('button', { name: 'Đóng', exact: true }).last().click();
      await page.route('**/api/groups/' + groups[1].id, route => route.fulfill({ status: 503, json: { error: 'Chưa tải được đúng lớp' } }));
      await groupCard(1).getByRole('button', { name: 'Xem Danh Sách', exact: true }).click(); await page.getByRole('alert').getByText('Chưa tải được đúng lớp').waitFor();
      assert.equal(await page.getByText('Học sinh lớp 0', { exact: true }).count(), 0);
      await page.unroute('**/api/groups/' + groups[1].id); await page.getByRole('button', { name: 'Thử lại', exact: true }).click(); await page.getByText('Học sinh lớp 1', { exact: true }).waitFor();
      await page.getByRole('button', { name: 'Đóng', exact: true }).last().click();
      let release!: () => void;
      const hold = new Promise<void>(resolve => { release = resolve; });
      await page.route('**/api/groups/' + groups[0].id, async route => { const response = await route.fetch(); await hold; await route.fulfill({ response }); });
      await groupCard(0).getByRole('button', { name: 'Xem Danh Sách', exact: true }).click();
      await page.getByRole('button', { name: 'Đóng', exact: true }).last().click();
      await groupCard(1).getByRole('button', { name: 'Xem Danh Sách', exact: true }).click(); await page.getByText('Học sinh lớp 1', { exact: true }).waitFor();
      const late = page.waitForResponse(response => response.url().endsWith('/api/groups/' + groups[0].id));
      release(); await late;
      assert.equal(await page.getByText('Học sinh lớp 0', { exact: true }).count(), 0, 'a late response must not overwrite the newly selected class');
      await page.unroute('**/api/groups/' + groups[0].id);
      await page.goto(origin + '/teacher/assignments?examId=' + examIds[0]);
      await page.getByRole('heading', { name: 'Đề giao diện 0', exact: true }).waitFor(); assert.equal(await page.getByRole('heading', { name: 'Đề giao diện 1', exact: true }).count(), 0);
      await page.route('**/api/assignments?**', route => route.fulfill({ status: 503, json: { error: 'Lỗi tải bài giao có chủ đích' } }));
      await page.reload(); await page.getByRole('alert').getByText('Lỗi tải bài giao có chủ đích').waitFor();
      assert.equal(await page.getByText('Chưa có bài nào được giao trong mục này', { exact: true }).count(), 0);
      await page.unroute('**/api/assignments?**'); await page.getByRole('button', { name: 'Thử lại', exact: true }).click(); await page.getByRole('heading', { name: 'Đề giao diện 0', exact: true }).waitFor();
    });
    await t.test('teacher pages and trash/list fit phone and desktop in both themes', async () => {
      for (const [width, height] of [[320, 740], [375, 812], [568, 320], [1440, 1000]]) for (const dark of [false, true]) for (const route of ['/', '/?view=trash', '/teacher/questions', '/teacher/groups', '/teacher/assignments']) {
        await page.setViewportSize({ width, height }); await page.goto(origin + route);
        await nav().waitFor();
        if (route.includes('groups')) await page.getByRole('heading', { name: 'Lớp giao diện 0', exact: true }).waitFor();
        if (route.includes('assignments')) await page.getByRole('heading', { name: 'Đề giao diện 0', exact: true }).waitFor();
        if (route.includes('questions')) await page.getByText('Chưa có câu hỏi trong kho này.', { exact: true }).waitFor();
        if (route.includes('trash')) await page.getByText('Thùng rác trống', { exact: true }).waitFor();
        if ((await page.evaluate(() => document.documentElement.classList.contains('dark'))) !== dark) {
          if (route.startsWith('/teacher/')) await page.getByRole('button', { name: /Chuyển sang giao diện/ }).click();
          else await page.getByTitle('Đổi giao diện Sáng / Tối', { exact: true }).filter({ visible: true }).click();
        }
        assert.equal(await page.evaluate(() => document.documentElement.classList.contains('dark')), dark);
        await page.evaluate(() => document.fonts.ready);
        if (route === '/') { await card('Đề giao diện 0').waitFor(); await page.getByTitle('Chế độ xem danh sách', { exact: true }).filter({ visible: true }).click(); }
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, `${route} ${width} ${dark}`);
        for (const input of await page.locator('main select, main input').all()) if (await input.isVisible()) {
          const box = await input.boundingBox(); assert.ok(box && box.x >= -1 && box.x + box.width <= width + 1, `field must fit ${route} ${width}`);
        }
        await page.screenshot({ path: `${report}/${route === '/' ? 'library' : route.includes('trash') ? 'trash' : route.split('/').at(-1)}-${width}-${dark ? 'dark' : 'light'}.png`, fullPage: false });
        if (route === '/' && width < 640) {
          await page.locator('.app-exam-table').scrollIntoViewIfNeeded();
          await page.screenshot({ path: `${report}/library-table-${width}-${dark ? 'dark' : 'light'}.png` });
        }
      }
    });
  } finally {
    await browser.close();
    await db.assignment.deleteMany({ where: { ownerId: { in: ids } } }); await db.group.deleteMany({ where: { ownerId: { in: ids } } });
    await db.exam.deleteMany({ where: { ownerId: { in: ids } } }); await db.question.deleteMany({ where: { ownerId: { in: ids } } }); await db.passage.deleteMany({ where: { ownerId: { in: ids } } });
    await db.folder.deleteMany({ where: { ownerId: { in: ids } } });
    await db.auditLog.deleteMany({ where: { OR: [{ actorId: { in: ids } }, { targetType: 'LoginBucket', targetId: { in: emails.map(loginBucket) } }] } });
    await db.user.deleteMany({ where: { id: { in: ids } } }); assert.equal(await db.user.count({ where: { id: { in: ids } } }), 0);
    fs.writeFileSync(`${report}/cleanup.json`, JSON.stringify({ removedTaskUsers: true, buildId: fs.readFileSync('.next/BUILD_ID', 'utf8').trim() }, null, 2));
    await db.$disconnect();
  }
});
