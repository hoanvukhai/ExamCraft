const { fs, path, workspace, argumentsFor, configuration, verifyContainer, pg, hashFile, withinWorkspace } = require('./database-tools.cjs');
const { snapshot, inventory, copyAssets, protectConfig, recoverConfig, safeWorkspacePath } = require('./backup-package-tools.cjs');
function main() {
  const args = argumentsFor(process.argv.slice(2));
  const parent = safeWorkspacePath(withinWorkspace(path.resolve(workspace, typeof args.out === 'string' ? args.out : 'backups')));
  if (args.execute !== true) { console.log(JSON.stringify({ status: 'DRY_RUN', operation: 'backup-db-public-protected-config', parent, sourceWrites: false, automaticDeletion: false }, null, 2)); return; }
  const config = configuration({});
  if (config.database !== 'examcraft' || config.container !== 'examcraft_postgres' || config.port !== '5436') throw Error('Unexpected backup source');
  verifyContainer(config);
  fs.mkdirSync(parent, { recursive: true });
  const root = path.join(parent, `package-${new Date().toISOString().replace(/\D/g, '')}`);
  fs.mkdirSync(root);
  const before = snapshot(config, config.database), publicRoot = path.join(workspace, 'public'), publicFiles = inventory(publicRoot);
  const env = fs.readFileSync(path.join(workspace, '.env'), 'utf8');
  protectConfig(env, path.join(root, 'config.dpapi'));
  if (recoverConfig(path.join(root, 'config.dpapi')) !== env) throw Error('Protected configuration did not round-trip');
  copyAssets(publicRoot, path.join(root, 'public'), publicFiles);
  const dump = path.join(root, 'database.dump'), output = fs.openSync(dump, 'wx', 0o600);
  try { pg(config, 'pg_dump', ['--format=custom', '--no-owner', '--no-acl', '--dbname', config.database], { stdio: ['ignore', output, 'pipe'] }); }
  finally { fs.closeSync(output); }
  if (!fs.statSync(dump).size) throw Error('Empty backup; incomplete artifacts retained');
  const input = fs.openSync(dump, 'r');
  try { if (!pg(config, 'pg_restore', ['--list'], { stdio: [input, 'pipe', 'pipe'] }).includes('TABLE DATA')) throw Error('Invalid archive'); }
  finally { fs.closeSync(input); }
  if (JSON.stringify(before) !== JSON.stringify(snapshot(config, config.database)) || JSON.stringify(publicFiles) !== JSON.stringify(inventory(publicRoot)) || env !== fs.readFileSync(path.join(workspace, '.env'), 'utf8')) throw Error('Source changed during backup; incomplete package retained without success manifest');
  const manifest = { status: 'BACKUP_PACKAGE_CREATED', createdAt: new Date().toISOString(), sourceDatabase: config.database, sourceTables: before, publicFiles, sourceUnchanged: true, restoreVerified: false, configProtection: 'Windows CurrentUser DPAPI', backup: { directory: path.relative(workspace, root), dumpBytes: fs.statSync(dump).size, dumpSha256: hashFile(dump), dpapiSha256: hashFile(path.join(root, 'config.dpapi')) } };
  fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify(manifest, null, 2), { flag: 'wx', mode: 0o600 });
  console.log(JSON.stringify({ status: manifest.status, directory: path.relative(workspace, root), restoreVerified: false, automaticDeletion: false }, null, 2));
}
try { main(); } catch { console.error('Backup package incomplete; source and partial artifacts retained. Secret diagnostics withheld.'); process.exitCode = 1; }
