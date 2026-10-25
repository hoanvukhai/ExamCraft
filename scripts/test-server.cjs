/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS CLI entry loaded directly by Node. */
const { spawn } = require('node:child_process');
const path = require('node:path');
const crypto = require('node:crypto');
const fs = require('node:fs');
const { requireTestDatabase } = require('../tests/helpers/test-database.ts');
if (fs.existsSync(path.resolve('.env'))) process.loadEnvFile(path.resolve('.env'));
const application = new URL(process.env.DATABASE_URL);
const target = new URL(application); target.pathname = '/examcraft_test_20261022';
const env = { ...process.env, TEST_DATABASE_URL: target.href, EXAMCRAFT_ALLOW_TEST_DB: '1' };
requireTestDatabase(env);
env.DATABASE_URL = target.href;
env.EXAMCRAFT_ISOLATED_TEST_SERVER = '1';
// Tests that touch AI routes run against a local imitation of the provider (tests/http_ai_mock.test.ts), never the real service.
// EXAMCRAFT_REAL_AI=1 is only for a deliberate manual evaluation with a temporary key; CI never sets it.
if (process.env.EXAMCRAFT_REAL_AI !== '1') env.GOOGLE_GEMINI_BASE_URL = 'http://127.0.0.1:3118';
else delete env.GOOGLE_GEMINI_BASE_URL;
env.SESSION_SECRET = crypto.randomBytes(48).toString('base64url');
env.ATTEMPT_SESSION_SECRET = crypto.randomBytes(48).toString('base64url');
const production = process.argv.includes('--production');
console.log(`Starting isolated ExamCraft test server (${production ? 'production build' : 'development'}) at http://127.0.0.1:3117; only examcraft_test_20261022 is used.`);
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', ...(production ? ['start'] : ['dev', '--webpack']), '--hostname', '127.0.0.1', '--port', '3117'], { env, stdio: 'inherit' });
child.on('exit', code => { process.exitCode = code ?? 1; });
process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));
