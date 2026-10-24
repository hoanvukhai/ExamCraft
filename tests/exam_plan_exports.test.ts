import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import JSZip from 'jszip';
import type { Exam } from '../src/types/exam';
import { createExamPlan, PLAN_TYPES } from '../src/lib/exam-plan';
import { examPlanOutput } from '../src/lib/exam-plan-output';
import { exportExamToDocx } from '../src/lib/docx-export';
import { emptyKnowledgeScope, parseKnowledgePackage } from '../src/lib/knowledge-package';

function fixture(): Exam {
  const pkg = parseKnowledgePackage(JSON.parse(readFileSync(new URL('./fixtures/knowledge-package.json', import.meta.url), 'utf8')));
  pkg.outcomes[0].text = 'OUTCOME_TEXT_FOR_TARGET';
  const exam: Exam = { id: 'plan-export', metadata: { title: 'Export fixture', subject: 'toan', grade: 6, durationMinutes: 15, schoolName: '', departmentName: '', knowledgePackage: pkg, knowledgeScope: { ...emptyKnowledgeScope(pkg), includeKnowledgeIds: ['group'] } },
    questions: PLAN_TYPES.map(type => ({ id: type, type, cognitiveLevel: undefined, difficulty: 'thong_hieu', content: 'QUESTION_BODY_PRIVATE_' + type, correct_answer: 'ANSWER_PRIVATE', step_by_step_solution: 'SOLUTION_PRIVATE', rubric: [{ criterion: 'RUBRIC_PRIVATE', maxPoints: 0.25 }], points: 0.25, outcomeIds: ['outcome-add'], knowledgeReference: { packageId: pkg.id, packageRevision: pkg.revision } })), createdAt: '', updatedAt: '' };
  exam.metadata.examPlan = { ...createExamPlan(exam), slots: PLAN_TYPES.map(type => ({ id: type, type, count: 1, cognitiveLevel: null, targetPointsHundredths: 25, ...(type === 'multiple_choice' ? { outcomeId: 'outcome-add' } : {}) })) };
  return exam;
}
async function xml(exam: Exam, includeSolutions = true, view: 'all' | 'exam' | 'matrix' = 'matrix') {
  const blob = await exportExamToDocx(exam, includeSolutions, true, view);
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  return zip.file('word/document.xml')!.async('string');
}

test('actual Word matrix export contains all seven target types, loaded outcome, counts, points and deltas', async () => {
  const exam = fixture();
  exam.metadata.examPlan!.slots[0].count = 2;
  exam.metadata.examPlan!.slots[0].targetPointsHundredths = 100;
  const document = await xml(exam);
  for (const type of PLAN_TYPES) assert.ok(document.includes(`(${type})`), type);
  for (const text of ['KẾ HOẠCH CÁ NHÂN', 'OUTCOME_TEXT_FOR_TARGET', '2 / 1 / -1', '1,00 / 0,25 / -0,75', 'Tổng câu mục tiêu: 8; thực tế toàn đề: 7; lệch: -1.', 'Tổng điểm mục tiêu: 2,50; điểm thực tế đã biết: 1,75; lệch tổng: -0,75.', 'BẢNG PHÂN BỔ CÂU HỎI']) assert.ok(document.includes(text), text);
  for (const privateText of ['ANSWER_PRIVATE', 'SOLUTION_PRIVATE', 'RUBRIC_PRIVATE', 'QUESTION_BODY_PRIVATE']) assert.ok(!document.includes(privateText), privateText);
});

test('Word target comparison includes ambiguous/unmatched and unknown/precision point warnings without guessing', async () => {
  const exam = fixture();
  exam.questions.find(q => q.type === 'fill_blank')!.points = undefined;
  exam.questions.find(q => q.type === 'ordering')!.points = 0.333;
  exam.questions.find(q => q.type === 'short_answer')!.cognitiveLevel = 'unknown';
  exam.metadata.examPlan!.slots.push({ id: 'essay-specific', type: 'essay', count: 1, cognitiveLevel: null, outcomeId: 'outcome-add', targetPointsHundredths: 25 });
  const document = await xml(exam);
  for (const warning of ['Khớp nhiều ô, chưa phân vào ô nào: Câu 4', 'Chưa khớp ô: Câu 3', 'Chưa cấu hình điểm: Câu 5', 'Điểm vượt độ chính xác hai chữ số hoặc giới hạn: Câu 7', 'Chưa rõ', 'chưa đủ', 'chưa thể xác nhận kế hoạch khớp']) assert.ok(document.includes(warning), warning);
  assert.ok(!document.includes('SOLUTION_PRIVATE'));
});

test('stale/unknown outcomes remain visible in real Word export and cannot become an approved comparison', async () => {
  const exam = fixture();
  exam.metadata.knowledgePackage!.revision = 'r2';
  exam.metadata.examPlan!.slots[0].outcomeId = 'missing-outcome';
  const document = await xml(exam);
  for (const warning of ['Kế hoạch thuộc môn/lớp', 'Yêu cầu chưa có trong gói: missing-outcome', 'Yêu cầu cần đạt chưa có trong gói hiện tại', 'không chứng nhận nội dung', 'Cần rà soát']) assert.ok(document.includes(warning), warning);
  assert.ok(!document.includes('Số câu và điểm từng ô khớp'));
});

test('non-scored matrix exports no numeric targets and explicit exam/matrix views override solution booleans', async () => {
  const exam = fixture(); exam.metadata.assessmentMode = 'survey';
  exam.metadata.examPlan = { ...createExamPlan(exam), slots: exam.metadata.examPlan!.slots.map(slot => ({ ...slot, targetPointsHundredths: null })) };
  const matrix = await xml(exam, true, 'matrix');
  assert.ok(matrix.includes('Bài không chấm điểm')); assert.ok(matrix.includes('Không tính điểm')); assert.ok(!matrix.includes('Điểm: mục tiêu'));
  const questions = await xml(exam, true, 'exam');
  assert.ok(questions.includes('QUESTION_BODY_PRIVATE_multiple_choice'));
  for (const document of [matrix, questions]) for (const privateText of ['ANSWER_PRIVATE', 'SOLUTION_PRIVATE', 'RUBRIC_PRIVATE']) assert.ok(!document.includes(privateText), privateText);
  const combined = await xml(fixture(), true, 'all');
  assert.ok(combined.includes('ANSWER_PRIVATE')); assert.ok(combined.includes('SOLUTION_PRIVATE')); assert.ok(combined.includes('RUBRIC_PRIVATE'));
});

test('shared print projection omits answer data, tolerates malformed historical plans, and keeps absent plans absent', () => {
  const exam = fixture(), projection = examPlanOutput(exam)!;
  assert.equal(projection.rows.length, 7); assert.equal(projection.headers.length, 4);
  assert.ok(!JSON.stringify(projection).includes('PRIVATE'));
  const historical = { ...exam, metadata: { ...exam.metadata, examPlan: { formatVersion: 999 } } } as unknown as Exam;
  assert.match(examPlanOutput(historical)!.status, /chưa đúng định dạng/);
  delete exam.metadata.examPlan;
  assert.equal(examPlanOutput(exam), null);
});
