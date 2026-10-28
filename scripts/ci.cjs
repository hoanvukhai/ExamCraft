/* One command that runs every check in order and stops at the first failure.
 *   npm run ci            type check, lint, safe tests, build, isolated server, HTTP tests, browser flows
 *   npm run ci -- --quick type check, lint and safe tests only (no database, no browser)
 * Everything that writes uses the dedicated test database through the guarded scripts; nothing here touches the main database
 * or the real AI service (the test server is pointed at a local imitation of the provider).
 */
const { spawn, spawnSync } = require('node:child_process');
const { ciServerTarget } = require('./ci-server-target.cjs');
const target = ciServerTarget();
process.env.EXAMCRAFT_TEST_ORIGIN = target.origin;
process.env.EXAMCRAFT_TEST_PORT = target.port;
process.env.EXAMCRAFT_TEST_HOST = '127.0.0.1';
process.env.EXAMCRAFT_REAL_AI = '0';

const quick = process.argv.includes('--quick');
const results = [];
const started = Date.now();
const node = process.execPath;
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function step(name, command, args, options = {}) {
  const begin = Date.now();
  console.log(`\n=== ${name} ===`);
  const result = spawnSync(command, args, { stdio: 'inherit', shell: process.platform === 'win32' && command === npm, ...options });
  const ok = result.status === 0;
  results.push({ name, ok, seconds: Math.round((Date.now() - begin) / 1000) });
  if (!ok) finish(`FAILED at: ${name}`);
}
function finish(message) {
  console.log('\n=== Summary ===');
  for (const item of results) console.log(`${item.ok ? 'PASS' : 'FAIL'}  ${item.name} (${item.seconds}s)`);
  console.log(`${message} (${Math.round((Date.now() - started) / 1000)}s total)`);
  process.exit(message.startsWith('FAILED') ? 1 : 0);
}
async function health() {
  try { const response = await fetch(target.origin + '/api/health', { signal: AbortSignal.timeout(3000) }); return response.ok ? await response.json() : null; } catch { return null; }
}

(async () => {
  step('Type check', npm, ['exec', '--', 'tsc', '--noEmit', '-p', '.']);
  step('Lint', npm, ['run', 'lint']);
  step('Safe tests (no database, no AI)', npm, ['test']);
  if (quick) finish('All quick checks passed');
  if (await health()) finish('FAILED at: a server is already running on the selected test port; no server was stopped');
  step('Production build', npm, ['run', 'build'], { env: { ...process.env, NEXT_BUILD_CPUS: process.env.NEXT_BUILD_CPUS ?? '1', NODE_OPTIONS: process.env.NODE_OPTIONS ?? '--max-old-space-size=1024' } });

  console.log('\n=== Starting the isolated test server ===');
  const server = spawn(node, ['--import', 'tsx', 'scripts/test-server.cjs', '--production'], { stdio: 'ignore' });
  const stop = () => { try { if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(server.pid), '/T', '/F'], { stdio: 'ignore' }); else server.kill('SIGTERM'); } catch { /* already gone */ } };
  process.on('exit', stop);
  let up = null;
  for (let i = 0; i < 60 && !up; i++) { up = await health(); if (!up) await new Promise(resolve => setTimeout(resolve, 1000)); }
  if (!up || up.isolatedTest !== true) { stop(); finish('FAILED at: the isolated test server did not start or did not prove it is isolated'); }
  results.push({ name: 'Isolated test server', ok: true, seconds: 0 });
  try {
    step('HTTP tests (test database, local AI imitation)', npm, ['run', 'test:http']);
    step('Browser flows', npm, ['run', 'test:pilot']);
  } finally { stop(); }
  finish('All checks passed');
})();
