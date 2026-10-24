// Read-only source backup; always creates a NEW restore DB and NEW file directories. Never drops/reuses a target.
const { fs, path, workspace, configuration, verifyContainer, pg, sql, hashFile, withinWorkspace } = require('./database-tools.cjs');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { parseEnv } = require('node:util');
const reportPath = path.join(workspace, 'qa/rebuild-2026-10-23/full-restore-verification.json');
let stage = 'configuration';
function digest(bytes) { return crypto.createHash('sha256').update(bytes).digest('hex'); }
function snapshot(config, database) {
  const tables = JSON.parse(sql(config, database, `SELECT coalesce(json_agg(tablename ORDER BY tablename),'[]'::json) FROM pg_tables WHERE schemaname='public';`));
  return Object.fromEntries(tables.map(table => {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(table)) throw Error('Unsupported table identifier');
    return [table, JSON.parse(sql(config, database, `SELECT json_build_object('rows',count(*),'digest',md5(coalesce(string_agg(md5(row_to_json(t)::text),'' ORDER BY md5(row_to_json(t)::text)),''))) FROM public."${table}" t;`))];
  }));
}
function files(root) {
  const entries = [];
  function walk(dir) {
    for (const name of fs.readdirSync(dir).sort()) {
      const entry = path.join(dir, name), stat = fs.lstatSync(entry);
      if (stat.isSymbolicLink()) throw Error('Refusing symlink in asset tree');
      if (stat.isDirectory()) walk(entry);
      else if (stat.isFile()) entries.push({ path: path.relative(root, entry).split(path.sep).join('/'), bytes: stat.size, sha256: hashFile(entry) });
      else throw Error('Unsupported asset entry');
    }
  }
  walk(root); return entries;
}
function copyFiles(source, target, manifest) {
  fs.mkdirSync(target, { recursive: false });
  for (const entry of manifest) {
    const destination = withinWorkspace(path.join(target, entry.path));
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(path.join(source, entry.path), destination, fs.constants.COPYFILE_EXCL);
  }
  if (JSON.stringify(files(target)) !== JSON.stringify(manifest)) throw Error('Restored asset hashes differ');
}
function powershell(code) {
  const result = spawnSync('pwsh', ['-NoProfile', '-NonInteractive', '-Command', "$ErrorActionPreference='Stop'; try { " + code + " } catch { [Console]::Error.Write($_.Exception.GetType().Name); exit 1 }"], { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
  if (result.error || result.status !== 0) {
    const category = result.error?.code ?? (/^[A-Za-z]+Exception$/.test(result.stderr.trim()) ? result.stderr.trim() : 'REDACTED');
    console.error(`Protected configuration operation category: ${category}`);
    throw Error('Protected configuration backup/restore failed; diagnostics withheld to protect secrets');
  }
  return result.stdout;
}
const quote = value => "'" + value.replaceAll("'", "''") + "'";
function decrypt(row, secret) {
  const decipher = crypto.createDecipheriv('aes-256-gcm', crypto.createHash('sha256').update(secret).digest(), Buffer.from(row.keyIv, 'hex'));
  decipher.setAuthTag(Buffer.from(row.keyTag, 'hex'));
  return Buffer.concat([decipher.update(Buffer.from(row.keyEncrypted, 'hex')), decipher.final()]);
}
function assetReferences(config) {
  const values = [
    ...JSON.parse(sql(config, config.database, `SELECT coalesce(json_agg(metadata),'[]'::json) FROM "Exam";`)),
    ...JSON.parse(sql(config, config.database, `SELECT coalesce(json_agg(payload),'[]'::json) FROM "Question";`)),
    ...JSON.parse(sql(config, config.database, `SELECT coalesce(json_agg(figures),'[]'::json) FROM "Passage";`)),
  ];
  const local = new Set(); let remote = 0, inline = 0, transient = 0;
  const visit = value => {
    if (!value || typeof value !== 'object') return;
    if (['image', 'geometry'].includes(value.kind)) {
      const url = typeof value.data === 'string' ? value.data : value.data?.url ?? value.renderedBase64;
      if (typeof url === 'string') {
        if (url.startsWith('/') && !url.startsWith('//')) local.add(url.split(/[?#]/)[0]);
        else if (/^data:/i.test(url)) inline++;
        else if (/^https?:/i.test(url)) remote++;
        else transient++;
      }
    }
    for (const child of Object.values(value)) if (child && typeof child === 'object') visit(child);
  };
  values.forEach(visit); return { local: [...local].sort(), remote, inline, transient };
}
function main() {
  if (!process.argv.includes('--execute')) { console.log('DRY_RUN: use --execute to back up source examcraft and restore into a new examcraft_restore_full_* DB, with fresh public/config copies. No source writes or deletion.'); return; }
  const config = configuration({});
  if (config.database !== 'examcraft' || config.container !== 'examcraft_postgres' || config.port !== '5436') throw Error('Unexpected source identity');
  verifyContainer(config);
  const stamp = new Date().toISOString().replace(/\D/g, '');
  const target = `examcraft_restore_full_${stamp}`;
  if (!/^examcraft_restore_full_\d+$/.test(target) || target === config.database) throw Error('Unsafe restore target');
  if (sql(config, config.database, `SELECT datname FROM pg_database WHERE datname='${target}';`)) throw Error('Restore target exists; refusing reuse');
  const root = withinWorkspace(path.join(workspace, 'backups', `full-restore-${stamp}`));
  if (fs.existsSync(root)) throw Error('Backup directory exists; refusing reuse');
  fs.mkdirSync(root);
  const publicRoot = withinWorkspace(path.join(workspace, 'public'));
  stage = 'source table snapshot';
  const before = snapshot(config, config.database);
  stage = 'source files';
  const originalFiles = files(publicRoot);
  const envPath = withinWorkspace(path.join(workspace, '.env'));
  const originalEnvHash = hashFile(envPath);
  const envEncrypted = path.join(root, 'config.dpapi');
  stage = 'protect configuration';
  powershell(`[IO.File]::WriteAllText(${quote(envEncrypted)}, (ConvertFrom-SecureString (ConvertTo-SecureString ([IO.File]::ReadAllText(${quote(envPath)})) -AsPlainText -Force)), [Text.Encoding]::UTF8)`);
  const restored = path.join(root, 'restored'); fs.mkdirSync(restored);
  fs.copyFileSync(envEncrypted, path.join(restored, 'config.dpapi'), fs.constants.COPYFILE_EXCL);
  stage = 'recover configuration';
  const recoveredText = powershell(`$s=ConvertTo-SecureString ([IO.File]::ReadAllText(${quote(path.join(restored, 'config.dpapi'))})); $p=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($s); try { [Console]::Out.Write([Runtime.InteropServices.Marshal]::PtrToStringBSTR($p)) } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($p) }`);
  if (digest(Buffer.from(recoveredText, 'utf8')) !== originalEnvHash) throw Error('Recovered configuration differs');
  const recovered = parseEnv(recoveredText), original = parseEnv(fs.readFileSync(envPath, 'utf8'));
  if (!original.SESSION_SECRET || !recovered.SESSION_SECRET) throw Error('Encryption configuration missing');
  stage = 'copy assets';
  copyFiles(publicRoot, path.join(root, 'public'), originalFiles);
  copyFiles(path.join(root, 'public'), path.join(restored, 'public'), originalFiles);
  stage = 'database dump';
  const dump = path.join(root, 'database.dump'), output = fs.openSync(dump, 'wx', 0o600);
  try { pg(config, 'pg_dump', ['--format=custom', '--no-owner', '--no-acl', '--dbname', config.database], { stdio: ['ignore', output, 'pipe'] }); }
  finally { fs.closeSync(output); }
  if (!fs.statSync(dump).size) throw Error('Database backup empty');
  const listingInput = fs.openSync(dump, 'r');
  try { if (!pg(config, 'pg_restore', ['--list'], { stdio: [listingInput, 'pipe', 'pipe'] }).includes('TABLE DATA')) throw Error('Archive missing table data'); }
  finally { fs.closeSync(listingInput); }
  stage = 'create fresh restore DB';
  sql(config, config.database, `CREATE DATABASE "${target}" OWNER "${config.user}";`);
  const input = fs.openSync(dump, 'r');
  try { pg(config, 'pg_restore', ['--exit-on-error', '--single-transaction', '--no-owner', '--no-acl', '--dbname', target], { stdio: [input, 'pipe', 'pipe'] }); }
  finally { fs.closeSync(input); }
  stage = 'compare restored tables';
  const restoredTables = snapshot(config, target);
  if (JSON.stringify(before) !== JSON.stringify(restoredTables)) throw Error('Database rows or digests differ after restore');
  stage = 'verify encrypted keys';
  const keys = JSON.parse(sql(config, target, `SELECT coalesce(json_agg(json_build_object('keyEncrypted',"keyEncrypted",'keyIv',"keyIv",'keyTag',"keyTag")),'[]'::json) FROM "UserApiKey";`));
  let verifiedKeys = 0, invalidKeys = 0;
  for (const row of keys) {
    try {
      const a = decrypt(row, original.SESSION_SECRET), b = decrypt(row, recovered.SESSION_SECRET);
      if (!a.length || !a.equals(b)) throw Error('Key differs');
      a.fill(0); b.fill(0); verifiedKeys++;
    } catch { invalidKeys++; }
  }
  const iv = crypto.randomBytes(12), cipher = crypto.createCipheriv('aes-256-gcm', crypto.createHash('sha256').update(original.SESSION_SECRET).digest(), iv);
  const text = Buffer.from('EXAMCRAFT_RESTORE_CANARY_NOT_A_PROVIDER_KEY');
  const canary = { keyEncrypted: Buffer.concat([cipher.update(text), cipher.final()]).toString('hex'), keyIv: iv.toString('hex'), keyTag: cipher.getAuthTag().toString('hex') };
  fs.writeFileSync(path.join(root, 'encryption-canary.json'), JSON.stringify(canary), { flag: 'wx', mode: 0o600 });
  if (!decrypt(JSON.parse(fs.readFileSync(path.join(root, 'encryption-canary.json'), 'utf8')), recovered.SESSION_SECRET).equals(text)) throw Error('Encryption canary failed');
  stage = 'inventory referenced assets';
  const refs = assetReferences(config);
  const missing = refs.local.filter(url => {
    const relative = decodeURIComponent(url.slice(1));
    const asset = path.resolve(restored, 'public', relative), relativeTarget = path.relative(path.join(restored, 'public'), asset);
    return relativeTarget.startsWith('..') || path.isAbsolute(relativeTarget) || !fs.existsSync(asset) || !fs.statSync(asset).isFile();
  });
  stage = 'verify source unchanged';
  if (JSON.stringify(before) !== JSON.stringify(snapshot(config, config.database)) || JSON.stringify(originalFiles) !== JSON.stringify(files(publicRoot)) || originalEnvHash !== hashFile(envPath)) throw Error('Source changed during verification; cannot certify consistent copy');
  const report = { checkedAt: new Date().toISOString(), status: invalidKeys || missing.length || refs.transient ? 'PARTIAL_REQUIRES_SOURCE_REPAIR' : 'PASS_FOR_LOCAL_DB_FILES_CONFIG_RESTORE', sourceDatabase: config.database, restoredDatabase: target, sourceUnchanged: true, noDatabaseDroppedOrReused: true, sourceTables: before, restoredTableDigestsMatch: true, publicFiles: originalFiles, restoredPublicHashesMatch: true, protectedConfigRecoveredExactly: true, configurationProtection: 'Windows CurrentUser DPAPI; recovery requires same Windows identity/machine. DATABASE_URL must be overridden before booting a restored app.', actualEncryptedKeysVerified: verifiedKeys, actualEncryptedKeysUnverifiable: invalidKeys, encryptionCanaryPassed: true, assets: { localReferenceCount: refs.local.length, missingLocalReferences: missing, remoteReferencesNotDownloaded: refs.remote, inlineReferencesInDatabase: refs.inline, transientReferences: refs.transient }, backup: { directory: path.relative(workspace, root), dumpBytes: fs.statSync(dump).size, dumpSha256: hashFile(dump), dpapiSha256: hashFile(envEncrypted) }, nativeDumpAndRestoreExitCodesPassed: true, deletions: 0, limitations: ['No production cutover or RPO/RTO acceptance', 'Remote image services not included', 'No source mutation or provider requests', 'Restored application not started; do not boot with recovered original DATABASE_URL'] };
  fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify(report, null, 2), { flag: 'wx', mode: 0o600 });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`Full restore verification: ${report.status}; ${Object.keys(before).length} tables, ${originalFiles.length} files, ${verifiedKeys} encrypted keys verified. Sources retained.`);
}
try { main(); } catch { console.error(`Full restore verification did not complete at: ${stage}. Partial artifacts retained; no source deletion. Secret-bearing diagnostics withheld.`); process.exitCode = 1; }
