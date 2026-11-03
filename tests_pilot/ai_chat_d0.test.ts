import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { chromium, type Page } from 'playwright-core';
import { requireTestDatabase } from '../tests/helpers/test-database';
import { loginBucket } from '../src/lib/auth-security';
import { openCopilot, openInfoPanel, selectQuestion, toggleTheme } from './editor-ui';

const origin = process.env.EXAMCRAFT_TEST_ORIGIN ?? 'http://127.0.0.1:3123';
const report = process.env.CHAT_D0_REPORT_DIR ?? 'qa/rebuild-2026-11-03/ai-chat-d0';
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
async function until(check: () => Promise<boolean>, label: string) {
  const end = Date.now() + 15000;
  while (Date.now() < end) { if (await check()) return; await delay(100); }
  assert.fail(label);
}

test('Chat AI Đ0: loaded metadata, idle new, composer revisions and contextual starters', { timeout: 240000 }, async t => {
  const target = requireTestDatabase();
  assert.equal(new URL(target).pathname, '/examcraft_test_20261022');
  assert.equal(new URL(target).port, '5436');
  assert.equal((await (await fetch(origin + '/api/health')).json()).isolatedTest, true);
  const db = new PrismaClient({ datasources: { db: { url: target } }, log: [] });
  assert.equal((await db.$queryRawUnsafe<{ current_database: string }[]>('SELECT current_database()'))[0].current_database, 'examcraft_test_20261022');
  const browser = await chromium.launch({ executablePath: process.env.PILOT_BROWSER_PATH, headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  // No browser traffic may leave this isolated origin. AI responses below are synthetic.
  await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  const id = 'chat_d0_' + randomUUID(), email = id + '@example.invalid', password = randomUUID();
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
    await db.user.create({ data: { id, email, name: 'Giáo viên thử Đ0', role: 'TEACHER', passwordHash: await bcrypt.hash(password, 10), isActive: true, mustChangePassword: false } });
    assert.equal((await context.request.post(origin + '/api/auth/login', { headers: { Origin: origin }, data: { email, password } })).ok(), true);
    const now = new Date().toISOString();
    const fixture = {
      id: randomUUID(), metadata: { title: 'Vật lí 9 — kiểm thử Đ0', schoolName: 'Đơn vị giả', departmentName: '', subject: 'vat_ly', grade: 9, durationMinutes: 60, academicYear: '2026 - 2027' },
      passages: [{ id: 'p1', title: 'Tình huống', content: 'NGU_LIEU_D0', source: 'Fixture nội bộ' }],
      questions: [{ id: 'q1', type: 'short_answer', difficulty: 'thong_hieu', content: 'Một vật đi 12 m trong 3 s. Tốc độ bằng bao nhiêu?', correct_answer: '4', accepted_answers: ['4'], points: 0, passageId: 'p1', figures: [{ id: 'f1', kind: 'image', data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jVJkAAAAASUVORK5CYII=' }], step_by_step_solution: '12 / 3 = 4 m/s' }],
      createdAt: now, updatedAt: now,
    };
    const created = await context.request.post(origin + '/api/exams', { headers: { Origin: origin }, data: { document: fixture } });
    assert.equal(created.ok(), true); examId = (await created.json()).exam.id;

    await t.test('TC-077: delayed load mounts correct form; edit title and grade, reload; preserve content', async () => {
      let release!: () => void;
      const gate = new Promise<void>(resolve => { release = resolve; });
      let requested = false;
      await page.route('**/api/exams/' + examId, async route => {
        if (route.request().method() === 'GET') { requested = true; await gate; }
        await route.continue();
      });
      try {
        await page.goto(origin + '/editor/' + examId);
        await until(async () => requested, 'document load starts');
        assert.equal(await page.getByLabel('Tên đề', { exact: true }).count(), 0, 'no form initialized from placeholder while loading');
      } finally { release(); }
      await info();
      const title = page.getByLabel('Tên đề', { exact: true });
      await title.waitFor();
      assert.equal(await title.inputValue(), fixture.metadata.title);
      assert.equal(await page.getByLabel('Lớp của đề', { exact: true }).inputValue(), '9');
      assert.equal(await page.getByLabel('Môn của đề', { exact: true }).inputValue(), 'vat_ly');
      assert.equal(await page.getByLabel('Thời lượng', { exact: true }).inputValue(), '60');
      await page.unroute('**/api/exams/' + examId);
      await title.fill('Vật lí — đã đổi tên');
      await until(async () => (await api('/api/exams/' + examId)).document.metadata.title === 'Vật lí — đã đổi tên', 'title saved without false conflict');
      await page.getByLabel('Lớp của đề', { exact: true }).selectOption('10');
      await until(async () => (await api('/api/exams/' + examId)).document.metadata.grade === 10, 'grade saved');
      assert.equal(await page.getByText('Trường đang sửa đã đổi ở bản mới.', { exact: false }).count(), 0);
      const saved = (await api('/api/exams/' + examId)).document;
      assert.deepEqual(saved.questions, fixture.questions, 'question, zero points, image and solution remain unchanged');
      assert.deepEqual(saved.passages, fixture.passages);
      await page.reload(); await info(); await title.waitFor();
      assert.equal(await title.inputValue(), 'Vật lí — đã đổi tên');
      assert.equal(await page.getByLabel('Lớp của đề', { exact: true }).inputValue(), '10');
      await page.screenshot({ path: report + '/metadata-desktop.png' });
      await page.setViewportSize({ width: 375, height: 812 });
      await page.getByRole('button', { name: 'Bảng chi tiết', exact: true }).click();
      assert.equal(await title.inputValue(), 'Vật lí — đã đổi tên');
      assert.equal(await page.getByLabel('Thời lượng', { exact: true }).inputValue(), '60');
      await page.screenshot({ path: report + '/metadata-375.png' });
      await page.getByRole('group', { name: 'Chọn bảng', exact: true }).getByRole('button', { name: 'Đóng', exact: true }).click();
      await page.setViewportSize({ width: 1440, height: 1000 });
      checks.push('TC-077 loaded/title/grade/reload/media preserved');
    });

    await t.test('TC-077: unfinished header draft survives selecting a question and returning', async () => {
      await page.getByLabel('Tên đề', { exact: true }).fill(''); // incomplete, must not autosave
      await selectQuestion(page, 'q1');
      await info();
      assert.equal(await page.getByLabel('Tên đề', { exact: true }).inputValue(), '');
      await delay(1200);
      assert.equal((await api('/api/exams/' + examId)).document.metadata.title, 'Vật lí — đã đổi tên');
      await page.getByLabel('Tên đề', { exact: true }).fill('Vật lí — đã đổi tên');
      checks.push('TC-077 selection keeps unfinished form');
    });

    await t.test('TC-078: idle new has no save, no DB row, unchanged URL; first real edit saves', async () => {
      const before = await db.exam.count({ where: { ownerId: id } });
      const saves: string[] = [];
      const listener = (request: import('playwright-core').Request) => {
        if (['POST', 'PATCH'].includes(request.method()) && /\/api\/exams(?:\/[^/]+)?$/.test(new URL(request.url()).pathname)) saves.push(request.method());
      };
      page.on('request', listener);
      await page.goto(origin + '/editor/new'); await info();
      await page.getByLabel('Tên đề', { exact: true }).waitFor();
      await delay(5500);
      assert.equal(page.url(), origin + '/editor/new');
      assert.deepEqual(saves, []);
      assert.equal(await db.exam.count({ where: { ownerId: id } }), before);
      assert.match(await page.getByLabel('Trạng thái lưu', { exact: true }).innerText(), /Chưa lưu/);
      assert.equal(await page.evaluate(owner => localStorage.getItem('examcraft:draft:' + encodeURIComponent(owner) + ':new'), id), null);
      await page.getByLabel('Tên đề', { exact: true }).fill('Đề mới do người dùng sửa');
      await until(async () => page.url() !== origin + '/editor/new', 'first real edit is saved');
      assert.equal(await db.exam.count({ where: { ownerId: id } }), before + 1);
      assert.equal(saves.filter(method => method === 'POST').length, 1);
      page.off('request', listener);
      checks.push('TC-078 idle no-save; first edit one create');
    });

    await t.test('TC-078: existing unsaved new draft still recovers and persists', async () => {
      const recovered = { ...fixture, id: 'draft_' + randomUUID(), metadata: { ...fixture.metadata, title: 'Nháp new phục hồi Đ0' } };
      await page.evaluate(({ owner, exam }) => localStorage.setItem('examcraft:draft:' + encodeURIComponent(owner) + ':new', JSON.stringify({ ownerId: owner, unsaved: true, savedAt: new Date().toISOString(), exam })), { owner: id, exam: recovered });
      await page.goto(origin + '/editor/new');
      await until(async () => page.url() !== origin + '/editor/new', 'recovered draft saves normally');
      const recoveredId = new URL(page.url()).pathname.split('/').at(-1);
      const document = (await api('/api/exams/' + recoveredId)).document;
      assert.equal(document.metadata.title, recovered.metadata.title);
      assert.deepEqual(document.questions, recovered.questions);
      assert.deepEqual(document.passages, recovered.passages);
      checks.push('TC-078 old new draft recovery/media retained');
    });

    await t.test('TC-077 safeguard: revoked access retains an unfinished disabled header form', async () => {
      await page.goto(origin + '/editor/' + examId); await info();
      const title = page.getByLabel('Tên đề', { exact: true });
      await title.fill('');
      await page.route('**/api/exams/' + examId + '/version', route => route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ error: 'Quyền truy cập đã đổi', code: 'FORBIDDEN' }) }));
      await page.evaluate(() => window.dispatchEvent(new Event('focus')));
      await until(async () => await title.isDisabled(), 'editing freezes after revoked access');
      assert.equal(await title.inputValue(), '', 'unfinished header is retained for recovery');
      assert.equal((await api('/api/exams/' + examId)).document.metadata.title, 'Vật lí — đã đổi tên');
      await page.unroute('**/api/exams/' + examId + '/version');
      checks.push('TC-077 access loss retains disabled unfinished form');
    });

    await t.test('TC-019: action response preserves B, ABA revision, chip draft; unchanged sent draft clears; no auto-send', async () => {
      const cases = ['typed-B', 'ABA', 'chip', 'unchanged', 'clarification', 'error'] as const;
      for (const scenario of cases) {
        await page.setViewportSize({ width: 1440, height: 1000 });
        await page.goto(origin + '/editor/' + examId); await info();
        await openCopilot(page);
        if (scenario === 'typed-B') await page.setViewportSize({ width: 375, height: 812 });
        const input = page.getByLabel('Yêu cầu cho AI', { exact: true });
        await input.fill('Yêu cầu A');
        let release!: () => void;
        const gate = new Promise<void>(resolve => { release = resolve; });
        const sent: string[] = [];
        await page.route('**/api/exam-copilot', async route => {
          sent.push(route.request().postDataJSON().command);
          await gate;
          await route.fulfill({ status: scenario === 'error' ? 503 : 200, contentType: 'application/json', body: JSON.stringify(scenario === 'error'
            ? { success: false, error: 'Lỗi dịch vụ giả lập Đ0' }
            : { success: true, result: scenario === 'clarification'
              ? { type: 'clarification', message: 'Câu hỏi giả lập Đ0', quickOptions: ['Lựa chọn thử'] }
              : { type: 'action', action: 'delete_question', targetQuestionId: 'q1', explanation: 'Kết quả giả lập Đ0 — chưa áp dụng' } }) });
        });
        try {
          if (scenario === 'chip') await page.getByRole('button', { name: 'Tăng độ khó', exact: true }).click();
          else await page.getByRole('button', { name: 'Gửi lệnh', exact: true }).click();
          await until(async () => sent.length === 1, 'request captured');
          assert.equal(await input.isEnabled(), true);
          assert.equal(await page.getByRole('button', { name: 'Đang xử lý yêu cầu trước…', exact: true }).isDisabled(), true);
          if (scenario !== 'unchanged' && scenario !== 'chip') await input.fill('B — đang gõ tiếng Việt');
          if (scenario === 'ABA') await input.fill('Yêu cầu A');
        } finally { release(); }
        if (scenario === 'error') await page.getByText('Lỗi dịch vụ giả lập Đ0', { exact: true }).waitFor();
        else if (scenario === 'clarification') await page.getByText('Câu hỏi giả lập Đ0', { exact: true }).waitFor();
        else await page.getByRole('region', { name: 'Đề xuất AI chưa áp dụng', exact: true }).waitFor();
        const expected = scenario === 'unchanged' ? '' : ['ABA', 'chip'].includes(scenario) ? 'Yêu cầu A' : 'B — đang gõ tiếng Việt';
        assert.equal(await input.inputValue(), expected, scenario);
        if (scenario === 'typed-B') await page.screenshot({ path: report + '/composer-keeps-B-375.png' });
        assert.equal(sent.length, 1, 'no automatic second request');
        assert.equal(sent[0], scenario === 'chip' ? 'Tăng độ khó các câu hỏi trong đề thi' : 'Yêu cầu A');
        assert.equal(await page.getByText('Gợi ý lệnh nhanh:', { exact: true }).count(), 0);
        assert.equal((await api('/api/exams/' + examId)).document.questions.length, 1, 'proposal is not auto-applied');
        if (!['clarification', 'error'].includes(scenario)) await page.getByRole('button', { name: 'Cất đề xuất', exact: true }).click();
        await page.unroute('**/api/exam-copilot');
      }
      checks.push('TC-019 action/ABA/chip/unchanged/clarification/error; one call; proposal not auto-applied');
    });

    await t.test('TC-068: empty starters navigate existing tools; no AI calls; 320/375/390 and dark', async () => {
      const aiRequests: string[] = [];
      await page.route('**/api/exam-copilot', route => { aiRequests.push('copilot'); return route.abort(); });
      await page.route('**/api/generate-exam', route => { aiRequests.push('generate'); return route.abort(); });
      for (const width of [320, 375, 390, 1440]) {
        await page.setViewportSize({ width, height: width === 1440 ? 1000 : 812 });
        await page.goto(origin + '/editor/new');
        await until(async () => await page.getByLabel('Tên đề', { exact: true }).count() > 0, 'new editor ready');
        await openCopilot(page);
        assert.equal(await page.getByRole('button', { name: 'Đổi số liệu các câu', exact: true }).count(), 0);
        assert.equal(await page.getByRole('button', { name: 'Tăng độ khó', exact: true }).count(), 0);
        await page.getByRole('button', { name: 'Sinh câu từ mô tả', exact: true }).click();
        assert.equal(await page.getByRole('tab', { name: 'Sinh câu', exact: true }).getAttribute('aria-selected'), 'true');
        await page.getByRole('tab', { name: 'Trò chuyện', exact: true }).click();
        await page.getByRole('button', { name: 'Dùng mẫu', exact: true }).click();
        const panel = page.getByRole('complementary', { name: 'Bảng nội dung và tài nguyên', exact: true });
        await panel.waitFor();
        assert.equal(await panel.isVisible(), true);
        assert.equal(await page.getByRole('button', { name: 'Mẫu', exact: true }).filter({ visible: true }).first().getAttribute('aria-pressed'), 'true');
        if (width < 1024) await panel.getByRole('group', { name: 'Chọn bảng', exact: true }).getByRole('button', { name: 'Đóng', exact: true }).click();
        await openCopilot(page);
        await page.getByRole('button', { name: 'Nhập tài liệu', exact: true }).click();
        await page.getByRole('button', { name: 'Đóng nhập đề từ word hoặc ảnh', exact: true }).waitFor();
        assert.equal(await panel.isVisible(), true);
        if (width < 1024) await panel.getByRole('group', { name: 'Chọn bảng', exact: true }).getByRole('button', { name: 'Đóng', exact: true }).click();
        await openCopilot(page);
        await fits(page);
        await page.screenshot({ path: report + '/empty-starters-' + width + '.png' });
        if (width === 375) {
          // The existing phone AI overlay covers the account menu; switch theme with it closed.
          await page.getByRole('button', { name: 'Đóng AI', exact: true }).click();
          await toggleTheme(page);
          await openCopilot(page);
          await until(async () => page.getByRole('button', { name: 'Dùng mẫu', exact: true }).evaluate(button => getComputedStyle(button).backgroundColor === 'rgb(32, 33, 36)'), 'dark button transition complete');
          await page.screenshot({ path: report + '/empty-starters-375-dark.png' });
          await page.getByRole('button', { name: 'Đóng AI', exact: true }).click();
          await toggleTheme(page);
          await openCopilot(page);
          await until(async () => page.getByRole('button', { name: 'Dùng mẫu', exact: true }).evaluate(button => getComputedStyle(button).backgroundColor === 'rgb(255, 255, 255)'), 'light button transition complete');
        }
      }
      assert.deepEqual(aiRequests, []);
      checks.push('TC-068 starters, phone panel navigation, desktop/mobile widths/dark, zero AI calls');
    });
    assert.deepEqual(pageErrors, [], 'no browser runtime errors');
  } finally {
    await browser.close();
    await db.exam.deleteMany({ where: { ownerId: id } });
    await db.question.deleteMany({ where: { ownerId: id } });
    await db.passage.deleteMany({ where: { ownerId: id } });
    await db.examTemplate.deleteMany({ where: { ownerId: id } });
    await db.auditLog.deleteMany({ where: { OR: [{ actorId: id }, { targetType: 'LoginBucket', targetId: loginBucket(email) }] } });
    await db.user.deleteMany({ where: { id } });
    const cleanup = await db.user.count({ where: { id } }) === 0 && await db.exam.count({ where: { ownerId: id } }) === 0;
    await db.$disconnect();
    fs.writeFileSync(report + '/browser-results.json', JSON.stringify({ checks, cleanup, pageErrors, database: 'examcraft_test_20261022', origin, provider: 'browser-intercepted synthetic responses; no real AI', buildId: fs.readFileSync('.next/BUILD_ID', 'utf8').trim(), checkedAt: new Date().toISOString(), limitations: 'Chrome viewport checks; not a physical phone or production/Vercel check.' }, null, 2));
    assert.equal(cleanup, true);
  }
});

async function fits(page: Page) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, 'no horizontal overflow');
  const input = page.getByLabel('Yêu cầu cho AI', { exact: true });
  assert.equal(await input.isVisible(), true);
  const send = await page.getByRole('button', { name: 'Gửi lệnh', exact: true }).boundingBox();
  assert.ok(send && send.x >= 0 && send.x + send.width <= page.viewportSize()!.width + 1);
}
