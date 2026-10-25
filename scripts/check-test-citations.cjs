/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS CLI helper. */
// Usage: node scripts/check-test-citations.cjs <report.md> [...]
// Reads every "quoted" or `backticked` phrase of 20+ characters in the reports and tells which ones do not appear
// verbatim in tests/ or tests_pilot/. A report that cites a test must cite its real title.
const fs = require('node:fs');
const path = require('node:path');

const roots = ['tests', 'tests_pilot'];
const corpus = roots.flatMap(root => fs.existsSync(root) ? fs.readdirSync(root).filter(name => /\.(ts|cjs|mjs)$/.test(name)).map(name => fs.readFileSync(path.join(root, name), 'utf8')) : []).join('\n');
const files = process.argv.slice(2);
if (!files.length) { console.error('Give at least one markdown report.'); process.exit(2); }
let missing = 0, found = 0;
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const phrases = new Set([...text.matchAll(/`([^`\n]{20,200})`|"([^"\n]{20,200})"|'([^'\n]{20,200})'/g)].map(match => (match[1] ?? match[2] ?? match[3]).trim()));
  for (const phrase of phrases) {
    if (/[\\/]|\.(ts|md|json|cjs|tsx)\b/.test(phrase)) continue; // paths are checked by people, not here
    if (corpus.includes(phrase)) found += 1;
    else { missing += 1; console.log(`${file}: not found in tests: ${phrase}`); }
  }
}
console.log(`${found} cited phrases found, ${missing} not found.`);
process.exit(missing ? 1 : 0);
