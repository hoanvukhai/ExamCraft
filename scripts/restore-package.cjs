const { fs, path, workspace, argumentsFor, configuration, verifyContainer, pg, sql, withinWorkspace } = require('./database-tools.cjs');
const { loadPackage, restoreTarget, copyAssets, snapshot } = require('./backup-package-tools.cjs');
function main() {
  const args = argumentsFor(process.argv.slice(2));
  if (typeof args.package !== 'string') throw Error('Provide --package with a complete backup directory; no automatic latest selection');
  const bundle = loadPackage(args.package), target = restoreTarget(args.target, bundle.manifest.sourceDatabase);
  const plan = { operation: 'restore-to-new-database-and-files', target, sourceDatabase: bundle.manifest.sourceDatabase, package: path.relative(workspace, bundle.root), sourceWrites: false, dropsOrOverwrites: false };
  if (args.execute !== true) { console.log(JSON.stringify({ ...plan, status: 'DRY_RUN', next: `Add --execute --confirm ${target} after reviewing the exact target.` }, null, 2)); return; }
  if (args.confirm !== target) throw Error('Confirmation must exactly match the restore target');
  const config = configuration({});
  if (config.database !== bundle.manifest.sourceDatabase || config.container !== 'examcraft_postgres' || config.port !== '5436') throw Error('Source identity does not match expected local ExamCraft service');
  verifyContainer(config);
  if (sql(config, config.database, `SELECT datname FROM pg_database WHERE datname='${target}';`)) throw Error('Target database exists; refusing drop, overwrite or reuse');
  const run = withinWorkspace(path.join(workspace, 'backups', `restore-run-${target}-${Date.now()}`));
  fs.mkdirSync(run);
  copyAssets(path.join(bundle.root, 'public'), path.join(run, 'public'), bundle.manifest.publicFiles);
  fs.copyFileSync(path.join(bundle.root, 'config.dpapi'), path.join(run, 'config.dpapi'), fs.constants.COPYFILE_EXCL);
  const before = snapshot(config, config.database);
  sql(config, config.database, `CREATE DATABASE "${target}" OWNER "${config.user}";`);
  const input = fs.openSync(bundle.dump, 'r');
  try { pg(config, 'pg_restore', ['--exit-on-error', '--single-transaction', '--no-owner', '--no-acl', '--dbname', target], { stdio: [input, 'pipe', 'pipe'] }); }
  finally { fs.closeSync(input); }
  if (JSON.stringify(snapshot(config, target)) !== JSON.stringify(bundle.manifest.sourceTables)) throw Error('Restored DB does not match package manifest');
  if (JSON.stringify(snapshot(config, config.database)) !== JSON.stringify(before)) throw Error('Source changed during restore; review consistency');
  const report = { ...plan, status: 'RESTORED_VERIFIED', restoredAt: new Date().toISOString(), restoredDatabase: target, tablesMatch: true, publicFilesMatch: true, sourceUnchanged: true, runDirectory: path.relative(workspace, run), configProtected: true, appStarted: false, packageDigest: bundle.manifest.backup.dumpSha256 };
  fs.writeFileSync(path.join(run, 'restore-result.json'), JSON.stringify(report, null, 2), { flag: 'wx' });
  const proofDirectory = path.join(bundle.root, 'restore-verifications');
  fs.mkdirSync(proofDirectory, { recursive: true });
  fs.writeFileSync(path.join(proofDirectory, `${target}.json`), JSON.stringify(report, null, 2), { flag: 'wx' });
  console.log(JSON.stringify(report, null, 2));
}
try { main(); } catch (error) { console.error(error instanceof Error ? error.message : 'Restore failed; partial artifacts retained'); process.exitCode = 1; }
