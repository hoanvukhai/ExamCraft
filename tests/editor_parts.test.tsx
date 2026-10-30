import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Exam } from '../src/types/exam';
import { withEditorParts, editorInsertionPoint, importedPartPoint } from '../src/lib/editor-parts';
import { captureTemplateSnapshot } from '../src/lib/exam-template';
import { exportExamToDocx } from '../src/lib/docx-export';
import JSZip from 'jszip';
import { normalizeExamDocument } from '../src/lib/exam-document';
import { syncOutline, structuralStampFields, removeOutlineNode } from '../src/lib/exam-outline';
import { freezeExamScoring } from '../src/lib/snapshot-scoring';
import { generationDocumentStamp } from '../src/lib/generation-plan';
import { sameQuestionSourceStamp, applyQuestionManualSubmission, questionValueStamp, questionDraftSourceStamp } from '../src/lib/question-draft';
import { patchOutlineNode } from '../src/lib/outline-editing';
import { outlineView } from '../src/lib/outline-view';
import { outlineSkeleton, copyOutlineSkeleton } from '../src/lib/outline-operations';
import { EditorOutline } from '../src/components/editor/EditorOutline';
import { StructureBlocks } from '../src/components/editor/StructureBlocks';
function fixture(): Exam {
  return {
    id: 'vertical',
    createdAt: '',
    updatedAt: '',
    metadata: {
      title: 'Exam',
      subject: 'toan',
      grade: 6,
      durationMinutes: 15,
      schoolName: '',
      departmentName: '',
    },
    questions: ['a', 'b'].map((id) => ({
      id,
      content: id,
      type: 'essay',
      difficulty: 'thong_hieu',
      step_by_step_solution: 'Private ' + id,
    })),
  };
}
test('empty editor has one unnamed part and an insertion point without creating data or showing starter cards', () => {
  const source = { ...fixture(), questions: [] };
  const before = JSON.stringify(source),
    exam = withEditorParts(source);
  assert.equal(exam.outline!.length, 1);
  assert.equal(exam.outline![0].title, '');
  assert.deepEqual(editorInsertionPoint(source), { parentId: exam.outline![0].id, afterId: null });
  const html = renderToStaticMarkup(
    <EditorOutline
      exam={source}
      selectedCode="exam"
      ticked={[]}
      canEdit
      issueCounts={{}}
      commentCounts={{}}
      onSelect={() => {
        throw Error('render writes');
      }}
      onTick={() => {}}
      onMove={() => {
        throw Error('render writes');
      }}
    />,
  );
  assert.ok(html.includes('Phần'), 'the one unnamed part is listed');
  assert.ok(!html.includes('Tự soạn'));
  assert.ok(!html.includes('Thêm / sửa phần'));
  assert.equal(JSON.stringify(source), before);
  assert.equal(withEditorParts(exam), exam);
});
test('implicit legacy part keeps scores, configurations, question IDs and pending proposal stamps', () => {
  const source = fixture();
  source.questions[0].points = 0;
  source.sections = [
    { id: 'old-default', name: 'Scoring configuration', type: 'essay', pointsPerQuestion: 2 },
  ];
  const before = structuredClone(source),
    exam = withEditorParts(source),
    saved = normalizeExamDocument(exam);
  assert.deepEqual(saved.questions, source.questions);
  assert.deepEqual(saved.sections, source.sections);
  assert.deepEqual(freezeExamScoring(saved).questions, freezeExamScoring(source).questions);
  assert.equal(saved.questions[0].points, 0);
  assert.equal(freezeExamScoring(saved).questions[1].points, 2);
  assert.equal(generationDocumentStamp(exam), generationDocumentStamp(source));
  assert.equal(questionDraftSourceStamp(exam), questionDraftSourceStamp(source));
  assert.deepEqual(structuralStampFields(exam), structuralStampFields(source));
  assert.deepEqual(source, before);
});
test('root runs and existing named/empty parts preserve order and do not merge teacher structure', () => {
  const source = fixture();
  source.questions.push({ ...source.questions[0], id: 'c' });
  source.outline = [
    { id: 'qa', kind: 'question', questionId: 'a' },
    { id: 'p', kind: 'part', title: 'Named', children: [{ id: 'qb', kind: 'question', questionId: 'b' }] },
    { id: 'qc', kind: 'question', questionId: 'c' },
    { id: 'empty', kind: 'part', title: 'Empty', children: [] },
  ];
  const exam = withEditorParts(source),
    saved = syncOutline(exam);
  assert.equal(exam.outline!.length, 4);
  assert.equal(exam.outline![1], source.outline[1]);
  assert.deepEqual(
    saved.questions.map((q) => q.id),
    ['a', 'b', 'c'],
  );
  assert.deepEqual(editorInsertionPoint(exam, { parentId: 'gone' }), { parentId: 'empty', afterId: null });
});
test('empty part title suppresses only the heading, including automatic numbering; instructions and material stay', () => {
  let exam = withEditorParts(fixture());
  const part = exam.outline![0];
  exam = patchOutlineNode(exam, part.id, {
    title: 'Heading',
    numbering: 'roman',
    instructions: 'Keep instructions',
  });
  assert.equal(outlineView(exam).before.get('a')![0].title, 'I. Heading');
  exam = patchOutlineNode(exam, part.id, { title: '  ' });
  const block = outlineView(exam).before.get('a')![0];
  assert.equal(block.title, '');
  assert.equal(block.instructions, 'Keep instructions');
  const html = renderToStaticMarkup(<StructureBlocks blocks={[block]} />);
  assert.ok(html.includes('Keep instructions'));
  assert.ok(!html.includes('Phần chưa'));
  assert.ok(!html.includes('<h3'));
  assert.deepEqual(
    exam.questions.map((q) => q.id),
    ['a', 'b'],
  );
});
test('template skeleton retains neutral scoring link and imported parts insert as root siblings', () => {
  const exam = withEditorParts(fixture()),
    skeleton = outlineSkeleton(exam);
  assert.equal(skeleton[0].sectionId, null);
  const copy = copyOutlineSkeleton(skeleton, new Map(), 'token');
  assert.equal(copy[0].sectionId, null);
  assert.deepEqual(importedPartPoint(exam, editorInsertionPoint(exam)), {
    parentId: null,
    afterId: exam.outline![0].id,
  });
  const json = JSON.stringify(exam);
  assert.deepEqual(normalizeExamDocument(JSON.parse(json)).outline, exam.outline);
});

test('legacy scoring parts expose insertion without mutating the source', () => {
  const source = fixture();
  source.sections = [{ id: 'old', name: 'Legacy', type: 'essay', pointsPerQuestion: 3 }];
  source.questions = source.questions.map((q) => ({ ...q, sectionId: 'old' }));
  const before = structuredClone(source),
    view = withEditorParts(source);
  assert.equal(view.outline![0].sectionId, 'old');
  assert.equal(editorInsertionPoint(view).parentId, view.outline![0].id);
  assert.deepEqual(freezeExamScoring(view), freezeExamScoring(source));
  assert.equal(generationDocumentStamp(view), generationDocumentStamp(source));
  assert.deepEqual(source, before);
});

test('deleting the implicit part never revives a removed composer target', () => {
  const source = withEditorParts(fixture()),
    id = source.outline![0].id;
  const next = withEditorParts(removeOutlineNode(source, id, true), id);
  assert.notEqual(next.outline![0].id, id);
  assert.deepEqual(next.questions, source.questions);
  assert.equal(generationDocumentStamp(next), generationDocumentStamp(source));
  const empty = withEditorParts({ ...fixture(), questions: [] }),
    old = empty.outline![0].id;
  assert.notEqual(withEditorParts(removeOutlineNode(empty, old, true), old).outline![0].id, old);
});


test('source guards accept reordered JSON keys but reject changed values, array order and scope', () => {
  const source=patchOutlineNode(withEditorParts(fixture()),'editor-part:0',{title:'Named'});
  const reversed=JSON.parse(JSON.stringify(source,(_key,item)=>item && typeof item==='object' && !Array.isArray(item)?Object.fromEntries(Object.entries(item).reverse()):item)) as Exam;
  const a=questionDraftSourceStamp(source),b=questionDraftSourceStamp(reversed);
  assert.notEqual(a,b);
  assert.equal(sameQuestionSourceStamp(a,b),true);
  assert.equal(sameQuestionSourceStamp(a,questionDraftSourceStamp({...source,metadata:{...source.metadata,grade:7}})),false);
  assert.equal(sameQuestionSourceStamp('{bad','{}'),false);
  assert.equal(sameQuestionSourceStamp('{"a":[1,2]}','{"a":[2,1]}'),false);
  const q={...source.questions[0],subject:source.metadata.subject,grade:source.metadata.grade};
  const submission={ownerId:'teacher',documentId:source.id,questionId:q.id,baseSourceStamp:a,baseStamp:questionValueStamp(q),token:'test',value:{...q,content:'Accepted draft'}};
  assert.equal(applyQuestionManualSubmission(reversed,submission,'teacher').questions[0].content,'Accepted draft');
  assert.equal(applyQuestionManualSubmission(reversed,submission,'other'),reversed);
  const changed={...reversed,questions:reversed.questions.map(item=>item.id===q.id?{...item,content:'Newer edit'}:item)};
  assert.equal(applyQuestionManualSubmission(changed,submission,'teacher'),changed);
});


test('unnamed scoring parts survive template capture and Word export without an invented heading', async () => {
  const source=fixture();
  source.outline=[{id:'score-part',kind:'part',title:'',numbering:'roman',instructions:'KEEP_INSTRUCTION',children:source.questions.map(q=>({id:'node:'+q.id,kind:'question',questionId:q.id}))}];
  source.sections=[{id:'score-part',name:'',title:'',type:'essay',pointsPerQuestion:2}];
  const exam=syncOutline(source), snapshot=captureTemplateSnapshot(exam);
  assert.equal(snapshot.sections[0].name,'');
  assert.equal(snapshot.outline![0].title,'');
  const zip=await JSZip.loadAsync(await (await exportExamToDocx(exam,true,false,'exam')).arrayBuffer());
  const xml=await zip.file('word/document.xml')!.async('string');
  assert.ok(xml.includes('KEEP_INSTRUCTION'));
  assert.ok(!xml.includes('Phần chưa đặt tên'));
  assert.ok(!xml.includes('Private a'));
  assert.deepEqual(freezeExamScoring(exam).questions.map(q=>q.points),[2,2]);
});
