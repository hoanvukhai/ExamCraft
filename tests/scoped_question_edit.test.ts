import test from 'node:test';
import assert from 'node:assert/strict';
import { projectScopedQuestionEdit } from '../src/lib/scoped-question-edit';
import type { Question } from '../src/types/exam';
const base:Question={id:'q',type:'multiple_choice',difficulty:'thong_hieu',content:'Original',choices:[{key:'A',text:'a'},{key:'B',text:'b',pinned:true,figures:[{id:'f',kind:'image',data:{url:'safe'}}]}],correct_answer:'B',step_by_step_solution:'Giữ lời giải',points:2};
test('a scoped option suggestion cannot overwrite answer, marks, other text or option media',()=>{
 const suggestion={...base,content:'forbidden',correct_answer:'A',points:999,choices:[{key:'B',text:'new',figures:[]}]};
 const next=projectScopedQuestionEdit(base,suggestion,'Phương án B');
 assert.equal(next.content,base.content);assert.equal(next.correct_answer,'B');assert.equal(next.points,2);assert.equal(next.step_by_step_solution,base.step_by_step_solution);assert.equal(next.choices![0].text,'a');assert.equal(next.choices![1].text,'new');assert.deepEqual(next.choices![1].figures,base.choices![1].figures);assert.equal(base.choices![1].text,'b');
});
test('missing, unsupported or empty targets fail without replacing the source',()=>{
 assert.throws(()=>projectScopedQuestionEdit(base,{...base,choices:[]},'Phương án B'));
 assert.throws(()=>projectScopedQuestionEdit(base,base,'Phương án Z'));
 assert.throws(()=>projectScopedQuestionEdit(base,base,'Toàn đề'));
});
