const { spawnSync } = require('node:child_process');
const { fs, path, workspace, configuration, verifyContainer, sql } = require('./database-tools.cjs');

const restored = 'examcraft_restore_20261022', fresh = 'examcraft_migrate_fresh_20261022';
const config = configuration({});
const sourceUrl = new URL(process.env.DATABASE_URL);
const output = path.join(workspace, 'qa/rebuild-2026-10-22/migration-verification.json');
function snapshot(database) {
  const tables = JSON.parse(sql(config, database, `SELECT coalesce(json_agg(tablename ORDER BY tablename),'[]'::json) FROM pg_tables WHERE schemaname='public' AND tablename <> '_prisma_migrations';`));
  const result = {};
  for (const table of tables) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(table)) throw Error('Unsupported table name.');
    result[table] = JSON.parse(sql(config, database, `SELECT json_build_object('rows',count(*),'digest',md5(coalesce(string_agg(md5(row_to_json(t)::text),'' ORDER BY md5(row_to_json(t)::text)),''))) FROM public."${table}" t;`));
  }
  return result;
}
function prisma(database, args) {
  if (![restored, fresh].includes(database)) throw Error('Refusing migration outside fixed verification copies.');
  const target = new URL(sourceUrl); target.pathname = '/' + database;
  const result = spawnSync(process.execPath, ['node_modules/prisma/build/index.js', ...args], { cwd: workspace, env: { ...process.env, DATABASE_URL: target.href, PRISMA_HIDE_UPDATE_MESSAGE: '1' }, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024, timeout: 120000 });
  if (result.error || result.status !== 0) {
    let diagnostic = String(result.stdout ?? '') + String(result.stderr ?? '');
    for (const secret of [sourceUrl.href, target.href, sourceUrl.password, decodeURIComponent(sourceUrl.password)]) if (secret) diagnostic = diagnostic.split(secret).join('[redacted]');
    throw Error(`Verification command failed on ${database}: ${diagnostic.slice(-8000)}`);
  }
  return String(result.stdout ?? '');
}
function equalOriginal(before, after) {
  for (const [table, value] of Object.entries(before)) if (JSON.stringify(value) !== JSON.stringify(after[table])) throw Error(`Original table content changed: ${table}`);
}
try {
  if (config.database !== 'examcraft' || config.container !== 'examcraft_postgres') throw Error('Unexpected source identity.');
  verifyContainer(config);
  const sourceBefore = snapshot(config.database), before = snapshot(restored);
  const exists = sql(config, config.database, `SELECT datname FROM pg_database WHERE datname='${fresh}';`);
  if (exists) {
    if (!process.argv.includes('--resume-empty-verification-db')) throw Error('Fresh verification target already exists. Refusing to overwrite it.');
    if (Object.values(snapshot(fresh)).some(table => table.rows !== 0)) throw Error('Verification target contains application data. Refusing resume.');
    console.log('Resuming the fixed verification DB after confirming every application table is empty. No data will be overwritten.');
  }
  console.log('Verified source and restored copy; migration targets are restored copy and a new empty verification DB only.');
  prisma(restored, ['migrate', 'deploy']);
  const after = snapshot(restored); equalOriginal(before, after);
  prisma(restored, ['migrate', 'diff', '--from-schema-datasource', 'prisma/schema.prisma', '--to-schema-datamodel', 'prisma/schema.prisma', '--exit-code']);
  prisma(restored, ['migrate', 'deploy']); equalOriginal(after, snapshot(restored));
  console.log('Restored-copy migration passed: original table digests preserved; rerun is idempotent; schema matches.');
  if (!exists) sql(config, config.database, `CREATE DATABASE "${fresh}" OWNER "${config.user}";`);
  prisma(fresh, ['migrate', 'deploy']);
  prisma(fresh, ['migrate', 'diff', '--from-schema-datasource', 'prisma/schema.prisma', '--to-schema-datamodel', 'prisma/schema.prisma', '--exit-code']);
  const freshTables = Object.keys(snapshot(fresh));
  equalOriginal(sourceBefore, snapshot(config.database));
  fs.writeFileSync(output, JSON.stringify({ checkedAt: new Date().toISOString(), sourceDatabase: config.database, restoredDatabase: restored, freshDatabase: fresh, sourceUnchanged: true, originalRestoredDataUnchanged: true, restoredRerunIdempotent: true, restoredSchemaMatches: true, freshSchemaMatches: true, originalTables: before, restoredTables: Object.keys(after), freshTables, status: 'PASS' }, null, 2));
  console.log('Migration verification PASS. Main application database was not migrated; evidence: qa/rebuild-2026-10-22/migration-verification.json');
} catch (error) { console.error(error instanceof Error ? error.message : 'Verification failed.'); process.exitCode = 1; }
