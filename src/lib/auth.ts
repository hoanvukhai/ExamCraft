import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import prisma from './prisma';
import { Role } from '@prisma/client';

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

export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export async function deleteSession(token: string): Promise<void> {
  try {
    await prisma.session.delete({
      where: { token },
    });
  } catch {
    // Phiên không tồn tại hoặc đã bị xóa trước đó
  }
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

  // Kiểm tra phiên hết hạn
  if (session.expiresAt < new Date()) {
    await deleteSession(sessionToken);
    return null;
  }

  // Nếu tài khoản bị vô hiệu hóa
  if (!session.user.isActive) {
    await deleteSession(sessionToken);
    return null;
  }

  return session.user;
}

/**
 * Helper kiểm tra phân quyền cho Route Handler: bắt buộc đăng nhập
 */
export async function requireAuth(): Promise<UserSession> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('UNAUTHORIZED');
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

interface FailedAttempt {
  count: number;
  firstAttemptAt: number;
  blockedUntil?: number;
}

const loginAttempts = new Map<string, FailedAttempt>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 phút
const LOCKOUT_MS = 15 * 60 * 1000; // Khóa 15 phút nếu thử sai 5 lần

export function checkLoginRateLimit(key: string): { allowed: boolean; waitMinutes?: number } {
  const now = Date.now();
  const record = loginAttempts.get(key);

  if (!record) {
    return { allowed: true };
  }

  if (record.blockedUntil && record.blockedUntil > now) {
    const waitMinutes = Math.ceil((record.blockedUntil - now) / 60000);
    return { allowed: false, waitMinutes };
  }

  // Đã hết thời gian cửa sổ kiểm tra
  if (now - record.firstAttemptAt > WINDOW_MS) {
    loginAttempts.delete(key);
    return { allowed: true };
  }

  return { allowed: true };
}

export function recordFailedLogin(key: string): void {
  const now = Date.now();
  const record = loginAttempts.get(key);

  if (!record || now - record.firstAttemptAt > WINDOW_MS) {
    loginAttempts.set(key, { count: 1, firstAttemptAt: now });
    return;
  }

  record.count += 1;
  if (record.count >= MAX_ATTEMPTS) {
    record.blockedUntil = now + LOCKOUT_MS;
  }
}

export function clearLoginRateLimit(key: string): void {
  loginAttempts.delete(key);
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
