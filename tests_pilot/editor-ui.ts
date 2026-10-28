import type { Page } from 'playwright-core';
export async function saveEditor(page: Page) {
  const state = page.getByLabel('Trạng thái lưu', { exact: true });
  if (await state.getAttribute('aria-expanded') !== 'true') await state.click();
  await page.getByRole('region', { name: 'Chi tiết lưu đề', exact: true }).getByRole('button', { name: 'Thử lưu lại', exact: true }).click();
  if (await state.getAttribute('aria-expanded') === 'true') await state.click();
}
export async function acceptReview(page: Page) {
  const review = page.getByRole('dialog', { name: 'Rà soát đề', exact: true });
  if (await review.isVisible()) await review.getByRole('button', { name: 'Đã xem, tiếp tục', exact: true }).click();
}
export async function addSource(page: Page, name: string) {
  await page.getByRole('toolbar', { name: 'Công cụ soạn đề' }).getByRole('button', { name: 'Thêm', exact: true }).click();
  await page.getByRole('menuitem', { name, exact: true }).click();
}
export async function exportTool(page: Page, name: string) {
  const direct = page.getByRole('button', { name: 'Xuất', exact: true }).filter({ visible: true });
  if (await direct.count()) await direct.click(); else await page.getByRole('button', { name: 'Thêm công cụ', exact: true }).click();
  await page.getByRole('menuitem', { name, exact: true }).click();
  await acceptReview(page);
}
/** Switch light/dark; on the phone editor the button lives inside the app menu. */
export async function toggleTheme(page: Page) {
  const direct = page.getByRole('button', { name: /Chuyển sang giao diện/ }).filter({ visible: true });
  if (await direct.count()) { await direct.first().click(); return; }
  await page.getByRole('button', { name: 'Menu ứng dụng', exact: true }).click();
  await page.getByRole('region', { name: 'Tùy chọn ứng dụng', exact: true }).getByRole('button', { name: /Chuyển sang giao diện/ }).click();
  await page.getByRole('button', { name: 'Đóng menu ứng dụng', exact: true }).dispatchEvent('click');
}
/** Open the account menu; on the phone editor it sits inside the app menu. */
export async function openAccount(page: Page) {
  const direct = page.getByRole('button', { name: 'Mở menu tài khoản', exact: true }).filter({ visible: true });
  if (!await direct.count()) await page.getByRole('button', { name: 'Menu ứng dụng', exact: true }).click();
  await page.getByRole('button', { name: 'Mở menu tài khoản', exact: true }).filter({ visible: true }).first().click();
}
/** Click a rail button by its accessible name; on the phone editor it sits inside the app menu, which closes itself afterwards. */
export async function railClick(page: Page, name: string) {
  const direct = page.getByRole('button', { name, exact: true }).filter({ visible: true });
  if (await direct.count()) { await direct.first().click(); return; }
  await page.getByRole('button', { name: 'Menu ứng dụng', exact: true }).click();
  await page.getByRole('region', { name: 'Tùy chọn ứng dụng', exact: true }).getByRole('button', { name, exact: true }).click();
  const close = page.getByRole('button', { name: 'Đóng menu ứng dụng', exact: true });
  if (await close.count()) await close.dispatchEvent('click');
}
