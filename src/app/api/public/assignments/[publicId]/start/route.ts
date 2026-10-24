import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { attachAttemptCookie, attemptDeadline, attemptSessionToken, hasAttemptAccess, isSameOriginMutation, SUBMIT_GRACE_MS } from '@/lib/attempt-access';
import { createAttemptLayout, examForAttempt } from '@/lib/attempt-layout';
import { attemptDraftRevision } from '@/lib/attempt-draft-revision';
import { normalizeJoinCode } from '@/lib/assignment-options';

const Schema = z.object({ studentId: z.string().max(100).optional(), freeName: z.string().trim().min(1).max(120).optional(), personalToken: z.string().max(200).optional(), pin: z.string().max(100).optional(), joinCode: z.string().max(100).optional() });
class StartError extends Error { constructor(message: string, public status = 403) { super(message); } }

export async function POST(req: NextRequest, { params }: { params: Promise<{ publicId: string }> }) {
  if (!isSameOriginMutation(req)) return NextResponse.json({ error: 'Yêu cầu không hợp lệ' }, { status: 403 });
  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 });
  const { publicId } = await params;
  try {
    for (let retry = 0; retry < 3; retry++) {
      try {
        const result = await prisma.$transaction(async tx => {
          const assignment = await tx.assignment.findUnique({ where: { publicId }, include: { group: true } });
          const now = new Date();
          if (!assignment || assignment.status !== 'OPEN' || assignment.group?.archivedAt || (assignment.group && assignment.group.ownerId !== assignment.ownerId) ||
              (assignment.opensAt && assignment.opensAt > now) || (assignment.closesAt && assignment.closesAt <= now)) {
            throw new StartError('Bài giao chưa mở hoặc đã đóng');
          }
          if (assignment.joinCode && normalizeJoinCode(parsed.data.joinCode) !== assignment.joinCode) throw new StartError('Mã vào bài không đúng');
          let student;
          if (assignment.identityMode === 'FREE_NAME') {
            if (!parsed.data.freeName || parsed.data.studentId || parsed.data.personalToken) throw new StartError('Vui lòng nhập họ tên', 400);
            let groupId = assignment.groupId;
            if (!groupId) {
              const group = await tx.group.create({ data: { ownerId: assignment.ownerId, name: 'Bài giao ' + assignment.id, publicCode: crypto.randomBytes(16).toString('hex') } });
              groupId = group.id;
              await tx.assignment.update({ where: { id: assignment.id }, data: { groupId } });
            }
            student = await tx.student.upsert({ where: { groupId_displayName: { groupId, displayName: parsed.data.freeName } }, create: { groupId, displayName: parsed.data.freeName, isGuest: true }, update: {} });
          } else if (assignment.identityMode === 'PERSONAL_LINK') {
            if (!parsed.data.personalToken || !assignment.groupId) throw new StartError('Vui lòng dùng link cá nhân do giáo viên cấp', 400);
            student = await tx.student.findFirst({ where: { personalToken: parsed.data.personalToken, groupId: assignment.groupId, archivedAt: null } });
          } else {
            if (!parsed.data.studentId || !assignment.groupId || parsed.data.freeName) throw new StartError('Vui lòng chọn tên trong lớp', 400);
            student = await tx.student.findFirst({ where: { id: parsed.data.studentId, groupId: assignment.groupId, archivedAt: null } });
          }
          if (!student || student.archivedAt) throw new StartError('Học sinh không thuộc lớp của bài giao');
          if (assignment.requirePin && (!student.pinHash || !parsed.data.pin || !await bcrypt.compare(parsed.data.pin, student.pinHash))) throw new StartError('PIN không đúng hoặc chưa được giáo viên thiết lập');
          const previous = await tx.attempt.findMany({ where: { assignmentId: assignment.id, studentId: student.id }, orderBy: { attemptNo: 'desc' } });
          const active = previous.find(a => a.status === 'IN_PROGRESS' && (!a.deadlineAt || a.deadlineAt.getTime() + SUBMIT_GRACE_MS >= now.getTime()));
          if (active) {
            if (!hasAttemptAccess(req, active)) throw new StartError('Lượt đang làm thuộc trình duyệt đã bắt đầu. Hãy quay lại trình duyệt đó hoặc nhờ giáo viên hỗ trợ.');
            return { attempt: active, studentName: student.displayName, resumed: true, snapshot: assignment.snapshot };
          }
          if (previous.length >= assignment.maxAttempts) throw new StartError('Đã dùng hết số lượt cho phép');
          await tx.attempt.updateMany({ where: { assignmentId: assignment.id, studentId: student.id, status: 'IN_PROGRESS' }, data: { status: 'EXPIRED' } });
          const variantSeed = crypto.randomInt(1000000);
          const layout = createAttemptLayout(assignment.snapshot, variantSeed, assignment.shuffleQuestions, assignment.shuffleChoices);
          const attempt = await tx.attempt.create({ data: {
            assignmentId: assignment.id, studentId: student.id, attemptNo: (previous[0]?.attemptNo ?? 0) + 1,
            startedAt: now, deadlineAt: attemptDeadline(now, assignment.durationMinutes, assignment.closesAt),
            variantSeed, layout, draft: {},
          } });
          attemptSessionToken(attempt); // Refuse to commit a new attempt if the session key is missing.
          return { attempt, studentName: student.displayName, resumed: false, snapshot: assignment.snapshot };
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
        const { attempt, studentName, resumed, snapshot } = result;
        return attachAttemptCookie(NextResponse.json({ success: true, resumed, serverNow: new Date().toISOString(), attempt: {
          id: attempt.id, attemptNo: attempt.attemptNo, startedAt: attempt.startedAt, deadlineAt: attempt.deadlineAt, draft: attempt.draft, draftRevision: attemptDraftRevision(attempt.draft), studentName,
        }, exam: examForAttempt(snapshot, attempt.layout) }), attempt);
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && ['P2034', 'P2002'].includes(error.code) && retry < 2) continue;
        throw error;
      }
    }
  } catch (error) {
    if (error instanceof StartError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error('Start attempt failed', error);
    return NextResponse.json({ error: 'Chưa thể bắt đầu bài. Vui lòng thử lại hoặc liên hệ giáo viên.' }, { status: 503 });
  }
}
