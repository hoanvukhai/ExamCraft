import { Prisma } from '@prisma/client';

/**
 * A serializable transaction that loses a race can be retried safely. Prisma reports the loss as
 * P2034, as P2002 for a unique key won by the other writer, or - when the conflict is raised by a
 * raw `SELECT ... FOR UPDATE` - as P2010 whose meta.code is the PostgreSQL SQLSTATE
 * (40001 serialization failure, 40P01 deadlock).
 */
export const MAX_TRANSACTION_TRIES = 6;

/** Local isolated-test telemetry only; never enabled by request input. */
export function withTestTransactionTries<T extends Response>(response: T, tries: number): T {
  if (process.env.EXAMCRAFT_ISOLATED_TEST_SERVER === '1') response.headers.set('x-examcraft-test-transaction-tries', String(tries));
  return response;
}

/** Short random pause before the next try, so racing writers stop colliding in lockstep. */
export const retryPause = (retry: number) => new Promise<void>(resolve => setTimeout(resolve, 20 * (retry + 1) + Math.random() * 60));

export function isRetryableTransactionError(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (error.code === 'P2034' || error.code === 'P2002') return true;
  const state = (error.meta as { code?: unknown } | undefined)?.code;
  return error.code === 'P2010' && (state === '40001' || state === '40P01');
}
