/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS CLI helper. */
// Usage: node scripts/check-ui-tokens.cjs [--write]
// The interface is moving from colours written into each component (#202124, dark:bg-[#292a2d]) to shared tokens (var(--ui-surface), app-button-*).
// This keeps the move one-way: a file may use fewer hard-coded hex colours than the recorded baseline, never more, and a file that has none may not gain any.
// --write records the current counts (only do this after a real reduction, and review the diff).
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const baselineFile = path.join(__dirname, 'ui-hex-baseline.json');
const hex = /#[0-9a-fA-F]{6}\b/g;
const walk = directory => fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
  const full = path.join(directory, entry.name);
  return entry.isDirectory() ? walk(full) : entry.name.endsWith('.tsx') ? [full] : [];
});
const counts = {};
for (const file of walk(path.join(root, 'src'))) {
  const found = (fs.readFileSync(file, 'utf8').match(hex) ?? []).length;
  if (found) counts[path.relative(root, file).replaceAll('\\', '/')] = found;
}
const total = Object.values(counts).reduce((sum, n) => sum + n, 0);

if (process.argv.includes('--write')) {
  fs.writeFileSync(baselineFile, JSON.stringify(Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b))), null, 2) + '\n');
  console.log(`baseline written: ${total} hex colours in ${Object.keys(counts).length} files`);
  process.exit(0);
}
const baseline = fs.existsSync(baselineFile) ? JSON.parse(fs.readFileSync(baselineFile, 'utf8')) : {};
const worse = Object.entries(counts).filter(([file, n]) => n > (baseline[file] ?? 0));
const baselineTotal = Object.values(baseline).reduce((sum, n) => sum + n, 0);
console.log(`hard-coded hex colours: ${total} (baseline ${baselineTotal}) in ${Object.keys(counts).length} files`);
if (worse.length) {
  for (const [file, n] of worse) console.log(`  MORE than baseline: ${file}: ${n} > ${baseline[file] ?? 0}`);
  console.log('Use the shared tokens (var(--ui-surface), var(--ui-border), var(--ui-text-secondary), app-button-primary/secondary/tonal) instead of a new hex colour.');
  process.exit(1);
}
if (total < baselineTotal) console.log(`  ${baselineTotal - total} fewer than the baseline: run with --write to lock the gain in.`);
