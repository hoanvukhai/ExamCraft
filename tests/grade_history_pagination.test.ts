import test from 'node:test';
import assert from 'node:assert/strict';
import { GRADE_HISTORY_PAGE_SIZE, GradeHistoryCursorError, decodeGradeHistoryCursor, encodeGradeHistoryCursor, gradeHistoryWhere, pageGradeHistory } from '../src/lib/grade-history-pagination';

interface Row { id: string; createdAt: Date; targetId: string; action: string }
const at = (ms: number) => new Date(Date.UTC(2026, 9, 24, 8, 0, 0, ms));
const row = (id: string, ms: number, targetId = 'att1', action = 'attempt.grade'): Row => ({ id, createdAt: at(ms), targetId, action });

// Independent stand-in for the database: evaluates the where object and sorts by (createdAt desc, id desc).
type Where = ReturnType<typeof gradeHistoryWhere>;
function fakeQuery(table: Row[], where: Where, take: number) {
  const clause = (where as { OR?: { createdAt: Date | { lt: Date }; id?: { lt: string } }[] }).OR;
  const matchesCursor = (r: Row) => !clause || clause.some(c => {
    if (c.createdAt instanceof Date) return r.createdAt.getTime() === c.createdAt.getTime() && r.id < (c.id as { lt: string }).lt;
    return r.createdAt.getTime() < c.createdAt.lt.getTime();
  });
  return table.filter(r => r.action === where.action && r.targetId === where.targetId && matchesCursor(r))
    .sort((x, y) => y.createdAt.getTime() - x.createdAt.getTime() || (x.id < y.id ? 1 : x.id > y.id ? -1 : 0)).slice(0, take);
}
function readAll(table: Row[], size: number, between?: (page: number) => void) {
  const seen: string[] = []; let cursorText: string | null = null; let page = 0;
  for (;;) {
    const cursor: ReturnType<typeof decodeGradeHistoryCursor> | undefined = cursorText ? decodeGradeHistoryCursor(cursorText, 'att1') : undefined;
    const result: ReturnType<typeof pageGradeHistory<Row>> = pageGradeHistory('att1', fakeQuery(table, gradeHistoryWhere('att1', cursor), size + 1), size);
    const { items, hasMore, nextCursor } = result;
    seen.push(...items.map(item => item.id));
    if (!hasMore) return seen;
    assert.ok(nextCursor);
    cursorText = nextCursor; between?.(++page);
  }
}

test('cursor round-trips the last row and is bound to its attempt', () => {
  const text = encodeGradeHistoryCursor('att1', { createdAt: at(123), id: 'c9' });
  assert.deepEqual(decodeGradeHistoryCursor(text, 'att1'), { createdAt: at(123), id: 'c9' });
  assert.throws(() => decodeGradeHistoryCursor(text, 'att2'), GradeHistoryCursorError);
});

test('malformed or forged cursors are rejected, never guessed', () => {
  const good = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
  for (const bad of ['', 'not base64!', '%%%', 'e30', good(null), good([]), good({ a: 'att1' }), good({ a: 'att1', t: 'yesterday', i: 'x' }), good({ a: 'att1', t: '2026-10-24T08:00:00Z', i: 'x' }), good({ a: 'att1', t: at(1).toISOString(), i: 5 }), good({ a: 'att1', t: at(1).toISOString(), i: '' }), good({ a: ['att1'], t: at(1).toISOString(), i: 'x' }), 'A'.repeat(400)])
    assert.throws(() => decodeGradeHistoryCursor(bad, 'att1'), GradeHistoryCursorError, bad.slice(0, 20));
});

test('query without a cursor is the old first page; with a cursor it stays pinned to the same attempt and action', () => {
  assert.deepEqual(gradeHistoryWhere('att1'), { action: 'attempt.grade', targetType: 'Attempt', targetId: 'att1' });
  const cursor = decodeGradeHistoryCursor(encodeGradeHistoryCursor('att1', { createdAt: at(5), id: 'b' }), 'att1');
  const where = gradeHistoryWhere('att1', cursor);
  assert.equal(where.targetId, 'att1'); assert.equal(where.action, 'attempt.grade');
  const table = [row('a', 9), row('b', 5), row('c', 4), row('z', 1, 'att2'), row('y', 1, 'att1', 'attempt.other')];
  assert.deepEqual(fakeQuery(table, where, 10).map(r => r.id), ['c']);
});

test('pages with many identical timestamps neither repeat nor skip rows', () => {
  const table = [...Array.from({ length: 7 }, (_, i) => row('t' + i, 500)), row('n1', 900), row('o1', 100), row('o2', 100), row('o3', 100), row('o4', 5)];
  const expected = fakeQuery(table, gradeHistoryWhere('att1'), 100).map(r => r.id);
  for (const size of [1, 2, 3, 4, 5, 12]) {
    const got = readAll(table, size);
    assert.deepEqual(got, expected, 'size ' + size);
    assert.equal(new Set(got).size, got.length);
  }
});

test('a grade saved between two loads does not duplicate or hide older rows', () => {
  const table = Array.from({ length: 9 }, (_, i) => row('r' + i, 100 + Math.floor(i / 3)));
  const before = fakeQuery(table, gradeHistoryWhere('att1'), 100).map(r => r.id);
  const got = readAll(table, 3, page => { if (page === 1) table.push(row('new', 5000), row('new2', 5000)); });
  assert.deepEqual(got, before);
  // A fresh first page (what the screen reloads after saving) leads with the new rows.
  assert.deepEqual(readAll(table, 50).slice(0, 2), ['new2', 'new']);
});

test('page boundary: exactly one page has no cursor, one more row gives a cursor to a last single row', () => {
  const full = Array.from({ length: GRADE_HISTORY_PAGE_SIZE }, (_, i) => row('f' + String(i).padStart(2, '0'), 1000 - i));
  const one = pageGradeHistory('att1', fakeQuery(full, gradeHistoryWhere('att1'), GRADE_HISTORY_PAGE_SIZE + 1));
  assert.deepEqual([one.items.length, one.hasMore, one.nextCursor], [GRADE_HISTORY_PAGE_SIZE, false, null]);
  const more = [...full, row('last', 1)];
  const first = pageGradeHistory('att1', fakeQuery(more, gradeHistoryWhere('att1'), GRADE_HISTORY_PAGE_SIZE + 1));
  assert.equal(first.hasMore, true); assert.equal(first.items.length, GRADE_HISTORY_PAGE_SIZE); assert.ok(first.nextCursor);
  const second = pageGradeHistory('att1', fakeQuery(more, gradeHistoryWhere('att1', decodeGradeHistoryCursor(first.nextCursor, 'att1')), GRADE_HISTORY_PAGE_SIZE + 1));
  assert.deepEqual([second.items.map(r => r.id), second.hasMore, second.nextCursor], [['last'], false, null]);
  assert.deepEqual(pageGradeHistory('att1', []), { items: [], hasMore: false, nextCursor: null });
});
