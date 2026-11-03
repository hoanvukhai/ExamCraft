import test from 'node:test';
import assert from 'node:assert/strict';
import type {Exam} from '../src/types/exam';
import {selectionTarget,resolveCopilotTarget,copilotContext,copilotTransport} from '../src/lib/copilot-target';
import {captureCopilotBase,prepareCopilotSubmission,applyCopilotSubmission} from '../src/lib/copilot-submission';
import {validateCopilotResult} from '../src/lib/copilot-result';
import {normalizeExamDocument} from '../src/lib/exam-document';
const exam=():Exam=>({id:'fixture',metadata:{title:'Fixture',subject:'toan',grade:6,schoolName:'',departmentName:''},createdAt:'2026-11-03T00:00:00Z',updatedAt:'2026-11-03T00:00:00Z',questions:['a','b','c'].map(id=>({id,type:'multiple_choice',difficulty:'thong_hieu',content:id,choices:[{key:'A',text:'A'},{key:'B',text:'B'}],correct_answer:'A',step_by_step_solution:'Solution',points:0})),outline:[{id:'part',kind:'part',sectionId:null,title:'',children:[{id:'na',kind:'question',questionId:'a'},{id:'nb',kind:'question',questionId:'b'}]},{id:'other',kind:'part',sectionId:null,title:'Other',children:[{id:'nc',kind:'question',questionId:'c'}]}]});
test('selection maps multiple IDs, part and choice keys; context keeps only target rows and a valid outline',()=>{
 const doc=exam(),target=selectionTarget('question:a',['a','b']);assert.deepEqual(resolveCopilotTarget(doc,target).ids,['a','b']);
 assert.deepEqual(resolveCopilotTarget(doc,{kind:'part',id:'part'}).ids,['a','b']);
 const context=copilotContext(doc,target);assert.deepEqual(context.questions.map(q=>q.id),['a','b']);assert.doesNotThrow(()=>normalizeExamDocument(context));
 assert.equal(selectionTarget('choice:a:B',[]).kind,'field');
 assert.throws(()=>resolveCopilotTarget(doc,{kind:'questions',ids:['a','a']}));assert.throws(()=>resolveCopilotTarget(doc,{kind:'questions',ids:['foreign']}));
});
test('bulk edits accept all selected together, retain unselected/zero score and reject missing or foreign IDs',()=>{
 const doc=exam(),target={kind:'questions' as const,ids:['a','b']},base=captureCopilotBase('owner',doc,target);
 const modifiedQuestions=doc.questions.slice(0,2).map(q=>({...q,content:'Updated '+q.id,points:9}));
 const result={action:'modify_questions',modifiedQuestions};const submission=prepareCopilotSubmission(base,result,'owner',doc)!;assert.ok(submission);
 const after=applyCopilotSubmission(doc,submission,'owner');assert.equal(after.questions[0].content,'Updated a');assert.equal(after.questions[1].content,'Updated b');assert.equal(after.questions[0].points,0);assert.deepEqual(after.questions[2],doc.questions[2]);
 assert.equal(prepareCopilotSubmission(base,{...result,modifiedQuestions:modifiedQuestions.slice(0,1)},'owner',doc),null);
 assert.throws(()=>validateCopilotResult({type:'action',...result,modifiedQuestions:[modifiedQuestions[0],doc.questions[2]]},doc,undefined,target));
});
test('field edit cannot change another answer, question content or points',()=>{
 const doc=exam(),target=selectionTarget('choice:a:B',[]),base=captureCopilotBase('owner',doc,target);
 const candidate={...doc.questions[0],content:'ILLEGAL',choices:[{key:'A',text:'ILLEGAL'},{key:'B',text:'Changed B'}]};
 const submission=prepareCopilotSubmission(base,{action:'modify_single_question',targetQuestionId:'a',modifiedQuestion:candidate},'owner',doc)!;assert.ok(submission);
 assert.equal(submission.questions[0].content,'a');assert.deepEqual(submission.questions[0].choices,[{key:'A',text:'A'},{key:'B',text:'Changed B'}]);
});
test('locked questions cannot be changed/deleted, including a forged accepted question list',()=>{
 const doc=exam();doc.questions[0].locked=true;const base=captureCopilotBase('owner',doc,{kind:'questions',ids:['a']});
 assert.equal(prepareCopilotSubmission(base,{action:'delete_question',targetQuestionId:'a'},'owner',doc),null);
 assert.equal(prepareCopilotSubmission(base,{action:'modify_questions',modifiedQuestions:[{...doc.questions[0],content:'changed'}]},'owner',doc),null);
 assert.equal(applyCopilotSubmission(doc,{base,token:'forged',questions:doc.questions.slice(1)},'owner'),doc);
});

test('document metadata request omits large image binaries while source remains unchanged; selected question sends its own images',()=>{
 const doc=exam(),image='data:image/png;base64,'+'A'.repeat(5*1024*1024);doc.questions[0].figures=[{id:'image',kind:'image',data:image}];doc.questions[0].choices![0].figures=[{id:'choice-image',kind:'image',data:image}];
 const whole=copilotTransport(doc,{kind:'document'});assert.ok(new TextEncoder().encode(JSON.stringify(whole)).length<4*1024*1024);assert.deepEqual(whole.omittedImageQuestionIds,['a']);assert.equal(doc.questions[0].figures[0].data,image);assert.equal(doc.questions[0].choices![0].figures![0].data,image);
 const focused=copilotTransport(doc,{kind:'questions',ids:['a']});assert.equal(focused.exam.questions[0].figures![0].data,image);assert.equal(focused.exam.questions.length,1);
});

test('explanation replies never become mutations, unsupported actions use a stable code',()=>{
 assert.deepEqual(validateCopilotResult({type:'answer',message:'Giải thích nội dung'},exam()),{type:'answer',message:'Giải thích nội dung'});assert.throws(()=>validateCopilotResult({type:'action',action:'execute_arbitrary'},exam()),(error:unknown)=>!!error&&typeof error==='object'&&'code' in error&&error.code==='UNSUPPORTED_ACTION');
});

test('new questions go inside the selected part or after selected rows, never another part; grade mismatch is refused',()=>{
 const doc=exam();const added={...doc.questions[0],id:'from-ai',content:'New',grade:6,subject:'toan' as const};
 for(const target of [{kind:'part' as const,id:'part'},{kind:'questions' as const,ids:['b']}]){
  const submission=prepareCopilotSubmission(captureCopilotBase('owner',doc,target),{action:'add_question',modifiedQuestion:added},'owner',doc);assert.ok(submission);const after=applyCopilotSubmission(doc,submission,'owner');assert.equal(after.questions[2].content,'New');assert.equal(after.questions[3].id,'c');assert.equal(after.outline![0].children!.length,3);assert.equal(after.outline![1].children!.length,1);
 }
 assert.equal(prepareCopilotSubmission(captureCopilotBase('owner',doc),{action:'add_question',modifiedQuestion:{...added,grade:9}},'owner',doc),null);
 assert.throws(()=>validateCopilotResult({type:'action',action:'add_question',modifiedQuestion:{...added,grade:9}},doc),error=>!!error&&typeof error==='object'&&'code' in error&&error.code==='SCOPE_MISMATCH');
});
