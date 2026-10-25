import { Math as WordMath, MathFraction, MathLimitLower, MathRadical, MathRun, MathSubScript, MathSubSuperScript, MathSuperScript } from 'docx';

type MathChild = NonNullable<ConstructorParameters<typeof WordMath>[0]['children']>[number];

/** Macros that are a single symbol in Word's equation text. Anything not listed is kept visible as written. */
const SYMBOLS: Record<string, string> = {
  infty: '∞', leq: '≤', le: '≤', geq: '≥', ge: '≥', neq: '≠', ne: '≠', approx: '≈', times: '×', div: '÷', pm: '±', mp: '∓', cdot: '⋅', ldots: '…', cdots: '⋯', dots: '…',
  to: '→', rightarrow: '→', leftarrow: '←', Rightarrow: '⇒', Leftarrow: '⇐', Leftrightarrow: '⇔', leftrightarrow: '↔', mapsto: '↦',
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', varepsilon: 'ε', zeta: 'ζ', eta: 'η', theta: 'θ', lambda: 'λ', mu: 'μ', nu: 'ν', xi: 'ξ', pi: 'π', rho: 'ρ', sigma: 'σ', tau: 'τ', phi: 'ϕ', varphi: 'φ', chi: 'χ', psi: 'ψ', omega: 'ω',
  Gamma: 'Γ', Delta: 'Δ', Theta: 'Θ', Lambda: 'Λ', Xi: 'Ξ', Pi: 'Π', Sigma: 'Σ', Phi: 'Φ', Psi: 'Ψ', Omega: 'Ω',
  circ: '°', angle: '∠', triangle: '△', parallel: '∥', perp: '⊥', in: '∈', notin: '∉', subset: '⊂', subseteq: '⊆', supset: '⊃', cup: '∪', cap: '∩', emptyset: '∅', setminus: '∖',
  forall: '∀', exists: '∃', sim: '∼', equiv: '≡', cong: '≅', mid: '∣', propto: '∝', partial: '∂', nabla: '∇', sum: '∑', prod: '∏', int: '∫', oint: '∮',
  lt: '<', gt: '>', '{': '{', '}': '}', '%': '%', '$': '$', '&': '&', '#': '#', '_': '_', ',': ' ', ';': ' ', ':': ' ', '!': '', quad: '    ', qquad: '        ', ' ': ' ',
};
const BLACKBOARD: Record<string, string> = { R: 'ℝ', Z: 'ℤ', Q: 'ℚ', N: 'ℕ', C: 'ℂ' };
const FUNCTIONS = new Set(['sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'arcsin', 'arccos', 'arctan', 'sinh', 'cosh', 'tanh', 'log', 'ln', 'lg', 'exp', 'max', 'min', 'det', 'gcd', 'deg', 'sup', 'inf']);
const BIG_OPERATORS = new Set(['sum', 'prod', 'int', 'oint']);
const run = (text: string) => new MathRun(text);

class Parser {
  private index = 0;
  constructor(private readonly source: string) {}

  parse(): MathChild[] { return this.sequence(false); }

  /** Reads terms until the end, or (inside braces) until the closing `}`. */
  private sequence(inBraces: boolean): MathChild[] {
    const out: MathChild[] = [];
    let text = '';
    const flush = () => { if (text) { out.push(run(text)); text = ''; } };
    while (this.index < this.source.length) {
      const char = this.source[this.index];
      if (char === '}') { this.index += 1; if (inBraces) break; continue; } // a stray `}` outside braces is ignored
      if (char === '^' || char === '_') {
        // The script belongs to the last character, the last term, or an empty base when nothing came before it.
        text = text.replace(/\s+$/, '');
        let base: MathChild;
        if (text) { base = run(text.slice(-1)); text = text.slice(0, -1); flush(); }
        else base = out.pop() ?? run('');
        out.push(...this.scripts(base));
        continue;
      }
      if (char === '{') { flush(); this.index += 1; out.push(...this.sequence(true)); continue; }
      if (char === '\\') { flush(); out.push(...this.macro()); continue; }
      text += char; this.index += 1;
    }
    flush();
    return out;
  }

  private skipSpaces() { while (this.source[this.index] === ' ') this.index += 1; }

  /** An argument: a braced group, a macro or a single character. */
  private argument(): MathChild[] {
    this.skipSpaces();
    const char = this.source[this.index];
    if (char === undefined) return [];
    if (char === '{') { this.index += 1; return this.sequence(true); }
    if (char === '\\') return this.macro(false);
    this.index += 1; return [run(char)];
  }

  private scripts(base: MathChild): MathChild[] {
    let sub: MathChild[] | undefined, sup: MathChild[] | undefined;
    while (this.source[this.index] === '^' || this.source[this.index] === '_') {
      const kind = this.source[this.index]; this.index += 1;
      this.skipSpaces();
      // `90^\circ` is a degree sign, not a raised circle.
      if (kind === '^' && this.source.startsWith('\\circ', this.index) && !/[A-Za-z]/.test(this.source[this.index + 5] ?? '')) { this.index += 5; return [base, run('°')]; }
      const value = this.argument();
      if (kind === '^') sup = value; else sub = value;
    }
    if (sub && sup) return [new MathSubSuperScript({ children: [base], subScript: sub, superScript: sup })];
    if (sup) return [new MathSuperScript({ children: [base], superScript: sup })];
    return [new MathSubScript({ children: [base], subScript: sub ?? [] })];
  }

  private macro(allowScripts = true): MathChild[] {
    this.index += 1; // the backslash
    const rest = this.source.slice(this.index);
    const named = /^[A-Za-z]+/.exec(rest);
    const name = named ? named[0] : rest[0] ?? '';
    this.index += name.length;
    if (!name) return [run('\\')];
    if (name === '\\') return [run('; ')];
    switch (name) {
      case 'frac': case 'dfrac': case 'tfrac': { const numerator = this.argument(), denominator = this.argument(); return [new MathFraction({ numerator, denominator })]; }
      case 'sqrt': {
        let degree: MathChild[] | undefined;
        this.skipSpaces();
        if (this.source[this.index] === '[') { const end = this.source.indexOf(']', this.index); if (end > 0) { degree = new Parser(this.source.slice(this.index + 1, end)).parse(); this.index = end + 1; } }
        return [new MathRadical({ children: this.argument(), ...(degree ? { degree } : {}) })];
      }
      case 'left': case 'right': {
        this.skipSpaces();
        const delimiter = this.source[this.index];
        if (delimiter === undefined) return [];
        this.index += 1;
        if (delimiter === '\\') { const next = this.source[this.index]; this.index += 1; return next === '{' || next === '}' ? [run(next)] : next === '|' ? [run('‖')] : []; }
        return delimiter === '.' ? [] : [run(delimiter)];
      }
      case 'lim': {
        this.skipSpaces();
        if (this.source[this.index] === '_') { this.index += 1; return [new MathLimitLower({ children: [run('lim')], limit: this.argument() })]; }
        return [run('lim')];
      }
      case 'text': case 'mathrm': case 'mathbf': case 'operatorname': case 'mbox': { const inner = this.rawArgument(); return inner ? [run(inner)] : []; }
      case 'mathbb': return [run(this.rawArgument().split('').map(letter => BLACKBOARD[letter] ?? letter).join(''))];
      case 'overline': case 'bar': return [run(this.rawArgument().split('').map(letter => letter + '̅').join(''))];
      case 'vec': return [run(this.rawArgument() + '⃗')];
      case 'widehat': case 'hat': return [run('∠' + this.rawArgument())];
      case 'begin': return this.environment();
      case 'end': this.rawArgument(); return [];
      default: break;
    }
    if (FUNCTIONS.has(name)) return [run(name)];
    if (name in SYMBOLS) {
      const symbol = SYMBOLS[name];
      // The limits of a sum, product or integral sit next to the sign.
      if (BIG_OPERATORS.has(name) && allowScripts && (this.source[this.index] === '_' || this.source[this.index] === '^')) return this.scripts(run(symbol));
      return symbol ? [run(symbol)] : [];
    }
    return [run('\\' + name)]; // an unknown macro stays visible so the teacher can fix it
  }

  /** The plain text of the next argument, with macros inside it turned into symbols. */
  private rawArgument(): string {
    this.skipSpaces();
    if (this.source[this.index] !== '{') { const char = this.source[this.index]; if (char === undefined) return ''; this.index += 1; return char; }
    let depth = 0, end = this.index;
    for (; end < this.source.length; end++) { if (this.source[end] === '{') depth += 1; else if (this.source[end] === '}') { depth -= 1; if (depth === 0) break; } }
    const inner = this.source.slice(this.index + 1, end);
    this.index = end + 1;
    return inner.replace(/\\([A-Za-z]+)/g, (whole, macro: string) => SYMBOLS[macro] ?? whole);
  }

  /** `cases` and matrices keep the readable one-line form: rows are separated by "; ". */
  private environment(): MathChild[] {
    const name = this.rawArgument();
    const closing = `\\end{${name}}`;
    const end = this.source.indexOf(closing, this.index);
    const body = end < 0 ? this.source.slice(this.index) : this.source.slice(this.index, end);
    this.index = end < 0 ? this.source.length : end + closing.length;
    const rows = body.split(/\\\\/).map(row => row.trim()).filter(Boolean).map(row => new Parser(row.replace(/&/g, '  ')).parse());
    const [open, close] = name === 'cases' ? ['{ ', ' }'] : name === 'vmatrix' ? ['| ', ' |'] : name.endsWith('matrix') ? ['[ ', ' ]'] : ['', ''];
    const out: MathChild[] = open ? [run(open)] : [];
    rows.forEach((row, rowIndex) => { if (rowIndex) out.push(run('; ')); out.push(...row); });
    if (close) out.push(run(close));
    return out;
  }
}

/** Converts the inside of a `$...$` formula into Word equation parts. Never throws: unknown input stays as text. */
export function latexToMath(latex: string): MathChild[] {
  const source = latex.replace(/^\$\$|\$\$$/g, '').replace(/^\$|\$$/g, '').trim();
  if (!source) return [];
  try {
    const parts = new Parser(source).parse();
    return parts.length ? parts : [run(source)];
  } catch {
    return [run(source)];
  }
}
