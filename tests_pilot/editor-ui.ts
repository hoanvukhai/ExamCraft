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
  const review = page.getByRole('dialog', { name: 'Rà soát đề', exact: true });
  if (await review.isVisible())
    await review.getByRole('button', { name: 'Đã xem, tiếp tục', exact: true }).click();
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
/** The "AI" menu of the tool row: pick "Hỏi AI (không sửa đề)" or "Sửa đề bằng Trợ lý AI". */
export async function aiMenu(page: Page, item: string) {
  await page
    .getByRole('toolbar', { name: 'Công cụ soạn đề' })
    .getByRole('button', { name: 'AI', exact: true })
    .click();
  await page.getByRole('menuitem', { name: item, exact: true }).click();
}
export const openAssistant = (page: Page) => aiMenu(page, 'Hỏi AI (không sửa đề)');
export const openCopilot = (page: Page) => aiMenu(page, 'Sửa đề bằng Trợ lý AI');
async function runCommand(page: Page, label: string) {
  const group = page.getByRole('group', { name: /^Thao tác Câu/ });
  await group.waitFor();
  const direct = group.getByRole('button', { name: label, exact: true });
  if (await direct.count()) {
    await direct.click();
    return;
  }
  await page
    .getByRole('toolbar', { name: 'Công cụ soạn đề' })
    .getByRole('button', { name: 'Khác', exact: true })
    .click();
  await page.getByRole('menuitem', { name: label, exact: true }).click();
}
/** Select a question on the page, then run one of its commands from the tool row (directly or from "Khác"). */
export async function questionCommand(page: Page, questionId: string, label: string) {
  await selectQuestion(page, questionId);
  await runCommand(page, label);
}
/** Same, for the question at a position (0 = first on the sheet). */
export async function questionCommandAt(page: Page, index: number, label: string) {
  await page
    .locator('[id^="editor-question-"]')
    .nth(index)
    .getByText(/^Câu [0-9]+$/)
    .first()
    .click();
  await runCommand(page, label);
}
/** Open the "Khác" menu of the tool row for the question at a position and return a menu item. */
export async function questionMenuItemAt(page: Page, index: number, label: string) {
  await page
    .locator('[id^="editor-question-"]')
    .nth(index)
    .getByText(/^Câu [0-9]+$/)
    .first()
    .click();
  await page.getByRole('group', { name: /^Thao tác Câu/ }).waitFor();
  await page
    .getByRole('toolbar', { name: 'Công cụ soạn đề' })
    .getByRole('button', { name: 'Khác', exact: true })
    .click();
  return page.getByRole('menuitem', { name: label, exact: true });
}
/** Open the exam information panel: the rail on a wide screen, the chip row on a phone. */
export async function openInfoPanel(page: Page) {
  await page
    .getByRole('button', { name: 'Thông tin', exact: true })
    .filter({ visible: true })
    .first()
    .click();
}
/** Select a question by clicking its number badge (clicking its text would open the editor). */
export async function selectQuestion(page: Page, questionId: string) {
  await page
    .locator('#editor-question-' + questionId)
    .getByText(/^Câu [0-9]+$/)
    .first()
    .click();
}
