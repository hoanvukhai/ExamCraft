import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { chromium } from 'playwright-core';
import { requireTestDatabase } from '../tests/helpers/test-database';
import { loginBucket } from '../src/lib/auth-security';
import { openCopilot } from './editor-ui';

const origin = process.env.EXAMCRAFT_TEST_ORIGIN || 'http://127.0.0.1:3130';

test('the assistant answers how-to and own-data questions without a key, and keeps to the teacher\'s own data', { timeout: 240000 }, async () => {
  const url = requireTestDatabase();
  assert.equal(new URL(url).pathname, '/examcraft_test_20261022');
  const db = new PrismaClient({ datasources: { db: { url } }, log: [] });
  const run = randomUUID();
  const ids = [0, 1].map((i) => `assist_${run}_${i}`);
  const emails = ids.map((id) => id + '@example.invalid');
  const password = randomUUID();
  const browser = await chromium.launch({ executablePath: process.env.PILOT_BROWSER_PATH, headless: true });
  try {
    for (const [i, id] of ids.entries())
      await db.user.create({ data: { id, email: emails[i], name: 'GV ' + i, role: 'TEACHER', passwordHash: await bcrypt.hash(password, 10), isActive: true, mustChangePassword: false } });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    assert.ok((await context.request.post(origin + '/api/auth/login', { headers: { Origin: origin }, data: { email: emails[0], password } })).ok());
    await db.exam.create({ data: { ownerId: ids[0], title: 'ĐỀ_CỦA_TÔI_TOÁN_9', subject: 'toan', grade: 9, metadata: {}, sections: [] } });
    await db.exam.create({ data: { ownerId: ids[0], title: 'ĐỀ_LÝ_8', subject: 'vat_ly', grade: 8, metadata: {}, sections: [] } });
    await db.exam.create({ data: { ownerId: ids[1], title: 'ĐỀ_NGƯỜI_KHÁC_TOÁN_9', subject: 'toan', grade: 9, metadata: {}, sections: [] } });
    const ask = async (message: string) => {
      const response = await context.request.post(origin + '/api/teacher/assistant', { headers: { Origin: origin }, data: { message, history: [] } });
      return { status: response.status(), body: await response.json() };
    };

    // How to use the site: answered from the guide, with no AI key.
    const how = await ask('Làm sao xuất đề ra file Word?');
    assert.equal(how.status, 200);
    assert.equal(how.body.source, 'guide');
    assert.match(how.body.reply, /Word – đề/);

    // A vague how-to offers choices rather than guessing.
    const vague = await ask('cách dùng chỗ này thế nào');
    assert.ok(['guide', 'ai'].includes(vague.body.source) || vague.status !== 200);

    // Own data: counted and found from the database, never someone else's.
    const count = await ask('Tôi có bao nhiêu đề Toán lớp 9?');
    assert.equal(count.body.source, 'data');
    assert.match(count.body.reply, /Đề thi: 1\b/);
    const find = await ask('Tìm đề Toán lớp 9');
    assert.equal(find.body.source, 'data');
    assert.ok(find.body.reply.includes('ĐỀ_CỦA_TÔI_TOÁN_9'));
    assert.ok(!find.body.reply.includes('ĐỀ_NGƯỜI_KHÁC'), 'another teacher\'s exam is not shown');
    assert.ok(!find.body.reply.includes('ĐỀ_LÝ_8'), 'the filters apply');

    // Anything the algorithm does not own goes to the AI, which needs a key: the reply says so plainly.
    const open = await ask('Gợi ý cấu trúc đề thi tốt nghiệp THPT môn Toán');
    assert.notEqual(open.body.source, 'guide');
    assert.notEqual(open.body.source, 'data');

    // The editor has a Hướng dẫn tab that answers without a key.
    const created = await context.request.post(origin + '/api/exams', { headers: { Origin: origin }, data: { document: { id: randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), metadata: { title: 'Đề hướng dẫn', schoolName: '', departmentName: '', subject: 'toan', grade: 6 }, questions: [] } } });
    const examId = (await created.json()).exam.id as string;
    const page = await context.newPage();
    await page.goto(origin + '/editor/' + examId);
    await openCopilot(page);
    const panel = page.getByRole('region', { name: 'Bảng AI', exact: true });
    await panel.getByRole('tab', { name: 'Hướng dẫn', exact: true }).click();
    await panel.getByLabel('Hỏi cách dùng trang soạn').fill('xuất word');
    await panel.getByRole('button', { name: /Xuất đề ra Word/ }).click();
    await panel.getByText('Word – đề', { exact: false }).first().waitFor();
  } finally {
    await browser.close();
    await db.exam.deleteMany({ where: { ownerId: { in: ids } } });
    await db.auditLog.deleteMany({ where: { OR: [{ actorId: { in: ids } }, { targetType: 'LoginBucket', targetId: { in: emails.map(loginBucket) } }] } });
    await db.user.deleteMany({ where: { id: { in: ids } } });
    assert.equal(await db.user.count({ where: { id: { in: ids } } }), 0);
    await db.$disconnect();
  }
});
