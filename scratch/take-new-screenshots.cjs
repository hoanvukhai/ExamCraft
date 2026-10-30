const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function capture() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Đăng nhập
  await page.goto('http://127.0.0.1:3117/login');
  await page.fill('input[type="email"]', 'gv1@examcraft.lan');
  await page.fill('input[type="password"]', 'gv1@examcraft.lan');
  await page.click('button[type="submit"]');
  await page.waitForURL('http://127.0.0.1:3117/');

  // Mở trang tạo đề /editor
  await page.goto('http://127.0.0.1:3117/editor');
  await page.waitForSelector('#tab-exam-content');

  const outDir = path.resolve(__dirname, 'screenshots');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // 1. Chụp màn hình soạn thảo - Tab Nội dung đề (phẳng, không có nút thừa trên toolbar)
  await page.screenshot({ path: path.join(outDir, '01_flat_content_tab.png'), fullPage: false });

  // 2. Chụp màn hình khi chuyển sang Tab Thông tin đề (phẳng, không có card lồng card)
  await page.click('#tab-exam-settings');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, '02_flat_settings_tab.png'), fullPage: false });

  // 3. Quay lại tab Nội dung đề và thêm 1 câu hỏi để xem QuestionCard mới
  await page.click('#tab-exam-content');
  await page.waitForTimeout(300);
  // Click nút + Thêm -> Tự soạn câu mới
  await page.click('button:has-text("Thêm")');
  await page.waitForTimeout(200);
  await page.click('button:has-text("Tự soạn câu mới")');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(outDir, '03_flat_question_added.png'), fullPage: false });

  await browser.close();
  console.log('Screenshots saved successfully in:', outDir);
}

capture().catch((err) => {
  console.error(err);
  process.exit(1);
});

