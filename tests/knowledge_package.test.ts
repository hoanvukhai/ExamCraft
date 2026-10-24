import test from 'node:test';
import assert from 'node:assert/strict';
import { assertKnowledgeRevision, parseKnowledgePackage, emptyKnowledgeScope, resolveKnowledgeScope, proposeKnowledgeScope, knowledgeScopeContext, bookEntryTargets, type KnowledgePackage } from '../src/lib/knowledge-package';
import { normalizeExamDocument } from '../src/lib/exam-document';
import { generationPlanSchema, validateGeneratedExam } from '../src/lib/generation-plan';
import { bindQuestionKnowledge, reviewQuestionKnowledge } from '../src/lib/question-knowledge';
import type { Question } from '../src/types/exam';

export const packageFixture = (): KnowledgePackage => ({
  format: 'examcraft-knowledge-package', formatVersion: 1, id: 'personal-test', revision: 'r1', title: 'Gói tự soạn để kiểm thử, không là chương trình chính thức', subject: 'toan', grade: 6, curriculumVersion: 'fixture', kind: 'personal', status: 'reviewed',
  sources: [{ id: 'source', title: 'Ghi chú tự soạn', rights: 'unknown' }],
  knowledge: [{ id: 'root', title: 'Nhóm thử', sourceIds: ['source'], prerequisiteIds: [] }, { id: 'add', parentId: 'root', title: 'Cộng', sourceIds: ['source'], prerequisiteIds: [] }, { id: 'subtract', parentId: 'root', title: 'Trừ', sourceIds: ['source'], prerequisiteIds: ['add'] }],
  outcomes: [{ id: 'out-add', text: 'Yêu cầu tự soạn A', knowledgeIds: ['add'], sourceIds: ['source'] }, { id: 'out-sub', text: 'Yêu cầu tự soạn B', knowledgeIds: ['subtract'], sourceIds: ['source'] }],
  books: [{ id: 'book', series: 'Mục lục giả phục vụ kiểm thử', title: 'Tài liệu tự soạn', edition: 'fixture-r1', sourceIds: [], entries: [{ id: 'chapter', title: 'Chương thử', sourceIds: [] }, { id: 'lesson', parentId: 'chapter', title: 'Bài thử', order: 99, sourceIds: [] }] }],
  mappings: [{ bookId: 'book', entryId: 'lesson', knowledgeIds: ['add'], outcomeIds: ['out-add'], sourceIds: ['source'] }],
});

const questionFixture = (): Question => ({ id: 'q', type: 'essay', difficulty: 'thong_hieu', content: 'Ví dụ kiểm thử', step_by_step_solution: '' });

test('question links retain provenance and do not silently attach matching IDs from another package revision', () => {
  const pkg = parseKnowledgePackage(packageFixture()), question = bindQuestionKnowledge(questionFixture(), pkg, ['add', 'add'], ['out-add']);
  assert.deepEqual(question.knowledgeIds, ['add']);
  assert.equal(reviewQuestionKnowledge(question, pkg).state, 'linked');
  assert.equal(reviewQuestionKnowledge(question, { ...pkg, revision: 'r2' }).state, 'stale');
  assert.equal(reviewQuestionKnowledge(question, { ...pkg, id: 'another-package' }).state, 'stale');
  assert.equal(reviewQuestionKnowledge({ knowledgeIds: ['add'] }, pkg).state, 'stale');
  assert.equal(reviewQuestionKnowledge(question).state, 'stale');
  assert.throws(() => bindQuestionKnowledge(question, pkg, ['unknown'], []), /chưa có/);
});

test('question coverage distinguishes untagged, unknown and excluded links without deleting content', () => {
  const pkg = parseKnowledgePackage(packageFixture()), scope = { ...emptyKnowledgeScope(pkg), includeKnowledgeIds: ['root'], excludeKnowledgeIds: ['subtract'] };
  const inside = bindQuestionKnowledge(questionFixture(), pkg, ['add'], ['out-add']), outside = bindQuestionKnowledge(questionFixture(), pkg, ['subtract'], ['out-sub']);
  assert.equal(reviewQuestionKnowledge(questionFixture(), pkg, scope).state, 'unmapped');
  assert.equal(reviewQuestionKnowledge(inside, pkg, scope).state, 'linked');
  assert.equal(reviewQuestionKnowledge(outside, pkg, scope).state, 'outside');
  assert.equal(reviewQuestionKnowledge({ ...inside, knowledgeIds: ['unknown'] }, pkg, scope).state, 'unknown');
  assert.equal(outside.content, questionFixture().content); assert.deepEqual(outside.outcomeIds, ['out-sub']);
});

test('canonical saving keeps knowledge provenance and rejects malformed question links', () => {
  const pkg = parseKnowledgePackage(packageFixture()), question = bindQuestionKnowledge(questionFixture(), pkg, ['add'], ['out-add']);
  const exam = { id: 'question-provenance', metadata: { title: 'Kiểm thử', subject: 'toan', grade: 6, knowledgePackage: pkg }, questions: [question] };
  assert.deepEqual(normalizeExamDocument(exam).questions[0].knowledgeReference, question.knowledgeReference);
  assert.throws(() => normalizeExamDocument({ ...exam, questions: [{ ...question, knowledgeIds: 'add' }] }), /liên kết kiến thức/);
  assert.throws(() => normalizeExamDocument({ ...exam, questions: [{ ...question, knowledgeReference: { packageId: pkg.id } }] }), /phiên bản liên kết/);
});
test('package import preserves stable IDs and many-to-many book mapping, but never inherits approval', () => {
  const pkg = parseKnowledgePackage(packageFixture(), { subject: 'toan', grade: 6 });
  assert.equal(pkg.status, 'needs_review'); assert.equal(pkg.knowledge[1].id, 'add'); assert.equal(pkg.books[0].entries[1].order, 99);
  assert.deepEqual(bookEntryTargets(pkg, 'book', 'chapter'), { knowledgeIds: ['add'], outcomeIds: ['out-add'] });
  assert.throws(() => parseKnowledgePackage(packageFixture(), { subject: 'toan', grade: 5 }), /không trùng/);
});
test('package rejects duplicate, missing references and cycles in knowledge, prerequisites or edition trees', () => {
  const duplicate = packageFixture(); duplicate.knowledge.push(duplicate.knowledge[0]); assert.throws(() => parseKnowledgePackage(duplicate), /trùng/);
  const missing = packageFixture(); missing.outcomes[0].knowledgeIds = ['missing']; assert.throws(() => parseKnowledgePackage(missing), /chưa có mã/);
  const cycle = packageFixture(); cycle.knowledge[0] = { ...cycle.knowledge[0], parentId: 'add' }; assert.throws(() => parseKnowledgePackage(cycle), /vòng lặp/);
  const prerequisite = packageFixture(); prerequisite.knowledge[1] = { ...prerequisite.knowledge[1], prerequisiteIds: ['subtract'] }; assert.throws(() => parseKnowledgePackage(prerequisite), /tiên quyết có vòng/);
  const book = packageFixture(); book.books[0].entries[0] = { ...book.books[0].entries[0], parentId: 'lesson' }; assert.throws(() => parseKnowledgePackage(book), /vòng lặp/);
});
test('scope includes descendants, prioritizes exclusions and refuses stale package versions', () => {
  const pkg = parseKnowledgePackage(packageFixture()), scope = { ...emptyKnowledgeScope(pkg), includeKnowledgeIds: ['root'], excludeKnowledgeIds: ['subtract'], includeOutcomeIds: ['out-sub'] };
  const resolved = resolveKnowledgeScope(pkg, scope);
  assert.deepEqual(resolved.knowledge.map(n => n.id), ['root', 'add']); assert.deepEqual(resolved.outcomes.map(n => n.id), ['out-add']);
  assert.throws(() => resolveKnowledgeScope(pkg, { ...scope, packageRevision: 'r2' }), /phiên bản/);
  assert.throws(() => knowledgeScopeContext(pkg, emptyKnowledgeScope(pkg)), /Chưa chọn/);
  assert.throws(() => resolveKnowledgeScope(pkg, { ...scope, includeKnowledgeIds: ['bogus'] }), /chưa có mã/);
});
test('scope proposal reports changes without mutating the currently saved selection', () => {
  const pkg = parseKnowledgePackage(packageFixture()), current = emptyKnowledgeScope(pkg), before = JSON.stringify(current);
  const diff = proposeKnowledgeScope(pkg, current, { ...current, includeKnowledgeIds: ['add'], methodConstraints: ['Chỉ dùng cách đã học'] });
  assert.deepEqual(diff.addedKnowledge.map(n => n.id), ['add']); assert.equal(diff.methodConstraintsChanged, true); assert.equal(JSON.stringify(current), before);
});
test('a package revision cannot silently acquire different content', () => {
  const pkg = parseKnowledgePackage(packageFixture()), changed = structuredClone(pkg); changed.knowledge[1].title = 'Đã đổi';
  assert.throws(() => assertKnowledgeRevision(pkg, changed), /phiên bản chưa đổi/);
  assert.doesNotThrow(() => assertKnowledgeRevision(pkg, { ...changed, revision: 'r2' }));
  assert.doesNotThrow(() => assertKnowledgeRevision(pkg, JSON.parse(JSON.stringify(pkg))));
});
test('exam normalization preserves the package and selection and rejects a wrong grade or orphan scope', () => {
  const pkg = parseKnowledgePackage(packageFixture()), scope = { ...emptyKnowledgeScope(pkg), includeKnowledgeIds: ['add'] };
  const exam = { id: 'scope-test', metadata: { title: 'Thử', subject: 'toan', grade: 6, knowledgePackage: pkg, knowledgeScope: scope }, questions: [] };
  const normalized = normalizeExamDocument(exam); assert.equal(normalized.metadata.knowledgePackage?.id, pkg.id); assert.deepEqual(normalized.metadata.knowledgeScope, scope);
  assert.throws(() => normalizeExamDocument({ ...exam, metadata: { ...exam.metadata, grade: 5 } }), /Gói kiến thức/);
  assert.throws(() => normalizeExamDocument({ ...exam, metadata: { ...exam.metadata, knowledgePackage: undefined } }), /đi kèm/);
});
test('generation validates selected scope and refuses invented or excluded knowledge codes', () => {
  const pkg = parseKnowledgePackage(packageFixture()), scope = { ...emptyKnowledgeScope(pkg), includeKnowledgeIds: ['add'] };
  const input = { subject: 'toan', grade: 6, topic: 'Tự soạn', durationMinutes: 15, numEssay: 1, knowledgePackage: pkg, knowledgeScope: scope };
  const plan = generationPlanSchema.parse(input);
  const valid = { questions: [{ type: 'essay', content: 'Câu thử', knowledgeIds: ['add'] }] };
  assert.equal(validateGeneratedExam(valid, plan).questions[0].knowledgeIds?.[0], 'add');
  assert.throws(() => validateGeneratedExam({ questions: [{ type: 'essay', content: 'Ngoài phạm vi', knowledgeIds: ['subtract'] }] }, plan), /ngoài phạm vi/);
  assert.throws(() => validateGeneratedExam({ questions: [{ type: 'essay', content: 'Chưa gắn' }] }, plan), /chưa gắn/);
  assert.equal(generationPlanSchema.safeParse({ ...input, knowledgeScope: emptyKnowledgeScope(pkg) }).success, false);
});
