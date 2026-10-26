import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireRequestAuth } from '@/lib/request-auth';
import { ApiError, apiErrorResponse } from '@/lib/api-error';
import { generateDistinctPins } from '@/lib/student-pin';

const noStore = { 'Cache-Control': 'private, no-store' };
const Body = z.object({ studentIds: z.array(z.string().min(1).max(200)).min(1).max(500).optional() }).strict();

/** Issues new PINs for the students of one class. The PINs are returned once and only their hashes are stored. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRequestAuth(req);
    const { id } = await params;
    const parsed = Body.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) throw new ApiError(400, 'Danh sách học sinh cần cấp PIN không hợp lệ');
    const group = await prisma.group.findFirst({ where: { id, ownerId: user.id, archivedAt: null }, select: { id: true } });
    if (!group) throw new ApiError(404, 'Không tìm thấy lớp học');
    const students = await prisma.student.findMany({ where: { groupId: id, archivedAt: null, ...(parsed.data.studentIds ? { id: { in: parsed.data.studentIds } } : {}) }, orderBy: { displayName: 'asc' }, select: { id: true, displayName: true } });
    if (!students.length) throw new ApiError(404, 'Lớp chưa có học sinh cần cấp PIN');
    if (parsed.data.studentIds && students.length !== new Set(parsed.data.studentIds).size) throw new ApiError(404, 'Có học sinh không thuộc lớp này');
    // A student picks their own name and then types the PIN, so PINs only need to differ inside this batch.
    const pins = generateDistinctPins(students.length);
    const hashes = await Promise.all(pins.map(pin => bcrypt.hash(pin, 10)));
    await prisma.$transaction([
      ...students.map((student, index) => prisma.student.update({ where: { id: student.id }, data: { pinHash: hashes[index] } })),
      prisma.auditLog.create({ data: { actorId: user.id, action: 'group.pins.issue', targetType: 'Group', targetId: id, meta: { count: students.length } } }),
    ]);
    return NextResponse.json({ success: true, pins: students.map((student, index) => ({ id: student.id, displayName: student.displayName, pin: pins[index] })) }, { headers: noStore });
  } catch (error) {
    return apiErrorResponse(error, 'Chưa cấp được PIN');
  }
}
