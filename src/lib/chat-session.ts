import {parseAiProposal,type AiProposalRecord} from './ai-proposal-journal';
import {clarificationSchema} from './copilot-clarification';
import {factOriginsSchema} from './exam-request';
import { bootstrapFactsSchema } from './exam-request';
import { z } from 'zod';
const ram=new Map<string,string>();
export function rememberChat(key:string,session:ChatSession){ram.set(key,JSON.stringify(chatSessionSchema.parse(session)));}
export function ramChat(key:string){return ram.get(key)??null;}
export const CHAT_LIMIT = 200 * 1024;
const turn = z.object({ id: z.string().max(100), role: z.enum(['user','assistant']), text: z.string().max(12000) }).strict();
export const chatSessionSchema = z.object({ formatVersion: z.literal(1), ownerId: z.string(), documentId: z.string(), conversationId: z.string(), turns: z.array(turn).max(200), pending: z.boolean(), bootstrapFacts:bootstrapFactsSchema.optional(),factOrigins:factOriginsSchema.optional(), clarification: clarificationSchema.nullable().optional(), freeAnswer:z.string().max(12000).optional(),draft: z.string().max(12000) }).strict();
export type ChatSession = z.infer<typeof chatSessionSchema>;
export function chatKey(owner: string, document: string, writer: string) { return `examcraft:chat:v1:${encodeURIComponent(owner)}:${encodeURIComponent(document)}:${encodeURIComponent(writer)}`; }
export function readChat(text: string, owner: string, document: string, memoryOnly=false): ChatSession {
  if (!memoryOnly && new TextEncoder().encode(text).length > CHAT_LIMIT) throw Error('CHAT_TOO_LARGE');
  const session = chatSessionSchema.parse(JSON.parse(text));
  if (session.ownerId !== owner || session.documentId !== document) throw Error('CHAT_WRONG_OWNER');
  return session;
}
export function serializeChat(session: ChatSession): string {
  const text = JSON.stringify(chatSessionSchema.parse(session));
  if (new TextEncoder().encode(text).length > CHAT_LIMIT) throw Error('CHAT_TOO_LARGE');
  return text;
}

export function copyChatSessionsAfterCreate(owner:string,from:string,to:string,storage:Pick<Storage,'getItem'|'setItem'|'key'|'length'>):boolean {
 const prefix=chatKey(owner,from,'');const entries=new Set([...ram.keys()].filter(key=>key.startsWith(prefix)&&!key.includes(':archive:')));let complete=true;
 try{for(let i=0;i<storage.length;i++){const key=storage.key(i);if(key?.startsWith(prefix)&&!key.includes(':archive:'))entries.add(key);}}catch{complete=false;}
 for(const key of entries){try{const memory=ram.get(key),raw=memory??storage.getItem(key);if(!raw)continue;const session=readChat(raw,owner,from,!!memory),newKey=chatKey(owner,to,decodeURIComponent(key.slice(prefix.length))),copied=JSON.stringify({...session,documentId:to});
 let existing:string|null=null;try{existing=storage.getItem(newKey);}catch{complete=false;}
 if(existing!==null&&existing!==copied){complete=false;continue;}
 const remembered=ram.get(newKey);if(remembered&&remembered!==copied){complete=false;continue;}
 ram.set(newKey,copied);
 try{if(new TextEncoder().encode(copied).length>CHAT_LIMIT)throw Error('large');storage.setItem(newKey,copied);if(storage.getItem(newKey)!==copied)complete=false;}catch{complete=false;}
 }catch{complete=false;}}
 return complete;
}

export interface ChatRecoveryEntry {key:string;raw:string;session?:ChatSession}
/** Read only the exact owner's document; unreadable bytes are downloadable, never rewritten. */
export function listChatRecovery(owner:string,document:string,currentKey:string,storage:Pick<Storage,'getItem'|'key'|'length'>):ChatRecoveryEntry[]{
 const prefix=chatKey(owner,document,'');const entries=new Map<string,string>();
 try{for(let i=0;i<storage.length;i++){const key=storage.key(i);if(key?.startsWith(prefix)&&key!==currentKey){const raw=storage.getItem(key);if(raw!==null)entries.set(key,raw);}}}catch{/* RAM entries remain. */}
 for(const [key,raw]of ram)if(key.startsWith(prefix)&&key!==currentKey)entries.set(key,raw);
 return [...entries].map(([key,raw])=>{try{return {key,raw,session:readChat(raw,owner,document,true)};}catch{return {key,raw};}});
}
export function parseChatBackup(raw:string,owner:string,document:string):ChatSession{
 if(new TextEncoder().encode(raw).length>4*1024*1024)throw Error('CHAT_TOO_LARGE');
 const value=JSON.parse(raw);return readChat(JSON.stringify(value?.session??value),owner,document);
}

export function parseChatBackupBundle(raw:string,owner:string,document:string):{session:ChatSession;proposal?:AiProposalRecord}{
 const session=parseChatBackup(raw,owner,document),value=JSON.parse(raw);
 const proposal=value?.session&&value.proposal?parseAiProposal(typeof value.proposal==='string'?value.proposal:JSON.stringify(value.proposal),owner,document):undefined;
 return {session,...(proposal?{proposal}:{})};
}
