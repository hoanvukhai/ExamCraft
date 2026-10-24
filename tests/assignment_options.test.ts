import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAssignmentOptions, localToIso, isoToLocal, normalizeJoinCode, assignmentPolicyError } from '../src/lib/assignment-options';

const now = new Date(2026, 9, 24, 10, 0, 0); // local time: 24/10/2026 10:00
const base = { defaultMaxAttempts: 3, hasGroup: true, identityMode: 'PICK_FROM_LIST', now };

test('local date-time round-trips through UTC without shifting the minute, in any time zone', () => {
  for (const local of ['2026-10-24T08:30', '2026-12-31T23:59', '2027-01-01T00:00', '2026-03-29T02:30']) {
    const iso = localToIso(local);
    if (iso === null) { assert.ok(local === '2026-03-29T02:30', 'only a skipped daylight-saving minute may be rejected'); continue; }
    assert.match(iso, /Z$/); assert.equal(isoToLocal(iso), local);
  }
});

test('impossible or malformed dates are rejected, never rolled over', () => {
  for (const bad of ['2026-02-31T08:00', '2026-13-01T08:00', '24/10/2026 08:00', '2026-10-24', '2026-10-24T25:00', 'abc']) assert.equal(localToIso(bad), null, bad);
  assert.equal(localToIso(''), null); assert.equal(localToIso(undefined), null);
  assert.deepEqual(buildAssignmentOptions({ ...base, closesAtLocal: '2026-02-31T08:00' }), { ok: false, error: 'Giờ đóng chưa hợp lệ. Hãy chọn lại ngày và giờ.' });
});

test('defaults keep the old behavior: nothing set means the default attempts and no times, code or PIN', () => {
  const result = buildAssignmentOptions(base);
  assert.deepEqual(result, { ok: true, payload: { maxAttempts: 3, requirePin: false, shuffleQuestions: false, shuffleChoices: false } });
  assert.deepEqual(buildAssignmentOptions({ ...base, defaultMaxAttempts: 1, maxAttempts: '' }), { ok: true, payload: { maxAttempts: 1, requirePin: false, shuffleQuestions: false, shuffleChoices: false } });
});

test('close must be in the future and after open', () => {
  assert.equal(buildAssignmentOptions({ ...base, closesAtLocal: '2026-10-24T09:00' }).ok, false, 'already past');
  assert.equal(buildAssignmentOptions({ ...base, opensAtLocal: '2026-10-25T10:00', closesAtLocal: '2026-10-25T10:00' }).ok, false, 'equal');
  assert.equal(buildAssignmentOptions({ ...base, opensAtLocal: '2026-10-25T10:00', closesAtLocal: '2026-10-25T09:00' }).ok, false, 'before open');
  const good = buildAssignmentOptions({ ...base, opensAtLocal: '2026-10-25T08:00', closesAtLocal: '2026-10-25T09:00' });
  assert.equal(good.ok, true);
  if (good.ok) { assert.ok(new Date(good.payload.closesAt!) > new Date(good.payload.opensAt!)); }
});

test('attempts are whole numbers from 1 to 10; zero and fractions are errors, not defaults', () => {
  for (const bad of [0, -1, 11, 2.5, 'abc', '0']) assert.equal(buildAssignmentOptions({ ...base, maxAttempts: bad }).ok, false, String(bad));
  for (const good of [1, 10, '4']) { const r = buildAssignmentOptions({ ...base, maxAttempts: good }); assert.equal(r.ok && r.payload.maxAttempts, Number(good)); }
});

test('join code is trimmed and uppercased; unsafe values are refused', () => {
  assert.equal(normalizeJoinCode('  ab12cd '), 'AB12CD');
  assert.equal(normalizeJoinCode(''), undefined); assert.equal(normalizeJoinCode(undefined), undefined); assert.equal(normalizeJoinCode(null), undefined);
  for (const bad of ['abc', 'a b c d', 'ABCDEFGHIJKLM', 'ÁBCD1', 'AB-12', 5]) assert.equal(normalizeJoinCode(bad), null, String(bad));
  const r = buildAssignmentOptions({ ...base, joinCode: 'ma-01' });
  assert.equal(r.ok, false);
  const ok = buildAssignmentOptions({ ...base, joinCode: 'ma01x' });
  assert.equal(ok.ok && ok.payload.joinCode, 'MA01X');
});

test('PIN needs a class and a list or personal-link identity', () => {
  assert.equal(buildAssignmentOptions({ ...base, requirePin: true }).ok, true);
  assert.equal(buildAssignmentOptions({ ...base, requirePin: true, hasGroup: false, identityMode: 'FREE_NAME' }).ok, false);
  assert.equal(buildAssignmentOptions({ ...base, requirePin: true, identityMode: 'FREE_NAME' }).ok, false);
  assert.match(assignmentPolicyError({ requirePin: true, hasGroup: false, identityMode: 'FREE_NAME', maxAttempts: 1 }) ?? '', /PIN/);
  assert.equal(assignmentPolicyError({ requirePin: false, hasGroup: false, identityMode: 'FREE_NAME', maxAttempts: 1 }), null);
});

test('shuffle flags pass through and never turn on by themselves', () => {
  const on = buildAssignmentOptions({ ...base, shuffleQuestions: true, shuffleChoices: true });
  assert.equal(on.ok && on.payload.shuffleQuestions && on.payload.shuffleChoices, true);
  const off = buildAssignmentOptions(base);
  assert.equal(off.ok && (off.payload.shuffleQuestions || off.payload.shuffleChoices), false);
});
