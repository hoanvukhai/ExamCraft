import test from 'node:test';
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

const origin = 'http://127.0.0.1:3117';
const dbUrl = requireTestDatabase();
assert.equal(new URL(dbUrl).pathname, '/examcraft_test_20261022');
const reportDir = 'qa/rebuild-2026-10-25';
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
async function click(page: Page, name: string | RegExp) { await page.getByRole('button', { name, exact: typeof name === 'string' }).click(); }
async function login(page: Page, email: string, password: string) {
  await page.goto(origin + '/login');
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
    assert.equal(aiCalls, 0, 'Pilot must not call/reserve provider usage');
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
        if (u.origin !== origin || /\/api\/(generate|ocr|parse-|verify|tweak)|\/ai-memory\/analyze/.test(u.pathname)) return route.abort();
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
async function openExam(f: Fixture, id: string) { await f.page.goto(origin + '/editor/' + id); await f.page.getByTitle('Lưu các thay đổi lên máy chủ').waitFor(); }
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
  await p.getByPlaceholder('Ví dụ: Nguyễn Văn An').waitFor();
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
  fs.mkdirSync(reportDir, { recursive: true }); const evidence=JSON.stringify({ run, sourceSha256, buildId, browserVersion, browserExecutable: process.env.PILOT_BROWSER_PATH, requestedFlow: process.env.PILOT_FLOW ?? 'F1-F7,F9-F13', checkedAt: new Date().toISOString(), environment: 'isolatedTest localhost3117 / examcraft_test_20261022', realAiCalls: false, results }, null, 2);
  fs.writeFileSync(`${reportDir}/pilot-results.json`,evidence);fs.writeFileSync(`${reportDir}/pilot-run-${run}.json`,evidence);
  if (error) throw Error(`${id}: ${message}`);
}

test('F1 first login, password change and library', { timeout: 90000 }, () => flow('F1', async f => {
  await login(f.page, f.emails[0], f.password);
  await f.page.getByPlaceholder('Nhập mật khẩu mới').fill(f.password + '-changed'); await f.page.getByPlaceholder('Nhập lại mật khẩu mới').fill(f.password + '-changed');
  await click(f.page, /Đổi mật khẩu.*|Cập nhật.*|Lưu mật khẩu.*/);
  await f.page.waitForURL(origin + '/'); await f.page.getByText('Soạn đề trống mới', { exact: true }).waitFor();
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
  await f.page.getByText('Soạn đề trống mới', { exact: true }).click();
  await f.page.getByTitle('Nhấn để đổi tên đề thi (như Google Docs)').click();
  const titleInput = f.page.locator('header input').first(); await titleInput.fill('Pilot Toán 6 tự soạn'); await titleInput.press('Enter');
  for (const [index, type] of types.entries()) {
    await click(f.page, index === 0 ? 'Thêm câu hỏi mới' : 'Thêm câu hỏi');
    await f.page.getByTitle('Sửa nội dung câu hỏi thủ công', { exact: true }).last().click();
    assert.equal(await f.page.getByRole('button', { name: 'Lưu bản sao vào ngân hàng', exact: true }).last().isDisabled(), true);
    await f.page.getByLabel('Dạng câu', { exact: true }).selectOption(type);
    await f.page.getByLabel('Nội dung câu hỏi', { exact: true }).fill(`PILOT Q${index + 1} ${type}`);
    if (index === 0) {
      await waitUntil(async () => heldCreate, 'First create request must be held');
      releaseCreate();
      await waitUntil(async () => /\/editor\/(?!new(?:\?|$))[^/?]+/.test(new URL(f.page.url()).pathname), 'Creation ACK should select server document');
      assert.equal(await f.page.getByLabel('Nội dung câu hỏi', { exact: true }).inputValue(), 'PILOT Q1 multiple_choice', 'Creation ACK must not close/reset a dirty question form');
    }
    await f.page.getByLabel('Điểm câu', { exact: true }).fill(index === 0 ? '0' : '1');
    if (type === 'multiple_choice') { for (const key of ['A','B','C','D']) await f.page.getByLabel('Phương án ' + key, { exact: true }).fill(key === 'A' ? 'Hai' : key); await f.page.getByLabel('Đáp án lựa chọn').selectOption('A');
      await f.page.getByText('Hình và đồ thị (0)', { exact: true }).click();
      await f.page.getByLabel('Thêm ảnh', { exact: false }).setInputFiles({ name: 'pilot.png', mimeType: 'image/png', buffer: image });
      await f.page.getByLabel('Chú thích hình 1').fill('Ảnh thử');
    }
    if (type === 'true_false_group') { await click(f.page,'Thêm ý'); await f.page.getByLabel('Nội dung ý a').fill('Hai lớn hơn một'); await f.page.getByLabel('Đáp án ý a').selectOption('true'); }
    if (['short_answer','fill_blank'].includes(type)) await f.page.getByLabel('Đáp án chính', { exact: true }).fill('2');
    if (type === 'matching') { for (let i=1;i<=2;i++) { await click(f.page,'Thêm cặp'); await f.page.getByLabel('Vế trái '+i).fill('Vế '+i); await f.page.getByLabel('Vế phải '+i).fill(String(i)); } }
    if (type === 'ordering') await f.page.getByLabel('Thứ tự đúng', { exact: true }).fill('Bước đầu\nBước sau');
    await f.page.getByLabel('Lời giải', { exact: true }).fill(solution); await click(f.page,'Áp dụng câu vào đề');
    await f.page.getByLabel('Nội dung câu hỏi', { exact: true }).waitFor({ state: 'hidden' });
  }
  await f.page.getByText('Phần của đề và ngữ liệu dùng chung',{ exact: true }).click(); await click(f.page,'Thêm ngữ liệu');
  await f.page.getByLabel('Tên ngữ liệu 1').fill('Ngữ liệu thử'); await f.page.getByLabel('Nội dung ngữ liệu 1').fill('Lan đọc sách ở thư viện.');
  await f.page.getByLabel('Ngữ liệu của câu 1').selectOption({ label: 'Ngữ liệu thử' });
  const bankSaved = f.page.waitForResponse(r => r.url().endsWith('/api/questions') && r.request().method() === 'POST');
  await f.page.getByRole('button', { name: 'Lưu bản sao vào ngân hàng', exact: true }).first().click();
  { const bankResponse = await bankSaved; assert.equal(bankResponse.status(), 200, 'POST /api/questions status ' + bankResponse.status()); } // this endpoint answers 200 with { success, question }, not 201
  await f.page.getByText('Đã lưu bản sao riêng vào ngân hàng', { exact: true }).waitFor();
  const bankRows = await f.db.question.findMany({ where: { ownerId: f.ids[0], NOT: { tags: { has: '__workspace_only' } } }, include: { passage: true } });
  assert.equal(bankRows.length, 1);
  assert.equal(bankRows[0].content, 'PILOT Q1 multiple_choice');
  assert.equal(Number(bankRows[0].points), 0);
  assert.equal(bankRows[0].passage?.content, 'Lan đọc sách ở thư viện.');
  await openDetails(f.page, 'Mẫu cá nhân và nguồn tham khảo');
  await openDetails(f.page, 'Lưu cấu hình đề hiện tại thành mẫu riêng');
  await f.page.getByLabel('Tên bản mẫu riêng', { exact: true }).fill('Mẫu pilot riêng');
  const templateSaved = f.page.waitForResponse(r=>r.url().endsWith('/api/templates') && r.request().method()==='POST');
  await click(f.page,'Lưu bản mẫu riêng'); { const templateResponse = await templateSaved; assert.equal(templateResponse.status(), 201, 'POST /api/templates status ' + templateResponse.status() + ' ' + (await templateResponse.text()).slice(0, 160)); }
  await f.page.getByTitle('Lưu các thay đổi lên máy chủ').click();
  await waitUntil(async () => { const rows = await f.db.exam.findMany({ where: { ownerId: f.ids[0] } }); return rows.some(r => r.title === 'Pilot Toán 6 tự soạn' && JSON.stringify(r.metadata).includes('PILOT Q7')); }, 'All seven questions not saved');
  const exam = await f.db.exam.findFirstOrThrow({ where: { ownerId: f.ids[0] } });
  await f.page.goto(origin + '/'); await openExam(f,exam.id);
  const saved = (await f.api('/api/exams/'+exam.id)).document as Exam;
  assert.deepEqual(saved.questions.map(q=>q.type),types); assert.equal(saved.questions[0].points,0); assert.equal(saved.questions[0].figures?.length,1); assert.equal(saved.passages?.[0].content,'Lan đọc sách ở thư viện.');
  await f.page.getByText('PILOT Q7 ordering', { exact: true }).filter({visible:true}).first().waitFor();
}));

test('F3 answer views, shuffle, Word and print', { timeout: 120000 }, () => flow('F3', async f => {
  await authenticated(f); await openExam(f,await seedExam(f,'ngu_van'));
  const review = f.page.locator('details').filter({ has: f.page.locator('summary', { hasText: 'Rà soát đề' }) });
  await review.locator('summary').click();
  assert.ok((await review.innerText()).includes('Tổng điểm: 6,00'));
  assert.ok(!(await review.innerText()).includes(solution));
  await click(f.page, 'Trình chiếu');
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
  const [downloaded] = await Promise.all([f.page.waitForEvent('download',{timeout:60000}),f.page.getByTitle('Tải file Word (.docx) chuẩn công thức OMML').click()]); const file = await downloaded.path(); assert.ok(file); const bytes=fs.readFileSync(file); assert.equal(bytes.subarray(0,2).toString(),'PK'); assert.ok(bytes.length>2000);
  const zip = await JSZip.loadAsync(bytes); const xml = await zip.file('word/document.xml')!.async('string');
  for (let i=1;i<=7;i++) assert.ok(xml.includes('PILOT Q'+i), 'Word missing question '+i);
  assert.ok(Object.keys(zip.files).some(n=>n.startsWith('word/media/')), 'Word missing image');
  await f.page.evaluate(()=>{(window as unknown as {pilotPrinted:number}).pilotPrinted=0;window.print=()=>{(window as unknown as {pilotPrinted:number}).pilotPrinted++;};});
  await f.page.getByTitle('In đề thi hoặc xuất ra PDF').click(); assert.equal(await f.page.evaluate(()=>(window as unknown as {pilotPrinted:number}).pilotPrinted),1);
  await f.page.getByTitle('Trộn đề thành 4 mã đề kèm ma trận đáp án').click(); await f.page.getByRole('heading',{name:/Trộn Đề Thi/}).waitFor(); assert.ok((await f.page.locator('body').innerText()).includes('101'));
  const buttons=f.page.getByTitle('Tải file Word của mã này'); assert.equal(await buttons.count(),4);
  for(let i=0;i<4;i++){ console.log('F3 variant '+i+' download requested'); const [d]=await Promise.all([f.page.waitForEvent('download',{timeout:20000}),buttons.nth(i).click()]); console.log('F3 variant '+i+' downloaded'); const filepath=await d.path(); assert.ok(filepath);const z=await JSZip.loadAsync(fs.readFileSync(filepath));const x=await z.file('word/document.xml')!.async('string'); for(let q=1;q<=7;q++)assert.ok(x.includes('PILOT Q'+q));assert.ok(Object.keys(z.files).some(n=>n.startsWith('word/media/'))); }
  await click(f.page,'Đóng cửa sổ');
  await click(f.page,'Song song'); await f.page.getByRole('heading',{name:'ĐỀ VÀ ĐÁP ÁN SONG SONG',exact:true}).waitFor();
  const rows=f.page.getByRole('heading',{name:'ĐỀ VÀ ĐÁP ÁN SONG SONG',exact:true}).locator('..').locator('.question-item'); assert.equal(await rows.count(),7);
  for(let i=0;i<7;i++){ const row=rows.nth(i);assert.equal(await row.locator(':scope > div').count(),2);assert.ok((await row.innerText()).includes('PILOT Q'+(i+1)));assert.ok((await row.innerText()).includes(solution)); }
  const passage = f.page.locator('[data-parallel-passage="p1"]');
  assert.equal(await passage.count(),1); assert.ok((await passage.innerText()).includes('Lan đọc sách ở thư viện.'));
  const [parallelDownload] = await Promise.all([f.page.waitForEvent('download'), f.page.getByRole('button', { name: 'Tải file Word (.docx)', exact: true }).click()]);
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
  assert.equal(await f.page.locator('[data-parallel-passage]').count(),1);
  assert.ok((await f.page.locator('[data-parallel-passage]').innerText()).includes('Con sông quê tôi'));
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
  const peer=await f.context(),other=await peer.newPage();await login(other,f.emails[1],f.password);await other.waitForURL(origin+'/');await other.goto(origin+'/editor/'+id);const title=other.getByTitle('Nhấn để đổi tên đề thi (như Google Docs)');await title.waitFor();assert.equal(await title.isDisabled(),true,'Viewer must not edit');
  await f.page.getByLabel('Email giáo viên').fill(f.emails[1]);await f.page.getByLabel('Quyền cộng tác').selectOption('EDITOR');await click(f.page,'Cấp quyền');await waitUntil(async()=>await f.db.examCollaborator.count({where:{examId:id,userId:f.ids[1],role:'EDITOR',revokedAt:null}})===1,'Editor grant failed');await other.reload();await other.getByTitle('Nhấn để đổi tên đề thi (như Google Docs)').click();const input=other.locator('header input').first();await input.fill('Pilot đồng nghiệp sửa');await input.press('Enter');
  await waitUntil(async()=> (await f.db.exam.findUniqueOrThrow({where:{id}})).title==='Pilot đồng nghiệp sửa','Collaborator save failed');
  await click(f.page,'Thu hồi quyền');await waitUntil(async()=>await f.db.examCollaborator.count({where:{examId:id,userId:f.ids[1],revokedAt:null}})===0,'Revoke failed');
  const denied=await peer.request.get(origin+'/api/exams/'+id);assert.ok([403,404].includes(denied.status()));await other.reload();await waitUntil(async()=>{const b=other.getByTitle('Nhấn để đổi tên đề thi (như Google Docs)');return !(await b.isVisible()) || await b.isDisabled();},'Revoked editor controls remain enabled');assert.ok(!(await other.locator('body').innerText()).includes('PILOT Q1 multiple_choice'));assert.equal((await f.db.exam.findUniqueOrThrow({where:{id}})).title,'Pilot đồng nghiệp sửa');
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
  await f.page.getByTitle('Sửa nội dung câu hỏi thủ công', { exact: true }).first().click();
  await f.page.getByLabel('Nội dung câu hỏi', { exact: true }).fill('SOURCE_CHANGED_AFTER_ASSIGN');
  await click(f.page, 'Áp dụng câu vào đề');
  await f.page.getByLabel('Nội dung câu hỏi', { exact: true }).waitFor({ state: 'hidden' });
  await f.page.getByTitle('Lưu các thay đổi lên máy chủ').click();
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
    await f.page.getByTitle('Nhấn để đổi tên đề thi (như Google Docs)').click();
    const input=f.page.locator('header input').first(); await input.fill(value); await input.press('Enter');
  };
  const baseline = await f.db.exam.findUniqueOrThrow({where:{id}});
  await f.owner.setOffline(true); await rename('Pilot offline giữ nháp');
  await f.page.getByText('Mất kết nối — đang giữ bản nháp trên máy',{exact:true}).waitFor();
  assert.equal((await f.db.exam.findUniqueOrThrow({where:{id}})).version,baseline.version);
  assert.ok(await f.page.evaluate(()=>Object.values(localStorage).some(value=>value.includes('Pilot offline giữ nháp'))));
  await f.owner.setOffline(false);
  await waitUntil(async()=>(await f.db.exam.findUniqueOrThrow({where:{id}})).title==='Pilot offline giữ nháp','Reconnect did not save offline edit');
  await f.page.reload(); await f.page.getByTitle('Nhấn để đổi tên đề thi (như Google Docs)').filter({hasText:'Pilot offline giữ nháp'}).waitFor();
  await f.owner.setOffline(true); await rename('Pilot offline cần giữ riêng');
  await f.page.getByText('Mất kết nối — đang giữ bản nháp trên máy',{exact:true}).waitFor();
  const remote=(await f.api('/api/exams/'+id)).document as Exam;
  remote.metadata.title='Pilot bản mới từ phiên khác';
  await f.api('/api/exams/'+id,'PATCH',{baseVersion:remote.version,document:remote});
  const remoteVersion=(await f.db.exam.findUniqueOrThrow({where:{id}})).version;
  await f.owner.setOffline(false);
  await f.page.getByRole('button',{name:'Lưu bản nháp thành đề mới',exact:true}).waitFor();
  assert.ok((await f.page.getByTitle('Nhấn để đổi tên đề thi (như Google Docs)').innerText()).includes('Pilot offline cần giữ riêng'));
  assert.equal((await f.db.exam.findUniqueOrThrow({where:{id}})).version,remoteVersion);
  await click(f.page,'Lưu bản nháp thành đề mới');
  await waitUntil(async()=>await f.db.exam.count({where:{ownerId:f.ids[0],title:'Pilot offline cần giữ riêng (Bản sao phục hồi)'}})===1,'Conflicting draft copy was not saved');
  assert.equal((await f.db.exam.findUniqueOrThrow({where:{id}})).title,'Pilot bản mới từ phiên khác');
  assert.equal(await f.db.exam.count({where:{ownerId:f.ids[0]}}),2);
}));

test('F10 switching accounts in one browser keeps a local draft private to its owner and recoverable', { timeout: 150000 }, () => flow('F10', async f => {
  await authenticated(f); const id = await seedExam(f); await openExam(f, id);
  const titleOf = () => f.page.getByTitle('Nhấn để đổi tên đề thi (như Google Docs)');
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
  await f.owner.setOffline(true);
  await f.page.getByTitle('Nhấn để đổi tên đề thi (như Google Docs)').click(); const input = f.page.locator('header input').first(); await input.fill(offlineTitle); await input.press('Enter');
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
