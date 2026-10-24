/** A small arithmetic parser. No JavaScript evaluation, property access or assignment is allowed. */
type Node = { kind: 'number'; value: number } | { kind: 'x' } |
  { kind: 'unary'; sign: number; child: Node } |
  { kind: 'binary'; operator: string; left: Node; right: Node } |
  { kind: 'function'; name: string; child: Node };

const functions: Record<string, (value: number) => number> = {
  sin: Math.sin, cos: Math.cos, tan: Math.tan, sqrt: Math.sqrt, abs: Math.abs,
  log: Math.log10, ln: Math.log, exp: Math.exp, asin: Math.asin, acos: Math.acos, atan: Math.atan,
  floor: Math.floor, ceil: Math.ceil,
};

export function compileMathExpression(expression: unknown): ((x: number) => number | null) | null {
  if (typeof expression !== 'string' || !expression.trim() || expression.length > 1000) return null;
  const source = expression.replace(/\bMath\.log\b/g, 'ln').replace(/\bMath\.(PI|E)\b/g, (_, constant: string) => constant.toLowerCase())
    .replace(/\bMath\.(sin|cos|tan|sqrt|abs|exp|asin|acos|atan|floor|ceil)\b/g, '$1').replace(/\*\*/g, '^');
  const tokens: string[] = [];
  let position = 0;
  while (position < source.length) {
    if (/\s/.test(source[position])) { position++; continue; }
    const token = source.slice(position).match(/^(?:(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?|[a-z]+|[()+\-*/^])/i)?.[0];
    if (!token) return null;
    tokens.push(token);
    position += token.length;
    if (tokens.length > 300) return null;
  }
  let cursor = 0;
  let depth = 0;
  const consume = (token: string) => { if (tokens[cursor] === token) { cursor++; return true; } return false; };
  function primary(): Node {
    if (++depth > 32) throw new Error('EXPRESSION_DEPTH');
    try {
      const token = tokens[cursor++];
      if (token === '(') {
        const node = sum();
        if (!consume(')')) throw new Error('MISSING_PARENTHESIS');
        return node;
      }
      if (token === 'x') return { kind: 'x' };
      if (token === 'pi' || token === 'e') return { kind: 'number', value: token === 'pi' ? Math.PI : Math.E };
      if (Object.hasOwn(functions, token)) {
        if (!consume('(')) throw new Error('FUNCTION_REQUIRES_PARENTHESIS');
        const child = sum();
        if (!consume(')')) throw new Error('MISSING_PARENTHESIS');
        return { kind: 'function', name: token, child };
      }
      if (token && /^(?:\d|\.)/.test(token) && Number.isFinite(Number(token))) return { kind: 'number', value: Number(token) };
      throw new Error('UNSUPPORTED_TOKEN');
    } finally { depth--; }
  }
  function power(): Node {
    const left = primary();
    return consume('^') ? { kind: 'binary', operator: '^', left, right: unary() } : left;
  }
  function unary(): Node {
    if (consume('+')) return { kind: 'unary', sign: 1, child: unary() };
    if (consume('-')) return { kind: 'unary', sign: -1, child: unary() };
    return power();
  }
  function product(): Node {
    let left = unary();
    while (cursor < tokens.length) {
      const token = tokens[cursor];
      if (token === '*' || token === '/') { cursor++; left = { kind: 'binary', operator: token, left, right: unary() }; }
      else if (token === '(' || token === 'x' || token === 'pi' || token === 'e' || Object.hasOwn(functions, token)) {
        left = { kind: 'binary', operator: '*', left, right: unary() };
      } else break;
    }
    return left;
  }
  function sum(): Node {
    let left = product();
    while (tokens[cursor] === '+' || tokens[cursor] === '-') {
      const operator = tokens[cursor++];
      left = { kind: 'binary', operator, left, right: product() };
    }
    return left;
  }
  function evaluate(node: Node, x: number): number {
    if (node.kind === 'number') return node.value;
    if (node.kind === 'x') return x;
    if (node.kind === 'unary') return node.sign * evaluate(node.child, x);
    if (node.kind === 'function') return functions[node.name](evaluate(node.child, x));
    const left = evaluate(node.left, x), right = evaluate(node.right, x);
    switch (node.operator) {
      case '+': return left + right;
      case '-': return left - right;
      case '*': return left * right;
      case '/': return left / right;
      default: return left ** right;
    }
  }
  try {
    const tree = sum();
    if (cursor !== tokens.length) return null;
    return x => { const value = evaluate(tree, x); return Number.isFinite(value) ? value : null; };
  } catch { return null; }
}

export function safePlotRange(value: unknown, fallback: [number, number] = [-6, 8]): [number, number] {
  if (!Array.isArray(value) || value.length !== 2 || !value.every(v => typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= 10000)) return fallback;
  return value[1] > value[0] && value[1] - value[0] <= 1000 ? [value[0], value[1]] : fallback;
}
