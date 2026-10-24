'use client';
import { useCallback, useEffect, useState } from 'react';
import { accountFetch } from '@/lib/account-fetch';

/** Capture once for this page; never silently adopt another account during a refresh. */
export function usePinnedAccount() {
  const [ownerId, setOwnerId] = useState<string | null>(null), [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    void fetch('/api/auth/me', { cache: 'no-store', signal: controller.signal }).then(async response => {
      const data = await response.json();
      if (controller.signal.aborted) return;
      if (!response.ok || typeof data.user?.id !== 'string') { setError('Vui lòng đăng nhập đúng tài khoản rồi tải lại trang.'); return; }
      setOwnerId(data.user.id);
    }).catch(() => { if (!controller.signal.aborted) setError('Chưa xác định được tài khoản. Hãy kiểm tra kết nối rồi tải lại trang.'); });
    return () => controller.abort();
  }, []);
  const request = useCallback(async (input: RequestInfo | URL, init?: RequestInit) => {
    if (!ownerId || error) throw Error('Chưa xác nhận được tài khoản của trang này.');
    const response = await accountFetch(ownerId, input, init);
    const changed = response.status === 409 && (await response.clone().json().catch(() => null))?.code === 'ACCOUNT_CHANGED';
    if (changed || response.status === 401) setError('Phiên hoặc tài khoản đã thay đổi. Hãy tải lại trang bằng đúng tài khoản; chưa thực hiện thao tác tiếp.');
    return response;
  }, [ownerId, error]);
  return { ownerId, error, request };
}
