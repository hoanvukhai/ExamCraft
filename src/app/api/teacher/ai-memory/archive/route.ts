import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { requireRequestAuth } from '@/lib/request-auth';
import { apiErrorResponse, ApiError } from '@/lib/api-error';
import prisma from '@/lib/prisma';
import { memoriesToMarkdown, memoryImportId, parseMemoryArchive } from '@/lib/memory-document';

export async function GET(req: NextRequest) {
  try {
    const user = await requireRequestAuth(req);
    const memories = await prisma.teacherAiMemory.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'asc' },
      select: { subject: true, category: true, title: true, insight: true, confidence: true, sampleQuestion: true, evidence: true, uncertainty: true, sourceRef: true, sourceAction: true, isActive: true, createdAt: true, updatedAt: true } });
    if (new URL(req.url).searchParams.get('format') === 'markdown') return new NextResponse(memoriesToMarkdown(memories), { headers: { 'Content-Type': 'text/markdown; charset=utf-8', 'Content-Disposition': 'attachment; filename="examcraft-private-memory.md"', 'Cache-Control': 'private, no-store' } });
    return NextResponse.json({ format: 'examcraft-private-memory', version: 1, exportedAt: new Date().toISOString(), memories }, {
      headers: { 'Content-Disposition': 'attachment; filename="examcraft-private-memory.json"', 'Cache-Control': 'private, no-store' },
    });
  } catch (error) { return apiErrorResponse(error, 'Không xuất được ghi chú riêng.'); }
}

export async function POST(req: NextRequest) {
  try {
    // Account and origin first; the file body is not read for a stale or foreign tab.
    const user = await requireRequestAuth(req);
    const body = await req.json();
    const archive = parseMemoryArchive(body.archive);
    const entries = [...new Map(archive.memories.map(entry => [memoryImportId(user.id, entry), entry])).entries()];
    const existing = await prisma.teacherAiMemory.findMany({ where: { userId: user.id, id: { in: entries.map(([id]) => id) } }, select: { id: true } });
    const existingIds = new Set(existing.map(entry => entry.id));
    const pending = entries.filter(([id]) => !existingIds.has(id));
    if (body.dryRun !== false) return NextResponse.json({ dryRun: true, total: archive.memories.length, toImport: pending.length, duplicates: archive.memories.length - pending.length,
      message: 'Ghi chú nhập sẽ để tắt; bạn tự chọn mục muốn áp dụng. Không ghi đè ghi chú hiện có.' });
    if (body.confirmPrivateOwnership !== true) throw new ApiError(400, 'Hãy xác nhận đây là bản ghi chú bạn muốn đưa vào kho riêng.');
    const created = await prisma.teacherAiMemory.createMany({ skipDuplicates: true, data: pending.map(([id, entry]) => ({
      id, userId: user.id, subject: entry.subject, category: entry.category, title: entry.title, insight: entry.insight,
      confidence: entry.confidence, sampleQuestion: entry.sampleQuestion == null ? Prisma.JsonNull : JSON.parse(JSON.stringify(entry.sampleQuestion)) as Prisma.InputJsonValue,
      evidence: entry.evidence ?? null, uncertainty: entry.uncertainty ?? null, sourceRef: entry.sourceRef == null ? Prisma.JsonNull : JSON.parse(JSON.stringify(entry.sourceRef)) as Prisma.InputJsonValue,
      sourceAction: entry.sourceAction ?? 'PRIVATE_IMPORT', isActive: false,
    })) });
    return NextResponse.json({ success: true, imported: created.count, skipped: archive.memories.length - created.count, activeByDefault: false });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: 'Tệp ghi chú chưa đúng định dạng xuất của ExamCraft.' }, { status: 400 });
    return apiErrorResponse(error, 'Không nhập được ghi chú. Tệp nguồn vẫn được giữ nguyên.');
  }
}
