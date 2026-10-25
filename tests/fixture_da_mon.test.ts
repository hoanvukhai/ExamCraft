import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { normalizeExamDocument } from '../src/lib/exam-document';
import { gradeSnapshot } from '../src/lib/attempt-grading';

const directory = path.resolve('qa/ai-review/fixtures/da-mon');
const files = fs.existsSync(directory) ? fs.readdirSync(directory).filter(name => name.endsWith('.json')).sort() : [];

test('the multi-subject fixtures exist', () => assert.ok(files.length >= 6, 'expected the six subject fixtures'));

for (const file of files) {
  test(`fixture ${file} loads as an exam and every auto-gradable answer key grades itself correct`, () => {
    const raw = fs.readFileSync(path.join(directory, file));
    assert.notEqual(raw.subarray(0, 3).toString('hex'), 'efbbbf', 'no byte order mark');
    const exam = normalizeExamDocument(JSON.parse(raw.toString('utf8')));
    assert.ok(exam.questions.length >= 3);
    assert.ok(exam.questions.every(question => question.content.trim().length > 0));
    // Answering each question with its own key must score full marks on the auto-graded types.
    const answers: Record<string, unknown> = {};
    for (const question of exam.questions) {
      if (question.type === 'multiple_choice') answers[question.id] = question.correct_answer;
      if (question.type === 'short_answer' || question.type === 'fill_blank') answers[question.id] = question.accepted_answers?.[0] ?? question.correct_answer;
    }
    const graded = gradeSnapshot({ ...exam, metadata: { ...exam.metadata, assessmentMode: 'scored' } }, answers);
    for (const answer of graded.gradedAnswers.filter(item => item.questionKey in answers)) {
      assert.equal(answer.isCorrect, true, `question ${answer.questionKey} should grade correct under its own key`);
    }
  });
}
