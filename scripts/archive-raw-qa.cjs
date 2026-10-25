/* eslint-disable @typescript-eslint/no-require-imports -- local CommonJS maintenance command */
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const directory = 'qa/rebuild-2026-10-25';
const archive = directory + '/chay-tho';
const manifestFile = directory + '/RAW_RUN_ARCHIVE.json';
const tracked = execFileSync('git', ['ls-files','-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
const raw = name => /(?:^|\/)(?:.*-claude-run.*\.log|server-.*\.log|pilot-run-.*\.json|pilot-f.*-run.*\.log|build-.*\.log)$/i.test(name);
const candidates = tracked.filter(file => path.posix.dirname(file) === directory && raw(file));
const candidateSet = new Set(candidates);
const changed = new Set(execFileSync('git',['diff','--name-only','HEAD'],{cwd:root,encoding:'utf8'}).trim().split('\n'));
const referenceFiles = new Set(tracked.filter(file => /\.(md|json)$/.test(file) && !candidateSet.has(file) && file !== manifestFile && !file.startsWith(archive + '/')));
function addReports(relative) {
  const absolute = path.join(root, relative);
  if (!fs.existsSync(absolute)) return;
  for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
    const file = relative + '/' + entry.name;
    if (entry.isDirectory()) { if (!['chay-tho','node_modules','.git','backups','tmp'].includes(entry.name)) addReports(file); }
    else if (entry.isFile() && /\.(md|json)$/.test(file) && !candidateSet.has(file) && file !== manifestFile) referenceFiles.add(file);
  }
}
addReports('docs'); addReports('qa');
const references = [...referenceFiles].filter(file => fs.existsSync(path.join(root,file))).map(file => ({ file, text: fs.readFileSync(path.join(root,file),'utf8') }));
const plan = { checkedAt: new Date().toISOString(), execute: process.argv.includes('--execute'), moved: [], kept: [], untouchedUntracked: [] };
const hash = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
for (const file of candidates) {
  const sources = references.filter(source => source.text.includes(path.posix.basename(file))).map(source => source.file);
  if (sources.length || changed.has(file)) { plan.kept.push({ file, reason: changed.has(file) ? 'working-tree changes' : 'referenced report/manifest', sources }); continue; }
  const source = path.resolve(root,file), destination = path.resolve(root,archive,path.posix.basename(file));
  assert.ok(!path.relative(path.resolve(root,directory),source).startsWith('..'));
  assert.ok(!path.relative(path.resolve(root,archive),destination).startsWith('..'));
  assert.equal(fs.lstatSync(source).isSymbolicLink(), false);
  assert.equal(fs.existsSync(destination), false, 'Never overwrite an archived file');
  const checksum = hash(source);
  if (plan.execute) {
    if (fs.existsSync(path.join(root,archive))) assert.equal(fs.lstatSync(path.join(root,archive)).isSymbolicLink(), false);
    fs.mkdirSync(path.join(root,archive),{recursive:true});
    execFileSync('git',['mv','--',file,archive + '/' + path.posix.basename(file)],{cwd:root});
    assert.equal(hash(destination),checksum,'Moving must preserve bytes');
  }
  plan.moved.push({ from:file,to:archive + '/' + path.posix.basename(file),sha256:checksum,applied:plan.execute });
}
const trackedSet = new Set(tracked);
for (const file of fs.readdirSync(path.join(root,directory))) {
  const relative = directory + '/' + file;
  if (raw(relative) && !trackedSet.has(relative)) plan.untouchedUntracked.push(relative);
}
plan.markdownLinksChanged = 0; // Every reported/mentioned basename is kept in place.
fs.writeFileSync(path.join(root,manifestFile),JSON.stringify(plan,null,2));
console.log(JSON.stringify({execute:plan.execute,eligible:plan.moved.length,kept:plan.kept.length,untouchedUntracked:plan.untouchedUntracked.length,manifest:manifestFile}));
