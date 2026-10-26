/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS CLI helper. */
// Usage: node scripts/tally-test-results.cjs [folder]   (default: docs/huong-dan/ban-test-day-du)
// Reads the filled-in test tables and prints, per part, how many lines passed (Đ), failed (K), were skipped (B) or are still blank,
// then lists every failed line with its importance and note, red (🔴) failures first.
const fs = require('node:fs');
const path = require('node:path');

const folder = process.argv[2] ?? 'docs/huong-dan/ban-test-day-du';
const resultColumns = new Set(['Kq', 'AI', 'W', 'In', 'GB', 'CM']);
const normal = value => value.trim().replace(/\*/g, '').toUpperCase();
const cells = line => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(cell => cell.trim());

const totals = { Đ: 0, K: 0, B: 0, blank: 0 };
const failures = [];
for (const file of fs.readdirSync(folder).filter(name => /^\d\d_.*\.md$/.test(name)).sort()) {
  const lines = fs.readFileSync(path.join(folder, file), 'utf8').split(/\r?\n/);
  const part = { Đ: 0, K: 0, B: 0, blank: 0 };
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith('|') || !/^\|\s*-{3,}/.test(lines[i + 1] ?? '')) continue;
    const header = cells(lines[i]);
    const columns = header.map((name, index) => resultColumns.has(name) ? index : -1).filter(index => index >= 0);
    if (!columns.length) continue;
    const mucAt = header.indexOf('Mức'), noteAt = header.indexOf('Ghi chú');
    for (let j = i + 2; j < lines.length && lines[j].startsWith('|'); j++) {
      const row = cells(lines[j]);
      if (!/^T\d\d-\d+/.test(row[0] ?? '')) continue;
      for (const column of columns) {
        const value = normal(row[column] ?? '');
        const key = value === 'Đ' || value === 'D' ? 'Đ' : value === 'K' ? 'K' : value === 'B' ? 'B' : 'blank';
        part[key]++; totals[key]++;
        if (key === 'K') failures.push({ file, id: row[0], level: mucAt >= 0 ? row[mucAt] : '', column: header[column], note: noteAt >= 0 ? row[noteAt] : '', what: row[mucAt >= 0 ? 2 : 1] ?? '' });
      }
    }
  }
  const count = part.Đ + part.K + part.B + part.blank;
  console.log(`${file.padEnd(52)} ${String(count).padStart(4)} ô   Đ ${String(part.Đ).padStart(3)}   K ${String(part.K).padStart(3)}   B ${String(part.B).padStart(3)}   chưa làm ${String(part.blank).padStart(3)}`);
}
console.log(`${'CỘNG'.padEnd(52)} ${String(totals.Đ + totals.K + totals.B + totals.blank).padStart(4)} ô   Đ ${String(totals.Đ).padStart(3)}   K ${String(totals.K).padStart(3)}   B ${String(totals.B).padStart(3)}   chưa làm ${String(totals.blank).padStart(3)}`);
failures.sort((a, b) => Number(b.level.includes('🔴')) - Number(a.level.includes('🔴')));
if (failures.length) {
  console.log('\nCác dòng KHÔNG ĐẠT (🔴 trước):');
  for (const item of failures) console.log(`- ${item.id} ${item.level} [${item.column}] ${item.what.slice(0, 90)}${item.note ? ' | ghi chú: ' + item.note : ''}`);
}
process.exitCode = failures.some(item => item.level.includes('🔴')) ? 2 : 0;
