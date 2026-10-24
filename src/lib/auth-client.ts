/** Navigate away only after the server acknowledges session revocation. */
export async function logoutSession(expectedUserId?: string): Promise<void> {
  let response: Response;
  try { response = await fetch('/api/auth/logout', { method: 'POST', headers: expectedUserId ? { 'x-examcraft-user': expectedUserId } : {} }); }
  catch { throw new Error('Chưa kết nối được máy chủ để đăng xuất. Hãy thử lại khi có kết nối.'); }
  const result = await response.json().catch(() => null);
  if (!response.ok || result?.success !== true) throw new Error(typeof result?.error === 'string' ? result.error : 'Máy chủ chưa xác nhận đăng xuất. Vui lòng thử lại.');
}
