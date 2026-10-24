import { requireAuth } from './auth';
import { assertRequestAccount } from './request-account';
import { isSameOriginMutation } from './attempt-access';
import { ApiError } from './api-error';

export async function requireRequestAuth(request: Request) {
  const user = await requireAuth();
  assertRequestAccount(request.headers, user.id);
  if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method) && !isSameOriginMutation(request)) throw new ApiError(403, 'Yêu cầu không hợp lệ');
  return user;
}
