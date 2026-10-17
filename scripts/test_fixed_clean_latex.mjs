function cleanLatexForWord(text) {
  if (!text) return '';
  let result = text;

  // 1. Gỡ bỏ ký hiệu bao khối toán $$ và $
  result = result.replace(/\$\$/g, '').replace(/\$/g, '');

  // 2. Xử lý các macro dài trước để tránh bị token ngắn cắn xé
  result = result
    .replace(/\\infty/g, '∞')
    .replace(/\\int_([^\s^]+)\^([^\s]+)/g, '∫($1→$2)')
    .replace(/\\int/g, '∫')
    .replace(/\\left\s*/g, '')
    .replace(/\\right\s*/g, '')
    .replace(/\\leq/g, '≤')
    .replace(/\\geq/g, '≥')
    .replace(/\\neq/g, '≠')
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\pm/g, '±')
    .replace(/\\to/g, '→')
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\pi/g, 'π')
    .replace(/\\Delta/g, 'Δ')
    .replace(/\\mathbb\{R\}/g, 'ℝ')
    .replace(/\\mathbb\{Z\}/g, 'ℤ')
    .replace(/\\mathbb\{Q\}/g, 'ℚ')
    .replace(/\\mathbb\{N\}/g, 'ℕ')
    .replace(/\\setminus/g, ' \\ ')
    .replace(/\\cup/g, ' ∪ ')
    .replace(/\\cap/g, ' ∩ ')
    .replace(/\\mathrm\{e\}/g, 'e')
    .replace(/\\mathrm\{([^}]+)\}/g, '$1')
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\\mathbf\{([^}]+)\}/g, '$1');

  // 3. Xử lý các token ngắn với ranh giới từ hoặc lookahead
  result = result
    .replace(/\\le(?![a-zA-Z])/g, '≤')
    .replace(/\\ge(?![a-zA-Z])/g, '≥')
    .replace(/\\ne(?![a-zA-Z])/g, '≠')
    .replace(/\\in(?![a-zA-Z])/g, '∈');

  // 4. Xử lý lặp để gỡ sạch ngoặc lồng nhau của \frac, \dfrac, \sqrt
  let prev = '';
  while (prev !== result && (result.includes('\\frac') || result.includes('\\dfrac') || result.includes('\\sqrt'))) {
    prev = result;
    result = result.replace(/\\sqrt\{([^{}]+)\}/g, '√($1)');
    result = result.replace(/\\(?:d?frac)\{([^{}]+)\}\{([^{}]+)\}/g, '($1 / $2)');
  }

  // 5. Xử lý hệ phương trình cases
  result = result
    .replace(/\\begin\{cases\}/g, '{ ')
    .replace(/\\end\{cases\}/g, ' }')
    .replace(/\\\\/g, '; ');

  // 6. Xử lý bảng biến thiên
  result = result.replace(/\[BANG_BIEN_THIEN[^\]]*\]/g, '[Bảng biến thiên đính kèm]');

  // 7. Dọn dẹp khoảng trắng thừa và dấu gạch chéo
  result = result
    .replace(/\\,/g, ' ')
    .replace(/\\;/g, ' ')
    .replace(/\\!/g, '')
    .replace(/\\quad/g, '    ');

  return result.trim();
}

const s = '\\frac{\\sqrt{x^2 + 1}}{1 + \\frac{1}{x}}';
console.log('GỐC:', s);
console.log('KẾT QUẢ:', cleanLatexForWord(s));
