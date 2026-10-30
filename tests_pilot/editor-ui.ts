import type { Page } from 'playwright-core';
export async function saveEditor(page: Page) {
  const state = page.getByLabel('Trạng thái lưu', { exact: true });
  if ((await state.getAttribute('aria-expanded')) !== 'true') await state.click();
  await page
    .getByRole('region', { name: 'Chi tiết lưu đề', exact: true })
    .getByRole('button', { name: 'Thử lưu lại', exact: true })
    .click();
  if ((await state.getAttribute('aria-expanded')) === 'true') await state.click();
}
export async function acceptReview(page: Page) {
  const review = page.getByRole('region', { name: 'Rà soát đề', exact: true });
  // Only giving the exam to students waits for the review; other actions never open it.
  const next = review.getByRole('button', { name: 'Đã xem, tiếp tục', exact: true });
  if ((await review.isVisible()) && (await next.count())) await next.click();
}
/** The "Thêm" menu of the tool row: Tự soạn câu mới, Từ ngân hàng, Nhập Word/Ảnh, Sinh bằng AI, Phần mới. */
export async function addSource(page: Page, name: string) {
  await page
    .getByRole('toolbar', { name: 'Công cụ soạn đề' })
    .getByRole('button', { name: 'Thêm', exact: true })
    .click();
  await page.getByRole('menuitem', { name, exact: true }).click();
}
/** Export menu in the top bar; on a phone the same items sit in the "more" menu. */
export async function exportTool(page: Page, name: string) {
  const direct = page.getByRole('button', { name: 'Xuất', exact: true }).filter({ visible: true });
  if (await direct.count()) await direct.click();
  else
    await page.getByRole('button', { name: 'Thêm công cụ', exact: true }).filter({ visible: true }).click();
  await page.getByRole('menuitem', { name, exact: true }).click();
  await acceptReview(page);
}
/** The account menu (avatar, top right). */
export async function openAccount(page: Page) {
  await page.getByRole('button', { name: 'Mở menu tài khoản', exact: true }).click();
}
/** Switch light/dark from the account menu. */
export async function toggleTheme(page: Page) {
  await openAccount(page);
  await page.getByRole('button', { name: /Chuyển sang giao diện/ }).click();
  await page.keyboard.press('Escape');
}
/** The AI button of the tool row opens the one AI panel (and closes it when it is already open). */
export async function openCopilot(page: Page) {
  const panel = page.getByRole('region', { name: 'Bảng AI', exact: true });
  if (await panel.isVisible()) return;
  await page
    .getByRole('toolbar', { name: 'Công cụ soạn đề' })
    .getByRole('button', { name: 'AI', exact: true })
    .click();
}
/** Old name of the chat: the assistant and the copilot are the same panel now. */
export const openAssistant = openCopilot;
/** Old command names in the tests, and what they are called in the tool row now. */
const commandNames: Record<string, string> = {
  'Nhân bản câu': 'Nhân bản',
  'Xóa câu này': 'Xóa câu',
  'Hỏi AI về cả câu': 'Hỏi AI về câu này',
};
async function runCommand(page: Page, label: string) {
  // The details of a selected question open beside the sheet by themselves.
  if (label === 'Chỉnh nội dung' || label === 'Xem lời giải') return;
  const name = commandNames[label] ?? label;
  const group = page.getByRole('group', { name: 'Thao tác với mục đang chọn' });
  await group.waitFor();
  const direct = group.getByRole('button', { name, exact: true });
  if (await direct.count()) {
    await direct.click();
    return;
  }
  await page
    .getByRole('toolbar', { name: 'Công cụ soạn đề' })
    .getByRole('button', { name: 'Khác', exact: true })
    .click();
  await page.getByRole('menuitem', { name, exact: true }).click();
}
/** Select a question on the sheet, then run one of its commands from the tool row (directly or from "Khác"). */
export async function questionCommand(page: Page, questionId: string, label: string) {
  await selectQuestion(page, questionId);
  await runCommand(page, label);
}
/** Same, for the question at a position (0 = first on the sheet). */
export async function questionCommandAt(page: Page, index: number, label: string) {
  await selectQuestionAt(page, index);
  await runCommand(page, label);
}
/** Select the question at a position and open the "Khác" menu of the tool row; returns a menu item. */
export async function questionMenuItemAt(page: Page, index: number, label: string) {
  await selectQuestionAt(page, index);
  await page.getByRole('group', { name: 'Thao tác với mục đang chọn' }).waitFor();
  await page
    .getByRole('toolbar', { name: 'Công cụ soạn đề' })
    .getByRole('button', { name: 'Khác', exact: true })
    .click();
  return page.getByRole('menuitem', { name: commandNames[label] ?? label, exact: true });
}
/** Show the exam details (title, subject, print layout) in the panel beside the sheet. */
export async function openInfoPanel(page: Page) {
  await page
    .getByRole('navigation', { name: 'Đang chọn', exact: true })
    .getByRole('button', { name: 'Toàn đề', exact: true })
    .click();
  const rail = page.getByRole('button', { name: 'Chi tiết', exact: true }).filter({ visible: true }).first();
  if ((await rail.getAttribute('aria-pressed')) === 'false') await rail.click();
}
const sheetQuestion = (page: Page) => page.locator('.a4-preview-section [data-question-id]');
/** Select a question by clicking its number on the sheet. */
export async function selectQuestion(page: Page, questionId: string) {
  await page
    .locator('.a4-preview-section [data-question-id="' + questionId + '"] b')
    .first()
    .click();
}
export async function selectQuestionAt(page: Page, index: number) {
  await sheetQuestion(page).nth(index).locator('b').first().click();
}
/** Select any object on the sheet by its code, for example "choice:q1:B" or "part:p1". */
export async function selectObject(page: Page, code: string) {
  await page.locator('.a4-preview-section [data-object="' + code + '"]').first().click();
}
