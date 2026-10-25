// Usage: node scripts/yc-coverage.cjs [output.md]
// Derives, for each YC, how many of its CVs are done, open or accepted exceptions, straight from the checklist.
const fs = require('node:fs');
const text = fs.readFileSync('docs/ke-hoach-2026-10-21/03_CHECKLIST.md', 'utf8');
const exceptions = new Set(['CV-017', 'CV-065', 'CV-066']);
const status = new Map();
for (const m of text.matchAll(/^- \[( |x)\] \*\*(CV-\d{3}) —/gm)) status.set(m[2], m[1] === 'x' ? 'done' : exceptions.has(m[2]) ? 'exception' : 'open');
const titles = new Map(fs.readFileSync('docs/ke-hoach-2026-10-21/01_TONG_KET_DU_AN.md', 'utf8').split('\n').map(l => l.match(/^\| (YC-\d{2}) \| ([^|]+)\|/)).filter(Boolean).map(m => [m[1], m[2].trim()]));
const rows = [...text.matchAll(/^\| (YC-\d{2}) \| ([^|]+)\|/gm)].map(m => ({ yc: m[1], cvs: m[2].match(/CV-\d{3}/g) ?? [] }));
const count = { done: 0, open: 0, exception: 0 };
for (const s of status.values()) count[s]++;
const lines = ['# Đối chiếu YC → CV (sinh bằng `node scripts/yc-coverage.cjs`)', '', `Tổng CV: ${status.size}; đạt ${count.done}; ngoại lệ chấp nhận ${count.exception}; còn mở ${count.open}.`, '', '| YC | Nội dung | Đạt | Ngoại lệ | Còn mở |', '|---|---|---|---|---|'];
for (const { yc, cvs } of rows) {
  const by = s => cvs.filter(cv => status.get(cv) === s).map(cv => cv.slice(3)).join(', ') || '—';
  lines.push(`| ${yc} | ${titles.get(yc) ?? ''} | ${cvs.filter(cv => status.get(cv) === 'done').length}/${cvs.length} | ${by('exception')} | ${by('open')} |`);
}
const out = process.argv[2];
if (out) fs.writeFileSync(out, lines.join('\n') + '\n'); else console.log(lines.join('\n'));
