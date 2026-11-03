import { z } from 'zod';
import type { Exam, Question, OutlineNode } from '@/types/exam';
import { displayOutline, parseCode } from './canvas-objects';
export const copilotTargetSchema=z.discriminatedUnion('kind',[
 z.object({kind:z.literal('document')}).strict(),
 z.object({kind:z.literal('questions'),ids:z.array(z.string().min(1).max(200)).min(1).max(100)}).strict(),
 z.object({kind:z.enum(['part','group']),id:z.string().min(1).max(300)}).strict(),
 z.object({kind:z.literal('field'),questionId:z.string().min(1).max(200),field:z.enum(['choices','sub_questions','parts','matchingPairs','correctOrder','figures']),key:z.string().min(1).max(200)}).strict(),
]);
export type CopilotTarget=z.infer<typeof copilotTargetSchema>;
export function selectionTarget(code:string,ids:string[]):CopilotTarget {
 if(ids.length>1)return {kind:'questions',ids:[...ids]};
 const object=parseCode(code);
 if(object.kind==='part'||object.kind==='group')return {kind:object.kind,id:object.id};
 if(object.kind==='question')return {kind:'questions',ids:[object.id]};
 if('question' in object){
  const fields={choice:'choices',statement:'sub_questions',item:'parts',pair:'matchingPairs',order:'correctOrder',figure:'figures'} as const;
  return {kind:'field',questionId:object.question,field:fields[object.kind],key:object.kind==='figure'?object.id:object.key};
 }
 return ids.length?{kind:'questions',ids:[...ids]}:{kind:'document'};
}
export function resolveCopilotTarget(exam:Exam,input:unknown):{target:CopilotTarget;ids:string[]} {
 const target=copilotTargetSchema.parse(input);
 let ids:string[]=[];
 if(target.kind==='document')ids=exam.questions.map(q=>q.id);
 else if(target.kind==='questions')ids=target.ids;
 else if(target.kind==='field')ids=[target.questionId];
 else {
  const find=(nodes:OutlineNode[]):OutlineNode|undefined=>{for(const node of nodes){if(node.id===target.id&&node.kind===target.kind)return node;const nested=node.children&&find(node.children);if(nested)return nested;}};
  const node=find(displayOutline(exam));if(!node)throw Error('Phần/ngữ liệu đang chọn không còn trong đề.');
  const collect=(node:OutlineNode)=>{if(node.questionId)ids.push(node.questionId);node.children?.forEach(collect);};collect(node);
 }
 if(new Set(ids).size!==ids.length||ids.some(id=>!exam.questions.some(q=>q.id===id)))throw Error('Vùng chọn không hợp lệ.');
 if(target.kind==='field')projectQuestionField(exam.questions.find(q=>q.id===target.questionId)!,exam.questions.find(q=>q.id===target.questionId)!,target);
 return {target,ids};
}
export function projectQuestionField(before:Question,candidate:Question,target:CopilotTarget):Question {
 if(target.kind!=='field')return candidate;
 if(before.id!==target.questionId)throw Error('Sai câu đang chọn.');
 if(target.field==='correctOrder')throw Error('Hãy chọn cả câu sắp xếp để đổi thứ tự.');
 const source=before[target.field] as {id?:string;key?:string}[]|undefined;
 const changed=candidate[target.field] as {id?:string;key?:string}[]|undefined;
 const match=(entry:{id?:string;key?:string})=>(entry.key??entry.id)===target.key;
 const original=source?.find(match),next=changed?.find(match);
 if(!original||!next)throw Error('Thành phần đang chọn không còn trong câu.');
 return {...before,[target.field]:source!.map(item=>match(item)?next:item)};
}
/** Focused context may omit unselected rows, while the immutable full base stays on the client. */
export function copilotContext(exam:Exam,target:CopilotTarget):Exam {
 const {ids}=resolveCopilotTarget(exam,target);if(target.kind==='document')return exam;
 const chosen=new Set(ids);const questions=exam.questions.filter(q=>chosen.has(q.id));
 const trim=(nodes:OutlineNode[]):OutlineNode[]=>nodes.flatMap(node=>{if(node.kind==='question')return node.questionId&&chosen.has(node.questionId)?[node]:[];const children=trim(node.children??[]);return children.length||(('id' in target)&&node.id===target.id)?[{...node,children}]:[];});
 const outline=exam.outline?trim(exam.outline):undefined;
 const needed=new Set(questions.map(q=>q.passageId));
 const passagesIn=(nodes:OutlineNode[])=>nodes.forEach(node=>{if(node.passageId)needed.add(node.passageId);passagesIn(node.children??[]);});passagesIn(outline??[]);
 const passages=exam.passages?.filter(p=>needed.has(p.id));
 return {...exam,questions,passages,...(outline?{outline}:{})};
}

export function copilotTransport(exam:Exam,target:CopilotTarget){
 const context=copilotContext(exam,target);const omitted=new Set<string>();
 if(target.kind!=='document')return {exam:context,omittedImageQuestionIds:[] as string[]};
 const mediaPassages=new Set(context.passages?.filter(p=>p.figures?.length||/data:image\//.test(p.content)).map(p=>p.id));
 const text=(value:string)=>value.replace(/data:image\/[^\s)"']+/g,'[Ảnh giữ trong đề; chọn câu để AI xem ảnh]');
 const questions=context.questions.map(q=>{
  if(q.figures?.length||q.choices?.some(c=>c.figures?.length)||mediaPassages.has(q.passageId??'')||/data:image\//.test(q.content)){omitted.add(q.id);return {...q,figures:undefined,content:text(q.content),choices:q.choices?.map(c=>({...c,text:text(c.text),figures:undefined}))};}return q;
 });
 return {exam:{...context,questions,passages:context.passages?.map(p=>({...p,figures:undefined,content:text(p.content)}))},omittedImageQuestionIds:[...omitted]};
}

/** Insert next to the selected content using the same outline the editor displays. */
export function copilotInsertionPoint(exam:Exam,target:CopilotTarget){
 resolveCopilotTarget(exam,target);if(target.kind==='field')throw Error('Chọn cả câu hoặc phần để thêm câu mới.');
 const outline=displayOutline(exam);
 if(target.kind==='part'||target.kind==='group'){
  const find=(nodes:OutlineNode[]):OutlineNode|undefined=>{for(const node of nodes){if(node.id===target.id)return node;const found=node.children&&find(node.children);if(found)return found;}};
  const node=find(outline)!;return {outline,point:{parentId:node.id,afterId:node.children?.at(-1)?.id??null}};
 }
 if(target.kind==='questions'){
  const id=exam.questions.filter(q=>target.ids.includes(q.id)).at(-1)!.id;
  const find=(nodes:OutlineNode[],parentId:string|null):{parentId:string|null;afterId:string}|undefined=>{for(const node of nodes){if(node.questionId===id)return {parentId,afterId:node.id};const found=node.children&&find(node.children,node.id);if(found)return found;}};
  const point=find(outline,null);if(!point)throw Error('Điểm chèn đã thay đổi.');return {outline,point};
 }
 const last=outline.at(-1);return {outline,point:last?.kind==='part'?{parentId:last.id,afterId:last.children?.at(-1)?.id??null}:{parentId:null,afterId:last?.id??null}};
}
