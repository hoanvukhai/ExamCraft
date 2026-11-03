import test from 'node:test';
import assert from 'node:assert/strict';
import {chatKey, readChat, serializeChat, type ChatSession} from '../src/lib/chat-session';
import {classifyProviderFailure} from '../src/lib/ai-policy';
const session: ChatSession = {formatVersion:1,ownerId:'teacher-a',documentId:'exam-a',conversationId:'conversation-a',turns:[{id:'one',role:'user',text:'Đề vào 10 Hà Nội; không chuyên'},{id:'two',role:'assistant',text:'Năm nào?'},{id:'three',role:'user',text:'2026'}],pending:true,draft:'B đang gõ'};
test('chat roundtrip preserves initial request, answers, pending and a separate composer',()=>assert.deepEqual(readChat(serializeChat(session),'teacher-a','exam-a'),session));
test('chat slots isolate writer, owner and document; a wrong owner or unknown format is rejected',()=>{
  assert.notEqual(chatKey('a','b','c'),chatKey('a','b','d'));
  assert.notEqual(chatKey('a:b','c','d'),chatKey('a','b:c','d'));
  assert.throws(()=>readChat(JSON.stringify(session),'teacher-b','exam-a'));
  assert.throws(()=>readChat(JSON.stringify({...session,formatVersion:2}),'teacher-a','exam-a'));
  assert.throws(()=>readChat('{broken','teacher-a','exam-a'));
});
test('oversize chat is rejected without returning silently truncated history; reserved key fields cannot be serialized',()=>{
  assert.throws(()=>serializeChat({...session,turns:Array.from({length:25},(_,i)=>({id:String(i),role:'user',text:'x'.repeat(12000)}))}));
  assert.throws(()=>serializeChat({...session,apiKey:'fake-secret'} as ChatSession));
});
test('provider classification: nested status, expired/leaked keys, billing and manual quota retry',()=>{
  assert.equal(classifyProviderFailure({error:{code:429,message:'quota'}}).code,'RATE_LIMITED');
  assert.equal(classifyProviderFailure({status:400,message:'API key expired. Please renew it.'}).code,'EXPIRED_KEY');
  assert.equal(classifyProviderFailure({status:403,message:'Your key was reported as leaked'}).code,'REVOKED_KEY');
  assert.equal(classifyProviderFailure({status:402}).code,'BILLING_REQUIRED');
  assert.equal(classifyProviderFailure({status:429}).retryAnotherKey,false);
  assert.equal(classifyProviderFailure({status:503}).retryAnotherKey,false);
  assert.equal(classifyProviderFailure({status:403,message:'Region restricted'}).disableKey,false);
});
