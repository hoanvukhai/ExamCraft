/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS CLI helper. */
// Usage: node scripts/run-with-test-db.cjs <script.ts> [arguments...]
// Runs a TypeScript script with the guarded test-database variables set, so it can only ever touch examcraft_test_20261022.
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { requireTestDatabase } = require('../tests/helpers/test-database.ts');

const script = process.argv[2];
if (!script) throw new Error('Name the script to run.');
process.loadEnvFile(path.resolve('.env'));
const target = new URL(process.env.DATABASE_URL);
target.pathname = '/examcraft_test_20261022';
const env = { ...process.env, TEST_DATABASE_URL: target.href, EXAMCRAFT_ALLOW_TEST_DB: '1' };
requireTestDatabase(env);
const result = spawnSync(process.execPath, ['--import', 'tsx', script, ...process.argv.slice(3)], { stdio: 'inherit', env });
process.exitCode = result.status ?? 1;
