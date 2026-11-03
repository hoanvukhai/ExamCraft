import http from 'node:http';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { chromium } from 'playwright-core';
import { requireTestDatabase } from '../tests/helpers/test-database';
import { loginBucket } from '../src/lib/auth-security';
import { openCopilot, openInfoPanel, selectQuestion, toggleTheme } from './editor-ui';

const origin = process.env.EXAMCRAFT_TEST_ORIGIN ?? 'http://127.0.0.1:3123';
const report = process.env.CHAT_COMPLETION_REPORT_DIR ?? 'qa/rebuild-2026-11-03/ai-chat-completion';
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
async function until(check: () => Promise<boolean>, label: string) {
  const end = Date.now() + 15000;
  while (Date.now() < end) { if (await check()) return; await delay(100); }
  assert.fail(label);
}

test('Chat AI completion: actual API, local provider, bootstrap and atomic edits', { timeout: 240000 }, async t => {
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
  let mode='clarify';let bulkQuestions:unknown[]=[];let providerCalls=0;let wrongKey=false;const payloadSizes:number[]=[];
  const fakeKey='completion-fixture-key-0123456789abcdef';
  const reply=(value:unknown,finishReason='STOP')=>({candidates:[{content:{role:'model',parts:[{text:typeof value==='string'?value:JSON.stringify(value)}]},finishReason}]});
  const generated={title:'Đề luyện tập',passages:[{id:'p-shared',title:'Dữ liệu',content:'NGU_LIEU_GENERATED'}],parts:[{id:'part',title:'',questionIds:['qa','qb']}],questions:['qa','qb'].map(q=>({id:q,type:'short_answer',difficulty:'thong_hieu',content:'Nội dung '+q,passageId:'p-shared',correct_answer:'2',accepted_answers:['2'],points:5,step_by_step_solution:'Lời giải '+q}))};
  const planned={type:'plan',facts:{subject:'toan',grade:9,durationMinutes:60,academicYear:'2026 - 2027',targetExam:{kind:'entrance',targetGrade:10,year:2026,locality:'Hà Nội',branch:'không chuyên'}},plan:{subject:'toan',grade:9,topic:'Ôn tập lớp 9',durationMinutes:60,numShortAnswer:2,totalPoints:10,assessmentMode:'scored'}};
  const provider=http.createServer((request,response)=>{
    const chunks:Buffer[]=[];request.on('data',chunk=>chunks.push(chunk));request.on('end',()=>{
      if(request.method==='GET'){response.setHeader('content-type','application/json');response.end(JSON.stringify({models:[{name:'models/gemini-3.5-flash',supportedGenerationMethods:['generateContent']}]}));return;}
      providerCalls++;if(String(request.headers['x-goog-api-key']??'')!==fakeKey)wrongKey=true;
      let body:{systemInstruction?:{parts?:{text?:string}[]}}={};try{body=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{/* Report invalid request through a bad output. */}
      const system=body.systemInstruction?.parts?.map(p=>p.text??'').join(' ')??'';
      let value:unknown;
      if(system.includes('Chỉ plan, không sinh câu'))value=mode==='clarify'?{type:'clarification',facts:{subject:'toan',grade:9,durationMinutes:60,targetExam:{kind:'entrance',targetGrade:10,locality:'Hà Nội',branch:'không chuyên'}},message:'Bạn muốn dùng năm nào?',quickOptions:['2026','2027']}:planned;
      else if(system.includes('Chỉ tạo đúng môn'))value=generated;
      else if(mode==='replace-existing')value={type:'action',action:'create_exam',generationPlan:planned.plan,metadataPatch:{title:'Đề thay mới đã xác định'},explanation:'Tạo lại cả đề'};
      else if(mode==='bulk')value={type:'action',action:'modify_questions',metadataPatch:{title:'Đề và hai câu được sửa cùng lần'},modifiedQuestions:bulkQuestions,explanation:'Đổi hai câu và tên đề'};
      else value={type:'action',action:'update_metadata',metadataPatch:{title:'Đề nhiều ảnh đã đổi tên'},explanation:'Chỉ đổi tên'};
      response.setHeader('content-type','application/json');response.end(JSON.stringify(mode==='truncated'?reply('{"type":','MAX_TOKENS'):reply(value)));
    });
  });
  page.on('request',request=>{if(new URL(request.url()).pathname==='/api/exam-copilot')payloadSizes.push(Buffer.byteLength(request.postData()??''));});
  fs.mkdirSync(report, { recursive: true });
  try {
    await new Promise<void>((resolve,reject)=>{provider.once('error',reject);provider.listen(3118,'127.0.0.1',resolve);});
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

    await t.test('blank bootstrap never creates an exam; help and missing keys make zero AI calls',async()=>{
      const before=await db.exam.count({where:{ownerId:id}});
      await page.goto(origin+'/editor/new');await page.getByRole('heading',{name:'Bạn muốn soạn đề gì?',exact:true}).waitFor();await delay(5500);
      assert.equal(await db.exam.count({where:{ownerId:id}}),before);assert.equal(page.url(),origin+'/editor/new');assert.equal(await page.getByLabel('Lớp của đề',{exact:true}).count(),0);
      const input=page.getByLabel('Yêu cầu tạo đề',{exact:true});await input.fill('Cách xuất Word');await page.getByRole('button',{name:'Gửi yêu cầu',exact:true}).click();
      await until(async()=>await page.getByLabel('Lịch sử trò chuyện',{exact:true}).innerText().then(text=>text.includes('WORD')),'local guide answer');assert.equal(providerCalls,0);
      await page.getByRole('button',{name:'Yêu cầu mới',exact:true}).click();await input.fill('Tạo đề vào 10 Hà Nội môn Toán không chuyên');await page.getByRole('button',{name:'Gửi yêu cầu',exact:true}).click();
      await page.getByText('Cần thêm hoặc bật khóa AI',{exact:false}).waitFor();assert.equal(providerCalls,0);assert.equal(await input.inputValue(),'Tạo đề vào 10 Hà Nội môn Toán không chuyên');
      checks.push('bootstrap idle/no fake subject or grade; local help and missing key make zero calls');
    });
    await t.test('clarification survives reload; a full candidate costs two calls and creates no record before accept',async()=>{
      assert.equal((await context.request.post(origin+'/api/user/keys',{headers:{Origin:origin},data:{apiKey:fakeKey,label:'Fixture only'}})).ok(),true);
      const keysReady=page.waitForResponse(response=>new URL(response.url()).pathname==='/api/user/keys'&&response.request().method()==='GET');await page.reload();await (await keysReady).finished();await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));const input=page.getByLabel('Yêu cầu tạo đề',{exact:true});await input.waitFor();
      await page.getByRole('button',{name:'Gửi yêu cầu',exact:true}).click();await page.getByLabel('Tự nhập câu trả lời',{exact:true}).waitFor();assert.equal(providerCalls,1);
      await page.getByLabel('Tự nhập câu trả lời',{exact:true}).fill('Năm 2026');await delay(200);await page.reload();await page.getByLabel('Tự nhập câu trả lời',{exact:true}).waitFor();assert.equal(await page.getByLabel('Tự nhập câu trả lời',{exact:true}).inputValue(),'Năm 2026');assert.equal(providerCalls,1);
      mode='plan';const before=await db.exam.count({where:{ownerId:id}});await page.getByRole('button',{name:'Trả lời',exact:true}).click();await page.getByRole('region',{name:'Đề xuất trọn đề',exact:true}).waitFor();
      assert.equal(providerCalls,3,'one planner and one generation call for this reply');assert.equal(await db.exam.count({where:{ownerId:id}}),before);assert.equal(page.url(),origin+'/editor/new');
      await page.screenshot({path:report+'/full-candidate-before-accept.png',fullPage:true});
      await page.getByRole('button',{name:'Nhận đề',exact:true}).click();await until(async()=>page.url()!==origin+'/editor/new','first accepted document saved');
      examId=new URL(page.url()).pathname.split('/').at(-1)!;const doc=(await api('/api/exams/'+examId)).document;
      assert.equal(doc.metadata.grade,9);assert.equal(doc.metadata.targetExam.targetGrade,10);assert.equal(doc.metadata.durationMinutes,60);assert.equal(doc.metadata.academicYear,'2026 - 2027');assert.match(doc.metadata.notes,/chưa đối chiếu/);assert.equal(doc.questions.length,2);assert.equal(doc.questions[0].passageId,doc.passages[0].id);assert.equal(doc.questions[0].correct_answer,'2');
      await page.getByRole('button',{name:'Hoàn tác',exact:true}).filter({visible:true}).first().click();await until(async()=>(await api('/api/exams/'+examId)).document.questions.length===0,'one undo removes the accepted whole content');
      await page.getByRole('button',{name:'Làm lại',exact:true}).filter({visible:true}).first().click();await until(async()=>(await api('/api/exams/'+examId)).document.questions.length===2,'one redo restores the accepted whole content');
      await page.reload();await info();await openCopilot(page);await page.getByLabel('Lịch sử trò chuyện',{exact:true}).waitFor();assert.ok((await page.getByLabel('Lịch sử trò chuyện',{exact:true}).innerText()).includes('Hà Nội'));
      assert.ok(!JSON.stringify(doc).includes('conversationId'),'private transcript never goes into Exam');
      checks.push('real API: 1 clarification + 2 full-generation calls; one accept, linked passages/answers; chat follows saved ID');
    });
    await t.test('multiple selected questions and metadata apply atomically; common undo restores the whole package',async()=>{
      const doc=(await api('/api/exams/'+examId)).document;bulkQuestions=doc.questions.map((q:Record<string,unknown>)=>({...q,content:'Đã sửa '+q.content,points:99}));mode='bulk';
      await selectQuestion(page,doc.questions[0].id);await page.locator('.a4-preview-section [data-question-id="'+doc.questions[1].id+'"] b').first().click({modifiers:['Control']});await openCopilot(page);
      await page.getByLabel('Yêu cầu cho AI',{exact:true}).fill('Sửa đúng hai câu đang chọn và đổi tên đề');await page.getByRole('button',{name:'Gửi lệnh',exact:true}).click();
      const proposal=page.getByRole('region',{name:'Đề xuất AI chưa áp dụng',exact:true});await proposal.waitFor();await proposal.getByRole('button',{name:'Áp dụng',exact:true}).click();await until(async()=>(await api('/api/exams/'+examId)).document.metadata.title==='Đề và hai câu được sửa cùng lần','atomic proposal saved');
      const saved=(await api('/api/exams/'+examId)).document;assert.ok(saved.questions.every((q:{content:string})=>q.content.startsWith('Đã sửa ')));assert.deepEqual(saved.questions.map((q:{points:number})=>q.points),[5,5]);
      await page.getByRole('button',{name:'Hoàn tác',exact:true}).filter({visible:true}).first().click();await until(async()=>(await api('/api/exams/'+examId)).document.metadata.title===doc.metadata.title,'common undo saved');
      assert.deepEqual((await api('/api/exams/'+examId)).document.questions,doc.questions);checks.push('multiple IDs + metadata one proposal, protected scores, one undo restores all');
    });
    await t.test('cloned tab forks its writer and cannot overwrite the original composer',async()=>{
      await page.getByLabel('Yêu cầu cho AI',{exact:true}).fill('Bản nháp tab gốc');await delay(200);
      const popup=page.waitForEvent('popup');await page.evaluate(url=>{window.open(url,'_blank');},origin+'/editor/'+examId);const clone=await popup;await clone.waitForLoadState();await openInfoPanel(clone);await openCopilot(clone);await clone.getByLabel('Yêu cầu cho AI',{exact:true}).waitFor();
      const first=await page.evaluate(()=>sessionStorage.getItem('examcraft:chat-writer')),second=await clone.evaluate(()=>sessionStorage.getItem('examcraft:chat-writer'));assert.notEqual(first,second);
      await clone.getByLabel('Yêu cầu cho AI',{exact:true}).fill('Bản nháp tab nhân đôi');await delay(200);await page.reload();await info();await openCopilot(page);assert.equal(await page.getByLabel('Yêu cầu cho AI',{exact:true}).inputValue(),'Bản nháp tab gốc');await clone.close();checks.push('clone tab forks writer; original draft survives');
    });
    await t.test('archive and import restore a private conversation without calling AI or replacing the exam',async()=>{
      const calls=providerCalls;const before=(await api('/api/exams/'+examId)).document;
      const composer=page.getByLabel('Yêu cầu cho AI',{exact:true});await composer.fill('Bản dự phòng cần giữ');await delay(300);
      const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Tải hội thoại',exact:true}).click()]);const file=await download.path();assert.ok(file);
      await page.getByRole('button',{name:'Yêu cầu mới',exact:true}).click();await until(async()=>await composer.inputValue()==='','new request clears only the new branch');
      await page.getByText('Hội thoại đã cất và bản dự phòng',{exact:true}).click();
      await page.getByLabel('Nhập bản dự phòng hội thoại',{exact:true}).setInputFiles(file);
      await until(async()=>await composer.inputValue()==='Bản dự phòng cần giữ','import restores composer');
      await page.reload();await info();await openCopilot(page);assert.equal(await page.getByLabel('Yêu cầu cho AI',{exact:true}).inputValue(),'Bản dự phòng cần giữ');
      assert.equal(providerCalls,calls);assert.equal((await api('/api/exams/'+examId)).document.version,before.version);checks.push('private archive/import restores composer after reload, no provider calls or exam mutation');
    });
    await t.test('whole replacement preserves teacher headers, supports an explicit rename and one undo',async()=>{
      const before=(await api('/api/exams/'+examId)).document;before.metadata.schoolName='Trường giả giữ thông tin';
      assert.equal((await context.request.patch(origin+'/api/exams/'+examId,{headers:{Origin:origin},data:{document:before,baseVersion:before.version}})).ok(),true);
      await page.reload();await info();await openCopilot(page);mode='replace-existing';const calls=providerCalls;
      await page.getByLabel('Yêu cầu cho AI',{exact:true}).fill('Tạo lại cả đề và đổi tên như yêu cầu, giữ thông tin trường');await page.getByRole('button',{name:'Gửi lệnh',exact:true}).click();const proposal=page.getByRole('region',{name:'Đề xuất AI chưa áp dụng',exact:true});await proposal.waitFor();assert.equal(providerCalls,calls+2);assert.equal((await api('/api/exams/'+examId)).document.metadata.title,before.metadata.title);
      await proposal.getByRole('button',{name:'Áp dụng',exact:true}).click();await until(async()=>(await api('/api/exams/'+examId)).document.metadata.title==='Đề thay mới đã xác định','whole replacement saved');const saved=(await api('/api/exams/'+examId)).document;assert.match(saved.metadata.notes,/chưa đối chiếu/);assert.equal(saved.metadata.schoolName,before.metadata.schoolName);assert.equal(saved.metadata.academicYear,before.metadata.academicYear);assert.equal(saved.questions.length,2);
      await page.getByRole('button',{name:'Hoàn tác',exact:true}).filter({visible:true}).first().click();await until(async()=>(await api('/api/exams/'+examId)).document.metadata.title===before.metadata.title,'whole replacement undo saved');assert.deepEqual((await api('/api/exams/'+examId)).document.questions.map((q:{id:string})=>q.id),before.questions.map((q:{id:string})=>q.id));checks.push('existing whole replacement costs two calls, preserves teacher headers, explicit rename and one common undo');
    });
    await t.test('metadata on an image-heavy document sends a small request and preserves original image bytes',async()=>{
      const doc=(await api('/api/exams/'+examId)).document;const image='data:image/png;base64,'+'A'.repeat(5*1024*1024);doc.questions[0].figures=[{id:'large-image',kind:'image',data:image}];
      assert.equal((await context.request.patch(origin+'/api/exams/'+examId,{headers:{Origin:origin},data:{document:doc,baseVersion:doc.version}})).ok(),true);
      await page.reload();await info();await openCopilot(page);mode='metadata';await page.getByLabel('Yêu cầu cho AI',{exact:true}).fill('Đổi tên thành đề nhiều ảnh đã đổi tên');await page.getByRole('button',{name:'Gửi lệnh',exact:true}).click();const proposal=page.getByRole('region',{name:'Đề xuất AI chưa áp dụng',exact:true});await proposal.waitFor();await proposal.getByRole('button',{name:'Áp dụng',exact:true}).click();
      await until(async()=>(await api('/api/exams/'+examId)).document.metadata.title==='Đề nhiều ảnh đã đổi tên','metadata saved for large image exam');
      assert.equal((await api('/api/exams/'+examId)).document.questions[0].figures[0].data,image);assert.ok(payloadSizes.at(-1)!<4*1024*1024);checks.push('5 MiB image stays in source; metadata request under 4 MiB');
    });
    await t.test('a truncated provider answer never becomes a ready proposal',async()=>{
      await page.goto(origin+'/editor/new');await page.getByRole('heading',{name:'Bạn muốn soạn đề gì?',exact:true}).waitFor();mode='truncated';await page.getByLabel('Yêu cầu tạo đề',{exact:true}).fill('Tạo đề luyện tập Toán lớp 9');await page.getByRole('button',{name:'Gửi yêu cầu',exact:true}).click();await page.getByRole('alert').filter({hasText:/bị cắt/}).waitFor();assert.equal(await page.getByRole('region',{name:'Đề xuất trọn đề',exact:true}).count(),0);checks.push('MAX_TOKENS: incomplete, no proposal or automatic repair loop');
    });
    await t.test('phone manual start chooses subject/grade without inventing duration; dark and avatar remain usable',async()=>{
      await page.setViewportSize({width:375,height:812});await page.getByRole('button',{name:'Tự soạn',exact:true}).click();await page.getByLabel('Lớp bắt đầu',{exact:true}).selectOption('8');await page.getByLabel('Môn bắt đầu',{exact:true}).selectOption('toan');await page.getByRole('button',{name:'Mở bàn soạn',exact:true}).click();await until(async()=>!page.url().endsWith('/new'),'manual document saved');
      const manualId=new URL(page.url()).pathname.split('/').at(-1)!;const doc=(await api('/api/exams/'+manualId)).document;assert.equal(doc.metadata.grade,8);assert.equal(doc.metadata.durationMinutes,undefined);
      const timed={...doc,outline:undefined,questions:[{id:'timing-q',type:'short_answer',difficulty:'thong_hieu',content:'1+1 bằng mấy?',correct_answer:'2',step_by_step_solution:'1+1=2',points:1}]};assert.equal((await context.request.patch(origin+'/api/exams/'+manualId,{headers:{Origin:origin},data:{document:timed,baseVersion:doc.version}})).ok(),true);const denied=await context.request.post(origin+'/api/assignments',{headers:{Origin:origin},data:{examId:manualId,title:'Fixture không có thời lượng',mode:'CLASSWORK',identityMode:'FREE_NAME'}});assert.equal(denied.status(),400);assert.match((await denied.json()).error,/thời lượng/);const homework=await context.request.post(origin+'/api/assignments',{headers:{Origin:origin},data:{examId:manualId,title:'Fixture bài tập không giới hạn',mode:'HOMEWORK',identityMode:'FREE_NAME'}});assert.equal(homework.status(),200);assert.equal((await homework.json()).assignment.durationMinutes,null);await page.reload();await page.getByTitle('Nhấn để đổi tên đề thi').filter({visible:true}).waitFor();
      await openCopilot(page);await toggleTheme(page);await openCopilot(page);assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('dark')),true);
      const luminance=(color:string)=>{const channels=color.match(/[0-9.]+/g)!.slice(0,3).map(Number).map(value=>{const x=value/255;return x<=0.04045?x/12.92:((x+0.055)/1.055)**2.4;});return channels[0]*0.2126+channels[1]*0.7152+channels[2]*0.0722;};
      let colors={text:'',background:''};
      await until(async()=>{colors=await page.getByLabel('Yêu cầu cho AI',{exact:true}).evaluate(element=>{const style=getComputedStyle(element);return {text:style.color,background:style.backgroundColor};});const a=luminance(colors.text),b=luminance(colors.background);return (Math.max(a,b)+0.05)/(Math.min(a,b)+0.05)>=4.5;},'dark composer reaches stable contrast of at least 4.5:1');
      fs.writeFileSync(report+'/composer-colors.json',JSON.stringify(colors));
      for(const width of [320,375,390]){await page.setViewportSize({width,height:812});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);await page.screenshot({path:report+'/phone-'+width+'.png'});}
      checks.push('manual grade/subject explicit, no 45-minute fallback; phone 320/375/390, dark and avatar above AI');
    });
    assert.equal(wrongKey,false,'provider sees only this fixture key');
    assert.deepEqual(pageErrors, [], 'no browser runtime errors');
  } finally {
    if(provider.listening){provider.closeAllConnections();await new Promise<void>(resolve=>provider.close(()=>resolve()));}
    await browser.close();
    await db.aiUsageLog.deleteMany({where:{userId:id}});await db.userApiKey.deleteMany({where:{userId:id}});
    await db.assignment.deleteMany({where:{ownerId:id}});
    await db.exam.deleteMany({ where: { ownerId: id } });
    await db.question.deleteMany({ where: { ownerId: id } });
    await db.passage.deleteMany({ where: { ownerId: id } });
    await db.examTemplate.deleteMany({ where: { ownerId: id } });
    await db.auditLog.deleteMany({ where: { OR: [{ actorId: id }, { targetType: 'LoginBucket', targetId: loginBucket(email) }] } });
    await db.user.deleteMany({ where: { id } });
    const cleanup = await db.user.count({ where: { id } }) === 0 && await db.exam.count({ where: { ownerId: id } }) === 0;
    await db.$disconnect();
    fs.writeFileSync(report + '/browser-results.json', JSON.stringify({ checks, cleanup, pageErrors, database: 'examcraft_test_20261022', origin, provider: 'actual app API and local synthetic provider on 3118; no real AI',providerCalls,payloadSizes, buildId: fs.readFileSync('.next/BUILD_ID', 'utf8').trim(), checkedAt: new Date().toISOString(), limitations: 'Chrome viewport checks; not a physical phone or production/Vercel check.' }, null, 2));
    assert.equal(cleanup, true);
  }
});
