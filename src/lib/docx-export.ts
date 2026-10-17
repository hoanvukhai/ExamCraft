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
  MathRun,
  MathFraction,
  MathRadical,
  PageBreak,
} from 'docx';
import { Exam, Question } from '@/types/exam';
import { getDefaultPointsForQuestion, formatPointsString } from '@/lib/scoring';
import { computeExamMatrix, generateDocxMatrixTable } from './matrix-spec-generator';

/**
 * Ánh xạ mã môn nội bộ sang tên môn tiếng Việt chuẩn
 */
function getSubjectDisplayName(subject: string): string {
  const map: Record<string, string> = {
    toan: 'TOÁN HỌC',
    vat_ly: 'VẬT LÍ',
    hoa_hoc: 'HÓA HỌC',
    sinh_hoc: 'SINH HỌC',
    khtn: 'KHOA HỌC TỰ NHIÊN',
    ngu_van: 'NGỮ VĂN',
    lich_su: 'LỊCH SỬ',
    dia_ly: 'ĐỊA LÍ',
    lich_su_dia_ly: 'LỊCH SỬ VÀ ĐỊA LÍ',
    tieng_anh: 'TIẾNG ANH',
    tieng_viet: 'TIẾNG VIỆT',
    tu_nhien_xa_hoi: 'TỰ NHIÊN VÀ XÃ HỘI',
    khoa_hoc: 'KHOA HỌC',
    gdkt_pl: 'GIÁO DỤC KINH TẾ VÀ PHÁP LUẬT',
    giao_duc_cong_dan: 'GIÁO DỤC CÔNG DÂN',
    dao_duc: 'ĐẠO ĐỨC',
    tin_hoc: 'TIN HỌC',
    cong_nghe: 'CÔNG NGHỆ',
    tin_hoc_cong_nghe: 'TIN HỌC VÀ CÔNG NGHỆ',
  };
  return map[subject?.toLowerCase()] || subject?.toUpperCase() || 'MÔN HỌC';
}

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
    .replace(/\\int_([^\s^]+)\^([^\s]+)/g, '∫($1→$2)')
    .replace(/\\int/g, '∫')
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
    .replace(/\\vec\{([^}]+)\}/g, '$1⃗')
    .replace(/\\ce\{([^{}]+)\}/g, (_m, p1) => {
      return p1
        .replace(/\s*->\s*/g, ' → ')
        .replace(/\s*<=>\s*/g, ' ⇌ ')
        .replace(/\^/g, '↑')
        .replace(/v/g, '↓');
    })
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

/**
 * Tách một chuỗi văn bản có lẫn công thức $...$ hoặc $$...$$ thành mảng các TextRun và Math element của docx (OMML)
 */
export function renderLatexRunsForWord(
  rawText: string,
  options?: { fontSize?: number; font?: string; bold?: boolean; italics?: boolean }
): (TextRun | Math)[] {
  if (!rawText) return [];
  const runs: (TextRun | Math)[] = [];
  const fontSize = options?.fontSize || 22;
  const font = options?.font || 'Times New Roman';

  // Biểu thức tách chuỗi: tìm các đoạn $$...$$ hoặc $...$
  const regex = /(\$\$[\s\S]*?\$\$|\$[^$]+\$)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(rawText)) !== null) {
    const textBefore = rawText.slice(lastIndex, match.index);
    if (textBefore) {
      runs.push(
        new TextRun({
          text: textBefore,
          font,
          size: fontSize,
          bold: options?.bold,
          italics: options?.italics,
        })
      );
    }

    const mathExpr = match[0];
    const innerMath = mathExpr.replace(/^\$\$|\$\$$/g, '').replace(/^\$|\$$/g, '').trim();

    // Phân tích biểu thức toán học sang OMML Math
    // 1. Kiểm tra phân số đơn giản \frac{A}{B} hoặc \dfrac{A}{B}
    const fracMatch = /^\\(?:d?frac)\{([^{}]+)\}\{([^{}]+)\}$/.exec(innerMath);
    // 2. Kiểm tra căn bậc hai đơn giản \sqrt{A}
    const sqrtMatch = /^\\sqrt\{([^{}]+)\}$/.exec(innerMath);

    if (fracMatch) {
      runs.push(
        new Math({
          children: [
            new MathFraction({
              numerator: [new MathRun(cleanLatexForWord(fracMatch[1]))],
              denominator: [new MathRun(cleanLatexForWord(fracMatch[2]))],
            }),
          ],
        })
      );
    } else if (sqrtMatch) {
      runs.push(
        new Math({
          children: [
            new MathRadical({
              children: [new MathRun(cleanLatexForWord(sqrtMatch[1]))],
            }),
          ],
        })
      );
    } else {
      // Biểu thức toán học tổng quát: hiển thị trong môi trường Math của Word
      const cleaned = cleanLatexForWord(innerMath);
      runs.push(
        new Math({
          children: [new MathRun(cleaned)],
        })
      );
    }

    lastIndex = regex.lastIndex;
  }

  // Đoạn văn bản còn lại sau cùng
  const remainingText = rawText.slice(lastIndex);
  if (remainingText) {
    runs.push(
      new TextRun({
        text: remainingText,
        font,
        size: fontSize,
        bold: options?.bold,
        italics: options?.italics,
      })
    );
  }

  // Nếu chuỗi không chứa ký hiệu $ nào, fallback đơn giản
  if (runs.length === 0 && rawText) {
    runs.push(
      new TextRun({
        text: cleanLatexForWord(rawText),
        font,
        size: fontSize,
        bold: options?.bold,
        italics: options?.italics,
      })
    );
  }

  return runs;
}

/**
 * Tạo tài liệu Word .docx hoàn chỉnh theo quy chuẩn đề thi Việt Nam
 */
export async function exportExamToDocx(
  exam: Exam, 
  includeSolutions: boolean = true, 
  includeMatrix: boolean = true
): Promise<Blob> {
  const { metadata, questions } = exam;

  // Bảng Header tiêu đề trường và kỳ thi
  const headerTable = new Table({
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
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: (metadata.schoolName || 'SỞ GIÁO DỤC VÀ ĐÀO TẠO').toUpperCase(),
                    bold: true,
                    size: 22,
                    font: 'Times New Roman',
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: (metadata.departmentName || 'TRƯỜNG THPT').toUpperCase(),
                    bold: true,
                    size: 22,
                    font: 'Times New Roman',
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: metadata.examCode ? `MÃ ĐỀ: ${metadata.examCode}` : 'ĐỀ THI TIÊU CHUẨN',
                    bold: true,
                    size: 22,
                    color: '1E3A8A',
                    font: 'Times New Roman',
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: (metadata.title || 'ĐỀ THI HỌC KỲ').toUpperCase(),
                    bold: true,
                    size: 24,
                    font: 'Times New Roman',
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: `Môn: ${getSubjectDisplayName(metadata.subject)} - Khối: ${metadata.grade}`,
                    bold: true,
                    size: 22,
                    font: 'Times New Roman',
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: `Thời gian làm bài: ${metadata.durationMinutes} phút (Không kể phát đề)`,
                    italics: true,
                    size: 20,
                    font: 'Times New Roman',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

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

  // Gom các phần câu hỏi
  const part1 = questions.filter(q => q.type === 'multiple_choice');
  const part2 = questions.filter(q => q.type === 'true_false_group');
  const part3 = questions.filter(q => q.type === 'short_answer');
  const part4 = questions.filter(q => !['multiple_choice', 'true_false_group', 'short_answer'].includes(q.type));

  const docChildren: (Paragraph | Table)[] = [];

  // Nếu bật tùy chọn Ma trận: Chèn bảng Ma trận CV 7991 lên trang đầu
  if (includeMatrix) {
    docChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 100, after: 140 },
        children: [
          new TextRun({
            text: 'KHUNG MA TRẬN ĐỀ KIỂM TRA ĐỊNH KỲ (THEO CÔNG VĂN 7991/BGDĐT)',
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
      })
    );
  }

  docChildren.push(
    headerTable,
    new Paragraph({ spacing: { before: 100, after: 100 } }),
    studentInfoTable,
    new Paragraph({ spacing: { before: 150, after: 100 } }),
  );

  // In các ngữ liệu chung (Passages) nếu có
  if (exam.passages && exam.passages.length > 0) {
    for (const p of exam.passages) {
      docChildren.push(
        new Paragraph({
          spacing: { before: 200, after: 80 },
          children: [
            new TextRun({
              text: p.title ? `NGỮ LIỆU: ${p.title}` : 'ĐỌC NGỮ LIỆU SAU ĐÂY:',
              bold: true,
              size: 22,
              font: 'Times New Roman',
            }),
          ],
        }),
        new Paragraph({
          indent: { left: 300, right: 300 },
          spacing: { after: 160 },
          children: [
            new TextRun({
              text: p.content,
              italics: true,
              size: 20,
              font: 'Times New Roman',
            }),
          ],
        })
      );
    }
  }

  let currentQuestionNum = 1;

  // PHẦN I: TRẮC NGHIỆM NHIỀU LỰA CHỌN
  if (part1.length > 0) {
    docChildren.push(
      new Paragraph({
        spacing: { before: 200, after: 120 },
        children: [
          new TextRun({
            text: 'PHẦN I. Thí sinh trả lời từ câu ' + currentQuestionNum + ' đến câu ' + (currentQuestionNum + part1.length - 1) + '. Mỗi câu hỏi thí sinh chỉ chọn một phương án.',
            bold: true,
            size: 22,
            font: 'Times New Roman',
          }),
        ],
      })
    );

    for (const q of part1) {
      const qPts = formatPointsString(getDefaultPointsForQuestion(q, exam));
      docChildren.push(
        new Paragraph({
          spacing: { before: 100, after: 60 },
          children: [
            new TextRun({
              text: `Câu ${currentQuestionNum} `,
              bold: true,
              font: 'Times New Roman',
              size: 22,
            }),
            new TextRun({
              text: `(${qPts}): `,
              italics: true,
              font: 'Times New Roman',
              size: 20,
            }),
            ...renderLatexRunsForWord(q.content, { fontSize: 22 }),
          ],
        })
      );

      // Hiển thị các phương án A, B, C, D
      if (q.choices && q.choices.length > 0) {
        const choiceRuns: (TextRun | Math)[] = [];
        q.choices.forEach((c, i) => {
          choiceRuns.push(
            new TextRun({
              text: `${c.key}. `,
              bold: true,
              font: 'Times New Roman',
              size: 22,
            })
          );
          choiceRuns.push(...renderLatexRunsForWord(c.text, { fontSize: 22 }));
          if (i < q.choices!.length - 1) {
            choiceRuns.push(new TextRun({ text: '          ', font: 'Times New Roman', size: 22 }));
          }
        });

        docChildren.push(
          new Paragraph({
            indent: { left: 400 },
            spacing: { after: 120 },
            children: choiceRuns,
          })
        );
      }

      currentQuestionNum++;
    }
  }

  // PHẦN II: TRẮC NGHIỆM ĐÚNG/SAI
  if (part2.length > 0) {
    docChildren.push(
      new Paragraph({
        spacing: { before: 300, after: 120 },
        children: [
          new TextRun({
            text: 'PHẦN II. Thí sinh trả lời từ câu ' + currentQuestionNum + ' đến câu ' + (currentQuestionNum + part2.length - 1) + '. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn Đúng hoặc Sai. (Đúng 1 ý được 0,1 điểm; đúng 2 ý được 0,25 điểm; đúng 3 ý được 0,5 điểm; đúng cả 4 ý được 1,0 điểm)',
            bold: true,
            size: 22,
            font: 'Times New Roman',
          }),
        ],
      })
    );

    for (const q of part2) {
      const qPts = formatPointsString(getDefaultPointsForQuestion(q, exam));
      docChildren.push(
        new Paragraph({
          spacing: { before: 100, after: 60 },
          children: [
            new TextRun({
              text: `Câu ${currentQuestionNum} `,
              bold: true,
              font: 'Times New Roman',
              size: 22,
            }),
            new TextRun({
              text: `(${qPts}): `,
              italics: true,
              font: 'Times New Roman',
              size: 20,
            }),
            ...renderLatexRunsForWord(q.content, { fontSize: 22 }),
          ],
        })
      );

      if (q.sub_questions && q.sub_questions.length > 0) {
        for (const sq of q.sub_questions) {
          docChildren.push(
            new Paragraph({
              indent: { left: 400 },
              spacing: { after: 40 },
              children: [
                new TextRun({
                  text: `${sq.key}) `,
                  bold: true,
                  font: 'Times New Roman',
                  size: 22,
                }),
                ...renderLatexRunsForWord(sq.content, { fontSize: 22 }),
              ],
            })
          );
        }
      }

      currentQuestionNum++;
    }
  }

  // PHẦN III: TRẢ LỜI NGẮN
  if (part3.length > 0) {
    docChildren.push(
      new Paragraph({
        spacing: { before: 300, after: 120 },
        children: [
          new TextRun({
            text: 'PHẦN III. Thí sinh trả lời các câu hỏi sau bằng cách điền đáp số vào phiếu trả lời.',
            bold: true,
            size: 22,
            font: 'Times New Roman',
          }),
        ],
      })
    );

    for (const q of part3) {
      const qPts = formatPointsString(getDefaultPointsForQuestion(q, exam));
      docChildren.push(
        new Paragraph({
          spacing: { before: 100, after: 80 },
          children: [
            new TextRun({
              text: `Câu ${currentQuestionNum} `,
              bold: true,
              font: 'Times New Roman',
              size: 22,
            }),
            new TextRun({
              text: `(${qPts}): `,
              italics: true,
              font: 'Times New Roman',
              size: 20,
            }),
            ...renderLatexRunsForWord(q.content, { fontSize: 22 }),
          ],
        })
      );
      currentQuestionNum++;
    }
  }

  // PHẦN IV: TỰ LUẬN / NGOẠI NGỮ
  if (part4.length > 0) {
    docChildren.push(
      new Paragraph({
        spacing: { before: 300, after: 120 },
        children: [
          new TextRun({
            text: 'PHẦN IV. TỰ LUẬN / PHẦN MỞ RỘNG (Trình bày chi tiết)',
            bold: true,
            size: 22,
            font: 'Times New Roman',
          }),
        ],
      })
    );

    for (const q of part4) {
      docChildren.push(
        new Paragraph({
          spacing: { before: 100, after: 80 },
          children: [
            new TextRun({
              text: `Câu ${currentQuestionNum}: `,
              bold: true,
              font: 'Times New Roman',
              size: 22,
            }),
            ...renderLatexRunsForWord(q.content, { fontSize: 22 }),
          ],
        })
      );
      currentQuestionNum++;
    }
  }

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
    })
  );

  // NẾU CÓ ĐÁP ÁN & LỜI GIẢI CHI TIẾT
  if (includeSolutions) {
    docChildren.push(
      new Paragraph({
        pageBreakBefore: true,
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
      })
    );

    questions.forEach((q, idx) => {
      let answerLabel = '';
      if (q.type === 'multiple_choice') {
        answerLabel = `Đáp án đúng: ${q.correct_answer || 'A'}`;
      } else if (q.type === 'true_false_group') {
        const tfDetails = q.sub_questions
          ?.map(sq => `${sq.key}) ${sq.isCorrect ? 'Đúng' : 'Sai'}`)
          .join('   ') || '';
        answerLabel = `Đáp án: ${tfDetails || (q.correct_answer || '')}`;
      } else if (q.type === 'short_answer') {
        answerLabel = `Đáp số: ${q.correct_answer || ''}`;
      } else {
        answerLabel = 'Hướng dẫn chấm / Lời giải:';
      }

      docChildren.push(
        new Paragraph({
          spacing: { before: 160, after: 40 },
          children: [
            new TextRun({
              text: `Câu ${idx + 1}: `,
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
        })
      );

      // In chi tiết từng ý đúng/sai nếu có explanation
      if (q.type === 'true_false_group' && q.sub_questions) {
        q.sub_questions.forEach(sq => {
          if (sq.explanation) {
            docChildren.push(
              new Paragraph({
                indent: { left: 400 },
                spacing: { after: 30 },
                children: [
                  new TextRun({
                    text: `Ý ${sq.key}) (${sq.isCorrect ? 'Đúng' : 'Sai'}): `,
                    bold: true,
                    font: 'Times New Roman',
                    size: 20,
                  }),
                  ...renderLatexRunsForWord(sq.explanation, { fontSize: 20 }),
                ],
              })
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
                    children: [new TextRun({ text: 'Tiêu chí đánh giá / Yêu cầu cần đạt', bold: true, size: 20, font: 'Times New Roman' })],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 25, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: 'Điểm tối đa', bold: true, size: 20, font: 'Times New Roman' })],
                  }),
                ],
              }),
            ],
          }),
          ...q.rubric.map(r => new TableRow({
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
                    children: [new TextRun({ text: `${r.maxPoints}đ`, bold: true, size: 20, font: 'Times New Roman' })],
                  }),
                ],
              }),
            ],
          })),
        ];

        docChildren.push(
          new Table({
            width: { size: 90, type: WidthType.PERCENTAGE },
            rows: rubricRows,
          }),
          new Paragraph({ spacing: { after: 120 } })
        );
      }

      if (q.step_by_step_solution) {
        docChildren.push(
          new Paragraph({
            indent: { left: 400 },
            spacing: { after: 120 },
            children: [
              ...renderLatexRunsForWord(q.step_by_step_solution, { fontSize: 20 }),
            ],
          })
        );
      }
    });
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
