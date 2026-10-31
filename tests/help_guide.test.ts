import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { HELP, formatHelp, searchHelp, suggestForSelection } from '../src/lib/help-guide';

const sources = (() => {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.tsx?$/.test(entry.name) && !full.endsWith('help-guide.ts'))
        out.push(fs.readFileSync(full, 'utf8'));
    }
  };
  walk(path.join(process.cwd(), 'src'));
  return out.join('\n');
})();

test('every button named in the guide still exists in the source', () => {
  const missing: string[] = [];
  for (const entry of HELP)
    for (const name of entry.names ?? []) if (!sources.includes(name)) missing.push(`${entry.id}: ${name}`);
  assert.deepEqual(missing, []);
});

test('entries are unique and complete', () => {
  assert.equal(new Set(HELP.map((entry) => entry.id)).size, HELP.length);
  for (const entry of HELP) {
    assert.ok(entry.steps.length >= 2 && entry.keywords.length >= 3, entry.id);
    assert.ok(formatHelp(entry).startsWith(entry.title.toUpperCase()));
  }
});

test('plain questions find the right entry, with or without diacritics', () => {
  const cases: [string, string][] = [
    ['Làm sao để thêm câu hỏi mới vào đề?', 'them-cau'],
    ['lam sao xuat file word', 'xuat-word'],
    ['giao bài cho học sinh thế nào', 'giao-bai'],
    ['de co tu dong luu khong', 'luu'],
    ['mời đồng nghiệp cùng soạn đề', 'cung-soan'],
    ['tôi muốn trộn mã đề', 'tron-de'],
    ['thêm khóa AI ở đâu', 'khoa-ai'],
    ['chia trang và ngắt trang', 'trang'],
    ['thùng rác khôi phục đề', 'kho-de'],
  ];
  for (const [question, id] of cases) {
    const found = searchHelp(question);
    assert.equal(found.best?.id, id, question);
    assert.ok(found.confident, question);
  }
});

test('a question outside the guide is not forced onto an entry', () => {
  assert.equal(searchHelp('hôm nay thời tiết thế nào').best, null);
  assert.equal(searchHelp('').confident, false);
});

test('selection suggestions point at real entries', () => {
  const ids = new Set(HELP.map((entry) => entry.id));
  for (const kind of ['exam', 'question', 'part', 'page', 'print', 'unknown'])
    for (const id of suggestForSelection(kind)) assert.ok(ids.has(id), kind + ' → ' + id);
});
