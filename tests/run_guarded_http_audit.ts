import { requireTestDatabase } from './helpers/test-database';

try {
  requireTestDatabase();
  // The old audit calls paid AI and assumes a running server sharing its database.
  // It must be rewritten with explicit server isolation before it is safe to run.
  throw new Error('Legacy HTTP audit is quarantined: it writes database fixtures and calls real AI. Use the isolated verification suites until the audit is migrated.');
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Audit refused.');
  process.exitCode = 1;
}
