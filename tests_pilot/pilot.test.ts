import { saveEditor, addSource, acceptReview, exportTool, openAccount, openCopilot, questionCommandAt, questionMenuItemAt } from './editor-ui';
import test from 'node:test';
import { writeQaReport } from '../tests/helpers/qa-report';
import http from 'node:http';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { randomUUID, createHash } from 'node:crypto';
import bcrypt from 'bcryptjs';
import JSZip from 'jszip';
import { PrismaClient } from '@prisma/client';
import { chromium, type Browser, type Page } from 'playwright-core';
import { requireTestDatabase } from '../tests/helpers/test-database';
import { loginBucket } from '../src/lib/auth-security';
import type { Exam } from '../src/types/exam';
import { legacyOutline, outlineNodes } from '../src/lib/exam-outline';

const origin = process.env.EXAMCRAFT_TEST_ORIGIN ?? 'http://127.0.0.1:3117';
const dbUrl = requireTestDatabase();
assert.equal(new URL(dbUrl).pathname, '/examcraft_test_20261022');
const reportDir = process.env.PILOT_REPORT_DIR || 'qa/rebuild-2026-10-25';
if (!/^qa\/rebuild-\d{4}-\d{2}-\d{2}$/.test(reportDir)) throw Error('Pilot reports require a dated QA root');
fs.mkdirSync(reportDir, { recursive: true });
const run = randomUUID();
const sourceSha256 = createHash('sha256').update(fs.readFileSync('tests_pilot/pilot.test.ts')).digest('hex');
const buildId = fs.readFileSync('.next/BUILD_ID','utf8').trim();
let browserVersion = '';
const results: Record<string, unknown>[] = [];
const image = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64');
const types = ['multiple_choice', 'true_false_group', 'short_answer', 'essay', 'fill_blank', 'matching', 'ordering'] as const;
const solution = 'PRIVATE_SOLUTION_PILOT';
function document(subject: 'toan' | 'ngu_van' = 'toan'): Exam {
  const now = new Date().toISOString();
  return { id: randomUUID(), createdAt: now, updatedAt: now, version: 1,
    metadata: { title: 'Pilot fixture', schoolName: 'Trường thử', departmentName: 'Tổ thử', subject, grade: 6, durationMinutes: 15 },
    passages: [{ id: 'p1', title: 'Ngữ liệu thử', content: 'Lan đọc sách ở thư viện.' }],
    questions: types.map((type, index) => ({ id: `q${index + 1}`, type, difficulty: 'thong_hieu', content: `PILOT Q${index + 1} ${type}`, points: index === 0 ? 0 : 1, step_by_step_solution: solution,
      ...(index === 0 ? { choices: [{ key: 'A', text: 'Hai' }, { key: 'B', text: 'Ba' }], correct_answer: 'A', passageId: 'p1', figures: [{ id: 'fig1', kind: 'image' as const, data: { url: 'data:image/png;base64,' + image.toString('base64') }, caption: 'Ảnh thử' }] } : {}),
      ...(type === 'true_false_group' ? { sub_questions: [{ key: 'a', content: 'Hai lớn hơn một', isCorrect: true }, { key: 'b', content: 'Một lớn hơn hai', isCorrect: false }] } : {}),
      ...(['short_answer', 'fill_blank'].includes(type) ? { correct_answer: '2', accepted_answers: ['2'] } : {}),
      ...(type === 'essay' ? { rubric: [{ criterion: 'Lập luận', maxPoints: 1 }] } : {}),
      ...(type === 'matching' ? { matchingPairs: [{ id: 'm1', left: 'Một', right: '1' }, { id: 'm2', left: 'Hai', right: '2' }] } : {}),
      ...(type === 'ordering' ? { correctOrder: ['Bước đầu', 'Bước sau'] } : {}),
    })) };
}
async function waitUntil(check: () => Promise<boolean>, message: string, timeout = 20000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) { if (await check()) return; await new Promise(resolve => setTimeout(resolve, 150)); }
  throw Error(message);
}
async function openDetails(page: Page, summary: string) { await page.locator('summary', { hasText: summary }).first().evaluate(el => { (el.parentElement as HTMLDetailsElement).open = true; }); }
async function openTool(page: Page, label: 'Xuất' | 'Đề thi') { await page.getByRole('button', { name: label === 'Đề thi' ? 'Xuất' : label, exact: true }).filter({ visible: true }).click(); }
async function menuLink(page: Page, name: string) {
  // The editor has no page menu of its own; its menu button leads back to the same places.
  const appMenu = page.getByRole('button', { name: 'Menu ứng dụng', exact: true }).filter({ visible: true });
  if (await appMenu.count()) {
    await appMenu.click();
    await page.getByRole('menuitem', { name: name === 'Tất cả đề thi' ? 'Về Kho đề' : name, exact: true }).click();
    return;
  }
  if (name === 'Đề quan trọng (Gắn sao)' || name === 'Đã sửa gần đây') { await page.getByRole('navigation', { name: 'Chế độ kho đề' }).getByRole('button', { name: name === 'Đã sửa gần đây' ? name : 'Gắn sao', exact: true }).click(); return; }
  await page.getByRole('navigation', { name: 'Không gian giáo viên' }).getByRole('link', { name: name === 'Tất cả đề thi' ? 'Kho đề' : name, exact: true }).filter({ visible: true }).click();
}
async function click(page: Page, name: string | RegExp) {
  const labels: Record<string,string> = { 'Thêm câu hỏi': '+ Thêm câu hỏi', 'Cùng soạn · Góp ý · Lịch sử': 'Cùng soạn', 'Bảng đáp án & Barem': 'Đáp án', 'Hướng dẫn giải': 'Lời giải', 'Đề thi in ấn': 'Đề', 'Ma trận & Đặc tả': 'Ma trận', 'Chia sẻ & Thi Online': 'Giao bài', 'Chia sẻ & Thi online': 'Giao bài' };
  if (name === 'Ngân hàng câu hỏi') { await addSource(page, 'Từ ngân hàng'); return; }
  if (name === 'Nhập đề (Word/Ảnh)') { await addSource(page, 'Nhập Word/Ảnh'); return; }
  if (name === 'Sinh đề AI Mới') { await addSource(page, 'Sinh bằng AI'); return; }
  if (name === 'Song song') { await page.getByLabel('Bố cục song song', { exact: true }).check(); return; }
  if (name === 'Thêm câu hỏi mới') { await addSource(page, 'Tự soạn câu mới'); return; }
  if (name === 'Thêm câu hỏi') { await page.locator('[data-outline-kind=part]').last().getByRole('button', { name: 'Thêm vào Phần đọc', exact: true }).click(); await page.getByRole('menuitem', { name: 'Câu tự soạn', exact: true }).click(); return; }
  if (name === 'Cùng soạn · Góp ý · Lịch sử') { await page.getByRole('button', { name: 'Mời cùng soạn', exact: true }).filter({ visible: true }).click(); return; }
  await page.getByRole('button', { name: typeof name === 'string' ? labels[name] ?? name : name, exact: typeof name === 'string' }).click();
  await acceptReview(page);
}
async function login(page: Page, email: string, password: string) {
  // The effect's session lookup proves hydration; SSR form controls alone do not.
  const hydrated = page.waitForResponse(r => r.url().endsWith('/api/auth/me') && r.request().method() === 'GET');
  await page.goto(origin + '/login');
  await hydrated;
  await page.getByPlaceholder('name@school.edu.vn').fill(email);
  await page.getByPlaceholder('••••••••').fill(password);
  const response = page.waitForResponse(r => r.url().endsWith('/api/auth/login') && r.request().method() === 'POST');
  await click(page, 'Đăng nhập hệ thống'); assert.equal((await response).status(), 200, 'Fixture login must succeed');
}
type Fixture = Awaited<ReturnType<typeof setup>>;
async function setup(id: string, firstPassword = false) {
  const health = await fetch(origin + '/api/health'); assert.equal((await health.json()).isolatedTest, true);
  const db = new PrismaClient({ datasources: { db: { url: dbUrl } }, log: [] });
  assert.equal((await db.$queryRawUnsafe<{ current_database: string }[]>('SELECT current_database()'))[0].current_database, 'examcraft_test_20261022');
  const ids = [0, 1].map(i => `pilot_${run}_${id}_${i}`);
  const emails = ids.map(x => (x + '@example.invalid').toLowerCase());
  const password = 'Pilot-fixture-' + randomUUID();
  const passwordHash = await bcrypt.hash(password, 10);
  let browser: Browser | undefined;
  const cleanup = async () => {
    await browser?.close();
    // Exact IDs created by this test only. Never truncate/reset shared fixtures.
    await db.assignment.deleteMany({ where: { ownerId: { in: ids } } });
    await db.group.deleteMany({ where: { ownerId: { in: ids } } });
    await db.exam.deleteMany({ where: { ownerId: { in: ids } } });
    await db.examTemplate.deleteMany({ where: { ownerId: { in: ids } } });
    await db.question.deleteMany({ where: { ownerId: { in: ids } } });
    await db.passage.deleteMany({ where: { ownerId: { in: ids } } });
    await db.auditLog.deleteMany({ where: { OR: [{actorId: { in: ids }}, {targetType:'LoginBucket',targetId:{in:emails.map(loginBucket)}}] } });
    const aiCalls = await db.aiUsageLog.count({ where: { userId: { in: ids } } });
    if (!['F21', 'F22'].includes(id)) assert.equal(aiCalls, 0, 'Pilot must not call/reserve provider usage');
    await db.aiUsageLog.deleteMany({ where: { userId: { in: ids } } });
    await db.userApiKey.deleteMany({ where: { userId: { in: ids } } });
    await db.user.deleteMany({ where: { id: { in: ids } } });
    assert.equal(await db.user.count({ where: { id: { in: ids } } }), 0);
    assert.equal(await db.auditLog.count({ where: { OR: [{actorId: {in:ids}}, {targetType:'LoginBucket',targetId:{in:emails.map(loginBucket)}}] } }),0);
    await db.$disconnect();
  };
  try {
    for (let i = 0; i < 2; i++) await db.user.create({ data: { id: ids[i], email: emails[i], name: `Pilot ${id} ${i}`, passwordHash, role: 'TEACHER', mustChangePassword: firstPassword && i === 0, aiDailyLimit: 0 } });
    browser = await chromium.launch({ executablePath: process.env.PILOT_BROWSER_PATH, headless: true }); browserVersion = browser.version();
    const context = async () => {
      const c = await browser!.newContext({ viewport: { width: 1536, height: 1000 }, acceptDownloads: true });
      c.setDefaultTimeout(Number(process.env.PILOT_STEP_TIMEOUT_MS) || 20000); c.setDefaultNavigationTimeout(20000);
      await c.route('**/*', route => {
        const u = new URL(route.request().url());
        if (['data:', 'blob:', 'about:'].includes(u.protocol)) return route.continue();
        const localMockFlow = id === 'F22' && ['/api/parse-exam-text', '/api/generate-exam'].includes(u.pathname);
        if (u.origin !== origin || !localMockFlow && /\/api\/(generate|ocr|parse-|verify|tweak)|\/ai-memory\/analyze/.test(u.pathname)) return route.abort();
        return route.continue();
      });
      c.on('page', p => { p.on('dialog', d => { console.log(id+' dialog: '+d.message()); void d.accept(); }); p.on('pageerror', e=>console.log(id+' browser error: '+e.message)); });
      return c;
    };
    const owner = await context(), page = await owner.newPage();
    const api = async (url: string, method = 'GET', body?: unknown, ctx = owner) => {
      const r = await ctx.request.fetch(origin + url, { method, headers: { Origin: origin }, ...(body !== undefined ? { data: body } : {}) });
      const data = await r.json(); assert.ok(r.ok(), `${method} ${url} returned ${r.status()}`); return data;
    };
    return { db, ids, emails, password, browser, context, owner, page, api, cleanup };
  } catch (error) { await cleanup(); throw error; }
}
async function authenticated(f: Fixture) { await login(f.page, f.emails[0], f.password); await f.page.waitForURL(origin + '/'); }
async function seedExam(f: Fixture, subject: 'toan' | 'ngu_van' = 'toan') { return (await f.api('/api/exams', 'POST', { document: document(subject) })).exam.id as string; }
async function openExam(f: Fixture, id: string) { await f.page.goto(origin + '/editor/' + id); await f.page.getByTitle('Lưu các thay đổi lên máy chủ').first().waitFor(); await f.page.locator('button[title="Nhấn để đổi tên đề thi"]:not([disabled])').waitFor(); }
async function assignment(f: Fixture, examId: string) {
  return (await f.api('/api/assignments', 'POST', { examId, title: 'Pilot bài giao', mode: 'CLASSWORK', identityMode: 'FREE_NAME', durationMinutes: 15, maxAttempts: 1, shuffleQuestions: false, shuffleChoices: false, showResult: 'IMMEDIATE', showSolution: 'AFTER_CLOSE' })).assignment;
}
async function studentSubmit(f: Fixture, asg: { id: string; publicId: string }) {
  const student = await f.context(), p = await student.newPage();
  await p.goto(origin + '/a/' + asg.publicId);
  await p.getByPlaceholder('Ví dụ: Nguyễn Văn An').fill('Học sinh pilot'); await click(p, /Bắt đầu làm bài/);
  await p.locator('#q-1').waitFor();
  await p.locator('#q-1').getByRole('button', { name: /Hai/ }).click();
  await p.locator('#q-2').getByRole('button', { name: 'ĐÚNG', exact: true }).first().click();
  await p.locator('#q-2').getByRole('button', { name: 'SAI', exact: true }).last().click();
  await p.locator('#q-3 input').fill('2'); await p.locator('#q-4 textarea').fill('Lập luận thử'); await p.locator('#q-5 input').fill('2');
  await p.getByLabel('Ghép cho Một', { exact: true }).selectOption({ label: '1' }); await p.getByLabel('Ghép cho Hai', { exact: true }).selectOption({ label: '2' });
  await p.locator('#q-7').getByRole('button', { name: /Thêm vào thứ tự: Bước đầu/ }).click(); await p.locator('#q-7').getByRole('button', { name: /Thêm vào thứ tự: Bước sau/ }).click();
  await waitUntil(async () => { const row = await f.db.attempt.findFirst({ where: { assignmentId: asg.id, student: { displayName: 'Học sinh pilot' } } }); const raw = JSON.stringify(row?.draft); return raw.includes('Lập luận thử') && raw.includes('q7'); }, 'Student draft not acknowledged');
  await p.reload();
  // Anonymous name entry may be shown again; the signed attempt cookie resumes same attempt.
  // After a reload the page either asks for the name again or resumes the signed attempt by itself; wait for whichever comes.
  await p.locator('#q-4 textarea, input[placeholder="Ví dụ: Nguyễn Văn An"]').first().waitFor();
  if (await p.getByPlaceholder('Ví dụ: Nguyễn Văn An').isVisible()) { await p.getByPlaceholder('Ví dụ: Nguyễn Văn An').fill('Học sinh pilot'); await click(p, /Bắt đầu làm bài/); }
  await p.locator('#q-4 textarea').waitFor(); assert.equal(await p.locator('#q-4 textarea').inputValue(), 'Lập luận thử');
  assert.ok(!(await p.locator('body').innerText()).includes(solution));
  const req = p.waitForResponse(r => /\/api\/public\/attempts\/[^/]+\/submit$/.test(r.url()) && r.request().method() === 'POST');
  await click(p, 'Nộp bài thi'); await click(p, 'Nộp bài ngay');
  const response = await req; assert.equal(response.status(), 200);
  const payload = await response.json(); assert.ok(!JSON.stringify(payload).includes(solution));
  return { student, page: p };
}
async function flow(id: string, action: (f: Fixture) => Promise<void>, firstPassword = false) {
  let f: Fixture | undefined; let error: unknown; let cleanupComplete = false; const start = Date.now();
  try { console.log('Starting '+id); f = await setup(id, firstPassword); await action(f); }
  catch (e) { error = e; if (f) await (f.browser.contexts().at(-1)?.pages().at(-1) ?? f.page).screenshot({ path: `${reportDir}/pilot-${id}-failure.png`, fullPage: true }).catch(() => {}); }
  finally { if (f) { try { await f.cleanup(); cleanupComplete = true; } catch (e) { error ??= e; } } }
  const message = error instanceof Error ? error.message.replaceAll(f?.password ?? '\0', '[fixture-password]') : error ? 'Unknown pilot failure' : undefined;
  results.push({ id, status: error ? 'FAIL' : 'PASS', durationMs: Date.now() - start, cleanupComplete, ...(message ? { error: message } : {}) });
  fs.mkdirSync(reportDir, { recursive: true }); const evidence=JSON.stringify({ run, sourceSha256, buildId, browserVersion, browserExecutable: process.env.PILOT_BROWSER_PATH, requestedFlow: process.env.PILOT_FLOW ?? 'F1-F7,F9-F24', checkedAt: new Date().toISOString(), environment: 'isolatedTest ' + origin + ' / examcraft_test_20261022', realAiCalls: false, results }, null, 2);
  writeQaReport(`${reportDir}/pilot-results.json`,evidence);writeQaReport(`${reportDir}/pilot-run-${run}.json`,evidence);
  if (error) throw Error(`${id}: ${message}`);
}

test('F1 first login, password change and library', { timeout: 90000 }, () => flow('F1', async f => {
  await login(f.page, f.emails[0], f.password);
  await f.page.getByPlaceholder('Nhập mật khẩu mới').fill(f.password + '-changed'); await f.page.getByPlaceholder('Nhập lại mật khẩu mới').fill(f.password + '-changed');
  await click(f.page, /Đổi mật khẩu.*|Cập nhật.*|Lưu mật khẩu.*/);
  await f.page.waitForURL(origin + '/'); await f.page.getByRole('heading', { name: 'Thư mục và đề thi', exact: true }).waitFor();
  assert.equal((await f.db.user.findUniqueOrThrow({ where: { id: f.ids[0] } })).mustChangePassword, false);
}, true));

test('F2 author seven types, image, passage, zero, title and reopen', { timeout: 240000 }, () => flow('F2', async f => {
  await authenticated(f);
  // Hold the first real creation ACK until a question form contains unsaved text.
  // This makes the draft-ID -> server-ID race deterministic instead of sleeping.
  let releaseCreate!: () => void;
  const createGate = new Promise<void>(resolve => { releaseCreate = resolve; });
  let heldCreate = false;
  await f.page.route('**/api/exams', async route => {
    if (route.request().method() !== 'POST' || heldCreate) return route.continue();
    heldCreate = true;
    const response = await route.fetch();
    await createGate;
    await route.fulfill({ response });
  });
  await f.page.getByRole('button', { name: 'Tạo đề', exact: true }).click();
  await f.page.getByTitle('Nhấn để đổi tên đề thi').click();
  const titleInput = f.page.locator('header input').first(); await titleInput.fill('Pilot Toán 6 tự soạn'); await titleInput.press('Enter');
  // The part and its shared passage are chosen in the outline and on the sheet; questions are added at the selection.
  const sheet = f.page.locator('.a4-preview-section');
  await f.page.getByRole('button', { name: 'Dàn ý', exact: true }).click();
  await f.page.getByRole('region', { name: 'Dàn ý đề', exact: true }).locator('[data-outline-row]').first().click();
  await f.page.getByLabel('Tên phần', { exact: true }).fill('Phần đọc');
  await f.page.getByRole('navigation', { name: 'Đang chọn', exact: true }).getByRole('button', { name: 'Toàn đề', exact: true }).click();
  await addSource(f.page, 'Ngữ liệu');
  await f.page.getByLabel('Tên ngữ liệu 1', { exact: true }).fill('Ngữ liệu thử');
  await f.page.getByLabel('Nội dung ngữ liệu 1', { exact: true }).fill('Lan đọc sách ở thư viện.');
  await sheet.getByText('Lan đọc sách ở thư viện.', { exact: true }).waitFor();
  const kindLabel: Record<string, string> = { multiple_choice: 'Tự soạn câu mới', true_false_group: 'Câu đúng/sai', short_answer: 'Câu trả lời ngắn', essay: 'Câu tự luận', fill_blank: 'Câu điền khuyết', matching: 'Câu ghép nối', ordering: 'Câu sắp xếp' };
  for (const [index, type] of types.entries()) {
    await addSource(f.page, kindLabel[type]);
    await f.page.getByLabel('Nội dung câu hỏi', { exact: true }).waitFor();
    assert.equal(await f.page.getByLabel('Dạng câu', { exact: true }).inputValue(), type);
    await f.page.getByLabel('Nội dung câu hỏi', { exact: true }).fill(`PILOT Q${index + 1} ${type}`);
    if (index === 0) {
      await waitUntil(async () => heldCreate, 'First create request must be held');
      releaseCreate();
      await waitUntil(async () => /\/editor\/(?!new(?:\?|$))[^/?]+/.test(new URL(f.page.url()).pathname), 'Creation ACK should select server document');
      assert.equal(await f.page.getByLabel('Nội dung câu hỏi', { exact: true }).inputValue(), 'PILOT Q1 multiple_choice', 'Creation ACK must not reset a question being typed');
    }
    await f.page.getByLabel('Điểm câu', { exact: true }).fill(index === 0 ? '0' : '1');
    if (type === 'multiple_choice') { for (const key of ['A','B','C','D']) await f.page.getByLabel('Phương án ' + key, { exact: true }).fill(key === 'A' ? 'Hai' : key); await f.page.getByLabel('Đáp án lựa chọn').selectOption('A');
      await f.page.getByText('Hình và đồ thị (0)', { exact: true }).last().click();
      await f.page.getByLabel('Thêm ảnh', { exact: false }).last().setInputFiles({ name: 'pilot.png', mimeType: 'image/png', buffer: image });
      await f.page.getByLabel('Chú thích hình 1').fill('Ảnh thử');
    }
    if (type === 'true_false_group') { await f.page.getByLabel('Nội dung ý a').fill('Hai lớn hơn một'); await f.page.getByLabel('Đáp án ý a').selectOption('true'); }
    if (['short_answer','fill_blank'].includes(type)) await f.page.getByLabel('Đáp án chính', { exact: true }).fill('2');
    if (type === 'matching') { for (let i=1;i<=2;i++) { await f.page.getByLabel('Vế trái '+i).fill('Vế '+i); await f.page.getByLabel('Vế phải '+i).fill(String(i)); } }
    if (type === 'ordering') await f.page.getByLabel('Thứ tự đúng', { exact: true }).fill('Bước đầu\nBước sau');
    await f.page.getByRole('textbox', { name: 'Lời giải', exact: true }).fill(solution);
    // Changes apply by themselves: wait until the sheet shows this question.
    await sheet.getByText(`PILOT Q${index + 1} ${type}`, { exact: false }).first().waitFor();
    await waitUntil(async () => (await f.page.getByText('Đang lưu thay đổi…').count()) === 0, 'The question form should finish applying');
  }
  const bankSaved = f.page.waitForResponse(r => r.url().endsWith('/api/questions') && r.request().method() === 'POST');
  await questionCommandAt(f.page, 0, 'Lưu bản sao vào ngân hàng');
  { const bankResponse = await bankSaved; assert.equal(bankResponse.status(), 200, 'POST /api/questions status ' + bankResponse.status()); } // this endpoint answers 200 with { success, question }, not 201
  await f.page.getByText('Đã lưu bản sao riêng vào ngân hàng', { exact: false }).waitFor();
  const bankRows = await f.db.question.findMany({ where: { ownerId: f.ids[0], NOT: { tags: { has: '__workspace_only' } } }, include: { passage: true } });
  assert.equal(bankRows.length, 1);
  assert.equal(bankRows[0].content, 'PILOT Q1 multiple_choice');
  assert.equal(Number(bankRows[0].points), 0);
  assert.equal(bankRows[0].passage?.content, 'Lan đọc sách ở thư viện.');
  await f.page.getByRole('button',{name:'Mẫu',exact:true}).click(); await openDetails(f.page, 'Mẫu cá nhân và nguồn tham khảo');
  await openDetails(f.page, 'Lưu cấu hình đề hiện tại thành mẫu riêng');
  await f.page.getByLabel('Tên bản mẫu riêng', { exact: true }).fill('Mẫu pilot riêng');
  const templateSaved = f.page.waitForResponse(r=>r.url().endsWith('/api/templates') && r.request().method()==='POST');
  await click(f.page,'Lưu bản mẫu riêng'); { const templateResponse = await templateSaved; assert.equal(templateResponse.status(), 201, 'POST /api/templates status ' + templateResponse.status() + ' ' + (await templateResponse.text()).slice(0, 160)); }
  await saveEditor(f.page);
  await waitUntil(async () => { const rows = await f.db.exam.findMany({ where: { ownerId: f.ids[0] } }); return rows.some(r => r.title === 'Pilot Toán 6 tự soạn' && JSON.stringify(r.metadata).includes('PILOT Q7')); }, 'All seven questions not saved');
  const exam = await f.db.exam.findFirstOrThrow({ where: { ownerId: f.ids[0] } });
  await f.page.goto(origin + '/'); await openExam(f,exam.id);
  const saved = (await f.api('/api/exams/'+exam.id)).document as Exam;
  assert.equal(saved.outline?.[0].kind, 'part');
  assert.equal(saved.outline?.[0].children?.[0].kind, 'group');
  assert.equal(saved.questions[0].passageId, saved.passages?.[0].id);
  assert.equal(saved.outline?.[0].sectionId,null);
  assert.equal(saved.questions[0].sectionId,undefined);
  assert.deepEqual(saved.questions.map(q=>q.type),types); assert.equal(saved.questions[0].points,0); assert.equal(saved.questions[0].figures?.length,1); assert.equal(saved.passages?.[0].content,'Lan đọc sách ở thư viện.');
  await f.page.getByText('PILOT Q7 ordering', { exact: true }).filter({visible:true}).first().waitFor();
}));

test('F3 answer views, shuffle, Word and print', { timeout: 120000 }, () => flow('F3', async f => {
  await authenticated(f); await openExam(f,await seedExam(f,'ngu_van'));
  await openTool(f.page, 'Xuất'); await f.page.getByRole('menuitem', { name: /^(Rà soát đề|Đề còn [0-9]+ mục cần xem)$/ }).click();
  const review = f.page.getByRole('region', { name: 'Rà soát đề', exact: true });
  assert.ok((await review.innerText()).includes('Tổng điểm: 6,00'));
  assert.ok(!(await review.innerText()).includes(solution));
  await review.getByRole('button', { name: 'Đóng', exact: true }).click();
  await openTool(f.page, 'Xuất'); await f.page.getByRole('menuitem', { name: 'Trình chiếu', exact: true }).click(); await acceptReview(f.page);
  const presentation = f.page.getByRole('dialog', { name: 'Trình chiếu đề' });
  await presentation.waitFor();
  assert.ok(!(await presentation.innerText()).includes(solution));
  await presentation.getByRole('button', { name: 'Chữ lớn hơn', exact: true }).click();
  assert.ok((await presentation.innerText()).includes('26px'));
  await presentation.getByRole('button', { name: 'Hiện đáp án / lời giải', exact: true }).click();
  assert.ok((await presentation.innerText()).includes(solution));
  await presentation.getByLabel('Chọn câu trình chiếu').selectOption({ label: '2' });
  await waitUntil(async () => (await presentation.innerText()).includes('PILOT Q2'), 'Presentation select should show Q2');
  assert.ok((await presentation.innerText()).includes('PILOT Q2'));
  assert.ok(!(await presentation.innerText()).includes(solution));
  await presentation.getByRole('button', { name: 'Câu sau →', exact: true }).focus();
  await f.page.keyboard.press('ArrowRight');
  await waitUntil(async () => (await presentation.innerText()).includes('PILOT Q3'), 'Presentation keyboard should show Q3');
  assert.ok((await presentation.innerText()).includes('PILOT Q3'));
  await f.page.keyboard.press('Escape');
  await presentation.waitFor({ state: 'detached' });
  await click(f.page,'Bảng đáp án & Barem'); await f.page.getByText('Chấp nhận: 2', { exact: true }).first().waitFor();
  await click(f.page,'Hướng dẫn giải'); await f.page.getByText(solution, { exact: true }).first().waitFor(); await click(f.page,'Đề thi in ấn');
  await openTool(f.page,'Xuất'); const [downloaded] = await Promise.all([f.page.waitForEvent('download',{timeout:60000}),f.page.getByRole('menuitem', { name: 'Word – đề', exact: true }).click().then(() => acceptReview(f.page))]); const file = await downloaded.path(); assert.ok(file); const bytes=fs.readFileSync(file); assert.equal(bytes.subarray(0,2).toString(),'PK'); assert.ok(bytes.length>2000);
  const zip = await JSZip.loadAsync(bytes); const xml = await zip.file('word/document.xml')!.async('string');
  for (let i=1;i<=7;i++) assert.ok(xml.includes('PILOT Q'+i), 'Word missing question '+i);
  assert.ok(Object.keys(zip.files).some(n=>n.startsWith('word/media/')), 'Word missing image');
  await f.page.evaluate(()=>{(window as unknown as {pilotPrinted:number}).pilotPrinted=0;window.print=()=>{(window as unknown as {pilotPrinted:number}).pilotPrinted++;};});
  await openTool(f.page,'Xuất'); await f.page.getByRole('menuitem', { name: 'In / PDF', exact: true }).click(); await acceptReview(f.page); assert.equal(await f.page.evaluate(()=>(window as unknown as {pilotPrinted:number}).pilotPrinted),1);
  await openTool(f.page,'Đề thi'); await f.page.getByRole('menuitem',{name:'Trộn mã đề…',exact:true}).click(); await f.page.getByRole('heading',{name:/Trộn Đề Thi/}).waitFor(); assert.ok((await f.page.locator('body').innerText()).includes('101'));
  const buttons=f.page.getByTitle('Tải file Word của mã này'); assert.equal(await buttons.count(),4);
  for(let i=0;i<4;i++){ console.log('F3 variant '+i+' download requested'); const [d]=await Promise.all([f.page.waitForEvent('download',{timeout:20000}),buttons.nth(i).click()]); console.log('F3 variant '+i+' downloaded'); const filepath=await d.path(); assert.ok(filepath);const z=await JSZip.loadAsync(fs.readFileSync(filepath));const x=await z.file('word/document.xml')!.async('string'); for(let q=1;q<=7;q++)assert.ok(x.includes('PILOT Q'+q));assert.ok(Object.keys(z.files).some(n=>n.startsWith('word/media/'))); }
  await click(f.page,'Đóng cửa sổ');
  await click(f.page,'Song song'); await f.page.getByRole('heading',{name:'ĐỀ VÀ ĐÁP ÁN SONG SONG',exact:true}).waitFor();
  const rows=f.page.getByRole('heading',{name:'ĐỀ VÀ ĐÁP ÁN SONG SONG',exact:true}).locator('..').locator('.question-item'); assert.equal(await rows.count(),7);
  for(let i=0;i<7;i++){ const row=rows.nth(i);assert.equal(await row.locator(':scope > div').count(),2);assert.ok((await row.innerText()).includes('PILOT Q'+(i+1)));assert.ok((await row.innerText()).includes(solution)); }
  const passage = f.page.locator('.a4-paper [data-outline-block]').filter({ hasText: 'Lan đọc sách ở thư viện.' });
  assert.equal(await passage.count(),1); assert.ok((await passage.innerText()).includes('Lan đọc sách ở thư viện.'));
  const [parallelDownload] = await Promise.all([f.page.waitForEvent('download'), exportTool(f.page, 'Word – đề song song')]);
  const parallelPath = await parallelDownload.path(); assert.ok(parallelPath);
  const parallelZip = await JSZip.loadAsync(fs.readFileSync(parallelPath));
  const parallelXml = await parallelZip.file('word/document.xml')!.async('string');
  assert.ok(parallelXml.includes('ĐỀ VÀ ĐÁP ÁN SONG SONG'));
  assert.equal(parallelXml.split('Lan đọc sách ở thư viện.').length - 1, 1);
  for (let i = 1; i <= 7; i++) {
    const begin = parallelXml.indexOf('PILOT Q' + i);
    const end = i < 7 ? parallelXml.indexOf('PILOT Q' + (i + 1)) : parallelXml.length;
    const answer = parallelXml.indexOf(solution, begin);
    assert.ok(begin >= 0 && answer > begin && answer < end);
  }
  // The contributed fixture exercises a long shared passage across five questions.
  // It remains synthetic test content, never an approved curriculum package.
  const literary = JSON.parse(fs.readFileSync('tests/fixtures/pilot/mon2-ngu-lieu.json','utf8')) as Exam;
  literary.id = randomUUID();
  const literaryId = (await f.api('/api/exams','POST',{document:literary})).exam.id;
  await openExam(f,literaryId); await click(f.page,'Song song');
  await f.page.getByRole('heading',{name:'ĐỀ VÀ ĐÁP ÁN SONG SONG',exact:true}).waitFor();
  const literaryPassage = f.page.locator('.a4-paper [data-outline-block]').filter({ hasText: 'Con sông quê tôi' });
  const expectedGroups = outlineNodes(legacyOutline(literary)).filter(node => node.kind === 'group');
  assert.equal(expectedGroups.length, 2, 'The source shares material across two different parts');
  assert.equal(await literaryPassage.count(), expectedGroups.length);
  for (const block of await literaryPassage.all()) assert.ok((await block.innerText()).includes('Con sông quê tôi'));
  assert.equal(await f.page.getByRole('heading',{name:'ĐỀ VÀ ĐÁP ÁN SONG SONG',exact:true}).locator('..').locator('.question-item').count(),literary.questions.length);
}));

test('F4 public link, collaborator edits and revoke', { timeout: 150000 }, () => flow('F4', async f => {
  await authenticated(f); const id=await seedExam(f); await openExam(f,id);
  await f.page.getByTitle('Tạo link cho học sinh làm bài hoặc chia sẻ đề cho đồng nghiệp').click();
  await click(f.page,'Link Xem / Tải Word (.docx)');
  const [response]=await Promise.all([f.page.waitForResponse(r=>r.url().endsWith(`/api/exams/${id}/share`)&&r.request().method()==='POST'),click(f.page,'Tạo link chia sẻ')]);const publicLink=(await response.json()).publicLink as string;assert.ok(publicLink.startsWith('/share/'));
  const pinNote=await f.page.getByTestId('share-pin-note').innerText();assert.match(pinNote,/Link giữ bản đề tại thời điểm tạo/);assert.match(pinNote,/phiên bản \d+ của đề/);
  const guest=await f.context(),p=await guest.newPage();await p.goto(origin+publicLink);await p.getByText('PILOT Q1 multiple_choice',{exact:true}).filter({visible:true}).first().waitFor();assert.ok(!(await p.locator('body').innerText()).includes(solution));
  await f.page.reload();await click(f.page,'Cùng soạn · Góp ý · Lịch sử');await f.page.getByLabel('Email giáo viên').fill(f.emails[1]);await f.page.getByLabel('Quyền cộng tác').selectOption('VIEWER');await click(f.page,'Cấp quyền');
  const peer=await f.context(),other=await peer.newPage();await login(other,f.emails[1],f.password);await other.waitForURL(origin+'/');await other.goto(origin+'/editor/'+id);const title=other.getByTitle('Nhấn để đổi tên đề thi');await title.waitFor();assert.equal(await title.isDisabled(),true,'Viewer must not edit');
  await f.page.getByLabel('Email giáo viên').fill(f.emails[1]);await f.page.getByLabel('Quyền cộng tác').selectOption('EDITOR');await click(f.page,'Cấp quyền');await waitUntil(async()=>await f.db.examCollaborator.count({where:{examId:id,userId:f.ids[1],role:'EDITOR',revokedAt:null}})===1,'Editor grant failed');await other.reload();await other.getByTitle('Nhấn để đổi tên đề thi').click();const input=other.locator('header input').first();await input.fill('Pilot đồng nghiệp sửa');await input.press('Enter');
  await waitUntil(async()=> (await f.db.exam.findUniqueOrThrow({where:{id}})).title==='Pilot đồng nghiệp sửa','Collaborator save failed');
  await click(f.page,'Thu hồi quyền');await waitUntil(async()=>await f.db.examCollaborator.count({where:{examId:id,userId:f.ids[1],revokedAt:null}})===0,'Revoke failed');
  const denied=await peer.request.get(origin+'/api/exams/'+id);assert.ok([403,404].includes(denied.status()));await other.reload();await waitUntil(async()=>{const b=other.getByTitle('Nhấn để đổi tên đề thi');return !(await b.isVisible()) || await b.isDisabled();},'Revoked editor controls remain enabled');assert.ok(!(await other.locator('body').innerText()).includes('PILOT Q1 multiple_choice'));assert.equal((await f.db.exam.findUniqueOrThrow({where:{id}})).title,'Pilot đồng nghiệp sửa');
}));

test('F5 assign link with and without class and inspect frozen policies', { timeout: 150000 }, () => flow('F5', async f => {
  await authenticated(f); const id=await seedExam(f);const group=(await f.api('/api/groups','POST',{name:'Lớp pilot',studentNames:['Học sinh pilot']})).group;
  let closing: Date|undefined;
  for(const classId of ['',group.id]){
    await openExam(f,id);await f.page.getByTitle('Tạo link cho học sinh làm bài hoặc chia sẻ đề cho đồng nghiệp').click();await f.page.getByLabel('Giao cho lớp học').locator('option',{hasText:'Lớp pilot'}).waitFor({state:'attached'}); /* the class list loads asynchronously and selects its first class when it arrives */ await f.page.getByLabel('Giao cho lớp học').selectOption(classId);await click(f.page,/Bài Trên Lớp/);
    if(!classId){
      // datetime-local uses minute precision. Wait for the real server clock to cross this near-future deadline.
      closing=new Date(Math.ceil((Date.now()+12000)/60000)*60000);
      const local=(d:Date)=>{const pad=(n:number)=>String(n).padStart(2,'0');return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+'T'+pad(d.getHours())+':'+pad(d.getMinutes());};
      await f.page.getByText('Tùy chọn nâng cao: giờ mở/đóng, số lượt, mã vào bài',{exact:true}).click();
      await f.page.getByLabel('Giờ mở (để trống: mở ngay)',{exact:true}).fill(local(new Date(Date.now()-60000)));
      await f.page.getByLabel('Giờ đóng (để trống: không hạn)',{exact:true}).fill(local(closing));
      await f.page.getByLabel('Số lượt làm (1–10)',{exact:true}).fill('2');
      await f.page.getByLabel('Mã vào bài (4–12 chữ/số, tùy chọn)',{exact:true}).fill('pilot01');
      await f.page.getByLabel('Trộn thứ tự câu hỏi cho mỗi học sinh',{exact:true}).check();
      await f.page.getByLabel('Trộn thứ tự đáp án A/B/C/D',{exact:true}).check();
    } else {
      await f.page.getByText('Tùy chọn nâng cao: giờ mở/đóng, số lượt, mã vào bài',{exact:true}).click();
      await f.page.getByLabel('Yêu cầu PIN của học sinh (chỉ khi giao cho một lớp)',{exact:true}).check();
    }
    const [response]=await Promise.all([f.page.waitForResponse(r=>r.url().endsWith('/api/assignments')&&r.request().method()==='POST'),click(f.page,'Giao Bài & Tạo Phòng Thi Ngay')]);assert.equal(response.status(),200);
  }
  const rows=await f.db.assignment.findMany({where:{ownerId:f.ids[0]}});assert.equal(rows.length,2);assert.deepEqual(new Set(rows.map(r=>r.groupId)),new Set([null,group.id]));
  const advanced=rows.find(r=>r.groupId===null)!; assert.equal(advanced.closesAt?.toISOString(),closing!.toISOString());assert.equal(advanced.maxAttempts,2);assert.equal(advanced.joinCode,'PILOT01');assert.equal(advanced.shuffleQuestions,true);assert.equal(advanced.shuffleChoices,true);
  for(const row of rows){assert.equal(row.showSolution,'AFTER_CLOSE');assert.equal(row.durationMinutes,45);assert.equal(row.status,'OPEN');}
  // Editing the source after assignment must not rewrite either frozen snapshot.
  const frozen = rows.map(row => ({ id: row.id, snapshot: JSON.stringify(row.snapshot) }));
  await openExam(f, id);
  await questionCommandAt(f.page, 0, 'Chỉnh nội dung');
  await f.page.getByLabel('Nội dung câu hỏi', { exact: true }).fill('SOURCE_CHANGED_AFTER_ASSIGN');
  await f.page.locator('.a4-preview-section').getByText('SOURCE_CHANGED_AFTER_ASSIGN', { exact: false }).first().waitFor();
  await saveEditor(f.page);
  await waitUntil(async () => JSON.stringify((await f.db.exam.findUniqueOrThrow({ where: { id } })).metadata).includes('SOURCE_CHANGED_AFTER_ASSIGN'), 'Source edit must be saved');
  for (const row of frozen) assert.equal(JSON.stringify((await f.db.assignment.findUniqueOrThrow({ where: { id: row.id } })).snapshot), row.snapshot);
  const classAssignment = rows.find(row => row.groupId === group.id)!;
  assert.equal(classAssignment.requirePin, true);
  const student = await f.db.student.findFirstOrThrow({ where: { groupId: group.id } });
  await f.db.student.update({ where: { id: student.id }, data: { pinHash: await bcrypt.hash('4821', 10) } });
  const pinContext = await f.context(), pinPage = await pinContext.newPage();
  await pinPage.goto(origin + '/a/' + classAssignment.publicId);
  await pinPage.getByRole('combobox').selectOption(student.id);
  await pinPage.getByLabel('PIN do giáo viên cấp', { exact: true }).fill('0000');
  const wrongPin = pinPage.waitForResponse(r => r.url().endsWith('/start') && r.request().method() === 'POST');
  await click(pinPage, /Bắt đầu làm bài/); assert.equal((await wrongPin).status(), 403);
  assert.equal(await f.db.attempt.count({ where: { assignmentId: classAssignment.id } }), 0);
  await pinPage.getByLabel('PIN do giáo viên cấp', { exact: true }).fill('4821');
  const correctPin = pinPage.waitForResponse(r => r.url().endsWith('/start') && r.request().method() === 'POST');
  await click(pinPage, /Bắt đầu làm bài/); assert.equal((await correctPin).status(), 200);
  await pinPage.locator('#q-1').waitFor();
  assert.ok(!(await pinPage.locator('body').innerText()).includes('SOURCE_CHANGED_AFTER_ASSIGN'));
  await pinContext.close();
  await f.page.goto(origin+'/teacher/assignments/'+advanced.id);
  await f.page.getByText('PILOT01',{exact:true}).waitFor();
  const policy = f.page.getByText('(giờ theo máy này)',{exact:true}).locator('..');
  const policyText = await policy.innerText();
  assert.ok(policyText.includes('Mở:') && policyText.includes('Đóng:') && policyText.includes('Số lượt:'));
  assert.ok(!policyText.includes('không đặt hạn')); assert.ok(!policyText.includes('ngay khi giao'));
  const guest=await f.context(),p=await guest.newPage();await p.goto(origin+'/a/'+advanced.publicId);await p.getByPlaceholder('Ví dụ: Nguyễn Văn An').waitFor();
  await waitUntil(async()=>Date.now()>closing!.getTime()+200, 'Real server close time not reached',90000);
  await p.getByPlaceholder('Ví dụ: Nguyễn Văn An').fill('Vào muộn pilot');
  const code=p.locator('input').filter({visible:true}).first();await code.fill('PILOT01');
  const [denied]=await Promise.all([p.waitForResponse(r=>r.url().endsWith('/start')&&r.request().method()==='POST'),click(p,/Bắt đầu làm bài/)]);assert.equal(denied.status(),403);assert.equal(await f.db.attempt.count({where:{assignmentId:advanced.id}}),0);
}));

test('F6 seven student answers survive reload, submit and hide solutions', { timeout: 120000 }, () => flow('F6', async f => {
  await authenticated(f);const asg=await assignment(f,await seedExam(f));await studentSubmit(f,asg);
  const attempt=await f.db.attempt.findFirstOrThrow({where:{assignmentId:asg.id},include:{answers:true}});assert.equal(attempt.status,'SUBMITTED');assert.equal(attempt.answers.length,7);assert.equal(attempt.needsGrading,true);
}));

test('F7 manual essay grade, total and CSV', { timeout: 150000 }, () => flow('F7', async f => {
  await authenticated(f);const asg=await assignment(f,await seedExam(f));await studentSubmit(f,asg);await f.page.goto(origin+'/teacher/assignments/'+asg.id);await click(f.page,'Xem bài');
  const attempt=await f.db.attempt.findFirstOrThrow({where:{assignmentId:asg.id}});const essay=await f.db.attemptAnswer.findFirstOrThrow({where:{attemptId:attempt.id,questionKey:'q4'}});
  const editor=f.page.getByTestId('grade-editor-'+essay.questionKey);await editor.getByLabel('Điểm câu này:').fill('1');await editor.getByLabel('Nhận xét của giáo viên (không bắt buộc):').fill('Lập luận đạt');await editor.getByRole('button',{name:'Lưu điểm và nhận xét',exact:true}).click();
  await waitUntil(async()=>Number((await f.db.attemptAnswer.findUniqueOrThrow({where:{id:essay.id}})).manualScore)===1,'Manual grade not saved');
  const final=await f.db.attempt.findUniqueOrThrow({where:{id:attempt.id}});assert.equal(Number(final.score),6);assert.equal(Number(final.maxScore),6);assert.equal(final.needsGrading,false);
  await waitUntil(async()=>(await editor.innerText()).includes('Chưa có thay đổi.'),'Grade receipt did not clear sent input');await click(f.page,'Đóng');
  const [download]=await Promise.all([f.page.waitForEvent('download'),click(f.page,'Xuất Excel (CSV)')]);const file=await download.path();assert.ok(file);const csv=fs.readFileSync(file,'utf8');assert.ok(csv.includes('Học sinh pilot'));assert.ok(csv.includes('6 / 6'));assert.ok(csv.includes('Nhận xét câu 4'));assert.ok(csv.includes('Lập luận đạt'));
}));

test('F9 offline edits reconnect safely and preserve a conflicting draft as a separate exam', { timeout: 150000 }, () => flow('F9', async f => {
  await authenticated(f); const id = await seedExam(f); await openExam(f,id);
  const rename = async (value: string) => {
    await f.page.getByTitle('Nhấn để đổi tên đề thi').click();
    const input=f.page.locator('header input').first(); await input.fill(value); await input.press('Enter');
  };
  const baseline = await f.db.exam.findUniqueOrThrow({where:{id}});
  await f.owner.setOffline(true); await rename('Pilot offline giữ nháp');
  if (await f.page.getByLabel('Trạng thái lưu', {exact:true}).getAttribute('aria-expanded') !== 'true') await f.page.getByLabel('Trạng thái lưu', {exact:true}).click();
  if (await f.page.getByLabel('Trạng thái lưu', {exact:true}).getAttribute('aria-expanded') !== 'true') await f.page.getByLabel('Trạng thái lưu', {exact:true}).click();
  await f.page.getByText('Mất kết nối — đang giữ bản nháp trên máy',{exact:true}).waitFor();
  assert.equal((await f.db.exam.findUniqueOrThrow({where:{id}})).version,baseline.version);
  assert.ok(await f.page.evaluate(()=>Object.values(localStorage).some(value=>value.includes('Pilot offline giữ nháp'))));
  await f.owner.setOffline(false);
  await waitUntil(async()=>(await f.db.exam.findUniqueOrThrow({where:{id}})).title==='Pilot offline giữ nháp','Reconnect did not save offline edit');
  await f.page.reload(); await f.page.getByTitle('Nhấn để đổi tên đề thi').filter({hasText:'Pilot offline giữ nháp'}).waitFor();
  await f.owner.setOffline(true); await rename('Pilot offline cần giữ riêng');
  if (await f.page.getByLabel('Trạng thái lưu', {exact:true}).getAttribute('aria-expanded') !== 'true') await f.page.getByLabel('Trạng thái lưu', {exact:true}).click();
  await f.page.getByText('Mất kết nối — đang giữ bản nháp trên máy',{exact:true}).waitFor();
  const remote=(await f.api('/api/exams/'+id)).document as Exam;
  remote.metadata.title='Pilot bản mới từ phiên khác';
  await f.api('/api/exams/'+id,'PATCH',{baseVersion:remote.version,document:remote});
  const remoteVersion=(await f.db.exam.findUniqueOrThrow({where:{id}})).version;
  await f.owner.setOffline(false);
  await f.page.getByRole('button',{name:'Lưu bản nháp thành đề mới',exact:true}).waitFor();
  assert.ok((await f.page.getByTitle('Nhấn để đổi tên đề thi').innerText()).includes('Pilot offline cần giữ riêng'));
  assert.equal((await f.db.exam.findUniqueOrThrow({where:{id}})).version,remoteVersion);
  await click(f.page,'Lưu bản nháp thành đề mới');
  await waitUntil(async()=>await f.db.exam.count({where:{ownerId:f.ids[0],title:'Pilot offline cần giữ riêng (Bản sao phục hồi)'}})===1,'Conflicting draft copy was not saved');
  assert.equal((await f.db.exam.findUniqueOrThrow({where:{id}})).title,'Pilot bản mới từ phiên khác');
  assert.equal(await f.db.exam.count({where:{ownerId:f.ids[0]}}),2);
  const copy = await f.db.exam.findFirstOrThrow({ where: { ownerId: f.ids[0], title: 'Pilot offline cần giữ riêng (Bản sao phục hồi)' } });
  await f.page.waitForURL(origin + '/editor/' + copy.id);
  await waitUntil(async () => (await f.page.getByTitle('Nhấn để đổi tên đề thi').innerText()).includes('(Bản sao phục hồi)'), 'Recovery copy URL must keep the copied document open');
  await rename('Pilot chỉ sửa bản phục hồi'); await saveEditor(f.page);
  await waitUntil(async () => (await f.db.exam.findUniqueOrThrow({ where: { id: copy.id } })).title === 'Pilot chỉ sửa bản phục hồi', 'Further edits must save to the recovery copy');
  assert.equal((await f.db.exam.findUniqueOrThrow({ where: { id } })).version, remoteVersion, 'Recovery-copy edits must not change the source exam');
}));

test('F10 switching accounts in one browser keeps a local draft private to its owner and recoverable', { timeout: 150000 }, () => flow('F10', async f => {
  await authenticated(f); const id = await seedExam(f); await openExam(f, id);
  const titleOf = () => f.page.getByTitle('Nhấn để đổi tên đề thi');
  const secret = 'Pilot nháp riêng của A';
  // Hold back every save so the edit stays a local draft that only account A owns.
  await f.page.route('**/api/exams/**', route => route.request().method() === 'PATCH' ? route.abort() : route.continue());
  await titleOf().click(); const input = f.page.locator('header input').first(); await input.fill(secret); await input.press('Enter');
  await waitUntil(async () => await f.page.evaluate(text => Object.values(localStorage).some(value => value.includes(text)), secret), 'Draft was not kept on this machine');
  await f.page.unroute('**/api/exams/**');
  // Same browser profile, account B signs in over A.
  await login(f.page, f.emails[1], f.password); await f.page.waitForURL(origin + '/');
  assert.ok(!(await f.page.content()).includes(secret), 'Account B must not see the draft of A in the library');
  await f.page.goto(origin + '/editor/' + id);
  await new Promise(resolve => setTimeout(resolve, 4000));
  assert.ok(!(await f.page.content()).includes(secret), 'Account B must not be shown the draft of A in A\'s editor URL');
  assert.notEqual((await f.db.exam.findUniqueOrThrow({ where: { id } })).title, secret, 'A\'s draft must not be saved while B is signed in');
  assert.equal(await f.db.exam.count({ where: { ownerId: f.ids[1] } }), 0, 'Nothing is created under account B');
  // A signs back in: the draft is still there and now reaches A's own exam.
  await login(f.page, f.emails[0], f.password); await f.page.waitForURL(origin + '/');
  await f.page.goto(origin + '/editor/' + id);
  await waitUntil(async () => (await f.db.exam.findUniqueOrThrow({ where: { id } })).title === secret, 'A\'s draft was not recovered after signing back in', 30000);
  assert.equal(await f.db.exam.count({ where: { ownerId: f.ids[1] } }), 0);
}));

test('F11 a reload that fails with no network loses nothing and the draft reaches the server on reconnect', { timeout: 150000 }, () => flow('F11', async f => {
  await authenticated(f); const id = await seedExam(f); await openExam(f, id);
  const offlineTitle = 'Pilot giữ nháp qua lần tải lại hỏng';
  await f.page.locator('button[title="Nhấn để đổi tên đề thi"]:not([disabled])').waitFor();
  await f.owner.setOffline(true);
  await f.page.getByTitle('Nhấn để đổi tên đề thi').click(); const input = f.page.locator('header input').first(); await input.fill(offlineTitle); await input.press('Enter');
  if (await f.page.getByLabel('Trạng thái lưu', {exact:true}).getAttribute('aria-expanded') !== 'true') await f.page.getByLabel('Trạng thái lưu', {exact:true}).click();
  await f.page.getByText('Mất kết nối — đang giữ bản nháp trên máy', { exact: true }).waitFor();
  // The app has no offline shell, so a full reload cannot render; the draft on this machine must survive the failed attempt.
  await f.page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
  assert.equal((await f.db.exam.findUniqueOrThrow({ where: { id } })).title, 'Pilot fixture', 'Nothing reaches the server while offline');
  await f.owner.setOffline(false);
  await f.page.goto(origin + '/editor/' + id);
  await waitUntil(async () => (await f.db.exam.findUniqueOrThrow({ where: { id } })).title === offlineTitle, 'Offline draft was not saved after reconnecting', 30000);
  assert.equal(await f.db.exam.count({ where: { ownerId: f.ids[0] } }), 1, 'No duplicate exam from recovery');
}));

test('F12 teacher corrects a short-answer key, previews, applies and the student score follows', { timeout: 150000 }, () => flow('F12', async f => {
  await authenticated(f); const asg = await assignment(f, await seedExam(f)); await studentSubmit(f, asg);
  const attempt = await f.db.attempt.findFirstOrThrow({ where: { assignmentId: asg.id } });
  const before = Number(attempt.score);
  await f.page.goto(origin + '/teacher/assignments/' + asg.id);
  await f.page.getByRole('button', { name: /Phân tích câu hỏi/ }).click();
  const panel = f.page.getByTestId('regrade-panel'); await panel.waitFor();
  await panel.locator('summary').click();
  await panel.getByLabel('Câu cần sửa').selectOption({ label: 'Câu 3: PILOT Q3 short_answer' });
  await panel.getByLabel('Các đáp án được chấp nhận').fill('3');
  const apply = panel.getByRole('button', { name: 'Sửa đáp án và chấm lại', exact: true });
  assert.equal(await apply.isDisabled(), true, 'Applying needs a reason and a preview first');
  await panel.getByLabel('Lý do sửa đáp án').fill('Nhập nhầm đáp án');
  await panel.getByRole('button', { name: 'Xem trước ảnh hưởng', exact: true }).click();
  await panel.getByTestId('regrade-effect').getByText(/Xem trước: 1 bài đổi điểm/).waitFor();
  assert.equal(Number((await f.db.attempt.findUniqueOrThrow({ where: { id: attempt.id } })).score), before, 'Preview writes nothing');
  await apply.click();
  await panel.getByTestId('regrade-message').getByText('Đã sửa đáp án và chấm lại 1 bài').waitFor();
  const after = await f.db.attempt.findUniqueOrThrow({ where: { id: attempt.id } });
  assert.equal(Number(after.score), before - 1, 'The student lost the point of the corrected question');
  assert.equal((await f.db.attemptAnswer.findUniqueOrThrow({ where: { attemptId_questionKey: { attemptId: attempt.id, questionKey: 'q3' } } })).isCorrect, false);
  assert.equal(await f.db.auditLog.count({ where: { action: 'attempt.grade', targetId: attempt.id } }), 1, 'One history event for the regraded attempt');
  await panel.getByText(/Nhập nhầm đáp án/).waitFor();
}));

async function noHorizontalScroll(page: Page, where: string) {
  const sizes = await page.evaluate(() => ({ scroll: window.document.documentElement.scrollWidth, inner: window.innerWidth }));
  assert.ok(sizes.scroll <= sizes.inner + 1, `${where}: page scrolls sideways (${sizes.scroll}px wide in a ${sizes.inner}px window)`);
}
async function smallTargets(page: Page, selector: string) {
  return page.locator(selector).evaluateAll(nodes => nodes.filter(node => { const box = (node as HTMLElement).getBoundingClientRect(); return box.width > 0 && box.height > 0 && box.height < 40; }).map(node => ((node as HTMLElement).innerText || (node as HTMLElement).getAttribute('aria-label') || node.tagName).trim().slice(0, 40)));
}

test('F13 a student works and a teacher browses on a 375px phone without sideways scrolling', { timeout: 180000 }, () => flow('F13', async f => {
  await authenticated(f); const asg = await assignment(f, await seedExam(f));
  const student = await f.context(), p = await student.newPage(); await p.setViewportSize({ width: 375, height: 812 });
  await p.goto(origin + '/a/' + asg.publicId);
  await p.getByPlaceholder('Ví dụ: Nguyễn Văn An').waitFor(); await noHorizontalScroll(p, 'student entry');
  await p.getByPlaceholder('Ví dụ: Nguyễn Văn An').fill('Học sinh điện thoại');
  assert.deepEqual(await smallTargets(p, 'button'), [], 'Entry screen buttons are at least 40px tall');
  await click(p, /Bắt đầu làm bài/); await p.locator('#q-1').waitFor(); await noHorizontalScroll(p, 'student question 1');
  const tooSmall: string[] = [];
  for (let i = 1; i <= 7; i++) { await p.locator('#q-' + i).scrollIntoViewIfNeeded(); await noHorizontalScroll(p, 'student question ' + i); tooSmall.push(...await smallTargets(p, `#q-${i} button`)); }
  assert.deepEqual(tooSmall, [], 'Answer buttons are at least 40px tall');
  await p.locator('#q-1').getByRole('button', { name: /Hai/ }).click(); await p.locator('#q-3 input').fill('2'); await p.locator('#q-4 textarea').fill('Lập luận trên điện thoại');
  await waitUntil(async () => JSON.stringify((await f.db.attempt.findFirst({ where: { assignmentId: asg.id } }))?.draft).includes('Lập luận trên điện thoại'), 'Phone draft not acknowledged');
  const req = p.waitForResponse(r => /\/api\/public\/attempts\/[^/]+\/submit$/.test(r.url()) && r.request().method() === 'POST');
  await click(p, 'Nộp bài thi'); await noHorizontalScroll(p, 'submit confirmation'); await click(p, 'Nộp bài ngay'); assert.equal((await req).status(), 200);
  await p.getByText(/Nộp lúc/).waitFor(); await noHorizontalScroll(p, 'student result');
  const t = await f.context(), tp = await t.newPage(); await tp.setViewportSize({ width: 375, height: 812 });
  await login(tp, f.emails[0], f.password); await tp.waitForURL(origin + '/'); await tp.waitForLoadState('networkidle'); await noHorizontalScroll(tp, 'teacher library');
  await tp.goto(origin + '/teacher/assignments/' + asg.id); await tp.getByText('Bảng điểm & Bài nộp').waitFor(); await noHorizontalScroll(tp, 'teacher assignment');
  await tp.goto(origin + '/editor/' + (await f.db.exam.findFirstOrThrow({ where: { ownerId: f.ids[0] } })).id); await tp.getByTitle('Lưu các thay đổi lên máy chủ').first().waitFor(); await noHorizontalScroll(tp, 'teacher editor');
}));

test('F14 two teachers edit the same exam at once: the first save wins, the other keeps a draft and can save it as a copy', { timeout: 180000 }, () => flow('F14', async f => {
  await authenticated(f); const id = await seedExam(f);
  assert.ok((await f.api(`/api/exams/${id}/collaborators`, 'POST', { email: f.emails[1], role: 'EDITOR' })).success !== false);
  await openExam(f, id);
  const peerContext = await f.context(), peer = await peerContext.newPage();
  await login(peer, f.emails[1], f.password); await peer.waitForURL(origin + '/'); await peer.goto(origin + '/editor/' + id);
  const titleOf = (page: Page) => page.getByTitle('Nhấn để đổi tên đề thi');
  const editable = (page: Page) => page.locator('button[title="Nhấn để đổi tên đề thi"]:not([disabled])');
  await editable(peer).waitFor();
  const rename = async (page: Page, value: string) => { await editable(page).waitFor(); await titleOf(page).click(); const input = page.locator('header input').first(); await input.fill(value); await input.press('Enter'); };
  // The second teacher loses the connection, edits, and the first teacher saves in the meantime.
  await peerContext.setOffline(true); await rename(peer, 'Bản của đồng nghiệp');
  await peer.getByLabel('Trạng thái lưu', { exact: true }).click();
  await peer.getByText('Mất kết nối — đang giữ bản nháp trên máy', { exact: true }).waitFor();
  await rename(f.page, 'Bản của chủ đề');
  await waitUntil(async () => (await f.db.exam.findUniqueOrThrow({ where: { id } })).title === 'Bản của chủ đề', 'The owner save did not reach the server');
  const ownerVersion = (await f.db.exam.findUniqueOrThrow({ where: { id } })).version;
  await peerContext.setOffline(false);
  await peer.getByRole('button', { name: 'Lưu bản nháp thành đề mới', exact: true }).waitFor();
  assert.equal((await f.db.exam.findUniqueOrThrow({ where: { id } })).title, 'Bản của chủ đề', 'The late edit never overwrites the saved one');
  assert.equal((await f.db.exam.findUniqueOrThrow({ where: { id } })).version, ownerVersion);
  assert.ok((await titleOf(peer).innerText()).includes('Bản của đồng nghiệp'), 'The colleague still sees their own draft');
  await click(peer, 'Lưu bản nháp thành đề mới');
  await waitUntil(async () => await f.db.exam.count({ where: { ownerId: f.ids[1], title: 'Bản của đồng nghiệp (Bản sao phục hồi)' } }) === 1, 'The colleague draft was not saved as their own copy');
  assert.equal((await f.db.exam.findUniqueOrThrow({ where: { id } })).title, 'Bản của chủ đề', 'The owner exam is unchanged by the copy');
  assert.equal(await f.db.exam.count({ where: { ownerId: f.ids[0] } }), 1, 'The owner library has no extra exam');
}));

test('F15 a 60-question exam prints on A4 pages without sideways overflow or questions taller than a page', { timeout: 180000 }, () => flow('F15', async f => {
  await authenticated(f);
  const longExam = document();
  longExam.passages = [{ id: 'p1', title: 'Ngữ liệu dài', content: 'Lan đọc sách ở thư viện. '.repeat(60) }];
  longExam.questions = Array.from({ length: 60 }, (_, i) => ({ id: `q${i + 1}`, type: 'multiple_choice' as const, difficulty: 'thong_hieu' as const, content: `LONG Q${i + 1} tính $\frac{${i + 1}}{2} + x^2$ rồi chọn đáp án đúng cho bài toán số ${i + 1}.`, points: 0.25,
    choices: [{ key: 'A', text: 'Phương án một' }, { key: 'B', text: 'Phương án hai' }, { key: 'C', text: 'Phương án ba' }, { key: 'D', text: 'Phương án bốn' }], correct_answer: 'A', step_by_step_solution: solution, ...(i % 5 === 0 ? { passageId: 'p1' } : {}) }));
  const id = (await f.api('/api/exams', 'POST', { document: longExam })).exam.id as string;
  await openExam(f, id);
  await f.page.locator('.question-item').first().waitFor();
  assert.equal(await f.page.locator('.question-item').count(), 60, 'every question is in the printable sheet');
  await f.page.emulateMedia({ media: 'print' }); await f.page.setViewportSize({ width: 680, height: 1020 }); // the printable width and height of an A4 page after margins
  // A plain string avoids the helper that the TypeScript runner injects into nested functions, which does not exist in the page.
  const sheet = await f.page.evaluate(`(() => {
    const items = Array.from(window.document.querySelectorAll('.question-item'));
    const notAvoided = items.filter(el => { const s = window.getComputedStyle(el); return s.breakInside !== 'avoid' && s.breakInside !== 'avoid-page' && s.pageBreakInside !== 'avoid'; }).length;
    return { count: items.length, notAvoided, tallest: Math.max(...items.map(el => el.getBoundingClientRect().height)), scrollWidth: window.document.documentElement.scrollWidth, innerWidth: window.innerWidth, toolbarVisible: window.document.body.innerText.includes('Trình chiếu') };
  })()`) as { count: number; notAvoided: number; tallest: number; scrollWidth: number; innerWidth: number; toolbarVisible: boolean };
  assert.equal(sheet.notAvoided, 0, 'no question may be split across two pages');
  assert.ok(sheet.tallest < 1000, `the tallest question (${Math.round(sheet.tallest)}px) fits on one page`);
  assert.ok(sheet.scrollWidth <= sheet.innerWidth + 2, `nothing runs past the right margin (${sheet.scrollWidth}px in ${sheet.innerWidth}px)`);
  assert.equal(sheet.toolbarVisible, false, 'editor buttons are hidden when printing');
  const pdf = await f.page.pdf({ preferCSSPageSize: true, printBackground: true });
  const pages = Number(/\/Type\s*\/Pages\s*\/Count\s+(\d+)/.exec(pdf.toString('latin1'))?.[1] ?? 0);
  assert.ok(pdf.subarray(0, 5).toString() === '%PDF-' && pages >= 5 && pages <= 40, `the PDF has a sensible page count (${pages})`);
  // Kept for the owner's eye check of the print layout; regenerated by every run of this flow.
  fs.mkdirSync('tmp/anh-kiem-in', { recursive: true }); fs.writeFileSync('tmp/anh-kiem-in/f15-60-cau.pdf', pdf); await f.page.screenshot({ path: 'tmp/anh-kiem-in/f15-60-cau-print.png', fullPage: true });
}));

/** Names of visible buttons, links and fields that a screen reader or a keyboard user could not tell apart. */
async function unnamedControls(page: Page) {
  return await page.evaluate(`(() => {
    const visible = el => { const box = el.getBoundingClientRect(); const style = window.getComputedStyle(el); return box.width > 0 && box.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'; };
    const nameOf = el => {
      const aria = el.getAttribute('aria-label'); if (aria && aria.trim()) return aria.trim();
      const by = el.getAttribute('aria-labelledby'); if (by) { const text = by.split(' ').map(id => { const node = window.document.getElementById(id); return node ? node.textContent : ''; }).join(' ').trim(); if (text) return text; }
      if (el.labels && el.labels.length) { const text = Array.from(el.labels).map(label => label.textContent).join(' ').trim(); if (text) return text; }
      const title = el.getAttribute('title'); if (title && title.trim()) return title.trim();
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') { const placeholder = el.getAttribute('placeholder'); if (placeholder && placeholder.trim()) return placeholder.trim(); if (el.type === 'submit' || el.type === 'button') return (el.value || '').trim(); return ''; }
      const own = (el.textContent || '').trim(); if (own) return own;
      const img = el.querySelector('img[alt]'); return img ? img.getAttribute('alt').trim() : '';
    };
    const bad = Array.from(window.document.querySelectorAll('button, a[href], input:not([type=hidden]), select, textarea, [role=button]')).filter(visible).filter(el => !nameOf(el)).map(el => el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ').slice(0, 2).join('.') : ''));
    const positive = Array.from(window.document.querySelectorAll('[tabindex]')).filter(el => Number(el.getAttribute('tabindex')) > 0).length;
    return { bad, positive };
  })()`) as { bad: string[]; positive: number };
}

test('F16 main pages have named controls and a student can answer, move and submit with the keyboard alone', { timeout: 180000 }, () => flow('F16', async f => {
  // 1. Names: every visible control of the main pages can be told apart.
  const guest = await f.context(), gp = await guest.newPage(); await gp.goto(origin + '/login'); await gp.getByPlaceholder('name@school.edu.vn').waitFor();
  const findings: string[] = [];
  const audit = async (page: Page, where: string) => { const r = await unnamedControls(page); for (const item of r.bad) findings.push(`${where}: ${item}`); if (r.positive) findings.push(`${where}: ${r.positive} positive tabindex`); };
  await audit(gp, 'login');
  await authenticated(f); const examId = await seedExam(f); const asg = await assignment(f, examId);
  await f.page.getByRole('heading', { name: 'Thư mục và đề thi', exact: true }).waitFor(); await f.page.waitForLoadState('networkidle'); await audit(f.page, 'library');
  await openExam(f, examId); await f.page.waitForLoadState('networkidle'); await audit(f.page, 'editor');
  await f.page.goto(origin + '/teacher/assignments/' + asg.id); await f.page.getByText('Bảng điểm & Bài nộp').waitFor(); await audit(f.page, 'teacher assignment');
  // 2. Keyboard-only student.
  const student = await f.context(), p = await student.newPage(); await p.goto(origin + '/a/' + asg.publicId);
  const name = p.getByPlaceholder('Ví dụ: Nguyễn Văn An'); await name.waitFor(); await audit(p, 'student entry');
  await name.focus(); await p.keyboard.type('Học sinh bàn phím');
  let reached = false; for (let i = 0; i < 8 && !reached; i++) { await p.keyboard.press('Tab'); reached = await p.evaluate(`(window.document.activeElement?.textContent || '').includes('Bắt đầu làm bài')`) as boolean; }
  assert.ok(reached, 'Tab moves from the name field to the start button'); await p.keyboard.press('Enter');
  await p.locator('#q-1').waitFor(); await audit(p, 'student exam');
  // The figure of question 1 is really shown to the student, not just present in the page.
  await p.locator('#q-1 img').first().waitFor();
  assert.ok(await p.locator('#q-1 img').first().evaluate(el => (el as HTMLImageElement).complete && (el as HTMLImageElement).naturalWidth > 0), 'the question figure loaded for the student');
  const focusBy = async (selector: string) => { const target = p.locator(selector).first(); await target.focus(); assert.equal(await target.evaluate(el => el === window.document.activeElement), true, `${selector} can take focus`); };
  // Every control of every question is reachable by Tab, in page order.
  for (let q = 1; q <= 7; q++) {
    const total = await p.locator(`#q-${q} button, #q-${q} input, #q-${q} textarea, #q-${q} select`).count(); if (!total) continue;
    await focusBy(`#q-${q} button, #q-${q} input, #q-${q} textarea, #q-${q} select`);
    const seen = new Set<string>(); for (let i = 0; i < total; i++) { seen.add(await p.evaluate(`(() => { const el = window.document.activeElement; const box = window.document.querySelector('#q-${q}'); return box && box.contains(el) ? Array.from(box.querySelectorAll('button, input, textarea, select')).indexOf(el) : -1; })()`) as unknown as string); await p.keyboard.press('Tab'); }
    assert.ok(!seen.has('-1') && seen.size === total, `question ${q}: Tab visits all ${total} controls (${seen.size} seen)`);
  }
  await focusBy('#q-1 button:has-text("Hai")'); await p.keyboard.press('Enter');
  await focusBy('#q-2 button:has-text("ĐÚNG")'); await p.keyboard.press('Space');
  await focusBy('#q-3 input'); await p.keyboard.type('2');
  await waitUntil(async () => { const raw = JSON.stringify((await f.db.attempt.findFirst({ where: { assignmentId: asg.id } }))?.draft); return raw.includes('"A"') && raw.includes('"2"'); }, 'Keyboard answers were not saved');
  const req = p.waitForResponse(r => /\/api\/public\/attempts\/[^/]+\/submit$/.test(r.url()) && r.request().method() === 'POST');
  await focusBy('button:has-text("Nộp bài thi")'); await p.keyboard.press('Enter'); await focusBy('button:has-text("Nộp bài ngay")'); await p.keyboard.press('Enter');
  assert.equal((await req).status(), 200, 'the keyboard submit reached the server');
  assert.deepEqual(findings, [], 'controls without a name, or a tabindex that breaks the tab order');
}));

test('F17 pasting an exam as text with no AI key still gives a usable preview that can be added to the exam', { timeout: 180000 }, () => flow('F17', async f => {
  await authenticated(f); const id = await seedExam(f); await openExam(f, id);
  // What the server answers when the teacher has no key: the dialog must fall back to the built-in parser.
  await f.page.route('**/api/parse-exam-text', route => route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ success: false, error: 'Hãy thêm hoặc bật khóa Gemini của bạn trong mục Khóa AI.' }) }));
  await addSource(f.page, 'Nhập Word/Ảnh');
  await click(f.page, 'Dán văn bản thô (AI Parser)');
  const text = 'ĐỀ KIỂM TRA 15 PHÚT\nThời gian: 15 phút\n\nCâu 1: Thủ đô của Việt Nam là gì?\nA. Hà Nội\nB. Huế\nC. Đà Nẵng\nD. Cần Thơ\nĐáp án: B\n\nCâu 2: Xét các mệnh đề sau:\na) Số 2 là số nguyên tố. (Đ)\nb) Số 9 là số nguyên tố. (S)\nc) Số 0 là số tự nhiên. (Đ)\nd) Số 1 là số nguyên tố. (S)\n\nCâu 3: Tính 15 + 27.';
  await f.page.getByPlaceholder(/^Dán đoạn văn bản đề thi thô/).fill(text);
  await click(f.page, 'Bắt đầu phân rã thành câu hỏi');
  await f.page.getByText('Kết quả bóc tách (3 câu hỏi)').waitFor();
  await f.page.getByText(/Bóc tách cơ bản 3 câu hỏi/).waitFor();
  await click(f.page, 'Thêm 3 câu hỏi vào Đề thi hiện tại');
  await saveEditor(f.page);
  await waitUntil(async () => (await f.db.examQuestion.count({ where: { examId: id } })) === 10, 'The three imported questions were not saved into the exam', 30000);
  const questions = (await f.api('/api/exams/' + id)).document.questions as { content: string; type: string; correct_answer?: string; choices?: unknown[]; sub_questions?: { isCorrect?: boolean }[] }[];
  const mc = questions.find(q => q.content.startsWith('Thủ đô'))!; assert.equal(mc.type, 'multiple_choice'); assert.equal(mc.correct_answer, 'B'); assert.equal(mc.choices?.length, 4);
  const tf = questions.find(q => q.type === 'true_false_group' && q.content.includes('mệnh đề'))!; assert.deepEqual(tf.sub_questions!.map(s => s.isCorrect), [true, false, true, false]);
  assert.equal(questions.find(q => q.content.startsWith('Tính 15'))!.type, 'short_answer');
  assert.ok(!questions.some(q => q.content.includes('ĐỀ KIỂM TRA 15 PHÚT')), 'the title block is not a question');
}));

test('F18 the presentation moves with the arrow keys, hides the answer until asked, resizes, and never changes the exam', { timeout: 150000 }, () => flow('F18', async f => {
  await authenticated(f); const id = await seedExam(f); await openExam(f, id);
  const before = await f.db.exam.findUniqueOrThrow({ where: { id } });
  await openTool(f.page, 'Xuất'); await f.page.getByRole('menuitem', { name: 'Trình chiếu', exact: true }).click(); await acceptReview(f.page);
  const dialog = f.page.getByRole('dialog', { name: 'Trình chiếu đề' }); await dialog.waitFor();
  const header = () => dialog.locator('strong').first().innerText();
  const shows = async (n: number) => waitUntil(async () => new RegExp(`Câu ${n}/7`).test(await header()), `the presentation shows question ${n}`, 5000);
  await shows(1); assert.ok(!(await dialog.innerText()).includes('Đáp án / hướng dẫn'), 'the answer is hidden at first');
  await f.page.keyboard.press('ArrowRight'); await shows(2);
  await f.page.keyboard.press('ArrowRight'); await shows(3); await f.page.keyboard.press('ArrowLeft'); await shows(2);
  await dialog.getByLabel('Chọn câu trình chiếu').selectOption({ label: '4' }); await shows(4);
  await click(f.page, 'Hiện đáp án / lời giải'); assert.ok((await dialog.innerText()).includes(solution), 'the solution appears when asked');
  await f.page.keyboard.press('ArrowRight'); await shows(5); assert.ok(!(await dialog.innerText()).includes('Đáp án / hướng dẫn'), 'moving on hides the answer again');
  const size = async () => Number(/(\d+)px/.exec(await dialog.locator('[aria-live=polite]').innerText())![1]);
  const start = await size(); await dialog.getByRole('button', { name: 'Chữ lớn hơn', exact: true }).click(); assert.equal(await size(), start + 2);
  await dialog.getByRole('button', { name: 'Chữ nhỏ hơn', exact: true }).click(); assert.equal(await size(), start);
  await f.page.keyboard.press('Escape'); await dialog.waitFor({ state: 'detached' });
  const after = await f.db.exam.findUniqueOrThrow({ where: { id } });
  assert.equal(after.version, before.version); assert.equal(after.title, before.title); assert.equal(await f.db.examQuestion.count({ where: { examId: id } }), 7, 'presenting changes nothing');
}));


test('F19 library search, starred, recent, trash, restore and safe controls', { timeout: 150000 }, () => flow('F19', async f => {
  await authenticated(f);
  const titles = ['KHO_A_Toan', 'KHO_B_NguVan', 'KHO_C_HinhHoc', 'KHO_D_OnTap'];
  const ids: string[] = [];
  for (const title of titles) { const exam = document(); exam.metadata.title = title; exam.questions[0].content = title + '_CONTENT'; ids.push((await f.api('/api/exams', 'POST', { document: exam })).exam.id); }
  await f.page.reload();
  const visibleTitles = () => f.page.locator('h4').filter({ visible: true }).allTextContents();
  const card = (title: string) => f.page.locator('div.group').filter({ has: f.page.getByRole('heading', { name: title, exact: true }) }).first();
  const waitTitles = (expected: string[]) => waitUntil(async () => JSON.stringify((await visibleTitles()).map(x => x.trim()).sort()) === JSON.stringify([...expected].sort()), 'Library contents should match current filter');
  await waitTitles(titles);
  const inventory = await f.page.getByRole('button').filter({ visible: true }).evaluateAll(buttons => buttons.map(button => ({ text: button.textContent?.trim(), title: button.getAttribute('title'), label: button.getAttribute('aria-label'), disabled: button.hasAttribute('disabled') })));
  const checked: string[] = [];
  const search = f.page.getByPlaceholder('Tìm theo tên đề...');
  await search.fill('KHO_C'); await waitTitles([titles[2]]); await search.fill(''); await waitTitles(titles); checked.push('search');
  await card(titles[0]).getByTitle('Gắn sao đề quan trọng', { exact: true }).click();
  await waitUntil(async () => (await f.db.exam.findUniqueOrThrow({ where: { id: ids[0] } })).isStarred, 'Star must persist');
  await menuLink(f.page, 'Đề quan trọng (Gắn sao)'); await waitTitles([titles[0]]); checked.push('starred');
  await menuLink(f.page, 'Đã sửa gần đây'); await waitTitles(titles); checked.push('recent');
  await menuLink(f.page, 'Tất cả đề thi'); await waitTitles(titles);
  await card(titles[1]).getByTitle('Chuyển vào thùng rác', { exact: true }).click();
  await f.page.getByRole('dialog', { name: 'Xác nhận thao tác', exact: true }).getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await waitUntil(async () => Boolean((await f.db.exam.findUniqueOrThrow({ where: { id: ids[1] } })).deletedAt), 'Trash must persist');
  await waitTitles([titles[0], titles[2], titles[3]]);
  await f.page.getByRole('navigation', { name: 'Không gian giáo viên' }).getByRole('link', { name: 'Thùng rác', exact: true }).click(); await waitTitles([titles[1]]);
  await card(titles[1]).getByTitle('Khôi phục đề', { exact: true }).click(); await waitTitles([]);
  assert.equal((await f.db.exam.findUniqueOrThrow({ where: { id: ids[1] } })).deletedAt, null);
  await menuLink(f.page, 'Tất cả đề thi'); await waitTitles(titles); checked.push('trash-and-restore');
  await card(titles[1]).click(); await f.page.getByTitle('Lưu các thay đổi lên máy chủ').first().waitFor();
  await f.page.getByText(titles[1] + '_CONTENT').filter({ visible: true }).first().waitFor(); assert.ok((await f.page.locator('body').innerText()).includes(titles[1] + '_CONTENT'));
  await menuLink(f.page, 'Tất cả đề thi'); await waitTitles(titles); checked.push('open-and-return');
  await f.page.getByTitle('Chế độ xem danh sách', { exact: true }).click(); await f.page.getByRole('table').waitFor();
  await f.page.getByTitle('Chế độ xem thẻ', { exact: true }).click(); await waitTitles(titles); checked.push('grid-and-list');
  const dark = await f.page.locator('html').evaluate(el => el.classList.contains('dark'));
  await f.page.getByTitle('Đổi giao diện Sáng / Tối', { exact: true }).filter({ visible: true }).click();
  await waitUntil(async () => (await f.page.locator('html').evaluate(el => el.classList.contains('dark'))) !== dark, 'Theme toggle must change the page');
  await f.page.getByTitle('Đổi giao diện Sáng / Tối', { exact: true }).filter({ visible: true }).click(); checked.push('theme');
  const [word] = await Promise.all([f.page.waitForEvent('download'), card(titles[0]).getByTitle('Tải file Word (.docx)', { exact: true }).click()]);
  const wordPath = await word.path(); assert.ok(wordPath); const zip = await JSZip.loadAsync(fs.readFileSync(wordPath)); assert.ok((await zip.file('word/document.xml')!.async('string')).includes(titles[0] + '_CONTENT')); checked.push('download-word');
  await card(titles[2]).getByTitle('Đổi tên đề', { exact: true }).click();
  const rename = f.page.locator('form').filter({ has: f.page.getByRole('heading', { name: 'Đổi tên đề thi', exact: true }) });
  await rename.locator('input').fill('KHO_C_Renamed'); await click(f.page, 'Lưu tên mới'); titles[2] = 'KHO_C_Renamed'; await waitTitles(titles); checked.push('rename');
  await card(titles[3]).getByTitle('Nhân bản đề này', { exact: true }).click();
  await waitUntil(async () => (await f.db.exam.count({ where: { ownerId: f.ids[0] } })) === 5, 'Clone must create a separate exam');
  const all = await f.db.exam.findMany({ where: { ownerId: f.ids[0] } }); assert.equal(all.filter(row => row.title.includes(titles[3])).length, 2); checked.push('clone');
  await menuLink(f.page, 'Kho đề'); await f.page.getByRole('heading', { name: 'Thư mục và đề thi', exact: true }).waitFor();
  await f.page.getByRole('button', { name: 'Tạo thư mục', exact: true }).filter({ visible: true }).first().click();
  await f.page.getByPlaceholder('Ví dụ: Khối 12, Học kỳ 1, Ôn thi HSG...').fill('F19 Folder');
  await f.page.locator('form').getByRole('button', { name: 'Tạo thư mục', exact: true }).click();
  await waitUntil(async () => (await f.db.folder.count({ where: { ownerId: f.ids[0], name: 'F19 Folder' } })) === 1, 'Folder creation must persist');
  const folder = await f.db.folder.findFirstOrThrow({ where: { ownerId: f.ids[0], name: 'F19 Folder' } });
  await f.page.getByRole('link', { name: /F19 Folder/ }).filter({ visible: true }).first().waitFor();
  await menuLink(f.page, 'Tất cả đề thi');
  await card(titles[3]).getByTitle('Di chuyển vào thư mục', { exact: true }).click();
  await f.page.locator('div.fixed.inset-0').filter({ visible: true }).last().getByRole('button', { name: 'F19 Folder', exact: true }).click();
  await waitUntil(async () => (await f.db.exam.findUniqueOrThrow({ where: { id: ids[3] } })).folderId === folder.id, 'Move must persist'); checked.push('create-folder-and-move');
  const openClose = async (control: ReturnType<Page['locator']>, label: string) => {
    console.log('F19 opening ' + label);
    await control.click(); const modal = f.page.locator('div.fixed.inset-0').filter({ visible: true }).last(); await modal.waitFor();
    const layer = await modal.elementHandle(); assert.ok(layer);
    const close = modal.locator('button:has(svg.lucide-x)').filter({ visible: true }).last();
    await close.click();
    await layer.waitForElementState('hidden'); checked.push(label);
    console.log('F19 closed ' + label);
  };
  await openClose(f.page.getByTitle('Quản lý Google Gemini API Key', { exact: true }).filter({ visible: true }), 'key-management');
  await openClose(f.page.getByTitle('Bộ não AI Sư Phạm: Xem và dạy các phong cách ra đề cho AI', { exact: true }).filter({ visible: true }), 'memory');
  await menuLink(f.page, 'Ngân hàng câu hỏi');
  await f.page.getByRole('heading', { name: 'Ngân hàng câu hỏi', exact: true }).waitFor();
  assert.equal(await f.page.getByRole('button', { name: /Thêm vào đề|Mở đề để chèn/ }).count(), 0);
  await menuLink(f.page, 'Tất cả đề thi');
  checked.push('bank-management-page-without-editor-actions');
  await openClose(f.page.getByRole('button', { name: 'AI soạn đề', exact: true }), 'generate-open-only');
  await openClose(f.page.getByRole('button', { name: 'Nhập Word / ảnh', exact: true }), 'import-open-only');
  await f.page.getByRole('button', { name: 'Hỏi đáp với Trợ lý AI', exact: true }).filter({ visible: true }).click();
  await f.page.getByRole('heading', { name: 'Hỏi AI', exact: true }).waitFor();
  await f.page.getByRole('button', { name: 'Đóng hỏi đáp AI', exact: true }).click(); checked.push('secretary-open-close-only-no-ai-call');
  await f.page.getByRole('button', { name: 'Tạo đề', exact: true }).click();
  await f.page.getByTitle('Lưu các thay đổi lên máy chủ').first().waitFor();
  await menuLink(f.page, 'Tất cả đề thi');
  for (const id of ids) assert.equal((await f.db.exam.findUniqueOrThrow({ where: { id } })).deletedAt, null);
  checked.push('new-exam-and-return-keeps-originals');
  fs.writeFileSync(reportDir + '/library-ui-' + run + '.json', JSON.stringify({ run, buildId, checkedAt: new Date().toISOString(), inventory, checked, limitation: 'Inventory includes safe controls covered by other pilot flows; this flow does not send AI prompts, submit keys, delete folders or log out.' }, null, 2));
}));


test('F20 import preview corrections survive import, save and reopen', { timeout: 180000 }, () => flow('F20', async f => {
  await authenticated(f); const id = await seedExam(f); await openExam(f, id);
  await f.page.route('**/api/parse-exam-text', route => route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ success: false, error: 'Fixture: use built-in text parser' }) }));
  await addSource(f.page, 'Nhập Word/Ảnh');
  await click(f.page, 'Dán văn bản thô (AI Parser)');
  const sample = fs.readFileSync('docs/huong-dan/DE_MAU_DE_KIEM_TAY.md', 'utf8').split('```text')[1].split('```')[0];
  await f.page.getByPlaceholder(/^Dán đoạn văn bản đề thi thô/).fill(sample + '\nCâu 6: Câu chưa có đáp án để rà lại.');
  await click(f.page, 'Bắt đầu phân rã thành câu hỏi');
  const cards = f.page.getByTestId('import-preview-question');
  await waitUntil(async () => await cards.count() === 6, 'Expected five sample questions and one unanswered question');
  await cards.last().getByText('Chưa có đáp án — kiểm lại', { exact: true }).waitFor();
  await cards.first().getByRole('button', { name: 'Sửa', exact: true }).click();
  await cards.first().getByLabel('Nội dung câu nhập', { exact: true }).fill('F20 nội dung đã sửa');
  await cards.first().getByLabel('Phương án A', { exact: true }).fill('Phương án đã sửa');
  await cards.first().getByLabel('Đáp án câu nhập', { exact: true }).selectOption('A');
  await cards.first().getByRole('button', { name: 'Xong', exact: true }).click();
  await click(f.page, 'Thêm 6 câu hỏi vào Đề thi hiện tại');
  await saveEditor(f.page);
  await waitUntil(async () => (await f.db.examQuestion.count({ where: { examId: id } })) === 13, 'Imported preview changes must be saved');
  const row = await f.db.question.findFirstOrThrow({ where: { ownerId: f.ids[0], content: 'F20 nội dung đã sửa' } });
  assert.equal((row.payload as { correct?: string }).correct, 'A');
  await openExam(f, id);
  const saved = (await f.api('/api/exams/' + id)).document.questions.find((q: { content: string }) => q.content === 'F20 nội dung đã sửa');
  assert.equal(saved.correct_answer, 'A'); assert.equal(saved.choices[0].text, 'Phương án đã sửa');
  await f.page.getByText('F20 nội dung đã sửa', { exact: true }).first().waitFor();
}));


async function localProvider() {
  const keys: string[] = []; let output: unknown = {}; let release: (() => void) | undefined;
  const server = http.createServer((req, res) => {
    req.on('data', () => {}); req.on('end', () => {
      keys.push(String(req.headers['x-goog-api-key'] ?? ''));
      release = () => { if (!res.destroyed) res.setHeader('Content-Type', 'application/json').end(JSON.stringify({ candidates: [{ content: { role: 'model', parts: [{ text: JSON.stringify(output) }] }, finishReason: 'STOP' }] })); };
    });
  });
  await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(3118, '127.0.0.1', resolve); });
  return { keys, respond(value: unknown) { output = value; release?.(); }, async close() { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); } };
}

test('F21 collaborator Copilot uses its own key and preserves the owner concurrent edit', { timeout: 180000 }, () => flow('F21', async f => {
  const mock = await localProvider();
  try {
    await authenticated(f); const id = await seedExam(f); await openExam(f, id);
    await f.db.user.updateMany({ where: { id: { in: f.ids } }, data: { aiDailyLimit: 10 } });
    await f.api('/api/user/keys', 'POST', { apiKey: 'pilot-owner-key-0123456789', label: 'Owner fixture' });
    await f.api('/api/exams/' + id + '/collaborators', 'POST', { email: f.emails[1], role: 'EDITOR' });
    const context = await f.context(), b = await context.newPage(); await login(b, f.emails[1], f.password); await b.waitForURL(origin + '/');
    await f.api('/api/user/keys', 'POST', { apiKey: 'pilot-editor-key-0123456789', label: 'Editor fixture' }, context);
    await b.goto(origin + '/editor/' + id);
    await openCopilot(b);
    await b.locator('#right-copilot-input').fill('Sửa nội dung câu 1 thành câu thử F21'); await b.locator('#right-copilot-input').press('Enter');
    await waitUntil(async () => mock.keys.length === 1, 'Collaborator request must reach local provider');
    assert.deepEqual(mock.keys, ['pilot-editor-key-0123456789']);
    await questionCommandAt(f.page, 0, 'Chỉnh nội dung');
    await f.page.getByLabel('Nội dung câu hỏi', { exact: true }).fill('F21 OWNER NEW CONTENT'); await f.page.locator('.a4-preview-section').getByText('F21 OWNER NEW CONTENT', { exact: false }).first().waitFor();
    await saveEditor(f.page);
    await waitUntil(async () => (await f.api('/api/exams/' + id)).document.questions[0].content === 'F21 OWNER NEW CONTENT', 'Owner edit must persist before provider responds');
    const aiQuestion = { ...document().questions[0], content: 'F21 AI PROPOSAL' };
    mock.respond({ type: 'action', action: 'modify_single_question', targetQuestionIndex: 1, targetQuestionId: 'q1', explanation: 'F21 proposal', modifiedQuestion: aiQuestion });
    const proposal = b.getByRole('region', { name: 'Đề xuất AI chưa áp dụng' });
    await b.getByText('F21 proposal', { exact: true }).waitFor();
    const apply = b.getByRole('region', { name: 'Bảng AI', exact: true }).getByRole('button', { name: 'Áp dụng', exact: true });
    if (await apply.isEnabled()) { await apply.click(); await saveEditor(b); if (await b.getByLabel('Trạng thái lưu', {exact:true}).getAttribute('aria-expanded') !== 'true') await b.getByLabel('Trạng thái lưu', {exact:true}).click(); await b.getByText('Lưu bản nháp thành đề mới', { exact: true }).waitFor(); }
    else { await b.getByText(/Chưa áp dụng để giữ bản mới/).waitFor(); }
    const current = (await f.api('/api/exams/' + id)).document; assert.equal(current.questions[0].content, 'F21 OWNER NEW CONTENT');
    assert.ok(!(await b.locator('body').innerText()).includes('pilot-editor-key-0123456789'));
    assert.ok(!(await b.locator('body').innerText()).includes('pilot-owner-key-0123456789'));
    const logs = await f.db.aiUsageLog.findMany({ where: { userId: { in: f.ids } } }); assert.equal(logs.length, 1); assert.equal(logs[0].userId, f.ids[1]); assert.equal(logs[0].httpStatus, 200);
    void proposal;
  } finally { await mock.close(); }
}));

test('F22 cancel slow AI import and generation without applying or saving results', { timeout: 180000 }, () => flow('F22', async f => {
  f.page.on('requestfailed', request => console.log('F22 network failure', new URL(request.url()).pathname, request.failure()?.errorText));
  const mock = await localProvider();
  try {
    await authenticated(f); const id = await seedExam(f); await openExam(f, id);
    await f.db.user.update({ where: { id: f.ids[0] }, data: { aiDailyLimit: 10 } });
    await f.api('/api/user/keys', 'POST', { apiKey: 'pilot-cancel-key-0123456789', label: 'Cancel fixture' });
    // The fixture adds its fake key through HTTP; reload to refresh the same key state the UI normally updates.
    const keysLoaded = f.page.waitForResponse(response => response.url().endsWith('/api/user/keys') && response.request().method() === 'GET');
    await f.page.reload();
    assert.ok((await (await keysLoaded).json()).keys.some((key: { isActive: boolean }) => key.isActive));
    await addSource(f.page, 'Nhập Word/Ảnh'); await click(f.page, 'Dán văn bản thô (AI Parser)');
    await f.page.getByPlaceholder(/^Dán đoạn văn bản đề thi thô/).fill('Câu 1: Tính hai cộng hai.'); await click(f.page, 'Bắt đầu phân rã thành câu hỏi');
    await waitUntil(async () => mock.keys.length === 1, 'Import waits at provider'); await click(f.page, 'Hủy yêu cầu AI');
    await f.page.getByText('Đã hủy yêu cầu. Chưa thêm câu hỏi nào vào đề.', { exact: true }).waitFor(); assert.equal(await f.page.getByTestId('import-preview-question').count(), 0);
    assert.equal(await f.page.getByRole('button', { name: 'Bắt đầu phân rã thành câu hỏi', exact: true }).isEnabled(), true);
    await click(f.page, 'Đóng');
    await addSource(f.page, 'Sinh bằng AI');
    await f.page.getByPlaceholder('Nhập phần kiến thức muốn soạn; có thể dán yêu cầu cần đạt đã kiểm tra.').fill('Phép cộng số tự nhiên'); await click(f.page, 'Tạo bản nháp');
    await waitUntil(async () => mock.keys.length === 2, 'Generation waits at provider'); await click(f.page, 'Hủy yêu cầu AI');
    await f.page.getByText('Đã hủy yêu cầu. Chưa áp dụng bản nháp nào.', { exact: true }).waitFor(); assert.equal(await f.page.getByRole('button', { name: 'Tạo bản nháp', exact: true }).isEnabled(), true);
    mock.respond({ questions: [] });
    await waitUntil(async () => (await f.db.aiUsageLog.count({ where: { userId: f.ids[0], httpStatus: 499 } })) === 2, 'Both cancelled calls finalized');
    assert.equal(await f.db.examQuestion.count({ where: { examId: id } }), 7); assert.equal(await f.db.question.count({ where: { ownerId: f.ids[0] } }), 7);
  } finally { await mock.close(); }
}));

test('F23 manual edits, undo redo and a retried bank save preserve links without duplicates', { timeout: 180000 }, () => flow('F23', async f => {
  await authenticated(f); const id = await seedExam(f); await openExam(f, id);
  await questionCommandAt(f.page, 0, 'Chỉnh nội dung'); await f.page.getByLabel('Nội dung câu hỏi', { exact: true }).fill('F23 EDITED'); await f.page.getByLabel('Đáp án lựa chọn').selectOption('B'); await f.page.locator('.a4-preview-section').getByText('F23 EDITED', { exact: false }).first().waitFor(); await waitUntil(async () => (await f.page.getByText('Đang lưu thay đổi…').count()) === 0, 'The form should finish applying');
  await f.page.getByRole('button', { name: 'Hoàn tác', exact: true }).click(); await f.page.locator('.a4-preview-section').getByText('PILOT Q1 multiple_choice', { exact: false }).first().waitFor();
  await f.page.getByRole('button', { name: 'Làm lại', exact: true }).click(); await f.page.locator('.a4-preview-section').getByText('F23 EDITED', { exact: false }).first().waitFor();
  await saveEditor(f.page);
  await waitUntil(async () => (await f.api('/api/exams/' + id)).document.questions[0].content === 'F23 EDITED', 'Redo snapshot persisted');
  const q = (await f.api('/api/exams/' + id)).document.questions[0]; assert.equal(q.correct_answer, 'B'); assert.equal(q.passageId, 'p1'); assert.equal(q.status, 'draft'); assert.equal(q.verifiedBy, 'none');
  let dropped = false; const bankBodies: Record<string, unknown>[] = [];
  await f.page.route('**/api/questions', async route => { if (route.request().method() === 'POST') bankBodies.push(route.request().postDataJSON()); if (route.request().method() === 'POST' && !dropped) { dropped = true; await route.fetch(); await route.abort('failed'); } else await route.continue(); });
  const saveBank = async () => {
    const item = await questionMenuItemAt(f.page, 0, 'Lưu bản sao vào ngân hàng');
    await waitUntil(async () => item.isEnabled(), 'Bank save remains available after a lost receipt');
    await item.click();
  };
  await saveBank();
  await waitUntil(async () => dropped, 'Lost receipt leaves retry available');
  await saveBank();
  await f.page.getByText('Đã lưu bản sao riêng vào ngân hàng', { exact: false }).first().waitFor();
  if (bankBodies.length > 1) { const diff = (a: unknown, b: unknown, prefix = ''): string[] => a && b && typeof a === 'object' && typeof b === 'object' ? [...new Set([...Object.keys(a), ...Object.keys(b)])].flatMap(key => diff((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key], prefix + '.' + key)) : JSON.stringify(a) === JSON.stringify(b) ? [] : [prefix]; console.log('F23 retry changed fields', diff(bankBodies[0], bankBodies[1])); }
  assert.equal(await f.db.question.count({ where: { ownerId: f.ids[0], id: { startsWith: 'q_save_' } } }), 1);
}));


test('F24 comment resolution respects roles and private notes download as readable Markdown', { timeout: 180000 }, () => flow('F24', async f => {
  await authenticated(f); const id = await seedExam(f); await openExam(f, id);
  const version = (await f.api('/api/exams/' + id)).document.version;
  await click(f.page, 'Cùng soạn · Góp ý · Lịch sử');
  const panel = f.page.getByRole('region', { name: 'Cộng tác và lịch sử đề', exact: true });
  await panel.getByLabel('Câu được góp ý').waitFor({ state: 'attached' });
  await openDetails(f.page, 'Góp ý');
  await panel.getByLabel('Câu được góp ý').selectOption({ index: 1 });
  const questionId = await panel.getByLabel('Câu được góp ý').inputValue();
  await panel.getByLabel('Nội dung góp ý').fill('F24 OWNER COMMENT'); await panel.getByRole('button', { name: 'Gửi góp ý', exact: true }).click();
  const commentCard = (page: Page, body: string) => page.locator('div.border-t').filter({ has: page.getByText(body, { exact: true }) });
  const ownerCard = commentCard(panel.page(), 'F24 OWNER COMMENT');
  await ownerCard.getByText('F24 OWNER COMMENT', { exact: true }).waitFor();
  assert.match(await ownerCard.innerText(), /Câu 1: PILOT Q1/); assert.ok((await ownerCard.innerText()).includes('phiên bản ' + version));
  const ownerComment = await f.db.examComment.findFirstOrThrow({ where: { examId: id, body: 'F24 OWNER COMMENT' } });
  assert.equal(ownerComment.questionId, questionId); assert.equal(ownerComment.version, version);
  await ownerCard.getByRole('button', { name: 'Đánh dấu đã giải quyết', exact: true }).click();
  await ownerCard.getByText('Đã giải quyết bởi Pilot F24 0', { exact: true }).waitFor();
  assert.ok((await f.db.examComment.findUniqueOrThrow({ where: { id: ownerComment.id } })).resolvedAt);
  await ownerCard.getByRole('button', { name: 'Mở lại', exact: true }).click(); await ownerCard.getByText('Chưa giải quyết', { exact: true }).waitFor();
  assert.equal((await f.db.examComment.findUniqueOrThrow({ where: { id: ownerComment.id } })).resolvedAt, null);

  await f.api('/api/exams/' + id + '/collaborators', 'POST', { email: f.emails[1], role: 'VIEWER' });
  const peer = await f.context(), b = await peer.newPage(); await login(b, f.emails[1], f.password); await b.waitForURL(origin + '/'); await b.goto(origin + '/editor/' + id);
  await click(b, 'Cùng soạn · Góp ý · Lịch sử'); await openDetails(b, 'Góp ý');
  const otherPanel = b.getByRole('region', { name: 'Cộng tác và lịch sử đề', exact: true });
  await otherPanel.getByText('Chỉ xem', { exact: true }).waitFor();
  assert.equal(await otherPanel.getByRole('button', { name: 'Đánh dấu đã giải quyết', exact: true }).count(), 0);
  assert.equal(await otherPanel.getByRole('button', { name: 'Gửi góp ý', exact: true }).count(), 0);
  const forbiddenResolve = () => peer.request.patch(origin + '/api/exams/' + id + '/comments', { headers: { Origin: origin, 'x-examcraft-user': f.ids[1] }, data: { commentId: ownerComment.id, resolved: true } });
  assert.equal((await forbiddenResolve()).status(), 403);

  await f.api('/api/exams/' + id + '/collaborators', 'POST', { email: f.emails[1], role: 'COMMENTER' });
  await b.reload(); await click(b, 'Cùng soạn · Góp ý · Lịch sử'); await otherPanel.getByLabel('Nội dung góp ý').waitFor({ state: 'attached' }); await openDetails(b, 'Góp ý');
  await otherPanel.getByLabel('Câu được góp ý').selectOption({ index: 2 }); await otherPanel.getByLabel('Nội dung góp ý').fill('F24 PEER COMMENT'); await otherPanel.getByRole('button', { name: 'Gửi góp ý', exact: true }).click();
  const ownPeerCard = commentCard(b, 'F24 PEER COMMENT'); await ownPeerCard.getByText('F24 PEER COMMENT', { exact: true }).waitFor();
  assert.equal(await commentCard(b, 'F24 OWNER COMMENT').getByRole('button', { name: 'Đánh dấu đã giải quyết', exact: true }).count(), 0);
  assert.equal((await forbiddenResolve()).status(), 403);
  await ownPeerCard.getByRole('button', { name: 'Đánh dấu đã giải quyết', exact: true }).click(); await ownPeerCard.getByText('Đã giải quyết bởi Pilot F24 1', { exact: true }).waitFor();
  const peerComment = await f.db.examComment.findFirstOrThrow({ where: { examId: id, body: 'F24 PEER COMMENT' } }); assert.ok(peerComment.resolvedAt); assert.equal(peerComment.resolvedById, f.ids[1]);
  // A former commenter must also lose resolution controls on their own older comments.
  await f.api('/api/exams/' + id + '/collaborators', 'POST', { email: f.emails[1], role: 'VIEWER' });
  await b.reload(); await click(b, 'Cùng soạn · Góp ý · Lịch sử'); await otherPanel.getByText('Chỉ xem', { exact: true }).waitFor(); await openDetails(b, 'Góp ý');
  assert.equal(await otherPanel.getByRole('button', { name: 'Mở lại', exact: true }).count(), 0, 'Downgraded viewer must not resolve even their own older comment');
  const deniedReopen = await peer.request.patch(origin + '/api/exams/' + id + '/comments', { headers: { Origin: origin, 'x-examcraft-user': f.ids[1] }, data: { commentId: peerComment.id, resolved: false } });
  assert.equal(deniedReopen.status(), 403);

  await f.page.getByRole('button', { name: 'Đóng Góp ý', exact: true }).click();
  const secret = 'pilot-f24-canary-key-0123456789'; await f.api('/api/user/keys', 'POST', { apiKey: secret, label: 'F24 fixture only' });
  await openAccount(f.page); await f.page.getByTitle('Bộ não AI Sư Phạm: Xem và dạy các phong cách ra đề cho AI').filter({ visible: true }).click(); await click(f.page, 'Dạy AI quy tắc mới');
  await f.page.getByPlaceholder('Ví dụ: Không cho thử ngược nghiệm Casio').fill('F24 PRIVATE MANUAL NOTE');
  await f.page.getByPlaceholder(/^Ví dụ: Khi ra câu hỏi phương trình/).fill('F24 chỉ là ghi chú thử do giáo viên nhập.'); await click(f.page, 'Lưu ghi chú');
  await waitUntil(async () => await f.db.teacherAiMemory.count({ where: { userId: f.ids[0], title: 'F24 PRIVATE MANUAL NOTE' } }) === 1, 'Manual note must persist before export');
  const [download] = await Promise.all([f.page.waitForEvent('download'), click(f.page, 'Tải bản đọc được (.md)')]);
  assert.match(download.suggestedFilename(), /\.md$/); const file = await download.path(); assert.ok(file); const markdown = fs.readFileSync(file, 'utf8');
  for (const expected of ['F24 PRIVATE MANUAL NOTE', 'F24 chỉ là ghi chú thử do giáo viên nhập.', 'Nguồn:', 'Bằng chứng:', 'Điều chưa chắc:']) assert.ok(markdown.includes(expected), 'Markdown must include ' + expected);
  assert.ok(!markdown.includes(secret)); assert.ok(!/apiKey|keyEncrypted|keyIv|keyTag/i.test(markdown));
  writeQaReport(reportDir + '/gen17-f24-' + run + '.json', JSON.stringify({ run, version, ownerResolvedAndReopened: true, viewerResolutionForbidden: true, commenterOnlyOwnResolution: true, manualNoteCreatedThroughUi: true, manualEvidenceFieldAvailable: false, markdownHasRequiredLabels: true, apiKeyCanaryExcluded: true, realAiCalls: false }, null, 2));
}));

test('F25 the teacher issues PINs from the class page, the list is shown once, and a student gets in only with their own PIN', { timeout: 180000 }, () => flow('F25', async f => {
  await authenticated(f); const examId = await seedExam(f);
  const group = (await f.api('/api/groups', 'POST', { name: 'Lớp PIN pilot', studentNames: ['Học sinh Một', 'Học sinh Hai'] })).group;
  await f.page.goto(origin + '/teacher/groups');
  await f.page.locator('div', { hasText: 'Lớp PIN pilot' }).getByRole('button', { name: 'Xem Danh Sách', exact: true }).first().click();
  await f.page.getByText('Chưa có PIN', { exact: true }).first().waitFor();
  await click(f.page, 'Cấp PIN cho cả lớp');
  const panel = f.page.getByRole('status', { name: 'PIN vừa cấp' }); await panel.waitFor();
  const lines = await panel.locator('li').allInnerTexts(); assert.equal(lines.length, 2);
  const pins = new Map(lines.map(line => { const m = /^(.*): (\d{6})$/.exec(line.trim()); assert.ok(m, 'name and a six-digit PIN: ' + line); return [m![1], m![2]] as const; }));
  assert.equal(new Set(pins.values()).size, 2, 'the two PINs differ');
  const students = await f.db.student.findMany({ where: { groupId: group.id }, orderBy: { displayName: 'asc' } });
  assert.ok(students.every(s => s.pinHash && ![...pins.values()].some(pin => JSON.stringify(s).includes(pin))), 'only hashes are stored');
  assert.equal(await f.page.getByText('Đã có PIN', { exact: true }).count(), 2);
  const [download] = await Promise.all([f.page.waitForEvent('download'), click(f.page, 'Tải PIN (CSV)')]);
  const csv = fs.readFileSync((await download.path())!, 'utf8');
  for (const [name, pin] of pins) assert.ok(csv.includes(name) && csv.includes(`="${pin}"`), 'the CSV lists ' + name);
  const asg = (await f.api('/api/assignments', 'POST', { examId, title: 'Pilot bài có PIN', groupId: group.id, identityMode: 'PICK_FROM_LIST', requirePin: true, mode: 'CLASSWORK', durationMinutes: 15, maxAttempts: 3, showResult: 'IMMEDIATE', showSolution: 'AFTER_CLOSE' })).assignment as { id: string; publicId: string };
  const student = await f.context(), page = await student.newPage();
  const enter = async (name: string, pin: string) => { await page.goto(origin + '/a/' + asg.publicId); await page.getByLabel('Chọn tên của em trong danh sách lớp:').selectOption({ label: name }); await page.getByLabel(/PIN/).fill(pin); await click(page, 'Bắt đầu làm bài'); };
  const refused = page.waitForEvent('dialog'); await enter('Học sinh Một', '000000'); await refused; await page.waitForTimeout(700); // the page shows its refusal in an alert that the harness accepts
  assert.equal(await page.getByRole('button', { name: 'Nộp bài', exact: true }).count(), 0, 'a wrong PIN does not open the exam');
  assert.equal(await f.db.attempt.count({ where: { assignmentId: asg.id } }), 0, 'a wrong PIN starts nothing');
  await enter('Học sinh Một', pins.get('Học sinh Một')!); await page.getByRole('button', { name: 'Nộp bài', exact: true }).first().waitFor();
  assert.equal(await f.db.attempt.count({ where: { assignmentId: asg.id } }), 1, 'the right PIN starts the attempt');
  await click(f.page, 'Đã ghi lại, ẩn PIN'); await panel.waitFor({ state: 'detached' });
  await f.page.reload(); await f.page.locator('div', { hasText: 'Lớp PIN pilot' }).getByRole('button', { name: 'Xem Danh Sách', exact: true }).first().click();
  await f.page.getByText('Đã có PIN', { exact: true }).first().waitFor();
  assert.equal(await f.page.getByRole('status', { name: 'PIN vừa cấp' }).count(), 0, 'a PIN is never shown a second time');
  await f.page.getByRole('button', { name: 'Cấp lại PIN', exact: true }).first().click();
  await f.page.getByRole('status', { name: 'PIN vừa cấp' }).waitFor();
  const fresh = (await f.page.getByRole('status', { name: 'PIN vừa cấp' }).locator('li').allInnerTexts()).map(line => /^(.*): (\d{6})$/.exec(line.trim())!);
  assert.equal(fresh.length, 1); assert.notEqual(fresh[0][2], pins.get(fresh[0][1]), 'a reissued PIN is a new one');
  const old = await fetch(origin + `/api/public/assignments/${asg.publicId}/start`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin }, body: JSON.stringify({ studentId: students.find(s => s.displayName === fresh[0][1])!.id, pin: pins.get(fresh[0][1]) }) });
  assert.equal(old.status, 403, 'the replaced PIN no longer works');
}));
