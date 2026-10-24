export const GRADE_HISTORY_PAGE_SIZE = 50;

export interface GradeHistoryPosition { createdAt: Date; id: string }
export class GradeHistoryCursorError extends Error { constructor() { super('Mốc lịch sử không hợp lệ hoặc thuộc bài làm khác. Hãy mở lại bài để tải lịch sử từ đầu.'); } }

/** Opaque cursor = last row shown (createdAt + id) bound to the attempt it was issued for. */
export function encodeGradeHistoryCursor(attemptId: string, last: GradeHistoryPosition) {
  return Buffer.from(JSON.stringify({ a: attemptId, t: last.createdAt.toISOString(), i: last.id }), 'utf8').toString('base64url');
}

export function decodeGradeHistoryCursor(raw: string, attemptId: string): GradeHistoryPosition {
  try {
    if (raw.length > 300 || !/^[A-Za-z0-9_-]+$/.test(raw)) throw new GradeHistoryCursorError();
    const value: unknown = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
    if (typeof value !== 'object' || value === null) throw new GradeHistoryCursorError();
    const { a, t, i } = value as Record<string, unknown>;
    if (a !== attemptId || typeof t !== 'string' || typeof i !== 'string' || !i || i.length > 100) throw new GradeHistoryCursorError();
    const createdAt = new Date(t);
    if (Number.isNaN(createdAt.getTime()) || createdAt.toISOString() !== t) throw new GradeHistoryCursorError();
    return { createdAt, id: i };
  } catch (error) {
    throw error instanceof GradeHistoryCursorError ? error : new GradeHistoryCursorError();
  }
}

/** Rows strictly after the cursor in (createdAt desc, id desc) order; the same predicate Prisma runs in SQL. */
export function gradeHistoryWhere(attemptId: string, cursor?: GradeHistoryPosition) {
  const base = { action: 'attempt.grade', targetType: 'Attempt', targetId: attemptId };
  if (!cursor) return base;
  return { ...base, OR: [{ createdAt: { lt: cursor.createdAt } }, { createdAt: cursor.createdAt, id: { lt: cursor.id } }] };
}

/** Rows were read with take = size + 1; trim the probe row and say how to continue. */
export function pageGradeHistory<T extends GradeHistoryPosition>(attemptId: string, rows: T[], size = GRADE_HISTORY_PAGE_SIZE) {
  const items = rows.slice(0, size);
  const hasMore = rows.length > size;
  return { items, hasMore, nextCursor: hasMore && items.length ? encodeGradeHistoryCursor(attemptId, items[items.length - 1]) : null };
}
