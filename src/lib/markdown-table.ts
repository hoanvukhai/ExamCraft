/** Question text may carry a pipe table written as Markdown; the page, the print view and Word all build a real table from the same reading of it. */
export type Align = 'left' | 'center' | 'right';
export type ContentBlock =
  | { kind: 'text'; text: string }
  | { kind: 'table'; header: string[]; rows: string[][]; align: Align[] };

const MAX_COLUMNS = 12, MAX_ROWS = 200;

/** Splits one table line at pipes, leaving alone pipes inside $...$ (for example |x|) and escaped pipes. */
export function splitTableRow(line: string): string[] {
  const cells: string[] = [];
  let current = '', inMath = false;
  const text = line.trim();
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '\\' && text[i + 1] === '|') { current += '|'; i++; continue; }
    if (ch === '\\' && text[i + 1] === '$') { current += '\\$'; i++; continue; }
    if (ch === '$') inMath = !inMath;
    if (ch === '|' && !inMath) { cells.push(current.trim()); current = ''; continue; }
    current += ch;
  }
  cells.push(current.trim());
  if (text.startsWith('|')) cells.shift();
  if (text.endsWith('|') && !text.endsWith('\\|')) cells.pop();
  return cells;
}

const separatorCell = /^:?-{3,}:?$/;
const looksLikeRow = (line: string) => line.trim().startsWith('|') && line.trim().length > 1;

function readSeparator(line: string): Align[] | null {
  if (!looksLikeRow(line)) return null;
  const cells = splitTableRow(line);
  if (cells.length < 1 || !cells.every(cell => separatorCell.test(cell))) return null;
  return cells.map(cell => cell.startsWith(':') && cell.endsWith(':') ? 'center' : cell.endsWith(':') ? 'right' : 'left');
}

/** Cuts text into plain parts and tables. Text with no table comes back as one text block, unchanged. */
export function splitContentBlocks(content: string): ContentBlock[] {
  if (!content || !content.includes('|')) return [{ kind: 'text', text: content ?? '' }];
  const lines = content.split(/\r?\n/);
  const blocks: ContentBlock[] = [];
  let pending: string[] = [];
  const flush = () => { if (pending.length) { blocks.push({ kind: 'text', text: pending.join('\n') }); pending = []; } };
  for (let i = 0; i < lines.length; i++) {
    const align = looksLikeRow(lines[i]) && i + 1 < lines.length ? readSeparator(lines[i + 1]) : null;
    const header = align ? splitTableRow(lines[i]) : null;
    if (!align || !header || header.length !== align.length || header.length > MAX_COLUMNS) { pending.push(lines[i]); continue; }
    const rows: string[][] = [];
    let j = i + 2;
    while (j < lines.length && looksLikeRow(lines[j]) && rows.length < MAX_ROWS) {
      const cells = splitTableRow(lines[j]);
      rows.push(Array.from({ length: header.length }, (_, k) => cells[k] ?? ''));
      j++;
    }
    // A blank line before the table belongs to the spacing, not to the text block.
    if (pending.length && pending[pending.length - 1].trim() === '') pending.pop();
    flush();
    blocks.push({ kind: 'table', header, rows, align });
    i = j - 1;
    if (j < lines.length && lines[j].trim() === '') i = j;
  }
  flush();
  return blocks.length ? blocks : [{ kind: 'text', text: content }];
}

export const hasTable = (content: string) => splitContentBlocks(content).some(block => block.kind === 'table');
