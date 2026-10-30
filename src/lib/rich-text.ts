/** The only inline formatting inside question text: <b> <i> <u> <sup> <sub>, no attributes. Anything else stays literal. */
export const FORMAT_TAGS = ['b', 'i', 'u', 'sup', 'sub'] as const;
export type FormatTag = (typeof FORMAT_TAGS)[number];
export type FormatFlags = Partial<Record<FormatTag, true>>;
export type FormatRun = { text: string; flags: FormatFlags };

const TOKEN = /<(\/?)(b|i|u|sup|sub)>/g;

/**
 * Split plain text (no math) into runs. Only tags that have a matching, properly nested partner are applied;
 * a stray "<b>" or "x < 5" is printed as typed, so old content never changes.
 */
export function splitFormat(text: string): FormatRun[] {
  const tokens = [...text.matchAll(TOKEN)].map((m) => ({
    index: m.index!,
    length: m[0].length,
    close: m[1] === '/',
    tag: m[2] as FormatTag,
  }));
  if (!tokens.length) return text ? [{ text, flags: {} }] : [];
  const stack: number[] = [];
  const paired = new Set<number>();
  tokens.forEach((token, i) => {
    if (!token.close) stack.push(i);
    else if (stack.length && tokens[stack[stack.length - 1]].tag === token.tag) {
      paired.add(stack.pop()!);
      paired.add(i);
    }
  });
  const runs: FormatRun[] = [];
  const open: FormatTag[] = [];
  let at = 0;
  const push = (end: number) => {
    const chunk = text.slice(at, end);
    if (chunk) {
      const flags: FormatFlags = {};
      for (const tag of open) flags[tag] = true;
      const last = runs[runs.length - 1];
      if (last && JSON.stringify(last.flags) === JSON.stringify(flags)) last.text += chunk;
      else runs.push({ text: chunk, flags });
    }
  };
  tokens.forEach((token, i) => {
    if (!paired.has(i)) return;
    push(token.index);
    at = token.index + token.length;
    if (token.close) open.splice(open.lastIndexOf(token.tag), 1);
    else open.push(token.tag);
  });
  push(text.length);
  return runs;
}

/** The text without the tags that would be applied, for places that cannot show formatting (search, plain exports). */
export const stripFormat = (text: string) =>
  splitFormat(text)
    .map((run) => run.text)
    .join('');

/** Wrap the selected part of a field in a tag; selecting already-wrapped text removes the tag again. */
export function toggleFormat(value: string, start: number, end: number, tag: FormatTag) {
  const open = `<${tag}>`,
    close = `</${tag}>`;
  if (start === end) return { value, start, end };
  const selected = value.slice(start, end);
  if (
    selected.startsWith(open) &&
    selected.endsWith(close) &&
    selected.length >= open.length + close.length
  ) {
    const inner = selected.slice(open.length, selected.length - close.length);
    return { value: value.slice(0, start) + inner + value.slice(end), start, end: start + inner.length };
  }
  if (value.slice(start - open.length, start) === open && value.slice(end, end + close.length) === close) {
    return {
      value: value.slice(0, start - open.length) + selected + value.slice(end + close.length),
      start: start - open.length,
      end: end - open.length,
    };
  }
  return {
    value: value.slice(0, start) + open + selected + close + value.slice(end),
    start: start + open.length,
    end: end + open.length,
  };
}
