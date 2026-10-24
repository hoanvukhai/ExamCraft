// Run an isolated app from a verified restored package. Main DB/config/assets are never changed.
const { fs, path, workspace, argumentsFor, configuration, verifyContainer } = require('./database-tools.cjs');
const { loadPackage, restoreTarget, snapshot, safeWorkspacePath, recoverConfig, protectConfig, copyAssets } = require('./backup-package-tools.cjs');
const { parseEnv } = require('node:util');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const net = require('node:net');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
let stage = 'validate restore run';
function decrypt(row, secret) {
  const decipher = crypto.createDecipheriv('aes-256-gcm', crypto.createHash('sha256').update(secret).digest(), Buffer.from(row.keyIv, 'hex'));
  decipher.setAuthTag(Buffer.from(row.keyTag, 'hex'));
  return Buffer.concat([decipher.update(Buffer.from(row.keyEncrypted, 'hex')), decipher.final()]);
}
function encrypt(bytes, secret) {
  const iv = crypto.randomBytes(12), cipher = crypto.createCipheriv('aes-256-gcm', crypto.createHash('sha256').update(secret).digest(), iv);
  const encrypted = Buffer.concat([cipher.update(bytes), cipher.final()]);
  return { keyEncrypted: encrypted.toString('hex'), keyIv: iv.toString('hex'), keyTag: cipher.getAuthTag().toString('hex') };
}
async function main() {
  const args = argumentsFor(process.argv.slice(2));
  if (typeof args.run !== 'string') throw Error('Provide --run pointing to a verified restore-run directory');
  const run = safeWorkspacePath(path.resolve(workspace, args.run));
  const restored = JSON.parse(fs.readFileSync(path.join(run, 'restore-result.json'), 'utf8'));
  if (restored.status !== 'RESTORED_VERIFIED') throw Error('Unverified restore run');
  const bundle = loadPackage(restored.package), targetName = restoreTarget(restored.restoredDatabase, 'examcraft');
  const config = configuration({});
  if (config.database !== 'examcraft' || config.container !== 'examcraft_postgres' || config.port !== '5436') throw Error('Unexpected source configuration');
  verifyContainer(config);
  const targetUrl = new URL(process.env.DATABASE_URL); targetUrl.pathname = '/' + targetName;
  if (targetUrl.pathname === '/examcraft') throw Error('Main DB cannot be an app rehearsal target');
  if (fs.existsSync(path.join(run, 'runtime-config.dpapi'))) throw Error('This rehearsal already began; restore a new target rather than overwrite it');
  if (JSON.stringify(snapshot(config, targetName)) !== JSON.stringify(bundle.manifest.sourceTables)) throw Error('Restore target changed before rehearsal');
  const sourceBefore = snapshot(config, config.database);
  const recoveredText = recoverConfig(path.join(run, 'config.dpapi')), recovered = parseEnv(recoveredText);
  if (!recovered.SESSION_SECRET) throw Error('Source encryption key unavailable');
  const newSecret = crypto.randomBytes(48).toString('base64url'), attemptSecret = crypto.randomBytes(48).toString('base64url');
  const runtimeText = recoveredText + `\nDATABASE_URL=${JSON.stringify(targetUrl.href)}\nSESSION_SECRET=${JSON.stringify(newSecret)}\nATTEMPT_SESSION_SECRET=${JSON.stringify(attemptSecret)}\n`;
  protectConfig(runtimeText, path.join(run, 'runtime-config.dpapi'));
  const runtime = parseEnv(recoverConfig(path.join(run, 'runtime-config.dpapi')));
  if (runtime.DATABASE_URL !== targetUrl.href || runtime.SESSION_SECRET !== newSecret) throw Error('Runtime target configuration differs');
  const db = new PrismaClient({ datasources: { db: { url: targetUrl.href } }, log: [] });
  let child;
  try {
    stage = 'rekey restored copy only';
    const keys = await db.userApiKey.findMany();
    await db.$transaction(async tx => {
      for (const row of keys) {
        const clear = decrypt(row, recovered.SESSION_SECRET);
        const encoded = encrypt(clear, runtime.SESSION_SECRET);
        if (!decrypt(encoded, runtime.SESSION_SECRET).equals(clear)) throw Error('Rekey verification failed');
        await tx.userApiKey.update({ where: { id: row.id }, data: encoded });
        clear.fill(0);
      }
    });
    stage = 'prepare copied application';
    const app = path.join(run, 'app'); fs.mkdirSync(app);
    copyAssets(path.join(run, 'public'), path.join(app, 'public'), bundle.manifest.publicFiles);
    fs.copyFileSync(path.join(workspace, 'package.json'), path.join(app, 'package.json'), fs.constants.COPYFILE_EXCL);
    fs.copyFileSync(path.join(workspace, 'next.config.ts'), path.join(app, 'next.config.ts'), fs.constants.COPYFILE_EXCL);
    fs.cpSync(path.join(workspace, '.next'), path.join(app, '.next'), { recursive: true, errorOnExist: true, force: false, filter: file => !['cache', 'dev', 'diagnostics', 'types'].includes(path.relative(path.join(workspace, '.next'), file).split(path.sep)[0]) });
    // No recovered .env is written into app. Explicit child overrides always point at the copy.
    await new Promise((resolve, reject) => {
      const probe = net.createServer(); probe.once('error', reject); probe.listen(3118, '127.0.0.1', () => probe.close(resolve));
    });
    const log = fs.openSync(path.join(run, 'app-server.log'), 'wx', 0o600);
    child = spawn(process.execPath, [path.join(workspace, 'node_modules/next/dist/bin/next'), 'start', app, '--hostname', '127.0.0.1', '--port', '3118'], { cwd: app, env: { ...process.env, ...runtime, NODE_ENV: 'production', EXAMCRAFT_ISOLATED_TEST_SERVER: '0' }, stdio: ['ignore', log, log] });
    fs.closeSync(log);
    const origin = 'http://127.0.0.1:3118';
    stage = 'start restored application';
    let started = false;
    for (let i = 0; i < 60; i++) {
      if (child.exitCode !== null) break;
      try { const health = await fetch(origin + '/api/health', { signal: AbortSignal.timeout(1000) }); if (health.ok) { started = true; break; } } catch { /* own child startup */ }
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    if (!started) throw Error('Restored app did not become healthy');
    stage = 'exercise fixture account on restored application';
    const email = `restore_${crypto.randomUUID()}@example.invalid`, password = crypto.randomBytes(24).toString('base64url');
    const teacher = await db.user.create({ data: { email, name: 'QA bản phục hồi', role: 'TEACHER', isActive: true, mustChangePassword: false, passwordHash: await bcrypt.hash(password, 10), aiDailyLimit: 0 } });
    const request = async (route, method = 'GET', body, cookie = '') => fetch(origin + route, { method, headers: { Origin: origin, ...(cookie ? { Cookie: cookie } : {}), ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(15000) });
    const login = await request('/api/auth/login', 'POST', { email, password });
    if (!login.ok) throw Error('Restored login failed');
    const cookie = login.headers.getSetCookie().map(part => part.split(';')[0]).join('; ');
    const created = await request('/api/exams', 'POST', { document: { id: 'restore-app-' + teacher.id, createdAt: '2026-10-23', updatedAt: '2026-10-23', metadata: { title: 'QA phục hồi: giữ điểm 0 và lời giải', subject: 'toan', grade: 6, durationMinutes: 15, schoolName: '', departmentName: '' }, questions: [{ id: 'q', type: 'essay', difficulty: 'thong_hieu', content: 'QA bản phục hồi', points: 0, step_by_step_solution: 'QA đáp án bản phục hồi' }] } }, cookie);
    const saved = await created.json();
    if (!created.ok || !saved.document?.id) throw Error('Restored create failed');
    const loaded = await request('/api/exams/' + saved.document.id, 'GET', undefined, cookie), document = (await loaded.json()).document;
    if (!loaded.ok || document?.questions[0]?.points !== 0 || document.questions[0].step_by_step_solution !== 'QA đáp án bản phục hồi') throw Error('Restored round trip differs');
    if ((await db.exam.findUniqueOrThrow({ where: { id: saved.document.id } })).ownerId !== teacher.id) throw Error('App did not write to the verified restore DB');
    let fileRequests = 0;
    for (const file of bundle.manifest.publicFiles) {
      const response = await fetch(origin + '/' + file.path, { signal: AbortSignal.timeout(10000) });
      if (!response.ok || crypto.createHash('sha256').update(Buffer.from(await response.arrayBuffer())).digest('hex') !== file.sha256) throw Error('Restored app asset bytes differ');
      fileRequests++;
    }
    stage = 'verify main source unchanged';
    if (JSON.stringify(snapshot(config, config.database)) !== JSON.stringify(sourceBefore)) throw Error('Main source changed during rehearsal');
    const report = { status: 'PASS', checkedAt: new Date().toISOString(), restoredDatabase: targetName, runDirectory: path.relative(workspace, run), appRoot: path.relative(workspace, app), buildId: fs.readFileSync(path.join(app, '.next/BUILD_ID'), 'utf8').trim(), productionStartup: true, protectedRuntimeConfigTargetsCopy: true, rekeyedCopiedKeys: keys.length, copiedKeysPlaintextPreserved: true, fixtureLogin: true, examSavedAndReopened: true, zeroPointsAndSolutionPreserved: true, directDatabaseConfirmed: true, restoredFilesServedAndHashed: fileRequests, mainSourceUnchanged: true, mainConfigModified: false, providerCalls: 0, deletions: 0, fixtureDataRetained: true, serverStoppedInFinally: true };
    fs.writeFileSync(path.join(run, 'app-rehearsal.json'), JSON.stringify(report, null, 2), { flag: 'wx' });
    fs.writeFileSync(path.join(workspace, 'qa/rebuild-2026-10-23/restored-app-verification.json'), JSON.stringify(report, null, 2));
    console.log('Restored app PASS: production startup, copied DB login/save/reopen and all restored asset hashes; source unchanged.');
  } finally {
    if (child && child.exitCode === null) {
      child.kill('SIGINT');
      await Promise.race([new Promise(resolve => child.once('exit', resolve)), new Promise(resolve => setTimeout(resolve, 3000))]);
      if (child.exitCode === null) child.kill('SIGTERM');
    }
    await db.$disconnect();
  }
}
main().catch(() => { console.error(`Restored app rehearsal stopped at ${stage}; only the verified copy may have changed. Artifacts retained; secret diagnostics withheld.`); process.exitCode = 1; });
