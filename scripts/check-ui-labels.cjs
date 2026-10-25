/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS CLI helper. */
// Usage: node scripts/check-ui-labels.cjs <guide.md> [...]
// Lists the bold, quoted or backticked phrases of a guide that appear nowhere in src/ - candidates for a wrong button label.
const fs = require('node:fs');
const path = require('node:path');

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(path.join(dir, entry.name)) : /\.(ts|tsx)$/.test(entry.name) ? [path.join(dir, entry.name)] : []);
}
const source = walk('src').map(file => fs.readFileSync(file, 'utf8')).join('\n');
const files = process.argv.slice(2);
if (!files.length) { console.error('Give at least one markdown guide.'); process.exit(2); }
let missing = 0;
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const phrases = new Set();
  for (const match of text.matchAll(/\*\*([^*\n]{4,60})\*\*|"([^"\n]{4,60})"|“([^”\n]{4,60})”|`([^`\n]{4,60})`/g)) {
    const phrase = (match[1] ?? match[2] ?? match[3] ?? match[4]).trim().replace(/[:.]+$/, '').trim();
    if (/\p{L}/u.test(phrase) && !/[\\/]/.test(phrase) && !/\.\w{2,4}$/.test(phrase)) phrases.add(phrase);
  }
  const absent = [...phrases].filter(phrase => !source.includes(phrase)).sort();
  console.log(`${file}: ${phrases.size} phrases, ${absent.length} not found in src/`);
  for (const phrase of absent) console.log('  - ' + phrase);
  missing += absent.length;
}
process.exit(missing ? 1 : 0);
