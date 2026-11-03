import test from 'node:test';
import assert from 'node:assert/strict';
import type {Exam} from '../src/types/exam';
import {captureCopilotBase,metadataCopilotBase,prepareCopilotSubmission,applyCopilotSubmission} from '../src/lib/copilot-submission';
import {validateCopilotResult} from '../src/lib/copilot-result';
import {createAiProposal,parseAiProposal} from '../src/lib/ai-proposal-journal';
import {makeChange,revertChange} from '../src/lib/undo-history';
const exam=():Exam=>({id:'exam-fixture',metadata:{title:'Đề cũ',schoolName:'',departmentName:'',subject:'toan',grade:6,durationMinutes:45},questions:[],createdAt:'2026-11-03T00:00:00Z',updatedAt:'2026-11-03T00:00:00Z'});
test('metadata proposal: one atomic accept, preserves identity and supports common undo',()=>{
 const doc=exam(),base=captureCopilotBase('teacher',doc);
 const result={action:'update_metadata',metadataPatch:{title:'Đề Vật lí',subject:'vat_ly',grade:10,durationMinutes:60,academicYear:'2026 - 2027'}};
 const submission=prepareCopilotSubmission(base,result,'teacher',doc);assert.ok(submission);
 assert.equal(doc.metadata.title,'Đề cũ');
 const after=applyCopilotSubmission(doc,submission,'teacher');assert.equal(after.metadata.grade,10);assert.equal(after.metadata.durationMinutes,60);assert.equal(after.id,doc.id);
 const change=makeChange(doc,after)!;assert.deepEqual(revertChange(after,change).exam.metadata,doc.metadata);
 assert.equal(applyCopilotSubmission(after,submission,'teacher'),after,'second accept cannot apply again');
});
test('metadata reject wrong account, view-only, newer title and forbidden keys',()=>{
 const doc=exam(),base=captureCopilotBase('teacher',doc),result={action:'update_metadata',metadataPatch:{title:'Tên mới'}};
 assert.equal(prepareCopilotSubmission(base,result,'other',doc),null);
 assert.equal(prepareCopilotSubmission(base,result,'teacher',{...doc,access:{canEdit:false}} as Exam),null);
 assert.equal(prepareCopilotSubmission(base,result,'teacher',{...doc,metadata:{...doc.metadata,title:'Người khác vừa sửa'}}),null);
 for(const patch of [{ownerId:'other'},{version:999},{title:''},{grade:0},{grade:13},{subject:'invented'}]) assert.throws(()=>validateCopilotResult({type:'action',action:'update_metadata',metadataPatch:patch},doc));
});
test('title-only proposal leaves zero points, images, answer and passage untouched; subject changes need review',()=>{
 const doc=exam();doc.questions=[{id:'q',type:'short_answer',difficulty:'thong_hieu',content:'Fixture',correct_answer:'2',step_by_step_solution:'Fixture solution',points:0,figures:[{id:'image',kind:'image',data:'fixture'}]}];doc.passages=[{id:'p',content:'Passage'}];
 const base=captureCopilotBase('teacher',doc),submission=prepareCopilotSubmission(base,{action:'update_metadata',metadataPatch:{title:'Đổi tên'}},'teacher',doc)!;
 const after=applyCopilotSubmission(doc,submission,'teacher');assert.deepEqual(after.questions,doc.questions);assert.deepEqual(after.passages,doc.passages);
 assert.equal(prepareCopilotSubmission(base,{action:'update_metadata',metadataPatch:{grade:9}},'teacher',doc),null);
});
test('new metadata journal is version 2; owner guard remains and old version 1 still reads',()=>{
 const doc=exam(),base=captureCopilotBase('teacher',doc),store=new Map<string,string>();
 const storage={getItem:(key:string)=>store.get(key)??null,setItem:(key:string,value:string)=>{store.set(key,value);},removeItem:(key:string)=>{store.delete(key);},key:(i:number)=>[...store.keys()][i]??null,get length(){return store.size;}};
 const entry=createAiProposal({kind:'copilot',base,result:{action:'update_metadata',metadataPatch:{title:'New'}}},storage);
 assert.equal(parseAiProposal(entry.raw,'teacher',doc.id).formatVersion,2);assert.throws(()=>parseAiProposal(entry.raw,'other',doc.id));
 const old={...JSON.parse(entry.raw),formatVersion:1,result:{action:'delete_question',targetQuestionId:'missing'}};assert.equal(parseAiProposal(JSON.stringify(old),'teacher',doc.id).formatVersion,1);
});

test('lean metadata proposal avoids copying image bytes and never overwrites newer question content',()=>{
 const doc=exam();doc.questions=[{id:'q',type:'short_answer',difficulty:'thong_hieu',content:'old',step_by_step_solution:'',correct_answer:'1',figures:[{id:'image',kind:'image',data:'data:image/png;base64,KEEP_ORIGINAL'}]}];
 const base=metadataCopilotBase(captureCopilotBase('teacher',doc));assert.ok(!JSON.stringify(base).includes('KEEP_ORIGINAL'));
 const newer={...doc,questions:doc.questions.map(q=>({...q,content:'New local edit'}))};
 const submission=prepareCopilotSubmission(base,{action:'update_metadata',metadataPatch:{title:'Renamed'}},'teacher',newer)!;assert.ok(submission);
 const after=applyCopilotSubmission(newer,submission,'teacher');assert.equal(after.metadata.title,'Renamed');assert.deepEqual(after.questions,newer.questions);
});
