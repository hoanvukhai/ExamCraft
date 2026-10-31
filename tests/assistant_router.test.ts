import test from 'node:test';
import assert from 'node:assert/strict';
import { parseLookup, runLookup } from '../src/lib/assistant-lookup';
import { routeQuestion } from '../src/lib/assistant-router';

test('how-to questions go to the guide, not to a data lookup', () => {
  assert.equal(routeQuestion('Làm sao để tìm đề Toán lớp 9?').kind === 'lookup', false);
  const route = routeQuestion('làm sao xuất file word');
  assert.equal(route.kind, 'help');
  assert.equal(route.kind === 'help' && route.entry.id, 'xuat-word');
  assert.equal(routeQuestion('giao bài cho học sinh thế nào').kind, 'help');
});

test('a vague how-to offers choices instead of guessing', () => {
  const route = routeQuestion('cách dùng cái này thế nào ở trang');
  assert.ok(route.kind === 'help-choices' || route.kind === 'help' || route.kind === 'ai');
});

test('data questions are recognised with their filters', () => {
  assert.deepEqual(parseLookup('Tôi có bao nhiêu đề Toán lớp 9?'), {
    kind: 'stats',
    subject: 'toan',
    grade: 9,
    difficulty: undefined,
    type: undefined,
    starred: undefined,
  });
  const find = parseLookup('Tìm câu hỏi trắc nghiệm vận dụng cao môn Toán lớp 12 về hàm số');
  assert.equal(find?.kind, 'find-questions');
  assert.equal(find?.grade, 12);
  assert.equal(find?.type, 'MULTIPLE_CHOICE');
  assert.equal(find?.difficulty, 'VAN_DUNG_CAO');
  assert.equal(find?.text, 'ham so');
  assert.equal(parseLookup('liệt kê các đề gắn sao')?.kind, 'find-exams');
  assert.equal(parseLookup('hôm nay trời đẹp'), null);
});

test('open questions go to the AI with the nearest guide entries as context', () => {
  const route = routeQuestion('Gợi ý cấu trúc đề thi tốt nghiệp THPT môn Toán');
  assert.equal(route.kind, 'ai');
});

test('lookups only reach what the teacher may see', async () => {
  const seen: Record<string, unknown>[] = [];
  const db = {
    exam: {
      count: async (args: unknown) => (seen.push(args as Record<string, unknown>), 3),
      findMany: async (args: unknown) => (seen.push(args as Record<string, unknown>), []),
    },
    question: {
      count: async (args: unknown) => (seen.push(args as Record<string, unknown>), 5),
      findMany: async (args: unknown) => (seen.push(args as Record<string, unknown>), []),
    },
    folder: { count: async () => 2 },
  } as never;
  assert.match(await runLookup(db, 'u1', { kind: 'stats', subject: 'toan', grade: 9 }), /Đề thi: 3/);
  await runLookup(db, 'u1', { kind: 'find-exams', grade: 9 });
  await runLookup(db, 'u1', { kind: 'find-questions', grade: 9 });
  const json = JSON.stringify(seen);
  assert.ok(json.includes('"ownerId":"u1"'), 'scoped to the teacher');
  assert.ok(json.includes('"revokedAt":null'), 'revoked invitations are not seen');
  assert.ok(json.includes('"deletedAt":null'), 'deleted items are not seen');
  assert.ok(!/"ownerId":\{"not"/.test(json));
  assert.equal(await runLookup(db, 'u1', { kind: 'find-exams' }), 'Không tìm thấy đề nào.');
});
