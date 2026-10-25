import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AssignmentStatus, AttemptStatus } from '@prisma/client';
import { hasAttemptAccess, isPolicyVisible } from '@/lib/attempt-access';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ groupCode: string }> }
) {
  try {
    const { groupCode } = await params;
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId') || undefined;

    const group = await prisma.group.findUnique({
      where: { publicCode: groupCode },
      include: {
        students: {
          where: { archivedAt: null },
          select: { id: true, displayName: true },
          orderBy: { displayName: 'asc' },
        },
        assignments: {
          where: { status: AssignmentStatus.OPEN, AND: [{ OR: [{ opensAt: null }, { opensAt: { lte: new Date() } }] }, { OR: [{ closesAt: null }, { closesAt: { gt: new Date() } }] }] },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            ownerId: true,
            publicId: true,
            mode: true,
            identityMode: true,
            durationMinutes: true,
            opensAt: true,
            closesAt: true,
            showResult: true,
            status: true,
          },
        },
      },
    });

    if (!group || group.archivedAt) {
      return NextResponse.json({ error: 'Lớp học không tồn tại hoặc mã lớp không đúng' }, { status: 404 });
    }

    // Nếu học sinh đã chọn tên, tra cứu lịch sử làm bài của học sinh trong các bài giao này
    const studentAttempts: Record<string, Pick<import('@prisma/client').Attempt, 'id' | 'assignmentId' | 'studentId' | 'attemptNo' | 'status' | 'score' | 'maxScore' | 'startedAt' | 'submittedAt' | 'deadlineAt'>[]> = {};
    if (studentId) {
      const attempts = await prisma.attempt.findMany({
        where: {
          studentId,
          assignment: { groupId: group.id },
        },
        select: {
          id: true,
          assignmentId: true,
          studentId: true,
          attemptNo: true,
          status: true,
          score: true,
          maxScore: true,
          startedAt: true,
          submittedAt: true,
          deadlineAt: true,
        },
        orderBy: { attemptNo: 'desc' },
      });

      attempts.filter(att => hasAttemptAccess(req, att)).forEach((att) => {
        if (!studentAttempts[att.assignmentId]) {
          studentAttempts[att.assignmentId] = [];
        }
        studentAttempts[att.assignmentId].push(att);
      });
    }

    const assignmentsWithStatus = group.assignments.filter(asg => asg.ownerId === group.ownerId).map((asg) => {
      const attempts = studentAttempts[asg.id] || [];
      const latestAttempt = attempts[0] || null;

      return {
        id: asg.id, title: asg.title, publicId: asg.publicId, mode: asg.mode, identityMode: asg.identityMode, durationMinutes: asg.durationMinutes, opensAt: asg.opensAt, closesAt: asg.closesAt,
        attemptsCount: attempts.length,
        latestAttempt: latestAttempt
          ? {
              id: latestAttempt.id,
              status: latestAttempt.status,
              score: isPolicyVisible(asg.showResult, asg) && latestAttempt.status === AttemptStatus.SUBMITTED ? latestAttempt.score : null,
              maxScore: isPolicyVisible(asg.showResult, asg) && latestAttempt.status === AttemptStatus.SUBMITTED ? latestAttempt.maxScore : null,
              submittedAt: latestAttempt.submittedAt,
            }
          : null,
      };
    });

    return NextResponse.json({
      group: {
        id: group.id,
        name: group.name,
        publicCode: group.publicCode,
        students: group.students,
        assignments: assignmentsWithStatus,
      },
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Lỗi GET /api/public/groups/[groupCode]:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi lấy thông tin lớp học' }, { status: 500 });
  }
}
