import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const { relativeFile, restoreTarget, loadPackage } = require('../scripts/backup-package-tools.cjs');

test('backup package target and path guards refuse overwrite targets and escaping paths', () => {
  for (const value of ['examcraft', 'examcraft_test_20261022', 'foreign', 'examcraft_restore_bad;DROP', 'examcraft_restore_' + 'x'.repeat(50)]) assert.throws(() => restoreTarget(value, 'examcraft'));
  assert.throws(() => restoreTarget('examcraft_restore_same', 'examcraft_restore_same'));
  assert.equal(restoreTarget('examcraft_restore_fixture', 'examcraft'), 'examcraft_restore_fixture');
  for (const value of ['../secret', '/etc/file', 'F:/secret', 'a/../b', 'a\\b', 'a//b', './a']) assert.throws(() => relativeFile(value));
  assert.equal(relativeFile('images/a.png'), 'images/a.png');
});

test('backup package verification rejects tampered dumps, assets and manifests before connecting to a DB', () => {
  const root = path.resolve('backups/guard-fixtures', randomUUID());
  fs.mkdirSync(path.join(root, 'public'), { recursive: true });
  const digest = (text: string) => createHash('sha256').update(text).digest('hex');
  fs.writeFileSync(path.join(root, 'database.dump'), 'fixture dump');
  fs.writeFileSync(path.join(root, 'config.dpapi'), 'fixture protected text');
  fs.writeFileSync(path.join(root, 'public/a.png'), 'fixture image');
  const manifest = { status: 'BACKUP_PACKAGE_CREATED', sourceDatabase: 'examcraft', sourceTables: { Example: { rows: 0, digest: 'fixture' } }, publicFiles: [{ path: 'a.png', bytes: 13, sha256: digest('fixture image') }], backup: { dumpBytes: 12, dumpSha256: digest('fixture dump'), dpapiSha256: digest('fixture protected text') } };
  const writeManifest = (value: unknown) => fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify(value));
  writeManifest(manifest); assert.equal(loadPackage(root).manifest.sourceDatabase, 'examcraft');
  fs.writeFileSync(path.join(root, 'database.dump'), 'tampered'); assert.throws(() => loadPackage(root), /checksum|length/i);
  fs.writeFileSync(path.join(root, 'database.dump'), 'fixture dump');
  fs.writeFileSync(path.join(root, 'public/a.png'), 'changed image'); assert.throws(() => loadPackage(root), /public files/i);
  fs.writeFileSync(path.join(root, 'public/a.png'), 'fixture image');
  writeManifest({ ...manifest, publicFiles: [{ ...manifest.publicFiles[0], path: '../outside' }] }); assert.throws(() => loadPackage(root), /path/i);
  writeManifest({ ...manifest, status: 'PARTIAL' }); assert.throws(() => loadPackage(root), /not completed/i);
  writeManifest(manifest);
  // Keep disposable fixture under ignored backups; never recursively delete user paths.
});

test('retention cannot delete and the PowerShell restore wrapper propagates invalid-target failure', () => {
  const retention = spawnSync(process.execPath, ['scripts/backup-retention.cjs', '--execute'], { encoding: 'utf8' });
  assert.notEqual(retention.status, 0); assert.match(retention.stderr, /review-only/i);
  if (process.platform === 'win32') {
    const wrapper = spawnSync('pwsh', ['-NoProfile', '-File', 'scripts/restore.ps1', '-Package', 'missing-qa-package', '-TargetDatabase', 'examcraft'], { encoding: 'utf8' });
    assert.notEqual(wrapper.status, 0); assert.ok(!wrapper.stdout.includes('RESTORED_VERIFIED'));
  }
});
