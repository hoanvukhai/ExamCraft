'use client';
import {useState} from 'react';
import type {ChatRecoveryEntry,ChatSession} from '@/lib/chat-session';
export function ChatRecoveryTools({disabled,recovery,restore,onRestore}:{disabled:boolean;recovery:()=>ChatRecoveryEntry[];restore:(raw:string)=>ChatSession|null;onRestore:(session:ChatSession)=>void}){
 const [entries,setEntries]=useState<ChatRecoveryEntry[]>([]),[message,setMessage]=useState('');
 const load=(raw:string)=>{const session=restore(raw);if(session){onRestore(session);setEntries(recovery());}};
 const download=(entry:ChatRecoveryEntry)=>{const url=URL.createObjectURL(new Blob([entry.raw],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='examcraft-hoi-thoai-goc.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 return <details className="text-xs space-y-2" onToggle={event=>{if(event.currentTarget.open)setEntries(recovery());}}><summary className="cursor-pointer min-h-11 py-3">Hội thoại đã cất và bản dự phòng</summary>
 <p>Chỉ mở hội thoại cùng tài khoản và cùng đề. Đề xuất kèm tệp chỉ mở để duyệt; không tự gọi AI hay thay nội dung đề.</p>
 <label className="block min-h-11 py-2">Nhập bản dự phòng hội thoại<input type="file" accept=".json,application/json" disabled={disabled} className="block max-w-full" onChange={async event=>{const file=event.target.files?.[0];event.target.value='';if(!file)return;if(file.size>4*1024*1024){setMessage('Tệp vượt 4 MB. Hãy giữ bản gốc và chọn bản dự phòng nhỏ hơn. Hội thoại nhập vẫn giới hạn 200 KB.');return;}try{load(await file.text());}catch{setMessage('Chưa đọc được tệp; bản hiện tại được giữ.');}}}/></label>
 {message&&<p role="status">{message}</p>}
 <div className="max-h-60 overflow-auto space-y-2">{entries.map(entry=><div key={entry.key} className="border rounded-lg p-2"><p className="break-words">{entry.session?(entry.session.turns.find(t=>t.role==='user')?.text||entry.session.draft||'Hội thoại trống').slice(0,100):'Bản chưa đọc được; có thể tải nguyên gốc'}</p><div className="flex flex-wrap gap-2"><button type="button" className="underline min-h-11" onClick={()=>download(entry)}>Tải bản gốc</button>{entry.session&&<button type="button" disabled={disabled} className="underline min-h-11" onClick={()=>load(entry.raw)}>Mở hội thoại này</button>}</div></div>)}</div></details>;
}
