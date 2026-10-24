import { createHmac, timingSafeEqual } from 'node:crypto';
import type { NextRequest, NextResponse } from 'next/server';

export interface AttemptIdentity {
  id: string;
  studentId: string;
  assignmentId: string;
  startedAt: Date;
}

const SESSION_SECONDS = 30 * 24 * 60 * 60;
export const SUBMIT_GRACE_MS = 15_000;
export const attemptCookieName = (id: string) => `exam_attempt_${id}`;

function signingSecret() {
  const secret = process.env.ATTEMPT_SESSION_SECRET || process.env.SESSION_SECRET;
  if (!secret || secret.length < 32 || /change.in.production|super.secret/i.test(secret)) {
    throw new Error('ATTEMPT_SESSION_SECRET_NOT_CONFIGURED');
  }
  return secret;
}

export function attemptSessionToken(attempt: AttemptIdentity) {
  return createHmac('sha256', signingSecret())
    .update(JSON.stringify(['attempt-v1', attempt.id, attempt.studentId, attempt.assignmentId, attempt.startedAt.toISOString()]))
    .digest('base64url');
}

export function hasAttemptAccess(req: Pick<NextRequest, 'cookies'>, attempt: AttemptIdentity, now = new Date()) {
  if (now.getTime() >= attempt.startedAt.getTime() + SESSION_SECONDS * 1000) return false;
  const supplied = req.cookies.get(attemptCookieName(attempt.id))?.value;
  if (!supplied || !/^[A-Za-z0-9_-]{43}$/.test(supplied)) return false;
  return timingSafeEqual(Buffer.from(supplied), Buffer.from(attemptSessionToken(attempt)));
}

/** A signed cookie proves who began the attempt, not that the student/group is still active. */
export function hasActiveAttemptAccess(req: Pick<NextRequest, 'cookies'>, attempt: AttemptIdentity & {
  student: { archivedAt: Date | null; groupId: string };
  assignment: { ownerId: string; groupId: string | null; group: { ownerId: string; archivedAt: Date | null } | null };
}, now = new Date()) {
  const { student, assignment } = attempt;
  if (student.archivedAt || assignment.group?.archivedAt || (assignment.group && assignment.group.ownerId !== assignment.ownerId) ||
      (assignment.groupId && assignment.groupId !== student.groupId)) return false;
  return hasAttemptAccess(req, attempt, now);
}

export function attachAttemptCookie(response: NextResponse, attempt: AttemptIdentity) {
  response.cookies.set(attemptCookieName(attempt.id), attemptSessionToken(attempt), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/public',
    expires: new Date(attempt.startedAt.getTime() + SESSION_SECONDS * 1000),
  });
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

export function isSameOriginMutation(req: Pick<NextRequest, 'headers' | 'url'>) {
  const origin = req.headers.get('origin');
  if (req.headers.get('sec-fetch-site') === 'cross-site') return false;
  if (!origin) return true;
  try {
    const supplied = new URL(origin), request = new URL(req.url);
    // Next may canonicalize req.url to localhost while the browser uses 127.0.0.1.
    // Compare with the actual Host header, without trusting forwarded host values.
    const host = req.headers.get('host') ?? request.host;
    return supplied.origin === origin && supplied.host.toLowerCase() === host.toLowerCase() && supplied.protocol === request.protocol;
  } catch { return false; }
}

export function isPolicyVisible(policy: string, assignment: { status: string; closesAt: Date | null }, now = new Date()) {
  return policy === 'IMMEDIATE' || (policy === 'AFTER_CLOSE' &&
    (assignment.status === 'CLOSED' || assignment.status === 'ARCHIVED' || Boolean(assignment.closesAt && assignment.closesAt <= now)));
}

export function attemptDeadline(startedAt: Date, durationMinutes: number | null, closesAt: Date | null) {
  const durationEnd = durationMinutes ? new Date(startedAt.getTime() + durationMinutes * 60000) : null;
  if (!durationEnd) return closesAt;
  return closesAt && closesAt < durationEnd ? closesAt : durationEnd;
}

export function isAttemptOpen(attempt: { status: string; deadlineAt: Date | null }, assignment: { status: string; opensAt: Date | null; closesAt: Date | null; group?: { archivedAt: Date | null } | null }, now = new Date()) {
  return attempt.status === 'IN_PROGRESS' && assignment.status === 'OPEN' &&
    !assignment.group?.archivedAt && (!assignment.opensAt || assignment.opensAt <= now) &&
    (!assignment.closesAt || assignment.closesAt >= now) && (!attempt.deadlineAt || attempt.deadlineAt >= now);
}

/** Fixed transport allowance for final submission; drafts remain subject to the strict deadline. */
export function canAcceptSubmissionAnswers(attempt: { status: string; deadlineAt: Date | null }, assignment: { status: string; opensAt: Date | null; closesAt: Date | null; group?: { archivedAt: Date | null } | null }, now = new Date()) {
  return attempt.status === 'IN_PROGRESS' && assignment.status === 'OPEN' && !assignment.group?.archivedAt &&
    (!assignment.opensAt || assignment.opensAt <= now) &&
    (!assignment.closesAt || now.getTime() <= assignment.closesAt.getTime() + SUBMIT_GRACE_MS) &&
    (!attempt.deadlineAt || now.getTime() <= attempt.deadlineAt.getTime() + SUBMIT_GRACE_MS);
}
