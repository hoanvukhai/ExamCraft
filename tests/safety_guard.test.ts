import assert from 'node:assert/strict';
import test from 'node:test';
import { requireTestDatabase } from './helpers/test-database';

const valid = { EXAMCRAFT_ALLOW_TEST_DB: '1', TEST_DATABASE_URL: 'postgresql://tester:fixture-only@localhost:5437/examcraft_test' };
test('integration runner requires an explicit isolated target and opt-in', () => {
  assert.throws(() => requireTestDatabase({}), /ALLOW_TEST_DB/);
  assert.throws(() => requireTestDatabase({ EXAMCRAFT_ALLOW_TEST_DB: '1' }), /Missing TEST_DATABASE_URL/);
  assert.equal(requireTestDatabase(valid), valid.TEST_DATABASE_URL);
});
test('integration guard rejects application, remote, malformed and non-PostgreSQL targets', () => {
  for (const url of ['postgresql://localhost/examcraft', 'postgresql://remote.example/examcraft_test', 'file:./test.db', 'bad', 'postgresql://localhost/examcraft_test%2Fother']) assert.throws(() => requireTestDatabase({ ...valid, TEST_DATABASE_URL: url }));
  assert.throws(() => requireTestDatabase({ ...valid, DATABASE_URL: 'postgresql://other:other@127.0.0.1:5437/examcraft_test?schema=another' }), /matches/);
});
test('guard never exposes secret values in diagnostics', () => {
  const secret = 'DO_NOT_DISCLOSE_THIS';
  try {
    requireTestDatabase({ ...valid, TEST_DATABASE_URL: `postgresql://tester:${secret}@remote.example/examcraft_test` });
    assert.fail('remote target accepted');
  } catch (error) {
    assert.ok(error instanceof Error);
    assert.ok(!error.message.includes(secret));
  }
});
