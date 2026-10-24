import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { Exam, Question } from '../src/types/exam';
import { applyExamPlan, compareExamPlan, createExamPlan, examPlanContextStamp, parseExamPlan, PLAN_TYPES, pointsToHundredths, type ExamPlanSlot } from '../src/lib/exam-plan';
import { emptyKnowledgeScope, parseKnowledgePackage } from '../src/lib/knowledge-package';
import { normalizeExamDocument } from '../src/lib/exam-document';

function fixture(input: Partial<Question>[] = []): Exam {
  return { id: 'plan-test', metadata: { title: 'Kế hoạch tự soạn kiểm thử', subject: 'toan', grade: 6, schoolName: '', departmentName: '', durationMinutes: 15, cognitiveFrameworkId: 'legacy_4' }, questions: input.map((q, i) => ({ id: `q${i + 1}`, type: 'essay', difficulty: 'thong_hieu', content: 'Ví dụ', step_by_step_solution: '', ...q })), createdAt: '', updatedAt: '' };
}
const slot = (id: string, type: ExamPlanSlot['type'], count: number, cents: number | null, cognitiveLevel: string | null = null, outcomeId?: string): ExamPlanSlot => ({ id, type, count, targetPointsHundredths: cents, cognitiveLevel, ...(outcomeId ? { outcomeId } : {}) });
function withPackage() {
  const exam = fixture();
  const pkg = parseKnowledgePackage(JSON.parse(readFileSync(new URL('./fixtures/knowledge-package.json', import.meta.url), 'utf8')));
  exam.metadata.knowledgePackage = pkg;
  exam.metadata.knowledgeScope = { ...emptyKnowledgeScope(pkg), includeKnowledgeIds: ['group'] };
  return exam;
}

test('conceptual 4 choices +2 short +2 essay example compares every slot and exactly totals 10 points', () => {
  const exam = fixture([
    ...Array.from({ length: 4 }, () => ({ type: 'multiple_choice' as const, cognitiveLevel: 'nhan_biet', points: 0.5 })),
    ...Array.from({ length: 2 }, () => ({ type: 'short_answer' as const, cognitiveLevel: 'thong_hieu', points: 1 })),
    { type: 'essay', cognitiveLevel: 'thong_hieu', points: 3 }, { type: 'essay', cognitiveLevel: 'van_dung', points: 3 },
  ]);
  const plan = { ...createExamPlan(exam), slots: [slot('choice', 'multiple_choice', 4, 200, 'nhan_biet'), slot('short', 'short_answer', 2, 200, 'thong_hieu'), slot('essay-understand', 'essay', 1, 300, 'thong_hieu'), slot('essay-apply', 'essay', 1, 300, 'van_dung'), slot('tf-zero', 'true_false_group', 0, 0)] };
  const result = compareExamPlan(exam, plan);
  assert.equal(result.matches, true); assert.equal(result.targetCount, 8); assert.equal(result.targetPointsHundredths, 1000); assert.equal(result.actualKnownPointsHundredths, 1000);
  exam.questions[0].points = 1; exam.questions[4].points = 0.5;
  const wrong = compareExamPlan(exam, plan);
  assert.equal(wrong.actualKnownPointsHundredths, 1000); assert.equal(wrong.matches, false);
  assert.equal(wrong.rows[0].pointsDeltaHundredths, 50); assert.equal(wrong.rows[1].pointsDeltaHundredths, -50);
});

test('all seven types remain independent and decimals 0.1 plus0.2 and explicit0 are exact', () => {
  const exam = fixture(PLAN_TYPES.map(type => ({ type, points: 0 })));
  exam.questions[0].points = 0.1; exam.questions[1].points = 0.2;
  const plan = { ...createExamPlan(exam), slots: PLAN_TYPES.map((type, i) => slot(type, type, 1, i === 0 ? 10 : i === 1 ? 20 : 0)) };
  const result = compareExamPlan(exam, plan);
  assert.equal(result.rows.length, 7); assert.equal(result.matches, true); assert.equal(result.actualKnownPointsHundredths, 30);
  assert.equal(pointsToHundredths('0,29'), 29); assert.equal(pointsToHundredths(0.29), 29); assert.equal(pointsToHundredths(0), 0);
  for (const value of ['', '-1', '0.001', '1e6', 'Infinity', '1000001']) assert.throws(() => pointsToHundredths(value));
});

test('missing points stay unknown; selected section fallback applies and explicit0 overrides section values', () => {
  const exam = fixture([{ sectionId: 'chosen' }, { sectionId: 'chosen', points: 0 }, {}]);
  exam.sections = [{ id: 'chosen', name: 'Phần tự chọn', type: 'essay', pointsPerQuestion: 0.25 }, { id: 'other', name: 'Phần khác', type: 'essay', pointsPerQuestion: 3 }];
  const plan = { ...createExamPlan(exam), slots: [slot('essay', 'essay', 3, 25)] };
  const result = compareExamPlan(exam, plan);
  assert.equal(result.actualKnownPointsHundredths, 25); assert.deepEqual(result.unknownPointIds, ['q3']); assert.equal(result.rows[0].pointsDeltaHundredths, null); assert.equal(result.matches, false);
  exam.questions[2].points = 0.333;
  const precise = compareExamPlan(exam, plan);
  assert.deepEqual(precise.precisionPointIds, ['q3']); assert.equal(precise.actualKnownPointsHundredths, 25); assert.equal(precise.matches, false);
});

test('non-scored survey/comment/rubric plans count questions without requiring points or cognitive levels', () => {
  for (const mode of ['survey', 'comment_only', 'rubric'] as const) {
    const exam = fixture([{ type: 'matching', points: 0.333 }]); exam.metadata.assessmentMode = mode;
    const result = compareExamPlan(exam, { ...createExamPlan(exam), slots: [slot('matching', 'matching', 1, null)] });
    assert.equal(result.matches, true); assert.equal(result.numeric, false); assert.equal(result.targetPointsHundredths, null); assert.deepEqual(result.precisionPointIds, []);
  }
});

test('outcome specifications use loaded outcome text and versioned IDs, never free text guesses', () => {
  const exam = withPackage(), pkg = exam.metadata.knowledgePackage!;
  exam.questions = fixture([{ outcomeIds: ['outcome-add'], knowledgeReference: { packageId: pkg.id, packageRevision: pkg.revision }, points: 1 }]).questions;
  const plan = { ...createExamPlan(exam), slots: [slot('add', 'essay', 1, 100, null, 'outcome-add')] };
  assert.match(compareExamPlan(exam, plan).rows[0].outcomeText!, /phép cộng/);
  assert.equal(compareExamPlan(exam, plan).matches, true);
  exam.questions[0].knowledgeReference!.packageRevision = 'r0';
  const stale = compareExamPlan(exam, plan); assert.equal(stale.unmatched.length, 1); assert.equal(stale.matches, false);
  exam.questions[0].knowledgeReference!.packageRevision = pkg.revision;
  exam.metadata.knowledgeScope!.excludeKnowledgeIds = ['addition'];
  const outside = compareExamPlan(exam, plan); assert.match(outside.rows[0].issues.join(' '), /ngoài phạm vi/); assert.equal(outside.matches, false);
});

test('overlapping generic and specific or multi-outcome slots stay ambiguous; no question is reassigned', () => {
  const exam = withPackage(), pkg = exam.metadata.knowledgePackage!;
  exam.questions = fixture([{ outcomeIds: ['outcome-add', 'outcome-sub'], knowledgeReference: { packageId: pkg.id, packageRevision: pkg.revision }, points: 1 }]).questions;
  const slots = [slot('add', 'essay', 1, 100, null, 'outcome-add'), slot('sub', 'essay', 0, 0, null, 'outcome-sub')];
  const multi = compareExamPlan(exam, { ...createExamPlan(exam), slots });
  assert.equal(multi.ambiguous.length, 1); assert.deepEqual(multi.rows.map(row => row.actualCount), [0, 0]); assert.equal(multi.actualCount, 1);
  const overlap = compareExamPlan(exam, { ...createExamPlan(exam), slots: [slots[0], slot('generic', 'essay', 0, 0)] });
  assert.equal(overlap.ambiguous.length, 1);
  assert.deepEqual(exam.questions[0].outcomeIds, ['outcome-add', 'outcome-sub']);
});

test('syntax boundary rejects malformed/over-limit plans but retains historical plans after context changes', () => {
  const exam = withPackage();
  const plan = { ...createExamPlan(exam), slots: [slot('a', 'essay', 0, 0, 'thong_hieu', 'outcome-add')] };
  exam.metadata.examPlan = plan;
  exam.metadata.subject = 'ngu_van'; exam.metadata.knowledgePackage = undefined; exam.metadata.knowledgeScope = undefined; exam.metadata.cognitiveFrameworkId = undefined;
  const normalized = normalizeExamDocument(exam);
  assert.deepEqual(normalized.metadata.examPlan, plan); assert.equal(compareExamPlan(normalized).stale, true); assert.equal(compareExamPlan(normalized).matches, false);
  for (const slots of [[slot('x', 'essay', 1000, 0), slot('y', 'matching', 1, 0)], Array.from({ length: 101 }, (_, i) => slot(String(i), 'essay', 0, 0, String(i))), [slot('same', 'essay', 1, 0), slot('same', 'matching', 1, 0)], [slot('a', 'essay', 1, 0), slot('b', 'essay', 1, 0)], [slot('zero', 'essay', 0, 1)], [slot('decimal', 'essay', 1, 1.1)]]) {
    assert.throws(() => parseExamPlan({ ...plan, slots }));
    assert.throws(() => normalizeExamDocument({ ...exam, metadata: { ...exam.metadata, examPlan: { ...plan, slots } } }), /Kế hoạch/);
  }
});

test('unknown/invalid cognitive levels and unknown outcome IDs cannot silently count as valid', () => {
  const exam = fixture([{ cognitiveLevel: 'biet', points: 0 }]);
  const plan = { ...createExamPlan(exam), slots: [slot('level', 'essay', 1, 0, 'biet')] };
  const result = compareExamPlan(exam, plan); assert.equal(result.matches, false); assert.equal(result.unmatched.length, 1);
  const unknownOutcome = compareExamPlan(exam, { ...plan, slots: [slot('outcome', 'essay', 1, 0, 'biet', 'invented')] });
  assert.match(unknownOutcome.rows[0].issues.join(' '), /chưa có trong gói/);
});

test('applying plan preserves question content/points and refuses newer plan/context or lost edit permission', () => {
  const exam = fixture([{ points: 0 }]), plan = { ...createExamPlan(exam), slots: [slot('essay', 'essay', 1, 0)] };
  const stamp = examPlanContextStamp(exam), result = applyExamPlan(exam, plan, stamp);
  assert.deepEqual(result.questions, exam.questions); assert.deepEqual(result.metadata.examPlan, plan); assert.equal(exam.metadata.examPlan, undefined);
  assert.throws(() => applyExamPlan(result, plan, stamp), /đã đổi/);
  assert.throws(() => applyExamPlan({ ...exam, metadata: { ...exam.metadata, grade: 7 } }, plan, stamp), /đã đổi/);
  assert.throws(() => applyExamPlan({ ...exam, access: { role: 'viewer', canRead: true, canEdit: false, canComment: false, canManage: false, canPublish: false } }, plan, stamp), /quyền/);
  const packaged = withPackage(), packagedStamp = examPlanContextStamp(packaged), packagePlan = createExamPlan(packaged);
  const changed = structuredClone(packaged); changed.metadata.knowledgePackage!.knowledge[0].title = 'Nội dung nhập lại nhưng chưa đổi revision';
  assert.notEqual(examPlanContextStamp(changed), packagedStamp);
  assert.throws(() => applyExamPlan(changed, packagePlan, packagedStamp), /đã đổi/);
});
