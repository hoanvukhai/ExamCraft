import { clarifyCard, clarificationReply } from '../src/lib/copilot-clarification';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  chatKey,
  readChat,
  serializeChat,
  listChatRecovery,
  parseChatBackup,
  parseChatBackupBundle,
  rememberChat,
  type ChatSession,
} from '../src/lib/chat-session';
import { classifyProviderFailure } from '../src/lib/ai-policy';
const session: ChatSession = {
  formatVersion: 1,
  ownerId: 'teacher-a',
  documentId: 'exam-a',
  conversationId: 'conversation-a',
  turns: [
    { id: 'one', role: 'user', text: 'Đề vào 10 Hà Nội; không chuyên' },
    { id: 'two', role: 'assistant', text: 'Năm nào?' },
    { id: 'three', role: 'user', text: '2026' },
  ],
  pending: true,
  draft: 'B đang gõ',
};
test('chat roundtrip preserves initial request, answers, pending and a separate composer', () =>
  assert.deepEqual(readChat(serializeChat(session), 'teacher-a', 'exam-a'), session));
test('chat slots isolate writer, owner and document; a wrong owner or unknown format is rejected', () => {
  assert.notEqual(chatKey('a', 'b', 'c'), chatKey('a', 'b', 'd'));
  assert.notEqual(chatKey('a:b', 'c', 'd'), chatKey('a', 'b:c', 'd'));
  assert.throws(() => readChat(JSON.stringify(session), 'teacher-b', 'exam-a'));
  assert.throws(() =>
    readChat(JSON.stringify({ ...session, formatVersion: 2 }), 'teacher-a', 'exam-a'),
  );
  assert.throws(() => readChat('{broken', 'teacher-a', 'exam-a'));
});
test('oversize chat is rejected without returning silently truncated history; reserved key fields cannot be serialized', () => {
  assert.throws(() =>
    serializeChat({
      ...session,
      turns: Array.from({ length: 25 }, (_, i) => ({
        id: String(i),
        role: 'user',
        text: 'x'.repeat(12000),
      })),
    }),
  );
  assert.throws(() => serializeChat({ ...session, apiKey: 'fake-secret' } as ChatSession));
});
test('provider classification: nested status, expired/leaked keys, billing and manual quota retry', () => {
  assert.equal(
    classifyProviderFailure({ error: { code: 429, message: 'quota' } }).code,
    'RATE_LIMITED',
  );
  assert.equal(
    classifyProviderFailure({ status: 400, message: 'API key expired. Please renew it.' }).code,
    'EXPIRED_KEY',
  );
  assert.equal(
    classifyProviderFailure({ status: 403, message: 'Your key was reported as leaked' }).code,
    'REVOKED_KEY',
  );
  assert.equal(classifyProviderFailure({ status: 402 }).code, 'BILLING_REQUIRED');
  assert.equal(classifyProviderFailure({ status: 429 }).retryAnotherKey, false);
  assert.equal(classifyProviderFailure({ status: 503 }).retryAnotherKey, false);
  assert.equal(
    classifyProviderFailure({ status: 403, message: 'Region restricted' }).disableKey,
    false,
  );
});

test('recovery lists exact document and owner, retains unreadable bytes, and backup import is scoped', () => {
  const map = new Map<string, string>([
    [chatKey('teacher-a', 'exam-a', 'other') + ':archive:one', serializeChat(session)],
    [chatKey('teacher-a', 'exam-a', 'broken'), 'unreadable'],
    [chatKey('teacher-b', 'exam-a', 'other'), serializeChat({ ...session, ownerId: 'teacher-b' })],
    [chatKey('teacher-a', 'exam-b', 'other'), serializeChat({ ...session, documentId: 'exam-b' })],
  ]);
  const storage = {
    key: (i: number) => [...map.keys()][i] ?? null,
    getItem: (key: string) => map.get(key) ?? null,
    get length() {
      return map.size;
    },
  };
  const entries = listChatRecovery('teacher-a', 'exam-a', '', storage);
  assert.equal(entries.length, 2);
  assert.equal(entries.find((entry) => !entry.session)?.raw, 'unreadable');
  assert.deepEqual(parseChatBackup(JSON.stringify({ session }), 'teacher-a', 'exam-a'), session);
  assert.throws(() => parseChatBackup(JSON.stringify({ session }), 'teacher-b', 'exam-a'));
  assert.equal(map.get(chatKey('teacher-a', 'exam-a', 'broken')), 'unreadable');
  rememberChat(chatKey('ram-recovery', 'exam', 'writer') + ':archive:one', {
    ...session,
    ownerId: 'ram-recovery',
    documentId: 'exam',
  });
  assert.equal(listChatRecovery('ram-recovery', 'exam', '', storage).length, 1);
});

test('clarification options have card-specific IDs and free replies keep their question identity', () => {
  const card = clarifyCard('question-one', 'Năm nào?', ['2026', '2026']);
  assert.notEqual(card.options![0].id, card.options![1].id);
  const restored = readChat(
    serializeChat({ ...session, clarification: card }),
    'teacher-a',
    'exam-a',
  );
  assert.equal(
    clarificationReply(restored.clarification!, '2026', card.options![0].id).questionId,
    'question-one',
  );
  assert.equal(clarificationReply(card, '2028').value, '2028');
  assert.throws(() => clarificationReply(card, '2026', 'question-other:option:0'));
});

test('backup bundle validates proposal owner before allowing transcript restoration', () => {
  assert.deepEqual(
    parseChatBackupBundle(JSON.stringify({ session }), 'teacher-a', 'exam-a').session,
    session,
  );
  assert.throws(() =>
    parseChatBackupBundle(
      JSON.stringify({
        session,
        proposal: {
          formatVersion: 2,
          journalId: 'x',
          createdAt: 'today',
          kind: 'copilot',
          base: { ownerId: 'other', documentId: 'exam-a' },
          result: {},
        },
      }),
      'teacher-a',
      'exam-a',
    ),
  );
});
