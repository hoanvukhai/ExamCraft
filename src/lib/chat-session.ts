import { z } from 'zod';
export const CHAT_LIMIT = 200 * 1024;
const turn = z.object({ id: z.string().max(100), role: z.enum(['user','assistant']), text: z.string().max(12000) }).strict();
export const chatSessionSchema = z.object({ formatVersion: z.literal(1), ownerId: z.string(), documentId: z.string(), conversationId: z.string(), turns: z.array(turn).max(200), pending: z.boolean(), clarification: z.object({questionId:z.string().max(100),message:z.string().max(4000),quickOptions:z.array(z.string().max(300)).max(6)}).nullable().optional(), draft: z.string().max(12000) }).strict();
export type ChatSession = z.infer<typeof chatSessionSchema>;
export function chatKey(owner: string, document: string, writer: string) { return `examcraft:chat:v1:${encodeURIComponent(owner)}:${encodeURIComponent(document)}:${encodeURIComponent(writer)}`; }
export function readChat(text: string, owner: string, document: string): ChatSession {
  if (new TextEncoder().encode(text).length > CHAT_LIMIT) throw Error('CHAT_TOO_LARGE');
  const session = chatSessionSchema.parse(JSON.parse(text));
  if (session.ownerId !== owner || session.documentId !== document) throw Error('CHAT_WRONG_OWNER');
  return session;
}
export function serializeChat(session: ChatSession): string {
  const text = JSON.stringify(chatSessionSchema.parse(session));
  if (new TextEncoder().encode(text).length > CHAT_LIMIT) throw Error('CHAT_TOO_LARGE');
  return text;
}
