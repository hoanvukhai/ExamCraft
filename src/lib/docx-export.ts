import { outlineView, questionPartLabel, type StructureBlock } from './outline-view';
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
  Math,
  PageBreak,
  ImageRun,
} from 'docx';
import { Exam, Figure } from '@/types/exam';
import { computeExamMatrix, generateDocxMatrixTable } from './matrix-spec-generator';
import { matchingDisplay, orderingDisplay } from './structured-question';
import { splitContentBlocks } from './markdown-table';
import { examPlanOutput } from './exam-plan-output';
import { resolveHeaderLines } from './header-layout';
import type { VariationTableData } from '@/components/VariationTable';
import { latexToMath } from './latex-math';

/**
 * Xóa bỏ ký hiệu LaTeX thô hoặc làm sạch chuẩn xác để hiển thị trong Word
 * Xử lý từ khóa dài trước, từ khóa ngắn sau kèm lookahead/boundary để không cắn xé từ vựng.
 */
export function cleanLatexForWord(text: string): string {
  if (!text) return '';
  let result = text;

  // 1. Gỡ bỏ ký hiệu bao khối toán $$ và $
  result = result.replace(/\$\$/g, '').replace(/\$/g, '');

  // 2. Xử lý các macro dài trước để tránh bị token ngắn cắn xé
  result = result
    .replace(/\\infty/g, '∞')
    .replace(/\\int_\{([^}]+)\}\^\{([^}]+)\}/g, '∫($1→$2)')
    .replace(/\\int_([^\s^]+)\^([^\s]+)/g, '∫($1→$2)')
    .replace(/\\int/g, '∫')
    .replace(/\\lim_\{([^}]+)\}/g, 'lim($1)')
    .replace(/\\left\s*/g, '')
    .replace(/\\right\s*/g, '')
    .replace(/\\leq/g, '≤')
    .replace(/\\geq/g, '≥')
    .replace(/\\neq/g, '≠')
    .replace(/\\approx/g, '≈')
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\pm/g, '±')
    .replace(/\\to/g, '→')
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\gamma/g, 'γ')
    .replace(/\\lambda/g, 'λ')
    .replace(/\\omega/g, 'ω')
    .replace(/\\Omega/g, 'Ω')
    .replace(/\\mu/g, 'μ')
    .replace(/\\rho/g, 'ρ')
    .replace(/\\theta/g, 'θ')
    .replace(/\\varphi/g, 'φ')
    .replace(/\\phi/g, 'ϕ')
    .replace(/\\sigma/g, 'σ')
    .replace(/\\tau/g, 'τ')
    .replace(/\\pi/g, 'π')
    .replace(/\\Delta/g, 'Δ')
    .replace(/\^\\circ/g, '°')
    .replace(/\\circ/g, '°')
    .replace(/\\widehat\{([^}]+)\}/g, '∠$1')
    .replace(/\\vec\{([^}]+)\}/g, '$1⃗')
    .replace(/\\ce\{([^{}]+)\}/g, (_m, p1) => {
      return p1
        .replace(/\s*->\s*/g, ' → ')
        .replace(/\s*<=>\s*/g, ' ⇌ ')
        .replace(/\^/g, '↑')
        .replace(/v/g, '↓');
    })
    // Xử lý ký hiệu hạt nhân nguyên tử: _{Z}^{A}X -> (A/Z)X
    .replace(/_\{([^{}]+)\}\^\{([^{}]+)\}(?:\\text\{)?([a-zA-Z]+)\}?/g, '($2/$1)$3')
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
  while (
    prev !== result &&
    (result.includes('\\frac') || result.includes('\\dfrac') || result.includes('\\sqrt'))
  ) {
    prev = result;
    result = result.replace(/\\sqrt\[([^{}]+)\]\{([^{}]+)\}/g, '√[$1]($2)');
    result = result.replace(/\\sqrt\{([^{}]+)\}/g, '√($1)');
    result = result.replace(/\\(?:d?frac)\{([^{}]+)\}\{([^{}]+)\}/g, '($1 / $2)');
  }

  // 5. Xử lý ma trận (matrix, pmatrix, bmatrix, vmatrix)
  result = result
    .replace(/\\begin\{(?:p|b)?matrix\}/g, '[ ')
    .replace(/\\end\{(?:p|b)?matrix\}/g, ' ]')
    .replace(/\\begin\{vmatrix\}/g, '| ')
    .replace(/\\end\{vmatrix\}/g, ' |')
    .replace(/\\begin\{cases\}/g, '{ ')
    .replace(/\\end\{cases\}/g, ' }')
    .replace(/\\\\/g, '; ')
    .replace(/&/g, '  ');

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

/**
 * Tách một chuỗi văn bản có lẫn công thức $...$ hoặc $$...$$ thành mảng các TextRun và Math element của docx (OMML)
 */
/**
 * Turns text that may contain pipe tables into paragraphs and real Word tables.
 * `lead` is a run such as "Câu 1: " that stays at the start of the first paragraph.
 */
export function renderContentBlocksForWord(
  text: string,
  paragraph: { indent?: { left?: number; right?: number }; spacing?: { before?: number; after?: number } },
  options: { fontSize?: number; italics?: boolean },
  lead: TextRun[] = [],
): (Paragraph | Table)[] {
  const blocks = splitContentBlocks(text ?? '');
  const out: (Paragraph | Table)[] = [];
  let leadUsed = false;
  const fontSize = options.fontSize ?? 22;
  for (const block of blocks) {
    if (block.kind === 'text') {
      if (!block.text.trim() && (leadUsed || !lead.length)) continue;
      out.push(
        new Paragraph({
          ...paragraph,
          children: [...(leadUsed ? [] : lead), ...renderLatexRunsForWord(block.text, options)],
        }),
      );
      leadUsed = true;
      continue;
    }
    if (!leadUsed && lead.length) {
      out.push(new Paragraph({ ...paragraph, children: lead }));
      leadUsed = true;
    }
    const cell = (value: string, align: 'left' | 'center' | 'right', bold: boolean) =>
      new TableCell({
        margins: { top: 40, bottom: 40, left: 80, right: 80 },
        children: [
          new Paragraph({
            alignment:
              align === 'center'
                ? AlignmentType.CENTER
                : align === 'right'
                  ? AlignmentType.RIGHT
                  : AlignmentType.LEFT,
            children: renderLatexRunsForWord(value, {
              fontSize: fontSize > 21 ? 21 : fontSize,
              bold,
              italics: options.italics,
            }),
          }),
        ],
      });
    out.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            tableHeader: true,
            cantSplit: true,
            children: block.header.map((value) => cell(value, 'center', true)),
          }),
          ...block.rows.map(
            (row) =>
              new TableRow({
                cantSplit: true,
                children: row.map((value, c) => cell(value, block.align[c], false)),
              }),
          ),
        ],
      }),
    );
    out.push(new Paragraph({ spacing: { after: 80 }, children: [] }));
  }
  return out;
}

export function renderLatexRunsForWord(
  rawText: string,
  options?: { fontSize?: number; font?: string; bold?: boolean; italics?: boolean },
): (TextRun | Math)[] {
  if (!rawText) return [];
  const runs: (TextRun | Math)[] = [];
  const fontSize = options?.fontSize || 22;
  const font = options?.font || 'Times New Roman';
  // Word ignores a raw newline inside a run; each line break must be an explicit break so poems, code and multi-line stems keep their lines.
  const textRuns = (text: string) =>
    text.split(/\r?\n/).map(
      (line, index) =>
        new TextRun({
          text: line,
          ...(index > 0 ? { break: 1 } : {}),
          font,
          size: fontSize,
          bold: options?.bold,
          italics: options?.italics,
        }),
    );

  // Biểu thức tách chuỗi: tìm các đoạn $$...$$ hoặc $...$
  const regex = /(\$\$[\s\S]*?\$\$|\$[^$]+\$)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(rawText)) !== null) {
    const textBefore = rawText.slice(lastIndex, match.index);
    if (textBefore) runs.push(...textRuns(textBefore));

    const mathExpr = match[0];
    const innerMath = mathExpr
      .replace(/^\$\$|\$\$$/g, '')
      .replace(/^\$|\$$/g, '')
      .trim();

    // Phân tích biểu thức LaTeX thành phương trình Word thật: phân số, căn, chỉ số trên/dưới, tổng, giới hạn
    runs.push(new Math({ children: latexToMath(innerMath) }));

    lastIndex = regex.lastIndex;
  }

  // Đoạn văn bản còn lại sau cùng
  const remainingText = rawText.slice(lastIndex);
  if (remainingText) runs.push(...textRuns(remainingText));

  // Nếu chuỗi không chứa ký hiệu $ nào, fallback đơn giản
  if (runs.length === 0 && rawText) {
    runs.push(
      new TextRun({
        text: cleanLatexForWord(rawText),
        font,
        size: fontSize,
        bold: options?.bold,
        italics: options?.italics,
      }),
    );
  }

  return runs;
}

/**
 * Chuyển đổi và render hình vẽ, đồ thị hàm số và bảng biến thiên vào file Word docx (EXP-BUG-001)
 */
export function renderFiguresForDocx(figures?: Figure[], compact = false): (Paragraph | Table)[] {
  if (!figures || figures.length === 0) return [];
  const elements: (Paragraph | Table)[] = [];

  for (const fig of figures) {
    if (fig.renderedBase64) {
      try {
        const cleanBase64 = fig.renderedBase64.replace(/^data:image\/\w+;base64,/, '');
        const imgBuffer = Buffer.from(cleanBase64, 'base64');
        const dimensions = (fig as Figure & { exportSize?: { width: number; height: number } }).exportSize;
        const width = dimensions?.width ?? 380,
          height = dimensions?.height ?? 240;
        const scale = compact ? globalThis.Math.min(1, 230 / width) : 1;
        elements.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 100, after: 60 },
            children: [
              new ImageRun({
                data: imgBuffer,
                transformation: {
                  width: width * scale,
                  height: height * scale,
                },
                type: fig.renderedBase64.startsWith('data:image/jpeg')
                  ? 'jpg'
                  : fig.renderedBase64.startsWith('data:image/gif')
                    ? 'gif'
                    : 'png',
              }),
            ],
          }),
        );
      } catch {
        throw new Error(
          `Không chèn được hình “${fig.caption ?? fig.id}” vào Word. Dữ liệu gốc vẫn được giữ.`,
        );
      }
    } else if (fig.kind === 'variation_table' && fig.data) {
      const vData = fig.data as VariationTableData;
      if (
        !Array.isArray(vData.xValues) ||
        vData.xValues.length < 2 ||
        !Array.isArray(vData.yPrimeSigns) ||
        !vData.yPrimeSigns.length ||
        !Array.isArray(vData.yValues) ||
        !vData.yValues.length
      )
        throw new Error(`Bảng biến thiên “${fig.caption ?? fig.id}” chưa đủ dữ liệu.`);
      if (Array.isArray(vData.xValues) && Array.isArray(vData.yPrimeSigns)) {
        // Tạo bảng biến thiên dạng Table trong docx
        const totalWidth = compact ? 3450 : 8500; // dxa
        const headerColWidth = 1000;
        const contentColWidth = globalThis.Math.floor(
          (totalWidth - headerColWidth) / globalThis.Math.max(1, vData.xValues.length),
        );

        // Hàng 1: x
        const rowXCells = [
          new TableCell({
            width: { size: headerColWidth, type: WidthType.DXA },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'x', bold: true, italics: true, font: 'Times New Roman', size: 20 }),
                ],
              }),
            ],
          }),
          ...vData.xValues.map(
            (xVal: string) =>
              new TableCell({
                width: { size: contentColWidth, type: WidthType.DXA },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({ text: cleanLatexForWord(xVal), font: 'Times New Roman', size: 20 }),
                    ],
                  }),
                ],
              }),
          ),
        ];

        // Hàng 2: y'
        const rowYPrimeCells = [
          new TableCell({
            width: { size: headerColWidth, type: WidthType.DXA },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: "y'", bold: true, italics: true, font: 'Times New Roman', size: 20 }),
                ],
              }),
            ],
          }),
          new TableCell({
            columnSpan: vData.xValues.length,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: vData.yPrimeSigns.map((s: string) => `  ${s}  `).join(''),
                    bold: true,
                    font: 'Times New Roman',
                    size: 20,
                  }),
                ],
              }),
            ],
          }),
        ];

        // Hàng 3: y
        let ySummary = '';
        if (Array.isArray(vData.yValues)) {
          ySummary = vData.yValues
            .map((yv) => {
              if (yv.type === 'up') return ' ↗ ';
              if (yv.type === 'down') return ' ↘ ';
              return cleanLatexForWord(yv.val || '');
            })
            .join(' ');
        }
        const rowYCells = [
          new TableCell({
            width: { size: headerColWidth, type: WidthType.DXA },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'y', bold: true, italics: true, font: 'Times New Roman', size: 20 }),
                ],
              }),
            ],
          }),
          new TableCell({
            columnSpan: vData.xValues.length,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: ySummary || 'Giá trị hàm số biến thiên',
                    font: 'Times New Roman',
                    size: 20,
                  }),
                ],
              }),
            ],
          }),
        ];

        const varTable = new Table({
          width: { size: totalWidth, type: WidthType.DXA },
          alignment: AlignmentType.CENTER,
          borders: {
            top: { style: BorderStyle.SINGLE, size: 6, color: '666666' },
            bottom: { style: BorderStyle.SINGLE, size: 6, color: '666666' },
            left: { style: BorderStyle.SINGLE, size: 6, color: '666666' },
            right: { style: BorderStyle.SINGLE, size: 6, color: '666666' },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: '888888' },
            insideVertical: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' },
          },
          rows: [
            new TableRow({ children: rowXCells }),
            new TableRow({ children: rowYPrimeCells }),
            new TableRow({ children: rowYCells }),
          ],
        });
        elements.push(varTable);
      }
    } else {
      throw new Error(
        `Hình “${fig.caption ?? fig.id}” chưa có ảnh để xuất Word. Hãy xuất từ bàn soạn sau khi kiểm tra hình.`,
      );
    }

    if (fig.caption) {
      elements.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 40, after: 80 },
          children: [
            new TextRun({
              text: fig.caption,
              italics: true,
              size: 20,
              font: 'Times New Roman',
            }),
          ],
        }),
      );
    }
  }

  return elements;
}

/**
 * Tạo tài liệu Word .docx hoàn chỉnh theo quy chuẩn đề thi Việt Nam
 */
export async function exportExamToDocx(
  exam: Exam,
  includeSolutions: boolean = true,
  includeMatrix: boolean = true,
  view: 'all' | 'exam' | 'answers' | 'solutions' | 'matrix' | 'parallel' = 'all',
): Promise<Blob> {
  const structure = outlineView(exam);
  const questions = structure.questions;

  const headerLines = resolveHeaderLines(exam);
  const headerParagraph = (line: ReturnType<typeof resolveHeaderLines>[number]) =>
    new Paragraph({
      alignment:
        line.align === 'left'
          ? AlignmentType.LEFT
          : line.align === 'right'
            ? AlignmentType.RIGHT
            : AlignmentType.CENTER,
      children: [
        new TextRun({
          text: line.text,
          bold: line.bold,
          italics: line.italic,
          font: 'Times New Roman',
          size: 22,
        }),
      ],
    });
  const headerAreas = ['left', 'right'].filter((area) => headerLines.some((line) => line.area === area));
  const headerBlocks: (Paragraph | Table)[] = headerAreas.length
    ? [
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
            insideHorizontal: { style: BorderStyle.NONE },
            insideVertical: { style: BorderStyle.NONE },
          },
          rows: [
            new TableRow({
              children: headerAreas.map(
                (area) =>
                  new TableCell({
                    width: { size: 100 / headerAreas.length, type: WidthType.PERCENTAGE },
                    children: headerLines.filter((line) => line.area === area).map(headerParagraph),
                  }),
              ),
            }),
          ],
        }),
      ]
    : [];

  // Thông tin học sinh & số báo danh
  const studentInfoTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: 'D1D5DB' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'D1D5DB' },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 65, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                spacing: { before: 80, after: 80 },
                children: [
                  new TextRun({
                    text: 'Họ và tên thí sinh: ............................................................................',
                    font: 'Times New Roman',
                    size: 20,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 35, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                spacing: { before: 80, after: 80 },
                children: [
                  new TextRun({
                    text: 'Số báo danh: .............................',
                    font: 'Times New Roman',
                    size: 20,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const docChildren: (Paragraph | Table)[] = [];
  const parallelQuestions: (Paragraph | Table)[][] = [],
    parallelAnswers: (Paragraph | Table)[][] = [];

  // Nếu bật tùy chọn Ma trận: Chèn bảng Ma trận CV 7991 lên trang đầu
  if (includeMatrix) {
    const plan = examPlanOutput(exam);
    if (plan) {
      const text = (value: string, bold = false) =>
        new Paragraph({
          spacing: { before: 60, after: 60 },
          children: [new TextRun({ text: value, bold, font: 'Times New Roman', size: 19 })],
        });
      docChildren.push(
        text(plan.title, true),
        text(plan.disclaimer),
        text(plan.status, true),
        ...plan.summaries.map((value) => text(value)),
      );
      if (plan.headers.length) {
        const row = (cells: string[], header = false) =>
          new TableRow({
            tableHeader: header,
            children: cells.map(
              (value) =>
                new TableCell({
                  width: { size: 25, type: WidthType.PERCENTAGE },
                  children: [text(value, header)],
                }),
            ),
          });
        docChildren.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [row(plan.headers, true), ...plan.rows.map((cells) => row(cells))],
          }),
        );
      }
      if (plan.warnings.length)
        docChildren.push(text('Cần rà soát', true), ...plan.warnings.map((value) => text(value)));
    }
    docChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 100, after: 140 },
        children: [
          new TextRun({
            text: 'BẢNG PHÂN BỔ CÂU HỎI — THEO KHUNG ĐÃ CHỌN',
            bold: true,
            size: 24,
            font: 'Times New Roman',
          }),
        ],
      }),
      generateDocxMatrixTable(computeExamMatrix(exam)),
      new Paragraph({
        spacing: { before: 140, after: 100 },
        children: [new PageBreak()],
      }),
    );
  }

  const questionBodyStart = docChildren.length;
  docChildren.push(
    ...headerBlocks,
    new Paragraph({ spacing: { before: 100, after: 100 } }),
    studentInfoTable,
    new Paragraph({ spacing: { before: 150, after: 100 } }),
  );

  const structureBlocks = (blocks: StructureBlock[] = []): (Paragraph | Table)[] =>
    blocks.flatMap((block) => {
      const output: (Paragraph | Table)[] = [];
      if (block.title)
        output.push(
          ...renderContentBlocksForWord(
            block.title,
            { spacing: { before: 160, after: 80 } },
            { fontSize: 23 },
          ),
        );
      if (block.instructions)
        output.push(...renderContentBlocksForWord(block.instructions, {}, { fontSize: 22 }));
      if (block.missingPassageId)
        output.push(new Paragraph('Chưa tìm thấy nội dung dùng chung: ' + block.missingPassageId));
      if (block.passage) {
        const passage = block.passage;
        if (passage.title)
          output.push(new Paragraph({ children: [new TextRun({ text: passage.title, bold: true })] }));
        output.push(...renderContentBlocksForWord(passage.content, {}, { fontSize: 22 }));
        output.push(...renderFiguresForDocx(passage.figures));
        if (passage.source)
          output.push(new Paragraph({ children: [new TextRun({ text: passage.source, italics: true })] }));
      }
      return output;
    });
  const parallelPrefixes: (Paragraph | Table)[][] = [];
  questions.forEach((q, index) => {
    const prefix = structureBlocks(structure.before.get(q.id));
    parallelPrefixes.push(prefix);
    docChildren.push(...prefix);
    const blockStart = docChildren.length;
    docChildren.push(
      ...renderContentBlocksForWord(q.content, { spacing: { before: 140, after: 80 } }, { fontSize: 22 }, [
        new TextRun({
          text: 'Câu ' + (structure.numbers.get(q.id) ?? index + 1) + ': ',
          bold: true,
          size: 22,
        }),
      ]),
    );
    if (q.type === 'multiple_choice')
      q.choices?.forEach((choice) =>
        docChildren.push(
          new Paragraph({
            indent: { left: 300 },
            children: [
              new TextRun({ text: choice.key + '. ', bold: true, size: 22 }),
              ...renderLatexRunsForWord(choice.text, { fontSize: 22 }),
            ],
          }),
          ...renderFiguresForDocx(choice.figures, view === 'parallel'),
        ),
      );
    if (q.type === 'true_false_group')
      q.sub_questions?.forEach((sub) =>
        docChildren.push(
          new Paragraph({
            indent: { left: 300 },
            children: [
              new TextRun({ text: sub.key + ') ', bold: true, size: 22 }),
              ...renderLatexRunsForWord(sub.content, { fontSize: 22 }),
              new TextRun({ text: '    □ Đúng    □ Sai', size: 20 }),
            ],
          }),
        ),
      );
    if (q.type === 'matching') {
      const matching = matchingDisplay(q);
      if (matching) {
        const row = (left: string, right: string) =>
          new TableRow({
            children: [left, right].map(
              (text) =>
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  children: [new Paragraph({ children: renderLatexRunsForWord(text, { fontSize: 22 }) })],
                }),
            ),
          });
        docChildren.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              row('Cột trái', 'Cột phải'),
              ...Array.from(
                { length: globalThis.Math.max(matching.left.length, matching.right.length) },
                (_, i) =>
                  row(
                    matching.left[i] ? i + 1 + '. ' + matching.left[i].text : '',
                    matching.right[i] ? String.fromCharCode(65 + i) + '. ' + matching.right[i].text : '',
                  ),
              ),
            ],
          }),
        );
      } else docChildren.push(new Paragraph('[Chưa thiết lập hai cột ghép nối]'));
    }
    if (q.type === 'ordering') {
      const ordering = orderingDisplay(q);
      if (ordering)
        ordering.items.forEach((item, i) =>
          docChildren.push(
            new Paragraph({
              children: [
                new TextRun({ text: '[' + (i + 1) + '] ', bold: true }),
                ...renderLatexRunsForWord(item.text, { fontSize: 22 }),
              ],
            }),
          ),
        );
      else docChildren.push(new Paragraph('[Chưa thiết lập các mục sắp xếp]'));
    }
    if (['short_answer', 'fill_blank', 'ordering', 'matching'].includes(q.type))
      docChildren.push(
        new Paragraph(
          'Trả lời: ................................................................................',
        ),
      );
    docChildren.push(...renderFiguresForDocx(q.figures, view === 'parallel'));
    q.parts?.forEach((part, i) => {
      const label = questionPartLabel(q, i, structure.numbers.get(q.id));
      docChildren.push(
        ...renderContentBlocksForWord(part.content, { indent: { left: 300 } }, { fontSize: 22 }, [
          new TextRun({
            text: label + ') ' + (part.points !== undefined ? '(' + part.points + ' điểm) ' : ''),
            bold: true,
          }),
        ]),
      );
    });
    parallelQuestions.push(docChildren.slice(blockStart));
  });

  docChildren.push(...structureBlocks(structure.trailing));
  docChildren.push(...headerLines.filter((line) => line.area === 'footer').map(headerParagraph));

  // Cuối đề thi
  docChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 400 },
      children: [
        new TextRun({
          text: '-------------------------- HẾT --------------------------',
          bold: true,
          font: 'Times New Roman',
          size: 22,
        }),
      ],
    }),
  );

  if (['answers', 'solutions', 'matrix'].includes(view)) docChildren.splice(questionBodyStart);

  // NẾU CÓ ĐÁP ÁN & LỜI GIẢI CHI TIẾT
  if (includeSolutions && view !== 'exam' && view !== 'matrix') {
    docChildren.push(
      new Paragraph({
        pageBreakBefore: view === 'all',
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 200 },
        children: [
          new TextRun({
            text: 'ĐÁP ÁN VÀ HƯỚNG DẪN GIẢI CHI TIẾT',
            bold: true,
            size: 26,
            font: 'Times New Roman',
            color: '1E3A8A',
          }),
        ],
      }),
    );

    questions.forEach((q, idx) => {
      const answerStart = docChildren.length;
      if (view !== 'parallel') docChildren.push(...structureBlocks(structure.before.get(q.id)));
      let answerLabel = '';
      if (q.type === 'multiple_choice') {
        answerLabel = `Đáp án đúng: ${q.correct_answer || 'Chưa đặt đáp án'}`;
      } else if (q.type === 'true_false_group') {
        const tfDetails =
          q.sub_questions
            ?.map(
              (sq) =>
                `${sq.key}) ${sq.isCorrect === undefined ? 'Chưa có đáp án' : sq.isCorrect ? 'Đúng' : 'Sai'}`,
            )
            .join('   ') || '';
        answerLabel = `Đáp án: ${tfDetails || q.correct_answer?.trim() || 'Chưa đặt đáp án'}`;
      } else if (q.type === 'short_answer' || q.type === 'fill_blank') {
        answerLabel = `Đáp số: ${q.correct_answer?.trim() || q.accepted_answers?.filter((value) => value.trim()).join(' / ') || 'Chưa đặt đáp án'}`;
      } else if (q.type === 'matching') {
        answerLabel =
          'Cặp đúng: ' +
          (q.matchingPairs?.map((pair) => pair.left + ' → ' + pair.right).join('; ') ||
            q.correct_answer ||
            'Chưa đặt đáp án');
      } else if (q.type === 'ordering') {
        answerLabel =
          'Thứ tự đúng: ' + (q.correctOrder?.join(' → ') || q.correct_answer || 'Chưa đặt đáp án');
      } else {
        answerLabel = 'Hướng dẫn chấm / Lời giải:';
      }

      docChildren.push(
        new Paragraph({
          spacing: { before: 160, after: 40 },
          children: [
            new TextRun({
              text: `Câu ${structure.numbers.get(q.id) ?? idx + 1}: `,
              bold: true,
              font: 'Times New Roman',
              size: 22,
            }),
            new TextRun({
              text: answerLabel,
              bold: true,
              color: '15803D',
              font: 'Times New Roman',
              size: 22,
            }),
          ],
        }),
      );

      // In chi tiết từng ý đúng/sai nếu có explanation
      if (q.type === 'true_false_group' && q.sub_questions) {
        q.sub_questions.forEach((sq) => {
          if (sq.explanation) {
            docChildren.push(
              new Paragraph({
                indent: { left: 400 },
                spacing: { after: 30 },
                children: [
                  new TextRun({
                    text: `Ý ${sq.key}) (${sq.isCorrect === undefined ? 'Chưa có đáp án' : sq.isCorrect ? 'Đúng' : 'Sai'}): `,
                    bold: true,
                    font: 'Times New Roman',
                    size: 20,
                  }),
                  ...renderLatexRunsForWord(sq.explanation, { fontSize: 20 }),
                ],
              }),
            );
          }
        });
      }

      // In barem chấm điểm nếu có rubric
      if (q.rubric && q.rubric.length > 0) {
        const rubricRows = [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 75, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: 'Tiêu chí đánh giá / Yêu cầu cần đạt',
                        bold: true,
                        size: 20,
                        font: 'Times New Roman',
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 25, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({ text: 'Điểm tối đa', bold: true, size: 20, font: 'Times New Roman' }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          ...q.rubric.map(
            (r) =>
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 75, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: r.criterion, size: 20, font: 'Times New Roman' })],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: `${r.maxPoints}đ`,
                            bold: true,
                            size: 20,
                            font: 'Times New Roman',
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
          ),
        ];

        docChildren.push(
          new Table({
            width: { size: 90, type: WidthType.PERCENTAGE },
            rows: rubricRows,
          }),
          new Paragraph({ spacing: { after: 120 } }),
        );
      }

      if (q.step_by_step_solution && view !== 'answers') {
        docChildren.push(
          ...renderContentBlocksForWord(
            q.step_by_step_solution,
            { indent: { left: 400 }, spacing: { after: 120 } },
            { fontSize: 20 },
          ),
        );
      }
      q.parts?.forEach((part, i) => {
        docChildren.push(
          ...renderContentBlocksForWord(
            questionPartLabel(q, i, structure.numbers.get(q.id)) + ') ' + (part.answer || 'Chưa có đáp án'),
            {},
            { fontSize: 20 },
          ),
        );
        for (const row of part.rubric ?? [])
          docChildren.push(new Paragraph(row.criterion + ': ' + row.maxPoints + ' điểm'));
        if (view !== 'answers' && part.solution)
          docChildren.push(...renderContentBlocksForWord(part.solution, {}, { fontSize: 20 }));
      });
      parallelAnswers.push(docChildren.slice(answerStart));
    });
  }

  if (view === 'answers' || view === 'solutions') docChildren.push(...structureBlocks(structure.trailing));

  if (view === 'parallel') {
    const label = (text: string) =>
      new Paragraph({ children: [new TextRun({ text, bold: true, font: 'Times New Roman', size: 22 })] });
    const cell = (children: (Paragraph | Table)[]) =>
      new TableCell({
        width: { size: 50, type: WidthType.PERCENTAGE },
        children: [...children, new Paragraph('')],
      });
    // Reuse exactly the same question/answer renderers; remove their sequential
    // copies. Shared passages stay full width once, outside the two-column table.
    docChildren.splice(
      questionBodyStart,
      docChildren.length - questionBodyStart,
      ...headerBlocks,
      label('ĐỀ VÀ ĐÁP ÁN SONG SONG'),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            tableHeader: true,
            children: [cell([label('Đề bài')]), cell([label('Đáp án / hướng dẫn chấm')])],
          }),
          ...parallelQuestions.flatMap((blocks, index) => [
            ...(parallelPrefixes[index]?.length
              ? [
                  new TableRow({
                    children: [
                      new TableCell({
                        columnSpan: 2,
                        children: parallelPrefixes[index],
                      }),
                    ],
                  }),
                ]
              : []),
            new TableRow({
              children: [cell(blocks), cell(parallelAnswers[index] ?? [new Paragraph('Không kèm đáp án')])],
            }),
          ]),
          ...(structure.trailing.length
            ? [
                new TableRow({
                  children: [
                    new TableCell({
                      columnSpan: 2,
                      children: structureBlocks(structure.trailing),
                    }),
                  ],
                }),
              ]
            : []),
        ],
      }),
      ...headerLines.filter((line) => line.area === 'footer').map(headerParagraph),
    );
  }

  // Khởi tạo Document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1000,
              bottom: 1000,
              left: 1200,
              right: 1200,
            },
          },
        },
        children: docChildren,
      },
    ],
  });

  return await Packer.toBlob(doc);
}
