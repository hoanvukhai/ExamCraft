import test from 'node:test';
import JSZip from 'jszip';
import { exportTool, toggleTheme } from './editor-ui';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { chromium } from 'playwright-core';
import { requireTestDatabase } from '../tests/helpers/test-database';
import { loginBucket } from '../src/lib/auth-security';

const origin = process.env.EXAMCRAFT_TEST_ORIGIN || 'http://127.0.0.1:3117';
const report = process.env.EDITOR_REPORT_DIR || 'qa/rebuild-2026-10-28/editor-grouping';

test('editor P0-P8: settings recovery review exports and narrow screens', { timeout: 180000 }, async t => {
  const url = requireTestDatabase();
  assert.equal(new URL(url).pathname, '/examcraft_test_20261022');
  assert.equal((await (await fetch(origin + '/api/health')).json()).isolatedTest, true);
  const db = new PrismaClient({ datasources: { db: { url } }, log: [] });
  assert.equal((await db.$queryRawUnsafe<{ current_database: string }[]>('SELECT current_database()'))[0].current_database, 'examcraft_test_20261022');
  const id = 'frame_' + randomUUID(), email = id + '@example.invalid', password = randomUUID();
  const browser = await chromium.launch({ executablePath: process.env.PILOT_BROWSER_PATH, headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } }), page = await context.newPage();
  const edit = () => page.getByRole('toolbar', { name: 'Công cụ soạn đề', exact: true }).getByRole('button', { name: 'Sửa đề bằng Trợ lý AI', exact: true });
  const fitting = async () => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
  fs.mkdirSync(report, { recursive: true });
  let examId = '';
  try {
    await db.user.create({ data: { id, email, name: 'Giáo viên thử thanh bên', role: 'TEACHER', passwordHash: await bcrypt.hash(password, 10), isActive: true, mustChangePassword: false } });
    const login = await context.request.post(origin + '/api/auth/login', { headers: { Origin: origin }, data: { email, password } }); assert.ok(login.ok());
    const now = new Date().toISOString();
    const created = await context.request.post(origin + '/api/exams', { headers: { Origin: origin }, data: { document: { id: randomUUID(), metadata: { title: 'Đề kiểm thanh bên', schoolName: '', departmentName: '', subject: 'toan', grade: 6 }, questions: [], createdAt: now, updatedAt: now } } });
    assert.ok(created.ok()); examId = (await created.json()).exam.id;


    const openFold = async (text: string) => { const summary = page.locator('summary', {hasText:text}).first(); if (!await summary.evaluate(el => (el.parentElement as HTMLDetailsElement).open)) await summary.click(); };
    const poll = async (check: () => Promise<boolean>) => { const end = Date.now() + 15000; while (Date.now() < end) { if (await check()) return; await new Promise(resolve => setTimeout(resolve,100)); } assert.fail('expected saved state'); };
    await t.test('empty starter, live info preview, optional requirements and template menu', async () => {
      await page.goto(origin + '/editor/' + examId);
      await page.getByRole('region', { name: 'Thêm nội dung đề', exact: true }).waitFor();
      assert.equal(await page.getByText('Bản nháp chưa lưu trên máy này', { exact: true }).count(), 0);
      assert.equal(await page.getByRole('button', { name: 'Lưu đề', exact: true }).count(), 0);
      await edit().click(); await page.getByRole('dialog', { name: 'Cần khóa AI', exact: true }).waitFor();
      await page.getByRole('dialog', { name: 'Cần khóa AI', exact: true }).getByRole('button', { name: 'Đóng', exact: true }).click();
      await page.getByRole('button', { name: 'Thông tin đề', exact: true }).click();
      const settings = page.getByRole('complementary', { name: 'Thông tin đề', exact: true }); await settings.waitFor();
      await settings.getByLabel('Ghi chú cuối đề', { exact: true }).fill('Ghi chú còn khi đổi thẻ');
      await page.getByText('Đang xem thử thông tin chưa áp dụng.', {exact:true}).waitFor();
      assert.equal(JSON.stringify((await db.exam.findUniqueOrThrow({where:{id:examId}})).metadata).includes('Ghi chú còn khi đổi thẻ'),false);
      assert.equal(await page.locator('.a4-preview-section').getByText('Ghi chú còn khi đổi thẻ',{exact:true}).filter({visible:true}).count(),1);
      await page.setViewportSize({width:375,height:812});
      await page.getByRole('navigation',{name:'Chuyển vùng soạn',exact:true}).getByRole('button',{name:'Xem đề',exact:true}).click();
      await page.getByText('Ghi chú còn khi đổi thẻ',{exact:true}).filter({visible:true}).first().waitFor();
      await fitting(); await page.screenshot({path:report+'/live-preview-375.png'});
      await page.getByRole('navigation',{name:'Chuyển vùng soạn',exact:true}).getByRole('button',{name:'Soạn câu',exact:true}).click();
      await page.setViewportSize({width:1440,height:1000});
      if(!await settings.isVisible()) await page.getByRole('button',{name:'Thông tin đề',exact:true}).click();
      assert.equal(await settings.getByLabel('Ghi chú cuối đề',{exact:true}).inputValue(),'Ghi chú còn khi đổi thẻ');
      await settings.getByRole('button',{name:'Đóng thông tin đề',exact:true}).click();
      await page.getByRole('button',{name:'Thêm công cụ',exact:true}).filter({visible:true}).click();
      await page.getByRole('menuitem',{name:'Dùng mẫu / lưu thành mẫu',exact:true}).click();
      await page.getByRole('region',{name:'Dùng và lưu mẫu đề',exact:true}).waitFor();
      await page.getByRole('button',{name:'Đóng mẫu',exact:true}).click();
      await page.getByRole('button',{name: 'Thông tin đề',exact:true}).click();
      assert.equal(await settings.getByLabel('Ghi chú cuối đề', { exact: true }).inputValue(), 'Ghi chú còn khi đổi thẻ');
      await settings.getByRole('button', { name: 'Áp dụng', exact: true }).click();
      await poll(async () => JSON.stringify((await db.exam.findUniqueOrThrow({ where: { id: examId } })).metadata).includes('Ghi chú còn khi đổi thẻ'));
      await settings.getByRole('button', { name: 'Đóng thông tin đề', exact: true }).click();
      await page.getByRole('button', { name: 'Hỏi đáp với Trợ lý AI', exact: true }).filter({ visible: true }).click();
      await page.getByRole('complementary', { name: 'Hỏi đáp với Trợ lý AI', exact: true }).waitFor();
      await page.getByRole('button', { name: 'Thông tin đề', exact: true }).click();
      await page.getByRole('complementary', { name: 'Hỏi đáp với Trợ lý AI', exact: true }).waitFor({ state: 'hidden' });
      await settings.waitFor();
      await settings.getByRole('button', { name: 'Đóng thông tin đề', exact: true }).click();
      for (const [width,height] of [[1440,1000],[1024,800],[375,812]]) for (const dark of [false,true]) {
        await page.setViewportSize({ width,height });
        if (await page.evaluate(() => document.documentElement.classList.contains('dark')) !== dark) await toggleTheme(page);
        await page.getByTitle('Nhấn để đổi tên đề thi').waitFor(); await page.waitForTimeout(220);
        await page.screenshot({ path: report + '/empty-' + width + '-' + (dark?'dark':'light') + '.png' });
      }
    });
    await t.test('new question stays separate, cancel/reopen keeps draft and confirmation inserts exactly once', async () => {
      await page.setViewportSize({width:1440,height:1000});
      await page.getByRole('button',{name:'Tự soạn',exact:true}).click();
      const composer=page.getByRole('region',{name:'Soạn câu mới',exact:true}); await composer.waitFor();
      await composer.getByLabel('Nội dung câu hỏi',{exact:true}).fill('NEW_QUESTION_SEPARATE');
      assert.equal((await context.request.get(origin+'/api/exams/'+examId).then(r=>r.json())).document.questions.length,0);
      await composer.getByRole('button',{name:'Hủy thêm, giữ nháp',exact:true}).click({timeout:6000});
      await page.reload();
      await page.getByRole('button',{name:'Tự soạn',exact:true}).waitFor();
      await page.getByRole('button',{name:'Tự soạn',exact:true}).click();
      assert.equal(await composer.getByLabel('Nội dung câu hỏi',{exact:true}).inputValue(),'NEW_QUESTION_SEPARATE');
      for (const width of [320,375]) {
        await page.setViewportSize({width,height:812}); await fitting();
        assert.equal(await composer.evaluate(el=>el.scrollWidth<=el.clientWidth+1),true,'new question form fits inside phone column');
      }
      await page.screenshot({path:report+'/new-question-375.png'});
      await composer.getByLabel('Dạng câu',{exact:true}).selectOption('essay');
      await composer.getByRole('button',{name:'Thêm vào đề',exact:true}).click();
      await composer.waitFor({state:'hidden',timeout:8000});
      await poll(async()=> (await context.request.get(origin+'/api/exams/'+examId).then(r=>r.json())).document.questions.length===1);
    });
    await t.test('rich document keeps passages; review jumps to a question and explicit Word views differ', async () => {
      await page.setViewportSize({ width:1440,height:1000 });
      const loaded = await context.request.get(origin + '/api/exams/' + examId); const doc = (await loaded.json()).document; delete doc.outline;
      doc.passages = [{ id:'p1',title:'Bài đọc dùng chung',content:'NGU_LIEU_PRESERVED',source:'SOURCE_LOCAL_DOCUMENT' }];
      doc.questions = [{ id:'q1',type:'multiple_choice',difficulty:'thong_hieu',content:'QUESTION_ONE',choices:[{key:'A',text:'CHOICE_CORRECT'},{key:'B',text:'CHOICE_OTHER'}],correct_answer:'A',points:0,passageId:'p1',step_by_step_solution:'PRIVATE_EXPLANATION_ONE' },{ id:'q2',type:'short_answer',difficulty:'thong_hieu',content:'QUESTION_TWO',correct_answer:'2',accepted_answers:['2'],passageId:'p1',step_by_step_solution:'PRIVATE_EXPLANATION_TWO' }];
      const patched = await context.request.patch(origin + '/api/exams/' + examId,{headers:{Origin:origin},data:{document:doc,baseVersion:doc.version}}); assert.ok(patched.ok());
      await page.reload(); await page.getByText('QUESTION_ONE',{exact:true}).filter({visible:true}).first().waitFor({timeout:8000});
      assert.equal(await page.getByRole('region',{name:'Dàn ý đề',exact:true}).getByText('NGU_LIEU_PRESERVED',{exact:true}).filter({visible:true}).count(),1);
      await page.getByRole('region',{name:'Dàn ý đề',exact:true}).getByText('SOURCE_LOCAL_DOCUMENT',{exact:true}).waitFor();
      await page.getByRole('button',{name:'Thêm công cụ',exact:true}).filter({visible:true}).click(); await page.getByRole('menuitem',{name:'Rà soát đề',exact:true}).click();
      const review=page.getByRole('dialog',{name:'Rà soát đề',exact:true}); await review.getByRole('button',{name:'Đến câu 2',exact:true}).first().click();
      assert.equal(await page.locator('#editor-question-q2').evaluate(el=>el===document.activeElement),true);
      for (const label of ['Word – đề','Word – đáp án/barem','Word – lời giải','Word – ma trận']) {
        const download = page.waitForEvent('download'); await exportTool(page,label); const file=await download; const path=await file.path(); assert.ok(path);
        const zip=await JSZip.loadAsync(fs.readFileSync(path)); const xml=await zip.file('word/document.xml')!.async('string');
        if(label==='Word – đề') {assert.ok(xml.includes('QUESTION_ONE'));assert.ok(xml.includes('NGU_LIEU_PRESERVED'));assert.ok(!xml.includes('PRIVATE_EXPLANATION_ONE'));}
        if(label==='Word – lời giải') assert.ok(xml.includes('PRIVATE_EXPLANATION_ONE'));
        if(label==='Word – đáp án/barem') assert.ok(xml.includes('ĐÁP ÁN') || xml.includes('Đáp án'));
        if(label==='Word – ma trận') { assert.ok(xml.includes('BẢNG PHÂN BỔ CÂU HỎI')); assert.ok(xml.includes('<w:tbl')); assert.ok(!xml.includes('QUESTION_ONE')); }
      }
    });
    await t.test('content groups and inline shared passage preserve links, source and question order', async () => {
      const loaded=await context.request.get(origin+'/api/exams/'+examId).then(r=>r.json());
      const order=loaded.document.questions.map((q:{id:string})=>q.id);
      await page.getByRole('button',{name:'+ Thêm phần',exact:true}).click();
      await page.getByRole('button',{name:/^Thao tác Phần mới/}).first().click();
      await page.getByRole('menuitem',{name:'Sửa tiêu đề và lời dẫn',exact:true}).click();
      await page.getByLabel(/^Tiêu đề /).first().fill('PHAN_NOI_DUNG');
      await page.getByRole('button',{name:'Thêm phần',exact:true}).count();
      await page.locator('.a4-preview-section').getByText('PHAN_NOI_DUNG').filter({visible:true}).first().waitFor();
      const shared=page.getByRole('region',{name:'Dàn ý đề',exact:true});
      await shared.getByText('Sửa nội dung chung',{exact:true}).first().click();
      await shared.getByLabel('Nội dung ngữ liệu 1',{exact:true}).fill('NGU_LIEU_PRESERVED_REVISED');
      await poll(async()=>JSON.stringify((await db.exam.findUniqueOrThrow({where:{id:examId}})).metadata).includes('NGU_LIEU_PRESERVED_REVISED'));
      const saved=await context.request.get(origin+'/api/exams/'+examId).then(r=>r.json());
      assert.deepEqual(saved.document.questions.map((q:{id:string})=>q.id),order);
      assert.ok(saved.document.questions.every((q:{passageId:string})=>q.passageId==='p1'));
      assert.equal(saved.document.passages[0].source,'SOURCE_LOCAL_DOCUMENT');
      assert.equal(saved.document.questions[0].points,0);
      assert.ok(JSON.stringify(saved.document.sections).includes('PHAN_NOI_DUNG'));
    });
    await t.test('requirements keep unsaved scope and plan when collapsed and save without changing questions', async () => {
      await page.setViewportSize({width:1440,height:1000});
      const info=page.getByRole('complementary',{name:'Thông tin đề',exact:true});
      const openInfo=async(tab?:string)=>{ if(!await info.isVisible()) await page.getByRole('button',{name:'Thông tin đề',exact:true}).click(); await info.waitFor(); if(tab) await info.getByText(tab,{exact:true}).first().click(); };
      await openInfo('Phạm vi kiến thức');
      await info.getByLabel('Nhập gói kiến thức (.json)',{exact:true}).setInputFiles('tests/fixtures/knowledge-package.json');
      const methods=info.getByLabel('Giới hạn phương pháp / điều chưa học (mỗi dòng một yêu cầu)',{exact:true});
      await methods.fill('METHOD_LIMIT_PRESERVED');
      await info.getByRole('button',{name:'Đóng thông tin đề',exact:true}).click();
      await openInfo('Phạm vi kiến thức');
      assert.equal(await methods.inputValue(),'METHOD_LIMIT_PRESERVED');
      await info.getByRole('button',{name:'Áp dụng',exact:true}).last().click();
      await poll(async()=>JSON.stringify((await db.exam.findUniqueOrThrow({where:{id:examId}})).metadata).includes('METHOD_LIMIT_PRESERVED'));
      await openInfo('Ma trận đề');
      await info.getByRole('button',{name:'Thêm ô mục tiêu',exact:true}).click();
      const count=info.getByLabel('Số câu mục tiêu (có thể 0)',{exact:true});await count.fill('2');
      await info.getByRole('button',{name:'Đóng thông tin đề',exact:true}).click();
      await openInfo('Ma trận đề');
      assert.equal(await count.inputValue(),'2');
      await info.getByRole('button',{name:'Áp dụng',exact:true}).last().click();
      await poll(async()=>JSON.stringify((await db.exam.findUniqueOrThrow({where:{id:examId}})).metadata).includes('examPlan'));
      for(const width of [375,320]) {
        await page.setViewportSize({width,height:812});await fitting();
        await page.screenshot({path:report+'/requirements-'+width+'.png'});
        await page.getByRole('button',{name:'Thêm công cụ',exact:true}).filter({visible:true}).click();
        await page.getByRole('menuitem',{name:'Dùng mẫu / lưu thành mẫu',exact:true}).click();
        const templates=page.getByRole('region',{name:'Dùng và lưu mẫu đề',exact:true});
        await openFold('Lưu cấu hình đề hiện tại thành mẫu riêng');
        if(width===320)assert.equal(await templates.getByLabel('Tên bản mẫu riêng',{exact:true}).inputValue(),'UNSAVED_TEMPLATE_NAME');
        await templates.getByLabel('Tên bản mẫu riêng',{exact:true}).fill('UNSAVED_TEMPLATE_NAME');
        await fitting();assert.equal(await templates.evaluate(el=>el.scrollWidth<=el.clientWidth+1),true,'template panel fits phone');
        await page.screenshot({path:report+'/template-'+width+'.png'});
        await templates.getByRole('button',{name:'Đóng mẫu',exact:true}).click();
      }
      await page.setViewportSize({width:1440,height:1000});
      if(await info.isVisible()) await info.getByRole('button',{name:'Đóng thông tin đề',exact:true}).click();
    });
    await t.test('question drafts remain discoverable and save failures keep retry/download controls', async () => {
      await page.locator('#editor-question-q1').getByTitle('Sửa nội dung câu hỏi thủ công', {exact:true}).click();
      await page.getByLabel('Nội dung câu hỏi', {exact:true}).fill('LOCAL_QUESTION_DRAFT');
      await page.getByRole('button',{name:'Đóng, giữ nháp',exact:true}).click();
      await page.getByText(/^Có [0-9]+ bản soạn dở/).first().waitFor();
      await page.goto(origin + '/'); await page.getByRole('region',{name:'Khôi phục nháp',exact:true}).locator('summary',{hasText:'Nháp câu hỏi trên máy'}).waitFor();
      await page.goto(origin + '/editor/' + examId);
      await page.locator('#editor-question-q1').getByTitle('Sửa nội dung câu hỏi thủ công',{exact:true}).click();
      assert.equal(await page.getByLabel('Nội dung câu hỏi',{exact:true}).inputValue(),'LOCAL_QUESTION_DRAFT');
      await page.getByRole('button',{name:'Đóng, giữ nháp',exact:true}).click();
      await openFold('bản soạn dở');
      await openFold('Nháp câu hỏi trên máy');
      await page.getByRole('button',{name:'Giữ trong kho khôi phục',exact:true}).first().click();
      await page.route('**/api/exams/' + examId, route=>route.request().method()==='PATCH'?route.fulfill({status:503,json:{error:'Lỗi lưu giả lập'}}):route.continue());
      await page.getByTitle('Nhấn để đổi tên đề thi').click();await page.getByLabel('Tên đề thi',{exact:true}).fill('Đề lỗi lưu còn nháp');await page.getByLabel('Tên đề thi',{exact:true}).press('Enter');
      const state=page.getByLabel('Trạng thái lưu',{exact:true});await state.click();
      await page.getByText('Lỗi lưu giả lập',{exact:true}).waitFor();await page.getByRole('button',{name:'Tải bản nháp',exact:true}).waitFor();
      await page.unroute('**/api/exams/' + examId);await page.getByRole('button',{name:'Thử lưu lại',exact:true}).click();
      await poll(async()=> (await db.exam.findUniqueOrThrow({where:{id:examId}})).title==='Đề lỗi lưu còn nháp');
      await state.click();
    });
    await t.test('all question menus, keyboard access, and narrow toolbar fit with settings', async () => {
      const first=page.locator('#editor-question-q1');
      await first.getByRole('button',{name:'Thao tác câu 1',exact:true}).click();
      assert.equal(await page.getByRole('menuitem',{name:'Di chuyển lên',exact:true}).isDisabled(),true);
      await page.getByRole('menuitem',{name:'Nhân bản câu',exact:true}).press('Escape');
      await first.getByRole('button',{name:'AI câu 1',exact:true}).click();
      for(const name of ['Đổi số liệu','Tạo câu tương đương','Thẩm định','Bảo AI sửa']) assert.equal(await page.getByRole('menuitem',{name,exact:true}).count(),1);
      await page.getByRole('menuitem',{name:'Đổi số liệu',exact:true}).press('Escape');
      await first.getByRole('checkbox', {name:'Chọn câu 1',exact:true}).check();
      assert.equal(await page.locator('#editor-question-q2').getByRole('checkbox',{name:'Chọn câu 2',exact:true}).evaluate(el=>getComputedStyle(el).opacity),'1');
      await first.getByRole('checkbox', {name:'Chọn câu 1',exact:true}).uncheck();
      for(const [width,height] of [[1440,1000],[1024,800],[375,812],[320,740],[568,320]]) for(const dark of [false,true]) {
        await page.setViewportSize({width,height}); if(await page.evaluate(()=>document.documentElement.classList.contains('dark'))!==dark)await toggleTheme(page);
        await fitting();
        const toolbar=page.getByRole('toolbar',{name:'Công cụ soạn đề',exact:true});
        const boxes=await toolbar.locator('button').filter({visible:true}).evaluateAll(items=>items.map(el=>el.getBoundingClientRect().top)); assert.ok(Math.max(...boxes)-Math.min(...boxes)<2);
        assert.equal(await toolbar.evaluate(el => {
          const bounds = el.getBoundingClientRect();
          return Array.from(el.querySelectorAll('button')).filter(button => button.getClientRects().length > 0)
            .every(button => { const rect = button.getBoundingClientRect();
              return rect.left >= bounds.left - 1 && rect.right <= bounds.right + 1; });
        }), true, 'Every visible toolbar button fits, including the final menu at 320px');
        await page.waitForTimeout(220); await page.screenshot({path:report+'/rich-'+width+'-'+(dark?'dark':'light')+'.png'});
        await page.getByRole('button',{name: 'Thông tin đề',exact:true}).click();
        const panel=page.getByRole('complementary',{name: 'Thông tin đề',exact:true}); await panel.waitFor();
        await fitting(); await page.screenshot({path:report+'/settings-'+width+'-'+(dark?'dark':'light')+'.png'});
        await panel.getByRole('button',{name:'Đóng thông tin đề',exact:true}).click();
      }
      const after=await db.exam.findUniqueOrThrow({where:{id:examId}}); assert.ok(JSON.stringify(after.metadata).includes('Ghi chú còn khi đổi thẻ'));
    });
    await t.test('losing edit access still allows downloading the pending local question', async () => {
      await page.setViewportSize({width:1440,height:1000});
      await page.locator('#editor-question-q1').getByTitle('Sửa nội dung câu hỏi thủ công',{exact:true}).click();
      await page.getByLabel('Nội dung câu hỏi',{exact:true}).fill('LOCAL_DRAFT_AFTER_ACCESS_LOSS');
      await page.getByRole('button',{name:'Đóng, giữ nháp',exact:true}).click();
      let releaseAccess!: () => void; const accessGate = new Promise<void>(resolve => { releaseAccess = resolve; });
      await page.route('**/api/exams/' + examId, async route => { if (route.request().method() !== 'PATCH') return route.continue(); await accessGate; await route.fulfill({status:403,json:{error:'Quyền sửa đã thay đổi'}}); });
      await page.getByTitle('Nhấn để đổi tên đề thi').click();await page.getByLabel('Tên đề thi',{exact:true}).fill('Không được ghi sau mất quyền');await page.getByLabel('Tên đề thi',{exact:true}).press('Enter');
      await page.locator('#editor-question-q1').getByRole('button',{name:'Thao tác câu 1',exact:true}).click(); releaseAccess();
      await page.getByTitle('Nhấn để đổi tên đề thi').waitFor();await poll(async()=>await page.getByTitle('Nhấn để đổi tên đề thi').isDisabled());
      await page.getByRole('menu',{name:'Thao tác câu 1',exact:true}).waitFor({state:'hidden'});
      await openFold('bản soạn dở'); await openFold('Nháp câu hỏi trên máy');
      assert.equal(await page.getByRole('button',{name:'Tải nháp câu',exact:true}).first().isEnabled(),true);
      assert.notEqual((await db.exam.findUniqueOrThrow({where:{id:examId}})).title,'Không được ghi sau mất quyền');
      await page.unroute('**/api/exams/' + examId);
    });
    await t.test('removing an insertion part keeps the unsaved composer and does not insert a stale question', async () => {
      await page.setViewportSize({ width: 1440, height: 1000 });
      const now = new Date().toISOString();
      const response = await context.request.post(origin + '/api/exams', { headers: { Origin: origin }, data: {
        document: { id: randomUUID(), metadata: { title: 'Guard composer', schoolName: '', departmentName: '',
          subject: 'toan', grade: 6, durationMinutes: 15 }, questions: [], createdAt: now, updatedAt: now },
      } });
      assert.ok(response.ok()); const guardId = (await response.json()).exam.id;
      await page.goto(origin + '/editor/' + guardId);
      const tree = page.getByRole('region', { name: 'Dàn ý đề', exact: true });
      await tree.getByRole('button', { name: '+ Thêm phần', exact: true }).click();
      await tree.getByRole('button', { name: 'Xong', exact: true }).click();
      await tree.getByRole('button', { name: 'Thêm vào Phần mới', exact: true }).click();
      await page.getByRole('menuitem', { name: 'Câu tự soạn', exact: true }).click();
      const composer = page.getByRole('region', { name: 'Soạn câu mới', exact: true });
      await composer.getByLabel('Nội dung câu hỏi', { exact: true }).fill('KEEP_STALE_COMPOSER');
      await tree.getByRole('button', { name: 'Thao tác Phần mới', exact: true }).click();
      await page.getByRole('menuitem', { name: 'Xóa phần', exact: true }).click();
      await page.getByRole('dialog', { name: 'Xóa mục trong đề', exact: true })
        .getByRole('button', { name: 'Bỏ mục, giữ câu', exact: true }).click();
      assert.equal(await composer.getByLabel('Nội dung câu hỏi', { exact: true }).inputValue(), 'KEEP_STALE_COMPOSER');
      assert.equal(await composer.getByRole('button', { name: 'Thêm vào đề', exact: true }).isDisabled(), true);
      assert.equal((await context.request.get(origin + '/api/exams/' + guardId).then(r => r.json())).document.questions.length, 0);
    });
  } finally {
    await browser.close();
    await db.exam.deleteMany({ where: { ownerId: id } }); await db.question.deleteMany({ where: { ownerId: id } });
    await db.auditLog.deleteMany({ where: { OR: [{ actorId: id }, { targetType: 'LoginBucket', targetId: loginBucket(email) }] } });
    await db.user.deleteMany({ where: { id } }); assert.equal(await db.user.count({ where: { id } }), 0);
    fs.writeFileSync(report + '/cleanup.json', JSON.stringify({ removedFixtureUser: true, fixtureOnly: true, buildId: fs.readFileSync('.next/BUILD_ID', 'utf8').trim() }, null, 2));
    await db.$disconnect();
  }
});
