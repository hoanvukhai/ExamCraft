// Local guarded CommonJS rehearsal; .cjs is supported by the repository lint config.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { spawnSync } = require('node:child_process');
const assert = require('node:assert/strict');
const { workspace, configuration, verifyContainer, sql } = require('./database-tools.cjs');

const reportDir = path.join(workspace, 'qa/rebuild-2026-10-25');
fs.mkdirSync(reportDir, { recursive: true });
const report = { checkedAt: new Date().toISOString(), status: 'INCOMPLETE', steps: [], mainDatabaseWritten: false, realAiCalls: false };
let secretValues = [];
function redact(value) {
  let text = String(value ?? '');
  for (const secret of secretValues) if (secret) text = text.split(secret).join('[redacted]');
  return text.replace(/postgres(?:ql)?:\/\/[^\s"']+/g, '[redacted-db-url]');
}
function run(name, command, args, cwd, env) {
  console.log(name);
  const result = spawnSync(command, args, { cwd, env, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, shell: process.platform === 'win32' && command === 'npm.cmd' });
  report.steps.push({ name, exitCode: result.status });
  fs.appendFileSync(path.join(reportDir, 'r4-clean-migration.log'), `\n=== ${name} ===\n${redact(result.stdout)}${redact(result.stderr)}\nexit ${result.status}\n`);
  if (result.error || result.status !== 0) throw new Error(`${name} failed; see sanitized log`);
  return String(result.stdout ?? '').trim();
}
try {
  const config = configuration({});
  const source = new URL(process.env.DATABASE_URL);
  secretValues = Object.entries(process.env).filter(([key,value]) => value && /DATABASE_URL|PASSWORD|SECRET|API_KEY|TOKEN/.test(key)).map(([,value]) => value);
  secretValues.push(source.password, decodeURIComponent(source.password));
  const token = randomUUID().replaceAll('-', '').slice(0, 10);
  const name = `examcraft_migrate_clean_${new Date().toISOString().slice(0,10).replaceAll('-','')}_${token}`;
  assert.match(name, /^examcraft_migrate_[a-z0-9_]+$/);
  assert.notEqual(name, config.database);
  const scratch = path.resolve(os.tmpdir(), 'examcraft-clean-migration-' + token);
  const fromWorkspace = path.relative(workspace, scratch);
  assert.ok(path.isAbsolute(fromWorkspace) || fromWorkspace === '..' || fromWorkspace.startsWith('..' + path.sep), 'Scratch checkout must be outside the repo');
  assert.equal(fs.existsSync(scratch), false, 'Never overwrite an existing scratch directory');
  report.scratch = scratch; report.database = name;
  report.sourceCommit = run('Source revision', 'git', ['rev-parse','HEAD'], workspace, process.env);
  run('Clone local repository (no hardlinks)', 'git', ['clone','--no-hardlinks',workspace,scratch], workspace, process.env);
  assert.equal(fs.existsSync(path.join(scratch,'.env')), false, 'Do not copy a private env file');
  const target = new URL(source); target.pathname = '/' + name;
  const env = { ...process.env, DATABASE_URL: target.href, NODE_OPTIONS: '--max-old-space-size=1024', PRISMA_HIDE_UPDATE_MESSAGE: '1' };
  for (const key of Object.keys(env)) if (/GEMINI|GOOGLE|SESSION_SECRET|ENCRYPTION_KEY|API_KEY/.test(key)) delete env[key];
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  run('npm ci in clean checkout', npm, ['ci','--no-audit','--no-fund'], scratch, env);
  verifyContainer(config);
  assert.equal(sql(config, 'postgres', `SELECT datname FROM pg_database WHERE datname = '${name}'`), '', 'Never reuse a database');
  sql(config, 'postgres', `CREATE DATABASE "${name}" OWNER "${config.user}"`);
  report.databaseCreated = true;
  const prisma = path.join(scratch, 'node_modules/prisma/build/index.js');
  for (let pass = 1; pass <= 2; pass++) {
    run(`Migration deploy pass ${pass}`, process.execPath, [prisma,'migrate','deploy'], scratch, env);
    run(`Migration status pass ${pass}`, process.execPath, [prisma,'migrate','status'], scratch, env);
  }
  report.migrations = JSON.parse(sql(config,name,'SELECT json_build_object(\'total\',count(*),\'finished\',count(finished_at),\'rolledBack\',count(rolled_back_at)) FROM "_prisma_migrations"'));
  assert.equal(Number(report.migrations.total), Number(report.migrations.finished));
  assert.equal(Number(report.migrations.rolledBack), 0);
  report.cloneStatus = run('Clean checkout status', 'git', ['status','--porcelain'], scratch, env);
  report.status = 'PASS';
} catch (error) {
  report.status = 'FAIL'; report.error = redact(error instanceof Error ? error.message : 'Clean migration rehearsal failed'); process.exitCode = 1;
} finally {
  report.finishedAt = new Date().toISOString();
  report.retained = 'Any checkout/database created by this run is retained for review; no database or files deleted.';
  fs.writeFileSync(path.join(reportDir,'r4-clean-migration.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({ status: report.status, steps: report.steps, databaseCreated: report.databaseCreated ?? false }));
}
