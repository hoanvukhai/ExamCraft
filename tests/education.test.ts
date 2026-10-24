import test from 'node:test';
import assert from 'node:assert/strict';
import type { Exam, Question, QuestionType } from '../src/types/exam';
import { getSubjectConfig, getSubjectsForGrade } from '../src/lib/subject-config';
import { calculateExamTotalPoints, getDefaultPointsForQuestion } from '../src/lib/scoring';
import { computeExamMatrix, computeExamSpecification } from '../src/lib/matrix-spec-generator';
import { getEducationReadiness, getCoverage, LANGUAGE_PACKAGES } from '../src/lib/education-catalog';
import { compileMathExpression, safePlotRange } from '../src/lib/math-expression';
import { gradeSnapshot } from '../src/lib/attempt-grading';

function exam(questions: Partial<Question>[] = [], metadata: Partial<Exam['metadata']> = {}): Exam {
  return { id: 'fixture', metadata: { title: 'Fixture', schoolName: '', departmentName: '', subject: 'toan', grade: 12, durationMinutes: 45, ...metadata }, questions: questions.map((q, i) => ({ id: `q${i}`, type: 'essay', content: 'Fixture', difficulty: 'nhan_biet', step_by_step_solution: '', ...q })), createdAt: '', updatedAt: '' };
}

test('all grades include arts and PE and unsupported subject/grade never borrows mathematics', () => {
  for (let grade = 1; grade <= 12; grade++) {
    const keys = getSubjectsForGrade(grade).map(s => s.key);
    for (const key of ['am_nhac', 'mi_thuat', 'giao_duc_the_chat', 'giao_duc_dia_phuong', 'ngoai_ngu_khac', 'tieng_dan_toc']) assert.ok(keys.includes(key as never), `grade ${grade}: ${key}`);
    assert.ok(getCoverage('toan', grade));
  }
  assert.deepEqual(getSubjectsForGrade(0), []);
  assert.deepEqual(getSubjectsForGrade(13), []);
  assert.equal(getSubjectConfig('unknown', 6).templateStatus, 'manual');
  assert.deepEqual(getSubjectConfig('unknown', 6).sections, []);
  assert.equal(getSubjectConfig('toan', 1).totalExamPoints, 0);
  assert.notEqual(getSubjectConfig('dao_duc', 1).subject, 'lich_su');
  assert.equal(getEducationReadiness('toan', 12).status, 'needs_review');
  assert.ok(LANGUAGE_PACKAGES.find(p => p.role === 'ETHNIC')?.languages.includes('Raglai'));
});

test('seven question types, explicit zero and non-scored documents preserve actual point rules', () => {
  const types: QuestionType[] = ['multiple_choice', 'true_false_group', 'short_answer', 'essay', 'fill_blank', 'matching', 'ordering'];
  const document = exam(types.map(type => ({ type, points: 1 })));
  assert.equal(calculateExamTotalPoints(document), 7);
  document.questions[0].points = 0;
  assert.equal(getDefaultPointsForQuestion(document.questions[0], document), 0);
  assert.equal(calculateExamTotalPoints(document), 6);
  for (const assessmentMode of ['comment_only', 'rubric', 'survey'] as const) {
    const nonScored = { ...document, metadata: { ...document.metadata, assessmentMode } };
    assert.equal(calculateExamTotalPoints(nonScored), 0);
    assert.equal(computeExamMatrix(nonScored).scoreState, 'not_scored');
  }
  assert.equal(computeExamMatrix(exam([])).totalExamPoints, 0);
  assert.equal(computeExamMatrix(exam([{ points: 0 }])).totalExamPoints, 0);
});

test('cognitive matrix requires explicit framework/level and counts essay rows without inventing outcomes', () => {
  const document = exam([{ difficulty: 'van_dung_cao', cognitiveLevel: 'biet', points: 0.5 }, { difficulty: 'nhan_biet', points: 1 }], { cognitiveFrameworkId: 'cv7991_3' });
  const matrix = computeExamMatrix(document);
  assert.equal(matrix.cognitiveTotals.find(l => l.id === 'biet')?.count, 1);
  assert.equal(matrix.rows[0].nbCount.part4, 1);
  assert.equal(matrix.unmappedCognitiveCount, 1);
  assert.equal(matrix.totalExamPoints, 1.5);
  const spec = computeExamSpecification(document)[0];
  assert.deepEqual(spec.cognitiveQuestions.biet, [1]);
  assert.deepEqual(spec.unmappedQuestions, [2]);
  assert.match(spec.requirement, /Chưa gắn yêu cầu/);
  document.questions[0].learningOutcome = 'Giáo viên đã nhập yêu cầu cụ thể';
  assert.match(computeExamSpecification(document)[0].requirement, /Giáo viên đã nhập/);
  const mismatch = computeExamMatrix(exam([{ cognitiveLevel: 'biet' }], { grade: 3, cognitiveFrameworkId: 'cv7991_3' }));
  assert.equal(mismatch.cognitiveFrameworkId, null);
});

test('survey responses are recorded without correctness or a numeric score', () => {
  const document = exam([{ type: 'multiple_choice', correct_answer: 'A', points: 10 }], { assessmentMode: 'survey' });
  const grade = gradeSnapshot(document, { q0: 'B' });
  assert.equal(grade.score, 0);
  assert.equal(grade.maxScore, 0);
  assert.equal(grade.needsGrading, false);
  assert.equal(grade.gradedAnswers[0].isCorrect, null);
  assert.equal(grade.gradedAnswers[0].response, 'B');
});

test('math parser evaluates arithmetic and rejects JavaScript without executing it', () => {
  assert.equal(compileMathExpression('2x + 3(x-1)')?.(2), 7);
  assert.equal(compileMathExpression('-x^2')?.(3), -9);
  assert.equal(compileMathExpression('2^3^2')?.(0), 512);
  assert.equal(compileMathExpression('Math.sqrt(x)+abs(-2)')?.(9), 5);
  assert.equal(compileMathExpression('sin(pi/2)')?.(0), 1);
  assert.equal(compileMathExpression('1/x')?.(0), null);
  for (const malicious of ['globalThis.alert(1)', 'x;while(true){}', 'constructor.constructor("return this")()', 'fetch("https://x.example")', 'x[0]', 'process.exit()', 'Math.random()', 'x=2', '2 3']) assert.equal(compileMathExpression(malicious), null, malicious);
  assert.deepEqual(safePlotRange([-1e20, 1e20]), [-6, 8]);
  assert.deepEqual(safePlotRange([2, 2]), [-6, 8]);
});
