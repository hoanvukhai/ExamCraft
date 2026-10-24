const { fs, path, workspace, argumentsFor, configuration, verifyContainer, pg, hashFile, withinWorkspace } = require('./database-tools.cjs');

function main() {
  const args = argumentsFor(process.argv.slice(2));
  const config = configuration(args);
  const directory = withinWorkspace(path.resolve(workspace, typeof args.out === 'string' ? args.out : 'backups/database'));
  const plan = { operation: 'backup-only', source: config, directory, writesToSource: false };
  if (args.execute !== true) { console.log(JSON.stringify({ ...plan, status: 'DRY_RUN', next: 'Review target, then add --execute.' }, null, 2)); return; }
  verifyContainer(config);
  fs.mkdirSync(directory, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const output = path.join(directory, `${config.database}-${stamp}.dump`);
  const partial = `${output}.partial`;
  const fd = fs.openSync(partial, 'wx', 0o600);
  try {
    pg(config, 'pg_dump', ['--format=custom', '--no-owner', '--no-acl', '--dbname', config.database], { stdio: ['ignore', fd, 'pipe'] });
  } finally { fs.closeSync(fd); }
  if (!fs.statSync(partial).size) throw new Error('Backup is empty; partial artifact retained.');
  const input = fs.openSync(partial, 'r');
  let contents;
  try { contents = pg(config, 'pg_restore', ['--list'], { stdio: [input, 'pipe', 'pipe'] }); } finally { fs.closeSync(input); }
  if (!contents.includes('TABLE')) throw new Error('Backup archive has no table entries; partial artifact retained.');
  fs.renameSync(partial, output);
  const manifest = { ...plan, createdAt: new Date().toISOString(), file: output, bytes: fs.statSync(output).size, sha256: hashFile(output), archiveListVerified: true, restoreVerified: false, note: 'Includes database data only. Keep application files and decryption secrets separately. Restore verification is a separate step.' };
  fs.writeFileSync(`${output}.manifest.json`, JSON.stringify(manifest, null, 2), { flag: 'wx', mode: 0o600 });
  console.log(JSON.stringify({ status: 'BACKUP_CREATED', file: output, sha256: manifest.sha256, restoreVerified: false }, null, 2));
}
try { main(); } catch (error) { console.error(error instanceof Error ? error.message : 'Backup failed.'); process.exitCode = 1; }
