import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { chromium, type Page } from 'playwright-core';
import JSZip from 'jszip';
import { requireTestDatabase } from '../tests/helpers/test-database';
import { loginBucket } from '../src/lib/auth-security';

const origin = process.env.EXAMCRAFT_TEST_ORIGIN ?? 'http://127.0.0.1:3117';
const report = process.env.TYPOGRAPHY_REPORT_DIR || 'qa/rebuild-2026-10-27/typography';
const sample = 'Chủ đề · Chưa gắn mức · Yêu cầu cần đạt · Cấu hình điểm, hệ thống không tự quy về thang 10. Ắ ằ ẳ ẵ ặ ấ ầ ẩ ẫ ậ ế ề ể ễ ệ ố ồ ổỗ ộ ớ ờ ở ỡ ợ ứ ừử ữ ự ỳ ỷ ỹ ỵ';

test('Vietnamese typography: full glyphs, paper zoom, phone scrolling, math and print', { timeout: 180000 }, async t => {
  const url = requireTestDatabase();
  assert.equal(new URL(url).pathname, '/examcraft_test_20261022');
  assert.equal((await (await fetch(origin + '/api/health')).json()).isolatedTest, true);
  const db = new PrismaClient({ datasources: { db: { url } }, log: [] });
  assert.equal((await db.$queryRawUnsafe<{ current_database: string }[]>('SELECT current_database()'))[0].current_database, 'examcraft_test_20261022');
  const id = 'typography_' + randomUUID(), email = id + '@example.invalid', password = randomUUID();
  const browser = await chromium.launch({ executablePath: process.env.PILOT_BROWSER_PATH, headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  const evidence: unknown[] = [];
  fs.mkdirSync(report, { recursive: true });
  const platformFonts = async (p: Page, selector: string) => {
    const cdp = await p.context().newCDPSession(p);
    try {
      await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
      const root = await cdp.send('DOM.getDocument');
      const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.root.nodeId, selector });
      return (await cdp.send('CSS.getPlatformFontsForNode', { nodeId })).fonts;
    } finally { await cdp.detach(); }
  };
  try {
    await db.user.create({ data: { id, email, name: 'Kiểm dấu tiếng Việt', role: 'TEACHER', passwordHash: await bcrypt.hash(password, 10), isActive: true, mustChangePassword: false } });
    const login = await context.request.post(origin + '/api/auth/login', { data: { email, password } });
    assert.equal(login.status(), 200);
    await t.test('NFC/NFD, bold and italic use one complete font per role in both themes', async () => {
      await page.goto(origin + '/login');
      await page.evaluate(text => {
        const main = document.createElement('section'); main.id = 'font-specimen';
        main.style.cssText = 'position:fixed;inset:0;z-index:9999;overflow:auto;padding:24px;background:var(--background);color:var(--foreground)';
        for (const role of ['ui', 'paper', 'fallback']) for (const form of ['NFC', 'NFD'] as const) for (const style of ['normal', 'bold', 'italic']) {
          const p = document.createElement('p'); p.id = `${role}-${form}-${style}`; p.textContent = text.normalize(form);
          p.style.cssText = `font-size:18px;line-height:1.7;margin:8px 0;font-weight:${style === 'bold' ? 700 : 400};font-style:${style === 'italic' ? 'italic' : 'normal'}`;
          if (role === 'paper') p.className = 'font-serif';
          if (role === 'fallback') p.style.fontFamily = '"ExamCraft Serif"';
          main.append(p);
        }
        document.body.append(main);
      }, sample);
      await page.evaluate(() => document.fonts.ready);
      for (const dark of [false, true]) {
        await page.evaluate(dark => document.documentElement.classList.toggle('dark', dark), dark);
        for (const role of ['ui', 'paper', 'fallback']) for (const form of ['NFC', 'NFD']) for (const style of ['normal', 'bold', 'italic']) {
          const selector = `#${role}-${form}-${style}`, fonts = await platformFonts(page, selector);
          assert.equal(fonts.length, 1, `${selector}: no mixed font for Vietnamese marks`);
          assert.match(fonts[0].familyName, role === 'ui' ? /Noto Sans/ : role === 'paper' ? /Times New Roman|Noto Serif/ : /Noto Serif/);
          evidence.push({ dark, selector, fonts });
        }
        await page.screenshot({ path: `${report}/font-specimen-${dark ? 'dark' : 'light'}.png`, fullPage: false });
      }
    });
    const examDocument = { id: randomUUID(), version: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), metadata: { title: 'Kiểm dấu tiếng Việt — Đề và đáp án', schoolName: 'Trường thử nghiệm', subject: 'toan', grade: 6, durationMinutes: 15 }, passages: [{ id: 'p1', title: 'Ngữ liệu tiếng Việt', content: sample.normalize('NFD') }], questions: [{ id: 'q1', type: 'short_answer', difficulty: 'thong_hieu', content: sample + ' Tính $x^2 + \\frac{1}{2}$.', correct_answer: '2', accepted_answers: ['2'], step_by_step_solution: sample.normalize('NFD'), passageId: 'p1' }] };
    const created = await context.request.post(origin + '/api/exams', { headers: { Origin: origin }, data: { document: examDocument } });
    assert.equal(created.status(), 200);
    const examId = (await created.json()).exam.id;
    const before = await db.exam.findUniqueOrThrow({ where: { id: examId } });
    await page.goto(origin + '/editor/' + examId);
    await page.getByTitle('Lưu các thay đổi lên máy chủ').first().waitFor();
    await page.evaluate(() => document.fonts.ready);
    const preview = page.locator('.a4-preview-container'), paper = page.locator('.a4-paper');
    await t.test('true 60/100/150 percent zoom, readable phone controls and reachable left/right edges', async () => {
      for (const [width, height] of [[1440, 1000], [375, 812], [320, 740], [568, 320]]) {
        await page.setViewportSize({ width, height });
        if (width < 1024) await page.getByRole('navigation', { name: 'Chuyển vùng soạn' }).getByRole('button', { name: 'Xem đề', exact: true }).click();
        await paper.waitFor({ state: 'visible' });
        assert.ok(await page.locator('.a4-scroll-area').evaluate(e => e.clientHeight >= 100), 'paper remains usable in phone landscape');
        for (const percent of [60, 100, 150]) {
          await preview.getByLabel('Kiểu thu phóng').selectOption('100');
          const control = percent < 100 ? 'Thu nhỏ' : 'Phóng to';
          for (let i = 0; i < Math.abs(percent - 100) / 10; i++) await preview.getByTitle(control, { exact: true }).click();
          assert.equal(await paper.evaluate(e => Number(getComputedStyle(e).zoom)), percent / 100);
          await page.locator('.a4-scroll-area').evaluate(e => { e.scrollLeft = 0; });
          const geometry = await paper.evaluate(e => {
            const area = e.parentElement!, p = e.getBoundingClientRect(), a = area.getBoundingClientRect();
            return { left: p.left - a.left, paper: p.width, width: area.clientWidth, scroll: area.scrollWidth };
          });
          assert.ok(geometry.left >= -1, 'paper left edge can be reached');
          assert.ok(Math.abs(geometry.paper - 793.7 * percent / 100) < 2, 'percentage is actual A4 size');
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, 'page itself must not overflow');
          assert.match(await paper.locator('.katex .mord').first().evaluate(e => getComputedStyle(e).fontFamily), /KaTeX/);
          if (width < 1024) await preview.evaluate(e => window.scrollTo(0, window.scrollY + e.getBoundingClientRect().top - 8));
          if (width === 375 || width === 1440 || width === 568) await page.screenshot({ path: `${report}/editor-${width}-${percent}.png`, fullPage: false });
          if (width === 375) await page.locator('.a4-scroll-area').screenshot({ path: `${report}/phone-paper-${percent}.png` });
          if (geometry.scroll > geometry.width) {
            await page.locator('.a4-scroll-area').evaluate(e => { e.scrollLeft = e.scrollWidth; });
            assert.ok(await paper.evaluate(e => e.getBoundingClientRect().right <= e.parentElement!.getBoundingClientRect().right + 1), 'paper right edge can be reached');
          }
          evidence.push({ width, height, percent, geometry });
        }
        await preview.getByLabel('Kiểu thu phóng').selectOption('fit');
        assert.equal(await page.locator('.a4-scroll-area').evaluate(e => e.scrollWidth <= e.clientWidth + 1), true, 'fit paper has no sideways scrolling');
      }
    });
    await t.test('matrix accents, print at full scale and Word font/content stay correct', async () => {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await preview.getByRole('button', { name: 'Ma trận', exact: true }).click();
      await paper.getByRole('columnheader', { name: 'Chủ đề', exact: true }).first().waitFor();
      await page.evaluate(() => document.fonts.ready);
      const fonts = await platformFonts(page, '.a4-paper th');
      assert.equal(fonts.length, 1); assert.match(fonts[0].familyName, /Times New Roman|Noto Serif/);
      await preview.getByLabel('Kiểu thu phóng').selectOption('100');
      await page.screenshot({ path: `${report}/matrix-100.png`, fullPage: false });
      await preview.getByLabel('Kiểu thu phóng').selectOption('fit');
      await page.locator('.a4-scroll-area').screenshot({ path: `${report}/matrix-fit.png` });
      await preview.getByRole('button', { name: 'Đề', exact: true }).click();
      const [download] = await Promise.all([page.waitForEvent('download'), (async () => { await page.getByRole('button', { name: 'Xuất', exact: true }).click(); await page.getByRole('menuitem', { name: 'Word – đề', exact: true }).click(); const proceed = page.getByRole('button', { name: 'Đã xem, tiếp tục', exact: true }); if (await proceed.isVisible({ timeout: 1500 }).catch(() => false)) await proceed.click(); })()]);
      const path = await download.path(); assert.ok(path);
      const zip = await JSZip.loadAsync(fs.readFileSync(path));
      const xml = await zip.file('word/document.xml')!.async('string');
      assert.ok(xml.includes('Times New Roman')); assert.ok(xml.includes('Kiểm dấu tiếng Việt')); assert.ok(xml.includes(sample.normalize('NFD')));
      await page.emulateMedia({ media: 'print' }); await page.evaluate(() => document.fonts.ready);
      assert.equal(await paper.evaluate(e => getComputedStyle(e).zoom), '1');
      await page.screenshot({ path: `${report}/print.png`, fullPage: true });
      await page.pdf({ path: `${report}/vietnamese-print.pdf`, preferCSSPageSize: true, printBackground: true });
      await page.emulateMedia({ media: 'screen' });
      const after = await db.exam.findUniqueOrThrow({ where: { id: examId } });
      assert.deepEqual(after, before, 'viewing/zoom/printing must not change saved content or revision');
    });
  } finally {
    await browser.close();
    await db.exam.deleteMany({ where: { ownerId: id } });
    await db.question.deleteMany({ where: { ownerId: id } });
    await db.passage.deleteMany({ where: { ownerId: id } });
    await db.auditLog.deleteMany({ where: { OR: [{ actorId: id }, { targetType: 'LoginBucket', targetId: loginBucket(email) }] } });
    await db.user.deleteMany({ where: { id } });
    assert.equal(await db.user.count({ where: { id } }), 0);
    fs.writeFileSync(`${report}/after-fonts-and-zoom.json`, JSON.stringify(evidence, null, 2));
    fs.writeFileSync(`${report}/cleanup.json`, JSON.stringify({ removedTaskUser: true, buildId: fs.readFileSync('.next/BUILD_ID', 'utf8').trim() }, null, 2));
    await db.$disconnect();
  }
});
