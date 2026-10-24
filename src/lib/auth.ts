import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import prisma from './prisma';
import { Role } from '@prisma/client';
import { isSessionUsable, reserveLoginAttempt } from './auth-security';

export const SESSION_COOKIE_NAME = 'examcraft_session';
const SESSION_DURATION_DAYS = 7;

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  mustChangePassword: boolean;
  aiDailyLimit: number;
}

// ───────────── BĂM & KIỂM TRA MẬT KHẨU ─────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ───────────── QUẢN LÝ PHIÊN (SESSION) ─────────────

export async function createSession(userId: string, expectedPasswordHash?: string): Promise<{ token: string; expiresAt: Date }> {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  await prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${userId} FOR UPDATE`;
    const user = await tx.user.findUnique({ where: { id: userId }, select: { isActive: true, passwordHash: true } });
    if (!user?.isActive || (expectedPasswordHash !== undefined && user.passwordHash !== expectedPasswordHash)) throw new Error('UNAUTHORIZED');
    await tx.session.create({ data: { userId, token, expiresAt } });
  });

  return { token, expiresAt };
}

export async function deleteSession(token: string): Promise<void> {
  await prisma.session.deleteMany({ where: { token } });
}

/**
 * Lấy thông tin người dùng từ cookie phiên hiện tại (dùng trong Server Components & Route Handlers)
 */
export async function getCurrentUser(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { token: sessionToken },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          mustChangePassword: true,
          aiDailyLimit: true,
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  if (!isSessionUsable(session)) {
    await deleteSession(sessionToken);
    return null;
  }

  return session.user;
}

// ───────────── BẢO VỆ MÔI TRƯỜNG PRODUCTION (R17) ─────────────
const DEFAULT_INSECURE_SECRETS = [
  'examcraft_session_super_secret_key_change_in_production_2026',
  'examcraft_session_super_secret_key_2026',
  'super-secret-key-change-in-production',
];

if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE !== 'phase-production-build') {
  const secret = process.env.SESSION_SECRET || '';
  if (!secret || DEFAULT_INSECURE_SECRETS.includes(secret) || secret.includes('change_in_production')) {
    const errorMsg = 'CRITICAL SECURITY ERROR: Ứng dụng từ chối khởi động ở môi trường production vì SESSION_SECRET đang mang giá trị mặc định không an toàn! Vui lòng thiết lập biến môi trường SESSION_SECRET có độ dài ngẫu nhiên và bảo mật.';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
}

/**
 * Helper kiểm tra phân quyền cho Route Handler: bắt buộc đăng nhập
 * Tự động chặn các tài khoản bắt buộc đổi mật khẩu truy cập API (AUTH-BUG-002)
 */
export async function requireAuth(options?: { allowMustChangePassword?: boolean }): Promise<UserSession> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  if (user.mustChangePassword && !options?.allowMustChangePassword) {
    throw new Error('MUST_CHANGE_PASSWORD');
  }
  return user;
}

/**
 * Helper kiểm tra phân quyền cho Route Handler: bắt buộc quyền SUPER_ADMIN
 */
export async function requireAdmin(): Promise<UserSession> {
  const user = await requireAuth();
  if (user.role !== Role.SUPER_ADMIN) {
    throw new Error('FORBIDDEN');
  }
  return user;
}

// ───────────── CHỐNG BRUTE FORCE ĐĂNG NHẬP ─────────────

/** Durable account bucket. Reserving a slot and checking the limits are atomic. */
export async function checkLoginRateLimit(email: string, ip = 'local'): Promise<{ allowed: boolean; waitMinutes?: number }> {
  return prisma.$transaction(tx => reserveLoginAttempt(tx, email, ip));
}

// ───────────── GHI AUDIT LOG ─────────────

export async function logAudit(params: {
  actorId?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  meta?: Record<string, unknown>;
  ip?: string;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: params.actorId,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        meta: params.meta ? (params.meta as object) : undefined,
        ip: params.ip,
      },
    });
  } catch (err) {
    console.error('Lỗi khi ghi audit log:', err);
  }
}
