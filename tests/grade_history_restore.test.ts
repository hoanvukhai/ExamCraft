import test from 'node:test';
import assert from 'node:assert/strict';
import { buildGradeSubmission, decideRestore, initialScoreText, isGradeDraftDirty, readHistoryState, sameGradeState, validateRestoreState, type GradeState } from '../src/lib/grade-history-restore';

const state = (over: Partial<GradeState> = {}): GradeState => ({ earned: 0, manualScore: null, comment: null, isCorrect: null, ...over });
const meta = (before: unknown, after: unknown, questionKey = 'q1') => ({ questionKey, before, after, scoreBefore: 1, scoreAfter: 2 });
const scored = { numeric: true, maxPoints: 2, pointsConfigured: true };

test('reads both sides of a complete event and keeps null, 0, false and empty text apart', () => {
  const event = meta(state(), { earned: 0, manualScore: 0, comment: '', isCorrect: false });
  const before = readHistoryState(event, 'before', 'q1'), after = readHistoryState(event, 'after', 'q1');
  assert.ok(before.ok && after.ok);
  if (before.ok && after.ok) {
    assert.deepEqual(before.state, state());
    assert.deepEqual(after.state, { earned: 0, manualScore: 0, comment: '', isCorrect: false });
    assert.equal(sameGradeState(before.state, after.state), false);
  }
});

test('refuses unknown, missing, forged or other-question metadata instead of guessing', () => {
  const full = state({ earned: 1, manualScore: 1, comment: 'ok', isCorrect: false });
  const cases: [string, unknown, unknown, string?][] = [
    ['not an object', null, 'before'], ['array', [], 'before'], ['no questionKey', { before: full }, 'before'], ['empty questionKey', { questionKey: '', before: full }, 'before'],
    ['other question', meta(full, full, 'q9'), 'before', 'q1'], ['unknown side', meta(full, full), 'middle'], ['side missing', meta(undefined, full), 'before'], ['side not object', meta('x', full), 'before'],
    ['old event without manualScore', meta({ earned: 1, comment: null }, full), 'before'], ['old event without isCorrect', meta({ earned: 1, manualScore: 1, comment: null }, full), 'before'],
    ['old event without comment', meta({ earned: 1, manualScore: 1, isCorrect: true }, full), 'before'],
    ['negative score', meta({ ...full, earned: -1 }, full), 'before'], ['NaN score', meta({ ...full, earned: Number.NaN }, full), 'before'], ['string score', meta({ ...full, earned: '1' }, full), 'before'],
    ['undefined manualScore', meta({ ...full, manualScore: undefined }, full), 'before'], ['numeric comment', meta({ ...full, comment: 5 }, full), 'before'], ['truthy isCorrect', meta({ ...full, isCorrect: 1 }, full), 'before'],
    ['oversized comment', meta({ ...full, comment: 'x'.repeat(5001) }, full), 'before'],
  ];
  for (const [name, value, side, key] of cases) assert.equal(readHistoryState(value, side, key).ok, false, name);
});

test('limits: pending states, scored points, two decimals, consistency and non-numeric modes', () => {
  assert.equal(validateRestoreState(state(), scored).ok, true, 'pending answer restores as pending');
  assert.equal(validateRestoreState(state({ earned: 2, manualScore: 2, isCorrect: true }), scored).ok, true);
  assert.equal(validateRestoreState(state({ earned: 0, manualScore: 0, isCorrect: false }), scored).ok, true, 'graded zero is allowed when recorded as manual');
  assert.equal(validateRestoreState(state({ earned: 1.5, manualScore: 1.5, isCorrect: false }), scored).ok, true);
  assert.equal(validateRestoreState(state({ earned: 3, manualScore: 3, isCorrect: true }), scored).ok, false, 'above current maximum');
  assert.equal(validateRestoreState(state({ earned: 2.5 }), scored).ok, false, 'automatic earned above maximum');
  assert.equal(validateRestoreState(state({ earned: 1.234, manualScore: 1.234, isCorrect: false }), scored).ok, false, 'three decimals');
  assert.equal(validateRestoreState(state({ earned: 1, manualScore: 1.5, isCorrect: false }), scored).ok, false, 'earned and manual disagree');
  assert.equal(validateRestoreState(state({ earned: 1, manualScore: 1, isCorrect: true }), scored).ok, false, 'isCorrect contradicts score');
  assert.equal(validateRestoreState(state({ earned: 1, manualScore: 1, isCorrect: false }), { ...scored, pointsConfigured: false }).ok, false);
  assert.equal(validateRestoreState(state({ earned: 0, manualScore: 0, isCorrect: null }), { numeric: true, maxPoints: 0, pointsConfigured: true }).ok, true, 'zero-point question has no right/wrong');
  const comment = { numeric: false, maxPoints: 0, pointsConfigured: false };
  assert.equal(validateRestoreState(state({ manualScore: 0, comment: 'tốt' }), comment).ok, true);
  assert.equal(validateRestoreState(state({ comment: 'tốt' }), comment).ok, true);
  assert.equal(validateRestoreState(state({ earned: 1, manualScore: 1 }), comment).ok, false);
  assert.equal(validateRestoreState(state({ isCorrect: true }), comment).ok, false);
});

test('equality never merges pending, zero, empty comment and false', () => {
  const base = state({ earned: 1, manualScore: 1, comment: 'a', isCorrect: false });
  assert.equal(sameGradeState(base, { ...base }), true);
  for (const change of [{ manualScore: null }, { comment: null }, { comment: '' }, { isCorrect: null }, { isCorrect: true }, { earned: 1.01 }] as Partial<GradeState>[])
    assert.equal(sameGradeState(base, { ...base, ...change }), false, JSON.stringify(change));
  assert.equal(sameGradeState(state(), state({ manualScore: 0, isCorrect: false })), false);
  assert.equal(sameGradeState(state({ comment: null }), state({ comment: '' })), false);
});

test('restore decision: retry is a no-op even with a stale base; a changed state conflicts instead of overwriting', () => {
  const target = state({ earned: 1, manualScore: 1, isCorrect: false }), other = state({ earned: 2, manualScore: 2, isCorrect: true });
  assert.equal(decideRestore(target, target, false), 'noop');
  assert.equal(decideRestore(target, target, true), 'noop');
  assert.equal(decideRestore(other, target, true), 'apply');
  assert.equal(decideRestore(other, target, false), 'conflict');
  assert.equal(decideRestore(state(), state({ manualScore: 0, isCorrect: false }), true), 'apply', 'pending to graded zero is a real change, not a no-op');
});

const q = (over = {}) => ({ points: 2, earned: 1.5, isCorrect: false as boolean | null, teacherComment: null as string | null, ...over });

test('submission: pending answers need an explicit score; unchanged comment is not resent; bounds and decimals enforced', () => {
  const pending = q({ earned: 0, isCorrect: null });
  assert.equal(initialScoreText(pending, true), '');
  assert.equal(initialScoreText(q(), true), '1.5');
  assert.equal(buildGradeSubmission(pending, { score: '', comment: 'ghi chú' }, true).ok, false, 'comment alone must not turn pending into 0');
  assert.deepEqual(buildGradeSubmission(pending, { score: '0', comment: '' }, true), { ok: true, earned: 0, teacherComment: undefined });
  assert.deepEqual(buildGradeSubmission(q(), { score: '1,75', comment: '' }, true), { ok: true, earned: 1.75, teacherComment: undefined });
  assert.deepEqual(buildGradeSubmission(q({ teacherComment: 'cũ' }), { score: '1.5', comment: 'mới' }, true), { ok: true, earned: 1.5, teacherComment: 'mới' });
  assert.deepEqual(buildGradeSubmission(q({ teacherComment: 'cũ' }), { score: '1.5', comment: '' }, true), { ok: true, earned: 1.5, teacherComment: '' }, 'clearing a comment is sent as empty text');
  for (const score of ['-1', '2.01', '1.234', 'abc', '1e1', ' ', '--2']) assert.equal(buildGradeSubmission(q(), { score, comment: '' }, true).ok, false, score);
  assert.equal(buildGradeSubmission(q(), { score: '1', comment: 'x'.repeat(5001) }, true).ok, false);
});

test('submission for comment-only/survey work ignores the score and needs a changed non-empty comment', () => {
  const item = q({ earned: 0, isCorrect: null, points: 0 });
  assert.equal(buildGradeSubmission(item, { score: '5', comment: '  ' }, false).ok, false);
  assert.equal(buildGradeSubmission(item, { score: '', comment: '' }, false).ok, false);
  assert.deepEqual(buildGradeSubmission(item, { score: '5', comment: 'Làm tốt' }, false), { ok: true, earned: null, teacherComment: 'Làm tốt' });
  assert.equal(buildGradeSubmission({ ...item, teacherComment: 'Làm tốt' }, { score: '', comment: 'Làm tốt' }, false).ok, false, 'no change to save');
});

test('dirty detection compares with what the box showed, not with zero', () => {
  const pending = q({ earned: 0, isCorrect: null }), graded = q({ teacherComment: 'a' });
  assert.equal(isGradeDraftDirty(pending, undefined, true), false);
  assert.equal(isGradeDraftDirty(pending, { score: '', comment: '' }, true), false);
  assert.equal(isGradeDraftDirty(pending, { score: '0', comment: '' }, true), true, 'typing 0 on a pending answer is a real edit');
  assert.equal(isGradeDraftDirty(graded, { score: '1.5', comment: 'a' }, true), false);
  assert.equal(isGradeDraftDirty(graded, { score: '1.5', comment: 'b' }, true), true);
  assert.equal(isGradeDraftDirty(graded, { score: '9', comment: 'a' }, false), false, 'score box is ignored when the work has no score');
});
