import { createHash } from 'node:crypto';
import { isIP } from 'node:net';
import type { Prisma } from '@prisma/client';
export const LOGIN_WINDOW_MS = 15 * 60 * 1000;
export const LOGIN_ATTEMPT_LIMIT = 10;
export const LOGIN_FAILURE_LIMIT = 5;
export const loginBucket = (email: string) => createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
export function requestAuditIp(headers: Pick<Headers, 'get'>) {
  if (process.env.TRUST_PROXY_HEADERS !== 'true') return 'local';
  const candidate = (headers.get('x-forwarded-for')?.split(',')[0] ?? headers.get('x-real-ip') ?? '').trim();
  return isIP(candidate) ? candidate : 'unknown';
}
/** Reserve before password hashing; account limits cannot be bypassed by changing proxy headers. */
export async function reserveLoginAttempt(tx: Prisma.TransactionClient, email: string, ip: string, now = new Date()) {
  const bucket = loginBucket(email), start = new Date(now.getTime() - LOGIN_WINDOW_MS);
  await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(hashtextextended(${bucket}, 0))`;
  const [attempts, failures] = await Promise.all([
    tx.auditLog.count({ where: { action: 'user.login_attempt', targetType: 'LoginBucket', targetId: bucket, createdAt: { gte: start } } }),
    tx.auditLog.count({ where: { action: 'user.login_failed', targetType: 'LoginBucket', targetId: bucket, createdAt: { gte: start } } }),
  ]);
  if (attempts >= LOGIN_ATTEMPT_LIMIT || failures >= LOGIN_FAILURE_LIMIT) return { allowed: false, waitMinutes: 15 };
  await tx.auditLog.create({ data: { action: 'user.login_attempt', targetType: 'LoginBucket', targetId: bucket, ip, createdAt: now } });
  return { allowed: true };
}
export function isSessionUsable(session: { expiresAt: Date; user: { isActive: boolean } } | null, now = new Date()) {
  return !!session && session.user.isActive && session.expiresAt.getTime() > now.getTime();
}
