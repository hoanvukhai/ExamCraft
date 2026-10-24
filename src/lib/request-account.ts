import { ApiError } from './api-error';

/** A stale browser tab must not save its private draft into a newly logged-in account. */
export function assertRequestAccount(headers: Pick<Headers, 'get'>, userId: string) {
  const expected = headers.get('x-examcraft-user');
  if (expected !== null && expected !== userId) throw new ApiError(409, 'Tài khoản đăng nhập đã thay đổi. Bản nháp vẫn được giữ; hãy mở lại đúng tài khoản trước khi lưu.', 'ACCOUNT_CHANGED');
}
