import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { readFileSync } from 'node:fs';
import type { Exam } from '../src/types/exam';
import { applyHeaderSubmission, defaultHeaderLayout, headerEditableSnapshot, headerPatch, headerSubmissionApplied, headerSubmissionConflict, parseHeaderLayout, resolveHeaderLines, validateHeaderSubmission, type HeaderSubmission } from '../src/lib/header-layout';
import { createExamPlan } from '../src/lib/exam-plan';
import { normalizeExamDocument } from '../src/lib/exam-document';
import { exportExamToDocx } from '../src/lib/docx-export';
import { emptyKnowledgeScope, parseKnowledgePackage } from '../src/lib/knowledge-package';

function fixture(): Exam {
  return { id: 'header-test', metadata: { title: 'INTERNAL_TITLE', schoolName: 'SCHOOL_ORIGINAL', departmentName: '', subject: 'toan', grade: 6, durationMinutes: 15, academicYear: '', notes: '' }, questions: [{ id: 'q', type: 'essay', content: 'PROMPT_PUBLIC', difficulty: 'thong_hieu', points: 0, correct_answer: 'ANSWER_PRIVATE', step_by_step_solution: 'SOLUTION_PRIVATE' }], createdAt: '', updatedAt: '' };
}
const submit = (exam: Exam, patch: HeaderSubmission['patch']): HeaderSubmission => ({ documentId: exam.id, base: headerEditableSnapshot(exam.metadata), patch });
async function word(exam: Exam) {
  const blob = await exportExamToDocx(exam, true, false, 'exam');
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  return zip.file('word/document.xml')!.async('string');
}

test('header submission only merges edited fields and preserves newer scope/plan and unedited header metadata', () => {
  const exam = fixture(), submission = submit(exam, { schoolName: 'MY_SCHOOL' });
  const pkg = parseKnowledgePackage(JSON.parse(readFileSync(new URL('./fixtures/knowledge-package.json', import.meta.url), 'utf8')));
  const scope = { ...emptyKnowledgeScope(pkg), includeKnowledgeIds: ['addition'] };
  const newer = { ...exam, metadata: { ...exam.metadata, academicYear: 'NEWER_YEAR', examPlan: createExamPlan(exam), knowledgePackage: pkg, knowledgeScope: scope, locality: 'NEWER_LOCALITY', sourcePackageId: 'NEWER_SOURCE' } };
  const result = applyHeaderSubmission(newer, submission);
  assert.equal(result.metadata.schoolName, 'MY_SCHOOL'); assert.equal(result.metadata.academicYear, 'NEWER_YEAR'); assert.equal(result.metadata.locality, 'NEWER_LOCALITY');
  assert.equal(result.metadata.examPlan, newer.metadata.examPlan); assert.equal(result.metadata.sourcePackageId, 'NEWER_SOURCE'); assert.equal(result.questions, newer.questions);
  assert.equal(result.metadata.knowledgePackage, pkg); assert.equal(result.metadata.knowledgeScope, scope);
  assert.equal(headerSubmissionApplied(result.metadata, submission), true);
  assert.deepEqual(submission.patch, { schoolName: 'MY_SCHOOL' });
});

test('a changed edited field, different document or lost permission blocks apply with exact same object and intact submission', () => {
  const exam = fixture(), submission = submit(exam, { schoolName: 'MY_DRAFT' });
  const newer = { ...exam, metadata: { ...exam.metadata, schoolName: 'OTHER_EDIT' } };
  assert.equal(headerSubmissionConflict(newer.metadata, submission), true);
  assert.equal(applyHeaderSubmission(newer, submission), newer);
  assert.equal(headerSubmissionApplied(newer.metadata, submission), false);
  const otherDocument = { ...exam, id: 'another' };
  assert.equal(applyHeaderSubmission(otherDocument, submission), otherDocument);
  const noEdit = { ...exam, access: { role: 'viewer', canRead: true, canEdit: false, canComment: false, canManage: false, canPublish: false } };
  assert.equal(applyHeaderSubmission(noEdit, submission), noEdit);
  assert.equal(submission.patch.schoolName, 'MY_DRAFT');
});

test('grade/context edits retain old subject, framework, package references and plan for explicit review', () => {
  const exam = fixture(); exam.metadata.cognitiveFrameworkId = 'cv7991_3'; exam.metadata.examPlan = createExamPlan(exam); exam.metadata.sourcePackageId = 'loaded-source';
  const form = { ...headerEditableSnapshot(exam.metadata), grade: 2 };
  const patch = headerPatch(headerEditableSnapshot(exam.metadata), form);
  assert.deepEqual(patch, { grade: 2 });
  const result = applyHeaderSubmission(exam, submit(exam, patch));
  assert.equal(result.metadata.subject, 'toan'); assert.equal(result.metadata.cognitiveFrameworkId, 'cv7991_3'); assert.equal(result.metadata.examPlan, exam.metadata.examPlan); assert.equal(result.metadata.sourcePackageId, 'loaded-source');
});

test('empty override remains one visible blank line, hidden drops line, undefined uses bound value and literal order remains', () => {
  const exam = fixture();
  exam.metadata.headerLayout = { formatVersion: 1, lines: [
    { id: 'inherited', binding: 'title', area: 'right', align: 'center', hidden: false },
    { id: 'blank', binding: 'schoolName', override: '', area: 'left', align: 'left', hidden: false },
    { id: 'hidden', binding: 'schoolName', area: 'left', align: 'right', hidden: true },
    { id: 'literal', text: 'CUSTOM_LINE', area: 'right', align: 'right', hidden: false },
  ] };
  const lines = resolveHeaderLines(exam);
  assert.deepEqual(lines.map(line => line.id), ['inherited', 'blank', 'literal']);
  assert.equal(lines[0].text, 'INTERNAL_TITLE'); assert.equal(lines[1].text, ''); assert.equal(lines[2].align, 'right');
  assert.deepEqual(normalizeExamDocument(exam).metadata.headerLayout, exam.metadata.headerLayout);
});

test('shared header resolves current year, notes, duration and actual score including0 instead of plan targets', () => {
  const exam = fixture(); exam.metadata.academicYear = 'YEAR_CURRENT'; exam.metadata.notes = 'NOTES_CURRENT'; exam.metadata.examPlan = createExamPlan(exam);
  const text = resolveHeaderLines(exam).map(line => line.text).join('\n');
  assert.match(text, /Năm học: YEAR_CURRENT/); assert.match(text, /NOTES_CURRENT/); assert.match(text, /15 phút · Tổng 0,00 điểm/);
  exam.questions[0].points = undefined;
  assert.match(resolveHeaderLines(exam).map(line => line.text).join('\n'), /Chưa cấu hình đủ điểm/);
  exam.sections = [{ id: 's', name: 'Tự chọn', type: 'essay', pointsPerQuestion: 0.25 }];
  assert.match(resolveHeaderLines(exam).map(line => line.text).join('\n'), /Tổng 0,25 điểm/);
  exam.metadata.assessmentMode = 'survey';
  assert.match(resolveHeaderLines(exam).map(line => line.text).join('\n'), /Không tính điểm/);
});

test('default header omits empty school/year without invented authority, explicit empty lines roundtrip and malformed layouts reject', () => {
  const exam = fixture(); exam.metadata.schoolName = '';
  assert.ok(!resolveHeaderLines(exam).some(line => line.id === 'header-schoolName' || line.id === 'header-academicYear'));
  for (const lines of [Array.from({ length: 31 }, (_, i) => ({ id: String(i), text: '', hidden: false, area: 'right', align: 'left' })), [{ id: 'x', text: '', binding: 'title', hidden: false, area: 'right', align: 'left' }], [{ id: 'x', binding: 'password', hidden: false, area: 'right', align: 'left' }]]) {
    assert.throws(() => parseHeaderLayout({ formatVersion: 1, lines }));
    assert.throws(() => normalizeExamDocument({ ...exam, metadata: { ...exam.metadata, headerLayout: { formatVersion: 1, lines } } }), /Bố cục tiêu đề/);
  }
  assert.throws(() => parseHeaderLayout({ formatVersion: 1, lines: [defaultHeaderLayout().lines[0], defaultHeaderLayout().lines[0]] }));
});

test('unsupported patch keys/empty internal title reject without changing document', () => {
  const exam = fixture();
  for (const patch of [{ title: '' }, { durationMinutes: Number.NaN }, { knowledgeScope: { overwritten: true } }]) {
    const submission = submit(exam, patch as HeaderSubmission['patch']);
    assert.throws(() => validateHeaderSubmission(submission));
    assert.equal(applyHeaderSubmission(exam, submission), exam);
  }
});

test('actual Word header uses ordered shared lines, blanks, alignment, footer/year/current score and hides private answers', async () => {
  const exam = fixture(); exam.metadata.academicYear = 'YEAR_CURRENT'; exam.metadata.notes = 'FOOTER_NOTE';
  exam.metadata.headerLayout = defaultHeaderLayout();
  const school = exam.metadata.headerLayout.lines.find(line => line.binding === 'schoolName')!;
  school.hidden = true;
  const title = exam.metadata.headerLayout.lines.find(line => line.binding === 'title')!;
  title.override = ''; title.align = 'left';
  exam.metadata.headerLayout.lines.push({ id: 'custom', text: 'CUSTOM_RIGHT_LINE', align: 'right', area: 'right', hidden: false });
  const document = await word(exam);
  for (const text of ['CUSTOM_RIGHT_LINE', 'YEAR_CURRENT', 'FOOTER_NOTE', 'Tổng 0,00 điểm', '15 phút']) assert.ok(document.includes(text), text);
  for (const text of ['SCHOOL_ORIGINAL', 'INTERNAL_TITLE', 'ANSWER_PRIVATE', 'SOLUTION_PRIVATE']) assert.ok(!document.includes(text), text);
  const customParagraph = document.match(/<w:p\b[^>]*>(?:(?!<w:p\b)[\s\S])*?CUSTOM_RIGHT_LINE[\s\S]*?<\/w:p>/)?.[0];
  assert.ok(customParagraph?.includes('w:val="right"'));
  assert.equal(resolveHeaderLines(exam).find(line => line.id === title.id)!.text, '');
});
