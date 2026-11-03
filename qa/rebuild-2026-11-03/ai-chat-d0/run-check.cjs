/* Local Đ0 checks; credentials are loaded in memory, never copied into evidence. */
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { requireTestDatabase } = require('../../../tests/helpers/test-database.ts');

const action = process.argv[2];
const envFile = process.argv[3];
if (!envFile) throw Error('An existing local env file must be supplied; no env file is copied.');
process.loadEnvFile(envFile);
const application = new URL(process.env.DATABASE_URL);
const target = new URL(application);
target.pathname = '/examcraft_test_20261022';
const env = {
  ...process.env,
  TEST_DATABASE_URL: target.href,
  EXAMCRAFT_ALLOW_TEST_DB: '1',
  NEXT_BUILD_CPUS: '1',
  NODE_OPTIONS: '--max-old-space-size=1024',
  GOOGLE_GEMINI_BASE_URL: 'http://127.0.0.1:3118',
  EXAMCRAFT_REAL_AI: '0',
  EXAMCRAFT_TEST_PORT: '3123',
  EXAMCRAFT_TEST_ORIGIN: 'http://127.0.0.1:3123',
  PILOT_BROWSER_PATH: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
};
requireTestDatabase(env);
if (target.port !== '5436') throw Error('Unexpected test PostgreSQL port.');
for (const key of Object.keys(env))
  if (/^(GEMINI_API_KEY|GOOGLE_API_KEY|OPENAI_API_KEY)/.test(key)) delete env[key];
const npm = path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
const tasks = {
  typecheck: ['node_modules/typescript/bin/tsc', '--noEmit'],
  lint: [
    'node_modules/eslint/bin/eslint.js',
    'src/components/ExamWorkspace.tsx',
    'src/components/useExamPersistence.ts',
    'src/components/RightCompanionRail.tsx',
    'src/components/editor/EditorSaveStatus.tsx',
    'tests_pilot/ai_chat_d0.test.ts',
  ],
  build: ['node_modules/next/dist/bin/next', 'build', '--webpack'],
  integration: [npm, 'run', 'test:integration'],
  guards: [
    '--import',
    'tsx',
    '--test',
    '--test-concurrency=1',
    'tests/header_layout.test.ts',
    'tests/generation_and_drafts.test.ts',
    'tests/persistence_permissions.test.ts',
    'tests/copilot_submission.test.ts',
    'tests/ai_proposal_journal.test.ts',
    'tests/copilot_history.test.ts',
  ],
  server: ['--import', 'tsx', 'scripts/test-server.cjs', '--production'],
  browser: ['--import', 'tsx', '--test', '--test-concurrency=1', 'tests_pilot/ai_chat_d0.test.ts'],
};
if (!tasks[action]) throw Error('Unknown check.');
if (action === 'build') env.DATABASE_URL = target.href;
async function run() {
  if (['integration', 'server', 'browser'].includes(action)) {
    const { PrismaClient } = require('@prisma/client');
    const db = new PrismaClient({ datasources: { db: { url: target.href } }, log: [] });
    try {
      const rows = await db.$queryRawUnsafe('SELECT current_database()');
      if (rows[0].current_database !== 'examcraft_test_20261022')
        throw Error('Wrong connected database.');
      console.log('Verified connected database: examcraft_test_20261022');
    } finally {
      await db.$disconnect();
    }
  }
  // Existing integration scripts write evidence to their original batch directory.
  // Preserve that historical evidence and collect the fresh results in this batch.
  const legacyPaths =
    action === 'integration'
      ? ['qa/rebuild-2026-10-25/integration_s1.json', 'qa/rebuild-2026-10-25/question-save.json']
      : [];
  const previous = new Map(
    legacyPaths.map((file) => [file, fs.existsSync(file) ? fs.readFileSync(file) : null]),
  );
  const log = fs.createWriteStream(path.join(__dirname, action + '.log'));
  const child = spawn(process.execPath, tasks[action], { env, stdio: ['ignore', 'pipe', 'pipe'] });
  for (const stream of [child.stdout, child.stderr])
    stream.on('data', (bytes) => {
      let text = String(bytes);
      for (const secret of [
        application.href,
        target.href,
        application.password,
        decodeURIComponent(application.password),
      ])
        if (secret) text = text.split(secret).join('[redacted]');
      log.write(text);
    });
  child.on('error', () => {
    console.error(action + ': failed to launch');
    process.exitCode = 1;
    log.end();
  });
  child.on('exit', (code) => {
    for (const [file, old] of previous) {
      if (fs.existsSync(file)) fs.copyFileSync(file, path.join(__dirname, path.basename(file)));
      if (old) fs.writeFileSync(file, old);
      else if (fs.existsSync(file)) fs.unlinkSync(file);
    }
    log.end();
    console.log(action + ': exit ' + code + '; evidence: ' + path.join(__dirname, action + '.log'));
    process.exitCode = code ?? 1;
  });
  process.on('SIGINT', () => child.kill('SIGINT'));
  process.on('SIGTERM', () => child.kill('SIGTERM'));
}
run().catch(() => {
  console.error('Preflight failed; no child check started. Check local test DB configuration.');
  process.exitCode = 1;
});
