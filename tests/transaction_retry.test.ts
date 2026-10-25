import test from 'node:test';
import assert from 'node:assert/strict';
import { Prisma } from '@prisma/client';
import { isRetryableTransactionError, withTestTransactionTries } from '../src/lib/transaction-retry';

test('transaction telemetry is absent outside the isolated test server', () => {
  const previous = process.env.EXAMCRAFT_ISOLATED_TEST_SERVER;
  try {
    delete process.env.EXAMCRAFT_ISOLATED_TEST_SERVER;
    assert.equal(withTestTransactionTries(new Response(), 3).headers.has('x-examcraft-test-transaction-tries'), false);
    process.env.EXAMCRAFT_ISOLATED_TEST_SERVER = '1';
    assert.equal(withTestTransactionTries(new Response(), 3).headers.get('x-examcraft-test-transaction-tries'), '3');
  } finally { if (previous === undefined) delete process.env.EXAMCRAFT_ISOLATED_TEST_SERVER; else process.env.EXAMCRAFT_ISOLATED_TEST_SERVER = previous; }
});

const known = (code: string, meta?: Record<string, unknown>) => new Prisma.PrismaClientKnownRequestError('x', { code, clientVersion: 'test', meta });

test('lost races are retryable whichever way Prisma reports them', () => {
  assert.equal(isRetryableTransactionError(known('P2034')), true);
  assert.equal(isRetryableTransactionError(known('P2002')), true);
  assert.equal(isRetryableTransactionError(known('P2010', { code: '40001', message: 'could not serialize access due to concurrent update' })), true);
  assert.equal(isRetryableTransactionError(known('P2010', { code: '40P01' })), true);
});

test('other failures are never retried', () => {
  assert.equal(isRetryableTransactionError(known('P2010', { code: '42P01' })), false, 'a missing table is not a race');
  assert.equal(isRetryableTransactionError(known('P2010')), false);
  assert.equal(isRetryableTransactionError(known('P2025')), false);
  assert.equal(isRetryableTransactionError(new Error('ATTEMPT_WRITE_CONFLICT')), false, 'plain errors keep their own handling');
  assert.equal(isRetryableTransactionError(null), false);
  assert.equal(isRetryableTransactionError({ code: 'P2034' }), false, 'only real Prisma errors count');
});
