const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const destination = path.join(root, 'backups', `before-rebuild-${stamp}`);
const files = [...new Set(execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { cwd: root }).toString('utf8').split('\0').filter(Boolean))];
fs.mkdirSync(path.join(destination, 'files'), { recursive: true });
const manifest = [];
for (const name of files) {
  if (name.startsWith('backups/') || name.startsWith('tmp/') || (/^\.env(?:\.|$)/.test(name) && name !== '.env.example')) continue;
  const source = path.resolve(root, name);
  if (!source.startsWith(root + path.sep) || !fs.existsSync(source) || !fs.statSync(source).isFile()) continue;
  const data = fs.readFileSync(source);
  const target = path.join(destination, 'files', name);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, data);
  manifest.push({ path: name, bytes: data.length, sha256: crypto.createHash('sha256').update(data).digest('hex') });
}
const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root }).toString().trim();
fs.writeFileSync(path.join(destination, 'working-tree.patch'), execFileSync('git', ['diff', '--binary', 'HEAD'], { cwd: root, maxBuffer: 100 * 1024 * 1024 }));
fs.writeFileSync(path.join(destination, 'status.txt'), execFileSync('git', ['status', '--short'], { cwd: root }));
fs.writeFileSync(path.join(destination, 'manifest.json'), JSON.stringify({ createdAt: new Date().toISOString(), head, scope: 'Source and non-ignored files; excludes secrets, ignored runtime/database/browser data and tmp. Not a database backup.', files: manifest }, null, 2));
for (const file of manifest) {
  const copy = fs.readFileSync(path.join(destination, 'files', file.path));
  if (crypto.createHash('sha256').update(copy).digest('hex') !== file.sha256) throw new Error(`Snapshot verification failed: ${file.path}`);
}
console.log(JSON.stringify({ destination, head, verifiedFiles: manifest.length, bytes: manifest.reduce((total, file) => total + file.bytes, 0), databaseBackup: false }));
