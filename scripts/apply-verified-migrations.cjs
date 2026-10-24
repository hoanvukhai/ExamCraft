const { spawnSync } = require('node:child_process');
const { fs, path, workspace, configuration, verifyContainer, sql, hashFile, argumentsFor, withinWorkspace } = require('./database-tools.cjs');

function snapshot(config) {
  const tables = JSON.parse(sql(config, config.database, `SELECT coalesce(json_agg(tablename ORDER BY tablename),'[]'::json) FROM pg_tables WHERE schemaname='public' AND tablename <> '_prisma_migrations';`));
  return Object.fromEntries(tables.map(table => {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(table)) throw Error('Unexpected table identifier.');
    return [table, JSON.parse(sql(config, config.database, `SELECT json_build_object('rows',count(*),'digest',md5(coalesce(string_agg(md5(row_to_json(t)::text),'' ORDER BY md5(row_to_json(t)::text)),''))) FROM public."${table}" t;`))];
  }));
}
function command(args) {
  const result = spawnSync(process.execPath, ['node_modules/prisma/build/index.js', ...args], { cwd: workspace, env: { ...process.env, PRISMA_HIDE_UPDATE_MESSAGE: '1' }, encoding: 'utf8', timeout: 120000, maxBuffer: 4 * 1024 * 1024 });
  if (result.error || result.status !== 0) throw Error('Prisma migration/check did not finish successfully. Preserve the database and backup; inspect migration history before retrying.');
}
try {
  const args = argumentsFor(process.argv.slice(2)), config = configuration({});
  if (config.database !== 'examcraft' || config.container !== 'examcraft_postgres' || config.port !== '5436') throw Error('Unexpected application database identity.');
  const verification = JSON.parse(fs.readFileSync(path.join(workspace, 'qa/rebuild-2026-10-22/migration-verification.json'), 'utf8'));
  if (verification.status !== 'PASS' || !verification.sourceUnchanged || !verification.originalRestoredDataUnchanged || !verification.restoredSchemaMatches || !verification.freshSchemaMatches) throw Error('Restored-copy and fresh-install verification must pass first.');
  if (typeof args.backup !== 'string') throw Error('Provide the exact pre-migration backup file.');
  const backup = withinWorkspace(path.resolve(workspace, args.backup)), manifest = JSON.parse(fs.readFileSync(backup + '.manifest.json', 'utf8'));
  if (manifest.sha256 !== hashFile(backup) || manifest.source.database !== config.database || manifest.source.container !== config.container || !manifest.archiveListVerified || Date.now() - Date.parse(manifest.createdAt) > 3600000) throw Error('Backup identity, checksum or freshness check failed.');
  if (args.execute !== true) { console.log(JSON.stringify({ status: 'DRY_RUN', source: config, backup, changes: 'Reconcile migration history and add three collaboration tables; no replacement of application rows.', next: 'Add --execute --confirm examcraft after reviewing verified migrations.' }, null, 2)); process.exit(0); }
  if (args.confirm !== config.database) throw Error('Confirmation must match the exact application database name.');
  verifyContainer(config);
  const folders = fs.readdirSync(path.join(workspace, 'prisma/migrations'), { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => entry.name);
  for (const name of folders) {
    if (!/^[A-Za-z0-9_]+$/.test(name)) throw Error('Invalid migration identity.');
    const checksum = hashFile(path.join(workspace, 'prisma/migrations', name, 'migration.sql'));
    for (const database of ['examcraft_restore_20261022', 'examcraft_migrate_fresh_20261022']) {
      const applied = sql(config, database, `SELECT checksum FROM "_prisma_migrations" WHERE migration_name='${name}' AND finished_at IS NOT NULL AND rolled_back_at IS NULL;`);
      if (applied !== checksum) throw Error(`Migration ${name} differs from the verified copies. Refusing apply.`);
    }
  }
  const before = snapshot(config);
  for (const [table, value] of Object.entries(before)) if (JSON.stringify(value) !== JSON.stringify(verification.originalTables[table])) throw Error(`Source changed since verification: ${table}. Reverify before apply.`);
  command(['migrate', 'deploy']);
  command(['migrate', 'diff', '--from-schema-datasource', 'prisma/schema.prisma', '--to-schema-datamodel', 'prisma/schema.prisma', '--exit-code']);
  const after = snapshot(config);
  for (const [table, value] of Object.entries(before)) if (JSON.stringify(value) !== JSON.stringify(after[table])) throw Error(`Content changed during migration: ${table}. Preserve backup and investigate.`);
  const evidence = { checkedAt: new Date().toISOString(), database: config.database, backup, backupSha256: manifest.sha256, verifiedMigrationChecksums: true, originalTableContentUnchanged: true, schemaMatches: true, before, after, addedTables: Object.keys(after).filter(table => !Object.hasOwn(before, table)), status: 'PASS' };
  fs.writeFileSync(path.join(workspace, 'qa/rebuild-2026-10-22/main-migration.json'), JSON.stringify(evidence, null, 2));
  console.log('Verified application migration PASS: existing table row counts and digests unchanged; schema matches. Evidence: qa/rebuild-2026-10-22/main-migration.json');
} catch (error) { console.error(error instanceof Error ? error.message : 'Verified migration failed.'); process.exitCode = 1; }
