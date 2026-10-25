/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS CLI entry loaded directly by Node. */
// Run with: node --import tsx scripts/test-database.cjs push|run
const { fs, path, workspace } = require('./database-tools.cjs');
const { spawnSync } = require('node:child_process');
const { requireTestDatabase } = require('../tests/helpers/test-database.ts');

try {
  const envFile = path.join(workspace, '.env');
  if (fs.existsSync(envFile)) process.loadEnvFile(envFile);
  const application = new URL(process.env.DATABASE_URL || '');
  const target = new URL(application);
  target.pathname = '/examcraft_test_20261022';
  const env = { ...process.env, TEST_DATABASE_URL: target.href, EXAMCRAFT_ALLOW_TEST_DB: '1' };
  requireTestDatabase(env);
  const action = process.argv[2];
  const args = action === 'push'
    ? [path.join(workspace, 'node_modules/prisma/build/index.js'), 'db', 'push', '--skip-generate']
    : action === 'run' ? ['--import', 'tsx', '--test', '--test-concurrency=1', 'tests/integration_s1.test.ts', 'tests/integration_question_save.test.ts'] : action === 'http' ? ['--import', 'tsx', '--test', 'tests/http_workflows.test.ts', 'tests/http_student_identity.test.ts', 'tests/http_regrade.test.ts', 'tests/http_share_pin.test.ts', 'tests/http_permission_matrix.test.ts', 'tests/http_collab_restore.test.ts', 'tests/http_assignment_window.test.ts', 'tests/http_library.test.ts', 'tests/http_auth.test.ts', 'tests/http_public_policies.test.ts', 'tests/http_assignment_options.test.ts'] : null;
  if (!args) throw new Error('Use push, run or http. Only the dedicated test database is supported.');
  console.log(`Validated test target: ${target.hostname}:${target.port || '5432'}${target.pathname}; action=${action}`);
  const childEnv = action === 'push' ? { ...env, DATABASE_URL: target.href } : env;
  const result = spawnSync(process.execPath, args, { cwd: workspace, env: childEnv, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
  const redact = value => {
    let text = String(value || '');
    for (const secret of [application.href, target.href, application.password, decodeURIComponent(application.password)]) if (secret) text = text.split(secret).join('[redacted]');
    return text;
  };
  process.stdout.write(redact(result.stdout));
  process.stderr.write(redact(result.stderr));
  if (result.error || result.status !== 0) process.exitCode = 1;
} catch (error) {
  // Configuration may contain credentials, so do not echo arbitrary parser error data.
  console.error(error instanceof Error && !/URL|Invalid|URI/.test(error.message) ? error.message : 'Invalid test database configuration.');
  process.exitCode = 1;
}
