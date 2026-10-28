import { saveEditor } from './editor-ui';
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
const report = process.env.LIBRARY_REPORT_DIR || 'qa/rebuild-2026-10-28/library-merge';
test('merged library: folders, scoped views, creation location, permissions and phone', { timeout: 240000 }, async t => {
  const url = requireTestDatabase();
  assert.equal(new URL(url).pathname, '/examcraft_test_20261022');
  assert.equal((await (await fetch(origin + '/api/health')).json()).isolatedTest, true);
  const db = new PrismaClient({ datasources: { db: { url } }, log: [] });
  assert.equal((await db.$queryRawUnsafe<{ current_database: string }[]>('SELECT current_database()'))[0].current_database, 'examcraft_test_20261022');
  const run = randomUUID(), ids = [0, 1].map(i => `library_${run}_${i}`), emails = ids.map(id => id + '@example.invalid'), password = randomUUID();
  const browser = await chromium.launch({ executablePath: process.env.PILOT_BROWSER_PATH, headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } }), page = await context.newPage();
  const examDocument = (title: string) => ({ id: randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), version: 1, metadata: { title, schoolName: '', departmentName: '', subject: 'toan', grade: 6, durationMinutes: 15 }, questions: [{ id: 'q1', type: 'short_answer', difficulty: 'thong_hieu', content: 'Một cộng một bằng bao nhiêu?', correct_answer: '2', accepted_answers: ['2'], points: 1 }] });
  const api = async (path: string, method = 'GET', data?: unknown) => {
    const response = await context.request.fetch(origin + path, { method, headers: { Origin: origin }, ...(data === undefined ? {} : { data }) });
    assert.ok(response.ok(), `${method} ${path}: ${response.status()} ${await response.text()}`); return response.json();
  };
  const nav = () => page.getByRole('navigation', { name: 'Không gian giáo viên' });
  const rows = () => page.locator('[data-library-exam]').filter({ visible: true });
  const waitCount = async (count: number) => {
    const end = Date.now() + 15000;
    while (Date.now() < end) { if (await rows().count() === count && await page.getByText('Đang tải danh sách đề thi...', { exact: true }).count() === 0) return; await new Promise(resolve => setTimeout(resolve, 100)); }
    assert.equal(await rows().count(), count);
  };
  fs.mkdirSync(report, { recursive: true });
  try {
    for (const [i, id] of ids.entries()) await db.user.create({ data: { id, email: emails[i], name: `Giáo viên kho ${i}`, role: 'TEACHER', passwordHash: await bcrypt.hash(password, 10), isActive: true, mustChangePassword: false } });
    await api('/api/auth/login', 'POST', { email: emails[0], password });
    const folder = (await api('/api/folders', 'POST', { name: 'Toán lớp 6', color: '#3c4043' })).folder;
    const child = (await api('/api/folders', 'POST', { name: 'Học kỳ 1', parentId: folder.id, color: '#3c4043' })).folder;
    const root = (await api('/api/exams', 'POST', { document: examDocument('Đề ở ngoài thư mục') })).exam;
    const childExam = (await api('/api/exams', 'POST', { document: examDocument('Đề trong học kỳ'), folderId: child.id })).exam;
    const otherFolder = await db.folder.create({ data: { ownerId: ids[1], name: 'Thư mục riêng đồng nghiệp' } });
    const invited = await db.exam.create({ data: { ownerId: ids[1], folderId: otherFolder.id, title: 'Đề được mời xem', subject: 'toan', grade: 6, metadata: {}, sections: [] } });
    await db.examCollaborator.create({ data: { userId: ids[0], examId: invited.id, role: 'VIEWER' } });
    const nestedIds = Array.from({ length: 53 }, (_, i) => `nested_${run}_${String(i).padStart(2, '0')}`);
    await db.exam.createMany({ data: nestedIds.map((id, i) => ({ id, ownerId: ids[0], folderId: folder.id, title: `NEST_${String(i).padStart(2, '0')}`, subject: 'toan', grade: 6, metadata: {}, sections: [], isStarred: i === 0 })) });
    const before = await db.exam.findMany({ where: { id: { in: [root.id, childExam.id, invited.id, ...nestedIds] } }, orderBy: { id: 'asc' } });

    await t.test('one flat menu, folder cards plus root files, no lost invited exams', async () => {
      await page.goto(origin + '/'); await page.getByRole('heading', { name: 'Thư mục và đề thi', exact: true }).waitFor(); await waitCount(2);
      assert.equal(await nav().getByRole('link').count(), 5);
      assert.equal(await nav().locator('button[aria-expanded]').count(), 0);
      assert.equal(await nav().getByRole('link', { name: /Gắn sao|gần đây|Thư mục/ }).count(), 0);
      await page.locator(`[data-library-folder="${folder.id}"]`).waitFor();
      assert.deepEqual(new Set(await rows().evaluateAll(elements => elements.map(el => el.getAttribute('data-library-exam')))), new Set([root.id, invited.id]));
      assert.equal(await page.getByLabel('Chọn thư mục', { exact: true }).count(), 0);
      const atRoot = await api('/api/exams?location=root&limit=100');
      assert.deepEqual(new Set(atRoot.exams.map((exam: { id: string }) => exam.id)), new Set([root.id, invited.id]));
      const shared = atRoot.exams.find((exam: { id: string }) => exam.id === invited.id);
      assert.equal(shared.folderId, null); assert.equal(shared.permissions.canManage, false);
      await page.screenshot({ path: `${report}/root-1440.png` });
    });
    await t.test('folders and old links share the same paged screen; star/recent remain scoped', async () => {
      await page.locator(`[data-library-folder="${folder.id}"]`).click(); await page.getByRole('heading', { name: 'Toán lớp 6', exact: true }).waitFor(); await waitCount(20);
      await page.locator(`[data-library-folder="${child.id}"]`).waitFor();
      const found = new Set<string>();
      for (const count of [20, 20, 13]) {
        await waitCount(count); for (const id of await rows().evaluateAll(elements => elements.map(el => el.getAttribute('data-library-exam')!))) found.add(id);
        if (found.size < 53) { const response = page.waitForResponse(r => r.url().includes('/api/exams?') && r.request().method() === 'GET'); await page.getByRole('navigation', { name: 'Trang kho đề' }).getByRole('button', { name: 'Trang sau', exact: true }).click(); await response; }
      }
      assert.deepEqual(found, new Set(nestedIds));
      await page.getByRole('navigation', { name: 'Chế độ kho đề' }).getByRole('button', { name: 'Gắn sao', exact: true }).click(); await waitCount(1);
      assert.ok(page.url().includes('folder=' + folder.id));
      assert.equal(await rows().first().getAttribute('data-library-exam'), nestedIds[0]);
      await page.goto(origin + '/'); await page.getByRole('navigation', { name: 'Chế độ kho đề' }).getByRole('button', { name: 'Gắn sao', exact: true }).click(); await waitCount(1);
      await rows().first().getByTitle(/sao/).click(); await page.getByRole('heading', { name: 'Chưa có đề gắn sao trong mục này', exact: true }).waitFor();
      assert.equal((await db.exam.findUniqueOrThrow({ where: { id: nestedIds[0] } })).isStarred, false);
      await page.getByRole('navigation', { name: 'Chế độ kho đề' }).getByRole('button', { name: 'Đã sửa gần đây', exact: true }).click();
      await page.getByLabel('Tìm đề trong kho').fill('NEST_52'); await waitCount(1);
      assert.equal(await rows().first().getAttribute('data-library-exam'), nestedIds[52]);
      await page.goto(origin + '/teacher/folders?folder=' + child.id); await page.waitForURL(origin + '/?folder=' + child.id); await waitCount(1);
      await page.getByRole('heading', { name: 'Học kỳ 1', exact: true }).waitFor();
      await page.getByRole('navigation', { name: 'Đường dẫn thư mục' }).getByRole('link', { name: 'Toán lớp 6', exact: true }).click(); await waitCount(20);
      await page.goBack(); await page.getByRole('heading', { name: 'Học kỳ 1', exact: true }).waitFor(); await waitCount(1);
    });
    const saveCreated = async (folderId: string | null) => {
      const beforeCreate = await db.exam.count({ where: { ownerId: ids[0] } });
      const saved = page.waitForResponse(response => response.url().endsWith('/api/exams') && response.request().method() === 'POST');
      await saveEditor(page);
      const response = await saved; assert.equal(response.ok(), true);
      assert.equal(response.request().postDataJSON().folderId ?? null, folderId);
      const data = await response.json();
      assert.equal((await db.exam.findUniqueOrThrow({ where: { id: data.exam.id } })).folderId, folderId);
      await page.waitForURL(origin + '/editor/' + data.exam.id);
      // Exercise the autosave window after the ?folder URL is replaced.
      await page.waitForTimeout(1100);
      assert.equal(await db.exam.count({ where: { ownerId: ids[0] } }), beforeCreate + 1, 'acknowledged create must not start another blank draft');
      return data.exam.id as string;
    };
    await t.test('new manual, AI-proposed and imported files keep creation location; owner checks remain', async () => {
      await page.goto(origin + '/?folder=' + child.id); await waitCount(1);
      await page.getByRole('button', { name: 'Tạo đề', exact: true }).click(); await page.waitForURL(origin + '/editor/new?folder=' + child.id);
      await page.getByTitle('Lưu các thay đổi lên máy chủ', { exact: true }).filter({ visible: true }).first().waitFor();
      await saveCreated(child.id); await page.waitForURL(/\/editor\/(?!new)/);
      await page.goto(origin + '/?folder=' + folder.id); await waitCount(20);
      await page.route('**/api/generate-exam', route => route.fulfill({ json: { success: true, exam: examDocument('Đề AI giả giữ vị trí') } }));
      await page.getByRole('button', { name: 'AI soạn đề', exact: true }).click();
      const modal = page.locator('div.fixed.inset-0').filter({ visible: true }).last();
      await modal.locator('textarea').first().fill('Ôn tập phép cộng');
      await modal.locator('button').filter({ hasText: /Soạn|Sinh|Tạo/ }).filter({ visible: true }).last().click();
      await page.getByRole('region', { name: 'Đề xuất bản nháp AI' }).getByRole('button', { name: 'Tạo đề mới từ đề xuất', exact: true }).click();
      await page.waitForURL(origin + '/editor/new?folder=' + folder.id); await saveCreated(folder.id); await page.waitForURL(/\/editor\/(?!new)/);
      await page.unroute('**/api/generate-exam');
      await page.goto(origin + '/?folder=' + child.id); await waitCount(2);
      await page.route('**/api/parse-exam-text', route => route.fulfill({ status: 400, json: { success: false, error: 'Fixture local parser' } }));
      await page.getByRole('button', { name: 'Nhập Word / ảnh', exact: true }).click();
      await page.getByLabel('Lớp tài liệu nhập', { exact: true }).selectOption('6'); await page.getByLabel('Môn tài liệu nhập', { exact: true }).selectOption('toan');
      await page.getByRole('button', { name: 'Dán văn bản thô (AI Parser)', exact: true }).click();
      await page.getByPlaceholder(/^Dán đoạn văn bản đề thi thô/).fill('Câu 1: Hai cộng hai bằng mấy?\nA. 4\nB. 3\nC. 2\nD. 1\nĐáp án: A');
      await page.getByRole('button', { name: 'Bắt đầu phân rã thành câu hỏi', exact: true }).click();
      await page.getByTestId('import-preview-question').first().waitFor();
      await page.getByRole('button', { name: 'Tạo đề từ 1 câu hỏi', exact: true }).click(); await page.waitForURL(origin + '/editor/new?folder=' + child.id); await saveCreated(child.id);
      await page.unroute('**/api/parse-exam-text');
      const rejected = await context.request.post(origin + '/api/exams', { headers: { Origin: origin }, data: { document: examDocument('Không được tạo'), folderId: otherFolder.id } });
      assert.equal(rejected.status(), 403); assert.equal(await db.exam.count({ where: { ownerId: ids[0], title: 'Không được tạo' } }), 0);
      const after = await db.exam.findMany({ where: { id: { in: before.map(exam => exam.id) } }, orderBy: { id: 'asc' } });
      for (const row of after) { const old = before.find(exam => exam.id === row.id)!; assert.deepEqual(row.metadata, old.metadata); assert.equal(row.folderId, old.folderId); }
    });
    await t.test('deleted creation folder keeps draft and offers an explicit root save', async () => {
      const temporary = (await api('/api/folders', 'POST', { name: 'Vị trí tạm' })).folder;
      await page.goto(origin + '/editor/new?folder=' + temporary.id);
      await page.getByTitle('Lưu các thay đổi lên máy chủ', { exact: true }).filter({ visible: true }).first().waitFor();
      await api('/api/folders/' + temporary.id, 'DELETE');
      const failed = page.waitForResponse(r => r.url().endsWith('/api/exams') && r.request().method() === 'POST');
      await saveEditor(page);
      const failure = await failed;
      assert.equal(failure.request().postDataJSON().folderId, temporary.id, 'new draft must retain the deleted destination');
      assert.equal(failure.status(), 403);
      if (await page.getByLabel('Trạng thái lưu', { exact: true }).getAttribute('aria-expanded') !== 'true') await page.getByLabel('Trạng thái lưu', { exact: true }).click();
      const response = page.waitForResponse(r => r.url().endsWith('/api/exams') && r.request().method() === 'POST');
      await page.getByRole('button', { name: 'Lưu bản nháp ở ngoài thư mục', exact: true }).click();
      const saved = await response; assert.equal(saved.ok(), true);
      const result = await saved.json();
      assert.equal(result.exam.folderId, null); assert.equal(result.document.metadata.title, 'ĐỀ KIỂM TRA MỚI');
      await page.waitForURL(/\/editor\/(?!new)/);
    });
    await t.test('desktop, phone portrait/landscape, themes, flat menu and folder CRUD errors', async () => {
      for (const [width, height] of [[1440, 1000], [375, 812], [320, 740], [568, 320]]) for (const dark of [false, true]) {
        await page.setViewportSize({ width, height }); await page.goto(origin + '/'); await waitCount(3);
        if (await page.evaluate(() => document.documentElement.classList.contains('dark')) !== dark) await page.getByRole('button', { name: /giao diện/i }).filter({ visible: true }).first().click();
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
        assert.equal(await nav().getByRole('link').count(), 5);
        await page.screenshot({ path: `${report}/home-${width}-${dark ? 'dark' : 'light'}.png` });
        await page.locator(`[data-library-folder="${folder.id}"]`).click(); await waitCount(20);
        await page.screenshot({ path: `${report}/folder-${width}-${dark ? 'dark' : 'light'}.png` });
      }
      await page.goto(origin + '/?folder=missing-folder'); await page.getByRole('alert').getByText(/Không tìm thấy thư mục/).waitFor();
      assert.equal(await page.getByRole('button', { name: 'Tạo đề', exact: true }).isDisabled(), true);
    });
  } finally {
    await browser.close();
    await db.exam.deleteMany({ where: { ownerId: { in: ids } } }); await db.question.deleteMany({ where: { ownerId: { in: ids } } }); await db.passage.deleteMany({ where: { ownerId: { in: ids } } }); await db.folder.deleteMany({ where: { ownerId: { in: ids } } });
    await db.auditLog.deleteMany({ where: { OR: [{ actorId: { in: ids } }, { targetType: 'LoginBucket', targetId: { in: emails.map(loginBucket) } }] } });
    await db.user.deleteMany({ where: { id: { in: ids } } }); assert.equal(await db.user.count({ where: { id: { in: ids } } }), 0);
    fs.writeFileSync(`${report}/cleanup.json`, JSON.stringify({ removedFixtureUsers: true, buildId: fs.readFileSync('.next/BUILD_ID', 'utf8').trim() }, null, 2));
    await db.$disconnect();
  }
});
