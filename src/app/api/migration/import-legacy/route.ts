import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { apiErrorResponse } from '@/lib/api-error';
import { importLegacy } from '@/lib/legacy-import';
import { assertRequestAccount } from '@/lib/request-account';
import { isSameOriginMutation } from '@/lib/attempt-access';
const schema = z.object({ exams: z.array(z.unknown()).max(100).default([]), questions: z.array(z.unknown()).max(1000).default([]), dryRun: z.boolean().default(true), copyConflicts: z.boolean().default(false) });

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    assertRequestAccount(req.headers, user.id);
    if (!isSameOriginMutation(req)) return NextResponse.json({ error: 'Yêu cầu không hợp lệ' }, { status: 403 });
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: 'Bản nhập không hợp lệ; tối đa 100 đề và 1.000 câu mỗi lượt' }, { status: 400 });
    return NextResponse.json(await importLegacy(prisma, user.id, parsed.data));
  } catch (error) { return apiErrorResponse(error, 'Chưa xử lý được bản nhập cũ'); }
}
