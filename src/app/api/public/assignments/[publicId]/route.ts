import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AssignmentStatus } from '@prisma/client';

import { sanitizeSnapshotForStudent } from '@/lib/public-exam';
import { hasActiveAttemptAccess } from '@/lib/attempt-access';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ publicId: string }> }
) {
  try {
    const { publicId } = await params;

    const assignment = await prisma.assignment.findUnique({
      where: { publicId },
      include: {
        group: {
          include: {
            students: {
              where: { archivedAt: null },
              select: { id: true, displayName: true },
              orderBy: { displayName: 'asc' },
            },
          },
        },
      },
    });

    if (!assignment || assignment.group?.archivedAt || (assignment.group && assignment.group.ownerId !== assignment.ownerId)) {
      return NextResponse.json({ error: 'Bài giao không tồn tại hoặc link không chính xác' }, { status: 404 });
    }

    const cookieIds = req.cookies.getAll().filter(c => c.name.startsWith('exam_attempt_')).slice(0, 100).map(c => c.name.slice('exam_attempt_'.length));
    const candidates = cookieIds.length ? await prisma.attempt.findMany({ where: { assignmentId: assignment.id, id: { in: cookieIds } }, include: { student: { select: { archivedAt: true, groupId: true } } }, orderBy: { startedAt: 'desc' } }) : [];
    const myAttempt = candidates.find(attempt => hasActiveAttemptAccess(req, { ...attempt, assignment }));
    const mayReview = myAttempt?.status === 'SUBMITTED';
    const now = new Date();

    // Kiểm tra thời gian mở / đóng
    if (assignment.status !== AssignmentStatus.OPEN && !mayReview) {
      return NextResponse.json({ error: 'Bài thi này hiện đang tạm đóng' }, { status: 403 });
    }

    if (assignment.opensAt && assignment.opensAt > now && !mayReview) {
      return NextResponse.json(
        {
          error: `Bài thi chưa mở. Thời gian mở: ${assignment.opensAt.toLocaleString('vi-VN')}`,
          opensAt: assignment.opensAt,
        },
        { status: 403 }
      );
    }

    if (assignment.closesAt && assignment.closesAt <= now && !mayReview) {
      return NextResponse.json(
        {
          error: `Bài thi đã kết thúc thời gian làm bài lúc ${assignment.closesAt.toLocaleString('vi-VN')}`,
          closesAt: assignment.closesAt,
        },
        { status: 403 }
      );
    }

    // Làm sạch đề thi (bóc tách toàn bộ đáp án)
    const sanitizedExam = sanitizeSnapshotForStudent(assignment.snapshot);

    return NextResponse.json({
      assignment: {
        id: assignment.id,
        title: assignment.title,
        publicId: assignment.publicId,
        mode: assignment.mode,
        assessmentMode: sanitizedExam.metadata.assessmentMode,
        identityMode: assignment.identityMode,
        durationMinutes: assignment.durationMinutes,
        maxAttempts: assignment.maxAttempts,
        opensAt: assignment.opensAt,
        closesAt: assignment.closesAt,
        requirePin: assignment.requirePin,
        requireJoinCode: Boolean(assignment.joinCode),
        leaderboard: assignment.leaderboard,
        group: assignment.group
          ? {
              id: assignment.group.id,
              name: assignment.group.name,
              students: assignment.identityMode === 'PICK_FROM_LIST' ? assignment.group.students : [],
            }
          : null,
      },
      exam: sanitizedExam,
      canStartAnother: Boolean(myAttempt && myAttempt.attemptNo < assignment.maxAttempts && assignment.status === 'OPEN' && (!assignment.opensAt || assignment.opensAt <= now) && (!assignment.closesAt || assignment.closesAt > now)),
      myAttempt: myAttempt ? { id: myAttempt.id, status: myAttempt.status } : null,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Lỗi GET /api/public/assignments/[publicId]:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi lấy đề thi' }, { status: 500 });
  }
}
