import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { normalizeExamDocument, normalizeQuestion, questionToDatabase } from '../src/lib/exam-document';
import { publicQuestion } from '../src/lib/public-exam';
import { generateShuffledExams } from '../src/lib/shuffler';
import { exportExamToDocx } from '../src/lib/docx-export';
const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
const figure = { id: 'fB', kind: 'image', data: { url: png }, renderedBase64: png, secret: 'remove-from-public' };
const q = normalizeQuestion({ id:'q',type:'multiple_choice',difficulty:'thong_hieu',content:'Chọn hình',choices:[{key:'A',text:'Không hình'},{key:'B',text:'Có hình',figures:[figure]}],correct_answer:'B',step_by_step_solution:'bí mật' });
const exam = normalizeExamDocument({id:'media',metadata:{title:'Media',subject:'toan',grade:6,durationMinutes:15,schoolName:'',departmentName:''},questions:[q]});
test('option figures survive canonical storage and public projection strips unrelated fields',()=>{
 const saved = questionToDatabase(q,{ ownerId:'qa', subject:'toan', grade:6, examId:'media', questionId:'q' });
 assert.match(JSON.stringify(saved),/fB/);
 const pub = publicQuestion(q);
 assert.equal(JSON.stringify(pub).includes('bí mật'),false);
 assert.equal(JSON.stringify(pub).includes('remove-from-public'),false);
 assert.match(JSON.stringify(pub.payload.choices),/fB/);
 assert.throws(()=>normalizeQuestion({...q,choices:[{key:'A',text:'x',figures:[{kind:'unsupported'}]}]}));
});
test('shuffled choices retain figures on the original answer content',()=>{
 for(const variant of generateShuffledExams(exam,4,101,14)){
  const item=variant.exam.questions[0];const correct=item.choices!.find(c=>c.key===item.correct_answer)!;
  assert.equal(correct.text,'Có hình');assert.equal(correct.figures?.[0].id,'fB');
 }
 assert.equal(q.choices![1].key,'B');
});
test('Word ordinary and parallel exports embed option image bytes',async()=>{
 for(const view of ['exam','parallel'] as const){
  const blob=await exportExamToDocx(exam,false,false,view);
  const zip=await JSZip.loadAsync(await blob.arrayBuffer());
  const xml=await zip.file('word/document.xml')!.async('string');
  assert.match(xml,/drawing/);assert.match(xml,/Có hình/);
 }
});
