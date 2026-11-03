'use client';
import {createAiProposal,currentAiProposal} from '@/lib/ai-proposal-journal';
import { useEffect, useState, useRef } from 'react';
import { chatKey, readChat, serializeChat, rememberChat, ramChat, listChatRecovery, parseChatBackupBundle, type ChatSession } from '@/lib/chat-session';
export function useChatSession(ownerId:string,documentId:string){
 const [session,setSession]=useState<ChatSession|null>(null),[notice,setNotice]=useState('');
 const slot=useRef(''),writable=useRef(true),unreadable=useRef<string|null>(null);
 useEffect(()=>{
  let cancelled=false;let release:()=>void=()=>{};
  const initialize=(writer:string,previousWriter?:string)=>{
   if(cancelled)return;
   let restored:ChatSession={formatVersion:1,ownerId,documentId,conversationId:crypto.randomUUID(),turns:[],pending:false,draft:''};
   try{
    slot.current=chatKey(ownerId,documentId,writer);
    const memory=ramChat(slot.current)??(previousWriter?ramChat(chatKey(ownerId,documentId,previousWriter)):null);
    let raw=memory;try{raw=raw??localStorage.getItem(slot.current)??(previousWriter?localStorage.getItem(chatKey(ownerId,documentId,previousWriter)):null);}catch{writable.current=false;setNotice('Bộ nhớ máy bị chặn; hội thoại đang giữ trong RAM, hãy tải trước khi đóng.');}
    if(raw){unreadable.current=raw;restored=readChat(raw,ownerId,documentId,!!memory);unreadable.current=null;}
    if(previousWriter)restored={...restored,conversationId:crypto.randomUUID()};
    if(restored.pending){restored={...restored,pending:false};setNotice('Lượt trước bị gián đoạn; chưa rõ kết quả. Yêu cầu còn trong lịch sử, chưa tự gọi lại AI.');}
   }catch{writable.current=false;setNotice('Chưa đọc được hội thoại trên máy. Bản cũ vẫn giữ; hãy tải hội thoại trước khi đóng.');}
   setSession(restored);
  };
  const start=async()=>{
   let writer:string;
   try{writer=sessionStorage.getItem('examcraft:chat-writer')||crypto.randomUUID();sessionStorage.setItem('examcraft:chat-writer',writer);}
   catch{writable.current=false;initialize(crypto.randomUUID());setNotice('Bộ nhớ phiên bị chặn. Hội thoại chỉ giữ trong RAM; hãy tải trước khi đóng.');return;}
   if(!navigator.locks){writable.current=false;initialize(writer);setNotice('Trình duyệt chưa hỗ trợ giữ phiên riêng. Hội thoại được giữ trong RAM; hãy tải trước khi đóng.');return;}
   await navigator.locks.request('examcraft-chat-writer:'+writer,{ifAvailable:true},async lock=>{
    if(cancelled)return;
    if(!lock){const previous=writer;writer=crypto.randomUUID();sessionStorage.setItem('examcraft:chat-writer',writer);await navigator.locks.request('examcraft-chat-writer:'+writer,async()=>{initialize(writer,previous);await new Promise<void>(resolve=>{release=resolve;if(cancelled)resolve();});});return;}
    else initialize(writer);
    await new Promise<void>(resolve=>{release=resolve;if(cancelled)resolve();});
   });
  };
  void start().catch(()=>{if(!cancelled){writable.current=false;initialize(crypto.randomUUID());setNotice('Chưa giữ được phiên riêng trên máy; hãy tải hội thoại trước khi đóng.');}});
  return()=>{cancelled=true;release();};
 },[ownerId,documentId]);
 useEffect(()=>{
  if(!session||!slot.current)return;
  try{rememberChat(slot.current,session);}catch{queueMicrotask(()=>setNotice('Hội thoại đã vượt giới hạn giữ trên máy. Nội dung vẫn còn trong phiên; hãy tải về rồi mở yêu cầu mới.'));return;}
  if(!writable.current)return;
  try{localStorage.setItem(slot.current,serializeChat(session));}
  catch{queueMicrotask(()=>setNotice('Chưa giữ được hội thoại trên máy. Nội dung còn trong phiên này; hãy tải trước khi đóng.'));}
 },[session]);
 const archiveCurrent=()=>{
  if(!session||session.pending)return false;
  try{const raw=serializeChat(session),archive=slot.current+':archive:'+session.conversationId+':'+crypto.randomUUID();const existing=localStorage.getItem(archive);if(existing!==null&&existing!==raw)throw Error('archive-conflict');localStorage.setItem(archive,raw);if(localStorage.getItem(archive)!==raw)throw Error('archive-write');}
  catch{setNotice('Chưa cất được hội thoại cũ. Hãy tải về trước; chưa mở yêu cầu mới.');return false;}
  return true;
 };
 const startNew=()=>{
  if(!session||!archiveCurrent())return false;
  setSession({...session,conversationId:crypto.randomUUID(),turns:[],draft:'',freeAnswer:'',clarification:null,pending:false});return true;
 };
 const recovery=()=>{let entries:ReturnType<typeof listChatRecovery>=[];try{entries=listChatRecovery(ownerId,documentId,slot.current,localStorage);}catch{/* Source bytes still available below. */}if(unreadable.current!==null)entries.unshift({key:slot.current+':unreadable-source',raw:unreadable.current});return entries;};
 const restore=(raw:string)=>{
  let bundle:ReturnType<typeof parseChatBackupBundle>;
  try{bundle=parseChatBackupBundle(raw,ownerId,documentId);}catch{setNotice('Bản dự phòng chưa đúng định dạng, quá lớn hoặc thuộc tài khoản/đề khác. Bản hiện tại được giữ.');return null;}
  if(bundle.proposal&&currentAiProposal(ownerId,documentId,'copilot')){setNotice('Hãy cất hoặc nhận đề xuất hiện tại trước khi nhập đề xuất khác. Bản gốc vẫn giữ.');return null;}
  if(!archiveCurrent())return null;
  if(bundle.proposal){try{const record=bundle.proposal;if(record.kind!=='copilot')throw Error('Unsupported backup kind');createAiProposal({kind:'copilot',base:record.base,result:record.result});}catch{setNotice('Chưa mở được đề xuất trong bản dự phòng. Bản hiện tại và tệp gốc được giữ.');return null;}}
  const next={...bundle.session,conversationId:crypto.randomUUID(),pending:false};
  setSession(next);setNotice('Đã mở một bản hội thoại riêng. Bản trước và tệp gốc vẫn giữ; chưa gọi AI hay thay đề.');return next;
 };
 return {session,setSession,notice,startNew,recovery,restore};
}
