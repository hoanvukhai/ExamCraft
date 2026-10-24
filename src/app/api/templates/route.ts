import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRequestAuth } from '@/lib/request-auth';
import { apiErrorResponse } from '@/lib/api-error';
import { listPersonalTemplates, savePersonalTemplate, templateListParameters, readTemplateRequest } from '@/lib/exam-template-service';

export async function GET(req: NextRequest) {
  try {
    const user = await requireRequestAuth(req);
    return NextResponse.json(await prisma.$transaction(tx => listPersonalTemplates(tx, user.id, templateListParameters(req.nextUrl.searchParams))), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return apiErrorResponse(error, 'Chưa tải được danh sách mẫu.'); }
}
export async function POST(req: NextRequest) {
  try {
    const user = await requireRequestAuth(req), body = await readTemplateRequest(req);
    const result = await prisma.$transaction(tx => savePersonalTemplate(tx, user.id, body));
    return NextResponse.json({ success: true, ...result }, { status: result.replayed ? 200 : 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return apiErrorResponse(error, 'Chưa lưu được bản mẫu riêng.'); }
}
