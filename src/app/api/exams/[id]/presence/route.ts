import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { assertRequestAccount } from '@/lib/request-account';
import { ApiError, apiErrorResponse } from '@/lib/api-error';
import { isSameOriginMutation } from '@/lib/attempt-access';
import { requireExamAccess } from '@/lib/exam-collaboration';

type Context = { params: Promise<{ id: string }> };

/** A tab that has not reported for this long is treated as gone. */
const PRESENCE_WINDOW_MS = 30_000;
const KEEP_ROWS_MS = 24 * 60 * 60 * 1000;

const bodySchema = z
  .object({
    focus: z
      .string()
      .max(200)
      .regex(/^[A-Za-z0-9_:.\-/ ]*$/)
      .nullable()
      .optional(),
    editing: z.boolean().optional(),
    seenVersion: z.number().int().min(0).max(1_000_000_000).optional(),
    leave: z.boolean().optional(),
  })
  .strict();

/**
 * Report that this teacher has the exam open (and what they are on), and learn who else does.
 * Anyone who can see the exam can report; nothing about the exam itself is written.
 */
export async function POST(req: NextRequest, { params }: Context) {
  try {
    if (!isSameOriginMutation(req)) throw new ApiError(403, 'Yêu cầu không hợp lệ');
    const user = await requireAuth(),
      { id } = await params;
    assertRequestAccount(req.headers, user.id);
    const input = bodySchema.safeParse(await req.json());
    if (!input.success) throw new ApiError(400, 'Thông tin đang mở đề chưa hợp lệ');
    await requireExamAccess(prisma, id, user.id);
    const now = new Date();
    if (input.data.leave) {
      await prisma.examPresence.deleteMany({ where: { examId: id, userId: user.id } });
      return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
    }
    const data = {
      lastSeenAt: now,
      ...(input.data.focus !== undefined ? { focus: input.data.focus } : {}),
      ...(input.data.editing !== undefined ? { editing: input.data.editing } : {}),
      ...(input.data.seenVersion !== undefined ? { seenVersion: input.data.seenVersion } : {}),
    };
    const own = await prisma.examPresence.upsert({
      where: { examId_userId: { examId: id, userId: user.id } },
      update: data,
      create: { examId: id, userId: user.id, ...data },
      select: { seenVersion: true },
    });
    await prisma.examPresence.deleteMany({
      where: { examId: id, lastSeenAt: { lt: new Date(now.getTime() - KEEP_ROWS_MS) } },
    });
    const [exam, others, revision] = await Promise.all([
      prisma.exam.findUniqueOrThrow({ where: { id }, select: { version: true } }),
      prisma.examPresence.findMany({
        where: {
          examId: id,
          userId: { not: user.id },
          lastSeenAt: { gt: new Date(now.getTime() - PRESENCE_WINDOW_MS) },
        },
        select: {
          userId: true,
          focus: true,
          editing: true,
          lastSeenAt: true,
          user: { select: { name: true } },
        },
        orderBy: { lastSeenAt: 'desc' },
        take: 20,
      }),
      prisma.examRevision.findFirst({
        where: { examId: id },
        orderBy: { version: 'desc' },
        select: { version: true, actor: { select: { name: true, id: true } } },
      }),
    ]);
    return NextResponse.json(
      {
        version: exam.version,
        // Who saved the newest version, for "Cô Lan vừa sửa …"; the viewer's own saves are not news.
        lastSavedBy: revision?.actor && revision.actor.id !== user.id ? revision.actor.name : null,
        seenVersion: own.seenVersion,
        people: others.map((row) => ({
          userId: row.userId,
          name: row.user.name,
          focus: row.focus,
          editing: row.editing,
          since: row.lastSeenAt.toISOString(),
        })),
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    return apiErrorResponse(error, 'Không cập nhật được ai đang mở đề');
  }
}
