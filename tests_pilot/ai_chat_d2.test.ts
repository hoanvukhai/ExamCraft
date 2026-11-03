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
const report = process.env.CHAT_D2_REPORT_DIR ?? 'qa/rebuild-2026-11-03/ai-chat-d2';
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
async function until(check: () => Promise<boolean>, label: string) {
  const end = Date.now() + 15000;
  while (Date.now() < end) { if (await check()) return; await delay(100); }
  assert.fail(label);
}

test('Chat AI D2: metadata proposals and common undo', { timeout: 240000 }, async t => {
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

    await context.route('**/api/user/keys',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({keys:[{isActive:true,errorCount:0}],poolQuota:{usedToday:0}})}));
    await t.test('accept metadata proposal, save/reload and common undo keep rich content',async()=>{
      await page.route('**/api/exam-copilot',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,result:{type:'action',action:'update_metadata',metadataPatch:{title:'Đề đổi tên qua AI',durationMinutes:75},explanation:'Đổi tên và thời lượng'}})}));
      await page.goto(origin+'/editor/'+examId);await info();await openCopilot(page);
      await page.getByLabel('Yêu cầu cho AI',{exact:true}).fill('Đổi tên đề và thời lượng 75 phút');await page.getByRole('button',{name:'Gửi lệnh',exact:true}).click();
      const proposal=page.getByRole('region',{name:'Đề xuất AI chưa áp dụng',exact:true});await proposal.waitFor();
      assert.equal((await api('/api/exams/'+examId)).document.metadata.title,fixture.metadata.title,'preview is not applied');
      await proposal.getByRole('button',{name:'Áp dụng',exact:true}).click();
      await until(async()=>(await api('/api/exams/'+examId)).document.metadata.title==='Đề đổi tên qua AI','metadata saved');
      assert.equal(await page.getByLabel('Tên đề',{exact:true}).inputValue(),'Đề đổi tên qua AI','idle header follows applied proposal');
      assert.equal(await page.getByLabel('Thời lượng',{exact:true}).inputValue(),'75');
      const saved=(await api('/api/exams/'+examId)).document;assert.deepEqual(saved.questions,fixture.questions);assert.deepEqual(saved.passages,fixture.passages);
      await page.getByRole('button',{name:'Hoàn tác',exact:true}).filter({visible:true}).first().click();
      await until(async()=>(await api('/api/exams/'+examId)).document.metadata.title===fixture.metadata.title,'one common undo restores metadata');
      assert.equal((await api('/api/exams/'+examId)).document.metadata.durationMinutes,60);
      await page.reload();await info();assert.equal(await page.getByLabel('Tên đề',{exact:true}).inputValue(),fixture.metadata.title);
      checks.push('metadata preview/accept/server save/common undo/reload; image/points/solution/passage retained');
    });
    await t.test('newer header edit blocks proposal while retaining its journal',async()=>{
      await openCopilot(page);await page.getByLabel('Yêu cầu cho AI',{exact:true}).fill('Đổi tên');await page.getByRole('button',{name:'Gửi lệnh',exact:true}).click();
      const proposal=page.getByRole('region',{name:'Đề xuất AI chưa áp dụng',exact:true});await proposal.waitFor();
      await page.getByLabel('Tên đề',{exact:true}).fill('Tên người dùng mới sửa');
      await until(async()=>(await api('/api/exams/'+examId)).document.metadata.title==='Tên người dùng mới sửa','manual edit saved');
      assert.equal(await proposal.getByRole('button',{name:'Áp dụng',exact:true}).isDisabled(),true);
      await page.reload();await info();await openCopilot(page);await proposal.waitFor();
      assert.equal(await proposal.getByRole('button',{name:'Áp dụng',exact:true}).isDisabled(),true);
      assert.equal((await api('/api/exams/'+examId)).document.metadata.title,'Tên người dùng mới sửa');
      checks.push('newer manual metadata wins; stale proposal retained across reload');
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
