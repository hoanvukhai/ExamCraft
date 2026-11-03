import test from 'node:test';
import assert from 'node:assert/strict';
import type {Exam,Question} from '../src/types/exam';
import {applyCopilotSubmission,captureCopilotBase,prepareCopilotSubmission} from '../src/lib/copilot-submission';
import {makeChange,revertChange,type Change} from '../src/lib/undo-history';
import {reconcileQuestionOutline} from '../src/lib/exam-outline';
import {withEditorParts} from '../src/lib/editor-parts';
const fixture=():Exam=>withEditorParts({id:'doc',createdAt:'2026-11-03T00:00:00Z',updatedAt:'2026-11-03T00:00:00Z',metadata:{title:'Title',subject:'toan',grade:6,schoolName:'',departmentName:''},questions:[{id:'a',type:'essay',difficulty:'thong_hieu',content:'Original',step_by_step_solution:'Original solution',points:0,version:3,status:'verified',verifiedBy:'human',figures:[{id:'f',kind:'image',data:{url:'/qa.png'}}]}]});
const candidate:Question={id:'provider',type:'essay',difficulty:'van_dung',content:'AI prompt',step_by_step_solution:'AI solution'};
const travel=(exam:Exam,change:Change,redo=false)=>withEditorParts(revertChange(exam,redo?{...change,before:change.after,after:change.before}:change).exam);
function accept(exam:Exam,action:string){const submission=prepareCopilotSubmission(captureCopilotBase('owner',exam),{action,targetQuestionId:'a',modifiedQuestion:candidate},'owner',exam);assert.ok(submission);const after=withEditorParts(reconcileQuestionOutline(exam,applyCopilotSubmission(exam,submission,'owner')));const change=makeChange(exam,after);assert.ok(change);return {after,change};}

test('Copilot uses the common undo: edit/redo preserves the exact image, zero score and stable ID',()=>{
 const before=fixture(),{after,change}=accept(before,'modify_single_question');const undone=travel(after,change),redone=travel(undone,change,true);
 assert.equal(undone.questions[0].content,'Original');assert.deepEqual(undone.questions[0].figures,before.questions[0].figures);assert.equal(undone.questions[0].points,0);assert.equal(redone.questions[0].id,'a');assert.equal(redone.questions[0].content,'AI prompt');assert.equal(redone.questions[0].verifiedBy,'none');
});
test('two accepted operations, two common undos and redos preserve added IDs and outline without duplicates',()=>{
 const original=fixture(),first=accept(original,'modify_single_question'),second=accept(first.after,'add_question');const addedId=second.after.questions[1].id;
 const undoAdd=travel(second.after,second.change),undoEdit=travel(undoAdd,first.change);assert.equal(undoEdit.questions.length,1);assert.equal(undoEdit.questions[0].content,'Original');
 const redoEdit=travel(undoEdit,first.change,true),redoAdd=travel(redoEdit,second.change,true);assert.equal(redoAdd.questions.length,2);assert.equal(redoAdd.questions[1].id,addedId);assert.equal(new Set(redoAdd.questions.map(q=>q.id)).size,2);
});
test('common undo restores a deleted question at its original location and redo removes only that row',()=>{
 const before=fixture(),{after,change}=accept(before,'delete_question');assert.equal(after.questions.length,0);const restored=travel(after,change);assert.equal(restored.questions[0].id,'a');assert.equal(restored.questions[0].content,'Original');assert.equal(travel(restored,change,true).questions.length,0);
});
test('newer question edits survive common undo; wrong owner, lost permission and repeated accept cannot overwrite',()=>{
 const before=fixture(),{after,change}=accept(before,'modify_single_question');const newer={...after,questions:after.questions.map(q=>({...q,content:'Newer teacher edit'}))};const result=revertChange(newer,change);assert.equal(result.exam.questions[0].content,'Newer teacher edit');assert.ok(result.skipped.length);
 const base=captureCopilotBase('owner',before),resultSpec={action:'modify_single_question',targetQuestionId:'a',modifiedQuestion:candidate};assert.equal(prepareCopilotSubmission(base,resultSpec,'other',before),null);assert.equal(prepareCopilotSubmission(base,resultSpec,'owner',{...before,access:{canEdit:false}} as Exam),null);const submission=prepareCopilotSubmission(base,resultSpec,'owner',before)!;const applied=applyCopilotSubmission(before,submission,'owner');assert.equal(applyCopilotSubmission(applied,submission,'owner'),applied);
});
