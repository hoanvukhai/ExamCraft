/** Pin the account captured by the UI, never resolve the latest account just before a write. */
export function accountFetch(ownerId: string, input: RequestInfo | URL, init: RequestInit = {}) {
  if (!ownerId?.trim()) throw new Error('Chưa xác định được tài khoản. Hãy tải lại trang trước khi tiếp tục.');
  const headers = new Headers(init.headers);
  headers.set('x-examcraft-user', ownerId);
  return fetch(input, { ...init, headers });
}
