import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { apiErrorResponse } from '@/lib/api-error';
import { createExam, createExamSchema } from '@/lib/exam-persistence';
import { collaborationPermissions } from '@/lib/exam-collaboration';
import { fromDatabaseExam } from '@/lib/exam-document';
import { ApiError } from '@/lib/api-error';
import { isSameOriginMutation } from '@/lib/attempt-access';
import { assertRequestAccount } from '@/lib/request-account';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    assertRequestAccount(req.headers, user.id);
    const params = new URL(req.url).searchParams;
    const integer = (key: string, fallback: number, max: number) => { const n = Number(params.get(key) ?? fallback); return Number.isInteger(n) && n > 0 ? Math.min(n, max) : fallback; };
    const page = integer('page', 1, 100000), limit = integer('limit', 20, 100);
    const folder = params.get('folderId'), grade = params.get('grade');
    const ownedOnly = params.get('isTrash') === 'true' || (folder && folder !== 'all') || params.get('isStarred') === 'true';
    const where = { ...(ownedOnly ? { ownerId: user.id } : { OR: [{ ownerId: user.id }, { collaborators: { some: { userId: user.id, revokedAt: null } } }] }), deletedAt: params.get('isTrash') === 'true' ? { not: null } : null,
      ...(params.get('subject') ? { subject: params.get('subject')! } : {}),
      ...(grade && Number.isInteger(Number(grade)) ? { grade: Number(grade) } : {}),
      ...(params.get('search') ? { title: { contains: params.get('search')!, mode: 'insensitive' as const } } : {}),
      ...(folder && folder !== 'all' ? { folderId: ['root', 'none'].includes(folder) ? null : folder } : {}),
      ...(params.get('isStarred') === 'true' ? { isStarred: true } : {}) };
    const [exams, totalCount] = await Promise.all([
      prisma.exam.findMany({ where, select: { ownerId: true, collaborators: { where: { userId: user.id, revokedAt: null }, select: { role: true } }, id: true, title: true, subject: true, grade: true, durationMinutes: true, version: true, folderId: true, isStarred: true, createdAt: true, updatedAt: true, deletedAt: true,
        folder: { select: { id: true, name: true, color: true } }, _count: { select: { items: true, assignments: true } } }, orderBy: { updatedAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      prisma.exam.count({ where }),
    ]);
    // A revoke may finish between the main query and relation loading. Omit that row.
    return NextResponse.json({ exams: exams.flatMap(({ ownerId, collaborators, ...exam }) => ownerId !== user.id && !collaborators[0] ? [] : [{ ...exam, ...(ownerId !== user.id ? { folder: null, folderId: null, isStarred: false, _count: { items: exam._count.items, assignments: 0 } } : {}), permissions: collaborationPermissions(ownerId === user.id ? 'OWNER' : collaborators[0].role) }]), pagination: { page, limit, totalCount, totalPages: Math.ceil(totalCount / limit) } }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return apiErrorResponse(error, 'Không tải được kho đề'); }
}

export async function POST(req: NextRequest) {
  try {
    if (!isSameOriginMutation(req)) throw new ApiError(403, 'Yêu cầu không hợp lệ');
    const user = await requireAuth();
    assertRequestAccount(req.headers, user.id);
    const parsed = createExamSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' }, { status: 400 });
    const exam = await prisma.$transaction(tx => createExam(tx, user.id, parsed.data), { timeout: 30000 });
    return NextResponse.json({ success: true, exam, document: fromDatabaseExam(exam) });
  } catch (error) { return apiErrorResponse(error, 'Chưa lưu được đề thi'); }
}
