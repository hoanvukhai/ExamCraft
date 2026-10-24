const { fs, path, workspace, argumentsFor, configuration, verifyContainer, pg, sql, hashFile, withinWorkspace } = require('./database-tools.cjs');

const testDatabase = 'examcraft_test_20261022';
const restoreDatabase = 'examcraft_restore_20261022';
function main() {
  const args = argumentsFor(process.argv.slice(2));
  const config = configuration(args);
  if ([testDatabase, restoreDatabase].includes(config.database)) throw new Error('Source application database must differ from both provision targets.');
  if (typeof args.backup !== 'string') throw new Error('Provide --backup with a previously created custom-format backup.');
  const backup = path.resolve(workspace, args.backup);
  const manifest = JSON.parse(fs.readFileSync(`${backup}.manifest.json`, 'utf8'));
  if (manifest.sha256 !== hashFile(backup) || manifest.source.database !== config.database || manifest.source.container !== config.container) throw new Error('Backup checksum or source identity does not match configuration.');
  const plan = { source: config, backup, creates: [testDatabase, restoreDatabase], modifiesSource: false, dropsExistingDatabase: false };
  if (args.execute !== true) { console.log(JSON.stringify({ ...plan, status: 'DRY_RUN', next: 'Review targets, then add --execute --confirm examcraft_test_20261022,examcraft_restore_20261022' }, null, 2)); return; }
  if (args.confirm !== `${testDatabase},${restoreDatabase}`) throw new Error('Explicit confirmation must match both exact database names.');
  verifyContainer(config);
  const existing = sql(config, config.database, `SELECT datname FROM pg_database WHERE datname IN ('${testDatabase}','${restoreDatabase}');`);
  if (existing) throw new Error('At least one target already exists. Refusing to overwrite, drop, or reuse it.');
  // CREATE DATABASE runs separately from any application transaction and never alters the source.
  sql(config, config.database, `CREATE DATABASE "${testDatabase}" OWNER "${config.user}";`);
  sql(config, config.database, `CREATE DATABASE "${restoreDatabase}" OWNER "${config.user}";`);
  const input = fs.openSync(backup, 'r');
  try { pg(config, 'pg_restore', ['--exit-on-error', '--single-transaction', '--no-owner', '--no-acl', '--dbname', restoreDatabase], { stdio: [input, 'pipe', 'pipe'] }); } finally { fs.closeSync(input); }
  const restoredTables = JSON.parse(sql(config, restoreDatabase, "SELECT coalesce(json_agg(tablename ORDER BY tablename),'[]'::json) FROM pg_tables WHERE schemaname='public';"));
  const rowCounts = {};
  for (const table of restoredTables) {
    const identifier = table.replaceAll('"', '""');
    rowCounts[table] = Number(sql(config, restoreDatabase, `SELECT count(*) FROM public."${identifier}";`));
  }
  const outputDirectory = withinWorkspace(path.join(workspace, 'backups/database'));
  fs.mkdirSync(outputDirectory, { recursive: true });
  const evidence = { ...plan, completedAt: new Date().toISOString(), restoreCommandSucceeded: true, restoredTables, rowCounts, testDatabaseHasSchema: false, note: 'Empty test database is separate from restored copy. No source database was changed. Table counts are evidence of restored contents, not professional or end-to-end certification.' };
  const output = path.join(outputDirectory, `provision-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(output, JSON.stringify(evidence, null, 2), { flag: 'wx', mode: 0o600 });
  console.log(JSON.stringify({ status: 'PROVISION_AND_RESTORE_COMPLETE', testDatabase, restoreDatabase, tables: restoredTables.length, evidence: output }, null, 2));
}
try { main(); } catch (error) { console.error(error instanceof Error ? error.message : 'Provision failed.'); process.exitCode = 1; }
