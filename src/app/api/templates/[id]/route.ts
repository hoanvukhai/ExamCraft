import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRequestAuth } from '@/lib/request-auth';
import { apiErrorResponse } from '@/lib/api-error';
import { getPersonalTemplate } from '@/lib/exam-template-service';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRequestAuth(req), { id } = await params;
    return NextResponse.json({ template: await prisma.$transaction(tx => getPersonalTemplate(tx, user.id, id)) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return apiErrorResponse(error, 'Chưa tải được mẫu.'); }
}
