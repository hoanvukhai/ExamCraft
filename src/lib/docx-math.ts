import JSZip from 'jszip';

/**
 * Word stores equations as OMML elements, which plain-text extraction drops ("Tính ." instead of "Tính $1+2$").
 * Before the text is read, every equation in the document body is replaced by its LaTeX in dollar signs.
 */
type Node = { name: string; attrs: Record<string, string>; children: Node[]; text: string };

const SYMBOLS: Record<string, string> = {
  '×': '\\times ', '÷': '\\div ', '·': '\\cdot ', '±': '\\pm ', '∓': '\\mp ', '≤': '\\le ', '≥': '\\ge ', '≠': '\\ne ', '≈': '\\approx ', '≡': '\\equiv ', '→': '\\to ', '←': '\\leftarrow ', '⇒': '\\Rightarrow ', '⇔': '\\Leftrightarrow ',
  '∞': '\\infty ', '∈': '\\in ', '∉': '\\notin ', '⊂': '\\subset ', '⊆': '\\subseteq ', '∪': '\\cup ', '∩': '\\cap ', '∅': '\\emptyset ', '∀': '\\forall ', '∃': '\\exists ', '∠': '\\angle ', '°': '^\\circ ', '′': "'",
  'α': '\\alpha ', 'β': '\\beta ', 'γ': '\\gamma ', 'δ': '\\delta ', 'ε': '\\varepsilon ', 'θ': '\\theta ', 'λ': '\\lambda ', 'μ': '\\mu ', 'π': '\\pi ', 'ρ': '\\rho ', 'σ': '\\sigma ', 'φ': '\\varphi ', 'ω': '\\omega ', 'Δ': '\\Delta ', 'Σ': '\\Sigma ', 'Ω': '\\Omega ', 'Φ': '\\Phi ', 'Π': '\\Pi ',
  '−': '-', '∑': '\\sum ', '∏': '\\prod ', '∫': '\\int ', '∬': '\\iint ', '∮': '\\oint ', '√': '\\sqrt ',
};
const FUNCTIONS = new Set(['sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'arcsin', 'arccos', 'arctan', 'sinh', 'cosh', 'tanh', 'log', 'ln', 'lg', 'lim', 'max', 'min', 'exp', 'det', 'gcd']);

/** A small reader for the OMML subset, kept dependency free. Namespaces are kept in the element name. */
function parse(xml: string): Node {
  const root: Node = { name: '#root', attrs: {}, children: [], text: '' };
  const stack = [root];
  const token = /<(\/?)([A-Za-z0-9:_-]+)((?:\s+[^<>]*?)?)(\/?)>|([^<]+)/g;
  let match: RegExpExecArray | null;
  while ((match = token.exec(xml)) !== null) {
    const top = stack[stack.length - 1];
    if (match[5] !== undefined) { top.text += match[5]; continue; }
    const [, closing, name, rawAttrs, selfClosing] = match;
    if (closing) { if (stack.length > 1) stack.pop(); continue; }
    const attrs: Record<string, string> = {};
    for (const attr of rawAttrs.matchAll(/([A-Za-z0-9:_-]+)="([^"]*)"/g)) attrs[attr[1]] = attr[2];
    const node: Node = { name, attrs, children: [], text: '' };
    top.children.push(node);
    if (!selfClosing) stack.push(node);
  }
  return root;
}
const decode = (text: string) => text.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
const encode = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const child = (node: Node, name: string) => node.children.find(c => c.name === name);
const arg = (node: Node, name: string) => { const c = child(node, name); return c ? seq(c.children) : ''; };
const group = (value: string) => value.length === 1 || /^\\[A-Za-z]+\s?$/.test(value) ? value : `{${value}}`;
const prop = (node: Node, owner: string, name: string) => child(child(node, owner) ?? { name: '', attrs: {}, children: [], text: '' }, name)?.attrs['m:val'];

function text(node: Node): string {
  const raw = decode(node.text);
  return [...raw].map(ch => SYMBOLS[ch] ?? ch).join('');
}

function one(node: Node): string {
  switch (node.name) {
    case 'm:t': return text(node);
    case 'm:r': return seq(node.children.filter(c => c.name === 'm:t'));
    case 'm:f': return `\\frac{${arg(node, 'm:num')}}{${arg(node, 'm:den')}}`;
    case 'm:rad': { const degree = arg(node, 'm:deg'), hidden = prop(node, 'm:radPr', 'm:degHide') === '1' || prop(node, 'm:radPr', 'm:degHide') === 'on'; return degree && !hidden ? `\\sqrt[${degree}]{${arg(node, 'm:e')}}` : `\\sqrt{${arg(node, 'm:e')}}`; }
    case 'm:sSup': return `${group(arg(node, 'm:e'))}^{${arg(node, 'm:sup')}}`;
    case 'm:sSub': return `${group(arg(node, 'm:e'))}_{${arg(node, 'm:sub')}}`;
    case 'm:sSubSup': return `${group(arg(node, 'm:e'))}_{${arg(node, 'm:sub')}}^{${arg(node, 'm:sup')}}`;
    case 'm:sPre': return `{}_{${arg(node, 'm:sub')}}^{${arg(node, 'm:sup')}}${group(arg(node, 'm:e'))}`;
    case 'm:d': {
      const open = prop(node, 'm:dPr', 'm:begChr') ?? '(', close = prop(node, 'm:dPr', 'm:endChr') ?? ')', sep = prop(node, 'm:dPr', 'm:sepChr') ?? '|';
      const body = node.children.filter(c => c.name === 'm:e').map(c => seq(c.children)).join(sep);
      const left = open === '' ? '.' : open === '{' ? '\\{' : open, right = close === '' ? '.' : close === '}' ? '\\}' : close;
      return `\\left${left} ${body} \\right${right}`;
    }
    case 'm:nary': {
      const chr = prop(node, 'm:naryPr', 'm:chr') ?? '∫', sub = arg(node, 'm:sub'), sup = arg(node, 'm:sup');
      return `${SYMBOLS[chr] ?? chr}${sub ? `_{${sub}}` : ''}${sup ? `^{${sup}}` : ''} ${arg(node, 'm:e')}`;
    }
    case 'm:func': { const name = arg(node, 'm:fName').trim().replace(/^\\/, ''); return `${FUNCTIONS.has(name) ? `\\${name}` : `\\operatorname{${name}}`} ${arg(node, 'm:e')}`; }
    case 'm:limLow': return `${arg(node, 'm:e').trim() === '\\lim' ? '\\lim' : arg(node, 'm:e')}_{${arg(node, 'm:lim')}}`;
    case 'm:limUpp': return `${arg(node, 'm:e')}^{${arg(node, 'm:lim')}}`;
    case 'm:acc': { const chr = prop(node, 'm:accPr', 'm:chr') ?? '^'; return `${chr === '→' ? '\\vec' : chr === '¯' ? '\\overline' : chr === '~' ? '\\tilde' : '\\hat'}{${arg(node, 'm:e')}}`; }
    case 'm:bar': return `\\overline{${arg(node, 'm:e')}}`;
    case 'm:eqArr': return `\\begin{cases} ${node.children.filter(c => c.name === 'm:e').map(c => seq(c.children)).join(' \\\\ ')} \\end{cases}`;
    case 'm:m': return `\\begin{matrix} ${node.children.filter(c => c.name === 'm:mr').map(row => row.children.filter(c => c.name === 'm:e').map(c => seq(c.children)).join(' & ')).join(' \\\\ ')} \\end{matrix}`;
    case 'm:e': case 'm:num': case 'm:den': case 'm:sup': case 'm:sub': case 'm:deg': case 'm:lim': case 'm:fName': case 'm:oMath': case 'm:box': case 'm:phant': case 'm:groupChr': return seq(node.children);
    default: return node.name.endsWith('Pr') || node.name === 'w:rPr' ? '' : seq(node.children);
  }
}
function seq(nodes: Node[]): string {
  let out = '';
  for (const node of nodes) {
    const piece = one(node);
    // A word typed in math mode ("cm", "kg") would italicise; a run of two or more letters is written as text.
    const word = node.name === 'm:r' && /^[A-Za-zÀ-ỹ]{2,}$/.test(piece);
    out += word && FUNCTIONS.has(piece) ? `\\${piece} ` : word && !/^d[a-z]$/.test(piece) ? `\\text{${piece}}` : piece;
  }
  return out;
}

/** LaTeX for one `<m:oMath>` element, without dollar signs. */
export function ommlToLatex(xml: string): string {
  return seq(parse(xml).children).replace(/\s+/g, ' ').replace(/\s*([_^])\s*/g, '$1').trim();
}

/** Replaces each equation in word/document.xml with a text run holding `$latex$` (or `$$latex$$` for a display equation). */
export function replaceEquationsWithLatex(documentXml: string): { xml: string; count: number } {
  let count = 0;
  const run = (latex: string, display: boolean) => { count++; const mark = display ? '$$' : '$'; return `<w:r><w:t xml:space="preserve">${encode(`${mark}${latex}${mark}`)}</w:t></w:r>`; };
  const withDisplay = documentXml.replace(/<m:oMathPara\b[^>]*>([\s\S]*?)<\/m:oMathPara>/g, (_all, inner: string) => run(ommlToLatex(inner), true));
  const xml = withDisplay.replace(/<m:oMath\b[^>]*>[\s\S]*?<\/m:oMath>/g, all => run(ommlToLatex(all), false));
  return { xml, count };
}

/** Returns a copy of the Word file in which equations have become text, ready for plain-text extraction. */
export async function docxWithEquationsAsText(buffer: Buffer): Promise<{ buffer: Buffer; equations: number }> {
  const zip = await JSZip.loadAsync(buffer);
  const file = zip.file('word/document.xml');
  if (!file) return { buffer, equations: 0 };
  const { xml, count } = replaceEquationsWithLatex(await file.async('string'));
  if (!count) return { buffer, equations: 0 };
  zip.file('word/document.xml', xml);
  return { buffer: await zip.generateAsync({ type: 'nodebuffer' }), equations: count };
}
