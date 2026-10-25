/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS CLI helper. */
// Usage: node scripts/check-doc-routes.cjs <doc.md> [...]
// Lists every API route or source path a document names that does not exist in the repository.
const fs = require('node:fs');
const path = require('node:path');

function walk(dir) {
  return fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name).replaceAll('\\', '/')]) : [];
}
const routes = walk('src/app/api').filter(file => file.endsWith('/route.ts')).map(file => file.slice('src/app/api'.length, -'/route.ts'.length) || '/');
const normalize = value => value.replace(/\[[^\]]+\]/g, '[]').replace(/:[A-Za-z]+/g, '[]').replace(/\/$/, '');
const known = new Set(routes.map(normalize));
let missing = 0;
for (const file of process.argv.slice(2)) {
  const text = fs.readFileSync(file, 'utf8');
  const apis = new Set([...text.matchAll(/`?(\/api\/[A-Za-z0-9_\-\/\[\]:.]+)`?/g)].map(match => match[1].replace(/[.,;:)]+$/, '').replace(/\/route\.ts$/, '')));
  const paths = new Set([...text.matchAll(/`((?:src|scripts|tests|tests_pilot|prisma|docs|qa)\/[A-Za-z0-9_\-\/\[\].]+\.[A-Za-z0-9]+)`/g)].map(match => match[1]));
  const absent = [];
  for (const api of apis) if (!known.has(normalize(api.slice(4))) && !known.has(normalize(api.slice(4)).replace(/\/\[\]$/, ''))) absent.push(api);
  for (const item of paths) if (!fs.existsSync(item)) absent.push(item);
  console.log(`${file}: ${apis.size} API routes and ${paths.size} paths named, ${absent.length} not found`);
  for (const item of absent.sort()) console.log('  - ' + item);
  missing += absent.length;
}
process.exit(missing ? 1 : 0);
