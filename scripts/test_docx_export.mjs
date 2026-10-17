import fs from 'fs';

// Let's create a standalone script that runs the exact docx-export logic
import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  Packer,
} from 'docx';

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

const complexQuestionContent = 'Cho tích phân $I = \\int_0^1 \\frac{\\sqrt{x^2 + 1}}{1 + \\frac{1}{x}} dx$ và hệ phương trình $\\begin{cases} 2x + y = 5 \\\\ x - y = 1 \\end{cases}$. Bảng biến thiên: [BANG_BIEN_THIEN: x=-inf, 0, +inf | y=+ | y=-inf, /+inf]';

const cleanedText = cleanLatexForWord(complexQuestionContent);

const doc = new Document({
  sections: [
    {
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: 'ĐỀ THI KIỂM THỬ XUẤT CÔNG THỨC TOÁN',
              bold: true,
              size: 26,
            }),
          ],
        }),
        new Paragraph({
          spacing: { before: 200 },
          children: [
            new TextRun({
              text: 'Câu 1 (0,25 điểm): ',
              bold: true,
            }),
            new TextRun({
              text: cleanedText,
            }),
          ],
        }),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync('./scripts/test_complex_math.docx', buffer);
  console.log('Saved ./scripts/test_complex_math.docx');
  console.log('Cleaned text inserted into Docx:');
  console.log(cleanedText);
});
