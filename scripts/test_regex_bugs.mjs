function cleanLatexForWord(text) {
  if (!text) return '';
  return text
    .replace(/\$\$/g, '')
    .replace(/\$/g, '')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1/$2)')
    .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\pm/g, '±')
    .replace(/\\le/g, '≤')
    .replace(/\\ge/g, '≥')
    .replace(/\\ne/g, '≠')
    .replace(/\\in/g, '∈')
    .replace(/\\to/g, '→')
    .replace(/\\infty/g, '∞')
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\pi/g, 'π')
    .replace(/\\Delta/g, 'Δ')
    .replace(/\\text\{([^}]+)\}/g, '$1');
}

const testStrings = [
  'x \\to +\\infty',
  '\\int_0^1 f(x) dx',
  'a \\leq b',
  '\\left( x \\right)',
  'a \\geq b',
  'x \\neq 0'
];

console.log('--- KIỂM CHỨNG LỖI REGEX TRONG CLEANLATEXFORWORD ---');
testStrings.forEach(s => {
  console.log(`Gốc: "${s}"  ==>  Kết quả Word: "${cleanLatexForWord(s)}"`);
});
