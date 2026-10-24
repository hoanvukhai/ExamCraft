const { fs, path, workspace, withinWorkspace, hashFile, sql } = require('./database-tools.cjs');
const { spawnSync } = require('node:child_process');
function safeWorkspacePath(file) {
  const absolute = withinWorkspace(file);
  let cursor = absolute;
  while (cursor !== workspace) {
    if (fs.existsSync(cursor) && fs.lstatSync(cursor).isSymbolicLink()) throw Error('Workspace symlink/junction rejected');
    cursor = path.dirname(cursor);
  }
  return absolute;
}
function relativeFile(value) {
  if (typeof value !== 'string' || !value || value.includes('\\') || path.posix.isAbsolute(value) || value.split('/').some(p => !p || p === '.' || p === '..') || value.includes(':')) throw Error('Invalid package file path');
  return value;
}
function inventory(root) {
  const result = [];
  function walk(dir) {
    if (fs.lstatSync(dir).isSymbolicLink()) throw Error('Package symlinks are not supported');
    for (const name of fs.readdirSync(dir).sort()) {
      const file = path.join(dir, name), stat = fs.lstatSync(file);
      if (stat.isSymbolicLink()) throw Error('Package symlinks are not supported');
      if (stat.isDirectory()) walk(file);
      else if (stat.isFile()) result.push({ path: relativeFile(path.relative(root, file).split(path.sep).join('/')), bytes: stat.size, sha256: hashFile(file) });
      else throw Error('Unsupported package entry');
    }
  }
  walk(root); return result;
}
function copyAssets(from, to, expected) {
  safeWorkspacePath(to);
  if (fs.existsSync(to)) throw Error('Restore asset directory already exists');
  if (JSON.stringify(inventory(from)) !== JSON.stringify(expected)) throw Error('Package assets differ from manifest');
  fs.mkdirSync(to);
  for (const file of expected) {
    const destination = withinWorkspace(path.join(to, relativeFile(file.path)));
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(path.join(from, file.path), destination, fs.constants.COPYFILE_EXCL);
  }
  if (JSON.stringify(inventory(to)) !== JSON.stringify(expected)) throw Error('Restored asset verification failed');
}
function snapshot(config, database) {
  const tables = JSON.parse(sql(config, database, `SELECT coalesce(json_agg(tablename ORDER BY tablename),'[]'::json) FROM pg_tables WHERE schemaname='public';`));
  return Object.fromEntries(tables.map(table => {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(table)) throw Error('Invalid table identifier');
    return [table, JSON.parse(sql(config, database, `SELECT json_build_object('rows',count(*),'digest',md5(coalesce(string_agg(md5(row_to_json(t)::text),'' ORDER BY md5(row_to_json(t)::text)),''))) FROM public."${table}" t;`))];
  }));
}
function restoreTarget(name, source) {
  if (typeof name !== 'string' || !/^examcraft_restore_[a-z0-9_]{1,40}$/.test(name) || name === source) throw Error('A new examcraft_restore_* target different from the source is required');
  return name;
}
function loadPackage(directory) {
  const root = safeWorkspacePath(path.resolve(workspace, directory));
  // Reject junctions/symlinks in every ancestor, including backup root supplied by the caller.
  let cursor = root;
  while (cursor !== workspace) {
    if (fs.lstatSync(cursor).isSymbolicLink()) throw Error('Package symlink/junction rejected');
    cursor = path.dirname(cursor);
  }
  const manifestPath = path.join(root, 'manifest.json');
  for (const file of [manifestPath, path.join(root, 'database.dump'), path.join(root, 'config.dpapi')]) if (!fs.lstatSync(file).isFile() || fs.lstatSync(file).isSymbolicLink()) throw Error('Missing or unsafe package file');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest.sourceDatabase !== 'examcraft' || !Array.isArray(manifest.publicFiles) || !manifest.sourceTables || !Object.keys(manifest.sourceTables).length) throw Error('Unsupported backup manifest');
  if (!['PASS_FOR_LOCAL_DB_FILES_CONFIG_RESTORE', 'BACKUP_PACKAGE_CREATED'].includes(manifest.status)) throw Error('Package was not completed');
  const dump = path.join(root, 'database.dump');
  if (!fs.statSync(dump).size || hashFile(dump) !== manifest.backup?.dumpSha256 || fs.statSync(dump).size !== manifest.backup?.dumpBytes || hashFile(path.join(root, 'config.dpapi')) !== manifest.backup?.dpapiSha256) throw Error('Package checksum or length mismatch');
  manifest.publicFiles.forEach(file => relativeFile(file.path));
  if (JSON.stringify(inventory(path.join(root, 'public'))) !== JSON.stringify(manifest.publicFiles)) throw Error('Package public files mismatch');
  return { root, manifest, dump };
}
function powershell(code, env = process.env) {
  const result = spawnSync('pwsh', ['-NoProfile', '-NonInteractive', '-Command', "$ErrorActionPreference='Stop'; try { " + code + " } catch { exit 1 }"], { env, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
  if (result.error || result.status !== 0) throw Error('Protected configuration operation failed; secret diagnostics withheld');
  return result.stdout;
}
const quote = value => "'" + value.replaceAll("'", "''") + "'";
function protectConfig(text, destination) {
  if (fs.existsSync(destination)) throw Error('Protected configuration destination exists');
  // Pass only to the child environment, never command arguments or logs.
  powershell(`[IO.File]::WriteAllText(${quote(destination)}, (ConvertFrom-SecureString (ConvertTo-SecureString $env:EXAMCRAFT_QA_CONFIG_TEXT -AsPlainText -Force)), [Text.Encoding]::UTF8)`, { ...process.env, EXAMCRAFT_QA_CONFIG_TEXT: text });
}
function recoverConfig(file) {
  return powershell(`$s=ConvertTo-SecureString ([IO.File]::ReadAllText(${quote(file)})); $p=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($s); try { [Console]::Out.Write([Runtime.InteropServices.Marshal]::PtrToStringBSTR($p)) } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($p) }`);
}
module.exports = { relativeFile, inventory, copyAssets, snapshot, restoreTarget, loadPackage, protectConfig, recoverConfig, safeWorkspacePath };
