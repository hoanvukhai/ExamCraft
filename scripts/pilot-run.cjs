// No browser downloads or production database fallback. See tests_pilot/pilot.test.ts.
const fs = require('node:fs');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const { requireTestDatabase } = require('../tests/helpers/test-database.ts');
async function main() {
  process.loadEnvFile(path.resolve('.env'));
  const app = new URL(process.env.DATABASE_URL);
  const target = new URL(app); target.pathname = '/examcraft_test_20261022';
  const env = { ...process.env, TEST_DATABASE_URL: target.href, EXAMCRAFT_ALLOW_TEST_DB: '1' };
  requireTestDatabase(env);
  const browser = [process.env.PILOT_BROWSER_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(p => p && fs.existsSync(p));
  if (!browser) throw Error('BLOCKED: no installed Chrome/Edge. Browser download is disabled.');
  const health = await fetch((process.env.EXAMCRAFT_TEST_ORIGIN ?? 'http://127.0.0.1:3117') + '/api/health', { signal: AbortSignal.timeout(10000) });
  if (!health.ok || (await health.json()).isolatedTest !== true) throw Error('BLOCKED: server3117 did not prove isolatedTest. Start scripts/test-server.cjs --production.');
  console.log('Pilot guard: installed browser; isolatedTest confirmed; exact test database selected.');
  if (process.env.PILOT_FLOW && !/^F[1-7]$|^F9$|^F1[0-9]$|^F2[0-5]$/.test(process.env.PILOT_FLOW)) throw Error('BLOCKED: PILOT_FLOW must name F1-F7 or F9-F25. F8 is the separate backup rehearsal.');
  const admin = process.argv.includes('--admin');
  const typography = process.argv.includes('--typography');
  const teacher = process.argv.includes('--teacher');
  const library = process.argv.includes('--library');
  if ([admin, typography, teacher, library, !!process.env.PILOT_FLOW].filter(Boolean).length > 1) throw Error('Select only one browser suite or PILOT_FLOW.');
  const result = spawnSync(process.execPath, ['--import', 'tsx', '--test', '--test-concurrency=1', ...(process.env.PILOT_FLOW ? ['--test-name-pattern', '^' + process.env.PILOT_FLOW + ' '] : []), library ? 'tests_pilot/library.test.ts' : teacher ? 'tests_pilot/teacher.test.ts' : typography ? 'tests_pilot/typography.test.ts' : admin ? 'tests_pilot/admin.test.ts' : 'tests_pilot/pilot.test.ts'], { env: { ...env, PILOT_BROWSER_PATH: browser }, stdio: 'inherit' });
  process.exitCode = result.status ?? 1;
}
main().catch(() => { console.error('BLOCKED: pilot preflight failed (browser, isolated server, or test DB). No fixture writes performed.'); process.exitCode = 1; });
