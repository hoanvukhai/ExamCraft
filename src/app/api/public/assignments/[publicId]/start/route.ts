import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { AssignmentStatus, AttemptStatus } from '@prisma/client';

const StartAttemptSchema = z.object({
  studentId: z.string().optional(),
  freeName: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ publicId: string }> }
) {
  try {
    const { publicId } = await params;
    const body = await req.json();
    const parsed = StartAttemptSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 });
    }

    const assignment = await prisma.assignment.findUnique({
      where: { publicId },
      include: { group: true },
    });

    if (!assignment || assignment.status !== AssignmentStatus.OPEN) {
      return NextResponse.json({ error: 'Bài thi không khả dụng hoặc đã đóng' }, { status: 403 });
    }

    const now = new Date();
    if (assignment.closesAt && assignment.closesAt < now) {
      return NextResponse.json({ error: 'Bài thi đã kết thúc thời hạn làm bài' }, { status: 403 });
    }

    let studentId = parsed.data.studentId;

    // Nếu học sinh tự nhập tên (FREE_NAME)
    if (!studentId && parsed.data.freeName?.trim()) {
      const freeName = parsed.data.freeName.trim();
      let targetGroupId = assignment.groupId;

      // Nếu bài giao chưa gắn Group, tạo Group mặc định cho bài đó
      if (!targetGroupId) {
        const defaultGroup = await prisma.group.create({
          data: {
            ownerId: assignment.ownerId,
            name: `Lớp thi: ${assignment.title}`,
            publicCode: crypto.randomBytes(4).toString('hex').toUpperCase(),
          },
        });
        targetGroupId = defaultGroup.id;
        await prisma.assignment.update({
          where: { id: assignment.id },
          data: { groupId: defaultGroup.id },
        });
      }

      // Tìm hoặc tạo học sinh trong Group
      let student = await prisma.student.findFirst({
        where: { groupId: targetGroupId, displayName: freeName },
      });

      if (!student) {
        student = await prisma.student.create({
          data: {
            groupId: targetGroupId,
            displayName: freeName,
            isGuest: true,
          },
        });
      }

      studentId = student.id;
    }

    if (!studentId) {
      return NextResponse.json({ error: 'Vui lòng chọn hoặc nhập tên học sinh' }, { status: 400 });
    }

    // 1. Kiểm tra xem học sinh có lượt làm đang dở dang (IN_PROGRESS) không để tiếp tục (Resume)
    const activeAttempt = await prisma.attempt.findFirst({
      where: {
        assignmentId: assignment.id,
        studentId,
        status: AttemptStatus.IN_PROGRESS,
      },
      include: { student: { select: { displayName: true } } },
    });

    if (activeAttempt) {
      // Nếu chưa quá hạn deadlineAt thì cho phép tiếp tục làm bài
      if (!activeAttempt.deadlineAt || activeAttempt.deadlineAt > now) {
        return NextResponse.json({
          success: true,
          resumed: true,
          attempt: {
            id: activeAttempt.id,
            attemptNo: activeAttempt.attemptNo,
            startedAt: activeAttempt.startedAt,
            deadlineAt: activeAttempt.deadlineAt,
            draft: activeAttempt.draft,
            studentName: activeAttempt.student.displayName,
          },
        });
      }
    }

    // 2. Đếm số lượt đã nộp bài
    const submittedCount = await prisma.attempt.count({
      where: {
        assignmentId: assignment.id,
        studentId,
        status: AttemptStatus.SUBMITTED,
      },
    });

    if (submittedCount >= assignment.maxAttempts) {
      return NextResponse.json(
        {
          error: `Em đã hoàn thành đủ số lượt làm bài cho phép (${assignment.maxAttempts} lượt).`,
        },
        { status: 403 }
      );
    }

    // 3. Tính toán thời gian Server-authoritative
    const startedAt = new Date();
    let deadlineAt: Date | null = null;

    if (assignment.durationMinutes) {
      deadlineAt = new Date(startedAt.getTime() + assignment.durationMinutes * 60 * 1000);
      // Nếu bài đóng trước hạn làm bài thì cắt ngắn theo closesAt
      if (assignment.closesAt && assignment.closesAt < deadlineAt) {
        deadlineAt = assignment.closesAt;
      }
    }

    // 4. Khởi tạo lượt làm bài mới
    const nextAttemptNo = submittedCount + 1;
    const variantSeed = Math.floor(Math.random() * 1000000);

    const attempt = await prisma.attempt.create({
      data: {
        assignmentId: assignment.id,
        studentId,
        attemptNo: nextAttemptNo,
        status: AttemptStatus.IN_PROGRESS,
        startedAt,
        deadlineAt,
        variantSeed,
        layout: {},
        draft: {},
      },
      include: {
        student: { select: { displayName: true } },
      },
    });

    return NextResponse.json({
      success: true,
      resumed: false,
      attempt: {
        id: attempt.id,
        attemptNo: attempt.attemptNo,
        startedAt: attempt.startedAt,
        deadlineAt: attempt.deadlineAt,
        draft: attempt.draft,
        studentName: attempt.student.displayName,
      },
    });
  } catch (error) {
    console.error('Lỗi POST start attempt:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi bắt đầu làm bài' }, { status: 500 });
  }
}
