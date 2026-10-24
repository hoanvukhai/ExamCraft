import test from 'node:test';
import assert from 'node:assert/strict';
import { buildShareCopy, shareCopyClientId } from '../src/lib/share-copy';
import { normalizeExamDocument } from '../src/lib/exam-document';
import type { Exam } from '../src/types/exam';

// Validated documents reject made-up plans/packages, so attach private metadata after normalizing.
const withPrivateMetadata = (exam: Exam): Exam => ({ ...exam, metadata: { ...exam.metadata, knowledgePackage: { id: 'private-package' }, examPlan: { id: 'private-plan' } } as unknown as Exam['metadata'] });
const source = (): Exam => withPrivateMetadata(normalizeExamDocument({
  id: 'ex_source', serverId: 'ex_source', version: 7, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-02T00:00:00.000Z',
  metadata: { title: 'Đề gốc', schoolName: '', departmentName: '', subject: 'toan', grade: 6, durationMinutes: 45 },
  questions: [
    { id: 'q1', type: 'multiple_choice', difficulty: 'nhan_biet', content: 'MC', choices: [{ key: 'A', text: '0' }, { key: 'B', text: '1' }], correct_answer: 'A', points: 0, step_by_step_solution: 'PRIVATE_SOLUTION', status: 'verified', verifiedBy: 'human', knowledgeIds: ['k1'] },
    { id: 'q2', type: 'true_false_group', difficulty: 'thong_hieu', content: 'TF', sub_questions: [{ key: 'a', content: 'x', isCorrect: true, explanation: 'PRIVATE_EXPLANATION' }, { key: 'b', content: 'y', isCorrect: false }], step_by_step_solution: '' },
    { id: 'q3', type: 'matching', difficulty: 'thong_hieu', content: 'M', matchingPairs: [{ id: 'p1', left: '1', right: 'PRIVATE_RIGHT' }, { id: 'p2', left: '2', right: 'Hai' }], step_by_step_solution: '' },
    { id: 'q4', type: 'ordering', difficulty: 'thong_hieu', content: 'O', choices: [{ key: 'a', text: '1' }, { key: 'b', text: '2' }], correctOrder: ['a', 'b'], step_by_step_solution: '' },
  ],
} as unknown));

test('share copy keeps zero points and answers only when the link shows answers, and always resets review state', () => {
  const link = { id: 'link-1', showAnswers: true };
  const copy = buildShareCopy(source(), link, new Date('2026-10-24T00:00:00.000Z'));
  assert.equal(copy.id, shareCopyClientId('link-1'));
  assert.equal(copy.serverId, undefined); assert.equal(copy.version, undefined);
  assert.equal(copy.metadata.title, '[Bản sao] Đề gốc');
  assert.equal(copy.questions[0].points, 0);
  assert.equal(copy.questions[0].correct_answer, 'A');
  assert.equal(copy.questions[0].step_by_step_solution, 'PRIVATE_SOLUTION');
  assert.equal(copy.questions[0].status, 'draft'); assert.equal(copy.questions[0].verifiedBy, 'none');
  assert.equal(copy.questions[0].knowledgeIds, undefined);
  assert.equal(copy.questions[2].matchingPairs?.[0].right, 'PRIVATE_RIGHT');
  const metadata = copy.metadata as unknown as Record<string, unknown>;
  assert.equal(metadata.knowledgePackage, undefined); assert.equal(metadata.examPlan, undefined);
});

test('share copy never carries answers, solutions, matching rights or order when the link hides answers', () => {
  const copy = buildShareCopy(source(), { id: 'link-2', showAnswers: false });
  const text = JSON.stringify(copy);
  for (const secret of ['PRIVATE_SOLUTION', 'PRIVATE_EXPLANATION', 'PRIVATE_RIGHT']) assert.ok(!text.includes(secret), secret);
  assert.equal(copy.questions[0].correct_answer, undefined);
  assert.equal(copy.questions[0].choices?.length, 2);
  assert.ok(copy.questions[1].sub_questions?.every(sub => sub.isCorrect === undefined));
  assert.equal(copy.questions[2].matchingPairs?.[1].right, '');
  assert.equal(copy.questions[3].correctOrder, undefined);
  assert.equal(copy.questions[0].points, 0, 'zero points stay zero');
  assert.equal(buildShareCopy(copy, { id: 'link-2', showAnswers: false }).metadata.title, '[Bản sao] Đề gốc', 'title prefix is not doubled');
});

test('share copy does not mutate its source', () => {
  const original = source(); const before = JSON.stringify(original);
  buildShareCopy(original, { id: 'link-3', showAnswers: false }); buildShareCopy(original, { id: 'link-3', showAnswers: true });
  assert.equal(JSON.stringify(original), before);
});
